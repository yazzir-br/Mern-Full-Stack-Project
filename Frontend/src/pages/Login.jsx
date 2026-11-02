

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import LoginForm from '../components/auth/LoginForm.jsx';
import useAuthStore from '../lib/store/authStore.js';
import apiClient from '../lib/api/apiClient.js';

export default function Login() {
  const navigate = useNavigate();

  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = async ({ email, password }) => {
    setIsLoading(true);
    setLoginError('');

    try {
      const loginResponse = await apiClient.post('/auth/login', {
        email,
        password,
      });

      const token = loginResponse.data?.token;

      if (!token) {
        throw new Error(
          'The server did not return an authentication token.'
        );
      }

      localStorage.setItem('token', token);

      const profileResponse = await apiClient.get('/auth/profile');
      const user = profileResponse.data;

      if (!user || !user._id || !user.role) {
        throw new Error('Unable to verify your user profile.');
      }

      setUser(user);

      navigate(
        user.role === 'admin' ? '/admin' : '/dashboard',
        { replace: true }
      );
    } catch (error) {
      localStorage.removeItem('token');
      clearAuth();

      if (error.status === 401) {
        setLoginError('Invalid email or password. Please try again.');
      } else if (error.status === 429) {
        setLoginError(
          'Too many login attempts. Please wait before trying again.'
        );
      } else if (error.message) {
        setLoginError(error.message);
      } else {
        setLoginError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl mt-8 font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome Back
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in to manage your personal finances.
          </p>
        </div>

        {/* Login Form */}
        <LoginForm
          onSubmit={handleLogin}
          isLoading={isLoading}
          error={loginError}
        />

        {/* Register Link */}
        <div className="mt-7 border-t border-slate-100 pt-6">
          <p className="text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-blue-700 transition-colors hover:text-blue-800 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>

      </section>
    </main>
  );
}