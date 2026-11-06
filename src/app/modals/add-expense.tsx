import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Main,
  BentoCard,
  AppText,
  HankoStamp,
  PillBadge,
} from '@/components/ui';
import { Colors, Fonts, useThemeColors } from '@/constants/theme';
import { useLedger } from '@/hooks/useLedger';
import { useSettingsStore } from '@/stores/settingsStore';
import { localDateKey } from '@/lib/ledger';
import type { ExpenseCategory } from '@/db/types';

type TransactionMode = 'expense' | 'income' | 'saving';

interface CategoryOption {
  key: ExpenseCategory;
  label: string;
}

const EXPENSE_CATEGORIES: CategoryOption[] = [
  { key: 'food', label: 'Food' },
  { key: 'transport', label: 'Transport' },
  { key: 'bills', label: 'Bills' },
  { key: 'fun', label: 'Fun' },
  { key: 'other', label: 'Other' },
];

const INCOME_SOURCES = [
  'Salary',
  'Freelance',
  'Bonus',
  'Investment',
  'Side Gig',
  'Other',
] as const;

const SAVING_GOALS = [
  'General',
  'Emergency Fund',
  'Investment',
  'Retirement',
] as const;

const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

export default function AddExpenseModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: string;
    wishlistId?: string;
    expenseId?: string;
  }>();
  const {
    expenses,
    createExpense,
    updateExpense,
    deleteExpense,
    createIncome,
    createSaving,
    wishlist,
  } = useLedger();
  const { colors } = useThemeColors();
  const currency = useSettingsStore((s) => s.currency);

  const isEditing = Boolean(params.expenseId);
  const existingExpense = useMemo(
    () => expenses.find((expense) => expense.id === params.expenseId),
    [expenses, params.expenseId],
  );

  const initialMode: TransactionMode =
    params.type === 'income' ? 'income' : params.type === 'saving' ? 'saving' : 'expense';

  const [mode, setMode] = useState<TransactionMode>(
    existingExpense ? 'expense' : initialMode,
  );
  const [amount, setAmount] = useState(
    existingExpense ? String(existingExpense.amount) : '0',
  );
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>(
    existingExpense?.category ?? 'food',
  );
  const [selectedIncomeSource, setSelectedIncomeSource] = useState<string>('Salary');
  const [selectedSavingGoal, setSelectedSavingGoal] = useState<string>('General');
  const [selectedWishlistId, setSelectedWishlistId] = useState<string | null>(
    params.wishlistId ?? null
  );
  const [note, setNote] = useState(existingExpense?.note ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const isExpense = mode === 'expense';
  const isIncome = mode === 'income';
  const isSavingMode = mode === 'saving';

  const unpurchasedWishlist = useMemo(
    () => wishlist.filter((item) => item.is_purchased === 0),
    [wishlist]
  );

  const formattedDate = useMemo(() => {
    const dateKey = existingExpense?.date ?? localDateKey();
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const monthName = date.toLocaleString('en-US', { month: 'long' });
    const isToday = localDateKey() === dateKey;
    return `${isToday ? 'Today, ' : ''}${day} ${monthName}`;
  }, [existingExpense?.date]);

  const handleKeyPress = (key: string) => {
    if (key === '⌫') {
      setAmount((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      return;
    }

    if (key === '.' && amount.includes('.')) return;

    // Limit decimal precision to 2 digits
    if (amount.includes('.') && key !== '⌫') {
      const parts = amount.split('.');
      if (parts[1] && parts[1].length >= 2) return;
    }

    // Limit max length to avoid layout breakage
    if (amount.length >= 9 && key !== '⌫') return;

    setAmount((prev) => (prev === '0' && key !== '.' ? key : prev + key));
  };

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      router.back();
      return;
    }

    if (isEditing && !existingExpense) {
      Alert.alert('Expense not found', 'This expense is no longer available.');
      return;
    }

    setIsSaving(true);
    try {
      const dateStr = localDateKey();
      const monthKey = dateStr.slice(0, 7);
      const catObj = EXPENSE_CATEGORIES.find((c) => c.key === selectedCategory);
      const title = note.trim() || (catObj ? catObj.label : 'Expense');

      if (isEditing && existingExpense) {
        await updateExpense(existingExpense.id, {
          title,
          amount: numAmount,
          category: selectedCategory,
          note: note.trim() || null,
          date: existingExpense.date,
        });
      } else if (isExpense) {
        await createExpense({
          title,
          amount: numAmount,
          category: selectedCategory,
          note: note.trim() || null,
          date: dateStr,
        });
      } else if (isIncome) {
        await createIncome({
          source_name: note.trim() || selectedIncomeSource,
          amount: numAmount,
          month_key: monthKey,
        });
      } else {
        const wishItem = unpurchasedWishlist.find((w) => w.id === selectedWishlistId);
        await createSaving({
          title: note.trim() || (wishItem ? wishItem.title : selectedSavingGoal),
          amount: numAmount,
          category: wishItem ? wishItem.category : selectedSavingGoal,
          wishlist_id: selectedWishlistId,
          note: note.trim() || null,
          date: dateStr,
        });
      }
    } catch (e) {
      console.warn('Error saving entry:', e);
    } finally {
      setIsSaving(false);
      router.back();
    }
  };

  const handleDelete = () => {
    if (!existingExpense) return;
    Alert.alert(
      'Delete expense',
      `Delete "${existingExpense.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(existingExpense.id);
              router.back();
            } catch (e) {
              console.warn('Error deleting expense:', e);
            }
          },
        },
      ],
    );
  };

  const cursorColor = isExpense
    ? colors.hankoRed
    : isIncome
    ? colors.bambooGreen
    : colors.categoryTransport;

  const saveBg = isExpense
    ? colors.selectionBg
    : isIncome
    ? colors.incomeBg
    : colors.savingBg;
  const saveBorder = isExpense
    ? colors.selectionBorder
    : isIncome
    ? colors.incomeBorder
    : colors.savingBorder;
  const saveText = isExpense
    ? colors.selectionText
    : isIncome
    ? colors.incomeText
    : colors.savingText;

  return (
    <Main>
      {/* Header */}
      <View style={styles.headerRow}>
        <AppText variant="serifTitle">
          {isEditing
            ? 'Edit expense'
            : isExpense
            ? 'Add expense'
            : isIncome
            ? 'Add salary / income'
            : 'Add saving'}
        </AppText>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <AppText variant="body" color={colors.textPrimary}>
            ✕
          </AppText>
        </TouchableOpacity>
      </View>

      {/* 3-Way Switcher: Expense | Salary | Saving */}
      {!isEditing && (
      <View style={[styles.segmentContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setMode('expense')}
          style={[
            styles.segmentButton,
            isExpense && {
              backgroundColor: colors.selectionBg,
              borderColor: colors.selectionBorder,
            },
          ]}
        >
          <AppText
            variant="bodyBold"
            color={isExpense ? colors.selectionText : colors.textSecondary}
            style={styles.segmentText}
          >
            支出 Expense
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setMode('income')}
          style={[
            styles.segmentButton,
            isIncome && {
              backgroundColor: colors.incomeBg,
              borderColor: colors.incomeBorder,
            },
          ]}
        >
          <AppText
            variant="bodyBold"
            color={isIncome ? colors.incomeText : colors.textSecondary}
            style={styles.segmentText}
          >
            収入 Salary
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setMode('saving')}
          style={[
            styles.segmentButton,
            isSavingMode && {
              backgroundColor: colors.savingBg,
              borderColor: colors.savingBorder,
            },
          ]}
        >
          <AppText
            variant="bodyBold"
            color={isSavingMode ? colors.savingText : colors.textSecondary}
            style={styles.segmentText}
          >
            貯蓄 Saving
          </AppText>
        </TouchableOpacity>
      </View>
      )}

      {/* Amount BentoCard */}
      <BentoCard variant="dark" style={styles.amountCard}>
        <View style={styles.amountTopRow}>
          <AppText variant="caption" color={Colors.textMuted}>
            {isEditing
              ? '支出 / Edit expense'
              : isExpense
              ? '支出 / Expense'
              : isIncome
              ? '収入 / Salary · Income'
              : '貯蓄 / Savings Deposit'}
          </AppText>
          <HankoStamp size="sm" />
        </View>

        <View style={styles.lcdRow}>
          <AppText variant="digital" color={colors.textPrimary} style={styles.lcdText}>
            {amount}
          </AppText>
          <View style={[styles.cursorLine, { backgroundColor: cursorColor }]} />
          <AppText variant="caption" color={colors.textMuted} style={styles.etbLabel}>
            {currency}
          </AppText>
        </View>
      </BentoCard>

      {/* Category / Source / Goal Selection */}
      <BentoCard variant="light" style={styles.categoryCard}>
        <View style={styles.categoryHeaderRow}>
          <AppText variant="caption" color={colors.textSecondary}>
            {isExpense
              ? 'Category'
              : isIncome
              ? 'Income Source'
              : 'Saving Target / Goal'}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {isExpense ? '費目' : isIncome ? '給与・収入源' : '貯蓄目標'}
          </AppText>
        </View>

        <View style={styles.categoryPillsRow}>
          {isExpense &&
            EXPENSE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <PillBadge
                  key={cat.key}
                  variant={isSelected ? 'dark' : 'outline'}
                  label={cat.label}
                  onPress={() => setSelectedCategory(cat.key)}
                />
              );
            })}

          {isIncome &&
            INCOME_SOURCES.map((src) => {
              const isSelected = selectedIncomeSource === src;
              return (
                <PillBadge
                  key={src}
                  variant={isSelected ? 'income' : 'outline'}
                  label={src}
                  onPress={() => setSelectedIncomeSource(src)}
                />
              );
            })}

          {isSavingMode && (
            <>
              {/* General Goals */}
              {SAVING_GOALS.map((goal) => {
                const isSelected =
                  selectedSavingGoal === goal && selectedWishlistId === null;
                return (
                  <PillBadge
                    key={goal}
                    variant={isSelected ? 'dark' : 'outline'}
                    label={goal}
                    onPress={() => {
                      setSelectedSavingGoal(goal);
                      setSelectedWishlistId(null);
                    }}
                  />
                );
              })}

              {/* Wishlist Items Targetable */}
              {unpurchasedWishlist.map((item) => {
                const isSelected = selectedWishlistId === item.id;
                return (
                  <PillBadge
                    key={item.id}
                    variant={isSelected ? 'income' : 'outline'}
                    label={`🎯 ${item.title}`}
                    onPress={() => {
                      setSelectedWishlistId(item.id);
                      setSelectedSavingGoal(item.title);
                    }}
                  />
                );
              })}
            </>
          )}
        </View>
      </BentoCard>

      {/* Note & Date Split Row */}
      <View style={styles.splitRow}>
        <BentoCard variant="light" style={styles.noteCard}>
          <AppText variant="caption" color={colors.textSecondary}>
            {isExpense ? 'Add a note' : isIncome ? 'Source note' : 'Saving note'}
          </AppText>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={
              isExpense
                ? 'Optional'
                : isIncome
                ? 'e.g. Oct Salary'
                : 'e.g. Deposit for trip'
            }
            placeholderTextColor={colors.textMuted}
            style={[styles.noteInput, { color: colors.textPrimary }]}
          />
        </BentoCard>

        <BentoCard variant="dark" style={styles.dateCard}>
          <AppText variant="caption" color={colors.textMuted}>
            Date
          </AppText>
          <AppText
            variant="caption"
            color={colors.textPrimary}
            style={styles.dateValue}
          >
            {formattedDate}
          </AppText>
        </BentoCard>
      </View>

      {/* Digital Keypad */}
      <BentoCard variant="light" style={styles.keypadCard}>
        <View style={styles.keypadGrid}>
          {KEYPAD_KEYS.map((key) => (
            <TouchableOpacity
              key={key}
              activeOpacity={0.6}
              onPress={() => handleKeyPress(key)}
              style={styles.keyButton}
            >
              <AppText style={[key === '⌫' ? styles.backspaceText : styles.keyText, { color: key === '⌫' ? colors.textSecondary : colors.textPrimary }]}>
                {key}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
      </BentoCard>

      {/* Submit Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSave}
        disabled={isSaving}
        style={[
          styles.saveButton,
          {
            backgroundColor: saveBg,
            borderColor: saveBorder,
          },
        ]}
      >
        <AppText variant="bodyBold" color={saveText}>
          {isSaving
            ? 'Saving...'
            : isEditing
            ? 'Save changes'
            : isExpense
            ? 'Save expense'
            : isIncome
            ? 'Save salary / income'
            : 'Save saving deposit'}
        </AppText>
      </TouchableOpacity>

      {isEditing && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleDelete}
          style={[
            styles.deleteButton,
            { borderColor: colors.hankoRed, backgroundColor: colors.card },
          ]}
        >
          <AppText variant="bodyBold" color={colors.hankoRed}>
            Delete expense
          </AppText>
        </TouchableOpacity>
      )}
    </Main>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 999,
    padding: 3,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 10,
    marginTop: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 2,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  segmentText: {
    fontSize: 12,
  },
  amountCard: {
    paddingVertical: 18,
    gap: 12,
  },
  amountTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lcdRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  lcdText: {
    fontSize: 44,
  },
  cursorLine: {
    width: 2,
    height: 34,
    marginLeft: 4,
    marginRight: 10,
    alignSelf: 'center',
  },
  etbLabel: {
    fontSize: 13,
  },
  categoryCard: {
    paddingVertical: 14,
    gap: 10,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 12,
  },
  noteCard: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  noteInput: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.textPrimary,
    paddingVertical: 4,
    marginTop: 4,
  },
  dateCard: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  dateValue: {
    marginTop: 6,
    fontFamily: Fonts.serif,
  },
  keypadCard: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  keyButton: {
    width: '33.33%',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Colors.textPrimary,
  },
  backspaceText: {
    fontFamily: Fonts.sans,
    fontSize: 18,
    color: Colors.textSecondary,
  },
  saveButton: {
    backgroundColor: Colors.cardDark,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  deleteButton: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});
