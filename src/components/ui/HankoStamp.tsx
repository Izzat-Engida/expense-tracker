import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts, useThemeColors } from '@/constants/theme';

type HankoSize = 'sm' | 'md' | 'fab';

interface HankoStampProps {
  size?: HankoSize;
  onPress?: () => void;
}

const SIZE_MAP: Record<HankoSize, number> = {
  sm: 36,
  md: 52,
  fab: 56,
};

const FONT_MAP: Record<HankoSize, number> = {
  sm: 16,
  md: 24,
  fab: 26,
};

export function HankoStamp({ size = 'md', onPress }: HankoStampProps) {
  const { colors } = useThemeColors();
  const dimension = SIZE_MAP[size];
  const fontSize = FONT_MAP[size];
  const isFab = size === 'fab';

  const containerStyle = [
    styles.stamp,
    {
      width: dimension,
      height: dimension,
      borderRadius: 6,
      backgroundColor: colors.hankoRed,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      transform: isFab ? [{ rotate: '-3deg' }] : [],
    },
  ];

  const textStyle = [styles.character, { fontSize, color: '#FFFFFF' }];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={containerStyle}
      >
        <Text style={textStyle}>記</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle}>
      <Text style={textStyle}>記</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    backgroundColor: Colors.hankoRed,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  character: {
    fontFamily: Fonts.serif,
    color: Colors.textInverse,
    lineHeight: undefined,
    includeFontPadding: false,
  },
});
