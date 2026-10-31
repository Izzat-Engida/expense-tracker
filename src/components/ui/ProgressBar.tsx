import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface ProgressBarProps {
  progress: number;
  fillColor?: string;
  height?: number;
}

export function ProgressBar({
  progress,
  fillColor = Colors.cardDark,
  height = 8,
}: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, isNaN(progress) ? 0 : progress));
  const percent = Math.round(clampedProgress * 100);

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
        },
      ]}
    >
      <View
        style={{
          width: `${percent}%`,
          height: '100%',
          backgroundColor: fillColor,
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
