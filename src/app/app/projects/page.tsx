import { getCurrentProfile } from "@/lib/session";
import { listProjectsForUser } from "@/lib/repo";
import { ProjectsTable } from "./projects-table";

export default async function ProjectsPage() {
  const profile = (await getCurrentProfile())!;
  const projects = await listProjectsForUser(profile);
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
      <ProjectsTable projects={projects} role={profile.role} />
    </div>
  );
}
