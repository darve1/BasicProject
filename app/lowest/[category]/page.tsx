import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryView, SERVICE_CATS } from "@/components/views/category-view";
import { calculatorProps } from "@/lib/calc-props";
import { getViewer } from "@/lib/data";
import { SERVICE_CATEGORY_LABEL } from "@/lib/format";
import type { ServiceCategory } from "@/lib/types";

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  return { title: `${SERVICE_CATEGORY_LABEL[category as ServiceCategory] ?? ""} 최저가` };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!SERVICE_CATS.includes(category as ServiceCategory)) notFound();
  const calc = await calculatorProps(await getViewer());
  return <CategoryView category={category as ServiceCategory} calc={calc} />;
}
