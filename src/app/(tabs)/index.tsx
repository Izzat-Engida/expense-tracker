import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import {
  Main,
  BentoCard,
  AppText,
  PillBadge,
  JapaneseIcon,
} from '@/components/ui';
import DaySection from '@/components/ui/DaySection'
import { Fonts, useThemeColors } from '@/constants/theme';
import { useLedger } from '@/hooks/useLedger';
import { useAuthStore } from '@/stores/authStore';
import { useSyncStore } from '@/stores/syncStore';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  formatMonthKanji,
  formatMonthLabel,
  getHomeSummary,
  computeSpendingStreak,
} from '@/lib/ledger';

export default function HomeScreen() {
  const { colors } = useThemeColors();
  const currency = useSettingsStore((s) => s.currency);
  const dailyLimit = useSettingsStore((s) => s.dailyLimit);
  const { expenses, incomes, budgets, savings, deleteSaving, applyRecurringExpenses, isInitialized, error } = useLedger();
  const activeAccount = useAuthStore((s) => s.activeAccount);
  const { syncStatus, isDeviceOnline, pendingCount, autoSyncIfConnected, refreshStatus } = useSyncStore();

  useEffect(() => {
    if (isInitialized) {
      applyRecurringExpenses();
    }
  }, [isInitialized, applyRecurringExpenses]);

  useEffect(() => {
    if (!activeAccount?.isLocal) {
      refreshStatus();
      autoSyncIfConnected();
    }
  }, [activeAccount?.isLocal, refreshStatus, autoSyncIfConnected]);

  const summary = useMemo(
    () => getHomeSummary(expenses, incomes, budgets),
    [expenses, incomes, budgets],
  );

  const { monthKey, monthSpent, monthIncome, budgetTotal, budgetPercent } =
    summary;
  const [monthName, yearLabel] = formatMonthLabel(monthKey).split(' ');
  const overBudget = budgetTotal > 0 && monthSpent > budgetTotal;
  const budgetColor = overBudget ? colors.hankoRed : colors.bambooGreen;
  const hasDayData = summary.today.expenses.length > 0 || summary.yesterday.expenses.length > 0;

  const totalSavings = useMemo(
    () => savings.reduce((sum, saving) => sum + saving.amount, 0),
    [savings],
  );
  const recentSavings = useMemo(() => savings.slice(0, 3), [savings]);

  const streakResult = useMemo(
    () => computeSpendingStreak(expenses, dailyLimit),
    [expenses, dailyLimit],
  );

  const handleDeleteSaving = (id: string, title: string) => {
    Alert.alert('Delete saving', `Remove "${title}" from your savings history?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSaving(id);
          } catch (err) {
            console.warn('Failed to delete saving:', err);
          }
        },
      },
    ]);
  };

  if (!isInitialized) {
    return (
      <Main>
        <BentoCard variant="light" style={styles.statusCard}>
          <AppText variant="bodyBold">Loading ledger…</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Preparing your ledger…
          </AppText>
        </BentoCard>
      </Main>
    );
  }

  if (error) {
    return (
      <Main showArt artOpacity={0.11}>
        <BentoCard variant="light" style={styles.statusCard}>
          <AppText variant="bodyBold">Could not load your ledger</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {error}
          </AppText>
        </BentoCard>
      </Main>
    );
  }

  return (
    <Main showArt artOpacity={0.11}>
      <BentoCard variant="light" style={styles.monthHeaderCard}>
        <View style={styles.monthLeft}>
          <AppText style={styles.kanjiMonth}>{formatMonthKanji(monthKey)}</AppText>
          <View style={[styles.verticalDivider, { backgroundColor: colors.divider }]} />
          <View>
            <AppText variant="bodyBold" style={styles.monthTitle}>
              {monthName}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {yearLabel}
            </AppText>
          </View>
        </View>
        {activeAccount?.isLocal ? (
          <View style={styles.syncStatusBtn}>
            <AppText
              variant="caption"
              color={colors.textPrimary}
              style={{ fontWeight: '600' }}
              numberOfLines={1}
            >
              {activeAccount.name || 'Guest'}
            </AppText>
            <AppText
              variant="caption"
              color={colors.textMuted}
            >
              Local
            </AppText>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/modals/sync-status')}
            style={styles.syncStatusBtn}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor:
                    syncStatus === 'syncing'
                      ? colors.categoryFun
                      : !isDeviceOnline
                      ? colors.textMuted
                      : pendingCount > 0
                      ? colors.categoryFood
                      : colors.bambooGreen,
                }}
              />
              <AppText variant="caption" color={colors.textSecondary}>
                {syncStatus === 'syncing'
                  ? 'Syncing…'
                  : !isDeviceOnline
                  ? 'Offline'
                  : pendingCount > 0
                  ? `${pendingCount} queued`
                  : 'Synced'}
              </AppText>
            </View>
            {activeAccount && (
              <AppText
                variant="caption"
                color={colors.textMuted}
                numberOfLines={1}
              >
                {activeAccount.name}
              </AppText>
            )}
          </TouchableOpacity>
        )}
      </BentoCard>

      <View style={styles.bentoRow}>
        <BentoCard variant="dark" style={styles.spentCard}>
          <AppText variant="caption" color={colors.textMuted}>
            Spent this month
          </AppText>
          <View style={styles.spentAmountRow}>
            <AppText variant="digital" color={colors.textPrimary} style={{ fontVariant: ['tabular-nums'] }}>
              {Math.round(monthSpent).toLocaleString()}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {currency}
            </AppText>
          </View>
          <PillBadge
            variant="income"
            label={
              monthIncome > 0
                ? `Income ${Math.round(monthIncome).toLocaleString()} ${currency}`
                : 'No income logged'
            }
            onPress={() => router.push('/modals/income-budget')}
          />
        </BentoCard>

        <BentoCard variant="light" style={styles.budgetCard}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.budgetTouchArea}
            onPress={() => router.push('/modals/income-budget')}
          >
            <View style={[styles.budgetCircle, { borderColor: budgetTotal > 0 ? budgetColor : colors.border }]}>
              <AppText variant="bodyBold" style={styles.budgetPercent}>
                {budgetTotal > 0 ? `${budgetPercent}%` : '—'}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} style={styles.budgetSub}>
                used
              </AppText>
            </View>

            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {budgetTotal > 0
                ? `${Math.round(monthSpent).toLocaleString()} / ${Math.round(budgetTotal).toLocaleString()} ${currency}`
                : 'No budget set'}
            </AppText>
          </TouchableOpacity>
        </BentoCard>
      </View>

      {hasDayData ? (
        <BentoCard variant="light" style={styles.ledgerCard}>
          <DaySection group={summary.today} badgeVariant="dark" />
          <DaySection group={summary.yesterday} badgeVariant="outline" showDivider />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/modals/ledger-history')}
            style={[styles.allTransactionsBtn, { borderColor: colors.border, backgroundColor: colors.cardElevated }]}
          >
            <AppText variant="bodyBold" style={{ fontSize: 12 }}>
              View all transactions ({expenses.length})
            </AppText>
          </TouchableOpacity>
        </BentoCard>
      ) : (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/modals/add-expense')}
          accessibilityRole="button"
          accessibilityLabel="Add expense"
        >
          <BentoCard variant="light" style={styles.emptyCard}>
            <AppText variant="bodyBold">No expenses recorded yet</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Tap below to log your first transaction.
            </AppText>
          </BentoCard>
        </TouchableOpacity>
      )}

      {savings.length > 0 && (
        <BentoCard variant="light" style={styles.savingsCard}>
          <View style={styles.savingsHeaderRow}>
            <AppText variant="caption" color={colors.textSecondary}>
              Savings
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {savings.length} {savings.length === 1 ? 'entry' : 'entries'}
            </AppText>
          </View>

          <View style={styles.savingsTotalRow}>
            <AppText variant="serifTitle" style={styles.savingsTotal}>
              {Math.round(totalSavings).toLocaleString()}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {currency} saved
            </AppText>
          </View>

          {recentSavings.map((saving, index) => (
            <View
              key={saving.id}
              style={[
                styles.savingsRow,
                index > 0 && [styles.savingsRowBorder, { borderTopColor: colors.divider }],
              ]}
            >
              <View style={styles.savingsInfo}>
                <AppText variant="bodyBold" numberOfLines={1}>
                  {saving.title}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                  {saving.category}
                  {saving.note ? ` · ${saving.note}` : ''}
                </AppText>
              </View>
              <View style={styles.savingsRight}>
                <AppText variant="bodyBold">
                  {Math.round(saving.amount).toLocaleString()}
                </AppText>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Delete saving ${saving.title}`}
                  onPress={() => handleDeleteSaving(saving.id, saving.title)}
                  style={[styles.savingsDeleteBtn, { borderColor: colors.border }]}
                >
                  <AppText variant="caption" color={colors.textMuted}>
                    ✕
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {savings.length > recentSavings.length && (
            <AppText variant="caption" color={colors.textMuted}>
              +{savings.length - recentSavings.length} more in the ledger
            </AppText>
          )}
        </BentoCard>
      )}

      <BentoCard variant="light" style={styles.streakCard}>
        <View style={styles.streakHeaderRow}>
          <AppText variant="caption" color={colors.textSecondary}>
            Spending streak
          </AppText>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/settings' as any)}
          >
            <AppText variant="caption" color={colors.textMuted} style={{ fontSize: 11 }}>
              {dailyLimit > 0 ? `Limit: ${Math.round(dailyLimit).toLocaleString()} ${currency}` : 'Set daily limit'}
            </AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.streakCountRow}>
          <AppText variant="serifTitle" style={styles.streakNumber}>
            {streakResult.streak}
          </AppText>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyBold">
              {streakResult.streak === 1 ? 'day' : 'days'} clean
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {streakResult.isCleanToday
                ? dailyLimit > 0
                  ? `Today: ${Math.round(streakResult.todayAmount).toLocaleString()} / ${Math.round(dailyLimit).toLocaleString()} ${currency}`
                  : 'No spending today'
                : `Today: ${Math.round(streakResult.todayAmount).toLocaleString()} ${currency} ${dailyLimit > 0 ? '(over limit)' : '(spending day)'}`}
            </AppText>
          </View>
          <View style={[
            styles.streakBadge,
            { backgroundColor: streakResult.isCleanToday ? colors.bambooGreen : colors.cardElevated,
              borderColor: streakResult.isCleanToday ? colors.bambooGreen : colors.border }
          ]}>
            <JapaneseIcon
              name={streakResult.streak >= 30 ? 'kiku' : streakResult.streak >= 7 ? 'sakura' : streakResult.isCleanToday ? 'enso' : 'take'}
              size={20}
              color={streakResult.isCleanToday ? '#FFFFFF' : colors.textPrimary}
            />
          </View>
        </View>

        {streakResult.longestStreak > 0 && (
          <AppText variant="caption" color={colors.textMuted}>
            Best: {streakResult.longestStreak} {streakResult.longestStreak === 1 ? 'day' : 'days'} clean
          </AppText>
        )}
      </BentoCard>
    </Main>
  );
}


