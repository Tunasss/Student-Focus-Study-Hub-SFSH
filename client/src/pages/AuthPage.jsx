import { useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../auth/authContext';
import { useLanguage } from '../i18n/languageContext';
import { LanguageToggle } from '../i18n/LanguageToggle';
import { ThemeToggle } from '../theme/ThemeToggle';
import { LotusIcon } from '../components/AppShell';

const PASSWORD_MIN_LENGTH = 8;

const AUTH_COPY = {
  en: {
    login: {
      title: 'Sign In',
      submit: 'Sign In',
      switchText: "Don't have an account?",
      switchLink: { to: '/register', label: 'Create Account' },
      badge: 'Sign In',
    },
    register: {
      title: 'Create Account',
      submit: 'Sign Up',
      switchText: 'Already have an account?',
      switchLink: { to: '/login', label: 'Sign In' },
      badge: 'Sign Up',
    },
    backHome: 'Home',
    heroBadge: 'SMART SCHEDULE & FOCUS STUDIO',
    heroDesc:
      'Sync your weekly .ics timetable, organize daily active timeframes, and master your university courses in one sleek workspace.',
    pill1Title: 'Active Focus',
    pill1Sub: 'Dedicated study sessions',
    pill2Title: 'Timeframe Sync',
    pill2Sub: 'Schedule & courses aligned',
    welcomeSub: 'Welcome to your intelligent study space.',
    expiredNotice: 'Your session has expired. Please sign in again.',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    minPasswordHint: `Minimum ${PASSWORD_MIN_LENGTH} characters.`,
    minPasswordError: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    submitting: 'Processing…',
    errors: {
      INVALID_CREDENTIALS: 'Invalid email or password.',
      EMAIL_TAKEN: 'This email is already registered.',
    },
  },
  vi: {
    login: {
      title: 'Đăng nhập',
      submit: 'Đăng nhập',
      switchText: 'Chưa có tài khoản?',
      switchLink: { to: '/register', label: 'Đăng ký' },
      badge: 'Sign In',
    },
    register: {
      title: 'Tạo tài khoản',
      submit: 'Đăng ký',
      switchText: 'Đã có tài khoản?',
      switchLink: { to: '/login', label: 'Đăng nhập' },
      badge: 'Sign Up',
    },
    backHome: 'Trang chủ',
    heroBadge: 'KHÔNG GIAN LỊCH TRÌNH & TẬP TRUNG',
    heroDesc:
      'Đồng bộ thời khóa biểu tuần, sắp xếp khung giờ hoạt động hiệu quả và theo dõi tiến độ học tập thông minh.',
    pill1Title: 'Tập trung sâu',
    pill1Sub: 'Phiên học tập chuyên biệt',
    pill2Title: 'Khung giờ hoạt động',
    pill2Sub: 'Đồng bộ môn học & thời gian',
    welcomeSub: 'Chào mừng bạn đến với không gian học tập thông minh.',
    expiredNotice: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
    emailLabel: 'Email',
    passwordLabel: 'Mật khẩu',
    minPasswordHint: `Tối thiểu ${PASSWORD_MIN_LENGTH} ký tự.`,
    minPasswordError: `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`,
    submitting: 'Đang xử lý…',
    errors: {
      INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
      EMAIL_TAKEN: 'Email này đã được đăng ký.',
    },
  },
};

export function AuthPage({ mode }) {
  const { lang } = useLanguage();
  const dict = AUTH_COPY[lang] || AUTH_COPY.en;
  const copy = dict[mode];

  const { login, register, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const containerRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.auth-hero-title',
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, clearProps: 'opacity,transform' }
      )
        .fromTo(
          '.auth-hero-desc',
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, clearProps: 'opacity,transform' },
          '-=0.25'
        )
        .fromTo(
          '.auth-badge-pill',
          { scale: 0.9, opacity: 0, y: 12 },
          { scale: 1, opacity: 1, y: 0, stagger: 0.08, duration: 0.4, clearProps: 'opacity,transform' },
          '-=0.25'
        )
        .fromTo(
          '.auth-card-panel',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, clearProps: 'opacity,transform' },
          '-=0.3'
        );
    }, containerRef);

    return () => ctx.revert();
  }, [mode]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(dict.minPasswordError);
      return;
    }
    setSubmitting(true);
    try {
      await (mode === 'login' ? login : register)(email, password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(dict.errors[err.code] || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'mt-1.5 w-full rounded-2xl border border-white/10 bg-[#0d120d] px-4 py-3 text-sm text-white outline-none transition-colors duration-150 placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-black text-text flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-hidden font-sans"
    >
      {/* Top Corners: Back to Home + Language & Theme */}
      <div className="absolute top-5 left-5 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:border-primary/50 transition-colors"
        >
          <span>←</span>
          <span>{dict.backHome}</span>
        </Link>
      </div>
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Hero Area: Branding & Badges */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6 py-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-accent-deep/60 px-4 py-1.5 text-xs font-bold text-primary w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>{dict.heroBadge}</span>
          </div>

          <h1 className="auth-hero-title text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-white leading-[1.08]">
            One experience.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-deep via-primary to-white">
              Built around you.
            </span>
          </h1>

          <p className="auth-hero-desc text-base sm:text-lg text-muted max-w-xl leading-relaxed">
            {dict.heroDesc}
          </p>

          <div className="pt-2 flex flex-wrap gap-3.5">
            <div className="auth-badge-pill rounded-2xl border border-white/10 bg-[#0d120d] p-3.5 flex items-center gap-3 shadow-md">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 text-primary">
                ⚡
              </span>
              <div>
                <p className="text-xs font-bold text-white">{dict.pill1Title}</p>
                <p className="text-[10px] text-muted">{dict.pill1Sub}</p>
              </div>
            </div>

            <div className="auth-badge-pill rounded-2xl border border-white/10 bg-[#0d120d] p-3.5 flex items-center gap-3 shadow-md">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                🌿
              </span>
              <div>
                <p className="text-xs font-bold text-white">{dict.pill2Title}</p>
                <p className="text-[10px] text-muted">{dict.pill2Sub}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Area: Form Card matching Image 2 */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="auth-card-panel w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0d0a] p-7 sm:p-9 shadow-2xl luma-glow">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black shadow-sm">
                  <LotusIcon className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-base font-bold tracking-tight text-white">Student Focus</span>
                  <p className="text-[10px] text-muted font-medium">Schedule & Focus Studio</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white">
                {copy.badge}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white">{copy.title}</h1>
            <p className="mt-1 text-xs text-muted">{dict.welcomeSub}</p>

            {mode === 'login' && sessionExpired && (
              <div role="status" className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs text-primary">
                {dict.expiredNotice}
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                {dict.emailLabel}
                <input
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@university.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                {dict.passwordLabel}
                <input
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  placeholder="••••••••"
                  minLength={PASSWORD_MIN_LENGTH}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
                {mode === 'register' && (
                  <span className="mt-1.5 block text-xs font-normal text-muted">
                    {dict.minPasswordHint}
                  </span>
                )}
              </label>

              {error && (
                <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-xs font-medium text-danger">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full rounded-full bg-white py-3.5 px-4 text-sm font-extrabold text-black shadow-md hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? dict.submitting : copy.submit}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-muted">
              {copy.switchText}{' '}
              <Link to={copy.switchLink.to} className="font-semibold text-primary hover:underline underline-offset-2">
                {copy.switchLink.label}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
