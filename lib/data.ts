// 서버 전용 데이터 접근. 페이지는 여기 함수만 쓴다
import "server-only";
import { eligibilityTags } from "./eligibility";
import { createClient } from "./supabase/server";
import type { Brand, Card, Deal, DealType, Plan, Source } from "./types";

export type Viewer = {
  userId: string | null;
  email: string | null;
  ageBand: string | null;
  roles: string[];
  services: string[]; // 쓰는(쓰려는) 구독
  brandIds: string[];
  elig: string[];
  hasProfile: boolean;
};

export async function getViewer(): Promise<Viewer> {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { userId: null, email: null, ageBand: null, roles: [], services: [], brandIds: [], elig: [], hasProfile: false };
  const [{ data: profile }, { data: owned }] = await Promise.all([
    db.from("user_profiles").select("age_band, roles, services").eq("user_id", user.id).maybeSingle(),
    db.from("user_brands").select("brand_id").eq("user_id", user.id),
  ]);
  const brandIds = (owned ?? []).map((r) => r.brand_id as string);
  const roles = (profile?.roles as string[] | undefined) ?? [];
  const ageBand = (profile?.age_band as string | null | undefined) ?? null;
  return {
    userId: user.id,
    email: user.email ?? null,
    ageBand,
    roles,
    services: (profile?.services as string[] | undefined) ?? [],
    brandIds,
    elig: eligibilityTags(ageBand, roles),
    hasProfile: Boolean(profile) || brandIds.length > 0,
  };
}

export async function getBrands(): Promise<Brand[]> {
  const db = await createClient();
  const { data } = await db.from("brands").select("*").order("sort_order");
  return (data ?? []) as Brand[];
}

export async function getPlans(): Promise<Plan[]> {
  const db = await createClient();
  const { data } = await db.from("plans").select("*").order("price_monthly");
  return (data ?? []) as Plan[];
}

export async function getCards(): Promise<Card[]> {
  const db = await createClient();
  const { data } = await db.from("cards").select("*");
  return (data ?? []) as Card[];
}

export async function getSources(): Promise<Source[]> {
  const db = await createClient();
  const { data } = await db.from("sources").select("*").order("mode").order("id");
  return (data ?? []) as Source[];
}

const DEAL_SELECT = "*, deal_requirements(brand_id)";

export type DealQuery = {
  type?: DealType;
  category?: string;
  q?: string;
  sort?: "ending" | "new";
  subscriptionOnly?: boolean;
  limit?: number;
};

// 로그인했고 조건을 등록했으면 matching_deals RPC로 내 것만, 아니면 전체
export async function getDeals(viewer: Viewer | null, query: DealQuery = {}): Promise<Deal[]> {
  const db = await createClient();
  const personal = viewer?.userId && viewer.hasProfile;
  let req = personal
    ? db.rpc("matching_deals", { p_brand_ids: viewer!.brandIds, p_elig: viewer!.elig }).select(DEAL_SELECT)
    : db.from("deals").select(DEAL_SELECT).eq("is_active", true);
  if (query.type) req = req.eq("deal_type", query.type);
  if (query.category) req = req.eq("category", query.category);
  if (query.subscriptionOnly) req = req.eq("category", "subscription");
  if (query.q) req = req.or(`title.ilike.%${query.q.replace(/[%,()]/g, "")}%,merchant.ilike.%${query.q.replace(/[%,()]/g, "")}%`);
  req =
    query.sort === "new"
      ? req.order("first_seen_at", { ascending: false })
      : req.order("ends_at", { ascending: true, nullsFirst: false });
  const { data } = await req.limit(query.limit ?? 300);
  return (data ?? []) as Deal[];
}

export async function countDeals(viewer: Viewer | null): Promise<{ total: number; mine: number | null }> {
  const db = await createClient();
  const { count } = await db.from("deals").select("id", { count: "exact", head: true }).eq("is_active", true);
  let mine: number | null = null;
  if (viewer?.userId && viewer.hasProfile) {
    const { count: c } = await db
      .rpc("matching_deals", { p_brand_ids: viewer.brandIds, p_elig: viewer.elig }, { count: "exact", head: true });
    mine = c ?? 0;
  }
  return { total: count ?? 0, mine };
}

export async function getDeal(id: string): Promise<Deal | null> {
  const db = await createClient();
  const { data } = await db.from("deals").select(DEAL_SELECT).eq("id", id).maybeSingle();
  return (data as Deal | null) ?? null;
}
