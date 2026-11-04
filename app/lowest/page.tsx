import type { Metadata } from "next";
import { initialServices, LowestView } from "@/components/views/lowest-view";
import { calculatorProps } from "@/lib/calc-props";
import { getViewer } from "@/lib/data";

export const metadata: Metadata = { title: "조합 계산기" };

export default async function LowestPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s } = await searchParams;
  const viewer = await getViewer();
  const calc = await calculatorProps(viewer);
  return <LowestView calc={calc} initial={initialServices(s, calc, viewer.services)} />;
}
