/*
  # Create subscriptions table

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key) - Unique identifier for each subscription
      - `customer_id` (uuid, foreign key) - References customers table
      - `plan_id` (uuid, foreign key) - References plans table
      - `billing_period` (text, not null) - 'mensal' or 'anual'
      - `status` (text, not null) - 'active', 'cancelled', 'expired', 'pending'
      - `started_at` (timestamptz) - When the subscription started
      - `expires_at` (timestamptz) - When the subscription expires
      - `cancelled_at` (timestamptz, nullable) - When the subscription was cancelled
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record last update timestamp

  2. Security
    - Enable RLS on `subscriptions` table
    - Add policy for public INSERT (new subscriptions)
    - Add policy for public SELECT (view subscriptions)
    - Add policy for public UPDATE (update subscription status)

  3. Relationships
    - Foreign key to customers table with CASCADE delete
    - Foreign key to plans table with RESTRICT delete
    - Indexes for faster lookups

  4. Constraints
    - Check constraint to validate billing_period is 'mensal' or 'anual'
    - Check constraint to validate status values
*/

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  billing_period text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  started_at timestamptz,
  expires_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT subscriptions_billing_period_check CHECK (billing_period IN ('mensal', 'anual')),
  CONSTRAINT subscriptions_status_check CHECK (status IN ('active', 'cancelled', 'expired', 'pending'))
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_status ON subscriptions(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at) WHERE status = 'active';

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow public INSERT for new subscriptions
CREATE POLICY "Allow public insert for subscriptions"
  ON subscriptions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow public SELECT to view subscriptions
CREATE POLICY "Allow public select for subscriptions"
  ON subscriptions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow public UPDATE for subscription status
CREATE POLICY "Allow public update for subscriptions"
  ON subscriptions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();