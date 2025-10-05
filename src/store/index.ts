import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type MoodValue = 1 | 2 | 3 | 4 | 5;

export type Task = {
  id: string;
  title: string;
  done: boolean;
};

export type JournalEntry = {
  date: string; // YYYY-MM-DD
  content: string;
};

export type HabitSchedule = {
  type: "daily" | "weekdays" | "custom";
  daysOfWeek?: number[]; // 0=Sun..6=Sat when type === 'custom'
  intervalWeeks?: number; // 1 = every week, 2 = every other week, etc.
  onlyCurrentQuarter?: boolean; // active only in current quarter
  skippedWeeks?: string[]; // list of week start dates YYYY-MM-DD to skip
};

export type Habit = {
  id: string;
  name: string;
  schedule: HabitSchedule;
  completions: string[]; // list of YYYY-MM-DD completed dates
  createdAt: string; // YYYY-MM-DD
};

export type FocusSession = {
  id: string;
  date: string; // YYYY-MM-DD
  seconds: number;
  label?: string;
  taskId?: string; // optional link to a task
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

export type QuarterItem = { id: string; title: string; notes?: string };

export type User = {
  id: string;
  name: string;
  credentialId?: string; // base64url
};

export type UiPreferences = {
<<<<<<< Updated upstream
  showMindfulnessInWeek: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autoStartNextSegment: boolean;
  focusDefaults: FocusDefaults;
};

export type AuthState = {
  isAuthenticated: boolean;
  userId?: string;
  userName?: string;
||||||| Stash base
	showMindfulnessInWeek: boolean;
	soundEnabled: boolean;
	notificationsEnabled: boolean;
	autoStartNextSegment: boolean;
	focusDefaults: FocusDefaults;
	// Passkey lock
	passkeyEnabled?: boolean;
	passkeyCredentialId?: string; // base64url
=======
	showMindfulnessInWeek: boolean;
	soundEnabled: boolean;
	notificationsEnabled: boolean;
	autoStartNextSegment: boolean;
	focusDefaults: FocusDefaults;
	// Passkey lock
	passkeyEnabled?: boolean;
	passkeyCredentialId?: string; // base64url
  // CalDAV
  caldav?: {
    enabled?: boolean;
    baseUrl?: string;
    username?: string;
    password?: string; // stored locally only
    lastSyncAt?: number;
    mapping?: Record<string, { href: string; etag?: string | null } | undefined>; // taskId -> remote
  };
>>>>>>> Stashed changes
};

export type AppState = {
  // keyed by date
  moodByDate: Record<string, MoodValue | undefined>;
  intentionByDate: Record<string, string | undefined>;
  tasksByDate: Record<string, Task[]>;
  journalByDate: Record<string, string | undefined>;

  // backlog tasks (not date-scoped)
  backlogTasks: Task[];

  habits: Habit[];
  focusSessions: FocusSession[];

  // Quarterly plan keyed by quarter key e.g., 2025-Q1
  quarterPlans: Record<string, (QuarterItem | null)[]>;

  // Weekly reports keyed by Monday start date YYYY-MM-DD
  weeklyReportsByWeekStart: Record<string, string | undefined>;

  ui: UiPreferences;
  auth: AuthState;

  user: User | null;

  // actions
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

<<<<<<< Updated upstream
  setShowMindfulnessInWeek: (enabled: boolean) => void;
  setUi: (partial: Partial<UiPreferences>) => void;
||||||| Stash base
	setShowMindfulnessInWeek: (enabled: boolean) => void;
	setUi: (partial: Partial<UiPreferences>) => void;
	setLocked: (locked: boolean) => void;
=======
	setShowMindfulnessInWeek: (enabled: boolean) => void;
	setUi: (partial: Partial<UiPreferences>) => void;
	setLocked: (locked: boolean) => void;
  // caldav actions
  syncCaldav: () => Promise<void>;
>>>>>>> Stashed changes

  // auth actions
  setAuth: (auth: Partial<AuthState>) => void;
  loginWithPasskey: (userId: string, userName: string) => void;
  logout: () => void;
  loadServerData: (serverData: Partial<AppState>) => void;

  // user actions
  registerUser: (name: string, credentialId?: string) => void;
  logoutUser: () => void;

  addFocusSession: (seconds: number, label?: string, taskId?: string) => void;

  // quarterly + weekly report actions
  setQuarterItem: (quarterKey: string, index: number, notes: string) => void;
  clearQuarterItem: (quarterKey: string, index: number) => void;
  saveWeeklyReport: (weekStart: string, content: string) => void;

  resetAll: () => void;
};

export function todayString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfWeekString(date: Date): string {
  return todayString(startOfWeek(date));
}

export function quarterKey(date: Date): string {
  const y = date.getFullYear();
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `${y}-Q${q}`;
}

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function isHabitScheduledOnDate(
  schedule: HabitSchedule | undefined,
  date: Date,
  createdAt?: string,
): boolean {
  const s = schedule ?? { type: "daily" };
  // day-of-week rules
  if (s.type === "daily") {
    // ok
  } else if (s.type === "weekdays") {
    const day = date.getDay();
    if (!(day >= 1 && day <= 5)) return false;
  } else {
    const day = date.getDay();
    const days = s.daysOfWeek ?? [];
    if (!days.includes(day)) return false;
  }
  // interval weeks
  const interval = s.intervalWeeks && s.intervalWeeks > 0 ? s.intervalWeeks : 1;
  if (interval > 1) {
    const startCreated = startOfWeek(new Date(createdAt ?? todayString()));
    const startDate = startOfWeek(date);
    const diffMs = startDate.getTime() - startCreated.getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    if (diffWeeks < 0 || diffWeeks % interval !== 0) return false;
  }
  // only current quarter
  if (s.onlyCurrentQuarter) {
    if (quarterKey(date) !== quarterKey(new Date())) return false;
  }
  // skipped weeks
  const skip = s.skippedWeeks ?? [];
  if (skip.includes(startOfWeekString(date))) return false;

  return true;
}

export function computeHabitStreak(
  habit: Habit,
  fromDate: Date = new Date(),
): number {
  const completionsArray = Array.isArray(habit.completions)
    ? habit.completions
    : [];
  if (completionsArray.length === 0) return 0;

  let streak = 0;
  const completed = new Set(completionsArray as string[]);
  const cursor = new Date(fromDate);
  const maxLookbackDays = 366; // limit to one year

  for (let i = 0; i < maxLookbackDays; i += 1) {
    const dateStr = todayString(cursor);
    if (isHabitScheduledOnDate(habit.schedule, cursor, habit.createdAt)) {
      if (!completed.has(dateStr)) break;
      streak += 1;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

const defaultFocusDefaults: FocusDefaults = {
  pattern: "single",
  singleMinutes: 25,
  pomodoroWork: 25,
  pomodoroBreak: 5,
  pomodoroRounds: 4,
  longTotalMinutes: 240,
  longBreakEvery: 50,
  longBreakMinutes: 10,
};

export const useAppState = create<AppState>()(
<<<<<<< Updated upstream
  persist(
    (set, get) => ({
      moodByDate: {},
      intentionByDate: {},
      tasksByDate: {},
      journalByDate: {},
      backlogTasks: [],
      habits: [],
      focusSessions: [],
      quarterPlans: {},
      weeklyReportsByWeekStart: {},
      ui: {
        showMindfulnessInWeek: true,
        soundEnabled: true,
        notificationsEnabled: true,
        autoStartNextSegment: true,
        focusDefaults: defaultFocusDefaults,
      },
      auth: {
        isAuthenticated: false,
      },
      user: null,
||||||| Stash base
	persist(
		(set, _get) => ({
			moodByDate: {},
			intentionByDate: {},
			tasksByDate: {},
			journalByDate: {},
			backlogTasks: [],
			habits: [],
			focusSessions: [],
			quarterPlans: {},
			weeklyReportsByWeekStart: {},
			ui: {
				showMindfulnessInWeek: true,
				soundEnabled: true,
				notificationsEnabled: true,
				autoStartNextSegment: true,
				focusDefaults: defaultFocusDefaults,
				passkeyEnabled: false,
				passkeyCredentialId: undefined,
			},
			locked: false,
			user: null,
=======
	persist(
		(set, _get) => ({
			moodByDate: {},
			intentionByDate: {},
			tasksByDate: {},
			journalByDate: {},
			backlogTasks: [],
			habits: [],
			focusSessions: [],
			quarterPlans: {},
			weeklyReportsByWeekStart: {},
			ui: {
				showMindfulnessInWeek: true,
				soundEnabled: true,
				notificationsEnabled: true,
				autoStartNextSegment: true,
				focusDefaults: defaultFocusDefaults,
				passkeyEnabled: false,
				passkeyCredentialId: undefined,
        caldav: { enabled: false },
			},
			locked: false,
			user: null,
>>>>>>> Stashed changes

      setMood: (date, mood) =>
        set((s) => ({ moodByDate: { ...s.moodByDate, [date]: mood } })),
      setIntention: (date, intention) =>
        set((s) => ({
          intentionByDate: { ...s.intentionByDate, [date]: intention },
        })),

      addTask: (date, title) =>
        set((s) => {
          const list = s.tasksByDate[date] ?? [];
          const newTask: Task = {
            id: generateId("task"),
            title: title.trim(),
            done: false,
          };
          return {
            tasksByDate: { ...s.tasksByDate, [date]: [...list, newTask] },
          };
        }),

      toggleTask: (date, taskId) =>
        set((s) => {
          const list = s.tasksByDate[date] ?? [];
          return {
            tasksByDate: {
              ...s.tasksByDate,
              [date]: list.map((t) =>
                t.id === taskId ? { ...t, done: !t.done } : t,
              ),
            },
          };
        }),

      deleteTask: (date, taskId) =>
        set((s) => {
          const list = s.tasksByDate[date] ?? [];
          return {
            tasksByDate: {
              ...s.tasksByDate,
              [date]: list.filter((t) => t.id !== taskId),
            },
          };
        }),

      moveTask: (fromDate, taskId, toDate) =>
        set((s) => {
          const source = s.tasksByDate[fromDate] ?? [];
          const task = source.find((t) => t.id === taskId);
          if (!task) return s; // Return current state if task not found
          const target = s.tasksByDate[toDate] ?? [];
          
          if (fromDate === toDate) {
            // If moving within the same date, just reorder the task to the end
            return {
              tasksByDate: {
                ...s.tasksByDate,
                [toDate]: [...source.filter((t) => t.id !== taskId), task],
              },
            };
          } else {
            // If moving to a different date, remove from source and add to target
            return {
              tasksByDate: {
                ...s.tasksByDate,
                [fromDate]: source.filter((t) => t.id !== taskId),
                [toDate]: [...target, task],
              },
            };
          }
        }),

      addBacklogTask: (title) =>
        set((s) => ({
          backlogTasks: [
            ...s.backlogTasks,
            { id: generateId("backlog"), title: title.trim(), done: false },
          ],
        })),
      toggleBacklogTask: (taskId) =>
        set((s) => ({
          backlogTasks: s.backlogTasks.map((t) =>
            t.id === taskId ? { ...t, done: !t.done } : t,
          ),
        })),
      deleteBacklogTask: (taskId) =>
        set((s) => ({
          backlogTasks: s.backlogTasks.filter((t) => t.id !== taskId),
        })),

      saveJournal: (date, content) =>
        set((s) => ({
          journalByDate: { ...s.journalByDate, [date]: content },
        })),

      addHabit: (name) =>
        set((s) => ({
          habits: [
            ...s.habits,
            {
              id: generateId("habit"),
              name: name.trim(),
              schedule: { type: "daily", intervalWeeks: 1, skippedWeeks: [] },
              completions: [],
              createdAt: todayString(),
            },
          ],
        })),
      deleteHabit: (habitId) =>
        set((s) => ({ habits: s.habits.filter((h) => h.id !== habitId) })),
      toggleHabitForDate: (habitId, date) =>
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  schedule: h.schedule ?? {
                    type: "daily",
                    intervalWeeks: 1,
                    skippedWeeks: [],
                  },
                  completions: (h.completions ?? []).includes(date)
                    ? (h.completions ?? []).filter((d) => d !== date)
                    : [...(h.completions ?? []), date],
                }
              : h,
          ),
        })),
      setHabitSchedule: (habitId, schedule) =>
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === habitId ? { ...h, schedule } : h,
          ),
        })),
      skipHabitWeek: (habitId, weekStart) =>
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  schedule: {
                    ...(h.schedule ?? { type: "daily" }),
                    skippedWeeks: [
                      ...(h.schedule?.skippedWeeks ?? []),
                      weekStart,
                    ],
                  },
                }
              : h,
          ),
        })),
      unskipHabitWeek: (habitId, weekStart) =>
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  schedule: {
                    ...(h.schedule ?? { type: "daily" }),
                    skippedWeeks: (h.schedule?.skippedWeeks ?? []).filter(
                      (w) => w !== weekStart,
                    ),
                  },
                }
              : h,
          ),
        })),

      setShowMindfulnessInWeek: (enabled) =>
        set((s) => ({ ui: { ...s.ui, showMindfulnessInWeek: enabled } })),
      setUi: (partial) => set((s) => ({ ui: { ...s.ui, ...partial } })),

