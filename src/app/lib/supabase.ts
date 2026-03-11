import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. " +
    "Configúralas en el archivo .env.local"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Client that does NOT persist its auth session — used for admin sign-up of other users */
export const supabaseNoSession = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});
