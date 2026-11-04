import Link from "next/link";
import { ELIGIBILITY_LABEL } from "@/lib/eligibility";
import { DEAL_CATEGORY_LABEL, DEAL_TYPE_LABEL, endsLabel, period } from "@/lib/format";
import type { Brand, Deal } from "@/lib/types";
import { Need, Seal } from "./marks";

// 열 배치는 화면이 아니라 표가 놓인 칸의 너비로 정한다 (홈 왼쪽 칸, 목록 전체 폭 모두 같은 부품)
const COLS = "@2xl:grid-cols-[minmax(0,1fr)_190px_140px_64px]";

// 장부 행: 혜택 | 받는 조건 | 기간 | 도장. 좁은 칸에서는 도장을 오른쪽에 두고 조건·기간을 제목 아래 한 줄로
export function DealRow({ deal, brands, owned, showType = false }: { deal: Deal; brands: Map<string, Brand>; owned: string[] | null; showType?: boolean }) {
  const reqs = (deal.deal_requirements ?? []).map((r) => r.brand_id);
  const soon = endsLabel(deal.ends_at);
  return (
    <li data-category={deal.category} className={`group relative grid grid-cols-[minmax(0,1fr)_48px] gap-x-4 gap-y-1.5 border-b border-rule py-3.5 @2xl:items-center @2xl:gap-x-6 ${COLS} hover:bg-paper`}>
      <div className="col-start-1 row-start-1 min-w-0">
        <Link href={`/deal/${deal.id}`} className="font-semibold after:absolute after:inset-0 group-hover:underline">
          {deal.title}
        </Link>
        {deal.benefit_text && <p className="mt-0.5 line-clamp-2 text-sm text-ink-2">{deal.benefit_text}</p>}
        <p className="mt-0.5 text-sm text-ink-3">
          {showType && `${DEAL_TYPE_LABEL[deal.deal_type]} · `}
          {DEAL_CATEGORY_LABEL[deal.category]}
        </p>
      </div>
      <div className="col-start-1 row-start-2 flex flex-wrap items-center gap-x-3 gap-y-1 @2xl:contents">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 @2xl:col-start-2 @2xl:row-start-1">
          {reqs.length === 0 && <span className="text-sm text-ink-2">누구나</span>}
          {reqs.map((id) => (
            <Need key={id} label={brands.get(id)?.name ?? id} owned={owned ? owned.includes(id) : null} />
          ))}
          {deal.eligibility.map((e) => (
            <span key={e} className="text-sm font-semibold text-blue">
              {ELIGIBILITY_LABEL[e] ?? e}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm @2xl:col-start-3 @2xl:row-start-1 @2xl:flex-col @2xl:items-start @2xl:gap-0.5">
          <span className="whitespace-nowrap text-ink-2 tabular-nums">{period(deal.starts_at, deal.ends_at)}</span>
          {soon && <span className="font-bold text-red">{soon}</span>}
        </div>
      </div>
      <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end @2xl:col-start-4 @2xl:row-span-1 @2xl:self-center">
        <Seal trust={deal.source_trust} checkedAt={deal.last_seen_at} size="sm" />
      </div>
    </li>
  );
}

export function DealTable({ deals, brands, owned, showType, empty }: { deals: Deal[]; brands: Map<string, Brand>; owned: string[] | null; showType?: boolean; empty?: React.ReactNode }) {
  if (deals.length === 0) return empty ? <p className="border-b border-rule py-6 text-ink-2">{empty}</p> : null;
  return (
    <div className="@container">
      <div className={`hidden gap-x-6 border-b border-rule py-2 text-sm text-ink-3 @2xl:grid ${COLS}`} aria-hidden>
        <span>혜택</span>
        <span>받는 조건</span>
        <span>기간</span>
        <span className="text-right">확인</span>
      </div>
      <ul>
        {deals.map((d) => (
          <DealRow key={d.id} deal={d} brands={brands} owned={owned} showType={showType} />
        ))}
      </ul>
    </div>
  );
}
