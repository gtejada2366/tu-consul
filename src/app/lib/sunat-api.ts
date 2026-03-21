import { supabase } from "./supabase";

async function sunatFetch(path: string, options?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No hay sesión activa");

  const res = await fetch(`/api/sunat/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...options?.headers,
    },
  });

  const text = await res.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`Error del servidor: ${text.slice(0, 100)}`);
  }
  if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
  return body;
}

export const sunatApi = {
  getConfig: () => sunatFetch("config"),

  saveConfig: (data: Record<string, unknown>) =>
    sunatFetch("config", { method: "PUT", body: JSON.stringify(data) }),

  uploadCertificate: async (file: File, password: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No hay sesión activa");

    const formData = new FormData();
    formData.append("certificate", file);
    formData.append("password", password);

    const res = await fetch("/api/sunat/upload-certificate", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: formData,
    });

    const body = await res.json();
    if (!res.ok) throw new Error(body.error || `Error ${res.status}`);
    return body;
  },

  emit: (data: {
    invoice_id?: string;
    tipo: "01" | "03";
    cliente_tipo_doc: string;
    cliente_numero_doc: string;
    cliente_razon_social: string;
    cliente_direccion?: string;
    items: { descripcion: string; cantidad: number; precio_total: number }[];
  }) => sunatFetch("emit", { method: "POST", body: JSON.stringify(data) }),

  checkStatus: (ticket: string) =>
    sunatFetch("status", { method: "POST", body: JSON.stringify({ ticket }) }),
};
