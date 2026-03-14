import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "需要管理员权限" });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  category: router({
    list: publicProcedure.query(async () => {
      return db.getAllCategories();
    }),
    create: adminProcedure.input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
    })).mutation(async ({ input }) => {
      return db.createCategory(input);
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateCategory(id, data);
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteCategory(input.id);
      return { success: true };
    }),
  }),

  book: router({
    list: publicProcedure.input(z.object({
      page: z.number().optional().default(1),
      pageSize: z.number().optional().default(12),
      search: z.string().optional(),
      categoryId: z.number().optional(),
      sortBy: z.string().optional(),
    }).optional()).query(async ({ input }) => {
      return db.getBooks(input || {});
    }),
    detail: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const book = await db.getBookById(input.id);
      if (!book) throw new TRPCError({ code: "NOT_FOUND", message: "书籍不存在" });
      return book;
    }),
    // Admin operations
    create: adminProcedure.input(z.object({
      title: z.string().min(1).max(255),
      author: z.string().min(1).max(255),
      isbn: z.string().optional(),
      price: z.string(),
      originalPrice: z.string().optional(),
      description: z.string().optional(),
      coverImage: z.string().optional(),
      categoryId: z.number().optional(),
      stock: z.number().optional().default(100),
    })).mutation(async ({ input }) => {
      return db.createBook(input as any);
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      title: z.string().min(1).max(255).optional(),
      author: z.string().min(1).max(255).optional(),
      isbn: z.string().optional(),
      price: z.string().optional(),
      originalPrice: z.string().optional(),
      description: z.string().optional(),
      coverImage: z.string().optional(),
      categoryId: z.number().nullable().optional(),
      stock: z.number().optional(),
      status: z.enum(["active", "inactive"]).optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateBook(id, data as any);
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteBook(input.id);
      return { success: true };
    }),
    adminList: adminProcedure.input(z.object({
      page: z.number().optional().default(1),
      pageSize: z.number().optional().default(20),
      search: z.string().optional(),
      categoryId: z.number().optional(),
      status: z.string().optional(),
    }).optional()).query(async ({ input }) => {
      return db.getBooks({ ...input, status: input?.status || undefined });
    }),
  }),

  cart: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getCartItems(ctx.user.id);
    }),
    count: protectedProcedure.query(async ({ ctx }) => {
      return db.getCartCount(ctx.user.id);
    }),
    add: protectedProcedure.input(z.object({
      bookId: z.number(),
      quantity: z.number().optional().default(1),
    })).mutation(async ({ ctx, input }) => {
      return db.addToCart(ctx.user.id, input.bookId, input.quantity);
    }),
    updateQuantity: protectedProcedure.input(z.object({
      id: z.number(),
      quantity: z.number(),
    })).mutation(async ({ ctx, input }) => {
      await db.updateCartItemQuantity(input.id, ctx.user.id, input.quantity);
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.removeCartItem(input.id, ctx.user.id);
      return { success: true };
    }),
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await db.clearCart(ctx.user.id);
      return { success: true };
    }),
  }),

  order: router({
    create: protectedProcedure.input(z.object({
      shippingName: z.string().min(1),
      shippingPhone: z.string().min(1),
      shippingAddress: z.string().min(1),
      note: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      // Get cart items
      const cartItemsList = await db.getCartItems(ctx.user.id);
      if (cartItemsList.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "购物车为空" });

      // Calculate total
      let totalAmount = 0;
      const items = cartItemsList.map(item => {
        const price = parseFloat(item.book?.price || "0");
        totalAmount += price * item.quantity;
        return {
          bookId: item.bookId,
          quantity: item.quantity,
          price: String(price),
          bookTitle: item.book?.title || "",
          bookAuthor: item.book?.author || undefined,
          bookCoverImage: item.book?.coverImage || undefined,
        };
      });

      const result = await db.createOrder({
        userId: ctx.user.id,
        totalAmount: totalAmount.toFixed(2),
        ...input,
        items,
      });

      // Clear cart after order
      await db.clearCart(ctx.user.id);
      return result;
    }),
    list: protectedProcedure.input(z.object({
      page: z.number().optional().default(1),
      pageSize: z.number().optional().default(10),
    }).optional()).query(async ({ ctx, input }) => {
      return db.getUserOrders(ctx.user.id, input?.page, input?.pageSize);
    }),
    detail: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const order = await db.getOrderById(input.id, ctx.user.role === "admin" ? undefined : ctx.user.id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "订单不存在" });
      return order;
    }),
    cancel: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const order = await db.getOrderById(input.id, ctx.user.id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "订单不存在" });
      if (order.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "只能取消待付款订单" });
      await db.updateOrderStatus(input.id, "cancelled");
      return { success: true };
    }),
  }),

  admin: router({
    stats: adminProcedure.query(async () => {
      return db.getDashboardStats();
    }),
    orders: adminProcedure.input(z.object({
      page: z.number().optional().default(1),
      pageSize: z.number().optional().default(10),
    }).optional()).query(async ({ input }) => {
      return db.getAllOrders(input?.page, input?.pageSize);
    }),
    updateOrderStatus: adminProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["pending", "paid", "shipped", "completed", "cancelled"]),
    })).mutation(async ({ input }) => {
      await db.updateOrderStatus(input.id, input.status);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
