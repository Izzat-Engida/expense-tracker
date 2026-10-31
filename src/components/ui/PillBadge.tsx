import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

type PillVariant = 'expense' | 'dark' | 'outline' | 'income';

interface PillBadgeProps {
  label: string;
  variant?: PillVariant;
  onPress?: () => void;
  dotColor?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

interface VariantStyle {
  backgroundColor: string;
  borderWidth?: number;
  borderColor?: string;
  textColor: string;
}

const VARIANT_STYLES: Record<PillVariant, VariantStyle> = {
  expense: {
    backgroundColor: Colors.expensePillBg,
    textColor: Colors.expensePillText,
  },
  dark: {
    backgroundColor: Colors.cardDark,
    textColor: Colors.textInverse,
  },
  outline: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    textColor: Colors.textPrimary,
  },
  income: {
    backgroundColor: Colors.bambooGreen,
    textColor: Colors.textInverse,
  },
};

export function PillBadge({
  label,
  variant = 'outline',
  onPress,
  dotColor,
  style,
  textStyle,
}: PillBadgeProps) {
  const vs = VARIANT_STYLES[variant];

  const pillStyle = [
    styles.pill,
    {
      backgroundColor: vs.backgroundColor,
      borderWidth: vs.borderWidth ?? 0,
      borderColor: vs.borderColor ?? 'transparent',
    },
    style,
  ];

  const content = (
    <>
      {dotColor && (
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      )}
      <Text style={[styles.label, { color: vs.textColor }, textStyle]}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={pillStyle}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={pillStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
