// RawDeal → 태깅 → deals/deal_requirements 저장. 크롤러와 시드 딜이 같은 경로를 쓴다
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Brand, DealType, SourceTrust } from "../lib/types";
import { clean, parsePeriod, tagDeal } from "./tagging";
import type { RawDeal } from "./types";

export type DealRow = {
  source_id: string;
  external_id: string;
  deal_type: DealType;
  category: string;
  related_service_ids: string[];
  title: string;
  benefit_text: string | null;
  merchant: string | null;
  starts_at: string | null;
  ends_at: string | null;
  url: string;
  eligibility: string[];
  is_active: boolean;
  source_trust: SourceTrust;
  last_seen_at: string;
};

export function toRow(
  raw: RawDeal,
  src: { id: string; brandId: string; dealType: DealType; trust?: SourceTrust },
  brands: Brand[],
  now = new Date(),
): { row: DealRow; requirements: string[] } {
  const text = [raw.title, raw.benefit_text, raw.merchant].filter(Boolean).join(" ");
  const tags = tagDeal(text, src.brandId, brands, raw.category);
  const period =
    raw.starts_at !== undefined || raw.ends_at !== undefined
      ? { starts_at: raw.starts_at ?? null, ends_at: raw.ends_at ?? null }
      : parsePeriod(raw.period, now);
  const today = now.toISOString().slice(0, 10);
  return {
    row: {
      source_id: src.id,
      external_id: raw.external_id,
      deal_type: src.dealType,
      category: tags.category,
      related_service_ids: tags.related_service_ids,
      title: clean(raw.title),
      benefit_text: clean(raw.benefit_text) || null,
      merchant: clean(raw.merchant) || null,
      starts_at: period.starts_at,
      ends_at: period.ends_at,
      url: raw.url,
      eligibility: tags.eligibility,
      is_active: !period.ends_at || period.ends_at >= today,
      source_trust: src.trust ?? "official",
      last_seen_at: now.toISOString(),
    },
    requirements: raw.requirements ?? tags.requirements,
  };
}

export async function saveDeals(
  db: SupabaseClient,
  items: { row: DealRow; requirements: string[] }[],
): Promise<void> {
  for (let i = 0; i < items.length; i += 200) {
    const chunk = items.slice(i, i + 200);
    const { data, error } = await db
      .from("deals")
      .upsert(chunk.map((c) => c.row), { onConflict: "source_id,external_id" })
      .select("id, external_id");
    if (error) throw error;
    const idOf = new Map(data.map((d) => [d.external_id, d.id as string]));
    const ids = [...idOf.values()];
    const { error: delErr } = await db.from("deal_requirements").delete().in("deal_id", ids);
    if (delErr) throw delErr;
    const reqs = chunk.flatMap((c) =>
      [...new Set(c.requirements)].map((brand_id) => ({ deal_id: idOf.get(c.row.external_id)!, brand_id })),
    );
    if (reqs.length) {
      const { error: reqErr } = await db.from("deal_requirements").insert(reqs);
      if (reqErr) throw reqErr;
    }
  }
}
