import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEAL_CATS, DEAL_TYPES, DealsView } from "@/components/views/deals-view";
import { getBrands, getDeals, getSources, getViewer } from "@/lib/data";
import { DEAL_TYPE_LABEL } from "@/lib/format";
import type { DealCategory, DealType } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  return { title: DEAL_TYPE_LABEL[type as DealType] ?? "할인" };
}

type Search = { c?: string; q?: string; sort?: string };

export default async function DealsPage({ params, searchParams }: { params: Promise<{ type: string }>; searchParams: Promise<Search> }) {
  const { type } = await params;
  if (!DEAL_TYPES.includes(type as DealType)) notFound();
  const t = type as DealType;
  const sp = await searchParams;
  const query = {
    category: DEAL_CATS.includes(sp.c as DealCategory) ? (sp.c as DealCategory) : undefined,
    q: (sp.q ?? "").trim().slice(0, 40),
    sort: sp.sort === "new" ? ("new" as const) : ("ending" as const),
  };
  const viewer = await getViewer();
  const [brands, all, sources] = await Promise.all([getBrands(), getDeals(null, { type: t, ...query }), getSources()]);
  return (
    <DealsView
      type={t}
      query={query}
      viewer={viewer}
      brands={brands}
      all={all}
      sources={sources}
      conditionHref={viewer.userId ? "/my" : "/login"}
    />
  );
}
