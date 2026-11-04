// 조합 계산기 화면
import { Calculator, type CalculatorData } from "@/components/calculator";
import { Page, PageHead } from "@/components/ledger";

export function LowestView({ calc, initial }: { calc: CalculatorData; initial: string[] }) {
  return (
    <Page width="mid">
      <PageHead
        title="조합 계산기"
        note="쓰고 싶은 구독을 고르면 본사 단품, 통신사 상품, 멤버십 결합을 모두 비교해 가장 싼 조합과 그 조합에 맞는 카드를 보여줘요. 순위는 월 비용으로만 정해요."
      />
      <Calculator key={initial.join(",")} {...calc} initial={initial} />
    </Page>
  );
}

// ?s=netflix,youtube 를 계산기 첫 선택으로. 없으면 쓰는 구독, 그것도 없으면 예시
export function initialServices(s: string | undefined, calc: CalculatorData, mine: string[]): string[] {
  const ids = new Set(calc.services.map((x) => x.id));
  const from = s ? s.split(",") : mine.length ? mine : ["netflix", "youtube", "chatgpt"];
  return from.filter((id) => ids.has(id));
}
