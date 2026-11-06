import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/constants/theme';
import { formatCompactAmount } from '@/lib/ledger';

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

interface VerticalBarChartProps {
  data: BarDatum[];
  color?: string;
  height?: number;
  showValues?: boolean;
  valueFormatter?: (value: number) => string;
}

export function VerticalBarChart({
  data,
  color,
  height = 140,
  showValues,
  valueFormatter,
}: VerticalBarChartProps) {
  const { colors } = useThemeColors();
  const max = Math.max(1, ...data.map((item) => item.value));
  const displayValues = showValues ?? data.length <= 4;
  const format = valueFormatter ?? ((value: number) => formatCompactAmount(value));

  return (
    <View>
      <View style={[styles.plot, { height }]}>
        {data.map((item) => {
          const ratio = Math.max(0, Math.min(1, item.value / max));
          return (
            <View key={item.label} style={styles.column}>
              {displayValues ? (
                <AppText
                  variant="caption"
                  color={colors.textMuted}
                  style={styles.valueText}
                  numberOfLines={1}
                >
                  {item.value > 0 ? format(item.value) : ''}
                </AppText>
              ) : null}
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${ratio * 100}%`,
                      minHeight: item.value > 0 ? 3 : 0,
                      backgroundColor: item.color ?? color ?? colors.bambooGreen,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.labelRow}>
        {data.map((item) => (
          <AppText
            key={item.label}
            variant="caption"
            color={colors.textMuted}
            style={styles.label}
            numberOfLines={1}
          >
            {item.label}
          </AppText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  column: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  valueText: {
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 3,
  },
  barTrack: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  labelRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  label: {
    flex: 1,
    fontSize: 10,
    textAlign: 'center',
  },
});
