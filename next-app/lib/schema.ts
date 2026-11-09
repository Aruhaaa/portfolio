// The tables. They are created on first use (see ensureSchema in db.ts), so there is no separate migrate step.
export const TABLES = ['personal_info', 'skills', 'experiences', 'projects', 'project_images', 'login_attempts'];

export const SCHEMA_SQL = `
create table if not exists personal_info (
  id integer primary key default 1,
  name text not null,
  title text not null,
  bio text not null,
  email text not null,
  github text,
  linkedin text,
  updated_at timestamptz not null default now()
);

create table if not exists skills (
  id serial primary key,
  category text not null,
  items jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0
);

create table if not exists experiences (
  id serial primary key,
  role text not null,
  company text not null,
  duration text not null,
  description text not null,
  sort_order integer not null default 0
);

create table if not exists projects (
  id serial primary key,
  title text not null,
  description text not null,
  tech_stack jsonb not null default '[]'::jsonb,
  link text,
  repo_link text,
  featured boolean not null default false,
  is_hero boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Screenshots live in the database, so the site works on hosts with no permanent disk
create table if not exists project_images (
  project_id integer primary key references projects(id) on delete cascade,
  mime text not null,
  hash text not null,
  data bytea not null,
  updated_at timestamptz not null default now()
);

-- Failed sign-ins, for the login limit
create table if not exists login_attempts (
  key text primary key,
  count integer not null default 0,
  expires_at timestamptz not null
);
`;
