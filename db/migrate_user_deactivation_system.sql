-- Comprehensive Migration: User Account Deactivation System
-- Run this to set up user deactivation and fix any previously removed coaches

-- Step 1: Add is_active column to users table (if not already present)
ALTER TABLE users 
ADD COLUMN is_active BOOLEAN DEFAULT 1 AFTER preferred_sport;

-- Step 2: Deactivate user accounts for all inactive coaches
UPDATE users 
SET is_active = 0 
WHERE user_id IN (
  SELECT user_id FROM coaches 
  WHERE is_active = 0 AND user_id IS NOT NULL
);

-- Verification queries - run these to check the migration worked:
-- Check users table has is_active column and values:
-- SELECT user_id, name, email, role, is_active FROM users;

-- Check coaches and their linked users:
-- SELECT c.coach_id, c.name, c.is_active, u.user_id, u.name as user_name, u.is_active as user_active 
-- FROM coaches c 
-- LEFT JOIN users u ON c.user_id = u.user_id;

-- Check how many inactive coaches have inactive users:
-- SELECT COUNT(*) as deactivated_accounts 
-- FROM users 
-- WHERE is_active = 0 AND role = 'coach';
