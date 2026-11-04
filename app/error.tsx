"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-[560px] px-5 py-20">
      <h1 className="text-lg font-bold">장부를 불러오지 못했어요</h1>
      <p className="mt-2 text-ink-2">데이터 서버와 연결이 잠시 끊겼을 수 있어요. 다시 시도해도 안 되면 잠시 뒤에 들어와 주세요.</p>
      <button type="button" onClick={reset} className="mt-5 rounded-[4px] bg-ink px-4 py-2.5 font-bold text-sheet hover:bg-ink-2">
        다시 불러오기
      </button>
    </main>
  );
}
