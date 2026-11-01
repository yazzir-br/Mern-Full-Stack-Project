
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../../lib/store/authStore.js';

export default function AdminRoute() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );
  const user = useAuthStore((state) => state.user);

  const location = useLocation();

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-40 items-center justify-center"
      >
        Checking admin permissions...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
