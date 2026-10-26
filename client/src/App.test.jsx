import { describe, expect, test } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fail, mockFetch, ok, renderApp } from './test/utils';
import { getToken, setToken } from './lib/tokenStorage';

const USER = { id: 1, email: 'student@sfsh.dev', createdAt: '2026-10-25T00:00:00.000Z' };

describe('auth flow', () => {
  test('redirects guests from a protected page to /login', async () => {
    renderApp('/deadlines');
    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
  });

  test('logs in, stores the token and shows the app shell', async () => {
    const fetchMock = mockFetch((url) =>
      url.endsWith('/api/auth/login') ? [200, ok({ token: 'jwt-token', user: USER })] : [404, {}],
    );
    renderApp('/login');

    await userEvent.type(screen.getByLabelText('Email'), USER.email);
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeInTheDocument();
    expect(getToken()).toBe('jwt-token');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ email: USER.email, password: 'Password123!' });
  });

  test('blocks registration with a password shorter than 8 characters', async () => {
    const fetchMock = mockFetch(() => [500, {}]);
    renderApp('/register');

    await userEvent.type(screen.getByLabelText('Email'), 'new@sfsh.dev');
    await userEvent.type(screen.getByLabelText(/Mật khẩu/), 'short');
    await userEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));

    expect(screen.getByRole('alert')).toHaveTextContent('ít nhất 8 ký tự');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('restores the session from a stored token', async () => {
    setToken('stored-token');
    mockFetch((url) => (url.endsWith('/api/auth/me') ? [200, ok({ user: USER })] : [404, {}]));
    renderApp('/');

    expect(await screen.findByText(USER.email)).toBeInTheDocument();
  });

  test('logs out and shows a notice when the stored token has expired', async () => {
    setToken('expired-token');
    mockFetch(() => [401, fail('TOKEN_EXPIRED', 'expired')]);
    renderApp('/');

    expect(await screen.findByText(/Phiên đăng nhập đã hết hạn/)).toBeInTheDocument();
    await waitFor(() => expect(getToken()).toBeNull());
  });

  test('logout clears the token', async () => {
    setToken('stored-token');
    mockFetch(() => [200, ok({ user: USER })]);
    renderApp('/');

    await userEvent.click(await screen.findByRole('button', { name: 'Đăng xuất' }));

    expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument();
    expect(getToken()).toBeNull();
  });
});
