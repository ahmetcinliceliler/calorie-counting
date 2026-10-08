// v1 (eski uygulama) verisini yeni şemaya dönüştürür.
// v1 AsyncStorage anahtarları:
//   @DietTracker:CalAI_Ultra_Final_V3 → { [YYYY-MM-DD]: { foods: [...], exercises: [...], water: bardak } }
//   @user_profile                      → { gender, weight, targetWeight, height, age, activity, goal, ... }
//   @weight_history                    → [{ date, weight }]
import type { UserProfile } from '@/features/profile/store';
import { ACTIVITY_MULTIPLIERS, EXERCISE_TYPES, type ActivityLevel, type GoalType } from '@/lib/nutrition';
import { addExercise, addWater, logWeight, setMeta, getMeta } from './activity';
import { addFoodEntry, type NewFoodEntry } from './entries';
import type { Db } from './types';

export const LEGACY_KEYS = {
  daily: '@DietTracker:CalAI_Ultra_Final_V3',
  profile: '@user_profile',
  weights: '@weight_history',
} as const;

const LEGACY_GLASS_ML = 200;

// v1 egzersiz adları → yeni kimlikler
const LEGACY_EXERCISE_NAMES: Record<string, string> = {
  'Yürüyüş (Hafif)': 'walking',
  'Yürüyüş (Tempolu)': 'walking_brisk',
  'Koşu (Hafif)': 'running',
  'Koşu (Hızlı)': 'running_fast',
  Bisiklet: 'cycling',
  Yüzme: 'swimming',
  'Fitness / Ağırlık': 'gym',
  Yoga: 'yoga',
  Pilates: 'pilates',
  HIIT: 'hiit',
  Basketbol: 'basketball',
  Futbol: 'football',
};

const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const num = (v: unknown, fallback = 0) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};
const inRange = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

export interface LegacyImport {
  profile: UserProfile | null;
  foods: NewFoodEntry[];
  exercises: { day: string; exerciseType: string; durationMin: number; kcal: number }[];
  water: { day: string; ml: number }[];
  weights: { day: string; weightKg: number }[];
}

export function convertLegacy(raw: { daily?: string | null; profile?: string | null; weights?: string | null }): LegacyImport {
  const parse = (s?: string | null): unknown => {
    if (!s) return null;
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };

  const result: LegacyImport = { profile: null, foods: [], exercises: [], water: [], weights: [] };

  // Profil: geçersiz alan varsa hiç almayız (onboarding yeniden sorar).
  const p = parse(raw.profile) as Record<string, unknown> | null;
  if (p && typeof p === 'object') {
    const weightKg = inRange(p.weight, 30, 300);
    const heightCm = inRange(p.height, 100, 250);
    const age = inRange(p.age, 13, 100);
    const gender = p.gender === 'male' || p.gender === 'female' ? p.gender : null;
    const activity = (Object.keys(ACTIVITY_MULTIPLIERS) as ActivityLevel[]).includes(p.activity as ActivityLevel)
      ? (p.activity as ActivityLevel)
      : 'sedentary';
    const goal = (['lose', 'maintain', 'gain'] as GoalType[]).includes(p.goal as GoalType) ? (p.goal as GoalType) : 'maintain';
    if (weightKg && heightCm && age && gender) {
      result.profile = {
        gender,
        weightKg,
        heightCm,
        age: Math.round(age),
        activity,
        goal,
        targetWeightKg: inRange(p.targetWeight, 30, 300),
      };
    }
  }

  const daily = parse(raw.daily) as Record<string, any> | null;
  if (daily && typeof daily === 'object') {
    for (const [day, obj] of Object.entries(daily)) {
      if (!isDay(day) || !obj || typeof obj !== 'object') continue;

      for (const f of Array.isArray(obj.foods) ? obj.foods : []) {
        if (!f || typeof f.name !== 'string' || !f.name.trim()) continue;
        result.foods.push({
          day,
          meal: 'snack', // v1'de öğün yoktu
          foodKey: null,
          name: f.name.trim().slice(0, 80),
          // v1 gram tutmuyordu; porsiyon etiketi korunur, gram yer tutucu.
          grams: 100,
          portionLabel: typeof f.portion === 'string' ? f.portion : null,
          kcal: num(f.calories),
          protein: num(f.protein),
          carbs: num(f.carbs),
          fat: num(f.fat),
          source: 'manual',
        });
      }

      for (const e of Array.isArray(obj.exercises) ? obj.exercises : []) {
        if (!e) continue;
        const durationMin = Math.round(num(e.duration, 0));
        result.exercises.push({
          day,
          exerciseType: LEGACY_EXERCISE_NAMES[e.name] ?? (EXERCISE_TYPES.some((t) => t.id === e.name) ? e.name : 'other'),
          durationMin: durationMin > 0 ? Math.min(durationMin, 1440) : 1,
          kcal: num(e.calories),
        });
      }

      const glasses = num(obj.water);
      if (glasses > 0) result.water.push({ day, ml: Math.round(glasses) * LEGACY_GLASS_ML });
    }
  }

  const weights = parse(raw.weights);
  if (Array.isArray(weights)) {
    for (const w of weights) {
      const weightKg = inRange(w?.weight, 30, 300);
      if (w && typeof w.date === 'string' && isDay(w.date) && weightKg) {
        result.weights.push({ day: w.date, weightKg });
      }
    }
  }

  return result;
}

const IMPORT_FLAG = 'legacy_import_v1';

/**
 * Eski veriyi bir kez içe aktarır. Eski anahtarlar silinmez (geri dönüş imkânı için).
 * Profil döndürülür; çağıran taraf profil deposunda profil yoksa kullanır.
 */
export async function importLegacyOnce(
  db: Db,
  readKey: (key: string) => Promise<string | null>,
): Promise<{ imported: boolean; profile: UserProfile | null; counts?: Record<string, number> }> {
  if (await getMeta(db, IMPORT_FLAG)) return { imported: false, profile: null };

  const data = convertLegacy({
    daily: await readKey(LEGACY_KEYS.daily),
    profile: await readKey(LEGACY_KEYS.profile),
    weights: await readKey(LEGACY_KEYS.weights),
  });

  await db.withTransactionAsync(async () => {
    for (const f of data.foods) await addFoodEntry(db, f);
    for (const e of data.exercises) await addExercise(db, e);
    for (const w of data.water) await addWater(db, w.day, w.ml);
    for (const w of data.weights) await logWeight(db, w.day, w.weightKg);
    await setMeta(db, IMPORT_FLAG, new Date().toISOString());
  });

  return {
    imported: true,
    profile: data.profile,
    counts: { foods: data.foods.length, exercises: data.exercises.length, water: data.water.length, weights: data.weights.length },
  };
}
