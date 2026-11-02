import React, { useState } from 'react';
import { View, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Main,
  BentoCard,
  AppText,
  PillBadge,
} from '@/components/ui';
import { useThemeColors } from '@/constants/theme';
import { useLedger } from '@/hooks/useLedger';
import { useAuthStore } from '@/stores/authStore';
import { useSyncStore } from '@/stores/syncStore';
import type { ThemeMode } from '@/stores/settingsStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, themeMode, setThemeMode } = useThemeColors();
  const { seedDemoData, clearAllData } = useLedger();

  const activeAccount = useAuthStore((s) => s.activeAccount);
  const accounts = useAuthStore((s) => s.accounts);
  const updateBiometricSetting = useAuthStore((s) => s.updateBiometricSetting);
  const lockSession = useAuthStore((s) => s.lockSession);
  const removeAccount = useAuthStore((s) => s.removeAccount);

  const { syncNow, syncStatus, isDeviceOnline, pendingCount } = useSyncStore();
  const [isSyncing, setIsSyncing] = useState(false);

  const themeOptions: { mode: ThemeMode; label: string; sub: string }[] = [
    { mode: 'dark', label: 'Dark', sub: '墨色 Sumi' },
    { mode: 'light', label: 'Light', sub: '和紙 Washi' },
    { mode: 'system', label: 'Auto', sub: 'System' },
  ];

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncNow();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBiometricToggle = async (val: boolean) => {
    if (!activeAccount) return;
    await updateBiometricSetting(activeAccount.id, val);
  };

  const handleLockSession = () => {
    lockSession();
    router.replace('/(auth)/select-account');
  };

  const handleSignOut = () => {
    if (!activeAccount) return;
    Alert.alert(
      'Sign Out',
      `Sign out of ${activeAccount.name}? Your local ledger will be preserved or removed from this device.`,
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

  return (
    <Main contentContainerStyle={styles.container}>
      <AppText variant="serifTitle">Settings</AppText>

      {/* Google Account & Profile Card */}
      <BentoCard variant="light" style={styles.sectionCard}>
        <AppText variant="caption" color={colors.textSecondary}>
          Active Google Account (Isolated Ledger)
        </AppText>
        <View style={styles.accountRow}>
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
              {activeAccount?.email || 'No Google account linked'}
            </AppText>
          </View>
          <PillBadge
            variant={isDeviceOnline ? 'income' : 'expense'}
            label={isDeviceOnline ? '● Online' : '○ Offline'}
          />
        </View>

        <View style={styles.accountActionsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(auth)/select-account')}
            style={[
              styles.profileBtn,
              { borderColor: colors.border, backgroundColor: colors.cardElevated },
            ]}
          >
            <AppText variant="bodyBold" style={{ fontSize: 12 }}>
              Switch Account ({accounts.length})
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            disabled={isSyncing}
            onPress={handleManualSync}
            style={[
              styles.profileBtn,
              { borderColor: colors.border, backgroundColor: colors.cardElevated },
            ]}
          >
            <AppText variant="bodyBold" style={{ fontSize: 12 }}>
              {isSyncing ? 'Syncing…' : 'Sync to Drive'}
            </AppText>
          </TouchableOpacity>
        </View>
      </BentoCard>

      {/* Theme Settings */}
      <BentoCard variant="light" style={styles.sectionCard}>
        <AppText variant="caption" color={colors.textSecondary}>Theme</AppText>
        <View style={styles.themeSelectorRow}>
          {themeOptions.map((opt) => {
            const active = themeMode === opt.mode;
            return (
              <TouchableOpacity
                key={opt.mode}
                activeOpacity={0.7}
                onPress={() => setThemeMode(opt.mode)}
                style={[
                  styles.themeBtn,
                  {
                    borderColor: active ? colors.selectionBorder : colors.border,
                    backgroundColor: active ? colors.selectionBg : colors.cardElevated,
                  },
                ]}
              >
                <AppText
                  variant="bodyBold"
                  style={{
                    color: active ? colors.selectionText : colors.textPrimary,
                    fontSize: 13,
                  }}
                >
                  {opt.label}
                </AppText>
                <AppText
                  variant="caption"
                  style={{
                    color: active ? colors.selectionText : colors.textMuted,
                    fontSize: 10,
                  }}
                >
                  {opt.sub}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </BentoCard>

      {/* Security: Biometrics & Lock */}
      <BentoCard variant="light" style={styles.sectionCard}>
        <AppText variant="caption" color={colors.textSecondary}>Security & Protection</AppText>
        <View style={styles.switchRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <AppText variant="bodyBold">Biometric Unlock</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Unlock this profile with Fingerprint or Face ID
            </AppText>
          </View>
          <Switch
            value={activeAccount?.biometricEnabled ?? false}
            onValueChange={handleBiometricToggle}
            trackColor={{ false: colors.switchTrackOff, true: colors.bambooGreen }}
            thumbColor={colors.switchThumb}
            ios_backgroundColor={colors.switchTrackOff}
          />
        </View>

        <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleLockSession}
          style={[
            styles.lockBtn,
            { borderColor: colors.border, backgroundColor: colors.cardElevated },
          ]}
        >
          <AppText variant="bodyBold" style={{ fontSize: 13 }}>
            🔒 Lock App / Switch Profile
          </AppText>
        </TouchableOpacity>
      </BentoCard>

      {/* Sample Data & Reset */}
      <BentoCard variant="light" style={styles.sectionCard}>
        <AppText variant="caption" color={colors.textSecondary}>Profile Data & Reset</AppText>
        <View style={styles.dataButtonsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={async () => {
              await seedDemoData();
              Alert.alert('Demo Data', 'Seeded sample expenses, incomes, budgets, and wishlist items.');
            }}
            style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.cardElevated }]}
          >
            <AppText variant="bodyBold" style={{ fontSize: 13 }}>Seed Demo Data</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              Alert.alert('Reset Ledger', 'Are you sure you want to clear this account’s data?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear All',
                  style: 'destructive',
                  onPress: async () => {
                    await clearAllData();
                  },
                },
              ]);
            }}
            style={[styles.actionBtn, { borderColor: colors.hankoRed, backgroundColor: colors.cardElevated }]}
          >
            <AppText variant="bodyBold" color={colors.hankoRed} style={{ fontSize: 13 }}>Clear All Data</AppText>
          </TouchableOpacity>
        </View>
      </BentoCard>

      {/* Sign Out */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleSignOut}
        style={[
          styles.signOutBtn,
          { borderColor: colors.hankoRed, backgroundColor: colors.card },
        ]}
      >
        <AppText variant="bodyBold" color={colors.hankoRed}>
          Sign Out of This Profile
        </AppText>
      </TouchableOpacity>
    </Main>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 28,
  },
  sectionCard: {
    paddingVertical: 16,
    gap: 12,
  },
  accountRow: {
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
  accountActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  profileBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  themeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 2,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  cardDivider: {
    height: 1,
    width: '100%',
    opacity: 0.15,
  },
  lockBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutBtn: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
