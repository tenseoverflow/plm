import MoodSelector from "@components/MoodSelector";
import TopNav, { TabKey } from "@components/TopNav";
import Input from "@components/ui/Input";
import History from "@pages/History";
import Quarterly from "@pages/Quarterly";
import Week from "@pages/Week";
import { todayString, useAppState } from "@store/index";
import { FC, useEffect, useState } from "react";
import { useAutoSync } from "./hooks/useAutoSync";

export default function App() {
  const [tab, setTab] = useState<TabKey>("week");
  const container = "mx-auto max-w-4xl";

  // Enable automatic sync when authenticated
  useAutoSync();

  return (
    <div className="min-h-screen">
      <TopNav active={tab} onChange={setTab} />
      <main className="px-4 py-6">
        {tab === "week" && <HeaderHome className={container} />}

        {tab === "week" && (
          <>
            <Week />
          </>
        )}
        {tab === "quarterly" && (
          <div className={container}>
            <Quarterly />
          </div>
        )}
        {tab === "history" && (
          <div className={container}>
            <History />
          </div>
        )}
        {tab === "settings" && (
          <div className={container}>
            <SettingsLazy />
          </div>
        )}
      </main>

      <footer className="px-4 pb-10 text-center text-xs text-neutral-400">
        Built for minimalism, simplicity, productivity, and mindfulness. Your
        data stays on this device or syncs with passkey authentication.
      </footer>
    </div>
  );
}

function HeaderHome({ className }: { className?: string }) {
  const ui = useAppState((s) => s.ui);
  const dateStr = todayString();
  const mood = useAppState((s) => s.moodByDate[dateStr]);
  const setMood = useAppState((s) => s.setMood);
  const intention = useAppState((s) => s.intentionByDate[dateStr] ?? "");
  const setIntention = useAppState((s) => s.setIntention);

  const hour = new Date().getHours();
  const greeting =
    hour >= 22 || hour <= 4
      ? "Good night"
      : hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening";

  const morningMsgs = [
    "Start gently. One mindful step at a time.",
    "Breathe in clarity. Today is spacious.",
    "Set a calm tone. Small steps compound.",
  ];
  const afternoonMsgs = [
    "Keep a steady pace. Pause, then continue.",
    "Soft focus beats hard pressure.",
    "Return to the present. One thing at a time.",
  ];
  const eveningMsgs = [
    "Unwind and reflect. You've done enough.",
    "Celebrate small wins. Rest is productive.",
    "Release the day. Be kind to yourself.",
  ];
  const nightMsgs = [
    "Quiet the mind. Deep rest restores focus.",
    "Slow down. Tomorrow is a fresh page.",
    "Gratitude for the day. Ease into rest.",
  ];
  const msgs =
    hour >= 22 || hour <= 4
      ? nightMsgs
      : hour < 12
        ? morningMsgs
        : hour < 18
          ? afternoonMsgs
          : eveningMsgs;
  const msg =
    msgs[(dateStr.charCodeAt(8) + dateStr.charCodeAt(9)) % msgs.length];

  return (
    <header className={`mb-6 ${className}`}>
      <div className="rounded-xl border border-calm-200/50 bg-gradient-to-r from-calm-400/15 via-calm-300/10 to-transparent p-5 dark:border-calm-800/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm text-neutral-500">
              {new Date(dateStr).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {greeting}.
            </h1>
            <p className="mt-1 text-xl text-neutral-600 dark:text-neutral-400">
              {msg}
            </p>
          </div>
          {ui.showMindfulnessInWeek && (
            <div className="flex flex-col items-stretch gap-2 sm:w-[380px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-neutral-500">How are you?</span>
                <MoodSelector
                  value={mood}
                  onChange={(v) => setMood(dateStr, v)}
                />
              </div>
              <Input
                value={intention}
                onChange={(e) => setIntention(dateStr, e.target.value)}
                placeholder="Set an intention (e.g., Be present and kind)"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function SettingsLazy() {
  const [Comp, setComp] = useState<FC | null>(null);
  useEffect(() => {
    import("./components/pages/Settings").then((m) => setComp(() => m.default));
  }, []);
  if (!Comp) return <div className="text-sm text-neutral-500">Loading…</div>;
  return <Comp />;
}
