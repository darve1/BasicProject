"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Section = { href: string; label: string; on: (p: string) => boolean; sub?: [string, string][] };

const SECTIONS: Section[] = [
  { href: "/", label: "홈", on: (p) => p === "/" },
  {
    href: "/lowest",
    label: "최저가",
    on: (p) => p.startsWith("/lowest"),
    sub: [
      ["/lowest", "조합 계산기"],
      ["/lowest/ott", "OTT"],
      ["/lowest/ai", "AI 구독"],
      ["/lowest/delivery", "배달앱"],
      ["/lowest/etc", "기타"],
    ],
  },
  {
    href: "/deals/card",
    label: "할인",
    on: (p) => p.startsWith("/deals") || p.startsWith("/deal/"),
    sub: [
      ["/deals/card", "카드 제휴"],
      ["/deals/telecom", "통신사 제휴"],
      ["/deals/platform", "플랫폼 연계"],
    ],
  },
  { href: "/my", label: "내 조건", on: (p) => p === "/my" },
  { href: "/about", label: "추천 기준", on: (p) => p === "/about" },
];

// signOut: 서버 사이트에서는 로그아웃 서버 액션을 넘긴다. 아티팩트(브라우저 저장 모드)에서는 넘기지 않는다
export function SiteNav({ signedIn, conditions, signOut }: { signedIn: boolean; conditions: string[]; signOut?: () => Promise<void> }) {
  const path = usePathname();
  const current = SECTIONS.find((s) => s.on(path));
  const summary = conditions.length ? conditions.slice(0, 2).join(", ") + (conditions.length > 2 ? ` 외 ${conditions.length - 2}` : "") : null;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-rule bg-sheet">
        <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-8 px-5 md:px-8 xl:px-0">
          <Link href="/" className="shrink-0 text-[1.0625rem] font-bold tracking-tight">
            구독<span className="text-red">장부</span>
          </Link>
          <nav aria-label="주 메뉴" className="hidden h-full items-stretch gap-6 md:flex">
            {SECTIONS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                aria-current={current === s ? "page" : undefined}
                className={`flex items-center border-b-2 text-base ${current === s ? "border-ink font-bold text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}
              >
                {s.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex min-w-0 items-center gap-3 text-sm">
            {signedIn ? (
              <>
                <Link href="/my" className="min-w-0 truncate text-ink-2 hover:text-ink" title={conditions.join(", ")}>
                  {summary ? (
                    <>
                      <span className="text-ink-3">내 조건 </span>
                      <span className="font-semibold text-ink">{summary}</span>
                    </>
                  ) : (
                    <span className="font-semibold text-blue">내 조건 적기</span>
                  )}
                </Link>
                {signOut && (
                <form action={signOut} className="hidden md:block">
                  <button type="submit" className="whitespace-nowrap text-ink-3 hover:text-ink">
                    로그아웃
                  </button>
                </form>
                )}
              </>
            ) : (
              <Link href="/login" className="rounded-[4px] bg-ink px-3 py-1.5 font-bold whitespace-nowrap text-sheet hover:bg-ink-2">
                로그인
              </Link>
            )}
          </div>
        </div>
        {current?.sub && (
          <nav aria-label={`${current.label} 메뉴`} className="border-t border-rule">
            <div className="mx-auto flex max-w-[1180px] gap-5 overflow-x-auto px-5 [scrollbar-width:none] md:px-8 xl:px-0">
              {current.sub.map(([href, label]) => {
                const on = path === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={on ? "page" : undefined}
                    className={`shrink-0 border-b-2 py-2.5 text-sm whitespace-nowrap ${on ? "border-red font-bold text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* 휴대폰: 엄지로 닿는 아래 탭 */}
      <nav aria-label="주 메뉴" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-rule bg-sheet pb-[env(safe-area-inset-bottom)] md:hidden">
        {SECTIONS.slice(0, 4).map((s) => (
          <Link
            key={s.href}
            href={s.href}
            aria-current={current === s ? "page" : undefined}
            className={`py-3 text-center text-sm ${current === s ? "font-bold text-ink" : "text-ink-3"}`}
          >
            <span className={`mx-auto mb-1 block h-0.5 w-6 ${current === s ? "bg-red" : "bg-transparent"}`} />
            {s.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
