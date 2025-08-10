import { useMemo, useState } from 'react';
import { quarterKey, startOfWeekString, useAppState } from '@store/index';
import Card from '@components/ui/Card';

function computeQuarterKey(date: Date) {
    return quarterKey(date);
}

function parseQuarterKey(key: string): Date {
    const [yearStr, qStr] = key.split('-');
    const year = Number(yearStr);
    const q = Number(qStr.replace('Q', ''));
    const month = (q - 1) * 3;
    return new Date(year, month, 1);
}

export default function Quarterly() {
    const now = new Date();
    const [selectedKey, setSelectedKey] = useState(quarterKey(now));

    const items = useAppState((s) => s.quarterPlans[selectedKey] ?? []);
    const setQuarterItem = useAppState((s) => s.setQuarterItem);
    const clearQuarterItem = useAppState((s) => s.clearQuarterItem);

    const weekStart = startOfWeekString(now);
    const report = useAppState((s) => s.weeklyReportsByWeekStart[weekStart] ?? '');
    const saveWeeklyReport = useAppState((s) => s.saveWeeklyReport);

    const [reportDraft, setReportDraft] = useState(report);

    const title = useMemo(() => {
        const [year, q] = selectedKey.split('-');
        return `Quarter ${q.replace('Q', '')}, ${year}`;
    }, [selectedKey]);

    function saveItem(i: number, notes: string) {
        setQuarterItem(selectedKey, i, notes);
    }

    function addFocus() {
        const list = (items.slice(0, 4) as (typeof items[number] | null)[]);
        // find first null slot
        const firstNull = list.findIndex((x) => x == null);
        const idx = firstNull >= 0 ? firstNull : list.length < 4 ? list.length : -1;
        if (idx >= 0) saveItem(idx, '');
    }

    function removeFocus(i: number) {
        clearQuarterItem(selectedKey, i);
    }

    function shiftQuarter(delta: number) {
        const base = parseQuarterKey(selectedKey);
        const next = new Date(base);
        next.setMonth(base.getMonth() + delta * 3);
        setSelectedKey(computeQuarterKey(next));
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <p className="text-sm text-neutral-500">Up to four focus areas. Keep them short and clear.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => shiftQuarter(-1)} className="rounded-md border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700">Prev</button>
                    <button onClick={() => setSelectedKey(quarterKey(new Date()))} className="rounded-md border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700">This quarter</button>
                    <button onClick={() => shiftQuarter(1)} className="rounded-md border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700">Next</button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }, (_, i) => i).map((i) => {
                    const item = (items[i] ?? null) as { id: string; title: string; notes?: string } | null;
                    if (item == null) return null;
                    return (
                        <Card key={i} className="p-3">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-neutral-500">Focus {i + 1}</div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => removeFocus(i)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">✕</button>
                                </div>
                            </div>
                            <textarea
                                value={item.notes ?? ''}
                                onChange={(e) => saveItem(i, e.target.value)}
                                rows={4}
                                placeholder="Notes / scope / definition of done"
                                className="mt-2 w-full rounded-md border border-neutral-200 bg-white p-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
                            />
                        </Card>
                    );
                })}
            </div>
            <div>
                <button onClick={addFocus} className="rounded-md bg-calm-600 px-3 py-2 text-sm text-white disabled:opacity-50" disabled={((items.filter(Boolean).length) ?? 0) >= 4}>Add focus</button>
            </div>

            <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-semibold">Weekly report</h3>
                    <div className="text-sm text-neutral-500">Week of {weekStart}</div>
                </div>
                <textarea
                    value={reportDraft}
                    onChange={(e) => setReportDraft(e.target.value)}
                    rows={8}
                    placeholder="Summarize progress, learnings, and next steps."
                    className="w-full rounded-md border border-neutral-200 bg-white p-3 text-sm leading-6 dark:border-neutral-800 dark:bg-neutral-900"
                />
                <div className="flex justify-end">
                    <button onClick={() => saveWeeklyReport(weekStart, reportDraft)} className="rounded-md bg-calm-600 px-3 py-2 text-sm text-white">Save report</button>
                </div>
            </div>
        </div>
    );
}
