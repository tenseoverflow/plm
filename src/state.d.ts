export type MoodValue = 1 | 2 | 3 | 4 | 5;
export type Task = {
    id: string;
    title: string;
    done: boolean;
};
export type JournalEntry = {
    date: string;
    content: string;
};
export type HabitSchedule = {
    type: "daily" | "weekdays" | "custom";
    daysOfWeek?: number[];
    intervalWeeks?: number;
    onlyCurrentQuarter?: boolean;
    skippedWeeks?: string[];
};
export type Habit = {
    id: string;
    name: string;
    schedule: HabitSchedule;
    completions: string[];
    createdAt: string;
};
export type FocusSession = {
    id: string;
    date: string;
    seconds: number;
    label?: string;
    taskId?: string;
};
export type FocusDefaults = {
    pattern: "single" | "pomodoro" | "long";
    singleMinutes: number;
    pomodoroWork: number;
    pomodoroBreak: number;
    pomodoroRounds: number;
    longTotalMinutes: number;
    longBreakEvery: number;
    longBreakMinutes: number;
};
export type QuarterItem = {
    id: string;
    title: string;
    notes?: string;
};
export type User = {
    id: string;
    name: string;
    credentialId?: string;
};
export type UiPreferences = {
    showMindfulnessInWeek: boolean;
    soundEnabled: boolean;
    notificationsEnabled: boolean;
    autoStartNextSegment: boolean;
    focusDefaults: FocusDefaults;
    passkeyEnabled?: boolean;
    passkeyCredentialId?: string;
};
export type AppState = {
    moodByDate: Record<string, MoodValue | undefined>;
    intentionByDate: Record<string, string | undefined>;
    tasksByDate: Record<string, Task[]>;
    journalByDate: Record<string, string | undefined>;
    backlogTasks: Task[];
    habits: Habit[];
    focusSessions: FocusSession[];
    quarterPlans: Record<string, (QuarterItem | null)[]>;
    weeklyReportsByWeekStart: Record<string, string | undefined>;
    ui: UiPreferences;
    locked?: boolean;
    user: User | null;
    setMood: (date: string, mood: MoodValue) => void;
    setIntention: (date: string, intention: string) => void;
    addTask: (date: string, title: string) => void;
    toggleTask: (date: string, taskId: string) => void;
    deleteTask: (date: string, taskId: string) => void;
    moveTask: (fromDate: string, taskId: string, toDate: string) => void;
    addBacklogTask: (title: string) => void;
    toggleBacklogTask: (taskId: string) => void;
    deleteBacklogTask: (taskId: string) => void;
    saveJournal: (date: string, content: string) => void;
    addHabit: (name: string) => void;
    deleteHabit: (habitId: string) => void;
    toggleHabitForDate: (habitId: string, date: string) => void;
    setHabitSchedule: (habitId: string, schedule: HabitSchedule) => void;
    skipHabitWeek: (habitId: string, weekStart: string) => void;
    unskipHabitWeek: (habitId: string, weekStart: string) => void;
    setShowMindfulnessInWeek: (enabled: boolean) => void;
    setUi: (partial: Partial<UiPreferences>) => void;
    setLocked: (locked: boolean) => void;
    registerUser: (name: string, credentialId?: string) => void;
    logoutUser: () => void;
    addFocusSession: (seconds: number, label?: string, taskId?: string) => void;
    setQuarterItem: (quarterKey: string, index: number, notes: string) => void;
    clearQuarterItem: (quarterKey: string, index: number) => void;
    saveWeeklyReport: (weekStart: string, content: string) => void;
    resetAll: () => void;
};
export declare function todayString(date?: Date): string;
export declare function startOfWeek(date: Date): Date;
export declare function startOfWeekString(date: Date): string;
export declare function quarterKey(date: Date): string;
export declare function isHabitScheduledOnDate(schedule: HabitSchedule | undefined, date: Date, createdAt?: string): boolean;
export declare function computeHabitStreak(habit: Habit, fromDate?: Date): number;
export declare const useAppState: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AppState>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AppState, any>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AppState) => void) => () => void;
        onFinishHydration: (fn: (state: AppState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AppState, any>>;
    };
}>;
