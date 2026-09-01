import { useQuery } from "@tanstack/react-query";
import { getAuthSession, getUserProfile } from "@/lib/auth/actions";

export interface User {
  id: string;
  email: string;
}

export interface SessionState {
  session: { user: User } | null;
  user: User | null;
  loading: boolean;
}

/** Tracks the current auth session. */
export function useSession(): SessionState {
  const { data, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: () => getAuthSession(),
  });

  return {
    session: data?.user ? { user: data.user } : null,
    user: data?.user ?? null,
    loading: isLoading,
  };
}

export interface ProfileInfo {
  displayName: string | null;
  avatarUrl: string | null;
  role: string | null;
}

/** Loads the signed-in user's profile row and role. */
export function useProfile(userId: string | undefined) {
  const { data } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getUserProfile({ data: { userId } }),
    enabled: !!userId,
  });

  return (data as ProfileInfo) ?? null;
}
