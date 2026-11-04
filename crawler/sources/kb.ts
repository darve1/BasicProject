// KB국민카드 진행중 이벤트. 서버 렌더링 HTML, ?pageCount=N 으로 페이지 이동 (robots.txt: /BON/ 허용)
import * as cheerio from "cheerio";
import { getText } from "../http";
import { clean } from "../tagging";
import type { RawDeal, SourceAdapter } from "../types";

const LIST = "https://card.kbcard.com/BON/DVIEW/HBBMCXCRVNEC0001";
const MAX_PAGES = 15;

export function parseKbList(html: string): RawDeal[] {
  const $ = cheerio.load(html);
  return $('a[href^="javascript:goDetail("]')
    .toArray()
    .map((el) => {
      const a = $(el);
      const id = a.attr("href")?.match(/goDetail\('(\d+)'/)?.[1] ?? "";
      const title = clean(a.find(".subject").html()?.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, ""));
      const tags = a.find(".category em").toArray().map((e) => clean($(e).text()));
      return {
        external_id: id,
        title,
        benefit_text: tags.length ? tags.join(" · ") : undefined,
        period: clean(a.find(".date").text()),
        url: `${LIST}?mainCC=a&eventNum=${id}`,
      };
    })
    .filter((d) => d.external_id && d.title);
}

export const kb: SourceAdapter = {
  id: "kb-events",
  brandId: "kbcard",
  dealType: "card",
  name: "KB국민카드 진행중 이벤트",
  url: LIST,
  async fetch() {
    const all = new Map<string, RawDeal>();
    for (let page = 1; page <= MAX_PAGES; page++) {
      const items = parseKbList(await getText(`${LIST}?pageCount=${page}`));
      const fresh = items.filter((d) => !all.has(d.external_id));
      if (fresh.length === 0) break; // 마지막 페이지를 넘기면 같은 목록이 다시 온다
      fresh.forEach((d) => all.set(d.external_id, d));
    }
    return [...all.values()];
  },
};
