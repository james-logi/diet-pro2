import { Context, Hono, MiddlewareHandler } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { signSession, verifySession } from "./crypto";
import { hashPassword, verifyPassword } from "./password";
import {
  getUserByUsername,
  getUserById,
  getWeightHistory,
  getLatestGoal,
  getSnapshots,
  getOrders,
  getOrderByIdForUser,
  getGifts,
  toPublicUser,
  UserRow,
} from "./db";
import { productById } from "../lib/products";
import { DietGoal } from "../lib/types";

interface Bindings {
  DB: D1Database;
  SESSION_SECRET: string;
  TOSS_WIDGET_SECRET_KEY: string;
  AI: Ai;
}

interface Variables {
  userId: string;
}

type AppEnv = { Bindings: Bindings; Variables: Variables };

const app = new Hono<AppEnv>();

const COOKIE_NAME = "session";

const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) return c.json({ error: "로그인이 필요합니다." }, 401);
  const userId = await verifySession(token, c.env.SESSION_SECRET);
  if (!userId) return c.json({ error: "세션이 만료되었습니다." }, 401);
  c.set("userId", userId);
  await next();
};

app.use("/api/state", requireAuth);
app.use("/api/profile", requireAuth);
app.use("/api/goal", requireAuth);
app.use("/api/weight", requireAuth);
app.use("/api/snapshot", requireAuth);
app.use("/api/snapshots", requireAuth);
app.use("/api/orders", requireAuth);
app.use("/api/orders/:id", requireAuth);
app.use("/api/orders/:id/cancel", requireAuth);
app.use("/api/payments/confirm", requireAuth);
app.use("/api/gifts", requireAuth);

