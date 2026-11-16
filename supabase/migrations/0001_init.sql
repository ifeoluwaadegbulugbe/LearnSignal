-- LearnSignal schema. Based on master prompt §9 with these deliberate changes (see docs/ASSUMPTIONS.md):
--  * assessment_items.id is text ('N4-2-1') and has NO answer column. Answer keys live only in
--    server code (lib/content/items.seed.ts), so no client can ever select them.
--  * exercises.id is text-or-uuid compatible (uuid default; seeded rows use fixed uuids from gen-seed).
--  * skill_states gets a retest_suggested flag (single-bad-day safeguard surfaced in the UI).
--  * assessment_sessions gets an optional `ended_early` flag; item_responses keeps oral-reading detail in `response`.
--  * exercises_insert allows the creator to insert rows (source='ai'); seeded rows are inserted by seed.sql.
--  * demo_accounts table marks the shared public demo account (learner-mode exit PIN disabled).

create extension if not exists pgcrypto;

-- Identity and tenancy
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  ai_enabled boolean not null default true, -- per-teacher AI switch (Settings); AI_ENABLED env is the global switch
  created_at timestamptz not null default now()
);
create table schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  state text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);
create table school_members (
  school_id uuid not null references schools(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('admin','teacher')),
  primary key (school_id, user_id)
);
create table classrooms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  grade_label text not null,
  language text not null default 'en',
  is_demo boolean not null default false,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);
