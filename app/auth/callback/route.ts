import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 매직링크를 누르면 여기로 온다: 코드(또는 토큰 해시)를 세션으로 바꾸고 원래 가려던 곳으로
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") ?? "/my";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/my";
  const db = await createClient();
  const { error } = code
    ? await db.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await db.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("no code") };
  if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}
