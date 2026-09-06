import { useState } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, Clock, Calendar as CalendarIcon, CheckCircle2, Sparkles, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useStudyLog } from "@/hooks/useStudyLog";

export interface CalendarStudyTimeProps {
  activeDates: Set<string>; // YYYY-MM-DD
}

function makeStudyInfo(totalMins: number) {
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return {
    hours: hrs,
    minutes: mins,
    totalHoursNum: totalMins / 60,
    formatted: `${hrs}h ${String(mins).padStart(2, "0")}m`,
  };
}

export function CalendarStudyTime({ activeDates }: CalendarStudyTimeProps) {
  const [activeTab, setActiveTab] = useState<"calendar" | "time">("calendar");
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const { activeDates: logDates, clearAll } = useStudyLog();

  // Merge prop activeDates (lesson/attempt days) with logged study days
  const mergedActiveDates = new Set([...activeDates, ...logDates]);

  const handleSelectDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setActiveTab("time");
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#E7E7E7] bg-white p-6 shadow-sm">
      {/* Segmented Control */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex flex-1 rounded-lg bg-[#F5F5F5] p-1">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
              activeTab === "calendar"
                ? "bg-white text-[#111111] shadow-sm"
                : "text-[#707070] hover:text-[#111111]"
            }`}
          >
            Study Calendar
          </button>
          <button
            onClick={() => setActiveTab("time")}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${
              activeTab === "time"
                ? "bg-white text-[#111111] shadow-sm"
                : "text-[#707070] hover:text-[#111111]"
            }`}
          >
            Study Time
          </button>
        </div>
        <button
          onClick={() => { if (confirm("Clear all study log data?")) clearAll(); }}
          title="Clear study log"
          className="rounded p-1.5 text-[#707070] transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1">
        {activeTab === "calendar" ? (
          <CalendarView activeDates={mergedActiveDates} onSelectDate={handleSelectDate} />
        ) : (
          <StudyTimeView
            activeDates={mergedActiveDates}
            selectedDateStr={selectedDateStr}
            onBackToCalendar={() => setActiveTab("calendar")}
          />
        )}
      </div>
    </div>
  );
}

