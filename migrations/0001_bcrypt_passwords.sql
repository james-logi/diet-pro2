-- Switches password storage from hand-rolled PBKDF2+salt to bcrypt (which
-- embeds its own salt in the hash string), so password_salt is dropped.
-- Existing test accounts were hashed with the old scheme and can't be
-- verified against bcryptjs, so they're cleared along with their data.

DELETE FROM gifts;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM plan_snapshots;
DELETE FROM diet_goals;
DELETE FROM weight_entries;
DELETE FROM users;

ALTER TABLE users DROP COLUMN password_salt;
