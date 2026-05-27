export type WorkdayMode = "all" | "weekdays" | "weekends" | "custom";

export type Task = {
  id: number;
  name: string;
  category: string;
  assignee?: string;
  assignees: string[];
  startDate: string;
  duration: number;
  progress: number;
  color: string;

  updatedBy: string;
  updatedAt: string;

  workdayMode: WorkdayMode;
  customWorkdays: number[];
  customHolidays: string[];
};

export type Project = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;

  // 新規タスク作成時の初期設定
  workdayMode: WorkdayMode;
  customWorkdays: number[];
  customHolidays: string[];

  tasks: Task[];
};

export type DayInfo = {
  date: Date;
  dateText: string;
  label: string;
  dayName: string;
  dayNumber: number;
  isSaturday: boolean;
  isSunday: boolean;
};