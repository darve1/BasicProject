import type { Metadata } from "next";
import { Calculator } from "@/components/calculator";
import { Page, PageHead } from "@/components/ledger";
import { calculatorProps } from "@/lib/calc-props";
import { getViewer } from "@/lib/data";

export const metadata: Metadata = { title: "조합 계산기" };

export default async function LowestPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s } = await searchParams;
  const viewer = await getViewer();
  const calc = await calculatorProps(viewer);
  const ids = new Set(calc.services.map((x) => x.id));
  const initial = (s ?? "netflix,youtube,chatgpt").split(",").filter((id) => ids.has(id));
  return (
    <Page width="mid">
      <PageHead
        title="조합 계산기"
        note="쓰고 싶은 구독을 고르면 본사 단품, 통신사 상품, 멤버십 결합을 모두 비교해 가장 싼 조합과 그 조합에 맞는 카드를 보여줘요. 순위는 월 비용으로만 정해요."
      />
      <Calculator {...calc} initial={initial} />
    </Page>
  );
}
