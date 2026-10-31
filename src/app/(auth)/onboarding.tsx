import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {useRouter} from 'expo-router';
import {
Main,
BentoCard,
HankoStamp,
ProgressBar,
AppText
} from '@/components/ui';
import {Colors,Fonts} from '@/constants/theme';

export default function OnboardingScreen() {
  const router=useRouter();

  const handleContinueWithGoole=()=>{
    //todo later on google outh ans secure store thing
    router.replace('/(tabs)')
  }
  return (
    <Main contentContainerStyle={styles.screenContainer} >
<View style={styles.mainContent}>
  <View style={styles.topRow}>
    <BentoCard variant='light' style={styles.bradCard}>
    <AppText style={styles.kanjiLogo}>余白</AppText>
    <AppText variant="caption" style={styles.romajiSub}>Y O H A K U</AppText>
    <View style={styles.brandUnderline}/>
    </BentoCard>

    <View style={styles.rightCol}>
    <BentoCard variant="light" style={styles.stampCard}>
    <HankoStamp size="md"/>
    <AppText variant="caption" style={styles.stampLabel}>
                STAMP IN
      </AppText>
    </BentoCard>
    <BentoCard variant="dark" style={styles.clarityDarkCard}>
      <AppText
      variant="caption"
      color={Colors.textInverse}
      style={styles.clarityQuote}
      >
       A little room {'\n'}for clarity.
      </AppText>
    </BentoCard>
    </View>
  </View>
  <BentoCard variant="light" style={styles.featureCard}>
          <View style={styles.sailboatBox}>

            <View style={styles.sailTriangle} />
            <View style={styles.boatHull} />
          </View>
          <View style={styles.featureTextCol}>
            <AppText variant="bodyBold">Track with clarity</AppText>
            <AppText
              variant="caption"
              color={Colors.textSecondary}
              style={styles.featureDesc}
            >
              Your expenses. Your Google Drive. No surprises.
            </AppText>
          </View>
    </BentoCard>

    <BentoCard variant="light" style={styles.driveStripCard}>
          <View style={styles.rowBetween}>
            <AppText variant="caption" style={styles.driveStripTitle}>
              YOUR DATA. YOUR DRIVE.
            </AppText>
            <AppText variant="caption" color={Colors.textSecondary}>
              ETB ledger
            </AppText>
          </View>
          <ProgressBar progress={0.78} height={10} />
      </BentoCard>

      <BentoCard variant="light" style={styles.authCard}>
    <AppText variant="caption"
    color={Colors.textSecondary}
    style={styles.getStartedLabel}
    >
      G E T   S T A R T E D
    </AppText>
    <TouchableOpacity
    activeOpacity={0.8}
    style={styles.googleButton}
    onPress={handleContinueWithGoole}
    >
      <AppText variant="bodyBold" style={styles.googleG}>
        G
      </AppText>
      <AppText variant="body">
        Continue with Google
      </AppText>
    </TouchableOpacity>
<AppText
            variant="caption"
            color={Colors.textMuted}
            style={styles.privacySub}
          >
            Your data stays in your own Google Drive.
          </AppText>

      </BentoCard>
</View>
<AppText variant="caption" color={Colors.textSecondary} style={styles.footerText}>
  Less noise. More intention
</AppText>
    </Main>
  );
}
const styles=StyleSheet.create({
  screenContainer:{
    flexGrow:1,
    justifyContent:'space-between',
  },
  mainContent:{
    gap:14
  },
  topRow:{
    flexDirection:'row',
    gap:12,
  },
  bradCard:{
    flex:1.35,
    alignItems:'center',
    justifyContent:'center',
    paddingVertical:28
  },
  kanjiLogo: {
    fontFamily: Fonts.serif,
    fontSize: 46,
    color: Colors.textPrimary,
    lineHeight: 54,
  },
  romajiSub: {
    marginTop: 6,
    letterSpacing: 3,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  brandUnderline: {
    width: 28,
    height: 1.5,
    backgroundColor: Colors.border,
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
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sailTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 18,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.textPrimary,
    marginBottom: 3,
  },
  boatHull: {
    width: 26,
    height: 7,
    borderWidth: 1.5,
    borderColor: Colors.textPrimary,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  featureTextCol: {
    flex: 1,
    gap: 4,
  },
  featureDesc: {
    lineHeight: 17,
  },
  driveStripCard: {
    paddingVertical: 14,
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driveStripTitle: {
    fontFamily: Fonts.sansBold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  authCard: {
    alignItems: 'center',
    paddingVertical: 22,
    gap: 14,
  },
  getStartedLabel: {
    fontSize: 11,
    letterSpacing: 2,
  },
  googleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.cardElevated,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingVertical: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 1.5, height: 2.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  googleG: {
    fontSize: 16,
  },
  privacySub: {
    fontSize: 11,
  },
  footerText:{
    textAlign:'center',
    marginTop:16,
    fontSize:11
  }
})
