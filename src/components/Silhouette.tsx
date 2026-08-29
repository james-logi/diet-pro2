import { Gender } from "@/lib/types";
import { bodyWidthFactor } from "@/lib/bmi";

interface SilhouetteProps {
  gender: Gender;
  bmi: number;
  label?: string;
  colorClass?: string;
}

// BMI 기반 파라메트릭 실루엣: 체형 폭 계수(0~1)로 몸통/어깨/허리 너비를 보간해
// 저체중~비만 구간을 하나의 SVG 템플릿으로 표현한다.
export default function Silhouette({
  gender,
  bmi,
  label,
  colorClass = "fill-emerald-400",
}: SilhouetteProps) {
  const f = bodyWidthFactor(bmi); // 0 (마른) ~ 1 (비만)

  const shoulderW = 44 + f * 26; // 44~70
  const waistW = 30 + f * 46; // 30~76
  const hipW = gender === "F" ? 46 + f * 40 : 42 + f * 44;
  const headR = 16;

  const cx = 100;
  const shoulderY = 70;
  const waistY = 130;
  const hipY = 170;
  const legBottomY = 250;

  const path = `
    M ${cx - shoulderW / 2} ${shoulderY}
    C ${cx - waistW / 2 - 6} ${shoulderY + 20}, ${cx - waistW / 2} ${waistY - 10}, ${cx - waistW / 2} ${waistY}
    C ${cx - hipW / 2} ${waistY + 15}, ${cx - hipW / 2} ${hipY - 10}, ${cx - hipW / 2} ${hipY}
    L ${cx - hipW / 4} ${legBottomY}
    L ${cx - 6} ${legBottomY}
    L ${cx - 4} ${hipY + 10}
    L ${cx + 4} ${hipY + 10}
    L ${cx + 6} ${legBottomY}
    L ${cx + hipW / 4} ${legBottomY}
    L ${cx + hipW / 2} ${hipY}
    C ${cx + hipW / 2} ${hipY - 10}, ${cx + hipW / 2} ${waistY + 15}, ${cx + waistW / 2} ${waistY}
    C ${cx + waistW / 2} ${waistY - 10}, ${cx + waistW / 2 + 6} ${shoulderY + 20}, ${cx + shoulderW / 2} ${shoulderY}
    C ${cx + shoulderW / 2} ${shoulderY - 14}, ${cx + headR + 6} ${shoulderY - 22}, ${cx + headR - 2} ${shoulderY - 26}
    L ${cx - headR + 2} ${shoulderY - 26}
    C ${cx - headR - 6} ${shoulderY - 22}, ${cx - shoulderW / 2} ${shoulderY - 14}, ${cx - shoulderW / 2} ${shoulderY}
    Z
  `;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox="0 0 200 270"
        width="140"
        height="189"
        className="drop-shadow-sm"
      >
        <circle
          cx={cx}
          cy={shoulderY - 40}
          r={headR}
          className={colorClass}
          opacity={0.9}
        />
        <path d={path} className={colorClass} opacity={0.85} />
      </svg>
      {label && (
        <span className="text-sm font-medium text-neutral-600">{label}</span>
      )}
    </div>
  );
}
