import type { PropsWithChildren } from 'react';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PREMIUM } from '../lib/premium-ui';
import { useReducedMotion } from '../lib/use-reduced-motion';

export type PremiumResultAction = { label: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void };

export function PremiumResultCard({ title, eyebrow, value, detail, accent = 'primary', actions = [], children }: PropsWithChildren<{ title: string; eyebrow?: string; value?: string; detail?: string; accent?: 'primary' | 'cyan' | 'mint' | 'amber' | 'rose'; actions?: PremiumResultAction[] }>) {
  const reduced = useReducedMotion();
  const appear = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const translate = useRef(new Animated.Value(reduced ? 0 : 12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(appear, { toValue: 1, duration: reduced ? 0 : PREMIUM.motion.normal, useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: reduced ? 0 : PREMIUM.motion.normal, useNativeDriver: true }),
    ]).start();
  }, [appear, reduced, translate]);

  const tone = PREMIUM.colors[accent];
  return <Animated.View style={[styles.card, { borderColor: `${tone}38`, opacity: appear, transform: [{ translateY: translate }] }]}>
    <View style={styles.header}><View style={[styles.dot, { backgroundColor: tone }]} /><View style={styles.headerCopy}>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}<Text style={styles.title}>{title}</Text></View><Ionicons name="sparkles-outline" size={18} color={tone} /></View>
    {value ? <Text style={styles.value}>{value}</Text> : null}
    {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    {children}
    {actions.length ? <View style={styles.actions}>{actions.map((action) => <Pressable key={action.label} accessibilityRole="button" onPress={action.onPress} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Ionicons name={action.icon ?? 'arrow-forward'} size={15} color={PREMIUM.colors.inkSoft} /><Text style={styles.actionText}>{action.label}</Text></Pressable>)}</View> : null}
  </Animated.View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: PREMIUM.radius.lg, backgroundColor: PREMIUM.colors.surfaceGlass, borderWidth: 1, padding: PREMIUM.spacing.lg, shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 7 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 9 }, dot: { width: 8, height: 8, borderRadius: 4 }, headerCopy: { flex: 1 }, eyebrow: { color: PREMIUM.colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' }, title: { color: PREMIUM.colors.ink, fontSize: 14, fontWeight: '900', marginTop: 2 }, value: { color: PREMIUM.colors.ink, fontSize: 28, lineHeight: 34, fontWeight: '900', marginTop: 14 }, detail: { color: PREMIUM.colors.inkSoft, fontSize: 12, lineHeight: 18, marginTop: 6 }, actions: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' }, action: { minHeight: 40, paddingHorizontal: 12, borderRadius: PREMIUM.radius.pill, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: PREMIUM.colors.border, flexDirection: 'row', alignItems: 'center', gap: 7 }, actionText: { color: PREMIUM.colors.inkSoft, fontSize: 11, fontWeight: '800' }, pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
