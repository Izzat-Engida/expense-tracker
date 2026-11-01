import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Main,
  BentoCard,
  AppText,
  HankoStamp,
  ProgressBar,
} from '@/components/ui';
import { Colors, Fonts } from '@/constants/theme';

export default function IncomeBudgetModal() {
  const router = useRouter();
  const [needs, setNeeds] = useState(70);
  const [wants, setWants] = useState(20);
  const [savings, setSavings] = useState(10);

  return (
    <Main>
    
      <View style={styles.headerRow}>
        <AppText variant="serifTitle">Income & Budget</AppText>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <AppText variant="body" color={Colors.textSecondary}>✕</AppText>
        </TouchableOpacity>
      </View>


      <BentoCard variant="dark" style={styles.incomeCard}>
        <View style={styles.rowBetween}>
          <AppText variant="caption" color={Colors.textMuted}>Income</AppText>
          <HankoStamp size="sm" />
        </View>
        <View style={styles.amountRow}>
          <AppText variant="digital" color={Colors.textInverse}>25,000</AppText>
          <AppText variant="caption" color={Colors.textMuted}>ETB</AppText>
        </View>
      </BentoCard>


      <BentoCard variant="light" style={styles.sectionCard}>
        <AppText variant="caption" color={Colors.textSecondary}>Source of income</AppText>
        <View style={styles.sourceRow}>
          <AppText variant="bodyBold">Main Salary</AppText>
          <AppText variant="bodyBold" color={Colors.bambooGreen}>+20,000 ETB</AppText>
        </View>
        <View style={[styles.sourceRow, styles.rowBorder]}>
          <AppText variant="bodyBold">Freelance</AppText>
          <AppText variant="bodyBold" color={Colors.bambooGreen}>+5,000 ETB</AppText>
        </View>
      </BentoCard>

    
      <BentoCard variant="light" style={styles.sectionCard}>
        <AppText variant="caption" color={Colors.textSecondary}>Allocation / Budget</AppText>
        
        <View style={styles.budgetSliderRow}>
          <View style={styles.rowBetween}>
            <AppText variant="bodyBold">Needs</AppText>
            <AppText variant="caption">{needs}%</AppText>
          </View>
          <ProgressBar progress={needs / 100} fillColor={Colors.cardDark} height={6} />
        </View>

        <View style={styles.budgetSliderRow}>
          <View style={styles.rowBetween}>
            <AppText variant="bodyBold">Wants</AppText>
            <AppText variant="caption">{wants}%</AppText>
          </View>
          <ProgressBar progress={wants / 100} fillColor={Colors.categoryFood} height={6} />
        </View>

        <View style={styles.budgetSliderRow}>
          <View style={styles.rowBetween}>
            <AppText variant="bodyBold">Savings</AppText>
            <AppText variant="caption">{savings}%</AppText>
          </View>
          <ProgressBar progress={savings / 100} fillColor={Colors.bambooGreen} height={6} />
        </View>
      </BentoCard>

 
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.back()}
        style={styles.saveButton}
      >
        <AppText variant="body" color={Colors.textInverse}>Save changes</AppText>
      </TouchableOpacity>
    </Main>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: Colors.divider, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  incomeCard: { paddingVertical: 18, gap: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  sectionCard: { paddingVertical: 16, gap: 14 },
  sourceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 10 },
  budgetSliderRow: { gap: 6 },
  saveButton: { backgroundColor: Colors.cardDark, borderRadius: 999, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', shadowColor: Colors.shadow, shadowOffset: { width: 2, height: 3 }, shadowOpacity: 1, elevation: 3 },
});