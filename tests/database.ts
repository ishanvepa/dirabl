import initSqlJs from 'sql.js';
import type { Database } from '../app/src/services/database/migrations';
export async function database(bytes?: Uint8Array) {
  const SQL = await initSqlJs();
  const native = new SQL.Database(bytes);
  const db: Database = {
    async execAsync(sql) {
      native.exec(sql);
    },
    async runAsync(sql, ...params) {
      native.run(sql, params);
      return { changes: native.getRowsModified() };
    },
    async getFirstAsync<T>(sql: string, ...params: (string | number | null)[]) {
      return (await db.getAllAsync<T>(sql, ...params))[0] ?? null;
    },
    async getAllAsync<T>(sql: string, ...params: (string | number | null)[]) {
      const stmt = native.prepare(sql);
      try {
        stmt.bind(params);
        const rows: T[] = [];
        while (stmt.step()) rows.push(stmt.getAsObject() as T);
        return rows;
      } finally {
        stmt.free();
      }
    },
    async withTransactionAsync(task) {
      native.run('BEGIN');
      try {
        await task();
        native.run('COMMIT');
      } catch (e) {
        native.run('ROLLBACK');
        throw e;
      }
    },
  };
  return { db, native };
}
