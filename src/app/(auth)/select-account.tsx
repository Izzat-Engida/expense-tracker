import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Main,
  AppText,
  HankoStamp,
  PillBadge,
  UserAvatar,
  JapaneseIcon,
} from '@/components/ui';
import { Fonts, useThemeColors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import type { GoogleAccount } from '@/types/auth';
import { triggerHaptic } from '@/utils/haptics';

export default function SelectAccountScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();

  const accounts = useAuthStore((s) => s.accounts);
  const unlockWithBiometrics = useAuthStore((s) => s.unlockWithBiometrics);

  const handleSelectAccount = async (account: GoogleAccount) => {
    triggerHaptic.selection();
    if (account.biometricEnabled) {
      const success = await unlockWithBiometrics(account.id);
      if (success) {
        triggerHaptic.success();
        router.replace('/(tabs)');
        return;
      }
    }

    router.push({
      pathname: '/(auth)/unlock-password',
      params: { accountId: account.id },
    });
  };

  const handleAddAccount = () => {
    triggerHaptic.selection();
    router.push('/(auth)/onboarding');
  };

  return (
    <Main
      showArt
      artOpacity={0.11}
      contentContainerStyle={styles.container}
    >
      <View style={styles.contentWrap}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic.selection();
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(auth)/onboarding');
              }
            }}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <JapaneseIcon
              name="chevronLeft"
              size={15}
              color={colors.textPrimary}
              strokeWidth={2.2}
            />
            <AppText variant="caption" color={colors.textPrimary} style={styles.backBtnText}>
              Back
            </AppText>
          </TouchableOpacity>

          <HankoStamp size="sm" />
        </View>

        {/* Welcome / Section Title */}
        <View style={styles.welcomeBlock}>
          <View style={styles.brandLockup}>
            <AppText style={styles.kanjiLogo}>余白</AppText>
            <AppText variant="caption" color={colors.textSecondary} style={styles.romajiSub}>
              Y O H A K U
            </AppText>
          </View>
          <AppText variant="caption" color={colors.textSecondary} style={styles.welcomeKicker}>
            口座 · Switch account
          </AppText>
          <AppText variant="serifTitle" style={styles.welcomeTitle}>
            Select your ledger.
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.welcomeSubtitle}>
            Choose an account to continue tracking with clarity.
          </AppText>
        </View>

        {/* Account List */}
        <ScrollView
          contentContainerStyle={styles.accountList}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {accounts.map((acc) => (
            <TouchableOpacity
              key={acc.id}
              style={[
                styles.accountCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => handleSelectAccount(acc)}
            >
              <UserAvatar
                avatarUrl={acc.avatarUrl}
                name={acc.name}
                size={42}
              />

              <View style={styles.accountMeta}>
                <AppText variant="bodyBold" numberOfLines={1}>
                  {acc.name}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                  {acc.isLocal ? 'Local Profile · Offline' : acc.email}
                </AppText>
                <View style={styles.badgeRow}>
                  {acc.isLocal && (
                    <PillBadge label="Local" variant="outline" style={styles.badgePill} />
                  )}
                  {acc.biometricEnabled && (
                    <PillBadge label="Biometrics" variant="outline" style={styles.badgePill} />
                  )}
                </View>
              </View>

              <JapaneseIcon
                name="chevronRight"
                size={16}
                color={colors.textSecondary}
                strokeWidth={2}
              />
            </TouchableOpacity>
          ))}

          {/* Add Account Action */}
          <TouchableOpacity
            style={[
              styles.addCard,
              {
                borderColor: colors.border,
                backgroundColor: colors.card,
              },
            ]}
            activeOpacity={0.8}
            onPress={handleAddAccount}
          >
            <AppText variant="bodyBold" color={colors.textPrimary} style={styles.addTitle}>
              + Add another account
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Sign in with email or start fresh in guest mode
            </AppText>
          </TouchableOpacity>
        </ScrollView>

        <AppText variant="caption" color={colors.textMuted} style={styles.footerText}>
          Less noise. More intention.
        </AppText>
      </View>
    </Main>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
  },
  contentWrap: {
    maxWidth: 340,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  backBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
  },
  welcomeBlock: {
    paddingHorizontal: 4,
    gap: 4,
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  kanjiLogo: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
  },
  romajiSub: {
    fontSize: 10,
    letterSpacing: 3,
  },
  welcomeKicker: {
    fontSize: 11,
    marginTop: 2,
  },
  welcomeTitle: {
    fontSize: 22,
  },
  welcomeSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  accountList: {
    gap: 10,
    paddingVertical: 4,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  accountMeta: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  badgePill: {
    alignSelf: 'flex-start',
  },
  addCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginTop: 4,
  },
  addTitle: {
    fontSize: 13,
  },
  footerText: {
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 11,
  },
});
