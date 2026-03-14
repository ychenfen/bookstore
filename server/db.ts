import { eq, and, like, or, sql, desc, asc, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, books, categories, cartItems, orders, orderItems } from "../drizzle/schema";
import type { InsertBook, InsertCategory, InsertCartItem, InsertOrder, InsertOrderItem } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER QUERIES ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ CATEGORY QUERIES ============

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(asc(categories.id));
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values(data);
  return { id: result[0].insertId };
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(categories).where(eq(categories.id, id));
}

// ============ BOOK QUERIES ============

export async function getBooks(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: number;
  status?: string;
  sortBy?: string;
}) {
  const db = await getDb();
  if (!db) return { books: [], total: 0 };

  const page = params.page || 1;
  const pageSize = params.pageSize || 12;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (params.search) {
    conditions.push(or(
      like(books.title, `%${params.search}%`),
      like(books.author, `%${params.search}%`)
    ));
  }
  if (params.categoryId) {
    conditions.push(eq(books.categoryId, params.categoryId));
  }
  if (params.status) {
    conditions.push(eq(books.status, params.status as "active" | "inactive"));
  } else {
    conditions.push(eq(books.status, "active"));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let orderClause;
  switch (params.sortBy) {
    case 'price_asc': orderClause = asc(books.price); break;
    case 'price_desc': orderClause = desc(books.price); break;
    case 'sales': orderClause = desc(books.salesCount); break;
    case 'newest': orderClause = desc(books.createdAt); break;
    default: orderClause = desc(books.salesCount);
  }

  const [bookList, countResult] = await Promise.all([
    db.select().from(books).where(whereClause).orderBy(orderClause).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(books).where(whereClause),
  ]);

  return { books: bookList, total: countResult[0]?.count || 0 };
}

export async function getBookById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(books).where(eq(books.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBooksByIds(ids: number[]) {
  const db = await getDb();
  if (!db || ids.length === 0) return [];
  return db.select().from(books).where(inArray(books.id, ids));
}

export async function createBook(data: InsertBook) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(books).values(data);
  return { id: result[0].insertId };
}

export async function updateBook(id: number, data: Partial<InsertBook>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(books).set(data).where(eq(books.id, id));
}

export async function deleteBook(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(books).set({ status: "inactive" }).where(eq(books.id, id));
}

// ============ CART QUERIES ============

export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const items = await db.select().from(cartItems).where(eq(cartItems.userId, userId)).orderBy(desc(cartItems.createdAt));
  if (items.length === 0) return [];
  const bookIds = items.map(i => i.bookId);
  const bookList = await getBooksByIds(bookIds);
  const bookMap = new Map(bookList.map(b => [b.id, b]));
  return items.map(item => ({ ...item, book: bookMap.get(item.bookId) || null }));
}

export async function addToCart(userId: number, bookId: number, quantity: number = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.bookId, bookId))).limit(1);
  if (existing.length > 0) {
    await db.update(cartItems).set({ quantity: existing[0].quantity + quantity })
      .where(eq(cartItems.id, existing[0].id));
    return { id: existing[0].id };
  }
  const result = await db.insert(cartItems).values({ userId, bookId, quantity });
  return { id: result[0].insertId };
}

export async function updateCartItemQuantity(id: number, userId: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
  } else {
    await db.update(cartItems).set({ quantity }).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
  }
}

export async function removeCartItem(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

export async function getCartCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`COALESCE(SUM(quantity), 0)` })
    .from(cartItems).where(eq(cartItems.userId, userId));
  return Number(result[0]?.count || 0);
}

// ============ ORDER QUERIES ============

export async function createOrder(data: {
  userId: number;
  totalAmount: string;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  note?: string;
  items: { bookId: number; quantity: number; price: string; bookTitle: string; bookAuthor?: string; bookCoverImage?: string; }[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const orderResult = await db.insert(orders).values({
    userId: data.userId,
    totalAmount: data.totalAmount,
    status: "pending",
    shippingName: data.shippingName || null,
    shippingPhone: data.shippingPhone || null,
    shippingAddress: data.shippingAddress || null,
    note: data.note || null,
  });
  const orderId = orderResult[0].insertId;

  if (data.items.length > 0) {
    await db.insert(orderItems).values(
      data.items.map(item => ({ orderId, ...item }))
    );
  }

  // Update book sales count and stock
  for (const item of data.items) {
    await db.update(books).set({
      salesCount: sql`${books.salesCount} + ${item.quantity}`,
      stock: sql`${books.stock} - ${item.quantity}`,
    }).where(eq(books.id, item.bookId));
  }

  return { id: orderId };
}

export async function getUserOrders(userId: number, page: number = 1, pageSize: number = 10) {
  const db = await getDb();
  if (!db) return { orders: [], total: 0 };

  const offset = (page - 1) * pageSize;
  const [orderList, countResult] = await Promise.all([
    db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.userId, userId)),
  ]);

  // Fetch order items for each order
  const orderIds = orderList.map(o => o.id);
  let itemsList: any[] = [];
  if (orderIds.length > 0) {
    itemsList = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
  }
  const itemsMap = new Map<number, typeof itemsList>();
  for (const item of itemsList) {
    const existing = itemsMap.get(item.orderId) || [];
    existing.push(item);
    itemsMap.set(item.orderId, existing);
  }

  const ordersWithItems = orderList.map(order => ({
    ...order,
    items: itemsMap.get(order.id) || [],
  }));

  return { orders: ordersWithItems, total: countResult[0]?.count || 0 };
}

export async function getOrderById(orderId: number, userId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  const conditions = [eq(orders.id, orderId)];
  if (userId) conditions.push(eq(orders.userId, userId));
  const result = await db.select().from(orders).where(and(...conditions)).limit(1);
  if (result.length === 0) return undefined;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  return { ...result[0], items };
}

export async function updateOrderStatus(orderId: number, status: "pending" | "paid" | "shipped" | "completed" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set({ status }).where(eq(orders.id, orderId));
}

// ============ ADMIN QUERIES ============

export async function getAllOrders(page: number = 1, pageSize: number = 10) {
  const db = await getDb();
  if (!db) return { orders: [], total: 0 };
  const offset = (page - 1) * pageSize;
  const [orderList, countResult] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(orders),
  ]);
  return { orders: orderList, total: countResult[0]?.count || 0 };
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalBooks: 0, totalOrders: 0, totalUsers: 0, totalRevenue: "0" };
  const [bookCount, orderCount, userCount, revenue] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(books).where(eq(books.status, "active")),
    db.select({ count: sql<number>`count(*)` }).from(orders),
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ total: sql<string>`COALESCE(SUM(totalAmount), 0)` }).from(orders).where(eq(orders.status, "paid")),
  ]);
  return {
    totalBooks: bookCount[0]?.count || 0,
    totalOrders: orderCount[0]?.count || 0,
    totalUsers: userCount[0]?.count || 0,
    totalRevenue: String(revenue[0]?.total || "0"),
  };
}
