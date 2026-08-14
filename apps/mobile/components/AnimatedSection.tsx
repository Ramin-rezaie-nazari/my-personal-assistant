import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleProp, ViewStyle } from 'react-native';

type Props = { children: React.ReactNode; delay?: number; style?: StyleProp<ViewStyle> };

export function AnimatedSection({ children, delay = 0, style }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, delay, tension: 72, friction: 9, useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, translateY]);

  return <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

export function AnimatedPressable({ children, onPress, style, disabled }: Props & { onPress?: () => void; disabled?: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.97, speed: 30, bounciness: 3, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, speed: 22, bounciness: 7, useNativeDriver: true }).start();

  return (
    <Pressable disabled={disabled} onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
