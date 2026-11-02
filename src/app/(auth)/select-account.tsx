import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
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
import { promptGoogleAuth, getGoogleClientId } from '@/services/auth';
import type { GoogleUserProfile, AuthTokens, GoogleAccount } from '@/types/auth';

export default function SelectAccountScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColors();

  const accounts = useAuthStore((s) => s.accounts);
  const unlockWithBiometrics = useAuthStore((s) => s.unlockWithBiometrics);
  const startAccountOnboarding = useAuthStore((s) => s.startAccountOnboarding);
  const removeAccount = useAuthStore((s) => s.removeAccount);

  const [devModalVisible, setDevModalVisible] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectAccount = async (account: GoogleAccount) => {
    if (account.biometricEnabled) {
      // Prompt biometrics first
      const success = await unlockWithBiometrics(account.id);
      if (success) {
        router.replace('/(tabs)');
        return;
      }
    }
    // Fallback to password entry if biometrics fail, user cancels, or not enabled
    router.push({
      pathname: '/(auth)/unlock-password',
      params: { accountId: account.id },
    });
  };

  const handleAddAccount = async () => {
    const clientId = getGoogleClientId();

    if (!clientId) {
      // In development / before Google Console keys are configured:
      // Show developer account creation modal
      setDevModalVisible(true);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await promptGoogleAuth();
      if (res) {
        await startAccountOnboarding(res.profile, res.tokens);
        router.push('/(auth)/setup-password');
      }
    } catch (err: any) {
      Alert.alert(
        'Google Sign-In',
        err?.message || 'Could not connect to Google OAuth.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDevCreateAccount = async (name: string, email: string) => {
    setDevModalVisible(false);
    const mockProfile: GoogleUserProfile = {
      id: `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      email,
    };
    const mockTokens: AuthTokens = {
      accessToken: `mock_access_token_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`,
      expiresAt: Date.now() + 3600 * 1000,
    };

    await startAccountOnboarding(mockProfile, mockTokens, true);
    router.push('/(auth)/setup-password');
  };

  const confirmRemoveAccount = (account: GoogleAccount) => {
    Alert.alert(
      'Remove Account',
      `Are you sure you want to remove ${account.name} (${account.email}) from this device?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeAccount(account.id);
            if (accounts.length <= 1) {
              router.replace('/(auth)/onboarding');
            }
          },
        },
      ]
    );
  };

  return (
    <Main contentContainerStyle={styles.container}>
      {/* Top Header */}
      <View style={styles.topRow}>
        <View>
          <AppText style={styles.kanjiLogo}>余白</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            SELECT AN ACCOUNT
          </AppText>
        </View>
        <HankoStamp size="sm" />
      </View>

      <BentoCard variant="light" style={styles.introCard}>
        <AppText variant="serifTitle">Who is using Yohaku?</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          Each Google profile has its own separate SQLite ledger and private Google
          Drive sync file.
        </AppText>
      </BentoCard>

      {/* Account List */}
      <View style={styles.accountsList}>
        {accounts.map((acc) => (
          <TouchableOpacity
            key={acc.id}
            activeOpacity={0.8}
            onPress={() => handleSelectAccount(acc)}
            onLongPress={() => confirmRemoveAccount(acc)}
          >
            <BentoCard variant="light" style={styles.accountCard}>
              <View style={styles.accountCardRow}>
                <View
                  style={[
                    styles.avatarCircle,
                    { backgroundColor: colors.selectionBg, borderColor: colors.border },
                  ]}
                >
                  <AppText style={styles.avatarLetter} color={colors.selectionText}>
                    {acc.name.slice(0, 1).toUpperCase()}
                  </AppText>
                </View>

                <View style={styles.accountInfoCol}>
                  <AppText variant="bodyBold" numberOfLines={1}>
                    {acc.name}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                    {acc.email}
                  </AppText>
                </View>

                <View style={styles.badgesCol}>
                  {acc.biometricEnabled ? (
                    <PillBadge variant="outline" label="🫵 Biometrics" />
                  ) : (
                    <PillBadge variant="outline" label="🔑 Password" />
                  )}
                </View>
              </View>
            </BentoCard>
          </TouchableOpacity>
        ))}

        {/* Add Account Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isProcessing}
          onPress={handleAddAccount}
        >
          <BentoCard
            variant="light"
            style={[styles.addAccountCard, { borderStyle: 'dashed' }]}
          >
            <View style={styles.addAccountRow}>
              <View
                style={[
                  styles.addIconCircle,
                  { borderColor: colors.border, backgroundColor: colors.cardElevated },
                ]}
              >
                <AppText variant="bodyBold" style={{ fontSize: 18 }}>
                  +
                </AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold">Add another Google account</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  Separate salary, personal, or business expenses
                </AppText>
              </View>
            </View>
          </BentoCard>
        </TouchableOpacity>
      </View>

      <AppText variant="caption" color={colors.textMuted} style={styles.footerNote}>
        Long-press any profile to remove it from this device.
      </AppText>

      {/* Developer Quick-Account Picker Modal (when client ID not yet in .env) */}
      <Modal
        visible={devModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDevModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <AppText variant="serifTitle">Add Profile (Dev Mode)</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Google OAuth client ID is not yet defined in .env. You can pick a quick
              sample profile or type a custom email to test separate data ledgers:
            </AppText>

            <View style={styles.sampleButtonsWrap}>
              <TouchableOpacity
                style={[styles.sampleBtn, { borderColor: colors.border }]}
                onPress={() =>
                  handleDevCreateAccount('Work Account', 'work.finance@company.com')
                }
              >
                <AppText variant="bodyBold">💼 Work Profile</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  work.finance@company.com
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sampleBtn, { borderColor: colors.border }]}
                onPress={() =>
                  handleDevCreateAccount('Personal Account', 'personal.savings@gmail.com')
                }
              >
                <AppText variant="bodyBold">🏠 Personal Profile</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  personal.savings@gmail.com
                </AppText>
              </TouchableOpacity>
            </View>

            <View style={[styles.modalDivider, { backgroundColor: colors.divider }]} />

            <AppText variant="caption" color={colors.textSecondary}>
              Or enter custom profile info:
            </AppText>

            <TextInput
              value={customName}
              onChangeText={setCustomName}
              placeholder="Profile Name (e.g. Side Hustle)"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.modalInput,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.textPrimary,
                },
              ]}
            />
            <TextInput
              value={customEmail}
              onChangeText={setCustomEmail}
              placeholder="Google Email (e.g. user@gmail.com)"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.modalInput,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.textPrimary,
                },
              ]}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setDevModalVisible(false)}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <AppText variant="body">Cancel</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (!customEmail.trim()) {
                    Alert.alert('Required', 'Please enter an email.');
                    return;
                  }
                  handleDevCreateAccount(
                    customName.trim() || customEmail.split('@')[0],
                    customEmail.trim()
                  );
                }}
                style={[styles.confirmBtn, { backgroundColor: colors.selectionBg }]}
              >
                <AppText variant="bodyBold" color={colors.selectionText}>
                  Continue
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
    gap: 16,
    paddingBottom: 28,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  kanjiLogo: {
    fontFamily: Fonts.serif,
    fontSize: 28,
  },
  introCard: {
    paddingVertical: 18,
    gap: 6,
  },
  accountsList: {
    gap: 12,
  },
  accountCard: {
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  accountCardRow: {
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
  avatarLetter: {
    fontSize: 18,
    fontFamily: Fonts.serif,
  },
  accountInfoCol: {
    flex: 1,
    gap: 2,
  },
  badgesCol: {
    alignItems: 'flex-end',
  },
  addAccountCard: {
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  addAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerNote: {
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    gap: 12,
  },
  sampleButtonsWrap: {
    gap: 8,
    marginTop: 4,
  },
  sampleBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    gap: 2,
  },
  modalDivider: {
    height: 1,
    width: '100%',
    marginVertical: 4,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  confirmBtn: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
});
