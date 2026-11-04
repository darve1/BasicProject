import type { DealCategory, DealType } from "../lib/types";

// 어댑터가 사이트에서 읽어 온 그대로의 딜. 태깅·저장은 run.ts가 한다
export type RawDeal = {
  external_id: string;
  title: string;
  benefit_text?: string;
  merchant?: string;
  period?: string; // "2026.11.01 ~ 2026.11.30" 같은 원문. starts_at/ends_at이 없을 때 파싱
  starts_at?: string | null; // YYYY-MM-DD
  ends_at?: string | null;
  url: string;
  requirements?: string[]; // 시드 딜에서 태깅 대신 직접 지정할 때만
  category?: DealCategory; // 사이트가 붙인 분류를 옮긴 값
};

export type SourceAdapter = {
  id: string; // sources.id
  brandId: string; // 이 소스의 딜을 받으려면 기본으로 필요한 브랜드
  dealType: DealType;
  name: string;
  url: string; // 사람이 보는 목록 페이지
  fetch: () => Promise<RawDeal[]>;
};

export class BlockedError extends Error {}
