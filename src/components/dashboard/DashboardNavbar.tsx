import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Atom, Search, Bell, ChevronDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/actions";
import { useProfile, useSession } from "@/hooks/useSession";
import { toast } from "sonner";

export function DashboardNavbar() {
  const { user } = useSession();
  const profile = useProfile(user?.id);
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  const name = profile?.displayName ?? user?.email ?? "Shivank";
  const initials = name.slice(0, 2).toUpperCase();

  const navItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Courses", to: "/learn" },
    { label: "Schedule", to: "#" },
    { label: "Assignments", to: "#" },
    { label: "Circuit Lab", to: "/lab" },
    { label: "Challenges", to: "/challenges" },
  ];

  async function handleSignOut() {
    await signOut();
    await queryClient.invalidateQueries({ queryKey: ["session"] });
    void router.invalidate();
    toast.success("Signed out");
    void navigate({ to: "/" });
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-[#E7E7E7] bg-white text-[#111111]">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-6">
        {/* Left: Logo and NavLinks */}
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2">
            <Atom className="h-6 w-6 text-[#111111]" />
            <span className="font-sans text-xl font-bold tracking-tight text-[#111111]">
              Quantum<span className="text-[#F89864]">Lab</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="relative rounded-full px-4 py-2 text-sm font-medium text-[#707070] transition-colors hover:bg-gray-100 hover:text-[#111111]"
                activeProps={{ className: "bg-gray-100 text-[#111111]" }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Actions and User */}
        <div className="flex items-center gap-5">
          <button className="text-[#707070] hover:text-[#111111]">
            <Search className="h-5 w-5" />
          </button>
          
          <button className="relative text-[#707070] hover:text-[#111111]">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-[#F47F45] ring-2 ring-white"></span>
          </button>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full p-1 pl-2 hover:bg-gray-50 focus:outline-none">
                  <Avatar className="h-8 w-8">
                    {profile?.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="" />}
                    <AvatarFallback className="bg-gray-100 text-[#111111] text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium text-[#111111] md:block">
                    {name}
                  </span>
                  <ChevronDown className="h-4 w-4 text-[#707070]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white text-[#111111]">
                <DropdownMenuLabel className="truncate">
                  <span className="block text-sm">{name}</span>
                  <span className="text-xs uppercase tracking-widest text-[#707070]">
                    {profile?.role ?? "student"}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/circuits" className="cursor-pointer">My circuits</Link>
                </DropdownMenuItem>
                {(profile?.role === "instructor" || profile?.role === "admin") && (
                  <DropdownMenuItem asChild>
                    <Link to="/instructor" className="cursor-pointer">Instructor</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
}
