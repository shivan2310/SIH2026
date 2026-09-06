import { useState } from "react";
import {
  Bell,
  Sparkles,
  ExternalLink,
  Check,
  CheckCheck,
  Atom,
  Clock,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface QuantumNewsItem {
  id: string;
  title: string;
  category: "Hardware" | "Breakthrough" | "Platform" | "Research";
  summary: string;
  detail: string;
  source: string;
  timeAgo: string;
  unread: boolean;
  link?: string;
}

const INITIAL_NEWS: QuantumNewsItem[] = [
  {
    id: "news-1",
    title: "IBM Quantum Heron System Online",
    category: "Hardware",
    source: "IBM Quantum",
    timeAgo: "2h ago",
    unread: true,
    summary:
      "133-qubit Heron quantum processor deployed with 5x error reduction and real-time classical feedback control.",
    detail:
      "IBM has officially made the 133-qubit Heron processor available to cloud users. Heron delivers a 5-fold error reduction over Eagle and features real-time classical communication allowing dynamic circuits to run at scale.",
    link: "https://www.ibm.com/quantum",
  },
  {
    id: "news-2",
    title: "Google Quantum AI Error Correction Record",
    category: "Breakthrough",
    source: "Google Quantum AI",
    timeAgo: "5h ago",
    unread: true,
    summary:
      "Demonstrated surface code error rates below fault-tolerant threshold on scalable 2D grid.",
    detail:
      "Google's Quantum AI team published milestone results showing physical qubit error rates suppressed exponentially as surface code distance increases—a crucial prerequisite for commercial fault-tolerant quantum computing.",
    link: "https://quantumai.google/",
  },
  {
    id: "news-3",
    title: "QuantumLab 2.5: Live Bloch Vector Engine",
    category: "Platform",
    source: "QuantumLab Team",
    timeAgo: "1d ago",
    unread: true,
    summary:
      "Simulate multi-qubit entangled states in browser statevector engine with zero queue times.",
    detail:
      "We've updated QuantumLab with an upgraded pure-TypeScript simulation engine featuring step-by-step gate playback, amplitude & phase tables, and real-time 3D Bloch sphere projections.",
  },
  {
    id: "news-4",
    title: "Intercontinental Satellite QKD Achieved",
    category: "Research",
    source: "Nature Physics",
    timeAgo: "2d ago",
    unread: false,
    summary:
      "Ground-to-space quantum key distribution link operational over 1,200 km using entangled photon pairs.",
    detail:
      "Researchers successfully demonstrated satellite-based quantum key distribution (QKD) between ground stations over 1,200 kilometers apart, establishing tamper-proof orbital quantum communications.",
  },
  {
    id: "news-5",
    title: "Neutral-Atom Array Reaches 1,000 Qubits",
    category: "Hardware",
    source: "Harvard / QuEra",
    timeAgo: "3d ago",
    unread: false,
    summary:
      "Optical tweezer arrays position 1,000+ rubidium atomic qubits with 99.9% single-qubit fidelity.",
    detail:
      "QuEra and Harvard researchers unveiled a reconfigurable 1,000-qubit neutral-atom architecture. Dynamically moved optical tweezers allow arbitrary all-to-all qubit connectivity during algorithm execution.",
  },
];

export function QuantumNewsPopover() {
  const [news, setNews] = useState<QuantumNewsItem[]>(INITIAL_NEWS);
  const [selectedNews, setSelectedNews] = useState<QuantumNewsItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const unreadCount = news.filter((item) => item.unread).length;

  const markAllRead = () => {
    setNews((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const markItemRead = (id: string) => {
    setNews((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
  };

  const filteredNews =
    activeFilter === "All"
      ? news
      : news.filter((item) => item.category === activeFilter);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Quantum World News Notifications"
          className="relative inline-flex items-center justify-center p-2 rounded-full text-[#707070] transition-colors hover:bg-gray-100 hover:text-[#111111] focus:outline-none cursor-pointer"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#F47F45] ring-2 ring-white"></span>
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[380px] sm:w-[420px] p-0 bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden font-sans text-[#111111]"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#FF8C42] via-[#F47F45] to-[#EA580C] px-5 py-4 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-md">
                <Atom className="h-5 w-5 text-white animate-spin [animation-duration:8s]" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                  Quantum World News
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 font-mono text-[10px] font-bold text-white uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Feed
                  </span>
                </h3>
                <p className="text-xs text-orange-100 font-medium">
                  Breakthroughs, hardware & research updates
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                title="Mark all as read"
                className="flex items-center gap-1 text-xs font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Read all
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
            {["All", "Hardware", "Breakthrough", "Platform", "Research"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveFilter(cat)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeFilter === cat
                    ? "bg-white text-[#EA580C] shadow-xs"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Article Detail View */}
        {selectedNews ? (
          <div className="p-5 bg-orange-50/30">
            <button
              type="button"
              onClick={() => setSelectedNews(null)}
              className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-[#F47F45] hover:text-[#EA580C] cursor-pointer"
            >
              ← Back to all news
            </button>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-orange-500 text-white font-bold text-[10px]">
                {selectedNews.category}
              </Badge>
              <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {selectedNews.timeAgo}
              </span>
              <span className="text-xs font-bold text-gray-700 ml-auto">
                {selectedNews.source}
              </span>
            </div>

            <h4 className="text-base font-bold text-[#111111] leading-snug mb-2">
              {selectedNews.title}
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed font-medium mb-4">
              {selectedNews.detail}
            </p>

            {selectedNews.link && (
              <a
                href={selectedNews.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F47F45] hover:underline"
              >
                Read full publication on {selectedNews.source}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        ) : (
          /* News Feed List */
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 custom-scrollbar">
            {filteredNews.length === 0 ? (
              <div className="py-10 text-center text-xs font-medium text-gray-500">
                No news found in this category.
              </div>
            ) : (
              filteredNews.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    markItemRead(item.id);
                    setSelectedNews(item);
                  }}
                  className={`group p-4 transition-colors hover:bg-orange-50/50 cursor-pointer relative ${
                    item.unread ? "bg-orange-50/20" : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      {item.unread && (
                        <span className="h-2 w-2 rounded-full bg-[#F47F45] shrink-0" />
                      )}
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider rounded-md px-1.5 py-0.5 ${
                          item.category === "Hardware"
                            ? "bg-blue-100 text-blue-800"
                            : item.category === "Breakthrough"
                            ? "bg-amber-100 text-amber-800"
                            : item.category === "Platform"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.category}
                      </span>
                      <span className="text-[11px] font-bold text-gray-500">
                        {item.source}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">
                      {item.timeAgo}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#111111] group-hover:text-[#EA580C] transition-colors leading-snug">
                    {item.title}
                  </h4>
                  <p className="mt-1 text-xs text-gray-600 font-medium line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between pt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F47F45] group-hover:translate-x-0.5 transition-transform">
                      Read full story
                      <ChevronRight className="h-3 w-3" />
                    </span>

                    {item.unread ? (
                      <span className="text-[10px] font-semibold text-orange-600 bg-orange-100/60 px-2 py-0.5 rounded-full">
                        New
                      </span>
                    ) : (
                      <Check className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50/80 px-4 py-2.5 text-center flex items-center justify-between text-xs font-semibold text-gray-500">
          <span className="flex items-center gap-1.5 text-gray-600">
            <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
            Curated Quantum News Feed
          </span>
          <span className="text-[#F47F45] font-bold">QuantumLab Hub</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
