import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/authContext';
import { ThemeToggle } from '../theme/ThemeToggle';

const PASSWORD_MIN_LENGTH = 8;

const COPY = {
  login: {
    title: 'Đăng nhập',
    submit: 'Đăng nhập',
    switchText: 'Chưa có tài khoản?',
    switchLink: { to: '/register', label: 'Đăng ký' },
  },
  register: {
    title: 'Tạo tài khoản',
    submit: 'Đăng ký',
    switchText: 'Đã có tài khoản?',
    switchLink: { to: '/login', label: 'Đăng nhập' },
  },
};

const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  EMAIL_TAKEN: 'Email này đã được đăng ký.',
};

export function AuthPage({ mode }) {
  const copy = COPY[mode];
  const { login, register, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`);
      return;
    }
    setSubmitting(true);
    try {
      await (mode === 'login' ? login : register)(email, password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="h-8 w-8" />
          <span className="text-lg font-semibold">Student Focus & Study Hub</span>
        </div>
        <h1 className="text-xl font-semibold">{copy.title}</h1>

        {mode === 'login' && sessionExpired && (
          <p role="status" className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">
            Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
          <label className="block text-sm font-medium">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium">
            Mật khẩu
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={PASSWORD_MIN_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            {mode === 'register' && (
              <span className="mt-1 block text-xs font-normal text-muted">Tối thiểu {PASSWORD_MIN_LENGTH} ký tự.</span>
            )}
          </label>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-fg transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? 'Đang xử lý…' : copy.submit}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          {copy.switchText}{' '}
          <Link to={copy.switchLink.to} className="font-medium text-primary hover:underline">
            {copy.switchLink.label}
          </Link>
        </p>
      </div>
    </div>
  );
}
