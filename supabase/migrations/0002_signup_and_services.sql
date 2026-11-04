-- 출처(근거)와 별개로 사용자가 실제로 가입하는 공식 페이지 주소
alter table public.plans add column signup_url text;
alter table public.cards add column signup_url text;

-- 사용자가 쓰는(또는 쓰려는) 구독 서비스. 홈 추천과 정산표의 기준이 된다
alter table public.user_profiles add column services text[] not null default '{}';
