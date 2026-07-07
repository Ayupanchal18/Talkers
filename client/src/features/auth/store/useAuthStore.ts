import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  setAccessToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
}

import { API_URL } from '@/shared/constants';

const getStoredUser = (): User | null => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  accessToken: null,
  isLoading: false,
  error: null,

  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  setError: (error) => set({ error }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // send/receive HttpOnly refreshToken cookie
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('user', JSON.stringify(data.data.user));
      if (data.data.refreshToken) {
        localStorage.setItem('refreshToken', data.data.refreshToken);
      }
      set({ user: data.data.user, accessToken: data.data.accessToken, isLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // send/receive HttpOnly refreshToken cookie
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('user', JSON.stringify(data.data.user));
      if (data.data.refreshToken) {
        localStorage.setItem('refreshToken', data.data.refreshToken);
      }
      set({ user: data.data.user, accessToken: data.data.accessToken, isLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // needed to clear the HttpOnly cookie
      });
    } catch (error) {
      console.error('Failed to call logout endpoint:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      set({ user: null, accessToken: null });
    }
  },

  refreshSession: async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedRefreshToken) {
        headers['x-refresh-token'] = storedRefreshToken;
      }

      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers,
        credentials: 'include', // CRITICAL: sends the HttpOnly refreshToken cookie
      });
      const data = await response.json();
      if (response.ok && data.data?.accessToken) {
        if (data.data.refreshToken) {
          localStorage.setItem('refreshToken', data.data.refreshToken);
        }
        set({ accessToken: data.data.accessToken });
        return data.data.accessToken;
      }
      // If refresh fails, clear user state
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      set({ user: null, accessToken: null });
      return null;
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      set({ user: null, accessToken: null });
      return null;
    }
  },
}));
