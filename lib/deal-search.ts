// 할인 검색어 해석. 규칙만 쓴다 (deal-search.test.ts).
// 띄어 쓴 낱말을 모두 만족하는 딜만 남긴다. 낱말이 브랜드 이름·별칭이면 그 브랜드와 얽힌 딜(문구에 나오거나, 관련 구독이거나,
// 받는 조건)로, 분류 이름이면 그 분류로, 자격 낱말이면 그 자격 전용 딜로 읽는다. 그 밖의 낱말은 제목·제휴처·혜택 문구에서 찾는다.
// 서버(getDeals)와 아티팩트(queryDeals)가 이 함수 하나를 같이 쓴다.
import type { Brand, Deal, DealCategory } from "./types";

const CATEGORY_WORDS: Record<string, DealCategory> = {
  구독: "subscription", 카페: "cafe", 커피: "cafe", 편의점: "cvs", 외식: "food", 배달: "food", 쇼핑: "shopping", 여행: "travel", 문화: "culture",
};
const ELIG_WORDS: Record<string, string> = { 청년: "youth", 대학생: "student", 학생: "student", 군인: "soldier", 장병: "soldier", 시니어: "senior" };

export type DealSearch = {
  brandIds: string[];
  categories: [word: string, category: DealCategory][];
  elig: [word: string, tag: string][];
  words: string[];
};

const squash = (s: string) => s.toLowerCase().replace(/\s+/g, "");

export function parseDealQuery(q: string, brands: Brand[]): DealSearch {
  const out: DealSearch = { brandIds: [], categories: [], elig: [], words: [] };
  // "T 멤버십"처럼 띄어 쓴 별칭도 한 낱말로 읽도록, 별칭을 긴 것부터 통째로 찾아서 뺀다
  const names = brands
    .flatMap((b) => [b.name, ...b.aliases].map((a) => ({ id: b.id, key: squash(a) })))
    .filter((n) => n.key.length >= 2)
    .sort((a, b) => b.key.length - a.key.length);
  for (const token of q.toLowerCase().split(/[\s,·+]+/).filter(Boolean)) {
    const hit = names.find((n) => n.key === token);
    if (hit) out.brandIds.push(hit.id);
    else if (CATEGORY_WORDS[token]) out.categories.push([token, CATEGORY_WORDS[token]]);
    else if (ELIG_WORDS[token]) out.elig.push([token, ELIG_WORDS[token]]);
    else out.words.push(token);
  }
  // 낱말 둘이 붙어야 별칭이 되는 경우 ("t 멤버십" → SKT)
  const whole = squash(q);
  for (const n of names) {
    if (n.key.length < 4 || out.brandIds.includes(n.id) || !whole.includes(n.key)) continue;
    const parts = out.words.filter((w) => n.key.includes(w));
    if (squash(parts.join("")) !== n.key) continue;
    out.brandIds.push(n.id);
    out.words = out.words.filter((w) => !parts.includes(w));
  }
  out.brandIds = [...new Set(out.brandIds)];
  return out;
}

export function matchesDeal(deal: Deal, s: DealSearch, brands: Brand[]): boolean {
  const text = `${deal.title} ${deal.merchant ?? ""} ${deal.benefit_text ?? ""}`.toLowerCase();
  const flat = squash(text);
  const has = (w: string) => text.includes(w) || flat.includes(squash(w));
  const brandOk = (id: string) => {
    const b = brands.find((x) => x.id === id);
    return (
      deal.related_service_ids.includes(id) ||
      (deal.deal_requirements ?? []).some((r) => r.brand_id === id) ||
      (b != null && [b.name, ...b.aliases].some((a) => a.length >= 2 && has(a.toLowerCase())))
    );
  };
  return (
    s.brandIds.every(brandOk) &&
    s.categories.every(([word, c]) => deal.category === c || has(word)) &&
    s.elig.every(([word, tag]) => deal.eligibility.includes(tag) || has(word)) &&
    s.words.every(has)
  );
}

export function searchDeals(deals: Deal[], q: string, brands: Brand[]): Deal[] {
  if (!q.trim()) return deals;
  const s = parseDealQuery(q, brands);
  return deals.filter((d) => matchesDeal(d, s, brands));
}
