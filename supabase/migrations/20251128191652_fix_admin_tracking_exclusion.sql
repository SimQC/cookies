/*
  # Fix Admin Tracking Exclusion for Banner Stats

  1. Changes
    - Update `increment_ad_views` function to exclude admin users from tracking
    - Update `increment_ad_clicks` function to exclude admin users from tracking
    - Functions now check if user is admin before incrementing counters
  
  2. Security
    - Only non-admin authenticated users contribute to statistics
    - Admin views and clicks are completely excluded from metrics
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS increment_ad_views(uuid);
DROP FUNCTION IF EXISTS increment_ad_clicks(uuid);

-- Create improved function to increment ad views (excludes admins)
CREATE OR REPLACE FUNCTION increment_ad_views(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_is_admin boolean;
BEGIN
  -- Check if the current user is an admin
  SELECT is_admin INTO user_is_admin
  FROM profiles
  WHERE id = auth.uid();
  
  -- Only increment if user is not an admin
  IF user_is_admin IS NOT TRUE THEN
    UPDATE platform_ads
    SET views = COALESCE(views, 0) + 1
    WHERE id = ad_id;
  END IF;
END;
$$;

-- Create improved function to increment ad clicks (excludes admins)
CREATE OR REPLACE FUNCTION increment_ad_clicks(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_is_admin boolean;
BEGIN
  -- Check if the current user is an admin
  SELECT is_admin INTO user_is_admin
  FROM profiles
  WHERE id = auth.uid();
  
  -- Only increment if user is not an admin
  IF user_is_admin IS NOT TRUE THEN
    UPDATE platform_ads
    SET clicks = COALESCE(clicks, 0) + 1
    WHERE id = ad_id;
  END IF;
END;
$$;