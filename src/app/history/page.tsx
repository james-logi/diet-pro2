"use client";

import { useStore } from "@/lib/store";
import Silhouette from "@/components/Silhouette";
import { bmiCategory, bmiCategoryLabel } from "@/lib/bmi";
import RequireAuth from "@/components/RequireAuth";
import Link from "next/link";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function HistoryContent() {
  const { state } = useStore();
  const { snapshots, weightHistory, user } = state;

  const weights = weightHistory.map((w) => w.weightKg);
  const maxW = weights.length ? Math.max(...weights) : 0;
  const minW = weights.length ? Math.min(...weights) : 0;
  const range = Math.max(maxW - minW, 1);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-bold">다이어트 기록 히스토리</h1>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold">체중 변화</h2>
        {weightHistory.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            아직 기록이 없습니다.{" "}
            <Link href="/plan" className="text-emerald-600 underline">
              플랜 설정
            </Link>
            에서 시작해보세요.
          </p>
        ) : (
          <div className="mt-6 flex h-40 items-end gap-3 overflow-x-auto">
            {weightHistory.map((w) => {
              const h = 20 + ((w.weightKg - minW) / range) * 100;
              return (
                <div key={w.id} className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 rounded-t-md bg-emerald-400"
                    style={{ height: `${h}px` }}
                    title={`${w.weightKg}kg`}
                  />
                  <span className="text-[10px] text-neutral-400">
                    {w.weightKg}kg
                  </span>
                  <span className="text-[10px] text-neutral-300">
                    {new Date(w.measuredAt).toLocaleDateString("ko-KR", {
                      month: "numeric",
                      day: "numeric",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">저장된 스냅샷 비교</h2>
        {snapshots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-neutral-500">
            저장된 기록이 없습니다. 플랜 페이지에서 [저장하기] 버튼을 눌러 기록을
            남겨보세요.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...snapshots].reverse().map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-neutral-200 bg-white p-5"
              >
                <div className="text-xs text-neutral-400">{fmt(s.savedAt)}</div>
                <div className="mt-3 flex justify-center">
                  <Silhouette
                    gender={user?.gender ?? "F"}
                    bmi={s.bmi}
                    colorClass="fill-emerald-400"
                    label={`${s.weightKg}kg · BMI ${s.bmi.toFixed(1)}`}
                  />
                </div>
                <div className="mt-2 text-center text-xs text-neutral-500">
                  {bmiCategoryLabel[bmiCategory(s.bmi)]}
                </div>
                <div className="mt-3 rounded-lg bg-neutral-50 p-3 text-xs text-neutral-500">
                  목표: {s.goal.targetWeightKg}kg / {s.goal.durationMonths}개월
                  <br />
                  상태:{" "}
                  {s.goal.status === "achieved"
                    ? "🎉 달성"
                    : s.goal.status === "abandoned"
                    ? "중단"
                    : "진행 중"}
                </div>
                {s.note && (
                  <div className="mt-2 text-sm italic text-neutral-600">
                    &ldquo;{s.note}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <RequireAuth>
      <HistoryContent />
    </RequireAuth>
  );
}
