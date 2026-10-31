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
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';

  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Không kết nối được tới máy chủ');
  }

  // Every API response is the Rule 02 envelope: { success, data, error, timestamp }.
  const envelope = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok || envelope?.success === false) {
    const code = envelope?.error?.code || 'HTTP_ERROR';
    const message = envelope?.error?.message || `Request failed (${res.status})`;
    if (res.status === 401 && token && (code === 'UNAUTHORIZED' || code === 'TOKEN_EXPIRED')) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: { code } }));
    }
    throw new ApiError(res.status, code, message);
  }

  return envelope?.data ?? null;
}

export const scheduleApi = {
  getSchedule: (from, to, tz = 'Asia/Ho_Chi_Minh') => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (tz) params.set('tz', tz);
    const query = params.toString();
    return apiFetch(`/api/schedule${query ? `?${query}` : ''}`);
  },
  getCourses: () => apiFetch('/api/courses'),
  importIcs: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch('/api/schedule/import', {
      method: 'POST',
      body: formData,
    });
  },
};
