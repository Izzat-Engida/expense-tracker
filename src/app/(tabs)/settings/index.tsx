import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { Main, BentoCard, AppText, PillBadge, JapaneseIcon, UserAvatar } from '@/components/ui';
import type { JapaneseIconName } from '@/components/ui';
import { Fonts, useThemeColors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useSyncStore } from '@/stores/syncStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { triggerHaptic } from '@/utils/haptics';

interface MenuRowProps {
  icon: JapaneseIconName;
  label: string;
  sub: string;
  onPress: () => void;
  badge?: React.ReactNode;
}

function MenuRow({ icon, label, sub, onPress, badge }: MenuRowProps) {
  const { colors } = useThemeColors();
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => {
        triggerHaptic.selection();
        onPress();
      }}
    >
      <BentoCard variant="light" art="wagara" style={styles.menuCard}>
        <View style={styles.menuCardInner}>
          <View style={[styles.iconBox, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
            <JapaneseIcon name={icon} size={20} color={colors.textPrimary} />
          </View>
          <View style={styles.menuRowContent}>
            <AppText variant="bodyBold" style={styles.menuLabel}>{label}</AppText>
            <AppText variant="caption" color={colors.textMuted} style={styles.menuSub}>{sub}</AppText>
          </View>
          {badge ?? (
            <AppText style={[styles.chevron, { color: colors.textMuted }]}>›</AppText>
          )}
        </View>
      </BentoCard>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const currency = useSettingsStore((s) => s.currency);
  const dailyLimit = useSettingsStore((s) => s.dailyLimit);
  const setDailyLimit = useSettingsStore((s) => s.setDailyLimit);
  const activeAccount = useAuthStore((s) => s.activeAccount);
  const accounts = useAuthStore((s) => s.accounts);
  const { isDeviceOnline } = useSyncStore();

  const [limitInput, setLimitInput] = useState(
    dailyLimit > 0 ? String(Math.round(dailyLimit)) : '',
  );

  return (
    <Main
      showArt
      artOpacity={0.11}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
        <AppText variant="serifTitle">設定</AppText>
        <AppText variant="caption" color={colors.textMuted} style={{ marginTop: -6 }}>
          Settings
        </AppText>

       
        <BentoCard variant="light" art="wagara" style={styles.profileCard}>
          <View style={styles.profileRow}>
            <UserAvatar
              avatarUrl={activeAccount?.avatarUrl}
              name={activeAccount?.name}
              size={44}
            />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold">{activeAccount?.name || 'Local Ledger'}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {activeAccount?.isLocal
                  ? 'Device only · Offline'
                  : activeAccount?.email || 'No account'}
              </AppText>
            </View>
            {activeAccount?.isLocal ? (
              <PillBadge variant="outline" label="Local" />
            ) : (
              <PillBadge
                variant={isDeviceOnline ? 'income' : 'expense'}
                label={isDeviceOnline ? '● Online' : '○ Offline'}
              />
            )}
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              triggerHaptic.selection();
              router.push('/(tabs)/settings/account' as Href);
            }}
            style={[styles.accountBtn, { borderColor: colors.border, backgroundColor: colors.cardElevated }]}
          >
            <AppText variant="bodyBold" style={{ fontSize: 12 }}>
              Manage Account ({accounts.length}) ›
            </AppText>
          </TouchableOpacity>
        </BentoCard>

        {/* Daily Spending Limit Card */}
        <BentoCard variant="light" art="wagara" style={styles.limitCard}>
          <View style={styles.limitHeaderRow}>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold">Daily spending limit</AppText>
            </View>
          </View>

          <View style={[styles.limitInputRow, { borderColor: colors.border, backgroundColor: colors.cardElevated }]}>
            <TextInput
              value={limitInput}
              onChangeText={(text) => {
                setLimitInput(text);
                const val = parseFloat(text);
                setDailyLimit(isNaN(val) || val <= 0 ? 0 : val);
              }}
              keyboardType="numeric"
              placeholder={` 500 `}
              placeholderTextColor={colors.textMuted}
              style={[styles.limitInput, { color: colors.textPrimary }]}
              returnKeyType="done"
            />
            <AppText variant="caption" color={colors.textMuted} style={styles.currencySuffix}>{currency}</AppText>
          </View>
        </BentoCard>

        {/* Menu sections */}
        <View style={styles.menuSection}>
          <AppText variant="caption" color={colors.textMuted} style={styles.sectionLabel}>
            Preferences
          </AppText>
          <MenuRow
            icon="sensu"
            label="Appearance"
            sub="Theme, currency, haptics"
            onPress={() => router.push('/(tabs)/settings/appearance' as Href)}
          />
          <MenuRow
            icon="torii"
            label="Security"
            sub="Biometric unlock, session lock"
            onPress={() => router.push('/(tabs)/settings/security' as Href)}
          />
        </View>

        <View style={styles.menuSection}>
          <AppText variant="caption" color={colors.textMuted} style={styles.sectionLabel}>
            Data & storage
          </AppText>
          <MenuRow
            icon="makimono"
            label="Data & Export"
            sub="Export CSV, reset, cloud sync"
            onPress={() => router.push('/(tabs)/settings/data' as Href)}
          />
        </View>

        <View style={[styles.versionPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
            Yohaku · v1.0 · 余白
          </AppText>
        </View>
      </Main>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    gap: 16,
    paddingBottom: 90,
  },
  profileCard: {
    paddingVertical: 16,
    gap: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  limitCard: {
    paddingVertical: 16,
    gap: 12,
  },
  limitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  limitBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  limitInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.sans,
    paddingVertical: 0,
  },
  currencySuffix: {
    fontFamily: Fonts.mono,
  },
  limitNote: {
    marginTop: -2,
  },
  menuSection: {
    gap: 10,
  },
  sectionLabel: {
    letterSpacing: 1.2,
    paddingHorizontal: 4,
  },
  menuCard: {
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  menuCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowContent: {
    flex: 1,
    gap: 1,
  },
  menuLabel: {
    fontSize: 14,
  },
  menuSub: {
    fontSize: 11,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
  versionPill: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 4,
  },
});
