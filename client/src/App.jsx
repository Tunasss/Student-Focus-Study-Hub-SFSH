import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from './auth/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { AuthPage } from './pages/AuthPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { TimetablePage } from './pages/TimetablePage';

export function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route
            index
            element={<PlaceholderPage title="Tổng quan" description="Gợi ý học tiếp theo và thống kê thời gian tập trung sẽ hiển thị ở đây." />}
          />
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
