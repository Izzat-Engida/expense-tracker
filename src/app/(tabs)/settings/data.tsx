import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Main, BentoCard, AppText, JapaneseIcon } from '@/components/ui';
import { Fonts, useThemeColors } from '@/constants/theme';
import { useLedger } from '@/hooks/useLedger';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { useSyncStore } from '@/stores/syncStore';
import { exportLedgerToCsv } from '@/utils/csvExport';
import { triggerHaptic } from '@/utils/haptics';

export default function DataSettings() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const { clearAllData, expenses, incomes, savings } = useLedger();
  const currency = useSettingsStore((s) => s.currency);
  const activeAccount = useAuthStore((s) => s.activeAccount);
  const { syncNow, isDeviceOnline } = useSyncStore();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncNow();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Main contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic.selection();
            router.replace('/(tabs)/settings' as Href);
          }}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AppText style={[styles.backChevron, { color: colors.textPrimary }]}>‹</AppText>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <AppText variant="serifTitle" style={styles.headerTitle}>Data & Export</AppText>
          <AppText variant="caption" color={colors.textMuted} style={styles.headerSubtitle}>
            台帳 · Archiving & Storage
          </AppText>
        </View>
      </View>

      {/* Export */}
      <BentoCard variant="light" style={styles.card}>
        <AppText variant="caption" color={colors.textSecondary}>ARCHIVING & SOVEREIGNTY</AppText>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={async () => {
            triggerHaptic.medium();
            await exportLedgerToCsv(expenses, incomes, savings, currency);
          }}
          style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.cardElevated }]}
        >
          <JapaneseIcon name="makimono" size={20} color={colors.textPrimary} />
          <View style={styles.actionContent}>
            <AppText variant="bodyBold" style={{ fontSize: 14 }}>Export to CSV</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              All transactions, salaries & savings
            </AppText>
          </View>
          <AppText style={[styles.chevron, { color: colors.textMuted }]}>›</AppText>
        </TouchableOpacity>
      </BentoCard>

      {/* Cloud Sync */}
      {!activeAccount?.isLocal && (
        <BentoCard variant="light" style={styles.card}>
          <AppText variant="caption" color={colors.textSecondary}>CLOUD SYNC</AppText>
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={isSyncing || !isDeviceOnline}
            onPress={handleManualSync}
            style={[
              styles.actionBtn,
              {
                borderColor: colors.border,
                backgroundColor: colors.cardElevated,
                opacity: (!isDeviceOnline || isSyncing) ? 0.5 : 1,
              },
            ]}
          >
            <JapaneseIcon name="kumo" size={20} color={colors.textPrimary} />
            <View style={styles.actionContent}>
              <AppText variant="bodyBold" style={{ fontSize: 14 }}>
                {isSyncing ? 'Syncing…' : 'Sync to Cloud'}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                {isDeviceOnline ? 'Backup your ledger to the cloud' : 'You are currently offline'}
              </AppText>
            </View>
            <AppText style={[styles.chevron, { color: colors.textMuted }]}>›</AppText>
          </TouchableOpacity>
        </BentoCard>
      )}

      {/* Danger zone */}
      <BentoCard variant="light" style={styles.card}>
        <AppText variant="caption" color={colors.hankoRed}>DANGER ZONE</AppText>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            Alert.alert('Reset Ledger', 'Are you sure you want to clear all data for this account?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Clear All',
                style: 'destructive',
                onPress: async () => {
                  triggerHaptic.heavy();
                  await clearAllData();
                },
              },
            ]);
          }}
          style={[styles.actionBtn, { borderColor: colors.hankoRed, backgroundColor: colors.cardElevated }]}
        >
          <JapaneseIcon name="sweep" size={20} color={colors.hankoRed} />
          <View style={styles.actionContent}>
            <AppText variant="bodyBold" color={colors.hankoRed} style={{ fontSize: 14 }}>
              Clear All Data
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Permanently delete all transactions
            </AppText>
          </View>
          <AppText style={[styles.chevron, { color: colors.hankoRed }]}>›</AppText>
        </TouchableOpacity>
      </BentoCard>
    </Main>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontSize: 22,
    lineHeight: 24,
    marginTop: -2,
    marginLeft: -1,
    fontFamily: Fonts.sansBold,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    lineHeight: 26,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  card: {
    paddingVertical: 16,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionContent: {
    flex: 1,
    gap: 1,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
});
