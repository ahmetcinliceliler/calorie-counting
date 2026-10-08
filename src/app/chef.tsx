import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Chip, ErrorText, Loading, Screen } from '@/components/ui';
import { aiErrorMessage } from '@/features/ai/errors';
import { useDayMutations } from '@/features/day/hooks';
import { useDayStore } from '@/features/day/store';
import { defaultMealForTime, MEAL_TYPES, type MealType } from '@/features/food/types';
import { chefRecipe } from '@/services/ai';
import { closeFlow } from '@/lib/navigation';
import { colors, radius, spacing } from '@/theme';

export default function ChefScreen() {
  const { t } = useTranslation();
  const day = useDayStore((s) => s.day);
  const { addFoods } = useDayMutations();
  const [prompt, setPrompt] = useState('');
  const [meal, setMeal] = useState<MealType>(defaultMealForTime());

  const recipe = useMutation({ mutationFn: (p: string) => chefRecipe({ prompt: p, locale: 'tr' }) });
  const data = recipe.data?.data;

  const addServing = async () => {
    if (!data) return;
    await addFoods.mutateAsync({
      entries: [
        {
          day,
          meal,
          foodKey: null,
          name: data.title,
          grams: 100, // tarifte gram bilinmiyor; porsiyon etiketi kullanılır
          portionLabel: '1 porsiyon',
          kcal: data.kcal,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          source: 'recipe',
        },
      ],
    });
    closeFlow();
  };

  return (
    <Screen>
      <AppText color={colors.textSecondary}>{t('chef.intro')}</AppText>
      <TextInput
        accessibilityLabel={t('chef.title')}
        placeholder={t('chef.placeholder')}
        placeholderTextColor={colors.textMuted}
        value={prompt}
        onChangeText={setPrompt}
        multiline
        maxLength={500}
        style={styles.input}
      />
      <Button
        title={t('chef.generate')}
        disabled={prompt.trim().length < 3 || recipe.isPending}
        onPress={() => recipe.mutate(prompt.trim())}
      />

      {recipe.isPending && <Loading />}
      {recipe.error && <ErrorText>{aiErrorMessage(recipe.error, t)}</ErrorText>}

      {data && (
        <>
          <Card style={{ gap: spacing.sm }}>
            <AppText variant="title">{data.title}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {t('chef.perServing', { servings: data.servings })}
            </AppText>
            <View style={styles.macros}>
              <AppText color={colors.accent}>{data.kcal} {t('common.kcal')}</AppText>
              <AppText color={colors.protein}>P {data.protein}</AppText>
              <AppText color={colors.carbs}>K {data.carbs}</AppText>
              <AppText color={colors.fat}>Y {data.fat}</AppText>
            </View>
          </Card>

          <Card style={{ gap: spacing.xs }}>
            <AppText variant="heading">{t('chef.ingredients')}</AppText>
            {data.ingredients.map((ing, i) => (
              <AppText key={i}>• {ing}</AppText>
            ))}
          </Card>

          <Card style={{ gap: spacing.xs }}>
            <AppText variant="heading">{t('chef.steps')}</AppText>
            {data.steps.map((step, i) => (
              <AppText key={i}>
                {i + 1}. {step}
              </AppText>
            ))}
          </Card>

          <View style={styles.wrap}>
            {MEAL_TYPES.map((m) => (
              <Chip key={m} label={t(`meal.${m}`)} selected={meal === m} onPress={() => setMeal(m)} />
            ))}
          </View>
          <Button title={t('chef.addServing')} onPress={addServing} disabled={addFoods.isPending} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 96,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  macros: { flexDirection: 'row', gap: spacing.md },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
