-- Migration: Remove duplicate coaches and add unique constraint
-- This prevents duplicate coaches from being displayed

-- First, check for duplicates (run to see what needs to be cleaned)
-- SELECT name, sport, COUNT(*) as count FROM coaches WHERE is_active = 1 GROUP BY name, sport HAVING count > 1;

-- Remove duplicates - keep only the first entry for each (name, sport) combination
DELETE FROM coaches 
WHERE is_active = 1 AND coach_id NOT IN (
  SELECT MIN(coach_id) 
  FROM coaches 
  WHERE is_active = 1
  GROUP BY name, sport
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE coaches 
ADD UNIQUE KEY unique_coach_name_sport (name, sport);

-- Verify the cleanup
-- SELECT coach_id, name, sport, is_active FROM coaches ORDER BY coach_id;
