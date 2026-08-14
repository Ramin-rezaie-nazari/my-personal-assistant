import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { pressIn, pressOut } from '../lib/motion';

type Props = PressableProps & { children: React.ReactNode; style?: StyleProp<ViewStyle> };

export function AnimatedPressable({ children, style, onPressIn, onPressOut, ...props }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      {...props}
      onPressIn={(event) => {
        pressIn(scale);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressOut(scale);
        onPressOut?.(event);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
