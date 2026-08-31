import { useEffect, useRef } from 'react';
import { Animated, I18nManager, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { PREMIUM } from '../lib/premium-ui';
import { BrandMark } from './BrandMark';
import { useReducedMotion } from '../lib/use-reduced-motion';

export function AssistantDock({ onPress, accessibilityLabel }: { onPress?: () => void; accessibilityLabel?: string }) {
  const reduced = useReducedMotion();
  const pulse = useRef(new Animated.Value(1)).current;
  const rtl = I18nManager.isRTL;
  const labels = rtl
    ? { today: 'باز کردن امروز', assistant: 'باز کردن دستیار MYPA', settings: 'باز کردن تنظیمات' }
    : { today: 'Open today', assistant: 'Open MYPA assistant', settings: 'Open settings' };

  useEffect(() => {
    pulse.stopAnimation();
    if (reduced) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.025, duration: 1900, easing: PREMIUM.motion.ease, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.995, duration: 1900, easing: PREMIUM.motion.ease, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse, reduced]);

  const openAssistant = onPress ?? (() => router.push('/assistant'));

  return (
    <Animated.View style={[styles.shell, { transform: [{ scale: pulse }] }]}>
      <View style={[styles.dock, rtl && styles.rtlRow]}>
        <Pressable accessibilityRole="button" accessibilityLabel={labels.today} onPress={() => router.push('/daily')} style={({ pressed }) => [styles.sideItem, pressed && styles.pressed]}>
          <Ionicons name="today-outline" size={20} color={PREMIUM.colors.berry} />
          <View style={[styles.activeLine, { backgroundColor: PREMIUM.colors.cyan }]} />
        </Pressable>

        <View style={styles.centerSlot}>
          <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? labels.assistant} onPress={openAssistant} style={({ pressed }) => [styles.coreOuter, pressed && styles.corePressed]}>
            <View style={styles.coreGlow} />
            <View style={styles.coreInner}><BrandMark size={48} /></View>
          </Pressable>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel={labels.settings} onPress={() => router.push('/settings')} style={({ pressed }) => [styles.sideItem, pressed && styles.pressed]}>
          <Ionicons name="options-outline" size={20} color={PREMIUM.colors.berry} />
          <View style={[styles.activeLine, { backgroundColor: PREMIUM.colors.lilac }]} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: { position: 'absolute', left: 18, right: 18, bottom: 18, alignItems: 'center' },
  dock: {
    width: '100%',
    maxWidth: 292,
    height: 74,
    paddingHorizontal: 10,
    borderRadius: 37,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: PREMIUM.colors.border,
    shadowColor: PREMIUM.shadow.color,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  rtlRow: { flexDirection: 'row-reverse' },
  sideItem: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,240,247,0.72)' },
  centerSlot: { width: 88, height: 74, alignItems: 'center', justifyContent: 'center' },
  coreOuter: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF1F7', borderWidth: 1.5, borderColor: 'rgba(217,79,138,0.30)', shadowColor: PREMIUM.colors.primary, shadowOpacity: 0.24, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  coreGlow: { position: 'absolute', width: 56, height: 56, borderRadius: 28, backgroundColor: PREMIUM.colors.primary, opacity: 0.11 },
  coreInner: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: PREMIUM.colors.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.95)' },
  activeLine: { position: 'absolute', bottom: 1, width: 5, height: 5, borderRadius: 3, opacity: 0.8 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.94 }] },
  corePressed: { transform: [{ scale: 0.94 }] },
});
