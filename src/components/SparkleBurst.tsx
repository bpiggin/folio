import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const SPARKLE = require('../../assets/sparkle.png');

type Particle = { angle: number; distance: number; size: number; spin: number; peak: number; delay: number; star: boolean };

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    // Mostly upwards, fanned out: -165°…-15°.
    angle: ((-165 + Math.random() * 150) * Math.PI) / 180,
    distance: 22 + Math.random() * 30,
    size: i % 3 === 2 ? 3 + Math.random() * 2 : 7 + Math.random() * 6,
    spin: (Math.random() - 0.5) * 180,
    peak: 0.45 + Math.random() * 0.5,
    delay: Math.random() * 50,
    star: i % 3 !== 2,
  }));
}

/**
 * A small one-shot burst of monochrome sparkles and dots from the centre of its
 * (zero-size) container. Mount it to play it.
 */
export function SparkleBurst({ color, count = 10 }: { color: string; count?: number }) {
  const [particles] = useState(() => makeParticles(count));
  const [progress] = useState(() => particles.map(() => new Animated.Value(0)));

  useEffect(() => {
    Animated.parallel(
      progress.map((p, i) =>
        Animated.timing(p, { toValue: 1, duration: 360, delay: particles[i].delay, useNativeDriver: true })
      )
    ).start();
  }, [progress, particles]);

  return (
    <View pointerEvents="none" style={styles.origin}>
      {particles.map((p, i) => {
        const t = progress[i];
        const style = {
          position: 'absolute' as const,
          left: -p.size / 2,
          top: -p.size / 2,
          width: p.size,
          height: p.size,
          opacity: t.interpolate({ inputRange: [0, 0.15, 0.6, 1], outputRange: [0, p.peak, p.peak * 0.8, 0] }),
          transform: [
            { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(p.angle) * p.distance] }) },
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(p.angle) * p.distance] }) },
            { scale: t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.3, 1, 0.7] }) },
            { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
          ],
        };
        return p.star ? (
          <Animated.Image key={i} source={SPARKLE} style={[style, { tintColor: color }]} />
        ) : (
          <Animated.View key={i} style={[style, { borderRadius: p.size / 2, backgroundColor: color }]} />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  origin: { position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, overflow: 'visible' },
});
