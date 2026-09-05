import { Link } from "@tanstack/react-router";
import { Atom, LayoutDashboard, BookOpen, CircuitBoard, PlaySquare, Target, FileText, Sparkles, Users } from "lucide-react";

export function LabSidebar() {
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
    { label: "Courses", icon: BookOpen, to: "/learn" },
    { label: "Circuit Lab", icon: CircuitBoard, to: "/lab", isActive: true },
    { label: "Simulations", icon: PlaySquare, to: "#" },
    { label: "Challenges", icon: Target, to: "/challenges" },
    { label: "Notes", icon: FileText, to: "#" },
    { label: "AI Tutor", icon: Sparkles, to: "#" },
    { label: "Community", icon: Users, to: "#" },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-[#E5E7EB] bg-white">
      {/* Header */}
      <div className="flex flex-col p-6 pb-2">
        <Link to="/" className="flex items-center gap-2 mb-1">
          <Atom className="h-6 w-6 text-[#111111]" />
          <span className="font-sans text-xl font-bold tracking-tight text-[#111111]">
            Quantum<span className="text-[#F47F45]">Lab</span>
          </span>
        </Link>
        <span className="text-xs font-medium text-[#707070]">Explore. Build. Understand.</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              item.isActive
                ? "bg-[#F47F45]/10 text-[#F47F45]"
                : "text-[#707070] hover:bg-gray-50 hover:text-[#111111]"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Promotional Card */}
      <div className="p-4">
        <div className="flex flex-col rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-4 border border-purple-100">
          <Atom className="h-5 w-5 text-[#F47F45] mb-2" />
          <h4 className="text-sm font-bold text-[#111111]">Quantum for a Brighter Tomorrow</h4>
          <p className="mt-1 text-xs font-medium text-[#707070]">Learn. Build. Create.</p>
        </div>
      </div>
    </aside>
  );
}
