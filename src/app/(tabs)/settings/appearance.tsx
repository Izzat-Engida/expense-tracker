import React from 'react';
import { View, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Main, BentoCard, AppText, JapaneseIcon } from '@/components/ui';
import type { JapaneseIconName } from '@/components/ui';
import { Fonts, useThemeColors } from '@/constants/theme';
import {
  CURRENCIES,
  useSettingsStore,
} from '@/stores/settingsStore';
import type { CurrencyCode, ThemeMode } from '@/stores/settingsStore';
import { triggerHaptic } from '@/utils/haptics';

export default function AppearanceSettings() {
  const router = useRouter();
  const { colors, themeMode, setThemeMode } = useThemeColors();
  const currency = useSettingsStore((s) => s.currency);
  const setCurrency = useSettingsStore((s) => s.setCurrency);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);

  const themeOptions: { mode: ThemeMode; label: string; sub: string; icon: JapaneseIconName }[] = [
    { mode: 'dark', label: 'Dark', sub: '墨色 Sumi', icon: 'tsuki' },
    { mode: 'light', label: 'Light', sub: '和紙 Washi', icon: 'hi' },
    { mode: 'system', label: 'Auto', sub: 'System', icon: 'tomoe' },
  ];

  return (
    <Main contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic.selection();
            router.replace('/(tabs)/settings' as Href);
          }}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AppText style={[styles.backChevron, { color: colors.textPrimary }]}>‹</AppText>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <AppText variant="serifTitle" style={styles.headerTitle}>Appearance</AppText>
          <AppText variant="caption" color={colors.textMuted} style={styles.headerSubtitle}>
            外観 · Theme & Display
          </AppText>
        </View>
      </View>

      {/* Theme */}
      <BentoCard variant="light" style={styles.card}>
        <AppText variant="caption" color={colors.textSecondary}>THEME</AppText>
        <View style={styles.themeRow}>
          {themeOptions.map((opt) => {
            const active = themeMode === opt.mode;
            return (
              <TouchableOpacity
                key={opt.mode}
                activeOpacity={0.7}
                onPress={() => {
                  triggerHaptic.selection();
                  setThemeMode(opt.mode);
                }}
                style={[
                  styles.themeBtn,
                  {
                    borderColor: active ? colors.selectionBorder : colors.border,
                    backgroundColor: active ? colors.selectionBg : colors.cardElevated,
                  },
                ]}
              >
                <JapaneseIcon
                  name={opt.icon}
                  size={20}
                  color={active ? colors.selectionText : colors.textPrimary}
                />
                <AppText
                  variant="bodyBold"
                  style={{ color: active ? colors.selectionText : colors.textPrimary, fontSize: 13 }}
                >
                  {opt.label}
                </AppText>
                <AppText
                  variant="caption"
                  style={{ color: active ? colors.selectionText : colors.textMuted, fontSize: 10 }}
                >
                  {opt.sub}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </BentoCard>

      {/* Currency */}
      <BentoCard variant="light" style={styles.card}>
        <AppText variant="caption" color={colors.textSecondary}>CURRENCY</AppText>
        <View style={styles.currencyRow}>
          {CURRENCIES.map((code) => {
            const active = currency === code;
            return (
              <TouchableOpacity
                key={code}
                activeOpacity={0.7}
                onPress={() => {
                  triggerHaptic.selection();
                  setCurrency(code as CurrencyCode);
                }}
                style={[
                  styles.currencyBtn,
                  {
                    borderColor: active ? colors.selectionBorder : colors.border,
                    backgroundColor: active ? colors.selectionBg : colors.cardElevated,
                  },
                ]}
              >
                <AppText
                  variant="bodyBold"
                  style={{ color: active ? colors.selectionText : colors.textPrimary, fontSize: 12 }}
                >
                  {code}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
       
      </BentoCard>

      {/* Haptics */}
      <BentoCard variant="light" style={styles.card}>
        <AppText variant="caption" color={colors.textSecondary}>HAPTICS</AppText>
        <View style={styles.switchRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <AppText variant="bodyBold">Haptic Feedback</AppText>
            
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={(val) => setHapticsEnabled(val)}
            trackColor={{ false: colors.switchTrackOff, true: colors.bambooGreen }}
            thumbColor={colors.switchThumb}
            ios_backgroundColor={colors.switchTrackOff}
          />
        </View>
        
      </BentoCard>
    </Main>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    fontSize: 22,
    lineHeight: 24,
    marginTop: -2,
    marginLeft: -1,
    fontFamily: Fonts.sansBold,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    lineHeight: 26,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  card: {
    paddingVertical: 16,
    gap: 12,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 3,
  },
  currencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyBtn: {
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  hintText: {
    marginTop: -4,
  },
});
