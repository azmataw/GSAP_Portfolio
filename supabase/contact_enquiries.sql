create table if not exists public.contact_enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  message text not null,
  created_at timestamptz not null default now()
);
alter table public.contact_enquiries enable row level security;
-- No anon/authenticated policies: submissions go through the server function only.
revoke all on public.contact_enquiries from anon, authenticated;

-- Explicit table privilege required for the server-side service_role.
grant insert on public.contact_enquiries to service_role;
