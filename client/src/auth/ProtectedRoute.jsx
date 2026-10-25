import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './authContext';

export function ProtectedRoute() {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <div className="grid min-h-screen place-items-center text-muted">Đang tải…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

// For /login and /register: logged-in users go straight to the app.
export function GuestRoute() {
  const { user, status } = useAuth();
  if (status === 'loading') return null;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
