import type { Request, Response } from 'express';
import { ConfidentialClientApplication, type Configuration } from '@azure/msal-node';
import { prisma } from '../../common/db/prisma.js';
import { auditLog } from '../../common/services/audit.service.js';
import jwt from 'jsonwebtoken';

/**
 * Azure AD SSO Service
 *
 * Implements the full SSO flow per §6 requirements:
 * - Validates Azure AD access tokens via Microsoft Graph
 * - Auto-provisions users on first login
 * - Maps Azure AD groups to Saarthi roles (Saarthi-Admins → ADMIN, etc.)
 * - Links azure_id for existing users
 */

// ── Azure AD Group → Saarthi Role mapping ───────────────────────────
const GROUP_ROLE_MAP: Record<string, 'ADMIN' | 'MANAGER' | 'EMPLOYEE'> = {
  'Saarthi-Admins': 'ADMIN',
  'Saarthi-Managers': 'MANAGER',
  'Saarthi-Employees': 'EMPLOYEE',
};

// MSAL Confidential Client (for server-side token validation if needed)
let msalClient: ConfidentialClientApplication | null = null;

function getMsalClient(): ConfidentialClientApplication | null {
  if (msalClient) return msalClient;

  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenantId = process.env.AZURE_TENANT_ID;

  if (!clientId || !tenantId) {
    return null; // Azure AD not configured
  }

  const config: Configuration = {
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      ...(clientSecret ? { clientSecret } : {}),
    },
  };

  msalClient = new ConfidentialClientApplication(config);
  return msalClient;
}

/**
 * Fetch Azure AD user profile + group memberships using Graph API.
 */
async function fetchAzureProfile(accessToken: string) {
  // Fetch /me
  const meRes = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!meRes.ok) {
    throw new Error('AZURE_AUTH_FAILED');
  }

  const profile = (await meRes.json()) as {
    id: string;
    displayName: string;
    mail?: string;
    userPrincipalName: string;
    jobTitle?: string;
    department?: string;
  };

  // Fetch group memberships for role mapping
  let groups: string[] = [];
  try {
    const groupRes = await fetch(
      'https://graph.microsoft.com/v1.0/me/memberOf?$select=displayName',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (groupRes.ok) {
      const groupData = (await groupRes.json()) as {
        value: Array<{ displayName?: string }>;
      };
      groups = groupData.value
        .map((g) => g.displayName)
        .filter((name): name is string => !!name);
    }
  } catch {
    // Group fetch is best-effort; default to EMPLOYEE if unavailable
  }

  return { profile, groups };
}

/**
 * Resolve Saarthi role from Azure AD group memberships.
 */
function resolveRole(groups: string[]): 'ADMIN' | 'MANAGER' | 'EMPLOYEE' {
  // Priority: ADMIN > MANAGER > EMPLOYEE
  for (const groupName of groups) {
    if (GROUP_ROLE_MAP[groupName] === 'ADMIN') return 'ADMIN';
  }
  for (const groupName of groups) {
    if (GROUP_ROLE_MAP[groupName] === 'MANAGER') return 'MANAGER';
  }
  return 'EMPLOYEE';
}

/**
 * Find manager from org hierarchy via Graph API.
 */
async function fetchAzureManager(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://graph.microsoft.com/v1.0/me/manager', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const manager = (await res.json()) as { mail?: string; userPrincipalName?: string };
    const managerEmail = (manager.mail || manager.userPrincipalName || '').toLowerCase();
    if (!managerEmail) return null;

    const managerUser = await prisma.user.findUnique({
      where: { email: managerEmail },
      select: { id: true },
    });
    return managerUser?.id || null;
  } catch {
    return null;
  }
}

/**
 * Full Azure AD SSO login flow.
 * Called from auth.service.loginAzure().
 */
export async function authenticateAzure(
  azureAccessToken: string,
  ip: string,
  userAgent: string
) {
  const { profile, groups } = await fetchAzureProfile(azureAccessToken);
  const email = (profile.mail || profile.userPrincipalName).toLowerCase();
  const resolvedRole = resolveRole(groups);

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Auto-provision: new user from Azure AD
    const managerId = await fetchAzureManager(azureAccessToken);

    user = await prisma.user.create({
      data: {
        email,
        name: profile.displayName,
        azure_id: profile.id,
        department: profile.department || 'General',
        designation: profile.jobTitle || 'Employee',
        role: resolvedRole,
        manager_id: managerId,
      },
    });

    await auditLog({
      entity_type: 'User',
      entity_id: user.id,
      action: 'AZURE_AUTO_PROVISIONED',
      changed_by: user.id,
      old_value: {},
      new_value: { email, role: resolvedRole, groups },
      diff: { provisioned_from: { from: null, to: 'azure_ad' } },
      ip_address: ip,
      user_agent: userAgent,
    });
  } else {
    // Link azure_id and update role from groups if changed
    const updates: Record<string, unknown> = {};
    if (!user.azure_id) updates.azure_id = profile.id;
    if (user.role !== resolvedRole) updates.role = resolvedRole;

    if (Object.keys(updates).length > 0) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });
    }
  }

  if (!user.is_active) {
    throw new Error('ACCOUNT_DEACTIVATED');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
  });

  await auditLog({
    entity_type: 'User',
    entity_id: user.id,
    action: 'AZURE_LOGIN',
    changed_by: user.id,
    old_value: {},
    new_value: { last_login_at: new Date().toISOString(), groups },
    diff: {},
    ip_address: ip,
    user_agent: userAgent,
  });

  // Sign Saarthi JWT pair
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { sub: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      attrition_score: user.attrition_score,
      attrition_risk: user.attrition_risk,
    },
  };
}

/**
 * Check if Azure AD is configured.
 */
export function isAzureConfigured(): boolean {
  return !!(process.env.AZURE_CLIENT_ID && process.env.AZURE_TENANT_ID);
}
