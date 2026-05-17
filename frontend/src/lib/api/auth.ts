import { apiFetch } from './client';
import type { AuthUser } from '../stores/auth.store';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  department: string;
  designation: string;
}

export function register(input: RegisterInput) {
  return apiFetch<{ access_token: string; user: AuthUser }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function changePassword(input: { current_password: string; new_password: string }) {
  return apiFetch<{ changed: boolean }>('/auth/change-password', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
