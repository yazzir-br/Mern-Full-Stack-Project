
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import useAuthStore from '../../lib/store/authStore.js';

export default function ProtectedRoute() {
  const isLoading = useAuthStore((state) => state.isLoading);

  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  const authError = useAuthStore(
    (state) => state.authError
  );

  const location = useLocation();

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center bg-slate-50"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

          <p className="text-sm font-medium text-slate-600">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Unable to verify your session
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {authError}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
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

  return <Outlet />;
}
