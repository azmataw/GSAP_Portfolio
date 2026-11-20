-- Klarus AI contact-form abuse control.
-- Run this SQL in the Klarus AI Supabase project BEFORE deploying API rate limiting.
-- Limits each pseudonymous sender key to 5 attempts per UTC clock hour.
-- Raw IP addresses and email addresses are never stored here.

create table if not exists public.contact_rate_limits (
  key_hash text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key_hash, window_start)
);

alter table public.contact_rate_limits enable row level security;
revoke all on public.contact_rate_limits from anon, authenticated;
grant select, insert, update on public.contact_rate_limits to service_role;

create or replace function public.try_contact_rate_limit(p_key_hash text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  allowed_hits integer;
begin
  if p_key_hash is null or length(p_key_hash) <> 64 or p_key_hash !~ '^[0-9a-f]+$' then
    return false;
  end if;

  insert into public.contact_rate_limits as rl (key_hash, window_start, hits)
  values (p_key_hash, date_trunc('hour', now()), 1)
  on conflict (key_hash, window_start) do update
    set hits = rl.hits + 1
    where rl.hits < 5
  returning hits into allowed_hits;

  return allowed_hits is not null;
end;
$function$;

revoke all on function public.try_contact_rate_limit(text) from public, anon, authenticated;
grant execute on function public.try_contact_rate_limit(text) to service_role;

-- Optional maintenance, execute periodically if needed:
-- delete from public.contact_rate_limits where window_start < now() - interval '30 days';
