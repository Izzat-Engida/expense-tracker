import {
  CATEGORY_LABELS,
  formatSignedAmount,
  type DayGroup,
} from '@/lib/ledger';
import React from 'react';
import { useThemeColors } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import {AppText} from './AppText';
import {PillBadge} from './PillBadge'
export default function DaySection({group,badgeVariant,showDivider = false,}: {
  group: DayGroup;
  badgeVariant: 'dark' | 'outline';
  showDivider?: boolean;
}) {
  const { colors } = useThemeColors();
  const currency = useSettingsStore((s) => s.currency);

  return (
    <View>
      {showDivider && (
        <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />
      )}

      <View style={styles.dayHeaderRow}>
        <View style={styles.dayBadgeGroup}>
          <PillBadge variant={badgeVariant} label={group.badge} />
          <AppText variant="caption" color={colors.textSecondary}>
            {group.label}
          </AppText>
        </View>
        <AppText variant="caption" color={colors.textSecondary}>
          {Math.round(group.total).toLocaleString()} {currency}
        </AppText>
      </View>

      {group.expenses.length === 0 ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/modals/add-expense')}
        >
          <AppText variant="caption" color={colors.textMuted} style={styles.emptyDayText}>
            No expenses {group.label.toLowerCase()}. Tap to add.
          </AppText>
        </TouchableOpacity>
      ) : (
        group.expenses.map((item, idx) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${item.title}`}
            onPress={() =>
              router.push({
                pathname: '/modals/add-expense',
                params: { expenseId: item.id },
              })
            }
            style={[
              styles.expenseRow,
              idx < group.expenses.length - 1 && [
                styles.rowBorder,
                { borderBottomColor: colors.divider },
              ],
            ]}
          >
            <View style={styles.expenseInfo}>
              <AppText variant="bodyBold">{item.title}</AppText>
              <View style={styles.categoryLine}>
                <AppText variant="caption" color={colors.textSecondary}>
                  {CATEGORY_LABELS[item.category]}
                </AppText>
              </View>
            </View>
            <PillBadge
              variant={item.amount < 0 ? 'income' : 'expense'}
              label={formatSignedAmount(item.amount)}
            />
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}
const styles = StyleSheet.create({

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
  },
  expenseInfo: {
    gap: 3,
  },
  categoryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  sectionDivider: {
    height: 1.5,
    marginVertical: 8,
  },

  emptyDayText: {
    paddingVertical: 8,
  },
});
