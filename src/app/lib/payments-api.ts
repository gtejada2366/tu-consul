import { supabase } from "./supabase";

async function paymentFetch(path: string, options?: RequestInit) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No hay sesión activa");

  const res = await fetch(`/api/payments/${path}`, {
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

export const paymentsApi = {
  createPreference: (plan: "basic" | "premium") =>
    paymentFetch("create-preference", {
      method: "POST",
      body: JSON.stringify({ plan }),
    }) as Promise<{ init_point: string; sandbox_init_point: string; transaction_id: string }>,
};
