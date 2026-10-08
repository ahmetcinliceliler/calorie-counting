// YALNIZCA TESTLER İÇİN: Db arayüzünün sql.js (SQLite → WebAssembly) ile uygulaması.
import initSqlJs, { type Database, type SqlValue } from 'sql.js';

import { migrate } from '../migrations';
import type { Db, SqlParam } from '../types';

function rowsOf<T>(raw: Database, sql: string, params: SqlParam[]): T[] {
  const stmt = raw.prepare(sql);
  try {
    stmt.bind(params as SqlValue[]);
    const rows: T[] = [];
    while (stmt.step()) rows.push(stmt.getAsObject() as T);
    return rows;
  } finally {
    stmt.free();
  }
}

export async function createTestDb(options: { migrate?: boolean } = {}): Promise<Db & { raw: Database }> {
  const SQL = await initSqlJs();
  const raw = new SQL.Database();

  const db: Db & { raw: Database } = {
    raw,
    async execAsync(sql) {
      raw.exec(sql);
    },
    async runAsync(sql, params) {
      raw.run(sql, params as SqlValue[]);
      return { changes: raw.getRowsModified() };
    },
    async getAllAsync<T>(sql: string, params: SqlParam[]) {
      return rowsOf<T>(raw, sql, params);
    },
    async getFirstAsync<T>(sql: string, params: SqlParam[]) {
      return rowsOf<T>(raw, sql, params)[0] ?? null;
    },
    async withTransactionAsync(task) {
      raw.exec('BEGIN');
      try {
        await task();
        raw.exec('COMMIT');
      } catch (err) {
        raw.exec('ROLLBACK');
        throw err;
      }
    },
  };

  if (options.migrate !== false) await migrate(db);
  return db;
}
