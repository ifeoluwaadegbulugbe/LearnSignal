-- Per-teacher AI on/off switch (Settings). Safe to run more than once.
-- Already included in 0001_init.sql for fresh installs; this file is for databases created before it was added.
alter table profiles add column if not exists ai_enabled boolean not null default true;
