-- Adds an admin role flag and seeds a built-in admin account so store
-- staff can view all-user order history / revenue without that being a
-- self-serve signup option.

ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;

INSERT INTO users (id, name, username, password_hash, gender, height_cm, created_at, is_admin)
SELECT
  lower(hex(randomblob(16))),
  '관리자',
  'admin',
  '$2b$10$gNWJRZTKRVc33wL3wcPFsuFn08TolwQ7ZmVKekWqSOmM1uD.SxeE.',
  'M',
  0,
  datetime('now'),
  1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

UPDATE users SET is_admin = 1 WHERE username = 'admin';
