-- ============================================================
-- Migration: Create campaign_templates table for custom templates
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_templates_clinic ON campaign_templates(clinic_id);

ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_templates_select" ON campaign_templates
  FOR SELECT USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

CREATE POLICY "campaign_templates_insert" ON campaign_templates
  FOR INSERT WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

CREATE POLICY "campaign_templates_update" ON campaign_templates
  FOR UPDATE USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

CREATE POLICY "campaign_templates_delete" ON campaign_templates
  FOR DELETE USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));
