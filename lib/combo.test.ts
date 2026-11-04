import { describe, expect, it } from "vitest";
import { baseline, cardSaving, recommendCards, solve, type ComboInput } from "./combo";
import type { Card, Plan } from "./types";

const plan = (p: Partial<Plan> & Pick<Plan, "id" | "seller_brand_id" | "price_monthly" | "includes">): Plan => ({
  name: p.id,
  route: "official",
  owned_price: null,
  billing: "monthly",
  requires_brand_ids: [],
  eligibility: [],
  exclusive_group: null,
  payment: "direct",
  conditions: [],
  source_url: "https://example.com",
  source_trust: "official",
  checked_at: "2026-11-01",
  status: "confirmed",
  ...p,
});

const card = (c: Partial<Card> & Pick<Card, "id" | "discount_value" | "eligible_service_ids">): Card => ({
  issuer_brand_id: "shinhan",
  name: c.id,
  annual_fee: 0,
  min_prev_month_spend: 0,
  discount_kind: "rate",
  monthly_cap: null,
  notes: [],
  source_url: "https://example.com",
  source_trust: "official",
  checked_at: "2026-11-01",
  status: "confirmed",
  ...c,
});

const PLANS: Plan[] = [
  plan({ id: "netflix-ads", seller_brand_id: "netflix", price_monthly: 5500, includes: [{ service_id: "netflix", ads: true }] }),
  plan({ id: "netflix-std", seller_brand_id: "netflix", price_monthly: 13500, includes: [{ service_id: "netflix", ads: false }] }),
  plan({ id: "youtube", seller_brand_id: "youtube", price_monthly: 14900, includes: [{ service_id: "youtube", ads: false }] }),
  plan({
    id: "skt-upass-yt",
    seller_brand_id: "skt",
    route: "telecom",
    payment: "bill",
    price_monthly: 9900,
    requires_brand_ids: ["skt"],
    includes: [{ service_id: "youtube", ads: false }],
  }),
  plan({
    id: "naverplus",
    seller_brand_id: "naverplus",
    route: "membership",
    price_monthly: 4900,
    owned_price: 0,
    includes: [{ service_id: "naverplus" }, { service_id: "netflix", ads: true }],
  }),
  plan({
    id: "youth-ott",
    seller_brand_id: "kt",
    route: "telecom",
    payment: "bill",
    price_monthly: 0,
    requires_brand_ids: ["kt"],
    eligibility: ["youth"],
    includes: [{ service_id: "netflix", ads: false }],
  }),
];

const input = (p: Partial<ComboInput>): ComboInput => ({
  wanted: [],
  owned: [],
  elig: [],
  allowAds: true,
  includeAnnual: false,
  ...p,
});

describe("solve", () => {
  it("통신사 구독팩이 단품보다 싸면 그 조합이 1위", () => {
    const { combos } = solve(PLANS, input({ wanted: ["netflix", "youtube"], owned: ["skt"] }));
    expect(combos[0].items.map((i) => i.plan.id).sort()).toEqual(["naverplus", "skt-upass-yt"]);
    expect(combos[0].total).toBe(4900 + 9900);
  });

  it("보유하지 않은 통신사 상품은 후보에서 빠진다", () => {
    const { combos } = solve(PLANS, input({ wanted: ["youtube"] }));
    expect(combos[0].items[0].plan.id).toBe("youtube");
  });

  it("광고형을 허용하지 않으면 광고 요금제를 쓰지 않는다", () => {
    const { combos } = solve(PLANS, input({ wanted: ["netflix"], allowAds: false }));
    expect(combos[0].items[0].plan.id).toBe("netflix-std");
  });

  it("이미 가입한 멤버십은 추가 비용만 센다", () => {
    const { combos } = solve(PLANS, input({ wanted: ["netflix"], owned: ["naverplus"] }));
    expect(combos[0].items[0].plan.id).toBe("naverplus");
    expect(combos[0].total).toBe(0);
  });

  it("청년 전용 상품은 자격이 있어야 나온다", () => {
    const noYouth = solve(PLANS, input({ wanted: ["netflix"], owned: ["kt"], allowAds: false }));
    expect(noYouth.combos[0].items[0].plan.id).toBe("netflix-std");
    const youth = solve(PLANS, input({ wanted: ["netflix"], owned: ["kt"], elig: ["youth"], allowAds: false }));
    expect(youth.combos[0].items[0].plan.id).toBe("youth-ott");
  });

  it("군더더기 없는 조합만 상위 3개까지", () => {
    const { combos } = solve(PLANS, input({ wanted: ["netflix", "youtube"], owned: ["skt"] }));
    expect(combos.length).toBeLessThanOrEqual(3);
    for (const c of combos) expect(c.items.length).toBe(2);
  });

  it("덮을 수 없는 서비스는 알려준다", () => {
    const r = solve(PLANS, input({ wanted: ["netflix", "chatgpt"] }));
    expect(r.combos).toEqual([]);
    expect(r.uncovered).toEqual(["chatgpt"]);
  });
});

describe("baseline", () => {
  it("본사 단품 최저가의 합", () => {
    expect(baseline(PLANS, input({ wanted: ["netflix", "youtube"] }))).toBe(5500 + 14900);
    expect(baseline(PLANS, input({ wanted: ["netflix"], allowAds: false }))).toBe(13500);
  });
});

describe("cards", () => {
  const combo = solve(PLANS, input({ wanted: ["netflix", "youtube"] })).combos[0];

  it("직접 결제 금액에만 할인율, 월 한도 적용", () => {
    const c = card({ id: "c1", discount_value: 50, monthly_cap: 5000, eligible_service_ids: ["youtube", "netflix"] });
    expect(cardSaving(c, combo.items)).toBe(5000);
  });

  it("통신 요금 청구 상품은 카드 할인 대상이 아니다", () => {
    const skt = solve(PLANS, input({ wanted: ["youtube"], owned: ["skt"] })).combos[0];
    const c = card({ id: "c1", discount_value: 50, eligible_service_ids: ["*"] });
    expect(cardSaving(c, skt.items)).toBe(0);
  });

  it("연회비를 빼고 이득이 큰 순서", () => {
    const cards = [
      card({ id: "small", discount_kind: "amount", discount_value: 3000, eligible_service_ids: ["youtube"] }),
      card({ id: "big-fee", discount_value: 50, annual_fee: 120000, eligible_service_ids: ["youtube"] }),
      card({ id: "none", discount_value: 50, eligible_service_ids: ["melon"] }),
    ];
    const picks = recommendCards(cards, combo);
    expect(picks.map((p) => p.card.id)).toEqual(["small"]);
  });
});
