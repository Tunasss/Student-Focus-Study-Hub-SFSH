import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/authContext';
import { ThemeToggle } from '../theme/ThemeToggle';

const NAV_ITEMS = [
  { to: '/', label: 'Tổng quan', end: true },
  { to: '/timetable', label: 'Thời khóa biểu' },
  { to: '/syllabus', label: 'Đề cương' },
  { to: '/deadlines', label: 'Deadline' },
  { to: '/focus', label: 'Focus Room' },
];

function navClass({ isActive }) {
  return `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-primary text-primary-fg' : 'text-muted hover:bg-surface-2 hover:text-text'
  }`;
}

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b border-border bg-surface md:min-h-screen md:border-r md:border-b-0">
        <div className="flex items-center gap-2 px-4 py-4">
          <img src="/favicon.svg" alt="" className="h-7 w-7" />
          <span className="font-semibold">Study Hub</span>
        </div>
        <nav aria-label="Điều hướng chính" className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-border bg-surface px-4 py-3">
          <ThemeToggle />
          <span className="hidden text-sm text-muted sm:inline">{user?.email}</span>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-2"
          >
            Đăng xuất
          </button>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
