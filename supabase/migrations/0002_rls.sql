-- Row-Level Security for WEZA Build.
-- Client reads via anon/authenticated role go through these policies.
-- All writes happen server-side with the service_role key, which bypasses RLS.

-- Helper: membership predicates ------------------------------------------
-- A user can see a project if their profile is owner/certifier/contractor on it.
create or replace function public.is_project_member(p_project_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from projects p
    where p.id = p_project_id
      and auth.uid() in (p.owner_id, p.certifier_id, p.contractor_id)
  );
$$;

create or replace function public.same_org(p_org_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles pr
    where pr.id = auth.uid() and pr.org_id = p_org_id
  );
$$;

-- Enable RLS on every user-facing table ----------------------------------
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table projects enable row level security;
alter table milestones enable row level security;
alter table submissions enable row level security;
alter table submission_versions enable row level security;
alter table review_comments enable row level security;
alter table approval_decisions enable row level security;
alter table payout_instructions enable row level security;
alter table audit_logs enable row level security;

-- Organizations ----------------------------------------------------------
drop policy if exists org_read_self on organizations;
create policy org_read_self on organizations
  for select using (same_org(id));

-- Profiles ---------------------------------------------------------------
drop policy if exists profiles_read_self on profiles;
create policy profiles_read_self on profiles
  for select using (id = auth.uid() or same_org(org_id));

-- Projects ---------------------------------------------------------------
drop policy if exists projects_read_member on projects;
create policy projects_read_member on projects
  for select using (
    auth.uid() in (owner_id, certifier_id, contractor_id)
  );

-- Milestones -------------------------------------------------------------
drop policy if exists milestones_read_member on milestones;
create policy milestones_read_member on milestones
  for select using (is_project_member(project_id));

-- Submissions ------------------------------------------------------------
drop policy if exists submissions_read_member on submissions;
create policy submissions_read_member on submissions
  for select using (
    exists (
      select 1 from milestones m where m.id = submissions.milestone_id
        and is_project_member(m.project_id)
    )
  );

-- Submission versions ----------------------------------------------------
drop policy if exists sv_read_member on submission_versions;
create policy sv_read_member on submission_versions
  for select using (
    exists (
      select 1 from submissions s
        join milestones m on m.id = s.milestone_id
      where s.id = submission_versions.submission_id
        and is_project_member(m.project_id)
    )
  );

-- Review comments --------------------------------------------------------
drop policy if exists comments_read_member on review_comments;
create policy comments_read_member on review_comments
  for select using (
    exists (
      select 1 from submissions s
        join milestones m on m.id = s.milestone_id
      where s.id = review_comments.submission_id
        and is_project_member(m.project_id)
    )
  );

-- Approval decisions -----------------------------------------------------
drop policy if exists decisions_read_member on approval_decisions;
create policy decisions_read_member on approval_decisions
  for select using (
    exists (
      select 1 from submissions s
        join milestones m on m.id = s.milestone_id
      where s.id = approval_decisions.submission_id
        and is_project_member(m.project_id)
    )
  );

-- Payout instructions ----------------------------------------------------
drop policy if exists payouts_read_member on payout_instructions;
create policy payouts_read_member on payout_instructions
  for select using (
    exists (
      select 1 from milestones m where m.id = payout_instructions.milestone_id
        and is_project_member(m.project_id)
    )
  );

-- Audit logs -------------------------------------------------------------
drop policy if exists audit_read_org on audit_logs;
create policy audit_read_org on audit_logs
  for select using (
    project_id is null and same_org(org_id)
    or (project_id is not null and is_project_member(project_id))
  );

-- Deliberately NO insert / update / delete policies.
-- All writes go through server-side routes using the service_role key.
-- This is the recommended Supabase pattern for business-rule enforcement.
