import { describe, expect, test, vi } from 'vitest';
import { apiFetch, UNAUTHORIZED_EVENT } from './api';
import { setToken } from './tokenStorage';
import { mockFetch } from '../test/utils';

describe('apiFetch', () => {
  test('sends the stored JWT as a bearer token', async () => {
    setToken('abc.def.ghi');
    const fetchMock = mockFetch(() => [200, { ok: true }]);

    await apiFetch('/api/auth/me');

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer abc.def.ghi');
  });

  test('omits the token when auth is false', async () => {
    setToken('abc.def.ghi');
    const fetchMock = mockFetch(() => [200, {}]);

    await apiFetch('/api/auth/login', { method: 'POST', body: {}, auth: false });

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  test('throws ApiError with the server error code', async () => {
    mockFetch(() => [409, { error: { code: 'EMAIL_TAKEN', message: 'taken' } }]);
    await expect(apiFetch('/api/auth/register', { method: 'POST', body: {}, auth: false })).rejects.toMatchObject({
      status: 409,
      code: 'EMAIL_TAKEN',
    });
  });

  test('dispatches an unauthorized event on TOKEN_EXPIRED', async () => {
    setToken('expired');
    mockFetch(() => [401, { error: { code: 'TOKEN_EXPIRED', message: 'expired' } }]);
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);

    await expect(apiFetch('/api/auth/me')).rejects.toMatchObject({ code: 'TOKEN_EXPIRED' });

    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].detail.code).toBe('TOKEN_EXPIRED');
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });
});
