import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Main, BentoCard, AppText, PillBadge, JapaneseIcon } from '@/components/ui';
import { Fonts, useThemeColors } from '@/constants/theme';
import { useLedger } from '@/hooks/useLedger';
import { useSettingsStore } from '@/stores/settingsStore';
import { CATEGORY_LABELS } from '@/lib/ledger';
import type { ExpenseCategory, Expense } from '@/db/types';
import { triggerHaptic } from '@/utils/haptics';

const CATEGORIES: { key: ExpenseCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'food', label: 'Food' },
  { key: 'bills', label: 'Bills' },
  { key: 'transport', label: 'Transport' },
  { key: 'fun', label: 'Fun' },
  { key: 'other', label: 'Other' },
];

export default function LedgerHistoryModal() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const currency = useSettingsStore((s) => s.currency);
  const { expenses } = useLedger();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');

  const filtered = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesCategory =
        selectedCategory === 'all' || exp.category === selectedCategory;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        exp.title.toLowerCase().includes(q) ||
        (exp.note && exp.note.toLowerCase().includes(q)) ||
        CATEGORY_LABELS[exp.category].toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [expenses, selectedCategory, query]);

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups: { date: string; items: Expense[]; total: number }[] = [];
    const map = new Map<string, Expense[]>();

    for (const exp of filtered) {
      const arr = map.get(exp.date) || [];
      arr.push(exp);
      map.set(exp.date, arr);
    }

    const sortedDates = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    for (const d of sortedDates) {
      const items = map.get(d) || [];
      const total = items.reduce((sum, item) => sum + item.amount, 0);
      groups.push({ date: d, items, total });
    }
    return groups;
  }, [filtered]);

  const totalAmountFiltered = useMemo(() => {
    return filtered.reduce((sum, item) => sum + item.amount, 0);
  }, [filtered]);

  return (
    <Main
      showArt
      artOpacity={0.11}
      contentContainerStyle={styles.container}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <AppText variant="serifTitle">Ledger Archive</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            台帳 · All Transactions
          </AppText>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AppText variant="body" color={colors.textSecondary}>✕</AppText>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View
        style={[
          styles.searchBar,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <JapaneseIcon name="search" size={16} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by title, note, or category..."
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.textPrimary }]}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <AppText variant="caption" color={colors.textSecondary}>✕</AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <PillBadge
              key={cat.key}
              variant={isSelected ? 'dark' : 'outline'}
              label={cat.label}
              onPress={() => {
                triggerHaptic.selection();
                setSelectedCategory(cat.key);
              }}
            />
          );
        })}
      </ScrollView>

      {/* Filter Summary */}
      <View style={styles.metaRow}>
        <AppText variant="caption" color={colors.textMuted}>
          {filtered.length} transaction{filtered.length === 1 ? '' : 's'}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} style={{ fontFamily: Fonts.sansBold }}>
          Total: {Math.round(totalAmountFiltered).toLocaleString()} {currency}
        </AppText>
      </View>

      {/* Transaction List */}
      {groupedByDate.length === 0 ? (
        <BentoCard variant="light" style={styles.emptyCard}>
          <AppText variant="bodyBold">No matching transactions</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Try clearing your search query or choosing another category filter.
          </AppText>
        </BentoCard>
      ) : (
        groupedByDate.map((group) => (
          <BentoCard key={group.date} variant="light" style={styles.dateCard}>
            <View style={styles.dateHeader}>
              <AppText variant="caption" color={colors.textSecondary} style={styles.dateText}>
                {group.date}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {Math.round(group.total).toLocaleString()} {currency}
              </AppText>
            </View>

            <View style={styles.itemsList}>
              {group.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    triggerHaptic.light();
                    router.push({
                      pathname: '/modals/add-expense',
                      params: { expenseId: item.id },
                    });
                  }}
                  style={[
                    styles.itemRow,
                    idx > 0 && [styles.itemDivider, { borderTopColor: colors.divider }],
                  ]}
                >
                  <View style={styles.itemLeft}>
                    <AppText variant="bodyBold" numberOfLines={1}>
                      {item.title}
                    </AppText>
                    <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                      {item.is_recurring === 1 ? '毎月 · ' : ''}
                      {CATEGORY_LABELS[item.category]}
                      {item.note ? ` · ${item.note}` : ''}
                    </AppText>
                  </View>

                  <AppText variant="bodyBold" style={styles.amountText}>
                    -{Math.round(item.amount).toLocaleString()} {currency}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </BentoCard>
        ))
      )}
    </Main>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  closeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.sans,
    paddingVertical: 0,
  },
  filterRow: {
    gap: 6,
    paddingVertical: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  emptyCard: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 6,
  },
  dateCard: {
    paddingVertical: 14,
    gap: 8,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
  },
  dateText: {
    fontFamily: Fonts.sansBold,
    letterSpacing: 0.5,
  },
  itemsList: {
    gap: 0,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  itemDivider: {
    borderTopWidth: 1,
  },
  itemLeft: {
    flex: 1,
    gap: 2,
  },
  amountText: {
    fontFamily: Fonts.mono,
    fontSize: 14,
  },
});
