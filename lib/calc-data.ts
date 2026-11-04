import type { CalculatorData } from "@/components/calculator";
import type { Brand, Card, Plan } from "./types";

// 계산기에 넘길 카탈로그 묶음. 서버 페이지와 아티팩트가 같은 모양으로 만든다
export function buildCalcData(brands: Brand[], plans: Plan[], cards: Card[], viewer: { brandIds: string[]; elig: string[] }): CalculatorData {
  return {
    brands,
    services: brands.filter((b) => b.category && (b.kind === "service" || b.kind === "platform")),
    telecoms: brands.filter((b) => b.kind === "telecom"),
    memberships: brands.filter((b) => b.kind === "platform"),
    plans,
    cards,
    owned: viewer.brandIds,
    elig: viewer.elig,
  };
}
