import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/authContext';
import { GuestRoute, ProtectedRoute } from './auth/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { useLanguage } from './i18n/languageContext';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { TimetablePage } from './pages/TimetablePage';

function RootEntryRoute() {
  const { user, status, sessionExpired } = useAuth();
  const { lang } = useLanguage();

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center text-muted">
        {lang === 'vi' ? 'Đang tải…' : 'Loading…'}
      </div>
    );
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

      {/* Root "/" shows Apple-style HomePage for guests, or AppShell + Overview for logged-in users */}
      <Route path="/" element={<RootEntryRoute />}>
        <Route
          index
          element={<PlaceholderPage pageKey="overview" title="Overview" description="Next study recommendations and focus rhythm analytics at a glance." />}
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="timetable" element={<TimetablePage />} />
          <Route
            path="syllabus"
            element={<PlaceholderPage pageKey="syllabus" title="Syllabus" description="Structured chapter breakdown and course mastery tracking." />}
          />
          <Route
            path="deadlines"
            element={<PlaceholderPage pageKey="deadlines" title="Deadlines" description="Upcoming assignment & project submission milestones." />}
          />
          <Route
            path="focus"
            element={<PlaceholderPage pageKey="focus" title="Focus Room" description="Botanical Pomodoro timer with ambient soundscapes." />}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
