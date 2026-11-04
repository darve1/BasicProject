// supabase/migrations/*.sql 을 이름순으로 한 번씩 적용한다. 적용 기록은 app_private.migrations
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const url = process.env.SUPABASE_DB_URL;
if (!url) throw new Error(".env.local 에 SUPABASE_DB_URL 이 없습니다");

const dir = join(process.cwd(), "supabase", "migrations");
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(`create schema if not exists app_private;
    create table if not exists app_private.migrations (name text primary key, applied_at timestamptz not null default now());`);
  const done = new Set((await client.query("select name from app_private.migrations")).rows.map((r) => r.name));
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    if (done.has(file)) continue;
    await client.query("begin");
    try {
      await client.query(readFileSync(join(dir, file), "utf8"));
      await client.query("insert into app_private.migrations (name) values ($1)", [file]);
      await client.query("commit");
      console.log(`적용: ${file}`);
    } catch (e) {
      await client.query("rollback");
      throw e;
    }
  }
  console.log("마이그레이션 완료");
} finally {
  await client.end();
}
