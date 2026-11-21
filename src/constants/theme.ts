import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

export const LightColors = {
  background: '#F5F3EE', // Washi warm natural paper
  card: '#FFFFFF',       // Clean paper leaf
  cardDark: '#202522',   // Sumi carbon ink stone
  cardElevated: '#EDE9E1',

  border: 'rgba(32, 37, 34, 0.08)',
  shadow: '#202522',
  divider: 'rgba(32, 37, 34, 0.08)',

  textPrimary: '#202522',
  textSecondary: '#666F6A',
  textMuted: '#909A94',
  textInverse: '#F5F3EE',

  hankoRed: '#B83B2A',     // Shu-iro vermilion cinnabar
  expensePillBg: '#F7EDE9',
  expensePillText: '#A63524',

  bambooGreen: '#3E6B52',       // Take-iro bamboo evergreen
  categoryFood: '#C87A28',      // Yamabuki amber gold
  categoryBills: '#3B4D6B',     // Aizome indigo
  categoryTransport: '#3A7579', // Seiji celadon
  categoryFun: '#6A527A',       // Fuji wisteria
  categoryOther: '#76807B',     // Rikyu grey

 
  selectionBg: '#202522',
  selectionText: '#F5F3EE',
  selectionBorder: '#202522',

  incomeBg: '#3E6B52',
  incomeText: '#FFFFFF',
  incomeBorder: '#3E6B52',

  savingBg: '#3A7579',
  savingText: '#FFFFFF',
  savingBorder: '#3A7579',

  switchTrackOff: '#D4D2CB',
  switchThumb: '#FFFFFF',

  positiveText: '#3E6B52',
  negativeText: '#B83B2A',

  overlay: 'rgba(32, 37, 34, 0.55)',
};


export const DarkColors = {
  background: '#131715', // Deep charcoal sumi wash
  card: '#1B211E',       // Stoneware vessel
  cardDark: '#252D29',
  cardElevated: '#2F3A35',

  border: 'rgba(240, 244, 242, 0.08)',
  shadow: '#000000',
  divider: 'rgba(240, 244, 242, 0.08)',

  textPrimary: '#F2F6F4',
  textSecondary: '#9EAAA4',
  textMuted: '#78847E',
  textInverse: '#FFFFFF',

  hankoRed: '#D94D38',
  expensePillBg: '#3E211F',
  expensePillText: '#FF8A80',

  bambooGreen: '#5A8F69',
  categoryFood: '#E5A242',
  categoryBills: '#5C7CA6',
  categoryTransport: '#5EACB2',
  categoryFun: '#9C82B5',
  categoryOther: '#9DA8A4',

  
  selectionBg: '#F2F6F4',
  selectionText: '#131715',
  selectionBorder: '#F2F6F4',

  incomeBg: '#2F6B42',
  incomeText: '#D9F2DF',
  incomeBorder: '#5F9B70',

  savingBg: '#2A5E63',
  savingText: '#BFE9EC',
  savingBorder: '#4F8D93',

  switchTrackOff: '#44504B',
  switchThumb: '#F2F6F4',

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
