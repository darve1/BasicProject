import "server-only";
import { buildCalcData } from "./calc-data";
import { getBrands, getCards, getPlans, type Viewer } from "./data";

// 계산기에 넘길 카탈로그. 확인 필요 항목도 포함하되 화면에서 점선 도장으로 표시한다
export async function calculatorProps(viewer: Viewer) {
  const [brands, plans, cards] = await Promise.all([getBrands(), getPlans(), getCards()]);
  return buildCalcData(brands, plans, cards, viewer);
}
