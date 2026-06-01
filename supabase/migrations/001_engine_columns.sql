-- Phase 1: Add engine columns (safe to re-run, IF NOT EXISTS)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/vrxgodfbktgqkdhqspcf/sql

ALTER TABLE public.keel_users
  ADD COLUMN IF NOT EXISTS paycheck_amount numeric,
  ADD COLUMN IF NOT EXISTS goal_name text,
  ADD COLUMN IF NOT EXISTS goal_target numeric,
  ADD COLUMN IF NOT EXISTS goal_current numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS goal_monthly numeric DEFAULT 0;

ALTER TABLE public.keel_income_entries
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'AED';

-- Column mapping (no renames needed, handled in code):
-- monthly_expenses  -> monthlyEssentials  (in engine UserProfile)
-- savings_balance   -> currentSavings     (in engine UserProfile)
-- is_muslim         -> payZakat           (in engine UserProfile)
-- region_code       -> region             (in engine UserProfile)
