import { useLayoutEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../auth/authContext';
import { useLanguage } from '../i18n/languageContext';
import { LanguageToggle } from '../i18n/LanguageToggle';
import { ThemeToggle } from '../theme/ThemeToggle';

// Brand Lotus Flower SVG matching Image 1, 3, 4
export function LotusIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      {/* Center upright petal */}
      <path d="M12 3C10.5 6.5 10.5 10 12 13.5C13.5 10 13.5 6.5 12 3Z" />
      {/* Left curved petal */}
      <path d="M10.2 6.5C7.5 8.2 6 11 7.5 14C9.5 13.2 11 11.5 11.8 9.5C11.2 8.5 10.7 7.5 10.2 6.5Z" opacity="0.9" />
      {/* Right curved petal */}
      <path d="M13.8 6.5C16.5 8.2 18 11 16.5 14C14.5 13.2 13 11.5 12.2 9.5C12.8 8.5 13.3 7.5 13.8 6.5Z" opacity="0.9" />
      {/* Base curved cradle */}
      <path d="M5 16C7.5 18.5 16.5 18.5 19 16C17 19.5 7 19.5 5 16Z" opacity="0.75" />
    </svg>
  );
}

const SHELL_COPY = {
  en: {
    nav: [
      { to: '/', label: 'Practice', end: true },
      { to: '/program', label: 'Program' },
      { to: '/timetable', label: 'Timetable' },
      { to: '/deadlines', label: 'Deadlines' },
    ],
    logout: 'Sign Out',
    notifications: 'Notifications',
    settings: 'Settings',
  },
  vi: {
    nav: [
      { to: '/', label: 'Luyện tập', end: true },
      { to: '/program', label: 'Chương trình' },
      { to: '/timetable', label: 'Thời khóa biểu' },
      { to: '/deadlines', label: 'Hạn nộp' },
    ],
    logout: 'Đăng xuất',
    notifications: 'Thông báo',
    settings: 'Cài đặt',
  },
};

export function AppShell() {
  const { user, logout } = useAuth();
  const { lang } = useLanguage();
  const t = SHELL_COPY[lang] || SHELL_COPY.en;

  const navigate = useNavigate();
  const shellRef = useRef(null);

  function handleLogout() {
    logout();
    navigate('/'); // Directly redirect to Home page as requested!
  }

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.top-nav-bar',
        { y: -16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out', clearProps: 'opacity,transform' }
      );
    }, shellRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={shellRef} className="min-h-screen bg-bg text-text flex flex-col font-sans">
      {/* Top Navbar matching Image 1, 3 & 4 */}
      <header className="top-nav-bar sticky top-0 z-50 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-white/5 bg-black/80 backdrop-blur-xl">
        {/* Left: Brand Icon */}
        <div className="flex items-center gap-3">
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-white group-hover:text-primary transition-colors">
              <LotusIcon className="h-5 w-5" />
            </div>
          </NavLink>
        </div>

        {/* Center: Floating Pill Navigation Dock (Matching Image 1, 3, 4) */}
        <nav
          aria-label="Navigation Dock"
          className="floating-pill-nav flex items-center rounded-full px-2 py-1 gap-1"
        >
          {t.nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-muted hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: Notification with badge, Language, Theme, User Avatar & Sign Out */}
        <div className="flex items-center gap-2.5">
          {/* Notification Button with red badge dot */}
          <button
            type="button"
            title={t.notifications}
            className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
          </button>

          {/* Settings cog / language & theme */}
          <div className="hidden sm:flex items-center gap-1.5">
            <LanguageToggle />
            <ThemeToggle />
          </div>

          {/* User Profile Avatar with email */}
          <div className="flex items-center gap-2 pl-1 border-l border-white/10">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-accent-deep to-primary text-black font-bold text-xs ring-1 ring-white/20"
              title={user?.email}
            >
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="hidden md:inline text-xs font-medium text-muted max-w-[160px] truncate">{user?.email}</span>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-muted hover:text-white hover:border-danger/50 hover:bg-danger/10 transition-colors"
            >
              {t.logout}
            </button>
          </div>
        </div>
      </header>

      {/* Main Experience View */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
