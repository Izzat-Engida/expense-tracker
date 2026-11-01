import React, { useState } from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import {
  Main,
  BentoCard,
  AppText,
  PillBadge,
} from '@/components/ui';
import { Colors, Fonts } from '@/constants/theme';

export default function SettingsScreen() {
  const [biometricLock, setBiometricLock] = useState(true);
  const [compactUi, setCompactUi] = useState(false);

  return (
    <Main>
      <AppText variant="serifTitle">Categories & Settings</AppText>


      <BentoCard variant="light" style={styles.sectionCard}>
        <AppText variant="caption" color={Colors.textSecondary}>Custom categories</AppText>
        <View style={styles.pillWrap}>
          <PillBadge variant="outline" label="Food" />
          <PillBadge variant="outline" label="Transport" />
          <PillBadge variant="outline" label="Bills" />
          <PillBadge variant="outline" label="Fun" />
          <PillBadge variant="outline" label="Other" />
          <PillBadge variant="outline" label="+" />
        </View>
      </BentoCard>

  
      <BentoCard variant="light" style={styles.sectionCard}>
        <View style={styles.switchRow}>
          <AppText variant="bodyBold">Biometric App Lock</AppText>
          <Switch
            value={biometricLock}
            onValueChange={setBiometricLock}
            trackColor={{ false: Colors.divider, true: Colors.cardDark }}
            thumbColor={Colors.card}
          />
        </View>
        <View style={[styles.switchRow, styles.rowBorder]}>
          <AppText variant="bodyBold">Compact UI</AppText>
          <Switch
            value={compactUi}
            onValueChange={setCompactUi}
            trackColor={{ false: Colors.divider, true: Colors.cardDark }}
            thumbColor={Colors.card}
          />
        </View>
      </BentoCard>

     
      <BentoCard variant="light" style={styles.exportCard}>
        <View style={styles.exportBtn}>
          <AppText variant="bodyBold">Export Ledger</AppText>
        </View>
        <View style={[styles.exportBtn, styles.exportCsvBtn]}>
          <AppText variant="bodyBold" color={Colors.textInverse}>Export Ledger (.CSV)</AppText>
        </View>
      </BentoCard>
    </Main>
  );
}

const styles = StyleSheet.create({
  sectionCard: { paddingVertical: 16, gap: 12 },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  rowBorder: { borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 12 },
  exportCard: { paddingVertical: 14, gap: 10 },
  exportBtn: { backgroundColor: Colors.cardElevated, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  exportCsvBtn: { backgroundColor: Colors.cardDark },
});