// 할인 피드 화면 (카드·통신사·플랫폼)
import Link from "next/link";
import { DealTable } from "@/components/deal-row";
import { Page, PageHead, SectionHead, TextTabs } from "@/components/ledger";
import type { Viewer } from "@/lib/data";
import { DEAL_CATEGORY_LABEL, DEAL_TYPE_LABEL } from "@/lib/format";
import { canGet } from "@/lib/match";
import type { Brand, Deal, DealCategory, DealType, Source } from "@/lib/types";
import { brandMap } from "@/lib/viewer";

export const DEAL_TYPES: DealType[] = ["card", "telecom", "platform"];
export const DEAL_CATS: DealCategory[] = ["subscription", "cafe", "cvs", "food", "shopping", "culture", "travel", "etc"];
const NOTE: Record<DealType, string> = {
  card: "카드사 공식 이벤트와 청구 할인이에요. 가진 카드사 것만 위에 모아요.",
  telecom: "통신사 멤버십 제휴처와 통신사 이벤트예요. 등급별 할인은 혜택 문구에 그대로 적었어요.",
  platform: "간편결제·멤버십·OTT 결합처럼 플랫폼끼리 묶인 혜택이에요.",
};

export type DealsQuery = { category?: DealCategory; q: string; sort: "ending" | "new" };

// 서버의 getDeals와 같은 규칙으로 메모리 안에서 거른다 (아티팩트용)
export function queryDeals(deals: Deal[], type: DealType, { category, q, sort }: DealsQuery): Deal[] {
  const needle = q.toLowerCase();
  const out = deals.filter(
    (d) =>
      d.is_active &&
      d.deal_type === type &&
      (!category || d.category === category) &&
      (!needle || d.title.toLowerCase().includes(needle) || (d.merchant ?? "").toLowerCase().includes(needle)),
  );
  return sort === "new"
    ? out.sort((a, b) => b.first_seen_at.localeCompare(a.first_seen_at))
    : out.sort((a, b) => (a.ends_at ?? "9999").localeCompare(b.ends_at ?? "9999"));
}

export function DealsView({
  type: t,
  query,
  viewer,
  brands,
  all,
  sources,
  conditionHref,
}: {
  type: DealType;
  query: DealsQuery;
  viewer: Viewer;
  brands: Brand[];
  all: Deal[];
  sources: Source[];
  conditionHref: string;
}) {
  const { category, q, sort } = query;
  const personal = Boolean(viewer.userId && viewer.hasProfile);
  const mine = personal ? all.filter((d) => canGet(d, viewer.brandIds, viewer.elig)) : [];
  const rest = personal ? all.filter((d) => !canGet(d, viewer.brandIds, viewer.elig)) : all;
  const map = brandMap(brands);
  const href = (patch: Partial<{ c: string; q: string; sort: string }>) => {
    const next = { c: category, q: q || undefined, sort: sort === "new" ? "new" : undefined, ...patch };
    const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
    return `/deals/${t}${qs ? `?${qs}` : ""}`;
  };

  return (
    <Page>
      <PageHead title={DEAL_TYPE_LABEL[t]} note={NOTE[t]} />

      <div className="flex flex-col gap-4 border-y border-rule py-4 md:flex-row md:items-center md:justify-between">
        <TextTabs
          label="분류"
          items={[{ href: href({ c: undefined }), label: "전체", on: !category }, ...DEAL_CATS.map((c) => ({ href: href({ c }), label: DEAL_CATEGORY_LABEL[c], on: category === c }))]}
        />
        <form action={`/deals/${t}`} className="flex shrink-0 items-center gap-2">
          {category && <input type="hidden" name="c" value={category} />}
          <label className="sr-only" htmlFor="q">브랜드·혜택 검색</label>
          <input
            id="q"
            name="q"
            key={q}
            defaultValue={q}
            placeholder="스타벅스, CGV, 넷플릭스"
            className="w-full min-w-0 min-h-10 rounded-[4px] border border-rule-field bg-sheet px-3 placeholder:text-ink-3 md:w-56"
          />
          <label className="sr-only" htmlFor="sort">정렬</label>
          <select id="sort" name="sort" key={sort} defaultValue={sort} className="min-h-10 rounded-[4px] border border-rule-field bg-sheet px-2 text-sm">
            <option value="ending">마감 순</option>
            <option value="new">새로 온 순</option>
          </select>
          <button type="submit" className="min-h-10 rounded-[4px] bg-ink px-3.5 font-bold whitespace-nowrap text-sheet hover:bg-ink-2">
            찾기
          </button>
        </form>
      </div>
      {q && (
        <p className="mt-3 text-sm text-ink-2">
          &lsquo;{q}&rsquo; 검색 결과 {all.length}건.{" "}
          <Link href={href({ q: undefined })} className="ml-2 font-semibold text-blue hover:underline">검색어 지우기</Link>
        </p>
      )}

      <div className="mt-8 space-y-12">
        {personal && (
          <section aria-labelledby="mine">
            <SectionHead title={<span id="mine">받을 수 있어요 {mine.length}건</span>} />
            <DealTable deals={mine} brands={map} owned={viewer.brandIds} empty="지금 조건으로 받을 수 있는 혜택이 이 분류에는 없어요. 아래에서 조건을 하나 더 갖추면 받을 수 있는 혜택을 확인해 보세요." />
          </section>
        )}
        <section aria-labelledby="rest">
          <SectionHead title={<span id="rest">{personal ? `조건을 갖추면 받아요 ${rest.length}건` : `전체 ${rest.length}건`}</span>}>
            {!personal && (
              <Link href={conditionHref} className="text-sm font-semibold text-blue hover:underline">
                내 조건 적고 내 것만 보기
              </Link>
            )}
          </SectionHead>
          {personal && <p className="py-2 text-sm text-ink-3">빈 원이 아직 없는 조건이에요.</p>}
          <DealTable deals={rest} brands={map} owned={personal ? viewer.brandIds : null} empty={q ? "검색어를 줄여서 다시 찾아보세요." : "아직 모은 혜택이 없어요."} />
        </section>

        <section aria-labelledby="sources">
          <SectionHead title={<span id="sources">이 목록의 출처</span>} />
          <ul className="text-sm">
            {sources
              .filter((s) => s.deal_type === t)
              .map((s) => (
                <li key={s.id} className="grid gap-1 border-b border-rule py-3 md:grid-cols-[260px_1fr]">
                  <a href={s.url} target="_blank" rel="noreferrer" className="font-semibold hover:underline">
                    {s.name}
                  </a>
                  <span className="text-ink-2">
                    {s.mode === "crawl" ? "자동 수집" : "공식 페이지 확인 후 수동 등록"}
                    {s.last_run_at && <span className="block text-ink-3 tabular-nums">{s.last_run_at.slice(0, 10)}에 {s.last_count ?? 0}건</span>}
                    {s.note && <span className="block text-ink-3">{s.note}</span>}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      </div>
    </Page>
  );
}
