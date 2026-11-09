import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { JapaneseIcon, type JapaneseIconName } from './JapaneseIcon';
import { AppText } from './AppText';
import { Fonts, useThemeColors } from '@/constants/theme';

export interface PresetAvatar {
  id: string;
  name: string;
  icon: JapaneseIconName;
  bgLight: string;
  bgDark: string;
  iconLight: string;
  iconDark: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  {
    id: 'preset:enso',
    name: 'Zen Circle',
    icon: 'enso',
    bgLight: '#E8EFEA',
    bgDark: '#23322B',
    iconLight: '#2E5D4B',
    iconDark: '#7FB29E',
  },
  {
    id: 'preset:sakura',
    name: 'Cherry Blossom',
    icon: 'sakura',
    bgLight: '#FCEEF0',
    bgDark: '#3A2429',
    iconLight: '#C44D62',
    iconDark: '#F29CA9',
  },
  {
    id: 'preset:torii',
    name: 'Torii Gate',
    icon: 'torii',
    bgLight: '#FDEEE9',
    bgDark: '#3B231F',
    iconLight: '#B33927',
    iconDark: '#E57362',
  },
  {
    id: 'preset:tsuki',
    name: 'Crescent Moon',
    icon: 'tsuki',
    bgLight: '#EBF1F7',
    bgDark: '#1B2633',
    iconLight: '#2D4F6E',
    iconDark: '#8BB0D1',
  },
  {
    id: 'preset:hi',
    name: 'Rising Sun',
    icon: 'hi',
    bgLight: '#FDF6E2',
    bgDark: '#332D19',
    iconLight: '#B8860B',
    iconDark: '#E8C55A',
  },
  {
    id: 'preset:take',
    name: 'Bamboo',
    icon: 'take',
    bgLight: '#EAF4EC',
    bgDark: '#1E2E23',
    iconLight: '#3E7B4F',
    iconDark: '#82C193',
  },
  {
    id: 'preset:sensu',
    name: 'Folding Fan',
    icon: 'sensu',
    bgLight: '#F4ECE4',
    bgDark: '#30261E',
    iconLight: '#7A5230',
    iconDark: '#C9A381',
  },
  {
    id: 'preset:kiku',
    name: 'Chrysanthemum',
    icon: 'kiku',
    bgLight: '#F0EBF7',
    bgDark: '#261D33',
    iconLight: '#624687',
    iconDark: '#B196D6',
  },
  {
    id: 'preset:tomoe',
    name: 'Tomoe Swirl',
    icon: 'tomoe',
    bgLight: '#EDEDED',
    bgDark: '#2B2B2B',
    iconLight: '#424242',
    iconDark: '#C7C7C7',
  },
  {
    id: 'preset:kumo',
    name: 'Zen Cloud',
    icon: 'kumo',
    bgLight: '#EAF1F5',
    bgDark: '#1E2930',
    iconLight: '#466579',
    iconDark: '#9BC0D6',
  },
];

export function getPresetAvatar(id?: string | null): PresetAvatar | null {
  if (!id || !id.startsWith('preset:')) return null;
  return PRESET_AVATARS.find((p) => p.id === id) || null;
}

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string | null;
  size?: number;
  style?: ViewStyle;
  borderWidth?: number;
  borderColor?: string;
}

export function UserAvatar({
  avatarUrl,
  name,
  size = 44,
  style,
  borderWidth = 1.5,
  borderColor,
}: UserAvatarProps) {
  const { colors, isDark } = useThemeColors();
  const effectiveBorderColor = borderColor ?? colors.border;
  const radius = size / 2;

  // 1. Check if avatar is one of the preset Japanese Kamon illustrations
  const preset = getPresetAvatar(avatarUrl);
  if (preset) {
    const bgColor = isDark ? preset.bgDark : preset.bgLight;
    const iconColor = isDark ? preset.iconDark : preset.iconLight;
    const iconSize = Math.round(size * 0.52);

    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: bgColor,
            borderWidth,
            borderColor: effectiveBorderColor,
          },
          style,
        ]}
      >
        <JapaneseIcon name={preset.icon} size={iconSize} color={iconColor} strokeWidth={1.9} />
      </View>
    );
  }

  // 2. Check if avatar is a custom image URI / URL
  if (avatarUrl && (avatarUrl.startsWith('file:') || avatarUrl.startsWith('http:') || avatarUrl.startsWith('https:') || avatarUrl.startsWith('data:'))) {
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: radius,
            borderWidth,
            borderColor: effectiveBorderColor,
            overflow: 'hidden',
          },
          style,
        ]}
      >
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={200}
        />
      </View>
    );
  }

  // 3. Fallback: clean monogram letter
  const initial = (name?.trim()?.slice(0, 1) || 'Y').toUpperCase();
  const fontSize = Math.round(size * 0.42);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.selectionBg,
          borderWidth,
          borderColor: effectiveBorderColor,
        },
        style,
      ]}
    >
      <AppText
        variant="bodyBold"
        color={colors.selectionText}
        style={{
          fontSize,
          lineHeight: fontSize * 1.2,
          fontFamily: Fonts.serif,
        }}
      >
        {initial}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
