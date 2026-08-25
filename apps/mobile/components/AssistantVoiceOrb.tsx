import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { PREMIUM } from '../lib/premium-ui';

export type VoiceInteractionState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'done';

type Props = { state: VoiceInteractionState; label: string; onPress?: () => void };

const stateAccent = (state: VoiceInteractionState) => {
  if (state === 'listening') return PREMIUM.colors.cyan;
  if (state === 'thinking') return PREMIUM.colors.primaryBright;
  if (state === 'speaking') return PREMIUM.colors.mint;
  if (state === 'done') return PREMIUM.colors.amber;
  return PREMIUM.colors.primary;
};

export function AssistantVoiceOrb({ state, label, onPress }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;
  const ring = useRef(new Animated.Value(0.8)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pulse.stopAnimation();
    ring.stopAnimation();
    rotation.stopAnimation();
    const active = state !== 'idle';
    if (!active) {
      Animated.parallel([
        Animated.spring(pulse, { toValue: 1, useNativeDriver: true, friction: 8 }),
        Animated.timing(ring, { toValue: 0.78, duration: PREMIUM.motion.normal, useNativeDriver: true }),
      ]).start();
      return;
    }
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: state === 'thinking' ? 1.09 : 1.16, duration: 900, easing: PREMIUM.motion.ease, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.98, duration: 900, easing: PREMIUM.motion.ease, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ring, { toValue: 1.08, duration: 1100, easing: PREMIUM.motion.ease, useNativeDriver: true }),
          Animated.timing(ring, { toValue: 0.82, duration: 1100, easing: PREMIUM.motion.ease, useNativeDriver: true }),
        ]),
        Animated.timing(rotation, { toValue: 1, duration: 5200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, ring, rotation, state]);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const accent = stateAccent(state);
  const icon = state === 'listening' ? '◉' : state === 'thinking' ? '✦' : state === 'speaking' ? '◌' : state === 'done' ? '✓' : '⌁';

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.outerGlow, { backgroundColor: accent, opacity: state === 'idle' ? 0.14 : 0.28, transform: [{ scale: ring }] }]} />
      <Animated.View style={[styles.orbit, { borderColor: accent, transform: [{ rotate: spin }, { scale: ring }] }]} />
      <Animated.View style={[styles.core, { transform: [{ scale: pulse }], borderColor: accent }]}>
        <View style={[styles.coreInner, { shadowColor: accent }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
      </Animated.View>
      <Text style={styles.label}>{label}</Text>
      {onPress ? <Text style={styles.hint}>Tap to speak · MYPA is listening</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', minHeight: 190, paddingVertical: 10 },
  outerGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90 },
  orbit: { position: 'absolute', width: 136, height: 136, borderRadius: 68, borderWidth: 1, borderStyle: 'dashed', opacity: 0.65 },
  core: { width: 112, height: 112, borderRadius: 56, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(9,13,23,0.96)', shadowColor: '#000', shadowOpacity: 0.42, shadowRadius: 26, shadowOffset: { width: 0, height: 14 }, elevation: 12 },
  coreInner: { width: 94, height: 94, borderRadius: 47, alignItems: 'center', justifyContent: 'center', backgroundColor: '#121A2D', shadowOpacity: 0.34, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  icon: { color: PREMIUM.colors.white, fontSize: 38, fontWeight: '700' },
  label: { marginTop: 12, color: PREMIUM.colors.ink, fontSize: 14, fontWeight: '800' },
  hint: { marginTop: 5, color: PREMIUM.colors.muted, fontSize: 10, letterSpacing: 0.2 },
});
