import type { Metadata } from "next";
import { AboutView } from "@/components/views/about-view";
import { getSources } from "@/lib/data";

export const metadata: Metadata = { title: "추천 기준" };

export default async function AboutPage() {
  return <AboutView sources={await getSources()} />;
}
