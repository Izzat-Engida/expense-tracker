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
  const clampedProgress = Math.min(1, Math.max(0, progress));

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
        style={[
          styles.fill,
          {
            flex: clampedProgress,
            backgroundColor: fillColor,
            borderRadius: height / 2,
          },
        ]}
      />
    
      {clampedProgress < 1 && (
        <View style={{ flex: 1 - clampedProgress }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  fill: {

  },
});
