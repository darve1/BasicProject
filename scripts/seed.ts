// npm run seed — 브랜드·소스·가입 경로·카드·시드 딜을 넣는다 (여러 번 돌려도 같은 결과)
import brands from "../supabase/seed/brands.json" with { type: "json" };
import sources from "../supabase/seed/sources.json" with { type: "json" };
import { adminClient } from "../crawler/db";
import { saveDeals, toRow } from "../crawler/save";
import type { Brand, DealType } from "../lib/types";
import { CARDS, PLANS, SEED_DEALS } from "./catalog";

const db = adminClient();

async function upsert(table: string, rows: object[], onConflict = "id") {
  const { error } = await db.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`${table}: ${rows.length}`);
}

await upsert("brands", brands);
// 수집 상태 컬럼(last_*)은 크롤러가 관리하므로 정의 필드만 넣는다
await upsert("sources", sources);
await upsert("plans", PLANS);
await upsert("cards", CARDS);
// 카탈로그에서 뺀 요금제·카드는 DB에서도 지운다
await db.from("plans").delete().not("id", "in", `(${PLANS.map((p) => p.id).join(",")})`);
await db.from("cards").delete().not("id", "in", `(${CARDS.map((c) => c.id).join(",")})`);

const byId = new Map(sources.map((s) => [s.id, s]));
const now = new Date();
const rows = SEED_DEALS.map((d) => {
  const src = byId.get(d.source_id);
  if (!src) throw new Error(`알 수 없는 소스 ${d.source_id}`);
  return toRow(
    { external_id: d.external_id, title: d.title, benefit_text: d.benefit_text, starts_at: d.starts_at ?? null, ends_at: d.ends_at ?? null, url: d.url, requirements: d.requirements },
    { id: src.id, brandId: src.brand_id, dealType: src.deal_type as DealType, trust: d.trust },
    brands as Brand[],
    now,
  );
});
await saveDeals(db, rows);
console.log(`seed deals: ${rows.length}`);

// 시드에서 뺀 수동 딜은 내린다 (자동 수집 소스의 딜은 크롤러가 관리한다)
for (const s of sources.filter((x) => x.mode !== "crawl")) {
  const keep = SEED_DEALS.filter((d) => d.source_id === s.id).map((d) => d.external_id);
  let q = db.from("deals").update({ is_active: false }).eq("source_id", s.id).eq("is_active", true);
  if (keep.length) q = q.not("external_id", "in", `(${keep.join(",")})`);
  const { data } = await q.select("id");
  if (data?.length) console.log(`${s.id}: 시드에서 뺀 딜 ${data.length}건 내림`);
}

for (const s of sources.filter((s) => s.mode === "seed")) {
  const count = rows.filter((r) => r.row.source_id === s.id).length;
  await db.from("sources").update({ last_run_at: now.toISOString(), last_status: "seed", last_count: count }).eq("id", s.id);
}
console.log("시드 완료");
