import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/auth-context";

export interface CampaignTemplate {
  id: string;
  clinic_id: string;
  name: string;
  text: string;
  created_at: string;
  updated_at: string;
}

export function useCampaignTemplates() {
  const { clinic } = useAuth();
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!clinic) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("campaign_templates")
      .select("*")
      .eq("clinic_id", clinic.id)
      .order("name");

    if (!error && data) {
      setTemplates(data as CampaignTemplate[]);
    }
    setLoading(false);
  }, [clinic]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  async function createTemplate(name: string, text: string) {
    if (!clinic) return { error: "No hay clínica activa" };
    const { error } = await supabase.from("campaign_templates").insert({
      clinic_id: clinic.id,
      name: name.trim(),
      text: text.trim(),
    });
    return { error: error?.message || null };
  }

  async function updateTemplate(id: string, name: string, text: string) {
    if (!clinic) return { error: "No hay clínica activa" };
    const { error } = await supabase
      .from("campaign_templates")
      .update({ name: name.trim(), text: text.trim(), updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("clinic_id", clinic.id);
    return { error: error?.message || null };
  }

  async function deleteTemplate(id: string) {
    if (!clinic) return { error: "No hay clínica activa" };
    const { error } = await supabase
      .from("campaign_templates")
      .delete()
      .eq("id", id)
      .eq("clinic_id", clinic.id);
    return { error: error?.message || null };
  }

  return { templates, loading, refetch: fetchTemplates, createTemplate, updateTemplate, deleteTemplate };
}