const styles = StyleSheet.create({
  monthHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  monthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  kanjiMonth: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    lineHeight: 22,
  },
  verticalDivider: {
    width: 1,
    height: 32,
  },
  monthTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    lineHeight: 22,
  },
  syncStatusBtn: {
    alignItems: 'flex-end',
    gap: 2,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  spentCard: {
    flex: 1.45,
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  spentAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  budgetCard: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  budgetTouchArea: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  budgetCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetPercent: {
    fontSize: 16,
  },
  budgetSub: {
    fontSize: 10,
  },
  ledgerCard: {
    padding: 16,
    gap: 8,
  },
  allTransactionsBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
 
  emptyCard: {
    paddingVertical: 24,
    gap: 6,
  },
  savingsCard: {
    padding: 16,
    gap: 12,
  },
  savingsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingsTotalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  savingsTotal: {
    fontSize: 24,
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  savingsRowBorder: {
    borderTopWidth: 1,
    paddingTop: 8,
  },
  savingsInfo: {
    flex: 1,
    gap: 2,
  },
  savingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savingsDeleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusCard: {
    paddingVertical: 24,
    gap: 6,
  },
  streakCard: {
    padding: 16,
    gap: 12,
  },
  streakHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakNumber: {
    fontSize: 36,
    lineHeight: 40,
  },
  streakBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
