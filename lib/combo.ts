// 구독 조합 계산과 카드 추천. DOM·DB에 의존하지 않는 순수 함수만 둔다 (combo.test.ts).
import { meetsEligibility } from "./eligibility";
import type { Card, Plan, PlanInclude } from "./types";

export type ComboInput = {
  wanted: string[]; // 쓰고 싶은 서비스 brand id
  owned: string[]; // 보유 통신사·카드사·간편결제·이미 가입한 멤버십 brand id
  elig: string[]; // 자격 태그 (youth, student ...)
  allowAds: boolean;
  includeAnnual: boolean;
  tiers?: Record<string, string>; // 서비스별로 꼭 이 등급이어야 할 때 (tierKey 값). 없으면 아무 등급
};

// 등급을 견줄 때 쓰는 이름. 판매처마다 표기가 달라서("광고형"/"광고형 스탠다드", "프리미엄(뮤직 포함)"/"프리미엄")
// 광고형은 하나로 보고 괄호 설명은 뗀다
export function tierKey(i: PlanInclude): string {
  return i.ads ? "광고형" : (i.tier ?? "").replace(/\(.*?\)/g, "").trim();
}

// 그 서비스를 이 조건으로 쓸 수 있는 포함 항목인지: 등급을 정했으면 그 등급만, 아니면 광고 허용 여부만 본다
function fits(i: PlanInclude, serviceId: string, allowAds: boolean, tier?: string): boolean {
  return i.service_id === serviceId && (tier ? tierKey(i) === tier : allowAds || i.ads !== true);
}

export type ComboItem = { plan: Plan; price: number; covers: string[] };
export type Combo = { items: ComboItem[]; total: number };

export function coveredServices(plan: Plan, input: ComboInput): string[] {
  return plan.includes
    .filter((i) => input.wanted.includes(i.service_id) && fits(i, i.service_id, input.allowAds, input.tiers?.[i.service_id]))
    .map((i) => i.service_id);
}

// 이미 가입한 멤버십이면 추가로 드는 돈만 센다
export function effectivePrice(plan: Plan, input: ComboInput): number {
  if (plan.owned_price != null && input.owned.includes(plan.seller_brand_id)) return plan.owned_price;
  return plan.price_monthly;
}

export function isAvailable(plan: Plan, input: ComboInput): boolean {
  if (!input.includeAnnual && plan.billing === "annual") return false;
  if (!plan.requires_brand_ids.every((b) => input.owned.includes(b))) return false;
  return meetsEligibility(plan.eligibility, input.elig);
}

// 본사에서 누구나 월 결제로 살 수 있는 단품 요금제
const officialSingles = (plans: Plan[], serviceId: string) =>
  plans.filter(
    (p) => p.route === "official" && p.billing === "monthly" && p.seller_brand_id === serviceId && p.requires_brand_ids.length === 0 && p.eligibility.length === 0,
  );

// 본사에서 단품으로 살 때 가장 싼 월 요금 (조건 없는 공식 요금제). 등급을 주면 그 등급의 요금
export function listPrice(plans: Plan[], serviceId: string, allowAds: boolean, tier?: string): number | null {
  const prices = officialSingles(plans, serviceId)
    .filter((p) => p.includes.some((i) => fits(i, serviceId, allowAds, tier)))
    .map((p) => p.price_monthly);
  return prices.length ? Math.min(...prices) : null;
}

// 그 서비스의 본사 등급 목록(싼 것부터). "지금 쓰는 요금제"를 고르는 데 쓴다
export function tierOptions(plans: Plan[], serviceId: string): { tier: string; label: string; price: number }[] {
  const out = new Map<string, { tier: string; label: string; price: number }>();
  for (const p of officialSingles(plans, serviceId).sort((a, b) => a.price_monthly - b.price_monthly)) {
    const i = p.includes.find((x) => x.service_id === serviceId);
    if (i && tierKey(i) && !out.has(tierKey(i))) out.set(tierKey(i), { tier: tierKey(i), label: i.tier ?? tierKey(i), price: p.price_monthly });
  }
  return [...out.values()];
}

