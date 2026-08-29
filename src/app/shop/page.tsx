"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { PRODUCTS } from "@/lib/products";
import { PlanPhase, ProductCategory } from "@/lib/types";
import Link from "next/link";

const PHASE_TABS: { value: PlanPhase | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "early", label: "1단계 · 적응기" },
  { value: "mid", label: "2단계 · 본격기" },
  { value: "late", label: "3단계 · 유지기" },
];

const CATEGORY_LABEL: Record<ProductCategory, string> = {
  diet_meal: "식단",
  supplement: "보조식품",
};

export default function ShopPage() {
  const { state, addToCart } = useStore();
  const router = useRouter();
  const [phase, setPhase] = useState<PlanPhase | "all">("all");
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [added, setAdded] = useState<string | null>(null);
  const [englishBlurbs, setEnglishBlurbs] = useState<Record<string, string>>({});
  const [loadingEnglish, setLoadingEnglish] = useState<Set<string>>(new Set());
  const [hiddenEnglish, setHiddenEnglish] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return PRODUCTS.filter(
      (p) =>
        (phase === "all" || p.suitablePhase === phase) &&
        (category === "all" || p.category === category)
    );
  }, [phase, category]);

  const cartCount = state.cart.reduce((s, c) => s + c.qty, 0);

  function handleAdd(id: string) {
    if (!state.user) {
      router.push("/login");
      return;
    }
    addToCart(id);
    setAdded(id);
    setTimeout(() => setAdded(null), 1200);
  }

  async function handleEnglish(productId: string) {
    // Already generated -- just toggle visibility instead of calling again.
    if (englishBlurbs[productId]) {
      setHiddenEnglish((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        return next;
      });
      return;
    }

    setLoadingEnglish((prev) => new Set(prev).add(productId));
    try {
      const { blurb } = await api.productEnglishBlurb(productId);
      setEnglishBlurbs((prev) => ({ ...prev, [productId]: blurb }));
    } catch {
      // Leave the screen as-is on failure -- no error message, no blurb.
    } finally {
      setLoadingEnglish((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">식단 &amp; 보조식품 쇼핑</h1>
        <Link
          href="/cart"
          className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700"
        >
          🛒 장바구니 ({cartCount})
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {PHASE_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setPhase(t.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              phase === t.value
                ? "bg-emerald-500 text-white"
                : "border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {(["all", "diet_meal", "supplement"] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-lg px-3 py-1 text-xs font-medium ${
              category === c
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {c === "all" ? "전체 카테고리" : CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="text-4xl">{p.imageEmoji}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-600">
                      {CATEGORY_LABEL[p.category]}
                    </span>
                    {p.manufacturer && (
                      <span className="text-neutral-400">{p.manufacturer}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleEnglish(p.id)}
                    disabled={loadingEnglish.has(p.id)}
                    className="shrink-0 rounded-full border border-neutral-300 px-2 py-0.5 text-xs font-medium text-neutral-500 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-60"
                  >
                    {loadingEnglish.has(p.id)
                      ? "불러오는 중..."
                      : englishBlurbs[p.id]
                      ? hiddenEnglish.has(p.id)
                        ? "English"
                        : "Hide"
                      : "English"}
                  </button>
                </div>
                <h3 className="mt-1 font-semibold">{p.name}</h3>
                <p className="mt-0.5 text-sm text-neutral-500">{p.description}</p>
                {englishBlurbs[p.id] && !hiddenEnglish.has(p.id) && (
                  <p className="mt-2 rounded-lg bg-blue-50 p-2 text-xs italic text-neutral-600">
                    {englishBlurbs[p.id]}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-neutral-50 p-3">
              <div className="flex items-baseline justify-between text-xs font-semibold text-neutral-500">
                <span>구성 · {p.servingInfo}</span>
                {p.kcal !== undefined && (
                  <span className="text-neutral-400">{p.kcal}kcal</span>
                )}
              </div>
              <ul className="mt-2 flex flex-col gap-1">
                {p.composition.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-baseline justify-between gap-2 text-sm text-neutral-700"
                  >
                    <span>
                      {item.name}
                      {item.brand && (
                        <span className="ml-1 text-xs text-neutral-400">({item.brand})</span>
                      )}
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-xs text-neutral-500">
                      {item.amount}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="font-bold">{p.price.toLocaleString()}원</span>
              <button
                onClick={() => handleAdd(p.id)}
                className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                {added === p.id ? "담김 ✓" : "장바구니 담기"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
