"use client";

import { useStore } from "@/lib/store";
import RequireAuth from "@/components/RequireAuth";

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MyPageContent() {
  const { state, currentWeight } = useStore();
  const { user, goal, orders, gifts } = state;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-bold">마이페이지</h1>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold">내 정보</h2>
        {user ? (
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <div className="text-neutral-400">이름</div>
              <div className="font-medium">{user.name}</div>
            </div>
            <div>
              <div className="text-neutral-400">아이디</div>
              <div className="font-medium">{user.username}</div>
            </div>
            <div>
              <div className="text-neutral-400">성별</div>
              <div className="font-medium">{user.gender === "F" ? "여성" : "남성"}</div>
            </div>
            <div>
              <div className="text-neutral-400">키 / 현재 체중</div>
              <div className="font-medium">
                {user.heightCm}cm / {currentWeight}kg
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">아직 프로필이 없습니다.</p>
        )}

        {goal && (
          <div className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm">
            목표: {goal.startWeightKg}kg → {goal.targetWeightKg}kg
            ({goal.durationMonths}개월) · 상태:{" "}
            <span
              className={
                goal.status === "achieved" ? "font-semibold text-emerald-600" : ""
              }
            >
              {goal.status === "achieved"
                ? "🎉 달성 완료"
                : goal.status === "abandoned"
                ? "중단됨"
                : "진행 중"}
            </span>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold">획득 기프트</h2>
        {gifts.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            목표 체중에 도달하면 기프트가 자동으로 지급됩니다.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-3">
            {gifts.map((g) => (
              <div
                key={g.id}
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm"
              >
                <div className="font-semibold text-amber-700">
                  🎁 {g.giftType} — {g.rule}
                </div>
                <div className="text-xs text-neutral-500">
                  {fmtDateTime(g.issuedAt)} · {g.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold">구매 이력</h2>
        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">구매 이력이 없습니다.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-xl border border-neutral-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-neutral-400">{fmtDateTime(o.orderedAt)}</span>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium">
                    {o.status}
                  </span>
                </div>
                <ul className="mt-2 text-sm text-neutral-600">
                  {o.items.map((i) => (
                    <li key={i.productId}>
                      {i.name} x{i.qty} — {(i.price * i.qty).toLocaleString()}원
                    </li>
                  ))}
                </ul>
                <div className="mt-2 text-right font-semibold">
                  총 {o.totalPrice.toLocaleString()}원
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function MyPage() {
  return (
    <RequireAuth>
      <MyPageContent />
    </RequireAuth>
  );
}
