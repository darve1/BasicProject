// 분야별 최저가 화면 (OTT·AI·배달·기타)
import Link from "next/link";
import type { CalculatorData } from "@/components/calculator";
import { Correction, Page, PageHead, Seal, SectionHead } from "@/components/ledger";
import { isAvailable, listPrice, solve } from "@/lib/combo";
import { ROUTE_LABEL, SERVICE_CATEGORY_LABEL, sourceName, won } from "@/lib/format";
import type { ServiceCategory } from "@/lib/types";

export const SERVICE_CATS: ServiceCategory[] = ["ott", "ai", "delivery", "etc"];

export function CategoryView({ category: cat, calc }: { category: ServiceCategory; calc: CalculatorData }) {
  const services = calc.services.filter((s) => s.category === cat);
  const input = { owned: calc.owned, elig: calc.elig, allowAds: true, includeAnnual: false };
  const nameOf = (id: string) => calc.brands.find((b) => b.id === id)?.name ?? id;

  return (
    <Page>
      <PageHead
        title={`${SERVICE_CATEGORY_LABEL[cat]} 최저가`}
        note="서비스마다 가입할 수 있는 모든 경로를 월 요금 순으로 적었어요. 파란 줄이 내 조건으로 가장 싼 경로, 흐린 줄은 내 조건으로는 가입할 수 없는 경로예요."
      />
      <div className="space-y-12">
        {services.map((s) => {
          const best = solve(calc.plans, { ...input, wanted: [s.id] }).combos[0];
          const list = listPrice(calc.plans, s.id, true);
          const routes = calc.plans.filter((p) => p.includes.some((i) => i.service_id === s.id)).sort((a, b) => a.price_monthly - b.price_monthly);
          const ownedExtra = best?.items.some((i) => i.price < i.plan.price_monthly);
          return (
            <section key={s.id} aria-labelledby={`svc-${s.id}`}>
              <SectionHead title={<span id={`svc-${s.id}`}>{s.name}</span>}>
                <div className="flex items-baseline gap-3">
                  {best ? (
                    <>
                      <span className="text-sm text-ink-3">{ownedExtra ? "이미 내는 멤버십 포함" : "내 조건 최저"}</span>
                      <Correction from={list} to={best.total} unit="월 " big />
                    </>
                  ) : (
                    <span className="text-sm text-ink-3">내 조건으로 가입할 수 있는 경로 정보 없음</span>
                  )}
                </div>
              </SectionHead>
              <table className="w-full text-left">
                <caption className="sr-only">{s.name} 가입 경로 {routes.length}개</caption>
                <thead className="text-sm text-ink-3">
                  <tr className="border-b border-rule">
                    <th scope="col" className="py-2 pr-4 font-normal">가입 경로</th>
                    <th scope="col" className="hidden py-2 pr-4 font-normal md:table-cell">누가</th>
                    <th scope="col" className="hidden py-2 pr-4 font-normal lg:table-cell">확인</th>
                    <th scope="col" className="py-2 text-right font-normal">월 요금</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((p) => {
                    const ok = isAvailable(p, { ...input, wanted: [s.id] });
                    const tier = p.includes.find((i) => i.service_id === s.id);
                    const isBest = best?.items.some((i) => i.plan.id === p.id);
                    const others = p.includes.filter((i) => i.service_id !== s.id).map((i) => nameOf(i.service_id));
                    const who = p.requires_brand_ids.length ? `${p.requires_brand_ids.map(nameOf).join("·")} 고객` : "누구나";
                    return (
                      <tr key={p.id} className={`border-b border-rule align-top ${ok ? "" : "text-ink-3"}`}>
                        <td className="py-3 pr-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <a href={p.signup_url ?? p.source_url} target="_blank" rel="noreferrer" className={`font-semibold hover:underline ${isBest ? "text-blue" : ""}`}>
                                {p.name}
                                <span className="sr-only">(공식 페이지, 새 창)</span>
                              </a>
                              <p className="text-sm text-ink-3">
                                {ROUTE_LABEL[p.route]}, {tier?.tier}
                                {tier?.ads ? ", 광고 포함" : ""}
                              </p>
                              {others.length > 0 && <p className="text-sm text-ink-3">함께: {others.join(", ")}</p>}
                              <p className="text-sm text-ink-3">근거: {sourceName(p.source_url, p.source_trust)}</p>
                              <p className="mt-1 text-sm md:hidden">
                                {who}
                                {p.eligibility.length > 0 && ", 자격 필요"}
                                {p.billing === "annual" && ", 연간 결제"}
                              </p>
                              {p.conditions[0] && <p className="text-sm text-ink-3 md:hidden">{p.conditions[0]}</p>}
                            </div>
                            <span className="shrink-0 lg:hidden">
                              <Seal size="sm" trust={p.source_trust} checkedAt={p.checked_at} needsCheck={p.status === "needs_check"} />
                            </span>
                          </div>
                        </td>
                        <td className="hidden py-3 pr-4 text-sm md:table-cell">
                          {who}
                          {p.eligibility.length > 0 && ", 자격 필요"}
                          {p.billing === "annual" && ", 연간 결제"}
                          {p.conditions[0] && <span className="block text-ink-3">{p.conditions[0]}</span>}
                        </td>
                        <td className="hidden py-3 pr-4 lg:table-cell">
                          <Seal size="sm" trust={p.source_trust} checkedAt={p.checked_at} needsCheck={p.status === "needs_check"} />
                        </td>
                        <td className={`py-3 text-right font-semibold whitespace-nowrap tabular-nums ${isBest ? "text-blue" : ""}`}>{won(p.price_monthly)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Link href={`/lowest?s=${s.id}`} className="mt-3 inline-block text-sm font-semibold text-blue hover:underline">
                다른 구독과 함께 계산
              </Link>
            </section>
          );
        })}
      </div>
    </Page>
  );
}
