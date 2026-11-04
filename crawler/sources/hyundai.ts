// 현대카드 진행 중 이벤트. 목록이 서버 렌더링 HTML에 그대로 있다 (robots.txt에 * 그룹 없음 = 제한 없음)
import * as cheerio from "cheerio";
import { getText } from "../http";
import { clean } from "../tagging";
import type { RawDeal, SourceAdapter } from "../types";

const ORIGIN = "https://www.hyundaicard.com";
const LIST = `${ORIGIN}/cpb/ev/CPBEV0101_01.hc`;

export function parseHyundaiList(html: string): RawDeal[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  return $('a[href*="CPBEV0101_06.hc?bnftWebEvntCd="]')
    .toArray()
    .map((el) => {
      const a = $(el);
      const href = a.attr("href") ?? "";
      const code = href.match(/bnftWebEvntCd=([^&]+)/)?.[1] ?? "";
      const title = clean(a.find(".txt_title").html()?.replace(/<br\s*\/?>/gi, " ") ?? "").replace(/<[^>]+>/g, "");
      return {
        external_id: code,
        title,
        period: clean(a.find(".txt_date").text()),
        url: `${ORIGIN}/cpb/ev/CPBEV0101_06.hc?bnftWebEvntCd=${code}`,
      };
    })
    .filter((d) => d.external_id && d.title && !seen.has(d.external_id) && seen.add(d.external_id));
}

export const hyundai: SourceAdapter = {
  id: "hyundai-events",
  brandId: "hyundaicard",
  dealType: "card",
  name: "현대카드 진행 중 이벤트",
  url: LIST,
  fetch: async () => parseHyundaiList(await getText(LIST)),
};
