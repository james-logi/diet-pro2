import {
  DietGoal,
  Gift,
  Order,
  OrderItem,
  PlanSnapshot,
  WeightEntry,
} from "../lib/types";

export interface UserRow {
  id: string;
  name: string;
  username: string;
  password_hash: string;
  gender: "M" | "F";
  height_cm: number;
  created_at: string;
}

export interface PublicUser {
  id: string;
  name: string;
  username: string;
  gender: "M" | "F";
  heightCm: number;
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    gender: row.gender,
    heightCm: row.height_cm,
  };
}

export async function getUserByUsername(db: D1Database, username: string) {
  return db
    .prepare("SELECT * FROM users WHERE username = ?")
    .bind(username)
    .first<UserRow>();
}

export async function getUserById(db: D1Database, id: string) {
  return db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<UserRow>();
}

export async function getWeightHistory(db: D1Database, userId: string): Promise<WeightEntry[]> {
  const { results } = await db
    .prepare(
      "SELECT id, weight_kg as weightKg, measured_at as measuredAt FROM weight_entries WHERE user_id = ? ORDER BY measured_at ASC"
    )
    .bind(userId)
    .all<WeightEntry>();
  return results ?? [];
}

export async function getLatestGoal(db: D1Database, userId: string): Promise<DietGoal | null> {
  const row = await db
    .prepare(
      `SELECT id, start_weight_kg as startWeightKg, target_weight_kg as targetWeightKg,
              duration_months as durationMonths, start_date as startDate,
              target_date as targetDate, status
       FROM diet_goals WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`
    )
    .bind(userId)
    .first<DietGoal>();
  return row ?? null;
}

export async function getSnapshots(db: D1Database, userId: string): Promise<PlanSnapshot[]> {
  const { results } = await db
    .prepare(
      `SELECT s.id, s.height_cm as heightCm, s.weight_kg as weightKg, s.bmi, s.note,
              s.saved_at as savedAt, s.goal_id as goalId,
              s.target_weight_kg as targetWeightKg, s.duration_months as durationMonths,
              s.goal_status as goalStatus
       FROM plan_snapshots s WHERE s.user_id = ? ORDER BY s.saved_at ASC`
    )
    .bind(userId)
    .all<{
      id: string;
      heightCm: number;
      weightKg: number;
      bmi: number;
      note: string | null;
      savedAt: string;
      goalId: string;
      targetWeightKg: number;
      durationMonths: number;
      goalStatus: string;
    }>();
  return (results ?? []).map((r) => ({
    id: r.id,
    savedAt: r.savedAt,
    heightCm: r.heightCm,
    weightKg: r.weightKg,
    bmi: r.bmi,
    note: r.note ?? undefined,
    goal: {
      id: r.goalId,
      startWeightKg: r.weightKg,
      targetWeightKg: r.targetWeightKg,
      durationMonths: r.durationMonths,
      startDate: r.savedAt,
      targetDate: r.savedAt,
      status: r.goalStatus as DietGoal["status"],
    },
  }));
}

export async function getOrders(db: D1Database, userId: string): Promise<Order[]> {
  const { results: orderRows } = await db
    .prepare(
      `SELECT id, goal_id as goalId, total_price as totalPrice, ordered_at as orderedAt, status
       FROM orders WHERE user_id = ? ORDER BY ordered_at DESC`
    )
    .bind(userId)
    .all<{
      id: string;
      goalId: string | null;
      totalPrice: number;
      orderedAt: string;
      status: Order["status"];
    }>();

  const orders: Order[] = [];
  for (const o of orderRows ?? []) {
    const { results: items } = await db
      .prepare(
        `SELECT product_id as productId, name, price, qty FROM order_items WHERE order_id = ?`
      )
      .bind(o.id)
      .all<OrderItem>();
    orders.push({ ...o, items: items ?? [] });
  }
  return orders;
}

export async function getGifts(db: D1Database, userId: string): Promise<Gift[]> {
  const { results } = await db
    .prepare(
      `SELECT id, goal_id as goalId, rule, gift_type as giftType, issued_at as issuedAt, status
       FROM gifts WHERE user_id = ? ORDER BY issued_at DESC`
    )
    .bind(userId)
    .all<Gift>();
  return results ?? [];
}
