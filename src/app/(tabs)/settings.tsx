import React, { useState } from 'react';
import { View, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import {
  Main,
  BentoCard,
  AppText,
  PillBadge,
} from '@/components/ui';
import { useThemeColors } from '@/constants/theme';
import { useLedger } from '@/hooks/useLedger';
import type { ThemeMode } from '@/stores/settingsStore';

export default function SettingsScreen() {
  const { colors, themeMode, setThemeMode } = useThemeColors();
  const { seedDemoData, clearAllData } = useLedger();
  const [biometricLock, setBiometricLock] = useState(true);
  const [compactUi, setCompactUi] = useState(false);

  const themeOptions: { mode: ThemeMode; label: string; sub: string }[] = [
    { mode: 'dark', label: 'Dark', sub: '墨色 Sumi' },
    { mode: 'light', label: 'Light', sub: '和紙 Washi' },
    { mode: 'system', label: 'Auto', sub: 'System' },
  ];

  return (
    <Main>
      <AppText variant="serifTitle">Settings</AppText>

      <BentoCard variant="light" style={styles.sectionCard}>
        <AppText variant="caption" color={colors.textSecondary}>Theme</AppText>
        <View style={styles.themeSelectorRow}>
          {themeOptions.map((opt) => {
            const active = themeMode === opt.mode;
            return (
              <TouchableOpacity
                key={opt.mode}
                activeOpacity={0.7}
                onPress={() => setThemeMode(opt.mode)}
                style={[
                  styles.themeBtn,
                  {
                    borderColor: active ? colors.selectionBorder : colors.border,
                    backgroundColor: active ? colors.selectionBg : colors.cardElevated,
                  },
                ]}
              >
                <AppText
                  variant="bodyBold"
                  style={{
                    color: active ? colors.selectionText : colors.textPrimary,
                    fontSize: 13,
                  }}
                >
                  {opt.label}
                </AppText>
                <AppText
                  variant="caption"
                  style={{
                    color: active ? colors.selectionText : colors.textMuted,
                    fontSize: 10,
                  }}
                >
                  {opt.sub}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </BentoCard>

      <BentoCard variant="light" style={styles.sectionCard}>
        <AppText variant="caption" color={colors.textSecondary}>Add Categories</AppText>
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
            trackColor={{ false: colors.switchTrackOff, true: colors.bambooGreen }}
            thumbColor={colors.switchThumb}
            ios_backgroundColor={colors.switchTrackOff}
          />
        </View>
      </BentoCard>

      <BentoCard variant="light" style={styles.sectionCard}>
        <AppText variant="caption" color={colors.textSecondary}>Sample Data & Reset</AppText>
        <View style={styles.dataButtonsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={async () => {
              await seedDemoData();
              Alert.alert('Demo Data', 'Seeded sample expenses, incomes, budgets, and wishlist items.');
            }}
            style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.cardElevated }]}
          >
            <AppText variant="bodyBold" style={{ fontSize: 13 }}>Seed Demo Data</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              Alert.alert('Reset Ledger', 'Are you sure you want to clear all data?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear All',
                  style: 'destructive',
                  onPress: async () => {
                    await clearAllData();
                  },
                },
              ]);
            }}
            style={[styles.actionBtn, { borderColor: colors.hankoRed, backgroundColor: colors.cardElevated }]}
          >
            <AppText variant="bodyBold" color={colors.hankoRed} style={{ fontSize: 13 }}>Clear All Data</AppText>
          </TouchableOpacity>
        </View>
      </BentoCard>

      <BentoCard variant="light" style={styles.exportCard}>
        <View style={[styles.exportBtn, { borderColor: colors.border, backgroundColor: colors.cardElevated }]}>
          <AppText variant="bodyBold">Export Ledger</AppText>
        </View>
        <View style={[styles.exportBtn, styles.exportCsvBtn, { borderColor: colors.selectionBorder, backgroundColor: colors.selectionBg }]}>
          <AppText variant="bodyBold" color={colors.selectionText}>Export Ledger (.CSV)</AppText>
        </View>
      </BentoCard>
    </Main>
  );
}

const styles = StyleSheet.create({
  sectionCard: { paddingVertical: 16, gap: 12 },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  themeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 2,
  },
  pillWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  rowBorder: { borderTopWidth: 1, paddingTop: 12 },
  exportCard: { paddingVertical: 14, gap: 10 },
  dataButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtn: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  exportCsvBtn: {},
});