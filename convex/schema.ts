import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  keel_users: defineTable({
    userId: v.string(),
    email: v.string(),
    name: v.union(v.string(), v.null()),
    image: v.union(v.string(), v.null()),
    regionCode: v.optional(v.string()),
    incomeType: v.optional(v.string()),
    isMuslim: v.optional(v.boolean()),
    monthlyExpenses: v.optional(v.number()),
    savingsBalance: v.optional(v.number()),
    onboardingComplete: v.optional(v.boolean()),
    paycheckAmount: v.optional(v.number()),
    reserveBalance: v.optional(v.number()),
    logToken: v.optional(v.string()),
    goalName: v.optional(v.string()),
    goalTarget: v.optional(v.number()),
    goalCurrent: v.optional(v.number()),
    goalMonthly: v.optional(v.number()),
    profileJson: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
    goals: v.optional(v.string()),
    bigPayments: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_logToken", ["logToken"])
    .index("by_email", ["email"]),

  keel_income_entries: defineTable({
    userId: v.string(),
    amount: v.number(),
    source: v.string(),
    note: v.union(v.string(), v.null()),
    date: v.string(),
    currency: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  keel_expense_entries: defineTable({
    userId: v.string(),
    amount: v.number(),
    category: v.string(),
    note: v.union(v.string(), v.null()),
    date: v.string(),
    currency: v.optional(v.string()),
  }).index("by_userId", ["userId"]),
});