<<<<<<< Updated upstream
      setAuth: (authUpdate) =>
        set((s) => ({ auth: { ...s.auth, ...authUpdate } })),
      loginWithPasskey: (userId, userName) =>
        set(() => ({
          auth: {
            isAuthenticated: true,
            userId,
            userName,
          },
        })),
      logout: () =>
        set(() => ({
          auth: {
            isAuthenticated: false,
          },
        })),
      loadServerData: (serverData) =>
        set((current) => ({
          // Merge server data with current state, keeping auth state
          ...current,
          ...serverData,
          // Preserve current auth state (don't overwrite with server data)
          auth: current.auth,
        })),
||||||| Stash base
			registerUser: (name, credentialId) =>
				set(() => ({
					user: { id: generateId("user"), name: name.trim(), credentialId },
				})),
			logoutUser: () => set(() => ({ user: null })),
=======
      syncCaldav: async () => {
        const s = _get();
        const cfg = s.ui.caldav;
        if (!cfg?.enabled || !cfg.baseUrl || !cfg.username) return;
        const account = {
          baseUrl: cfg.baseUrl,
          auth: { username: cfg.username, password: cfg.password ?? "" },
        };
        const { listTodos, createOrUpdateTodo } = await import("@lib/caldav");
        try {
          const remoteList = await listTodos(account);
          // Build reverse mapping remote href -> taskId
          const map = { ...cfg.mapping } as Record<string, { href: string; etag?: string | null } | undefined>;
          const hrefToTaskId = new Map<string, string>();
          for (const [taskId, info] of Object.entries(map)) {
            if (info?.href) hrefToTaskId.set(info.href, taskId);
          }

          // Import: create local tasks for unmapped remote todos (append to backlog)
          const knownHrefs = new Set(Object.values(map).map((m) => m?.href).filter(Boolean) as string[]);
          const backlog = [...s.backlogTasks];
          for (const r of remoteList) {
            if (!knownHrefs.has(r.href)) {
              backlog.push({ id: generateId("task"), title: r.summary, done: r.completed });
              // mapping stored without task placement; leave unmapped until user drags it onto a day
            }
          }

          // Push: create remote for local tasks not yet mapped; update mapping
          for (const [, tasks] of Object.entries(s.tasksByDate)) {
            for (const t of tasks) {
              const mapped = map[t.id];
              if (!mapped) {
                const saved = await createOrUpdateTodo(account, {
                  href: "",
                  summary: t.title,
                  completed: t.done,
                });
                map[t.id] = { href: saved.href, etag: saved.etag };
              }
            }
          }

          set((state) => ({
            backlogTasks: backlog,
            ui: { ...state.ui, caldav: { ...state.ui.caldav, lastSyncAt: Date.now(), mapping: map } },
          }));
        } catch (e) {
          console.error("CalDAV sync failed", e);
        }
      },

			registerUser: (name, credentialId) =>
				set(() => ({
					user: { id: generateId("user"), name: name.trim(), credentialId },
				})),
			logoutUser: () => set(() => ({ user: null })),
