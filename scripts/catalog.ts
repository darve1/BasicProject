// 최저가 카탈로그(가입 경로·카드)와 수집이 막힌 소스의 시드 딜.
// 원칙: 공식 페이지에서 직접 본 값만 status=confirmed. 보도·플랫폼 출처, 달러 결제(환율 변동)는 needs_check.
// 확인일 2026-11-03. 가격이 바뀌면 이 파일을 고치고 npm run seed 를 다시 돌린다.
import type { Card, Plan, PlanInclude } from "../lib/types";

const CHECKED = "2026-11-03";
const USD_KRW = 1400; // 달러 결제 상품의 원화 환산 기준 (부가세 10% 별도 가산)
const usd = (dollars: number) => Math.round((dollars * USD_KRW * 1.1) / 100) * 100;

const URL = {
  netflix: "https://help.netflix.com/ko/node/24926",
  tving: "https://www.tving.com/membership/tving",
  wavve: "https://www.wavve.com/voucher",
  disney: "https://www.disneyplus.com/ko-kr",
  coupangplay: "https://www.coupangplay.com/",
  udok: "https://www.lguplus.com/pogg/magazine/2026-%EA%B5%AC%EB%8F%85%EB%A3%8C-%EC%A0%88%EA%B0%90-%EC%99%84%EB%B2%BD-%EA%B0%80%EC%9D%B4%EB%93%9C",
  youtubeLite: "https://www.khan.co.kr/article/202511271530001/",
  chatgpt: "https://chatgpt.com/pricing",
  chatgptGo: "https://nextplatform.net/?p=8817",
  claude: "https://claude.com/pricing",
  googleAi: "https://one.google.com/about/ai-premium",
  perplexity: "https://www.perplexity.ai/pro",
  spotify: "https://www.banksalad.com/articles/%EC%8A%A4%ED%8F%AC%ED%8B%B0%ED%8C%8C%EC%9D%B4-%EA%B0%80%EA%B2%A9-%EC%9A%94%EA%B8%88%EC%A0%9C-%EB%AC%B4%EB%A3%8C-%ED%95%B4%EC%A7%80-%ED%99%98%EB%B6%88",
  naverplus: "https://nid.naver.com/membership/join",
  coupangwow: "https://www.coupang.com/",
  baemin: "https://www.baemin.com/",
  yogipass: "https://byline.network/?p=9004111222504559",
  sktYtLite: "https://news.sktelecom.com/tag/%ec%9c%a0%ed%8a%9c%eb%b8%8c%ed%94%84%eb%a6%ac%eb%af%b8%ec%97%84",
  ktYtLite: "https://www.heraldk.com/article/2026041318391148399",
  ktTving: "https://www.ddaily.co.kr/page/view/2026052609054620819",
  cardsBanksalad:
    "https://www.banksalad.com/articles/%EB%84%B7%ED%94%8C%EB%A6%AD%EC%8A%A4-%EC%9A%94%EA%B8%88%EC%A0%9C%EC%99%80-%EA%B0%80%EA%B2%A9-%EA%B3%84%EC%A0%95-%EA%B3%B5%EC%9C%A0-%EA%B8%88%EC%A7%80%EA%B9%8C%EC%A7%80",
  cardsDaum: "https://v.daum.net/v/YquCz6EQHN",
};

// 사용자가 실제로 가입하는 공식 페이지. 출처(source_url)가 보도라도 링크는 여기로 보낸다
const SIGNUP: Record<string, string> = {
  netflix: "https://www.netflix.com/kr/",
  tving: "https://www.tving.com/membership/tving",
  wavve: "https://www.wavve.com/voucher",
  disney: "https://www.disneyplus.com/ko-kr",
  coupangplay: "https://www.coupangplay.com/",
  youtube: "https://www.youtube.com/premium",
  chatgpt: "https://chatgpt.com/pricing",
  claude: "https://claude.com/pricing",
  gemini: "https://one.google.com/about/ai-premium",
  perplexity: "https://www.perplexity.ai/pro",
  spotify: "https://www.spotify.com/kr-ko/premium/",
  naverplus: "https://nid.naver.com/membership/join",
  coupangwow: "https://www.coupang.com/",
  baeminclub: "https://www.baemin.com/",
  yogipass: "https://www.yogiyo.co.kr/",
  lgu: "https://www.lguplus.com/pogg",
  skt: "https://m.sktuniverse.co.kr/",
  kt: "https://my.kt.com/product/OttSubscribeView.do",
};
const ISSUER_HOME: Record<string, string> = {
  nhcard: "https://card.nonghyup.com/",
  hanacard: "https://www.hanacard.co.kr/",
  samsungcard: "https://www.samsungcard.com/",
};

