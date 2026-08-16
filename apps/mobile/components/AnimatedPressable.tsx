import React from 'react';
import {
  type PressableProps,
  type PressableStateCallbackType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { AnimatedPressable as MotionPressable } from '../lib/motion';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
  scaleTo?: number;
};

export function AnimatedPressable({ children, style, scaleTo = 0.97, ...props }: Props) {
  return (
    <MotionPressable {...props} scaleTo={scaleTo} style={style}>
      {children}
    </MotionPressable>
  );
}
