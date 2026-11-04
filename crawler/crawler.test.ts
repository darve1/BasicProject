import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Brand } from "../lib/types";
import { isAllowed, parseRobots } from "./http";
import { toRow } from "./save";
import { parseHyundaiList } from "./sources/hyundai";
import { parseKbList } from "./sources/kb";
import { parseLguList } from "./sources/lgu";
import { parseSktList } from "./sources/skt";
import { parsePeriod, tagDeal } from "./tagging";

const fixture = (f: string) => readFileSync(join(__dirname, "__fixtures__", f), "utf8");

const brand = (id: string, kind: Brand["kind"], name: string, aliases: string[] = []): Brand => ({
  id, kind, name, aliases, category: null, official_domains: [], homepage: null, sort_order: 0,
});
const BRANDS = [
  brand("skt", "telecom", "SKT", ["SK텔레콤", "T 멤버십"]),
  brand("kt", "telecom", "KT", ["KT"]),
  brand("shinhan", "card_issuer", "신한카드", ["신한카드"]),
  brand("netflix", "service", "넷플릭스", ["넷플릭스", "Netflix"]),
  brand("melon", "service", "멜론", ["멜론 이용권"]),
];

describe("parsers (저장된 공식 페이지)", () => {
  it("SKT 혜택 브랜드 20개, 등급별 할인 문구", () => {
    const r = parseSktList(fixture("skt-brandlist.html"));
    expect(r).toHaveLength(20);
    expect(r[0]).toMatchObject({ external_id: "998", title: "배스킨라빈스", merchant: "배스킨라빈스" });
    expect(r[0].benefit_text).toContain("VIP: 싱글레귤러 50% 할인");
  });

  it("LG U+ 이벤트 코드·기간", () => {
    const r = parseLguList(fixture("lgu-events.html"));
    expect(r.length).toBeGreaterThan(5);
    expect(r.every((d) => /^\d+$/.test(d.external_id) && d.period)).toBe(true);
  });

  it("현대카드 이벤트 코드·제목·기간", () => {
    const r = parseHyundaiList(fixture("hyundai-events.html"));
    expect(r.length).toBeGreaterThan(10);
    expect(r[0]).toMatchObject({ external_id: "B81040", title: "국내 제휴 호텔 11~12월 이벤트 혜택 안내" });
  });

  it("KB국민카드 이벤트 일련번호·기간", () => {
    const r = parseKbList(fixture("kb-events.html"));
    expect(r).toHaveLength(12);
    expect(r[0]).toMatchObject({ external_id: "1002587", period: "2026.11.01~2026.11.30" });
  });
});

describe("tagging", () => {
  it("다른 제휴사 언급은 요구 조건, 서비스 언급은 구독 카테고리", () => {
    const t = tagDeal("T 멤버십 회원이 신한카드로 넷플릭스 결제 시 50% 할인", "skt", BRANDS);
    expect(t.requirements).toEqual(["skt", "shinhan"]);
    expect(t.category).toBe("subscription");
    expect(t.related_service_ids).toEqual(["netflix"]);
  });

  it("키워드로 카테고리·자격", () => {
    expect(tagDeal("스타벅스 아메리카노 1+1", "skt", BRANDS).category).toBe("cafe");
    expect(tagDeal("만 34세 이하 청년 고객 CGV 할인", "skt", BRANDS)).toMatchObject({ category: "culture", eligibility: ["youth"] });
    expect(tagDeal("대학생 전용 캐시백", "skt", BRANDS).eligibility).toEqual(["student"]);
  });

  it("여러 날짜 형식의 기간", () => {
    const now = new Date("2026-11-03");
    expect(parsePeriod("2026. 11. 2 ~ 2026. 12. 31", now)).toEqual({ starts_at: "2026-11-02", ends_at: "2026-12-31" });
    expect(parsePeriod("2026.11.01~2026.11.30", now)).toEqual({ starts_at: "2026-11-01", ends_at: "2026-11-30" });
    expect(parsePeriod("2026.12.20 ~ 01.10", now)).toEqual({ starts_at: "2026-12-20", ends_at: "2027-01-10" });
    expect(parsePeriod("~ 2026년 12월 31일까지", now)).toEqual({ starts_at: null, ends_at: "2026-12-31" });
    expect(parsePeriod(undefined, now)).toEqual({ starts_at: null, ends_at: null });
  });

  it("끝난 딜은 비활성으로 저장", () => {
    const { row } = toRow(
      { external_id: "1", title: "지난 이벤트", period: "2026.10.01~2026.10.31", url: "https://x" },
      { id: "s", brandId: "skt", dealType: "telecom" },
      BRANDS,
      new Date("2026-11-03"),
    );
    expect(row.is_active).toBe(false);
  });
});

describe("robots.txt", () => {
  const rules = parseRobots(`User-agent: Googlebot
Allow: /

User-agent: *
Disallow: /mob/
Allow: /mob/MOBFM004N/MOBFM004R0201.shc
Allow : /pconts/html/benefit/`);
  it("가장 긴 규칙이 이긴다", () => {
    expect(isAllowed(rules, "/mob/MOBFM004N/MOBFM004R25.ajax")).toBe(false);
    expect(isAllowed(rules, "/mob/MOBFM004N/MOBFM004R0201.shc")).toBe(true);
    expect(isAllowed(rules, "/pconts/html/benefit/event/1.html")).toBe(true);
  });
  it("* 그룹의 Disallow: / 는 전부 금지", () => {
    expect(isAllowed(parseRobots("User-agent: ClaudeBot\nAllow: /\n\nUser-agent: *\nDisallow: /"), "/event")).toBe(false);
  });
});

describe("별칭 매칭", () => {
  it("영문 별칭은 단어 경계, 이름만 같은 일반 단어는 무시", () => {
    expect(tagDeal("KTX 승차권 할인", "skt", BRANDS).requirements).toEqual(["skt"]);
    expect(tagDeal("KT 고객 전용", "skt", BRANDS).requirements).toEqual(["skt", "kt"]);
    expect(tagDeal("멜론 아이스크림 할인", "skt", BRANDS).related_service_ids).toEqual([]);
  });
});

describe("조건 판단 보정", () => {
  const withPay = [...BRANDS, brand("naverpay", "pay", "네이버페이", ["네이버페이", "Npay"])];
  it("간편결제는 결제 맥락일 때만 조건", () => {
    expect(tagDeal("통신 패키지 가입하면 추가 네이버페이 및 사은품 혜택", "skt", withPay).requirements).toEqual(["skt"]);
    expect(tagDeal("네이버페이로 결제 시 10% 할인", "skt", withPay).requirements).toEqual(["skt", "naverpay"]);
  });
  it("사이트 분류 힌트가 키워드보다 우선, 서비스 언급은 구독으로", () => {
    expect(tagDeal("멕시카나 T 멤버십 할인", "skt", BRANDS, "food").category).toBe("food");
    expect(tagDeal("넷플릭스 할인", "skt", BRANDS, "culture").category).toBe("subscription");
  });
  it("만18세~29세 같은 범위 표현도 청년", () => {
    expect(tagDeal("체크 신규하면 3만원 만18세~29세 유스클럽", "skt", BRANDS).eligibility).toEqual(["youth"]);
  });
});
