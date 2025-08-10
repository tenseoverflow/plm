import React, { useRef, useState } from 'react';
import { HabitSchedule, useAppState } from '../../state';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { authenticatePasskey, registerPasskey } from '../../lib/webauthn';

export default function Settings() {
    const state = useAppState();
    const resetAll = useAppState((s) => s.resetAll);
    const fileRef = useRef<HTMLInputElement | null>(null);

    const showMindfulness = useAppState((s) => s.ui.showMindfulnessInWeek);
    const setShowMindfulness = useAppState((s) => s.setShowMindfulnessInWeek);

    const ui = useAppState((s) => s.ui);
    const setUi = useAppState((s) => s.setUi);
    const setLocked = useAppState((s) => s.setLocked);

    const habits = useAppState((s) => s.habits);
    const addHabit = useAppState((s) => s.addHabit);
    const deleteHabit = useAppState((s) => s.deleteHabit);
    const setHabitSchedule = useAppState((s) => s.setHabitSchedule);

    const [newHabit, setNewHabit] = useState('');

    function exportData() {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mindful-plm-export.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function importData(file: File) {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(String(reader.result));
                localStorage.setItem('mindful-plm', JSON.stringify(data));
                window.location.reload();
            } catch {
                alert('Invalid file');
            }
        };
        reader.readAsText(file);
    }

    return (
        <div className="space-y-8">
            <section className="space-y-2">
                <div className="text-sm text-neutral-500">Week view</div>
                <label className="flex w-fit cursor-pointer items-center gap-3 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                    <input type="checkbox" checked={showMindfulness} onChange={(e) => setShowMindfulness(e.target.checked)} />
                    <span>Show mood and intention on days</span>
                </label>
            </section>

            <section className="space-y-3">
                <div className="text-sm text-neutral-500">Privacy</div>
                <div className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
                    <div className="text-sm font-medium">Passkey lock</div>
                    <p className="text-xs text-neutral-500">Protect access to the app with a device passkey (WebAuthn). Your data remains local.</p>
                    {!ui.passkeyEnabled ? (
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={async () => {
                                    try {
                                        const id = await registerPasskey('PLM');
                                        setUi({ passkeyEnabled: true, passkeyCredentialId: id });
                                        alert('Passkey registered. The app will lock on next load.');
                                    } catch (e: any) {
                                        alert(e?.message ?? 'Failed to register passkey');
                                    }
                                }}
                            >
                                Enable passkey
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-neutral-600 dark:text-neutral-300">Passkey is enabled.</span>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (confirm('Disable passkey protection?')) setUi({ passkeyEnabled: false, passkeyCredentialId: undefined });
                                }}
                            >
                                Disable
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={async () => {
                                    try {
                                        if (!ui.passkeyCredentialId) throw new Error('No credential ID');
                                        const ok = await authenticatePasskey(ui.passkeyCredentialId);
                                        if (ok) {
                                            setLocked(false);
                                            alert('Unlocked');
                                        } else {
                                            alert('Failed to unlock');
                                        }
                                    } catch (e: any) {
                                        alert(e?.message ?? 'Authentication failed');
                                    }
                                }}
                            >
                                Test unlock
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            <section className="space-y-3">
                <div className="text-sm text-neutral-500">Focus settings</div>
                <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                        <input
                            type="checkbox"
                            checked={ui.soundEnabled}
                            onChange={(e) => setUi({ soundEnabled: e.target.checked })}
                        />
                        <span>Sound notifications</span>
                    </label>
                    <label className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                        <input
                            type="checkbox"
                            checked={ui.notificationsEnabled}
                            onChange={(e) => setUi({ notificationsEnabled: e.target.checked })}
                        />
                        <span>Desktop notifications</span>
                    </label>
                    <label className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                        <input
                            type="checkbox"
                            checked={ui.autoStartNextSegment}
                            onChange={(e) => setUi({ autoStartNextSegment: e.target.checked })}
                        />
                        <span>Auto-start next segment</span>
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <div className="text-xs text-neutral-500">Single session minutes</div>
                        <Input
                            type="number"
                            value={ui.focusDefaults.singleMinutes}
                            onChange={(e) => setUi({ focusDefaults: { ...ui.focusDefaults, singleMinutes: Number(e.target.value) } })}
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-neutral-500">Pomodoro work minutes</div>
                        <Input
                            type="number"
                            value={ui.focusDefaults.pomodoroWork}
                            onChange={(e) => setUi({ focusDefaults: { ...ui.focusDefaults, pomodoroWork: Number(e.target.value) } })}
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-neutral-500">Pomodoro break minutes</div>
                        <Input
                            type="number"
                            value={ui.focusDefaults.pomodoroBreak}
                            onChange={(e) => setUi({ focusDefaults: { ...ui.focusDefaults, pomodoroBreak: Number(e.target.value) } })}
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-neutral-500">Pomodoro rounds</div>
                        <Input
                            type="number"
                            value={ui.focusDefaults.pomodoroRounds}
                            onChange={(e) => setUi({ focusDefaults: { ...ui.focusDefaults, pomodoroRounds: Number(e.target.value) } })}
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-neutral-500">Long total minutes</div>
                        <Input
                            type="number"
                            value={ui.focusDefaults.longTotalMinutes}
                            onChange={(e) => setUi({ focusDefaults: { ...ui.focusDefaults, longTotalMinutes: Number(e.target.value) } })}
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-neutral-500">Break every minutes</div>
                        <Input
                            type="number"
                            value={ui.focusDefaults.longBreakEvery}
                            onChange={(e) => setUi({ focusDefaults: { ...ui.focusDefaults, longBreakEvery: Number(e.target.value) } })}
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-neutral-500">Break minutes</div>
                        <Input
                            type="number"
                            value={ui.focusDefaults.longBreakMinutes}
                            onChange={(e) => setUi({ focusDefaults: { ...ui.focusDefaults, longBreakMinutes: Number(e.target.value) } })}
                        />
                    </div>
                </div>
            </section>

            <section className="space-y-3">
                <div className="text-sm text-neutral-500">Habits</div>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (!newHabit.trim()) return;
                        addHabit(newHabit);
                        setNewHabit('');
                    }}
                    className="flex gap-2"
                >
                    <Input
                        value={newHabit}
                        onChange={(e) => setNewHabit(e.target.value)}
                        placeholder="New habit (e.g., Meditate)"
                    />
                    <button className="rounded-md bg-calm-600 px-3 py-2 text-sm text-white">Add</button>
                </form>

                <ul className="space-y-2">
                    {habits.map((h) => {
                        const schedule: HabitSchedule = h.schedule ?? { type: 'daily', intervalWeeks: 1 };
                        return (
                            <li key={h.id} className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
                                <div className="flex items-center justify-between">
                                    <div className="font-medium">{h.name}</div>
                                    <button onClick={() => deleteHabit(h.id)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">✕</button>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <div className="flex overflow-hidden rounded-md border border-neutral-300 dark:border-neutral-700">
                                        {['daily', 'weekdays', 'custom'].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setHabitSchedule(h.id, { ...schedule, type: t as HabitSchedule['type'] })}
                                                className={`px-2 py-1 ${schedule.type === t ? 'bg-calm-600 text-white' : 'bg-white text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>

                                    {schedule.type === 'custom' && (
                                        <div className="flex items-center gap-1">
                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        const days = new Set(schedule.daysOfWeek ?? []);
                                                        if (days.has(idx)) days.delete(idx); else days.add(idx);
                                                        setHabitSchedule(h.id, { ...schedule, daysOfWeek: Array.from(days).sort() });
                                                    }}
                                                    className={`h-7 w-7 rounded-full text-center ${schedule.daysOfWeek?.includes(idx) ? 'bg-calm-500 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'}`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-xs">
                                    <label className="flex items-center gap-2">
                                        <span>Every</span>
                                        <Input type="number" uiSize="sm" value={schedule.intervalWeeks ?? 1} onChange={(e) => setHabitSchedule(h.id, { ...schedule, intervalWeeks: Math.max(1, Number(e.target.value) || 1) })} className="w-16" />
                                        <span>week(s)</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={!!schedule.onlyCurrentQuarter} onChange={(e) => setHabitSchedule(h.id, { ...schedule, onlyCurrentQuarter: e.target.checked })} />
                                        <span>Only this quarter</span>
                                    </label>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </section>

            <section className="space-y-2">
                <div className="text-sm text-neutral-500">Data</div>
                <div className="flex gap-3">
                    <button onClick={exportData} className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700">Export JSON</button>
                    <button onClick={() => fileRef.current?.click()} className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700">Import JSON</button>
                    <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importData(f); }} />
                </div>
                <button onClick={() => { if (confirm('Reset all data?')) resetAll(); }} className="rounded-md bg-red-600 px-3 py-2 text-sm text-white">Reset all</button>
            </section>
        </div>
    );
}

// Note: ScheduleEditorInline has been inlined above in the Habits section.
