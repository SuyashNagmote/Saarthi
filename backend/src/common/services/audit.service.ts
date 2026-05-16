import type { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';

export interface AuditLogInput {
  entity_type: string;
  entity_id: string;
  action: string;
  changed_by: string;
  old_value: unknown;
  new_value: unknown;
  diff: unknown;
  ip_address: string;
  user_agent: string;
}

export async function auditLog(input: AuditLogInput) {
  return prisma.auditLog.create({
    data: {
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      action: input.action,
      changed_by: input.changed_by,
      old_value: JSON.stringify(input.old_value),
      new_value: JSON.stringify(input.new_value),
      diff: JSON.stringify(input.diff),
      ip_address: input.ip_address,
      user_agent: input.user_agent,
    },
  });
}
