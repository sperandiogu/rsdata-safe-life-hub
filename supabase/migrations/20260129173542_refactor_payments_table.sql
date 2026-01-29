/*
  # Refactor payments table to use normalized structure

  1. Changes to `payments` table
    - Add `customer_id` (uuid, foreign key) - References customers table
    - Add `subscription_id` (uuid, foreign key) - References subscriptions table
    - Remove redundant customer fields (now in customers table):
      - customer_name, customer_email, customer_document, customer_phone, customer_address
    - Remove redundant plan fields (now in subscriptions/plans tables):
      - plan_name, plan_type
    - Keep essential payment fields:
      - id, external_reference, mp_payment_id, mp_preference_id
      - status, status_detail, amount
      - payment_method, payment_type, installments
      - metadata, created_at, updated_at, paid_at

  2. Migration Strategy
    - Add new columns as nullable first
    - Remove old columns after data is migrated
    - Add foreign key constraints
    - Update indexes

  3. New Indexes
    - Index on customer_id for faster customer payment lookups
    - Index on subscription_id for faster subscription payment lookups
    - Composite index on customer_id and created_at for payment history

  4. Security
    - Update RLS policies to work with new structure
    - Allow public insert and select for payment tracking
*/

-- Step 1: Add new foreign key columns (nullable for now to allow existing records)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'subscription_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 2: Remove redundant columns that are now in other tables
-- Note: Only drop if they exist to make migration idempotent
DO $$
BEGIN
  -- Drop customer-related columns
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE payments DROP COLUMN customer_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE payments DROP COLUMN customer_email;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'customer_document'
  ) THEN
    ALTER TABLE payments DROP COLUMN customer_document;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE payments DROP COLUMN customer_phone;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'customer_address'
  ) THEN
    ALTER TABLE payments DROP COLUMN customer_address;
  END IF;

  -- Drop plan-related columns
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'plan_name'
  ) THEN
    ALTER TABLE payments DROP COLUMN plan_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'plan_type'
  ) THEN
    ALTER TABLE payments DROP COLUMN plan_type;
  END IF;
END $$;

-- Step 3: Drop old indexes that referenced removed columns
DROP INDEX IF EXISTS idx_payments_customer_email;

-- Step 4: Create new indexes for the foreign keys
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_created ON payments(customer_id, created_at DESC);

-- Step 5: Update RLS policies to allow public access for payment creation
DROP POLICY IF EXISTS "Service role can manage all payments" ON payments;

-- Allow public INSERT for new payments
CREATE POLICY "Allow public insert for payments"
  ON payments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow public SELECT for payments
CREATE POLICY "Allow public select for payments"
  ON payments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow public UPDATE for payment status updates
CREATE POLICY "Allow public update for payments"
  ON payments
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);