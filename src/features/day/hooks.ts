import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { addExercise, addWater, deleteExercise, getExercises, getWater, getWeightLogs, logWeight } from '@/db/activity';
import {
  addFoodEntry,
  deleteFoodEntry,
  getDaySummaries,
  getDayTotals,
  getFoodEntries,
  updateFoodEntry,
  type NewFoodEntry,
} from '@/db/entries';
import { getFavoriteKeys, getFavorites, getFrequentFoods, getRecentFoods, recordUsage, saveFood, toggleFavorite } from '@/db/foods';
import { useDb } from '@/db/provider';
import type { Food, FoodEntry } from '@/features/food/types';
import { addDays, localDateKey } from '@/lib/date';

export const keys = {
  day: (day: string) => ['day', day] as const,
  history: ['history'] as const,
  foods: ['foods'] as const,
  weights: ['weights'] as const,
};

export function useDayData(day: string) {
  const db = useDb();
  return useQuery({
    queryKey: keys.day(day),
    queryFn: async () => {
      const [entries, totals, exercises, waterMl] = await Promise.all([
        getFoodEntries(db, day),
        getDayTotals(db, day),
        getExercises(db, day),
        getWater(db, day),
      ]);
      const burned = exercises.reduce((s, e) => s + e.kcal, 0);
      return { entries, totals, exercises, waterMl, burned };
    },
  });
}

export function useHistory(days = 60) {
  const db = useDb();
  return useQuery({
    queryKey: [...keys.history, days],
    queryFn: () => {
      const to = localDateKey();
      return getDaySummaries(db, addDays(to, -(days - 1)), to);
    },
  });
}

export function useFoodLists() {
  const db = useDb();
  return useQuery({
    queryKey: keys.foods,
    queryFn: async () => {
      const [favorites, recent, frequent, favoriteKeys] = await Promise.all([
        getFavorites(db),
        getRecentFoods(db),
        getFrequentFoods(db),
        getFavoriteKeys(db),
      ]);
      return { favorites, recent, frequent, favoriteKeys };
    },
  });
}

export function useWeightLogs() {
  const db = useDb();
  return useQuery({ queryKey: keys.weights, queryFn: () => getWeightLogs(db) });
}

/** Bir günü etkileyen değişikliklerden sonra ilgili sorguları yeniler. */
function useInvalidate() {
  const qc = useQueryClient();
  return (day?: string) =>
    Promise.all([
      day ? qc.invalidateQueries({ queryKey: keys.day(day) }) : qc.invalidateQueries({ queryKey: ['day'] }),
      qc.invalidateQueries({ queryKey: keys.history }),
      qc.invalidateQueries({ queryKey: keys.foods }),
    ]);
}

export function useDayMutations() {
  const db = useDb();
  const invalidate = useInvalidate();
  const qc = useQueryClient();

  const addFoods = useMutation({
    mutationFn: async (input: { entries: NewFoodEntry[]; foods?: Food[] }) => {
      await db.withTransactionAsync(async () => {
        for (const food of input.foods ?? []) await saveFood(db, food);
        for (const e of input.entries) {
          await addFoodEntry(db, e);
          if (e.foodKey) await recordUsage(db, e.foodKey, e.grams);
        }
      });
    },
    onSuccess: (_, input) => Promise.all([...new Set(input.entries.map((e) => e.day))].map((d) => invalidate(d))),
  });

  const updateFood = useMutation({
    mutationFn: (input: { entry: FoodEntry; patch: Parameters<typeof updateFoodEntry>[2] }) =>
      updateFoodEntry(db, input.entry.id, input.patch),
    onSuccess: (_, input) => invalidate(input.entry.day),
  });

  const removeFood = useMutation({
    mutationFn: (entry: FoodEntry) => deleteFoodEntry(db, entry.id),
    onSuccess: (_, entry) => invalidate(entry.day),
  });

  const addExerciseEntry = useMutation({
    mutationFn: (input: Parameters<typeof addExercise>[1]) => addExercise(db, input),
    onSuccess: (_, input) => invalidate(input.day),
  });

  const removeExercise = useMutation({
    mutationFn: (input: { id: string; day: string }) => deleteExercise(db, input.id),
    onSuccess: (_, input) => invalidate(input.day),
  });

  const changeWater = useMutation({
    mutationFn: (input: { day: string; deltaMl: number }) => addWater(db, input.day, input.deltaMl),
    onSuccess: (_, input) => qc.invalidateQueries({ queryKey: keys.day(input.day) }),
  });

  const toggleFav = useMutation({
    mutationFn: (food: Food) => toggleFavorite(db, food),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.foods }),
  });

  const saveWeight = useMutation({
    mutationFn: (input: { day: string; weightKg: number }) => logWeight(db, input.day, input.weightKg),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.weights }),
  });

  return { addFoods, updateFood, removeFood, addExerciseEntry, removeExercise, changeWater, toggleFav, saveWeight };
}
