"use client";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import type { FormState } from "@/app/actions";
import { AGE_BANDS, eligibilityTags, ROLES } from "@/lib/eligibility";
import { SERVICE_CATEGORY_LABEL } from "@/lib/format";
import { canGet } from "@/lib/match";
import type { Brand, BrandKind, Deal, Plan, ServiceCategory } from "@/lib/types";
import { TierRows } from "./tier-rows";

const CATS: ServiceCategory[] = ["ott", "ai", "delivery", "etc"];

const GROUPS: { kind: BrandKind; title: string; hint: string; single?: boolean }[] = [
  { kind: "telecom", title: "통신사", hint: "알뜰폰이면 비워 두세요", single: true },
  { kind: "card_issuer", title: "카드사", hint: "가진 카드의 카드사를 모두" },
  { kind: "pay", title: "간편결제", hint: "자주 쓰는 것" },
  { kind: "platform", title: "가입한 멤버십", hint: "이미 내고 있는 멤버십" },
];

// save: 서버 사이트에서는 저장 서버 액션, 아티팩트에서는 브라우저·아티팩트 저장소에 쓰는 함수.
// React 18에서도 돌도록 폼 action 대신 onSubmit으로 부른다
export function ProfileForm({
  brands,
  initial,
  save,
  storageNote,
  deals = [],
  plans = [],
}: {
  save: (prev: FormState, form: FormData) => Promise<FormState>;
  storageNote?: string;
  brands: Brand[];
  initial: { brandIds: string[]; ageBand: string | null; roles: string[]; services: string[]; tiers?: Record<string, string> };
  deals?: Deal[]; // 진행 중인 할인. 넘겨주면 고를 때마다 받을 수 있는 할인 수를 바로 보여 준다
  plans?: Plan[];
}) {
  const [state, setState] = useState<FormState>(null);
  const [pending, setPending] = useState(false);
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    try {
      setState(await save(state, new FormData(e.currentTarget)));
    } finally {
      setPending(false);
    }
  };
  const [telecom, setTelecom] = useState(brands.find((b) => b.kind === "telecom" && initial.brandIds.includes(b.id))?.id ?? "");

  // 고르는 대로 다시 센다: 이름 옆 숫자(그 조건이 있어야 받는 할인 수, 구독은 가입 경로 수)와 아래 요약
  const [sel, setSel] = useState({ brands: initial.brandIds, services: initial.services, ageBand: initial.ageBand, roles: initial.roles });
  const [tiers, setTiers] = useState<Record<string, string>>(initial.tiers ?? {});
  const onChange = (e: FormEvent<HTMLFormElement>) => {
    const f = new FormData(e.currentTarget);
    setSel({ brands: f.getAll("brands").map(String), services: f.getAll("services").map(String), ageBand: String(f.get("age_band") ?? "") || null, roles: f.getAll("roles").map(String) });
  };
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    const add = (id: string) => m.set(id, (m.get(id) ?? 0) + 1);
    for (const d of deals) for (const r of d.deal_requirements ?? []) add(r.brand_id);
    for (const p of plans) for (const s of new Set(p.includes.map((i) => i.service_id))) add(s);
    return m;
  }, [deals, plans]);
  const count = (id: string) =>
    counts.get(id) ? (
      <span className="text-sm font-normal tabular-nums opacity-70">
        <span className="sr-only">, </span>
        {counts.get(id)}
        <span className="sr-only">건</span>
      </span>
    ) : null;
  // 통신사는 아래 숨은 입력으로 들어가서 방금 누른 값이 폼에 아직 없을 수 있다. 상태값을 쓴다
  const telecomIds = brands.filter((b) => b.kind === "telecom").map((b) => b.id);
  const owned = [...sel.brands.filter((id) => !telecomIds.includes(id)), ...(telecom ? [telecom] : [])];
  const mine = deals.filter((d) => canGet(d, owned, eligibilityTags(sel.ageBand, sel.roles))).length;

  const box = "inline-flex cursor-pointer items-center gap-2 rounded-[4px] border border-rule-field bg-sheet px-3 py-2 has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:font-bold has-[:checked]:text-sheet has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue";

  return (
    <form onSubmit={onSubmit} onChange={onChange} className="border-t-2 border-ink">
      <fieldset className="border-b border-rule py-5">
        <legend className="sr-only">쓰는 구독</legend>
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
          <h2 className="font-bold">쓰는 구독</h2>
          <span className="text-sm text-ink-3">지금 내고 있거나 쓰고 싶은 것. 홈에서 이걸 가장 싸게 쓰는 방법을 추천해요</span>
        </div>
        <div className="space-y-3">
          {CATS.map((c) => {
            const list = brands.filter((b) => b.kind === "service" && b.category === c);
            if (!list.length) return null;
            return (
              <div key={c} className="grid grid-cols-[64px_1fr] items-start gap-2">
                <span className="pt-2 text-sm text-ink-3">{SERVICE_CATEGORY_LABEL[c]}</span>
                <div className="flex flex-wrap gap-2">
                  {list.map((b) => (
                    <label key={b.id} className={box}>
                      <input type="checkbox" name="services" value={b.id} defaultChecked={initial.services.includes(b.id)} className="sr-only" />
                      {b.name}
                      {count(b.id)}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {/* 고른 구독마다 지금 쓰는 요금제를 적는다. 적어 두면 홈과 계산기가 그 등급으로 견준다 */}
        <TierRows
          className="mt-4 max-w-[520px]"
          ids={plans.length ? sel.services : []}
          plans={plans}
          name={(id) => brands.find((b) => b.id === id)?.name ?? id}
          tiers={tiers}
          onTier={(id, tier) => setTiers((t) => ({ ...t, [id]: tier }))}
          field
        />
      </fieldset>
      {GROUPS.map((g) => (
        <fieldset key={g.kind} className="border-b border-rule py-5">
          <legend className="sr-only">{g.title}</legend>
          <div className="mb-3 flex items-baseline gap-3">
            <h2 className="font-bold">{g.title}</h2>
            <span className="text-sm text-ink-3">{g.hint}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {g.single && (
              <label className={box}>
                <input type="radio" name="telecom-choice" className="sr-only" checked={telecom === ""} onChange={() => setTelecom("")} />
                없음·알뜰폰
              </label>
            )}
            {brands
              .filter((b) => b.kind === g.kind)
              .map((b) =>
                g.single ? (
                  <label key={b.id} className={box}>
                    <input type="radio" name="telecom-choice" className="sr-only" checked={telecom === b.id} onChange={() => setTelecom(b.id)} />
                    {b.name}
                    {count(b.id)}
                  </label>
                ) : (
                  <label key={b.id} className={box}>
                    <input type="checkbox" name="brands" value={b.id} defaultChecked={initial.brandIds.includes(b.id)} className="sr-only" />
                    {b.name}
                    {count(b.id)}
                  </label>
                ),
              )}
          </div>
        </fieldset>
      ))}
      {telecom && <input type="hidden" name="brands" value={telecom} />}

      <fieldset className="border-b border-rule py-5">
        <legend className="sr-only">나이대</legend>
        <div className="mb-3 flex items-baseline gap-3">
          <h2 className="font-bold">나이대</h2>
          <span className="text-sm text-ink-3">청년·시니어 전용 혜택을 거르는 데만 써요</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {AGE_BANDS.map((a) => (
            <label key={a.id} className={box}>
              <input type="radio" name="age_band" value={a.id} defaultChecked={initial.ageBand === a.id} className="sr-only" />
              {a.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="border-b border-rule py-5">
        <legend className="sr-only">신분</legend>
        <div className="mb-3 flex items-baseline gap-3">
          <h2 className="font-bold">신분</h2>
          <span className="text-sm text-ink-3">해당하는 것 모두</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <label key={r.id} className={box}>
              <input type="checkbox" name="roles" value={r.id} defaultChecked={initial.roles.includes(r.id)} className="sr-only" />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="sticky bottom-16 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-rule bg-paper py-4 md:bottom-0">
        {deals.length > 0 && (
          <p className="basis-full text-sm text-ink-2 tabular-nums" aria-live="polite">
            진행 중인 할인 {deals.length}건 가운데 지금 고른 조건으로 받을 수 있는 것은 <b className="text-blue">{mine}건</b>이에요. 이름 옆 숫자는 그것이 있어야 받는 할인 수, 구독은 가입 경로 수예요.
          </p>
        )}
        <button type="submit" disabled={pending} className="rounded-[4px] bg-ink px-5 py-2.5 font-bold text-sheet hover:bg-ink-2 disabled:cursor-wait disabled:opacity-60">
          {pending ? "저장하는 중…" : "저장하기"}
        </button>
        {state && (
          <p role="status" className={`text-sm font-semibold ${state.ok ? "text-blue" : "text-red"}`}>
            {state.message}{" "}
            {state.ok && (
              <Link href="/" className="underline">
                내 장부 보기
              </Link>
            )}
          </p>
        )}
        {!state && storageNote && <p className="text-sm text-ink-3">{storageNote}</p>}
      </div>
    </form>
  );
}
