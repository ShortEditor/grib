import { create } from 'zustand';
import api from '../api/client';

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('grib_user')) || null;
  } catch {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  user: getStoredUser(),
  token: localStorage.getItem('grib_token') || null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('grib_token', data.token);
      localStorage.setItem('grib_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.error || 'Login failed';
      set({ error, loading: false });
      return { success: false, error };
    }
  },

  register: async (email, password, name) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { email, password, name });
      localStorage.setItem('grib_token', data.token);
      localStorage.setItem('grib_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.error || 'Registration failed';
      set({ error, loading: false });
      return { success: false, error };
    }
  },

  logout: () => {
    localStorage.removeItem('grib_token');
    localStorage.removeItem('grib_user');
    set({ user: null, token: null });
  },

  clearError: () => set({ error: null }),
}));
