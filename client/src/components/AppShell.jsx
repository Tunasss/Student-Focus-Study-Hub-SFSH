import { useLayoutEffect, useRef } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../auth/authContext';
import { ThemeToggle } from '../theme/ThemeToggle';

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Tổng quan',
    end: true,
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    to: '/timetable',
    label: 'Thời khóa biểu',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    to: '/syllabus',
    label: 'Đề cương',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    to: '/deadlines',
    label: 'Deadline',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    to: '/focus',
    label: 'Focus Room',
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

function navClass({ isActive }) {
  return `group relative flex items-center gap-3 whitespace-nowrap rounded-2xl px-3.5 py-2.5 text-sm font-medium tracking-tight transition-all duration-200 ${
    isActive
      ? 'bg-primary text-primary-fg shadow-sm luma-glow-sm font-semibold'
      : 'text-muted hover:bg-surface-2 hover:text-text'
  }`;
}

export function AppShell() {
  const { user, logout } = useAuth();
  const shellRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.shell-sidebar',
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out', clearProps: 'opacity,transform' }
      );
      gsap.fromTo(
        '.shell-header',
        { y: -15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out', clearProps: 'opacity,transform' },
        '-=0.3'
      );
      gsap.fromTo(
        '.shell-nav-item',
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.04, duration: 0.4, ease: 'power2.out', clearProps: 'opacity,transform' },
        '-=0.2'
      );
    }, shellRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={shellRef} className="relative min-h-screen bg-bg text-text md:grid md:grid-cols-[250px_1fr] overflow-x-hidden">
      {/* Ambient background lime glow orbs */}
      <div className="pointer-events-none fixed top-0 right-1/4 -z-10 h-[480px] w-[580px] rounded-full bg-primary/10 blur-[130px] opacity-70 dark:opacity-40" />
      <div className="pointer-events-none fixed bottom-1/4 left-1/10 -z-10 h-[360px] w-[420px] rounded-full bg-emerald-500/10 blur-[110px] opacity-50 dark:opacity-25" />

      {/* Sidebar (Luma Dark Glassmorphism) */}
      <aside className="shell-sidebar relative flex flex-col border-b border-border bg-surface/80 backdrop-blur-xl md:min-h-screen md:border-r md:border-b-0 z-30">
        {/* Brand logo & AI Pulse */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-fg shadow-sm luma-glow-sm">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-text">Luma</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-primary/15 text-primary">SFSH</span>
              </div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted">AI Study Hub</p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav
          aria-label="Điều hướng chính"
          className="flex-1 flex gap-1.5 overflow-x-auto p-3.5 md:flex-col md:overflow-visible"
        >
          <div className="hidden md:block px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted/70">
            Menu
          </div>
          {NAV_ITEMS.map((item) => (
            <div key={item.to} className="shell-nav-item">
              <NavLink to={item.to} end={item.end} className={navClass}>
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </div>
          ))}
        </nav>

        {/* Ambient AI Wellness widget inside sidebar (Desktop) */}
        <div className="hidden md:block p-3.5 m-3 rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Mindful State
            </span>
            <span className="text-[11px] font-bold text-text">98%</span>
          </div>
          <p className="text-[11px] text-muted leading-tight">Nhịp sinh học tối ưu cho việc tiếp thu kiến thức mới.</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-col">
        {/* Top Navbar */}
        <header className="shell-header sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-surface/70 px-5 py-3.5 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
              <span>Bio-Wellness Active</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-border bg-surface-2/60 px-3 py-1.5 text-xs font-medium text-muted">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="truncate max-w-[160px]">{user?.email}</span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text hover:border-danger hover:text-danger hover:bg-danger/10 transition-colors shadow-xs"
            >
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Route view */}
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
