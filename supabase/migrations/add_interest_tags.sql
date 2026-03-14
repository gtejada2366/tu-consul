-- Add interest_tags column to patients for marketing segmentation
ALTER TABLE patients ADD COLUMN IF NOT EXISTS interest_tags TEXT[] DEFAULT '{}';
