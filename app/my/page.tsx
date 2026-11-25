import type { Metadata } from "next";
import { saveProfile } from "@/app/actions";
import { MyView } from "@/components/views/my-view";
import { getBrands, getDeals, getPlans, getViewer } from "@/lib/data";

export const metadata: Metadata = { title: "내 조건" };

export default async function MyPage() {
  // 할인과 가입 경로는 조건을 고를 때 "이 조건으로 받는 것"을 바로 세어 보여 주는 데 쓴다
  const [viewer, brands, deals, plans] = await Promise.all([getViewer(), getBrands(), getDeals(null, { limit: 2000 }), getPlans()]);
  return <MyView viewer={viewer} brands={brands} save={saveProfile} deals={deals} plans={plans} />;
}
