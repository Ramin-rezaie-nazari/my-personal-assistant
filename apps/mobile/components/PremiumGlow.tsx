import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { PREMIUM } from '../lib/premium-ui';

export function PremiumGlow({ accent = 'primary', size = 220, opacity = 0.24 }: { accent?: 'primary' | 'cyan' | 'mint' | 'amber' | 'rose'; size?: number; opacity?: number }) {
  const pulse = useRef(new Animated.Value(0.88)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.08, duration: 2600, easing: PREMIUM.motion.ease, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.9, duration: 2600, easing: PREMIUM.motion.ease, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return <Animated.View pointerEvents="none" style={[styles.glow, { width: size, height: size, borderRadius: size / 2, opacity, backgroundColor: PREMIUM.colors[accent], transform: [{ scale: pulse }] }]} />;
}

const styles = StyleSheet.create({ glow: { position: 'absolute' } });