function CalendarView({
  activeDates,
  onSelectDate,
}: {
  activeDates: Set<string>;
  onSelectDate: (dateStr: string) => void;
}) {
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const prevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Get days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Get starting day (1-indexed, Monday=1, Sunday=7)
  let offset = new Date(year, month, 1).getDay();
  offset = offset === 0 ? 6 : offset - 1; // JS getDay is 0 for Sunday

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#111111]">Study Calendar</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            title="Previous month"
            className="rounded bg-[#F5F5F5] p-1 text-[#707070] transition-colors hover:bg-orange-100 hover:text-[#EA580C]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[110px] text-center text-xs font-bold text-[#111111]">
            {monthName} {year}
          </span>
          <button
            onClick={nextMonth}
            title="Next month"
            className="rounded bg-[#F5F5F5] p-1 text-[#707070] transition-colors hover:bg-orange-100 hover:text-[#EA580C]"
          >
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
          const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
          const cellDate = new Date(year, month, date);
          const isActive = activeDates.has(dateString);
          const isToday = cellDate.getTime() === todayStart.getTime();
          const isUpcoming = cellDate.getTime() > todayStart.getTime();

          let indicator = null;
          if (isActive) {
            indicator = <div className="mx-auto mt-0.5 h-1.5 w-1.5 rounded-full bg-[#20B486]" />;
          }

          return (
            <div key={date} className="flex flex-col items-center justify-center py-0.5">
              <button
                onClick={() => onSelectDate(dateString)}
                title={
                  isUpcoming
                    ? `Upcoming date: ${monthName} ${date}, ${year}`
                    : `View study time for ${monthName} ${date}, ${year}`
                }
                className={`group relative flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium transition-all ${
                  isToday
                    ? "bg-[#F47F45] text-white shadow-sm hover:bg-[#E3692E]"
                    : isUpcoming
                    ? "text-[#666666] hover:bg-amber-100 hover:text-amber-900"
                    : "text-[#111111] hover:bg-orange-100 hover:text-orange-900"
                }`}
              >
                {date}
              </button>
              <div className="h-1.5">{indicator}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StudyTimeView({
  activeDates,
  selectedDateStr,
  onBackToCalendar,
}: {
  activeDates: Set<string>;
  selectedDateStr: string | null;
  onBackToCalendar: () => void;
}) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const { getEntry } = useStudyLog();

  const getStudyInfo = (dateStr: string, isActive: boolean, isFuture: boolean) => {
    if (!isActive || isFuture) return makeStudyInfo(0);
    const mins = getEntry(dateStr);
    return makeStudyInfo(mins);
  };

  // Parse target date
  const targetDate = selectedDateStr ? new Date(`${selectedDateStr}T00:00:00`) : now;
  const isFuture = targetDate.getTime() > todayStart.getTime();

  const isSelectedActive = selectedDateStr
    ? activeDates.has(selectedDateStr)
    : activeDates.has(now.toISOString().slice(0, 10));
  const dateStrForCalculation = selectedDateStr || now.toISOString().slice(0, 10);

  const studyInfo = getStudyInfo(dateStrForCalculation, isSelectedActive, isFuture);

  // Formatted title date string
  const formattedTitleDate = targetDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  let dayOfWeek = now.getDay();
  dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday=0

  // Create week data
  const weekData = days.map((day, idx) => {
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() - (dayOfWeek - idx));
    const dateString = checkDate.toISOString().slice(0, 10);
    const checkCellDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
    const isCellFuture = checkCellDate.getTime() > todayStart.getTime();
    const isActive = activeDates.has(dateString);
    const dayInfo = getStudyInfo(dateString, isActive, isCellFuture);

    const isSelectedDay = selectedDateStr === dateString;
    const height =
      dayInfo.totalHoursNum > 0 ? `${Math.min(90, Math.max(25, (dayInfo.totalHoursNum / 2.5) * 85))}%` : "8%";

    return {
      day,
      dateString,
      hoursFormatted: dayInfo.formatted,
      hoursNum: dayInfo.totalHoursNum,
      height,
      isSelectedDay,
    };
  });

  const totalWeekHours = weekData.reduce((acc, curr) => acc + curr.hoursNum, 0);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={onBackToCalendar}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#F47F45] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Calendar
        </button>
        <span className="text-xs font-semibold text-[#707070]">Goal: 6h/week</span>
      </div>

      {/* Selected Date Summary Card */}
      <div className="mb-4 rounded-xl border border-orange-100 bg-orange-50/70 p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#F47F45]" />
            <span className="text-xs font-bold text-[#111111]">{formattedTitleDate}</span>
          </div>
          {isFuture ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              <CalendarIcon className="h-3 w-3" /> Upcoming Date
            </span>
          ) : isSelectedActive ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              <CheckCircle2 className="h-3 w-3" /> Active Session
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              No session
            </span>
          )}
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <div>
            <p className="text-2xl font-black text-[#111111]">{studyInfo.formatted}</p>
            <p className="text-xs font-medium text-[#707070]">
              {isFuture ? "scheduled study time (future date)" : "studied on this day"}
            </p>
          </div>

          {isFuture && (
            <Link
              to="/learn"
              className="inline-flex items-center gap-1 rounded-lg bg-[#F47F45] px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-[#E3692E]"
            >
              <Sparkles className="h-3 w-3" /> Learn
            </Link>
          )}
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#111111]">
        <span>Weekly Overview</span>
        <span className="text-[11px] font-medium text-[#707070]">Total: {totalWeekHours.toFixed(1)}h</span>
      </div>

      <div className="flex h-20 items-end justify-between gap-2 border-b border-[#E7E7E7] pb-2">
        {weekData.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              title={`${d.day}: ${d.hoursFormatted}`}
              className={`w-full max-w-[18px] rounded-t-sm transition-all ${
                d.isSelectedDay
                  ? "bg-[#EA580C] shadow-md shadow-orange-500/30 ring-2 ring-orange-300"
                  : d.hoursNum > 0
                  ? "bg-[#F89864]"
                  : "bg-[#F5F5F5]"
              }`}
              style={{ height: d.height }}
            />
            <span className={`text-[10px] font-semibold ${d.isSelectedDay ? "text-[#EA580C] font-bold" : "text-[#707070]"}`}>
              {d.day}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
