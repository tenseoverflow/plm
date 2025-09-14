import {
  Task,
  isHabitScheduledOnDate,
  todayString,
  useAppState,
} from "@store/index";
import { useEffect, useMemo, useRef, useState } from "react";
import { Fragment } from "react/jsx-runtime";
import Card from "../ui/Card";
import Checkbox from "../ui/Checkbox";
import Input from "../ui/Input";
import Modal from "../ui/Modal";

function startOfWeek(date: Date): Date {
  // Monday as first day
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmtDay(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type DayInfo = { date: Date; dateStr: string };

type WeekInfo = { start: Date; end: Date; days: DayInfo[]; key: string };

type Segment = { type: "work" | "break"; seconds: number };

type FocusTask = { id: string; dateStr: string; title: string };

type FocusRun = {
  task: FocusTask;
  segments: Segment[];
  totalWorkSeconds: number;
  label: string;
};

function beep() {
  try {
    const ctx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    o.start();
    setTimeout(() => {
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02);
      o.stop();
      ctx.close();
    }, 300);
  } catch {
    console.error("Error occurred while beeping");
  }
}

async function notify(title: string, body?: string) {
  try {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default")
      await Notification.requestPermission();
    if (Notification.permission === "granted")
      new Notification(title, { body });
  } catch {
    console.error("Error occurred while sending notification");
  }
}

export default function Week() {
  const tasksByDate = useAppState((s) => s.tasksByDate);
  const focusSessions = useAppState((s) => s.focusSessions);
  const addTask = useAppState((s) => s.addTask);
  const toggleTask = useAppState((s) => s.toggleTask);
  const deleteTask = useAppState((s) => s.deleteTask);
  const moveTask = useAppState((s) => s.moveTask);

  const addFocusSession = useAppState((s) => s.addFocusSession);

  const ui = useAppState((s) => s.ui);

  const habits = useAppState((s) => s.habits ?? []);
  const toggleHabitForDate = useAppState((s) => s.toggleHabitForDate);

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const weeks = useMemo(() => {
    const weeksBefore = 4;
    const weeksAfter = 4;
    const today = new Date();
    const currentStart = startOfWeek(today);

    const list: WeekInfo[] = [];
    for (let w = -weeksBefore; w <= weeksAfter; w += 1) {
      const start = addDays(currentStart, w * 7);
      const days: DayInfo[] = Array.from({ length: 7 }, (_, i) => {
        const d = addDays(start, i);
        return { date: d, dateStr: todayString(d) };
      });
      const end = addDays(start, 6);
      list.push({ start, end, days, key: todayString(start) });
    }
    return list;
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const centerToday = () => {
      const todayStr = todayString();
      const column = el.querySelector(
        `[data-date='${todayStr}']`,
      ) as HTMLElement | null;
      if (column) {
        const left =
          column.offsetLeft + column.offsetWidth / 2 - el.clientWidth / 2;
        el.scrollTo({ left, behavior: "auto" });
      }
    };
    centerToday();
    const onResize = () => centerToday();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function onDropTask(e: React.DragEvent, toDateStr: string) {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData("text/taskId");
    const fromDate = e.dataTransfer.getData("text/fromDate");
    if (taskId && fromDate) moveTask(fromDate, taskId, toDateStr);
  }

  const todayStrVal = todayString();

  const [focusForTask, setFocusForTask] = useState<FocusTask | null>(null);
  const [focusRun, setFocusRun] = useState<FocusRun | null>(null);
  const [focusIndex, setFocusIndex] = useState(0);
  const [focusRemaining, setFocusRemaining] = useState(0);
  const [focusRunning, setFocusRunning] = useState(true);
  const [showFocusModal, setShowFocusModal] = useState(true);

  // Keyboard shortcuts while a run is active
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!focusRun) return;
      if (e.code === "Space") {
        e.preventDefault();
        setFocusRunning((r) => !r);
      } else if (e.key.toLowerCase() === "m") {
        setShowFocusModal((v) => !v);
      } else if (e.key === "Escape") {
        setShowFocusModal(false); // minimize on Esc
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusRun]);

  // Precompute total focus minutes per taskId
  const focusMinutesByTaskId = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of focusSessions) {
      if (!s.taskId) continue;
      map.set(s.taskId, (map.get(s.taskId) ?? 0) + Math.round(s.seconds / 60));
    }
    return map;
  }, [focusSessions]);

  // Timer effect for focus run
  useEffect(() => {
    if (!focusRun) return;
    // announce start
    if (ui.notificationsEnabled)
      notify(
        focusRun.task.title,
        focusRun.segments[0]?.type === "work"
          ? "Focus started"
          : "Break started",
      );
    if (ui.soundEnabled) beep();
    setFocusIndex(0);
    setFocusRemaining(focusRun.segments[0]?.seconds ?? 0);
    setFocusRunning(true);
  }, [focusRun]);

  useEffect(() => {
    if (!focusRun || !focusRunning) return;
    const id = window.setInterval(() => {
      setFocusRemaining((r) => {
        if (r > 1) return r - 1;
        setFocusIndex((i) => {
          const next = i + 1;
          if (!focusRun || next >= focusRun.segments.length) {
            if (ui.notificationsEnabled)
              notify(focusRun?.task.title ?? "Focus", "Session complete");
            if (ui.soundEnabled) beep();
            // log and auto-mark
            if (focusRun) {
              addFocusSession(
                focusRun.totalWorkSeconds,
                focusRun.label,
                focusRun.task.id,
              );
              const list = tasksByDate[focusRun.task.dateStr] ?? [];
              const t = list.find((x) => x.id === focusRun.task.id);
              if (t && !t.done)
                toggleTask(focusRun.task.dateStr, focusRun.task.id);
            }
            setFocusRun(null);
            return i;
          }
          const nextSeconds = focusRun.segments[next].seconds;
          setFocusRemaining(nextSeconds);
          if (ui.notificationsEnabled)
            notify(
              focusRun.task.title,
              focusRun.segments[next].type === "work" ? "Focus" : "Break",
            );
          if (ui.soundEnabled) beep();
          if (!ui.autoStartNextSegment) setFocusRunning(false);
          return next;
        });
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [
    focusRun,
    focusRunning,
    ui.notificationsEnabled,
    ui.soundEnabled,
    ui.autoStartNextSegment,
    addFocusSession,
    tasksByDate,
    toggleTask,
  ]);

  return (
    <div className="space-y-4">
      <div
        ref={scrollerRef}
        className="w-full snap-x snap-mandatory overflow-x-auto"
      >
        <div className="flex min-w-full items-stretch gap-4">
          {weeks.map((week, idx) => (
            <Fragment key={week.key}>
              {idx > 0 && (
                <div
                  aria-hidden
                  className="w-px self-stretch bg-neutral-300 dark:bg-neutral-800"
                />
              )}
              {week.days.map(({ date, dateStr }) => {
                const tasks = tasksByDate[dateStr] ?? [];
                const isToday = todayStrVal === dateStr;
                const dayHabits = habits.filter((h) =>
                  isHabitScheduledOnDate(h.schedule, date),
                );

                return (
                  <Card
                    key={dateStr}
                    data-date={dateStr}
                    className={`${isToday ? "border-calm-300 dark:border-calm-700" : "border-neutral-200 dark:border-neutral-800"} flex min-h-[560px] min-w-[360px] max-w-[420px] snap-center flex-col p-3 transition-colors`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDropTask(e, dateStr)}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                          {fmtDay(date)}
                        </div>
                        <div className="text-base font-medium">
                          {fmtDate(date)}
                        </div>
                      </div>
                      {isToday && (
                        <span className="rounded-full bg-calm-600 px-2 py-0.5 text-[10px] text-white">
                          Today
                        </span>
                      )}
                    </div>

                    <AddInline
                      onAdd={(title) => addTask(dateStr, title)}
                      placeholder="Add a task"
                    />

                    {tasks.length > 3 && (
                      <div className="mt-1 text-[11px] text-neutral-500">
                        Consider keeping only three to stay focused.
                      </div>
                    )}

                    <ul
                      className="mt-2 space-y-1 min-h-[60px]"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                    >
                      {tasks.map((t) => (
                        <TaskItem
                          key={t.id}
                          task={t}
                          minutes={focusMinutesByTaskId.get(t.id) ?? 0}
                          onToggle={() => toggleTask(dateStr, t.id)}
                          onDelete={() => deleteTask(dateStr, t.id)}
                          onDragStart={(e) => {
                            e.preventDefault();
                            e.dataTransfer.setData("text/taskId", t.id);
                            e.dataTransfer.setData("text/fromDate", dateStr);
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          openFocus={() =>
                            setFocusForTask({
                              id: t.id,
                              dateStr,
                              title: t.title,
                            })
                          }
                        />
                      ))}
                    </ul>

                    {dayHabits.length > 0 && (
                      <div className="mb-3 space-y-1">
                        <div className="text-xs text-neutral-500">Habits</div>
                        <ul className="space-y-1">
                          {dayHabits.map((h) => {
                            const done =
                              Array.isArray(h.completions) &&
                              h.completions.includes(dateStr);
                            return (
                              <li
                                key={h.id}
                                className="flex items-center justify-between"
                              >
                                <label className="flex items-center gap-2">
                                  <Checkbox
                                    checked={!!done}
                                    onChange={() =>
                                      toggleHabitForDate(h.id, dateStr)
                                    }
                                  />
                                  <span className="text-[13px]">{h.name}</span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </Card>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {focusForTask && (
        <FocusConfigModal
          task={focusForTask}
          onClose={() => setFocusForTask(null)}
          onStart={(segments, totalFocusSeconds, label) => {
            const run: FocusRun = {
              task: focusForTask,
              segments,
              totalWorkSeconds: totalFocusSeconds,
              label,
            };
            setFocusRun(run);
            setShowFocusModal(true);
            setFocusForTask(null); // close config modal
          }}
        />
      )}

      {focusRun && showFocusModal && (
        <FocusRunModal
          run={focusRun}
          index={focusIndex}
          remaining={focusRemaining}
          running={focusRunning}
          onPause={() => setFocusRunning(false)}
          onResume={() => setFocusRunning(true)}
          onCancel={() => setFocusRun(null)}
          onMinimize={() => setShowFocusModal(false)}
        />
      )}

      {focusRun && !showFocusModal && (
        <FocusMiniWidget
          run={focusRun}
          index={focusIndex}
          remaining={focusRemaining}
          running={focusRunning}
          onPause={() => setFocusRunning(false)}
          onResume={() => setFocusRunning(true)}
          onCancel={() => setFocusRun(null)}
          onExpand={() => setShowFocusModal(true)}
        />
      )}
    </div>
  );
}

function FocusConfigModal({
  task,
  onClose,
  onStart,
}: {
  task: FocusTask;
  onClose: () => void;
  onStart: (
    segments: Segment[],
    totalFocusSeconds: number,
    label: string,
  ) => void;
}) {
  const ui = useAppState((s) => s.ui);
  const setUi = useAppState((s) => s.setUi);
  const [pattern, setPattern] = useState<"single" | "pomodoro" | "long">(
    ui.focusDefaults.pattern,
  );
  const [singleMinutes, setSingleMinutes] = useState(
    ui.focusDefaults.singleMinutes,
  );
  const [pomodoroWork, setPomodoroWork] = useState(
    ui.focusDefaults.pomodoroWork,
  );
  const [pomodoroBreak, setPomodoroBreak] = useState(
    ui.focusDefaults.pomodoroBreak,
  );
  const [pomodoroRounds, setPomodoroRounds] = useState(
    ui.focusDefaults.pomodoroRounds,
  );
  const [longTotalMinutes, setLongTotalMinutes] = useState(
    ui.focusDefaults.longTotalMinutes,
  );
  const [longBreakEvery, setLongBreakEvery] = useState(
    ui.focusDefaults.longBreakEvery,
  );
  const [longBreakMinutes, setLongBreakMinutes] = useState(
    ui.focusDefaults.longBreakMinutes,
  );

  useEffect(() => {
    setUi({
      focusDefaults: {
        pattern,
        singleMinutes,
        pomodoroWork,
        pomodoroBreak,
        pomodoroRounds,
        longTotalMinutes,
        longBreakEvery,
        longBreakMinutes,
      },
    });
  }, [
    pattern,
    singleMinutes,
    pomodoroWork,
    pomodoroBreak,
    pomodoroRounds,
    longTotalMinutes,
    longBreakEvery,
    longBreakMinutes,
    setUi,
  ]);

  function build(): { segments: Segment[]; total: number; label: string } {
    if (pattern === "single") {
      const secs = singleMinutes * 60;
      return {
        segments: [{ type: "work", seconds: secs }],
        total: secs,
        label: `Focus • ${task.title}`,
      };
    }
    if (pattern === "pomodoro") {
      const segs: Segment[] = [];
      for (let i = 0; i < pomodoroRounds; i += 1) {
        segs.push({ type: "work", seconds: pomodoroWork * 60 });
        if (i < pomodoroRounds - 1)
          segs.push({ type: "break", seconds: pomodoroBreak * 60 });
      }
      return {
        segments: segs,
        total: pomodoroRounds * pomodoroWork * 60,
        label: `Pomodoro x${pomodoroRounds} • ${task.title}`,
      };
    }
    // long with breaks: total minutes includes breaks
    const segs: Segment[] = [];
    let remaining = longTotalMinutes * 60;
    let focusTotal = 0;
    while (remaining > 0) {
      const work = Math.min(longBreakEvery * 60, remaining);
      segs.push({ type: "work", seconds: work });
      focusTotal += work;
      remaining -= work;
      if (remaining <= 0) break;
      const br = Math.min(longBreakMinutes * 60, remaining);
      segs.push({ type: "break", seconds: br });
      remaining -= br;
    }
    return {
      segments: segs,
      total: focusTotal,
      label: `Long focus ${longTotalMinutes}m • ${task.title}`,
    };
  }

  function start() {
    const { segments, total, label } = build();
    onStart(segments, total, label);
  }

  return (
    <Modal
      open={!!task}
      onClose={onClose}
      title={`Deep Focus for: ${task.title}`}
    >
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={pattern === "single"}
              onChange={() => setPattern("single")}
            />{" "}
            Single session
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={pattern === "pomodoro"}
              onChange={() => setPattern("pomodoro")}
            />{" "}
            Pomodoro
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={pattern === "long"}
              onChange={() => setPattern("long")}
            />{" "}
            Long with breaks
          </label>
        </div>

        {pattern === "single" && (
          <div className="flex items-center gap-2">
            <span>Minutes</span>
            <input
              type="number"
              min={5}
              max={240}
              value={singleMinutes}
              onChange={(e) => setSingleMinutes(Number(e.target.value))}
              className="w-24 rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
        )}

        {pattern === "pomodoro" && (
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center gap-2">
              <span>Work</span>
              <input
                type="number"
                min={10}
                max={60}
                value={pomodoroWork}
                onChange={(e) => setPomodoroWork(Number(e.target.value))}
                className="w-20 rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <span>Break</span>
              <input
                type="number"
                min={3}
                max={20}
                value={pomodoroBreak}
                onChange={(e) => setPomodoroBreak(Number(e.target.value))}
                className="w-20 rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <span>Rounds</span>
              <input
                type="number"
                min={2}
                max={8}
                value={pomodoroRounds}
                onChange={(e) => setPomodoroRounds(Number(e.target.value))}
                className="w-20 rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
          </div>
        )}

        {pattern === "long" && (
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center gap-2">
              <span>Total</span>
              <input
                type="number"
                min={60}
                max={240}
                value={longTotalMinutes}
                onChange={(e) => setLongTotalMinutes(Number(e.target.value))}
                className="w-24 rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <span>Break every</span>
              <input
                type="number"
                min={25}
                max={90}
                value={longBreakEvery}
                onChange={(e) => setLongBreakEvery(Number(e.target.value))}
                className="w-24 rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <span>Break</span>
              <input
                type="number"
                min={5}
                max={30}
                value={longBreakMinutes}
                onChange={(e) => setLongBreakMinutes(Number(e.target.value))}
                className="w-24 rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
          >
            Cancel
          </button>
          <button
            onClick={start}
            className="rounded-md bg-calm-600 px-3 py-2 text-sm text-white"
          >
            Start
          </button>
        </div>
      </div>
    </Modal>
  );
}

function FocusRunModal({
  run,
  index,
  remaining,
  running,
  onPause,
  onResume,
  onCancel,
  onMinimize,
}: {
  run: FocusRun;
  index: number;
  remaining: number;
  running: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onMinimize: () => void;
}) {
  // keyboard shortcuts inside modal too
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        (running ? onPause : onResume)();
      } else if (e.key.toLowerCase() === "m" || e.key === "Escape") {
        onMinimize();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, onPause, onResume, onMinimize]);

  const seg = run.segments[index] ?? { type: "work", seconds: 0 };
  function fmt(seconds: number) {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }
  return (
    <Modal open={true} onClose={onMinimize} title={run.task.title}>
      <div className="space-y-3 text-center">
        <div className="text-xs uppercase tracking-wide text-neutral-500">
          {seg.type === "work" ? "Focus" : "Break"}
        </div>
        <div className="text-5xl font-bold tabular-nums">{fmt(remaining)}</div>
        <div className="text-xs text-neutral-500">
          {index + 1}/{run.segments.length}
        </div>
        <div className="flex justify-center gap-2">
          {!running ? (
            <button
              onClick={onResume}
              className="rounded-md bg-calm-600 px-3 py-2 text-sm text-white"
            >
              Resume
            </button>
          ) : (
            <button
              onClick={onPause}
              className="rounded-md bg-calm-600 px-3 py-2 text-sm text-white"
            >
              Pause
            </button>
          )}
          <button
            onClick={onMinimize}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
          >
            Minimize
          </button>
          <button
            onClick={onCancel}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

function FocusMiniWidget({
  run,
  index,
  remaining,
  running,
  onPause,
  onResume,
  onCancel,
  onExpand,
}: {
  run: FocusRun;
  index: number;
  remaining: number;
  running: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onExpand: () => void;
}) {
  const seg = run.segments[index] ?? { type: "work", seconds: 0 };
  function fmt(seconds: number) {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }
  return (
    <div className="fixed bottom-4 right-4 z-40 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-center gap-3">
        <div className="min-w-[140px]">
          <div className="truncate font-medium">{run.task.title}</div>
          <div className="text-xs text-neutral-500">
            {seg.type === "work" ? "Focus" : "Break"} • {fmt(remaining)} •{" "}
            {index + 1}/{run.segments.length}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!running ? (
            <button
              onClick={onResume}
              className="rounded-md bg-calm-600 px-2 py-1 text-xs text-white"
            >
              Resume
            </button>
          ) : (
            <button
              onClick={onPause}
              className="rounded-md bg-calm-600 px-2 py-1 text-xs text-white"
            >
              Pause
            </button>
          )}
          <button
            onClick={onExpand}
            className="rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700"
          >
            Expand
          </button>
          <button
            onClick={onCancel}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function AddInline({
  onAdd,
  placeholder,
}: {
  onAdd: (title: string) => void;
  placeholder: string;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onAdd(value.trim());
        setValue("");
      }}
      className="flex gap-1"
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />
      <button className="rounded-sm bg-calm-600 px-2 py-1 text-xs text-white">
        Add
      </button>
    </form>
  );
}

function TaskItem({
  task,
  minutes,
  onToggle,
  onDelete,
  onDragStart,
  openFocus,
}: {
  task: Task;
  minutes: number;
  onToggle: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  openFocus: () => void;
}) {
  return (
    <li
      draggable
      onDragStart={onDragStart}
      className="flex items-center justify-between gap-2 rounded-sm border border-neutral-200 px-2 py-1 text-sm hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
    >
      <label className="flex flex-1 items-center gap-2">
        <input
          type="checkbox"
          checked={task.done}
          onChange={onToggle}
          className="h-3 w-3 rounded border-neutral-300 text-calm-600 focus:ring-calm-500"
        />
        <span
          className={`flex-1 ${task.done ? "text-neutral-400 line-through" : ""}`}
        >
          {task.title}
        </span>
      </label>
      {minutes > 0 && (
        <span
          title={`${minutes} min focused`}
          className="rounded-full bg-calm-600/10 px-2 py-0.5 text-[10px] text-calm-700 dark:text-calm-300"
        >
          {minutes}m
        </span>
      )}
      <button
        onClick={openFocus}
        className="rounded border border-neutral-300 px-2 py-0.5 text-xs dark:border-neutral-700"
      >
        Focus
      </button>
      <button
        onClick={onDelete}
        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
      >
        ✕
      </button>
    </li>
  );
}
