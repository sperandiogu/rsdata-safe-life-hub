/*
  # Create Payments Table for Mercado Pago Integration

  1. New Tables
    - `payments`
      - `id` (uuid, primary key) - Unique identifier for each payment record
      - `external_reference` (text, unique) - RSData reference for tracking
      - `mp_payment_id` (text) - Mercado Pago payment ID
      - `mp_preference_id` (text) - Mercado Pago preference ID
      - `status` (text) - Payment status (pending, approved, rejected, cancelled)
      - `status_detail` (text) - Detailed status from Mercado Pago
      - `plan_name` (text) - Name of the subscribed plan
      - `plan_type` (text) - Plan type (Mensal/Anual)
      - `amount` (numeric) - Payment amount in BRL
      - `customer_name` (text) - Customer name or company name
      - `customer_email` (text) - Customer email
      - `customer_document` (text) - CPF or CNPJ
      - `customer_phone` (text) - Customer phone number
      - `customer_address` (jsonb) - Full address as JSON
      - `payment_method` (text) - Payment method used
      - `payment_type` (text) - Type of payment (credit_card, pix, boleto, etc)
      - `installments` (integer) - Number of installments
      - `metadata` (jsonb) - Additional metadata from Mercado Pago
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      - `paid_at` (timestamptz) - When payment was confirmed

  2. Security
    - Enable RLS on `payments` table
    - Add policy for service role to manage all payments
    - No public access to payment data

  3. Indexes
    - Index on external_reference for fast lookups
    - Index on mp_payment_id for webhook processing
    - Index on status for filtering
    - Index on customer_email for customer queries
*/

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_reference text UNIQUE NOT NULL,
  mp_payment_id text,
  mp_preference_id text,
  status text NOT NULL DEFAULT 'pending',
  status_detail text,
  plan_name text NOT NULL,
  plan_type text NOT NULL,
  amount numeric(10,2) NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_document text NOT NULL,
  customer_phone text,
  customer_address jsonb,
  payment_method text,
  payment_type text,
  installments integer DEFAULT 1,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  paid_at timestamptz
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all payments"
  ON payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_payments_external_reference ON payments(external_reference);
CREATE INDEX IF NOT EXISTS idx_payments_mp_payment_id ON payments(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_customer_email ON payments(customer_email);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();
