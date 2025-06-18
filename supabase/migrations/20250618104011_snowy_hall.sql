/*
  # Add unique constraint to subscribers.user_id

  1. Database Changes
    - Add unique constraint to `user_id` column in `subscribers` table
    - This allows upsert operations using `onConflict: 'user_id'`
    - Ensures each user can only have one subscription record

  2. Data Safety
    - Uses conditional logic to handle existing duplicate records
    - Keeps the most recent record if duplicates exist
    - Safe to run multiple times (idempotent)
*/

-- First, remove any duplicate user_id records, keeping only the most recent one
DO $$
BEGIN
  -- Delete duplicate records, keeping only the one with the latest updated_at
  DELETE FROM subscribers s1
  WHERE s1.user_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM subscribers s2 
      WHERE s2.user_id = s1.user_id 
        AND s2.updated_at > s1.updated_at
    );
END $$;

-- Add unique constraint on user_id if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'subscribers_user_id_key' 
      AND table_name = 'subscribers'
      AND constraint_type = 'UNIQUE'
  ) THEN
    ALTER TABLE subscribers ADD CONSTRAINT subscribers_user_id_key UNIQUE (user_id);
  END IF;
END $$;