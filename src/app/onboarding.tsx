import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Chip, Field, Screen } from '@/components/ui';
import { deriveGoals, useProfileStore, type UserProfile } from '@/features/profile/store';
import { validateBody, type BodyInput } from '@/features/profile/validation';
import { ACTIVITY_MULTIPLIERS, type ActivityLevel, type Gender, type GoalType } from '@/lib/nutrition';
import { colors, spacing } from '@/theme';

const TOTAL_STEPS = 3;
const ACTIVITIES = Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[];
const GOALS: GoalType[] = ['lose', 'maintain', 'gain'];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const setProfile = useProfileStore((s) => s.setProfile);

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [body, setBody] = useState<BodyInput>({ weightKg: '', heightCm: '', age: '', targetWeightKg: '' });
  const [activity, setActivity] = useState<ActivityLevel>('light');
  const [goal, setGoal] = useState<GoalType>('maintain');

  const setField = (key: keyof BodyInput) => (value: string) => setBody((b) => ({ ...b, [key]: value }));

  const next = () => {
    setError(null);
    if (step === 1) {
      if (!gender) return setError(t('onboarding.invalid.gender'));
      return setStep(2);
    }
    if (step === 2) {
      const result = validateBody(body);
      if (!result.ok) return setError(t(result.errorKey));
      return setStep(3);
    }
    const result = validateBody(body);
    if (!result.ok || !gender) return setStep(2);
    const profile: UserProfile = { gender, activity, goal, ...result.data };
    setProfile(profile);
  };

  const preview = (() => {
    if (step !== 3 || !gender) return null;
    const result = validateBody(body);
    return result.ok ? deriveGoals({ gender, activity, goal, ...result.data }) : null;
  })();

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="title">{t('onboarding.title')}</AppText>
        <AppText color={colors.textSecondary}>
          {t('onboarding.step', { current: step, total: TOTAL_STEPS })}
        </AppText>
      </View>

      {step === 1 && (
        <View style={styles.section}>
          <AppText variant="heading">{t('onboarding.genderQuestion')}</AppText>
          <View style={styles.row}>
            <Chip style={styles.grow} label={t('onboarding.male')} selected={gender === 'male'} onPress={() => setGender('male')} />
            <Chip style={styles.grow} label={t('onboarding.female')} selected={gender === 'female'} onPress={() => setGender('female')} />
          </View>
        </View>
      )}

      {step === 2 && (
        <View style={styles.section}>
          <AppText variant="heading">{t('onboarding.bodyQuestion')}</AppText>
          <Field label={t('onboarding.weight')} keyboardType="decimal-pad" value={body.weightKg} onChangeText={setField('weightKg')} />
          <Field label={t('onboarding.height')} keyboardType="number-pad" value={body.heightCm} onChangeText={setField('heightCm')} />
          <Field label={t('onboarding.age')} keyboardType="number-pad" value={body.age} onChangeText={setField('age')} />
          <Field label={t('onboarding.targetWeight')} keyboardType="decimal-pad" value={body.targetWeightKg} onChangeText={setField('targetWeightKg')} />
        </View>
      )}

      {step === 3 && (
        <View style={styles.section}>
          <AppText variant="heading">{t('onboarding.goalQuestion')}</AppText>
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
          <View style={styles.row}>
            {GOALS.map((g) => (
              <Chip key={g} style={styles.grow} label={t(`goal.${g}`)} selected={goal === g} onPress={() => setGoal(g)} />
            ))}
          </View>
          {preview && (
            <Card style={{ gap: spacing.xs }}>
              <AppText variant="caption" color={colors.textSecondary}>
                {t('onboarding.summaryTitle')}
              </AppText>
              <AppText variant="hero" color={colors.accent}>
                {preview.calories} <AppText variant="body">{t('common.kcal')}</AppText>
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                P {preview.macros.protein}g · K {preview.macros.carbs}g · Y {preview.macros.fat}g
              </AppText>
            </Card>
          )}
        </View>
      )}

      {error && (
        <AppText accessibilityRole="alert" color={colors.danger}>
          {error}
        </AppText>
      )}

      <View style={styles.row}>
        {step > 1 && (
          <Button style={styles.grow} variant="secondary" title={t('common.back')} onPress={() => setStep(step - 1)} />
        )}
        <Button
          style={styles.grow}
          title={step === TOTAL_STEPS ? t('onboarding.finish') : t('common.continue')}
          onPress={next}
        />
      </View>

      <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
        {t('disclaimer')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  grow: { flex: 1 },
});