>>>>>>> Stashed changes

      registerUser: (name, credentialId) =>
        set(() => ({
          user: { id: generateId("user"), name: name.trim(), credentialId },
        })),
      logoutUser: () => set(() => ({ user: null })),

      addFocusSession: (seconds, label, taskId) =>
        set((s) => ({
          focusSessions: [
            ...s.focusSessions,
            {
              id: generateId("focus"),
              date: todayString(),
              seconds,
              label,
              taskId,
            },
          ],
        })),

      // quarterly + weekly report actions
      setQuarterItem: (quarterKey: string, index: number, notes: string) =>
        set((s) => {
          const existing = s.quarterPlans[quarterKey]?.slice(0, 4) ?? [];
          const list: (QuarterItem | null)[] = Array.from(
            { length: 4 },
            (_, i) => existing[i] ?? null,
          );
          const base = list[index] ?? { id: generateId("q"), title: "" };
          const item: QuarterItem = { ...base, notes: (notes ?? "").trim() };
          const next = list.slice(0, 4);
          next[index] = item;
          return { quarterPlans: { ...s.quarterPlans, [quarterKey]: next } };
        }),
      clearQuarterItem: (quarterKey: string, index: number) =>
        set((s) => {
          const existing = s.quarterPlans[quarterKey]?.slice(0, 4) ?? [];
          const list: (QuarterItem | null)[] = Array.from(
            { length: 4 },
            (_, i) => existing[i] ?? null,
          );
          list[index] = null;
          return { quarterPlans: { ...s.quarterPlans, [quarterKey]: list } };
        }),
      saveWeeklyReport: (weekStart, content) =>
        set((s) => ({
          weeklyReportsByWeekStart: {
            ...s.weeklyReportsByWeekStart,
            [weekStart]: content,
          },
        })),

      resetAll: () =>
        set(() => ({
          moodByDate: {},
          intentionByDate: {},
          tasksByDate: {},
          journalByDate: {},
          backlogTasks: [],
          habits: [],
          focusSessions: [],
          quarterPlans: {},
          weeklyReportsByWeekStart: {},
          ui: {
            showMindfulnessInWeek: true,
            soundEnabled: true,
            notificationsEnabled: true,
            autoStartNextSegment: true,
            focusDefaults: defaultFocusDefaults,
          },
          auth: {
            isAuthenticated: false,
          },
          user: null,
        })),
    }),
    {
      name: "mindful-plm",
      version: 6,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => s,
      migrate: (persisted: any, version: number) => {
        if (!persisted) return persisted;
        // Normalize habits regardless of version to avoid crashes
        const normalizeHabits = (arr: any[]): Habit[] =>
          (arr ?? []).map((h: any) => ({
            id: h.id,
            name: h.name,
            schedule: {
              type: h.schedule?.type ?? "daily",
              daysOfWeek: h.schedule?.daysOfWeek,
              intervalWeeks: h.schedule?.intervalWeeks ?? 1,
              onlyCurrentQuarter: h.schedule?.onlyCurrentQuarter ?? false,
              skippedWeeks: h.schedule?.skippedWeeks ?? [],
            },
            completions: Array.isArray(h.completions)
              ? h.completions
              : h.lastCheckedDate
                ? [h.lastCheckedDate]
                : [],
            createdAt: h.createdAt ?? todayString(),
          }));

        const ensureUi = (ui: any): UiPreferences => ({
          showMindfulnessInWeek: ui?.showMindfulnessInWeek ?? true,
          soundEnabled: ui?.soundEnabled ?? true,
          notificationsEnabled: ui?.notificationsEnabled ?? true,
          autoStartNextSegment: ui?.autoStartNextSegment ?? true,
          focusDefaults: ui?.focusDefaults ?? defaultFocusDefaults,
        });

        const next = { ...persisted } as any;
        if (version <= 5) {
          next.habits = normalizeHabits(persisted.habits ?? []);
          next.ui = ensureUi(persisted.ui);
          next.quarterPlans = persisted.quarterPlans ?? {};
          next.weeklyReportsByWeekStart =
            persisted.weeklyReportsByWeekStart ?? {};
        }
        // Ensure Weekly Review habit exists (Sunday)
        const hasWeekly = (next.habits ?? []).some(
          (h: any) => String(h.name).toLowerCase() === "weekly review",
        );
        if (!hasWeekly) {
          (next.habits = next.habits ?? []).push({
            id: generateId("habit"),
            name: "Weekly Review",
            schedule: {
              type: "custom",
              daysOfWeek: [0],
              intervalWeeks: 1,
              skippedWeeks: [],
            },
            completions: [],
            createdAt: todayString(),
          });
        }
        return next;
      },
    },
  ),
);
