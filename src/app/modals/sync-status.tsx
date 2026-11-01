import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Main,
  BentoCard,
  AppText,
  HankoStamp,
} from '@/components/ui';
import { Colors, Fonts } from '@/constants/theme';

export default function SyncStatusModal() {
  const router = useRouter();

  return (
    <Main>
     
      <View style={styles.headerRow}>
        <AppText variant="serifTitle">Drive Sync</AppText>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <AppText variant="body" color={Colors.textSecondary}>✕</AppText>
        </TouchableOpacity>
      </View>

      <BentoCard variant="light" style={styles.statusCard}>
        <View style={styles.rowBetween}>
          <View>
            <AppText variant="caption" color={Colors.textSecondary}>Local SQLite Status:</AppText>
            <AppText variant="serifTitle" style={styles.savedTitle}>Saved ✓</AppText>
          </View>
          <HankoStamp size="sm" />
        </View>
      </BentoCard>

      <BentoCard variant="light" style={styles.queueCard}>
        <View style={styles.rowBetween}>
          <AppText variant="caption" color={Colors.textSecondary}>Outbox queue</AppText>
          <View style={styles.badgeCount}>
            <AppText variant="caption" color={Colors.textInverse}>0</AppText>
          </View>
        </View>
        <AppText variant="bodyBold" style={styles.queueMainText}>3 items</AppText>
        <AppText variant="caption" color={Colors.textMuted}>waiting for connection</AppText>
      </BentoCard>

   
      <BentoCard variant="light" style={styles.lastSyncCard}>
        <AppText variant="caption" color={Colors.textSecondary}>Last synced to Google Drive:</AppText>
        <View style={styles.syncMetaRow}>
          <AppText variant="bodyBold">☁</AppText>
          <AppText variant="bodyBold">2 mins ago</AppText>
        </View>
      </BentoCard>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.back()}
        style={styles.syncButton}
      >
        <AppText variant="body" color={Colors.textInverse}>Sync Now</AppText>
      </TouchableOpacity>
    </Main>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: Colors.divider, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  statusCard: { paddingVertical: 18 },
  savedTitle: { marginTop: 4, color: Colors.bambooGreen },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  queueCard: { paddingVertical: 16, gap: 4 },
  badgeCount: { backgroundColor: Colors.cardDark, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  queueMainText: { fontSize: 18, marginTop: 4 },
  lastSyncCard: { paddingVertical: 16, gap: 8 },
  syncMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  syncButton: { backgroundColor: Colors.cardDark, borderRadius: 999, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.shadow, shadowOffset: { width: 2, height: 3 }, shadowOpacity: 1, elevation: 3 },
});