
import { useState } from 'react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';

export default function RegisterForm({
  onSubmit,
  isLoading = false,
  error = '',
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = {};
    const normalizedName = name.trim();
    const normalizedEmail = email.trim();

    if (!normalizedName) {
      errors.name = 'Full name is required.';
    }

    if (!normalizedEmail) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0 || isLoading) {
      return;
    }

    if (typeof onSubmit !== 'function') {
      return;
    }

    try {
      // Confirm password is for frontend validation only.
      // The backend receives name, email, and password.
      await onSubmit({
        name: normalizedName,
        email: normalizedEmail,
        password,
      });
    } catch {
      // The parent component should display submission errors.
    }
  };

  const inputClassName =
    'mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100';

  const renderError = (field) =>
    validationErrors[field] ? (
      <p className="mt-1 text-sm text-red-600" role="alert">
        {validationErrors[field]}
      </p>
    ) : null;

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
          htmlFor="register-name"
          className="block text-sm font-medium text-gray-700"
        >
          Full Name
        </label>

        <input
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClassName}
          placeholder="Enter your full name"
          required
          disabled={isLoading}
          aria-invalid={Boolean(validationErrors.name)}
          aria-describedby={
            validationErrors.name ? 'register-name-error' : undefined
          }
        />

        {validationErrors.name && (
          <p
            id="register-name-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {validationErrors.name}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="register-email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>

        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClassName}
          placeholder="you@example.com"
          required
          disabled={isLoading}
          aria-invalid={Boolean(validationErrors.email)}
        />

        {renderError('email')}
      </div>

      <div>
        <label
          htmlFor="register-password"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>

        <div className="relative mt-1">
          <input
            id="register-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={`${inputClassName} pr-12`}
            placeholder="Create a password"
            required
            disabled={isLoading}
            aria-invalid={Boolean(validationErrors.password)}
          />

          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff size={20} aria-hidden="true" />
            ) : (
              <Eye size={20} aria-hidden="true" />
            )}
          </button>
        </div>

        {renderError('password')}
      </div>

      <div>
        <label
          htmlFor="register-confirm-password"
          className="block text-sm font-medium text-gray-700"
        >
          Confirm Password
        </label>

        <div className="relative mt-1">
          <input
            id="register-confirm-password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={`${inputClassName} pr-12`}
            placeholder="Re-enter your password"
            required
            disabled={isLoading}
            aria-invalid={Boolean(validationErrors.confirmPassword)}
          />

          <button
            type="button"
            onClick={() =>
              setShowConfirmPassword((visible) => !visible)
            }
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
            aria-label={
              showConfirmPassword
                ? 'Hide confirmation password'
                : 'Show confirmation password'
            }
            aria-pressed={showConfirmPassword}
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <EyeOff size={20} aria-hidden="true" />
            ) : (
              <Eye size={20} aria-hidden="true" />
            )}
          </button>
        </div>

        {renderError('confirmPassword')}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading && (
          <LoaderCircle size={20} className="animate-spin" aria-hidden="true" />
        )}

        {isLoading ? 'Creating account...' : 'Register'}
      </button>
    </form>
  );
}
