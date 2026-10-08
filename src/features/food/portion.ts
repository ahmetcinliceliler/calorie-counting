import { scaleNutrients } from '@/lib/nutrition';
import type { EntrySource, Food, MealType, PortionUnit } from './types';
import type { NewFoodEntry } from '@/db/entries';

/** Seçim: ya bir porsiyon birimi × adet ya da doğrudan gram. */
export type AmountChoice = { unit: PortionUnit; quantity: number } | { unit: 'gram'; quantity: number };

export function gramsFor(food: Food, choice: AmountChoice): number {
  if (choice.unit === 'gram') return choice.quantity;
  const portion = food.portions.find((p) => p.unit === choice.unit);
  return (portion?.grams ?? 100) * choice.quantity;
}

/** Varsayılan seçim: ilk porsiyon × 1, porsiyon yoksa 100 g. */
export function defaultChoice(food: Food, lastGrams?: number | null): AmountChoice {
  if (lastGrams && lastGrams > 0) {
    const match = food.portions.find((p) => Number.isInteger(lastGrams / p.grams));
    return match ? { unit: match.unit, quantity: lastGrams / match.grams } : { unit: 'gram', quantity: lastGrams };
  }
  const first = food.portions[0];
  return first ? { unit: first.unit, quantity: 1 } : { unit: 'gram', quantity: 100 };
}

export function buildEntry(
  food: Food,
  choice: AmountChoice,
  ctx: { day: string; meal: MealType; source: EntrySource; portionLabel: string | null },
): NewFoodEntry {
  const grams = Math.round(gramsFor(food, choice) * 10) / 10;
  const n = scaleNutrients({ calories: food.per100g.kcal, ...food.per100g }, grams);
  return {
    day: ctx.day,
    meal: ctx.meal,
    foodKey: food.key,
    name: food.name,
    grams,
    portionLabel: ctx.portionLabel,
    kcal: n.calories,
    protein: n.protein,
    carbs: n.carbs,
    fat: n.fat,
    source: ctx.source,
  };
}
