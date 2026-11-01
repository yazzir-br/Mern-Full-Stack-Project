import { create } from 'zustand';
import apiClient from '../api/apiClient.js';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  authError: null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: Boolean(user),
      isLoading: false,
      authError: null,
    }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  setAuthError: (authError) =>
    set({
      authError,
      isLoading: false,
    }),

  clearAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      authError: null,
    }),

  initializeAuth: async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        authError: null,
      });

      return false;
    }

    set({
      isLoading: true,
      authError: null,
    });

    try {
      const response = await apiClient.get('/auth/profile');

      const user =
        response.data?.user ??
        response.data?.data ??
        response.data;

      if (!user?._id || !user?.role) {
        throw new Error('Invalid authentication response.');
      }

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        authError: null,
      });

      return true;
    } catch (error) {
      const status = error.response?.status;

      if (status === 401 || status === 403) {
        localStorage.removeItem('token');

        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          authError: null,
        });
      } else {
        set({
          isLoading: false,
          authError:
            error.response?.data?.message ||
            error.message ||
            'Unable to verify your session.',
        });
      }

      return false;
    }
  },
}));

export default useAuthStore;
