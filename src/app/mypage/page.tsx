"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { OrderStatus } from "@/lib/types";
import RequireAuth from "@/components/RequireAuth";

const STATUS_BADGE: Record<OrderStatus, string> = {
  결제대기: "bg-amber-50 text-amber-700",
  결제완료: "bg-emerald-50 text-emerald-700",
  배송중: "bg-blue-50 text-blue-700",
  완료: "bg-neutral-100 text-neutral-600",
  취소: "bg-red-50 text-red-600",
};

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
  const { state, currentWeight, cancelOrder } = useStore();
  const { user, goal, orders, gifts } = state;

  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel(orderId: string) {
    setError(null);
    setBusyId(orderId);
    try {
      await cancelOrder(orderId, reason || undefined);
      setCancelingId(null);
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "취소 처리 중 오류가 발생했습니다.");
    } finally {
      setBusyId(null);
    }
  }

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
                  <Link
                    href={`/checkout?orderId=${encodeURIComponent(o.id)}`}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium hover:opacity-80 ${STATUS_BADGE[o.status]}`}
                  >
                    {o.status}
                  </Link>
                </div>
                <ul className="mt-2 text-sm text-neutral-600">
                  {o.items.map((i) => (
                    <li key={i.productId}>
                      {i.name} x{i.qty} — {(i.price * i.qty).toLocaleString()}원
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex items-center justify-between">
                  {o.status === "결제대기" ? (
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/checkout?orderId=${encodeURIComponent(o.id)}`}
                        className="text-xs font-semibold text-emerald-600 underline"
                      >
                        결제 이어하기
                      </Link>
                      <button
                        onClick={() => {
                          setCancelingId(o.id);
                          setReason("");
                          setError(null);
                        }}
                        className="text-xs font-semibold text-neutral-400 underline hover:text-red-500"
                      >
                        주문 취소
                      </button>
                    </div>
                  ) : o.status === "결제완료" ? (
                    <button
                      onClick={() => {
                        setCancelingId(o.id);
                        setReason("");
                        setError(null);
                      }}
                      className="text-xs font-semibold text-red-500 underline"
                    >
                      결제 취소
                    </button>
                  ) : (
                    <span />
                  )}
                  <div className="text-right font-semibold">
                    총 {o.totalPrice.toLocaleString()}원
                  </div>
                </div>

                {cancelingId === o.id && (
                  <div className="mt-3 rounded-lg bg-red-50 p-3">
                    <label className="flex flex-col gap-1 text-xs text-neutral-500">
                      취소 사유 (선택)
                      <input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="예: 단순 변심"
                        className="rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                      />
                    </label>
                    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleCancel(o.id)}
                        disabled={busyId === o.id}
                        className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                      >
                        {busyId === o.id ? "취소 처리 중..." : "취소 확정"}
                      </button>
                      <button
                        onClick={() => setCancelingId(null)}
                        className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
                      >
                        닫기
                      </button>
                    </div>
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

export default function MyPage() {
  return (
    <RequireAuth>
      <MyPageContent />
    </RequireAuth>
  );
}
