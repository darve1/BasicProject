"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { baseline, listPrice, recommendCards, solve, type Combo, type ComboItem } from "@/lib/combo";
import { ROUTE_LABEL, SERVICE_CATEGORY_LABEL, sourceName, won } from "@/lib/format";
import type { Brand, Card, Plan, ServiceCategory } from "@/lib/types";
import { Correction, Seal } from "./marks";

export type CalculatorData = {
  services: Brand[]; // category가 있는 브랜드(구독 서비스·멤버십)
  telecoms: Brand[];
  memberships: Brand[];
  plans: Plan[];
  cards: Card[];
  brands: Brand[];
  owned: string[];
  elig: string[];
};

// home: 홈의 펼친 장부(카드 한 장, 자세한 비교는 계산기 화면으로). full: 계산기 화면(카드 세 장, 다른 조합, 근거)
type Props = CalculatorData & { initial: string[]; variant?: "home" | "full" };

const CATS: ServiceCategory[] = ["ott", "ai", "delivery", "etc"];

// 펼친 장부 한 장: 왼쪽 쪽에서 쓰는 구독을 고르면 오른쪽 쪽 정산표가 그 자리에서 다시 적힌다
export function Calculator(props: Props) {
  const { services, plans, cards, brands } = props;
  const full = (props.variant ?? "full") === "full";
  const [wanted, setWanted] = useState<string[]>(props.initial);
  const [allowAds, setAllowAds] = useState(true);
  const [includeAnnual, setIncludeAnnual] = useState(false);
  const [telecom, setTelecom] = useState(props.telecoms.find((t) => props.owned.includes(t.id))?.id ?? "");
  const [members, setMembers] = useState(props.memberships.filter((m) => props.owned.includes(m.id)).map((m) => m.id));

  const name = useMemo(() => new Map(brands.map((b) => [b.id, b.name])), [brands]);
  const owned = useMemo(
    () => [
      ...props.owned.filter((id) => !props.telecoms.some((t) => t.id === id) && !props.memberships.some((m) => m.id === id)),
      ...(telecom ? [telecom] : []),
      ...members,
    ],
    [props.owned, props.telecoms, props.memberships, telecom, members],
  );
  const input = { wanted, owned, elig: props.elig, allowAds, includeAnnual };
  const result = useMemo(() => solve(plans, input), [plans, wanted, owned, props.elig, allowAds, includeAnnual]); // eslint-disable-line react-hooks/exhaustive-deps
  const base = useMemo(() => baseline(plans, input), [plans, wanted, allowAds]); // eslint-disable-line react-hooks/exhaustive-deps
  const best: Combo | undefined = result.combos[0];
  const picks = best ? recommendCards(cards, best, full ? 3 : 1) : [];
  const toggle = (id: string) => setWanted((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));

  // 그 항목이 덮는 구독을 본사 단품으로 따로 낼 때보다 얼마나 싼지
  const savedBy = (it: ComboItem) => {
    const lists = it.covers.map((s) => listPrice(plans, s, allowAds));
    if (lists.some((l) => l == null)) return 0;
    return Math.max(0, (lists as number[]).reduce((a, b) => a + b, 0) - it.price);
  };

  return (
    <section aria-label="조합 계산기" className="@container rounded-[6px] border border-rule bg-sheet">
      <div className="grid @3xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* 왼쪽 쪽: 고르기 */}
        <div className="border-b border-rule p-4 @md:p-5 @3xl:border-r @3xl:border-b-0 @3xl:p-7">
          <h2 className="border-b-2 border-ink pb-2 text-lg font-bold">쓰는 구독</h2>
          <fieldset className="mt-4">
            <legend className="sr-only">쓰고 싶은 구독</legend>
            <div className="grid gap-y-3">
              {CATS.map((c) => {
                const list = services.filter((s) => s.category === c);
                if (!list.length) return null;
                return (
                  <div key={c} className="grid items-start gap-1.5 @3xl:grid-cols-[64px_minmax(0,1fr)] @3xl:gap-2">
                    <span className="text-sm text-ink-3 @3xl:pt-1.5">{SERVICE_CATEGORY_LABEL[c]}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {list.map((s) => {
                        const on = wanted.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggle(s.id)}
                            className={`min-h-9 rounded-[4px] border px-3 text-sm transition-colors @3xl:min-h-8 ${
                              on ? "border-ink bg-ink font-semibold text-sheet hover:bg-ink-2" : "border-rule-field bg-sheet text-ink-2 hover:border-ink hover:text-ink"
                            }`}
                          >
                            {s.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-5 grid gap-y-2.5 border-t border-rule pt-4 text-sm">
            <label className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-2">
              <span className="text-ink-3">통신사</span>
              <select
                value={telecom}
                onChange={(e) => setTelecom(e.target.value)}
                className="min-h-10 max-w-[220px] rounded-[4px] border border-rule-field bg-sheet px-2 @3xl:min-h-8"
              >
                <option value="">해당 없음, 알뜰폰</option>
                {props.telecoms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-x-5 gap-y-1 @3xl:pl-[72px]">
              <label className="inline-flex min-h-8 items-center gap-2">
                <input type="checkbox" checked={allowAds} onChange={(e) => setAllowAds(e.target.checked)} className="size-4 accent-[var(--blue)]" />
                광고 요금제도 괜찮아요
              </label>
              <label className="inline-flex min-h-8 items-center gap-2">
                <input type="checkbox" checked={includeAnnual} onChange={(e) => setIncludeAnnual(e.target.checked)} className="size-4 accent-[var(--blue)]" />
                연간 결제 포함
              </label>
            </div>
            <details className="@3xl:pl-[72px]">
              <summary className="min-h-8 cursor-pointer py-1 text-ink-2 hover:text-ink">이미 내고 있는 멤버십 {members.length ? `${members.length}개` : "없음"}</summary>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {props.memberships.map((m) => (
                  <label key={m.id} className="inline-flex min-h-8 items-center gap-1.5">
                    <input
                      type="checkbox"
                      className="size-4 accent-[var(--blue)]"
                      checked={members.includes(m.id)}
                      onChange={(e) => setMembers((ms) => (e.target.checked ? [...ms, m.id] : ms.filter((x) => x !== m.id)))}
                    />
                    {m.name}
                  </label>
                ))}
              </div>
            </details>
          </div>
        </div>

        {/* 오른쪽 쪽: 정산 */}
        <div className="p-4 @md:p-5 @3xl:p-7" aria-live="polite">
          <div className="flex items-baseline justify-between gap-3 border-b-2 border-ink pb-2">
            <h2 className="text-lg font-bold">가장 싼 조합</h2>
            <span className="text-sm text-ink-3 tabular-nums">가입 경로 {result.considered}개 비교</span>
          </div>

          {wanted.length === 0 && <p className="py-6 text-ink-2">왼쪽에서 쓰는 구독을 하나 이상 골라 주세요.</p>}
          {result.uncovered.length > 0 && (
            <p className="py-3 text-ink-2">{result.uncovered.map((id) => name.get(id)).join(", ")}은(는) 이 조건으로 가입할 수 있는 경로 정보가 아직 없어요.</p>
          )}

          {best && (
            <>
              <table className="w-full table-fixed text-left">
                <caption className="sr-only">가장 싼 조합과 월 합계</caption>
                <colgroup>
                  <col />
                  <col className="w-0 @xl:w-[62px]" />
                  <col className="w-[96px]" />
                </colgroup>
                <thead>
                  <tr className="text-sm text-ink-3">
                    <th scope="col" className="pt-3 pb-1 font-normal">가입 경로</th>
                    <th scope="col" className="hidden pt-3 pb-1 font-normal @xl:table-cell"><span className="sr-only">확인</span></th>
                    <th scope="col" className="pt-3 pb-1 text-right font-normal">월</th>
                  </tr>
                </thead>
                <tbody>
                  {best.items.map((it) => {
                    const saved = savedBy(it);
                    return (
                      <tr key={it.plan.id} className="border-t border-rule align-top">
                        <td className="py-3 pr-3">
                          <a href={it.plan.signup_url ?? it.plan.source_url} target="_blank" rel="noreferrer" className="font-semibold hover:underline">
                            {it.plan.name}
                            <span className="sr-only">(공식 페이지, 새 창)</span>
                          </a>
                          <p className="mt-0.5 text-sm text-ink-3">
                            {ROUTE_LABEL[it.plan.route]}
                            {it.covers.length > 1 && `, ${it.covers.map((s) => name.get(s) ?? s).join(" + ")} 함께`}
                          </p>
                          {saved > 0 && <p className="text-sm text-ink-3">본사 단품이면 월 {won(saved + it.price)}</p>}
                          {it.price < it.plan.price_monthly && <p className="text-sm text-ink-3">이미 내는 멤버십이라 추가 비용 없음</p>}
                          {full && it.plan.conditions[0] && <p className="text-sm text-ink-3">{it.plan.conditions[0]}</p>}
                          {full && <p className="text-sm text-ink-3">근거: {sourceName(it.plan.source_url, it.plan.source_trust)}</p>}
                        </td>
                        <td className="hidden py-3 @xl:table-cell">
                          <Seal size="sm" trust={it.plan.source_trust} checkedAt={it.plan.checked_at} needsCheck={it.plan.status === "needs_check"} />
                        </td>
                        <td className="py-3 text-right whitespace-nowrap tabular-nums">
                          <span className="block">{won(it.price)}</span>
                          {saved > 0 && (
                            <span className="block text-sm font-semibold text-blue">
                              −{won(saved)}
                              <span className="sr-only"> (본사 단품보다)</span>
                            </span>
                          )}
                          <span className="mt-2 flex justify-end @xl:hidden">
                            <Seal size="sm" trust={it.plan.source_trust} checkedAt={it.plan.checked_at} needsCheck={it.plan.status === "needs_check"} />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {base != null && (
                  <tfoot>
                    <tr className="border-t border-rule text-sm text-ink-3">
                      <td className="py-2.5" colSpan={2}>본사 단품으로 따로 낼 때</td>
                      <td className="py-2.5 text-right tabular-nums">{won(base)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
              {/* 합계는 표 밖에서 칸 너비에 묶이지 않게: 이중 밑줄 위에 정가를 긋고 최저가를 크게 */}
              <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-t-[3px] border-double border-ink pt-4">
                <span className="pb-1 font-bold">월 합계</span>
                <Correction from={base} to={best.total} total />
              </div>
              {base != null && base > best.total && (
                <p className="mt-2 text-right font-bold text-pretty text-red tabular-nums">
                  한 달 {won(base - best.total)}, 1년이면 {won((base - best.total) * 12)} 덜 내요
                </p>
              )}

              {full && result.combos.length > 1 && (
                <details className="mt-5 border-t border-rule pt-3">
                  <summary className="min-h-8 cursor-pointer text-sm text-ink-2 hover:text-ink">다른 조합 {result.combos.length - 1}개</summary>
                  <ul className="mt-2 space-y-2 text-sm">
                    {result.combos.slice(1).map((c, i) => (
                      <li key={i} className="flex justify-between gap-4">
                        <span className="text-ink-2">{c.items.map((x) => x.plan.name).join(" + ")}</span>
                        <span className="whitespace-nowrap tabular-nums">{won(c.total)}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <h3 className="mt-7 border-b border-ink pb-1 font-bold">{full ? "이 조합에 맞는 카드" : "카드까지 쓰면"}</h3>
              {picks.length === 0 ? (
                <p className="mt-2 text-sm text-ink-2">연회비를 빼고도 이득인 카드가 없어요. 통신 요금으로 청구되는 상품은 카드 할인 대상이 아니에요.</p>
              ) : (
                <ul>
                  {picks.map((p) => (
                    <li key={p.card.id} className="flex items-start gap-3 border-b border-rule py-3">
                      <div className="min-w-0 flex-1">
                        <a href={p.card.signup_url ?? p.card.source_url} target="_blank" rel="noreferrer" className="font-semibold hover:underline">
                          {p.card.name}
                          <span className="sr-only">(카드사 홈페이지, 새 창)</span>
                        </a>
                        <p className="text-sm text-ink-3">
                          전월실적 {won(p.card.min_prev_month_spend)} 이상, 연회비 {won(p.card.annual_fee)}
                          {owned.includes(p.card.issuer_brand_id) && ", 가진 카드사"}
                        </p>
                        {full && <p className="text-sm text-ink-3">근거: {sourceName(p.card.source_url, p.card.source_trust)}. 누르면 카드사 홈페이지로 가요</p>}
                      </div>
                      <span className="hidden @xl:block">
                        <Seal size="sm" trust={p.card.source_trust} checkedAt={p.card.checked_at} needsCheck={p.card.status === "needs_check"} />
                      </span>
                      <div className="w-[96px] shrink-0 text-right text-sm tabular-nums">
                        <p className="font-bold text-red">−{won(p.saving)}</p>
                        <p className="text-ink-3">연회비 월 {won(p.feeMonthly)}</p>
                        <span className="mt-2 flex justify-end @xl:hidden">
                          <Seal size="sm" trust={p.card.source_trust} checkedAt={p.card.checked_at} needsCheck={p.card.status === "needs_check"} />
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {!full && (
                <Link href={`/lowest?s=${wanted.join(",")}`} className="mt-3 inline-block text-sm font-semibold text-blue hover:underline">
                  카드 세 장과 다른 조합까지 비교하기
                </Link>
              )}
              <p className="mt-3 text-sm text-ink-3">카드 할인은 전월실적 최저 구간 기준이에요. 발급 전 카드사에서 조건을 확인하세요. 카드 발급 수수료는 받지 않아요.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
