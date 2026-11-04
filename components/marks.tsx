// 도장·정정선·보유 표시. 라우터에 의존하지 않아 정적 미리보기에서도 쓴다
import { freshness, shortDate, TRUST_LABEL, won } from "@/lib/format";
import type { SourceTrust } from "@/lib/types";

type SealProps = { trust: SourceTrust; checkedAt: string; needsCheck?: boolean };

const pending = (p: SealProps) => p.needsCheck || freshness(p.checkedAt) === "expired";
const sealTitle = (p: SealProps) =>
  pending(p)
    ? `${TRUST_LABEL[p.trust]} 출처 · ${p.checkedAt.slice(0, 10)} 기준 · 공식 페이지에서 다시 확인 필요`
    : `${TRUST_LABEL[p.trust]} 출처에서 ${p.checkedAt.slice(0, 10)}에 확인`;

// 원형 확인 도장: 행·표에는 46px, 상세 화면에는 60px
export function Seal({ size = "md", ...p }: SealProps & { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-[46px] w-[46px] text-[10px]" : "h-[60px] w-[60px] text-[11px]";
  if (pending(p)) {
    return (
      <span title={sealTitle(p)} className={`inline-grid shrink-0 place-items-center rounded-full border-2 border-dashed border-ink-3 text-center leading-tight font-bold text-ink-2 ${dim}`}>
        확인
        <br />
        필요
      </span>
    );
  }
  return (
    <span
      title={sealTitle(p)}
      className={`stamp-in inline-grid shrink-0 -rotate-[8deg] place-items-center rounded-full border-seal text-center leading-tight font-bold text-seal ${size === "sm" ? "border-2" : "border-[2.5px]"} ${dim} ${freshness(p.checkedAt) === "stale" ? "opacity-70" : ""}`}
    >
      {TRUST_LABEL[p.trust]}확인
      <br />
      {shortDate(p.checkedAt.slice(0, 10))}
    </span>
  );
}

// 정가를 빨간 펜으로 긋고 새 값을 파란 펜으로
export function Correction({ from, to, unit = "", big = false }: { from: number | null; to: number; unit?: string; big?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-2 whitespace-nowrap tabular-nums">
      {from != null && from > to && <span className="strike-red text-sm">{won(from)}</span>}
      <span className={`font-bold text-blue ${big ? "text-num" : ""}`}>
        {unit}
        {won(to)}
      </span>
    </span>
  );
}

// 보유 여부: 색 없이도 읽히게 채움/빈 원
export function Need({ label, owned }: { label: string; owned: boolean | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-ink-2">
      <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full border-[1.5px] border-ink ${owned ? "bg-ink" : "bg-transparent"}`} />
      {label}
      {owned === false && <span className="sr-only">(없음)</span>}
      {owned === true && <span className="sr-only">(있음)</span>}
    </span>
  );
}
