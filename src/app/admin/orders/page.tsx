"use client";

import { useEffect, useMemo, useState } from "react";
import { api, AdminOrder } from "@/lib/api";
import RequireAdmin from "@/components/RequireAdmin";
import { OrderStatus } from "@/lib/types";

const STATUS_BADGE: Record<OrderStatus, string> = {
  결제대기: "bg-amber-50 text-amber-700",
  결제완료: "bg-emerald-50 text-emerald-700",
  배송중: "bg-blue-50 text-blue-700",
  완료: "bg-neutral-100 text-neutral-600",
  취소: "bg-red-50 text-red-500",
};

const PAID_STATUSES: OrderStatus[] = ["결제완료", "배송중", "완료"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

function AdminOrdersContent() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .adminOrders()
      .then((res) => setOrders(res.orders))
      .catch((err) => setError(err instanceof Error ? err.message : "불러오기 실패"));
  }, []);

  const paidOrders = useMemo(
    () => (orders ?? []).filter((o) => PAID_STATUSES.includes(o.status)),
    [orders]
  );

  const dailyRevenue = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of paidOrders) {
      const day = o.orderedAt.slice(0, 10);
      map.set(day, (map.get(day) ?? 0) + o.totalPrice);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [paidOrders]);

  const totalRevenue = useMemo(
    () => paidOrders.reduce((sum, o) => sum + o.totalPrice, 0),
    [paidOrders]
  );

  const purchaseRows = useMemo(() => {
    const rows: {
      key: string;
      userName: string;
      username: string;
      productName: string;
      qty: number;
      amount: number;
    }[] = [];
    const byKey = new Map<string, (typeof rows)[number]>();
    for (const o of paidOrders) {
      for (const item of o.items) {
        const key = `${o.userId}::${item.productId}`;
        const existing = byKey.get(key);
        if (existing) {
          existing.qty += item.qty;
          existing.amount += item.price * item.qty;
        } else {
          const row = {
            key,
            userName: o.userName,
            username: o.username,
            productName: item.name,
            qty: item.qty,
            amount: item.price * item.qty,
          };
          byKey.set(key, row);
          rows.push(row);
        }
      }
    }
    return rows.sort((a, b) => b.amount - a.amount);
  }, [paidOrders]);

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (!orders) {
    return <div className="py-20 text-center text-neutral-400">불러오는 중...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-bold">관리자 · 주문 내역</h1>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">일자별 매출</h2>
          <span className="text-sm text-neutral-500">
            총 매출 <span className="font-semibold text-emerald-600">{fmtWon(totalRevenue)}</span>
          </span>
        </div>
        {dailyRevenue.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">결제 완료된 주문이 없습니다.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[320px] text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="py-2 font-medium">날짜</th>
                  <th className="py-2 font-medium">매출</th>
                </tr>
              </thead>
              <tbody>
                {dailyRevenue.map(([day, amount]) => (
                  <tr key={day} className="border-b border-neutral-100">
                    <td className="py-2">{day}</td>
                    <td className="py-2 font-semibold">{fmtWon(amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold">사용자별 · 상품별 구매 내역</h2>
        {purchaseRows.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">결제 완료된 주문이 없습니다.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="py-2 font-medium">구매자</th>
                  <th className="py-2 font-medium">상품</th>
                  <th className="py-2 font-medium">수량</th>
                  <th className="py-2 font-medium">금액</th>
                </tr>
              </thead>
              <tbody>
                {purchaseRows.map((r) => (
                  <tr key={r.key} className="border-b border-neutral-100">
                    <td className="py-2">
                      {r.userName}{" "}
                      <span className="text-xs text-neutral-400">({r.username})</span>
                    </td>
                    <td className="py-2">{r.productName}</td>
                    <td className="py-2">{r.qty}개</td>
                    <td className="py-2 font-semibold">{fmtWon(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold">전체 주문 목록</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">주문이 없습니다.</p>
        ) : (
          <div className="mt-4 flex flex-col divide-y divide-neutral-100">
            {orders.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                <span className="w-40 shrink-0 text-neutral-500">{fmtDate(o.orderedAt)}</span>
                <span className="w-28 shrink-0 font-medium">
                  {o.userName} <span className="text-xs text-neutral-400">({o.username})</span>
                </span>
                <span className="flex-1 min-w-[160px] text-neutral-600">
                  {o.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
                </span>
                <span className="font-semibold">{fmtWon(o.totalPrice)}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[o.status]}`}
                >
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <RequireAdmin>
      <AdminOrdersContent />
    </RequireAdmin>
  );
}
