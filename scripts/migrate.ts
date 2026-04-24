/* eslint-disable no-console */
/**
 * Apply SQL migrations from supabase/migrations/ to the Postgres specified
 * by DATABASE_URL. Idempotent: uses CREATE IF NOT EXISTS everywhere and
 * a schema_migrations table to track applied files.
 *
 * For Supabase-hosted Postgres you can alternatively run:
 *   supabase db push
 * This script mirrors that behaviour so CI can apply migrations without
 * the Supabase CLI installed.
 */
import fs from "node:fs";
import path from "node:path";
import { closePool, query } from "../src/lib/db";

async function main() {
  const dir = path.join(process.cwd(), "supabase", "migrations");
  if (!fs.existsSync(dir)) {
    throw new Error("supabase/migrations directory not found");
  }
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    );
  `);
  const applied = new Set(
    (await query<{ name: string }>("SELECT name FROM schema_migrations")).rows.map((r) => r.name)
  );
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`• ${file} already applied`);
      continue;
    }
    console.log(`→ applying ${file}`);
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    await query(sql);
    await query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
  }
  console.log("Migrations complete.");
  await closePool();
}

main().catch(async (err) => {
  console.error("Migration failed:", err);
  await closePool();
  process.exit(1);
});
