import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const TOKEN_KEY = 'sahana_token';

type AuthState = {
  token: string | null;
  /** SecureStore'dan ilk okuma tamamlandı mı (yönlendirme bunu bekler) */
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setToken: (Token: string | null) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  hydrated: false,

  hydrate: async () => {
    const Token = await SecureStore.getItemAsync(TOKEN_KEY);
    set({ token: Token, hydrated: true });
  },

  setToken: async (Token) => {
    if (Token == null) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, Token);
    }

    set({ token: Token });
  },
}));
