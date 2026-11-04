import Link from "next/link";
import type { Source } from "@/lib/types";

const COLS: { title: string; links: [string, string][] }[] = [
  { title: "최저가", links: [["/lowest", "조합 계산기"], ["/lowest/ott", "OTT"], ["/lowest/ai", "AI 구독"], ["/lowest/delivery", "배달앱"], ["/lowest/etc", "기타"]] },
  { title: "할인", links: [["/deals/card", "카드 제휴"], ["/deals/telecom", "통신사 제휴"], ["/deals/platform", "플랫폼 연계"]] },
  { title: "내 장부", links: [["/", "홈 추천"], ["/my", "내 조건"], ["/about", "추천 기준·출처"]] },
];

export function SiteFooter({ sources }: { sources: Source[] }) {
  const crawled = sources.filter((s) => s.mode === "crawl");
  const last = crawled.map((s) => s.last_run_at).filter(Boolean).sort().at(-1);
  return (
    <footer className="mt-8 border-t-2 border-ink bg-sheet">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-10 md:grid-cols-[1.4fr_repeat(3,1fr)] md:px-8 xl:px-0">
        <div className="text-sm text-ink-2">
          <p className="text-base font-bold text-ink">
            구독<span className="text-red">장부</span>
          </p>
          <p className="mt-2 max-w-[40ch]">
            공식 사이트 {crawled.length}곳을 자동으로 모으고 {sources.length - crawled.length}곳은 공식 페이지를 사람이 확인해 적어요.
            {last && ` 마지막 수집 ${last.slice(0, 10)}.`}
          </p>
          <p className="mt-2">광고·제휴 수수료를 받지 않아요. 순위는 월 비용으로만 정해요.</p>
        </div>
        {COLS.map((c) => (
          <nav key={c.title} aria-label={c.title} className="text-sm">
            <p className="font-bold">{c.title}</p>
            <ul className="mt-2 space-y-1.5">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-ink-2 hover:text-ink hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  );
}
