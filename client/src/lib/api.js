import { getToken } from './tokenStorage';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

// Fired when the API rejects our token, so AuthProvider can log the user out.
export const UNAUTHORIZED_EVENT = 'sfsh:unauthorized';

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Không kết nối được tới máy chủ');
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    const code = data?.error?.code || 'HTTP_ERROR';
    const message = data?.error?.message || `Request failed (${res.status})`;
    if (res.status === 401 && token && (code === 'UNAUTHORIZED' || code === 'TOKEN_EXPIRED')) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: { code } }));
    }
    throw new ApiError(res.status, code, message);
  }

  return data;
}
