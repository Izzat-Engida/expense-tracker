import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Fonts, useThemeColors } from '@/constants/theme';

type PillVariant = 'expense' | 'dark' | 'outline' | 'income';

interface PillBadgeProps {
  label: string;
  variant?: PillVariant;
  onPress?: () => void;
  dotColor?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function PillBadge({
  label,
  variant = 'outline',
  onPress,
  dotColor,
  style,
  textStyle,
}: PillBadgeProps) {
  const { colors, isDark } = useThemeColors();

  const variantStyles = {
    expense: {
      textColor: colors.expensePillText,    
    },
    dark: {
      backgroundColor: colors.selectionBg,
      textColor: colors.selectionText,
      borderColor: colors.selectionBorder,
      borderWidth: 1.5,
    },
    outline: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
      textColor: colors.textPrimary,
    },
    income: {
      backgroundColor: colors.incomeBg,
      textColor: colors.incomeText,
      borderColor: colors.incomeBorder,
      borderWidth: 1.5,
    },
  }[variant];

  const pillStyle = [
    styles.pill,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderWidth: variantStyles.borderWidth,
      borderColor: variantStyles.borderColor,
    },
    style,
  ];

  const content = (
    <>
      {dotColor && (
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      )}
      <Text style={[styles.label, { color: variantStyles.textColor }, textStyle]}>{label}</Text>
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
