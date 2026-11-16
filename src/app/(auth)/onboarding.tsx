import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
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
import { signUpWithEmail, getAuthErrorMessage } from '@/services/firebaseAuth';
import { sendEmailVerificationCode, verifyEmailCode } from '@/services/emailVerification';
import { triggerHaptic } from '@/utils/haptics';
import Animated, { FadeIn } from 'react-native-reanimated';


export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const startAccountOnboarding = useAuthStore((s) => s.startAccountOnboarding);
  const startLocalAccountOnboarding = useAuthStore((s) => s.startLocalAccountOnboarding);

  const [isProcessing, setIsProcessing] = useState(false);
  const [authMode, setAuthMode] = useState<'options' | 'emailInput' | 'verifyCode'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((t) => (t > 0 ? t - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const handleGuestMode = async () => {
    setIsProcessing(true);
    try {
      await startLocalAccountOnboarding();
      router.push('/(auth)/setup-password');
    } catch (err: any) {
      Alert.alert('Guest Mode', err?.message || 'Could not create a local profile.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestVerificationCode = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Password Length', 'Password must be at least 6 characters.');
      return;
    }

    triggerHaptic.selection();
    setIsProcessing(true);
    try {
      await sendEmailVerificationCode(trimmedEmail);
      triggerHaptic.success();
      setVerificationCode('');
      setAuthMode('verifyCode');
      setResendTimer(30);
    } catch (err: any) {
      Alert.alert('Verification Notice', err?.message || 'Could not dispatch verification code.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || isProcessing) return;
    await handleRequestVerificationCode();
  };

  const handleVerifyAndSignUp = async () => {
    const trimmedCode = verificationCode.trim();
    if (!trimmedCode || trimmedCode.length !== 6) {
      Alert.alert('Verification Code', 'Please enter the 6-digit verification code.');
      return;
    }

    triggerHaptic.medium();
    setIsProcessing(true);
    try {
      const verifyResult = verifyEmailCode(email, trimmedCode);
      if (!verifyResult.valid) {
        Alert.alert('Verification Failed', verifyResult.message);
        setIsProcessing(false);
        return;
      }

      // Code is valid! Proceed to create the Firebase account
      const res = await signUpWithEmail(email.trim(), password.trim());
      await startAccountOnboarding(res.profile, res.tokens);
      triggerHaptic.success();
      router.push('/(auth)/setup-password');
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        Alert.alert(
          'Account Already Exists',
          'An account with this email already exists. Would you like to sign in instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign In',
              style: 'default',
              onPress: () => router.push('/(auth)/login'),
            },
          ]
        );
      } else {
        Alert.alert('Sign Up Error', getAuthErrorMessage(err));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const isFormMode = authMode !== 'options';

  return (
    <Main
      showArt
      artOpacity={0.11}
      contentContainerStyle={[
        styles.scrollContent,
        isFormMode && { justifyContent: 'flex-start' },
      ]}
    >
        <View style={styles.mainContent}>
          <Animated.View
            key={authMode}
            entering={FadeIn.duration(260)}
            style={styles.animatedContent}
          >
          {isFormMode ? (
            <>
              {/* Header Row */}
              <View style={styles.headerRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    triggerHaptic.selection();
                    if (authMode === 'verifyCode') {
                      setAuthMode('emailInput');
                    } else {
                      setAuthMode('options');
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
                    {authMode === 'verifyCode' ? 'Edit Email' : 'Options'}
                  </AppText>
                </TouchableOpacity>

                <HankoStamp size="sm" />
              </View>

              {/* Title Bento Card */}
              <BentoCard variant="light" style={styles.titleCard}>
                <View style={styles.titleMeta}>
                  <AppText variant="caption" color={colors.textSecondary} style={styles.kicker}>
                    {authMode === 'verifyCode' ? '認証 · VERIFY EMAIL' : '新規登録 · CREATE ACCOUNT'}
                  </AppText>
                  <AppText variant="serifTitle" style={styles.title}>
                    {authMode === 'verifyCode' ? 'Verification Code' : 'Sign Up'}
                  </AppText>
                </View>
                <AppText variant="caption" color={colors.textSecondary} style={styles.subtitle}>
                  {authMode === 'verifyCode'
                    ? `Enter the 6-digit code sent to ${email}`
                    : 'Create your account to sync your ledger securely'}
                </AppText>
              </BentoCard>

              {authMode === 'verifyCode' ? (
                <>
                  {/* Verification Form Card */}
                  <BentoCard variant="light" style={styles.formCard}>
                    <View style={styles.fieldGroup}>
                      <AppText variant="caption" color={colors.textSecondary} style={styles.fieldLabel}>
                        6-DIGIT VERIFICATION CODE
                      </AppText>
                      <TextInput
                        placeholder="• • • • • •"
                        placeholderTextColor={colors.textMuted}
                        value={verificationCode}
                        onChangeText={setVerificationCode}
                        keyboardType="number-pad"
                        maxLength={6}
                        returnKeyType="done"
                        onSubmitEditing={handleVerifyAndSignUp}
                        style={[
                          styles.codeInput,
                          {
                            color: colors.textPrimary,
                            borderColor: colors.border,
                            backgroundColor: colors.background,
                          },
                        ]}
                      />
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={isProcessing}
                      style={[
                        styles.primaryButton,
                        { backgroundColor: colors.textPrimary },
                      ]}
                      onPress={handleVerifyAndSignUp}
                    >
                      {isProcessing ? (
                        <View style={styles.buttonLoadingRow}>
                          <ActivityIndicator size="small" color={colors.background} />
                          <AppText variant="bodyBold" color={colors.background}>
                            Verifying…
                          </AppText>
                        </View>
                      ) : (
                        <AppText variant="bodyBold" color={colors.background}>
                          Verify & Create Account
                        </AppText>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleResendCode}
                      disabled={resendTimer > 0 || isProcessing}
                      style={styles.resendCodeBtn}
                    >
                      <AppText
                        variant="caption"
                        color={resendTimer > 0 ? colors.textMuted : colors.textPrimary}
                        style={{ fontFamily: resendTimer === 0 ? Fonts.sansBold : Fonts.sans, textAlign: 'center' }}
                      >
                        {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend verification code'}
                      </AppText>
                    </TouchableOpacity>
                  </BentoCard>

                  {/* Switch to Edit Email Card */}
                  <BentoCard variant="light" style={styles.switchCard}>
                    <View style={styles.switchRow}>
                      <View style={{ flex: 1 }}>
                        <AppText variant="bodyBold">Wrong email address?</AppText>
                        <AppText variant="caption" color={colors.textSecondary}>
                          Edit your email address or password.
                        </AppText>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setAuthMode('emailInput')}
                        disabled={isProcessing}
                        style={[
                          styles.secondaryActionBtn,
                          { borderColor: colors.border, backgroundColor: colors.cardElevated },
                        ]}
                      >
                        <AppText variant="caption" color={colors.textPrimary} style={styles.actionBtnText}>
                          Edit Email →
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  </BentoCard>
                </>
              ) : (
                <>
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
                          placeholder="Min 6 characters"
                          placeholderTextColor={colors.textMuted}
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          returnKeyType="done"
                          onSubmitEditing={handleRequestVerificationCode}
                          style={[styles.passwordInput, { color: colors.textPrimary }]}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={isProcessing}
                      style={[
                        styles.primaryButton,
                        { backgroundColor: colors.textPrimary },
                      ]}
                      onPress={handleRequestVerificationCode}
                    >
                      {isProcessing ? (
                        <View style={styles.buttonLoadingRow}>
                          <ActivityIndicator size="small" color={colors.background} />
                          <AppText variant="bodyBold" color={colors.background}>
                            Sending code…
                          </AppText>
                        </View>
                      ) : (
                        <AppText variant="bodyBold" color={colors.background}>
                          Send Verification Code
                        </AppText>
                      )}
                    </TouchableOpacity>
                  </BentoCard>

                  {/* Switch to Sign In BentoCard */}
                  <BentoCard variant="light" style={styles.switchCard}>
                    <View style={styles.switchRow}>
                      <View style={{ flex: 1 }}>
                        <AppText variant="bodyBold">Already have an account?</AppText>
                        <AppText variant="caption" color={colors.textSecondary}>
                          Sign in to restore your existing ledger.
                        </AppText>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          triggerHaptic.selection();
                          router.push('/(auth)/login');
                        }}
                        style={[
                          styles.secondaryActionBtn,
                          { borderColor: colors.border, backgroundColor: colors.cardElevated },
                        ]}
                      >
                        <AppText variant="caption" color={colors.textPrimary} style={styles.actionBtnText}>
                          Sign In →
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  </BentoCard>
                </>
              )}
            </>
          ) : (
            <>
              <View style={styles.welcomeHeader}>
                <View style={styles.brandLockup}>
                <AppText style={styles.kanjiLogo}>余白</AppText>
                <AppText
                  variant="caption"
                  color={colors.textSecondary}
                  style={styles.romajiSub}
                >
                  Y O H A K U
                </AppText>
                </View>
              </View>

              <View style={styles.welcomeBlock}>
                <AppText variant="caption" color={colors.textSecondary} style={styles.welcomeKicker}>
                  A QUIET LEDGER FOR EVERYDAY LIFE
                </AppText>
                <AppText variant="serifTitle" style={styles.welcomeTitle}>
                  Make room for what matters.
                </AppText>
                <AppText variant="body" color={colors.textSecondary} style={styles.welcomeSubtitle}>
                  Track spending, save with intention, and keep your finances close.
                </AppText>
              </View>

              <BentoCard variant="light" style={styles.authCard}>
                <AppText variant="caption" color={colors.textSecondary} style={styles.getStartedLabel}>
                  START YOUR LEDGER
                </AppText>

                <View style={styles.authActions}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isProcessing}
                    style={[
                      styles.primaryButton,
                      { backgroundColor: colors.textPrimary },
                    ]}
                    onPress={handleGuestMode}
                  >
                    <AppText variant="bodyBold" color={colors.background}>
                      {isProcessing ? 'Setting up…' : 'Guest Mode'}
                    </AppText>
                  </TouchableOpacity>
                  <AppText
                    variant="caption"
                    color={colors.textMuted}
                    style={styles.guestNote}
                  >
                    Local only · no account needed
                  </AppText>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isProcessing}
                    style={[
                      styles.secondaryButton,
                      { borderColor: colors.border, backgroundColor: colors.cardElevated },
                    ]}
                    onPress={() => setAuthMode('emailInput')}
                  >
                    <AppText variant="bodyBold" color={colors.textPrimary}>
                      Create Account with Email
                    </AppText>
                  </TouchableOpacity>

                  <View style={styles.signInRow}>
                    <AppText variant="caption" color={colors.textSecondary}>
                      Already have an account?
                    </AppText>
                    <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isProcessing}
                    onPress={() => {
                      triggerHaptic.selection();
                      router.push('/(auth)/login');
                    }}
                    >
                      <AppText variant="bodyBold" color={colors.textPrimary}>
                        Sign in →
                      </AppText>
                    </TouchableOpacity>
                  </View>
                </View>

                <AppText variant="caption" color={colors.textMuted} style={styles.privacySub}>
                  Guest mode stays on this device. Create an account to sync securely across devices.
                </AppText>
              </BentoCard>
            </>
          )}
          </Animated.View>
        </View>

      </Main>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 0,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  mainContent: {
    gap: 18,
  },
  animatedContent: {
    gap: 18,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  brandLockup: {
    gap: 2,
  },
  welcomeBlock: {
    alignItems: 'center',
    paddingTop: 22,
    paddingHorizontal: 12,
    gap: 6,
  },
  welcomeKicker: {
    letterSpacing: 1.6,
    fontSize: 9,
  },
  welcomeTitle: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 28,
  },
  welcomeSubtitle: {
    maxWidth: 310,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 4,
  },
  authActions: {
    gap: 10,
    marginTop: 18,
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 10,
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
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resendCodeBtn: {
    alignItems: 'center',
    paddingVertical: 6,
    marginTop: 2,
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
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  brandCard: {
    flex: 1.35,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  kanjiLogo: {
    fontFamily: Fonts.serif,
    fontSize: 38,
    lineHeight: 45,
  },
  romajiSub: {
    marginTop: 2,
    letterSpacing: 3,
    fontSize: 11,
  },
  brandUnderline: {
    width: 28,
    height: 1.5,
    marginTop: 10,
  },
  rightCol: {
    flex: 1,
    gap: 12,
  },
  stampCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  stampLabel: {
    marginTop: 6,
    letterSpacing: 1.5,
    fontSize: 9,
  },
  clarityDarkCard: {
    padding: 12,
  },
  clarityQuote: {
    lineHeight: 14,
    fontStyle: 'italic',
    fontSize: 10,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  sailboatBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sailTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 0,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: 2,
  },
  boatHull: {
    width: 24,
    height: 4,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderRadius: 2,
  },
  featureTextCol: {
    flex: 1,
  },
  featureDesc: {
    marginTop: 4,
    lineHeight: 16,
  },
  driveStripCard: {
    padding: 14,
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driveStripTitle: {
    letterSpacing: 1.2,
    fontSize: 10,
    fontWeight: '600',
  },
  authCard: {
    padding: 16,
    gap: 12,
  },
  getStartedLabel: {
    letterSpacing: 2,
    fontSize: 10,
    textAlign: 'center',
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  signInNavButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  signInNavContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  codeInput: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
    fontFamily: Fonts.mono,
  },
  privacySub: {
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
  },
  guestNote: {
    textAlign: 'center',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  footerText: {
    textAlign: 'center',
    letterSpacing: 1,
    marginVertical: 14,
    fontSize: 11,
  },
});
