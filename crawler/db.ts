// 크롤러·시드 스크립트 전용 service role 클라이언트. 브라우저 코드에서 import 하지 말 것
import { createClient } from "@supabase/supabase-js";

export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error(".env.local 에 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다");
  return createClient(url, key, { auth: { persistSession: false } });
}
