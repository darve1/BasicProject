import { HOME_FILTERS, HomeView } from "@/components/views/home-view";
import { calculatorProps } from "@/lib/calc-props";
import { countDeals, getDeals, getViewer } from "@/lib/data";
import type { DealCategory } from "@/lib/types";

export default async function Home({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const category = HOME_FILTERS.includes(c as DealCategory) && c !== "all" ? (c as DealCategory) : undefined;
  const viewer = await getViewer();
  const personal = Boolean(viewer.userId && viewer.hasProfile);
  const [calc, counts, reachable] = await Promise.all([
    calculatorProps(viewer),
    countDeals(null),
    getDeals(personal ? viewer : null, { sort: "ending", limit: 400 }),
  ]);
  return (
    <HomeView
      viewer={viewer}
      calc={calc}
      reachable={reachable}
      totalCount={counts.total}
      category={category}
      conditionHref={viewer.userId ? "/my" : "/login"}
    />
  );
}
