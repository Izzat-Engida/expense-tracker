import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Main,
  BentoCard,
  AppText,
  HankoStamp,
  ProgressBar,
} from '@/components/ui';
import { Fonts, useThemeColors } from '@/constants/theme';
import { useLedger } from '@/hooks/useLedger';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  CATEGORY_COLOR_KEYS,
  CATEGORY_LABELS,
  addMonths,
  currentMonthKey,
  formatMonthLabel,
  monthlyIncome,
} from '@/lib/ledger';
import type { ExpenseCategory } from '@/db/types';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'food',
  'bills',
  'transport',
  'fun',
  'other',
];

export default function IncomeBudgetModal() {
  const router = useRouter();
  const { colors, isDark } = useThemeColors();
  const currency = useSettingsStore((s) => s.currency);

  const {
    expenses,
    incomes,
    budgets,
    createIncome,
    deleteIncome,
    createBudget,
    updateBudget,
    deleteBudget,
  } = useLedger();

  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [newSource, setNewSource] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [budgetDrafts, setBudgetDrafts] = useState<Record<string, string>>({});
  const [isAddingIncome, setIsAddingIncome] = useState(false);
  const [isSavingBudgets, setIsSavingBudgets] = useState(false);

  const budgetValueFor = (category: ExpenseCategory) => {
    const draftKey = `${monthKey}:${category}`;
    const draft = budgetDrafts[draftKey];
    if (draft !== undefined) return draft;
    const existing = budgets.find(
      (budget) => budget.month_key === monthKey && budget.category === category,
    );
    return existing ? String(existing.percentage_or_limit) : '';
  };

  const monthIncomes = useMemo(
    () => incomes.filter((income) => income.month_key === monthKey),
    [incomes, monthKey],
  );

  const totalIncome = useMemo(
    () => monthlyIncome(incomes, monthKey),
    [incomes, monthKey],
  );

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => expense.date.slice(0, 7) === monthKey),
    [expenses, monthKey],
  );

  const spentByCategory = useMemo(() => {
    const totals: Record<ExpenseCategory, number> = {
      food: 0,
      bills: 0,
      transport: 0,
      fun: 0,
      other: 0,
    };
    for (const expense of monthExpenses) {
      totals[expense.category] += expense.amount;
    }
    return totals;
  }, [monthExpenses]);

  const budgetTotal = EXPENSE_CATEGORIES.reduce((sum, category) => {
    const value = parseFloat(budgetValueFor(category));
    return sum + (Number.isFinite(value) && value > 0 ? value : 0);
  }, 0);

  const handleAddIncome = async () => {
    const source = newSource.trim();
    const amount = parseFloat(newAmount);
    if (!source) {
      Alert.alert('Missing source', 'Please enter where this income came from.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Invalid amount', 'Please enter an amount greater than zero.');
      return;
    }

    setIsAddingIncome(true);
    try {
      await createIncome({
        source_name: source,
        amount,
        month_key: monthKey,
      });
      setNewSource('');
      setNewAmount('');
    } catch (err: any) {
      Alert.alert('Could not add income', err?.message ?? 'Please try again.');
    } finally {
      setIsAddingIncome(false);
    }
  };

  const handleDeleteIncome = (id: string, sourceName: string) => {
    Alert.alert('Remove income', `Remove "${sourceName}" from this month?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteIncome(id);
          } catch (err: any) {
            Alert.alert('Could not remove income', err?.message ?? 'Please try again.');
          }
        },
      },
    ]);
  };

  const handleSaveBudgets = async () => {
    setIsSavingBudgets(true);
    try {
      for (const category of EXPENSE_CATEGORIES) {
        const raw = budgetValueFor(category).trim();
        const value = raw === '' ? 0 : parseFloat(raw);
        if (!Number.isFinite(value) || value < 0) {
          throw new Error(`Enter a valid limit for ${CATEGORY_LABELS[category]}.`);
        }

        const existing = budgets.find(
          (budget) => budget.month_key === monthKey && budget.category === category,
        );

        if (value > 0) {
          if (existing) {
            if (existing.percentage_or_limit !== value) {
              await updateBudget(existing.id, { percentage_or_limit: value });
            }
          } else {
            await createBudget({
              category,
              percentage_or_limit: value,
              month_key: monthKey,
            });
          }
        } else if (existing) {
          await deleteBudget(existing.id);
        }
      }
      Alert.alert('Budgets saved', `Updated limits for ${formatMonthLabel(monthKey)}.`);
    } catch (err: any) {
      Alert.alert('Could not save budgets', err?.message ?? 'Please try again.');
    } finally {
      setIsSavingBudgets(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Main contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerRow}>
        <AppText variant="serifTitle">Income & Budget</AppText>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <AppText variant="body" color={colors.textPrimary}>✕</AppText>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.monthSelectorPill,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => setMonthKey((month) => addMonths(month, -1))}
        >
          <AppText variant="caption" color={colors.textPrimary}>‹</AppText>
        </TouchableOpacity>
        <AppText variant="caption" style={[styles.monthText, { color: colors.textPrimary }]}>
          {formatMonthLabel(monthKey)}
        </AppText>
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => setMonthKey((month) => addMonths(month, 1))}
        >
          <AppText variant="caption" color={colors.textPrimary}>›</AppText>
        </TouchableOpacity>
      </View>

      <BentoCard variant="dark" style={styles.incomeCard}>
        <View style={styles.rowBetween}>
          <AppText variant="caption" color={colors.textMuted}>Monthly income</AppText>
          <HankoStamp size="sm" />
        </View>
        <View style={styles.amountRow}>
          <AppText variant="digital" color={colors.textPrimary}>
            {Math.round(totalIncome).toLocaleString()}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>{currency}</AppText>
        </View>
        <AppText variant="caption" color={colors.textMuted}>
          {monthIncomes.length} source{monthIncomes.length === 1 ? '' : 's'} logged
        </AppText>
      </BentoCard>

      <BentoCard variant="light" style={styles.sectionCard}>
        <AppText variant="caption" color={colors.textSecondary}>
          Income sources
        </AppText>

        {monthIncomes.length === 0 ? (
          <AppText variant="caption" color={colors.textMuted}>
            No income logged for this month yet.
          </AppText>
        ) : (
          monthIncomes.map((income, index) => (
            <View
              key={income.id}
              style={[
                styles.sourceRow,
                index > 0 && [styles.rowBorder, { borderTopColor: colors.divider }],
              ]}
            >
              <View style={styles.sourceInfo}>
                <AppText variant="bodyBold">{income.source_name}</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {Math.round(income.amount).toLocaleString()} {currency}
                </AppText>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Delete ${income.source_name}`}
                onPress={() => handleDeleteIncome(income.id, income.source_name)}
                style={[styles.removeBtn, { borderColor: colors.border }]}
              >
                <AppText variant="caption" color={colors.hankoRed}>✕</AppText>
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <View style={styles.addRow}>
          <TextInput
            value={newSource}
            onChangeText={setNewSource}
            placeholder="Source (e.g. Salary)"
            placeholderTextColor={colors.textMuted}
            returnKeyType="next"
            style={[
              styles.input,
              styles.sourceInput,
              { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background },
            ]}
          />
          <TextInput
            value={newAmount}
            onChangeText={setNewAmount}
            placeholder="Amount"
            keyboardType="numeric"
            returnKeyType="done"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              styles.amountInput,
              { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background },
            ]}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isAddingIncome}
            onPress={handleAddIncome}
            style={[styles.addBtn, { backgroundColor: colors.incomeBg, borderColor: colors.incomeBorder }]}
          >
            <AppText variant="bodyBold" color={colors.incomeText}>
              {isAddingIncome ? '…' : '+'}
            </AppText>
          </TouchableOpacity>
        </View>
      </BentoCard>

      <BentoCard variant="light" style={styles.sectionCard}>
        <View style={styles.rowBetween}>
          <AppText variant="caption" color={colors.textSecondary}>
            Category budget limits
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {Math.round(budgetTotal).toLocaleString()} {currency}
          </AppText>
        </View>

        {EXPENSE_CATEGORIES.map((category) => {
          const limit = parseFloat(budgetValueFor(category));
          const normalizedLimit = Number.isFinite(limit) && limit > 0 ? limit : 0;
          const spent = spentByCategory[category];
          const progress = normalizedLimit > 0 ? spent / normalizedLimit : 0;
          const overBudget = normalizedLimit > 0 && spent > normalizedLimit;

          return (
            <View key={category} style={styles.budgetRow}>
              <View style={styles.budgetHeader}>
                <View style={styles.budgetLabelGroup}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: colors[CATEGORY_COLOR_KEYS[category]] },
                    ]}
                  />
                  <AppText variant="bodyBold">{CATEGORY_LABELS[category]}</AppText>
                </View>
                <TextInput
                  value={budgetValueFor(category)}
                  onChangeText={(value) =>
                    setBudgetDrafts((current) => ({
                      ...current,
                      [`${monthKey}:${category}`]: value,
                    }))
                  }
                  placeholder="0"
                  keyboardType="numeric"
                  returnKeyType="done"
                  selectTextOnFocus
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.budgetInput,
                    {
                      color: colors.textPrimary,
                      borderColor: overBudget ? colors.hankoRed : colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                />
              </View>
              <View style={styles.budgetMetaRow}>
                <AppText variant="caption" color={colors.textMuted} style={styles.budgetMeta}>
                  Spent {Math.round(spent).toLocaleString()}
                </AppText>
                <AppText
                  variant="caption"
                  color={overBudget ? colors.hankoRed : colors.textMuted}
                  style={styles.budgetMeta}
                >
                  {normalizedLimit > 0
                    ? `${Math.round(progress * 100)}% of limit`
                    : 'No limit set'}
                </AppText>
              </View>
              <ProgressBar
                progress={progress}
                fillColor={overBudget ? colors.hankoRed : colors[CATEGORY_COLOR_KEYS[category]]}
                height={5}
              />
            </View>
          );
        })}

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isSavingBudgets}
          onPress={handleSaveBudgets}
          style={[
            styles.saveButton,
            {
              backgroundColor: isDark ? colors.cardElevated : colors.cardDark,
              borderColor: colors.border,
            },
          ]}
        >
          <AppText variant="bodyBold" color="#FFFFFF">
            {isSavingBudgets ? 'Saving…' : 'Save budget limits'}
          </AppText>
        </TouchableOpacity>
      </BentoCard>
    </Main>
  </KeyboardAvoidingView>
);
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthSelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  monthText: {
    fontFamily: Fonts.sansBold,
  },
  incomeCard: {
    paddingVertical: 18,
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  sectionCard: {
    paddingVertical: 16,
    gap: 12,
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  rowBorder: {
    borderTopWidth: 1,
    paddingTop: 10,
  },
  sourceInfo: {
    gap: 2,
    flex: 1,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
    opacity: 0.6,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    borderWidth: 1.2,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
  sourceInput: {
    flex: 1.4,
  },
  amountInput: {
    flex: 1,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetRow: {
    gap: 5,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  budgetLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  budgetInput: {
    width: 96,
    textAlign: 'right',
    borderWidth: 1.2,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontFamily: Fonts.mono,
    fontSize: 13,
  },
  budgetMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetMeta: {
    fontSize: 10,
  },
  saveButton: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
