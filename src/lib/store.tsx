"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { api, AppStatePayload, PublicUser } from "./api";
import { CartItem, DietGoal, Gender, Gift, Order, PlanSnapshot, WeightEntry } from "./types";

const CART_STORAGE_KEY = "diet-pro2-cart-v1";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

interface StoreState {
  authLoading: boolean;
  user: PublicUser | null;
  weightHistory: WeightEntry[];
  goal: DietGoal | null;
  snapshots: PlanSnapshot[];
  orders: Order[];
  gifts: Gift[];
  cart: CartItem[];
}

interface StoreApi {
  state: StoreState;
  currentWeight: number;
  signup: (input: {
    name: string;
    username: string;
    password: string;
    gender: Gender;
    heightCm: number;
  }) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshState: () => Promise<void>;
  updateProfile: (input: { name?: string; gender?: Gender; heightCm?: number }) => Promise<void>;
  setGoal: (
    startWeightKg: number,
    targetWeightKg: number,
    durationMonths: number
  ) => Promise<void>;
  updateWeight: (weightKg: number) => Promise<{ giftIssued: boolean }>;
  saveSnapshot: (note?: string) => Promise<void>;
  addToCart: (productId: string, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  checkout: () => Promise<string | null>;
}

const EMPTY_STATE: StoreState = {
  authLoading: true,
  user: null,
  weightHistory: [],
  goal: null,
  snapshots: [],
  orders: [],
  gifts: [],
  cart: [],
};

const StoreContext = createContext<StoreApi | null>(null);

function applyAppState(s: StoreState, payload: AppStatePayload): StoreState {
  return {
    ...s,
    user: payload.profile,
    weightHistory: payload.weightHistory,
    goal: payload.goal,
    snapshots: payload.snapshots,
    orders: payload.orders,
    gifts: payload.gifts,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(EMPTY_STATE);

  useEffect(() => {
    // Deliberate: cart/auth are hydrated from localStorage/cookies only after
    // mount, so the first client render matches the empty server-rendered
    // HTML and avoids a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => ({ ...s, cart: loadCart() }));
    (async () => {
      const { user } = await api.me();
      if (!user) {
        setState((s) => ({ ...s, authLoading: false, user: null }));
        return;
      }
      const appState = await api.state();
      setState((s) => ({ ...applyAppState(s, appState), authLoading: false }));
    })();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
  }, [state.cart]);

  const currentWeight = useMemo(() => {
    if (state.weightHistory.length === 0) return state.goal?.startWeightKg ?? 0;
    return state.weightHistory[state.weightHistory.length - 1].weightKg;
  }, [state.weightHistory, state.goal]);

  const refreshState = async () => {
    const appState = await api.state();
    setState((s) => applyAppState(s, appState));
  };

  const apiObj: StoreApi = {
    state,
    currentWeight,

    signup: async (input) => {
      const { user } = await api.signup(input);
      setState((s) => ({ ...s, user, authLoading: false }));
    },

    login: async (username, password) => {
      const { user } = await api.login(username, password);
      setState((s) => ({ ...s, user, authLoading: false }));
      await refreshState();
    },

    logout: async () => {
      await api.logout();
      setState((s) => ({ ...EMPTY_STATE, authLoading: false, cart: s.cart }));
    },

    refreshState,

    updateProfile: async (input) => {
      const { profile } = await api.updateProfile(input);
      setState((s) => ({ ...s, user: profile }));
    },

    setGoal: async (startWeightKg, targetWeightKg, durationMonths) => {
      const { goal, weightHistory } = await api.createGoal({
        startWeightKg,
        targetWeightKg,
        durationMonths,
      });
      setState((s) => ({ ...s, goal, weightHistory }));
    },

    updateWeight: async (weightKg) => {
      const { weightHistory, goal, giftIssued, gifts } = await api.updateWeight(weightKg);
      setState((s) => ({ ...s, weightHistory, goal, gifts }));
      return { giftIssued };
    },

    saveSnapshot: async (note) => {
      const { snapshots } = await api.saveSnapshot(note);
      setState((s) => ({ ...s, snapshots }));
    },

    addToCart: (productId, qty = 1) => {
      setState((s) => {
        const existing = s.cart.find((c) => c.productId === productId);
        const cart = existing
          ? s.cart.map((c) =>
              c.productId === productId ? { ...c, qty: c.qty + qty } : c
            )
          : [...s.cart, { productId, qty }];
        return { ...s, cart };
      });
    },

    removeFromCart: (productId) => {
      setState((s) => ({ ...s, cart: s.cart.filter((c) => c.productId !== productId) }));
    },

    updateCartQty: (productId, qty) => {
      setState((s) => ({
        ...s,
        cart: s.cart
          .map((c) => (c.productId === productId ? { ...c, qty } : c))
          .filter((c) => c.qty > 0),
      }));
    },

    checkout: async () => {
      if (state.cart.length === 0) return null;
      const { orders, orderId } = await api.checkout(state.cart);
      setState((s) => ({ ...s, orders, cart: [] }));
      return orderId;
    },
  };

  return <StoreContext.Provider value={apiObj}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
