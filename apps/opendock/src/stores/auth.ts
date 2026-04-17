import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { AuthData } from "@/types";

interface AuthStatus { data: AuthData; loading: boolean; pending: boolean; error: string | null }
interface AuthActions {
  refresh: () => Promise<void>;
  startLogin: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthStatus & AuthActions>((set, get) => ({
  data: {},
  loading: true,
  pending: false,
  error: null,

  refresh: async () => {
    try {
      const data = await invoke<AuthData>("auth_status");
      set({ data, loading: false, error: null });
    } catch (e) {
      set({ data: {}, loading: false, error: String(e) });
    }
  },

  startLogin: async () => {
    set({ pending: true, error: null });
    try {
      const { code } = await invoke<{ code: string; url: string }>("auth_initiate");
      const poll = async (): Promise<void> => {
        const result = await invoke<{ status: string; data: AuthData | null }>("auth_poll", { code });
        if (result.status === "complete" && result.data) {
          set({ data: result.data, pending: false });
          return;
        }
        if (result.status === "expired") { throw new Error("Login link expired"); }
        if (!get().pending) return;
        await new Promise((r) => setTimeout(r, 1500));
        return poll();
      };
      await poll();
    } catch (e) {
      set({ pending: false, error: String(e) });
    }
  },

  logout: async () => {
    await invoke("auth_logout");
    set({ data: {}, pending: false, error: null });
  },
}));
