import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Transactions from './pages/Transactions.jsx';
import Categories from './pages/Categories.jsx';
import Profile from './pages/Profile.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

import AuthenticatedLayout from './components/layout/AuthenticatedLayout.jsx';
import ProtectedRoute from './components/routing/ProtectedRoute.jsx';
import AdminRoute from './components/routing/AdminRoute.jsx';

import useAuthStore from './lib/store/authStore.js';
import apiClient from './lib/api/apiClient.js';

function App() {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setAuthError = useAuthStore((state) => state.setAuthError);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        if (isMounted) {
          clearAuth();
        }
        return;
      }

      setLoading(true);

      try {
        const response = await apiClient.get('/auth/profile');

        const user = response.data;

        if (!user || !user._id || !user.role) {
          throw new Error('Unable to verify your user profile.');
        }

        if (isMounted) {
          setUser(user);
        }
      } catch (error) {
        if (!isMounted) return;

        if (error.status === 401 || error.status === 403) {
          localStorage.removeItem('token');
          clearAuth();
        } else {
          setAuthError(
            error.message || 'Unable to verify authentication.'
          );
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [setUser, setLoading, setAuthError, clearAuth]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Authenticated routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/transactions" element={<Transactions />} />

          <Route path="/categories" element={<Categories />} />

          <Route path="/profile" element={<Profile />} />

          {/* Admin-only route */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Route>
      </Route>

      {/* Default route */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* Unknown routes */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default App;
