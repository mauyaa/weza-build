import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Profile } from "@/lib/types";

const navByRole: Record<Profile["role"], { href: string; label: string }[]> = {
  owner: [
    { href: "/app", label: "Dashboard" },
    { href: "/app/projects", label: "Projects" },
    { href: "/app/audit", label: "Audit" },
  ],
  certifier: [
    { href: "/app", label: "Dashboard" },
    { href: "/app/projects", label: "Projects" },
    { href: "/app/audit", label: "Audit" },
  ],
  contractor: [
    { href: "/app", label: "Dashboard" },
    { href: "/app/projects", label: "Projects" },
    { href: "/app/audit", label: "Audit" },
  ],
};

export function AppShell({
  profile,
  currentPath,
  children,
}: {
  profile: Profile;
  currentPath?: string;
  children: React.ReactNode;
}) {
  const nav = navByRole[profile.role];
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 h-14 flex items-center gap-6">
          <Link href="/app" className="flex items-center gap-2">
            <Logo />
            <span className="font-semibold tracking-tight text-ink-900">WEZA Build</span>
          </Link>
          <nav className="flex items-center gap-1 ml-4">
            {nav.map((item) => {
              const active = currentPath === item.href || (item.href !== "/app" && currentPath?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition",
                    active
                      ? "bg-ink-900 text-white"
                      : "text-ink-600 hover:text-ink-900 hover:bg-ink-100"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-ink-500 hidden md:inline">Devnet</span>
            <RolePill role={profile.role} />
            <div className="text-sm text-ink-700 hidden sm:block">{profile.full_name}</div>
            <form action="/api/auth/logout" method="post">
              <button className="btn-ghost" type="submit">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

function RolePill({ role }: { role: Profile["role"] }) {
  const cls = {
    owner: "bg-ink-900 text-white",
    certifier: "bg-violet-600 text-white",
    contractor: "bg-brand-600 text-white",
  }[role];
  const label = role[0].toUpperCase() + role.slice(1);
  return (
    <span className={cn("text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold", cls)}>
      {label}
    </span>
  );
}

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="5" className="fill-ink-900" />
      <path d="M6 16l3-8 3 6 3-6 3 8" stroke="#34d399" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
