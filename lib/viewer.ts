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
