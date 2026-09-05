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
import { useState, useEffect } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TRACKS, LESSONS } from "@/lib/learn/content";

export function DashboardNavbar() {
  const { user } = useSession();
  const profile = useProfile(user?.id);
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const name = profile?.displayName ?? user?.email ?? "Shivank";
  const initials = name.slice(0, 2).toUpperCase();

  const navItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Courses", to: "/learn" },
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
              Quantum<span className="text-[#111111]">Lab</span>
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
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-2 text-[#707070] hover:text-[#111111] transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-white border-[#E7E7E7] text-[#111111]" align="end">
              <Command className="bg-white">
                <CommandInput 
                  placeholder="Search courses and lessons..." 
                  className="text-[#111111] placeholder:text-[#707070]" 
                />
                <CommandList>
                  <CommandEmpty className="py-6 text-center text-sm text-[#707070]">No results found.</CommandEmpty>
                  {TRACKS.map((track) => (
                    <CommandGroup 
                      key={track.id} 
                      heading={track.title}
                      className="[&_[cmdk-group-heading]]:text-[#707070]"
                    >
                      {track.lessonIds.map((lessonId) => {
                        const lesson = LESSONS.find((l) => l.id === lessonId);
                        if (!lesson) return null;
                        return (
                          <CommandItem
                            key={lesson.id}
                            className="data-[selected=true]:bg-[#FFF0E6] data-[selected=true]:text-[#F47F45] text-[#111111] cursor-pointer"
                            onSelect={() => {
                              setSearchOpen(false);
                              void navigate({ to: `/learn/${lesson.id}` });
                            }}
                          >
                            {lesson.title}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          <button className="relative text-[#707070] hover:text-[#111111]">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-[#F47F45] ring-2 ring-white"></span>
          </button>

          {user ? (
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
          ) : (
            <Link
              to="/auth"
              className="rounded-full bg-[#F47F45] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#E56A2D]"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
