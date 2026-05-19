import type { DayInfo, Task, WorkdayMode } from "@/types/gantt";

export function formatDateText(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function createDays(
  startDateText: string,
  endDateText: string
): DayInfo[] {
  const start = new Date(startDateText);
  const end = new Date(endDateText);

  const days: DayInfo[] = [];
  const current = new Date(start);

  while (current <= end) {
    const month = current.getMonth() + 1;
    const date = current.getDate();
    const day = current.getDay();

    days.push({
      date: new Date(current),
      dateText: formatDateText(current),
      label: `${month}/${date}`,
      dayName: ["日", "月", "火", "水", "木", "金", "土"][day],
      dayNumber: day,
      isSaturday: day === 6,
      isSunday: day === 0,
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
}

export function isWorkingDay(
  day: DayInfo,
  workdayMode: WorkdayMode,
  customWorkdays: number[],
  customHolidays: string[]
): boolean {
  if (customHolidays.includes(day.dateText)) return false;

  if (workdayMode === "all") return true;

  if (workdayMode === "weekdays") {
    return day.dayNumber >= 1 && day.dayNumber <= 5;
  }

  if (workdayMode === "weekends") {
    return day.dayNumber === 0 || day.dayNumber === 6;
  }

  if (workdayMode === "custom") {
    return customWorkdays.includes(day.dayNumber);
  }

  return true;
}

export function getStartIndex(days: DayInfo[], taskStartDate: string): number {
  const index = days.findIndex((day) => day.dateText === taskStartDate);
  return index === -1 ? 0 : index;
}

export function getTaskScheduleSegments(days: DayInfo[], task: Task) {
  const startIndex = getStartIndex(days, task.startDate);

  const workingIndexes: number[] = [];

  for (let i = startIndex; i < days.length; i++) {
    const day = days[i];

    if (
      isWorkingDay(
        day,
        task.workdayMode,
        task.customWorkdays,
        task.customHolidays
      )
    ) {
      workingIndexes.push(i);
    }

    if (workingIndexes.length >= task.duration) break;
  }

  const segments: { startIndex: number; endIndex: number; length: number }[] =
    [];

  for (const index of workingIndexes) {
    const last = segments[segments.length - 1];

    if (!last || last.endIndex + 1 !== index) {
      segments.push({
        startIndex: index,
        endIndex: index,
        length: 1,
      });
    } else {
      last.endIndex = index;
      last.length++;
    }
  }

  return segments;
}

export function getTaskEndDate(
  days: DayInfo[],
  task: Task
): DayInfo | undefined {
  const segments = getTaskScheduleSegments(days, task);
  const lastSegment = segments[segments.length - 1];

  if (!lastSegment) return undefined;

  return days[lastSegment.endIndex];
}

export function getDelayDays(days: DayInfo[], task: Task): number {
  if (task.progress >= 100) return 0;

  const endDay = getTaskEndDate(days, task);
  if (!endDay) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(endDay.date);
  endDate.setHours(0, 0, 0, 0);

  const diff = today.getTime() - endDate.getTime();

  if (diff <= 0) return 0;

  return Math.floor(diff / (1000 * 60 * 60 * 24));
}