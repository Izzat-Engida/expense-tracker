import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const KEY_CURRENCY = 'yohaku.currency';

interface SettingsState {
  currency: string;
  isLoaded: boolean;
  setCurrency: (currency: string) => Promise<void>;
  formatAmount: (amount: number) => string;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  currency: '¥',
  isLoaded: false,

  setCurrency: async (currency: string) => {
    set({ currency });
    try {
      await SecureStore.setItemAsync(KEY_CURRENCY, currency);
    } catch (e) {
      console.warn('Failed to persist currency setting', e);
    }
  },

  formatAmount: (amount: number) => {
    const { currency } = get();
    const isNegative = amount < 0;
    const formatted = Math.abs(Math.round(amount)).toLocaleString('en-US');
    return isNegative ? `-${currency}${formatted}` : `${currency}${formatted}`;
  },

  loadSettings: async () => {
    try {
      const stored = await SecureStore.getItemAsync(KEY_CURRENCY);
      if (stored) {
        set({ currency: stored, isLoaded: true });
        return;
      }
    } catch (e) {
      console.warn('Failed to load currency setting', e);
    }
    set({ isLoaded: true });
  },
}));
