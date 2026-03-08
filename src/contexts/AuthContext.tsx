import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  displayName: string;
  tempPassword: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  clearTempPassword: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [tempPassword, setTempPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUserMeta = async (userId: string) => {
    try {
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError) throw roleError;
      setIsAdmin(!!roleData);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, temp_password")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) throw profileError;
      setDisplayName(profile?.display_name || "");
      setTempPassword(profile?.temp_password || false);
    } catch (err) {
      console.error("Error fetching user meta:", err);
      setIsAdmin(false);
      setDisplayName("");
      setTempPassword(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const hydrateAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        const u = session?.user ?? null;
        setUser(u);

        if (u) {
          await fetchUserMeta(u.id);
        } else {
          setIsAdmin(false);
          setDisplayName("");
          setTempPassword(false);
        }
      } catch (err) {
        console.error("Error restoring session:", err);
        if (mounted) {
          setUser(null);
          setIsAdmin(false);
          setDisplayName("");
          setTempPassword(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    hydrateAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);

      if (u) {
        void fetchUserMeta(u.id);
      } else {
        setIsAdmin(false);
        setDisplayName("");
        setTempPassword(false);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const clearTempPassword = () => setTempPassword(false);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, displayName, tempPassword, signIn, signOut, clearTempPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
