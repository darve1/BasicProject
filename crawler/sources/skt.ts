// SKT T 멤버십 혜택 브랜드. 목록 조각 HTML을 20개씩 받는다 (robots.txt: /mps/pc-bff/benefitbrand 허용)
import * as cheerio from "cheerio";
import { getText } from "../http";
import { clean } from "../tagging";
import type { DealCategory } from "../../lib/types";
import type { RawDeal, SourceAdapter } from "../types";

const BASE = "https://sktmembership.tworld.co.kr/mps/pc-bff";
const MAX_PAGES = 15;
const TIER: Record<string, string> = { V: "VIP", G: "골드", S: "실버", L: "일반" };

// T 멤버십 분류 탭 ID → 우리 분류
const SKT_CATEGORY: Record<string, DealCategory> = {
  "53": "food", // 베이커리
  "54": "food", // 외식
  "55": "cafe", // 카페/아이스크림
  "56": "food", // 피자/치킨
  "52": "cvs", // 편의점
  "50": "shopping", // 쇼핑
  "51": "shopping", // 패션/뷰티
  "116": "shopping", // 반려동물
  "59": "travel", // 여행
  "119": "travel", // 교통
  "60": "culture", // 영화/공연/전시
  "110": "culture", // 테마파크
  "61": "culture", // 콘텐츠
  "57": "etc", // 교육
  "49": "etc", // 생활/건강
  "48": "etc", // 금융/통신
  "128": "etc", // 키즈(ZEM)
};

export function parseSktList(html: string): RawDeal[] {
  const $ = cheerio.load(html);
  return $(".benefit-box")
    .toArray()
    .map((el) => {
      const box = $(el);
      const id = box.attr("data-id") ?? "";
      const brand = clean(box.find(".brand").first().text());
      // "할인형" 항목만 혜택 문구로 쓴다. 등급 배지(V/G/S)를 앞에 붙인다
      const lines = box
        .find("dl")
        .filter((_, dl) => clean($(dl).find("dt").text()) === "할인형")
        .find(".info")
        .toArray()
        .map((info) => {
          const tiers = $(info).find(".blind").toArray().map((b) => TIER[clean($(b).text())] ?? clean($(b).text()));
          const text = clean($(info).clone().children(".badge-list").remove().end().text());
          return tiers.length ? `${tiers.join("·")}: ${text}` : text;
        })
        .filter((t) => !/포인트 사용/.test(t));
      return {
        external_id: id,
        title: brand,
        merchant: brand,
        benefit_text: lines.join(" / ") || undefined,
        url: `${BASE}/benefitbrand/detail.do?brandId=${id}`,
      };
    })
    .filter((d) => d.external_id && d.merchant && d.benefit_text);
}

export const skt: SourceAdapter = {
  id: "skt-membership",
  brandId: "skt",
  dealType: "telecom",
  name: "SKT T 멤버십 혜택 브랜드",
  url: `${BASE}/benefitbrand/list-tab1.do`,
  // 사이트의 분류 탭별로 받아 분류를 그대로 옮긴다. 여러 탭에 있는 브랜드는 처음 본 분류로
  async fetch() {
    const all = new Map<string, RawDeal>();
    for (const [categoryId, category] of Object.entries(SKT_CATEGORY)) {
      for (let page = 0; page < MAX_PAGES; page++) {
        const html = await getText(
          `${BASE}/benefitbrand/brandList.do?pageNum=${page}&pageSize=20&sortType=BRAND_FAVORITE&mediumCategoryId=${categoryId}&benefitTypeId=ALL&searchText=&lastPageYn=N`,
        );
        const items = parseSktList(html);
        for (const d of items) if (!all.has(d.external_id)) all.set(d.external_id, { ...d, category });
        if (items.length < 20) break;
      }
    }
    return [...all.values()];
  },
};
