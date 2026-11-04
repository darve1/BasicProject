import type { Metadata } from "next";
import localFont from "next/font/local";
import { signOut } from "@/app/actions";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { getBrands, getSources, getViewer } from "@/lib/data";
import { conditionLabels } from "@/lib/viewer";
import "./globals.css";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "구독장부", template: "%s · 구독장부" },
  description: "통신사·카드·멤버십 결합 혜택과 제휴 할인을 공식 출처에서 모아, 내 조건에 맞는 구독 최저 조합과 할인만 보여줘요.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [viewer, brands, sources] = await Promise.all([getViewer(), getBrands(), getSources()]);
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="flex min-h-dvh flex-col pb-16 md:pb-0">
        <SiteNav signedIn={Boolean(viewer.userId)} conditions={conditionLabels(viewer, brands)} signOut={signOut} />
        {children}
        <SiteFooter sources={sources} />
      </body>
    </html>
  );
}
