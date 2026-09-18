import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import CommandCenter from './command-center-v2';
import { useAppLocale } from '../lib/i18n';
import { localizedCopy } from '../lib/localized-copy';

const copy = localizedCopy({
  en: { exercises: 'Exercises', programs: 'Programs' },
  fa: { exercises: 'تمرین‌ها', programs: 'برنامه‌ها' },
});

export default function CommandCenterEntry() {
  const { locale, rtl } = useAppLocale();
  const text = copy[locale];
  return (
    <View style={styles.root}>
      <CommandCenter />
      <View style={[styles.actions, rtl && styles.rtl]}>
        <Pressable accessibilityRole="button" accessibilityLabel={text.exercises} onPress={() => router.push('/fitness-exercises')} style={({ pressed }) => [styles.fitnessButton, pressed && styles.pressed]}>
          <Text style={styles.icon}>🏋️</Text><Text style={styles.label}>{text.exercises}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={text.programs} onPress={() => router.push('/fitness-programs')} style={({ pressed }) => [styles.fitnessButton, pressed && styles.pressed]}>
          <Text style={styles.icon}>📋</Text><Text style={styles.label}>{text.programs}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  actions: { position: 'absolute', left: 18, bottom: 24, gap: 8 },
  rtl: { flexDirection: 'row-reverse' },
  fitnessButton: { minHeight: 48, paddingHorizontal: 15, borderRadius: 16, backgroundColor: '#111827', flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 7, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  icon: { fontSize: 20 },
  label: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.97 }] },
});
