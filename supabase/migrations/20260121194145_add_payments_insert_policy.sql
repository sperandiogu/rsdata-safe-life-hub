/*
  # Add Insert Policy for Payments Table

  1. Security Changes
    - Add policy to allow anonymous users to insert payments
    - This is needed for the checkout flow where payments are recorded before user authentication

  2. Notes
    - Only INSERT is allowed for anon users
    - SELECT, UPDATE, DELETE remain restricted to service_role
*/

CREATE POLICY "Allow anonymous payment inserts"
  ON payments
  FOR INSERT
  TO anon
  WITH CHECK (true);
