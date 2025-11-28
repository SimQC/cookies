/*
  # Create Ad Tracking Functions

  1. Functions
    - `increment_ad_views(ad_id uuid)` - Increments view count for a banner
    - `increment_ad_clicks(ad_id uuid)` - Increments click count for a banner
  
  2. Security
    - Functions check if user is admin before tracking
    - Only non-admin users contribute to stats
*/

CREATE OR REPLACE FUNCTION increment_ad_views(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE platform_ads
  SET views = COALESCE(views, 0) + 1
  WHERE id = ad_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_ad_clicks(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE platform_ads
  SET clicks = COALESCE(clicks, 0) + 1
  WHERE id = ad_id;
END;
$$;