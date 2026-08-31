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
      Animated.timing(pulse, { toValue: 1.032, duration: 1700, easing: PREMIUM.motion.ease, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.992, duration: 1700, easing: PREMIUM.motion.ease, useNativeDriver: true }),
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
  shell: { position: 'absolute', left: 12, right: 12, bottom: 14, alignItems: 'center' },
  dock: {
    width: '100%',
    maxWidth: 320,
    height: 78,
    paddingHorizontal: 12,
    borderRadius: 39,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,252,254,0.94)',
    borderWidth: 1,
    borderColor: PREMIUM.colors.border,
    shadowColor: PREMIUM.shadow.color,
    shadowOpacity: 0.22,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 16,
  },
  rtlRow: { flexDirection: 'row-reverse' },
  sideItem: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF1F7', borderWidth: 1, borderColor: '#F3D5E3' },
  centerSlot: { width: 92, height: 78, alignItems: 'center', justifyContent: 'center' },
  coreOuter: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFE4EF', borderWidth: 1.5, borderColor: `${PREMIUM.colors.primaryBright}66`, shadowColor: PREMIUM.colors.primary, shadowOpacity: 0.30, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  coreGlow: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: PREMIUM.colors.primaryBright, opacity: 0.16 },
  coreInner: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: PREMIUM.colors.white, borderWidth: 1, borderColor: '#FFF9FC' },
  activeLine: { position: 'absolute', bottom: 1, width: 5, height: 5, borderRadius: 3, opacity: 0.9 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.94 }] },
  corePressed: { transform: [{ scale: 0.94 }] },
});
