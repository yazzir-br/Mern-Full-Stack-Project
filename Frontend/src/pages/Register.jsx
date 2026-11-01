

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import RegisterForm from '../components/auth/RegisterForm.jsx';
import apiClient from '../lib/api/apiClient.js';

export default function Register() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const handleRegister = async ({ name, email, password }) => {
    setIsLoading(true);
    setRegisterError('');

    try {
      const response = await apiClient.post('/auth/register', {
        name,
        email,
        password,
      });

      if (response.status >= 200 && response.status < 300) {
        navigate('/login', {
          replace: true,
          state: {
            registrationSuccess:
              response.data?.message ||
              'Registration successful. Please log in.',
          },
        });
      }
    } catch (error) {
      if (error.status === 409) {
        setRegisterError(
          'An account with this email may already exist. Please use another email or log in.'
        );
      } else if (error.status === 400 || error.status === 422) {
        setRegisterError(
          error.message ||
            'Please check your registration details and try again.'
        );
      } else if (error.status === 429) {
        setRegisterError(
          'Too many attempts. Please wait before trying again.'
        );
      } else if (error.status >= 500) {
        setRegisterError(
          'The server encountered an error. Please try again later.'
        );
      } else {
        setRegisterError(
          error.message || 'Unable to register. Please try again.'
        );
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
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="3" />
              <path d="M3 10h18M7 15h3" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Create an Account
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Start managing your personal finances with confidence.
          </p>
        </div>

        {/* Registration Form */}
        <RegisterForm
          onSubmit={handleRegister}
          isLoading={isLoading}
          error={registerError}
        />

        {/* Login Link */}
        <div className="mt-7 border-t border-slate-100 pt-6">
          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-700 transition-colors hover:text-blue-800 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

      </section>
    </main>
  );
}





