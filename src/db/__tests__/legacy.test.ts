import { getExercises, getWater, getWeightLogs } from '../activity';
import { getFoodEntries } from '../entries';
import { convertLegacy, importLegacyOnce, LEGACY_KEYS } from '../legacy';
import { createTestDb } from '../testing/sqljs-db';

// v1'in gerçek veri biçimi
const v1 = {
  [LEGACY_KEYS.daily]: JSON.stringify({
    '2026-01-20': {
      foods: [
        { name: 'Menemen', calories: 250, protein: 15, carbs: 10, fat: 18, portion: '1 Porsiyon' },
        { name: 'Çay', calories: 1 }, // eski kayıtlarda makro olmayabilir
        { name: '', calories: 100 }, // bozuk
      ],
      exercises: [{ name: 'Koşu (Hafif)', calories: 245, duration: 30 }],
      water: 5,
    },
    '2026-01-21': { foods: [], exercises: [], water: 0 },
    'bozuk-anahtar': { foods: [{ name: 'x', calories: 1 }] },
  }),
  [LEGACY_KEYS.profile]: JSON.stringify({
    gender: 'female',
    weight: 65,
    targetWeight: null, // v1'de parseFloat('') → NaN → null
    height: 168,
    age: 29,
    activity: 'light',
    goal: 'lose',
    bmr: 1398,
    dailyGoal: 1422,
  }),
  [LEGACY_KEYS.weights]: JSON.stringify([
    { date: '2026-01-10', weight: 66 },
    { date: '2026-01-20', weight: 65 },
  ]),
};

const reader = (data: Record<string, string>) => async (key: string) => data[key] ?? null;

describe('convertLegacy', () => {
  it('v1 verisini dönüştürür, bozuk kayıtları atlar', () => {
    const r = convertLegacy({
      daily: v1[LEGACY_KEYS.daily],
      profile: v1[LEGACY_KEYS.profile],
      weights: v1[LEGACY_KEYS.weights],
    });
    expect(r.profile).toEqual({
      gender: 'female',
      weightKg: 65,
      heightCm: 168,
      age: 29,
      activity: 'light',
      goal: 'lose',
      targetWeightKg: null,
    });
    expect(r.foods).toHaveLength(2);
    expect(r.foods[1]).toMatchObject({ name: 'Çay', kcal: 1, protein: 0, portionLabel: null });
    expect(r.exercises).toEqual([{ day: '2026-01-20', exerciseType: 'running', durationMin: 30, kcal: 245 }]);
    expect(r.water).toEqual([{ day: '2026-01-20', ml: 1000 }]);
    expect(r.weights).toHaveLength(2);
  });

  it('geçersiz profili almaz, bozuk JSON çökertmez', () => {
    expect(convertLegacy({ profile: JSON.stringify({ gender: 'male', weight: 5, height: 180, age: 30 }) }).profile).toBeNull();
    expect(convertLegacy({ daily: '{bozuk', profile: 'null', weights: '"x"' })).toEqual({
      profile: null,
      foods: [],
      exercises: [],
      water: [],
      weights: [],
    });
  });
});

describe('importLegacyOnce', () => {
  it('bir kez içe aktarır, ikinci çağrıda tekrar etmez', async () => {
    const db = await createTestDb();
    const first = await importLegacyOnce(db, reader(v1));
    expect(first).toMatchObject({ imported: true, counts: { foods: 2, exercises: 1, water: 1, weights: 2 } });
    expect(first.profile?.weightKg).toBe(65);

    const second = await importLegacyOnce(db, reader(v1));
    expect(second.imported).toBe(false);

    expect(await getFoodEntries(db, '2026-01-20')).toHaveLength(2);
    expect(await getExercises(db, '2026-01-20')).toHaveLength(1);
    expect(await getWater(db, '2026-01-20')).toBe(1000);
    expect(await getWeightLogs(db)).toHaveLength(2);
  });

  it('eski veri yoksa yine de işaretler', async () => {
    const db = await createTestDb();
    expect(await importLegacyOnce(db, reader({}))).toMatchObject({ imported: true, profile: null });
    expect((await importLegacyOnce(db, reader(v1))).imported).toBe(false);
  });
});
