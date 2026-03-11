import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { User, Clinic } from "../lib/types";

interface AuthState {
  session: Session | null;
  user: User | null;
  clinic: Clinic | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile and clinic data
  async function loadUserProfile(userId: string) {
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (profile) {
      setUser(profile as unknown as User);

      const { data: clinicData } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", (profile as Record<string, string>).clinic_id)
        .single();

      if (clinicData) {
        setClinic(clinicData as unknown as Clinic);
      }
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        loadUserProfile(s.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        if (s?.user) {
          loadUserProfile(s.user.id);
        } else {
          setUser(null);
          setClinic(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setClinic(null);
  }

  async function refreshUser() {
    if (session?.user) {
      await loadUserProfile(session.user.id);
    }
  }

  return (
    <AuthContext.Provider value={{ session, user, clinic, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
