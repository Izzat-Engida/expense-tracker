import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Main,
  BentoCard,
  AppText,
  HankoStamp,
  PillBadge,
  JapaneseIcon,
} from '@/components/ui';
import { Fonts, useThemeColors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { triggerHaptic } from '@/utils/haptics';

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
      <Main>
        <BentoCard variant="light" style={styles.errorCard}>
          <AppText variant="bodyBold">No account selected</AppText>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.selectionBg }]}
            onPress={() => router.replace('/(auth)/onboarding')}
          >
            <AppText variant="bodyBold" color={colors.selectionText}>
              Return to Onboarding
            </AppText>
          </TouchableOpacity>
        </BentoCard>
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
      Alert.alert('Too Short', 'Password/PIN should be at least 4 characters.');
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
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not save password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Main contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled"  >
        <View style={styles.topNavRow}>
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
            style={[
              styles.backBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <JapaneseIcon
              name="chevronLeft"
              size={16}
              color={colors.textPrimary}
              strokeWidth={2.2}
            />
            <AppText variant="caption" color={colors.textPrimary} style={styles.backBtnText}>
              Back
            </AppText>
          </TouchableOpacity>
          <HankoStamp size="sm" />
        </View>

        <View style={styles.headerRow}>
          <View>
            <AppText variant="serifTitle">Security Setup</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {pendingAccount.isLocal ? 'Profile & Passcode' : 'Account Password & Backup'}
            </AppText>
          </View>
        </View>

        <BentoCard variant="light" style={styles.accountCard}>
          <View style={styles.accountHeader}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: colors.selectionBg, borderColor: colors.border },
              ]}
            >
              <AppText variant="bodyBold" color={colors.selectionText}>
                {pendingAccount.isLocal
                  ? (displayName.trim().slice(0, 1) || 'G').toUpperCase()
                  : (pendingAccount.name?.slice(0, 1) || pendingAccount.email?.slice(0, 1) || 'U').toUpperCase()}
              </AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold">
                {pendingAccount.isLocal
                  ? (displayName.trim() || 'New Guest Profile')
                  : pendingAccount.name}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {pendingAccount.isLocal
                  ? 'Device only · Private offline ledger'
                  : pendingAccount.email}
              </AppText>
            </View>
            <PillBadge
              variant="outline"
              label={pendingAccount.isLocal ? 'Guest Mode' : 'Cloud Sync'}
            />
          </View>
          <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />
          <AppText variant="caption" color={colors.textSecondary}>
            {pendingAccount.isLocal
              ? 'Enter a profile name and password or PIN. All your data stays strictly on this device.'
              : 'Set a password or PIN. If biometrics fail or you restart your phone, this password unlocks your separate data.'}
          </AppText>
        </BentoCard>

        {pendingAccount.isLocal && (
          <BentoCard variant="light" style={styles.formCard}>
            <AppText variant="caption" color={colors.textSecondary}>
              Username
            </AppText>
            <View
              style={[
                styles.inputWrap,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Kakarot"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.textPrimary }]}
                autoCapitalize="words"
                maxLength={30}
              />
            </View>
          
          </BentoCard>
        )}

        <BentoCard variant="light" style={styles.formCard}>
          <AppText variant="caption" color={colors.textSecondary}>
            Create Password or PIN
          </AppText>
          <View
            style={[
              styles.inputWrap,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <TextInput
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter at least 4 characters"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.textPrimary }]}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
              <AppText variant="caption" color={colors.textSecondary}>
                {showPassword ? 'Hide' : 'Show'}
              </AppText>
            </TouchableOpacity>
          </View>

          <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 8 }}>
            Confirm Password or PIN
          </AppText>
          <View
            style={[
              styles.inputWrap,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <TextInput
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter password or PIN"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.textPrimary }]}
              autoCapitalize="none"
            />
          </View>
        </BentoCard>

        {biometricHardwareAvailable && (
          <BentoCard variant="light" style={styles.biometricCard}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <AppText variant="bodyBold">Enable Biometrics</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  Unlock instantly with Fingerprint or Face ID
                </AppText>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: colors.switchTrackOff, true: colors.bambooGreen }}
                thumbColor={colors.switchThumb}
              />
            </View>
          </BentoCard>
        )}

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isSubmitting}
          onPress={handleSave}
          style={[
            styles.primaryButton,
            {
              backgroundColor: colors.selectionBg,
              borderColor: colors.selectionBorder,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <AppText variant="bodyBold" color={colors.selectionText}>
            {isSubmitting
              ? 'Saving Security Setup…'
              : pendingAccount.isLocal
              ? 'Create Local Profile'
              : 'Enter Yohaku'}
          </AppText>
        </TouchableOpacity>
      </Main>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 40,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  backBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  accountCard: {
    gap: 10,
    paddingVertical: 14,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDivider: {
    height: 1,
    width: '100%',
    opacity: 0.15,
  },
  formCard: {
    gap: 6,
    paddingVertical: 16,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    marginTop: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.mono,
  },
  biometricCard: {
    paddingVertical: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryButton: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 1,
    elevation: 3,
    marginTop: 8,
  },
  errorCard: {
    padding: 24,
    gap: 16,
    alignItems: 'center',
  },
});
