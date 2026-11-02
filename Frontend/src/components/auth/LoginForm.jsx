
import { useState } from 'react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';

export default function LoginForm({
  onSubmit,
  isLoading = false,
  error = '',
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0 || isLoading) {
      return;
    }

    if (typeof onSubmit !== 'function') {
      return;
    }

    try {
      await onSubmit({
        email: normalizedEmail,
        password,
      });
    } catch {

    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="login-email"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Email address
        </label>

        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setValidationErrors((previous) => ({
              ...previous,
              email: '',
            }));
          }}
          aria-invalid={Boolean(validationErrors.email)}
          aria-describedby={
            validationErrors.email ? 'login-email-error' : undefined
          }
          disabled={isLoading}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
        />

        {validationErrors.email && (
          <p id="login-email-error" className="mt-1 text-sm text-red-600">
            {validationErrors.email}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Password
        </label>

        <div className="relative">
          <input
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setValidationErrors((previous) => ({
                ...previous,
                password: '',
              }));
            }}
            aria-invalid={Boolean(validationErrors.password)}
            aria-describedby={
              validationErrors.password
                ? 'login-password-error'
                : undefined
            }
            disabled={isLoading}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
          />

          <button
            type="button"
            onClick={() => setShowPassword((previous) => !previous)}
            disabled={isLoading}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-800 disabled:cursor-not-allowed"
          >
            {showPassword ? (
              <EyeOff size={20} aria-hidden="true" />
            ) : (
              <Eye size={20} aria-hidden="true" />
            )}
          </button>
        </div>

        {validationErrors.password && (
          <p
            id="login-password-error"
            className="mt-1 text-sm text-red-600"
          >
            {validationErrors.password}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading && (
          <LoaderCircle
            size={18}
            className="animate-spin"
            aria-hidden="true"
          />
        )}

        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
