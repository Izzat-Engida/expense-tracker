import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

type TextVariant = 'serifTitle' | 'digital' | 'body' | 'bodyBold' | 'caption';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
}

export function AppText({
  variant = 'body',
  color = Colors.textPrimary,
  style,
  children,
  ...props
}: AppTextProps) {
  return (
    <Text style={[styles[variant], { color }, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  serifTitle: {
    fontFamily: Fonts.serif,
    fontSize: 26,
  },
  digital: {
    fontFamily: Fonts.digital,
    fontSize: 40,
    letterSpacing: 2,
  },
  body: {
    fontFamily: Fonts.sans,
    fontSize: 14,
  },
  bodyBold: {
    fontFamily: Fonts.sansBold,
    fontSize: 15,
  },
  caption: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    letterSpacing: 0.4,
  },
});