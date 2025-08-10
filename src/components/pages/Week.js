import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppState, todayString } from '../../state';
import { isHabitScheduledOnDate } from '../../state';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Checkbox from '../ui/Checkbox';
import Modal from '../ui/Modal';
function startOfWeek(date) {
    // Monday as first day
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}
function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}
function fmtDay(date) {
    return date.toLocaleDateString(undefined, { weekday: 'short' });
}
function fmtDate(date) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function fmtRange(start, end) {
    return `${fmtDate(start)} – ${fmtDate(end)}`;
}
function beep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
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
    }
    catch { }
}
async function notify(title, body) {
    try {
        if (!('Notification' in window))
            return;
        if (Notification.permission === 'default')
            await Notification.requestPermission();
        if (Notification.permission === 'granted')
            new Notification(title, { body });
    }
    catch { }
}
export default function Week() {
    const tasksByDate = useAppState((s) => s.tasksByDate);
    const focusSessions = useAppState((s) => s.focusSessions);
    const addTask = useAppState((s) => s.addTask);
    const toggleTask = useAppState((s) => s.toggleTask);
    const deleteTask = useAppState((s) => s.deleteTask);
    const moveTask = useAppState((s) => s.moveTask);
    const addFocusSession = useAppState((s) => s.addFocusSession);
    const moodByDate = useAppState((s) => s.moodByDate);
    const setMood = useAppState((s) => s.setMood);
    const intentionByDate = useAppState((s) => s.intentionByDate);
    const setIntention = useAppState((s) => s.setIntention);
    const showMindfulness = useAppState((s) => s.ui.showMindfulnessInWeek);
    const ui = useAppState((s) => s.ui);
    const habits = useAppState((s) => s.habits ?? []);
    const toggleHabitForDate = useAppState((s) => s.toggleHabitForDate);
    const scrollerRef = useRef(null);
    const weeks = useMemo(() => {
        const weeksBefore = 4;
        const weeksAfter = 4;
        const today = new Date();
        const currentStart = startOfWeek(today);
        const list = [];
        for (let w = -weeksBefore; w <= weeksAfter; w += 1) {
            const start = addDays(currentStart, w * 7);
            const days = Array.from({ length: 7 }, (_, i) => {
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
        if (!el)
            return;
        const centerToday = () => {
            const todayStr = todayString();
            const column = el.querySelector(`[data-date='${todayStr}']`);
            if (column) {
                const left = column.offsetLeft + column.offsetWidth / 2 - el.clientWidth / 2;
                el.scrollTo({ left, behavior: 'auto' });
            }
        };
        centerToday();
        const onResize = () => centerToday();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    function onDropTask(e, toDateStr) {
        const taskId = e.dataTransfer.getData('text/taskId');
        const fromDate = e.dataTransfer.getData('text/fromDate');
        if (taskId && fromDate)
            moveTask(fromDate, taskId, toDateStr);
    }
    const todayStrVal = todayString();
    const moodEmoji = (m) => (m === 5 ? '🌞' : m === 4 ? '😊' : m === 3 ? '🙂' : m === 2 ? '☁️' : m === 1 ? '😞' : '—');
    const [focusForTask, setFocusForTask] = useState(null);
    const [focusRun, setFocusRun] = useState(null);
    const [focusIndex, setFocusIndex] = useState(0);
    const [focusRemaining, setFocusRemaining] = useState(0);
    const [focusRunning, setFocusRunning] = useState(true);
    const [showFocusModal, setShowFocusModal] = useState(true);
    // Keyboard shortcuts while a run is active
    useEffect(() => {
        function onKey(e) {
            if (!focusRun)
                return;
            if (e.code === 'Space') {
                e.preventDefault();
                setFocusRunning((r) => !r);
            }
            else if (e.key.toLowerCase() === 'm') {
                setShowFocusModal((v) => !v);
            }
            else if (e.key === 'Escape') {
                setShowFocusModal(false); // minimize on Esc
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [focusRun]);
    // Precompute total focus minutes per taskId
    const focusMinutesByTaskId = useMemo(() => {
        const map = new Map();
        for (const s of focusSessions) {
            if (!s.taskId)
                continue;
            map.set(s.taskId, (map.get(s.taskId) ?? 0) + Math.round(s.seconds / 60));
        }
        return map;
    }, [focusSessions]);
    // Timer effect for focus run
    useEffect(() => {
        if (!focusRun)
            return;
        // announce start
        if (ui.notificationsEnabled)
            notify(focusRun.task.title, focusRun.segments[0]?.type === 'work' ? 'Focus started' : 'Break started');
        if (ui.soundEnabled)
            beep();
        setFocusIndex(0);
        setFocusRemaining(focusRun.segments[0]?.seconds ?? 0);
        setFocusRunning(true);
    }, [focusRun]);
    useEffect(() => {
        if (!focusRun || !focusRunning)
            return;
        const id = window.setInterval(() => {
            setFocusRemaining((r) => {
                if (r > 1)
                    return r - 1;
                setFocusIndex((i) => {
                    const next = i + 1;
                    if (!focusRun || next >= focusRun.segments.length) {
                        if (ui.notificationsEnabled)
                            notify(focusRun?.task.title ?? 'Focus', 'Session complete');
                        if (ui.soundEnabled)
                            beep();
                        // log and auto-mark
                        if (focusRun) {
                            addFocusSession(focusRun.totalWorkSeconds, focusRun.label, focusRun.task.id);
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
                        notify(focusRun.task.title, focusRun.segments[next].type === 'work' ? 'Focus' : 'Break');
                    if (ui.soundEnabled)
                        beep();
                    if (!ui.autoStartNextSegment)
                        setFocusRunning(false);
                    return next;
                });
                return 0;
            });
        }, 1000);
        return () => window.clearInterval(id);
    }, [focusRun, focusRunning, ui.notificationsEnabled, ui.soundEnabled, ui.autoStartNextSegment, addFocusSession, tasksByDate, toggleTask]);
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { ref: scrollerRef, className: "overflow-x-auto snap-x snap-mandatory w-full", children: _jsx("div", { className: "flex items-stretch gap-4 min-w-full", children: weeks.map((week, idx) => (_jsxs(React.Fragment, { children: [idx > 0 && (_jsx("div", { "aria-hidden": true, className: "w-px self-stretch bg-neutral-300 dark:bg-neutral-800" })), week.days.map(({ date, dateStr }) => {
                                const tasks = tasksByDate[dateStr] ?? [];
                                const isToday = todayStrVal === dateStr;
                                const mood = moodByDate[dateStr];
                                const intention = intentionByDate[dateStr] ?? '';
                                const dayHabits = habits.filter((h) => isHabitScheduledOnDate(h.schedule, date));
                                return (_jsxs(Card, { "data-date": dateStr, className: `${isToday ? 'border-calm-300 dark:border-calm-700' : 'border-neutral-200 dark:border-neutral-800'} snap-center flex min-h-[560px] min-w-[360px] max-w-[420px] flex-col p-3 transition-colors`, onDragOver: (e) => e.preventDefault(), onDrop: (e) => onDropTask(e, dateStr), children: [_jsxs("div", { className: "mb-3 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[11px] uppercase tracking-wide text-neutral-500", children: fmtDay(date) }), _jsx("div", { className: "text-base font-medium", children: fmtDate(date) })] }), isToday && (_jsx("span", { className: "rounded-full bg-calm-600 px-2 py-0.5 text-[10px] text-white", children: "Today" }))] }), _jsx(AddInline, { onAdd: (title) => addTask(dateStr, title), placeholder: "Add a task" }), tasks.length > 3 && (_jsx("div", { className: "mt-1 text-[11px] text-neutral-500", children: "Consider keeping only three to stay focused." })), _jsx("ul", { className: "mt-2 space-y-1", children: tasks.map((t) => (_jsx(TaskItem, { task: t, minutes: focusMinutesByTaskId.get(t.id) ?? 0, onToggle: () => toggleTask(dateStr, t.id), onDelete: () => deleteTask(dateStr, t.id), onDragStart: (e) => {
                                                    e.dataTransfer.setData('text/taskId', t.id);
                                                    e.dataTransfer.setData('text/fromDate', dateStr);
                                                    e.dataTransfer.effectAllowed = 'move';
                                                }, openFocus: () => setFocusForTask({ id: t.id, dateStr, title: t.title }) }, t.id))) }), dayHabits.length > 0 && (_jsxs("div", { className: "mb-3 space-y-1", children: [_jsx("div", { className: "text-neutral-500 text-xs", children: "Habits" }), _jsx("ul", { className: "space-y-1", children: dayHabits.map((h) => {
                                                        const done = Array.isArray(h.completions) && h.completions.includes(dateStr);
                                                        return (_jsx("li", { className: "flex items-center justify-between", children: _jsxs("label", { className: "flex items-center gap-2", children: [_jsx(Checkbox, { checked: !!done, onChange: () => toggleHabitForDate(h.id, dateStr) }), _jsx("span", { className: "text-[13px]", children: h.name })] }) }, h.id));
                                                    }) })] }))] }, dateStr));
                            })] }, week.key))) }) }), focusForTask && (_jsx(FocusConfigModal, { task: focusForTask, onClose: () => setFocusForTask(null), onStart: (segments, totalFocusSeconds, label) => {
                    const run = { task: focusForTask, segments, totalWorkSeconds: totalFocusSeconds, label };
                    setFocusRun(run);
                    setShowFocusModal(true);
                    setFocusForTask(null); // close config modal
                } })), focusRun && showFocusModal && (_jsx(FocusRunModal, { run: focusRun, index: focusIndex, remaining: focusRemaining, running: focusRunning, onPause: () => setFocusRunning(false), onResume: () => setFocusRunning(true), onCancel: () => setFocusRun(null), onMinimize: () => setShowFocusModal(false) })), focusRun && !showFocusModal && (_jsx(FocusMiniWidget, { run: focusRun, index: focusIndex, remaining: focusRemaining, running: focusRunning, onPause: () => setFocusRunning(false), onResume: () => setFocusRunning(true), onCancel: () => setFocusRun(null), onExpand: () => setShowFocusModal(true) }))] }));
}
function FocusConfigModal({ task, onClose, onStart, }) {
    const ui = useAppState((s) => s.ui);
    const setUi = useAppState((s) => s.setUi);
    const [pattern, setPattern] = useState(ui.focusDefaults.pattern);
    const [singleMinutes, setSingleMinutes] = useState(ui.focusDefaults.singleMinutes);
    const [pomodoroWork, setPomodoroWork] = useState(ui.focusDefaults.pomodoroWork);
    const [pomodoroBreak, setPomodoroBreak] = useState(ui.focusDefaults.pomodoroBreak);
    const [pomodoroRounds, setPomodoroRounds] = useState(ui.focusDefaults.pomodoroRounds);
    const [longTotalMinutes, setLongTotalMinutes] = useState(ui.focusDefaults.longTotalMinutes);
    const [longBreakEvery, setLongBreakEvery] = useState(ui.focusDefaults.longBreakEvery);
    const [longBreakMinutes, setLongBreakMinutes] = useState(ui.focusDefaults.longBreakMinutes);
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
    }, [pattern, singleMinutes, pomodoroWork, pomodoroBreak, pomodoroRounds, longTotalMinutes, longBreakEvery, longBreakMinutes, setUi]);
    function build() {
        if (pattern === 'single') {
            const secs = singleMinutes * 60;
            return { segments: [{ type: 'work', seconds: secs }], total: secs, label: `Focus • ${task.title}` };
        }
        if (pattern === 'pomodoro') {
            const segs = [];
            for (let i = 0; i < pomodoroRounds; i += 1) {
                segs.push({ type: 'work', seconds: pomodoroWork * 60 });
                if (i < pomodoroRounds - 1)
                    segs.push({ type: 'break', seconds: pomodoroBreak * 60 });
            }
            return { segments: segs, total: pomodoroRounds * pomodoroWork * 60, label: `Pomodoro x${pomodoroRounds} • ${task.title}` };
        }
        // long with breaks: total minutes includes breaks
        const segs = [];
        let remaining = longTotalMinutes * 60;
        let focusTotal = 0;
        while (remaining > 0) {
            const work = Math.min(longBreakEvery * 60, remaining);
            segs.push({ type: 'work', seconds: work });
            focusTotal += work;
            remaining -= work;
            if (remaining <= 0)
                break;
            const br = Math.min(longBreakMinutes * 60, remaining);
            segs.push({ type: 'break', seconds: br });
            remaining -= br;
        }
        return { segments: segs, total: focusTotal, label: `Long focus ${longTotalMinutes}m • ${task.title}` };
    }
    function start() {
        const { segments, total, label } = build();
        onStart(segments, total, label);
    }
    return (_jsx(Modal, { open: !!task, onClose: onClose, title: `Deep Focus for: ${task.title}`, children: _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("label", { className: "flex items-center gap-1", children: [_jsx("input", { type: "radio", checked: pattern === 'single', onChange: () => setPattern('single') }), " Single session"] }), _jsxs("label", { className: "flex items-center gap-1", children: [_jsx("input", { type: "radio", checked: pattern === 'pomodoro', onChange: () => setPattern('pomodoro') }), " Pomodoro"] }), _jsxs("label", { className: "flex items-center gap-1", children: [_jsx("input", { type: "radio", checked: pattern === 'long', onChange: () => setPattern('long') }), " Long with breaks"] })] }), pattern === 'single' && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { children: "Minutes" }), _jsx("input", { type: "number", min: 5, max: 240, value: singleMinutes, onChange: (e) => setSingleMinutes(Number(e.target.value)), className: "w-24 rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900" })] })), pattern === 'pomodoro' && (_jsxs("div", { className: "grid grid-cols-3 gap-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { children: "Work" }), _jsx("input", { type: "number", min: 10, max: 60, value: pomodoroWork, onChange: (e) => setPomodoroWork(Number(e.target.value)), className: "w-20 rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { children: "Break" }), _jsx("input", { type: "number", min: 3, max: 20, value: pomodoroBreak, onChange: (e) => setPomodoroBreak(Number(e.target.value)), className: "w-20 rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { children: "Rounds" }), _jsx("input", { type: "number", min: 2, max: 8, value: pomodoroRounds, onChange: (e) => setPomodoroRounds(Number(e.target.value)), className: "w-20 rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900" })] })] })), pattern === 'long' && (_jsxs("div", { className: "grid grid-cols-3 gap-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { children: "Total" }), _jsx("input", { type: "number", min: 60, max: 240, value: longTotalMinutes, onChange: (e) => setLongTotalMinutes(Number(e.target.value)), className: "w-24 rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { children: "Break every" }), _jsx("input", { type: "number", min: 25, max: 90, value: longBreakEvery, onChange: (e) => setLongBreakEvery(Number(e.target.value)), className: "w-24 rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { children: "Break" }), _jsx("input", { type: "number", min: 5, max: 30, value: longBreakMinutes, onChange: (e) => setLongBreakMinutes(Number(e.target.value)), className: "w-24 rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900" })] })] })), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx("button", { onClick: onClose, className: "rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700", children: "Cancel" }), _jsx("button", { onClick: start, className: "rounded-md bg-calm-600 px-3 py-2 text-sm text-white", children: "Start" })] })] }) }));
}
function FocusRunModal({ run, index, remaining, running, onPause, onResume, onCancel, onMinimize }) {
    // keyboard shortcuts inside modal too
    useEffect(() => {
        function onKey(e) {
            if (e.code === 'Space') {
                e.preventDefault();
                (running ? onPause : onResume)();
            }
            else if (e.key.toLowerCase() === 'm' || e.key === 'Escape') {
                onMinimize();
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [running, onPause, onResume, onMinimize]);
    const seg = run.segments[index] ?? { type: 'work', seconds: 0 };
    function fmt(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }
    return (_jsx(Modal, { open: true, onClose: onMinimize, title: run.task.title, children: _jsxs("div", { className: "space-y-3 text-center", children: [_jsx("div", { className: "text-xs uppercase tracking-wide text-neutral-500", children: seg.type === 'work' ? 'Focus' : 'Break' }), _jsx("div", { className: "text-5xl font-bold tabular-nums", children: fmt(remaining) }), _jsxs("div", { className: "text-xs text-neutral-500", children: [index + 1, "/", run.segments.length] }), _jsxs("div", { className: "flex justify-center gap-2", children: [!running ? (_jsx("button", { onClick: onResume, className: "rounded-md bg-calm-600 px-3 py-2 text-sm text-white", children: "Resume" })) : (_jsx("button", { onClick: onPause, className: "rounded-md bg-calm-600 px-3 py-2 text-sm text-white", children: "Pause" })), _jsx("button", { onClick: onMinimize, className: "rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700", children: "Minimize" }), _jsx("button", { onClick: onCancel, className: "rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700", children: "Cancel" })] })] }) }));
}
function FocusMiniWidget({ run, index, remaining, running, onPause, onResume, onCancel, onExpand }) {
    const seg = run.segments[index] ?? { type: 'work', seconds: 0 };
    function fmt(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }
    return (_jsx("div", { className: "fixed bottom-4 right-4 z-40 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm shadow-lg dark:border-neutral-700 dark:bg-neutral-900", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "min-w-[140px]", children: [_jsx("div", { className: "truncate font-medium", children: run.task.title }), _jsxs("div", { className: "text-xs text-neutral-500", children: [seg.type === 'work' ? 'Focus' : 'Break', " \u2022 ", fmt(remaining), " \u2022 ", index + 1, "/", run.segments.length] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [!running ? (_jsx("button", { onClick: onResume, className: "rounded-md bg-calm-600 px-2 py-1 text-xs text-white", children: "Resume" })) : (_jsx("button", { onClick: onPause, className: "rounded-md bg-calm-600 px-2 py-1 text-xs text-white", children: "Pause" })), _jsx("button", { onClick: onExpand, className: "rounded-md border border-neutral-300 px-2 py-1 text-xs dark:border-neutral-700", children: "Expand" }), _jsx("button", { onClick: onCancel, className: "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200", children: "\u2715" })] })] }) }));
}
function IntentionInline({ value, onSave, placeholder }) {
    const [text, setText] = useState(value);
    useEffect(() => setText(value), [value]);
    return _jsx(Input, { value: text, onChange: (e) => setText(e.target.value), onBlur: () => onSave(text), placeholder: placeholder });
}
function AddInline({ onAdd, placeholder }) {
    const [value, setValue] = useState('');
    return (_jsxs("form", { onSubmit: (e) => {
            e.preventDefault();
            if (!value.trim())
                return;
            onAdd(value.trim());
            setValue('');
        }, className: "flex gap-1", children: [_jsx(Input, { value: value, onChange: (e) => setValue(e.target.value), placeholder: placeholder }), _jsx("button", { className: "rounded-sm bg-calm-600 px-2 py-1 text-xs text-white", children: "Add" })] }));
}
function TaskItem({ task, minutes, onToggle, onDelete, onDragStart, openFocus }) {
    return (_jsxs("li", { draggable: true, onDragStart: onDragStart, className: "flex items-center justify-between gap-2 rounded-sm border border-neutral-200 px-2 py-1 text-sm hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900", children: [_jsxs("label", { className: "flex flex-1 items-center gap-2", children: [_jsx("input", { type: "checkbox", checked: task.done, onChange: onToggle, className: "h-3 w-3 rounded border-neutral-300 text-calm-600 focus:ring-calm-500" }), _jsx("span", { className: `flex-1 ${task.done ? 'line-through text-neutral-400' : ''}`, children: task.title })] }), minutes > 0 && (_jsxs("span", { title: `${minutes} min focused`, className: "rounded-full bg-calm-600/10 px-2 py-0.5 text-[10px] text-calm-700 dark:text-calm-300", children: [minutes, "m"] })), _jsx("button", { onClick: openFocus, className: "rounded border border-neutral-300 px-2 py-0.5 text-xs dark:border-neutral-700", children: "Focus" }), _jsx("button", { onClick: onDelete, className: "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200", children: "\u2715" })] }));
}
