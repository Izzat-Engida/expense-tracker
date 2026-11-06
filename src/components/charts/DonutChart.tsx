import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppText } from '@/components/ui/AppText';
import { Fonts, useThemeColors } from '@/constants/theme';

export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDatum[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSubLabel?: string;
}

export function DonutChart({
  data,
  size = 132,
  thickness = 18,
  centerLabel,
  centerSubLabel,
}: DonutChartProps) {
  const { colors } = useThemeColors();
  const segments = useMemo(
    () => data.filter((item) => Number.isFinite(item.value) && item.value > 0),
    [data],
  );
  const total = useMemo(
    () => segments.reduce((sum, item) => sum + item.value, 0),
    [segments],
  );

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let cursor = 0;

  return (
    <View style={styles.wrapper}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.divider}
            strokeWidth={thickness}
            fill="none"
          />
          {total > 0 &&
            segments.map((segment) => {
              const fraction = segment.value / total;
              const dash = fraction * circumference;
              const offset = -cursor * circumference;
              cursor += fraction;
              return (
                <Circle
                  key={segment.label}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={segment.color}
                  strokeWidth={thickness}
                  fill="none"
                  strokeDasharray={`${dash} ${Math.max(0, circumference - dash)}`}
                  strokeDashoffset={offset}
                  transform={`rotate(-90 ${center} ${center})`}
                />
              );
            })}
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <AppText variant="bodyBold" style={styles.centerValue}>
            {centerLabel ?? ''}
          </AppText>
          {centerSubLabel ? (
            <AppText variant="caption" color={colors.textMuted} style={styles.centerSub}>
              {centerSubLabel}
            </AppText>
          ) : null}
        </View>
      </View>

      <View style={styles.legend}>
        {segments.length === 0 ? (
          <AppText variant="caption" color={colors.textMuted}>
            No spending yet
          </AppText>
        ) : (
          segments.map((segment) => {
            const percent = total > 0 ? Math.round((segment.value / total) * 100) : 0;
            return (
              <View key={segment.label} style={styles.legendRow}>
                <View style={styles.legendLabelGroup}>
                  <View style={[styles.dot, { backgroundColor: segment.color }]} />
                  <AppText variant="caption" numberOfLines={1} style={styles.legendLabel}>
                    {segment.label}
                  </AppText>
                </View>
                <View style={styles.legendValueGroup}>
                  <AppText variant="caption" color={colors.textSecondary} style={styles.legendPercent}>
                    {percent}%
                  </AppText>
                  <AppText variant="caption" style={styles.legendAmount}>
                    {Math.round(segment.value).toLocaleString()}
                  </AppText>
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    fontFamily: Fonts.serif,
    fontSize: 20,
  },
  centerSub: {
    fontSize: 10,
    marginTop: 1,
  },
  legend: {
    flex: 1,
    gap: 7,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  legendLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    flex: 1,
    fontSize: 12,
  },
  legendValueGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  legendPercent: {
    fontSize: 10,
    width: 32,
    textAlign: 'right',
  },
  legendAmount: {
    fontSize: 12,
    fontFamily: Fonts.sansBold,
  },
});
