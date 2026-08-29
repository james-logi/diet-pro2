"use client";

import Image from "next/image";
import { Gender } from "@/lib/types";
import { bmiCategory } from "@/lib/bmi";

interface SilhouetteProps {
  gender: Gender;
  bmi: number;
  label?: string;
  tone?: "current" | "target";
}

const TONE_BG: Record<"current" | "target", string> = {
  current: "bg-slate-100",
  target: "bg-emerald-50",
};

// Four hand-picked body stages per gender (heavy / overweight / lean /
// toned), cropped from a reference sprite sheet the user supplied. BMI
// picks the closest stage; a "target" silhouette that lands in the normal
// range is bumped up to the toned stage so reaching a healthy weight reads
// as the aspirational "goal" look rather than just "thinner."
function pickStage(bmi: number, tone: "current" | "target"): 1 | 2 | 3 | 4 {
  const category = bmiCategory(bmi);
  let stage: 1 | 2 | 3 | 4;
  if (category === "obese2" || category === "obese1") stage = 1;
  else if (category === "overweight") stage = 2;
  else stage = 3; // normal or underweight
  if (tone === "target" && stage === 3 && category !== "underweight") stage = 4;
  return stage;
}

export default function Silhouette({ gender, bmi, label, tone = "current" }: SilhouetteProps) {
  const stage = pickStage(bmi, tone);
  const genderSlug = gender === "F" ? "female" : "male";
  const src = `/characters/${genderSlug}-${stage}.png`;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`flex h-28 w-20 items-end justify-center rounded-2xl ${TONE_BG[tone]} p-1.5`}>
        <Image
          src={src}
          alt=""
          width={244}
          height={443}
          unoptimized
          className="h-full w-auto object-contain"
        />
      </div>
      {label && (
        <span className="max-w-[130px] text-center text-xs font-medium text-neutral-600">
          {label}
        </span>
      )}
    </div>
  );
}
