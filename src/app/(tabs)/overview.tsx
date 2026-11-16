import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Fonts, useThemeColors } from '@/constants/theme';
import {
  Main,
  BentoCard,
  AppText,
  HankoStamp,
  PillBadge,
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
  getYearSummary,
  monthlyIncome,
} from '@/lib/ledger';

export default function OverviewScreen() {
  const { colors, isDark } = useThemeColors();
  const { expenses, incomes, savings, budgets, isInitialized, error } = useLedger();
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

  const selectedYear = Number(selectedMonth.split('-')[0]);

  const yearSummary = useMemo(
    () => getYearSummary(expenses, incomes, budgets, savings, selectedYear),
    [expenses, incomes, budgets, savings, selectedYear],
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
            Preparing your ledger…
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
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 4 }}
            onPress={() => setSelectedMonth((month) => addMonths(month, -1))}
            style={styles.monthArrowBtn}
          >
            <AppText variant="bodyBold" color={colors.textPrimary}>
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
            hitSlop={{ top: 12, bottom: 12, left: 4, right: 12 }}
            onPress={() => setSelectedMonth((month) => addMonths(month, 1))}
            style={styles.monthArrowBtn}
          >
            <AppText variant="bodyBold" color={colors.textPrimary}>
              ›
            </AppText>
          </TouchableOpacity>
        </View>
      </View>

      <BentoCard variant="dark" style={styles.totalCard}>
        <View style={styles.rowBetween}>
          <AppText variant="caption" color={colors.textMuted}>
            Total spent
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

          {/* ─── Year Summary ─── */}
          <BentoCard variant="dark" style={styles.yearSummaryCard}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" color={colors.textMuted}>
                {selectedYear} summary
              </AppText>
              <HankoStamp size="sm" />
            </View>

            <View style={styles.yearStatsGrid}>
              <View style={styles.yearStatItem}>
                <AppText variant="caption" color={colors.textMuted}>Income</AppText>
                <AppText variant="bodyBold" color={colors.bambooGreen}>
                  {Math.round(yearSummary.totalIncome).toLocaleString()}
                </AppText>
              </View>
              <View style={styles.yearStatItem}>
                <AppText variant="caption" color={colors.textMuted}>Spent</AppText>
                <AppText variant="bodyBold" color={colors.hankoRed}>
                  {Math.round(yearSummary.totalSpent).toLocaleString()}
                </AppText>
              </View>
              <View style={styles.yearStatItem}>
                <AppText variant="caption" color={colors.textMuted}>Saved</AppText>
                <AppText variant="bodyBold" color={colors.categoryTransport}>
                  {Math.round(yearSummary.totalSaved).toLocaleString()}
                </AppText>
              </View>
              <View style={styles.yearStatItem}>
                <AppText variant="caption" color={colors.textMuted}>Net</AppText>
                <AppText
                  variant="bodyBold"
                  color={yearSummary.net >= 0 ? colors.positiveText : colors.negativeText}
                >
                  {yearSummary.net >= 0 ? '+' : '-'}
                  {Math.round(Math.abs(yearSummary.net)).toLocaleString()}
                </AppText>
              </View>
            </View>

            <AppText variant="caption" color={colors.textMuted} style={styles.yearCurrencyNote}>
              All values in {currency}
            </AppText>
          </BentoCard>

          <BentoCard variant="light" style={styles.chartCard}>
            <AppText variant="caption" color={colors.textSecondary}>
              Monthly budget health
            </AppText>
            <View style={styles.monthHealthGrid}>
              {yearSummary.months.map((m) => {
                const hasActivity = m.spent > 0 || m.income > 0;
                const currentMonthIndex = Number(selectedMonth.split('-')[1]);
                const monthIndex = Number(m.monthKey.split('-')[1]);
                const isSelectedMonth = monthIndex === currentMonthIndex;

                return (
                  <TouchableOpacity
                    key={m.monthKey}
                    activeOpacity={0.7}
                    onPress={() => setSelectedMonth(m.monthKey)}
                    style={[
                      styles.monthHealthItem,
                      {
                        backgroundColor: isSelectedMonth
                          ? (isDark ? colors.cardElevated : colors.cardDark)
                          : (isDark ? 'rgba(255,255,255,0.05)' : colors.cardElevated),
                        borderColor: m.overBudget
                          ? colors.hankoRed
                          : hasActivity
                          ? colors.bambooGreen
                          : colors.divider,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      color={isSelectedMonth ? colors.textInverse : colors.textPrimary}
                      style={styles.monthHealthLabel}
                    >
                      {m.label}
                    </AppText>
                    {hasActivity ? (
                      <>
                        <AppText
                          variant="caption"
                          color={
                            m.overBudget
                              ? colors.hankoRed
                              : isSelectedMonth
                              ? colors.textInverse
                              : colors.textSecondary
                          }
                          style={styles.monthHealthAmount}
                        >
                          {formatCompactAmount(m.spent)}
                        </AppText>
                        {m.overBudget && (
                          <AppText variant="caption" color={colors.hankoRed} style={styles.monthHealthOver}>
                            OVER
                          </AppText>
                        )}
                      </>
                    ) : (
                      <AppText
                        variant="caption"
                        color={isSelectedMonth ? colors.textInverse : colors.textMuted}
                        style={styles.monthHealthAmount}
                      >
                        —
                      </AppText>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </BentoCard>

          {/* ─── Kakeibo Monthly Reflection ─── */}
          <BentoCard variant="light" style={styles.chartCard}>
            <View style={styles.rowBetween}>
              <View>
                <AppText variant="caption" color={colors.textSecondary}>
                  Monthly reflection
                </AppText>
                <AppText variant="bodyBold">
                  {formatMonthLabel(selectedMonth)}
                </AppText>
              </View>
              <PillBadge
                variant={net >= 0 ? 'income' : 'expense'}
                label={net >= 0 ? 'Room for Clarity (余白あり)' : 'Overdrawn (超過)'}
              />
            </View>

            <View style={[styles.kakeiboBox, { backgroundColor: colors.cardElevated, borderColor: colors.divider }]}>
              <View style={styles.kakeiboQuestion}>
                <AppText variant="caption" color={colors.textSecondary} style={{ fontFamily: Fonts.sansBold }}>
                  1. How much came in?
                </AppText>
                <AppText variant="caption" color={colors.bambooGreen} style={{ fontFamily: Fonts.mono }}>
                  +{Math.round(monthIncome).toLocaleString()} {currency}
                </AppText>
              </View>

              <View style={styles.kakeiboQuestion}>
                <AppText variant="caption" color={colors.textSecondary} style={{ fontFamily: Fonts.sansBold }}>
                  2. How much was spent?
                </AppText>
                <AppText variant="caption" color={colors.hankoRed} style={{ fontFamily: Fonts.mono }}>
                  -{Math.round(summary.totalSpent).toLocaleString()} {currency}
                </AppText>
              </View>

              <View style={styles.kakeiboQuestion}>
                <AppText variant="caption" color={colors.textSecondary} style={{ fontFamily: Fonts.sansBold }}>
                  3. Net remaining margin:
                </AppText>
                <AppText
                  variant="caption"
                  color={net >= 0 ? colors.positiveText : colors.negativeText}
                  style={{ fontFamily: Fonts.mono }}
                >
                  {net >= 0 ? '+' : ''}{Math.round(net).toLocaleString()} {currency}
                </AppText>
              </View>

              <View style={[styles.kakeiboDivider, { backgroundColor: colors.divider }]} />

              <AppText variant="caption" color={colors.textSecondary} style={{ fontStyle: 'italic', lineHeight: 16 }}>
                {net >= 0
                  ? '「心に余裕を持ち、無駄なく暮らす」— Living with intention leaves room for peace and saving.'
                  : '「足るを知る」— Review wants vs needs next month to restore balance to your ledger.'}
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
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  monthArrowBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
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
  yearSummaryCard: {
    paddingVertical: 18,
    gap: 14,
  },
  yearStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  yearStatItem: {
    flex: 1,
    minWidth: '40%',
    gap: 2,
  },
  yearCurrencyNote: {
    fontSize: 10,
    textAlign: 'right',
  },
  monthHealthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthHealthItem: {
    width: '22%',
    flexGrow: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
  },
  monthHealthLabel: {
    fontSize: 11,
    fontFamily: Fonts.sansBold,
    letterSpacing: 0.5,
  },
  monthHealthAmount: {
    fontSize: 11,
    fontFamily: Fonts.mono,
  },
  monthHealthOver: {
    fontSize: 8,
    fontFamily: Fonts.sansBold,
    letterSpacing: 1,
  },
  kakeiboBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  kakeiboQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kakeiboDivider: {
    height: 1,
    width: '100%',
    marginVertical: 2,
    opacity: 0.6,
  },
});
