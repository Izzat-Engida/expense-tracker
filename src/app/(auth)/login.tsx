import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Main,
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
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

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
    <>
      <Main
        showArt
        artOpacity={0.11}
        contentContainerStyle={styles.scrollContent}
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

          {/* Welcome Block */}
          <View style={styles.welcomeBlock}>
            <View style={styles.brandLockup}>
              <AppText style={styles.kanjiLogo}>余白</AppText>
              <AppText variant="caption" color={colors.textSecondary} style={styles.romajiSub}>
                Y O H A K U
              </AppText>
            </View>
            <AppText variant="caption" color={colors.textSecondary} style={styles.welcomeKicker}>
              再訪 · Welcome back
            </AppText>
            <AppText variant="serifTitle" style={styles.welcomeTitle}>
              Sign in to your ledger.
            </AppText>
            <AppText variant="body" color={colors.textSecondary} style={styles.welcomeSubtitle}>
              Sync your accounts and continue tracking with intention.
            </AppText>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            <View style={styles.fieldGroup}>
              <AppText variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
                Email address
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
                    backgroundColor: colors.card,
                  },
                ]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.passwordLabelRow}>
                <AppText variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
                  Password
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
                    backgroundColor: colors.card,
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
                  <AppText variant="bodyBold" color={colors.background} style={styles.buttonText}>
                    Signing in…
                  </AppText>
                </View>
              ) : (
                <AppText variant="bodyBold" color={colors.background} style={styles.buttonText}>
                  Sign In
                </AppText>
              )}
            </TouchableOpacity>

            {/* New account / Guest options */}
            <View style={styles.switchRow}>
              <AppText variant="caption" color={colors.textSecondary}>
                New to Yohaku?
              </AppText>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  triggerHaptic.selection();
                  router.replace('/(auth)/onboarding');
                }}
              >
                <AppText variant="bodyBold" color={colors.textPrimary}>
                  Get started
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <AppText variant="caption" color={colors.textMuted} style={styles.footerText}>
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
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="serifTitle" style={styles.modalTitle}>
                  Reset password
                </AppText>
                <AppText variant="caption" color={colors.textSecondary} style={styles.modalSubtitle}>
                  Enter your registered email address and we will dispatch a reset link to your inbox.
                </AppText>
              </View>
              <TouchableOpacity
                onPress={() => setShowForgotModal(false)}
                disabled={isResetting}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppText style={{ fontSize: 16, color: colors.textSecondary }}>✕</AppText>
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputGroup}>
              <AppText variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
                Email address
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
                  { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.cardElevated },
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
                  <AppText variant="bodyBold" color={colors.background} style={styles.buttonText}>
                    Dispatching link…
                  </AppText>
                </View>
              ) : (
                <AppText variant="bodyBold" color={colors.background} style={styles.buttonText}>
                  Send password reset link
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
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
    justifyContent: 'flex-start',
  },
  contentWrap: {
    gap: 16,
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
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  backBtnText: {
    fontFamily: Fonts.sansBold,
    fontSize: 13,
  },
  welcomeBlock: {
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  brandLockup: {
    gap: 2,
    alignItems: 'center',
    marginBottom: 4,
  },
  kanjiLogo: {
    fontFamily: Fonts.serif,
    fontSize: 34,
    lineHeight: 40,
  },
  romajiSub: {
    letterSpacing: 3,
    fontSize: 10,
  },
  welcomeKicker: {
    fontSize: 11,
    marginTop: 4,
  },
  welcomeTitle: {
    fontSize: 26,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    maxWidth: 300,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 13,
  },
  formContainer: {
    paddingHorizontal: 4,
    gap: 12,
    maxWidth: 320,
    width: '100%',
    alignSelf: 'center',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 11,
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
    height: 44,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -2,
  },
  primaryButton: {
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
  },
  footerText: {
    textAlign: 'center',
    marginVertical: 14,
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 24, 22, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    maxWidth: 340,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInputGroup: {
    gap: 6,
  },
  modalActionBtn: {
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
