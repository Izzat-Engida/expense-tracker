import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Main,
  BentoCard,
  HankoStamp,
  ProgressBar,
  AppText,
} from '@/components/ui';
import { Colors, Fonts, useThemeColors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { promptGoogleAuth, getGoogleClientId } from '@/services/auth';
import type { GoogleUserProfile, AuthTokens } from '@/types/auth';

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColors();
  const startAccountOnboarding = useAuthStore((s) => s.startAccountOnboarding);

  const [devModalVisible, setDevModalVisible] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleContinueWithGoogle = async () => {
    const clientId = getGoogleClientId();

    if (!clientId) {
      // In development or when Google Cloud client ID is not yet provided:
      setDevModalVisible(true);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await promptGoogleAuth();
      if (res) {
        await startAccountOnboarding(res.profile, res.tokens);
        router.push('/(auth)/setup-password');
      }
    } catch (err: any) {
      Alert.alert(
        'Google Authentication',
        err?.message || 'Could not complete Google Sign-In.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDevCreateAccount = async (name: string, email: string) => {
    setDevModalVisible(false);
    const mockProfile: GoogleUserProfile = {
      id: `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      email,
    };
    const mockTokens: AuthTokens = {
      accessToken: `mock_access_token_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`,
      expiresAt: Date.now() + 3600 * 1000,
    };

    await startAccountOnboarding(mockProfile, mockTokens, true);
    router.push('/(auth)/setup-password');
  };

  return (
    <Main contentContainerStyle={styles.screenContainer}>
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
              Your expenses. Your Google Drive. Zero external servers.
            </AppText>
          </View>
        </BentoCard>

        <BentoCard variant="light" style={styles.driveStripCard}>
          <View style={styles.rowBetween}>
            <AppText variant="caption" style={styles.driveStripTitle}>
              PRIVATE GOOGLE DRIVE SYNC
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Hidden AppData
            </AppText>
          </View>
          <ProgressBar progress={0.88} height={10} />
        </BentoCard>

        <BentoCard variant="light" style={styles.authCard}>
          <AppText
            variant="caption"
            color={colors.textSecondary}
            style={styles.getStartedLabel}
          >
            G E T   S T A R T E D
          </AppText>
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isProcessing}
            style={[
              styles.googleButton,
              {
                backgroundColor: colors.cardElevated,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
            onPress={handleContinueWithGoogle}
          >
            <AppText variant="bodyBold" style={styles.googleG}>
              G
            </AppText>
            <AppText variant="body">
              {isProcessing ? 'Connecting to Google…' : 'Continue with Google'}
            </AppText>
          </TouchableOpacity>
          <AppText
            variant="caption"
            color={colors.textMuted}
            style={styles.privacySub}
          >
            Data stays in your private Google Drive and device SQLite.
          </AppText>
        </BentoCard>
      </View>

      <AppText variant="caption" color={colors.textSecondary} style={styles.footerText}>
        Less noise. More intention.
      </AppText>

      {/* Dev Mode Account Picker Modal */}
      <Modal
        visible={devModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDevModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <AppText variant="serifTitle">Sign In (Developer Mode)</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Google OAuth client ID is not yet configured in `.env`. Choose a sample
              profile or enter your email to test multi-account isolation:
            </AppText>

            <View style={styles.sampleButtonsWrap}>
              <TouchableOpacity
                style={[styles.sampleBtn, { borderColor: colors.border }]}
                onPress={() =>
                  handleDevCreateAccount('Personal Account', 'personal.savings@gmail.com')
                }
              >
                <AppText variant="bodyBold">🏠 Personal Account</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  personal.savings@gmail.com
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sampleBtn, { borderColor: colors.border }]}
                onPress={() =>
                  handleDevCreateAccount('Work Account', 'work.finance@company.com')
                }
              >
                <AppText variant="bodyBold">💼 Work Account</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  work.finance@company.com
                </AppText>
              </TouchableOpacity>
            </View>

            <View style={[styles.modalDivider, { backgroundColor: colors.divider }]} />

            <AppText variant="caption" color={colors.textSecondary}>
              Or enter custom profile info:
            </AppText>

            <TextInput
              value={customName}
              onChangeText={setCustomName}
              placeholder="Your Name (e.g. Alex)"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.modalInput,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.textPrimary,
                },
              ]}
            />
            <TextInput
              value={customEmail}
              onChangeText={setCustomEmail}
              placeholder="Google Email (e.g. alex@gmail.com)"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.modalInput,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.textPrimary,
                },
              ]}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setDevModalVisible(false)}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <AppText variant="body">Cancel</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (!customEmail.trim()) {
                    Alert.alert('Required', 'Please enter an email.');
                    return;
                  }
                  handleDevCreateAccount(
                    customName.trim() || customEmail.split('@')[0],
                    customEmail.trim()
                  );
                }}
                style={[styles.confirmBtn, { backgroundColor: colors.selectionBg }]}
              >
                <AppText variant="bodyBold" color={colors.selectionText}>
                  Continue
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Main>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flexGrow: 1,
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
    gap: 8,
  },
  stampLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
  },
  clarityDarkCard: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clarityQuote: {
    fontFamily: Fonts.serif,
    textAlign: 'center',
    lineHeight: 18,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sailboatBox: {
    width: 54,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sailTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  boatHull: {
    width: 26,
    height: 6,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    marginTop: 2,
  },
  featureTextCol: {
    flex: 1,
    gap: 2,
  },
  featureDesc: {
    marginTop: 2,
  },
  driveStripCard: {
    paddingVertical: 14,
    gap: 8,
  },
  driveStripTitle: {
    letterSpacing: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authCard: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  getStartedLabel: {
    letterSpacing: 2,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 1,
    elevation: 3,
  },
  googleG: {
    fontSize: 20,
    fontFamily: Fonts.serif,
  },
  privacySub: {
    textAlign: 'center',
    fontSize: 11,
  },
  footerText: {
    textAlign: 'center',
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    gap: 12,
  },
  sampleButtonsWrap: {
    gap: 8,
    marginTop: 4,
  },
  sampleBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    gap: 2,
  },
  modalDivider: {
    height: 1,
    width: '100%',
    marginVertical: 4,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  confirmBtn: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
});
