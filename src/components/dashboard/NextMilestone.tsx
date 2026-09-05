import { Trophy, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export interface NextMilestoneProps {
  trackTitle: string;
  completedLessons: number;
  totalLessons: number;
  message: string;
}

export function NextMilestone({ trackTitle, completedLessons, totalLessons, message }: NextMilestoneProps) {
  const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="flex h-full flex-col justify-center rounded-2xl border border-[#E7E7E7] bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-[#F47F45]" />
        <h2 className="text-lg font-bold text-[#111111]">Next Milestone</h2>
      </div>

      <div className="flex items-center justify-between gap-6">
        <div className="flex-1">
          <p className="mb-2 text-base font-bold text-[#111111]">
            Complete the {trackTitle} track
          </p>
          
          <div className="mb-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F5F5F5]">
              <div
                className="h-full rounded-full bg-[#F89864]"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[#111111]">{completedLessons} / {totalLessons} lessons</span>
          </div>

          <p className="text-sm font-medium text-[#707070]">
            {message}
          </p>
        </div>

        <Link 
          to="/learn" 
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] text-[#707070] transition-colors hover:bg-[#F89864] hover:text-white"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
