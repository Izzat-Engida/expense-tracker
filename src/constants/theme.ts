export const Colors={
  background:'#E5E7E6',
  card:'#ECEEED',
  cardDark:'#262A28',
  cardElevated:'#F4F6F5',

  border:'#262A28',
  shadow:'#262A28',
  divider:'#D0D4D2',

  textPrimary:'#262A28',
  textSecondary:'#68706C',
  textMuted:'#949C98',
  textInverse:'#ECEEED',

  hankoRed:'#B83B2A',
  expensePillBg:'#EFE5E4',
  expensePillText:'#A63A2B',

  bambooGreen:'#4A6B53',
  categoryFood:'#C88A32',
  categoryBills:'#3B4D6B',
  categoryTransport:'#467A7E',
  categoryFun:'#6E5A7F',
  categoryOther:'#7A827E'
}

export const Fonts = {
  serif: 'ShipporiMincho_600SemiBold', // Headers, Kanji, Numpad numbers
  digital: 'ShareTechMono_400Regular', // LCD Expense numbers (12,480 / 420)
  sans: 'PlusJakartaSans_500Medium',   // Everyday UI text
  sansBold: 'PlusJakartaSans_700Bold', // Bold list titles ("Morning coffee")
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
