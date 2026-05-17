import { apiFetch } from './client';

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_value: unknown;
  new_value: unknown;
  diff: unknown;
  ip_address: string;
  user_agent: string;
  created_at: string;
  changer: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
  };
}

export function listAuditLogs(params?: {
  page?: number;
  limit?: number;
  entity_type?: string;
  action?: string;
}) {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.entity_type) q.set('entity_type', params.entity_type);
  if (params?.action) q.set('action', params.action);

  const qs = q.toString();
  return apiFetch<{
    logs: AuditLog[];
    pagination: { page: number; limit: number; total: number };
  }>(`/audit${qs ? `?${qs}` : ''}`);
}
