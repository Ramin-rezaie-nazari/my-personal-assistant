import React from 'react';
import { Animated, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useEntrance, usePressScale } from './motion';

export function AnimatedIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  return <Animated.View style={[useEntrance(delay), style]}>{children}</Animated.View>;
}

export function MotionPress({ children, onPress, onPressIn, onPressOut, style, disabled }: { children: React.ReactNode; onPress?: () => void; onPressIn?: () => void; onPressOut?: () => void; style?: StyleProp<ViewStyle>; disabled?: boolean }) {
  const motion = usePressScale();
  return <Pressable disabled={disabled} onPress={onPress} onPressIn={() => { motion.onPressIn(); onPressIn?.(); }} onPressOut={() => { motion.onPressOut(); onPressOut?.(); }}><Animated.View style={[style, { transform: [{ scale: motion.scale }] }]}>{children}</Animated.View></Pressable>;
}
