// 공식 페이지 변경 감지: plans/cards 의 watch_url 지정 영역 텍스트 해시가 바뀌면 needs_check 로 내린다
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import { getText } from "./http";
import { clean } from "./tagging";

type Watched = { id: string; watch_url: string; watch_selector: string | null; content_hash: string | null };

export function hashSection(html: string, selector: string | null): string {
  const $ = cheerio.load(html);
  const text = clean((selector ? $(selector) : $("body")).text());
  return createHash("sha256").update(text).digest("hex");
}

export async function runWatch(db: SupabaseClient) {
  for (const table of ["plans", "cards"] as const) {
    const { data } = await db
      .from(table)
      .select("id, watch_url, watch_selector, content_hash")
      .not("watch_url", "is", null);
    for (const w of (data ?? []) as Watched[]) {
      try {
        const hash = hashSection(await getText(w.watch_url), w.watch_selector);
        if (w.content_hash === hash) continue;
        // 처음 보는 페이지는 기준값만 저장, 바뀐 페이지는 사람이 다시 확인할 때까지 needs_check
        const patch = w.content_hash ? { content_hash: hash, status: "needs_check" } : { content_hash: hash };
        await db.from(table).update(patch).eq("id", w.id);
        if (w.content_hash) console.log(`[watch] ${table}/${w.id} 페이지 변경 감지 → needs_check`);
      } catch (e) {
        console.error(`[watch] ${table}/${w.id} 확인 실패: ${e instanceof Error ? e.message : e}`);
      }
    }
  }
}
