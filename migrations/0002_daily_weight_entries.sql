-- Moves weight_entries to one row per user per calendar day, so a day's
-- entry can be upserted (added or corrected) instead of always appending a
-- new row. No real weight data exists yet, so this clears the table rather
-- than attempting a dedupe migration.

DELETE FROM weight_entries;
ALTER TABLE weight_entries ADD COLUMN date TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_weight_entries_user_date ON weight_entries(user_id, date);
