-- WEZA Build — core schema
-- Postgres / Supabase compatible. All business-rule CHECK constraints kept verbatim.

set search_path = public, extensions;

-- Extensions ---------------------------------------------------------------
create extension if not exists "pgcrypto" with schema extensions;

-- Organizations ------------------------------------------------------------
create table if not exists organizations (
  id text primary key default ('org_' || encode(extensions.gen_random_bytes(8), 'hex')),
  name text not null,
  created_at timestamptz not null default now()
);

-- Profiles -----------------------------------------------------------------
-- Profiles are keyed by auth.users.id so RLS can use `auth.uid()` cleanly.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id text not null references organizations(id),
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('owner','certifier','contractor')),
  wallet_address text,
  created_at timestamptz not null default now()
);
create index if not exists idx_profiles_org on profiles(org_id);
create index if not exists idx_profiles_role on profiles(role);

-- Projects -----------------------------------------------------------------
create table if not exists projects (
  id text primary key default ('prj_' || encode(extensions.gen_random_bytes(8), 'hex')),
  org_id text not null references organizations(id),
  name text not null,
  code text not null,
  owner_id uuid not null references profiles(id),
  certifier_id uuid not null references profiles(id),
  contractor_id uuid not null references profiles(id),
  contract_value_usdc numeric(18,2) not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_projects_org on projects(org_id);
create index if not exists idx_projects_owner on projects(owner_id);
create index if not exists idx_projects_certifier on projects(certifier_id);
create index if not exists idx_projects_contractor on projects(contractor_id);

-- Milestones ---------------------------------------------------------------
create table if not exists milestones (
  id text primary key default ('mil_' || encode(extensions.gen_random_bytes(8), 'hex')),
  project_id text not null references projects(id),
  sequence integer not null,
  title text not null,
  scope text not null default '',
  payout_amount_usdc numeric(18,2) not null default 0,
  status text not null default 'awaiting_submission'
    check (status in ('awaiting_submission','under_review','approved','disputed','payout_triggered','settled')),
  payout_status text not null default 'not_ready'
    check (payout_status in ('not_ready','ready','triggered','confirmed','failed','held')),
  approval_tx_signature text,
  approval_pda text,
  approval_network text,
  payout_tx_signature text,
  payout_triggered_at timestamptz,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_milestones_project on milestones(project_id, sequence);
create index if not exists idx_milestones_status on milestones(status);
create index if not exists idx_milestones_payout_status on milestones(payout_status);

-- Submissions (one per milestone) -----------------------------------------
create table if not exists submissions (
  id text primary key default ('sub_' || encode(extensions.gen_random_bytes(8), 'hex')),
  milestone_id text not null unique references milestones(id),
  contractor_id uuid not null references profiles(id),
  status text not null default 'draft'
    check (status in ('draft','submitted','under_review','revision_requested','resubmitted','approved','rejected')),
  current_version integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_submissions_status on submissions(status);

-- Submission versions ------------------------------------------------------
-- storage_key points at an object inside the `submissions` Supabase Storage bucket.
create table if not exists submission_versions (
  id text primary key default ('sv_' || encode(extensions.gen_random_bytes(8), 'hex')),
  submission_id text not null references submissions(id),
  version integer not null,
  title text not null,
  note text not null default '',
  file_name text not null,
  file_sha256 text not null,
  file_size_bytes bigint not null default 0,
  storage_key text,
  submitted_by uuid not null references profiles(id),
  submitted_at timestamptz not null default now(),
  unique (submission_id, version)
);
create index if not exists idx_sv_submission on submission_versions(submission_id, version desc);

-- Review comments ----------------------------------------------------------
create table if not exists review_comments (
  id text primary key default ('cmt_' || encode(extensions.gen_random_bytes(8), 'hex')),
  submission_id text not null references submissions(id),
  version integer not null,
  author_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_comments_submission on review_comments(submission_id, created_at);

-- Approval decisions -------------------------------------------------------
create table if not exists approval_decisions (
  id text primary key default ('dec_' || encode(extensions.gen_random_bytes(8), 'hex')),
  submission_id text not null references submissions(id),
  version integer not null,
  certifier_id uuid not null references profiles(id),
  action text not null check (action in ('request_revision','approve','reject')),
  note text not null default '',
  approval_tx_signature text,
  approval_pda text,
  approval_network text,
  approval_recorded_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_decisions_submission on approval_decisions(submission_id, created_at);

-- Payout instructions ------------------------------------------------------
create table if not exists payout_instructions (
  id text primary key default ('po_' || encode(extensions.gen_random_bytes(8), 'hex')),
  milestone_id text not null references milestones(id),
  amount_usdc numeric(18,2) not null,
  recipient_wallet text not null,
  status text not null default 'ready'
    check (status in ('not_ready','ready','triggered','confirmed','failed','held')),
  tx_signature text,
  approval_tx_signature text,
  squads_multisig_pda text,
  squads_vault_pda text,
  squads_transaction_index text,
  squads_approval_tx_signature text,
  network text not null default 'solana-devnet',
  triggered_by uuid references profiles(id),
  triggered_at timestamptz,
  confirmed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now()
);
create index if not exists idx_payout_milestone on payout_instructions(milestone_id, created_at desc);

-- Audit logs ---------------------------------------------------------------
create table if not exists audit_logs (
  id text primary key default ('aud_' || encode(extensions.gen_random_bytes(8), 'hex')),
  org_id text not null references organizations(id),
  project_id text references projects(id),
  milestone_id text references milestones(id),
  submission_id text references submissions(id),
  actor_id uuid references profiles(id),
  actor_role text,
  actor_name text,
  action text not null,
  message text not null,
  tx_signature text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_project on audit_logs(project_id, created_at desc);
create index if not exists idx_audit_org on audit_logs(org_id, created_at desc);
create index if not exists idx_audit_milestone on audit_logs(milestone_id, created_at desc);

-- Trigger: profile auto-provisioning on auth.users insert ------------------
-- When a user signs up via Supabase Auth, the client passes user_metadata:
--   { full_name, role, org_id? (optional, contractors/certifiers join an org),
--     organization_name? (owners create a new org) }
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_full_name text;
  v_org_name text;
  v_org_id text;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'owner');
  v_full_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  if v_role = 'owner' then
    v_org_name := coalesce(
      nullif(new.raw_user_meta_data->>'organization_name', ''),
      v_full_name || '''s org'
    );
    insert into organizations (name) values (v_org_name)
      returning id into v_org_id;
  else
    -- Non-owners join the oldest existing org for the demo. A proper
    -- invite flow replaces this later without schema changes.
    select id into v_org_id from organizations order by created_at asc limit 1;
    if v_org_id is null then
      insert into organizations (name) values ('WEZA Network')
        returning id into v_org_id;
    end if;
  end if;

  insert into profiles (id, org_id, full_name, email, role)
  values (new.id, v_org_id, v_full_name, new.email, v_role);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated-at trigger for milestones ---------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists milestones_touch on milestones;
create trigger milestones_touch before update on milestones
  for each row execute function public.touch_updated_at();

drop trigger if exists submissions_touch on submissions;
create trigger submissions_touch before update on submissions
  for each row execute function public.touch_updated_at();
