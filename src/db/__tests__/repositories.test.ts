import { CATALOG } from '@/features/food/catalog';
import type { Food } from '@/features/food/types';
import { addExercise, addWater, deleteExercise, getExercises, getWater, getWeightLogs, logWeight } from '../activity';
import {
  addFoodEntry,
  deleteFoodEntry,
  getDaySummaries,
  getDayTotals,
  getFoodEntries,
  updateFoodEntry,
  type NewFoodEntry,
} from '../entries';
import {
  getFavoriteKeys,
  getFavorites,
  getFood,
  getFoodByBarcode,
  getFrequentFoods,
  getLastGrams,
  getRecentFoods,
  recordUsage,
  saveFood,
  toggleFavorite,
} from '../foods';
import { DB_VERSION, migrate } from '../migrations';
import { createTestDb } from '../testing/sqljs-db';

const entry = (overrides: Partial<NewFoodEntry> = {}): NewFoodEntry => ({
  day: '2026-10-08',
  meal: 'breakfast',
  foodKey: 'cat:egg_boiled',
  name: 'Haşlanmış yumurta',
  grams: 100,
  portionLabel: '2 adet',
  kcal: 155,
  protein: 13,
  carbs: 1.1,
  fat: 11,
  source: 'catalog',
  ...overrides,
});

const offFood: Food = {
  key: 'off:8690000000001',
  name: 'Gofret',
  per100g: { kcal: 520, protein: 6, carbs: 60, fat: 28 },
  portions: [{ unit: 'package', grams: 36 }],
  source: 'openfoodfacts',
  barcode: '8690000000001',
};

describe('migrate', () => {
  it('şemayı kurar ve sürümü yazar; ikinci çalıştırma bir şey yapmaz', async () => {
    const db = await createTestDb({ migrate: false });
    await migrate(db);
    await migrate(db);
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
    expect(row?.user_version).toBe(DB_VERSION);
  });
});

describe('yemek kayıtları', () => {
  it('ekler, günlük toplamı hesaplar, başka günü karıştırmaz', async () => {
    const db = await createTestDb();
    await addFoodEntry(db, entry());
    await addFoodEntry(db, entry({ meal: 'lunch', kcal: 248.4, protein: 46.49, carbs: 0, fat: 5.4 }));
    await addFoodEntry(db, entry({ day: '2026-10-07' }));

    const list = await getFoodEntries(db, '2026-10-08');
    expect(list).toHaveLength(2);
    expect(list[1]).toMatchObject({ kcal: 248, protein: 46.5 });
    expect(await getDayTotals(db, '2026-10-08')).toEqual({ kcal: 403, protein: 59.5, carbs: 1.1, fat: 16.4 });
  });

  it('günceller ve yumuşak siler', async () => {
    const db = await createTestDb();
    const e = await addFoodEntry(db, entry());
    await updateFoodEntry(db, e.id, { grams: 50, kcal: 78, meal: 'snack' });
    expect((await getFoodEntries(db, e.day))[0]).toMatchObject({ grams: 50, kcal: 78, meal: 'snack' });

    await deleteFoodEntry(db, e.id);
    expect(await getFoodEntries(db, e.day)).toEqual([]);
    expect(await getDayTotals(db, e.day)).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
    const raw = await db.getFirstAsync<{ deleted_at: string | null; synced: number }>(
      'SELECT deleted_at, synced FROM food_entries WHERE id = ?',
      [e.id],
    );
    expect(raw?.deleted_at).not.toBeNull();
    expect(raw?.synced).toBe(0);
  });

  it('gün özetleri yemek ve egzersizi birleştirir', async () => {
    const db = await createTestDb();
    await addFoodEntry(db, entry({ day: '2026-10-06', kcal: 500 }));
    await addFoodEntry(db, entry({ day: '2026-10-06', kcal: 300 }));
    await addExercise(db, { day: '2026-10-07', exerciseType: 'running', durationMin: 30, kcal: 280 });
    await addFoodEntry(db, entry({ day: '2026-09-01' }));

    expect(await getDaySummaries(db, '2026-10-01', '2026-10-08')).toEqual([
      { day: '2026-10-07', kcal: 0, burned: 280, entries: 0 },
      { day: '2026-10-06', kcal: 800, burned: 0, entries: 2 },
    ]);
  });
});

