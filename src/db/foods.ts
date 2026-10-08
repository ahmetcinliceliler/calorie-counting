import { getCatalogFood } from '@/features/food/catalog';
import type { Food, FoodSource, Portion } from '@/features/food/types';
import { nowIso } from '@/lib/id';
import type { Db } from './types';

interface FoodRow {
  key: string;
  name: string;
  kcal_100g: number;
  protein_100g: number;
  carbs_100g: number;
  fat_100g: number;
  portions_json: string;
  source: FoodSource;
  barcode: string | null;
  image_url: string | null;
}

function parsePortions(json: string): Portion[] {
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

const toFood = (r: FoodRow): Food => ({
  key: r.key,
  name: r.name,
  per100g: { kcal: r.kcal_100g, protein: r.protein_100g, carbs: r.carbs_100g, fat: r.fat_100g },
  portions: parsePortions(r.portions_json),
  source: r.source,
  barcode: r.barcode,
  imageUrl: r.image_url,
});

/** Katalog dışı yiyeceği yerel önbelleğe yazar (katalog yiyecekleri zaten kodda). */
export async function saveFood(db: Db, food: Food): Promise<void> {
  if (food.source === 'catalog') return;
  await db.runAsync(
    `INSERT INTO foods (key, name, kcal_100g, protein_100g, carbs_100g, fat_100g, portions_json, source, barcode, image_url, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       name = excluded.name, kcal_100g = excluded.kcal_100g, protein_100g = excluded.protein_100g,
       carbs_100g = excluded.carbs_100g, fat_100g = excluded.fat_100g, portions_json = excluded.portions_json,
       source = excluded.source, barcode = excluded.barcode, image_url = excluded.image_url, updated_at = excluded.updated_at`,
    [
      food.key, food.name, food.per100g.kcal, food.per100g.protein, food.per100g.carbs, food.per100g.fat,
      JSON.stringify(food.portions), food.source, food.barcode ?? null, food.imageUrl ?? null, nowIso(),
    ],
  );
}

export async function getFood(db: Db, key: string): Promise<Food | null> {
  const fromCatalog = getCatalogFood(key);
  if (fromCatalog) return fromCatalog;
  const row = await db.getFirstAsync<FoodRow>('SELECT * FROM foods WHERE key = ?', [key]);
  return row ? toFood(row) : null;
}

export async function getFoodByBarcode(db: Db, barcode: string): Promise<Food | null> {
  const row = await db.getFirstAsync<FoodRow>('SELECT * FROM foods WHERE barcode = ? ORDER BY updated_at DESC', [barcode]);
  return row ? toFood(row) : null;
}

async function resolveKeys(db: Db, keys: string[]): Promise<Food[]> {
  const foods = await Promise.all(keys.map((k) => getFood(db, k)));
  return foods.filter((f): f is Food => f !== null);
}

// ---- Favoriler -------------------------------------------------------------

export async function getFavoriteKeys(db: Db): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ food_key: string }>('SELECT food_key FROM favorites', []);
  return new Set(rows.map((r) => r.food_key));
}

export async function getFavorites(db: Db): Promise<Food[]> {
  const rows = await db.getAllAsync<{ food_key: string }>('SELECT food_key FROM favorites ORDER BY created_at DESC', []);
  return resolveKeys(db, rows.map((r) => r.food_key));
}

/** Favori durumunu tersine çevirir; yeni durumu döner. */
export async function toggleFavorite(db: Db, food: Food): Promise<boolean> {
  const existing = await db.getFirstAsync<{ food_key: string }>('SELECT food_key FROM favorites WHERE food_key = ?', [food.key]);
  if (existing) {
    await db.runAsync('DELETE FROM favorites WHERE food_key = ?', [food.key]);
    return false;
  }
  await saveFood(db, food);
  await db.runAsync('INSERT INTO favorites (food_key, created_at) VALUES (?, ?)', [food.key, nowIso()]);
  return true;
}

// ---- Kullanım (son eklenenler / sık eklenenler) ----------------------------

export async function recordUsage(db: Db, foodKey: string, grams: number): Promise<void> {
  await db.runAsync(
    `INSERT INTO food_usage (food_key, use_count, last_used_at, last_grams) VALUES (?, 1, ?, ?)
     ON CONFLICT(food_key) DO UPDATE SET use_count = use_count + 1, last_used_at = excluded.last_used_at, last_grams = excluded.last_grams`,
    [foodKey, nowIso(), grams],
  );
}

export async function getRecentFoods(db: Db, limit = 20): Promise<Food[]> {
  const rows = await db.getAllAsync<{ food_key: string }>(
    'SELECT food_key FROM food_usage ORDER BY last_used_at DESC LIMIT ?',
    [limit],
  );
  return resolveKeys(db, rows.map((r) => r.food_key));
}

export async function getFrequentFoods(db: Db, limit = 20): Promise<Food[]> {
  const rows = await db.getAllAsync<{ food_key: string }>(
    'SELECT food_key FROM food_usage WHERE use_count >= 2 ORDER BY use_count DESC, last_used_at DESC LIMIT ?',
    [limit],
  );
  return resolveKeys(db, rows.map((r) => r.food_key));
}

export async function getLastGrams(db: Db, foodKey: string): Promise<number | null> {
  const row = await db.getFirstAsync<{ last_grams: number | null }>(
    'SELECT last_grams FROM food_usage WHERE food_key = ?',
    [foodKey],
  );
  return row?.last_grams ?? null;
}
