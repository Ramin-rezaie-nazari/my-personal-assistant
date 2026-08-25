import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { PREMIUM } from '../lib/premium-ui';

export function AssistantDock({ onPress, accessibilityLabel = 'Open MYPA assistant' }: { onPress: () => void; accessibilityLabel?: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.05, duration: 1500, easing: PREMIUM.motion.ease, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.98, duration: 1500, easing: PREMIUM.motion.ease, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return <Animated.View style={{ transform: [{ scale: pulse }] }}><Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [styles.dock, pressed && styles.pressed]}><Text style={styles.mark}>M</Text><Text style={styles.dot}>•</Text></Pressable></Animated.View>;
}

const styles = StyleSheet.create({
  dock: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(17,23,38,0.96)', borderWidth: 1, borderColor: PREMIUM.colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: PREMIUM.colors.primary, shadowOpacity: 0.34, shadowRadius: 20, shadowOffset: { width: 0, height: 9 }, elevation: 10 },
  mark: { color: PREMIUM.colors.primaryBright, fontSize: 19, fontWeight: '900' },
  dot: { position: 'absolute', right: 14, bottom: 11, color: PREMIUM.colors.mint, fontSize: 16, lineHeight: 12 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
});
