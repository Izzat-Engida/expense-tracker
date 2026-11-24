import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Main,
  AppText,
  HankoStamp,
  JapaneseIcon,
} from '@/components/ui';
import { Fonts, useThemeColors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { triggerAuthHaptic } from '@/utils/haptics';

export default function SetupPasswordScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();

  const pendingAccount = useAuthStore((s) => s.pendingAccount);
  const completePasswordSetup = useAuthStore((s) => s.completePasswordSetup);
  const biometricHardwareAvailable = useAuthStore((s) => s.biometricHardwareAvailable);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(biometricHardwareAvailable);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!pendingAccount) {
    return (
      <Main
        showArt
        artOpacity={0.11}
        contentContainerStyle={styles.container}
      >
        <View style={styles.contentWrap}>
          <View style={[styles.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <AppText variant="serifTitle" style={styles.welcomeTitle}>No profile selected</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Please return to the welcome screen to begin.
            </AppText>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.textPrimary }]}
              onPress={() => router.replace('/(auth)/onboarding')}
            >
              <AppText variant="bodyBold" color={colors.background} style={styles.buttonText}>
                Return to onboarding
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Main>
    );
  }

  const handleSave = async () => {
    if (pendingAccount.isLocal && !displayName.trim()) {
      Alert.alert('Required', 'Please enter a profile name.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Required', 'Please enter a password or PIN.');
      return;
    }
    if (password.length < 4) {
      Alert.alert('Too Short', 'Password or PIN should be at least 4 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      await completePasswordSetup(
        password,
        biometricEnabled,
        pendingAccount.isLocal ? displayName.trim() : undefined
      );
      triggerAuthHaptic.success();
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not save profile setup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Main
      showArt
      artOpacity={0.11}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.contentWrap}>
        {/* Top Navigation */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              triggerAuthHaptic.selection();
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

        {/* Welcome Block */}
        <View style={styles.welcomeBlock}>
          <View style={styles.brandLockup}>
            <AppText style={styles.kanjiLogo}>余白</AppText>
            <AppText variant="caption" color={colors.textSecondary} style={styles.romajiSub}>
              Y O H A K U
            </AppText>
          </View>
          <AppText variant="caption" color={colors.textSecondary} style={styles.welcomeKicker}>
            {pendingAccount.isLocal ? '記帳 · Guest mode setup' : '防護 · Account security'}
          </AppText>
          <AppText variant="serifTitle" style={styles.welcomeTitle}>
            {pendingAccount.isLocal ? 'Name your ledger.' : 'Set your password.'}
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.welcomeSubtitle}>
            {pendingAccount.isLocal
              ? 'Your data stays private and stored strictly on this device.'
              : 'Choose a password to secure your isolated financial records.'}
          </AppText>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {pendingAccount.isLocal && (
            <View style={styles.fieldGroup}>
              <AppText variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
                Profile name
              </AppText>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="e.g. Personal or Business"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    color: colors.textPrimary,
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
                autoCapitalize="words"
                maxLength={30}
                returnKeyType="next"
              />
            </View>
          )}

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <AppText variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
                {pendingAccount.isLocal ? 'Create passcode or PIN' : 'Password or PIN'}
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
              placeholder="Minimum 4 characters"
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
              returnKeyType="next"
            />
          </View>

          <View style={styles.fieldGroup}>
            <AppText variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
              {pendingAccount.isLocal ? 'Confirm passcode or PIN' : 'Confirm password'}
            </AppText>
            <TextInput
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter passcode or PIN"
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
              onSubmitEditing={handleSave}
            />
          </View>

          {biometricHardwareAvailable && (
            <View
              style={[
                styles.biometricCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.switchRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <AppText variant="bodyBold" style={{ fontSize: 13 }}>
                    Biometric unlock
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    Quick access with fingerprint or Face ID
                  </AppText>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={setBiometricEnabled}
                  trackColor={{ false: colors.switchTrackOff, true: colors.bambooGreen }}
                  thumbColor={colors.switchThumb}
                  ios_backgroundColor={colors.switchTrackOff}
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isSubmitting}
            onPress={handleSave}
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.textPrimary,
              },
            ]}
          >
            {isSubmitting ? (
              <View style={styles.buttonLoadingRow}>
                <ActivityIndicator size="small" color={colors.background} />
                <AppText variant="bodyBold" color={colors.background} style={styles.buttonText}>
                  Setting up ledger…
                </AppText>
              </View>
            ) : (
              <AppText variant="bodyBold" color={colors.background} style={styles.buttonText}>
                {pendingAccount.isLocal ? 'Start local ledger' : 'Complete setup'}
              </AppText>
            )}
          </TouchableOpacity>
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
  },
  biometricCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryButton: {
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
  footerText: {
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 11,
  },
});
