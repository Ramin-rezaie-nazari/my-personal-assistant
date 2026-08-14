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
      Animated.timing(opacity, { toValue: 1, duration: motion.normal, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, ...motion.spring, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [delay, distance, opacity, translateY]);

  return { opacity, transform: [{ translateY }] };
}

export function usePulse(active = true, amount = 1.035) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active) { scale.stopAnimation(); scale.setValue(1); return; }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: amount, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [active, amount, scale]);
  return { transform: [{ scale }] };
}

export function usePressScale(scaleTo = 0.97) {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: scaleTo, ...motion.spring, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, ...motion.spring, useNativeDriver: true }).start();
  return { scale, onPressIn, onPressOut };
}

export function useSuccessPop(active: boolean) {
  const scale = useRef(new Animated.Value(active ? 0.86 : 1)).current;
  const opacity = useRef(new Animated.Value(active ? 0 : 1)).current;
  useEffect(() => {
    if (!active) { scale.setValue(1); opacity.setValue(1); return; }
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 75, friction: 7, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: motion.fast, useNativeDriver: true }),
    ]).start();
  }, [active, opacity, scale]);
  return { opacity, transform: [{ scale }] };
}
