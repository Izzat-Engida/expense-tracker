import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import {
  Main,
  BentoCard,
  AppText,
  PillBadge,
  ProgressBar,
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
} from '@/lib/ledger';

export default function HomeScreen() {
  const { colors } = useThemeColors();
  const currency = useSettingsStore((s) => s.currency);
  const { expenses, incomes, budgets, savings, deleteSaving, isInitialized, error } = useLedger();
  const activeAccount = useAuthStore((s) => s.activeAccount);
  const { syncStatus, isDeviceOnline, pendingCount, autoSyncIfConnected, refreshStatus } = useSyncStore();

  useEffect(() => {
    refreshStatus();
    autoSyncIfConnected();
  }, [refreshStatus, autoSyncIfConnected]);

  const summary = useMemo(
    () => getHomeSummary(expenses, incomes, budgets),
    [expenses, incomes, budgets],
  );

  const { monthKey, monthSpent, monthIncome, budgetTotal, budgetProgress, budgetPercent } =
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
            Reading your local database.
          </AppText>
        </BentoCard>
      </Main>
    );
  }

  if (error) {
    return (
      <Main>
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
    <Main>
      <BentoCard variant="light" art="crane" style={styles.monthHeaderCard}>
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
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/modals/sync-status')}
          style={styles.syncStatusBtn}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <AppText
              variant="caption"
              color={
                syncStatus === 'syncing'
                  ? colors.categoryFun
                  : !isDeviceOnline
                  ? colors.hankoRed
                  : pendingCount > 0
                  ? colors.categoryFood
                  : colors.bambooGreen
              }
            >
              ●
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {syncStatus === 'syncing'
                ? 'Syncing…'
                : !isDeviceOnline
                ? 'Offline'
                : pendingCount > 0
                ? `${pendingCount} queued`
                : 'Cloud synced'}
            </AppText>
          </View>
          {activeAccount && (
            <AppText
              variant="caption"
              color={colors.textMuted}
              style={{ fontSize: 9, letterSpacing: 0.5 }}
              numberOfLines={1}
            >
              {activeAccount.name}
            </AppText>
          )}
        </TouchableOpacity>
      </BentoCard>

      <View style={styles.bentoRow}>
        <BentoCard variant="dark" style={styles.spentCard}>
          <AppText variant="caption" color={colors.textMuted}>
            支出 · SPENT
          </AppText>
          <View style={styles.spentAmountRow}>
            <AppText variant="digital" color={colors.textPrimary}>
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
                ? `収入 ${Math.round(monthIncome).toLocaleString()} ${currency} income`
                : '収入 No income yet'
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
            <View style={[styles.budgetCircle, { borderColor: budgetColor }]}>
              <AppText variant="bodyBold" style={styles.budgetPercent}>
                {budgetTotal > 0 ? `${budgetPercent}%` : '—'}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} style={styles.budgetSub}>
                of budget
              </AppText>
            </View>
            <View style={styles.budgetBarWrap}>
              <ProgressBar progress={budgetProgress} fillColor={budgetColor} height={6} />
            </View>

            <AppText variant="caption" color={colors.textSecondary}>
              {budgetTotal > 0
                ? `${Math.round(budgetTotal).toLocaleString()} ${currency}`
                : 'No budget set'}
            </AppText>
          </TouchableOpacity>
        </BentoCard>
      </View>

      {hasDayData ? (
        <BentoCard variant="light" style={styles.ledgerCard}>
          <DaySection group={summary.today} badgeVariant="dark" />
          <DaySection group={summary.yesterday} badgeVariant="outline" showDivider />
        </BentoCard>
      ) : (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/modals/add-expense')}
          accessibilityRole="button"
          accessibilityLabel="Add expense"
        >
          <BentoCard variant="light" style={styles.emptyCard}>
            <AppText variant="bodyBold">Nothing logged yet</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Tap here or the stamp below to add your first expense.
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
                  <AppText variant="caption" color={colors.hankoRed}>
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
    width: 1.5,
    height: 34,
  },
  monthTitle: {
    fontSize: 18,
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
    paddingVertical: 16,
    gap: 10,
  },
  spentAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  budgetCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  budgetTouchArea: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  budgetCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetPercent: {
    fontSize: 17,
  },
  budgetSub: {
    fontSize: 10,
  },
  budgetBarWrap: {
    width: '100%',
  },
  ledgerCard: {
    paddingVertical: 16,
    gap: 8,
  },
 
  emptyCard: {
    paddingVertical: 24,
    gap: 6,
  },
  savingsCard: {
    paddingVertical: 16,
    gap: 10,
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
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusCard: {
    paddingVertical: 24,
    gap: 6,
  },
});
