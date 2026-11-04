// 홈 추천: 쓰는 구독을 더 싸게 쓰는 방법, 맞는 카드, 놓치기 쉬운 할인. 순서는 아끼는 돈으로만 정한다
import { listPrice, recommendCards, solve, type ComboInput } from "./combo";
import { endsLabel } from "./format";
import { canGet } from "./match";
import type { Brand, Card, Deal, Plan } from "./types";

export type Rec = {
  kind: "switch" | "card" | "deal";
  title: string;
  reason: string;
  saving: number | null; // 월 기준
  href: string;
  external: boolean;
};

const n = (v: number) => v.toLocaleString("ko-KR");

export function recommend(args: {
  plans: Plan[];
  cards: Card[];
  deals: Deal[];
  brands: Brand[];
  input: ComboInput;
  today?: string;
}): Rec[] {
  const { plans, cards, deals, brands, input } = args;
  const name = (id: string) => brands.find((b) => b.id === id)?.name ?? id;
  const recs: Rec[] = [];

  // 1) 최저 조합의 항목마다: 그 항목이 덮는 구독을 본사 단품으로 따로 낼 때보다 얼마나 싼지 (정산표와 같은 숫자)
  const combo = solve(plans, input).combos[0];
  const switches = (combo?.items ?? [])
    .map((it) => {
      const lists = it.covers.map((s) => listPrice(plans, s, input.allowAds));
      if (lists.some((l) => l == null)) return null;
      const listSum = (lists as number[]).reduce((a, b) => a + b, 0);
      if (it.price >= listSum) return null;
      const owned = it.price < it.plan.price_monthly ? " (이미 내는 멤버십에 포함)" : "";
      return {
        kind: "switch" as const,
        title: it.plan.name,
        reason: `${it.covers.map(name).join("·")} · 본사 단품 월 ${n(listSum)}원 대신 월 ${n(it.price)}원${owned}`,
        saving: listSum - it.price,
        href: it.plan.signup_url ?? it.plan.source_url,
        external: true,
      };
    })
    .filter((r) => r !== null)
    .sort((a, b) => b.saving - a.saving);
  recs.push(...switches.slice(0, 3));

  // 2) 그 조합에 맞는 카드
  const pick = combo ? recommendCards(cards, combo, 1)[0] : undefined;
  if (pick) {
    recs.push({
      kind: "card",
      title: pick.card.name,
      reason: `이 조합 결제 시 월 ${n(pick.saving)}원 할인, 연회비를 빼도 월 ${n(pick.gain)}원 이득 · 전월 ${n(pick.card.min_prev_month_spend / 10000)}만원 이상`,
      saving: pick.gain,
      href: pick.card.signup_url ?? pick.card.source_url,
      external: true,
    });
  }

  // 3) 받을 수 있는 할인: 쓰는 구독과 관련된 것, 그다음 곧 끝나는 것
  // 결합 상품(subscription-bundles)은 1)의 조합 계산에서 이미 비교했으므로 할인 추천에서는 뺀다
  const mine = deals.filter((d) => d.is_active && d.source_id !== "subscription-bundles" && canGet(d, input.owned, input.elig));
  const related = mine.find((d) => d.related_service_ids.some((s) => input.wanted.includes(s)));
  const soon = mine
    .filter((d) => d !== related && endsLabel(d.ends_at, args.today) && endsLabel(d.ends_at, args.today) !== "종료")
    .sort((a, b) => (a.ends_at ?? "").localeCompare(b.ends_at ?? ""))[0];
  for (const d of [related, soon]) {
    if (!d) continue;
    recs.push({
      kind: "deal",
      title: d.title,
      reason: d === related ? "쓰는 구독과 관련된 혜택" : `곧 끝나요 · ${endsLabel(d.ends_at, args.today)}`,
      saving: null,
      href: `/deal/${d.id}`,
      external: false,
    });
  }
  return recs;
}
