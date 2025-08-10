import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { quarterKey, startOfWeekString, useAppState } from '../../state';
import Card from '../ui/Card';
function computeQuarterKey(date) {
    return quarterKey(date);
}
function parseQuarterKey(key) {
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
    function saveItem(i, notes) {
        setQuarterItem(selectedKey, i, notes);
    }
    function addFocus() {
        const list = items.slice(0, 4);
        // find first null slot
        const firstNull = list.findIndex((x) => x == null);
        const idx = firstNull >= 0 ? firstNull : list.length < 4 ? list.length : -1;
        if (idx >= 0)
            saveItem(idx, '');
    }
    function removeFocus(i) {
        clearQuarterItem(selectedKey, i);
    }
    function shiftQuarter(delta) {
        const base = parseQuarterKey(selectedKey);
        const next = new Date(base);
        next.setMonth(base.getMonth() + delta * 3);
        setSelectedKey(computeQuarterKey(next));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold", children: title }), _jsx("p", { className: "text-sm text-neutral-500", children: "Up to four focus areas. Keep them short and clear." })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => shiftQuarter(-1), className: "rounded-md border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700", children: "Prev" }), _jsx("button", { onClick: () => setSelectedKey(quarterKey(new Date())), className: "rounded-md border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700", children: "This quarter" }), _jsx("button", { onClick: () => shiftQuarter(1), className: "rounded-md border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700", children: "Next" })] })] }), _jsx("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2", children: Array.from({ length: 4 }, (_, i) => i).map((i) => {
                    const item = (items[i] ?? null);
                    if (item == null)
                        return null;
                    return (_jsxs(Card, { className: "p-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "text-sm text-neutral-500", children: ["Focus ", i + 1] }), _jsx("div", { className: "flex items-center gap-2", children: _jsx("button", { onClick: () => removeFocus(i), className: "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200", children: "\u2715" }) })] }), _jsx("textarea", { value: item.notes ?? '', onChange: (e) => saveItem(i, e.target.value), rows: 4, placeholder: "Notes / scope / definition of done", className: "mt-2 w-full rounded-md border border-neutral-200 bg-white p-2 text-sm dark:border-neutral-800 dark:bg-neutral-900" })] }, i));
                }) }), _jsx("div", { children: _jsx("button", { onClick: addFocus, className: "rounded-md bg-calm-600 px-3 py-2 text-sm text-white disabled:opacity-50", disabled: ((items.filter(Boolean).length) ?? 0) >= 4, children: "Add focus" }) }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-baseline justify-between", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Weekly report" }), _jsxs("div", { className: "text-sm text-neutral-500", children: ["Week of ", weekStart] })] }), _jsx("textarea", { value: reportDraft, onChange: (e) => setReportDraft(e.target.value), rows: 8, placeholder: "Summarize progress, learnings, and next steps.", className: "w-full rounded-md border border-neutral-200 bg-white p-3 text-sm leading-6 dark:border-neutral-800 dark:bg-neutral-900" }), _jsx("div", { className: "flex justify-end", children: _jsx("button", { onClick: () => saveWeeklyReport(weekStart, reportDraft), className: "rounded-md bg-calm-600 px-3 py-2 text-sm text-white", children: "Save report" }) })] })] }));
}
