/*
  # Simplify to Single Banner Position

  1. Changes
    - Remove position column from platform_ads table
    - Banners now rotate in a single position below header
    - Update existing data

  2. Notes
    - All banners are shown in rotation regardless of position
    - Position field is no longer needed
*/

-- Drop the position constraint first
ALTER TABLE platform_ads DROP CONSTRAINT IF EXISTS platform_ads_position_check;

-- Remove the position column
ALTER TABLE platform_ads DROP COLUMN IF EXISTS position;