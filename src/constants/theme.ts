import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

export const LightColors = {
  background: '#E5E7E6',
  card: '#ECEEED',
  cardDark: '#262A28',
  cardElevated: '#F4F6F5',

  border: '#262A28',
  shadow: '#262A28',
  divider: '#D0D4D2',

  textPrimary: '#262A28',
  textSecondary: '#68706C',
  textMuted: '#949C98',
  textInverse: '#ECEEED',

  hankoRed: '#B83B2A',
  expensePillBg: '#EFE5E4',
  expensePillText: '#A63A2B',

  bambooGreen: '#4A6B53',
  categoryFood: '#C88A32',
  categoryBills: '#3B4D6B',
  categoryTransport: '#467A7E',
  categoryFun: '#6E5A7F',
  categoryOther: '#7A827E',

 
  selectionBg: '#262A28',
  selectionText: '#ECEEED',
  selectionBorder: '#262A28',

  incomeBg: '#4A6B53',
  incomeText: '#FFFFFF',
  incomeBorder: '#4A6B53',

  savingBg: '#467A7E',
  savingText: '#FFFFFF',
  savingBorder: '#467A7E',

  switchTrackOff: '#D0D4D2',
  switchThumb: '#FFFFFF',

  positiveText: '#4A6B53',
  negativeText: '#B83B2A',

  overlay: 'rgba(38, 42, 40, 0.55)',
};


export const DarkColors = {
  background: '#141817',
  card: '#1F2624',
  cardDark: '#2D3835',
  cardElevated: '#384643',

  border: '#52635F',
  shadow: '#000000',
  divider: '#34413E',

  textPrimary: '#F2F5F4',
  textSecondary: '#A4B0AB',
  textMuted: '#8E9B96',
  textInverse: '#FFFFFF',

  hankoRed: '#D94D38',
  expensePillBg: '#442624',
  expensePillText: '#FF8A80',

  bambooGreen: '#5A8F69',
  categoryFood: '#E5A242',
  categoryBills: '#5C7CA6',
  categoryTransport: '#5EACB2',
  categoryFun: '#9C82B5',
  categoryOther: '#9DA8A4',

  
  selectionBg: '#F2F5F4',
  selectionText: '#141817',
  selectionBorder: '#F2F5F4',

  incomeBg: '#2F6B42',
  incomeText: '#D9F2DF',
  incomeBorder: '#5F9B70',

  savingBg: '#2A5E63',
  savingText: '#BFE9EC',
  savingBorder: '#4F8D93',

  switchTrackOff: '#4A5754',
  switchThumb: '#F2F5F4',

  positiveText: '#8FD3A2',
  negativeText: '#FF8A80',

  overlay: 'rgba(0, 0, 0, 0.72)',
};

export const Colors = LightColors;

export function useThemeColors() {
  const systemScheme = useColorScheme();
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');

  const colors = isDark ? DarkColors : LightColors;

  return {
    colors,
    isDark,
    themeMode,
    setThemeMode,
  };
}

export const Fonts = {
  serif: 'ShipporiMincho_600SemiBold', // Headers, Kanji, Numpad numbers
  digital: 'ShareTechMono_400Regular', // LCD Expense numbers (12,480 / 420)
  mono: 'ShareTechMono_400Regular',    // Code / Inputs / Monospace
  sans: 'PlusJakartaSans_500Medium',   // Everyday UI text
  sansBold: 'PlusJakartaSans_700Bold', // Bold list titles
};

export type CategoryKey = 'food' | 'bills' | 'transport' | 'fun' | 'other';

export const CATEGORIES: {
  key: CategoryKey;
  label: string;
  kanji: string;
  color: string;
}[] = [
  { key: 'food', label: 'Food', kanji: '食費', color: Colors.categoryFood },
  { key: 'bills', label: 'Bills', kanji: '固定費', color: Colors.categoryBills },
  { key: 'transport', label: 'Transport', kanji: '交通費', color: Colors.categoryTransport },
  { key: 'fun', label: 'Fun', kanji: '娯楽', color: Colors.categoryFun },
  { key: 'other', label: 'Other', kanji: 'その他', color: Colors.categoryOther },
];

export const CATEGORY_MAP: Record<
  CategoryKey,
  { label: string; kanji: string; color: string }
> = {
  food: { label: 'Food', kanji: '食費', color: Colors.categoryFood },
  bills: { label: 'Bills', kanji: '固定費', color: Colors.categoryBills },
  transport: { label: 'Transport', kanji: '交通費', color: Colors.categoryTransport },
  fun: { label: 'Fun', kanji: '娯楽', color: Colors.categoryFun },
  other: { label: 'Other', kanji: 'その他', color: Colors.categoryOther },
};
