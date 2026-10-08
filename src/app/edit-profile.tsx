import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Chip, ErrorText, Field, Screen } from '@/components/ui';
import { useDayMutations } from '@/features/day/hooks';
import { deriveGoals, useProfileStore } from '@/features/profile/store';
import { validateBody, type BodyInput } from '@/features/profile/validation';
import { localDateKey } from '@/lib/date';
import { ACTIVITY_MULTIPLIERS, type ActivityLevel, type GoalType } from '@/lib/nutrition';
import { colors, spacing } from '@/theme';

const ACTIVITIES = Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[];
const GOALS: GoalType[] = ['lose', 'maintain', 'gain'];

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const profile = useProfileStore((s) => s.profile)!;
  const setProfile = useProfileStore((s) => s.setProfile);
  const { saveWeight } = useDayMutations();

  const [body, setBody] = useState<BodyInput>({
    weightKg: String(profile.weightKg),
    heightCm: String(profile.heightCm),
    age: String(profile.age),
    targetWeightKg: profile.targetWeightKg !== null ? String(profile.targetWeightKg) : '',
  });
  const [activity, setActivity] = useState(profile.activity);
  const [goal, setGoal] = useState(profile.goal);
  const [error, setError] = useState<string | null>(null);
  const setField = (k: keyof BodyInput) => (v: string) => setBody((b) => ({ ...b, [k]: v }));

  const result = validateBody(body);
  const preview = result.ok ? deriveGoals({ ...profile, ...result.data, activity, goal }) : null;

  const save = async () => {
    if (!result.ok) return setError(t(result.errorKey));
    if (result.data.weightKg !== profile.weightKg) {
      await saveWeight.mutateAsync({ day: localDateKey(), weightKg: result.data.weightKg });
    }
    setProfile({ ...profile, ...result.data, activity, goal });
    if (router.canGoBack()) router.back();
    else router.replace('/profile');
  };

  return (
    <Screen>
      <Field label={t('onboarding.weight')} keyboardType="decimal-pad" value={body.weightKg} onChangeText={setField('weightKg')} />
      <Field label={t('onboarding.targetWeight')} keyboardType="decimal-pad" value={body.targetWeightKg} onChangeText={setField('targetWeightKg')} />
      <Field label={t('onboarding.height')} keyboardType="number-pad" value={body.heightCm} onChangeText={setField('heightCm')} />
      <Field label={t('onboarding.age')} keyboardType="number-pad" value={body.age} onChangeText={setField('age')} />

      <AppText variant="caption" color={colors.textSecondary}>
        {t('onboarding.activity')}
      </AppText>
      <View style={styles.wrap}>
        {ACTIVITIES.map((a) => (
          <Chip key={a} label={t(`activity.${a}`)} selected={activity === a} onPress={() => setActivity(a)} />
        ))}
      </View>
      <AppText variant="caption" color={colors.textSecondary}>
        {t('onboarding.goal')}
      </AppText>
      <View style={styles.wrap}>
        {GOALS.map((g) => (
          <Chip key={g} label={t(`goal.${g}`)} selected={goal === g} onPress={() => setGoal(g)} />
        ))}
      </View>

      {preview && (
        <Card>
          <AppText color={colors.textSecondary}>{t('profile.dailyGoal')}</AppText>
          <AppText variant="title" color={colors.accent}>
            {preview.calories} {t('common.kcal')}
          </AppText>
        </Card>
      )}
      {error && <ErrorText>{error}</ErrorText>}
      <Button title={t('common.save')} onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
