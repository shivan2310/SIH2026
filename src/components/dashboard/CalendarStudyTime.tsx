import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CalendarStudyTimeProps {
  activeDates: Set<string>; // YYYY-MM-DD
}

export function CalendarStudyTime({ activeDates }: CalendarStudyTimeProps) {
  const [activeTab, setActiveTab] = useState<"calendar" | "time">("calendar");

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#E7E7E7] bg-white p-6 shadow-sm">
      {/* Segmented Control */}
      <div className="mb-4 flex rounded-lg bg-[#F5F5F5] p-1">
        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
            activeTab === "calendar"
              ? "bg-white text-[#111111] shadow-sm"
              : "text-[#707070] hover:text-[#111111]"
          }`}
        >
          Study Calendar
        </button>
        <button
          onClick={() => setActiveTab("time")}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
            activeTab === "time"
              ? "bg-white text-[#111111] shadow-sm"
              : "text-[#707070] hover:text-[#111111]"
          }`}
        >
          Study Time
        </button>
      </div>

      <div className="flex-1">
        {activeTab === "calendar" ? <CalendarView activeDates={activeDates} /> : <StudyTimeView activeDates={activeDates} />}
      </div>
    </div>
  );
}

function CalendarView({ activeDates }: { activeDates: Set<string> }) {
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthName = now.toLocaleString('default', { month: 'long' });
  
  // Get days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Get starting day (1-indexed, Monday=1, Sunday=7)
  let offset = new Date(year, month, 1).getDay();
  offset = offset === 0 ? 6 : offset - 1; // JS getDay is 0 for Sunday

  const today = now.getDate();

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#111111]">Study Calendar</h3>
        <div className="flex items-center gap-2">
          <button className="rounded bg-[#F5F5F5] p-1 text-[#707070] hover:text-[#111111]">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold text-[#111111]">{monthName} {year}</span>
          <button className="rounded bg-[#F5F5F5] p-1 text-[#707070] hover:text-[#111111]">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {days.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold tracking-wider text-[#707070]">
            {d}
          </div>
        ))}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {dates.map((date) => {
          const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
          const isActive = activeDates.has(dateString);
          const isToday = date === today;

          let indicator = null;
          if (isActive) {
            indicator = <div className="mx-auto mt-0.5 h-1 w-1 rounded-full bg-[#20B486]"></div>;
          }

          return (
            <div key={date} className="flex flex-col items-center justify-center">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium ${
                  isToday ? "bg-[#F47F45] text-white" : "text-[#111111]"
                }`}
              >
                {date}
              </span>
              <div className="h-1">{indicator}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StudyTimeView({ activeDates }: { activeDates: Set<string> }) {
  // Approximate study time based on active dates this week (since we don't track duration)
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  
  const now = new Date();
  let dayOfWeek = now.getDay();
  dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday=0
  
  // Create week data
  const weekData = days.map((day, idx) => {
    // If it's a future day in the week, no data yet
    if (idx > dayOfWeek) return { day, hours: 0, height: "5%" };
    
    // Check if user was active on this day
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() - (dayOfWeek - idx));
    const dateString = checkDate.toISOString().slice(0, 10);
    
    // If active, give them ~1.5h, otherwise 0
    const hours = activeDates.has(dateString) ? 1.5 : 0;
    const height = hours > 0 ? "40%" : "5%";
    
    return { day, hours, height };
  });
  
  const totalHours = weekData.reduce((acc, curr) => acc + curr.hours, 0);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#111111]">Study Time</h3>
        <span className="text-xs font-semibold text-[#707070]">Goal: 6h</span>
      </div>
      
      <div className="mb-6">
        <p className="text-3xl font-bold text-[#111111]">{totalHours}h 00m</p>
        <p className="text-xs font-medium text-[#707070]">Total this week</p>
      </div>

      <div className="flex h-24 items-end justify-between gap-2 border-b border-[#E7E7E7] pb-2">
        {weekData.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={`w-full max-w-[20px] rounded-t-sm transition-all ${
                d.hours > 0 ? "bg-[#F89864]" : "bg-[#F5F5F5]"
              }`}
              style={{ height: d.height }}
            />
            <span className="text-[10px] font-semibold text-[#707070]">{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
