import { useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
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

  const containerRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Intro timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.auth-hero-title',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, clearProps: 'opacity,transform' }
      )
        .fromTo(
          '.auth-hero-desc',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, clearProps: 'opacity,transform' },
          '-=0.35'
        )
        .fromTo(
          '.auth-badge-pill',
          { scale: 0.85, opacity: 0, y: 15 },
          { scale: 1, opacity: 1, y: 0, stagger: 0.1, duration: 0.5, clearProps: 'opacity,transform' },
          '-=0.3'
        )
        .fromTo(
          '.auth-card-panel',
          { y: 25, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.55, clearProps: 'opacity,transform' },
          '-=0.4'
        );

      // Continuous floating badges animation
      gsap.to('.float-badge-1', {
        y: -8,
        duration: 3.2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      });
      gsap.to('.float-badge-2', {
        y: 8,
        duration: 4.1,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: 0.5,
      });
      gsap.to('.float-badge-3', {
        y: -6,
        duration: 3.6,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: 0.2,
      });
    }, containerRef);

    return () => ctx.revert();
  }, [mode]);

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
    'mt-1.5 w-full rounded-2xl border border-border bg-surface-2/70 px-4 py-3 text-sm text-text outline-none transition-all duration-200 placeholder:text-muted/60 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/20';

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-bg text-text flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-hidden"
    >
      {/* Back to Apple Home & Theme toggle corners */}
      <div className="absolute top-5 left-5 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-4 py-2 text-xs font-semibold text-text hover:border-primary/50 transition-colors"
        >
          <span>←</span>
          <span>Trang chủ</span>
        </Link>
      </div>
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Hero Area: AI Wellness Branding & Floating Badges */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6 py-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary w-fit luma-glow-sm">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>AI-POWERED WELLNESS & STUDY HUB</span>
          </div>

          <h1 className="auth-hero-title text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text leading-[1.1]">
            One experience.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
              Built around you.
            </span>
          </h1>

          <p className="auth-hero-desc text-base sm:text-lg text-muted max-w-xl leading-relaxed">
            Đồng bộ thời khóa biểu biểu tuần, nhịp sinh học tập trung Pomodoro và theo dõi tiến độ học tập thông minh
            chuẩn SaaS cao cấp.
          </p>

          {/* Floating Metric Badges (from Reference Images) */}
          <div className="pt-2 flex flex-wrap gap-3.5">
            <div className="auth-badge-pill float-badge-1 glass-card inline-flex items-center gap-2.5 rounded-2xl px-4 py-2.5 shadow-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/20 text-primary">
                ⚡
              </span>
              <div>
                <p className="text-[11px] font-semibold text-text">98% Focus Rhythm</p>
                <p className="text-[10px] text-muted">Trạng thái tập trung cao độ</p>
              </div>
            </div>

            <div className="auth-badge-pill float-badge-2 glass-card inline-flex items-center gap-2.5 rounded-2xl px-4 py-2.5 shadow-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                🌱
              </span>
              <div>
                <p className="text-[11px] font-semibold text-text">Bio-Circadian Sync</p>
                <p className="text-[10px] text-muted">Đồng bộ lịch học & năng lượng</p>
              </div>
            </div>

            <div className="auth-badge-pill float-badge-3 glass-card inline-flex items-center gap-2.5 rounded-2xl px-4 py-2.5 shadow-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400">
                🧘
              </span>
              <div>
                <p className="text-[11px] font-semibold text-text">Mindful Timetable</p>
                <p className="text-[10px] text-muted">11 môn học đã sẵn sàng</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Area: Glassmorphic Auth Form */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="auth-card-panel glass-card w-full max-w-md rounded-3xl p-7 sm:p-9 shadow-2xl luma-glow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-fg shadow-sm">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <div>
                  <span className="text-base font-bold tracking-tight text-text">Student Focus</span>
                  <p className="text-[10px] text-muted font-medium">Study Hub • SaaS</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                {mode === 'login' ? 'Sign In' : 'Sign Up'}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-text">{copy.title}</h1>
            <p className="mt-1 text-xs text-muted">Chào mừng bạn đến với không gian học tập thông minh.</p>

            {mode === 'login' && sessionExpired && (
              <div role="status" className="mt-4 rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-primary">
                Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                Email
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
                Mật khẩu
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
                    Tối thiểu {PASSWORD_MIN_LENGTH} ký tự.
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
                className="mt-2 w-full rounded-2xl bg-primary py-3.5 px-4 text-sm font-bold text-primary-fg shadow-md luma-glow-sm transition-all duration-200 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Đang xử lý…' : copy.submit}
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
