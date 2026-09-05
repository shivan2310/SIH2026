import { ArrowRight, ChevronRight, Calendar } from "lucide-react";
import { Link } from "@tanstack/react-router";

export interface ScheduleItem {
  id: string;
  date: string;
  title: string;
  time: string;
  itemType: string;
  itemId: string;
}

export function UpcomingSchedule({ schedule }: { schedule: ScheduleItem[] }) {
  const getColor = (index: number) => {
    const colors = ["bg-[#20B486]", "bg-[#9B6CFF]", "bg-[#F89864]", "bg-[#FF6680]"];
    return colors[index % colors.length];
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#E7E7E7] bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#111111]">Upcoming Schedule</h2>
        <Link to="/learn" className="flex items-center gap-1 text-sm font-semibold text-[#707070] hover:text-[#111111] transition-colors">
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {schedule.map((item, index) => (
          <Link
            key={item.id}
            to={item.itemType === "lesson" ? "/learn/$lessonId" : "/challenges/$challengeId"}
            params={item.itemType === "lesson" ? { lessonId: item.itemId } : { challengeId: item.itemId }}
            className="group flex cursor-pointer items-center gap-4 rounded-xl border border-transparent p-2 transition-all hover:border-[#E7E7E7] hover:bg-gray-50"
          >
            {/* Date Block */}
            <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-[#F5F5F5]">
              {item.date ? (
                <>
                  <span className="text-sm font-bold text-[#111111]">{item.date.split(" ")[0]}</span>
                  <span className="text-[10px] font-semibold uppercase text-[#707070]">
                    {item.date.split(" ")[1]}
                  </span>
                </>
              ) : (
                <Calendar className="h-5 w-5 text-[#707070]" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${getColor(index)}`} />
                <h3 className="text-sm font-bold text-[#111111]">{item.title}</h3>
              </div>
              <p className="mt-1 text-xs font-medium text-[#707070] ml-3.5">{item.time || item.itemType}</p>
            </div>

            {/* Action */}
            <div className="text-[#E7E7E7] transition-colors group-hover:text-[#111111]">
              <ChevronRight className="h-5 w-5" />
            </div>
          </Link>
        ))}
        {schedule.length === 0 && (
          <p className="text-sm text-[#707070]">No upcoming items.</p>
        )}
      </div>
    </div>
  );
}
