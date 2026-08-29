import { DietGoal, Gender, Gift, Order, PlanSnapshot, WeightEntry } from "./types";

export interface PublicUser {
  id: string;
  name: string;
  username: string;
  gender: Gender;
  heightCm: number;
  isAdmin: boolean;
}

export interface AdminOrder extends Order {
  userId: string;
  userName: string;
  username: string;
}

export interface AppStatePayload {
  profile: PublicUser;
  weightHistory: WeightEntry[];
  goal: DietGoal | null;
  snapshots: PlanSnapshot[];
  orders: Order[];
  gifts: Gift[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data?.error ?? "요청 처리 중 오류가 발생했습니다.");
  }
  return data;
}

export const api = {
  me: () => request<{ user: PublicUser | null }>("/api/auth/me"),

  signup: (input: {
    name: string;
    username: string;
    password: string;
    gender: Gender;
    heightCm: number;
  }) =>
    request<{ user: PublicUser }>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  login: (username: string, password: string) =>
    request<{ user: PublicUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),

  state: () => request<AppStatePayload>("/api/state"),

  updateProfile: (input: { name?: string; gender?: Gender; heightCm?: number }) =>
    request<{ profile: PublicUser }>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(input),
    }),

  createGoal: (input: {
    startWeightKg: number;
    targetWeightKg: number;
    durationMonths: number;
  }) =>
    request<{ goal: DietGoal; weightHistory: WeightEntry[] }>("/api/goal", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateWeight: (weightKg: number, date?: string) =>
    request<{
      weightHistory: WeightEntry[];
      goal: DietGoal | null;
      giftIssued: boolean;
      gifts: Gift[];
    }>("/api/weight", {
      method: "POST",
      body: JSON.stringify({ weightKg, date }),
    }),

  saveSnapshot: (note?: string) =>
    request<{ snapshots: PlanSnapshot[] }>("/api/snapshot", {
      method: "POST",
      body: JSON.stringify({ note }),
    }),

  createOrder: (items: { productId: string; qty: number }[]) =>
    request<{ orderId: string; totalPrice: number; orderName: string }>("/api/orders", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),

  getOrder: (orderId: string) =>
    request<{ order: Order }>(`/api/orders/${encodeURIComponent(orderId)}`),

  confirmPayment: (input: { paymentKey: string; orderId: string; amount: number }) =>
    request<{ order: Order }>("/api/payments/confirm", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  cancelOrder: (orderId: string, cancelReason?: string) =>
    request<{ order: Order }>(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
      method: "POST",
      body: JSON.stringify({ cancelReason }),
    }),

  productEnglishBlurb: (productId: string) =>
    request<{ blurb: string }>("/api/ai/product-blurb", {
      method: "POST",
      body: JSON.stringify({ productId }),
    }),

  adminOrders: () => request<{ orders: AdminOrder[] }>("/api/admin/orders"),
};
