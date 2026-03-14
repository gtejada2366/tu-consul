-- ============================================================
-- Migration: Add filiation fields to patients table
-- Run each ALTER TABLE statement separately in Supabase SQL Editor
-- ============================================================

-- Personal data extensions
ALTER TABLE patients ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS document_number TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS marital_status TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS occupation TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS education_level TEXT;

-- Contact extensions
ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone_mobile TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address_reference TEXT;

-- Emergency contact (1-to-1, stored in same table)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- Medical background
ALTER TABLE patients ADD COLUMN IF NOT EXISTS chronic_conditions TEXT[] DEFAULT '{}';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS current_medications TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS previous_surgeries TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS hospitalizations TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS family_history TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_pregnant BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_breastfeeding BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS smoking BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS alcohol_consumption BOOLEAN DEFAULT FALSE;

-- Dental background
ALTER TABLE patients ADD COLUMN IF NOT EXISTS previous_dental_treatments TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS bruxism BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS dental_sensitivity BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS bleeding_gums BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS orthodontic_history BOOLEAN DEFAULT FALSE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_dental_visit DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS dental_hygiene_frequency TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS dental_notes TEXT;

-- Insurance
ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_company TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_plan TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_member_number TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_effective_date DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE;
