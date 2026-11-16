import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Fonts, useThemeColors } from '@/constants/theme';
import { triggerHaptic } from '@/utils/haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

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
  const pressed = useSharedValue(0);
  const animatedPressStyle = useAnimatedStyle(() => ({
    transform: [
      ...(isFab ? [{ rotate: '-3deg' }] : []),
      { scale: withSpring(pressed.value ? 0.94 : 1, { damping: 16, stiffness: 260 }) },
    ],
  }), [isFab]);

  const containerStyle = [
    styles.stamp,
    {
      width: dimension,
      height: dimension,
      borderRadius: 6,
      backgroundColor: colors.hankoRed,
      borderColor: colors.border,
      shadowColor: colors.shadow,
    },
  ];

  const textStyle = [styles.character, { fontSize, color: '#FFFFFF' }];

  if (onPress) {
    return (
      <Animated.View style={animatedPressStyle}>
        <TouchableOpacity
        onPress={() => {
          triggerHaptic.medium();
          onPress();
        }}
        activeOpacity={0.75}
        style={containerStyle}
          onPressIn={() => { pressed.value = 1; }}
          onPressOut={() => { pressed.value = 0; }}
        >
          <Text style={textStyle}>記</Text>
        </TouchableOpacity>
      </Animated.View>
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
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 2,
  },
  character: {
    fontFamily: Fonts.serif,
    color: Colors.textInverse,
    lineHeight: undefined,
    includeFontPadding: false,
  },
});
