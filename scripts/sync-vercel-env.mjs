/* eslint-disable no-console */
/**
 * Reads .env.local and pushes each allowlisted key to Vercel (production,
 * preview, development). Does not print secret values.
 *
 * Usage: node scripts/sync-vercel-env.mjs
 * Requires: npx vercel (logged in), .env.local in repo root.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env.local");

const ALLOW = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "WEZA_STORAGE_BUCKET",
  "SOLANA_RPC_URL",
  "SOLANA_CLUSTER",
  "SOLANA_TREASURY_KEYPAIR",
];

const SKIP = new Set(["NODE_TLS_REJECT_UNAUTHORIZED"]);

/** Keys stored as Vercel "sensitive" (hidden in dashboard UI). */
function isSensitive(name) {
  return (
    name === "SUPABASE_SERVICE_ROLE_KEY" ||
    name === "DATABASE_URL" ||
    name === "SOLANA_TREASURY_KEYPAIR"
  );
}

function parseDotEnv(raw) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (k && v) out[k] = v;
  }
  return out;
}

function runVercelEnvAdd(name, targetEnv, value) {
  const args = [
    "vercel",
    "env",
    "add",
    name,
    targetEnv,
    "--value",
    value,
    "--yes",
    "--force",
    ...(isSensitive(name) ? ["--sensitive"] : []),
  ];
  const envClean = { ...process.env };
  delete envClean.NODE_TLS_REJECT_UNAUTHORIZED;
  const r = spawnSync("npx", args, {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    shell: process.platform === "win32",
    env: envClean,
  });
  if (r.status !== 0) {
    const err = (r.stderr || r.stdout || "").trim();
    throw new Error(`vercel env add ${name} ${targetEnv} failed: ${err || r.status}`);
  }
}

if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local — create it from .env.example first.");
  process.exit(1);
}

const raw = fs.readFileSync(envPath, "utf8");
const vars = parseDotEnv(raw);

if (vars.NEXT_PUBLIC_SUPABASE_URL && !vars.SUPABASE_URL) {
  vars.SUPABASE_URL = vars.NEXT_PUBLIC_SUPABASE_URL;
}
if (vars.NEXT_PUBLIC_SUPABASE_ANON_KEY && !vars.SUPABASE_ANON_KEY) {
  vars.SUPABASE_ANON_KEY = vars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

// Preview on Vercel often requires an explicit git branch; production is enough
// for the primary *.vercel.app URL. Add Preview/Dev vars in the dashboard if needed.
const targets = ["production"];
let n = 0;
for (const key of ALLOW) {
  if (SKIP.has(key)) continue;
  const value = vars[key];
  if (!value) continue;
  for (const target of targets) {
    runVercelEnvAdd(key, target, value);
    n++;
  }
}

console.log(`Synced ${n} env entries to Vercel (${targets.length} environments × keys present in .env.local).`);
console.log("Run: npx vercel deploy --prod --yes");