export function baseline(plans: Plan[], input: ComboInput): number | null {
  let sum = 0;
  for (const w of input.wanted) {
    const p = listPrice(plans, w, input.allowAds, input.tiers?.[w]);
    if (p == null) return null;
    sum += p;
  }
  return sum;
}

export function solve(
  plans: Plan[],
  input: ComboInput,
  { limit = 3, maxSteps = 200_000 } = {},
): { combos: Combo[]; considered: number; uncovered: string[] } {
  const cand: ComboItem[] = plans
    .filter((p) => isAvailable(p, input))
    .map((p) => ({ plan: p, price: effectivePrice(p, input), covers: coveredServices(p, input) }))
    .filter((c) => c.covers.length > 0)
    .sort((a, b) => a.price - b.price);

  const uncovered = input.wanted.filter((w) => !cand.some((c) => c.covers.includes(w)));
  if (uncovered.length || input.wanted.length === 0) return { combos: [], considered: cand.length, uncovered };

  const best: Combo[] = [];
  const seen = new Set<string>();
  let steps = 0;
  const worst = () => (best.length < limit ? Infinity : best[best.length - 1].total);

  const dfs = (chosen: ComboItem[], total: number) => {
    if (++steps > maxSteps || total > worst()) return;
    const missing = input.wanted.find((w) => !chosen.some((c) => c.covers.includes(w)));
    if (!missing) {
      // 빼도 전부 덮이는 상품이 있으면 군더더기 조합
      const redundant = chosen.some((c) =>
        input.wanted.every((w) => chosen.some((d) => d !== c && d.covers.includes(w))),
      );
      const key = chosen.map((c) => c.plan.id).sort().join("|");
      if (redundant || seen.has(key)) return;
      seen.add(key);
      best.push({ items: [...chosen], total });
      best.sort((a, b) => a.total - b.total || a.items.length - b.items.length);
      if (best.length > limit) best.pop();
      return;
    }
    for (const c of cand) {
      if (!c.covers.includes(missing) || chosen.includes(c)) continue;
      const g = c.plan.exclusive_group;
      if (g && chosen.some((d) => d.plan.exclusive_group === g)) continue;
      chosen.push(c);
      dfs(chosen, total + c.price);
      chosen.pop();
    }
  };
  dfs([], 0);

  return { combos: best, considered: cand.length, uncovered };
}

// 카드 할인: 그 카드 대상 서비스에 직접 결제한 금액에만, 월 한도까지. "*"는 모든 직접 결제 구독
export function cardSaving(card: Card, items: ComboItem[]): number {
  const base = items
    .filter(
      (it) =>
        it.plan.payment === "direct" &&
        (card.eligible_service_ids.includes("*") || card.eligible_service_ids.includes(it.plan.seller_brand_id)),
    )
    .reduce((s, it) => s + it.price, 0);
  if (!base) return 0;
  let off =
    card.discount_kind === "rate"
      ? Math.floor((base * card.discount_value) / 100)
      : Math.min(card.discount_value, base);
  if (card.monthly_cap != null) off = Math.min(off, card.monthly_cap);
  return Math.max(0, off);
}

export type CardPick = { card: Card; saving: number; feeMonthly: number; gain: number; net: number };

// 연회비를 월로 나눠 뺀 실제 이득 순. 이득이 없는 카드는 추천하지 않는다
export function recommendCards(cards: Card[], combo: Combo, limit = 3): CardPick[] {
  return cards
    .map((card) => {
      const saving = cardSaving(card, combo.items);
      const feeMonthly = Math.round(card.annual_fee / 12);
      return { card, saving, feeMonthly, gain: saving - feeMonthly, net: combo.total - saving + feeMonthly };
    })
    .filter((r) => r.gain > 0)
    .sort((a, b) => b.gain - a.gain || a.card.min_prev_month_spend - b.card.min_prev_month_spend)
    .slice(0, limit);
}
