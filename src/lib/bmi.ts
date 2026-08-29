export type BmiCategory =
  | "underweight"
  | "normal"
  | "overweight"
  | "obese1"
  | "obese2";

export function calcBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  if (heightM <= 0) return 0;
  return weightKg / (heightM * heightM);
}

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "underweight";
  if (bmi < 23) return "normal";
  if (bmi < 25) return "overweight";
  if (bmi < 30) return "obese1";
  return "obese2";
}

export const bmiCategoryLabel: Record<BmiCategory, string> = {
  underweight: "저체중",
  normal: "정상",
  overweight: "과체중",
  obese1: "비만 1단계",
  obese2: "비만 2단계",
};

// 0(마름) ~ 1(비만) 사이의 체형 폭 계수 — 실루엣 렌더링에 사용
export function bodyWidthFactor(bmi: number): number {
  const clamped = Math.min(Math.max(bmi, 15), 38);
  return (clamped - 15) / (38 - 15);
}
