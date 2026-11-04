// npm run demo-link [-- 이메일] — 시연용 계정의 1회용 로그인 링크를 만든다 (메일 발송 없이)
// 링크는 한 번만 쓸 수 있고 1시간 안에 열어야 한다. 화면 공유 중에는 출력하지 말 것
import { adminClient } from "../crawler/db";

const email = process.argv[2] ?? "demo-student@example.com";
const origin = process.env.APP_ORIGIN ?? "http://localhost:3000";
const db = adminClient();
const { data, error } = await db.auth.admin.generateLink({ type: "magiclink", email });
if (error?.message.match(/not.*found|User not found/i) || (!data?.properties && !error)) {
  await db.auth.admin.createUser({ email, email_confirm: true });
}
const res = error ? await db.auth.admin.generateLink({ type: "magiclink", email }) : { data, error };
if (res.error || !res.data.properties) throw res.error ?? new Error("링크를 만들지 못했어요");
console.log(`${origin}/auth/callback?token_hash=${res.data.properties.hashed_token}&type=magiclink&next=/my`);
