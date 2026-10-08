// Uygulama tek tema (koyu) ile çalışır; marka rengi neon yeşil.
export const colors = {
  background: '#121212',
  surface: '#1C1C1E',
  surfaceRaised: '#2C2C2E',
  border: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#636366',
  accent: '#CCFF00',
  onAccent: '#000000',
  danger: '#FF453A',
  protein: '#32D74B',
  carbs: '#0A84FF',
  fat: '#FF9F0A',
  water: '#64D2FF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const typography = {
  hero: { fontSize: 42, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '700' },
  heading: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 16, fontWeight: '500' },
  caption: { fontSize: 12, fontWeight: '500' },
} as const;
