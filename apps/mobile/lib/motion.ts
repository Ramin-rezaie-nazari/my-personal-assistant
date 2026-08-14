import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export const motion = {
  fast: 180,
  normal: 280,
  slow: 420,
  spring: { tension: 90, friction: 11 },
} as const;

export function useEntrance(delay = 0, distance = 18) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: motion.normal,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        ...motion.spring,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [delay, distance, opacity, translateY]);

  return { opacity, transform: [{ translateY }] };
}

export function usePulse(active = true) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) {
      scale.stopAnimation();
      scale.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.035, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [active, scale]);

  return { transform: [{ scale }] };
}

export function pressIn(scale: Animated.Value) {
  Animated.spring(scale, { toValue: 0.97, ...motion.spring, useNativeDriver: true }).start();
}

export function pressOut(scale: Animated.Value) {
  Animated.spring(scale, { toValue: 1, ...motion.spring, useNativeDriver: true }).start();
}
