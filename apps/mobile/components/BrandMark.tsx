import { Image, StyleSheet, View } from 'react-native';

export function BrandMark({ size = 64 }: { size?: number }) {
  const radius = Math.round(size * 0.27);
  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius: radius }]}>
      <Image
        source={require('../assets/branding/logo-mark.svg')}
        accessibilityLabel="My Personal Assistant"
        style={{ width: size, height: size, borderRadius: radius }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden' },
});
