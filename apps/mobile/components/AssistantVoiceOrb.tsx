import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export type VoiceInteractionState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'done';

type Props = {
  state: VoiceInteractionState;
  label: string;
  onPress?: () => void;
};

export function AssistantVoiceOrb({ state, label, onPress }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.18)).current;

  useEffect(() => {
    const active = state === 'listening' || state === 'thinking' || state === 'speaking';
    if (!active) {
      pulse.stopAnimation();
      glow.stopAnimation();
      Animated.parallel([
        Animated.spring(pulse, { toValue: state === 'done' ? 1.04 : 1, useNativeDriver: true, friction: 8 }),
        Animated.timing(glow, { toValue: state === 'done' ? 0.3 : 0.18, duration: 220, useNativeDriver: true }),
      ]).start();
      return;
    }

    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.13, duration: 900, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.98, duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(glow, { toValue: 0.48, duration: 900, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.18, duration: 900, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [glow, pulse, state]);

  const icon = state === 'listening' ? '◉' : state === 'thinking' ? '✦' : state === 'speaking' ? '◌' : state === 'done' ? '✓' : '⌕';

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.glow, { opacity: glow, transform: [{ scale: pulse }] }]} />
      <Animated.View style={[styles.orb, { transform: [{ scale: pulse }] }]}>
        <Text style={styles.icon}>{icon}</Text>
      </Animated.View>
      <Text style={styles.label}>{label}</Text>
      {onPress ? <Text style={styles.tapHint}>برای شروع یا توقف لمس کن</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  glow: { position: 'absolute', width: 148, height: 148, borderRadius: 74, backgroundColor: '#8B5CF6' },
  orb: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: '#17112E', borderWidth: 2, borderColor: '#A78BFA', shadowColor: '#8B5CF6', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  icon: { color: '#FFFFFF', fontSize: 34, fontWeight: '900' },
  label: { marginTop: 10, color: '#111827', fontSize: 13, fontWeight: '900' },
  tapHint: { marginTop: 4, color: '#9CA3AF', fontSize: 10 },
});
