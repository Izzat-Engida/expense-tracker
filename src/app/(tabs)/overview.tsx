import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Fonts, useThemeColors } from '@/constants/theme';
import {
  Main,
  BentoCard,
  AppText,
  HankoStamp,
  ProgressBar,
} from '@/components/ui';
import { useLedger } from '@/hooks/useLedger';
import {
  addMonths,
  currentMonthKey,
  formatCompactAmount,
  formatMonthLabel,
  getOverviewSummary,
} from '@/lib/ledger';

export default function OverviewScreen() {
  const { colors, isDark } = useThemeColors();
  const { expenses, isInitialized, error } = useLedger();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

  const summary = useMemo(
    () => getOverviewSummary(expenses, selectedMonth),
    [expenses, selectedMonth],
  );

  const hasData = summary.totalSpent > 0;
  const axisLabels = [
    1,
    7,
    14,
    21,
    summary.days,
  ];

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
            ETB 
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
                ETB
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

          <BentoCard variant="light" style={styles.categoryCard}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" color={colors.textSecondary}>
                By category
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                ETB
              </AppText>
            </View>

            <View style={styles.categoryList}>
              {summary.categoryRows.map((item) => (
                <View key={item.category} style={styles.categoryItem}>
                  <View style={styles.rowBetween}>
                    <View style={styles.catLabelGroup}>
                      <AppText variant="bodyBold">{item.label}</AppText>
                    </View>

                    <View style={styles.catNumbersGroup}>
                      <AppText variant="bodyBold" style={styles.catAmount}>
                        {Math.round(item.amount).toLocaleString()}
                      </AppText>
                      <AppText
                        variant="caption"
                        color={colors.textMuted}
                        style={styles.catPercent}
                      >
                        {item.percentText}
                      </AppText>
                    </View>
                  </View>

                  <ProgressBar
                    progress={item.progress}
                    fillColor={colors[item.colorKey]}
                    height={6}
                  />
                </View>
              ))}
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
  categoryCard: {
    paddingVertical: 16,
    gap: 14,
  },
  categoryList: {
    gap: 14,
  },
  categoryItem: {
    gap: 6,
  },
  catLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft:5
  },
 
  catNumbersGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  catAmount: {
    fontFamily: Fonts.serif,
  },
  catPercent: {
    width: 38,
    textAlign: 'right',
    fontSize: 11,
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
