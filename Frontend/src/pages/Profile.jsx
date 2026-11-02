
import { useEffect, useRef, useState } from 'react';
import {
  UserRound,
  Mail,
  ShieldCheck,
  CalendarDays,
  Clock3,
  RefreshCw,
  ImageOff,
  Camera,
  Upload,
  CheckCircle2
} from 'lucide-react';

import apiClient from '../lib/api/apiClient.js';
import useAuthStore from '../lib/store/authStore.js';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function InformationItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon size={20} aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-1 break-words font-medium text-gray-900">
          {value || 'Not available'}
        </p>
      </div>
    </div>
  );
}

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const setUser = useAuthStore((state) => state.setUser);

  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setImageFailed(false);
  }, [user?.profilePicture]);

  const handleSelectImage = () => {
    setError('');
    setSuccess('');
    fileInputRef.current?.click();
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];


    event.target.value = '';

    if (!file) {
      return;
    }

    setError('');
    setSuccess('');

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError(
        'Unsupported image type. Please choose a JPEG, PNG, WebP, or GIF image.'
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Image must not exceed 2 MB. Please choose a smaller file.');
      return;
    }

    if (file.size === 0) {
      setError('The selected file is empty. Please choose another image.');
      return;
    }

    if (uploading) {
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiClient.post(
        '/upload/profile-picture',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 60000
        }
      );

      const imageUrl = response.data?.url;

      if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
        throw new Error(
          'The server did not return a valid profile-picture URL.'
        );
      }


      setUser({
        ...user,
        profilePicture: imageUrl
      });

      setImageFailed(false);
      setSuccess('Your profile picture was updated successfully.');
    } catch (err) {
      const status = err?.status;
      let message =
        err?.message || 'Unable to upload your profile picture. Please try again.';

      if (status === 400) {
        message =
          err.message || 'Please select a valid image and try again.';
      } else if (status === 401) {
        message =
          'Your session may have expired. Please sign in again.';
      } else if (status === 404) {
        message = 'Your account could not be found.';
      } else if (status === 413) {
        message = 'Image must not exceed 2 MB.';
      } else if (status === 415) {
        message =
          'Unsupported or invalid image. Choose a valid JPEG, PNG, WebP, or GIF file.';
      } else if (status === 502) {
        message =
          'The image service failed to upload your picture. Your previous picture should remain unchanged. Please try again.';
      } else if (status === 503) {
        message =
          'The image upload service is currently unavailable. Please try again later.';
      }

      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    setError('');
    setSuccess('');

    try {
      await initializeAuth();
    } catch {
      setError('Unable to reload your profile. Please try again.');
    } finally {
      setRetrying(false);
    }
  };

  if (isLoading || retrying) {
    return (
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">
        <div
          role="status"
          className="rounded-xl border border-gray-200 bg-white p-8 text-center"
        >
          <div className="flex items-center justify-center gap-3 text-gray-600">
            <RefreshCw
              size={20}
              className="animate-spin"
              aria-hidden="true"
            />
            <span>Loading your profile...</span>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-6"
        >
          <h1 className="text-xl font-bold text-gray-900">
            Profile unavailable
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Your authenticated profile could not be loaded. Please try again.
          </p>

          <button
            type="button"
            onClick={handleRetry}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Retry
          </button>
        </div>
      </main>
    );
  }

  const fullName =
    typeof user.name === 'string' && user.name.trim()
      ? user.name.trim()
      : 'Name not available';

  const email =
    typeof user.email === 'string' && user.email.trim()
      ? user.email
      : 'Email not available';

  const role =
    typeof user.role === 'string' && user.role.trim()
      ? user.role.trim()
      : 'Not available';

  const profilePicture =
    typeof user.profilePicture === 'string'
      ? user.profilePicture.trim()
      : '';

  const showProfilePicture =
    Boolean(profilePicture) && !imageFailed;

  return (
    <main className="mx-auto min-w-0 max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

        <p className="mt-1 text-sm text-gray-500">
          View your account information and manage your profile picture.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-4"
        >
          <CheckCircle2
            size={20}
            className="shrink-0 text-green-600"
            aria-hidden="true"
          />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="h-28 bg-gray-300 sm:h-36" />


        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end">
            <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-gray-100 text-gray-500 shadow-sm">
                {showProfilePicture ? (
                  <img
                    src={profilePicture}
                    alt={`${fullName}'s profile`}
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    {profilePicture ? (
                      <ImageOff size={28} aria-hidden="true" />
                    ) : (
                      <UserRound size={36} aria-hidden="true" />
                    )}

                    <span className="text-xs">No photo</span>
                  </div>
                )}
              </div>

              {uploading && (
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-white"
                  role="status"
                  aria-label="Uploading profile picture"
                >
                  <RefreshCw
                    size={26}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <h2 className="break-words text-xl font-bold text-white-900 sm:text-2xl">
                {fullName}
              </h2>

              <p className="mt-1 break-all text-sm text-gray-500">
                {email}
              </p>

              <div className="mt-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  disabled={uploading}
                  className="sr-only"
                  aria-label="Choose a profile picture"
                />

                <button
                  type="button"
                  onClick={handleSelectImage}
                  disabled={uploading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploading ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                      Uploading picture...
                    </>
                  ) : (
                    <>
                      {profilePicture ? (
                        <Camera size={17} aria-hidden="true" />
                      ) : (
                        <Upload size={17} aria-hidden="true" />
                      )}
                      {profilePicture ? 'Change Picture' : 'Upload Picture'}
                    </>
                  )}
                </button>

                <p className="mt-2 text-xs text-gray-500">
                  JPEG, PNG, WebP, or GIF. Maximum size: 2 MB.
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-gray-200 px-3 py-1.5 text-sm font-medium capitalize text-gray-900">
              <ShieldCheck size={16} aria-hidden="true" />
              {role}
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Account Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Information associated with your account.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InformationItem
            icon={UserRound}
            label="Full Name"
            value={fullName}
          />

          <InformationItem
            icon={Mail}
            label="Email Address"
            value={email}
          />

          <InformationItem
            icon={ShieldCheck}
            label="User Role"
            value={role}
          />

          <InformationItem
            icon={CalendarDays}
            label="Account Created"
            value={formatDate(user.createdAt)}
          />

          <InformationItem
            icon={Clock3}
            label="Last Account Update"
            value={formatDate(user.updatedAt)}
          />
        </div>
      </section>
    </main>
  );
}
