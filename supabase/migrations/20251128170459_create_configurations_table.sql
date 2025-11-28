/*
  # Create tarteaucitron configurations table

  1. New Tables
    - `configurations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text) - Configuration name for user reference
      - `config_data` (jsonb) - All tarteaucitron configuration options
      - `selected_services` (jsonb) - Array of selected services
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `configurations` table
    - Add policies for authenticated users to manage their own configurations
*/

CREATE TABLE IF NOT EXISTS configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  config_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  selected_services jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own configurations"
  ON configurations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own configurations"
  ON configurations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own configurations"
  ON configurations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own configurations"
  ON configurations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_configurations_user_id ON configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_configurations_created_at ON configurations(created_at DESC);