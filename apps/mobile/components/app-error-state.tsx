import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND } from '../lib/branding';

export function AppErrorState({
  title,
  message,
  retryLabel,
  onRetry,
}: {
  title: string;
  message?: string;
  retryLabel: string;
  onRetry?: () => void;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container} accessibilityRole="alert">
        <View style={styles.icon} accessible accessibilityLabel="Error">
          <Text style={styles.iconText}>!</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {onRetry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={retryLabel}
            onPress={onRetry}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <Text style={styles.buttonText}>{retryLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND.colors.canvas },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.colors.primarySoft, marginBottom: 18 },
  iconText: { color: BRAND.colors.primaryStrong, fontSize: 28, fontWeight: '800' },
  title: { color: BRAND.colors.ink, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  message: { marginTop: 10, maxWidth: 320, color: BRAND.colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  button: { marginTop: 20, minHeight: 48, paddingHorizontal: 22, borderRadius: BRAND.radius.control, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.colors.primaryStrong },
  buttonText: { color: BRAND.colors.white, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.84, transform: [{ scale: 0.98 }] },
});
