import { jsx as _jsx } from "react/jsx-runtime";
import clsx from 'classnames';
export default function TopNav({ active, onChange, }) {
    const tabs = [
        { key: 'week', label: 'Week' },
        { key: 'quarterly', label: 'Quarterly' },
        { key: 'history', label: 'History' },
        { key: 'settings', label: 'Settings' },
    ];
    return (_jsx("nav", { className: "sticky top-0 z-10 border-b border-neutral-200/60 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60", children: _jsx("div", { className: "w-full px-4", children: _jsx("div", { className: "flex justify-center py-3", children: _jsx("div", { className: "flex gap-2 overflow-x-auto", children: tabs.map((tab) => (_jsx("button", { onClick: () => onChange(tab.key), className: clsx('rounded-full px-3 py-1.5 text-sm transition-colors whitespace-nowrap', active === tab.key
                            ? 'bg-calm-600 text-white'
                            : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900'), children: tab.label }, tab.key))) }) }) }) }));
}
