import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Main,
  BentoCard,
  HankoStamp,
  ProgressBar,
  AppText,
  JapaneseIcon,
} from '@/components/ui';
import { Fonts, useThemeColors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { signUpWithEmail, getAuthErrorMessage } from '@/services/firebaseAuth';
import { sendEmailVerificationCode, verifyEmailCode } from '@/services/emailVerification';
import { triggerHaptic } from '@/utils/haptics';


export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const startAccountOnboarding = useAuthStore((s) => s.startAccountOnboarding);
  const startLocalAccountOnboarding = useAuthStore((s) => s.startLocalAccountOnboarding);

  const [isProcessing, setIsProcessing] = useState(false);
  const [authMode, setAuthMode] = useState<'options' | 'emailInput' | 'verifyCode'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <Main contentContainerStyle={styles.scrollContent}>
        <View style={styles.mainContent}>
          <View style={styles.topRow}>
            <BentoCard variant="light" style={styles.brandCard}>
              <AppText style={styles.kanjiLogo}>余白</AppText>
              <AppText
                variant="caption"
                color={colors.textSecondary}
                style={styles.romajiSub}
              >
                Y O H A K U
              </AppText>
              <View style={[styles.brandUnderline, { backgroundColor: colors.border }]} />
            </BentoCard>

            <View style={styles.rightCol}>
              <BentoCard variant="light" style={styles.stampCard}>
                <HankoStamp size="md" />
                <AppText variant="caption" style={styles.stampLabel}>
                  STAMP IN
                </AppText>
              </BentoCard>
              <BentoCard variant="dark" art="none" style={styles.clarityDarkCard}>
                <AppText
                  variant="caption"
                  color={colors.textInverse}
                  style={styles.clarityQuote}
                >
                  A little room {'\n'}for clarity.
                </AppText>
              </BentoCard>
            </View>
          </View>

          <BentoCard variant="light" style={styles.featureCard}>
            <View
              style={[
                styles.sailboatBox,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <View style={[styles.sailTriangle, { borderBottomColor: colors.textPrimary }]} />
              <View style={[styles.boatHull, { borderColor: colors.textPrimary }]} />
            </View>
            <View style={styles.featureTextCol}>
              <AppText variant="bodyBold">Track with clarity</AppText>
              <AppText
                variant="caption"
                color={colors.textSecondary}
                style={styles.featureDesc}
              >
                Guest mode stays on this device. Email accounts can sync.
              </AppText>
            </View>
          </BentoCard>

          <BentoCard variant="light" style={styles.driveStripCard}>
            <View style={styles.rowBetween}>
              <AppText variant="caption" style={styles.driveStripTitle}>
                LOCAL FIRST
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                Guest stays local · Email can sync
              </AppText>
            </View>
            <ProgressBar progress={1.0} height={10} />
          </BentoCard>

          <BentoCard variant="light" style={styles.authCard}>
            <AppText
              variant="caption"
              color={colors.textSecondary}
              style={styles.getStartedLabel}
            >
              {authMode === 'verifyCode'
                ? 'V E R I F Y   E M A I L'
                : authMode === 'emailInput'
                ? 'C R E A T E   A C C O U N T'
                : 'G E T   S T A R T E D'}
            </AppText>

            {authMode === 'verifyCode' ? (
              <View style={styles.emailForm}>
                <View style={styles.verifyHeaderWrap}>
                  <AppText variant="caption" color={colors.textSecondary} style={styles.verifyDesc}>
                    We sent a 6-digit verification code to:
                  </AppText>
                  <AppText variant="bodyBold" style={{ textAlign: 'center' }}>
                    {email}
                  </AppText>
                </View>

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
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <AppText variant="bodyBold" color={colors.background}>
                      Verify & Create Account
                    </AppText>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleResendCode}
                  disabled={resendTimer > 0 || isProcessing}
                  style={styles.switchButton}
                >
                  <AppText
                    variant="caption"
                    color={resendTimer > 0 ? colors.textMuted : colors.textPrimary}
                    style={{ fontFamily: resendTimer === 0 ? Fonts.sansBold : Fonts.sans }}
                  >
                    {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend verification code'}
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setAuthMode('emailInput')}
                  disabled={isProcessing}
                  style={styles.switchButton}
                >
                  <AppText variant="caption" color={colors.textSecondary}>
                    ← Edit email or password
                  </AppText>
                </TouchableOpacity>
              </View>
            ) : authMode === 'emailInput' ? (
              <View style={styles.emailForm}>
                <TextInput
                  placeholder="Email address"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.input,
                    { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                />
                <TextInput
                  placeholder="Password (min 6 chars)"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  style={[
                    styles.input,
                    { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background },
                  ]}
                />
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
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <AppText variant="bodyBold" color={colors.background}>
                      Send Verification Code
                    </AppText>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic.selection();
                    router.push('/(auth)/login');
                  }}
                  style={styles.switchButton}
                >
                  <AppText variant="caption" color={colors.textPrimary}>
                    Already have an account?{' '}
                    <AppText variant="bodyBold" color={colors.textPrimary} style={{ textDecorationLine: 'underline' }}>
                      Sign In
                    </AppText>
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setAuthMode('options')}
                  style={styles.switchButton}
                >
                  <AppText variant="caption" color={colors.textSecondary}>
                    ← Back to options
                  </AppText>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
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

                {/* Divider between Sign Up / Guest and Sign In */}
                <View style={styles.dividerRow}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                  <AppText variant="caption" color={colors.textMuted} style={styles.dividerLabel}>
                    HAVE AN EXISTING ACCOUNT?
                  </AppText>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                </View>

                {/* Direct navigation to Login screen */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isProcessing}
                  style={[
                    styles.signInNavButton,
                    { borderColor: colors.border, backgroundColor: colors.cardElevated },
                  ]}
                  onPress={() => {
                    triggerHaptic.selection();
                    router.push('/(auth)/login');
                  }}
                >
                  <View style={styles.signInNavContent}>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyBold" color={colors.textPrimary}>
                        Sign In to Existing Account
                      </AppText>
                      <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                        Sync and restore your ledger on this device
                      </AppText>
                    </View>
                    <JapaneseIcon name="chevronRight" size={16} color={colors.textSecondary} strokeWidth={2.2} />
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <AppText
              variant="caption"
              color={colors.textMuted}
              style={styles.privacySub}
            >
              Guest mode is device-only. Signed-in accounts sync securely across devices.
            </AppText>
          </BentoCard>
        </View>

        <AppText variant="caption" color={colors.textSecondary} style={styles.footerText}>
          Less noise. More intention.
        </AppText>
      </Main>
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
  mainContent: {
    gap: 14,
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
    fontSize: 46,
    lineHeight: 54,
  },
  romajiSub: {
    marginTop: 6,
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
  emailForm: {
    gap: 10,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  verifyHeaderWrap: {
    gap: 4,
    marginBottom: 6,
  },
  verifyDesc: {
    textAlign: 'center',
    lineHeight: 18,
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
  switchButton: {
    alignItems: 'center',
    paddingVertical: 6,
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
