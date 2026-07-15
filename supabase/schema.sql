create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  invite_code text not null,
  owner_user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid,
  name text not null,
  role text not null check (role in ('admin', 'staff', 'member')),
  join_method text not null check (join_method in ('approval', 'invite')),
  status text not null check (status in ('pending', 'approved')),
  created_at timestamptz not null default now()
);

create table if not exists screenings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  subtitle text not null default '',
  venue text not null,
  starts_at timestamptz not null,
  capacity integer not null default 0,
  registrations integer not null default 0,
  poster_url text not null default '',
  status text not null check (status in ('draft', 'published', 'closed')),
  curator_note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists feedback_entries (
  id uuid primary key default gen_random_uuid(),
  screening_id uuid not null references screenings(id) on delete cascade,
  rating numeric(2,1) not null,
  comment text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  screening_id uuid references screenings(id) on delete set null,
  type text not null check (type in ('review', 'notice')),
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  author text not null,
  published_at timestamptz not null default now()
);
