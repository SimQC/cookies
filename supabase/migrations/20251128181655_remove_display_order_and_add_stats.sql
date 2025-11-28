/*
  # Remove Display Order and Add Statistics

  1. Changes
    - Remove display_order column from platform_ads table
    - Add click tracking columns (views, clicks, click_through_rate)
    - Add statistics view for admin dashboard

  2. Notes
    - Banners are now shown in random order
    - Statistics will track banner performance
    - CTR (Click Through Rate) calculated as clicks/views
*/

-- Remove display_order column
ALTER TABLE platform_ads DROP COLUMN IF EXISTS display_order;

-- Add statistics columns to platform_ads
ALTER TABLE platform_ads ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE platform_ads ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0;
ALTER TABLE platform_ads ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ;