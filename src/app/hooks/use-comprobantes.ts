import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/auth-context";
import type { ComprobanteElectronico } from "../lib/types";

export function useComprobantes() {
  const { clinic } = useAuth();
  const [comprobantes, setComprobantes] = useState<ComprobanteElectronico[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!clinic) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("comprobantes_electronicos")
      .select("*")
      .eq("clinic_id", clinic.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching comprobantes:", error.message);
    } else if (data) {
      setComprobantes(data as unknown as ComprobanteElectronico[]);
    }
    setLoading(false);
  }, [clinic]);

  useEffect(() => { fetch(); }, [fetch]);

  return { comprobantes, loading, refetch: fetch };
}
