import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Main,
  BentoCard,
  HankoStamp,
  AppText,
  JapaneseIcon,
} from '@/components/ui';
import { Fonts, useThemeColors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import {
  signInWithEmail,
  sendPasswordReset,
  getAuthErrorMessage,
} from '@/services/firebaseAuth';
import { triggerHaptic } from '@/utils/haptics';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const signInExistingAccount = useAuthStore((s) => s.signInExistingAccount);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleBack = () => {
    triggerHaptic.selection();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/onboarding');
    }
  };

  const handleOpenForgotModal = () => {
    triggerHaptic.selection();
    setResetEmailInput(email.trim());
    setShowForgotModal(true);
  };

  const handleSendResetLink = async () => {
    const trimmed = resetEmailInput.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter your registered email address.');
      return;
    }

    setIsResetting(true);
    try {
      await sendPasswordReset(trimmed);
      triggerHaptic.success();
      setShowForgotModal(false);
      Alert.alert(
        'Reset Email Dispatched',
        `A password reset link has been dispatched to ${trimmed}. Please check your inbox and follow the instructions.`
      );
    } catch (err: any) {
      Alert.alert('Reset Failed', getAuthErrorMessage(err));
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }
    if (!password) {
      Alert.alert('Required', 'Please enter your password.');
      return;
    }

    triggerHaptic.medium();
    setIsProcessing(true);
    try {
      const res = await signInWithEmail(trimmedEmail, password);
      await signInExistingAccount(res.profile, res.tokens, password);
      triggerHaptic.success();
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = getAuthErrorMessage(err);
      Alert.alert('Sign In Failed', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <Main contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.contentWrap}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleBack}
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
                Onboarding
              </AppText>
            </TouchableOpacity>

            <HankoStamp size="sm" />
          </View>

          {/* Title Card */}
          <BentoCard variant="light" style={styles.titleCard}>
            <View style={styles.titleMeta}>
              <AppText variant="caption" color={colors.textSecondary} style={styles.kicker}>
                再訪 · WELCOME BACK
              </AppText>
              <AppText variant="serifTitle" style={styles.title}>
                Sign In
              </AppText>
            </View>
            <AppText variant="caption" color={colors.textSecondary} style={styles.subtitle}>
              Sign in to your existing account
            </AppText>
          </BentoCard>

          {/* Credentials Card */}
          <BentoCard variant="light" style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <AppText variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
                EMAIL ADDRESS
              </AppText>
              <TextInput
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                style={[
                  styles.input,
                  {
                    color: colors.textPrimary,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.passwordLabelRow}>
                <AppText variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
                  PASSWORD
                </AppText>
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <AppText variant="caption" color={colors.textSecondary}>
                    {showPassword ? 'Hide' : 'Show'}
                  </AppText>
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.passwordInputWrap,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <TextInput
                  placeholder="Enter your account password"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  style={[styles.passwordInput, { color: colors.textPrimary }]}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleOpenForgotModal}
              disabled={isResetting || isProcessing}
              style={styles.forgotBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppText variant="caption" color={colors.textSecondary}>
                Forgot password?
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isProcessing}
              style={[
                styles.primaryButton,
                { backgroundColor: colors.textPrimary },
              ]}
              onPress={handleLogin}
            >
              {isProcessing ? (
                <View style={styles.buttonLoadingRow}>
                  <ActivityIndicator size="small" color={colors.background} />
                  <AppText variant="bodyBold" color={colors.background}>
                    Signing in…
                  </AppText>
                </View>
              ) : (
                <AppText variant="bodyBold" color={colors.background}>
                  Sign In
                </AppText>
              )}
            </TouchableOpacity>
          </BentoCard>

          {/* New account / Guest options */}
          <BentoCard variant="light" style={styles.switchCard}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold">New to Yohaku?</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  Create a new synced account or use local Guest Mode.
                </AppText>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  triggerHaptic.selection();
                  router.replace('/(auth)/onboarding');
                }}
                style={[
                  styles.secondaryActionBtn,
                  { borderColor: colors.border, backgroundColor: colors.cardElevated },
                ]}
              >
                <AppText variant="caption" color={colors.textPrimary} style={styles.actionBtnText}>
                  Get Started →
                </AppText>
              </TouchableOpacity>
            </View>
          </BentoCard>
        </View>

        <AppText variant="caption" color={colors.textSecondary} style={styles.footerText}>
          Less noise. More intention.
        </AppText>
      </Main>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isResetting) setShowForgotModal(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="serifTitle" style={styles.modalTitle}>
                  Reset Password
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={styles.modalSubtitle}>
                  Enter your registered email address and we will dispatch a reset link to your inbox.
                </AppText>
              </View>
              <TouchableOpacity
                onPress={() => setShowForgotModal(false)}
                disabled={isResetting}
                style={[styles.modalCloseBtn, { borderColor: colors.border, backgroundColor: colors.cardElevated }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppText style={{ fontSize: 16, color: colors.textPrimary }}>✕</AppText>
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputGroup}>
              <AppText variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
                EMAIL ADDRESS
              </AppText>
              <TextInput
                value={resetEmailInput}
                onChangeText={setResetEmailInput}
                placeholder="your.email@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSendResetLink}
                style={[
                  styles.input,
                  { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background },
                ]}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isResetting}
              onPress={handleSendResetLink}
              style={[styles.modalActionBtn, { backgroundColor: colors.textPrimary }]}
            >
              {isResetting ? (
                <View style={styles.buttonLoadingRow}>
                  <ActivityIndicator size="small" color={colors.background} />
                  <AppText variant="bodyBold" color={colors.background}>
                    Dispatching link…
                  </AppText>
                </View>
              ) : (
                <AppText variant="bodyBold" color={colors.background}>
                  Send Password Reset Link
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    justifyContent: 'space-between',
  },
  contentWrap: {
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginBottom: 4,
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
  titleCard: {
    padding: 16,
    gap: 8,
  },
  titleMeta: {
    gap: 2,
  },
  kicker: {
    letterSpacing: 2,
    fontSize: 10,
  },
  title: {
    fontSize: 24,
  },
  subtitle: {
    lineHeight: 17,
  },
  formCard: {
    padding: 16,
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    letterSpacing: 1.2,
    fontSize: 10,
    fontWeight: '600',
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchCard: {
    padding: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize: 12,
  },
  footerText: {
    textAlign: 'center',
    letterSpacing: 1,
    marginVertical: 14,
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    gap: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 4,
  },
  modalSubtitle: {
    lineHeight: 16,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInputGroup: {
    gap: 6,
  },
  modalActionBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
