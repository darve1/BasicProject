// 홈 화면. 데이터는 받기만 한다 (서버 페이지와 아티팩트가 같은 화면을 쓴다)
import Link from "next/link";
import { Calculator, type CalculatorData } from "@/components/calculator";
import { DealTable } from "@/components/deal-row";
import { Correction, Page, PageHead, SectionHead, Seal, TextTabs } from "@/components/ledger";
import { baseline, listPrice, solve } from "@/lib/combo";
import type { Viewer } from "@/lib/data";
import { DEAL_CATEGORY_LABEL, ROUTE_LABEL, SERVICE_CATEGORY_LABEL, TODAY, won } from "@/lib/format";
import { recommend } from "@/lib/recommend";
import type { Deal, DealCategory, ServiceCategory } from "@/lib/types";
import { brandMap } from "@/lib/viewer";

const EXAMPLE = ["netflix", "tving", "wavve"];
const REC_LABEL = { switch: "바꾸기", card: "카드", deal: "할인" } as const;
export const HOME_FILTERS: (DealCategory | "all")[] = ["all", "subscription", "cafe", "cvs", "food", "shopping", "culture", "travel"];

export type HomeViewProps = {
  viewer: Viewer;
  calc: CalculatorData;
  reachable: Deal[]; // 받을 수 있는 할인(조건을 적었으면 내 것만, 아니면 전부), 마감 순
  totalCount: number;
  category?: DealCategory;
  conditionHref: string; // 조건 적기 버튼이 갈 곳
};

