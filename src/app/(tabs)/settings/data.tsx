import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Main, BentoCard, AppText, JapaneseIcon } from '@/components/ui';
import { useThemeColors } from '@/constants/theme';
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
  const [showClearModal, setShowClearModal] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncNow();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Main
      showArt
      artOpacity={0.11}
      contentContainerStyle={styles.container}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic.selection();
            router.replace('/(tabs)/settings' as Href);
          }}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <JapaneseIcon name="chevronLeft" size={16} color={colors.textPrimary} strokeWidth={2.2} />
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
        <AppText variant="caption" color={colors.textSecondary}>Archiving & sovereignty</AppText>
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
          <AppText variant="caption" color={colors.textSecondary}>Cloud sync</AppText>
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
        <AppText variant="caption" color={colors.hankoRed}>Danger zone</AppText>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic.heavy();
            setShowClearModal(true);
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

      {/* Clear Ledger Confirmation Modal */}
      <Modal
        visible={showClearModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, gap: 4 }}>
                <AppText variant="serifTitle" style={[styles.modalTitle, { color: colors.hankoRed }]}>
                  Reset ledger?
                </AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  Are you sure you want to clear all data for this profile? All transactions, income records, and savings will be permanently erased.
                </AppText>
              </View>
              <TouchableOpacity
                onPress={() => setShowClearModal(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppText style={{ fontSize: 16, color: colors.textSecondary }}>✕</AppText>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8, marginTop: 8 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={async () => {
                  try {
                    triggerHaptic.heavy();
                    setShowClearModal(false);
                    await clearAllData();
                  } catch (err: any) {
                    Alert.alert('Error', err?.message || 'Could not reset ledger.');
                  }
                }}
                style={[styles.modalActionBtn, { backgroundColor: colors.hankoRed }]}
              >
                <AppText variant="bodyBold" color="#FFFFFF">
                  Clear all data
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowClearModal(false)}
                style={[styles.modalActionBtn, { backgroundColor: colors.cardElevated, borderColor: colors.border, borderWidth: 1 }]}
              >
                <AppText variant="bodyBold" color={colors.textPrimary}>
                  Cancel
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 22, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    maxWidth: 360,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActionBtn: {
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});
