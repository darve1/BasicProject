// 규칙 기반 태깅: 브랜드 별칭 사전으로 요구 조건·관련 서비스를, 키워드로 카테고리·자격·기간을 뽑는다
import type { Brand, DealCategory } from "../lib/types";

const CATEGORY_KEYWORDS: [DealCategory, RegExp][] = [
  ["subscription", /구독|OTT|스트리밍|정기결제|멤버십\s?(가입|구독)/i],
  ["cafe", /카페|커피|스타벅스|투썸|이디야|메가(MGC)?커피|빽다방|폴바셋|할리스|커피빈|컴포즈|파스쿠찌|공차|배스킨|던킨/],
  ["cvs", /편의점|GS25|CU|세븐일레븐|이마트24/],
  ["food", /배달|배민|요기요|쿠팡이츠|땡겨요|버거|피자|치킨|베이커리|파리바게뜨|뚜레쥬르|외식|아웃백|빕스|VIPS|맥도날드|도미노|롯데리아|맘스터치|서브웨이|레스토랑|뷔페/],
  ["travel", /여행|항공|호텔|숙박|리조트|렌터카|렌트카|야놀자|여기어때|트립|아고다|익스피디아|공항|면세|해외결제|라운지/],
  ["culture", /영화|CGV|롯데시네마|메가박스|공연|전시|뮤지컬|도서|교보문고|예스24|알라딘|놀이공원|롯데월드|에버랜드|티켓/],
  ["shopping", /쇼핑|쿠팡|11번가|G마켓|지마켓|옥션|SSG|쓱|롯데온|무신사|올리브영|백화점|아울렛|마트|이마트|홈플러스|코스트코|다이소|컬리|오늘의집|에이블리|지그재그|알리익스프레스|테무/],
];

const ELIGIBILITY_KEYWORDS: [string, RegExp][] = [
  ["youth", /청년|만\s?(19|24|29|34)\s?세\s?이하|만\s?\d{1,2}\s?세?\s?~\s?(2\d|3[0-4])\s?세|0청년|영\s?플랜|유쓰|유스|청춘|Y\s?(덤|박스|군인)?\s?요금/],
  ["student", /대학생|대학원생|학생증|캠퍼스/],
  ["soldier", /장병|군인|나라사랑|군\s?복무/],
  ["senior", /시니어|어르신|만\s?6[05]\s?세\s?이상/],
];

export type Tagged = {
  category: DealCategory;
  related_service_ids: string[];
  eligibility: string[];
  requirements: string[];
};

// 별칭(aliases)만 본다. 이름이 일반 단어와 겹치는 경우(멜론 맛 아이스크림 등)를 피하려고 별칭을 따로 둔다.
// 영문 별칭은 단어 경계를 요구한다 ("KT"가 "KTX"에 걸리지 않게)
// 언급 위치 뒤 몇 글자. 간편결제는 "○○페이로 결제"처럼 결제 맥락일 때만 조건으로 본다
function mentionTails(text: string, b: Brand): string[] {
  return b.aliases.flatMap((a) => {
    if (a.length < 2) return [];
    const esc = a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = /^[\x20-\x7e]+$/.test(a) ? new RegExp(`(?<![A-Za-z])${esc}(?![A-Za-z])`, "gi") : new RegExp(esc, "g");
    return [...text.matchAll(re)].map((m) => text.slice(m.index + m[0].length, m.index + m[0].length + 8));
  });
}

const mentions = (text: string, b: Brand) => mentionTails(text, b).length > 0;

// sourceBrandId: 이 소스의 딜을 받으려면 기본으로 필요한 브랜드 (예: SKT 멤버십 → skt)
// hint: 사이트가 스스로 붙인 분류가 있으면 키워드보다 우선한다
export function tagDeal(text: string, sourceBrandId: string, brands: Brand[], hint?: DealCategory): Tagged {
  const related = brands.filter((b) => b.kind === "service" && mentions(text, b)).map((b) => b.id);
  // 다른 통신사·카드사가 함께 언급되면 그것도 갖춰야 하는 조건으로 본다 ("신한카드로 결제 시").
  // 간편결제는 보상으로도 자주 언급되므로("네이버페이 포인트 지급") 결제 맥락일 때만
  const partners = brands
    .filter((b) => ["telecom", "card_issuer", "pay"].includes(b.kind) && b.id !== sourceBrandId)
    .filter((b) => {
      const tails = mentionTails(text, b);
      return b.kind === "pay" ? tails.some((t) => /결제/.test(t)) : tails.length > 0;
    })
    .map((b) => b.id);
  const category: DealCategory = related.length
    ? "subscription"
    : (hint ?? CATEGORY_KEYWORDS.find(([, re]) => re.test(text))?.[0] ?? "etc");
  return {
    category,
    related_service_ids: related,
    eligibility: ELIGIBILITY_KEYWORDS.filter(([, re]) => re.test(text)).map(([t]) => t),
    requirements: [sourceBrandId, ...partners],
  };
}

const pad = (n: string | number) => String(n).padStart(2, "0");

// "2026.11.01 ~ 2026.11.30", "2026-11-01~11-30", "2026년 11월 1일 ~ 12월 31일", "~ 2026.12.31" 등
export function parsePeriod(text: string | undefined, today = new Date()): { starts_at: string | null; ends_at: string | null } {
  if (!text) return { starts_at: null, ends_at: null };
  const re = /(?:(\d{4})\s*[.\-/년]\s*)?(\d{1,2})\s*[.\-/월]\s*(\d{1,2})\s*일?/g;
  const found: string[] = [];
  let year = today.getFullYear();
  for (const m of text.matchAll(re)) {
    if (m[1]) year = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) continue;
    found.push(`${year}-${pad(mo)}-${pad(d)}`);
  }
  if (found.length === 0) return { starts_at: null, ends_at: null };
  if (found.length === 1) return /~\s*$|^\s*~/.test(text.trim()) || /까지/.test(text) ? { starts_at: null, ends_at: found[0] } : { starts_at: found[0], ends_at: null };
  const s = found[0];
  let e = found[found.length - 1];
  // "2026.12.20 ~ 01.10" 처럼 연도가 넘어가면 끝 날짜의 연도를 올린다
  if (e < s && !/\d{4}/.test(text.slice(text.lastIndexOf("~")))) e = `${Number(e.slice(0, 4)) + 1}${e.slice(4)}`;
  return { starts_at: s, ends_at: e };
}

export const clean = (s: string | undefined | null) => (s ?? "").replace(/\s+/g, " ").trim();