export function HomeView({ viewer, calc, reachable, totalCount, category, conditionHref }: HomeViewProps) {
  const personal = Boolean(viewer.userId && viewer.hasProfile);
  const deals = reachable.filter((d) => !category || d.category === category).slice(0, 10);
  const youth = viewer.elig.length ? reachable.filter((x) => x.eligibility.some((e) => viewer.elig.includes(e))).slice(0, 5) : [];
  const brands = brandMap(calc.brands);

  // 쓰는 구독을 적었으면 그걸로, 아니면 예시 조합으로 정산·추천한다
  const mySet = viewer.services.length > 0;
  const wanted = mySet ? viewer.services : EXAMPLE;
  const wantedNames = wanted.map((id) => brands.get(id)?.name ?? id);
  const setLabel = wantedNames.length > 3 ? `${wantedNames.slice(0, 3).join("·")} 외 ${wantedNames.length - 3}개` : wantedNames.join("·");
  const calcHref = `/lowest?s=${wanted.join(",")}`;
  const input = { wanted, owned: viewer.brandIds, elig: viewer.elig, allowAds: true, includeAnnual: false };
  const recs = recommend({ plans: calc.plans, cards: calc.cards, deals: reachable, brands: calc.brands, input, today: TODAY() });
  const recTotal = recs.filter((r) => r.kind === "switch").reduce((a, r) => a + (r.saving ?? 0), 0);
  const ex = solve(calc.plans, input).combos[0];
  const exBase = baseline(calc.plans, input);
  const today = new Date();

  const cats: ServiceCategory[] = ["ott", "ai", "delivery", "etc"];
  const lows = cats.map((cat) => {
    const rows = calc.services
      .filter((s) => s.category === cat)
      .map((s) => {
        const r = solve(calc.plans, { ...input, wanted: [s.id] }).combos[0];
        return r ? { s, total: r.total, base: listPrice(calc.plans, s.id, true), plan: r.items[0].plan } : null;
      })
      .filter((x) => x !== null)
      .sort((a, b) => (b.base ?? b.total) - b.total - ((a.base ?? a.total) - a.total));
    return { cat, top: rows[0] };
  });

  return (
    <Page>
      <PageHead
        title={`${today.getMonth() + 1}월 구독 정산`}
        note={
          personal
            ? "내 통신사·카드·자격으로 받을 수 있는 것만 적었어요."
            : "지금은 조건 없이 전부 보여주고 있어요. 내 통신사·카드·자격을 적으면 받을 수 있는 것만 남겨요."
        }
      >
        {!personal && (
          <Link href={conditionHref} className="rounded-[4px] bg-ink px-4 py-2 font-bold text-sheet hover:bg-ink-2">
            내 조건 적기
          </Link>
        )}
      </PageHead>

      <div className="grid gap-x-12 gap-y-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-labelledby="recs" className="lg:col-start-1">
          <SectionHead title={<span id="recs">{mySet ? "이번 달 추천" : "이번 달 추천 · 예시"}</span>}>
            {recTotal > 0 && <span className="text-sm font-bold text-red tabular-nums">바꾸면 월 {won(recTotal)} 덜 내요</span>}
          </SectionHead>
          {recs.length === 0 ? (
            <p className="border-b border-rule py-4 text-ink-2">지금 조건으로는 더 아낄 방법을 찾지 못했어요.</p>
          ) : (
            <ul>
              {recs.map((r, i) => {
                const body = (
                  <>
                    <span className="text-sm font-semibold text-ink-3">{REC_LABEL[r.kind]}</span>
                    <span className="min-w-0">
                      <span className="block font-semibold group-hover:underline">{r.title}</span>
                      <span className="block text-sm text-ink-2">{r.reason}</span>
                    </span>
                    <span className="text-right whitespace-nowrap">
                      {r.saving ? <span className="block font-bold text-blue tabular-nums">월 −{won(r.saving)}</span> : null}
                      <span className="block text-sm text-ink-3">{r.external ? "공식 페이지" : "자세히"}</span>
                    </span>
                  </>
                );
                const cls = "group grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-4 py-3.5 hover:bg-paper";
                return (
                  <li key={i} className="border-b border-rule">
                    {r.external ? (
                      <a href={r.href} target="_blank" rel="noreferrer" className={cls}>
                        {body}
                        <span className="sr-only">(새 창)</span>
                      </a>
                    ) : (
                      <Link href={r.href} className={cls}>
                        {body}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {!mySet && (
            <p className="mt-3 text-sm text-ink-2">
              <Link href={conditionHref} className="font-semibold text-blue hover:underline">쓰는 구독을 적으면</Link> 내 구독 기준으로 추천해요.
            </p>
          )}
        </section>

        {ex && (
          <section aria-labelledby="statement" className="lg:col-start-1">
            <SectionHead title={<span id="statement">{mySet ? "내 구독" : "예시"} {setLabel} 정산표</span>}>
              <Link href={calcHref} className="text-sm font-semibold text-blue hover:underline">
                다른 구독으로 계산
              </Link>
            </SectionHead>
            <table className="w-full text-left">
              <thead className="sr-only">
                <tr>
                  <th scope="col">가입 경로</th>
                  <th scope="col">확인</th>
                  <th scope="col">월 요금</th>
                </tr>
              </thead>
              <tbody>
                {ex.items.map((it) => (
                  <tr key={it.plan.id} className="border-b border-rule align-top">
                    <td className="py-3 pr-4">
                      <a href={it.plan.signup_url ?? it.plan.source_url} target="_blank" rel="noreferrer" className="font-semibold hover:underline">
                        {it.plan.name}
                        <span className="sr-only">(공식 페이지, 새 창)</span>
                      </a>
                      <p className="mt-0.5 text-sm text-ink-3">
                        {ROUTE_LABEL[it.plan.route]}
                        {it.price < it.plan.price_monthly && " · 이미 내는 멤버십이라 추가 비용 0원"}
                      </p>
                    </td>
                    <td className="hidden py-3 pr-4 md:table-cell">
                      <Seal size="sm" trust={it.plan.source_trust} checkedAt={it.plan.checked_at} needsCheck={it.plan.status === "needs_check"} />
                    </td>
                    <td className="py-3 text-right whitespace-nowrap tabular-nums">{won(it.price)}</td>
                  </tr>
                ))}
                {exBase != null && (
                  <tr className="text-sm text-ink-3">
                    <td className="py-2.5">본사 단품으로 따로 낼 때</td>
                    <td className="hidden md:table-cell" />
                    <td className="py-2.5 text-right tabular-nums">{won(exBase)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-[3px] border-double border-ink">
                  <td className="pt-3 font-bold">월 합계</td>
                  <td className="hidden md:table-cell" />
                  <td className="pt-3 text-right">
                    <Correction from={exBase} to={ex.total} big />
                  </td>
                </tr>
              </tfoot>
            </table>
            {exBase != null && exBase > ex.total && (
              <p className="mt-2 text-right font-bold text-red tabular-nums">
                월 {won(exBase - ex.total)} · 1년 {won((exBase - ex.total) * 12)} 덜 내요
              </p>
            )}
            <Link href={calcHref} className="mt-4 flex items-center justify-between rounded-[4px] border border-ink px-4 py-3 font-semibold lg:hidden">
              내 구독으로 직접 계산하기
              <span className="text-sm font-normal text-ink-3">조합 계산기</span>
            </Link>
          </section>
        )}

        <aside className="hidden lg:col-start-2 lg:row-span-5 lg:row-start-1 lg:block lg:self-start lg:sticky lg:top-20">
          <Calculator {...calc} initial={wanted} compact />
        </aside>

        <section aria-labelledby="mine" className="lg:col-start-1">
          <SectionHead title={<span id="mine">{personal ? `받을 수 있는 할인 ${reachable.length}건` : `모은 할인 ${totalCount}건`}</span>}>
            <span className="text-sm text-ink-3">마감 가까운 순</span>
          </SectionHead>
          <div className="py-3">
            <TextTabs
              label="분류"
              items={HOME_FILTERS.map((f) => ({
                href: f === "all" ? "/" : `/?c=${f}`,
                label: f === "all" ? "전체" : DEAL_CATEGORY_LABEL[f],
                on: (category ?? "all") === f,
              }))}
            />
          </div>
          <DealTable
            deals={deals}
            brands={brands}
            owned={personal ? viewer.brandIds : null}
            showType
            empty="이 분류에는 지금 받을 수 있는 할인이 없어요. 다른 분류를 골라 보세요."
          />
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold">
            <Link href="/deals/card" className="text-blue hover:underline">카드 제휴 전체</Link>
            <Link href="/deals/telecom" className="text-blue hover:underline">통신사 제휴 전체</Link>
            <Link href="/deals/platform" className="text-blue hover:underline">플랫폼 연계 전체</Link>
          </p>
        </section>

        {youth.length > 0 && (
          <section aria-labelledby="youth" className="lg:col-start-1">
            <SectionHead title={<span id="youth">청년·대학생이라서 받는 혜택</span>} />
            <DealTable deals={youth} brands={brands} owned={viewer.brandIds} showType />
          </section>
        )}

        <section aria-labelledby="lows" className="lg:col-start-1">
          <SectionHead title={<span id="lows">분야별 가장 크게 아끼는 곳</span>} />
          <ul>
            {lows.map(({ cat, top }) => (
              <li key={cat} className="border-b border-rule">
                <Link href={`/lowest/${cat}`} className="group grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-4 py-3.5 hover:bg-paper">
                  <span className="text-sm font-semibold text-ink-2">{SERVICE_CATEGORY_LABEL[cat]}</span>
                  {top ? (
                    <span className="min-w-0">
                      <span className="block truncate font-semibold group-hover:underline">{top.s.name}</span>
                      <span className="block truncate text-sm text-ink-3">{top.plan.name}</span>
                    </span>
                  ) : (
                    <span className="text-sm text-ink-3">가격 정보 준비 중</span>
                  )}
                  {top && <Correction from={top.base} to={top.total} unit="월 " />}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center gap-4 text-sm text-ink-2">
            <Seal trust="official" checkedAt={today.toISOString().slice(0, 10)} />
            <p className="max-w-[52ch]">
              인주 도장은 공식 페이지에서 그날 확인한 값, 점선 &lsquo;확인 필요&rsquo;는 다시 확인해야 하는 값이에요.{" "}
              <Link href="/about" className="font-semibold text-blue hover:underline">확인 규칙</Link>
            </p>
          </div>
        </section>
      </div>
    </Page>
  );
}
