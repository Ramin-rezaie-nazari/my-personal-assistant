import { StyleSheet, Text, View } from 'react-native';
import { BRAND, BRAND_NAME, BRAND_TAGLINE } from '../lib/branding';
import { BrandMark } from './BrandMark';

export function BrandWordmark({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <View style={[styles.row, compact && styles.compactRow]}>
      <BrandMark size={compact ? 42 : 56} dark={dark} />
      <View style={styles.copy}>
        <Text style={[styles.name, dark && styles.nameDark, compact && styles.nameCompact]}>{BRAND_NAME}</Text>
        {!compact ? <Text style={[styles.tagline, dark && styles.taglineDark]}>{BRAND_TAGLINE}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  compactRow: { gap: 10 },
  copy: { flexShrink: 1 },
  name: { color: BRAND.colors.ink, fontSize: 21, lineHeight: 26, fontWeight: '900' },
  nameCompact: { fontSize: 16, lineHeight: 20 },
  nameDark: { color: BRAND.colors.white },
  tagline: { marginTop: 3, color: BRAND.colors.muted, fontSize: 12, lineHeight: 18 },
  taglineDark: { color: BRAND.colors.startupMuted },
});
