import { create } from 'zustand';
import { apiFetch, getAccessToken, setAccessToken } from '../api/client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  department: string;
  designation: string;
  attrition_score: number | null;
  attrition_risk: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAzure: (azure_token: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  login: async (email, password) => {
    const data = await apiFetch<{ access_token: string; user: AuthUser }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    setAccessToken(data.access_token);
    set({ user: data.user, isLoading: false });
  },

  loginAzure: async (azure_token: string) => {
    const data = await apiFetch<{ access_token: string; user: AuthUser }>(
      '/auth/azure',
      { method: 'POST', body: JSON.stringify({ azure_token }) }
    );
    setAccessToken(data.access_token);
    set({ user: data.user, isLoading: false });
  },

  logout: async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      setAccessToken(null);
      set({ user: null, isLoading: false });
    }
  },

  fetchMe: async () => {
    const data = await apiFetch<{ user: AuthUser }>('/auth/me');
    set({ user: data.user, isLoading: false });
  },

  hydrate: async () => {
    set({ isLoading: true });
    try {
      const refreshed = await apiFetch<{ access_token: string; user: AuthUser }>(
        '/auth/refresh',
        { method: 'POST' }
      );
      setAccessToken(refreshed.access_token);
      set({ user: refreshed.user, isLoading: false });
      return;
    } catch {
      // After fresh login the access token is set but refresh cookie may not exist yet
      if (getAccessToken()) {
        try {
          const me = await apiFetch<{ user: AuthUser }>('/auth/me');
          set({ user: me.user, isLoading: false });
          return;
        } catch {
          setAccessToken(null);
        }
      }
      set({ user: null, isLoading: false });
    }
  },
}));
