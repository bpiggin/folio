import * as Haptics from 'expo-haptics';
import { ReactNode, useMemo, useState } from 'react';
import { Animated, LayoutAnimation, PanResponder, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useReduceMotion } from '../lib/motion';
import type { Theme } from '../lib/theme';
import { SparkleBurst } from './SparkleBurst';

const ICON = require('../../assets/archive.png');

type Side = 'left' | 'right';

/**
 * Swipe a row left or right to archive it.
 *
 * The archive icon grows as you drag; crossing the threshold (~35% of the
 * screen) gives a haptic tick and flips the strip to solid ink. Let go past it
 * (or flick) and the row slides away, a few sparkles pop from the icon, and the
 * row collapses. Otherwise it springs back.
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
  const reduceMotion = useReduceMotion();
  const threshold = width * 0.35;
  const [x] = useState(() => new Animated.Value(0));
  const [armed] = useState(() => new Animated.Value(0));
  const [burst, setBurst] = useState<Side | null>(null);

  // The drag itself lives in `x`/`armed`, so the handlers can be rebuilt whenever
  // their inputs change.
  const responder = useMemo(() => {
    const gesture = { armed: false };
    const arm = (next: boolean) => {
      if (next === gesture.armed) return;
      gesture.armed = next;
      Haptics.selectionAsync();
      Animated.spring(armed, { toValue: next ? 1 : 0, useNativeDriver: true, speed: 40, bounciness: 8 }).start();
    };
    const settle = () => {
      arm(false);
      Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 28 }).start();
    };
    return PanResponder.create({
      // Only claim clearly horizontal drags, so vertical scrolling and taps behave as normal.
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.8,
      onPanResponderMove: (_, g) => {
        x.setValue(g.dx);
        arm(Math.abs(g.dx) > threshold);
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, g) => {
        const committed = Math.abs(g.dx) > threshold || (Math.abs(g.vx) > 0.8 && Math.abs(g.dx) > 40);
        if (!committed) return settle();
        arm(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Dragging right reveals the left-hand icon, and vice versa.
        if (!reduceMotion) setBurst(g.dx > 0 ? 'left' : 'right');
        Animated.timing(x, { toValue: Math.sign(g.dx) * width, duration: 120, useNativeDriver: true }).start(() => {
          // Let the sparkles play for a moment before the row folds away.
          setTimeout(
            () => {
              LayoutAnimation.configureNext(LayoutAnimation.create(150, 'easeInEaseOut', 'opacity'));
              onArchive();
            },
            reduceMotion ? 0 : 160
          );
        });
      },
      onPanResponderTerminate: settle,
    });
  }, [x, armed, width, threshold, reduceMotion, onArchive]);

  const dragScale = x.interpolate({
    inputRange: [-threshold, 0, threshold],
    outputRange: [1, 0.55, 1],
    extrapolate: 'clamp',
  });
  const iconStyle = {
    opacity: x.interpolate({ inputRange: [-72, -16, 0, 16, 72], outputRange: [1, 0, 0, 0, 1], extrapolate: 'clamp' }),
    transform: [{ scale: Animated.multiply(dragScale, armed.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] })) }],
  };

  const icon = (side: Side) => (
    <Animated.View style={[styles.iconBox, iconStyle]}>
      <Animated.Image
        source={ICON}
        style={[styles.icon, { tintColor: theme.text, opacity: armed.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}
      />
      <Animated.Image source={ICON} style={[styles.icon, styles.stacked, { tintColor: theme.bg, opacity: armed }]} />
      {burst === side ? <SparkleBurst color={theme.bg} /> : null}
    </Animated.View>
  );

  return (
    <View>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.surface }]}>
        {/* Solid "ink" plate that fades in once the swipe will archive. */}
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.text, opacity: armed }]} />
        <View style={[StyleSheet.absoluteFill, styles.behind]}>
          {icon('left')}
          {icon('right')}
        </View>
      </View>
      <Animated.View style={{ transform: [{ translateX: x }], backgroundColor: theme.bg }} {...responder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  behind: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28 },
  iconBox: { width: 26, height: 26 },
  icon: { width: 26, height: 26 },
  stacked: { position: 'absolute', left: 0, top: 0 },
});
