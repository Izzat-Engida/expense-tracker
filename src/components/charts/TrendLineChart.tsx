import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/constants/theme';

interface TrendLineChartProps {
  points: number[];
  labels?: string[];
  color: string;
  height?: number;
}

export function TrendLineChart({
  points,
  labels,
  color,
  height = 148,
}: TrendLineChartProps) {
  const { colors } = useThemeColors();
  const [width, setWidth] = useState(0);

  const padLeft = 4;
  const padRight = 4;
  const padTop = 16;
  const padBottom = 8;
  const chartWidth = Math.max(1, width - padLeft - padRight);
  const chartHeight = height - padTop - padBottom;
  const max = Math.max(1, ...points);
  const stepX = points.length > 1 ? chartWidth / (points.length - 1) : 0;

  const coordinates = points.map((value, index) => ({
    x: padLeft + index * stepX,
    y: padTop + chartHeight * (1 - value / max),
  }));

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
  const baseY = padTop + chartHeight;
  const areaPath =
    coordinates.length > 0
      ? `M ${coordinates[0].x.toFixed(2)} ${baseY.toFixed(2)} ${coordinates
          .map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
          .join(' ')} L ${coordinates[coordinates.length - 1].x.toFixed(2)} ${baseY.toFixed(2)} Z`
      : '';

  const xLabels = labels ?? [];
  const labelIndices =
    points.length <= 3
      ? points.map((_, index) => index)
      : [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <View>
      <View
        style={{ height }}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      >
        {width > 0 && (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color} stopOpacity={0.28} />
                <Stop offset="1" stopColor={color} stopOpacity={0.02} />
              </LinearGradient>
            </Defs>

            {[0, 0.5, 1].map((ratio) => {
              const y = padTop + chartHeight * ratio;
              return (
                <Line
                  key={ratio}
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={colors.divider}
                  strokeWidth={1}
                />
              );
            })}

            {areaPath ? <Path d={areaPath} fill="url(#trendFill)" /> : null}
            {linePath ? (
              <Path
                d={linePath}
                stroke={color}
                strokeWidth={2.5}
                fill="none"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}
            {coordinates.length > 0 ? (
              <Circle
                cx={coordinates[coordinates.length - 1].x}
                cy={coordinates[coordinates.length - 1].y}
                r={3.5}
                fill={color}
                stroke={colors.card}
                strokeWidth={1.5}
              />
            ) : null}
          </Svg>
        )}
      </View>

      <View style={styles.axisRow}>
        {labelIndices.map((index) => (
          <AppText
            key={`${index}-${xLabels[index] ?? index}`}
            variant="caption"
            color={colors.textMuted}
            style={styles.axisText}
          >
            {xLabels[index] ?? ''}
          </AppText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: 2,
  },
  axisText: {
    fontSize: 10,
  },
});
