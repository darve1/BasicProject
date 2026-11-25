// "지금 쓰는 요금제"를 적은 구독은 그 등급으로만 견준다
import { describe, expect, it } from "vitest";
import { baseline, listPrice, solve, tierKey, tierOptions } from "./combo";
import type { Plan, PlanInclude } from "./types";
import { tiersFromForm } from "./viewer";
import { normalize } from "../artifact-app/profile-store";

const inc = (service_id: string, tier: string, ads = false): PlanInclude => ({ service_id, tier, ads });
const plan = (id: string, seller: string, price: number, includes: PlanInclude[], extra: Partial<Plan> = {}): Plan => ({
  id, name: id, seller_brand_id: seller, route: "official", price_monthly: price, owned_price: null, billing: "monthly", includes,
  requires_brand_ids: [], eligibility: [], exclusive_group: null, payment: "direct", conditions: [],
  source_url: "https://example.com", source_trust: "official", checked_at: "2026-11-25", status: "confirmed", ...extra,
});

const PLANS = [
  plan("nf-ads", "netflix", 7000, [inc("netflix", "광고형 스탠다드", true)]),
  plan("nf-std", "netflix", 13500, [inc("netflix", "스탠다드")]),
  plan("nf-pre", "netflix", 17000, [inc("netflix", "프리미엄")]),
  plan("yt", "youtube", 14900, [inc("youtube", "프리미엄(뮤직 포함)")]),
  plan("naver-nf", "naverplus", 4900, [inc("netflix", "광고형 스탠다드", true)], { route: "membership" }),
  plan("udok-pre", "lgu", 26900, [inc("youtube", "프리미엄"), inc("netflix", "프리미엄")], { route: "telecom" }),
  plan("udok-ads", "lgu", 18900, [inc("youtube", "프리미엄"), inc("netflix", "광고형 스탠다드", true)], { route: "telecom" }),
];
const input = (tiers: Record<string, string> = {}) => ({ wanted: ["netflix", "youtube"], owned: [], elig: [], allowAds: true, includeAnnual: false, tiers });

describe("등급 조건", () => {
  it("표기가 달라도 같은 등급으로 본다", () => {
    expect(tierKey(inc("wavve", "광고형", true))).toBe(tierKey(inc("wavve", "광고형 스탠다드", true)));
    expect(tierKey(inc("youtube", "프리미엄(뮤직 포함)"))).toBe("프리미엄");
  });

  it("본사 등급 목록은 싼 것부터", () => {
    expect(tierOptions(PLANS, "netflix")).toEqual([
      { tier: "광고형", label: "광고형 스탠다드", price: 7000 },
      { tier: "스탠다드", label: "스탠다드", price: 13500 },
      { tier: "프리미엄", label: "프리미엄", price: 17000 },
    ]);
    expect(tierOptions(PLANS, "disney")).toEqual([]);
  });

  it("등급을 안 적으면 가장 싼 조합, 적으면 그 등급으로만", () => {
    expect(solve(PLANS, input()).combos[0].items.map((i) => i.plan.id)).toEqual(["udok-ads"]);
    expect(baseline(PLANS, input())).toBe(7000 + 14900);
    // 넷플릭스 프리미엄을 쓰는 사람: 광고형이 든 묶음은 답이 아니다. 견주는 본사 값도 프리미엄 요금
    const pre = solve(PLANS, input({ netflix: "프리미엄" }));
    expect(pre.combos[0].items.map((i) => i.plan.id)).toEqual(["udok-pre"]);
    expect(pre.combos[0].total).toBe(26900);
    expect(baseline(PLANS, input({ netflix: "프리미엄" }))).toBe(17000 + 14900);
    expect(listPrice(PLANS, "netflix", true, "스탠다드")).toBe(13500);
  });

  it("내 조건 폼에서 읽기: 고른 구독의 것만, 빈 칸은 뺀다", () => {
    const form = new FormData();
    form.set("tier:netflix", "프리미엄");
    form.set("tier:tving", "");
    form.set("tier:wavve", "스탠다드"); // 구독 선택을 푼 것
    expect(tiersFromForm(form, ["netflix", "tving", "youtube"])).toEqual({ netflix: "프리미엄" });
    expect(normalize({ services: ["netflix"], tiers: { netflix: "프리미엄", tving: 3 } }).tiers).toEqual({ netflix: "프리미엄" });
    expect(normalize({ services: ["netflix"] }).tiers).toEqual({}); // 예전에 저장한 조건에는 tiers가 없다
  });

  it("등급을 적으면 광고 허용 여부와 무관하게 그 등급을 따른다", () => {
    const r = solve(PLANS, { ...input({ netflix: "광고형" }), allowAds: false, wanted: ["netflix"] });
    expect(r.combos[0].items[0].plan.id).toBe("naver-nf");
  });
});
