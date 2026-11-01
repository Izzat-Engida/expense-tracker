import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import {
  LightColors,
  DarkColors,
  Fonts,
  useThemeColors,
} from '@/constants/theme';
import { useCardSurface } from './CardSurface';

type TextVariant = 'serifTitle' | 'digital' | 'body' | 'bodyBold' | 'caption';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
}

/**
 * Text-safe palette keys, in priority order. Some light palette values are
 * shared (e.g. `textPrimary`, `cardDark`, `border` are all #262A28), so we can
 * only resolve colors that are actually used as text.
 */
const TEXT_COLOR_KEYS = [
  'textPrimary',
  'textSecondary',
  'textMuted',
  'textInverse',
  'positiveText',
  'negativeText',
  'expensePillText',
  'categoryFood',
  'categoryBills',
  'categoryTransport',
  'categoryFun',
  'categoryOther',
] as const;

/**
 * Maps a raw color value from the light palette to the target palette.
 * This keeps call sites that pass `Colors.textSecondary`, `Colors.bambooGreen`,
 * category colors, etc. in sync with the active theme.
 */
function resolveColor(
  input: string,
  palette: typeof LightColors | typeof DarkColors
): string {
  for (const key of TEXT_COLOR_KEYS) {
    if (LightColors[key] === input) {
      return palette[key];
    }
  }
  return input;
}

export function AppText({
  variant = 'body',
  color,
  style,
  children,
  ...props
}: AppTextProps) {
  const { colors } = useThemeColors();
  const surface = useCardSurface();

  // Dark cards (e.g. the "spent" and "total" bento cards) exist in both themes.
  // In the light theme their default theme text color would be dark-on-dark, so
  // use the dark palette's foreground text for any text painted on that surface.
  const palette = surface === 'dark' ? DarkColors : colors;
  const finalColor = color ? resolveColor(color, palette) : palette.textPrimary;

  return (
    <Text style={[styles[variant], { color: finalColor }, style]} {...props}>
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
