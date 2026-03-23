-- Add quantity column to potential_treatments
ALTER TABLE potential_treatments ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1;
