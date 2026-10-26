import { describe, expect, test, vi } from 'vitest';
import { apiFetch, UNAUTHORIZED_EVENT } from './api';
import { setToken } from './tokenStorage';
import { fail, mockFetch, ok } from '../test/utils';

describe('apiFetch', () => {
  test('sends the stored JWT as a bearer token', async () => {
    setToken('abc.def.ghi');
    const fetchMock = mockFetch(() => [200, ok({})]);

    await apiFetch('/api/auth/me');

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer abc.def.ghi');
  });

  test('omits the token when auth is false', async () => {
    setToken('abc.def.ghi');
    const fetchMock = mockFetch(() => [200, ok({})]);

    await apiFetch('/api/auth/login', { method: 'POST', body: {}, auth: false });

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  test('unwraps data from the response envelope', async () => {
    mockFetch(() => [200, ok({ user: { id: 1 } })]);
    await expect(apiFetch('/api/auth/me')).resolves.toEqual({ user: { id: 1 } });
  });

  test('throws ApiError with the server error code', async () => {
    mockFetch(() => [409, fail('EMAIL_TAKEN', 'taken')]);
    await expect(apiFetch('/api/auth/register', { method: 'POST', body: {}, auth: false })).rejects.toMatchObject({
      status: 409,
      code: 'EMAIL_TAKEN',
    });
  });

  test('dispatches an unauthorized event on TOKEN_EXPIRED', async () => {
    setToken('expired');
    mockFetch(() => [401, fail('TOKEN_EXPIRED', 'expired')]);
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);

    await expect(apiFetch('/api/auth/me')).rejects.toMatchObject({ code: 'TOKEN_EXPIRED' });

    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].detail.code).toBe('TOKEN_EXPIRED');
    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });
});
