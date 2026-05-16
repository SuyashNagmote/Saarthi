import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { prisma } from '../../common/db/prisma.js';
import { auditLog } from '../../common/services/audit.service.js';

const BCRYPT_ROUNDS = 12;
const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  designation: string;
  attrition_score: number | null;
  attrition_risk: string;
}

function signAccess(user: { id: string; email: string; role: Role }) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: ACCESS_EXPIRY }
  );
}

function signRefresh(user: { id: string }) {
  return jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: REFRESH_EXPIRY,
  });
}

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  designation: string;
  attrition_score: number | null;
  attrition_risk: string;
}): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    designation: user.designation,
    attrition_score: user.attrition_score,
    attrition_risk: user.attrition_risk,
  };
}

export async function login(
  email: string,
  password: string,
  ip: string,
  userAgent: string
) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.password_hash || !user.is_active) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('INVALID_CREDENTIALS');

  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
  });

  try {
    await auditLog({
      entity_type: 'User',
      entity_id: user.id,
      action: 'LOGIN',
      changed_by: user.id,
      old_value: {},
      new_value: { last_login_at: new Date().toISOString() },
      diff: {},
      ip_address: ip,
      user_agent: userAgent,
    });
  } catch (auditErr) {
    console.warn('Login audit log skipped:', auditErr);
  }

  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user);

  return {
    accessToken,
    refreshToken,
    user: toPublicUser(user),
  };
}

export async function loginAzure(azure_token: string, ip: string, userAgent: string) {
  // Delegate to the full Azure AD SSO service which handles:
  // - Graph API profile fetch
  // - Group-to-role mapping (Saarthi-Admins → ADMIN, Saarthi-Managers → MANAGER)
  // - Auto-provisioning of new users
  // - Org hierarchy sync (manager_id from Graph /me/manager)
  const { authenticateAzure } = await import('./azure-sso.service.js');
  return authenticateAzure(azure_token, ip, userAgent);
}

export async function register(
  data: {
    name: string;
    email: string;
    password: string;
    department: string;
    designation: string;
    role?: Role;
    manager_id?: string;
  },
  ip: string,
  userAgent: string
) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error('EMAIL_EXISTS');

  const password_hash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password_hash,
      department: data.department,
      designation: data.designation,
      role: data.role || 'EMPLOYEE',
      manager_id: data.manager_id,
    },
  });

  await auditLog({
    entity_type: 'User',
    entity_id: user.id,
    action: 'CREATED',
    changed_by: user.id,
    old_value: {},
    new_value: { email: user.email, role: user.role },
    diff: { email: { from: null, to: user.email } },
    ip_address: ip,
    user_agent: userAgent,
  });

  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user);

  return { accessToken, refreshToken, user: toPublicUser(user) };
}

export async function refresh(refreshToken: string) {
  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!
    ) as { sub: string };

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.is_active) throw new Error('INVALID_REFRESH');

    return {
      accessToken: signAccess(user),
      refreshToken: signRefresh(user),
      user: toPublicUser(user),
    };
  } catch {
    throw new Error('INVALID_REFRESH');
  }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.is_active) throw new Error('NOT_FOUND');
  return toPublicUser(user);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  ip: string,
  userAgent: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.password_hash) throw new Error('NOT_FOUND');

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw new Error('INVALID_PASSWORD');

  const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { password_hash },
  });

  await auditLog({
    entity_type: 'User',
    entity_id: userId,
    action: 'PASSWORD_CHANGED',
    changed_by: userId,
    old_value: {},
    new_value: {},
    diff: {},
    ip_address: ip,
    user_agent: userAgent,
  });
}

export async function getManagers() {
  return prisma.user.findMany({
    where: { role: { in: ['MANAGER', 'ADMIN'] }, is_active: true },
    select: { id: true, name: true, department: true }
  });
}

export const REFRESH_COOKIE = 'saarthi_refresh';
