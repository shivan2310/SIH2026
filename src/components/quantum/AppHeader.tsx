import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Atom, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "@/lib/auth/actions";
import { useProfile, useSession } from "@/hooks/useSession";

const NAV = [
  { to: "/", label: "Overview" },
  { to: "/lab", label: "Circuit Lab" },
  { to: "/learn", label: "Learn" },
  { to: "/challenges", label: "Challenges" },
  { to: "/backends", label: "Backends" },
] as const;


export function AppHeader() {
  const { user, loading } = useSession();
  const profile = useProfile(user?.id);
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  const name = profile?.displayName ?? user?.email ?? "";
  const initials = name.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await signOut();
    await queryClient.invalidateQueries({ queryKey: ["session"] });
    void router.invalidate();
    toast.success("Signed out");
    void navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-6 px-4">
        <Link to="/" className="flex items-center gap-2">
          <Atom className="h-5 w-5 text-primary" />
          <span className="font-mono text-sm font-bold tracking-[0.2em] text-foreground">
            QUANTUM<span className="text-primary">LAB</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "bg-secondary text-foreground" }}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <Link
              to="/dashboard"
              activeProps={{ className: "bg-secondary text-foreground" }}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
          )}
          {user && (
            <Link
              to="/circuits"
              activeProps={{ className: "bg-secondary text-foreground" }}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              My circuits
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {!loading && !user && (
            <Button asChild size="sm" variant="outline">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Account menu"
                >
                  <Avatar className="h-8 w-8">
                    {profile?.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="" />}
                    <AvatarFallback className="font-mono text-[0.65rem]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  <span className="block text-sm">{name}</span>
                  <span className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                    {profile?.role ?? "student"}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/circuits">My circuits</Link>
                </DropdownMenuItem>
                {(profile?.role === "instructor" || profile?.role === "admin") && (
                  <DropdownMenuItem asChild>
                    <Link to="/instructor">Instructor</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
