import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Main, BentoCard, AppText, PillBadge, JapaneseIcon } from '@/components/ui';
import { Fonts, useThemeColors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useSyncStore } from '@/stores/syncStore';
import { triggerHaptic } from '@/utils/haptics';

export default function AccountSettings() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const activeAccount = useAuthStore((s) => s.activeAccount);
  const accounts = useAuthStore((s) => s.accounts);
  const lockSession = useAuthStore((s) => s.lockSession);
  const removeAccount = useAuthStore((s) => s.removeAccount);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const { isDeviceOnline } = useSyncStore();

  const handleSignOut = () => {
    if (!activeAccount) return;
    Alert.alert(
      'Sign Out',
      activeAccount.isLocal
        ? `Close session for "${activeAccount.name}"? Your local ledger will remain saved on this device.`
        : `Sign out of ${activeAccount.name}? Your local ledger will be preserved or removed from this device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await removeAccount(activeAccount.id);
            if (accounts.length <= 1) {
              router.replace('/(auth)/onboarding');
            } else {
              router.replace('/(auth)/select-account');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    if (!activeAccount) return;
    const isLocal = activeAccount.isLocal;
    Alert.alert(
      'Delete Account & Data',
      isLocal
        ? `Permanently delete profile "${activeAccount.name}"? All transactions and saved data on this device will be erased. This action cannot be undone.`
        : `Permanently delete account "${activeAccount.name}"? All transactions and cloud backups will be erased. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              triggerHaptic.heavy();
              await deleteAccount(activeAccount.id);
              if (accounts.length <= 1) {
                router.replace('/(auth)/onboarding');
              } else {
                router.replace('/(auth)/select-account');
              }
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Could not delete account.');
            }
          },
        },
      ]
    );
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
          <AppText variant="serifTitle" style={styles.headerTitle}>Account</AppText>
          <AppText variant="caption" color={colors.textMuted} style={styles.headerSubtitle}>
            口座 · Profiles & Sessions
          </AppText>
        </View>
      </View>

      {/* Profile info */}
      <BentoCard variant="light" style={styles.card}>
        <AppText variant="caption" color={colors.textSecondary}>ACTIVE PROFILE</AppText>
        <View style={styles.profileRow}>
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: colors.selectionBg, borderColor: colors.border },
            ]}
          >
            <AppText variant="bodyBold" color={colors.selectionText}>
              {activeAccount?.name?.slice(0, 1).toUpperCase() || 'Y'}
            </AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyBold">{activeAccount?.name || 'Local Ledger'}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {activeAccount?.isLocal
                ? 'Device only · Offline'
                : activeAccount?.email || 'No account linked'}
            </AppText>
          </View>
          {activeAccount?.isLocal ? (
            <PillBadge variant="outline" label="Local" />
          ) : (
            <PillBadge
              variant={isDeviceOnline ? 'income' : 'expense'}
              label={isDeviceOnline ? '● Online' : '○ Offline'}
            />
          )}
        </View>
      </BentoCard>

      {/* Account actions */}
      <BentoCard variant="light" style={styles.card}>
        <AppText variant="caption" color={colors.textSecondary}>SESSION</AppText>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic.selection();
            lockSession();
            router.push('/(auth)/select-account');
          }}
          style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.cardElevated }]}
        >
          <JapaneseIcon name="exchange" size={20} color={colors.textPrimary} />
          <View style={styles.actionContent}>
            <AppText variant="bodyBold" style={{ fontSize: 14 }}>
              Switch Account
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {accounts.length} profile{accounts.length !== 1 ? 's' : ''} on this device
            </AppText>
          </View>
          <AppText style={[styles.chevron, { color: colors.textMuted }]}>›</AppText>
        </TouchableOpacity>
      </BentoCard>

      {/* Danger zone */}
      <BentoCard variant="light" style={styles.card}>
        <AppText variant="caption" color={colors.hankoRed}>DANGER ZONE</AppText>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSignOut}
          style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.cardElevated }]}
        >
          <JapaneseIcon name="exit" size={20} color={colors.textPrimary} />
          <View style={styles.actionContent}>
            <AppText variant="bodyBold" style={{ fontSize: 14 }}>Sign Out</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Close this profile session
            </AppText>
          </View>
          <AppText style={[styles.chevron, { color: colors.textMuted }]}>›</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleDeleteAccount}
          style={[styles.actionBtn, { borderColor: colors.hankoRed, backgroundColor: colors.cardElevated }]}
        >
          <JapaneseIcon name="sweep" size={20} color={colors.hankoRed} />
          <View style={styles.actionContent}>
            <AppText variant="bodyBold" color={colors.hankoRed} style={{ fontSize: 14 }}>
              Delete Account & All Data
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Permanent — cannot be undone
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
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
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
