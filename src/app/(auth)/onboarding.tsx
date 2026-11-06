import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Main,
  BentoCard,
  HankoStamp,
  ProgressBar,
  AppText,
} from '@/components/ui';
import { Fonts, useThemeColors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { loginWithEmail } from '@/services/firebaseAuth';
// import { promptGoogleAuth } from '@/services/auth';

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const startAccountOnboarding = useAuthStore((s) => s.startAccountOnboarding);
  const startLocalAccountOnboarding = useAuthStore((s) => s.startLocalAccountOnboarding);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

  /*
  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    try {
      const res = await promptGoogleAuth();
      if (!res) return;
      await startAccountOnboarding(res.profile, res.tokens);
      router.push('/(auth)/setup-password');
    } catch (err: any) {
      if (err?.message === 'MISSING_CLIENT_ID') {
        Alert.alert(
          'Google Sign-In',
          'Add EXPO_PUBLIC_GOOGLE_CLIENT_ID (or platform-specific client IDs) to your environment to enable Google sign-in.',
        );
      } else {
        Alert.alert('Google Sign-In', err?.message || 'Could not sign in with Google.');
      }
    } finally {
      setIsProcessing(false);
    }
  };
  */

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter email and password.');
      return;
    }
    setIsProcessing(true);
    try {
      const res = await loginWithEmail(email.trim(), password.trim());
      await startAccountOnboarding(res.profile, res.tokens);
      router.push('/(auth)/setup-password');
    } catch (err: any) {
      Alert.alert('Email Auth Error', err?.message || 'Failed to authenticate with Firebase.');
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
              G E T   S T A R T E D
            </AppText>

            {showEmailForm ? (
              <View style={styles.emailForm}>
                <TextInput
                  placeholder="Email address"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
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
                  onPress={handleEmailAuth}
                >
                  <AppText variant="bodyBold" color={colors.background}>
                    {isProcessing ? 'Connecting…' : 'Sign In or Register'}
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowEmailForm(false)}
                  style={styles.switchButton}
                >
                  <AppText variant="caption" color={colors.textSecondary}>
                    ← Back to options
                  </AppText>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {/* Google OAuth - commented out
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isProcessing}
                  style={[
                    styles.primaryButton,
                    { backgroundColor: colors.textPrimary },
                  ]}
                  onPress={handleGoogleLogin}
                >
                  <AppText variant="bodyBold" color={colors.background}>
                    {isProcessing ? 'Connecting…' : 'Continue with Google'}
                  </AppText>
                </TouchableOpacity>
                */}

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
                  onPress={() => setShowEmailForm(true)}
                >
                  <AppText variant="bodyBold" color={colors.textPrimary}>
                    Sign in with Email
                  </AppText>
                </TouchableOpacity>
              </View>
            )}

            <AppText
              variant="caption"
              color={colors.textMuted}
              style={styles.privacySub}
            >
              Guest mode is offline-first. Email accounts sync securely with Firebase.
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
