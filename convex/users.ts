import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ── Users ──────────────────────────────────────────────────────────────────────

export const upsertUser = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.union(v.string(), v.null()),
    image: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("keel_users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        image: args.image,
      });
      return existing._id;
    }
    return await ctx.db.insert("keel_users", {
      userId: args.userId,
      email: args.email,
      name: args.name,
      image: args.image,
    });
  },
});

export const getUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("keel_users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const getUserByLogToken = query({
  args: { logToken: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("keel_users")
      .withIndex("by_logToken", (q) => q.eq("logToken", args.logToken))
      .first();
  },
});

export const setPaycheck = mutation({
  args: { userId: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("keel_users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) await ctx.db.patch(existing._id, { paycheckAmount: args.amount });
    return args.amount;
  },
});

export const updateReserveBalance = mutation({
  args: { userId: v.string(), amount: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("keel_users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) await ctx.db.patch(existing._id, { reserveBalance: args.amount });
  },
});

export const getOrCreateLogToken = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("keel_users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!existing) throw new Error(`User ${args.userId} not found`);
    if (existing.logToken) return existing.logToken;
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    await ctx.db.patch(existing._id, { logToken: token });
    return token;
  },
});

// ── Full profile JSON store/retrieve ──────────────────────────────────────────

export const saveFullProfile = mutation({
  args: { userId: v.string(), profileJson: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("keel_users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { profileJson: args.profileJson });
    } else {
      await ctx.db.insert("keel_users", {
        userId: args.userId,
        email: `${args.userId.slice(0, 12)}@keel.local`,
        name: null,
        image: null,
        profileJson: args.profileJson,
      });
    }
  },
});

export const getFullProfile = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("keel_users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    return row?.profileJson ?? null;
  },
});

export const saveGoals = mutation({
  args: { userId: v.string(), goals: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("keel_users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!existing) return;
    await ctx.db.patch(existing._id, { goals: args.goals });
  },
});

export const saveBigPayments = mutation({
  args: { userId: v.string(), bigPayments: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("keel_users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!existing) return;
    await ctx.db.patch(existing._id, { bigPayments: args.bigPayments });
  },
});

export const saveExpenses = mutation({
  args: { userId: v.string(), expenses: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("keel_users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!existing) return;
    await ctx.db.patch(existing._id, { expenses: args.expenses });
  },
});

export const getAllUserData = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("keel_users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (!row) return null;
    return {
      profileJson: row.profileJson ?? null,
      goalsJson: row.goals ?? null,
      bigPaymentsJson: row.bigPayments ?? null,
      expensesJson: row.expenses ?? null,
    };
  },
});

// ── Income entries ─────────────────────────────────────────────────────────────

export const addIncomeEntry = mutation({
  args: {
    userId: v.string(),
    amount: v.number(),
    source: v.string(),
    note: v.union(v.string(), v.null()),
    date: v.string(),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("keel_income_entries", {
      userId: args.userId,
      amount: args.amount,
      source: args.source,
      note: args.note,
      date: args.date,
      currency: args.currency ?? "AED",
    });
    return await ctx.db.get(id);
  },
});

export const getIncomeEntries = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("keel_income_entries")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return entries
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, args.limit ?? 100);
  },
});

export const deleteIncomeEntry = mutation({
  args: { entryId: v.id("keel_income_entries"), userId: v.string() },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry || entry.userId !== args.userId) throw new Error("Not found");
    await ctx.db.delete(args.entryId);
  },
});

// ── Expense entries ─────────────────────────────────────────────────────────────

export const addExpenseEntry = mutation({
  args: {
    userId: v.string(),
    amount: v.number(),
    category: v.string(),
    note: v.union(v.string(), v.null()),
    date: v.string(),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("keel_expense_entries", {
      userId: args.userId,
      amount: args.amount,
      category: args.category,
      note: args.note,
      date: args.date,
      currency: args.currency ?? "AED",
    });
    return await ctx.db.get(id);
  },
});

export const getExpenseEntries = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("keel_expense_entries")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return entries
      .sort((a, b) => {
        const dateCmp = b.date.localeCompare(a.date);
        return dateCmp;
      })
      .slice(0, args.limit ?? 100);
  },
});

export const deleteExpenseEntry = mutation({
  args: { entryId: v.id("keel_expense_entries"), userId: v.string() },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry || entry.userId !== args.userId) throw new Error("Not found");
    await ctx.db.delete(args.entryId);
  },
});

// ── Email / password auth ──────────────────────────────────────────────────────

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("keel_users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const createUserWithPassword = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    name: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("keel_users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) throw new Error("Email already registered");
    return await ctx.db.insert("keel_users", {
      userId: args.userId,
      email: args.email,
      name: args.name,
      image: null,
      passwordHash: args.passwordHash,
    });
  },
});
