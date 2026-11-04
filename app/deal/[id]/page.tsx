import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DealView } from "@/components/views/deal-view";
import { getBrands, getDeal, getSources, getViewer } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const deal = /^[0-9a-f-]{36}$/.test(id) ? await getDeal(id) : null;
  return { title: deal?.title ?? "할인" };
}

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [deal, viewer, brands, sources] = await Promise.all([getDeal(id), getViewer(), getBrands(), getSources()]);
  if (!deal) notFound();
  return <DealView deal={deal} viewer={viewer} brands={brands} sources={sources} conditionHref={viewer.userId ? "/my" : "/login"} />;
}
