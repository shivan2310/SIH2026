import { Link } from "@tanstack/react-router";
import { Search, Bell, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile, useSession } from "@/hooks/useSession";

export function LabTopNav() {
  const { user } = useSession();
  const profile = useProfile(user?.id);
  const name = profile?.displayName ?? user?.email ?? "Shivank";
  const initials = name.slice(0, 2).toUpperCase();

  const topNavItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Learn", to: "/learn" },
    { label: "Circuit Lab", to: "/lab", isActive: true },
    { label: "Simulations", to: "#" },
    { label: "Resources", to: "#" },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[#E5E7EB] bg-white px-8">
      {/* Navigation */}
      <nav className="flex items-center gap-6">
        {topNavItems.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className={`text-sm font-semibold transition-colors hover:text-[#111111] ${
              item.isActive ? "text-[#F47F45] border-b-2 border-[#F47F45] py-5" : "text-[#707070] py-5 border-b-2 border-transparent"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Right Side */}
      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-[#707070]" />
          <input
            type="text"
            placeholder="Search gates, topics, or ask AI..."
            className="w-80 rounded-full border border-[#E5E7EB] bg-gray-50 py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[#F47F45] focus:bg-white focus:ring-1 focus:ring-[#F47F45]/20"
          />
        </div>

        {/* Notifications */}
        <button className="relative text-[#707070] hover:text-[#111111]">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#FF6680] ring-2 ring-white" />
        </button>

        {/* User Profile */}
        {user && (
          <button className="flex items-center gap-2 rounded-full pl-2 hover:bg-gray-50 p-1">
            <span className="text-sm font-medium text-[#111111]">Hi, {name.split(" ")[0]}</span>
            <Avatar className="h-8 w-8 ml-1">
              {profile?.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="" />}
              <AvatarFallback className="bg-gray-100 text-[#111111] text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="h-4 w-4 text-[#707070]" />
          </button>
        )}
      </div>
    </header>
  );
}
