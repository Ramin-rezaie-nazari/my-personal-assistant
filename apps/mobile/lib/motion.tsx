import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export const motion = {
  fast: 180,
  normal: 280,
  slow: 420,
  spring: { tension: 90, friction: 11 },
} as const;

export function pressIn(scale: Animated.Value, scaleTo = 0.97) {
  Animated.spring(scale, {
    toValue: scaleTo,
    ...motion.spring,
    useNativeDriver: true,
  }).start();
}

export function pressOut(scale: Animated.Value) {
  Animated.spring(scale, {
    toValue: 1,
    ...motion.spring,
    useNativeDriver: true,
  }).start();
}

export function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

export function useEntrance(delay = 0, distance = 18) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion !== false) {
      opacity.stopAnimation();
      translateY.stopAnimation();
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }

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
  }, [delay, distance, opacity, reduceMotion, translateY]);

  return { opacity, transform: [{ translateY }] };
}

export function usePulse(active = true, amount = 1.035) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (!active || reduceMotion !== false) {
      scale.stopAnimation();
      scale.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: amount,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [active, amount, reduceMotion, scale]);

  return { transform: [{ scale }] };
}

export function usePressScale(scaleTo = 0.97) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReduceMotion();
  const onPressIn = () => {
    if (reduceMotion !== false) return;
    pressIn(scale, scaleTo);
  };
  const onPressOut = () => {
    if (reduceMotion !== false) return;
    pressOut(scale);
  };

  useEffect(() => {
    if (reduceMotion !== false) {
      scale.stopAnimation();
      scale.setValue(1);
    }
  }, [reduceMotion, scale]);

  return { scale, onPressIn, onPressOut };
}

export function useSuccessPop(active: boolean) {
  const scale = useRef(new Animated.Value(active ? 0.86 : 1)).current;
  const opacity = useRef(new Animated.Value(active ? 0 : 1)).current;
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (!active) {
      scale.stopAnimation();
      opacity.stopAnimation();
      scale.setValue(1);
      opacity.setValue(1);
      return;
    }

    if (reduceMotion !== false) {
      scale.stopAnimation();
      opacity.stopAnimation();
      scale.setValue(1);
      opacity.setValue(1);
      return;
    }

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 75,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: motion.fast,
        useNativeDriver: true,
      }),
    ]).start();
  }, [active, opacity, reduceMotion, scale]);

  return { opacity, transform: [{ scale }] };
}

type AnimatedPressableProps = Omit<PressableProps, 'children' | 'style'> & {
  children: React.ReactNode;
  style?:
    | StyleProp<ViewStyle>
    | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
  scaleTo?: number;
};

export function AnimatedSection({
  children,
  delay = 0,
  distance = 18,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const animatedStyle = useEntrance(delay, distance);
  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

export function AnimatedPressable({
  children,
  style,
  scaleTo = 0.97,
  ...props
}: AnimatedPressableProps) {
  const { scale, onPressIn, onPressOut } = usePressScale(scaleTo);
  return (
    <Pressable
      {...props}
      onPressIn={(event) => {
        onPressIn();
        props.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        onPressOut();
        props.onPressOut?.(event);
      }}
    >
      {(state) => {
        const resolvedStyle = typeof style === 'function' ? style(state) : style;
        return (
          <Animated.View style={[resolvedStyle, { transform: [{ scale }] }]}>
            {children}
          </Animated.View>
        );
      }}
    </Pressable>
  );
}
