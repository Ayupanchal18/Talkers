import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../../../shared/constants';

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
  loadStoredSession: () => Promise<void>;
}

const SECURE_REFRESH_TOKEN_KEY = 'vidss_refresh_token';
const SECURE_USER_KEY = 'vidss_user_profile';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true, // Default to true to prevent login screen flashing during bootstrapping
  error: null,

  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  setError: (error) => set({ error }),

  loadStoredSession: async () => {
    set({ isLoading: true });
    try {
      const storedUser = await SecureStore.getItemAsync(SECURE_USER_KEY);
      if (storedUser) {
        set({ user: JSON.parse(storedUser) });
      }
      // Attempt to refresh the session immediately to get a valid access token
      await get().refreshSession();
    } catch (e) {
      console.warn('[AuthStore] Failed to load stored session:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const { user, accessToken, refreshToken } = data.data;

      // Save user profile and refresh token to SecureStore
      await SecureStore.setItemAsync(SECURE_USER_KEY, JSON.stringify(user));
      if (refreshToken) {
        await SecureStore.setItemAsync(SECURE_REFRESH_TOKEN_KEY, refreshToken);
      }

      set({ user, accessToken, isLoading: false });
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
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      const { user, accessToken, refreshToken } = data.data;

      // Save user profile and refresh token to SecureStore
      await SecureStore.setItemAsync(SECURE_USER_KEY, JSON.stringify(user));
      if (refreshToken) {
        await SecureStore.setItemAsync(SECURE_REFRESH_TOKEN_KEY, refreshToken);
      }

      set({ user, accessToken, isLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(SECURE_REFRESH_TOKEN_KEY);
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'x-refresh-token': refreshToken || '',
        },
      });
    } catch (error) {
      console.error('Failed to call logout endpoint:', error);
    } finally {
      await SecureStore.deleteItemAsync(SECURE_USER_KEY);
      await SecureStore.deleteItemAsync(SECURE_REFRESH_TOKEN_KEY);
      set({ user: null, accessToken: null });
    }
  },

  refreshSession: async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(SECURE_REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-refresh-token': refreshToken,
        },
      });

      const data = await response.json();
      if (response.ok && data.data?.accessToken) {
        const nextAccessToken = data.data.accessToken;
        const nextRefreshToken = data.data.refreshToken;

        set({ accessToken: nextAccessToken });
        if (nextRefreshToken) {
          await SecureStore.setItemAsync(SECURE_REFRESH_TOKEN_KEY, nextRefreshToken);
        }
        return nextAccessToken;
      }
      
      // If refresh fails, clear session
      await SecureStore.deleteItemAsync(SECURE_USER_KEY);
      await SecureStore.deleteItemAsync(SECURE_REFRESH_TOKEN_KEY);
      set({ user: null, accessToken: null });
      return null;
    } catch (err) {
      console.warn('[AuthStore] Session refresh failed:', err);
      await SecureStore.deleteItemAsync(SECURE_USER_KEY);
      await SecureStore.deleteItemAsync(SECURE_REFRESH_TOKEN_KEY);
      set({ user: null, accessToken: null });
      return null;
    }
  },
}));
