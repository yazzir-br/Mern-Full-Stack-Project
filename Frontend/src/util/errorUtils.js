
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message;
  }

  if (typeof data?.error === 'string' && data.error.trim()) {
    return data.error;
  }

  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors
      .map((item) =>
        typeof item === 'string'
          ? item
          : item?.message || item?.msg
      )
      .filter(Boolean)
      .join(', ') || fallback;
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
