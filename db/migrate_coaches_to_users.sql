-- ============================================================
-- Athletica Coaches to Users Migration
-- Converts existing coaches into user accounts with role='coach'
-- Run once after updating schema.sql
-- ============================================================

USE athletica;

-- For each existing coach, create a corresponding user account
-- This script safely inserts users and links them to coaches

-- Step 1: Create coach user accounts (if not already created)
-- Be careful: we're using coach name and a generated email
INSERT INTO users (name, email, password, role, age_group, fitness_goal, preferred_sport)
SELECT 
  c.name,
  CONCAT(LOWER(REPLACE(c.name, ' ', '.')), '@athletica-coach.local', LPAD(c.coach_id, 3, '0')),
  '$2b$10$uDF0aVxmDFy5rwyZrYaA4eRxiRhxPex9Yvuaxm8EpwIdG6Hq4u4Xa', -- bcrypt hash of 'coach123'
  'coach',
  'adult',
  'strength',
  c.sport
FROM coaches c
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.user_id = c.user_id
)
AND c.user_id IS NULL;

-- Step 2: Link coaches to their newly created user accounts
UPDATE coaches c
JOIN users u ON 
  c.name = u.name 
  AND u.role = 'coach'
  AND c.user_id IS NULL
SET c.user_id = u.user_id;

-- Step 3: Verify linking worked
SELECT coach_id, c.user_id, c.name, u.name, u.role
FROM coaches c
LEFT JOIN users u ON c.user_id = u.user_id
ORDER BY c.coach_id;
