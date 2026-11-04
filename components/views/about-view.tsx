// 추천 기준·출처 화면
import { Page, PageHead, SectionHead, Seal } from "@/components/ledger";
import type { Source } from "@/lib/types";
import { DEAL_TYPE_LABEL, TODAY } from "@/lib/format";

const STATUS: Record<string, string> = {
  ok: "정상 수집",
  empty: "0건(구조 변경 의심, 기존 데이터 유지)",
  error: "수집 실패",
  blocked: "사이트가 수집을 막음",
  running: "수집 중",
};

export function AboutView({ sources }: { sources: Source[] }) {
  const today = TODAY();
  return (
    <Page width="mid">
      <PageHead title="추천 기준과 출처" note="이 장부의 숫자가 어디서 왔고, 순위를 어떻게 정하는지 전부 공개해요." />

      <div className="space-y-12">
        <section aria-labelledby="seal">
          <SectionHead title={<span id="seal">확인 표시</span>} />
          <ul>
            <li className="grid items-center gap-4 border-b border-rule py-4 sm:grid-cols-[90px_1fr]">
              <span className="flex items-center gap-3">
                <Seal trust="official" checkedAt={today} />
              </span>
              <p className="text-ink-2">공식 페이지(또는 공공기관·이용자 많은 합법 플랫폼)에서 그날 직접 확인한 값. 30일이 지나면 흐려지고, 60일이 지나면 확인 필요로 바뀌어요.</p>
            </li>
            <li className="grid items-center gap-4 border-b border-rule py-4 sm:grid-cols-[90px_1fr]">
              <span className="flex items-center gap-3">
                <Seal trust="platform" checkedAt={today} needsCheck />
              </span>
              <p className="text-ink-2">플랫폼 출처이거나, 달러 결제라 환율에 따라 금액이 달라지거나, 공식 페이지가 바뀐 것을 감지한 값. 가입 전 원문을 꼭 확인하세요. 뉴스 기사는 근거로 쓰지 않아요.</p>
            </li>
          </ul>
        </section>

        <section aria-labelledby="rank">
          <SectionHead title={<span id="rank">순위는 이렇게 정해요</span>} />
          <ul className="max-w-[68ch] list-disc space-y-2 py-4 pl-5 text-ink-2">
            <li>최저 조합은 고른 구독을 모두 덮는 가입 경로 조합 중 월 비용이 낮은 순이에요. 같으면 상품 수가 적은 쪽이 앞이에요.</li>
            <li>이미 내고 있는 멤버십은 추가로 드는 돈만 세요.</li>
            <li>통신사 상품은 그 통신사 고객에게만, 청년·대학생 전용 상품은 그 자격이 있을 때만 계산에 넣어요.</li>
            <li>카드 추천은 직접 결제한 금액에 할인율과 월 한도를 적용하고 연회비를 12로 나눠 뺀 실제 이득 순이에요. 전월실적은 최저 구간 기준이에요.</li>
            <li>광고비나 제휴 수수료는 순위에 들어가지 않아요. 지금은 광고와 제휴 링크가 아예 없어요.</li>
          </ul>
        </section>

        <section aria-labelledby="src">
          <SectionHead title={<span id="src">할인 정보 출처</span>} />
          <p className="max-w-[68ch] py-3 text-ink-2">
            robots.txt를 지키고, 요청 사이 1초 이상 쉬며, 로그인해야 보이는 페이지는 수집하지 않아요. 제목·혜택 요약·기간·원문 링크만 저장해요.
          </p>
          <table className="w-full text-left text-sm">
            <thead className="text-ink-3">
              <tr className="border-b border-rule">
                <th scope="col" className="py-2 pr-4 font-normal">소스</th>
                <th scope="col" className="hidden py-2 pr-4 font-normal sm:table-cell">종류</th>
                <th scope="col" className="py-2 pr-4 font-normal">방식</th>
                <th scope="col" className="py-2 text-right font-normal">마지막 실행</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.id} className="border-b border-rule align-top">
                  <td className="py-3 pr-4">
                    <a href={s.url} target="_blank" rel="noreferrer" className="font-semibold hover:underline">{s.name}</a>
                    {s.note && <p className="mt-1 text-ink-3">{s.note}</p>}
                  </td>
                  <td className="hidden py-3 pr-4 sm:table-cell">{DEAL_TYPE_LABEL[s.deal_type]}</td>
                  <td className="py-3 pr-4">
                    <span className={`font-semibold ${s.mode === "crawl" ? "text-blue" : "text-ink-2"}`}>{s.mode === "crawl" ? "자동 수집" : "수동 등록"}</span>
                    {s.last_status && STATUS[s.last_status] && s.last_status !== "ok" && <p className="text-ink-3">{STATUS[s.last_status]}</p>}
                  </td>
                  <td className="py-3 text-right whitespace-nowrap tabular-nums">
                    {s.last_run_at ? (
                      <>
                        <span className="block">{s.last_run_at.slice(0, 10)}</span>
                        <span className="block text-ink-3">{s.last_count ?? 0}건</span>
                      </>
                    ) : (
                      "아직 없음"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section aria-labelledby="privacy">
          <SectionHead title={<span id="privacy">개인정보</span>} />
          <p className="max-w-[68ch] py-4 text-ink-2">
            이메일(로그인용), 보유한 통신사·카드사·간편결제·멤버십, 나이대와 신분만 저장해요. 성별과 생년월일은 받지 않아요. 카드 번호나 결제 정보는 어떤 경우에도 묻지 않아요.
          </p>
        </section>
      </div>
    </Page>
  );
}
