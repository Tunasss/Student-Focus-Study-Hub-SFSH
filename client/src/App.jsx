import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/authContext';
import { GuestRoute, ProtectedRoute } from './auth/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { TimetablePage } from './pages/TimetablePage';

function RootEntryRoute() {
  const { user, status, sessionExpired } = useAuth();

  if (status === 'loading') {
    return <div className="grid min-h-screen place-items-center text-muted">Đang tải…</div>;
  }

  if (!user) {
    if (sessionExpired) {
      return <Navigate to="/login" replace />;
    }
    return <HomePage />;
  }

  return <AppShell />;
}

export function App() {
  return (
    <Routes>
      <Route path="/home" element={<HomePage />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
      </Route>

      {/* Root "/" shows Apple-style HomePage for guests, or AppShell + Tổng quan for logged-in users */}
      <Route path="/" element={<RootEntryRoute />}>
        <Route
          index
          element={<PlaceholderPage title="Tổng quan" description="Gợi ý học tiếp theo và thống kê thời gian tập trung sẽ hiển thị ở đây." />}
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="timetable" element={<TimetablePage />} />
          <Route
            path="syllabus"
            element={<PlaceholderPage title="Đề cương" description="Đọc đề cương thành danh sách chương." />}
          />
          <Route
            path="deadlines"
            element={<PlaceholderPage title="Deadline" description="Theo dõi các hạn nộp sắp tới." />}
          />
          <Route
            path="focus"
            element={<PlaceholderPage title="Focus Room" description="Pomodoro với âm thanh nền." />}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
