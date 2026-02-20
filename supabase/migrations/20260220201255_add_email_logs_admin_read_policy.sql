/*
  # Add email_logs read policy for authenticated admin users

  ## Summary
  The email_logs table was created with RLS enabled but no read policies,
  meaning authenticated admin users couldn't view email history in the
  CustomerDetailsDialog. This migration adds a SELECT policy allowing
  authenticated users to read all email logs.

  ## Changes
  - Add SELECT policy on email_logs for authenticated users
*/

CREATE POLICY "Authenticated users can read email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (true);
