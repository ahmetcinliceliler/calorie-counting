import type { Db } from './types';

// Yerel şema. Sunucu şemasıyla (supabase/migrations) aynı alanlar; ek olarak `synced`
// bayrağı, giriş yapan kullanıcı için senkronizasyon (Aşama 4) bunu kullanacak.
// Her yeni sürüm diziye EKLENİR; eskiler asla değiştirilmez.
const MIGRATIONS: string[] = [
  `
  CREATE TABLE food_entries (
    id TEXT PRIMARY KEY NOT NULL,
    day TEXT NOT NULL,
    meal TEXT NOT NULL,
    food_key TEXT,
    name TEXT NOT NULL,
    grams REAL NOT NULL,
    portion_label TEXT,
    kcal REAL NOT NULL,
    protein REAL NOT NULL DEFAULT 0,
    carbs REAL NOT NULL DEFAULT 0,
    fat REAL NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'manual',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    synced INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX food_entries_day_idx ON food_entries (day);

  CREATE TABLE exercise_entries (
    id TEXT PRIMARY KEY NOT NULL,
    day TEXT NOT NULL,
    exercise_type TEXT NOT NULL,
    duration_min INTEGER NOT NULL,
    kcal REAL NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    synced INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX exercise_entries_day_idx ON exercise_entries (day);

  CREATE TABLE water (
    day TEXT PRIMARY KEY NOT NULL,
    ml INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    synced INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE weight_logs (
    day TEXT PRIMARY KEY NOT NULL,
    weight_kg REAL NOT NULL,
    updated_at TEXT NOT NULL,
    synced INTEGER NOT NULL DEFAULT 0
  );

  -- Katalog dışı yiyeceklerin (barkod, AI, kullanıcı) kopyası: favori/geçmişten yeniden eklemek için.
  CREATE TABLE foods (
    key TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    kcal_100g REAL NOT NULL,
    protein_100g REAL NOT NULL DEFAULT 0,
    carbs_100g REAL NOT NULL DEFAULT 0,
    fat_100g REAL NOT NULL DEFAULT 0,
    portions_json TEXT NOT NULL DEFAULT '[]',
    source TEXT NOT NULL,
    barcode TEXT,
    image_url TEXT,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX foods_barcode_idx ON foods (barcode);

  CREATE TABLE favorites (
    food_key TEXT PRIMARY KEY NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE food_usage (
    food_key TEXT PRIMARY KEY NOT NULL,
    use_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TEXT NOT NULL,
    last_grams REAL
  );

  CREATE TABLE meta (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
];

export const DB_VERSION = MIGRATIONS.length;

export async function migrate(db: Db): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
  const current = row?.user_version ?? 0;
  if (current >= DB_VERSION) return;

  for (let v = current; v < DB_VERSION; v++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[v]);
      // Sabit sayı; kullanıcı girdisi değil.
      await db.execAsync(`PRAGMA user_version = ${v + 1}`);
    });
  }
}
