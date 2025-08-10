import clsx from 'classnames';

export type TabKey = 'week' | 'quarterly' | 'history' | 'settings';

export default function TopNav({
    active,
    onChange,
}: {
    active: TabKey;
    onChange: (key: TabKey) => void;
}) {
    const tabs: { key: TabKey; label: string }[] = [
        { key: 'week', label: 'Week' },
        { key: 'quarterly', label: 'Quarterly' },
        { key: 'history', label: 'History' },
        { key: 'settings', label: 'Settings' },
    ];

    return (
        <nav className="sticky top-0 z-10 border-b border-neutral-200/60 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="w-full px-4">
                <div className="flex justify-center py-3">
                    <div className="flex gap-2 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => onChange(tab.key)}
                                className={clsx(
                                    'rounded-full px-3 py-1.5 text-sm transition-colors whitespace-nowrap',
                                    active === tab.key
                                        ? 'bg-calm-600 text-white'
                                        : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900'
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
}
