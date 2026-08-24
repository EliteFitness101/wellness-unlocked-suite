import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  display_name: string;
  gender: string | null;
  theme: "feminine" | "masculine" | "neutral";
  goal: string | null;
  xp: number;
  streak: number;
  referral_code: string;
  is_public: boolean;
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      let row = data;
      if (!row) {
        const { data: created } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            display_name:
              (user.user_metadata?.["display_name"] as string) ?? user.email?.split("@")[0] ?? "Member",
          })
          .select("*")
          .maybeSingle();
        row = created;
      }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (cancelled) return;
      setProfile((row as Profile) ?? null);
      setIsAdmin((roles ?? []).some((r) => r.role === "admin" || r.role === "ambassador"));
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const refreshProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setProfile((data as Profile) ?? null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { session, user, profile, isAdmin, loading, refreshProfile, signOut };
}
