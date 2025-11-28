/*
  # Create Admin System and Platform Advertisement Banners

  1. Tables Updates
    - Update `profiles` table to add role field
    - Create `platform_ads` table for Biscuits platform advertisements
    - Remove banner relationship from configurations
    - Drop old banners table
  
  2. New Tables
    - `platform_ads` - Platform-wide advertisement banners managed by admins
      - `id` (uuid, primary key)
      - `title` (text)
      - `image_url` (text)
      - `link_url` (text)
      - `position` (text) - top, bottom, left, right
      - `is_active` (boolean)
      - `display_order` (integer)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Security
    - Enable RLS on all tables
    - Admin users can manage platform_ads
    - All users can view active platform_ads
    - Update profiles policies

  4. Notes
    - Admins are identified by role = 'admin' in profiles table
    - Platform ads are shown on all Biscuits pages and in generated code
*/

-- Drop old banners table
DROP TABLE IF EXISTS banners CASCADE;

-- Add role to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- Create platform_ads table
CREATE TABLE IF NOT EXISTS platform_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  link_url text NOT NULL,
  position text DEFAULT 'bottom' CHECK (position IN ('top', 'bottom', 'left', 'right')),
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active platform ads"
  ON platform_ads FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all platform ads"
  ON platform_ads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert platform ads"
  ON platform_ads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update platform ads"
  ON platform_ads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete platform ads"
  ON platform_ads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_platform_ads_active ON platform_ads(is_active);
CREATE INDEX IF NOT EXISTS idx_platform_ads_order ON platform_ads(display_order);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default platform ads (the two banners you provided)
INSERT INTO platform_ads (title, image_url, link_url, position, is_active, display_order)
VALUES
  ('Idée Littéraire', 'https://annuairelitteraire.com/wp-content/uploads/2025/07/banniere-idee-litteraire.gif', 'https://ideelitteraire.com', 'bottom', true, 1),
  ('Bandes Annonces Littéraires', 'https://annuairelitteraire.com/wp-content/uploads/2025/11/banniere-bd.gif', 'https://simonlacroix.net/produit/bandes-annonces-litteraires/', 'bottom', true, 2)
ON CONFLICT DO NOTHING;