type PlanSeed = Omit<Plan, "owned_price" | "billing" | "requires_brand_ids" | "eligibility" | "exclusive_group" | "payment" | "conditions" | "checked_at" | "status"> &
  Partial<Plan> & { watch_url?: string | null; watch_selector?: string | null };

const p = (x: PlanSeed) => ({
  owned_price: null,
  billing: "monthly" as const,
  requires_brand_ids: [],
  eligibility: [],
  exclusive_group: null,
  payment: "direct" as const,
  conditions: [],
  checked_at: CHECKED,
  status: "confirmed" as const,
  watch_url: null,
  watch_selector: null,
  content_hash: null, // 시드를 다시 넣는 것은 사람이 다시 확인했다는 뜻이므로 감시 기준값도 새로 잡는다
  ...x,
});
const inc = (service_id: string, tier?: string, ads?: boolean): PlanInclude => ({ service_id, tier, ads });

const PLAN_LIST = [
  // 넷플릭스 (공식 도움말 페이지에서 확인)
  p({ id: "netflix-ads", name: "넷플릭스 광고형 스탠다드", seller_brand_id: "netflix", route: "official", price_monthly: 7000, includes: [inc("netflix", "광고형 스탠다드", true)], exclusive_group: "netflix", source_url: URL.netflix, source_trust: "official", watch_url: URL.netflix }),
  p({ id: "netflix-standard", name: "넷플릭스 스탠다드", seller_brand_id: "netflix", route: "official", price_monthly: 13500, includes: [inc("netflix", "스탠다드", false)], exclusive_group: "netflix", source_url: URL.netflix, source_trust: "official" }),
  p({ id: "netflix-premium", name: "넷플릭스 프리미엄", seller_brand_id: "netflix", route: "official", price_monthly: 17000, includes: [inc("netflix", "프리미엄", false)], exclusive_group: "netflix", source_url: URL.netflix, source_trust: "official" }),

  // 티빙 (공식 이용권 페이지). '기간 한정' 표기는 2027-01-31까지
  p({ id: "tving-ads", name: "티빙 광고형 스탠다드", seller_brand_id: "tving", route: "official", price_monthly: 5500, includes: [inc("tving", "광고형 스탠다드", true)], exclusive_group: "tving", conditions: ["기간 한정 표기(2026-10-06~2027-01-31)"], source_url: URL.tving, source_trust: "official" }),
  p({ id: "tving-basic", name: "티빙 베이직", seller_brand_id: "tving", route: "official", price_monthly: 9500, includes: [inc("tving", "베이직", false)], exclusive_group: "tving", conditions: ["기간 한정 표기(2026-10-06~2027-01-31)"], source_url: URL.tving, source_trust: "official" }),
  p({ id: "tving-standard", name: "티빙 스탠다드", seller_brand_id: "tving", route: "official", price_monthly: 13500, includes: [inc("tving", "스탠다드", false)], exclusive_group: "tving", source_url: URL.tving, source_trust: "official" }),
  p({ id: "tving-premium", name: "티빙 프리미엄", seller_brand_id: "tving", route: "official", price_monthly: 17000, includes: [inc("tving", "프리미엄", false)], exclusive_group: "tving", conditions: ["Apple TV 제공은 11/23 종료 예정"], source_url: URL.tving, source_trust: "official" }),
  // 티빙×웨이브 더블 이용권 (웨이브 공식 페이지)
  p({ id: "double-ads", name: "티빙×웨이브 더블 광고형 스탠다드", seller_brand_id: "tving", route: "platform", price_monthly: 7000, includes: [inc("tving", "광고형 스탠다드", true), inc("wavve", "광고형 스탠다드", true)], exclusive_group: "tving", source_url: URL.wavve, source_trust: "official" }),
  p({ id: "double-basic", name: "티빙×웨이브 더블 베이직", seller_brand_id: "tving", route: "platform", price_monthly: 13500, includes: [inc("tving", "베이직", false), inc("wavve", "베이직", false)], exclusive_group: "tving", conditions: ["TV 시청은 티빙만"], source_url: URL.wavve, source_trust: "official" }),
  p({ id: "double-standard", name: "티빙×웨이브 더블 스탠다드", seller_brand_id: "tving", route: "platform", price_monthly: 15000, includes: [inc("tving", "스탠다드", false), inc("wavve", "스탠다드", false)], exclusive_group: "tving", source_url: URL.wavve, source_trust: "official" }),
  p({ id: "double-premium", name: "티빙×웨이브 더블 프리미엄", seller_brand_id: "tving", route: "platform", price_monthly: 19500, includes: [inc("tving", "프리미엄", false), inc("wavve", "프리미엄", false)], exclusive_group: "tving", source_url: URL.wavve, source_trust: "official" }),
  p({ id: "tving-disney", name: "티빙×디즈니+ 더블", seller_brand_id: "tving", route: "platform", price_monthly: 18000, includes: [inc("tving", "스탠다드", false), inc("disney", "스탠다드", false)], exclusive_group: "tving", source_url: URL.tving, source_trust: "official" }),
  p({ id: "tving-3pack", name: "티빙·웨이브·디즈니+ 3 PACK", seller_brand_id: "tving", route: "platform", price_monthly: 21500, includes: [inc("tving", "스탠다드", false), inc("wavve", "스탠다드", false), inc("disney", "스탠다드", false)], exclusive_group: "tving", source_url: URL.tving, source_trust: "official" }),

  // 웨이브 단품: 공식 페이지에서 단품 가격을 직접 읽지 못해 확인 필요
  p({ id: "wavve-ads", name: "웨이브 광고형", seller_brand_id: "wavve", route: "official", price_monthly: 5500, includes: [inc("wavve", "광고형", true)], exclusive_group: "wavve", status: "needs_check", conditions: ["단품 가격은 공식 페이지에서 직접 확인하지 못함"], source_url: URL.wavve, source_trust: "official" }),
  p({ id: "wavve-basic", name: "웨이브 베이직", seller_brand_id: "wavve", route: "official", price_monthly: 7900, includes: [inc("wavve", "베이직", false)], exclusive_group: "wavve", status: "needs_check", source_url: URL.wavve, source_trust: "official" }),
  p({ id: "wavve-standard", name: "웨이브 스탠다드", seller_brand_id: "wavve", route: "official", price_monthly: 10900, includes: [inc("wavve", "스탠다드", false)], exclusive_group: "wavve", status: "needs_check", source_url: URL.wavve, source_trust: "official" }),
  p({ id: "wavve-premium", name: "웨이브 프리미엄", seller_brand_id: "wavve", route: "official", price_monthly: 13900, includes: [inc("wavve", "프리미엄", false)], exclusive_group: "wavve", status: "needs_check", source_url: URL.wavve, source_trust: "official" }),

  // 디즈니+ (공식). 기존 회원은 11/10부터 인상 예정 공지
  p({ id: "disney-standard", name: "디즈니+ 스탠다드", seller_brand_id: "disney", route: "official", price_monthly: 9900, includes: [inc("disney", "스탠다드", false)], exclusive_group: "disney", conditions: ["기존 멤버십 가격 11/10부터 인상 공지"], source_url: URL.disney, source_trust: "official" }),
  p({ id: "disney-premium", name: "디즈니+ 프리미엄", seller_brand_id: "disney", route: "official", price_monthly: 13900, includes: [inc("disney", "프리미엄", false)], exclusive_group: "disney", source_url: URL.disney, source_trust: "official" }),
  p({ id: "disney-standard-annual", name: "디즈니+ 스탠다드 연간", seller_brand_id: "disney", route: "official", billing: "annual", price_monthly: 8250, includes: [inc("disney", "스탠다드", false)], exclusive_group: "disney", conditions: ["연 99,000원 일시 결제"], source_url: URL.disney, source_trust: "official" }),

  // 쿠팡플레이: 쿠팡 회원이면 광고와 함께 무료 (공식)
  p({ id: "coupangplay-free", name: "쿠팡플레이 일반 회원(광고형)", seller_brand_id: "coupangplay", route: "official", price_monthly: 0, includes: [inc("coupangplay", "일반 회원 광고형", true)], conditions: ["일부 콘텐츠는 와우 멤버십·패스 필요"], source_url: URL.coupangplay, source_trust: "official" }),

  // 유튜브 프리미엄 (보도 기준)
  p({ id: "youtube-premium", name: "유튜브 프리미엄", seller_brand_id: "youtube", route: "official", price_monthly: 14900, includes: [inc("youtube", "프리미엄(뮤직 포함)", false)], exclusive_group: "youtube", status: "needs_check", conditions: ["웹·Android 결제 기준, iOS 인앱은 더 비쌈"], source_url: URL.youtubeLite, source_trust: "press" }),
  p({ id: "youtube-lite", name: "유튜브 프리미엄 라이트", seller_brand_id: "youtube", route: "official", price_monthly: 8500, includes: [inc("youtube", "라이트(뮤직 제외)", false)], exclusive_group: "youtube", status: "needs_check", conditions: ["유튜브 뮤직 미포함", "웹·Android 결제 기준"], source_url: URL.youtubeLite, source_trust: "press" }),

  // AI 구독. 달러 결제는 1달러=1,400원·부가세 10% 기준 환산
  p({ id: "chatgpt-go", name: "ChatGPT Go", seller_brand_id: "chatgpt", route: "official", price_monthly: 15000, includes: [inc("chatgpt", "Go")], exclusive_group: "chatgpt", status: "needs_check", source_url: URL.chatgptGo, source_trust: "press" }),
  p({ id: "chatgpt-plus", name: "ChatGPT Plus", seller_brand_id: "chatgpt", route: "official", price_monthly: usd(20), includes: [inc("chatgpt", "Plus")], exclusive_group: "chatgpt", status: "needs_check", conditions: ["US$20 + 부가세, 원화 금액은 환율에 따라 달라짐"], source_url: URL.chatgpt, source_trust: "official" }),
  p({ id: "claude-pro", name: "Claude Pro", seller_brand_id: "claude", route: "official", price_monthly: usd(20), includes: [inc("claude", "Pro")], exclusive_group: "claude", status: "needs_check", conditions: ["US$20 + 부가세, 원화 금액은 환율에 따라 달라짐"], source_url: URL.claude, source_trust: "official" }),
  p({ id: "claude-pro-annual", name: "Claude Pro 연간", seller_brand_id: "claude", route: "official", billing: "annual", price_monthly: usd(17), includes: [inc("claude", "Pro")], exclusive_group: "claude", status: "needs_check", conditions: ["연간 결제 시 월 US$17 상당"], source_url: URL.claude, source_trust: "official" }),
  p({ id: "google-ai-plus", name: "Google AI Plus", seller_brand_id: "gemini", route: "official", price_monthly: 11000, includes: [inc("gemini", "AI Plus")], exclusive_group: "gemini", status: "needs_check", conditions: ["원화 고정 가격"], source_url: URL.googleAi, source_trust: "official" }),
  p({ id: "google-ai-pro", name: "Google AI Pro", seller_brand_id: "gemini", route: "official", price_monthly: 29000, includes: [inc("gemini", "AI Pro")], exclusive_group: "gemini", status: "needs_check", conditions: ["원화 고정 가격, Google One 2TB 포함"], source_url: URL.googleAi, source_trust: "official" }),
  p({ id: "perplexity-pro", name: "Perplexity Pro", seller_brand_id: "perplexity", route: "official", price_monthly: usd(20), includes: [inc("perplexity", "Pro")], exclusive_group: "perplexity", status: "needs_check", conditions: ["US$20 + 부가세"], source_url: URL.perplexity, source_trust: "official" }),

  // 음악·기타
  p({ id: "spotify-basic", name: "스포티파이 프리미엄 베이직", seller_brand_id: "spotify", route: "official", price_monthly: 7900, includes: [inc("spotify", "베이직(오프라인 저장 불가)")], exclusive_group: "spotify", status: "needs_check", source_url: URL.spotify, source_trust: "platform" }),
  p({ id: "spotify-individual", name: "스포티파이 프리미엄 개인", seller_brand_id: "spotify", route: "official", price_monthly: 10900, includes: [inc("spotify", "개인")], exclusive_group: "spotify", status: "needs_check", source_url: URL.spotify, source_trust: "platform" }),

  // 멤버십 결합. 이미 가입한 멤버십이면 추가 비용 0원
  p({ id: "naverplus-netflix", name: "네이버플러스 멤버십 + 넷플릭스 광고형", seller_brand_id: "naverplus", route: "membership", price_monthly: 4900, owned_price: 0, includes: [inc("naverplus", "쇼핑 적립 등"), inc("netflix", "광고형 스탠다드", true)], exclusive_group: "naverplus", status: "needs_check", conditions: ["디지털 콘텐츠 혜택 중 1개 선택"], source_url: URL.naverplus, source_trust: "official" }),
  p({ id: "naverplus-spotify", name: "네이버플러스 멤버십 + 스포티파이 베이직", seller_brand_id: "naverplus", route: "membership", price_monthly: 4900, owned_price: 0, includes: [inc("naverplus", "쇼핑 적립 등"), inc("spotify", "프리미엄 베이직")], exclusive_group: "naverplus", status: "needs_check", conditions: ["디지털 콘텐츠 혜택 중 1개 선택"], source_url: URL.naverplus, source_trust: "official" }),
  p({ id: "coupang-wow", name: "쿠팡 와우 멤버십", seller_brand_id: "coupangwow", route: "membership", price_monthly: 7890, owned_price: 0, includes: [inc("coupangwow", "로켓배송·쿠팡이츠 무료배달"), inc("coupangplay", "와우 회원 콘텐츠", true)], exclusive_group: "coupangwow", status: "needs_check", source_url: URL.coupangwow, source_trust: "official" }),
  p({ id: "baeminclub", name: "배민클럽", seller_brand_id: "baeminclub", route: "membership", price_monthly: 3990, owned_price: 0, includes: [inc("baeminclub", "알뜰·한집배달 무료")], exclusive_group: "baeminclub", status: "needs_check", conditions: ["프로모션 시 1,990원"], source_url: URL.baemin, source_trust: "official" }),
  p({ id: "yogipass-x", name: "요기패스X", seller_brand_id: "yogipass", route: "membership", price_monthly: 4900, owned_price: 0, includes: [inc("yogipass", "배달비 무료")], exclusive_group: "yogipass", status: "needs_check", source_url: URL.yogipass, source_trust: "press" }),

  // 통신사 구독 상품
  p({ id: "udok-double-ads", name: "LG U+ 유독 더블 스트리밍 (유튜브 프리미엄 + 넷플릭스 광고형)", seller_brand_id: "lgu", route: "telecom", price_monthly: 18900, includes: [inc("youtube", "프리미엄", false), inc("netflix", "광고형 스탠다드", true)], conditions: ["통신사 무관 가입 가능", "1년 약정, 중도 해지 시 할인 반환금", "U+ VIP/VVIP는 월 4,000원 추가 할인"], source_url: URL.udok, source_trust: "official", watch_url: URL.udok, watch_selector: "main" }),
  p({ id: "udok-double-standard", name: "LG U+ 유독 더블 스트리밍 (유튜브 프리미엄 + 넷플릭스 스탠다드)", seller_brand_id: "lgu", route: "telecom", price_monthly: 24400, includes: [inc("youtube", "프리미엄", false), inc("netflix", "스탠다드", false)], conditions: ["통신사 무관 가입 가능", "1년 약정"], source_url: URL.udok, source_trust: "official" }),
  p({ id: "udok-double-premium", name: "LG U+ 유독 더블 스트리밍 (유튜브 프리미엄 + 넷플릭스 프리미엄)", seller_brand_id: "lgu", route: "telecom", price_monthly: 26900, includes: [inc("youtube", "프리미엄", false), inc("netflix", "프리미엄", false)], conditions: ["통신사 무관 가입 가능", "1년 약정"], source_url: URL.udok, source_trust: "official" }),
  p({ id: "udok-youtube-pick", name: "LG U+ 유튜브 프리미엄 유독픽", seller_brand_id: "lgu", route: "telecom", price_monthly: 13900, includes: [inc("youtube", "프리미엄", false)], conditions: ["통신사 무관, 약정 없음", "매달 라이프 쿠폰 1종 선택", "U+ VIP/VVIP는 월 9,900원"], source_url: URL.udok, source_trust: "official" }),
  p({ id: "skt-youtube-lite", name: "T 우주 유튜브 프리미엄 라이트", seller_brand_id: "skt", route: "telecom", price_monthly: 7900, includes: [inc("youtube", "라이트(뮤직 제외)", false)], status: "needs_check", conditions: ["T 우주 상품, 통신사 무관 가입(보도 기준)"], source_url: URL.sktYtLite, source_trust: "official" }),
  p({ id: "kt-youtube-lite", name: "KT 구독 유튜브 프리미엄 라이트", seller_brand_id: "kt", route: "telecom", price_monthly: 8000, requires_brand_ids: ["kt"], payment: "bill", includes: [inc("youtube", "라이트(뮤직 제외)", false)], status: "needs_check", source_url: URL.ktYtLite, source_trust: "press" }),
  p({ id: "kt-tving-basic", name: "KT 티빙 생활구독팩 베이직", seller_brand_id: "kt", route: "telecom", price_monthly: 11500, requires_brand_ids: ["kt"], payment: "bill", includes: [inc("tving", "베이직", false)], status: "needs_check", conditions: ["GS25·다이소 쿠폰 포함", "12/31까지 월 2,000원 추가 할인"], source_url: URL.ktTving, source_trust: "press" }),
  p({ id: "kt-tving-standard", name: "KT 티빙 생활구독팩 스탠다드", seller_brand_id: "kt", route: "telecom", price_monthly: 15500, requires_brand_ids: ["kt"], payment: "bill", includes: [inc("tving", "스탠다드", false)], status: "needs_check", conditions: ["GS25·다이소 쿠폰 포함", "12/31까지 월 2,000원 추가 할인"], source_url: URL.ktTving, source_trust: "press" }),
] satisfies (Plan & { watch_url: string | null; watch_selector: string | null })[];

