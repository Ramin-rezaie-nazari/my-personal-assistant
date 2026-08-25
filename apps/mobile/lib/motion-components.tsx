import React from 'react';
import { Animated, Pressable, ViewStyle } from 'react-native';
import { useEntrance, usePressScale } from './motion';
import { useReducedMotion } from './use-reduced-motion';

export function AnimatedIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: ViewStyle | ViewStyle[] }) {
  const reduced = useReducedMotion();
  const entrance = useEntrance(delay);
  return <Animated.View style={[reduced ? undefined : entrance, style]}>{children}</Animated.View>;
}

export function MotionPress({ children, onPress, onPressIn, onPressOut, style, disabled }: { children: React.ReactNode; onPress?: () => void; onPressIn?: () => void; onPressOut?: () => void; style?: ViewStyle | ViewStyle[]; disabled?: boolean }) {
  const reduced = useReducedMotion();
  const motion = usePressScale();
  return <Pressable disabled={disabled} onPress={onPress} onPressIn={() => { motion.onPressIn(); onPressIn?.(); }} onPressOut={() => { motion.onPressOut(); onPressOut?.(); }}><Animated.View style={[style, reduced ? undefined : { transform: [{ scale: motion.scale }] }]}>{children}</Animated.View></Pressable>;
}
