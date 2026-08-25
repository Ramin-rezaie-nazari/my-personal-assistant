import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { PREMIUM } from '../lib/premium-ui';

export function PremiumSurface({ children, onPress, accent }: PropsWithChildren<{ onPress?: () => void; accent?: 'primary' | 'cyan' | 'mint' | 'amber' | 'rose' }>) {
  const style = [styles.surface, accent ? { borderColor: `${PREMIUM.colors[accent]}33` } : null];
  if (onPress) return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [style, pressed && styles.pressed]}>{children}</Pressable>;
  return <View style={style}>{children}</View>;
}

const styles = StyleSheet.create({
  surface: { borderRadius: PREMIUM.radius.lg, backgroundColor: PREMIUM.colors.surfaceGlass, borderWidth: 1, borderColor: PREMIUM.colors.border, padding: PREMIUM.spacing.lg },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
