import { getConvexClient } from "./convex-client";
import { api } from "../../convex/_generated/api";
import type { UserProfile as EngineUserProfile, IncomeEntry as EngineIncomeEntry } from "./engine";
import type { Id } from "../../convex/_generated/dataModel";

// ─── Row → Engine mappers ────────────────────────────────────────────────────

export function rowToUserProfile(row: Record<string, unknown>): EngineUserProfile {
  return {
    region: (row.regionCode as string) ?? "AE",
    monthlyEssentials: Number(row.monthlyExpenses ?? 0),
    currentSavings: Number(row.savingsBalance ?? 0),
    payZakat: (row.isMuslim as boolean) ?? false,
    goalName: (row.goalName as string) ?? undefined,
    goalTarget: row.goalTarget != null ? Number(row.goalTarget) : undefined,
    goalCurrent: row.goalCurrent != null ? Number(row.goalCurrent) : undefined,
    goalMonthly: row.goalMonthly != null ? Number(row.goalMonthly) : undefined,
  };
}

export function rowToIncomeEntry(row: Record<string, unknown>): EngineIncomeEntry {
  return {
    amount: Number(row.amount),
    date: row.date as string,
    source: (row.source as string) ?? undefined,
  };
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(data: {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}) {
  const client = getConvexClient();
  await client.mutation(api.users.upsertUser, {
    userId: data.id,
    email: data.email,
    name: data.name,
    image: data.image,
  });
}

export async function getUser(id: string) {
  const client = getConvexClient();
  const row = await client.query(api.users.getUser, { userId: id });
  return row ?? null;
}

export async function getOrSetPaycheck(userId: string, amount?: number): Promise<number | null> {
  const client = getConvexClient();
  if (amount !== undefined) {
    await client.mutation(api.users.setPaycheck, { userId, amount });
    return amount;
  }
  const row = await client.query(api.users.getUser, { userId });
  return row?.paycheckAmount != null ? Number(row.paycheckAmount) : null;
}

// ─── Income entries ───────────────────────────────────────────────────────────

export async function addIncomeEntry(data: {
  userId: string;
  amount: number;
  source: string;
  note: string | null;
  date: string;
  currency?: string;
}) {
  const client = getConvexClient();
  return await client.mutation(api.users.addIncomeEntry, data);
}

export async function getIncomeEntries(userId: string, limit = 100) {
  const client = getConvexClient();
  const entries = await client.query(api.users.getIncomeEntries, { userId, limit });
  return entries ?? [];
}

export async function deleteIncomeEntry(id: string, userId: string) {
  const client = getConvexClient();
  await client.mutation(api.users.deleteIncomeEntry, {
    entryId: id as Id<"keel_income_entries">,
    userId,
  });
}

// ─── Expense entries ──────────────────────────────────────────────────────────

export async function addExpenseEntry(data: {
  userId: string;
  amount: number;
  category: string;
  note: string | null;
  date: string;
  currency?: string;
}) {
  const client = getConvexClient();
  return await client.mutation(api.users.addExpenseEntry, data);
}

export async function getExpenseEntries(userId: string, limit = 100) {
  const client = getConvexClient();
  const entries = await client.query(api.users.getExpenseEntries, { userId, limit });
  return entries ?? [];
}

export async function deleteExpenseEntry(id: string, userId: string) {
  const client = getConvexClient();
  await client.mutation(api.users.deleteExpenseEntry, {
    entryId: id as Id<"keel_expense_entries">,
    userId,
  });
}

// ─── Reserve / buffer ─────────────────────────────────────────────────────────

export async function getReserveBalance(userId: string): Promise<number> {
  const client = getConvexClient();
  const row = await client.query(api.users.getUser, { userId });
  return Number(row?.reserveBalance ?? 0);
}

export async function updateReserveBalance(userId: string, amount: number) {
  const client = getConvexClient();
  await client.mutation(api.users.updateReserveBalance, { userId, amount });
}

// ─── Full profile JSON ────────────────────────────────────────────────────────

export async function saveFullProfile(userId: string, profileJson: string): Promise<void> {
  const client = getConvexClient();
  await client.mutation(api.users.saveFullProfile, { userId, profileJson });
}

export async function getFullProfile(userId: string): Promise<string | null> {
  const client = getConvexClient();
  return await client.query(api.users.getFullProfile, { userId });
}

export async function saveGoals(userId: string, goals: string): Promise<void> {
  const client = getConvexClient();
  await client.mutation(api.users.saveGoals, { userId, goals });
}

export async function saveBigPayments(userId: string, bigPayments: string): Promise<void> {
  const client = getConvexClient();
  await client.mutation(api.users.saveBigPayments, { userId, bigPayments });
}

export async function saveExpenses(userId: string, expenses: string): Promise<void> {
  const client = getConvexClient();
  await client.mutation(api.users.saveExpenses, { userId, expenses });
}

export async function savePots(userId: string, pots: string): Promise<void> {
  const client = getConvexClient();
  await client.mutation(api.users.savePots, { userId, pots });
}

export async function getAllUserData(userId: string): Promise<{
  profileJson: string | null;
  goalsJson: string | null;
  bigPaymentsJson: string | null;
  expensesJson: string | null;
  potsJson: string | null;
} | null> {
  const client = getConvexClient();
  return await client.query(api.users.getAllUserData, { userId });
}

// ─── iOS Shortcut log token ───────────────────────────────────────────────────

export async function getOrCreateLogToken(userId: string): Promise<string> {
  const client = getConvexClient();
  return await client.mutation(api.users.getOrCreateLogToken, { userId });
}

// ─── Quick-log: look up user by log token ────────────────────────────────────

export async function getUserByLogToken(logToken: string) {
  const client = getConvexClient();
  return await client.query(api.users.getUserByLogToken, { logToken });
}
