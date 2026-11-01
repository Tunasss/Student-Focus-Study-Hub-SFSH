import { useLayoutEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../auth/authContext';
import { ThemeToggle } from '../theme/ThemeToggle';

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Tổng quan',
    shortTag: 'Dashboard',
    badge: 'Live',
    end: true,
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.85}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    to: '/timetable',
    label: 'Thời khóa biểu',
    shortTag: 'Schedule',
    badge: 'ICS',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.85}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    to: '/syllabus',
    label: 'Đề cương',
    shortTag: 'Syllabus',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.85}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    to: '/deadlines',
    label: 'Deadline',
    shortTag: 'Tasks',
    badge: '2',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.85}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    to: '/focus',
    label: 'Focus Room',
    shortTag: 'Pomodoro',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.85}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const shellRef = useRef(null);

  const activeNav =
    NAV_ITEMS.find((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))) ||
    NAV_ITEMS[0];

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo(
        '.shell-minibar',
        { x: -16, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.4, clearProps: 'opacity,visibility,transform' }
      ).fromTo(
        '.shell-header',
        { y: -12, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.35, clearProps: 'opacity,visibility,transform' },
        '-=0.25'
      );
    }, shellRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={shellRef}
      className={`min-h-screen bg-bg text-text md:grid transition-[grid-template-columns] duration-300 ease-out ${
        expanded ? 'md:grid-cols-[248px_1fr]' : 'md:grid-cols-[96px_1fr]'
      }`}
    >
      {/* Left Floating Minibar / Dock Rail */}
      <aside className="shell-minibar sticky top-0 z-30 flex flex-col justify-between border-b border-border bg-surface md:h-screen md:border-r md:border-b-0">
        {/* Top Brand + Rail Expand Toggle */}
        <div className="flex items-center justify-between gap-2 px-3 py-3.5 border-b border-border/60">
          <div className={`flex items-center gap-2.5 ${expanded ? '' : 'md:mx-auto'}`}>
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-fg shadow-xs luma-glow-sm">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-success" />
            </div>
            <div className={`${expanded ? 'block' : 'md:hidden'}`}>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold tracking-tight text-text">Luma</span>
                <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">SFSH</span>
              </div>
              <p className="text-[10px] font-medium text-muted">AI Wellness Hub</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            title={expanded ? 'Thu gọn thanh Minibar' : 'Mở rộng thanh điều hướng'}
            aria-label={expanded ? 'Thu gọn thanh Minibar' : 'Mở rộng thanh điều hướng'}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-xl border border-border bg-surface-2/70 text-muted hover:border-primary/40 hover:text-text transition-colors"
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Navigation Dock Items */}
        <nav
          aria-label="Điều hướng chính"
          className="flex-1 flex gap-1.5 overflow-x-auto px-2.5 py-3 md:flex-col md:overflow-y-auto md:overflow-x-hidden"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={`${item.label} (${item.shortTag})`}
              className={({ isActive }) =>
                `group relative flex shrink-0 items-center rounded-2xl transition-colors duration-150 ${
                  expanded
                    ? 'gap-3 px-3.5 py-2.5 justify-start'
                    : 'flex-col md:justify-center gap-1 px-2.5 py-2.5 text-center'
                } ${
                  isActive
                    ? 'bg-primary text-primary-fg font-bold luma-glow-sm'
                    : 'text-muted hover:bg-surface-2 hover:text-text font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active side indicator bar on desktop minibar */}
                  {isActive && !expanded && (
                    <span className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary-fg/80" />
                  )}
                  <span className="shrink-0">{item.icon}</span>
                  <span
                    className={`leading-tight tracking-tight ${
                      expanded ? 'text-sm' : 'text-[11px]'
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.badge && expanded && (
                    <span
                      className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive ? 'bg-primary-fg/20 text-primary-fg' : 'bg-primary/15 text-primary'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Bio-Rhythm Mini Meter inside Minibar */}
        <div className="hidden md:flex flex-col items-center p-2.5 m-2 rounded-2xl border border-primary/20 bg-primary/5">
          {expanded ? (
            <div className="w-full space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-primary flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Bio-Flow
                </span>
                <span className="font-bold text-text">98%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-border/50 overflow-hidden">
                <div className="h-full w-[98%] rounded-full bg-primary" />
              </div>
              <p className="text-[10px] text-muted">60 FPS GPU Composited</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1" title="Nhịp sinh học tập trung: 98%">
              <span className="text-[11px] font-extrabold text-primary">98%</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted">Flow</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex min-w-0 flex-col">
        {/* Intuitive Top Context Bar */}
        <header className="shell-header sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-surface/90 backdrop-blur-md px-4 sm:px-6 py-3">
          {/* Left: Current section breadcrumb & quick status */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/60 px-3 py-1.5 text-xs">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="font-bold text-text truncate">{activeNav.label}</span>
              <span className="hidden sm:inline text-muted">• {activeNav.shortTag}</span>
            </div>

            <div className="hidden lg:flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
              <span>⚡ Nhịp tập trung cao (08:30 – 11:30)</span>
            </div>
          </div>

          {/* Right: Quick Nav Pills + Theme Toggle + User + Logout */}
          <div className="flex items-center gap-2.5 shrink-0">
            <ThemeToggle />

            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-border bg-surface-2/60 px-3 py-1.5 text-xs font-medium text-muted">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="truncate max-w-[160px]">{user?.email}</span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text hover:border-danger hover:text-danger hover:bg-danger/10 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Active Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
