-- Migration: Add is_active field to users table
-- This allows deactivating user accounts when coaches are removed

-- Add is_active column to users table
ALTER TABLE users 
ADD COLUMN is_active BOOLEAN DEFAULT 1 AFTER preferred_sport;

-- Verify the migration
-- SELECT user_id, name, role, is_active FROM users;
