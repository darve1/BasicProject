"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AGE_BANDS, ROLES } from "@/lib/eligibility";
import { createClient } from "@/lib/supabase/server";

export type FormState = { ok: boolean; message: string } | null;

export async function sendMagicLink(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "이메일 주소를 다시 확인해 주세요." };
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const db = await createClient();
  const { error } = await db.auth.signInWithOtp({ email, options: { emailRedirectTo: `${origin}/auth/callback?next=/my` } });
  if (error) {
    return {
      ok: false,
      message: /rate|limit/i.test(error.message)
        ? "메일을 너무 자주 요청했어요. 잠시 뒤에 다시 시도해 주세요."
        : "로그인 메일을 보내지 못했어요. 잠시 뒤에 다시 시도해 주세요.",
    };
  }
  return { ok: true, message: `${email} 로 로그인 링크를 보냈어요. 메일함에서 링크를 눌러 주세요.` };
}

export async function signOut() {
  const db = await createClient();
  await db.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

const BAND_IDS = new Set<string>(AGE_BANDS.map((b) => b.id));
const ROLE_IDS = new Set<string>(ROLES.map((r) => r.id));

export async function saveProfile(_: FormState, form: FormData): Promise<FormState> {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");

  const ageBand = String(form.get("age_band") ?? "");
  const roles = form.getAll("roles").map(String).filter((r) => ROLE_IDS.has(r));
  const brandIds = [...new Set(form.getAll("brands").map(String))];
  const services = [...new Set(form.getAll("services").map(String))];

  const { error: pErr } = await db
    .from("user_profiles")
    .upsert({ user_id: user.id, age_band: BAND_IDS.has(ageBand) ? ageBand : null, roles, services, updated_at: new Date().toISOString() });
  if (pErr) return { ok: false, message: "저장하지 못했어요. 다시 시도해 주세요." };

  const { error: dErr } = await db.from("user_brands").delete().eq("user_id", user.id);
  if (dErr) return { ok: false, message: "저장하지 못했어요. 다시 시도해 주세요." };
  if (brandIds.length) {
    const { error: iErr } = await db.from("user_brands").insert(brandIds.map((brand_id) => ({ user_id: user.id, brand_id })));
    if (iErr) return { ok: false, message: "저장하지 못했어요. 다시 시도해 주세요." };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "저장했어요. 홈의 추천과 할인 목록이 내 조건에 맞춰 바뀌었어요." };
}
