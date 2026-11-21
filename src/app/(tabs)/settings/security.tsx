import React from 'react';
import { View, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Main, BentoCard, AppText, JapaneseIcon } from '@/components/ui';
import { Fonts, useThemeColors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { triggerHaptic } from '@/utils/haptics';

export default function SecuritySettings() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const activeAccount = useAuthStore((s) => s.activeAccount);
  const updateBiometricSetting = useAuthStore((s) => s.updateBiometricSetting);

  const handleBiometricToggle = async (val: boolean) => {
    if (!activeAccount) return;
    await updateBiometricSetting(activeAccount.id, val);
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
          <AppText variant="serifTitle" style={styles.headerTitle}>Security</AppText>
          <AppText variant="caption" color={colors.textMuted} style={styles.headerSubtitle}>
            防護 · Access & Privacy
          </AppText>
        </View>
      </View>

      <BentoCard variant="light" style={styles.card}>
        <AppText variant="caption" color={colors.textSecondary}>Biometrics</AppText>
        <View style={styles.switchRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <AppText variant="bodyBold">Biometric unlock</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Unlock this profile with fingerprint or Face ID
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
        <AppText variant="caption" color={colors.textMuted}>
          When enabled, you&apos;ll be asked to verify your identity each time you open the app.
        </AppText>
      </BentoCard>

      <BentoCard variant="light" style={styles.card}>
        <AppText variant="caption" color={colors.textSecondary}>Authentication</AppText>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic.selection();
            router.push('/(tabs)/settings/account' as Href);
          }}
          style={[styles.securityActionRow, { borderColor: colors.border }]}
        >
          <View style={{ flex: 1 }}>
            <AppText variant="bodyBold">
              {activeAccount?.isLocal ? 'Device passcode or PIN' : 'Account password'}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Manage and update your login credentials
            </AppText>
          </View>
          <JapaneseIcon name="chevronRight" size={16} color={colors.textSecondary} strokeWidth={2.2} />
        </TouchableOpacity>
      </BentoCard>

      <BentoCard variant="light" style={styles.card}>
        <AppText variant="caption" color={colors.textSecondary}>Ledger privacy</AppText>
        <View style={styles.infoRow}>
          <JapaneseIcon name="kamonLock" size={18} color={colors.textSecondary} />
          <AppText variant="caption" color={colors.textSecondary} style={{ flex: 1, lineHeight: 18 }}>
            Your ledger is securely encrypted on your device and privately synced to your account when signed in. No personal or financial data is ever shared.
          </AppText>
        </View>
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
    width: 32,
    height: 32,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  securityActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 18,
    marginTop: 1,
  },
});
