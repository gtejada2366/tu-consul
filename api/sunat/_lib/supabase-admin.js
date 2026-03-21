import { createClient } from "@supabase/supabase-js";

export function getAdminClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

export async function getClinicFromRequest(req) {
  const authHeader = req.headers.authorization || req.headers["Authorization"];
  const headerStr = String(authHeader || "");
  if (!headerStr.startsWith("Bearer ")) {
    throw new Error("No auth token");
  }

  const token = headerStr.slice(7).trim();
  if (!token) {
    throw new Error("No auth token");
  }
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");

  const anonClient = createClient(url, anonKey);
  const { data: { user }, error } = await anonClient.auth.getUser(token);
  if (error || !user) throw new Error("Token inválido o expirado");

  const admin = getAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("clinic_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("User profile not found");
  return { userId: user.id, clinicId: profile.clinic_id, role: profile.role };
}
