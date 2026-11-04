"use client";
import { useMemo, useState } from "react";
import { baseline, recommendCards, solve, type Combo } from "@/lib/combo";
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

type Props = CalculatorData & { initial: string[]; compact?: boolean };

const CATS: ServiceCategory[] = ["ott", "ai", "delivery", "etc"];

export function Calculator(props: Props) {
  const { services, plans, cards, brands, compact } = props;
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
  const picks = best ? recommendCards(cards, best) : [];
  const toggle = (id: string) => setWanted((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));

  return (
    <section aria-label="조합 계산기" className={`border border-rule bg-sheet ${compact ? "rounded-[6px] p-5" : "rounded-[6px] p-5 md:p-7"}`}>
      <div className="flex items-baseline justify-between gap-3 border-b-2 border-ink pb-2">
        <h2 className="text-lg font-bold">조합 계산기</h2>
        <span className="text-sm text-ink-3 tabular-nums">가입 경로 {result.considered}개 비교</span>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-ink-2">쓰고 싶은 구독</legend>
        <div className={`mt-2 grid gap-x-6 gap-y-3 ${compact ? "" : "md:grid-cols-2"}`}>
          {CATS.map((c) => {
            const list = services.filter((s) => s.category === c);
            if (!list.length) return null;
            return (
              <div key={c} className="grid grid-cols-[56px_1fr] items-start gap-2">
                <span className="pt-1 text-sm text-ink-3">{SERVICE_CATEGORY_LABEL[c]}</span>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((s) => {
                    const on = wanted.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(s.id)}
                        className={`rounded-[4px] border px-2.5 py-1 text-sm transition-colors ${
                          on ? "border-ink bg-ink font-semibold text-sheet" : "border-rule-2 bg-sheet text-ink-2 hover:border-ink hover:text-ink"
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

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-rule pt-3 text-sm">
        <label className="inline-flex items-center gap-2">
          <span className="text-ink-2">통신사</span>
          <select value={telecom} onChange={(e) => setTelecom(e.target.value)} className="rounded-[4px] border border-rule-2 bg-sheet px-2 py-1">
            <option value="">해당 없음·알뜰폰</option>
            {props.telecoms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={allowAds} onChange={(e) => setAllowAds(e.target.checked)} className="accent-[var(--blue)]" />
          광고 요금제도 괜찮아요
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={includeAnnual} onChange={(e) => setIncludeAnnual(e.target.checked)} className="accent-[var(--blue)]" />
          연간 결제 포함
        </label>
        <details className="w-full">
          <summary className="cursor-pointer text-ink-2">이미 내고 있는 멤버십 {members.length ? `${members.length}개` : "없음"}</summary>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {props.memberships.map((m) => (
              <label key={m.id} className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  className="accent-[var(--blue)]"
                  checked={members.includes(m.id)}
                  onChange={(e) => setMembers((ms) => (e.target.checked ? [...ms, m.id] : ms.filter((x) => x !== m.id)))}
                />
                {m.name}
              </label>
            ))}
          </div>
        </details>
      </div>

      <div className="mt-5" aria-live="polite">
        {wanted.length === 0 && <p className="text-ink-2">구독을 하나 이상 골라 주세요.</p>}
        {result.uncovered.length > 0 && (
          <p className="text-ink-2">{result.uncovered.map((id) => name.get(id)).join(", ")}은(는) 이 조건으로 가입할 수 있는 경로 정보가 아직 없어요.</p>
        )}
        {best && (
          <>
            <table className="w-full table-fixed text-left">
              <caption className="sr-only">가장 싼 조합</caption>
              <colgroup>
                <col />
                <col className="w-[58px]" />
                <col className="w-[84px]" />
              </colgroup>
              <thead>
                <tr className="text-sm text-ink-3">
                  <th scope="col" className="pb-1 font-normal">가장 싼 조합</th>
                  <th scope="col" className="w-[58px] pb-1 font-normal"><span className="sr-only">확인</span></th>
                  <th scope="col" className="pb-1 text-right font-normal">월</th>
                </tr>
              </thead>
              <tbody>
                {best.items.map((it) => (
                  <tr key={it.plan.id} className="border-t border-rule align-top">
                    <td className="py-2 pr-3">
                      <a href={it.plan.signup_url ?? it.plan.source_url} target="_blank" rel="noreferrer" className="font-semibold hover:underline">
                        {it.plan.name}
                        <span className="sr-only">(공식 페이지, 새 창)</span>
                      </a>
                      <p className="text-sm text-ink-3">
                        {ROUTE_LABEL[it.plan.route]}
                        {it.price < it.plan.price_monthly && " · 이미 내는 멤버십"}
                        {!compact && it.plan.conditions[0] && ` · ${it.plan.conditions[0]}`}
                      </p>
                      {!compact && <p className="text-sm text-ink-3">근거: {sourceName(it.plan.source_url, it.plan.source_trust)}</p>}
                    </td>
                    <td className="py-2 pr-3">
                      <Seal size="sm" trust={it.plan.source_trust} checkedAt={it.plan.checked_at} needsCheck={it.plan.status === "needs_check"} />
                    </td>
                    <td className="py-2 text-right whitespace-nowrap tabular-nums">{won(it.price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {base != null && (
                  <tr className="border-t border-rule text-sm text-ink-3">
                    <td className="py-2" colSpan={2}>본사 단품으로 따로 낼 때</td>
                    <td className="py-2 text-right tabular-nums">{won(base)}</td>
                  </tr>
                )}
                <tr className="border-t-[3px] border-double border-ink">
                  <td className="pt-2 font-bold" colSpan={2}>월 합계</td>
                  <td className="pt-2 text-right">
                    <Correction from={base} to={best.total} big />
                  </td>
                </tr>
              </tfoot>
            </table>
            {base != null && base > best.total && (
              <p className="mt-1 text-right text-sm font-bold text-red tabular-nums">
                월 {won(base - best.total)} · 1년 {won((base - best.total) * 12)} 덜 내요
              </p>
            )}

            {result.combos.length > 1 && (
              <details className="mt-4 border-t border-rule pt-3">
                <summary className="cursor-pointer text-sm text-ink-2">다른 조합 {result.combos.length - 1}개</summary>
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

            <h3 className="mt-6 border-b border-ink pb-1 font-bold">이 조합에 맞는 카드</h3>
            {picks.length === 0 ? (
              <p className="mt-2 text-sm text-ink-2">연회비를 빼고도 이득인 카드가 없어요. 통신 요금으로 청구되는 상품은 카드 할인 대상이 아니에요.</p>
            ) : (
              <ul>
                {picks.map((p) => (
                  <li key={p.card.id} className="flex items-start gap-3 border-b border-rule py-2.5">
                    <div className="min-w-0 flex-1">
                      <a href={p.card.signup_url ?? p.card.source_url} target="_blank" rel="noreferrer" className="font-semibold hover:underline">
                        {p.card.name}
                        <span className="sr-only">(카드사 홈페이지, 새 창)</span>
                      </a>
                      <p className="text-sm text-ink-3">
                        전월 {won(p.card.min_prev_month_spend)} 이상 · 연회비 {won(p.card.annual_fee)}
                        {owned.includes(p.card.issuer_brand_id) && " · 가진 카드사"}
                      </p>
                      <p className="text-sm text-ink-3">근거: {sourceName(p.card.source_url, p.card.source_trust)} · 누르면 카드사 홈페이지</p>
                    </div>
                    <Seal size="sm" trust={p.card.source_trust} checkedAt={p.card.checked_at} needsCheck={p.card.status === "needs_check"} />
                    <div className="text-right text-sm tabular-nums">
                      <p className="font-bold text-red">−{won(p.saving)}</p>
                      <p className="text-ink-3">연회비 월 {won(p.feeMonthly)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-sm text-ink-3">카드 할인은 전월실적 최저 구간 기준이에요. 발급 전 카드사에서 조건을 확인하세요. 카드 발급 수수료는 받지 않아요.</p>
          </>
        )}
      </div>
    </section>
  );
}
