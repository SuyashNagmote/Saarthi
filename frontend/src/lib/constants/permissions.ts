/**
 * Frontend RBAC Permission Matrix per §4
 * Typed config object matching the master prompt's PERMISSIONS definition.
 */

export const PERMISSIONS = {
  EMPLOYEE: [
    'goal:create',
    'goal:read:own',
    'goal:update:draft',
    'goal:submit',
    'checkin:create',
    'checkin:read:own',
    'dashboard:employee',
    'notification:read:own',
  ],
  MANAGER: [
    'goal:create',
    'goal:read:own',
    'goal:update:draft',
    'goal:submit',
    'checkin:create',
    'checkin:read:own',
    'dashboard:employee',
    'notification:read:own',
    'goal:read:team',
    'goal:approve',
    'goal:reject',
    'goal:edit:during-approval',
    'goal:push-shared',
    'checkin:comment',
    'dashboard:manager',
    'report:team',
  ],
  ADMIN: [
    'goal:create',
    'goal:read:own',
    'goal:update:draft',
    'goal:submit',
    'checkin:create',
    'checkin:read:own',
    'dashboard:employee',
    'notification:read:own',
    'goal:read:team',
    'goal:approve',
    'goal:reject',
    'goal:edit:during-approval',
    'goal:push-shared',
    'checkin:comment',
    'dashboard:manager',
    'report:team',
    'goal:unlock',
    'cycle:manage',
    'user:manage',
    'audit:read',
    'report:org',
    'template:manage',
    'dashboard:admin',
  ],
} as const;

export type Role = keyof typeof PERMISSIONS;

export function hasPermission(role: Role, permission: string): boolean {
  return (PERMISSIONS[role] as readonly string[]).includes(permission);
}
