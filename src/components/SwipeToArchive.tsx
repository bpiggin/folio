import * as Haptics from 'expo-haptics';
import { ReactNode, useMemo, useState } from 'react';
import { Animated, Image, LayoutAnimation, PanResponder, StyleSheet, useWindowDimensions, View } from 'react-native';

import type { Theme } from '../lib/theme';

const ICON = require('../../assets/archive.png');

/**
 * Swipe a row left or right to archive it. Past ~35% of the screen (or a quick
 * flick) the row slides off and collapses; otherwise it springs back.
 */
export function SwipeToArchive({
  onArchive,
  theme,
  children,
}: {
  onArchive: () => void;
  theme: Theme;
  children: ReactNode;
}) {
  const { width } = useWindowDimensions();
  const [x] = useState(() => new Animated.Value(0));
  // The handlers hold no state of their own (the drag lives in `x`), so they can
  // be rebuilt whenever their inputs change, even mid-gesture.
  const responder = useMemo(() => {
    const settle = () => Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 20 }).start();
    return PanResponder.create({
      // Only claim clearly horizontal drags, so vertical scrolling and taps behave as normal.
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.8,
      onPanResponderMove: (_, g) => x.setValue(g.dx),
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, g) => {
        const committed = Math.abs(g.dx) > width * 0.35 || (Math.abs(g.vx) > 0.8 && Math.abs(g.dx) > 40);
        if (!committed) return settle();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.timing(x, { toValue: Math.sign(g.dx) * width, duration: 140, useNativeDriver: true }).start(() => {
          LayoutAnimation.configureNext(LayoutAnimation.create(160, 'easeInEaseOut', 'opacity'));
          onArchive();
        });
      },
      onPanResponderTerminate: settle,
    });
  }, [x, width, onArchive]);

  const iconOpacity = x.interpolate({
    inputRange: [-96, -24, 0, 24, 96],
    outputRange: [1, 0, 0, 0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View>
      <View style={[StyleSheet.absoluteFill, styles.behind, { backgroundColor: theme.surface }]}>
        <Animated.View style={{ opacity: iconOpacity }}>
          <Image source={ICON} style={[styles.icon, { tintColor: theme.text }]} />
        </Animated.View>
        <Animated.View style={{ opacity: iconOpacity }}>
          <Image source={ICON} style={[styles.icon, { tintColor: theme.text }]} />
        </Animated.View>
      </View>
      <Animated.View style={{ transform: [{ translateX: x }], backgroundColor: theme.bg }} {...responder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  behind: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28 },
  icon: { width: 26, height: 26 },
});