export const PLANS = PLAN_LIST.map((x) => ({ ...x, signup_url: SIGNUP[x.seller_brand_id] ?? x.source_url }));

const c = (x: Omit<Card, "checked_at" | "status" | "notes"> & Partial<Card>) => ({
  checked_at: CHECKED,
  status: "needs_check" as const,
  notes: [],
  watch_url: null,
  watch_selector: null,
  ...x,
});

// 카드 혜택은 전월실적 구간별로 다르다. 가장 낮은 구간 기준으로 계산하고, 발급 전 카드사 확인을 안내한다
const CARD_LIST = [
  c({ id: "nh-zgm-streaming", issuer_brand_id: "nhcard", name: "NH농협 지금 스트리밍(zgm.streaming)", annual_fee: 12000, min_prev_month_spend: 400000, discount_kind: "rate", discount_value: 50, monthly_cap: 5000, eligible_service_ids: ["netflix", "tving", "wavve", "disney", "youtube"], notes: ["OTT 정기결제 50%, 월 통합 5,000원 한도", "멤버십 정기결제 할인은 계산에 넣지 않음"], source_url: URL.cardsBanksalad, source_trust: "platform" }),
  c({ id: "hana-wonder-young", issuer_brand_id: "hanacard", name: "하나 원더카드 2.0 YOUNG", annual_fee: 19900, min_prev_month_spend: 400000, discount_kind: "rate", discount_value: 70, monthly_cap: 8000, eligible_service_ids: ["netflix"], notes: ["영상 스트리밍 70%, 한도 8,000~15,000원(실적 구간별)", "확인된 넷플릭스만 계산"], source_url: URL.cardsBanksalad, source_trust: "platform" }),
  c({ id: "samsung-taptap-digital", issuer_brand_id: "samsungcard", name: "삼성카드 taptap DIGITAL", annual_fee: 10000, min_prev_month_spend: 300000, discount_kind: "rate", discount_value: 50, monthly_cap: 10000, eligible_service_ids: ["netflix", "wavve", "tving"], notes: ["넷플릭스·웨이브·티빙 등 정기결제 50%"], source_url: URL.cardsDaum, source_trust: "press" }),
] satisfies (Card & { watch_url: string | null; watch_selector: string | null })[];

