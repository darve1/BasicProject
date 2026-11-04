// 장부 세계의 페이지 골격: 페이지 폭, 제목, 칸 제목, 밑줄 탭
import Link from "next/link";

export { Correction, Need, Seal } from "./marks";

export function Page({ children, width = "wide" }: { children: React.ReactNode; width?: "wide" | "mid" | "narrow" }) {
  const max = width === "wide" ? "max-w-[1180px]" : width === "mid" ? "max-w-[920px]" : "max-w-[720px]";
  return <main className={`mx-auto w-full flex-1 ${max} px-5 pb-20 md:px-8 xl:px-0`}>{children}</main>;
}

export function PageHead({ title, note, children }: { title: string; note?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <header className="pt-8 pb-6 md:pt-10">
      <h1 className="text-[1.5rem] leading-tight font-bold tracking-[-0.02em] [overflow-wrap:break-word] md:text-[1.75rem]">{title}</h1>
      {note && <p className="mt-1.5 max-w-[66ch] text-pretty text-ink-2">{note}</p>}
      {children && <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">{children}</div>}
    </header>
  );
}

// 장부의 칸 제목: 굵은 잉크 선 위에 제목
export function SectionHead({ title, children }: { title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b-2 border-ink pb-2">
      <h2 className="text-lg font-bold tracking-[-0.01em]">{title}</h2>
      {children}
    </div>
  );
}

// 밑줄 텍스트 탭 (필터)
export function TextTabs({ items, label }: { items: { href: string; label: string; on: boolean }[]; label: string }) {
  return (
    <nav aria-label={label} className="flex gap-4 overflow-x-auto text-sm [scrollbar-width:none]">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          scroll={false}
          aria-current={it.on ? "true" : undefined}
          className={`shrink-0 border-b-2 pb-1 whitespace-nowrap ${it.on ? "border-red font-bold text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
