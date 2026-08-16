import React from 'react';
import { type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { AnimatedPressable as MotionPressable, AnimatedSection as MotionSection } from '../lib/motion';

type SectionProps = {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
};

export function AnimatedSection({ children, delay = 0, distance = 18, style }: SectionProps) {
  return (
    <MotionSection delay={delay} distance={distance} style={style}>
      {children}
    </MotionSection>
  );
}

type AnimatedPressableProps = Omit<PressableProps, 'children' | 'style'> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AnimatedPressable({ children, style, ...props }: AnimatedPressableProps) {
  return (
    <MotionPressable {...props} style={style}>
      {children}
    </MotionPressable>
  );
}
