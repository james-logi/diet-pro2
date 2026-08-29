"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import RequireAuth from "@/components/RequireAuth";

function FailContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message") ?? "결제가 취소되었거나 실패했습니다.";
  const code = searchParams.get("code");
  const orderId = searchParams.get("orderId");

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <div className="text-4xl">❌</div>
      <h1 className="mt-3 text-lg font-bold text-red-700">결제에 실패했습니다</h1>
      <p className="mt-2 text-sm text-neutral-600">{message}</p>
      {code && <p className="mt-1 text-xs text-neutral-400">오류 코드: {code}</p>}
      <div className="mt-6 flex justify-center gap-3">
        {orderId && (
          <Link
            href={`/checkout?orderId=${encodeURIComponent(orderId)}`}
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            다시 결제하기
          </Link>
        )}
        <Link
          href="/cart"
          className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          장바구니로
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutFailPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="py-20 text-center text-neutral-400">불러오는 중...</div>}>
        <FailContent />
      </Suspense>
    </RequireAuth>
  );
}
