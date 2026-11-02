import { describe, expect, test } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fail, mockFetch, ok, renderApp } from './test/utils';
import { getToken, setToken } from './lib/tokenStorage';

const USER = { id: 1, email: 'student@sfsh.dev', createdAt: '2026-10-25T00:00:00.000Z' };

describe('auth flow & bilingual home', () => {
  test('shows Home page in English by default, switches to Vietnamese, and navigates to /login', async () => {
    renderApp('/');
    expect(await screen.findByRole('heading', { name: /One experience/i })).toBeInTheDocument();

    // Switch language to VI
    await userEvent.click(screen.getByRole('button', { name: 'VI' }));
    expect(await screen.findByRole('heading', { name: /Một trải nghiệm/i })).toBeInTheDocument();

    // Switch back to EN
    await userEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(await screen.findByRole('heading', { name: /One experience/i })).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('link', { name: /^Sign In$/i })[0]);
    expect(await screen.findByRole('heading', { name: /Sign In|Đăng nhập/i })).toBeInTheDocument();
  });

  test('redirects guests from a protected page to /login', async () => {
    renderApp('/deadlines');
    expect(await screen.findByRole('heading', { name: /Sign In|Đăng nhập/i })).toBeInTheDocument();
  });

  test('logs in, stores the token and shows the app shell', async () => {
    const fetchMock = mockFetch((url) =>
      url.endsWith('/api/auth/login') ? [200, ok({ token: 'jwt-token', user: USER })] : [404, {}],
    );
    renderApp('/login');

    await userEvent.type(screen.getByLabelText(/Email/i), USER.email);
    await userEvent.type(screen.getByLabelText(/Password|Mật khẩu/i), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: /Sign In|Đăng nhập/i }));

    expect(await screen.findByRole('heading', { name: /Deep Focus|Overview|Program|Tập trung sâu|Tổng quan/i })).toBeInTheDocument();
    expect(getToken()).toBe('jwt-token');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ email: USER.email, password: 'Password123!' });
  });

  test('blocks registration with a password shorter than 8 characters', async () => {
    const fetchMock = mockFetch(() => [500, {}]);
    renderApp('/register');

    await userEvent.type(screen.getByLabelText(/Email/i), 'new@sfsh.dev');
    await userEvent.type(screen.getByLabelText(/Password|Mật khẩu/i), 'short');
    await userEvent.click(screen.getByRole('button', { name: /Sign Up|Đăng ký/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/at least 8 characters|ít nhất 8 ký tự/i);
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

    expect(await screen.findByText(/session has expired|Phiên đăng nhập đã hết hạn/i)).toBeInTheDocument();
    await waitFor(() => expect(getToken()).toBeNull());
  });

  test('logout clears the token and returns to home page', async () => {
    setToken('stored-token');
    mockFetch(() => [200, ok({ user: USER })]);
    renderApp('/');

    await userEvent.click(await screen.findByRole('button', { name: /Sign Out|Đăng xuất/i }));

    // Verifies redirect directly to Home page
    expect(await screen.findByRole('heading', { name: /One experience|Một trải nghiệm/i })).toBeInTheDocument();
    expect(getToken()).toBeNull();
  });
});
