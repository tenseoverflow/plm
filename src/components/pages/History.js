import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { isHabitScheduledOnDate, todayString, useAppState } from '../../state';
import { moodEmoji } from '../../lib/format';
import Card from '../ui/Card';
import Container from '../ui/Container';
export default function History() {
    const moodByDate = useAppState((s) => s.moodByDate);
    const intentionByDate = useAppState((s) => s.intentionByDate);
    const tasksByDate = useAppState((s) => s.tasksByDate);
    const journalByDate = useAppState((s) => s.journalByDate);
    const focusSessions = useAppState((s) => s.focusSessions);
    const habits = useAppState((s) => s.habits);
    const [count, setCount] = useState(30);
    const sentinelRef = useRef(null);
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el)
            return;
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting)
                    setCount((c) => c + 30);
            });
        });
        io.observe(el);
        return () => io.disconnect();
    }, []);
    const days = useMemo(() => {
        const list = [];
        const cursor = new Date();
        for (let i = 0; i < count; i += 1) {
            list.push(todayString(cursor));
            cursor.setDate(cursor.getDate() - 1);
        }
        return list;
    }, [count]);
    return (_jsx(Container, { children: _jsxs("div", { className: "space-y-4", children: [days.map((d) => (_jsx(DayCard, { dateStr: d, mood: moodByDate[d], intention: intentionByDate[d], tasks: tasksByDate[d] ?? [], journal: journalByDate[d], focusMins: Math.round(focusSessions.filter((f) => f.date === d).reduce((a, b) => a + b.seconds, 0) / 60), scheduledHabits: habits.filter((h) => {
                        const dt = new Date(d + 'T00:00:00');
                        return isHabitScheduledOnDate(h.schedule, dt);
                    }) }, d))), _jsx("div", { ref: sentinelRef, className: "h-8" })] }) }));
}
function DayCard({ dateStr, mood, intention, tasks, journal, focusMins, scheduledHabits, }) {
    const completedHabits = scheduledHabits.filter((h) => h.completions.includes(dateStr)).length;
    const [showJournal, setShowJournal] = useState(false);
    return (_jsxs(Card, { subtle: true, className: "p-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "text-sm font-medium", children: dateStr }), _jsx("div", { className: "text-2xl", "aria-hidden": true, children: moodEmoji(mood) })] }), _jsxs("div", { className: "mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-neutral-500", children: "Intention" }), _jsx("div", { className: "truncate", children: intention || '—' })] }), _jsxs("div", { children: [_jsx("div", { className: "text-neutral-500", children: "Tasks" }), _jsxs("div", { children: [tasks.filter((t) => t.done).length, "/", tasks.length, " done"] })] }), _jsxs("div", { children: [_jsx("div", { className: "text-neutral-500", children: "Journal" }), _jsx("div", { children: journal && journal.trim().length > 0 ? (_jsx("button", { onClick: () => setShowJournal((s) => !s), className: "underline", children: showJournal ? 'Hide' : 'Show' })) : ('—') })] }), _jsxs("div", { children: [_jsx("div", { className: "text-neutral-500", children: "Focus" }), _jsxs("div", { children: [focusMins, " min"] })] }), _jsxs("div", { className: "sm:col-span-4", children: [_jsx("div", { className: "text-neutral-500", children: "Habits" }), _jsxs("div", { children: [completedHabits, "/", scheduledHabits.length, " completed"] })] })] }), showJournal && journal && (_jsx("div", { className: "mt-3 whitespace-pre-wrap rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900", children: journal }))] }));
}
