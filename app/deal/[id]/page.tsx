import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Need, Page, Seal } from "@/components/ledger";
import { getBrands, getDeal, getSources, getViewer } from "@/lib/data";
import { ELIGIBILITY_LABEL } from "@/lib/eligibility";
import { DEAL_CATEGORY_LABEL, DEAL_TYPE_LABEL, endsLabel, period, TRUST_LABEL } from "@/lib/format";
import { canGet } from "@/lib/match";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const deal = /^[0-9a-f-]{36}$/.test(id) ? await getDeal(id) : null;
  return { title: deal?.title ?? "할인" };
}

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [deal, viewer, brands, sources] = await Promise.all([getDeal(id), getViewer(), getBrands(), getSources()]);
  if (!deal) notFound();
  const source = sources.find((s) => s.id === deal.source_id);
  const reqs = (deal.deal_requirements ?? []).map((r) => r.brand_id);
  const known = Boolean(viewer.userId && viewer.hasProfile);
  const missing = reqs.filter((r) => !viewer.brandIds.includes(r));
  const ok = canGet(deal, viewer.brandIds, viewer.elig);
  const soon = endsLabel(deal.ends_at);
  const nameOf = (b: string) => brands.find((x) => x.id === b)?.name ?? b;

  return (
    <Page width="narrow">
      <Link href={`/deals/${deal.deal_type}`} className="mt-8 inline-block text-sm text-ink-2 hover:text-ink hover:underline">
        {DEAL_TYPE_LABEL[deal.deal_type]} 목록
      </Link>
      <article className="mt-3">
        <header className="flex items-start gap-6 border-b-2 border-ink pb-5">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink-3">
              {source?.name ?? deal.source_id} · {DEAL_CATEGORY_LABEL[deal.category]}
            </p>
            <h1 className="mt-1 text-[1.5rem] leading-tight font-bold tracking-[-0.02em] text-balance md:text-[1.75rem]">{deal.title}</h1>
            {deal.benefit_text && <p className="mt-3 max-w-[60ch] text-ink-2">{deal.benefit_text}</p>}
          </div>
          <Seal trust={deal.source_trust} checkedAt={deal.last_seen_at} />
        </header>

        {known && (
          <p className={`border-b border-rule py-4 font-bold ${ok ? "text-blue" : "text-red"}`}>
            {ok
              ? "내 조건으로 받을 수 있어요."
              : `${[...missing.map(nameOf), ...(missing.length === 0 ? ["자격 조건"] : [])].join(", ")}이(가) 있어야 받을 수 있어요.`}
          </p>
        )}

        <dl>
          <div className="grid gap-1 border-b border-rule py-4 sm:grid-cols-[120px_1fr]">
            <dt className="text-sm text-ink-3">받는 조건</dt>
            <dd className="flex flex-wrap gap-x-4 gap-y-1">
              {reqs.length === 0 && <span>누구나</span>}
              {reqs.map((r) => (
                <Need key={r} label={nameOf(r)} owned={known ? viewer.brandIds.includes(r) : null} />
              ))}
              {deal.eligibility.map((e) => (
                <span key={e} className="text-sm font-semibold text-blue">{ELIGIBILITY_LABEL[e] ?? e}</span>
              ))}
              {!known && (
                <Link href={viewer.userId ? "/my" : "/login"} className="w-full text-sm font-semibold text-blue hover:underline">
                  내 조건을 적으면 받을 수 있는지 바로 알려줘요
                </Link>
              )}
            </dd>
          </div>
          <div className="grid gap-1 border-b border-rule py-4 sm:grid-cols-[120px_1fr]">
            <dt className="text-sm text-ink-3">기간</dt>
            <dd className="tabular-nums">
              {period(deal.starts_at, deal.ends_at)}
              {soon && <span className="ml-2 font-bold text-red">{soon}</span>}
            </dd>
          </div>
          <div className="grid gap-1 border-b border-rule py-4 sm:grid-cols-[120px_1fr]">
            <dt className="text-sm text-ink-3">출처</dt>
            <dd className="text-sm">
              <p>
                {TRUST_LABEL[deal.source_trust]} 출처 · {source?.mode === "crawl" ? "자동 수집" : "공식 페이지 확인 후 수동 등록"} · 마지막 확인 {deal.last_seen_at.slice(0, 10)}
              </p>
              {source?.note && <p className="mt-1 text-ink-3">{source.note}</p>}
              <p className="mt-1 text-ink-3">전월실적, 한도, 제외 가맹점 같은 세부 조건은 원문에서 확인하세요.</p>
            </dd>
          </div>
        </dl>
        <a href={deal.url} target="_blank" rel="noreferrer" className="mt-6 inline-block rounded-[4px] bg-ink px-5 py-3 font-bold text-sheet hover:bg-ink-2">
          원문에서 확인하기
        </a>
      </article>
    </Page>
  );
}
