import { View, StyleSheet,ViewStyle,StyleProp } from 'react-native'
import React from 'react'
import {Colors} from '@/constants/theme';

type CardVariant = 'light' | 'dark' | 'elevated';

interface BentoCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
}

export function BentoCard({
  children,
  variant = 'light',
  style,
}: BentoCardProps) {
  const bgMap: Record<CardVariant, string> = {
    light: Colors.card,
    dark: Colors.cardDark,
    elevated: Colors.cardElevated,
  };

  return (
    <View style={[styles.cardBase, { backgroundColor: bgMap[variant] }, style]}>
      {children}
    </View>
  );
}

export default BentoCard

const styles=StyleSheet.create({
    cardBase: {
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 18,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
})