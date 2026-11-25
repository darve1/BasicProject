// 고른 구독마다 한 줄: 지금 쓰는 요금제(등급)와 본사에서 그대로 낼 때의 값. 계산기와 내 조건이 같이 쓴다
import { listPrice, tierOptions } from "@/lib/combo";
import { won } from "@/lib/format";
import type { Plan } from "@/lib/types";

export function TierRows({
  ids,
  plans,
  name,
  tiers,
  onTier,
  allowAds = true,
  field = false,
  className = "",
}: {
  ids: string[];
  plans: Plan[];
  name: (id: string) => string;
  tiers: Record<string, string>;
  onTier: (id: string, tier: string) => void;
  allowAds?: boolean;
  field?: boolean; // 폼과 함께 보낼 때: 칸 이름이 tier:<서비스 id>
  className?: string;
}) {
  if (!ids.length) return null;
  return (
    <table className={`w-full table-fixed text-left text-sm ${className}`}>
      <caption className="sr-only">지금 쓰는 요금제와 본사 월 요금</caption>
      <colgroup>
        <col />
        <col className="w-[92px]" />
      </colgroup>
      <thead>
        <tr className="text-ink-3">
          <th scope="col" className="pb-1 font-normal">지금 쓰는 요금제</th>
          <th scope="col" className="pb-1 text-right font-normal">본사 월 요금</th>
        </tr>
      </thead>
      <tbody>
        {ids.map((id) => {
          const opts = tierOptions(plans, id);
          const price = listPrice(plans, id, allowAds, tiers[id]);
          return (
            <tr key={id} className="border-t border-rule align-middle">
              <td className="py-2 pr-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold">{name(id)}</span>
                  {opts.length > 1 ? (
                    <select
                      aria-label={`${name(id)} 요금제`}
                      name={field ? `tier:${id}` : undefined}
                      value={tiers[id] ?? ""}
                      onChange={(e) => onTier(id, e.target.value)}
                      className="min-h-10 max-w-full rounded-[4px] border border-rule-field bg-sheet px-2 @3xl:min-h-8"
                    >
                      <option value="">아무 등급이나</option>
                      {opts.map((o) => (
                        <option key={o.tier} value={o.tier}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    opts[0] && <span className="text-ink-3">{opts[0].label}</span>
                  )}
                </div>
              </td>
              <td className="py-2 text-right whitespace-nowrap tabular-nums">
                {price == null ? <span className="text-ink-3">정보 없음</span> : `${won(price)}${opts.length > 1 && !tiers[id] ? "부터" : ""}`}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
