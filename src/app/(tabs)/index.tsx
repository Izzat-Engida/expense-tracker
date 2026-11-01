import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useRouter } from 'expo-router';
import {
  Main,
  BentoCard,
  AppText,
  PillBadge,
  ProgressBar,
} from '@/components/ui';
import { Colors, Fonts } from '@/constants/theme';

interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  dotColor: string;
  amount: number;
}

//will remove this latter on
const TODAY_EXPENSES: ExpenseItem[] = [
  { id: '1', title: 'Morning coffee', category: 'Food', dotColor: Colors.categoryFood, amount: 180 },
  { id: '2', title: 'Lunch at work', category: 'Food', dotColor: Colors.categoryFood, amount: 420 },
  { id: '3', title: 'Minibus', category: 'Transport', dotColor: Colors.categoryTransport, amount: 80 },
];

const YESTERDAY_EXPENSES: ExpenseItem[] = [
  { id: '4', title: 'Groceries', category: 'Food', dotColor: Colors.categoryFood, amount: 960 },
  { id: '5', title: 'Electricity', category: 'Bills', dotColor: Colors.categoryBills, amount: 1200 },
];

export default function HomeScreen() {
  return (
    <Main>
      <BentoCard variant="light" art="crane" style={styles.monthHeaderCard}>
      <View style={styles.monthLeft}>
      <AppText style={styles.kanjiMonth}>十{'\n'}月</AppText>
      <View style={styles.verticalDivider} />
      <View>
            <AppText variant="bodyBold" style={styles.monthTitle}>
              October
            </AppText>
            <AppText variant="caption" color={Colors.textSecondary}>
              2026
            </AppText>
          </View>
      </View>
      <TouchableOpacity
      activeOpacity={0.7}
      onPress={()=>router.push('/modals/sync-status')}
      style={styles.syncStatusBtn}
      >
        <AppText variant="caption" color={Colors.bambooGreen}>
          ☁
        </AppText>
        <AppText variant="caption" color={Colors.textSecondary}>
            Drive synced
          </AppText>
      </TouchableOpacity>
      </BentoCard>
    <View style={styles.bentoRow}>
      <BentoCard variant="dark" style={styles.spentCard}>
        <AppText variant="caption" color={Colors.textMuted}>
          支出 · SPENT
        </AppText>
        <View style={styles.spentAmountRow}>
          <AppText variant="digital" color={Colors.textInverse}>
              12,480
            </AppText>
            <AppText variant="caption" color={Colors.textMuted}>
              ETB
            </AppText>
        </View>
        <PillBadge
            variant="income"
            label="収入 25,000 ETB income"
            onPress={() => router.push('/modals/income-budget')}
          />
      </BentoCard>
      <BentoCard variant="light" style={styles.budgetCard}>
      <TouchableOpacity
      activeOpacity={0.8}
            style={styles.budgetTouchArea}
            onPress={() => router.push('/modals/income-budget')}
      >
        <View style={styles.budgetCircle}>
              <AppText variant="bodyBold" style={styles.budgetPercent}>
                62%
              </AppText>
              <AppText variant="caption" color={Colors.textSecondary} style={styles.budgetSub}>
                of budget
              </AppText>
            </View>
          <View style={styles.budgetBarWrap}>
              <ProgressBar progress={0.62} fillColor={Colors.bambooGreen} height={6} />
            </View>

            <AppText variant="caption" color={Colors.textSecondary}>
              20,000 ETB
            </AppText>
      </TouchableOpacity>
      </BentoCard>
    </View>
    <BentoCard variant="light" style={styles.ledgerCard}>
    <View style={styles.dayHeaderRow}>
    <View style={styles.dayBadgeGroup}>
    <PillBadge variant="dark" label="今日" />
        <AppText variant="caption" color={Colors.textSecondary}>
              Today
        </AppText>
    </View>
    <AppText variant="caption" color={Colors.textSecondary}>
            680 ETB
          </AppText>
    </View>
    {TODAY_EXPENSES.map((item, idx) => (
          <View
            key={item.id}
            style={[
              styles.expenseRow,
              idx < TODAY_EXPENSES.length - 1 && styles.rowBorder,
            ]}
          >
            <View style={styles.expenseInfo}>
              <AppText variant="bodyBold">{item.title}</AppText>
              <View style={styles.categoryLine}>
                <View style={[styles.dot, { backgroundColor: item.dotColor }]} />
                <AppText variant="caption" color={Colors.textSecondary}>
                  {item.category}
                </AppText>
              </View>
            </View>
            <PillBadge variant="expense" label={`-${item.amount.toLocaleString()}`} />
          </View>
        ))}
      <View style={styles.sectionDivider} />
      <View style={styles.dayHeaderRow}>
          <View style={styles.dayBadgeGroup}>
            <PillBadge variant="outline" label="昨日" />
            <AppText variant="caption" color={Colors.textSecondary}>
              Yesterday
            </AppText>
          </View>
          <AppText variant="caption" color={Colors.textSecondary}>
            2,160 ETB
          </AppText>
        </View>
      {YESTERDAY_EXPENSES.map((item, idx) => (
          <View
            key={item.id}
            style={[
              styles.expenseRow,
              idx < YESTERDAY_EXPENSES.length - 1 && styles.rowBorder,
            ]}
          >
            <View style={styles.expenseInfo}>
              <AppText variant="bodyBold">{item.title}</AppText>
              <View style={styles.categoryLine}>
                <View style={[styles.dot, { backgroundColor: item.dotColor }]} />
                <AppText variant="caption" color={Colors.textSecondary}>
                  {item.category}
                </AppText>
              </View>
            </View>
            <PillBadge variant="expense" label={`-${item.amount.toLocaleString()}`} />
          </View>
        ))}
    </BentoCard>
    </Main>
  );
}
const styles=StyleSheet.create({
  monthHeaderCard:{
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    paddingVertical:16
  },
  monthLeft:{
    flexDirection:'row',
    alignItems:'center',
    gap:12,
  },
  kanjiMonth:{
    fontFamily:Fonts.serif,
    fontSize:18,
    lineHeight:22,
    color:Colors.textPrimary
  },
  verticalDivider: {
    width: 1.5,
    height: 34,
    backgroundColor: Colors.divider,
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
    borderColor: Colors.bambooGreen,
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
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  expenseInfo: {
    gap: 3,
  },
  categoryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionDivider: {
    height: 1.5,
    backgroundColor: Colors.divider,
    marginVertical: 8,
  },
})