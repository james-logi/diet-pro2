"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import Silhouette from "@/components/Silhouette";
import WeightChart from "@/components/WeightChart";
import { bmiCategory, bmiCategoryLabel, calcBmi } from "@/lib/bmi";
import RequireAuth from "@/components/RequireAuth";
import Link from "next/link";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDay(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function HistoryContent() {
  const { state, updateWeight } = useStore();
  const { snapshots, weightHistory, user, goal } = state;

  const [entryDate, setEntryDate] = useState(todayStr());
  const [entryWeight, setEntryWeight] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [achievedMsg, setAchievedMsg] = useState(false);

  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number | "">("");

  const sortedDesc = useMemo(
    () => [...weightHistory].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [weightHistory]
  );

  async function handleAdd() {
    if (entryWeight === "") return;
    setError(null);
    setSaving(true);
    try {
      const { giftIssued } = await updateWeight(Number(entryWeight), entryDate);
      setEntryWeight("");
      setEntryDate(todayStr());
      if (giftIssued) setAchievedMsg(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(date: string, weightKg: number) {
    setEditingDate(date);
    setEditValue(weightKg);
  }

  async function saveEdit(date: string) {
    if (editValue === "") return;
    setError(null);
    setSaving(true);
    try {
      const { giftIssued } = await updateWeight(Number(editValue), date);
      setEditingDate(null);
      if (giftIssued) setAchievedMsg(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-bold">다이어트 기록 히스토리</h1>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">체중 변화 그래프</h2>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col text-xs text-neutral-500">
              날짜
              <input
                type="date"
                max={todayStr()}
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col text-xs text-neutral-500">
              체중 (kg)
              <input
                type="number"
                step="0.1"
                placeholder="예: 68.5"
                value={entryWeight}
                onChange={(e) =>
                  setEntryWeight(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-28 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
              />
            </label>
            <button
              onClick={handleAdd}
              disabled={saving || entryWeight === ""}
              className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
            >
              기록하기
            </button>
          </div>
        </div>

        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        {achievedMsg && (
          <p className="mt-2 text-sm font-medium text-amber-600">
            🎉 목표 체중을 달성했습니다! 마이페이지에서 기프트를 확인해보세요.
          </p>
        )}

        <div className="mt-5">
          <WeightChart entries={weightHistory} targetWeightKg={goal?.targetWeightKg} />
        </div>

        {weightHistory.length === 0 && (
          <p className="mt-3 text-sm text-neutral-500">
            아직 기록이 없습니다. 위에서 오늘 체중을 입력하거나{" "}
            <Link href="/plan" className="text-emerald-600 underline">
              플랜 설정
            </Link>
            에서 시작해보세요.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold">일별 기록</h2>
        {sortedDesc.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">기록된 날짜가 없습니다.</p>
        ) : (
          <div className="mt-4 flex flex-col divide-y divide-neutral-100">
            {sortedDesc.map((w) => {
              const bmi = user ? calcBmi(w.weightKg, user.heightCm) : 0;
              const isEditing = editingDate === w.date;
              return (
                <div key={w.date} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-36 shrink-0 text-neutral-500">{fmtDay(w.date)}</span>
                  {isEditing ? (
                    <>
                      <input
                        type="number"
                        step="0.1"
                        autoFocus
                        value={editValue}
                        onChange={(e) =>
                          setEditValue(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="w-24 rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => saveEdit(w.date)}
                        disabled={saving}
                        className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditingDate(null)}
                        className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="w-16 font-semibold">{w.weightKg}kg</span>
                      <span className="text-xs text-neutral-400">
                        BMI {bmi.toFixed(1)} · {bmiCategoryLabel[bmiCategory(bmi)]}
                      </span>
                      <button
                        onClick={() => startEdit(w.date, w.weightKg)}
                        className="ml-auto text-xs text-neutral-400 underline hover:text-emerald-600"
                      >
                        수정
                      </button>
                    </>
                  )}
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
                    tone="target"
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
