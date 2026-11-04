import type { DealCategory, DealType, ServiceCategory, SourceTrust } from "./types";

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export const TODAY = () => new Date().toISOString().slice(0, 10);

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

// "11.03" 같은 짧은 날짜
export const shortDate = (d: string) => `${d.slice(5, 7)}.${d.slice(8, 10)}`;

export function period(starts: string | null, ends: string | null): string {
  if (starts && ends) return `${starts.replaceAll("-", ".")} ~ ${shortDate(ends)}`;
  if (ends) return `~ ${ends.replaceAll("-", ".")}`;
  if (starts) return `${starts.replaceAll("-", ".")} ~`;
  return "상시";
}

export function endsLabel(ends: string | null, today = TODAY()): string | null {
  if (!ends) return null;
  const d = daysBetween(today, ends);
  if (d < 0) return "종료";
  if (d === 0) return "오늘 마감";
  if (d <= 7) return `D-${d}`;
  return null;
}

export const TRUST_LABEL: Record<SourceTrust, string> = {
  official: "공식",
  public: "공공",
  platform: "플랫폼",
  press: "보도",
};

// 확인일이 30일 넘으면 경과일을, 60일 넘으면 확인 필요로 본다
export function freshness(checkedAt: string, today = TODAY()): "fresh" | "stale" | "expired" {
  const d = daysBetween(checkedAt.slice(0, 10), today);
  return d > 60 ? "expired" : d > 30 ? "stale" : "fresh";
}

export const DEAL_TYPE_LABEL: Record<DealType, string> = {
  card: "카드 제휴",
  telecom: "통신사 제휴",
  platform: "플랫폼 연계",
};

export const DEAL_CATEGORY_LABEL: Record<DealCategory, string> = {
  subscription: "구독",
  cafe: "카페",
  cvs: "편의점",
  food: "외식·배달",
  shopping: "쇼핑",
  travel: "여행",
  culture: "문화",
  etc: "기타",
};

export const SERVICE_CATEGORY_LABEL: Record<ServiceCategory, string> = {
  ott: "OTT",
  ai: "AI 구독",
  delivery: "배달앱",
  etc: "기타",
};

export const ROUTE_LABEL = {
  official: "본사 직접",
  telecom: "통신사 상품",
  membership: "멤버십 결합",
  platform: "플랫폼 결합",
} as const;

// 근거(출처) 이름: 링크하지 않고 글자로만 보여준다. 이동은 항상 공식 가입 페이지로
const SOURCE_NAMES: [RegExp, string][] = [
  [/heraldk\.com/, "헤럴드경제"],
  [/ddaily\.co\.kr/, "디지털데일리"],
  [/khan\.co\.kr/, "경향신문"],
  [/nextplatform\.net/, "Next Platform"],
  [/byline\.network/, "바이라인네트워크"],
  [/daum\.net/, "다음 뉴스"],
  [/news\.sktelecom\.com/, "SKT 뉴스룸"],
  [/banksalad\.com/, "뱅크샐러드"],
];

export function sourceName(url: string, trust: SourceTrust): string {
  const known = SOURCE_NAMES.find(([re]) => re.test(url))?.[1];
  if (known) return `${known} ${trust === "press" ? "보도" : "자료"}`;
  try {
    return `${new URL(url).hostname.replace(/^www\./, "")} 공식 페이지`;
  } catch {
    return "출처 확인 중";
  }
}
