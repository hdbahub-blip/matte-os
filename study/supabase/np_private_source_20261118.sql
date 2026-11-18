-- Applied 2026-11-18 to the verified Matte OS Supabase project.
-- Structure only; NEVER put the novel payload, access hash or student credentials in git.
-- One private school document, claimable exactly once by one authenticated grade-9 learner.
create table if not exists public.np_private_school_source (
  source_key text primary key check (source_key = 'en-stark-nolla'),
  material jsonb not null,
  material_sha256 text not null check (material_sha256 ~ '^[0-9a-f]{64}$'),
  claim_hash text not null check (claim_hash ~ '^[0-9a-f]{64}$'),
  claim_expires_at timestamptz not null,
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint np_school_source_json_object check (jsonb_typeof(material)='object')
);
alter table public.np_private_school_source enable row level security;
revoke all on public.np_private_school_source from public, anon, authenticated;
grant select (source_key, material, material_sha256)
  on public.np_private_school_source to authenticated;
create policy np_private_source_only_claimed_learner
on public.np_private_school_source for select to authenticated
using (claimed_by=(select auth.uid()) and exists (
  select 1 from public.study_profiles p
  where p.user_id=(select auth.uid()) and p.role='learner' and p.grade='grade9'
));
create or replace function public.np_claim_school_source(p_secret text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := (select auth.uid());
declare v_claimed text;
begin
 if v_user is null or p_secret is null or length(p_secret) not between 40 and 90
    or p_secret !~ '^[A-Za-z0-9_-]+$' then return false; end if;
 if coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then return false; end if;
 if not exists (
  select 1 from public.study_profiles p
  where p.user_id=v_user and p.role='learner' and p.grade='grade9'
 ) then return false; end if;
 update public.np_private_school_source n
 set claimed_by=v_user,claimed_at=now(),updated_at=now()
 where n.source_key='en-stark-nolla' and n.claimed_by is null
 and n.claim_expires_at>now()
 and n.claim_hash=encode(extensions.digest(convert_to(p_secret,'utf8'),'sha256'),'hex')
 returning n.source_key into v_claimed;
 return v_claimed is not null;
end;
$$;
revoke all on function public.np_claim_school_source(text) from public,anon,authenticated;
grant execute on function public.np_claim_school_source(text) to authenticated;
