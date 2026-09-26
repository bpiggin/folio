import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

import { useReduceMotion } from '../lib/motion';
import { Theme, weight } from '../lib/theme';

const CHECK = require('../../assets/check.png');

/**
 * "Archived · Undo" pill. Springs up from the bottom when a message is archived,
 * the check pops in just after (again for each further archive), and it slides
 * back down out of sight when dismissed.
 */
export function ArchivedToast({
  archivedId,
  onUndo,
  theme,
  bottom,
}: {
  /** The message just archived, or null to hide. */
  archivedId: string | null;
  onUndo: () => void;
  theme: Theme;
  bottom: number;
}) {
  const reduceMotion = useReduceMotion();
  const [shown] = useState(() => new Animated.Value(0));
  const [check] = useState(() => new Animated.Value(0));

  const visible = archivedId !== null;
  useEffect(() => {
    if (visible) {
      check.setValue(0);
      Animated.parallel([
        Animated.spring(shown, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 7 }),
        Animated.spring(check, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 14, delay: 120 }),
      ]).start();
    } else {
      Animated.timing(shown, { toValue: 0, duration: reduceMotion ? 0 : 220, useNativeDriver: true }).start();
    }
  }, [archivedId, visible, shown, check, reduceMotion]);

  const hiddenOffset = bottom + 80;
  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      style={[
        styles.wrap,
        {
          bottom,
          opacity: shown.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
          transform: [{ translateY: shown.interpolate({ inputRange: [0, 1], outputRange: [hiddenOffset, 0] }) }],
        },
      ]}
    >
      <Animated.View style={[styles.pill, { backgroundColor: theme.text }]}>
        <Animated.Image
          source={CHECK}
          style={[
            styles.check,
            {
              tintColor: theme.bg,
              opacity: check,
              transform: [{ scale: check.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
            },
          ]}
        />
        <Text style={[styles.label, { color: theme.bg }]}>Archived</Text>
        <Pressable onPress={onUndo} hitSlop={12}>
          <Text style={[styles.action, { color: theme.bg }]}>Undo</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 20,
    borderRadius: 999,
    elevation: 6,
  },
  check: { width: 16, height: 16 },
  label: { fontWeight: weight.regular, fontSize: 14, marginRight: 12 },
  action: { fontWeight: weight.bold, fontSize: 14, textDecorationLine: 'underline' },
});
