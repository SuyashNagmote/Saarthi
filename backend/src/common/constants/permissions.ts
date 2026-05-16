export const EMPLOYEE_PERMISSIONS = [
  'goal:create',
  'goal:read:own',
  'goal:update:draft',
  'goal:submit',
  'checkin:create',
  'checkin:read:own',
  'dashboard:employee',
  'notification:read:own',
] as const;

export const MANAGER_PERMISSIONS = [
  ...EMPLOYEE_PERMISSIONS,
  'goal:read:team',
  'goal:approve',
  'goal:reject',
  'goal:edit:during-approval',
  'goal:push-shared',
  'checkin:comment',
  'dashboard:manager',
  'report:team',
] as const;

export const ADMIN_PERMISSIONS = [
  ...MANAGER_PERMISSIONS,
  'goal:unlock',
  'cycle:manage',
  'user:manage',
  'audit:read',
  'report:org',
  'template:manage',
  'escalation:manage',
  'ai:attrition',
] as const;

export type Permission =
  | (typeof EMPLOYEE_PERMISSIONS)[number]
  | (typeof MANAGER_PERMISSIONS)[number]
  | (typeof ADMIN_PERMISSIONS)[number];

export const PERMISSIONS_BY_ROLE = {
  EMPLOYEE: EMPLOYEE_PERMISSIONS,
  MANAGER: MANAGER_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
} as const;

export function roleHasPermission(
  role: keyof typeof PERMISSIONS_BY_ROLE,
  permission: string
): boolean {
  return (PERMISSIONS_BY_ROLE[role] as readonly string[]).includes(permission);
}
