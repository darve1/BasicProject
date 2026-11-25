import { AGE_BANDS, ROLES } from "./eligibility";
import type { Viewer } from "./data";
import type { Brand } from "./types";

// 조건 칩에 쓸 이름들: 보유 브랜드, 신분, 나이대
export function conditionLabels(viewer: Viewer, brands: Brand[]): string[] {
  const names = brands.filter((b) => viewer.brandIds.includes(b.id)).map((b) => b.name);
  const roles = ROLES.filter((r) => viewer.roles.includes(r.id)).map((r) => r.label);
  const band = AGE_BANDS.find((b) => b.id === viewer.ageBand)?.label;
  return [...names, ...roles, ...(band ? [band] : [])];
}

export const brandMap = (brands: Brand[]) => new Map(brands.map((b) => [b.id, b]));

// 내 조건 폼의 "지금 쓰는 요금제" 칸(tier:<서비스 id>)을 읽는다. 고른 구독의 것만 남긴다. 서버 저장과 아티팩트 저장이 같이 쓴다
export function tiersFromForm(form: FormData, services: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of services) {
    const v = String(form.get(`tier:${s}`) ?? "").trim().slice(0, 40);
    if (v) out[s] = v;
  }
  return out;
}
