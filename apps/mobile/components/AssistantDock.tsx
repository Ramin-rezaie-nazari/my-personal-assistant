import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { PREMIUM } from '../lib/premium-ui';
import { BrandMark } from './BrandMark';

export function AssistantDock({ accessibilityLabel = 'Open MYPA assistant' }: { accessibilityLabel?: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.04, duration: 1700, easing: PREMIUM.motion.ease, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.985, duration: 1700, easing: PREMIUM.motion.ease, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={[styles.shell, { transform: [{ scale: pulse }] }]}>
      <View style={styles.dock}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open daily view" onPress={() => router.push('/daily')} style={styles.item}><Ionicons name="today-outline" size={18} color={PREMIUM.colors.inkSoft} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Open reminders" onPress={() => router.push('/reminders')} style={styles.item}><Ionicons name="notifications-outline" size={18} color={PREMIUM.colors.inkSoft} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={() => router.push('/assistant')} style={styles.core}><BrandMark size={46} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Open calendar" onPress={() => router.push('/calendar')} style={styles.item}><Ionicons name="calendar-outline" size={18} color={PREMIUM.colors.inkSoft} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Open brain overview" onPress={() => router.push('/brain-overview')} style={styles.item}><Ionicons name="sparkles-outline" size={18} color={PREMIUM.colors.inkSoft} /></Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: { position: 'absolute', left: 18, right: 18, bottom: 18, alignItems: 'center' },
  dock: { width: '100%', maxWidth: 350, height: 64, paddingHorizontal: 8, borderRadius: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(11,16,32,0.95)', borderWidth: 1, borderColor: PREMIUM.colors.border, shadowColor: PREMIUM.shadow.color, shadowOpacity: 0.44, shadowRadius: 24, shadowOffset: PREMIUM.shadow.offset, elevation: 14 },
  item: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  core: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: PREMIUM.colors.surfaceElevated, borderWidth: 1, borderColor: 'rgba(184,172,255,0.46)', shadowColor: PREMIUM.colors.primary, shadowOpacity: 0.26, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
});
