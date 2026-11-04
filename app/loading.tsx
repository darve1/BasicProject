// 장부 행 모양 그대로의 자리 표시. 데이터가 오기 전에도 화면 구조가 보이게
export default function Loading() {
  return (
    <main className="mx-auto max-w-[1180px] px-5 pb-20 md:px-8 xl:px-0" aria-busy="true" aria-label="불러오는 중">
      <div className="pt-10 pb-6">
        <div className="h-8 w-56 animate-pulse rounded-[4px] bg-rule" />
      </div>
      <div className="border-b-2 border-ink pb-2">
        <div className="h-5 w-40 animate-pulse rounded-[4px] bg-rule" />
      </div>
      <ul>
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="flex items-center gap-6 border-b border-rule py-4">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/5 animate-pulse rounded-[4px] bg-rule" />
              <div className="h-3 w-3/5 animate-pulse rounded-[4px] bg-rule/60" />
            </div>
            <div className="h-5 w-16 rounded-[3px] border border-dashed border-rule-2" />
          </li>
        ))}
      </ul>
    </main>
  );
}
