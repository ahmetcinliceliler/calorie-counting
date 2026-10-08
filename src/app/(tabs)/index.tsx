import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Card, ProgressBar, Screen } from '@/components/ui';
import { deriveGoals, useProfileStore } from '@/features/profile/store';
import { colors, spacing } from '@/theme';

// Aşama 0 iskeleti: kayıtlar Aşama 2'de SQLite'tan gelecek.
const EMPTY_DAY = { calories: 0, protein: 0, carbs: 0, fat: 0, burned: 0 };

export default function TodayScreen() {
  const { t } = useTranslation();
  const profile = useProfileStore((s) => s.profile);
  if (!profile) return null;

  const goals = deriveGoals(profile);
  const day = EMPTY_DAY;
  const target = goals.calories + day.burned;
  const remaining = target - day.calories;

  const macros = [
    { key: 'protein', label: t('today.protein'), value: day.protein, goal: goals.macros.protein, color: colors.protein },
    { key: 'carbs', label: t('today.carbs'), value: day.carbs, goal: goals.macros.carbs, color: colors.carbs },
    { key: 'fat', label: t('today.fat'), value: day.fat, goal: goals.macros.fat, color: colors.fat },
  ] as const;

  return (
    <Screen>
      <AppText variant="title">{t('common.today')}</AppText>

      <Card style={styles.hero}>
        <View style={{ flex: 1 }}>
          <AppText variant="caption" color={colors.textSecondary}>
            {t('today.remaining')}
          </AppText>
          <AppText variant="hero" color={remaining < 0 ? colors.danger : colors.text}>
            {remaining}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {t('today.goal', { value: target })}
          </AppText>
        </View>
        <View style={styles.heroStats}>
          <Stat label={t('today.eaten')} value={day.calories} />
          <Stat label={t('today.burned')} value={day.burned} color={colors.danger} />
        </View>
      </Card>

      <Card style={{ gap: spacing.md }}>
        {macros.map((m) => (
          <View key={m.key} style={{ gap: spacing.xs }}>
            <View style={styles.macroRow}>
              <AppText variant="caption" color={m.color}>
                {m.label}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {m.value} / {m.goal} {t('common.g')}
              </AppText>
            </View>
            <ProgressBar value={m.value / (m.goal || 1)} color={m.color} />
          </View>
        ))}
      </Card>

      <AppText variant="heading">{t('today.meals')}</AppText>
      <Card>
        <AppText color={colors.textSecondary}>{t('today.empty')}</AppText>
      </Card>
    </Screen>
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

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center' },
  heroStats: { gap: spacing.sm },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
