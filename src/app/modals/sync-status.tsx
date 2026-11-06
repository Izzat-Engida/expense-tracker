import  { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Main,
  BentoCard,
  AppText,
  HankoStamp,
  PillBadge,
} from '@/components/ui';
import {  useThemeColors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useSyncStore } from '@/stores/syncStore';

export default function SyncStatusModal() {
  const router = useRouter();
  const { colors, isDark } = useThemeColors();

  const activeAccount = useAuthStore((s) => s.activeAccount);
  const {
    isDeviceOnline,
    pendingCount,
    lastSyncedAt,
    statusMessage,
    refreshStatus,
    syncNow,
  } = useSyncStore();

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const handleSyncPress = async () => {
    setIsSyncing(true);
    try {
      await syncNow();
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSync = (iso: string | null) => {
    if (!iso) return 'Never synced';
    return new Date(iso).toLocaleString();
  };

  return (
    <Main contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <AppText variant="serifTitle">Cloud Sync</AppText>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <AppText variant="body" color={colors.textPrimary}>✕</AppText>
        </TouchableOpacity>
      </View>

  
      <BentoCard variant="light" style={styles.accountCard}>
        <View style={styles.rowBetween}>
          <View style={styles.accountInfoRow}>
            <View
              style={[
                styles.avatarMini,
                { backgroundColor: colors.selectionBg, borderColor: colors.border },
              ]}
            >
              <AppText variant="caption" color={colors.selectionText}>
                {activeAccount?.name?.slice(0, 1).toUpperCase() || 'Y'}
              </AppText>
            </View>
            <View>
              <AppText variant="bodyBold">{activeAccount?.name || 'Local Account'}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {activeAccount?.email || 'No email linked'}
              </AppText>
            </View>
          </View>
          <PillBadge
            variant={isDeviceOnline ? 'income' : 'expense'}
            label={isDeviceOnline ? '● Online' : '○ Offline'}
          />
        </View>
      </BentoCard>

  
      <BentoCard variant="light" style={styles.statusCard}>
        <View style={styles.rowBetween}>
          <View>
            <AppText variant="caption" color={colors.textSecondary}>Local SQLite Status:</AppText>
            <AppText variant="serifTitle" style={[styles.savedTitle, { color: colors.bambooGreen }]}>
              Saved Locally ✓
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Zero external databases. Works 100% offline.
            </AppText>
          </View>
          <HankoStamp size="sm" />
        </View>
      </BentoCard>

      <BentoCard variant="light" style={styles.queueCard}>
        <View style={styles.rowBetween}>
          <AppText variant="caption" color={colors.textSecondary}>Outbox queue (pending sync)</AppText>
          <View
            style={[
              styles.badgeCount,
              {
                backgroundColor:
                  pendingCount > 0 ? colors.hankoRed : isDark ? colors.cardElevated : colors.cardDark,
              },
            ]}
          >
            <AppText variant="caption" color="#FFFFFF">
              {pendingCount}
            </AppText>
          </View>
        </View>
        <AppText variant="bodyBold" style={styles.queueMainText}>
          {pendingCount === 0 ? 'All changes synced' : `${pendingCount} item${pendingCount > 1 ? 's' : ''}`}
        </AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {!isDeviceOnline
            ? 'Waiting for internet connection'
            : pendingCount === 0
            ? 'Local database matches cloud snapshot'
            : 'Pending upload to Firestore'}
        </AppText>
      </BentoCard>

   
      <BentoCard variant="light" style={styles.lastSyncCard}>
        <AppText variant="caption" color={colors.textSecondary}>
          Firebase Cloud (Firestore):
        </AppText>
        <View style={styles.syncMetaRow}>
          <AppText variant="bodyBold" color={colors.textPrimary}>☁</AppText>
          <AppText variant="bodyBold" color={colors.textPrimary}>
            {formatLastSync(lastSyncedAt)}
          </AppText>
        </View>
        <AppText variant="caption" color={colors.textMuted}>
          {statusMessage}
        </AppText>
      </BentoCard>


      <TouchableOpacity
        activeOpacity={0.85}
        disabled={isSyncing}
        onPress={handleSyncPress}
        style={[
          styles.syncButton,
          {
            backgroundColor: isDark ? colors.cardElevated : colors.cardDark,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        {isSyncing ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <AppText variant="bodyBold" color="#FFFFFF">Syncing…</AppText>
          </View>
        ) : (
          <AppText variant="bodyBold" color="#FFFFFF">
            {isDeviceOnline ? 'Sync Now with Cloud' : 'Retry Connection'}
          </AppText>
        )}
      </TouchableOpacity>
    </Main>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  accountInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCard: {
    paddingVertical: 18,
  },
  savedTitle: {
    marginTop: 4,
    marginBottom: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueCard: {
    paddingVertical: 16,
    gap: 4,
  },
  badgeCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  queueMainText: {
    fontSize: 18,
    marginTop: 4,
  },
  lastSyncCard: {
    paddingVertical: 16,
    gap: 6,
  },
  syncMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncButton: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 1,
    elevation: 3,
    marginTop: 8,
  },
});
