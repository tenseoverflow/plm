import Card from "@components/ui/Card";
import { quarterKey, useAppState } from "@store/index";
import { useMemo, useState } from "react";

function computeQuarterKey(date: Date) {
  return quarterKey(date);
}

function parseQuarterKey(key: string): Date {
  const [yearStr, qStr] = key.split("-");
  const year = Number(yearStr);
  const q = Number(qStr.replace("Q", ""));
  const month = (q - 1) * 3;
  return new Date(year, month, 1);
}

export default function Quarterly() {
  const now = new Date();
  const [selectedKey, setSelectedKey] = useState(quarterKey(now));

  const rawItems = useAppState((s) => s.quarterPlans[selectedKey]);
  const items = useMemo(() => rawItems ?? [], [rawItems]);
  const setQuarterItem = useAppState((s) => s.setQuarterItem);
  const clearQuarterItem = useAppState((s) => s.clearQuarterItem);

  const title = useMemo(() => {
    const [year, q] = selectedKey.split("-");
    return `Quarter ${q.replace("Q", "")}, ${year}`;
  }, [selectedKey]);

  const months = useMemo(() => {
    const q = parseInt(selectedKey.split("-")[1].replace("Q", ""));
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const startMonth = (q - 1) * 3;
    return [
      monthNames[startMonth],
      monthNames[startMonth + 1],
      monthNames[startMonth + 2],
    ].join(", ");
  }, [selectedKey]);

  function saveItem(i: number, notes: string) {
    setQuarterItem(selectedKey, i, notes);
  }

  function addFocus() {
    const list = items.slice(0, 4) as ((typeof items)[number] | null)[];
    // find first null slot
    const firstNull = list.findIndex((x) => x == null);
    const idx = firstNull >= 0 ? firstNull : list.length < 4 ? list.length : -1;
    if (idx >= 0) saveItem(idx, "");
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
          <h2 className="font-semibold text-xl">{title}</h2>
          <p className="text-neutral-500 text-sm">{months}</p>
          <p className="text-neutral-500 text-sm">
            Up to four focus areas. Keep them short and clear.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftQuarter(-1)}
            className="rounded-md border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setSelectedKey(quarterKey(new Date()))}
            className="rounded-md border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700"
          >
            This quarter
          </button>
          <button
            type="button"
            onClick={() => shiftQuarter(1)}
            className="rounded-md border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => i).map((i) => {
          const item = (items[i] ?? null) as {
            id: string;
            title: string;
            notes?: string;
          } | null;
          if (item == null) return null;
          return (
            <Card key={i} className="p-3">
              <div className="flex items-center justify-between">
                <div className="text-neutral-500 text-sm">Focus {i + 1}</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => removeFocus(i)}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <textarea
                value={item.notes ?? ""}
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
        <button
          type="button"
          onClick={addFocus}
          className="rounded-md bg-calm-600 px-3 py-2 text-sm text-white disabled:opacity-50"
          disabled={items.filter(Boolean).length >= 4}
        >
          Add focus
        </button>
      </div>
    </div>
  );
}
