import { useFocusEffect } from 'expo-router';
import { ReactNode, useCallback, useState } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

export const FADE_MS = 110;

/**
 * Screens switch with native animation turned off and fade their own content
 * in on every focus, which is faster and calmer than Android's slide/zoom.
 */
export function FadeIn({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const [opacity] = useState(() => new Animated.Value(0));
  useFocusEffect(
    useCallback(() => {
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: FADE_MS, useNativeDriver: true }).start();
    }, [opacity])
  );
  return <Animated.View style={[{ flex: 1, opacity }, style]}>{children}</Animated.View>;
}
