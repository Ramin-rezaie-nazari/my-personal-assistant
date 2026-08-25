import React from 'react';
import { Animated, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useEntrance, usePressScale } from './motion';
import { useReducedMotion } from './use-reduced-motion';

type MotionPressProps = React.PropsWithChildren<{
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityRole?: React.ComponentProps<typeof Pressable>['accessibilityRole'];
  accessibilityLabel?: React.ComponentProps<typeof Pressable>['accessibilityLabel'];
  accessibilityHint?: React.ComponentProps<typeof Pressable>['accessibilityHint'];
  accessibilityState?: React.ComponentProps<typeof Pressable>['accessibilityState'];
  testID?: string;
}>;

export function AnimatedIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const entrance = useEntrance(delay);
  return <Animated.View style={[reduced ? undefined : entrance, style]}>{children}</Animated.View>;
}

export function MotionPress({
  children,
  onPress,
  onPressIn,
  onPressOut,
  style,
  disabled,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  testID,
}: MotionPressProps) {
  const reduced = useReducedMotion();
  const motion = usePressScale();

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        motion.onPressIn();
        onPressIn?.();
      }}
      onPressOut={() => {
        motion.onPressOut();
        onPressOut?.();
      }}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      testID={testID}
    >
      <Animated.View style={[style, reduced ? undefined : { transform: [{ scale: motion.scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
