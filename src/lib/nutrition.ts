export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';
export type GoalType = 'lose' | 'maintain' | 'gain';

export interface BodyProfile {
  gender: Gender;
  weightKg: number;
  heightCm: number;
  age: number;
  activity: ActivityLevel;
  goal: GoalType;
}

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

const GOAL_ADJUSTMENT: Record<GoalType, number> = { lose: -500, maintain: 0, gain: 300 };

// Güvenlik tabanı: hedef bu değerin altına inmez.
const MIN_CALORIES: Record<Gender, number> = { male: 1500, female: 1200 };

/** Mifflin-St Jeor */
export function calculateBMR({ gender, weightKg, heightCm, age }: BodyProfile): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

export function calculateTDEE(profile: BodyProfile): number {
  return Math.round(calculateBMR(profile) * ACTIVITY_MULTIPLIERS[profile.activity]);
}

export function calculateDailyCalorieGoal(profile: BodyProfile): number {
  const target = calculateTDEE(profile) + GOAL_ADJUSTMENT[profile.goal];
  return Math.max(MIN_CALORIES[profile.gender], Math.round(target));
}

/**
 * Gram cinsinden makro hedefleri.
 * Protein kilo başına (kilo verirken daha yüksek), yağ kalorinin %25'i, kalan karbonhidrat.
 */
export function calculateMacroGoals(profile: BodyProfile, calories = calculateDailyCalorieGoal(profile)): Macros {
  const proteinPerKg = profile.goal === 'lose' ? 2.0 : 1.6;
  const protein = Math.round(profile.weightKg * proteinPerKg);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { protein, carbs, fat };
}

export interface ExerciseType {
  id: string;
  met: number;
  icon: string;
}

export const EXERCISE_TYPES: ExerciseType[] = [
  { id: 'walking', met: 3.5, icon: 'walk' },
  { id: 'walking_brisk', met: 5.0, icon: 'walk' },
  { id: 'running', met: 7.0, icon: 'fitness' },
  { id: 'running_fast', met: 10.0, icon: 'fitness' },
  { id: 'cycling', met: 6.0, icon: 'bicycle' },
  { id: 'swimming', met: 8.0, icon: 'water' },
  { id: 'gym', met: 5.0, icon: 'barbell' },
  { id: 'yoga', met: 3.0, icon: 'body' },
  { id: 'pilates', met: 3.5, icon: 'body' },
  { id: 'hiit', met: 8.0, icon: 'flash' },
  { id: 'basketball', met: 6.5, icon: 'basketball' },
  { id: 'football', met: 7.0, icon: 'football' },
];

/** Kalori = MET × kilo × saat (kullanıcının gerçek kilosuyla). */
export function exerciseCalories(met: number, durationMinutes: number, weightKg: number): number {
  if (durationMinutes <= 0 || weightKg <= 0) return 0;
  return Math.round(met * weightKg * (durationMinutes / 60));
}

/** 100 g değerlerinden verilen gram için besin değeri. */
export function scaleNutrients<T extends Macros & { calories: number }>(per100g: T, grams: number) {
  const f = grams / 100;
  const r1 = (n: number) => Math.round(n * f * 10) / 10;
  return {
    calories: Math.round(per100g.calories * f),
    protein: r1(per100g.protein),
    carbs: r1(per100g.carbs),
    fat: r1(per100g.fat),
  };
}
