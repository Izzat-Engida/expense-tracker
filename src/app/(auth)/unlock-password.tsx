import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Main,
  BentoCard,
  AppText,
  HankoStamp,
  PillBadge,
} from '@/components/ui';
import { Fonts, useThemeColors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';

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

  if (!targetAccount) {
    return (
      <Main>
        <BentoCard variant="light" style={styles.errorCard}>
          <AppText variant="bodyBold">Account not found</AppText>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.selectionBg }]}
            onPress={() => router.replace('/(auth)/select-account')}
          >
            <AppText variant="bodyBold" color={colors.selectionText}>
              Go to Account Selection
            </AppText>
          </TouchableOpacity>
        </BentoCard>
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
        router.replace('/(tabs)');
      } else {
        Alert.alert('Incorrect Password', 'The password or PIN entered is incorrect.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not verify password.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleBiometricTry = async () => {
    const success = await unlockWithBiometrics(targetAccount.id);
    if (success) {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Main contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/select-account')}
            style={styles.backBtn}
          >
            <AppText variant="caption" color={colors.textSecondary}>
              ‹ Switch Account
            </AppText>
          </TouchableOpacity>
          <HankoStamp size="sm" />
        </View>

        <BentoCard variant="light" style={styles.profileCard}>
          <View
            style={[
              styles.avatarLarge,
              { backgroundColor: colors.selectionBg, borderColor: colors.border },
            ]}
          >
            <AppText style={styles.avatarLetter} color={colors.selectionText}>
              {(targetAccount.name || targetAccount.email || 'U').slice(0, 1).toUpperCase()}
            </AppText>
          </View>
          <AppText variant="serifTitle" style={styles.nameText}>
            {targetAccount.name || 'Profile'}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {targetAccount.isLocal ? 'Local Profile · Offline' : targetAccount.email}
          </AppText>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <PillBadge variant="outline" label="Isolated Ledger" />
        </BentoCard>

        <BentoCard variant="light" style={styles.formCard}>
          <AppText variant="caption" color={colors.textSecondary}>
            Enter Account Password or PIN
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
              placeholder="Password or PIN"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.textPrimary }]}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleUnlock}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
              <AppText variant="caption" color={colors.textSecondary}>
                {showPassword ? 'Hide' : 'Show'}
              </AppText>
            </TouchableOpacity>
          </View>
        </BentoCard>

        <View style={styles.actionsWrap}>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isUnlocking}
            onPress={handleUnlock}
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
              {isUnlocking ? 'Unlocking…' : 'Unlock Profile'}
            </AppText>
          </TouchableOpacity>

          {targetAccount.biometricEnabled && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleBiometricTry}
              style={[
                styles.secondaryButton,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.cardElevated,
                },
              ]}
            >
              <AppText variant="bodyBold" color={colors.textPrimary}>
                Use Biometrics (Fingerprint / Face ID)
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </Main>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  avatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarLetter: {
    fontSize: 28,
    fontFamily: Fonts.serif,
  },
  nameText: {
    fontSize: 22,
  },
  divider: {
    width: 36,
    height: 1.5,
    marginVertical: 4,
    opacity: 0.2,
  },
  formCard: {
    gap: 6,
    paddingVertical: 18,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    marginTop: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.mono,
  },
  actionsWrap: {
    gap: 10,
    marginTop: 4,
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
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    padding: 24,
    gap: 16,
    alignItems: 'center',
  },
});
