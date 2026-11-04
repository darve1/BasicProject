// LG U+ 진행 중 이벤트. Nuxt 서버 렌더링 HTML의 카드 목록 (robots.txt에 * 그룹 없음 = 제한 없음)
import * as cheerio from "cheerio";
import { getText } from "../http";
import { clean } from "../tagging";
import type { RawDeal, SourceAdapter } from "../types";

const ORIGIN = "https://www.lguplus.com";
const LIST = `${ORIGIN}/benefit-event/ongoing`;

export function parseLguList(html: string): RawDeal[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  return $("a[data-event]")
    .toArray()
    .map((el) => {
      const a = $(el);
      let code = "";
      try {
        code = String(JSON.parse(a.attr("data-event") ?? "{}").behavior_event_code ?? "");
      } catch {
        // data-event가 JSON이 아니면 건너뛴다
      }
      return {
        external_id: code,
        title: clean(a.find(".tit").first().text()),
        benefit_text: clean(a.find(".flag-n-tag em").toArray().map((e) => $(e).text()).join(" ")) || undefined,
        period: clean(a.find(".date").first().text()),
        url: `${LIST}/${code}`,
      };
    })
    .filter((d) => d.external_id && d.title && d.period && !seen.has(d.external_id) && seen.add(d.external_id));
}

export const lgu: SourceAdapter = {
  id: "lgu-events",
  brandId: "lgu",
  dealType: "telecom",
  name: "LG U+ 진행 중 이벤트",
  url: LIST,
  fetch: async () => parseLguList(await getText(LIST)),
};
