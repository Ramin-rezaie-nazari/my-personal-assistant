import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { PREMIUM } from '../lib/premium-ui';
import { BrandMark } from './BrandMark';

export function AssistantDock({ onPress, accessibilityLabel = 'Open MYPA assistant' }: { onPress?: () => void; accessibilityLabel?: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.035, duration: 1900, easing: PREMIUM.motion.ease, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.992, duration: 1900, easing: PREMIUM.motion.ease, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const openAssistant = onPress ?? (() => router.push('/assistant'));

  return (
    <Animated.View style={[styles.shell, { transform: [{ scale: pulse }] }]}>
      <View style={styles.dock}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open today" onPress={() => router.push('/daily')} style={({ pressed }) => [styles.sideItem, pressed && styles.pressed]}>
          <Ionicons name="today-outline" size={19} color={PREMIUM.colors.inkSoft} />
          <View style={styles.activeLine} />
        </Pressable>

        <View style={styles.centerSlot}>
          <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={openAssistant} style={({ pressed }) => [styles.coreOuter, pressed && styles.corePressed]}>
            <View style={styles.coreGlow} />
            <View style={styles.coreInner}><BrandMark size={48} /></View>
          </Pressable>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Open settings" onPress={() => router.push('/settings')} style={({ pressed }) => [styles.sideItem, pressed && styles.pressed]}>
          <Ionicons name="options-outline" size={19} color={PREMIUM.colors.inkSoft} />
          <View style={styles.activeLine} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: { position: 'absolute', left: 18, right: 18, bottom: 18, alignItems: 'center' },
  dock: {
    width: '100%',
    maxWidth: 280,
    height: 72,
    paddingHorizontal: 10,
    borderRadius: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(9,13,27,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(184,172,255,0.16)',
    shadowColor: PREMIUM.shadow.color,
    shadowOpacity: 0.44,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 16,
  },
  sideItem: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  centerSlot: { width: 86, height: 72, alignItems: 'center', justifyContent: 'center' },
  coreOuter: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(184,172,255,0.08)', borderWidth: 1, borderColor: 'rgba(184,172,255,0.38)', shadowColor: PREMIUM.colors.primary, shadowOpacity: 0.32, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  coreGlow: { position: 'absolute', width: 52, height: 52, borderRadius: 26, backgroundColor: PREMIUM.colors.primary, opacity: 0.16 },
  coreInner: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: PREMIUM.colors.surfaceElevated, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  activeLine: { position: 'absolute', bottom: 2, width: 4, height: 4, borderRadius: 2, backgroundColor: PREMIUM.colors.primaryBright, opacity: 0.42 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.94 }] },
  corePressed: { transform: [{ scale: 0.94 }] },
});
