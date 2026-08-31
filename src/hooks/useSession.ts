import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface SessionState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

/** Tracks the current auth session in the browser. */
export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      setLoading(false);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export interface ProfileInfo {
  displayName: string | null;
  avatarUrl: string | null;
  role: string | null;
}

/** Loads the signed-in user's profile row and role. */
export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<ProfileInfo | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    let active = true;
    void (async () => {
      const [{ data: p }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      if (!active) return;
      setProfile({
        displayName: p?.display_name ?? null,
        avatarUrl: p?.avatar_url ?? null,
        role: roles?.[0]?.role ?? null,
      });
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  return profile;
}
