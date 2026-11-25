// 공식 페이지 변경 감지: plans/cards 의 watch_url 지정 영역 텍스트 해시가 바뀌면 needs_check 로 내린다.
// 단, 월 결제 요금제는 바뀐 본문에서 그 요금제 이름 바로 뒤에 지금 가격이 그대로 적혀 있으면 확인 상태를 유지한다
// (배너·날짜처럼 가격과 무관한 부분만 바뀐 것까지 "확인 필요"로 내리지 않기 위해). 확인일은 사람이 본 날이라 건드리지 않는다
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import { getText } from "./http";
import { clean } from "./tagging";

type Watched = {
  id: string;
  watch_url: string;
  watch_selector: string | null;
  content_hash: string | null;
  name?: string;
  price_monthly?: number;
  billing?: string;
};

export function sectionText(html: string, selector: string | null): string {
  const $ = cheerio.load(html);
  return clean((selector ? $(selector) : $("body")).text());
}

const sha = (text: string) => createHash("sha256").update(text).digest("hex");
export const hashSection = (html: string, selector: string | null) => sha(sectionText(html, selector));

// 본문에 적힌 원화 금액과 그 위치: "13,500원", "₩11,500", "1만 3천원"
const AMOUNTS: [RegExp, (m: RegExpMatchArray) => number][] = [
  [/(\d{1,3}(?:,\d{3})+|\d{3,7})\s*원/g, (m) => Number(m[1].replace(/,/g, ""))],
  [/₩\s*(\d{1,3}(?:,\d{3})+|\d{3,7})/g, (m) => Number(m[1].replace(/,/g, ""))],
  [/(\d+(?:\.\d+)?)\s*만\s*(?:(\d+)\s*천)?\s*원/g, (m) => Math.round(Number(m[1]) * 10000 + (m[2] ? Number(m[2]) * 1000 : 0))],
];
const COMMON = /^(요금제|이용권|멤버십|구독|월간|with|the|[a-z]|\d+)$/i;

// price가 본문에서 name(요금제 이름) 바로 뒤에 적혀 있는지. "본문 어딘가에 그 숫자가 있음"보다 엄격하게 본다:
// 요금 표는 "이름 … 금액" 순서라 금액 앞쪽을 보고, 이름의 낱말 가운데 그 페이지에 없거나 너무 흔한 것(자기 서비스 이름 등)은
// 어느 요금제인지 가려 주지 못하므로 빼고, 남은 낱말이 둘 이상이면 두 개가 같이 있어야 한다
export function priceShown(text: string, price: number, name: string): boolean {
  if (!(price > 0)) return false;
  const low = text.toLowerCase();
  const all = name.replace(/[()·+,/&]/g, " ").split(/\s+/).filter((w) => w.length >= 2 && !COMMON.test(w)).map((w) => w.toLowerCase());
  const rare = all.filter((w) => {
    const n = low.split(w).length - 1;
    return n >= 1 && n <= 12;
  });
  const words = rare.length ? rare : all;
  if (!words.length) return false;
  const need = Math.min(2, words.length);
  return AMOUNTS.some(([re, value]) =>
    [...text.matchAll(re)].some((m) => {
      if (value(m) !== price) return false;
      const near = low.slice(Math.max(0, m.index - 100), m.index + 20);
      return words.filter((w) => near.includes(w)).length >= need;
    }),
  );
}

export async function runWatch(db: SupabaseClient) {
  for (const table of ["plans", "cards"] as const) {
    const cols = "id, watch_url, watch_selector, content_hash" + (table === "plans" ? ", name, price_monthly, billing" : "");
    const { data } = await db.from(table).select(cols).not("watch_url", "is", null);
    for (const w of (data ?? []) as unknown as Watched[]) {
      try {
        const text = sectionText(await getText(w.watch_url), w.watch_selector);
        const hash = sha(text);
        if (w.content_hash === hash) continue;
        // 처음 보는 페이지는 기준값만 저장. 바뀐 페이지는 가격이 그대로 적혀 있을 때만 확인 상태를 두고, 아니면 사람이 다시 볼 때까지 needs_check
        const priceKept = w.billing === "monthly" && w.name != null && priceShown(text, w.price_monthly ?? 0, w.name);
        const patch = !w.content_hash || priceKept ? { content_hash: hash } : { content_hash: hash, status: "needs_check" };
        await db.from(table).update(patch).eq("id", w.id);
        if (w.content_hash) console.log(`[watch] ${table}/${w.id} 페이지 변경 감지 → ${priceKept ? "가격은 그대로 적혀 있어 유지" : "needs_check"}`);
      } catch (e) {
        console.error(`[watch] ${table}/${w.id} 확인 실패: ${e instanceof Error ? e.message : e}`);
      }
    }
  }
}
