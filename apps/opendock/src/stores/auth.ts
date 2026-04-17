import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { AuthData } from "@/types";

interface AuthStatus { data: AuthData; loading: boolean; pending: boolean; error: string | null }
interface AuthActions {
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = create<AuthStatus & AuthActions>((set) => ({
  data: {},
  loading: true,
  pending: false,
  error: null,

  refresh: async () => {
    try {
      const data = await invoke<AuthData>("auth_status");
      set({ data, loading: false, error: null });
    } catch {
      set({ data: {}, loading: false, error: null });
    }
  },

  login: async (email, password) => {
    set({ pending: true, error: null });
    try {
      const data = await invoke<AuthData>("auth_login", { email, password });
      set({ data, pending: false });
    } catch (e) {
      set({ pending: false, error: String(e) });
    }
  },

  logout: async () => {
    await invoke("auth_logout");
    set({ data: {}, pending: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