create table classroom_teachers (
  classroom_id uuid not null references classrooms(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  primary key (classroom_id, user_id)
);
create table learners (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references classrooms(id) on delete cascade,
  code text not null unique default ('LS-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,6))),
  display_name text not null check (char_length(display_name) between 1 and 30 and btrim(display_name) <> ''),
  age_band text check (age_band in ('5-6','7-8','9-10','11+')),
  consent_confirmed boolean not null default false check (consent_confirmed),
  consent_confirmed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create index learners_classroom_idx on learners(classroom_id) where archived_at is null;

-- Content (reference data, no child data)
create table skills (
  id text primary key,
  strand text not null check (strand in ('literacy','numeracy')),
  sequence int not null,
  name text not null,
  objective text not null,
  unique (strand, sequence)
);
create table assessment_items (
  id text primary key,
  skill_id text not null references skills(id),
  difficulty int not null check (difficulty between 1 and 3),
  type text not null check (type in ('mcq','numeric','tap_word_sequence','listen_choose')),
  content jsonb not null,
  created_at timestamptz not null default now()
);
create index items_skill_idx on assessment_items(skill_id, difficulty);

-- Assessment evidence
create table assessment_sessions (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references learners(id) on delete cascade,
  strand text not null check (strand in ('literacy','numeracy')),
  kind text not null check (kind in ('baseline','reassessment')),
  administered_by uuid not null references profiles(id),
  ended_early boolean not null default false,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index sessions_learner_idx on assessment_sessions(learner_id, started_at desc);
create table item_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references assessment_sessions(id) on delete cascade,
  learner_id uuid not null references learners(id) on delete cascade,
  item_id text not null references assessment_items(id),
  skill_id text not null references skills(id),
  correct boolean,
  response jsonb,
  time_ms int,
  created_at timestamptz not null default now(),
  unique (session_id, item_id)
);
create index responses_learner_skill_idx on item_responses(learner_id, skill_id);

create table skill_states (
  learner_id uuid not null references learners(id) on delete cascade,
  skill_id text not null references skills(id),
  state text not null check (state in ('insufficient','not_yet','developing','consistent')),
  p numeric(4,3) not null,
  n_eff numeric(6,2) not null,
  sessions int not null,
  confidence text not null check (confidence in ('low','medium','high')),
  provisional boolean not null,
  retest_suggested boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (learner_id, skill_id)
);
create table skill_state_history (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references learners(id) on delete cascade,
  skill_id text not null references skills(id),
  session_id uuid references assessment_sessions(id) on delete set null,
  state text not null, p numeric(4,3) not null,
  created_at timestamptz not null default now()
);
create index state_hist_idx on skill_state_history(learner_id, skill_id, created_at);

-- Intervention
create table recommendations (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references learners(id) on delete cascade,
  skill_id text not null references skills(id),
  source text not null check (source in ('rules','ai')),
  rationale text not null,
  status text not null default 'suggested' check (status in ('suggested','accepted','dismissed')),
  created_at timestamptz not null default now()
);
create table intervention_groups (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references classrooms(id) on delete cascade,
  strand text not null,
  target_skill_id text not null references skills(id),
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now()
);
create table group_members (
  group_id uuid not null references intervention_groups(id) on delete cascade,
  learner_id uuid not null references learners(id) on delete cascade,
  primary key (group_id, learner_id)
);
create table exercises (
  id uuid primary key default gen_random_uuid(),
  skill_id text not null references skills(id),
  difficulty int not null check (difficulty between 1 and 3),
  language text not null default 'en',
  content jsonb not null,
  source text not null check (source in ('seed','ai')),
  validation jsonb,
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create table assignments (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references learners(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  assigned_by uuid not null references profiles(id),
  status text not null default 'assigned' check (status in ('assigned','completed')),
  created_at timestamptz not null default now()
);
create table exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  learner_id uuid not null references learners(id) on delete cascade,
  skill_id text not null references skills(id),
  correct_count int not null, total int not null,
  responses jsonb not null,
  completed_at timestamptz not null default now()
);
create table teacher_notes (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references learners(id) on delete cascade,
  author_id uuid not null references profiles(id),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create table ai_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  kind text not null, tokens_in int, tokens_out int, ok boolean not null,
  created_at timestamptz not null default now()
);
create index ai_logs_user_time_idx on ai_logs(user_id, created_at desc);
create table demo_accounts (
  user_id uuid primary key references profiles(id) on delete cascade
);

-- Create a profile row automatically on signup
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id, full_name) values (new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name',''), 'Teacher'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Helper functions (security definer, fixed search_path)
create or replace function is_school_admin(sid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from school_members where school_id = sid and user_id = auth.uid() and role = 'admin') $$;
create or replace function is_classroom_teacher(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from classroom_teachers where classroom_id = cid and user_id = auth.uid()) $$;
create or replace function can_access_learner(lid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from learners l join classroom_teachers ct on ct.classroom_id = l.classroom_id
                 where l.id = lid and ct.user_id = auth.uid()) $$;
create or replace function is_demo_account() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from demo_accounts where user_id = auth.uid()) $$;

-- Onboarding RPCs (atomic, no service role needed)
create or replace function create_school(p_name text, p_state text) returns uuid
language plpgsql security definer set search_path = public as $$
declare sid uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into schools(name, state, created_by) values (btrim(p_name), nullif(btrim(p_state),''), auth.uid()) returning id into sid;
  insert into school_members(school_id, user_id, role) values (sid, auth.uid(), 'admin');
  return sid;
end $$;
create or replace function create_classroom(p_school uuid, p_name text, p_grade text, p_language text) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if not exists (select 1 from school_members where school_id = p_school and user_id = auth.uid()) then
    raise exception 'not a member of this school'; end if;
  insert into classrooms(school_id, name, grade_label, language, created_by)
    values (p_school, btrim(p_name), btrim(p_grade), coalesce(p_language,'en'), auth.uid()) returning id into cid;
  insert into classroom_teachers(classroom_id, user_id) values (cid, auth.uid());
  return cid;
end $$;

-- Aggregate-only insight functions for admins (no learner names or codes returned)
create or replace function school_state_distribution(sid uuid)
returns table(classroom_id uuid, classroom_name text, skill_id text, state text, learners bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_school_admin(sid) then raise exception 'forbidden'; end if;
  return query
    select c.id, c.name, s.skill_id, s.state, count(*)
    from classrooms c join learners l on l.classroom_id = c.id and l.archived_at is null
    join skill_states s on s.learner_id = l.id
    where c.school_id = sid group by c.id, c.name, s.skill_id, s.state;
end $$;
create or replace function school_overview(sid uuid)
returns table(classroom_id uuid, classroom_name text, learners bigint, assessed bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_school_admin(sid) then raise exception 'forbidden'; end if;
  return query
    select c.id, c.name, count(l.id),
           count(l.id) filter (where exists (select 1 from assessment_sessions a where a.learner_id = l.id and a.completed_at is not null))
    from classrooms c left join learners l on l.classroom_id = c.id and l.archived_at is null
    where c.school_id = sid group by c.id, c.name;
end $$;

-- Row Level Security
alter table profiles enable row level security;
alter table schools enable row level security;
alter table school_members enable row level security;
alter table classrooms enable row level security;
alter table classroom_teachers enable row level security;
alter table learners enable row level security;
alter table skills enable row level security;
alter table assessment_items enable row level security;
alter table assessment_sessions enable row level security;
alter table item_responses enable row level security;
alter table skill_states enable row level security;
alter table skill_state_history enable row level security;
alter table recommendations enable row level security;
alter table intervention_groups enable row level security;
alter table group_members enable row level security;
alter table exercises enable row level security;
alter table assignments enable row level security;
alter table exercise_attempts enable row level security;
alter table teacher_notes enable row level security;
alter table ai_logs enable row level security;
alter table demo_accounts enable row level security;

create policy profiles_self on profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy schools_member_read on schools for select
  using (exists (select 1 from school_members m where m.school_id = schools.id and m.user_id = auth.uid()));
create policy schools_admin_update on schools for update using (is_school_admin(id));
create policy schools_admin_delete on schools for delete using (is_school_admin(id));
create policy members_self_read on school_members for select using (user_id = auth.uid() or is_school_admin(school_id));
create policy classrooms_teacher on classrooms for select using (is_classroom_teacher(id));
create policy classrooms_teacher_update on classrooms for update using (is_classroom_teacher(id));
create policy classrooms_teacher_delete on classrooms for delete using (is_classroom_teacher(id));
create policy ct_read on classroom_teachers for select using (user_id = auth.uid());
create policy learners_all on learners for all
  using (is_classroom_teacher(classroom_id)) with check (is_classroom_teacher(classroom_id));
create policy skills_read on skills for select to authenticated using (true);
create policy items_read on assessment_items for select to authenticated using (true);
create policy sessions_all on assessment_sessions for all
  using (can_access_learner(learner_id)) with check (can_access_learner(learner_id) and administered_by = auth.uid());
create policy responses_all on item_responses for all
  using (can_access_learner(learner_id)) with check (can_access_learner(learner_id));
create policy states_all on skill_states for all
  using (can_access_learner(learner_id)) with check (can_access_learner(learner_id));
create policy state_hist_all on skill_state_history for all
  using (can_access_learner(learner_id)) with check (can_access_learner(learner_id));
create policy recs_all on recommendations for all
  using (can_access_learner(learner_id)) with check (can_access_learner(learner_id));
create policy groups_all on intervention_groups for all
  using (is_classroom_teacher(classroom_id)) with check (is_classroom_teacher(classroom_id));
create policy group_members_all on group_members for all
  using (can_access_learner(learner_id)) with check (can_access_learner(learner_id));
create policy exercises_read on exercises for select to authenticated
  using (source = 'seed' or created_by = auth.uid());
create policy exercises_insert on exercises for insert to authenticated with check (created_by = auth.uid() and source = 'ai');
create policy exercises_update on exercises for update using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy assignments_all on assignments for all
  using (can_access_learner(learner_id)) with check (can_access_learner(learner_id) and assigned_by = auth.uid());
create policy attempts_all on exercise_attempts for all
  using (can_access_learner(learner_id)) with check (can_access_learner(learner_id));
create policy notes_all on teacher_notes for all
  using (can_access_learner(learner_id) and author_id = auth.uid())
  with check (can_access_learner(learner_id) and author_id = auth.uid());
create policy ai_logs_own on ai_logs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy demo_self_read on demo_accounts for select using (user_id = auth.uid());

-- Assignment guard: only approved exercises can be assigned (enforced in the database, not only the UI).
create or replace function assignments_require_approved() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from exercises where id = new.exercise_id and review_status = 'approved') then
    raise exception 'exercise must be approved before it can be assigned';
  end if;
  return new;
end $$;
create trigger assignments_require_approved before insert on assignments
  for each row execute function assignments_require_approved();
