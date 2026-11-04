// 홈 화면. 데이터는 받기만 한다 (서버 페이지와 아티팩트가 같은 화면을 쓴다)
// 펼친 장부 한 장(고르기 | 정산)이 맨 위, 그 아래 할인 장부와 옆 칸의 분야별 최저가
import Link from "next/link";
import { Calculator, type CalculatorData } from "@/components/calculator";
import { DealTable } from "@/components/deal-row";
import { Correction, Page, PageHead, SectionHead, Seal, TextTabs } from "@/components/ledger";
import { listPrice, solve } from "@/lib/combo";
import type { Viewer } from "@/lib/data";
import { DEAL_CATEGORY_LABEL, SERVICE_CATEGORY_LABEL } from "@/lib/format";
import type { Deal, DealCategory, ServiceCategory } from "@/lib/types";
import { brandMap } from "@/lib/viewer";

const EXAMPLE = ["netflix", "tving", "wavve"];
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

  // 쓰는 구독을 적었으면 그걸로, 아니면 예시 조합으로 시작한다
  const mySet = viewer.services.length > 0;
  const wanted = mySet ? viewer.services : EXAMPLE;
  const exampleNames = EXAMPLE.map((id) => brands.get(id)?.name ?? id).join(", ");
  const input = { wanted, owned: viewer.brandIds, elig: viewer.elig, allowAds: true, includeAnnual: false };
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
            ? "내 통신사·카드·자격으로 받을 수 있는 것만 적었어요. 구독을 바꿔 고르면 정산표가 바로 다시 적혀요."
            : mySet
              ? "구독을 바꿔 고르면 정산표가 바로 다시 적혀요. 내 통신사·카드·자격을 적으면 받을 수 있는 것만 남겨요."
              : `예시로 ${exampleNames}를 골라 뒀어요. 내 조건을 적으면 내 구독과 받을 수 있는 할인으로 바꿔 적어요.`
        }
      >
        {!personal && (
          <Link href={conditionHref} className="press rounded-[4px] bg-ink px-4 py-2.5 font-bold text-sheet hover:bg-ink-2">
            내 조건 적기
          </Link>
        )}
      </PageHead>

      <Calculator {...calc} initial={wanted} variant="home" />

      <div className="mt-16 grid gap-x-12 gap-y-14 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-14">
          <section aria-labelledby="mine">
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
            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
              <Link href="/deals/card" className="text-blue hover:underline">카드 제휴 전체</Link>
              <Link href="/deals/telecom" className="text-blue hover:underline">통신사 제휴 전체</Link>
              <Link href="/deals/platform" className="text-blue hover:underline">플랫폼 연계 전체</Link>
            </p>
          </section>

          {youth.length > 0 && (
            <section aria-labelledby="youth">
              <SectionHead title={<span id="youth">청년·대학생이라서 받는 혜택</span>} />
              <DealTable deals={youth} brands={brands} owned={viewer.brandIds} showType />
            </section>
          )}
        </div>

        <aside aria-labelledby="lows" className="lg:sticky lg:top-20 lg:self-start">
          <SectionHead title={<span id="lows">분야별 가장 크게 아끼는 곳</span>} />
          <ul>
            {lows.map(({ cat, top }) => (
              <li key={cat} className="border-b border-rule">
                <Link href={`/lowest/${cat}`} className="group grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-3 py-3 hover:bg-paper">
                  <span className="min-w-0">
                    <span className="block text-sm text-ink-3">{SERVICE_CATEGORY_LABEL[cat]}</span>
                    {top ? (
                      <>
                        <span className="block font-semibold group-hover:underline">{top.s.name}</span>
                        <span className="block text-sm text-ink-3">{top.plan.name}</span>
                      </>
                    ) : (
                      <span className="block text-sm text-ink-3">가격 정보 준비 중</span>
                    )}
                  </span>
                  {top && <Correction from={top.base} to={top.total} unit="월 " />}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid grid-cols-[64px_minmax(0,1fr)] items-center gap-3 text-sm text-ink-2">
            <Seal trust="official" checkedAt={today.toISOString().slice(0, 10)} />
            <p>
              인주 도장은 공식 페이지에서 그날 확인한 값, 점선 &lsquo;확인 필요&rsquo;는 다시 확인해야 하는 값이에요.{" "}
              <Link href="/about" className="font-semibold text-blue hover:underline">확인 규칙</Link>
            </p>
          </div>
        </aside>
      </div>
    </Page>
  );
}