async function setSessionCookie(c: Context<AppEnv>, userId: string) {
  const token = await signSession(userId, c.env.SESSION_SECRET);
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

// ---------- Auth ----------

app.post("/api/auth/signup", async (c) => {
  const body = await c.req.json<{
    name?: string;
    username?: string;
    password?: string;
    gender?: "M" | "F";
    heightCm?: number;
  }>();
  const { name, username, password } = body;
  const gender = body.gender === "M" ? "M" : "F";
  const heightCm = Number(body.heightCm) || 0;

  if (!name?.trim() || !username?.trim() || !password || password.length < 4) {
    return c.json({ error: "이름, 아이디, 4자 이상 비밀번호를 입력해주세요." }, 400);
  }

  const existing = await getUserByUsername(c.env.DB, username.trim());
  if (existing) return c.json({ error: "이미 사용 중인 아이디입니다." }, 409);

  const id = crypto.randomUUID();
  const hash = hashPassword(password);

  await c.env.DB.prepare(
    `INSERT INTO users (id, name, username, password_hash, gender, height_cm, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, name.trim(), username.trim(), hash, gender, heightCm, new Date().toISOString())
    .run();

  await setSessionCookie(c, id);
  const user = await getUserById(c.env.DB, id);
  return c.json({ user: toPublicUser(user as UserRow) });
});

app.post("/api/auth/login", async (c) => {
  const { username, password } = await c.req.json<{ username?: string; password?: string }>();
  if (!username || !password) return c.json({ error: "아이디와 비밀번호를 입력해주세요." }, 400);

  const user = await getUserByUsername(c.env.DB, username.trim());
  if (!user) return c.json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, 401);

  const ok = verifyPassword(password, user.password_hash);
  if (!ok) return c.json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, 401);

  await setSessionCookie(c, user.id);
  return c.json({ user: toPublicUser(user) });
});

app.post("/api/auth/logout", async (c) => {
  deleteCookie(c, COOKIE_NAME, { path: "/" });
  return c.json({ ok: true });
});

app.get("/api/auth/me", async (c) => {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) return c.json({ user: null });
  const userId = await verifySession(token, c.env.SESSION_SECRET);
  if (!userId) return c.json({ user: null });
  const user = await getUserById(c.env.DB, userId);
  if (!user) return c.json({ user: null });
  return c.json({ user: toPublicUser(user) });
});

// ---------- App state ----------

app.get("/api/state", async (c) => {
  const userId = c.get("userId");
  const [user, weightHistory, goal, snapshots, orders, gifts] = await Promise.all([
    getUserById(c.env.DB, userId),
    getWeightHistory(c.env.DB, userId),
    getLatestGoal(c.env.DB, userId),
    getSnapshots(c.env.DB, userId),
    getOrders(c.env.DB, userId),
    getGifts(c.env.DB, userId),
  ]);
  if (!user) return c.json({ error: "사용자를 찾을 수 없습니다." }, 404);
  return c.json({
    profile: toPublicUser(user),
    weightHistory,
    goal,
    snapshots,
    orders,
    gifts,
  });
});

app.put("/api/profile", async (c) => {
  const userId = c.get("userId");
  const { name, gender, heightCm } = await c.req.json<{
    name?: string;
    gender?: "M" | "F";
    heightCm?: number;
  }>();
  await c.env.DB.prepare(
    `UPDATE users SET name = COALESCE(?, name), gender = COALESCE(?, gender), height_cm = COALESCE(?, height_cm) WHERE id = ?`
  )
    .bind(name ?? null, gender ?? null, heightCm ?? null, userId)
    .run();
  const user = await getUserById(c.env.DB, userId);
  return c.json({ profile: toPublicUser(user as UserRow) });
});

// ---------- Goal / weight / snapshot ----------

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function isValidDateStr(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// One weight_entries row per (user, date): re-logging a date overwrites it
// instead of piling up duplicate rows, so a day's entry is always editable.
function upsertWeightEntryStmt(db: D1Database, userId: string, weightKg: number, date: string) {
  const measuredAt = `${date}T12:00:00.000Z`;
  return db
    .prepare(
      `INSERT INTO weight_entries (id, user_id, weight_kg, measured_at, date)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, date) DO UPDATE SET weight_kg = excluded.weight_kg, measured_at = excluded.measured_at`
    )
    .bind(crypto.randomUUID(), userId, weightKg, measuredAt, date);
}

app.post("/api/goal", async (c) => {
  const userId = c.get("userId");
  const { startWeightKg, targetWeightKg, durationMonths } = await c.req.json<{
    startWeightKg?: number;
    targetWeightKg?: number;
    durationMonths?: number;
  }>();
  if (!startWeightKg || !targetWeightKg || !durationMonths) {
    return c.json({ error: "체중과 기간을 모두 입력해주세요." }, 400);
  }

  const id = crypto.randomUUID();
  const startDate = new Date();
  const targetDate = new Date(startDate);
  targetDate.setMonth(targetDate.getMonth() + durationMonths);

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO diet_goals (id, user_id, start_weight_kg, target_weight_kg, duration_months, start_date, target_date, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'in_progress', ?)`
    ).bind(
      id,
      userId,
      startWeightKg,
      targetWeightKg,
      durationMonths,
      startDate.toISOString(),
      targetDate.toISOString(),
      startDate.toISOString()
    ),
    upsertWeightEntryStmt(c.env.DB, userId, startWeightKg, todayStr()),
  ]);

  const goal = await getLatestGoal(c.env.DB, userId);
  const weightHistory = await getWeightHistory(c.env.DB, userId);
  return c.json({ goal, weightHistory });
});

