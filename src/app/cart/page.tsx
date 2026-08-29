"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { productById } from "@/lib/products";
import RequireAuth from "@/components/RequireAuth";
import Link from "next/link";

function CartContent() {
  const { state, updateCartQty, removeFromCart, createOrder } = useStore();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  async function handleOrder() {
    setError(null);
    setBusy(true);
    try {
      const result = await createOrder();
      if (result) router.push(`/checkout?orderId=${encodeURIComponent(result.orderId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "주문 생성 중 오류가 발생했습니다.");
      setBusy(false);
    }
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

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-50 p-5">
            <span className="text-lg font-bold">총 {total.toLocaleString()}원</span>
            <button
              onClick={handleOrder}
              disabled={busy}
              className="rounded-full bg-emerald-500 px-6 py-3 font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
            >
              {busy ? "처리 중..." : "주문하기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CartPage() {
  return (
    <RequireAuth>
      <CartContent />
    </RequireAuth>
  );
}
