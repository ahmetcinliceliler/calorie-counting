import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText, Button, Chip, ErrorText, Field, Screen } from '@/components/ui';
import { useDayMutations } from '@/features/day/hooks';
import { useDayStore } from '@/features/day/store';
import { defaultMealForTime, MEAL_TYPES, type MealType } from '@/features/food/types';
import { closeFlow } from '@/lib/navigation';
import { colors, spacing } from '@/theme';

const parse = (s: string) => {
  if (s.trim() === '') return 0;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

/** Katalogda olmayan bir şeyi doğrudan kalori/makro ile ekleme. */
export default function QuickAddScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ meal?: string; name?: string }>();
  const day = useDayStore((s) => s.day);
  const { addFoods } = useDayMutations();

  const [meal, setMeal] = useState<MealType>(
    MEAL_TYPES.includes(params.meal as MealType) ? (params.meal as MealType) : defaultMealForTime(),
  );
  const [form, setForm] = useState({ name: params.name ?? '', kcal: '', grams: '', protein: '', carbs: '', fat: '' });
  const [error, setError] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    const kcal = parse(form.kcal);
    const grams = parse(form.grams);
    const protein = parse(form.protein);
    const carbs = parse(form.carbs);
    const fat = parse(form.fat);
    const name = form.name.trim();
    if (!name || !(kcal > 0) || kcal > 10000 || [grams, protein, carbs, fat].some(Number.isNaN)) {
      setError(true);
      return;
    }
    await addFoods.mutateAsync({
      entries: [
        {
          day,
          meal,
          foodKey: null,
          name: name.slice(0, 80),
          grams: grams > 0 ? grams : 100,
          portionLabel: grams > 0 ? null : '1 porsiyon',
          kcal,
          protein,
          carbs,
          fat,
          source: 'manual',
        },
      ],
    });
    closeFlow();
  };

  return (
    <Screen>
      <Field label={t('quick.name')} placeholder={t('quick.namePlaceholder')} value={form.name} onChangeText={set('name')} />
      <Field label={t('quick.kcal')} keyboardType="number-pad" value={form.kcal} onChangeText={set('kcal')} />
      <Field label={t('quick.grams')} keyboardType="decimal-pad" value={form.grams} onChangeText={set('grams')} />
      <View style={styles.row}>
        <View style={styles.grow}>
          <Field label={t('quick.protein')} keyboardType="decimal-pad" value={form.protein} onChangeText={set('protein')} />
        </View>
        <View style={styles.grow}>
          <Field label={t('quick.carbs')} keyboardType="decimal-pad" value={form.carbs} onChangeText={set('carbs')} />
        </View>
        <View style={styles.grow}>
          <Field label={t('quick.fat')} keyboardType="decimal-pad" value={form.fat} onChangeText={set('fat')} />
        </View>
      </View>

      <AppText variant="caption" color={colors.textSecondary}>
        {t('amount.meal')}
      </AppText>
      <View style={styles.wrap}>
        {MEAL_TYPES.map((m) => (
          <Chip key={m} label={t(`meal.${m}`)} selected={meal === m} onPress={() => setMeal(m)} />
        ))}
      </View>

      {error && <ErrorText>{t('quick.invalid')}</ErrorText>}
      <Button title={t('common.add')} onPress={save} disabled={addFoods.isPending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  grow: { flex: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
