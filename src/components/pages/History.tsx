import { useEffect, useMemo, useRef, useState } from 'react';
import { isHabitScheduledOnDate, MoodValue, todayString, useAppState } from '@store/index';
import { moodEmoji } from '@lib/format';
import Card from '@components/ui/Card';
import Container from '@components/ui/Container';

export default function History() {
    const moodByDate = useAppState((s) => s.moodByDate);
    const intentionByDate = useAppState((s) => s.intentionByDate);
    const tasksByDate = useAppState((s) => s.tasksByDate);
    const journalByDate = useAppState((s) => s.journalByDate);
    const focusSessions = useAppState((s) => s.focusSessions);
    const habits = useAppState((s) => s.habits);

    const [count, setCount] = useState(30);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) setCount((c) => c + 30);
            });
        });
        io.observe(el);
        return () => io.disconnect();
    }, []);

    const days = useMemo(() => {
        const list: string[] = [];
        const cursor = new Date();
        for (let i = 0; i < count; i += 1) {
            const d = todayString(cursor);
            const hasMood = !!moodByDate[d];
            const hasIntention = !!(intentionByDate[d] && intentionByDate[d]?.trim());
            const hasTasks = (tasksByDate[d]?.length ?? 0) > 0;
            const hasJournal = !!(journalByDate[d] && journalByDate[d]?.trim());
            const hasFocus = focusSessions.some((f) => f.date === d);
            if (hasMood || hasIntention || hasTasks || hasJournal || hasFocus) {
                list.push(d);
            }
            cursor.setDate(cursor.getDate() - 1);
        }
        return list;
    }, [count, moodByDate, intentionByDate, tasksByDate, journalByDate, focusSessions]);

    return (
        <Container>
            <div className="space-y-4">
                {days.map((d) => (
                    <DayCard
                        key={d}
                        dateStr={d}
                        mood={moodByDate[d]}
                        intention={intentionByDate[d]}
                        tasks={tasksByDate[d] ?? []}
                        journal={journalByDate[d]}
                        focusMins={Math.round(
                            focusSessions.filter((f) => f.date === d).reduce((a, b) => a + b.seconds, 0) / 60
                        )}
                        scheduledHabits={habits.filter((h) => {
                            const dt = new Date(d + 'T00:00:00');
                            return isHabitScheduledOnDate(h.schedule, dt);
                        })}
                    />
                ))}
                <div ref={sentinelRef} className="h-8" />
            </div>
        </Container>
    );
}

function DayCard({
    dateStr,
    mood,
    intention,
    tasks,
    journal,
    focusMins,
    scheduledHabits,
}: {
    dateStr: string;
    mood?: MoodValue;
    intention?: string;
    tasks: { id: string; title: string; done: boolean }[];
    journal?: string;
    focusMins: number;
    scheduledHabits: { id: string; name: string; completions: string[] }[];
}) {
    const completedHabits = scheduledHabits.filter((h) => h.completions.includes(dateStr)).length;
    const [showJournal, setShowJournal] = useState(false);

    return (
        <Card subtle className="p-3">
            <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{dateStr}</div>
                <div className="text-2xl" aria-hidden>
                    {moodEmoji(mood)}
                </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                    <div className="text-neutral-500">Intention</div>
                    <div className="truncate">{intention || '—'}</div>
                </div>
                <div>
                    <div className="text-neutral-500">Tasks</div>
                    <div>
                        {tasks.filter((t) => t.done).length}/{tasks.length} done
                    </div>
                </div>
                <div>
                    <div className="text-neutral-500">Journal</div>
                    <div>
                        {journal && journal.trim().length > 0 ? (
                            <button onClick={() => setShowJournal((s) => !s)} className="underline">
                                {showJournal ? 'Hide' : 'Show'}
                            </button>
                        ) : (
                            '—'
                        )}
                    </div>
                </div>
                <div>
                    <div className="text-neutral-500">Focus</div>
                    <div>{focusMins} min</div>
                </div>
                <div className="sm:col-span-4">
                    <div className="text-neutral-500">Habits</div>
                    <div>
                        {completedHabits}/{scheduledHabits.length} completed
                    </div>
                </div>
            </div>
            {showJournal && journal && (
                <div className="mt-3 whitespace-pre-wrap rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900">
                    {journal}
                </div>
            )}
        </Card>
    );
}
