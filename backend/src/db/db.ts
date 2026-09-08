import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { ENV } from '../config/env.js';

export interface IDatabase {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
  run(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowid?: number | bigint }>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

class SqliteDatabaseAdapter implements IDatabase {
  private db: DatabaseSync;

  constructor(dbPath: string) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new DatabaseSync(dbPath);
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA foreign_keys = ON;');
  }

  private normalizeSql(sql: string): string {
    // Convert PostgreSQL parameter placeholders $1, $2 to ? for SQLite
    return sql.replace(/\$(\d+)/g, '?');
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const normalized = this.normalizeSql(sql);
    const stmt = this.db.prepare(normalized);
    return stmt.all(...params) as T[];
  }

  public async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const normalized = this.normalizeSql(sql);
    const stmt = this.db.prepare(normalized);
    return (stmt.get(...params) as T) || undefined;
  }

  public async run(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid?: number | bigint }> {
    const normalized = this.normalizeSql(sql);
    const stmt = this.db.prepare(normalized);
    const result = stmt.run(...params);
    return {
      changes: Number(result.changes),
      lastInsertRowid: result.lastInsertRowid,
    };
  }

  public async exec(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  public async close(): Promise<void> {
    this.db.close();
  }
}

class PostgresDatabaseAdapter implements IDatabase {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString });
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const res = await this.pool.query(sql, params);
    return res.rows as T[];
  }

  public async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const res = await this.pool.query(sql, params);
    return (res.rows[0] as T) || undefined;
  }

  public async run(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid?: number | bigint }> {
    const res = await this.pool.query(sql, params);
    return { changes: res.rowCount || 0 };
  }

  public async exec(sql: string): Promise<void> {
    await this.pool.query(sql);
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}

let dbInstance: IDatabase | null = null;

export async function getDb(): Promise<IDatabase> {
  if (dbInstance) return dbInstance;

  if (ENV.DATABASE_URL && !ENV.USE_EMBEDDED_DB) {
    try {
      console.log('[DATABASE] Connecting to PostgreSQL database...');
      const pgAdapter = new PostgresDatabaseAdapter(ENV.DATABASE_URL);
      await pgAdapter.query('SELECT 1');
      console.log('[DATABASE] Connected to PostgreSQL successfully.');
      dbInstance = pgAdapter;
      return dbInstance;
    } catch (err: any) {
      console.warn(`[DATABASE] PostgreSQL connection failed (${err.message}). Falling back to embedded relational engine.`);
    }
  }

  console.log(`[DATABASE] Initializing embedded relational engine at ${ENV.DATABASE_FILE}...`);
  const sqliteAdapter = new SqliteDatabaseAdapter(ENV.DATABASE_FILE);
  dbInstance = sqliteAdapter;

  // Initialize schema if needed
  const schemaPath = path.resolve(process.cwd(), 'src/db/schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    // Execute DDL statements
    sqliteAdapter.exec(schemaSql);
  }

  return dbInstance;
}
