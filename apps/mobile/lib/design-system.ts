import { StyleSheet } from 'react-native';

export const colors = {
  ink: '#171714',
  inkSoft: '#353530',
  paper: '#F7F7F5',
  surface: '#FFFFFF',
  surfaceWarm: '#EEEDE7',
  surfaceAccent: '#E9E7DF',
  text: '#20201D',
  textMuted: '#77766F',
  border: '#E6E5DE',
  successSurface: '#E7F0E8',
  successText: '#2D5436',
  dangerSurface: '#F7E9E7',
  dangerText: '#7B302A',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const radius = { sm: 12, md: 16, lg: 22, xl: 28, pill: 999 } as const;
export const typography = {
  eyebrow: { fontSize: 10, fontWeight: '800' as const, letterSpacing: 1.2 },
  caption: { fontSize: 12, lineHeight: 17 },
  body: { fontSize: 14, lineHeight: 21 },
  bodyStrong: { fontSize: 14, lineHeight: 21, fontWeight: '700' as const },
  title3: { fontSize: 17, lineHeight: 22, fontWeight: '800' as const },
  title2: { fontSize: 25, lineHeight: 31, fontWeight: '800' as const },
  title1: { fontSize: 30, lineHeight: 35, fontWeight: '800' as const },
} as const;
export const shadows = StyleSheet.create({
  soft: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  subtle: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
});
export const components = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  darkCard: { backgroundColor: colors.ink, borderRadius: radius.xl, padding: spacing.xxl },
  primaryButton: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  secondaryButton: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.surfaceWarm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  pill: { alignSelf: 'flex-start', borderRadius: radius.pill, backgroundColor: colors.inkSoft, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
});
