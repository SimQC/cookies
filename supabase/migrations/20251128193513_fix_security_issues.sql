/*
  # Fix Security and Performance Issues

  1. Indexes
    - Add missing index on platform_ads.created_by (foreign key)
    - Remove unused indexes (profiles.email, profiles.role, configurations.is_active, platform_ads.is_active)

  2. RLS Performance Optimization
    - Update all RLS policies to use (select auth.uid()) pattern
    - This prevents re-evaluation of auth.uid() for each row

  3. Policy Consolidation
    - Merge multiple permissive SELECT policies on platform_ads

  4. Function Security
    - Add SET search_path to all functions to prevent search_path attacks
*/

-- Add missing index on foreign key
CREATE INDEX IF NOT EXISTS idx_platform_ads_created_by ON platform_ads(created_by);

-- Remove unused indexes
DROP INDEX IF EXISTS idx_profiles_email;
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_configurations_active;
DROP INDEX IF EXISTS idx_platform_ads_active;

-- Drop all existing policies to recreate them with optimized patterns
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own configurations" ON configurations;
DROP POLICY IF EXISTS "Users can insert own configurations" ON configurations;
DROP POLICY IF EXISTS "Users can update own configurations" ON configurations;
DROP POLICY IF EXISTS "Users can delete own configurations" ON configurations;

DROP POLICY IF EXISTS "Anyone can view active platform ads" ON platform_ads;
DROP POLICY IF EXISTS "Admins can view all platform ads" ON platform_ads;
DROP POLICY IF EXISTS "Admins can insert platform ads" ON platform_ads;
DROP POLICY IF EXISTS "Admins can update platform ads" ON platform_ads;
DROP POLICY IF EXISTS "Admins can delete platform ads" ON platform_ads;

-- Recreate profiles policies with optimized auth check
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- Recreate configurations policies with optimized auth check
CREATE POLICY "Users can view own configurations"
  ON configurations FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own configurations"
  ON configurations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own configurations"
  ON configurations FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own configurations"
  ON configurations FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Recreate platform_ads policies with consolidated SELECT policy and optimized auth check
CREATE POLICY "View active platform ads"
  ON platform_ads FOR SELECT
  USING (
    is_active = true 
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert platform ads"
  ON platform_ads FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update platform ads"
  ON platform_ads FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete platform ads"
  ON platform_ads FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- Fix function search_path issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION set_user_as_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE profiles
  SET role = 'admin'
  WHERE email = user_email;
END;
$$;

CREATE OR REPLACE FUNCTION increment_ad_views(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_is_admin boolean;
BEGIN
  SELECT is_admin INTO user_is_admin
  FROM profiles
  WHERE id = auth.uid();
  
  IF user_is_admin IS NOT TRUE THEN
    UPDATE platform_ads
    SET views = COALESCE(views, 0) + 1
    WHERE id = ad_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION increment_ad_clicks(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_is_admin boolean;
BEGIN
  SELECT is_admin INTO user_is_admin
  FROM profiles
  WHERE id = auth.uid();
  
  IF user_is_admin IS NOT TRUE THEN
    UPDATE platform_ads
    SET clicks = COALESCE(clicks, 0) + 1
    WHERE id = ad_id;
  END IF;
END;
$$;