import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Main,
  BentoCard,
  AppText,
  HankoStamp,
  PillBadge,
} from '@/components/ui';
import { Colors, Fonts, useThemeColors } from '@/constants/theme';

export default function BiometricLockScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();

  const handleUnlock = () => {
    // Later: trigger expo-local-authentication.authenticateAsync()
    router.replace('/(tabs)');
  };

  return (
    <Main contentContainerStyle={styles.container}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <AppText variant="caption" color={Colors.textSecondary}>
          Lock
        </AppText>
        <PillBadge variant="outline" label="Offline ready" />
      </View>

      <BentoCard variant="light" style={styles.brandBento}>
        <AppText style={styles.kanjiLogo}>余白</AppText>
        <AppText variant="caption" color={colors.textSecondary} style={styles.romajiSub}>
          Y O H A K U
        </AppText>
        <View style={[styles.brandUnderline, { backgroundColor: colors.border }]} />


        <View
          style={[
            styles.fingerprintBox,
            { backgroundColor: colors.cardElevated, borderColor: colors.border },
          ]}
        >
          <View style={[styles.fpCornerTL, { borderColor: colors.border }]} />
          <View style={[styles.fpCornerTR, { borderColor: colors.border }]} />
          <View style={[styles.fpCornerBL, { borderColor: colors.border }]} />
          <View style={[styles.fpCornerBR, { borderColor: colors.border }]} />
      
        </View>

        <AppText variant="bodyBold" style={styles.unlockPrompt}>
          Unlock local ledger
        </AppText>
      </BentoCard>


      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleUnlock}
        style={[
          styles.unlockButton,
          {
            backgroundColor: colors.selectionBg,
            borderColor: colors.selectionBorder,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <AppText variant="body" color={colors.selectionText}>
          Unlock local ledger
        </AppText>
      </TouchableOpacity>

      <View style={styles.absoluteStamp}>
        <HankoStamp size="sm" />
      </View>
    </Main>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandBento: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 12,
  },
  kanjiLogo: {
    fontFamily: Fonts.serif,
    fontSize: 52,
    lineHeight: 60,
  },
  romajiSub: {
    letterSpacing: 3,
    fontSize: 11,
  },
  brandUnderline: {
    width: 32,
    height: 1.5,
    backgroundColor: Colors.border,
    marginBottom: 16,
  },
  fingerprintBox: {
    width: 84,
    height: 84,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  fpCornerTL: { position: 'absolute', top: 6, left: 6, width: 8, height: 8, borderTopWidth: 2, borderLeftWidth: 2, borderColor: Colors.border },
  fpCornerTR: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderTopWidth: 2, borderRightWidth: 2, borderColor: Colors.border },
  fpCornerBL: { position: 'absolute', bottom: 6, left: 6, width: 8, height: 8, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: Colors.border },
  fpCornerBR: { position: 'absolute', bottom: 6, right: 6, width: 8, height: 8, borderBottomWidth: 2, borderRightWidth: 2, borderColor: Colors.border },
  fingerprintIcon: {
    fontSize: 32,
  },
  unlockPrompt: {
    marginTop: 8,
  },
  unlockButton: {
    backgroundColor: Colors.cardDark,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  absoluteStamp: {
    position: 'absolute',
    bottom: 80,
    right: 18,
  },
});