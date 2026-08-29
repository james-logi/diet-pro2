"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Gender } from "@/lib/types";
import { bmiCategoryLabel, calcBmi, bmiCategory } from "@/lib/bmi";
import Silhouette from "@/components/Silhouette";
import { PHASE_GUIDES } from "@/lib/plans";
import { PRODUCTS } from "@/lib/products";
import RequireAuth from "@/components/RequireAuth";
import Link from "next/link";

function PlanForm() {
  const {
    state,
    currentWeight,
    updateProfile,
    setGoal,
    updateWeight,
    saveSnapshot,
    addToCart,
  } = useStore();

  const [name, setName] = useState(state.user?.name ?? "");
  const [gender, setGender] = useState<Gender>(state.user?.gender ?? "F");
  const [height, setHeight] = useState(state.user?.heightCm || 165);
  const [weight, setWeight] = useState(currentWeight || 60);
  const [targetWeight, setTargetWeight] = useState(
    state.goal?.targetWeightKg ?? (currentWeight || 60) - 5
  );
  const [duration, setDuration] = useState(state.goal?.durationMonths ?? 3);
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect --
       Deliberate: seed the form once the user's data arrives from the API
       (auth/state are fetched asynchronously after mount). */
    if (state.user) {
      setName(state.user.name);
      setGender(state.user.gender);
      setHeight(state.user.heightCm || 165);
    }
    if (currentWeight) setWeight(currentWeight);
    if (state.goal) {
      setTargetWeight(state.goal.targetWeightKg);
      setDuration(state.goal.durationMonths);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.user?.id]);

  const currentBmi = useMemo(() => calcBmi(weight, height), [weight, height]);
  const targetBmi = useMemo(
    () => calcBmi(targetWeight, height),
    [targetWeight, height]
  );

  async function handleApply() {
    setError(null);
    setBusy(true);
    try {
      await updateProfile({ name: name || "고객", gender, heightCm: height });
      await setGoal(weight, targetWeight, duration);
      setSaved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "적용 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function handleWeightUpdate() {
    setError(null);
    setBusy(true);
    try {
      await updateWeight(weight);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업데이트 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveSnapshot() {
    setError(null);
    setBusy(true);
    try {
      if (!state.goal) {
        await updateProfile({ name: name || "고객", gender, heightCm: height });
        await setGoal(weight, targetWeight, duration);
      }
      await saveSnapshot(note || undefined);
      setSaved(true);
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  const hasGoal = !!state.goal;

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h1 className="text-xl font-bold">프로필 &amp; 목표 설정</h1>
        <p className="mt-1 text-sm text-neutral-500">
          값을 수정하면 아래 예상 이미지와 플랜이 실시간으로 업데이트됩니다.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            이름
            <input
              className="rounded-lg border border-neutral-300 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            성별
            <select
              className="rounded-lg border border-neutral-300 px-3 py-2"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
            >
              <option value="F">여성</option>
              <option value="M">남성</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            키 (cm)
            <input
              type="number"
              className="rounded-lg border border-neutral-300 px-3 py-2"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            현재 몸무게 (kg)
            <input
              type="number"
              className="rounded-lg border border-neutral-300 px-3 py-2"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            목표 몸무게 (kg)
            <input
              type="number"
              className="rounded-lg border border-neutral-300 px-3 py-2"
              value={targetWeight}
              onChange={(e) => setTargetWeight(Number(e.target.value))}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            다이어트 기간 (개월)
            <input
              type="number"
              min={1}
              max={24}
              className="rounded-lg border border-neutral-300 px-3 py-2"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={handleApply}
            disabled={busy}
            className="rounded-full bg-emerald-500 px-5 py-2.5 font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            예상 이미지 생성 / 적용
          </button>
          {hasGoal && (
            <button
              onClick={handleWeightUpdate}
              disabled={busy}
              className="rounded-full border border-neutral-300 px-5 py-2.5 font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              현재 몸무게로 기록 업데이트
            </button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-bold">예상 이미지 모형</h2>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-10">
          <Silhouette
            gender={gender}
            bmi={currentBmi}
            colorClass="fill-neutral-400"
            label={`현재 · ${weight}kg · BMI ${currentBmi.toFixed(1)} (${bmiCategoryLabel[bmiCategory(currentBmi)]})`}
          />
          <div className="text-3xl text-neutral-300">→</div>
          <Silhouette
            gender={gender}
            bmi={targetBmi}
            colorClass="fill-emerald-500"
            label={`${duration}개월 후 · ${targetWeight}kg · BMI ${targetBmi.toFixed(1)} (${bmiCategoryLabel[bmiCategory(targetBmi)]})`}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-neutral-50 p-4">
          <input
            className="min-w-[200px] flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            placeholder="메모 (선택) — 예: 첫 목표 설정"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            onClick={handleSaveSnapshot}
            disabled={busy}
            className="rounded-full bg-neutral-900 px-6 py-2.5 font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
          >
            저장하기 (기록에 남기기)
          </button>
        </div>
        {saved && (
          <p className="mt-2 text-sm text-emerald-600">
            저장되었습니다. <Link href="/history" className="underline">기록 페이지</Link>에서 비교해보세요.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-bold">단계별 가이드 (운동 · 식단 · 보조식품)</h2>
        <div className="mt-5 flex flex-col gap-6">
          {PHASE_GUIDES.map((g) => {
            const phaseProducts = PRODUCTS.filter((p) => p.suitablePhase === g.phase);
            return (
              <div key={g.phase} className="rounded-xl border border-neutral-200 p-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold text-emerald-600">{g.title}</h3>
                  <span className="text-xs text-neutral-400">{g.periodLabel}</span>
                </div>

                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  <div>
                    <div className="text-xs font-semibold text-neutral-500">🏃 운동</div>
                    <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-neutral-600">
                      {g.exercise.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-500">🥗 식단</div>
                    <p className="mt-1 text-sm text-neutral-600">{g.dietTip}</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-500">💊 보조식품</div>
                    <p className="mt-1 text-sm text-neutral-600">{g.supplementTip}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {phaseProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p.id)}
                      className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-emerald-400 hover:bg-emerald-50"
                    >
                      <span>{p.imageEmoji}</span>
                      {p.name}
                      <span className="text-neutral-400">담기 +</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function PlanPage() {
  return (
    <RequireAuth>
      <PlanForm />
    </RequireAuth>
  );
}
