export type Gender = "M" | "F";

export interface Profile {
  name: string;
  gender: Gender;
  heightCm: number;
}

export interface WeightEntry {
  id: string;
  weightKg: number;
  measuredAt: string; // ISO datetime
  date: string; // YYYY-MM-DD, unique per user (one entry per day)
}

export type GoalStatus = "in_progress" | "achieved" | "abandoned";

export interface DietGoal {
  id: string;
  startWeightKg: number;
  targetWeightKg: number;
  durationMonths: number;
  startDate: string; // ISO date
  targetDate: string; // ISO date
  status: GoalStatus;
}

export type ProductCategory = "diet_meal" | "supplement";
export type PlanPhase = "early" | "mid" | "late";

export interface CompositionItem {
  name: string;
  brand?: string;
  amount: string;
}

export interface Product {
  id: string;
  category: ProductCategory;
  manufacturer?: string;
  name: string;
  description: string;
  price: number;
  imageEmoji: string;
  suitablePhase: PlanPhase;
  servingInfo: string; // e.g. "1회 제공량 기준" or "1끼 구성"
  kcal?: number;
  composition: CompositionItem[];
}

export interface CartItem {
  productId: string;
  qty: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

export type OrderStatus = "결제완료" | "배송중" | "완료" | "취소";

export interface Order {
  id: string;
  goalId: string | null;
  items: OrderItem[];
  totalPrice: number;
  orderedAt: string; // ISO datetime
  status: OrderStatus;
}

export type GiftType = "쿠폰" | "사은품" | "포인트";
export type GiftStatus = "지급대기" | "지급완료" | "사용완료";

export interface Gift {
  id: string;
  goalId: string;
  rule: string;
  giftType: GiftType;
  issuedAt: string;
  status: GiftStatus;
}

export interface PlanSnapshot {
  id: string;
  savedAt: string; // ISO datetime
  heightCm: number;
  weightKg: number;
  goal: DietGoal;
  bmi: number;
  note?: string;
}

export interface AppState {
  profile: Profile | null;
  weightHistory: WeightEntry[];
  goal: DietGoal | null;
  snapshots: PlanSnapshot[];
  cart: CartItem[];
  orders: Order[];
  gifts: Gift[];
}
