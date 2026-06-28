import { create } from "zustand";
import type { User } from "@/types/user";
import { fetchMe, login as apiLogin, logout as apiLogout } from "@/lib/apiClient";
import { isAuthenticated } from "@/lib/auth";

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  login: (u: string, p: string) => Promise<User>;
  logout: () => Promise<void>;
  loadUser: () => Promise<User | null>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null, loading: false, initialized: false,
  login: async (username, password) => {
    set({ loading: true });
    try {
      await apiLogin(username, password);
      const user = await fetchMe();
      set({ user, loading: false, initialized: true });
      return user;
    } catch (e) { set({ loading: false }); throw e; }
  },
  logout: async () => { await apiLogout(); set({ user: null }); },
  loadUser: async () => {
    if (!isAuthenticated()) { set({ user: null, initialized: true }); return null; }
    set({ loading: true });
    try {
      const user = await fetchMe();
      set({ user, loading: false, initialized: true });
      return user;
    } catch { set({ user: null, loading: false, initialized: true }); return null; }
  },
}));