describe('yiyecekler, favoriler, kullanım', () => {
  it('katalog yiyeceğini koddan, diğerlerini önbellekten çözer', async () => {
    const db = await createTestDb();
    expect(await getFood(db, CATALOG[0].key)).toBe(CATALOG[0]);
    expect(await getFood(db, offFood.key)).toBeNull();

    await saveFood(db, offFood);
    expect(await getFood(db, offFood.key)).toEqual({ ...offFood, imageUrl: null });
    expect((await getFoodByBarcode(db, '8690000000001'))?.name).toBe('Gofret');
  });

  it('favori ekler ve kaldırır', async () => {
    const db = await createTestDb();
    expect(await toggleFavorite(db, offFood)).toBe(true);
    expect(await toggleFavorite(db, CATALOG[1])).toBe(true);
    expect((await getFavorites(db)).map((f) => f.key).sort()).toEqual([CATALOG[1].key, offFood.key].sort());

    expect(await toggleFavorite(db, offFood)).toBe(false);
    expect(await getFavoriteKeys(db)).toEqual(new Set([CATALOG[1].key]));
  });

  it('son ve sık kullanılanları sıralar, son gramajı hatırlar', async () => {
    const db = await createTestDb();
    await recordUsage(db, 'cat:apple', 180);
    await new Promise((r) => setTimeout(r, 5));
    await recordUsage(db, 'cat:banana', 120);
    await new Promise((r) => setTimeout(r, 5));
    await recordUsage(db, 'cat:apple', 90);

    expect((await getRecentFoods(db)).map((f) => f.key)).toEqual(['cat:apple', 'cat:banana']);
    expect((await getFrequentFoods(db)).map((f) => f.key)).toEqual(['cat:apple']);
    expect(await getLastGrams(db, 'cat:apple')).toBe(90);
  });

  it('bilinmeyen anahtarları sessizce atlar', async () => {
    const db = await createTestDb();
    await recordUsage(db, 'off:silinmis', 50);
    expect(await getRecentFoods(db)).toEqual([]);
  });
});

describe('su, egzersiz, kilo', () => {
  it('su 0 ile üst sınır arasında kalır', async () => {
    const db = await createTestDb();
    expect(await addWater(db, '2026-10-08', 250)).toBe(250);
    expect(await addWater(db, '2026-10-08', -1000)).toBe(0);
    expect(await addWater(db, '2026-10-08', 50_000)).toBe(20_000);
    expect(await getWater(db, '2026-10-07')).toBe(0);
  });

  it('eşzamanlı su eklemeleri kaybolmaz', async () => {
    const db = await createTestDb();
    await Promise.all([addWater(db, '2026-10-08', 250), addWater(db, '2026-10-08', 250), addWater(db, '2026-10-08', 250)]);
    expect(await getWater(db, '2026-10-08')).toBe(750);
  });

  it('egzersiz ekler ve siler', async () => {
    const db = await createTestDb();
    const e = await addExercise(db, { day: '2026-10-08', exerciseType: 'yoga', durationMin: 45, kcal: 157.5 });
    expect(await getExercises(db, '2026-10-08')).toEqual([{ ...e, kcal: 158 }]);
    await deleteExercise(db, e.id);
    expect(await getExercises(db, '2026-10-08')).toEqual([]);
  });

  it('aynı güne ikinci kilo kaydı öncekinin üzerine yazar', async () => {
    const db = await createTestDb();
    await logWeight(db, '2026-10-01', 80.04);
    await logWeight(db, '2026-10-08', 79.5);
    await logWeight(db, '2026-10-08', 79.2);
    expect(await getWeightLogs(db)).toEqual([
      { day: '2026-10-01', weightKg: 80 },
      { day: '2026-10-08', weightKg: 79.2 },
    ]);
  });
});
