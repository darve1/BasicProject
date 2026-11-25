-- 사용자가 지금 쓰는 요금제 등급 (서비스 id → 등급 이름). 적은 구독은 그 등급으로만 최저 조합을 견준다
alter table public.user_profiles add column service_tiers jsonb not null default '{}';
