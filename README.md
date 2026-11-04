# 구독장부

대학생·취준생이 AI·OTT·배달 등 구독료를 줄이도록, 통신사·카드·멤버십 결합 혜택과 제휴 할인을 공식 출처에서 모아 **내 조건에 맞는 최저 조합과 할인만** 보여주는 웹서비스.

- 최저가: 서비스별 가입 경로 비교, 조합 계산기(최저 조합 3개 + 카드 추천)
- 할인: 카드 제휴 · 통신사 제휴 · 플랫폼 연계 (보유 브랜드·자격으로 맞춤 필터)
- 신뢰성: 모든 값에 출처 종류와 확인일, 공식 페이지에서 확인 못 한 값은 "확인 필요"

Next.js 16 (App Router) · Tailwind CSS 4 · Supabase (Postgres, Auth) · Vitest

## 처음 설정

```bash
npm install
cp .env.example .env.local   # 값 채우기 (.env.local 은 git에 올라가지 않음)
npm run migrate              # supabase/migrations 적용
npm run seed                 # 브랜드·소스·요금제·카드·수동 확인 딜
npm run crawl                # 자동 수집 4곳 + 공식 페이지 변경 감지
npm run dev                  # http://localhost:3000
```

## 스크립트

| 명령 | 하는 일 |
|---|---|
| `npm run crawl` | SKT T 멤버십, LG U+, 현대카드, KB국민카드 수집 → 태깅 → 저장, 안 보인 딜 비활성화, 실행 기록 |
| `npm run crawl -- --source kb-events --dry-run` | 한 소스만, DB에 쓰지 않고 결과만 출력 |
| `npm run seed` | `scripts/catalog.ts`(요금제·카드·수동 딜)와 `supabase/seed/*.json` 적재. 가격을 고치면 다시 실행 |
| `npm run check` | RLS, 익명 접근 범위, 맞춤 매칭 함수 점검 |
| `npm run artifact` | 프로덕션 빌드 후 실사용 모드 아티팩트 `.artifact/index.html`을 만든다. 공개 카탈로그만 담고, 화면은 실제 사이트의 뷰 컴포넌트(`components/views`)를 브라우저에서 그린다. 보는 사람의 조건은 아티팩트의 개인 저장소(로그인 시) 또는 브라우저에 저장 |
| `npm run demo-link` | 시연용 계정의 1회용 로그인 링크 출력 (메일 발송 없이). 화면 공유 중에는 실행하지 말 것 |
| `npm test` | 조합 계산·파서·태깅·robots.txt 단위 테스트 |

## 수집 원칙

robots.txt 준수, 같은 호스트 요청 간격 1.2초 이상, 식별 가능한 User-Agent, 로그인 필요 페이지 제외, 제목·혜택 요약·기간·원문 링크만 저장. 자동 수집이 막힌 소스(신한·삼성카드: robots.txt 금지, KT: 접속 불가, 네이버페이: 로그인 필요, 카카오페이·토스: 공개 목록 없음)는 공식 페이지에서 사람이 확인한 항목만 수동 등록하고 사유를 `/about`에 공개한다.

## 문서

- `PRODUCT.md` 제품 정의 · `DESIGN.md` 디자인 시스템("월말 정산 노트")
- `supabase/migrations/0001_init.sql` 스키마·RLS·맞춤 매칭 함수
