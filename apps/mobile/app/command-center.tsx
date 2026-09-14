import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import CommandCenter from './command-center-v2';

export default function CommandCenterEntry() {
  return (
    <View style={styles.root}>
      <CommandCenter />
      <Pressable accessibilityRole="button" accessibilityLabel="Open fitness exercise library" onPress={() => router.push('/fitness-exercises')} style={({ pressed }) => [styles.fitnessButton, pressed && styles.pressed]}>
        <Text style={styles.icon}>🏋️</Text>
        <Text style={styles.label}>Exercises</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fitnessButton: { position: 'absolute', left: 18, bottom: 24, minHeight: 48, paddingHorizontal: 15, borderRadius: 16, backgroundColor: '#111827', flexDirection: 'row', alignItems: 'center', gap: 8, elevation: 7, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  icon: { fontSize: 20 },
  label: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.97 }] },
});
