import clsx from "classnames";

export type TabKey = "week" | "quarter" | "history" | "settings";

export default function TopNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (key: TabKey) => void;
}) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: "week", label: "Week" },
    { key: "quarter", label: "Quarter" },
    { key: "history", label: "History" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <nav className="sticky top-0 z-10 border-neutral-200/60 border-b bg-white/80 backdrop-blur supports-backdrop-filter:bg-white/60 dark:border-neutral-800/80 dark:bg-neutral-950/80">
      <div className="w-full px-4">
        <div className="flex justify-center py-3">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onChange(tab.key)}
                className={clsx(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors",
                  active === tab.key
                    ? "bg-calm-600 text-white"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900",
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
