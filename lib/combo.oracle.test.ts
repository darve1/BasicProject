// solve()가 내놓는 1등이 정말 최저가인지, 가지치기 없는 전수 탐색과 대조한다.
// 전수 탐색은 탐색 순서·중단 조건·군더더기 판정을 쓰지 않고 상품 부분집합을 그대로 늘어놓아 규칙만 확인한다.
import { describe, expect, it } from "vitest";
import { PLANS } from "../scripts/catalog";
import { coveredServices, effectivePrice, isAvailable, solve, type ComboInput } from "./combo";
import type { Plan } from "./types";

// 원하는 구독을 모두 덮고 같은 배타 그룹을 둘 넣지 않은 부분집합 가운데 가장 싼 합계. 없으면 Infinity
function brute(plans: Plan[], input: ComboInput, maxSize = Infinity): number {
  const cand = plans.filter((p) => isAvailable(p, input) && coveredServices(p, input).length > 0);
  let best = Infinity;
  const pick = (start: number, chosen: Plan[], total: number) => {
    if (chosen.length && input.wanted.every((w) => chosen.some((p) => coveredServices(p, input).includes(w)))) best = Math.min(best, total);
    if (chosen.length >= maxSize) return;
    for (let i = start; i < cand.length; i++) {
      const g = cand[i].exclusive_group;
      if (g && chosen.some((c) => c.exclusive_group === g)) continue;
      pick(i + 1, [...chosen, cand[i]], total + effectivePrice(cand[i], input));
    }
  };
  pick(0, [], 0);
  return best;
}

const cheapest = (plans: Plan[], input: ComboInput) => (input.wanted.length ? (solve(plans, input, { limit: 1 }).combos[0]?.total ?? Infinity) : Infinity);

// 재현되는 난수
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomCase(seed: number): { plans: Plan[]; input: ComboInput } {
  const r = rng(seed);
  const int = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
  const pick = <T,>(a: T[]) => a[int(0, a.length - 1)];
  const chance = (p: number) => r() < p;
  const services = ["a", "b", "c", "d", "e", "f"].slice(0, int(2, 6));
  const holders = ["skt", "kt", "naverplus", "wow"];
  const plans: Plan[] = Array.from({ length: int(5, 12) }, (_, k) => {
    const price = int(0, 200) * 100;
    return {
      id: `p${k}`,
      name: `p${k}`,
      seller_brand_id: pick([...services, ...holders]),
      route: "official",
      price_monthly: price,
      owned_price: chance(0.2) ? Math.floor(price / 200) * 100 : null,
      billing: chance(0.2) ? "annual" : "monthly",
      includes: [...new Set(Array.from({ length: int(1, 3) }, () => pick(services)))].map((service_id) => ({ service_id, ads: chance(0.4) })),
      requires_brand_ids: chance(0.25) ? [pick(holders)] : [],
      eligibility: chance(0.15) ? [pick(["youth", "student"])] : [],
      exclusive_group: chance(0.25) ? pick(["g1", "g2"]) : null,
      payment: "direct",
      conditions: [],
      source_url: "https://example.com",
      source_trust: "official",
      checked_at: "2026-11-25",
      status: "confirmed",
    } satisfies Plan;
  });
  const wanted = services.filter(() => chance(0.6));
  return {
    plans,
    input: {
      wanted: wanted.length ? wanted : [services[0]],
      owned: holders.filter(() => chance(0.4)),
      elig: ["youth", "student"].filter(() => chance(0.4)),
      allowAds: chance(0.7),
      includeAnnual: chance(0.5),
    },
  };
}

describe("최저 조합이 전수 탐색과 같은지", () => {
  it("무작위 카탈로그 1,000개", () => {
    let solvable = 0;
    for (let seed = 1; seed <= 1000; seed++) {
      const { plans, input } = randomCase(seed);
      const want = brute(plans, input);
      expect(cheapest(plans, input), `seed ${seed} ${JSON.stringify(input)}`).toBe(want);
      if (want < Infinity) solvable++;
    }
    // 조건이 너무 빡빡해 대부분 답이 없으면 시험이 의미가 없다
    expect(solvable).toBeGreaterThan(400);
  });

  it("실제 카탈로그: 구독 1~3개 조합 전부 × 보유·자격·광고·연간 조건", () => {
    const plans = PLANS as Plan[];
    const services = [...new Set(plans.flatMap((p) => p.includes.map((i) => i.service_id)))].sort();
    const holders = [...new Set(plans.flatMap((p) => [...p.requires_brand_ids, ...(p.owned_price != null ? [p.seller_brand_id] : [])]))];
    const subsets = (k: number): string[][] =>
      k === 0 ? [[]] : subsets(k - 1).flatMap((s) => services.filter((x) => !s.length || x > s[s.length - 1]).map((x) => [...s, x]));
    const owns = [[], holders, ...holders.map((h) => [h])];
    let n = 0;
    for (const wanted of [...subsets(1), ...subsets(2), ...subsets(3)]) {
      for (const owned of wanted.length === 3 ? [[], holders] : owns) {
        for (const allowAds of [true, false]) {
          for (const includeAnnual of [false, true]) {
            const input = { wanted, owned, elig: n % 2 ? ["youth", "student"] : [], allowAds, includeAnnual };
            expect(cheapest(plans, input), JSON.stringify(input)).toBe(brute(plans, input, wanted.length));
            n++;
          }
        }
      }
    }
    expect(n).toBeGreaterThan(1000);
  });

  it("고를 수 있는 구독을 전부 골라도 탐색 한도 안에서 끝남", () => {
    const plans = PLANS as Plan[];
    const wanted = [...new Set(plans.flatMap((p) => p.includes.map((i) => i.service_id)))];
    const input = { wanted, owned: [], elig: [], allowAds: true, includeAnnual: true };
    // 한도를 사실상 없앤 탐색과 결과가 같아야 한다 (한도에 걸리면 조용히 덜 싼 답을 내놓게 된다)
    expect(solve(plans, input, { limit: 1 }).combos[0]?.total).toBe(solve(plans, input, { limit: 1, maxSteps: 50_000_000 }).combos[0]?.total);
  });
});
