import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const KEY_CURRENCY = 'yohaku.currency';
const KEY_THEME = 'yohaku.theme';
const KEY_HAPTICS = 'yohaku.haptics';
const KEY_DAILY_LIMIT = 'yohaku.dailyLimit';

export type ThemeMode = 'system' | 'light' | 'dark';

export const CURRENCIES = ['ETB', 'USD', 'EUR', 'GBP', 'JPY', 'KES'] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

interface SettingsState {
  currency: CurrencyCode;
  themeMode: ThemeMode;
  hapticsEnabled: boolean;
  dailyLimit: number;
  isLoaded: boolean;
  setCurrency: (currency: CurrencyCode) => Promise<void>;
  setThemeMode: (themeMode: ThemeMode) => Promise<void>;
  setHapticsEnabled: (enabled: boolean) => Promise<void>;
  setDailyLimit: (amount: number) => Promise<void>;
  formatAmount: (amount: number) => string;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  currency: 'ETB',
  themeMode: 'dark',
  hapticsEnabled: false,
  dailyLimit: 0,
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

  setHapticsEnabled: async (enabled: boolean) => {
    set({ hapticsEnabled: enabled });
    try {
      await SecureStore.setItemAsync(KEY_HAPTICS, enabled ? '1' : '0');
    } catch (e) {
      console.warn('Failed to persist haptics setting', e);
    }
  },

  setDailyLimit: async (amount: number) => {
    set({ dailyLimit: amount });
    try {
      await SecureStore.setItemAsync(KEY_DAILY_LIMIT, String(amount));
    } catch (e) {
      console.warn('Failed to persist daily limit setting', e);
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
      const storedHaptics = await SecureStore.getItemAsync(KEY_HAPTICS);
      if (storedHaptics !== null) {
        set({ hapticsEnabled: storedHaptics === '1' });
      }
      const storedLimit = await SecureStore.getItemAsync(KEY_DAILY_LIMIT);
      if (storedLimit !== null) {
        set({ dailyLimit: parseFloat(storedLimit) || 0 });
      }
    } catch (e) {
      console.warn('Failed to load settings', e);
    }
    set({ isLoaded: true });
  },
}));
