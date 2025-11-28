/*
  # Setup Authentication and Banner Management System

  1. Tables Structure
    - `profiles` - User profile information
      - `id` (uuid, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `configurations` - User cookie banner configurations
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `config_data` (jsonb)
      - `selected_services` (jsonb)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `banners` - Advertisement banners
      - `id` (uuid, primary key)
      - `config_id` (uuid, references configurations)
      - `image_url` (text)
      - `link_url` (text)
      - `position` (text) - top, bottom, left, right
      - `is_active` (boolean)
      - `display_order` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Public read access for active banners

  3. Indexes
    - Create indexes for performance optimization
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Update configurations table
DROP TABLE IF EXISTS configurations CASCADE;

CREATE TABLE configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL DEFAULT 'Ma configuration',
  config_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  selected_services jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
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

-- Public read access for serving configurations via edge function
CREATE POLICY "Public can read active configurations"
  ON configurations FOR SELECT
  TO anon
  USING (is_active = true);

-- Banners table
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid REFERENCES configurations(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  link_url text NOT NULL,
  position text DEFAULT 'bottom' CHECK (position IN ('top', 'bottom', 'left', 'right')),
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own banners"
  ON banners FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM configurations
      WHERE configurations.id = banners.config_id
      AND configurations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own banners"
  ON banners FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM configurations
      WHERE configurations.id = banners.config_id
      AND configurations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own banners"
  ON banners FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM configurations
      WHERE configurations.id = banners.config_id
      AND configurations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM configurations
      WHERE configurations.id = banners.config_id
      AND configurations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own banners"
  ON banners FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM configurations
      WHERE configurations.id = banners.config_id
      AND configurations.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can read active banners"
  ON banners FOR SELECT
  TO anon
  USING (is_active = true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_configurations_user_id ON configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_configurations_active ON configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_config_id ON banners(config_id);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();