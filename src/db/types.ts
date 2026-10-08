// expo-sqlite'ın SQLiteDatabase'inin kullandığımız alt kümesi.
// Testlerde aynı arayüz sql.js ile sağlanır; repository kodu ikisinde de aynı çalışır.

export type SqlParam = string | number | null;

export interface Db {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: SqlParam[]): Promise<{ changes: number }>;
  getAllAsync<T>(sql: string, params: SqlParam[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params: SqlParam[]): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
