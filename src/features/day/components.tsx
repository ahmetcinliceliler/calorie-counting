import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, IconButton, ProgressBar } from '@/components/ui';
import type { ExerciseEntry } from '@/db/activity';
import type { DayTotals, FoodEntry, MealType } from '@/features/food/types';
import type { Goals } from '@/features/profile/store';
import { formatDisplayDate, localDateKey } from '@/lib/date';
import { confirm } from '@/lib/dialog';
import { colors, radius, spacing } from '@/theme';
import { useDayMutations } from './hooks';
import { useDayStore } from './store';

export const WATER_GOAL_ML = 2000;
export const WATER_STEP_ML = 250;

export function DayHeader() {
  const { t } = useTranslation();
  const day = useDayStore((s) => s.day);
  const shift = useDayStore((s) => s.shift);
  const setDay = useDayStore((s) => s.setDay);
  const isToday = day === localDateKey();
  const label = formatDisplayDate(day);

  return (
    <View style={styles.header}>
      <IconButton icon="chevron-back" label={t('today.previousDay')} color={colors.accent} onPress={() => shift(-1)} />
      <Pressable accessibilityRole="button" onPress={() => setDay(localDateKey())} style={styles.datePill}>
        <AppText variant="heading">{label === 'today' || label === 'yesterday' ? t(`common.${label}`) : label}</AppText>
      </Pressable>
      <IconButton
        icon="chevron-forward"
        label={t('today.nextDay')}
        color={isToday ? colors.surfaceRaised : colors.accent}
        disabled={isToday}
        onPress={() => shift(1)}
      />
    </View>
  );
}

export function CalorieHero({ goals, totals, burned }: { goals: Goals; totals: DayTotals; burned: number }) {
  const { t } = useTranslation();
  const target = goals.calories + burned;
  const remaining = target - totals.kcal;
  const over = remaining < 0;

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={styles.heroRow}>
        <View style={{ flex: 1 }}>
          <AppText variant="caption" color={colors.textSecondary}>
            {over ? t('today.over') : t('today.remaining')}
          </AppText>
          <AppText variant="hero" color={over ? colors.danger : colors.text}>
            {Math.abs(remaining)}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {t('today.goal', { value: target })}
          </AppText>
        </View>
        <View style={{ gap: spacing.sm, alignItems: 'flex-end' }}>
          <Stat label={t('today.eaten')} value={totals.kcal} />
          <Stat label={t('today.burned')} value={burned} color={colors.danger} />
        </View>
      </View>
      <ProgressBar value={totals.kcal / (target || 1)} color={over ? colors.danger : colors.accent} />
    </Card>
  );
}

function Stat({ label, value, color = colors.text }: { label: string; value: number; color?: string }) {
  return (
    <View style={{ alignItems: 'flex-end' }}>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="heading" color={color}>
        {value}
      </AppText>
    </View>
  );
}

export function MacroCard({ goals, totals }: { goals: Goals; totals: DayTotals }) {
  const { t } = useTranslation();
  const macros = [
    { key: 'protein', value: totals.protein, goal: goals.macros.protein, color: colors.protein },
    { key: 'carbs', value: totals.carbs, goal: goals.macros.carbs, color: colors.carbs },
    { key: 'fat', value: totals.fat, goal: goals.macros.fat, color: colors.fat },
  ] as const;

  return (
    <Card style={styles.macroCard}>
      {macros.map((m) => (
        <View key={m.key} style={{ flex: 1, gap: spacing.xs }}>
          <AppText variant="caption" color={m.color}>
            {t(`today.${m.key}`)}
          </AppText>
          <AppText variant="body">
            {Math.round(m.value)}
            <AppText variant="caption" color={colors.textSecondary}>
              {' '}
              / {m.goal} {t('common.g')}
            </AppText>
          </AppText>
          <ProgressBar value={m.value / (m.goal || 1)} color={m.color} />
        </View>
      ))}
    </Card>
  );
}

