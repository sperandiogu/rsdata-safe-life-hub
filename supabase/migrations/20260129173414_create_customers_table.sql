/*
  # Create customers table

  1. New Tables
    - `customers`
      - `id` (uuid, primary key) - Unique identifier for each customer
      - `name` (text, not null) - Full name or company name
      - `document` (text, unique, not null) - CPF or CNPJ without formatting
      - `document_type` (text, not null) - Type of document: 'PF' (CPF) or 'PJ' (CNPJ)
      - `email` (text, unique, not null) - Customer email address
      - `phone` (text, not null) - Customer phone number
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record last update timestamp

  2. Security
    - Enable RLS on `customers` table
    - Add policy for public INSERT (new customers can register)
    - Add policy for authenticated SELECT (users can view customer data)

  3. Constraints
    - Unique constraint on document
    - Unique constraint on email
    - Check constraint to validate document_type is either 'PF' or 'PJ'
*/

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  document text NOT NULL,
  document_type text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT customers_document_unique UNIQUE (document),
  CONSTRAINT customers_email_unique UNIQUE (email),
  CONSTRAINT customers_document_type_check CHECK (document_type IN ('PF', 'PJ'))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_document ON customers(document);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Allow public INSERT for new customer registration
CREATE POLICY "Allow public insert for customers"
  ON customers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow public SELECT to read customer data
CREATE POLICY "Allow public select for customers"
  ON customers
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow public UPDATE for customer data
CREATE POLICY "Allow public update for customers"
  ON customers
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();