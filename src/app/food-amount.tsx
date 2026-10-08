import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Card, Chip, EmptyState, ErrorText, Field, IconButton, Loading, Screen } from '@/components/ui';
import { getFood, getLastGrams } from '@/db/foods';
import { useDb } from '@/db/provider';
import { useDayMutations, useFoodLists } from '@/features/day/hooks';
import { useDayStore } from '@/features/day/store';
import { buildEntry, defaultChoice, gramsFor, type AmountChoice } from '@/features/food/portion';
import { defaultMealForTime, MEAL_TYPES, type Food, type MealType, type PortionUnit } from '@/features/food/types';
import { closeFlow } from '@/lib/navigation';
import { colors, spacing } from '@/theme';

export default function FoodAmountScreen() {
  const { t } = useTranslation();
  const db = useDb();
  const params = useLocalSearchParams<{ key: string; meal?: string; source?: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['food', params.key],
    queryFn: async () => ({ food: await getFood(db, params.key), lastGrams: await getLastGrams(db, params.key) }),
    staleTime: 0,
  });

  if (isLoading) return <Screen><Loading /></Screen>;
  if (!data?.food) return <Screen><EmptyState text={t('common.error')} /></Screen>;
  return <AmountForm key={data.food.key} food={data.food} lastGrams={data.lastGrams} params={params} />;
}

function AmountForm({
  food,
  lastGrams,
  params,
}: {
  food: Food;
  lastGrams: number | null;
  params: { meal?: string; source?: string };
}) {
  const { t } = useTranslation();
  const day = useDayStore((s) => s.day);
  const { addFoods, toggleFav } = useDayMutations();
  const lists = useFoodLists();

  // Başlangıç: son kullanılan gramaj ya da ilk porsiyon.
  const [initial] = useState(() => defaultChoice(food, lastGrams));
  const [meal, setMeal] = useState<MealType>(
    MEAL_TYPES.includes(params.meal as MealType) ? (params.meal as MealType) : defaultMealForTime(),
  );
  const [unit, setUnit] = useState<PortionUnit | 'gram'>(initial.unit);
  const [quantityText, setQuantityText] = useState(String(initial.quantity));

  const quantity = Number(quantityText.replace(',', '.'));
  const valid = Number.isFinite(quantity) && quantity > 0 && quantity <= (unit === 'gram' ? 5000 : 50);
  const choice = { unit, quantity: valid ? quantity : 0 } as AmountChoice;
  const unitLabel = (u: PortionUnit | 'gram') => t(`unit.${u}`);
  const portionLabel = unit === 'gram' ? null : `${quantity} ${unitLabel(unit)}`;
  const source = params.source === 'barcode' ? 'barcode' : food.source === 'catalog' ? 'catalog' : 'manual';
  const entry = buildEntry(food, choice, { day, meal, source, portionLabel });
  const isFav = lists.data?.favoriteKeys.has(food.key) ?? false;

  const units: (PortionUnit | 'gram')[] = [...food.portions.map((p) => p.unit), 'gram'];

  const save = async () => {
    if (!valid) return;
    await addFoods.mutateAsync({ entries: [entry] });
    closeFlow();
  };

  return (
    <Screen>
      <View style={styles.titleRow}>
        <AppText variant="title" style={{ flex: 1 }}>
          {food.name}
        </AppText>
        <IconButton
          icon={isFav ? 'star' : 'star-outline'}
          label={isFav ? t('amount.unfavorite') : t('amount.favorite')}
          color={isFav ? colors.accent : colors.textSecondary}
          onPress={() => toggleFav.mutate(food)}
        />
      </View>

      <View style={{ gap: spacing.sm }}>
        <AppText variant="caption" color={colors.textSecondary}>
          {t('amount.unit')}
        </AppText>
        <View style={styles.wrap}>
          {units.map((u) => {
            const grams = u === 'gram' ? null : food.portions.find((p) => p.unit === u)?.grams;
            return (
              <Chip
                key={u}
                label={grams ? `${unitLabel(u)} (${grams} ${t('common.g')})` : unitLabel(u)}
                selected={unit === u}
                onPress={() => {
                  // Birim değişince toplam gramı koru (mümkünse).
                  const currentGrams = valid ? gramsFor(food, { unit, quantity } as AmountChoice) : 100;
                  setUnit(u);
                  setQuantityText(u === 'gram' ? String(Math.round(currentGrams)) : '1');
                }}
              />
            );
          })}
        </View>
      </View>

      <Field
        label={t('amount.quantity')}
        keyboardType="decimal-pad"
        value={quantityText}
        onChangeText={setQuantityText}
        selectTextOnFocus
      />
      {!valid && <ErrorText>{t('amount.invalid')}</ErrorText>}

      <View style={{ gap: spacing.sm }}>
        <AppText variant="caption" color={colors.textSecondary}>
          {t('amount.meal')}
        </AppText>
        <View style={styles.wrap}>
          {MEAL_TYPES.map((m) => (
            <Chip key={m} label={t(`meal.${m}`)} selected={meal === m} onPress={() => setMeal(m)} />
          ))}
        </View>
      </View>

      <Card style={{ gap: spacing.sm }}>
        <View style={styles.rowBetween}>
          <AppText color={colors.textSecondary}>
            {t('amount.total')} · {entry.grams} {t('common.g')}
          </AppText>
          <AppText variant="title" color={colors.accent}>
            {entry.kcal} {t('common.kcal')}
          </AppText>
        </View>
        <View style={styles.rowBetween}>
          <AppText color={colors.protein}>P {entry.protein} {t('common.g')}</AppText>
          <AppText color={colors.carbs}>K {entry.carbs} {t('common.g')}</AppText>
          <AppText color={colors.fat}>Y {entry.fat} {t('common.g')}</AppText>
        </View>
      </Card>

      <Button title={t('common.add')} onPress={save} disabled={!valid || addFoods.isPending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
