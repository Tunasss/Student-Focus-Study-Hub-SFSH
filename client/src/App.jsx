import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/authContext';
import { GuestRoute, ProtectedRoute } from './auth/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { useLanguage } from './i18n/languageContext';
import { AuthPage } from './pages/AuthPage';
import { DeepFocusPage } from './pages/DeepFocusPage';
import { HomePage } from './pages/HomePage';
import { OverviewPage } from './pages/OverviewPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { SyllabusPage } from './pages/SyllabusPage';
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

      {/* Root "/" shows HomePage for guests, or AppShell + Overview Analytics Dashboard for logged-in users */}
      <Route path="/" element={<RootEntryRoute />}>
        <Route index element={<OverviewPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="program" element={<OverviewPage />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="timetable" element={<TimetablePage />} />
          <Route path="syllabus" element={<SyllabusPage />} />
          <Route
            path="deadlines"
            element={
              <PlaceholderPage
                pageKey="deadlines"
                title="Deadlines"
                description="Upcoming assignment & project submission milestones."
              />
            }
          />
          <Route
            path="notes"
            element={
              <PlaceholderPage
                pageKey="notes"
                title="Quick Notes"
                description="Course notes and scratchpad."
              />
            }
          />
          <Route
            path="resources"
            element={
              <PlaceholderPage
                pageKey="resources"
                title="Resources"
                description="Lecture slides, reference PDFs and links."
              />
            }
          />
          <Route
            path="profile"
            element={
              <PlaceholderPage
                pageKey="profile"
                title="Profile"
                description="Account settings and preferences."
              />
            }
          />
        </Route>

        {/* Deep Focus Studio: Full-screen distraction-free layout (outside AppShell) */}
        <Route path="focus" element={<DeepFocusPage />} />
      </Route>

      {/* Catch-all 404 redirect to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
