// npm run crawl [-- --source skt-membership] [--dry-run]
// 소스마다: 수집 → 태깅 → 저장 → 이번에 안 보인 딜 비활성화 → 실행 기록. 한 소스 실패가 다른 소스를 막지 않는다
import type { Brand } from "../lib/types";
import { adminClient } from "./db";
import { saveDeals, toRow } from "./save";
import { ADAPTERS } from "./sources";
import { BlockedError } from "./types";
import { runWatch } from "./watch";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const only = args.includes("--source") ? args[args.indexOf("--source") + 1] : null;
const adapters = ADAPTERS.filter((a) => !only || a.id === only);

const db = dryRun ? null : adminClient();
const brands: Brand[] = db
  ? ((await db.from("brands").select("*")).data ?? [])
  : (await import("../supabase/seed/brands.json", { with: { type: "json" } })).default as Brand[];

for (const a of adapters) {
  const started = new Date();
  let runId: number | null = null;
  if (db) {
    const { data } = await db.from("crawl_runs").insert({ source_id: a.id }).select("id").single();
    runId = data?.id ?? null;
  }
  let status: "ok" | "empty" | "error" | "blocked" = "ok";
  let count = 0;
  let error: string | null = null;
  try {
    const raws = await a.fetch();
    count = raws.length;
    const rows = raws.map((r) => toRow(r, { id: a.id, brandId: a.brandId, dealType: a.dealType }, brands, started));
    if (dryRun) {
      console.log(`[${a.id}] ${count}건`);
      for (const r of rows.slice(0, 3)) console.log("  ", r.row.title, "|", r.row.category, r.row.ends_at, r.requirements, r.row.eligibility);
    } else if (count === 0) {
      // 0건이면 사이트 구조가 바뀐 것일 수 있다. 기존 딜은 건드리지 않는다
      status = "empty";
    } else {
      await saveDeals(db!, rows);
      await db!
        .from("deals")
        .update({ is_active: false })
        .eq("source_id", a.id)
        .lt("last_seen_at", started.toISOString());
    }
  } catch (e) {
    status = e instanceof BlockedError ? "blocked" : "error";
    error = e instanceof Error ? e.message : String(e);
    console.error(`[${a.id}] ${status}: ${error}`);
  }
  if (db) {
    await db
      .from("crawl_runs")
      .update({ finished_at: new Date().toISOString(), status, items_found: count, error })
      .eq("id", runId);
    await db
      .from("sources")
      .update({ last_run_at: started.toISOString(), last_status: status, last_count: count })
      .eq("id", a.id);
  }
  console.log(`[${a.id}] ${status} ${count}건`);
}

// 기간이 지난 딜은 소스와 상관없이 내린다 (수동 등록 딜은 크롤러가 다시 저장하지 않으므로). 날짜는 한국 시간 기준
if (db) {
  const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  const { data } = await db.from("deals").update({ is_active: false }).eq("is_active", true).lt("ends_at", today).select("id");
  console.log(`기간 끝난 딜 ${data?.length ?? 0}건 내림`);
}

if (db && !only) await runWatch(db);
