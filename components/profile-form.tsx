"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { saveProfile, type FormState } from "@/app/actions";
import { AGE_BANDS, ROLES } from "@/lib/eligibility";
import { SERVICE_CATEGORY_LABEL } from "@/lib/format";
import type { Brand, BrandKind, ServiceCategory } from "@/lib/types";

const CATS: ServiceCategory[] = ["ott", "ai", "delivery", "etc"];

const GROUPS: { kind: BrandKind; title: string; hint: string; single?: boolean }[] = [
  { kind: "telecom", title: "통신사", hint: "알뜰폰이면 비워 두세요", single: true },
  { kind: "card_issuer", title: "카드사", hint: "가진 카드의 카드사를 모두" },
  { kind: "pay", title: "간편결제", hint: "자주 쓰는 것" },
  { kind: "platform", title: "가입한 멤버십", hint: "이미 내고 있는 멤버십" },
];

export function ProfileForm({
  brands,
  initial,
}: {
  brands: Brand[];
  initial: { brandIds: string[]; ageBand: string | null; roles: string[]; services: string[] };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfile, null);
  const [telecom, setTelecom] = useState(brands.find((b) => b.kind === "telecom" && initial.brandIds.includes(b.id))?.id ?? "");

  const box = "inline-flex cursor-pointer items-center gap-2 rounded-[4px] border border-rule-2 bg-sheet px-3 py-2 has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:font-bold has-[:checked]:text-sheet has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-blue";

  return (
    <form action={action} className="border-t-2 border-ink">
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
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
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
                  </label>
                ) : (
                  <label key={b.id} className={box}>
                    <input type="checkbox" name="brands" value={b.id} defaultChecked={initial.brandIds.includes(b.id)} className="sr-only" />
                    {b.name}
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

      <div className="sticky bottom-16 flex flex-wrap items-center gap-4 border-t border-rule bg-paper py-4 md:bottom-0">
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
      </div>
    </form>
  );
}
