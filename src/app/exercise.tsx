import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Chip, ErrorText, Field, Screen } from '@/components/ui';
import { useDayMutations } from '@/features/day/hooks';
import { useDayStore } from '@/features/day/store';
import { useProfileStore } from '@/features/profile/store';
import { EXERCISE_TYPES, exerciseCalories } from '@/lib/nutrition';
import { closeFlow } from '@/lib/navigation';
import { colors, spacing } from '@/theme';

export default function ExerciseScreen() {
  const { t } = useTranslation();
  const day = useDayStore((s) => s.day);
  const weightKg = useProfileStore((s) => s.profile?.weightKg ?? 70);
  const { addExerciseEntry } = useDayMutations();

  const [typeId, setTypeId] = useState(EXERCISE_TYPES[0].id);
  const [durationText, setDurationText] = useState('30');

  const duration = Number(durationText);
  const valid = Number.isInteger(duration) && duration >= 1 && duration <= 600;
  const type = EXERCISE_TYPES.find((e) => e.id === typeId)!;
  const kcal = valid ? exerciseCalories(type.met, duration, weightKg) : 0;

  const save = async () => {
    if (!valid) return;
    await addExerciseEntry.mutateAsync({ day, exerciseType: typeId, durationMin: duration, kcal });
    closeFlow();
  };

  return (
    <Screen>
      <AppText variant="caption" color={colors.textSecondary}>
        {t('exercise.type')}
      </AppText>
      <View style={styles.wrap}>
        {EXERCISE_TYPES.map((e) => (
          <Chip key={e.id} label={t(`exercise.types.${e.id}`)} selected={typeId === e.id} onPress={() => setTypeId(e.id)} />
        ))}
      </View>

      <Field label={t('exercise.duration')} keyboardType="number-pad" value={durationText} onChangeText={setDurationText} selectTextOnFocus />
      {!valid && <ErrorText>{t('exercise.invalid')}</ErrorText>}

      <Card>
        <AppText variant="title" color={colors.danger}>
          {t('exercise.estimate', { kcal })}
        </AppText>
      </Card>

      <Button title={t('common.add')} onPress={save} disabled={!valid || addExerciseEntry.isPending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
