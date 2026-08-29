import { PlanPhase } from "./types";

export interface PhaseGuide {
  phase: PlanPhase;
  title: string;
  periodLabel: string;
  exercise: string[];
  dietTip: string;
  supplementTip: string;
}

export const PHASE_GUIDES: PhaseGuide[] = [
  {
    phase: "early",
    title: "1단계 · 적응기",
    periodLabel: "전체 기간의 처음 1/3",
    exercise: [
      "주 3~4회, 20~30분 걷기 / 저강도 유산소",
      "전신 스트레칭으로 관절 부담 최소화",
      "무리한 고강도 운동은 지양, 습관 형성에 집중",
    ],
    dietTip: "칼로리를 급격히 줄이기보다 균형 잡힌 저칼로리 식단으로 몸을 적응시키는 시기입니다.",
    supplementTip: "기초대사량 유지를 돕는 비타민 B군 위주로 보충하세요.",
  },
  {
    phase: "mid",
    title: "2단계 · 본격기",
    periodLabel: "전체 기간의 중간 1/3",
    exercise: [
      "주 3~4회 근력 운동 + 주 2회 유산소 병행",
      "스쿼트, 런지 등 하체 위주 복합 근력 운동 추천",
      "세트당 12~15회, 3세트 기준으로 점진적 강도 증가",
    ],
    dietTip: "고단백 저탄수 식단으로 근손실을 막으면서 체지방 감량에 집중하는 시기입니다.",
    supplementTip: "유청 단백질과 지방분해 보조제로 근육 유지와 감량 속도를 함께 관리하세요.",
  },
  {
    phase: "late",
    title: "3단계 · 유지기",
    periodLabel: "전체 기간의 마지막 1/3",
    exercise: [
      "근력 운동 강도 유지, 체형 관리 위주 운동으로 전환",
      "요가/필라테스 등 체형 교정 운동 병행",
      "폭식·요요 방지를 위한 규칙적인 운동 루틴 유지",
    ],
    dietTip: "감량된 체중을 유지할 수 있는 밸런스 잡힌 유지식으로 서서히 전환하세요.",
    supplementTip: "종합 영양제로 감량기 동안 부족했을 수 있는 미량 영양소를 보충하세요.",
  },
];

export function guideForPhase(phase: PlanPhase): PhaseGuide {
  return PHASE_GUIDES.find((g) => g.phase === phase)!;
}
