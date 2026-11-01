import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Image,
  ImageSourcePropType,
  ImageStyle,
} from 'react-native';
import { Colors } from '@/constants/theme';

const ART_IMAGES = {
  wagara: {
    dark: require('../../../assets/images/wagara-light.png'),
    light: require('../../../assets/images/wagara-dark.png'),
  },
  wave: {
    dark: require('../../../assets/images/ukiyoe-waves-light.png'),
    light: require('../../../assets/images/ukiyoe-waves-dark.png'),
  },
  crane: {
    dark: require('../../../assets/images/ukiyoe-crane-light.png'),
    light: require('../../../assets/images/ukiyoe-crane-dark.png'),
  },
  full: {
    dark: require('../../../assets/images/ukiyoe-linework-light.png'),
    light: require('../../../assets/images/ukiyoe-linework-dark.png'),
  },
} as const;

export type CardVariant = 'light' | 'dark' | 'elevated';
export type CardArt = 'none' | 'wagara' | 'wave' | 'crane' | 'full';

export interface BentoCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  art?: CardArt;
  artOpacity?: number;
}

export function BentoCard({
  children,
  variant = 'light',
  style,
  art = 'wagara',
  artOpacity,
}: BentoCardProps) {
  const bgMap: Record<CardVariant, string> = {
    light: Colors.card,
    dark: Colors.cardDark,
    elevated: Colors.cardElevated,
  };

  const isDark = variant === 'dark';
  const defaultOpacity = isDark ? 0.28 : 0.16;
  const opacity = artOpacity ?? defaultOpacity;

  let artSource: ImageSourcePropType | null = null;
  let artStyle: StyleProp<ImageStyle> = styles.artWagara;
  let resizeMode: 'cover' | 'contain' = 'cover';

  if (art === 'wagara') {
    artSource = isDark ? ART_IMAGES.wagara.dark : ART_IMAGES.wagara.light;
    artStyle = styles.artWagara;
    resizeMode = 'cover';
  } else if (art === 'wave') {
    artSource = isDark ? ART_IMAGES.wave.dark : ART_IMAGES.wave.light;
    artStyle = styles.artWave;
    resizeMode = 'contain';
  } else if (art === 'crane') {
    artSource = isDark ? ART_IMAGES.crane.dark : ART_IMAGES.crane.light;
    artStyle = styles.artCrane;
    resizeMode = 'contain';
  } else if (art === 'full') {
    artSource = isDark ? ART_IMAGES.full.dark : ART_IMAGES.full.light;
    artStyle = styles.artFull;
    resizeMode = 'cover';
  }

  return (
    <View style={[styles.cardBase, { backgroundColor: bgMap[variant] }, style]}>
      {artSource && art !== 'none' && (
        <View style={styles.artClipper} pointerEvents="none">
          <Image
            source={artSource}
            style={[artStyle, { opacity }]}
            resizeMode={resizeMode}
            pointerEvents="none"
          />
        </View>
      )}
      {children}
    </View>
  );
}

export default BentoCard;

const styles = StyleSheet.create({
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
    position: 'relative',
  },
  artClipper: {
    ...StyleSheet.absoluteFill,
    borderRadius: 20,
    overflow: 'hidden',
  },
  artWagara: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  artWave: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 150,
    height: 100,
  },
  artCrane: {
    position: 'absolute',
    right: 8,
    top: 6,
    width: 95,
    height: 85,
  },
  artFull: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
});