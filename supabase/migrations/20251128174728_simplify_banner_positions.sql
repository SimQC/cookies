/*
  # Simplify Banner Positions

  1. Changes
    - Update position constraint to only allow 'top' and 'bottom'
    - Update existing banners with left/right positions to bottom

  2. Notes
    - Positions are now only top or bottom for inline display
    - Left and right positions don't make sense for inline banners
*/

-- Update existing banners with left/right positions
UPDATE platform_ads
SET position = 'bottom'
WHERE position IN ('left', 'right');

-- Drop old constraint
ALTER TABLE platform_ads DROP CONSTRAINT IF EXISTS platform_ads_position_check;

-- Add new constraint with only top and bottom
ALTER TABLE platform_ads 
ADD CONSTRAINT platform_ads_position_check 
CHECK (position IN ('top', 'bottom'));