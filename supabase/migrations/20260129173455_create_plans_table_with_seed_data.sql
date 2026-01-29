/*
  # Create plans table with seed data

  1. New Tables
    - `plans`
      - `id` (uuid, primary key) - Unique identifier for each plan
      - `plan_id` (text, unique, not null) - Text identifier: 'basic', 'premium', 'plus', 'enterprise'
      - `name` (text, not null) - Display name of the plan
      - `description` (text, nullable) - Plan description
      - `max_lives` (integer) - Maximum number of lives allowed
      - `max_users` (integer) - Maximum number of users allowed
      - `storage_gb` (integer) - Storage space in GB
      - `monthly_price` (decimal) - Monthly price in BRL
      - `annual_price` (decimal) - Annual price in BRL
      - `annual_discount_percentage` (decimal) - Discount percentage for annual plans
      - `is_active` (boolean) - Whether the plan is active/available
      - `features` (jsonb) - JSON object with plan features
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record last update timestamp

  2. Security
    - Enable RLS on `plans` table
    - Add policy for public SELECT (anyone can view plans)
    - Restrict INSERT/UPDATE/DELETE to authenticated users only

  3. Initial Data
    - Seed with 4 plans: Basic, Premium, Plus, Enterprise
    - All prices and configurations from current system

  4. Constraints
    - Unique constraint on plan_id
*/

CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id text NOT NULL,
  name text NOT NULL,
  description text,
  max_lives integer NOT NULL,
  max_users integer NOT NULL,
  storage_gb integer NOT NULL,
  monthly_price decimal(10, 2),
  annual_price decimal(10, 2),
  annual_discount_percentage decimal(5, 2),
  is_active boolean DEFAULT true,
  features jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT plans_plan_id_unique UNIQUE (plan_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_plans_plan_id ON plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Allow public SELECT to view plans
CREATE POLICY "Allow public select for plans"
  ON plans
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed data for plans
INSERT INTO plans (plan_id, name, description, max_lives, max_users, storage_gb, monthly_price, annual_price, annual_discount_percentage, features)
VALUES
  (
    'basic',
    'BASIC',
    'Plano ideal para pequenas equipes',
    100,
    2,
    3,
    97.00,
    997.00,
    14.34,
    '{"lives": "Até 100 vidas", "users": "Para equipes de até 2 usuários", "storage": "3 Gb de Espaço em Disco"}'::jsonb
  ),
  (
    'premium',
    'PREMIUM',
    'Plano mais popular para equipes em crescimento',
    300,
    3,
    5,
    197.00,
    1997.00,
    15.52,
    '{"lives": "Até 300 vidas", "users": "Para equipes de até 3 usuários", "storage": "5 Gb de Espaço em Disco"}'::jsonb
  ),
  (
    'plus',
    'PLUS',
    'Plano avançado para equipes maiores',
    500,
    3,
    3,
    267.00,
    2697.00,
    15.83,
    '{"lives": "Até 500 vidas", "users": "Para equipes de até 3 usuários", "storage": "3 Gb de Espaço em Disco"}'::jsonb
  ),
  (
    'enterprise',
    'ENTERPRISE',
    'Plano personalizado para grandes empresas',
    999999,
    999,
    999,
    NULL,
    NULL,
    NULL,
    '{"lives": "Mais de 500 vidas", "users": "Para empresas com mais de 500 vidas", "storage": "Consulte nosso time", "custom": true}'::jsonb
  )
ON CONFLICT (plan_id) DO NOTHING;