import { sql, ensureSchema } from './db';

// Counts wrong passwords in the database, so every server instance sees the same count.

/** Seconds left to wait if `key` has used up its tries, otherwise 0. */
export async function tooManyAttempts(key: string, max: number): Promise<number> {
  await ensureSchema();
  const rows = await sql<{ count: number; wait: number }[]>`
    select count, ceil(extract(epoch from (expires_at - now())))::int as wait
    from login_attempts where key = ${key} and expires_at > now()`;
  const row = rows[0];
  return row && row.count >= max ? Math.max(1, row.wait) : 0;
}

export async function hit(key: string, seconds = 60): Promise<void> {
  await sql`
    insert into login_attempts (key, count, expires_at)
    values (${key}, 1, now() + make_interval(secs => ${seconds}))
    on conflict (key) do update set
      count = case when login_attempts.expires_at > now() then login_attempts.count + 1 else 1 end,
      expires_at = case when login_attempts.expires_at > now() then login_attempts.expires_at
                        else now() + make_interval(secs => ${seconds}) end`;
  await sql`delete from login_attempts where expires_at < now() - interval '1 hour'`;
}

export async function clear(key: string): Promise<void> {
  await sql`delete from login_attempts where key = ${key}`;
}
