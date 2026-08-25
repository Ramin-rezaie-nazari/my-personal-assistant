import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PREMIUM } from '../lib/premium-ui';
import { useReducedMotion } from '../lib/use-reduced-motion';

export type VoiceInteractionState = 'idle' | 'listening' | 'thinking' | 'acting' | 'speaking' | 'done';
type Props = { state: VoiceInteractionState; label: string; hint?: string; onPress?: () => void };

const stateAccent = (state: VoiceInteractionState) => state === 'listening' ? PREMIUM.colors.cyan : state === 'thinking' ? PREMIUM.colors.primaryBright : state === 'acting' ? PREMIUM.colors.amber : state === 'speaking' ? PREMIUM.colors.mint : state === 'done' ? PREMIUM.colors.amber : PREMIUM.colors.primary;

export function AssistantVoiceOrb({ state, label, hint = '', onPress }: Props) {
  const reduced = useReducedMotion();
  const pulse = useRef(new Animated.Value(1)).current;
  const ring = useRef(new Animated.Value(0.8)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pulse.stopAnimation(); ring.stopAnimation(); rotation.stopAnimation();
    if (reduced || state === 'idle') {
      Animated.parallel([
        Animated.spring(pulse, { toValue: 1, useNativeDriver: true, friction: 8 }),
        Animated.timing(ring, { toValue: 0.8, duration: reduced ? 0 : PREMIUM.motion.normal, useNativeDriver: true }),
      ]).start();
      return;
    }
    const loop = Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(pulse, { toValue: state === 'thinking' ? 1.09 : state === 'acting' ? 1.12 : 1.16, duration: state === 'acting' ? 720 : 900, easing: PREMIUM.motion.ease, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.98, duration: 900, easing: PREMIUM.motion.ease, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(ring, { toValue: state === 'acting' ? 1.14 : 1.08, duration: state === 'acting' ? 760 : 1100, easing: PREMIUM.motion.ease, useNativeDriver: true }),
        Animated.timing(ring, { toValue: 0.82, duration: state === 'acting' ? 760 : 1100, easing: PREMIUM.motion.ease, useNativeDriver: true }),
      ]),
      Animated.timing(rotation, { toValue: 1, duration: state === 'acting' ? 3600 : 5200, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse, reduced, ring, rotation, state]);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const accent = stateAccent(state);
  const iconName = state === 'listening' ? 'mic' : state === 'thinking' ? 'sparkles' : state === 'acting' ? 'flash' : state === 'speaking' ? 'volume-high' : state === 'done' ? 'checkmark' : 'mic-outline';
  const accessibilityLabel = label || 'MYPA voice assistant';

  const core = <>
    <Animated.View style={[styles.outerGlow, { backgroundColor: accent, opacity: state === 'idle' ? 0.14 : 0.28, transform: [{ scale: ring }] }]} />
    <Animated.View style={[styles.orbit, { borderColor: accent, transform: [{ rotate: spin }, { scale: ring }] }]} />
    <Animated.View style={[styles.core, { transform: [{ scale: pulse }], borderColor: accent }]}>
      <View style={[styles.coreInner, { shadowColor: accent }]}><Ionicons name={iconName} size={36} color={PREMIUM.colors.white} /></View>
    </Animated.View>
  </>;

  return <View style={styles.wrap}>
    {onPress ? <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={styles.hitArea}>{core}</Pressable> : core}
    {label ? <Text style={styles.label}>{label}</Text> : null}
    {onPress && hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', minHeight: 190, paddingVertical: 10 },
  hitArea: { width: 196, height: 160, alignItems: 'center', justifyContent: 'center' },
  outerGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90 },
  orbit: { position: 'absolute', width: 136, height: 136, borderRadius: 68, borderWidth: 1, borderStyle: 'dashed', opacity: 0.65 },
  core: { width: 112, height: 112, borderRadius: 56, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(9,13,23,0.96)', shadowColor: '#000', shadowOpacity: 0.42, shadowRadius: 26, shadowOffset: { width: 0, height: 14 }, elevation: 12 },
  coreInner: { width: 94, height: 94, borderRadius: 47, alignItems: 'center', justifyContent: 'center', backgroundColor: '#121A2D', shadowOpacity: 0.34, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  label: { marginTop: 12, color: PREMIUM.colors.ink, fontSize: 14, fontWeight: '800' },
  hint: { marginTop: 5, color: PREMIUM.colors.muted, fontSize: 10, letterSpacing: 0.2 },
});
