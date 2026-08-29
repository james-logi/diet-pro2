"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { loadTossPayments, TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Order } from "@/lib/types";
import RequireAuth from "@/components/RequireAuth";

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";

type Step = "review" | "paying" | "confirming" | "done" | "error";

const STEP_LABELS: { key: Step; label: string }[] = [
  { key: "review", label: "주문확인" },
  { key: "paying", label: "결제하기" },
  { key: "done", label: "결제완료" },
];

function stepIndex(step: Step): number {
  if (step === "review") return 0;
  if (step === "paying" || step === "confirming" || step === "error") return 1;
  return 2;
}

function StepIndicator({ step }: { step: Step }) {
  const current = stepIndex(step);
  return (
    <div className="flex items-center justify-center gap-2">
      {STEP_LABELS.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
              i < current
                ? "bg-emerald-500 text-white"
                : i === current
                ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500"
                : "bg-neutral-100 text-neutral-400"
            }`}
          >
            {i < current ? "✓" : i + 1}
          </div>
          <span
            className={`text-sm font-medium ${
              i <= current ? "text-neutral-800" : "text-neutral-400"
            }`}
          >
            {s.label}
          </span>
          {i < STEP_LABELS.length - 1 && <div className="mx-2 h-px w-8 bg-neutral-200" />}
        </div>
      ))}
    </div>
  );
}

function CheckoutContent() {
  const { state, refreshState } = useStore();
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("orderId");
  const paymentKey = searchParams.get("paymentKey");
  const amountParam = searchParams.get("amount");

  const [order, setOrder] = useState<Order | null>(null);
  const [step, setStep] = useState<Step>("review");
  const [error, setError] = useState<string | null>(null);
  const [widgetReady, setWidgetReady] = useState(false);
  const widgetsRef = useRef<TossPaymentsWidgets | null>(null);
  const confirmStarted = useRef(false);

  // Load the order and figure out which step we're on.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect --
       Deliberate: this fetches the order (based on the orderId query param)
       after mount and derives the wizard step from the response. */
    if (!orderId) {
      setError("주문 정보가 없습니다.");
      setStep("error");
      return;
    }
    (async () => {
      try {
        const { order } = await api.getOrder(orderId);
        setOrder(order);
        if (order.status === "결제완료") {
          setStep("done");
        } else if (paymentKey && amountParam) {
          setStep("confirming");
        } else {
          setStep("paying");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "주문을 불러오지 못했습니다.");
        setStep("error");
      }
    })();
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Returning from Toss with a paymentKey: confirm server-side.
  useEffect(() => {
    if (step !== "confirming" || !orderId || !paymentKey || !amountParam) return;
    if (confirmStarted.current) return;
    confirmStarted.current = true;

    (async () => {
      try {
        const { order: confirmed } = await api.confirmPayment({
          paymentKey,
          orderId,
          amount: Number(amountParam),
        });
        setOrder(confirmed);
        setStep("done");
        await refreshState();
      } catch (err) {
        setError(err instanceof Error ? err.message : "결제 승인에 실패했습니다.");
        setStep("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, orderId, paymentKey, amountParam]);

  // Render the Toss widget once we know the order needs paying.
  useEffect(() => {
    if (step !== "paying" || !order || !state.user || !TOSS_CLIENT_KEY) return;

    let cancelled = false;
    (async () => {
      try {
        const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
        const widgets = tossPayments.widgets({ customerKey: state.user!.id });
        if (cancelled) return;
        widgetsRef.current = widgets;

        await widgets.setAmount({ currency: "KRW", value: order.totalPrice });
        await Promise.all([
          widgets.renderPaymentMethods({ selector: "#payment-method", variantKey: "DEFAULT" }),
          widgets.renderAgreement({ selector: "#agreement", variantKey: "AGREEMENT" }),
        ]);
        if (!cancelled) setWidgetReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "결제 위젯을 불러오지 못했습니다.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [step, order, state.user]);

  async function handlePay() {
    if (!widgetsRef.current || !order) return;
    setError(null);
    try {
      await widgetsRef.current.requestPayment({
        orderId: order.id,
        orderName:
          order.items.length === 1
            ? order.items[0].name
            : `${order.items[0].name} 외 ${order.items.length - 1}건`,
        successUrl: `${window.location.origin}/checkout`,
        failUrl: `${window.location.origin}/checkout/fail`,
        customerName: state.user?.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "결제 요청 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8">
      <h1 className="text-xl font-bold">주문 / 결제</h1>
      <StepIndicator step={step} />

      {order && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-neutral-500">주문 내역</h2>
          <ul className="mt-3 flex flex-col gap-1">
            {order.items.map((i) => (
              <li key={i.productId} className="flex justify-between text-sm text-neutral-700">
                <span>
                  {i.name} x{i.qty}
                </span>
                <span>{(i.price * i.qty).toLocaleString()}원</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-neutral-100 pt-3 font-bold">
            <span>총 결제 금액</span>
            <span>{order.totalPrice.toLocaleString()}원</span>
          </div>
        </section>
      )}

      {step === "paying" && order && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div id="payment-method" />
          <div id="agreement" className="mt-4" />
          <button
            onClick={handlePay}
            disabled={!widgetReady}
            className="mt-6 w-full rounded-full bg-emerald-500 py-3 font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
          >
            {widgetReady
              ? `${order.totalPrice.toLocaleString()}원 결제하기`
              : "결제 위젯 불러오는 중..."}
          </button>
        </section>
      )}

      {step === "confirming" && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-neutral-500">
          결제 승인 중입니다...
        </div>
      )}

      {step === "done" && order && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="text-4xl">✅</div>
          <h2 className="mt-3 text-lg font-bold text-emerald-700">결제가 완료되었습니다</h2>
          <p className="mt-1 text-sm text-neutral-600">
            주문번호 {order.id} · {order.totalPrice.toLocaleString()}원
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
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => router.push("/cart")}
            className="mt-4 rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
          >
            장바구니로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="py-20 text-center text-neutral-400">불러오는 중...</div>}>
        <CheckoutContent />
      </Suspense>
    </RequireAuth>
  );
}
