import { meetsEligibility } from "./eligibility";
import type { Deal } from "./types";

// 딜의 요구 브랜드를 모두 갖고 자격도 맞으면 받을 수 있다 (DB의 matching_deals와 같은 규칙)
export function canGet(deal: Deal, owned: string[], elig: string[]): boolean {
  const reqs = (deal.deal_requirements ?? []).map((r) => r.brand_id);
  return reqs.every((r) => owned.includes(r)) && meetsEligibility(deal.eligibility, elig);
}
