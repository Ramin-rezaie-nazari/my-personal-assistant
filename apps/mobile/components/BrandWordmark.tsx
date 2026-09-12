import { StyleSheet, Text, View } from 'react-native';
import { BRAND, BRAND_NAME, BRAND_TAGLINE } from '../lib/branding';
import { useAppTheme } from '../lib/app-theme';
import { BrandMark } from './BrandMark';

type BrandWordmarkProps = {
  dark?: boolean;
  compact?: boolean;
  accessibilityLabel?: string;
};

export function BrandWordmark({ dark = false, compact = false, accessibilityLabel = BRAND_NAME }: BrandWordmarkProps) {
  const { theme } = useAppTheme();
  const nameColor = dark ? (theme.mode === 'female' ? theme.primaryStrong : BRAND.colors.white) : theme.text;
  const taglineColor = dark ? (theme.mode === 'female' ? theme.textSoft : BRAND.colors.startupMuted) : theme.textSoft;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={[styles.row, compact && styles.compactRow]}>
      <BrandMark size={compact ? 42 : 56} />
      <View style={styles.copy} accessible={false}>
        <Text style={[styles.name, compact && styles.nameCompact, { color: nameColor }]}>{BRAND_NAME}</Text>
        {!compact ? <Text style={[styles.tagline, { color: taglineColor }]}>{BRAND_TAGLINE}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  compactRow: { gap: 10 },
  copy: { flexShrink: 1 },
  name: { fontSize: 21, lineHeight: 26, fontWeight: '900' },
  nameCompact: { fontSize: 16, lineHeight: 20 },
  tagline: { marginTop: 3, fontSize: 12, lineHeight: 18 },
});
