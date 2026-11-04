import type { Metadata } from "next";
import { saveProfile } from "@/app/actions";
import { MyView } from "@/components/views/my-view";
import { getBrands, getViewer } from "@/lib/data";

export const metadata: Metadata = { title: "내 조건" };

export default async function MyPage() {
  const [viewer, brands] = await Promise.all([getViewer(), getBrands()]);
  return <MyView viewer={viewer} brands={brands} save={saveProfile} />;
}