app.post("/api/weight", async (c) => {
  const userId = c.get("userId");
  const { weightKg, date } = await c.req.json<{ weightKg?: number; date?: string }>();
  if (!weightKg) return c.json({ error: "몸무게를 입력해주세요." }, 400);
  const entryDate = date && isValidDateStr(date) ? date : todayStr();

  await upsertWeightEntryStmt(c.env.DB, userId, weightKg, entryDate).run();

  const weightHistory = await getWeightHistory(c.env.DB, userId);
  let goal = await getLatestGoal(c.env.DB, userId);
  let giftIssued = false;

  // Achievement is judged on the most recent day logged, not necessarily
  // the entry that was just edited (which may be a past-date correction).
  const latestWeight = weightHistory[weightHistory.length - 1]?.weightKg;

  if (goal && goal.status === "in_progress" && latestWeight !== undefined) {
    const achieved =
      goal.targetWeightKg <= goal.startWeightKg
        ? latestWeight <= goal.targetWeightKg
        : latestWeight >= goal.targetWeightKg;
    if (achieved) {
      await c.env.DB.batch([
        c.env.DB.prepare(`UPDATE diet_goals SET status = 'achieved' WHERE id = ?`).bind(goal.id),
        c.env.DB.prepare(
          `INSERT INTO gifts (id, user_id, goal_id, rule, gift_type, issued_at, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          crypto.randomUUID(),
          userId,
          goal.id,
          "목표 체중 도달",
          "쿠폰",
          new Date().toISOString(),
          "지급완료"
        ),
      ]);
      giftIssued = true;
      goal = { ...goal, status: "achieved" } as DietGoal;
    }
  }

  const gifts = await getGifts(c.env.DB, userId);
  return c.json({ weightHistory, goal, giftIssued, gifts });
});

app.post("/api/snapshot", async (c) => {
  const userId = c.get("userId");
  const { note } = await c.req.json<{ note?: string }>();

  const [user, goal, weightHistory] = await Promise.all([
    getUserById(c.env.DB, userId),
    getLatestGoal(c.env.DB, userId),
    getWeightHistory(c.env.DB, userId),
  ]);
  if (!user || !goal) return c.json({ error: "먼저 목표를 설정해주세요." }, 400);

  const weightKg = weightHistory.length
    ? weightHistory[weightHistory.length - 1].weightKg
    : goal.startWeightKg;
  const heightM = user.height_cm / 100;
  const bmi = heightM > 0 ? weightKg / (heightM * heightM) : 0;

  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO plan_snapshots (id, user_id, goal_id, height_cm, weight_kg, bmi, target_weight_kg, duration_months, goal_status, note, saved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      userId,
      goal.id,
      user.height_cm,
      weightKg,
      bmi,
      goal.targetWeightKg,
      goal.durationMonths,
      goal.status,
      note ?? null,
      new Date().toISOString()
    )
    .run();

  const snapshots = await getSnapshots(c.env.DB, userId);
  return c.json({ snapshots });
});

app.get("/api/snapshots", async (c) => {
  const snapshots = await getSnapshots(c.env.DB, c.get("userId"));
  return c.json({ snapshots });
});

// ---------- Shop / orders / payments / gifts ----------

// Creates an order in '결제대기' (payment pending) status from the cart.
// No money moves here -- this just reserves the order so the Toss widget
// has an orderId/amount to request payment for.
app.post("/api/orders", async (c) => {
  const userId = c.get("userId");
  const { items } = await c.req.json<{ items?: { productId: string; qty: number }[] }>();
  if (!items || items.length === 0) return c.json({ error: "장바구니가 비어있습니다." }, 400);

  const resolved = items
    .map((i) => {
      const p = productById(i.productId);
      if (!p || i.qty <= 0) return null;
      return { productId: p.id, name: p.name, price: p.price, qty: i.qty };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (resolved.length === 0) return c.json({ error: "유효한 상품이 없습니다." }, 400);

  const total = resolved.reduce((sum, i) => sum + i.price * i.qty, 0);
  const goal = await getLatestGoal(c.env.DB, userId);
  const orderId = crypto.randomUUID();
  const orderName =
    resolved.length === 1
      ? resolved[0].name
      : `${resolved[0].name} 외 ${resolved.length - 1}건`;

  const statements = [
    c.env.DB.prepare(
      `INSERT INTO orders (id, user_id, goal_id, total_price, ordered_at, status)
       VALUES (?, ?, ?, ?, ?, '결제대기')`
    ).bind(orderId, userId, goal?.id ?? null, total, new Date().toISOString()),
    ...resolved.map((i) =>
      c.env.DB.prepare(
        `INSERT INTO order_items (id, order_id, product_id, name, price, qty) VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(crypto.randomUUID(), orderId, i.productId, i.name, i.price, i.qty)
    ),
  ];
  await c.env.DB.batch(statements);

  return c.json({ orderId, totalPrice: total, orderName });
});

app.get("/api/orders", async (c) => {
  const orders = await getOrders(c.env.DB, c.get("userId"));
  return c.json({ orders });
});

app.get("/api/orders/:id", async (c) => {
  const order = await getOrderByIdForUser(c.env.DB, c.req.param("id"), c.get("userId"));
  if (!order) return c.json({ error: "주문을 찾을 수 없습니다." }, 404);
  return c.json({ order });
});

// Server-side confirmation with Toss: the client never sees the secret key,
// and we re-check the order's owner + amount before approving anything.
app.post("/api/payments/confirm", async (c) => {
  const userId = c.get("userId");
  const { paymentKey, orderId, amount } = await c.req.json<{
    paymentKey?: string;
    orderId?: string;
    amount?: number;
  }>();
  if (!paymentKey || !orderId || !amount) {
    return c.json({ error: "결제 정보가 올바르지 않습니다." }, 400);
  }

  const order = await getOrderByIdForUser(c.env.DB, orderId, userId);
  if (!order) return c.json({ error: "주문을 찾을 수 없습니다." }, 404);
  if (order.status === "결제완료") return c.json({ order });
  if (order.status !== "결제대기") {
    return c.json({ error: "결제할 수 없는 주문 상태입니다." }, 400);
  }
  if (order.totalPrice !== amount) {
    return c.json({ error: "결제 금액이 주문 금액과 일치하지 않습니다." }, 400);
  }

  const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${c.env.TOSS_WIDGET_SECRET_KEY}:`),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  const tossResult = await tossRes.json<{ status?: string; message?: string }>();

  if (!tossRes.ok || tossResult.status !== "DONE") {
    return c.json({ error: tossResult.message ?? "결제 승인에 실패했습니다." }, 502);
  }

  await c.env.DB.prepare(`UPDATE orders SET status = '결제완료', payment_key = ? WHERE id = ?`)
    .bind(paymentKey, orderId)
    .run();

  const updated = await getOrderByIdForUser(c.env.DB, orderId, userId);
  return c.json({ order: updated });
});

app.post("/api/orders/:id/cancel", async (c) => {
  const userId = c.get("userId");
  const orderId = c.req.param("id");
  const { cancelReason } = await c.req
    .json<{ cancelReason?: string }>()
    .catch((): { cancelReason?: string } => ({}));

  const order = await getOrderByIdForUser(c.env.DB, orderId, userId);
  if (!order) return c.json({ error: "주문을 찾을 수 없습니다." }, 404);

  // Never charged, so there's nothing for Toss to cancel -- just mark it,
  // keeping the record instead of deleting it outright.
  if (order.status === "결제대기") {
    await c.env.DB.prepare(`UPDATE orders SET status = '취소' WHERE id = ?`).bind(orderId).run();
    const updated = await getOrderByIdForUser(c.env.DB, orderId, userId);
    return c.json({ order: updated });
  }

  if (order.status !== "결제완료" || !order.paymentKey) {
    return c.json({ error: "취소할 수 없는 주문 상태입니다." }, 400);
  }

  const tossRes = await fetch(
    `https://api.tosspayments.com/v1/payments/${encodeURIComponent(order.paymentKey)}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${c.env.TOSS_WIDGET_SECRET_KEY}:`),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cancelReason: cancelReason?.trim() || "고객 요청에 의한 취소" }),
    }
  );
  const tossResult = await tossRes.json<{ status?: string; message?: string }>();

  if (!tossRes.ok || (tossResult.status !== "CANCELED" && tossResult.status !== "PARTIAL_CANCELED")) {
    return c.json({ error: tossResult.message ?? "결제 취소에 실패했습니다." }, 502);
  }

  await c.env.DB.prepare(`UPDATE orders SET status = '취소' WHERE id = ?`).bind(orderId).run();

  const updated = await getOrderByIdForUser(c.env.DB, orderId, userId);
  return c.json({ order: updated });
});

app.get("/api/gifts", async (c) => {
  const gifts = await getGifts(c.env.DB, c.get("userId"));
  return c.json({ gifts });
});

// ---------- Workers AI: English product blurb ----------

const AI_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";

app.post("/api/ai/product-blurb", async (c) => {
  const { productId } = await c.req.json<{ productId?: string }>().catch(() => ({}) as { productId?: string });
  if (!productId) return c.json({ error: "상품 정보가 없습니다." }, 400);

  const product = productById(productId);
  if (!product) return c.json({ error: "상품을 찾을 수 없습니다." }, 404);

  const systemPrompt = [
    "You write short English blurbs for a Korean online store's product listings, aimed at overseas shoppers.",
    "Rules you must follow strictly:",
    "1. Write no more than 3 sentences.",
    "2. Use plain, factual language -- no hype, no exaggeration, no superlatives like 'amazing' or 'best'.",
    "3. Only use facts explicitly given in the product name and description below.",
    "4. Never invent or assume details that are not stated -- especially country of origin, ingredients, or certifications.",
    "Output only the blurb text, nothing else.",
  ].join("\n");

  const userPrompt = `Product name: ${product.name}\nProduct description: ${product.description}`;

  try {
    const result = await c.env.AI.run(AI_MODEL, {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 200,
    });
    const blurb = typeof result === "object" && result && "response" in result ? result.response : undefined;
    if (!blurb) return c.json({ error: "생성된 내용이 없습니다." }, 502);
    return c.json({ blurb: blurb.trim() });
  } catch {
    return c.json({ error: "AI 응답 생성에 실패했습니다." }, 502);
  }
});

export default app;
