"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import {
  AppState,
  CartItem,
  DietGoal,
  Gender,
  Gift,
  Order,
  OrderItem,
  PlanSnapshot,
  WeightEntry,
} from "./types";
import { productById } from "./products";

const STORAGE_KEY = "diet-pro2-state-v1";

const EMPTY_STATE: AppState = {
  profile: null,
  weightHistory: [],
  goal: null,
  snapshots: [],
  cart: [],
  orders: [],
  gifts: [],
};

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function loadState(): AppState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    return { ...EMPTY_STATE, ...JSON.parse(raw) };
  } catch {
    return EMPTY_STATE;
  }
}

interface StoreApi {
  state: AppState;
  currentWeight: number;
  setProfile: (name: string, gender: Gender, heightCm: number) => void;
  setGoal: (
    startWeightKg: number,
    targetWeightKg: number,
    durationMonths: number
  ) => void;
  updateWeight: (weightKg: number) => void;
  saveSnapshot: (note?: string) => void;
  addToCart: (productId: string, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  checkout: () => Order | null;
  resetAll: () => void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Deliberate: hydrate from localStorage only after mount, so the first
    // client render matches the server-rendered (empty) HTML and avoids a
    // hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const currentWeight = useMemo(() => {
    if (state.weightHistory.length === 0) return state.goal?.startWeightKg ?? 0;
    return state.weightHistory[state.weightHistory.length - 1].weightKg;
  }, [state.weightHistory, state.goal]);

  const api: StoreApi = {
    state,
    currentWeight,

    setProfile: (name, gender, heightCm) => {
      setState((s) => ({ ...s, profile: { name, gender, heightCm } }));
    },

    setGoal: (startWeightKg, targetWeightKg, durationMonths) => {
      const startDate = new Date();
      const targetDate = new Date(startDate);
      targetDate.setMonth(targetDate.getMonth() + durationMonths);
      const goal: DietGoal = {
        id: uid(),
        startWeightKg,
        targetWeightKg,
        durationMonths,
        startDate: startDate.toISOString(),
        targetDate: targetDate.toISOString(),
        status: "in_progress",
      };
      const entry: WeightEntry = {
        id: uid(),
        weightKg: startWeightKg,
        measuredAt: startDate.toISOString(),
      };
      setState((s) => ({
        ...s,
        goal,
        weightHistory: [entry],
      }));
    },

    updateWeight: (weightKg) => {
      setState((s) => {
        const entry: WeightEntry = {
          id: uid(),
          weightKg,
          measuredAt: new Date().toISOString(),
        };
        let goal = s.goal;
        let gifts = s.gifts;
        if (goal && goal.status === "in_progress") {
          const achieved =
            goal.targetWeightKg <= goal.startWeightKg
              ? weightKg <= goal.targetWeightKg
              : weightKg >= goal.targetWeightKg;
          if (achieved) {
            goal = { ...goal, status: "achieved" };
            const gift: Gift = {
              id: uid(),
              goalId: goal.id,
              rule: "목표 체중 도달",
              giftType: "쿠폰",
              issuedAt: new Date().toISOString(),
              status: "지급완료",
            };
            gifts = [...s.gifts, gift];
          }
        }
        return {
          ...s,
          weightHistory: [...s.weightHistory, entry],
          goal,
          gifts,
        };
      });
    },

    saveSnapshot: (note) => {
      setState((s) => {
        if (!s.profile || !s.goal) return s;
        const weight =
          s.weightHistory.length > 0
            ? s.weightHistory[s.weightHistory.length - 1].weightKg
            : s.goal.startWeightKg;
        const heightM = s.profile.heightCm / 100;
        const bmi = heightM > 0 ? weight / (heightM * heightM) : 0;
        const snapshot: PlanSnapshot = {
          id: uid(),
          savedAt: new Date().toISOString(),
          heightCm: s.profile.heightCm,
          weightKg: weight,
          goal: s.goal,
          bmi,
          note,
        };
        return { ...s, snapshots: [...s.snapshots, snapshot] };
      });
    },

    addToCart: (productId, qty = 1) => {
      setState((s) => {
        const existing = s.cart.find((c) => c.productId === productId);
        let cart: CartItem[];
        if (existing) {
          cart = s.cart.map((c) =>
            c.productId === productId ? { ...c, qty: c.qty + qty } : c
          );
        } else {
          cart = [...s.cart, { productId, qty }];
        }
        return { ...s, cart };
      });
    },

    removeFromCart: (productId) => {
      setState((s) => ({
        ...s,
        cart: s.cart.filter((c) => c.productId !== productId),
      }));
    },

    updateCartQty: (productId, qty) => {
      setState((s) => ({
        ...s,
        cart: s.cart
          .map((c) => (c.productId === productId ? { ...c, qty } : c))
          .filter((c) => c.qty > 0),
      }));
    },

    clearCart: () => setState((s) => ({ ...s, cart: [] })),

    checkout: () => {
      let created: Order | null = null;
      setState((s) => {
        if (s.cart.length === 0) return s;
        const items: OrderItem[] = s.cart
          .map((c) => {
            const p = productById(c.productId);
            if (!p) return null;
            return { productId: p.id, name: p.name, price: p.price, qty: c.qty };
          })
          .filter((x): x is OrderItem => x !== null);
        const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
        const order: Order = {
          id: uid(),
          goalId: s.goal?.id ?? null,
          items,
          totalPrice: total,
          orderedAt: new Date().toISOString(),
          status: "결제완료",
        };
        created = order;
        return { ...s, cart: [], orders: [...s.orders, order] };
      });
      return created;
    },

    resetAll: () => setState(EMPTY_STATE),
  };

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
