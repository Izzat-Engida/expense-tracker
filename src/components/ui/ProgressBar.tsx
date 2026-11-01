import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, useThemeColors } from '@/constants/theme';

interface ProgressBarProps {
  progress: number;
  fillColor?: string;
  height?: number;
}

export function ProgressBar({
  progress,
  fillColor,
  height = 8,
}: ProgressBarProps) {
  const { colors, isDark } = useThemeColors();
  const clampedProgress = Math.min(1, Math.max(0, isNaN(progress) ? 0 : progress));
  const percent = Math.round(clampedProgress * 100);
  const fill = fillColor ?? (isDark ? colors.bambooGreen : colors.cardDark);

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
          borderColor: colors.border,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(38, 42, 40, 0.1)',
        },
      ]}
    >
      <View
        style={{
          width: `${percent}%`,
          height: '100%',
          backgroundColor: fill,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: 'rgba(38, 42, 40, 0.1)',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
});
