/*
  # Create Email Logs Table

  1. New Tables
    - `email_logs`
      - `id` (uuid, primary key) - Unique identifier for each email log
      - `recipient_email` (text) - Email address of the recipient
      - `email_type` (text) - Type of email: 'customer_confirmation' or 'internal_notification'
      - `payment_id` (uuid, nullable) - Reference to the payments table
      - `subscription_id` (uuid, nullable) - Reference to the subscriptions table
      - `status` (text) - Status of email: 'sent' or 'failed'
      - `error_message` (text, nullable) - Error message if sending failed
      - `metadata` (jsonb, nullable) - Additional data about the email
      - `sent_at` (timestamptz) - Timestamp when the email was sent/attempted

  2. Security
    - Enable RLS on `email_logs` table
    - No public policies - table is only accessed by edge functions via service role

  3. Indexes
    - Index on payment_id for quick lookups
    - Index on subscription_id for quick lookups
    - Index on email_type and status for filtering
*/

CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  email_type text NOT NULL CHECK (email_type IN ('customer_confirmation', 'internal_notification')),
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message text,
  metadata jsonb,
  sent_at timestamptz DEFAULT now()
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_email_logs_payment_id ON email_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_subscription_id ON email_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_type_status ON email_logs(email_type, status);