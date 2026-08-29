import { Product } from "./types";

export const PRODUCTS: Product[] = [
  // 초기 (적응기)
  {
    id: "meal-early-1",
    category: "diet_meal",
    name: "저칼로리 균형식 도시락 세트 (5끼)",
    description: "탄단지 균형을 맞춘 350kcal대 도시락. 다이어트 적응기에 적합.",
    price: 39000,
    imageEmoji: "🥗",
    suitablePhase: "early",
  },
  {
    id: "meal-early-2",
    category: "diet_meal",
    name: "대체식 쉐이크 (14포)",
    description: "한 끼 대체용 고식이섬유 쉐이크. 포만감과 영양을 동시에.",
    price: 32000,
    imageEmoji: "🥤",
    suitablePhase: "early",
  },
  {
    id: "supp-early-1",
    category: "supplement",
    manufacturer: "그린팜제약",
    name: "기초대사 활성 비타민 B군",
    description: "적응기 기초대사량 유지를 돕는 종합 비타민 B 복합제.",
    price: 21000,
    imageEmoji: "💊",
    suitablePhase: "early",
  },

  // 중기 (본격기)
  {
    id: "meal-mid-1",
    category: "diet_meal",
    name: "고단백 저탄수 도시락 세트 (5끼)",
    description: "근손실 방지를 위한 고단백 저탄수 구성. 본격 감량기 추천.",
    price: 45000,
    imageEmoji: "🍱",
    suitablePhase: "mid",
  },
  {
    id: "meal-mid-2",
    category: "diet_meal",
    name: "저당 단백 그래놀라",
    description: "아침 대용, 저당 고단백 그래놀라 500g.",
    price: 18000,
    imageEmoji: "🥣",
    suitablePhase: "mid",
  },
  {
    id: "supp-mid-1",
    category: "supplement",
    manufacturer: "바이오넥스",
    name: "WPI 분리유청 단백질 보충제",
    description: "근육량 유지를 위한 고순도 유청 단백질 (초코맛, 900g).",
    price: 42000,
    imageEmoji: "🧃",
    suitablePhase: "mid",
  },
  {
    id: "supp-mid-2",
    category: "supplement",
    manufacturer: "그린팜제약",
    name: "지방분해 촉진 보조제 (가르시니아 복합)",
    description: "가르시니아캄보지아 추출물 함유. 4주 집중 관리용.",
    price: 29000,
    imageEmoji: "🌿",
    suitablePhase: "mid",
  },

  // 후기 (유지기)
  {
    id: "meal-late-1",
    category: "diet_meal",
    name: "체중 유지 밸런스 도시락 (5끼)",
    description: "리바운드 방지를 위한 영양 밸런스 유지식.",
    price: 41000,
    imageEmoji: "🍲",
    suitablePhase: "late",
  },
  {
    id: "supp-late-1",
    category: "supplement",
    manufacturer: "바이오넥스",
    name: "유지기 종합 영양제",
    description: "감량 후 체중 유지를 돕는 종합 미네랄·비타민 제품.",
    price: 25000,
    imageEmoji: "🍀",
    suitablePhase: "late",
  },
];

export function productById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
