import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Page, PageHead } from "@/components/ledger";
import { LoginForm } from "@/components/login-form";
import { getViewer } from "@/lib/data";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, viewer] = await Promise.all([searchParams, getViewer()]);
  if (viewer.userId) redirect("/my");
  return (
    <Page width="narrow">
      <PageHead title="로그인" />
      <div className="max-w-[460px] border-t-2 border-ink pt-5">
        <p className="text-ink-2">비밀번호 없이 이메일로 로그인해요. 받은 메일의 링크를 누르면 바로 내 조건 설정으로 이동해요.</p>
        {error === "link" && (
          <p role="alert" className="mt-3 text-sm font-semibold text-red">
            로그인 링크가 만료됐거나 이미 쓰였어요. 새 링크를 받아 주세요.
          </p>
        )}
        <LoginForm />
      </div>
    </Page>
  );
}
