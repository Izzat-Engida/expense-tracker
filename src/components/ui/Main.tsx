import React, { ElementRef } from 'react';
import {
  View,
  ScrollView,
  ViewStyle,
  StyleProp,
  StyleSheet,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Colors, useThemeColors } from '@/constants/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';

const UKIYOE_BG_LIGHT = require('../../../assets/images/ukiyoe-crane-wave.jpg');
const UKIYOE_BG_DARK = require('../../../assets/images/ukiyoe-linework-light.png');

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  showArt?: boolean;
  artOpacity?: number;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  keyboardDismissMode?: 'none' | 'on-drag' | 'interactive';
  scrollViewRef?: React.Ref<ElementRef<typeof ScrollView>>;
  automaticallyAdjustKeyboardInsets?: boolean;
  bottomOffset?: number;
  extraKeyboardSpace?: number;
}

const Main = ({
  children,
  scrollable = true,
  style,
  contentContainerStyle,
  edges = ['top', 'bottom'],
  showArt = false,
  artOpacity,
  keyboardShouldPersistTaps = 'handled',
  keyboardDismissMode = 'on-drag',
  scrollViewRef,
  automaticallyAdjustKeyboardInsets = true,
  bottomOffset = 24,
  extraKeyboardSpace = 0,
}: ScreenProps) => {
  const { colors, isDark } = useThemeColors();
  const defaultOpacity = isDark ? 0.08 : 0.14;
  const opacity = artOpacity ?? defaultOpacity;
  const artSource = isDark ? UKIYOE_BG_DARK : UKIYOE_BG_LIGHT;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }, style]}
      edges={edges}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {showArt && (
        <Image
          source={artSource}
          style={[styles.bgArt, { opacity }]}
          resizeMode="cover"
          pointerEvents="none"
        />
      )}
      {scrollable ? (
        <KeyboardAwareScrollView
          ref={scrollViewRef as React.Ref<ElementRef<typeof KeyboardAwareScrollView>>}
          style={styles.flex}
          contentContainerStyle={[styles.container, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          keyboardDismissMode={keyboardDismissMode}
          automaticallyAdjustKeyboardInsets={automaticallyAdjustKeyboardInsets}
          bottomOffset={bottomOffset}
          extraKeyboardSpace={extraKeyboardSpace}
        >
          <Animated.View
            entering={FadeInDown.duration(280)}
            style={styles.animatedContent}
          >
            {children}
          </Animated.View>
        </KeyboardAwareScrollView>
      ) : (
        <View style={[styles.flex, styles.container, contentContainerStyle]}>
          <Animated.View
            entering={FadeInDown.duration(280)}
            style={styles.animatedContent}
          >
            {children}
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Main;
export { Main };

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    position: 'relative',
  },
  bgArt: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  flex: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 16,
  },
  animatedContent: {
    gap: 16,
  },
});
