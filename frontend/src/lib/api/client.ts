export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

interface ApiError {
  code: string;
  message: string;
  details?: unknown[];
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && !path.includes('/auth/')) {
    const refreshed = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshed.ok) {
      const body = (await refreshed.json()) as {
        success: boolean;
        data: { access_token: string };
      };
      if (body.success) {
        accessToken = body.data.access_token;
        (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
        res = await fetch(`${API_URL}${path}`, {
          ...options,
          headers,
          credentials: 'include',
        });
      }
    }
  }

  let json: { success: boolean; data?: T; error?: ApiError };
  try {
    const text = await res.text();
    json = text ? JSON.parse(text) : { success: false };
  } catch {
    if (!res.ok) {
      throw new Error(
        res.status === 500
          ? 'Internal server error — is the API running? Check the backend terminal.'
          : `Server error (${res.status})`,
      );
    }
    throw new Error('Invalid response from server');
  }

  if (!res.ok || !json.success) {
    const msg = json.error?.message ?? 'Request failed';
    if (res.status === 500 && msg === 'An unexpected error occurred') {
      throw new Error(
        'Internal server error — database may be missing. In backend/: npm run db:migrate && npm run db:seed',
      );
    }
    throw new Error(msg);
  }

  return json.data as T;
}

export async function apiDownload(path: string): Promise<Blob> {
  const headers: HeadersInit = {};

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_URL}${path}`, {
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && !path.includes('/auth/')) {
    const refreshed = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshed.ok) {
      const body = (await refreshed.json()) as {
        success: boolean;
        data: { access_token: string };
      };

      if (body.success) {
        accessToken = body.data.access_token;
        (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
        res = await fetch(`${API_URL}${path}`, {
          headers,
          credentials: 'include',
        });
      }
    }
  }

  if (!res.ok) {
    throw new Error('Download failed');
  }

  return res.blob();
}
