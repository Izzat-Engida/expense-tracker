import React, { useState } from 'react';
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
  HankoStamp,
  AppText,
  JapaneseIcon,
} from '@/components/ui';
import { Fonts, useThemeColors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { signUpWithEmail, getAuthErrorMessage } from '@/services/firebaseAuth';
import { triggerAuthHaptic } from '@/utils/haptics';
import Animated, { FadeIn } from 'react-native-reanimated';


export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const startAccountOnboarding = useAuthStore((s) => s.startAccountOnboarding);
  const startLocalAccountOnboarding = useAuthStore((s) => s.startLocalAccountOnboarding);

  const [isProcessing, setIsProcessing] = useState(false);
  const [authMode, setAuthMode] = useState<'options' | 'emailInput'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  const handleSignUp = async () => {
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

    triggerAuthHaptic.medium();
    setIsProcessing(true);
    try {
      const res = await signUpWithEmail(trimmedEmail, password.trim(), true);
      await startAccountOnboarding(res.profile, res.tokens);
      triggerAuthHaptic.success();
      Alert.alert(
        'Account Created',
        `A verification link has been sent to ${trimmedEmail}.\n\nPlease check your inbox and tap the link to verify your email.`,
        [
          {
            text: 'Continue',
            onPress: () => router.push('/(auth)/setup-password'),
          },
        ]
      );
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
              
              <View style={styles.headerRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    triggerAuthHaptic.selection();
                    setAuthMode('options');
                  }}
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
                    Options
                  </AppText>
                </TouchableOpacity>

                <HankoStamp size="sm" />
              </View>

           
              <View style={styles.welcomeBlock}>
                <View style={styles.brandLockup}>
                  <AppText style={styles.kanjiLogo}>余白</AppText>
                  <AppText variant="caption" color={colors.textSecondary} style={styles.romajiSub}>
                    Y O H A K U
                  </AppText>
                </View>
                <AppText variant="caption" color={colors.textSecondary} style={styles.welcomeKicker}>
                  新規登録
                </AppText>
                <AppText variant="serifTitle" style={styles.welcomeTitle}>
                  Create your account
                </AppText>
                <AppText variant="body" color={colors.textSecondary} style={styles.welcomeSubtitle}>
                  A quiet ledger for everyday life. Sync securely across your devices.
                </AppText>
              </View>

              {/* Credentials Form Container */}
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
                      placeholder="Min 6 characters"
                      placeholderTextColor={colors.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleSignUp}
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
                  onPress={handleSignUp}
                >
                  {isProcessing ? (
                    <View style={styles.buttonLoadingRow}>
                      <ActivityIndicator size="small" color={colors.background} />
                      <AppText variant="bodyBold" color={colors.background} style={styles.buttonText}>
                        Creating account…
                      </AppText>
                    </View>
                  ) : (
                    <AppText variant="bodyBold" color={colors.background} style={styles.buttonText}>
                      Create account
                    </AppText>
                  )}
                </TouchableOpacity>

                <View style={styles.switchRow}>
                  <AppText variant="caption" color={colors.textSecondary}>
                    Already have an account?
                  </AppText>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      triggerAuthHaptic.selection();
                      router.push('/(auth)/login');
                    }}
                  >
                    <AppText variant="bodyBold" color={colors.textPrimary}>
                      Sign in
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
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
                  A quiet ledger for everyday life
                </AppText>
                <AppText variant="serifTitle" style={styles.welcomeTitle}>
                  Make room for what matters.
                </AppText>
                <AppText variant="body" color={colors.textSecondary} style={styles.welcomeSubtitle}>
                  Track spending, save with intention, and keep your finances close.
                </AppText>
              </View>

              <View style={styles.authCard}>
                <AppText variant="caption" color={colors.textSecondary} style={styles.getStartedLabel}>
                  Start your ledger
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
                    <AppText variant="bodyBold" color={colors.background} style={styles.buttonText}>
                      {isProcessing ? 'Setting up…' : 'Continue as guest'}
                    </AppText>
                  </TouchableOpacity>
                  <AppText
                    variant="caption"
                    color={colors.textMuted}
                    style={styles.guestNote}
                  >
                    Local only  no account needed
                  </AppText>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isProcessing}
                    style={[
                      styles.secondaryButton,
                      { borderColor: colors.border, backgroundColor: colors.card },
                    ]}
                    onPress={() => setAuthMode('emailInput')}
                  >
                    <AppText variant="bodyBold" color={colors.textPrimary} style={styles.buttonText}>
                      Create account with email
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
                        triggerAuthHaptic.selection();
                        router.push('/(auth)/login');
                      }}
                    >
                      <AppText variant="bodyBold" color={colors.textPrimary}>
                        Sign in
                      </AppText>
                    </TouchableOpacity>
                  </View>
                </View>

                <AppText variant="caption" color={colors.textMuted} style={styles.privacySub}>
                  Guest mode stays on this device. Create an account to sync securely across devices.
                </AppText>
              </View>
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
    gap: 8,
    marginTop: 14,
    maxWidth: 320,
    width: '100%',
    alignSelf: 'center',
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
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  backBtnText: {
    fontFamily: Fonts.sansBold,
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
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 12,
  },
  getStartedLabel: {
    fontSize: 11,
    textAlign: 'center',
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
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
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  codeInput: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
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
