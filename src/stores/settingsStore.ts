import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const KEY_CURRENCY = 'yohaku.currency';
const KEY_THEME = 'yohaku.theme';

export type ThemeMode = 'system' | 'light' | 'dark';

export const CURRENCIES = ['ETB', 'USD', 'EUR', 'GBP', 'JPY', 'KES'] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

interface SettingsState {
  currency: CurrencyCode;
  themeMode: ThemeMode;
  isLoaded: boolean;
  setCurrency: (currency: CurrencyCode) => Promise<void>;
  setThemeMode: (themeMode: ThemeMode) => Promise<void>;
  formatAmount: (amount: number) => string;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  currency: 'ETB',
  themeMode: 'dark',
  isLoaded: false,

  setCurrency: async (currency: CurrencyCode) => {
    set({ currency });
    try {
      await SecureStore.setItemAsync(KEY_CURRENCY, currency);
    } catch (e) {
      console.warn('Failed to persist currency setting', e);
    }
  },

  setThemeMode: async (themeMode: ThemeMode) => {
    set({ themeMode });
    try {
      await SecureStore.setItemAsync(KEY_THEME, themeMode);
    } catch (e) {
      console.warn('Failed to persist theme setting', e);
    }
  },

  formatAmount: (amount: number) => {
    const { currency } = get();
    const isNegative = amount < 0;
    const formatted = Math.abs(Math.round(amount)).toLocaleString('en-US');
    return `${isNegative ? '-' : ''}${formatted} ${currency}`;
  },

  loadSettings: async () => {
    try {
      const storedCurrency = await SecureStore.getItemAsync(KEY_CURRENCY);
      if (storedCurrency && CURRENCIES.includes(storedCurrency as CurrencyCode)) {
        set({ currency: storedCurrency as CurrencyCode });
      }
      const storedTheme = await SecureStore.getItemAsync(KEY_THEME);
      if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
        set({ themeMode: storedTheme });
      }
    } catch (e) {
      console.warn('Failed to load settings', e);
    }
    set({ isLoaded: true });
  },
}));
