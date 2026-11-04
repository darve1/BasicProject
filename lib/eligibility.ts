// 사용자의 나이대·신분을 할인 자격 태그로 바꾼다. 성별은 받지 않는다.

export const AGE_BANDS = [
  { id: "teen", label: "만 18세 이하" },
  { id: "19-24", label: "만 19~24세" },
  { id: "25-29", label: "만 25~29세" },
  { id: "30-34", label: "만 30~34세" },
  { id: "35-39", label: "만 35~39세" },
  { id: "40-64", label: "만 40~64세" },
  { id: "65+", label: "만 65세 이상" },
] as const;

export const ROLES = [
  { id: "student", label: "대학생" },
  { id: "jobseeker", label: "취업준비생" },
  { id: "worker", label: "직장인" },
  { id: "soldier", label: "군 장병" },
] as const;

export const ELIGIBILITY_LABEL: Record<string, string> = {
  youth: "청년 전용",
  student: "대학생 전용",
  soldier: "장병 전용",
  senior: "시니어 전용",
};

const YOUTH_BANDS = new Set(["teen", "19-24", "25-29", "30-34"]);

export function eligibilityTags(ageBand: string | null | undefined, roles: string[] = []): string[] {
  const tags = new Set<string>();
  if (ageBand && YOUTH_BANDS.has(ageBand)) tags.add("youth");
  if (ageBand === "65+") tags.add("senior");
  if (roles.includes("student")) tags.add("student");
  if (roles.includes("soldier")) tags.add("soldier");
  return [...tags];
}

// 자격 태그가 없는 상품은 누구나, 있으면 하나라도 해당해야 한다 (예: "청년·대학생 대상")
export function meetsEligibility(required: string[], userTags: string[]): boolean {
  return required.length === 0 || required.some((t) => userTags.includes(t));
}
