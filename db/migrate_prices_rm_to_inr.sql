-- Migration: Convert program and event prices from RM (Malaysian Ringgit) to INR (Indian Rupees)
-- Conversion rate: 1 RM = 22.5 INR
-- Date: April 2026

-- Update all program fees from RM to INR
UPDATE programs 
SET fees = ROUND(fees * 22.5, 2)
WHERE fees > 0;

-- Update all event fees from RM to INR
UPDATE events 
SET fee = ROUND(fee * 22.5, 2)
WHERE fee > 0;

-- Verification queries (run these to confirm the migration worked)
-- SELECT name, fees FROM programs;
-- SELECT event_name, fee FROM events WHERE fee > 0;