export const CARDS = CARD_LIST.map((x) => ({ ...x, signup_url: ISSUER_HOME[x.issuer_brand_id] ?? x.source_url }));

type SeedDeal = {
  source_id: string;
  external_id: string;
  title: string;
  benefit_text?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  url: string;
  trust?: "official" | "press" | "platform";
  requirements?: string[];
};

const samsung = (cms: string, title: string, starts: string, ends: string): SeedDeal => ({
  source_id: "samsung-events",
  external_id: cms,
  title,
  starts_at: starts,
  ends_at: ends,
  url: `https://www.samsungcard.com/personal/event/ing/UHPPBE1403M0.jsp?cms_id=${cms}`,
});

// 자동 수집이 막힌 소스: 공식 페이지에서 사람이 확인한 항목만 넣는다
export const SEED_DEALS: SeedDeal[] = [
  samsung("3761603", "승차권 결제하면 5,000 포인트 찬스", "2026-11-03", "2026-11-30"),
  samsung("3760440", "G마켓/옥션 빅스마일데이 최대 15만원 할인", "2026-11-02", "2026-11-30"),
  samsung("3761133", "포르쉐 삼성카드 출시! 굿즈 증정 프로모션", "2026-11-02", "2026-12-31"),
  samsung("3746663", "자동차보험 신규 가입 시 최대 3만원 캐시백", "2026-11-02", "2026-11-30"),
  samsung("3746338", "중고차 살 땐 K Car", "2026-11-02", "2026-11-30"),
  samsung("3760409", "BMW 최대 60개월 할부 현금구매 시 캐시백", "2026-11-02", "2026-11-15"),
  samsung("3760401", "금리 할인에 캐시백까지 11월 다이렉트 오토 혜택", "2026-11-02", "2026-11-15"),
  { source_id: "kt-membership", external_id: "kt-tving-pack", title: "KT 티빙 생활구독팩 (티빙 + GS25·다이소 쿠폰)", benefit_text: "티빙 이용권에 생활 쿠폰을 더한 KT 구독 상품, 정상가보다 월 2,000원 저렴. 12/31까지 2,000원 추가 할인", ends_at: "2026-12-31", url: SIGNUP.kt, trust: "press" },
  { source_id: "kt-membership", external_id: "kt-youtube-lite", title: "KT 구독 유튜브 프리미엄 라이트 월 8,000원", benefit_text: "시중가 8,500원 대비 500원 저렴", url: SIGNUP.kt, trust: "press" },
  { source_id: "subscription-bundles", requirements: [], external_id: "double-ads", title: "티빙×웨이브 더블 이용권 광고형 월 7,000원", benefit_text: "티빙·웨이브 광고형 스탠다드를 함께. 각각 사면 11,000원", url: URL.wavve },
  { source_id: "subscription-bundles", requirements: [], external_id: "tving-3pack", title: "티빙·웨이브·디즈니+ 3 PACK 월 21,500원", benefit_text: "세 서비스 스탠다드 묶음, 따로 사면 34,300원", ends_at: "2027-01-31", url: URL.tving },
  { source_id: "subscription-bundles", requirements: [], external_id: "tving-disney", title: "티빙×디즈니+ 더블 월 18,000원", benefit_text: "티빙 스탠다드 + 디즈니+ 스탠다드, 따로 사면 23,400원", ends_at: "2027-01-31", url: URL.tving },
  { source_id: "subscription-bundles", requirements: [], external_id: "udok-double", title: "LG U+ 유독 더블 스트리밍: 유튜브 프리미엄 + 넷플릭스 월 18,900원", benefit_text: "통신사 무관 가입, 정상가 21,900원 대비 3,000원 할인. 1년 약정", url: URL.udok },
  { source_id: "subscription-bundles", requirements: [], external_id: "udok-youtube-pick", title: "LG U+ 유튜브 프리미엄 유독픽 월 13,900원", benefit_text: "통신사 무관·약정 없음, 매달 라이프 쿠폰 선택", url: URL.udok },
  { source_id: "subscription-bundles", requirements: [], external_id: "coupangplay-free", title: "쿠팡플레이, 쿠팡 회원이면 광고형 무료", benefit_text: "와우 회원이 아니어도 광고와 함께 무료 시청", url: URL.coupangplay },
];
