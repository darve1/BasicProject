import { describe, expect, it } from "vitest";
import { recommend } from "./recommend";
import type { Brand, Card, Deal, Plan } from "./types";

const plan = (p: Partial<Plan> & Pick<Plan, "id" | "seller_brand_id" | "price_monthly" | "includes">): Plan => ({
  name: p.id, route: "official", owned_price: null, billing: "monthly", requires_brand_ids: [], eligibility: [], exclusive_group: null,
  payment: "direct", conditions: [], source_url: "https://news.example/a", signup_url: `https://${p.seller_brand_id}.example`,
  source_trust: "press", checked_at: "2026-11-04", status: "confirmed", ...p,
});
const brand = (id: string, name: string): Brand => ({ id, name, kind: "service", category: "ott", aliases: [], official_domains: [], homepage: null, sort_order: 0 });
const deal = (d: Partial<Deal> & Pick<Deal, "id" | "title">): Deal => ({
  source_id: "s", external_id: d.id, deal_type: "telecom", category: "etc", related_service_ids: [], benefit_text: null, merchant: null,
  starts_at: null, ends_at: null, url: "https://official.example", eligibility: [], is_active: true, source_trust: "official",
  first_seen_at: "2026-11-01", last_seen_at: "2026-11-04", deal_requirements: [], ...d,
});

const PLANS = [
  plan({ id: "netflix-ads", seller_brand_id: "netflix", price_monthly: 7000, includes: [{ service_id: "netflix", ads: true }] }),
  plan({ id: "tving-ads", seller_brand_id: "tving", price_monthly: 5500, includes: [{ service_id: "tving", ads: true }] }),
  plan({ id: "naverplus", seller_brand_id: "naverplus", route: "membership", price_monthly: 4900, owned_price: 0, includes: [{ service_id: "netflix", ads: true }] }),
];
const CARDS: Card[] = [
  { id: "c", issuer_brand_id: "x", name: "구독카드", annual_fee: 12000, min_prev_month_spend: 300000, discount_kind: "rate", discount_value: 50, monthly_cap: 5000, eligible_service_ids: ["tving"], notes: [], signup_url: "https://card.example", source_url: "https://news.example/c", source_trust: "press", checked_at: "2026-11-04", status: "needs_check" },
];
const BRANDS = [brand("netflix", "넷플릭스"), brand("tving", "티빙")];
const input = { wanted: ["netflix", "tving"], owned: ["naverplus"], elig: [], allowAds: true, includeAnnual: false };

describe("recommend", () => {
  const recs = recommend({ plans: PLANS, cards: CARDS, deals: [], brands: BRANDS, input, today: "2026-11-04" });

  it("본사보다 싼 경로를 아끼는 돈 순으로, 링크는 출처가 아닌 공식 가입 페이지", () => {
    expect(recs[0]).toMatchObject({ kind: "switch", title: "naverplus", saving: 7000, href: "https://naverplus.example" });
  });

  it("카드는 연회비를 뺀 이득으로, 카드사 공식 페이지로", () => {
    const card = recs.find((r) => r.kind === "card")!;
    expect(card.saving).toBe(2750 - 1000);
    expect(card.href).toBe("https://card.example");
  });

  it("받을 수 있는 할인만: 관련 구독 혜택, 그다음 곧 끝나는 것", () => {
    const deals = [
      deal({ id: "a", title: "SKT 전용", ends_at: "2026-11-06", deal_requirements: [{ brand_id: "skt" }] }),
      deal({ id: "b", title: "티빙 할인", related_service_ids: ["tving"] }),
      deal({ id: "c", title: "곧 끝남", ends_at: "2026-11-07" }),
    ];
    const r = recommend({ plans: PLANS, cards: CARDS, deals, brands: BRANDS, input, today: "2026-11-04" }).filter((x) => x.kind === "deal");
    expect(r.map((x) => x.title)).toEqual(["티빙 할인", "곧 끝남"]);
    expect(r[0].href).toBe("/deal/b");
  });
});
