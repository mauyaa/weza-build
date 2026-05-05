import { Pool, PoolClient, PoolConfig, QueryResult, QueryResultRow } from "pg";
import { env } from "./env";

/**
 * Server-side Postgres access for WEZA Build.
 *
 * Writes and privileged reads go through a `pg` Pool using the service-role
 * database connection. RLS policies in the DB only apply to Supabase's anon
 * and authenticated roles — the direct postgres superuser connection the
 * app uses bypasses RLS, which is the correct behaviour for server-side
 * business-rule enforcement. Client reads that should obey RLS go through
 * `@supabase/supabase-js` using the user's JWT (not wired into this app:
 * all reads today run through server components).
 */

export interface DbClientLike {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<{ rows: T[]; rowCount: number }>;
}

export interface DbDriver {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ): Promise<{ rows: T[]; rowCount: number }>;
  withTx<T>(fn: (client: DbClientLike) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

let _pool: Pool | null = null;
let _driver: DbDriver | null = null;

export function poolConfig(connectionString: string): PoolConfig {
  const sslDisabled = connectionString.includes("sslmode=disable");
  try {
    const url = new URL(connectionString);
    const sslMode = url.searchParams.get("sslmode");
    const ssl = sslMode === "disable" ? false : { rejectUnauthorized: false };

    for (const key of ["ssl", "sslmode", "sslcert", "sslkey", "sslrootcert"]) {
      url.searchParams.delete(key);
    }

    return {
      connectionString: url.toString(),
      max: 10,
      ssl,
    };
  } catch {
    return {
      connectionString,
      max: 10,
      ssl: sslDisabled ? false : { rejectUnauthorized: false },
    };
  }
}

function pgDriver(): DbDriver {
  if (!_pool) {
    const connectionString = env.databaseUrl();
    if (!connectionString) {
      if (env.isProduction()) {
        throw new Error("DATABASE_URL is required in production");
      }
      throw new Error(
        "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in."
      );
    }
    _pool = new Pool(poolConfig(connectionString));
  }
  return {
    async query<T extends QueryResultRow>(text: string, params: unknown[] = []) {
      const res: QueryResult<T> = await _pool!.query(text, params as never[]);
      return { rows: res.rows, rowCount: res.rowCount ?? res.rows.length };
    },
    async withTx<T>(fn: (client: DbClientLike) => Promise<T>): Promise<T> {
      const client: PoolClient = await _pool!.connect();
      try {
        await client.query("BEGIN");
        const adapted: DbClientLike = {
          async query<U extends QueryResultRow>(text: string, params: unknown[] = []) {
            const res: QueryResult<U> = await client.query(text, params as never[]);
            return { rows: res.rows, rowCount: res.rowCount ?? res.rows.length };
          },
        };
        const out = await fn(adapted);
        await client.query("COMMIT");
        return out;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    },
    async close() {
      if (_pool) {
        await _pool.end();
        _pool = null;
      }
    },
  };
}

function driver(): DbDriver {
  if (_driver) return _driver;
  return pgDriver();
}

/** Test-only: swap the driver for an in-process alternative (e.g. pglite). */
export function setDbDriver(d: DbDriver | null) {
  _driver = d;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<{ rows: T[]; rowCount: number }> {
  return driver().query<T>(text, params);
}

export async function withTx<T>(fn: (client: DbClientLike) => Promise<T>): Promise<T> {
  return driver().withTx(fn);
}

export async function closePool(): Promise<void> {
  await driver().close().catch(() => undefined);
  _driver = null;
}
