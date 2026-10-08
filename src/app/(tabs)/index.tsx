import { useTranslation } from 'react-i18next';

import { ErrorText, Loading, Screen } from '@/components/ui';
import {
  CalorieHero,
  DayHeader,
  ExerciseSection,
  MacroCard,
  MealSection,
  QuickActions,
  WaterCard,
} from '@/features/day/components';
import { useDayData } from '@/features/day/hooks';
import { useDayStore } from '@/features/day/store';
import { MEAL_TYPES } from '@/features/food/types';
import { deriveGoals, useProfileStore } from '@/features/profile/store';

export default function TodayScreen() {
  const { t } = useTranslation();
  const profile = useProfileStore((s) => s.profile);
  const day = useDayStore((s) => s.day);
  const { data, isLoading, error } = useDayData(day);
  if (!profile) return null;

  const goals = deriveGoals(profile);

  return (
    <Screen>
      <DayHeader />
      {isLoading || !data ? (
        error ? <ErrorText>{t('common.error')}</ErrorText> : <Loading />
      ) : (
        <>
          <CalorieHero goals={goals} totals={data.totals} burned={data.burned} />
          <QuickActions />
          <MacroCard goals={goals} totals={data.totals} />
          {MEAL_TYPES.map((meal) => (
            <MealSection key={meal} meal={meal} entries={data.entries.filter((e) => e.meal === meal)} />
          ))}
          <ExerciseSection day={day} exercises={data.exercises} />
          <WaterCard day={day} ml={data.waterMl} />
        </>
      )}
    </Screen>
  );
}
