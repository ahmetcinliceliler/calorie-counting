// Günlük kayıtlar cihazın YEREL tarihine göre anahtarlanır.
// toISOString() UTC döndürdüğü için gece yarısından sonraki kayıtları önceki güne yazıyordu.

export type DateKey = string; // YYYY-MM-DD

const pad = (n: number) => String(n).padStart(2, '0');

export function localDateKey(date: Date = new Date()): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: DateKey, days: number): DateKey {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return localDateKey(d);
}

export function isFuture(key: DateKey, today: DateKey = localDateKey()): boolean {
  return key > today;
}

/** Bugün dahil son `count` günün anahtarları, eskiden yeniye. */
export function lastNDays(count: number, end: DateKey = localDateKey()): DateKey[] {
  return Array.from({ length: count }, (_, i) => addDays(end, i - (count - 1)));
}

export function formatDisplayDate(key: DateKey, today: DateKey = localDateKey()): string {
  if (key === today) return 'today';
  if (key === addDays(today, -1)) return 'yesterday';
  return key.split('-').reverse().join('.');
}
