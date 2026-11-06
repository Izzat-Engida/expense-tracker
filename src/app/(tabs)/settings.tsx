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
import {
  CURRENCIES,
  useSettingsStore,
} from '@/stores/settingsStore';
import type { CurrencyCode, ThemeMode } from '@/stores/settingsStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, themeMode, setThemeMode } = useThemeColors();
  const currency = useSettingsStore((s) => s.currency);
  const setCurrency = useSettingsStore((s) => s.setCurrency);
  const { clearAllData } = useLedger();

  const activeAccount = useAuthStore((s) => s.activeAccount);
  const accounts = useAuthStore((s) => s.accounts);
  const updateBiometricSetting = useAuthStore((s) => s.updateBiometricSetting);
  const lockSession = useAuthStore((s) => s.lockSession);
  const removeAccount = useAuthStore((s) => s.removeAccount);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);

  const { syncNow, isDeviceOnline } = useSyncStore();
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
        ? `Permanently delete profile "${activeAccount.name}"? This will delete all local transactions and database files on this device. This action cannot be undone.`
        : `Permanently delete account "${activeAccount.name}"? This will delete all local transactions, database files, and cloud backups from Firebase. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
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
      <AppText variant="serifTitle">Settings</AppText>

      {/* Profile / Account Card */}
      <BentoCard variant="light" style={styles.sectionCard}>
        <AppText variant="caption" color={colors.textSecondary}>
          Active Profile (Isolated Ledger)
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
              {activeAccount?.isLocal ? 'Local SQLite · Offline' : (activeAccount?.email || 'No account linked')}
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

        <View style={styles.accountActionsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              lockSession();
              router.push('/(auth)/select-account');
            }}
            style={[
              styles.profileBtn,
              { borderColor: colors.border, backgroundColor: colors.cardElevated },
            ]}
          >
            <AppText variant="bodyBold" style={{ fontSize: 12 }}>
              Switch Account ({accounts.length})
            </AppText>
          </TouchableOpacity>

          {!activeAccount?.isLocal && (
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
                {isSyncing ? 'Syncing…' : 'Sync to Cloud'}
              </AppText>
            </TouchableOpacity>
          )}
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

      {/* Currency */}
      <BentoCard variant="light" style={styles.sectionCard}>
        <AppText variant="caption" color={colors.textSecondary}>Currency</AppText>
        <View style={styles.currencyRow}>
          {CURRENCIES.map((code) => {
            const active = currency === code;
            return (
              <TouchableOpacity
                key={code}
                activeOpacity={0.7}
                onPress={() => setCurrency(code as CurrencyCode)}
                style={[
                  styles.currencyBtn,
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
                    fontSize: 12,
                  }}
                >
                  {code}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
        <AppText variant="caption" color={colors.textMuted}>
          Amounts across the app are shown in this currency.
        </AppText>
      </BentoCard>

      {/* Security: Biometrics */}
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
      </BentoCard>

      {/* Reset */}
      <BentoCard variant="light" style={styles.sectionCard}>
        <AppText variant="caption" color={colors.textSecondary}>Profile Data & Reset</AppText>
        <View style={styles.dataButtonsRow}>
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

      {/* Account Actions */}
      <View style={styles.accountBottomActions}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSignOut}
          style={[
            styles.signOutBtn,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <AppText variant="bodyBold" color={colors.textSecondary}>
            Sign Out of This Profile
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleDeleteAccount}
          style={[
            styles.deleteBtn,
            { borderColor: colors.hankoRed, backgroundColor: colors.card },
          ]}
        >
          <AppText variant="bodyBold" color={colors.hankoRed}>
            Delete Account & All Data
          </AppText>
        </TouchableOpacity>
      </View>
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
  currencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyBtn: {
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
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
  accountBottomActions: {
    gap: 10,
    marginTop: 6,
  },
  signOutBtn: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
