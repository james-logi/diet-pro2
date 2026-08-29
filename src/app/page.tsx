"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { PHASE_GUIDES } from "@/lib/plans";

export default function HomePage() {
  const { state } = useStore();

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 px-8 py-14 text-white shadow-lg">
        <h1 className="text-3xl font-bold sm:text-4xl">
          내 몸에 맞춘 다이어트 플랜,
          <br />
          목표까지 함께 갑니다.
        </h1>
        <p className="mt-4 max-w-xl text-emerald-50">
          이름, 성별, 키, 몸무게만 입력하면 현재 체형과 목표 개월 수 이후의 예상
          체형을 바로 비교하고, 단계별 운동·식단·보조식품 가이드와 맞춤 상품을
          받아보세요.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/plan"
            className="rounded-full bg-white px-6 py-3 font-semibold text-emerald-700 shadow hover:bg-emerald-50"
          >
            {state.goal ? "내 플랜 보기" : "플랜 시작하기"}
          </Link>
          <Link
            href="/shop"
            className="rounded-full border border-white/60 px-6 py-3 font-semibold text-white hover:bg-white/10"
          >
            상품 둘러보기
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">단계별 가이드 미리보기</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {PHASE_GUIDES.map((g) => (
            <div
              key={g.phase}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="text-sm font-semibold text-emerald-600">
                {g.title}
              </div>
              <div className="mt-1 text-xs text-neutral-400">{g.periodLabel}</div>
              <p className="mt-3 text-sm text-neutral-600">{g.dietTip}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-xl font-bold">이렇게 진행돼요</h2>
        <ol className="mt-4 grid gap-3 text-sm text-neutral-600 sm:grid-cols-2">
          <li>1. 신체 정보(이름/성별/키/몸무게)와 목표 체중·기간 입력</li>
          <li>2. 현재 vs 목표 개월 수 이후 예상 체형 이미지 비교</li>
          <li>3. 단계별 운동·식단·보조식품 가이드 확인</li>
          <li>4. 식단·보조식품 상품 구매</li>
          <li>5. [저장] 버튼으로 기록 저장 → 이후 히스토리에서 비교</li>
          <li>6. 목표 체중 달성 시 축하 기프트 자동 지급</li>
        </ol>
      </section>
    </div>
  );
}
