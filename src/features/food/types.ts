export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export type PortionUnit =
  | 'piece'
  | 'slice'
  | 'bowl'
  | 'plate'
  | 'portion'
  | 'glass'
  | 'cup'
  | 'can'
  | 'tablespoon'
  | 'teaspoon'
  | 'handful'
  | 'square'
  | 'package';

export interface Portion {
  unit: PortionUnit;
  grams: number;
}

export interface Per100g {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type FoodSource = 'catalog' | 'openfoodfacts' | 'ai' | 'custom';

/**
 * Bir yiyecek her zaman 100 g değerleriyle tanımlanır.
 * key: 'cat:<id>' | 'off:<barkod>' | 'ai:<uuid>' | 'custom:<uuid>'
 */
export interface Food {
  key: string;
  name: string;
  per100g: Per100g;
  portions: Portion[];
  source: FoodSource;
  barcode?: string | null;
  imageUrl?: string | null;
}

export type EntrySource = 'manual' | 'catalog' | 'barcode' | 'photo' | 'recipe';

export interface FoodEntry {
  id: string;
  day: string;
  meal: MealType;
  foodKey: string | null;
  name: string;
  grams: number;
  portionLabel: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  source: EntrySource;
  createdAt: string;
}

export interface DayTotals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Öğün varsayılanı: günün saatine göre. */
export function defaultMealForTime(date: Date = new Date()): MealType {
  const h = date.getHours();
  if (h >= 4 && h < 11) return 'breakfast';
  if (h >= 11 && h < 16) return 'lunch';
  if (h >= 17 && h < 22) return 'dinner';
  return 'snack';
}
