-- 구독·할인 통합 비교 서비스 스키마
-- 카탈로그(brands, plans, cards, sources, deals)는 누구나 읽고 크롤러(service role)만 쓴다.
-- 사용자 테이블(user_profiles, user_brands)은 본인 행만 읽고 쓴다.

create table public.brands (
  id text primary key,
  kind text not null check (kind in ('telecom', 'card_issuer', 'pay', 'platform', 'service')),
  category text check (category in ('ott', 'ai', 'delivery', 'etc')),
  name text not null,
  aliases text[] not null default '{}',
  official_domains text[] not null default '{}',
  homepage text,
  sort_order integer not null default 0
);

-- 가입 경로: 본사 직접 가입, 통신사 구독팩, 멤버십 결합 등
create table public.plans (
  id text primary key,
  name text not null,
  seller_brand_id text not null references public.brands (id),
  route text not null check (route in ('official', 'telecom', 'membership', 'platform')),
  price_monthly integer not null check (price_monthly >= 0),
  owned_price integer check (owned_price >= 0),
  billing text not null default 'monthly' check (billing in ('monthly', 'annual')),
  includes jsonb not null,
  requires_brand_ids text[] not null default '{}',
  eligibility text[] not null default '{}',
  exclusive_group text,
  payment text not null default 'direct' check (payment in ('direct', 'bill')),
  conditions text[] not null default '{}',
  source_url text not null,
  source_trust text not null check (source_trust in ('official', 'public', 'platform', 'press')),
  checked_at date not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'needs_check')),
  watch_url text,
  watch_selector text,
  content_hash text
);

-- 구독 할인 카드 (추천용)
create table public.cards (
  id text primary key,
  issuer_brand_id text not null references public.brands (id),
  name text not null,
  annual_fee integer not null default 0,
  min_prev_month_spend integer not null default 0,
  discount_kind text not null check (discount_kind in ('rate', 'amount')),
  discount_value integer not null,
  monthly_cap integer,
  eligible_service_ids text[] not null default '{}',
  notes text[] not null default '{}',
  source_url text not null,
  source_trust text not null check (source_trust in ('official', 'public', 'platform', 'press')),
  checked_at date not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'needs_check')),
  watch_url text,
  watch_selector text,
  content_hash text
);

-- 할인 수집 소스. mode='seed'는 자동 수집이 막혀 공식 페이지 확인 데이터로 채운 소스
create table public.sources (
  id text primary key,
  brand_id text not null references public.brands (id),
  deal_type text not null check (deal_type in ('card', 'telecom', 'platform')),
  name text not null,
  url text not null,
  mode text not null default 'crawl' check (mode in ('crawl', 'seed')),
  note text,
  last_run_at timestamptz,
  last_status text,
  last_count integer
);

create table public.crawl_runs (
  id bigint generated always as identity primary key,
  source_id text not null references public.sources (id),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'ok', 'empty', 'error', 'blocked')),
  items_found integer,
  error text
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references public.sources (id),
  external_id text not null,
  deal_type text not null check (deal_type in ('card', 'telecom', 'platform')),
  category text not null default 'etc'
    check (category in ('subscription', 'cafe', 'cvs', 'shopping', 'food', 'travel', 'culture', 'etc')),
  related_service_ids text[] not null default '{}',
  title text not null,
  benefit_text text,
  merchant text,
  starts_at date,
  ends_at date,
  url text not null,
  eligibility text[] not null default '{}',
  is_active boolean not null default true,
  source_trust text not null default 'official' check (source_trust in ('official', 'public', 'platform', 'press')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (source_id, external_id)
);

create index deals_active_idx on public.deals (is_active, ends_at);

-- 딜을 받으려면 모두 갖춰야 하는 브랜드 (AND)
create table public.deal_requirements (
  deal_id uuid not null references public.deals (id) on delete cascade,
  brand_id text not null references public.brands (id),
  primary key (deal_id, brand_id)
);

create index deal_requirements_brand_idx on public.deal_requirements (brand_id);

create table public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  age_band text check (age_band in ('teen', '19-24', '25-29', '30-34', '35-39', '40-64', '65+')),
  roles text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.user_brands (
  user_id uuid not null references auth.users (id) on delete cascade,
  brand_id text not null references public.brands (id),
  primary key (user_id, brand_id)
);

create index user_brands_brand_idx on public.user_brands (brand_id);

-- RLS
alter table public.brands enable row level security;
alter table public.plans enable row level security;
alter table public.cards enable row level security;
alter table public.sources enable row level security;
alter table public.crawl_runs enable row level security;
alter table public.deals enable row level security;
alter table public.deal_requirements enable row level security;
alter table public.user_profiles enable row level security;
alter table public.user_brands enable row level security;

create policy "catalog readable" on public.brands for select to anon, authenticated using (true);
create policy "catalog readable" on public.plans for select to anon, authenticated using (true);
create policy "catalog readable" on public.cards for select to anon, authenticated using (true);
create policy "catalog readable" on public.sources for select to anon, authenticated using (true);
create policy "catalog readable" on public.deals for select to anon, authenticated using (true);
create policy "catalog readable" on public.deal_requirements for select to anon, authenticated using (true);

create policy "own profile" on public.user_profiles for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own brands" on public.user_brands for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 맞춤 할인: 요구 브랜드를 모두 갖고, 자격 태그가 있으면 하나 이상 해당해야 노출
create function public.matching_deals(p_brand_ids text[], p_elig text[])
returns setof public.deals
language sql stable
set search_path = ''
as $$
  select d.* from public.deals d
  where d.is_active
    and (cardinality(d.eligibility) = 0 or d.eligibility && p_elig)
    and not exists (
      select 1 from public.deal_requirements r
      where r.deal_id = d.id and r.brand_id <> all (p_brand_ids)
    )
$$;
