import { redirect } from "next/navigation";
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
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="5" fill="#0e121c" stroke="#34d399" />
              <path d="M6 16l3-8 3 6 3-6 3 8" stroke="#34d399" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xl font-semibold tracking-tight">WEZA Build</span>
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Approval-to-payout<br />for construction.
          </h1>
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
        <LoginForm />
      </div>
    </div>
  );
}
