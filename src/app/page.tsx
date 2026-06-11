import { redirect } from "next/navigation";
import { WezaMark } from "@/components/brand-logo";
import { DeployConfigBanner } from "@/components/deploy-config-banner";
import { getCurrentProfile } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await getCurrentProfile()) redirect("/app");
  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex flex-1 relative overflow-hidden bg-ink-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.18),_transparent_60%),_radial-gradient(ellipse_at_bottom_right,_rgba(139,92,246,0.16),_transparent_60%)]" />
        <div className="relative z-10 m-auto px-12 max-w-lg">
          <div className="flex items-center gap-2 mb-12">
            <WezaMark className="h-7 w-7" />
            <span className="text-xl font-semibold tracking-tight">WEZA Build</span>
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Approval becomes<br />verifiable payout proof.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ink-300">
            WEZA uses Solana for verifiable payout proof linked directly to construction milestone approvals.
          </p>
          <div className="mt-8 rounded-xl border border-white/15 bg-white/5 p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-300">Try the demo flow</div>
            <ol className="mt-3 space-y-2 text-sm text-ink-200">
              <li><span className="mono text-brand-300">1.</span> Contractor submits a milestone package</li>
              <li><span className="mono text-brand-300">2.</span> Certifier approves the submission</li>
              <li><span className="mono text-brand-300">3.</span> Owner triggers the Solana payout</li>
              <li><span className="mono text-brand-300">4.</span> Open the signature and audit trail</li>
            </ol>
          </div>
          <div className="mt-10">
            <a
              href="/about"
              className="text-sm text-ink-300 hover:text-white underline underline-offset-4"
            >
              What is WEZA Build? →
            </a>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <DeployConfigBanner />
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
