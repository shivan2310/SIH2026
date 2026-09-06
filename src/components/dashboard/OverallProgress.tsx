import { BookOpen, Target, Brain, Flame } from "lucide-react";

interface OverallProgressProps {
  completedLessons: number;
  totalLessons: number;
  solvedChallenges: number;
  totalChallenges: number;
  conceptsMastered: number;
  streak: number;
}

export function OverallProgress({
  completedLessons,
  totalLessons,
  solvedChallenges,
  totalChallenges,
  conceptsMastered,
  streak,
}: OverallProgressProps) {
  // Calculate a generic progress percentage for the ring.
  // In reality, this could be a weighted average. We'll use a simple ratio for demonstration.
  const totalItems = totalLessons + totalChallenges;
  const completedItems = completedLessons + solvedChallenges;
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex h-full flex-col rounded-2xl border border-[#E7E7E7] bg-white p-6 shadow-sm">
      {/* Top Section */}
      <div className="flex items-start justify-between">
        <h2 className="text-lg font-bold text-[#111111]">Overall Progress</h2>
        
        {/* Streak embedded in Top-Right */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-[#111111]">
            <Flame className="h-4 w-4 text-[#F47F45]" fill="#F47F45" />
            <span>{streak} days</span>
          </div>
          {/* Day indicators */}
          <div className="mt-1 flex items-center gap-1">
            {[...Array(7)].map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 w-1.5 rounded-full ${i < Math.min(streak, 7) ? 'bg-[#F47F45]' : 'bg-[#E7E7E7]'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Centered to remove awkward negative space */}
      <div className="my-auto flex items-center gap-8 py-4">
        {/* Circular Ring */}
        <div className="relative flex items-center justify-center">
          <svg className="h-28 w-28 -rotate-90 transform">
            <circle
              className="text-[#F5F5F5]"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="56"
              cy="56"
            />
            <circle
              className="text-[#F89864] transition-all duration-1000 ease-in-out"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="56"
              cy="56"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-[#111111]">{percentage}%</span>
            <span className="text-[10px] font-semibold text-[#707070] uppercase tracking-wider">Complete</span>
          </div>
        </div>

        {/* Stats List */}
        <div className="flex flex-col justify-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F5F5]">
              <BookOpen className="h-4 w-4 text-[#707070]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111111]">{completedLessons} / {totalLessons} Lessons</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F5F5]">
              <Target className="h-4 w-4 text-[#707070]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111111]">{solvedChallenges} / {totalChallenges} Challenges</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F5F5]">
              <Brain className="h-4 w-4 text-[#707070]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#111111]">{conceptsMastered} Concepts Mastered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="mt-auto pt-4 border-t border-[#F0F0F0]">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-medium text-[#707070]">Curriculum Completed</span>
          <span className="font-semibold text-[#111111]">{completedItems} of {totalItems} items</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#F5F5F5]">
          <div 
            className="h-full rounded-full bg-[#F89864] transition-all duration-700" 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
