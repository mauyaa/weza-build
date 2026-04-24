import { env } from "@/lib/env";

/** Shown on / and /signup when Supabase server env is missing (e.g. empty Vercel project). */
export function DeployConfigBanner() {
  if (env.isSupabaseServerReady()) return null;
  return (
    <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="font-semibold">Supabase is not configured on this host</p>
      <p className="mt-1 text-amber-900/90 leading-relaxed">
        Add environment variables in Vercel (Project → Settings → Environment Variables), then redeploy. From your laptop, run{" "}
        <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">node scripts/sync-vercel-env.mjs</code>{" "}
        to copy <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">.env.local</code> into the project.
      </p>
    </div>
  );
}
