import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/theme';

type Variant = keyof typeof typography;

export function AppText({
  variant = 'body',
  color = colors.text,
  style,
  ...rest
}: TextProps & { variant?: Variant; color?: string }) {
  return <Text style={[typography[variant], { color }, style]} {...rest} />;
}

export function Screen({
  children,
  scroll = true,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.screenContent, contentStyle]}>{children}</ScrollView>
      ) : (
        <View style={[styles.screenContent, { flex: 1 }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title,
  variant = 'primary',
  style,
  disabled,
  ...rest
}: PressableProps & { title: string; variant?: 'primary' | 'secondary'; style?: StyleProp<ViewStyle> }) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonSecondary,
        (pressed || disabled) && { opacity: 0.6 },
        style,
      ]}
      {...rest}>
      <AppText variant="heading" color={primary ? colors.onAccent : colors.text}>
        {title}
      </AppText>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  style,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected, style]}>
      <AppText variant="body" color={selected ? colors.onAccent : colors.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function Field({ label, ...rest }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        {...rest}
      />
    </View>
  );
}

type IconName = keyof typeof Ionicons.glyphMap;

export function IconButton({
  icon,
  label,
  onPress,
  color = colors.text,
  size = 22,
  disabled,
  style,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, (pressed || disabled) && { opacity: 0.4 }, style]}>
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <AppText color={colors.textSecondary} style={{ textAlign: 'center', paddingVertical: spacing.lg }}>
      {text}
    </AppText>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg }}>
      <ActivityIndicator color={colors.accent} />
      {label && <AppText color={colors.textSecondary}>{label}</AppText>}
    </View>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <AppText accessibilityRole="alert" color={colors.danger}>
      {children}
    </AppText>
  );
}

/** Dokunulabilir liste satırı: başlık, alt yazı, sağda değer ve isteğe bağlı aksiyon. */
export function ListRow({
  title,
  subtitle,
  value,
  onPress,
  right,
  accessibilityLabel,
}: {
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
  accessibilityLabel?: string;
}) {
  const content = (
    <>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText numberOfLines={2}>{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value ? <AppText color={colors.textSecondary}>{value}</AppText> : null}
    </>
  );
  if (!onPress) {
    return (
      <View style={styles.row}>
        {content}
        {right}
      </View>
    );
  }
  // `right` (ör. yıldız butonu) dokunulabilir alanın DIŞINDA: iç içe buton olmasın.
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        onPress={onPress}
        style={({ pressed }) => [styles.rowPressable, pressed && { opacity: 0.6 }]}>
        {content}
      </Pressable>
      {right}
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, selected && styles.segmentSelected]}>
            <AppText variant="caption" color={selected ? colors.onAccent : colors.textSecondary}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProgressBar({ value, color = colors.accent }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  screenContent: { padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonPrimary: { backgroundColor: colors.accent },
  buttonSecondary: { backgroundColor: colors.surfaceRaised },
  chip: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  input: {
    minHeight: 48,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingVertical: spacing.sm,
  },
  rowPressable: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'stretch' },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segment: { flex: 1, minHeight: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  segmentSelected: { backgroundColor: colors.accent },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});
