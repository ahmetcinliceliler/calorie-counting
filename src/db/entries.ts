import type { DayTotals, EntrySource, FoodEntry, MealType } from '@/features/food/types';
import { newId, nowIso } from '@/lib/id';
import type { Db } from './types';

interface FoodEntryRow {
  id: string;
  day: string;
  meal: MealType;
  food_key: string | null;
  name: string;
  grams: number;
  portion_label: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  source: EntrySource;
  created_at: string;
}

const toEntry = (r: FoodEntryRow): FoodEntry => ({
  id: r.id,
  day: r.day,
  meal: r.meal,
  foodKey: r.food_key,
  name: r.name,
  grams: r.grams,
  portionLabel: r.portion_label,
  kcal: r.kcal,
  protein: r.protein,
  carbs: r.carbs,
  fat: r.fat,
  source: r.source,
  createdAt: r.created_at,
});

export type NewFoodEntry = Omit<FoodEntry, 'id' | 'createdAt'> & { id?: string; createdAt?: string };

const round1 = (n: number) => Math.round(n * 10) / 10;

export async function addFoodEntry(db: Db, e: NewFoodEntry): Promise<FoodEntry> {
  const now = nowIso();
  const entry: FoodEntry = {
    ...e,
    id: e.id ?? newId(),
    createdAt: e.createdAt ?? now,
    kcal: Math.round(e.kcal),
    protein: round1(e.protein),
    carbs: round1(e.carbs),
    fat: round1(e.fat),
  };
  await db.runAsync(
    `INSERT INTO food_entries (id, day, meal, food_key, name, grams, portion_label, kcal, protein, carbs, fat, source, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.id, entry.day, entry.meal, entry.foodKey, entry.name, entry.grams, entry.portionLabel,
      entry.kcal, entry.protein, entry.carbs, entry.fat, entry.source, entry.createdAt, now,
    ],
  );
  return entry;
}

export async function updateFoodEntry(
  db: Db,
  id: string,
  patch: Partial<Pick<FoodEntry, 'meal' | 'grams' | 'portionLabel' | 'kcal' | 'protein' | 'carbs' | 'fat' | 'name'>>,
): Promise<void> {
  const map: Record<string, string> = {
    meal: 'meal', grams: 'grams', portionLabel: 'portion_label', kcal: 'kcal',
    protein: 'protein', carbs: 'carbs', fat: 'fat', name: 'name',
  };
  const keys = Object.keys(patch).filter((k) => k in map) as (keyof typeof patch)[];
  if (keys.length === 0) return;
  const sets = keys.map((k) => `${map[k]} = ?`).join(', ');
  const values = keys.map((k) => (patch[k] ?? null) as string | number | null);
  await db.runAsync(
    `UPDATE food_entries SET ${sets}, updated_at = ?, synced = 0 WHERE id = ? AND deleted_at IS NULL`,
    [...values, nowIso(), id],
  );
}

/** Yumuşak silme: senkronizasyonda silme de karşı tarafa iletilsin. */
export async function deleteFoodEntry(db: Db, id: string): Promise<void> {
  const now = nowIso();
  await db.runAsync('UPDATE food_entries SET deleted_at = ?, updated_at = ?, synced = 0 WHERE id = ?', [now, now, id]);
}

export async function getFoodEntries(db: Db, day: string): Promise<FoodEntry[]> {
  const rows = await db.getAllAsync<FoodEntryRow>(
    'SELECT * FROM food_entries WHERE day = ? AND deleted_at IS NULL ORDER BY created_at',
    [day],
  );
  return rows.map(toEntry);
}

export async function getDayTotals(db: Db, day: string): Promise<DayTotals> {
  const row = await db.getFirstAsync<DayTotals>(
    `SELECT COALESCE(SUM(kcal), 0) AS kcal, COALESCE(SUM(protein), 0) AS protein,
            COALESCE(SUM(carbs), 0) AS carbs, COALESCE(SUM(fat), 0) AS fat
       FROM food_entries WHERE day = ? AND deleted_at IS NULL`,
    [day],
  );
  return {
    kcal: Math.round(row?.kcal ?? 0),
    protein: round1(row?.protein ?? 0),
    carbs: round1(row?.carbs ?? 0),
    fat: round1(row?.fat ?? 0),
  };
}

export interface DaySummary {
  day: string;
  kcal: number;
  burned: number;
  entries: number;
}

/** Aralıktaki her gün için toplamlar (kaydı olmayan günler dahil değil). */
export async function getDaySummaries(db: Db, from: string, to: string): Promise<DaySummary[]> {
  return db.getAllAsync<DaySummary>(
    `SELECT d.day AS day,
            COALESCE((SELECT ROUND(SUM(kcal)) FROM food_entries f WHERE f.day = d.day AND f.deleted_at IS NULL), 0) AS kcal,
            COALESCE((SELECT ROUND(SUM(kcal)) FROM exercise_entries e WHERE e.day = d.day AND e.deleted_at IS NULL), 0) AS burned,
            (SELECT COUNT(*) FROM food_entries f WHERE f.day = d.day AND f.deleted_at IS NULL) AS entries
       FROM (SELECT day FROM food_entries WHERE deleted_at IS NULL AND day BETWEEN ? AND ?
             UNION SELECT day FROM exercise_entries WHERE deleted_at IS NULL AND day BETWEEN ? AND ?) d
      ORDER BY d.day DESC`,
    [from, to, from, to],
  );
}
