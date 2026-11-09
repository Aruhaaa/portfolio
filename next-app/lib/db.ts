import postgres, { type Sql } from 'postgres';
import { SCHEMA_SQL, TABLES } from './schema';

const g = globalThis as unknown as { __pg?: Sql; __schema?: Promise<void> };

// The connection is made on first use, so building the site does not need a database.
function client(): Sql {
  if (!g.__pg) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) {
      throw new Error('DATABASE_URL is not set. On Vercel: Storage tab, add a Postgres database to this project.');
    }
    const local = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url);
    // Hosts like Neon add options to the link (channel_binding, sslmode) that postgres.js would send to the
    // server as unknown settings. The secure connection is set below instead.
    const link = new URL(url);
    for (const key of ['channel_binding', 'sslmode', 'pgbouncer', 'connect_timeout']) link.searchParams.delete(key);
    g.__pg = postgres(link.toString(), {
      ssl: local ? false : 'require',
      max: 5,
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: false, // works with Neon's pooled connection too
    });
  }
  return g.__pg;
}

// `sql` can be used like postgres.js's own: sql`select ...`, sql.json(...), sql.begin(...)
export const sql = new Proxy((() => {}) as unknown as Sql, {
  apply: (_target, _self, args) => (client() as unknown as (...a: unknown[]) => unknown)(...args),
  get: (_target, prop) => Reflect.get(client() as object, prop),
}) as Sql;

/** Creates the tables the first time the site runs against an empty database. */
export function ensureSchema(): Promise<void> {
  if (!g.__schema) {
    g.__schema = (async () => {
      const rows = await sql<{ n: number }[]>`
        select count(*)::int as n from information_schema.tables
        where table_schema = 'public' and table_name = any(${TABLES})`;
      if (rows[0].n < TABLES.length) {
        // One request at a time creates the tables, even when several start together
        await sql.begin(async (tx) => {
          await tx`select pg_advisory_xact_lock(727272)`;
          await tx.unsafe(SCHEMA_SQL);
        });
      }
    })().catch((err) => {
      g.__schema = undefined;
      throw err;
    });
  }
  return g.__schema;
}
