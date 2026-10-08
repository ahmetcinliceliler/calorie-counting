import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Screen } from '@/components/ui';
import { deriveGoals, useProfileStore } from '@/features/profile/store';
import { colors, spacing } from '@/theme';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const profile = useProfileStore((s) => s.profile);
  const clear = useProfileStore((s) => s.clear);
  if (!profile) return null;

  const goals = deriveGoals(profile);

  return (
    <Screen>
      <AppText variant="title">{t('profile.title')}</AppText>

      <Card style={{ gap: spacing.sm }}>
        <Row label={t('onboarding.weight')} value={`${profile.weightKg}`} />
        {profile.targetWeightKg !== null && (
          <Row label={t('onboarding.targetWeight')} value={`${profile.targetWeightKg}`} />
        )}
        <Row label={t('onboarding.height')} value={`${profile.heightCm}`} />
        <Row label={t('onboarding.age')} value={`${profile.age}`} />
        <Row label={t('onboarding.activity')} value={t(`activity.${profile.activity}`)} />
        <Row label={t('onboarding.goal')} value={t(`goal.${profile.goal}`)} />
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Row label={t('profile.dailyGoal')} value={`${goals.calories} ${t('common.kcal')}`} accent />
        <Row label={t('today.protein')} value={`${goals.macros.protein} ${t('common.g')}`} />
        <Row label={t('today.carbs')} value={`${goals.macros.carbs} ${t('common.g')}`} />
        <Row label={t('today.fat')} value={`${goals.macros.fat} ${t('common.g')}`} />
      </Card>

      <Button title={t('profile.reset')} variant="secondary" onPress={clear} />

      <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
        {t('disclaimer')}
      </AppText>
    </Screen>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.row}>
      <AppText color={colors.textSecondary}>{label}</AppText>
      <AppText color={accent ? colors.accent : colors.text}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
