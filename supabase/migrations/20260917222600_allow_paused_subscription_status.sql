/*
  # Allow 'paused' subscription status

  Mercado Pago preapprovals can be `paused`, and sync-subscriptions maps that
  straight through. The original CHECK constraint didn't list it, so every sync
  failed with subscriptions_status_check on any paused subscription. The admin UI
  already renders a "Pausada" badge and filter.
*/

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'cancelled', 'expired', 'paused', 'pending'));