export function WaterCard({ day, ml }: { day: string; ml: number }) {
  const { t } = useTranslation();
  const { changeWater } = useDayMutations();
  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={styles.rowBetween}>
        <View style={styles.rowCenter}>
          <Ionicons name="water" size={18} color={colors.water} />
          <AppText variant="heading">{t('today.water')}</AppText>
        </View>
        <View style={styles.rowCenter}>
          <IconButton
            icon="remove-circle-outline"
            label={t('today.removeWater')}
            color={colors.textSecondary}
            disabled={ml === 0}
            onPress={() => changeWater.mutate({ day, deltaMl: -WATER_STEP_ML })}
          />
          <AppText color={colors.textSecondary}>{t('today.waterGoal', { value: ml, goal: WATER_GOAL_ML })}</AppText>
          <IconButton
            icon="add-circle"
            label={t('today.addWater')}
            color={colors.water}
            onPress={() => changeWater.mutate({ day, deltaMl: WATER_STEP_ML })}
          />
        </View>
      </View>
      <ProgressBar value={ml / WATER_GOAL_ML} color={colors.water} />
    </Card>
  );
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function MealSection({ meal, entries }: { meal: MealType; entries: FoodEntry[] }) {
  const { t } = useTranslation();
  const { removeFood } = useDayMutations();
  const kcal = entries.reduce((s, e) => s + e.kcal, 0);

  const onDelete = async (entry: FoodEntry) => {
    if (await confirm(entry.name, t('today.deleteEntry'), t('common.delete'), t('common.cancel'))) {
      removeFood.mutate(entry);
    }
  };

  return (
    <Card style={{ gap: spacing.xs }}>
      <View style={styles.rowBetween}>
        <AppText variant="heading">{t(`meal.${meal}`)}</AppText>
        <View style={styles.rowCenter}>
          {kcal > 0 && <AppText color={colors.textSecondary}>{Math.round(kcal)} {t('common.kcal')}</AppText>}
          <IconButton
            icon="add-circle"
            label={t('today.addTo', { meal: t(`meal.${meal}`) })}
            color={colors.accent}
            onPress={() => router.push({ pathname: '/add-food', params: { meal } })}
          />
        </View>
      </View>
      {entries.length === 0 ? (
        <AppText variant="caption" color={colors.textMuted}>
          {t('today.emptyMeal')}
        </AppText>
      ) : (
        entries.map((e) => (
          <View key={e.id} style={styles.entryRow}>
            <View style={{ flex: 1 }}>
              <AppText numberOfLines={1}>{e.name}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {e.portionLabel ?? `${fmt(e.grams)} ${t('common.g')}`} · P {fmt(e.protein)} · K {fmt(e.carbs)} · Y {fmt(e.fat)}
              </AppText>
            </View>
            <AppText>{e.kcal}</AppText>
            <IconButton icon="close" size={18} label={`${t('common.delete')}: ${e.name}`} color={colors.textMuted} onPress={() => onDelete(e)} />
          </View>
        ))
      )}
    </Card>
  );
}

export function ExerciseSection({ day, exercises }: { day: string; exercises: ExerciseEntry[] }) {
  const { t } = useTranslation();
  const { removeExercise } = useDayMutations();
  if (exercises.length === 0) return null;

  return (
    <Card style={{ gap: spacing.xs }}>
      <AppText variant="heading">{t('today.exercise')}</AppText>
      {exercises.map((e) => (
        <View key={e.id} style={styles.entryRow}>
          <View style={{ flex: 1 }}>
            <AppText>{t(`exercise.types.${e.exerciseType}`, { defaultValue: e.exerciseType })}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {e.durationMin} {t('common.min')}
            </AppText>
          </View>
          <AppText color={colors.danger}>-{e.kcal}</AppText>
          <IconButton
            icon="close"
            size={18}
            label={t('common.delete')}
            color={colors.textMuted}
            onPress={async () => {
              const label = t(`exercise.types.${e.exerciseType}`, { defaultValue: e.exerciseType });
              if (await confirm(label, t('today.deleteEntry'), t('common.delete'), t('common.cancel'))) {
                removeExercise.mutate({ id: e.id, day });
              }
            }}
          />
        </View>
      ))}
    </Card>
  );
}

type ActionIcon = keyof typeof Ionicons.glyphMap;

export function QuickActions() {
  const { t } = useTranslation();
  const actions: { icon: ActionIcon; label: string; href: '/add-food' | '/photo' | '/barcode' | '/exercise' | '/chef' }[] = [
    { icon: 'search', label: t('today.actions.search'), href: '/add-food' },
    { icon: 'camera', label: t('today.actions.photo'), href: '/photo' },
    { icon: 'barcode-outline', label: t('today.actions.barcode'), href: '/barcode' },
    { icon: 'barbell-outline', label: t('today.actions.exercise'), href: '/exercise' },
    { icon: 'restaurant-outline', label: t('today.actions.chef'), href: '/chef' },
  ];
  return (
    <View style={styles.actions}>
      {actions.map((a) => (
        <Pressable
          key={a.href}
          accessibilityRole="button"
          accessibilityLabel={a.label}
          onPress={() => router.push(a.href)}
          style={({ pressed }) => [styles.action, pressed && { opacity: 0.6 }]}>
          <View style={styles.actionIcon}>
            <Ionicons name={a.icon} size={22} color={colors.onAccent} />
          </View>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {a.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  datePill: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    minHeight: 40,
    justifyContent: 'center',
  },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  macroCard: { flexDirection: 'row', gap: spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  action: { alignItems: 'center', gap: spacing.xs, flex: 1 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
