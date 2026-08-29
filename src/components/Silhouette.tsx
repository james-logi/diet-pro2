"use client";

import { Gender } from "@/lib/types";
import { bodyWidthFactor, bmiCategory } from "@/lib/bmi";

interface SilhouetteProps {
  gender: Gender;
  bmi: number;
  label?: string;
  tone?: "current" | "target";
}

const TONE_STROKE: Record<"current" | "target", string> = {
  current: "#64748b", // slate-500
  target: "#059669", // emerald-600
};

// A simple rounded wedge/capsule limb: wide at the top, tapering to a
// rounded cap at the bottom. Built as one plain path (no arcs, no chained
// sub-paths) so it can't self-intersect the way a multi-segment tapered
// limb did in an earlier version of this component.
function limbWedge(
  xTopOuter: number,
  xTopInner: number,
  yTop: number,
  xBottomOuter: number,
  xBottomInner: number,
  yBottom: number,
  capR: number
) {
  const dir = xBottomOuter >= xBottomInner ? 1 : -1;
  return `
    M ${xTopOuter} ${yTop}
    L ${xBottomOuter} ${yBottom - capR}
    Q ${xBottomOuter} ${yBottom} ${xBottomOuter - dir * capR} ${yBottom}
    L ${xBottomInner} ${yBottom}
    L ${xTopInner} ${yTop}
    Z
  `;
}

// Simple, flat "mascot" character (inspired by pixel-walking-app style body
// icons): round head, one soft blob body, stubby arms/legs. BMI only
// changes the body/limb width and the belly line -- round belly when heavy,
// flat when lean, ribs when underweight -- rather than trying to sculpt a
// realistic figure.
export default function Silhouette({ gender, bmi, label, tone = "current" }: SilhouetteProps) {
  const f = bodyWidthFactor(bmi); // 0 (마른) ~ 1 (비만)
  const category = bmiCategory(bmi);
  const stroke = TONE_STROKE[tone];
  const isF = gender === "F";

  const cx = 60;
  const headR = 18;
  const headCy = 25;
  const shoulderY = 44;
  const hipY = 112;
  const legTopY = 118;
  const footY = 158;

  const shoulderW = (isF ? 44 : 50) + f * 10;
  const hipW = (isF ? 52 : 48) + f * 16;
  const bellyBulge = 6 + f * 16;

  const armW = 12 + f * 4;
  const legGap = 9;
  const legW = 14 + f * 4;

  const bodyPath = `
    M ${cx - shoulderW / 2} ${shoulderY}
    Q ${cx - shoulderW / 2 - bellyBulge * 0.3} ${(shoulderY + hipY) / 2} ${cx - hipW / 2} ${hipY}
    Q ${cx - hipW / 2} ${legTopY} ${cx - legGap} ${legTopY}
    Q ${cx} ${legTopY + 4} ${cx + legGap} ${legTopY}
    Q ${cx + hipW / 2} ${legTopY} ${cx + hipW / 2} ${hipY}
    Q ${cx + shoulderW / 2 + bellyBulge * 0.3} ${(shoulderY + hipY) / 2} ${cx + shoulderW / 2} ${shoulderY}
    Q ${cx} ${shoulderY - 16} ${cx - shoulderW / 2} ${shoulderY}
    Z
  `;

  const armLPath = limbWedge(
    cx - shoulderW / 2 - armW * 0.6,
    cx - shoulderW / 2 + 3,
    shoulderY + 2,
    cx - shoulderW / 2 - armW * 0.4,
    cx - shoulderW / 2 + armW * 0.4,
    hipY - 6,
    armW * 0.4
  );
  const armRPath = limbWedge(
    cx + shoulderW / 2 + armW * 0.6,
    cx + shoulderW / 2 - 3,
    shoulderY + 2,
    cx + shoulderW / 2 + armW * 0.4,
    cx + shoulderW / 2 - armW * 0.4,
    hipY - 6,
    armW * 0.4
  );

  const legLPath = limbWedge(
    cx - legGap - legW / 2,
    cx - 1,
    legTopY,
    cx - legGap - legW / 2 + 2,
    cx - 1,
    footY,
    legW * 0.4
  );
  const legRPath = limbWedge(
    cx + legGap + legW / 2,
    cx + 1,
    legTopY,
    cx + legGap + legW / 2 - 2,
    cx + 1,
    footY,
    legW * 0.4
  );

  const bellyY = (shoulderY + hipY) / 2 + 14;
  const isUnderweight = category === "underweight";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 120 170" width="130" height="184">
        {/* legs */}
        <path d={legLPath} fill="#fff" stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />
        <path d={legRPath} fill="#fff" stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />

        {/* body */}
        <path d={bodyPath} fill="#fff" stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />

        {/* arms, drawn on top so they read as distinct limbs */}
        <path d={armLPath} fill="#fff" stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />
        <path d={armRPath} fill="#fff" stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />

        {/* belly detail: a round curve when heavier, simple ribs when
            underweight */}
        {isUnderweight ? (
          <g stroke={stroke} strokeWidth={1.5} strokeLinecap="round" opacity={0.7}>
            <line x1={cx - 10} y1={bellyY - 8} x2={cx + 10} y2={bellyY - 8} />
            <line x1={cx - 11} y1={bellyY} x2={cx + 11} y2={bellyY} />
            <line x1={cx - 10} y1={bellyY + 8} x2={cx + 10} y2={bellyY + 8} />
          </g>
        ) : (
          <path
            d={`M ${cx - 10 - f * 4} ${bellyY} Q ${cx} ${bellyY + f * 14} ${cx + 10 + f * 4} ${bellyY}`}
            fill="none"
            stroke={stroke}
            strokeWidth={1.75}
            strokeLinecap="round"
            opacity={0.7}
          />
        )}

        {/* head */}
        <circle cx={cx} cy={headCy} r={headR} fill="#fff" stroke={stroke} strokeWidth={2.5} />
        <ellipse cx={cx - 6} cy={headCy - 1} rx={1.8} ry={2.6} fill={stroke} />
        <ellipse cx={cx + 6} cy={headCy - 1} rx={1.8} ry={2.6} fill={stroke} />
        <path
          d={`M ${cx - 4} ${headCy + 8} Q ${cx} ${headCy + 10} ${cx + 4} ${headCy + 8}`}
          fill="none"
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </svg>
      {label && <span className="max-w-[160px] text-center text-sm font-medium text-neutral-600">{label}</span>}
    </div>
  );
}
