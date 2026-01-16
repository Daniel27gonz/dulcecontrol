-- Add missing persisted recipe fields required for accurate costing across modules
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS portions integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS elaboration_time jsonb NOT NULL DEFAULT '{"preparation":0,"baking":0,"decoration":0,"packaging":0}',
  ADD COLUMN IF NOT EXISTS extras jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS decoration_hours numeric NOT NULL DEFAULT 0;

-- Helpful indexes are not necessary here; these are per-row attributes.
