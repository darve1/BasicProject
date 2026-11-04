// npm run check — DB 상태 점검: RLS, 익명 접근 범위, 맞춤 매칭 함수
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const db = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await db.connect();
let failed = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "통과" : "실패"}  ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failed++;
};

try {
  const { rows: noRls } = await db.query(
    "select tablename from pg_tables where schemaname = 'public' and not rowsecurity",
  );
  check("public 테이블 모두 RLS 켜짐", noRls.length === 0, noRls.map((r) => r.tablename).join(", "));

  const { rows: counts } = await db.query(
    "select (select count(*) from deals where is_active)::int as active, (select count(*) from plans)::int as plans, (select count(*) from cards)::int as cards",
  );
  check("활성 딜이 있다", counts[0].active > 0, `${counts[0].active}건`);

  // 매칭: 조건 없는 사용자에게 SKT 전용 딜이 나오면 안 된다
  const { rows: none } = await db.query(
    "select count(*)::int as n from matching_deals('{}'::text[], '{}'::text[]) d join deal_requirements r on r.deal_id = d.id where r.brand_id = 'skt'",
  );
  check("SKT 미보유면 SKT 딜 제외", none[0].n === 0);
  const { rows: skt } = await db.query(
    "select count(*)::int as n from matching_deals(array['skt'], '{}'::text[]) d join deal_requirements r on r.deal_id = d.id where r.brand_id = 'skt'",
  );
  check("SKT 보유면 SKT 딜 포함", skt[0].n > 0, `${skt[0].n}건`);
  const { rows: youth } = await db.query(
    "select (select count(*) from matching_deals(array['skt','lgu','kbcard','hyundaicard'], '{}'::text[]) where 'youth' = any(eligibility))::int as without, (select count(*) from matching_deals(array['skt','lgu','kbcard','hyundaicard'], array['youth']) where 'youth' = any(eligibility))::int as with_",
  );
  check("청년 전용 딜은 청년 자격이 있을 때만", youth[0].without === 0, `자격 있을 때 ${youth[0].with_}건`);
} finally {
  await db.end();
}

// 익명(publishable key) 접근: 카탈로그는 읽기만, 사용자 테이블·쓰기는 막힘
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
const { data: deals } = await anon.from("deals").select("id").limit(1);
check("익명으로 딜 읽기 가능", (deals?.length ?? 0) === 1);
const { error: writeErr } = await anon.from("deals").update({ title: "x" }).eq("source_id", "kb-events").select("id");
const { data: after } = await anon.from("deals").select("id").eq("title", "x");
check("익명으로 딜 수정 불가", (after?.length ?? 0) === 0, writeErr?.message ?? "변경 0건");
const { data: profiles } = await anon.from("user_profiles").select("user_id");
check("익명으로 사용자 프로필 읽기 불가", (profiles?.length ?? 0) === 0);
const { error: insErr } = await anon.from("user_brands").insert({ user_id: "00000000-0000-0000-0000-000000000000", brand_id: "skt" });
check("익명으로 사용자 보유 정보 쓰기 불가", Boolean(insErr));

process.exit(failed ? 1 : 0);
