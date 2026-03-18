import { create } from "zustand";
import * as authApi from "@/lib/api/auth";
import type { AuthStore } from "./types";

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  error: null,

  checkSession: async () => {
    set({ loading: true, error: null });
    try {
      const { user } = await authApi.fetchSession();
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { user } = await authApi.login(email, password);
      set({ user, loading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Login failed";
      set({ error: message, loading: false });
    }
  },

  register: async (email, password, displayName?) => {
    set({ loading: true, error: null });
    try {
      const { user } = await authApi.register(email, password, displayName);
      set({ user, loading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Registration failed";
      set({ error: message, loading: false });
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ user: null, loading: false, error: null });
    }
  },

  clearError: () => set({ error: null }),
}));
