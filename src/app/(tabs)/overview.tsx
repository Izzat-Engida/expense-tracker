import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Fonts, useThemeColors } from '@/constants/theme';
import {
  Main,
  BentoCard,
  AppText,
  HankoStamp,
} from '@/components/ui';
import { DonutChart, TrendLineChart, VerticalBarChart } from '@/components/charts';
import { useLedger } from '@/hooks/useLedger';
import { useSettingsStore } from '@/stores/settingsStore';
import {
  addMonths,
  cumulativeSeries,
  currentMonthKey,
  formatCompactAmount,
  formatMonthLabel,
  getMonthlyTrend,
  getOverviewSummary,
  getWeekdaySpending,
  monthlyIncome,
} from '@/lib/ledger';

export default function OverviewScreen() {
  const { colors, isDark } = useThemeColors();
  const { expenses, incomes, isInitialized, error } = useLedger();
  const currency = useSettingsStore((s) => s.currency);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

  const summary = useMemo(
    () => getOverviewSummary(expenses, selectedMonth),
    [expenses, selectedMonth],
  );

  const monthIncome = useMemo(
    () => monthlyIncome(incomes, selectedMonth),
    [incomes, selectedMonth],
  );

  const weekdaySpending = useMemo(
    () => getWeekdaySpending(summary.monthExpenses),
    [summary.monthExpenses],
  );

  const monthlyTrend = useMemo(
    () => getMonthlyTrend(expenses, selectedMonth, 6),
    [expenses, selectedMonth],
  );

  const cumulative = useMemo(
    () => cumulativeSeries(summary.dailyBars),
    [summary.dailyBars],
  );

  const categoryData = useMemo(
    () =>
      summary.categoryRows.map((row) => ({
        label: row.label,
        value: row.amount,
        color: colors[row.colorKey],
      })),
    [summary.categoryRows, colors],
  );

  const hasData = summary.totalSpent > 0;
  const net = monthIncome - summary.totalSpent;
  const axisLabels = [1, 7, 14, 21, summary.days];

  if (!isInitialized) {
    return (
      <Main>
        <BentoCard variant="light" style={styles.statusCard}>
          <AppText variant="bodyBold">Loading overview…</AppText>
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
      <View style={styles.headerRow}>
        <AppText variant="serifTitle">Overview</AppText>

        <View
          style={[
            styles.monthSelectorPill,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => setSelectedMonth((month) => addMonths(month, -1))}
          >
            <AppText variant="caption" color={colors.textPrimary}>
              ‹
            </AppText>
          </TouchableOpacity>
          <AppText
            variant="caption"
            style={[styles.monthPillText, { color: colors.textPrimary }]}
          >
            {formatMonthLabel(selectedMonth)}
          </AppText>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => setSelectedMonth((month) => addMonths(month, 1))}
          >
            <AppText variant="caption" color={colors.textPrimary}>
              ›
            </AppText>
          </TouchableOpacity>
        </View>
      </View>

      <BentoCard variant="dark" style={styles.totalCard}>
        <View style={styles.rowBetween}>
          <AppText variant="caption" color={colors.textMuted}>
            支出 / Total spent
          </AppText>
          <HankoStamp size="sm" />
        </View>

        <View style={styles.amountRow}>
          <AppText variant="digital" color={colors.textPrimary}>
            {Math.round(summary.totalSpent).toLocaleString()}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {currency}
          </AppText>
        </View>
      </BentoCard>

      {hasData ? (
        <>
          <BentoCard variant="light" style={styles.chartCard}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" color={colors.textSecondary}>
                Daily spending
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {currency}
              </AppText>
            </View>

            <View style={styles.chartBody}>
              <View style={styles.plotArea}>
                <View
                  style={[styles.gridLine, { top: '10%', backgroundColor: colors.divider }]}
                />
                <View
                  style={[styles.gridLine, { top: '55%', backgroundColor: colors.divider }]}
                />
                <View
                  style={[styles.gridLine, { bottom: 0, backgroundColor: colors.divider }]}
                />

                <View
                  style={[
                    styles.barsRow,
                    { gap: summary.days > 20 ? 2 : 4 },
                  ]}
                >
                  {summary.dailyBars.map((bar) => (
                    <View key={bar.day} style={styles.barColumn}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${bar.progress * 100}%`,
                            backgroundColor: bar.isPeak
                              ? colors.hankoRed
                              : isDark
                              ? colors.cardElevated
                              : colors.cardDark,
                            borderColor:
                              isDark && bar.amount > 0 && !bar.isPeak
                                ? colors.border
                                : 'transparent',
                            borderWidth: isDark && bar.amount > 0 && !bar.isPeak ? 1 : 0,
                          },
                        ]}
                      />
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.yAxis}>
                <AppText variant="caption" color={colors.textMuted} style={styles.axisText}>
                  {formatCompactAmount(summary.maxDaily)}
                </AppText>
                <AppText variant="caption" color={colors.textMuted} style={styles.axisText}>
                  {formatCompactAmount(summary.maxDaily / 2)}
                </AppText>
                <AppText variant="caption" color={colors.textMuted} style={styles.axisText}>
                  0
                </AppText>
              </View>
            </View>

            <View style={styles.xAxis}>
              {axisLabels.map((day) => (
                <AppText
                  key={day}
                  variant="caption"
                  color={colors.textMuted}
                  style={styles.axisText}
                >
                  {String(day).padStart(2, '0')}
                </AppText>
              ))}
            </View>
          </BentoCard>

          <BentoCard variant="light" style={styles.chartCard}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" color={colors.textSecondary}>
                By category
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {currency}
              </AppText>
            </View>
            <DonutChart
              data={categoryData}
              centerLabel={formatCompactAmount(summary.totalSpent)}
              centerSubLabel={currency}
            />
          </BentoCard>

          <BentoCard variant="light" style={styles.chartCard}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" color={colors.textSecondary}>
                Spending pace
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {formatCompactAmount(summary.totalSpent)} {currency}
              </AppText>
            </View>
            <TrendLineChart
              points={cumulative}
              labels={summary.dailyBars.map((bar) => String(bar.day))}
              color={colors.bambooGreen}
            />
          </BentoCard>

          <BentoCard variant="light" style={styles.chartCard}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" color={colors.textSecondary}>
                By weekday
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {currency}
              </AppText>
            </View>
            <VerticalBarChart
              data={weekdaySpending.map((day) => ({
                label: day.label,
                value: day.amount,
                color: colors.categoryTransport,
              }))}
              height={116}
              showValues={false}
            />
          </BentoCard>

          <BentoCard variant="light" style={styles.chartCard}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" color={colors.textSecondary}>
                Six-month trend
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {currency}
              </AppText>
            </View>
            <VerticalBarChart
              data={monthlyTrend.map((month) => ({
                label: month.label,
                value: month.amount,
                color: colors.categoryFun,
              }))}
              height={116}
              showValues
            />
          </BentoCard>

          <BentoCard variant="light" style={styles.chartCard}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" color={colors.textSecondary}>
                Income vs expense
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {formatMonthLabel(selectedMonth)}
              </AppText>
            </View>
            <VerticalBarChart
              data={[
                { label: 'Income', value: monthIncome, color: colors.bambooGreen },
                { label: 'Spent', value: summary.totalSpent, color: colors.hankoRed },
              ]}
              height={104}
              showValues
            />
            <View style={[styles.netRow, { borderTopColor: colors.divider }]}>
              <AppText variant="caption" color={colors.textSecondary}>
                Net this month
              </AppText>
              <AppText
                variant="bodyBold"
                color={net >= 0 ? colors.positiveText : colors.negativeText}
              >
                {net >= 0 ? '+' : '-'}
                {Math.round(Math.abs(net)).toLocaleString()} {currency}
              </AppText>
            </View>
          </BentoCard>
        </>
      ) : (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/modals/add-expense')}
          accessibilityRole="button"
          accessibilityLabel="Add expense"
        >
          <BentoCard variant="light" style={styles.emptyCard}>
            <AppText variant="bodyBold">
              No expenses in {formatMonthLabel(selectedMonth)}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Tap here or the stamp below to add an expense.
            </AppText>
          </BentoCard>
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
  },
  monthSelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  monthPillText: {
    fontFamily: Fonts.sansBold,
  },
  totalCard: {
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
    gap: 8,
  },
  chartCard: {
    paddingVertical: 16,
    gap: 12,
  },
  chartBody: {
    flexDirection: 'row',
    height: 110,
    gap: 10,
  },
  plotArea: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: '88%',
    gap: 5,
    paddingHorizontal: 4,
  },
  barColumn: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  yAxis: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 4,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 28,
  },
  axisText: {
    fontSize: 10,
  },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  emptyCard: {
    paddingVertical: 24,
    gap: 6,
  },
  statusCard: {
    paddingVertical: 24,
    gap: 6,
  },
});
