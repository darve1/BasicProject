import { describe, expect, it } from "vitest";
import { parseDealQuery, searchDeals } from "./deal-search";
import type { Brand, Deal } from "./types";

const brand = (id: string, kind: Brand["kind"], name: string, aliases: string[] = []): Brand => ({
  id, kind, name, aliases, category: null, official_domains: [], homepage: null, sort_order: 0,
});
const BRANDS = [
  brand("skt", "telecom", "SKT", ["SKT", "SK텔레콤", "T 멤버십"]),
  brand("kt", "telecom", "KT", ["KT", "케이티"]),
  brand("netflix", "service", "넷플릭스", ["넷플릭스", "넷플", "Netflix"]),
  brand("naverpay", "pay", "네이버페이", ["네이버페이", "네이버 페이"]),
];

const deal = (d: Partial<Deal> & Pick<Deal, "id" | "title">): Deal => ({
  source_id: "s", external_id: d.id, deal_type: "telecom", category: "etc", related_service_ids: [], benefit_text: null, merchant: null,
  starts_at: null, ends_at: null, url: "https://example.com", eligibility: [], is_active: true, source_trust: "official",
  first_seen_at: "2026-11-01", last_seen_at: "2026-11-25", deal_requirements: [], ...d,
});
const DEALS = [
  deal({ id: "1", title: "스타벅스 사이즈업", merchant: "스타벅스", category: "cafe", deal_requirements: [{ brand_id: "skt" }] }),
  deal({ id: "2", title: "투썸플레이스 10% 할인", merchant: "투썸플레이스", category: "cafe", deal_requirements: [{ brand_id: "kt" }] }),
  deal({ id: "3", title: "CGV 2천원 할인", merchant: "CGV", category: "culture", deal_requirements: [{ brand_id: "kt" }], eligibility: ["student"] }),
  deal({ id: "4", title: "OTT 구독료 캐시백", benefit_text: "넷플릭스 결제 시 3천원", category: "subscription", related_service_ids: ["netflix"], deal_requirements: [{ brand_id: "kt" }] }),
  deal({ id: "5", title: "GS25 1+1", merchant: "GS25", category: "cvs", benefit_text: "네이버 페이로 결제하면 적립", deal_requirements: [{ brand_id: "skt" }] }),
];
const ids = (q: string) => searchDeals(DEALS, q, BRANDS).map((d) => d.id);

describe("할인 검색어 해석", () => {
  it("빈 검색어는 그대로, 한 낱말은 제목·제휴처·혜택 문구에서 찾음", () => {
    expect(ids("")).toEqual(["1", "2", "3", "4", "5"]);
    expect(ids("스타벅스")).toEqual(["1"]);
    expect(ids("캐시백")).toEqual(["4"]);
    expect(ids("3천원")).toEqual(["4"]);
  });

  it("여러 낱말은 모두 만족해야 함", () => {
    expect(ids("kt 카페")).toEqual(["2"]);
    expect(ids("카페")).toEqual(["1", "2"]);
    expect(ids("kt 스타벅스")).toEqual([]);
  });

  it("브랜드 별칭: 문구에 없어도 받는 조건·관련 구독으로 찾음", () => {
    expect(ids("케이티")).toEqual(["2", "3", "4"]);
    expect(ids("넷플")).toEqual(["4"]);
    expect(ids("t 멤버십")).toEqual(["1", "5"]);
    expect(ids("네이버페이")).toEqual(["5"]); // 문구에는 "네이버 페이"로 띄어 적혀 있음
  });

  it("분류·자격 낱말", () => {
    expect(ids("편의점")).toEqual(["5"]);
    expect(ids("대학생")).toEqual(["3"]);
    expect(ids("케이티 대학생")).toEqual(["3"]);
    expect(parseDealQuery("KT 커피 청년 스벅", BRANDS)).toEqual({ brandIds: ["kt"], categories: [["커피", "cafe"]], elig: [["청년", "youth"]], words: ["스벅"] });
  });
});
