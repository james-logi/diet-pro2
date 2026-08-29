-- Adds Toss Payments confirmation tracking to orders. Existing orders keep
-- their current status; payment_key is NULL for anything ordered before
-- this migration (the old demo "instant checkout" flow had no real payment).

ALTER TABLE orders ADD COLUMN payment_key TEXT;
