import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';
import{
Main,
BentoCard,
AppText,
HankoStamp,
ProgressBar
} from '@/components/ui';

interface CategoryStat {
  name: string;
  amount: number;
  percentText: string;
  progress: number;
  color: string;
}
const CATEGORY_STATS: CategoryStat[] = [
  { name: 'Food', amount: 4680, percentText: '37.5%', progress: 0.375, color: Colors.categoryFood },
  { name: 'Bills', amount: 4200, percentText: '33.7%', progress: 0.337, color: Colors.categoryBills },
  { name: 'Transport', amount: 1800, percentText: '14.4%', progress: 0.144, color: Colors.categoryTransport },
  { name: 'Fun', amount: 1200, percentText: '9.6%', progress: 0.096, color: Colors.categoryFun },
  { name: 'Other', amount: 600, percentText: '4.8%', progress: 0.048, color: Colors.categoryOther },
];

// Normalized daily heights (0..1) for days 1..18 to render a clean zero-dependency chart
const DAILY_BARS = [
  0.18, 0.25, 0.12, 0.28, 0.22, 0.72, 0.15, 0.19, 0.31, 0.14, 0.24, 0.18, 0.22,
  0.29, 0.88, 0.32,
];
export default function OverviewScreen() {
  return (
    <Main>
      <View style={styles.headerRow}>
        <AppText variant="serifTitle">Overview</AppText>

        <View style={styles.monthSelectorPill}>
          <TouchableOpacity activeOpacity={0.6}>
            <AppText variant="caption">‹</AppText>
          </TouchableOpacity>
          <AppText variant="caption" style={styles.monthPillText}>
            October 2026
          </AppText>
          <TouchableOpacity activeOpacity={0.6}>
            <AppText variant="caption">›</AppText>
          </TouchableOpacity>
        </View>
      </View>

<BentoCard variant="dark" style={styles.totalCard}>
        <View style={styles.rowBetween}>
          <AppText variant="caption" color={Colors.textMuted}>
            支出 / Total spent
          </AppText>
          <HankoStamp size="sm" />
        </View>

        <View style={styles.amountRow}>
          <AppText variant="digital" color={Colors.textInverse}>
            12,480
          </AppText>
          <AppText variant="caption" color={Colors.textMuted}>
            ETB
          </AppText>
        </View>
      </BentoCard>
    <BentoCard variant="light" style={styles.chartCard}>
    <View style={styles.rowBetween}>
          <AppText variant="caption" color={Colors.textSecondary}>
            Daily spending
          </AppText>
          <AppText variant="caption" color={Colors.textMuted}>
            ETB
          </AppText>
        </View>
      <View style={styles.chartBody}>

        <View style={styles.plotArea}>

    <View style={[styles.gridLine, { top: '10%' }]} />
            <View style={[styles.gridLine, { top: '55%' }]} />
            <View style={[styles.gridLine, { bottom: 0 }]} />
          <View style={styles.barsRow}>
            {DAILY_BARS.map((val, idx) => {
                const isPeak = idx === 14;
                return (
                  <View key={idx} style={styles.barColumn}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${val * 100}%`,
                          backgroundColor: isPeak
                            ? Colors.hankoRed
                            : Colors.cardDark,
                        },
                      ]}
                    />
                  </View>
                );
              })}
          </View>
        </View>
        <View style={styles.yAxis}>
            <AppText variant="caption" color={Colors.textMuted} style={styles.axisText}>
              2.4k
            </AppText>
            <AppText variant="caption" color={Colors.textMuted} style={styles.axisText}>
              1.2k
            </AppText>
            <AppText variant="caption" color={Colors.textMuted} style={styles.axisText}>
              0
            </AppText>
          </View>
      </View>
      <View style={styles.xAxis}>
          {['01', '07', '14', '21', '31'].map((day) => (
            <AppText
              key={day}
              variant="caption"
              color={Colors.textMuted}
              style={styles.axisText}
            >
              {day}
            </AppText>
          ))}
        </View>
    </BentoCard>
    <BentoCard variant="light" style={styles.categoryCard}>
          <View style={styles.rowBetween}>
          <AppText variant="caption" color={Colors.textSecondary}>
            By category
          </AppText>
          <AppText variant="caption" color={Colors.textMuted}>
            ETB
          </AppText>
        </View>
      <View style={styles.categoryList}>
          {CATEGORY_STATS.map((item) => (
            <View key={item.name} style={styles.categoryItem}>
              <View style={styles.rowBetween}>
                <View style={styles.catLabelGroup}>
                  <View
                    style={[styles.dot, { backgroundColor: item.color }]}
                  />
                  <AppText variant="bodyBold">{item.name}</AppText>
                </View>

                <View style={styles.catNumbersGroup}>
                  <AppText variant="bodyBold" style={styles.catAmount}>
                    {item.amount.toLocaleString()}
                  </AppText>
                  <AppText
                    variant="caption"
                    color={Colors.textMuted}
                    style={styles.catPercent}
                  >
                    {item.percentText}
                  </AppText>
                </View>
              </View>

              <ProgressBar
                progress={item.progress}
                fillColor={item.color}
                height={6}
              />
            </View>
          ))}
      </View>
    </BentoCard>
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
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
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
    backgroundColor: Colors.divider,
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
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
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
});