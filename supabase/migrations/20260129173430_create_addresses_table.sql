/*
  # Create addresses table

  1. New Tables
    - `addresses`
      - `id` (uuid, primary key) - Unique identifier for each address
      - `customer_id` (uuid, foreign key) - References customers table
      - `cep` (text, not null) - Brazilian postal code
      - `street` (text, not null) - Street name
      - `number` (text, not null) - Street number
      - `complement` (text, nullable) - Additional address information
      - `neighborhood` (text, not null) - Neighborhood name
      - `city` (text, not null) - City name
      - `state` (text, not null) - State code (2 letters)
      - `is_default` (boolean) - Whether this is the customer's default address
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record last update timestamp

  2. Security
    - Enable RLS on `addresses` table
    - Add policy for public INSERT (new addresses can be created)
    - Add policy for public SELECT (addresses can be viewed)
    - Add policy for public UPDATE (addresses can be updated)

  3. Relationships
    - Foreign key to customers table with CASCADE delete
    - Index on customer_id for faster lookups

  4. Constraints
    - Check constraint to validate state is 2 characters
*/

CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  cep text NOT NULL,
  street text NOT NULL,
  number text NOT NULL,
  complement text,
  neighborhood text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT addresses_state_check CHECK (length(state) = 2)
);

-- Create index for faster customer address lookups
CREATE INDEX IF NOT EXISTS idx_addresses_customer_id ON addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_addresses_customer_default ON addresses(customer_id, is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Allow public INSERT for new addresses
CREATE POLICY "Allow public insert for addresses"
  ON addresses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow public SELECT to read addresses
CREATE POLICY "Allow public select for addresses"
  ON addresses
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow public UPDATE for addresses
CREATE POLICY "Allow public update for addresses"
  ON addresses
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();