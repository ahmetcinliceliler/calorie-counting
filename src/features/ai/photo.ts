import type { NewFoodEntry } from '@/db/entries';
import type { MealType } from '@/features/food/types';
import type { DetectedItem } from '../../../supabase/functions/_shared/schemas';

export interface ReviewItem extends DetectedItem {
  id: string;
  /** Kullanıcının düzenlediği gram; besinler AI'nın gram başına oranından ölçeklenir. */
  editedGrams: number;
  included: boolean;
}

export function toReviewItems(items: DetectedItem[]): ReviewItem[] {
  return items.map((item, i) => ({ ...item, id: `${i}`, editedGrams: Math.round(item.grams), included: true }));
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function scaledNutrients(item: ReviewItem) {
  const f = item.grams > 0 ? item.editedGrams / item.grams : 0;
  return {
    kcal: Math.round(item.kcal * f),
    protein: r1(item.protein * f),
    carbs: r1(item.carbs * f),
    fat: r1(item.fat * f),
  };
}

export function reviewToEntries(items: ReviewItem[], ctx: { day: string; meal: MealType }): NewFoodEntry[] {
  return items
    .filter((i) => i.included && i.editedGrams > 0)
    .map((i) => ({
      day: ctx.day,
      meal: ctx.meal,
      foodKey: null,
      name: i.name,
      grams: i.editedGrams,
      portionLabel: null,
      ...scaledNutrients(i),
      source: 'photo' as const,
    }));
}
