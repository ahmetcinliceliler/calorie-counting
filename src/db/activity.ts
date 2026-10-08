import { newId, nowIso } from '@/lib/id';
import type { Db } from './types';

// ---- Egzersiz --------------------------------------------------------------

export interface ExerciseEntry {
  id: string;
  day: string;
  exerciseType: string;
  durationMin: number;
  kcal: number;
}

export async function addExercise(db: Db, e: Omit<ExerciseEntry, 'id'> & { id?: string }): Promise<ExerciseEntry> {
  const entry = { ...e, id: e.id ?? newId(), kcal: Math.round(e.kcal) };
  const now = nowIso();
  await db.runAsync(
    `INSERT INTO exercise_entries (id, day, exercise_type, duration_min, kcal, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [entry.id, entry.day, entry.exerciseType, entry.durationMin, entry.kcal, now, now],
  );
  return entry;
}

export async function deleteExercise(db: Db, id: string): Promise<void> {
  const now = nowIso();
  await db.runAsync('UPDATE exercise_entries SET deleted_at = ?, updated_at = ?, synced = 0 WHERE id = ?', [now, now, id]);
}

export async function getExercises(db: Db, day: string): Promise<ExerciseEntry[]> {
  return db.getAllAsync<ExerciseEntry>(
    `SELECT id, day, exercise_type AS exerciseType, duration_min AS durationMin, kcal
       FROM exercise_entries WHERE day = ? AND deleted_at IS NULL ORDER BY created_at`,
    [day],
  );
}

// ---- Su --------------------------------------------------------------------

export const MAX_WATER_ML = 20_000;

export async function getWater(db: Db, day: string): Promise<number> {
  const row = await db.getFirstAsync<{ ml: number }>('SELECT ml FROM water WHERE day = ?', [day]);
  return row?.ml ?? 0;
}

/**
 * Su miktarını delta kadar değiştirir (0 ile üst sınır arasında); yeni değeri döner.
 * Tek ifadede yapılır: art arda hızlı dokunuşlar birbirinin üzerine yazmasın.
 */
export async function addWater(db: Db, day: string, deltaMl: number): Promise<number> {
  await db.runAsync(
    `INSERT INTO water (day, ml, updated_at) VALUES (?, MIN(?, MAX(0, ?)), ?)
     ON CONFLICT(day) DO UPDATE SET
       ml = MIN(?, MAX(0, water.ml + ?)), updated_at = excluded.updated_at, synced = 0`,
    [day, MAX_WATER_ML, deltaMl, nowIso(), MAX_WATER_ML, deltaMl],
  );
  return getWater(db, day);
}

// ---- Kilo ------------------------------------------------------------------

export interface WeightLog {
  day: string;
  weightKg: number;
}

export async function logWeight(db: Db, day: string, weightKg: number): Promise<void> {
  await db.runAsync(
    `INSERT INTO weight_logs (day, weight_kg, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(day) DO UPDATE SET weight_kg = excluded.weight_kg, updated_at = excluded.updated_at, synced = 0`,
    [day, Math.round(weightKg * 10) / 10, nowIso()],
  );
}

export async function getWeightLogs(db: Db, limit = 90): Promise<WeightLog[]> {
  const rows = await db.getAllAsync<WeightLog>(
    'SELECT day, weight_kg AS weightKg FROM weight_logs ORDER BY day DESC LIMIT ?',
    [limit],
  );
  return rows.reverse();
}

// ---- Meta ------------------------------------------------------------------

export async function getMeta(db: Db, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM meta WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function setMeta(db: Db, key: string, value: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
}
