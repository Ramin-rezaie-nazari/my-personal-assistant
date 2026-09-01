import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CommandCenterPretty from './command-center-pretty';

function Sparkle({ style, size = 22, color = '#F5C75C' }: { style?: any; size?: number; color?: string }) {
  return <Text pointerEvents="none" style={[styles.spark, { fontSize: size, color }, style]}>✦</Text>;
}

function Flower({ style, size = 42, color = '#FF9DC6' }: { style?: any; size?: number; color?: string }) {
  return <View pointerEvents="none" style={[{ width: size, height: size }, style]}>
    {[0, 60, 120, 180, 240, 300].map(angle => (
      <View key={angle} style={[styles.petal, { backgroundColor: color, left: size * 0.4, top: size * 0.02, width: size * 0.2, height: size * 0.48, transform: [{ rotate: `${angle}deg` }] }]} />
    ))}
    <View style={[styles.center, { left: size * 0.38, top: size * 0.38, width: size * 0.24, height: size * 0.24 }]} />
  </View>;
}

export default function CommandCenterPolished() {
  return <View style={styles.root}>
    <CommandCenterPretty />
    <View pointerEvents="none" style={styles.overlay}>
      <View style={styles.glowPink} />
      <View style={styles.glowLilac} />
      <Sparkle style={styles.s1} size={20} />
      <Sparkle style={styles.s2} size={14} color="#FF70AD" />
      <Sparkle style={styles.s3} size={18} color="#CDB9F3" />
      <Flower style={styles.f1} size={48} />
      <Flower style={styles.f2} size={34} color="#CDB9F3" />
      <Ionicons name="heart" size={13} color="#FFB1CD" style={styles.heart} />
      <Ionicons name="heart" size={9} color="#D9C8F5" style={styles.heart2} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject },
  glowPink: { position: 'absolute', width: 210, height: 210, borderRadius: 130, backgroundColor: '#FFE8F1', top: -110, right: -90, opacity: 0.42 },
  glowLilac: { position: 'absolute', width: 180, height: 180, borderRadius: 110, backgroundColor: '#F0E8FC', bottom: 120, left: -100, opacity: 0.3 },
  spark: { position: 'absolute', fontWeight: '900' },
  s1: { top: 118, right: 44 },
  s2: { top: 192, right: 22 },
  s3: { top: 430, left: 20 },
  petal: { position: 'absolute', borderRadius: 99, opacity: 0.88 },
  center: { position: 'absolute', borderRadius: 99, backgroundColor: '#FFE8AC' },
  f1: { position: 'absolute', top: 86, left: 18 },
  f2: { position: 'absolute', top: 515, right: 8 },
  heart: { position: 'absolute', top: 265, right: 18 },
  heart2: { position: 'absolute', top: 300, right: 48 },
});
