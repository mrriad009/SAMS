import axios from 'axios';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import api from '@/services/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  setAccessToken: (token: string) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearSession: () => void;
  fetchMe: () => Promise<void>;
  bootstrap: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      hasHydrated: false,
      setAccessToken: (token) =>
        set({ accessToken: token, isAuthenticated: true }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          set({
            user: data.data.user,
            accessToken: data.data.accessToken,
            isAuthenticated: true,
            isLoading: false,
            hasHydrated: true,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      clearSession: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {
          // ignore
        }
        get().clearSession();
      },

      fetchMe: async () => {
        const token = get().accessToken;
        if (!token) return;
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.data, isAuthenticated: true });
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            get().clearSession();
          }
        }
      },

      bootstrap: async () => {
        const { accessToken, user } = get();
        if (!accessToken) {
          set({ hasHydrated: true, isLoading: false, isAuthenticated: false, user: null });
          return;
        }

        set({
          hasHydrated: true,
          isLoading: true,
          isAuthenticated: !!user,
        });

        await get().fetchMe();
        set({ isLoading: false });
      },

    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        void state?.bootstrap();
      },
    }
  )
);
