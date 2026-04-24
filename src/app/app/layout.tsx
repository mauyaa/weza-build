import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentProfile } from "@/lib/session";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/");
  const h = headers();
  const currentPath = h.get("x-weza-path") ?? undefined;
  return (
    <AppShell profile={profile} currentPath={currentPath}>
      {children}
    </AppShell>
  );
}
