import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Main,
  BentoCard,
  AppText,
  HankoStamp,
  PillBadge,
} from '@/components/ui';
import { Fonts, useThemeColors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import type { GoogleAccount } from '@/types/auth';

export default function SelectAccountScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();

  const accounts = useAuthStore((s) => s.accounts);
  const unlockWithBiometrics = useAuthStore((s) => s.unlockWithBiometrics);
  const removeAccount = useAuthStore((s) => s.removeAccount);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);

  const handleSelectAccount = async (account: GoogleAccount) => {
    if (account.biometricEnabled) {
      const success = await unlockWithBiometrics(account.id);
      if (success) {
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
    router.push('/(auth)/onboarding');
  };

  const confirmRemoveAccount = (account: GoogleAccount) => {
    const isLocal = account.isLocal;
    Alert.alert(
      'Profile Options',
      isLocal
        ? `Manage profile "${account.name}":`
        : `Manage "${account.name}" (${account.email}):`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove from Device',
          style: 'default',
          onPress: async () => {
            await removeAccount(account.id);
            if (accounts.length <= 1) {
              router.replace('/(auth)/onboarding');
            }
          },
        },
        {
          text: 'Delete Profile & Data',
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              'Confirm Permanent Deletion',
              isLocal
                ? `Are you sure you want to permanently delete profile "${account.name}"? All local ledger data on this device will be deleted.`
                : `Are you sure you want to permanently delete "${account.name}"? All local and cloud data will be destroyed.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Permanently',
                  style: 'destructive',
                  onPress: async () => {
                    await deleteAccount(account.id);
                    if (accounts.length <= 1) {
                      router.replace('/(auth)/onboarding');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <Main contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.headerLeft}>
          <AppText variant="caption" color={colors.textSecondary} style={styles.kicker}>
            ACCOUNT SWITCHER
          </AppText>
          <AppText variant="serifTitle" style={styles.title}>
            Select Account
          </AppText>
        </View>
        <HankoStamp size="sm" />
      </View>

      <ScrollView contentContainerStyle={styles.accountList} showsVerticalScrollIndicator={false}>
        {accounts.map((acc) => (
          <BentoCard key={acc.id} variant="light" style={styles.accountCard}>
            <TouchableOpacity
              style={styles.cardTouch}
              activeOpacity={0.7}
              onPress={() => handleSelectAccount(acc)}
            >
              <View style={[styles.avatarBox, { backgroundColor: colors.border }]}>
                <AppText style={styles.avatarText}>
                  {acc.name ? acc.name.charAt(0).toUpperCase() : 'U'}
                </AppText>
              </View>

              <View style={styles.accountMeta}>
                <AppText variant="bodyBold" numberOfLines={1}>
                  {acc.name}
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                  {acc.isLocal ? 'Local Profile · Offline' : acc.email}
                </AppText>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                  {acc.isLocal && (
                    <PillBadge label="Local" variant="outline" style={styles.biometricBadge} />
                  )}
                  {acc.biometricEnabled && (
                    <PillBadge label="Biometrics" variant="outline" style={styles.biometricBadge} />
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => confirmRemoveAccount(acc)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <AppText variant="caption" color={colors.textMuted}>
                  Remove
                </AppText>
              </TouchableOpacity>
            </TouchableOpacity>
          </BentoCard>
        ))}

        <TouchableOpacity
          style={[styles.addCard, { borderColor: colors.border }]}
          activeOpacity={0.8}
          onPress={handleAddAccount}
        >
          <AppText variant="bodyBold" color={colors.textPrimary}>
            + Add Another Account
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Sign in with email or guest mode
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    </Main>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 18,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  headerLeft: {
    gap: 4,
  },
  kicker: {
    letterSpacing: 2,
    fontSize: 10,
  },
  title: {
    fontSize: 24,
  },
  accountList: {
    gap: 12,
    paddingBottom: 24,
  },
  accountCard: {
    padding: 12,
  },
  cardTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.sansBold,
    fontSize: 18,
  },
  accountMeta: {
    flex: 1,
    gap: 2,
  },
  biometricBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  removeBtn: {
    padding: 6,
  },
  addCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
