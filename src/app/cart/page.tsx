"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { productById } from "@/lib/products";
import Link from "next/link";
import { Order } from "@/lib/types";

export default function CartPage() {
  const { state, updateCartQty, removeFromCart, checkout } = useStore();
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const rows = useMemo(
    () =>
      state.cart
        .map((c) => {
          const p = productById(c.productId);
          if (!p) return null;
          return { ...c, product: p };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null),
    [state.cart]
  );

  const total = rows.reduce((sum, r) => sum + r.product.price * r.qty, 0);

  function handleCheckout() {
    const order = checkout();
    if (order) setCompletedOrder(order);
  }

  if (completedOrder) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="text-4xl">✅</div>
        <h1 className="mt-3 text-lg font-bold text-emerald-700">주문이 완료되었습니다</h1>
        <p className="mt-1 text-sm text-neutral-600">
          주문번호 {completedOrder.id} · {completedOrder.totalPrice.toLocaleString()}원
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/mypage"
            className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white"
          >
            구매 이력 보기
          </Link>
          <Link
            href="/shop"
            className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold text-neutral-700"
          >
            계속 쇼핑하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">장바구니</h1>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-12 text-center text-neutral-500">
          장바구니가 비어있습니다.
          <div className="mt-4">
            <Link href="/shop" className="text-emerald-600 underline">
              상품 보러가기
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div
              key={r.productId}
              className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4"
            >
              <div className="text-3xl">{r.product.imageEmoji}</div>
              <div className="flex-1">
                <div className="font-medium">{r.product.name}</div>
                <div className="text-sm text-neutral-500">
                  {r.product.price.toLocaleString()}원
                </div>
              </div>
              <input
                type="number"
                min={1}
                value={r.qty}
                onChange={(e) => updateCartQty(r.productId, Number(e.target.value))}
                className="w-16 rounded-lg border border-neutral-300 px-2 py-1 text-center"
              />
              <div className="w-24 text-right font-semibold">
                {(r.product.price * r.qty).toLocaleString()}원
              </div>
              <button
                onClick={() => removeFromCart(r.productId)}
                className="text-neutral-400 hover:text-red-500"
              >
                삭제
              </button>
            </div>
          ))}

          <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-50 p-5">
            <span className="text-lg font-bold">총 {total.toLocaleString()}원</span>
            <button
              onClick={handleCheckout}
              className="rounded-full bg-emerald-500 px-6 py-3 font-semibold text-white hover:bg-emerald-600"
            >
              결제하기 (데모)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
