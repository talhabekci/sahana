import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const MODE_KEY = 'sahana_theme_mode';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeState = {
  mode: ThemeMode;
  /** SecureStore'dan ilk okuma tamamlandı mı */
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setMode: (Mode: ThemeMode) => Promise<void>;
};

/** BACKLOG #60 — açık/koyu tema tercihi, auth store'daki desenle aynı şekilde kalıcı. */
export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  hydrated: false,

  hydrate: async () => {
    const Stored = await SecureStore.getItemAsync(MODE_KEY);
    const Mode: ThemeMode = Stored === 'light' || Stored === 'dark' ? Stored : 'system';

    set({ mode: Mode, hydrated: true });
  },

  setMode: async (Mode) => {
    await SecureStore.setItemAsync(MODE_KEY, Mode);
    set({ mode: Mode });
  },
}));
