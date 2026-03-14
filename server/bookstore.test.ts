import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return createUserContext({ id: 99, openId: "admin-001", role: "admin", name: "Admin" });
}

// ============ AUTH TESTS ============

describe("auth.me", () => {
  it("returns null for unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user data for authenticated user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.name).toBe("Test User");
    expect(result?.email).toBe("test@example.com");
    expect(result?.role).toBe("user");
  });
});

// ============ CATEGORY TESTS ============

describe("category.list", () => {
  it("returns categories list as public procedure", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.category.list();
    expect(Array.isArray(result)).toBe(true);
    // Should have seeded categories
    expect(result.length).toBeGreaterThan(0);
  });

  it("each category has id and name", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.category.list();
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
    }
  });
});

describe("category admin operations", () => {
  it("rejects category creation from non-admin user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.category.create({ name: "Test Category" })).rejects.toThrow();
  });

  it("allows admin to create category", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.category.create({ name: "Test Category " + Date.now() });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });
});

// ============ BOOK TESTS ============

describe("book.list", () => {
  it("returns paginated books as public procedure", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.book.list({ page: 1, pageSize: 5 });
    expect(result).toHaveProperty("books");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.books)).toBe(true);
    expect(result.total).toBeGreaterThan(0);
  });

  it("respects pageSize parameter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.book.list({ page: 1, pageSize: 3 });
    expect(result.books.length).toBeLessThanOrEqual(3);
  });

  it("supports search by title", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.book.list({ page: 1, pageSize: 10, search: "活着" });
    // May or may not find results, but should not error
    expect(result).toHaveProperty("books");
    expect(result).toHaveProperty("total");
  });

  it("supports category filtering", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const cats = await caller.category.list();
    if (cats.length > 0) {
      const result = await caller.book.list({ page: 1, pageSize: 10, categoryId: cats[0].id });
      expect(result).toHaveProperty("books");
      // All returned books should belong to the category
      for (const book of result.books) {
        expect(book.categoryId).toBe(cats[0].id);
      }
    }
  });

  it("supports sorting by price ascending", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.book.list({ page: 1, pageSize: 10, sortBy: "price_asc" });
    if (result.books.length >= 2) {
      const prices = result.books.map(b => parseFloat(b.price));
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    }
  });
});

describe("book.detail", () => {
  it("returns book details for valid id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const list = await caller.book.list({ page: 1, pageSize: 1 });
    if (list.books.length > 0) {
      const book = await caller.book.detail({ id: list.books[0].id });
      expect(book).toHaveProperty("id");
      expect(book).toHaveProperty("title");
      expect(book).toHaveProperty("author");
      expect(book).toHaveProperty("price");
      expect(book).toHaveProperty("stock");
    }
  });

  it("throws NOT_FOUND for invalid id", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.book.detail({ id: 999999 })).rejects.toThrow();
  });
});

describe("book admin operations", () => {
  it("rejects book creation from non-admin user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.book.create({
      title: "Test Book",
      author: "Test Author",
      price: "29.99",
    })).rejects.toThrow();
  });

  it("allows admin to create a book", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.book.create({
      title: "Test Book " + Date.now(),
      author: "Test Author",
      price: "29.99",
      stock: 50,
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });
});

// ============ CART TESTS ============

describe("cart operations", () => {
  it("rejects cart access for unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.cart.list()).rejects.toThrow();
  });

  it("returns empty cart for new user", async () => {
    const ctx = createUserContext({ id: 9999, openId: "new-user-" + Date.now() });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.cart.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("allows authenticated user to add to cart", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    // Get a book first
    const publicCaller = appRouter.createCaller(createPublicContext());
    const books = await publicCaller.book.list({ page: 1, pageSize: 1 });
    if (books.books.length > 0) {
      const result = await caller.cart.add({ bookId: books.books[0].id, quantity: 1 });
      expect(result).toHaveProperty("id");
    }
  });

  it("returns cart count for authenticated user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const count = await caller.cart.count();
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

// ============ ORDER TESTS ============

describe("order operations", () => {
  it("rejects order access for unauthenticated user", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.order.list()).rejects.toThrow();
  });

  it("returns order list for authenticated user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.order.list({ page: 1, pageSize: 10 });
    expect(result).toHaveProperty("orders");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.orders)).toBe(true);
  });

  it("rejects order creation with empty cart", async () => {
    // Use a fresh user with empty cart
    const ctx = createUserContext({ id: 8888, openId: "empty-cart-user-" + Date.now() });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.order.create({
      shippingName: "Test",
      shippingPhone: "13800138000",
      shippingAddress: "Test Address",
    })).rejects.toThrow();
  });

  it("throws NOT_FOUND for invalid order detail", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.order.detail({ id: 999999 })).rejects.toThrow();
  });
});

// ============ ADMIN TESTS ============

describe("admin operations", () => {
  it("rejects admin stats from non-admin user", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("returns dashboard stats for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.admin.stats();
    expect(stats).toHaveProperty("totalBooks");
    expect(stats).toHaveProperty("totalOrders");
    expect(stats).toHaveProperty("totalUsers");
    expect(stats).toHaveProperty("totalRevenue");
    expect(typeof stats.totalBooks).toBe("number");
  });

  it("returns all orders for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.orders({ page: 1, pageSize: 10 });
    expect(result).toHaveProperty("orders");
    expect(result).toHaveProperty("total");
  });
});
