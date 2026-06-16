-- Migration: Add is_active field to coaches table
-- This allows soft-deletion of coaches while preserving data integrity

-- Add is_active column if it doesn't exist
ALTER TABLE coaches 
ADD COLUMN is_active BOOLEAN DEFAULT 1 AFTER photo_url;

-- Verify the migration
-- SELECT coach_id, name, is_active FROM coaches;
