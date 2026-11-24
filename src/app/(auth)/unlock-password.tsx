import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Main,
  AppText,
  HankoStamp,
  PillBadge,
  JapaneseIcon,
  UserAvatar,
} from '@/components/ui';
import { Fonts, useThemeColors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { triggerAuthHaptic } from '@/utils/haptics';
import { sendPasswordReset, getAuthErrorMessage } from '@/services/firebaseAuth';

export default function UnlockPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ accountId?: string }>();
  const { colors } = useThemeColors();

  const accounts = useAuthStore((s) => s.accounts);
  const unlockWithPassword = useAuthStore((s) => s.unlockWithPassword);
  const unlockWithBiometrics = useAuthStore((s) => s.unlockWithBiometrics);

  const targetAccount =
    accounts.find((a) => a.id === params.accountId) ||
    accounts[0] ||
    null;

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!targetAccount) {
    return (
      <Main
        showArt
        artOpacity={0.11}
        contentContainerStyle={styles.container}
      >
        <View style={styles.contentWrap}>
          <View style={[styles.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <AppText variant="serifTitle" style={styles.welcomeTitle}>Account not found</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              The requested profile could not be located on this device.
            </AppText>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.textPrimary }]}
              onPress={() => router.replace('/(auth)/select-account')}
            >
              <AppText variant="bodyBold" color={colors.background} style={styles.buttonText}>
                Choose another account
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Main>
    );
  }

  const handleUnlock = async () => {
    if (!password.trim()) {
      Alert.alert('Required', 'Please enter your password or PIN.');
      return;
    }

    setIsUnlocking(true);
    try {
      const success = await unlockWithPassword(targetAccount.id, password);
      if (success) {
        triggerAuthHaptic.success();
        router.replace('/(tabs)');
      } else {
        triggerAuthHaptic.medium();
        Alert.alert('Incorrect Password', 'The password or PIN entered is incorrect.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not verify password.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleBiometricTry = async () => {
    triggerAuthHaptic.selection();
    const success = await unlockWithBiometrics(targetAccount.id);
    if (success) {
      triggerAuthHaptic.success();
      router.replace('/(tabs)');
    }
  };

  const handleBack = () => {
    triggerAuthHaptic.selection();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/select-account');
    }
  };

  const handleForgotPassword = () => {
    if (!targetAccount?.email) return;
    triggerAuthHaptic.selection();

    Alert.alert(
      'Reset Password',
      `Dispatch a password reset link to ${targetAccount.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Reset Link',
          onPress: async () => {
            setIsResetting(true);
            try {
              await sendPasswordReset(targetAccount.email);
              triggerAuthHaptic.success();
              Alert.alert(
                'Reset Email Dispatched',
                `A password reset link has been dispatched to ${targetAccount.email}. Please follow the link instructions in your email, then return here to unlock.`
              );
            } catch (err: any) {
              Alert.alert('Reset Failed', getAuthErrorMessage(err));
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Main
      showArt
      artOpacity={0.11}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.contentWrap}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleBack}
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
              Switch account
            </AppText>
          </TouchableOpacity>
          <HankoStamp size="sm" />
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <UserAvatar
            avatarUrl={targetAccount.avatarUrl}
            name={targetAccount.name || targetAccount.email}
            size={58}
          />
          <View style={styles.profileTextWrap}>
            <AppText variant="serifTitle" style={styles.nameText}>
              {targetAccount.name || 'Profile'}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {targetAccount.isLocal ? 'Local Profile · Offline' : targetAccount.email}
            </AppText>
          </View>
          <PillBadge variant="outline" label="Isolated ledger" />
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <AppText variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
                Password or PIN
              </AppText>
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppText variant="caption" color={colors.textSecondary}>
                  {showPassword ? 'Hide' : 'Show'}
                </AppText>
              </TouchableOpacity>
            </View>
            <TextInput
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password or PIN"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                },
              ]}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleUnlock}
            />
          </View>

          {!targetAccount.isLocal && Boolean(targetAccount.email) && (
            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={isResetting}
              style={styles.forgotBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppText variant="caption" color={colors.textSecondary}>
                {isResetting ? 'Sending reset…' : 'Forgot password?'}
              </AppText>
            </TouchableOpacity>
          )}

          <View style={styles.actionsWrap}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isUnlocking}
              onPress={handleUnlock}
              style={[
                styles.primaryButton,
                {
                  backgroundColor: colors.textPrimary,
                },
              ]}
            >
              {isUnlocking ? (
                <View style={styles.buttonLoadingRow}>
                  <ActivityIndicator size="small" color={colors.background} />
                  <AppText variant="bodyBold" color={colors.background} style={styles.buttonText}>
                    Unlocking…
                  </AppText>
                </View>
              ) : (
                <AppText variant="bodyBold" color={colors.background} style={styles.buttonText}>
                  Unlock profile
                </AppText>
              )}
            </TouchableOpacity>

            {targetAccount.biometricEnabled && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleBiometricTry}
                style={[
                  styles.secondaryButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
              >
                <AppText variant="bodyBold" color={colors.textPrimary} style={styles.buttonText}>
                  Unlock with biometrics
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>

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
  profileCard: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  profileTextWrap: {
    alignItems: 'center',
    gap: 2,
  },
  nameText: {
    fontSize: 20,
  },
  formContainer: {
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 12,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    fontFamily: Fonts.mono,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -2,
    paddingVertical: 4,
  },
  actionsWrap: {
    gap: 8,
    marginTop: 4,
  },
  primaryButton: {
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
  secondaryButton: {
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
  },
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 20,
  },
  footerText: {
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 11,
  },
});
