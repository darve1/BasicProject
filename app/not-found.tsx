import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-[560px] px-5 py-20">
      <h1 className="text-lg font-bold">장부에 없는 페이지예요</h1>
      <p className="mt-2 text-ink-2">주소가 바뀌었거나 끝난 할인일 수 있어요.</p>
      <Link href="/" className="mt-5 inline-block rounded-[4px] bg-ink px-4 py-2.5 font-bold text-sheet hover:bg-ink-2">
        홈으로
      </Link>
    </main>
  );
}
