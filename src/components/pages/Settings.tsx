import Button from "@components/ui/Button";
import Input from "@components/ui/Input";
import {
  finishPasskeyLogin,
  finishPasskeyRegistration,
  startPasskeyLogin,
  startPasskeyRegistration,
  deleteAccount,
} from "@lib/webauthn";
import { HabitSchedule, useAppState } from "@store/index";
import { useRef, useState } from "react";

export default function Settings() {
  const state = useAppState();
  const resetAll = useAppState((s) => s.resetAll);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const showMindfulness = useAppState((s) => s.ui.showMindfulnessInWeek);
  const setShowMindfulness = useAppState((s) => s.setShowMindfulnessInWeek);

  const auth = useAppState((s) => s.auth);
  const loginWithPasskey = useAppState((s) => s.loginWithPasskey);
  const logout = useAppState((s) => s.logout);
  const loadServerData = useAppState((s) => s.loadServerData);

  const ui = useAppState((s) => s.ui);
  const setUi = useAppState((s) => s.setUi);
  const registerUser = useAppState((s) => s.registerUser);
  const logoutUser = useAppState((s) => s.logoutUser);

  const habits = useAppState((s) => s.habits);
  const addHabit = useAppState((s) => s.addHabit);
  const deleteHabit = useAppState((s) => s.deleteHabit);
  const setHabitSchedule = useAppState((s) => s.setHabitSchedule);

  const [newHabit, setNewHabit] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const handleRegisterPasskey = async () => {
    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    setBusy(true);
    try {
      // Start registration
      const { options, userId } = await startPasskeyRegistration(name.trim());

      // Create credential
      const credential = (await navigator.credentials.create({
        publicKey: options,
      })) as PublicKeyCredential | null;

      if (!credential) throw new Error("Registration cancelled");

      // Finish registration and sync local data
      const localDataToSync = {
        moodByDate: state.moodByDate,
        intentionByDate: state.intentionByDate,
        tasksByDate: state.tasksByDate,
        journalByDate: state.journalByDate,
        backlogTasks: state.backlogTasks,
        habits: state.habits,
        focusSessions: state.focusSessions,
        quarterPlans: state.quarterPlans,
        weeklyReportsByWeekStart: state.weeklyReportsByWeekStart,
        ui: state.ui,
      };

      const result = await finishPasskeyRegistration(
        name.trim(),
        credential,
        localDataToSync, // Send only data, not action functions
        userId,
      );

      if (result.success) {
        loginWithPasskey(result.userId, name.trim());
        alert(
          "Passkey registered successfully! Your data has been synced to the cloud.",
        );
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      alert(error?.message ?? "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  const handleLoginWithPasskey = async () => {
    setBusy(true);
    try {
      // Start login (no name needed - passkey will identify the user)
      const { options, sessionId } = await startPasskeyLogin();

      // Get credential
      const credential = (await navigator.credentials.get({
        publicKey: options,
      })) as PublicKeyCredential | null;

      if (!credential) throw new Error("Login cancelled");

      // Finish login and get user data
      const result = await finishPasskeyLogin(credential, sessionId);

      if (result.success && result.userData) {
        // First set the auth state
        loginWithPasskey(result.userId, result.userData.name);

        // Then load the server data into the store
        loadServerData(result.userData);

        alert(
          "Logged in successfully! Your data has been synced from the cloud.",
        );
      }
    } catch (error: any) {
      console.error("Login error:", error);
      alert(error?.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    logout();
    alert("Signed out. Your data will now be stored locally only.");
  };

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
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
        localStorage.setItem("mindful-plm", JSON.stringify(data));
        window.location.reload();
      } catch {
        alert("Invalid file");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <div className="text-sm text-neutral-500">Week view</div>
        <label className="flex w-fit cursor-pointer items-center gap-3 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800">
          <input
            type="checkbox"
            checked={showMindfulness}
            onChange={(e) => setShowMindfulness(e.target.checked)}
          />
          <span>Show mood and intention on days</span>
        </label>
      </section>

      <section className="space-y-3">
        <div className="text-sm text-neutral-500">Account & Sync</div>
        <div className="space-y-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
          {auth.isAuthenticated ? (
            // User is authenticated
            <div className="space-y-3">
              <div className="text-sm">
                <div className="font-medium text-green-700 dark:text-green-400">
                  ✓ Signed in as {auth.userName}
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  Your data syncs automatically and is secured with your
                  passkey.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleLogout}
                  disabled={busy}
                  variant="outline"
                >
                  Sign Out
                </Button>
              </div>

              {/* Data management for authenticated users */}
              <div className="border-t border-neutral-200 pt-3 dark:border-neutral-800">
                <div className="mb-2 text-xs text-neutral-500">
                  Data Management
                </div>
                <div className="mb-2 flex gap-2">
                  <button
                    onClick={exportData}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
                  >
                    Export JSON
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
                  >
                    Import JSON
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) importData(f);
                    }}
                  />
                </div>
                <button
                  onClick={async () => {
                    if (
                      confirm(
                        "Remove your account and all synced data? This cannot be undone.",
                      )
                    ) {
                      if (!auth.userId) {
                        alert("Error: No user ID found");
                        return;
                      }

                      setBusy(true);
                      try {
                        await deleteAccount(auth.userId);
                        logout();
                        resetAll();
                        alert(
                          "Account removed successfully. All your data has been deleted.",
                        );
                      } catch (error: any) {
                        console.error("Account deletion error:", error);
                        alert(error?.message ?? "Failed to remove account");
                      } finally {
                        setBusy(false);
                      }
                    }
                  }}
                  disabled={busy}
                  className="rounded-md bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                >
                  {busy ? "Removing..." : "Remove Account"}
                </button>
              </div>
            </div>
          ) : (
            // User is not authenticated
            <div className="space-y-3">
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                Register with a passkey to sync your data across devices.
                Without a passkey, your data stays locally on this device.
              </div>

              <div>
                <div className="text-xs text-neutral-500">Your name</div>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleRegisterPasskey}
                  disabled={busy || !name.trim()}
                >
                  {busy ? "Registering..." : "Register with Passkey"}
                </Button>
                <Button
                  onClick={handleLoginWithPasskey}
                  disabled={busy}
                  variant="outline"
                >
                  {busy ? "Signing in..." : "Sign in with Passkey"}
                </Button>
              </div>

              {/* Data management for non-authenticated users */}
              <div className="border-t border-neutral-200 pt-3 dark:border-neutral-800">
                <div className="mb-2 text-xs text-neutral-500">
                  Local Data Management
                </div>
                <div className="mb-2 flex gap-2">
                  <button
                    onClick={exportData}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
                  >
                    Export JSON
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
                  >
                    Import JSON
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) importData(f);
                    }}
                  />
                </div>
                <button
                  onClick={() => {
                    if (confirm("Reset all local data? This cannot be undone."))
                      resetAll();
                  }}
                  className="rounded-md bg-red-600 px-3 py-2 text-sm text-white"
                >
                  Reset All Data
                </button>
              </div>
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
              onChange={(e) =>
                setUi({ notificationsEnabled: e.target.checked })
              }
            />
            <span>Desktop notifications</span>
          </label>
          <label className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
            <input
              type="checkbox"
              checked={ui.autoStartNextSegment}
              onChange={(e) =>
                setUi({ autoStartNextSegment: e.target.checked })
              }
            />
            <span>Auto-start next segment</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-neutral-500">
              Single session minutes
            </div>
            <Input
              type="number"
              value={ui.focusDefaults.singleMinutes}
              onChange={(e) =>
                setUi({
                  focusDefaults: {
                    ...ui.focusDefaults,
                    singleMinutes: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-neutral-500">
              Pomodoro work minutes
            </div>
            <Input
              type="number"
              value={ui.focusDefaults.pomodoroWork}
              onChange={(e) =>
                setUi({
                  focusDefaults: {
                    ...ui.focusDefaults,
                    pomodoroWork: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-neutral-500">
              Pomodoro break minutes
            </div>
            <Input
              type="number"
              value={ui.focusDefaults.pomodoroBreak}
              onChange={(e) =>
                setUi({
                  focusDefaults: {
                    ...ui.focusDefaults,
                    pomodoroBreak: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-neutral-500">Pomodoro rounds</div>
            <Input
              type="number"
              value={ui.focusDefaults.pomodoroRounds}
              onChange={(e) =>
                setUi({
                  focusDefaults: {
                    ...ui.focusDefaults,
                    pomodoroRounds: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-neutral-500">Long total minutes</div>
            <Input
              type="number"
              value={ui.focusDefaults.longTotalMinutes}
              onChange={(e) =>
                setUi({
                  focusDefaults: {
                    ...ui.focusDefaults,
                    longTotalMinutes: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-neutral-500">Break every minutes</div>
            <Input
              type="number"
              value={ui.focusDefaults.longBreakEvery}
              onChange={(e) =>
                setUi({
                  focusDefaults: {
                    ...ui.focusDefaults,
                    longBreakEvery: Number(e.target.value),
                  },
                })
              }
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-neutral-500">Break minutes</div>
            <Input
              type="number"
              value={ui.focusDefaults.longBreakMinutes}
              onChange={(e) =>
                setUi({
                  focusDefaults: {
                    ...ui.focusDefaults,
                    longBreakMinutes: Number(e.target.value),
                  },
                })
              }
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
            setNewHabit("");
          }}
          className="flex gap-2"
        >
          <Input
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="New habit (e.g., Meditate)"
          />
          <button className="rounded-md bg-calm-600 px-3 py-2 text-sm text-white">
            Add
          </button>
        </form>

        <ul className="space-y-2">
          {habits.map((h) => {
            const schedule: HabitSchedule = h.schedule ?? {
              type: "daily",
              intervalWeeks: 1,
            };
            return (
              <li
                key={h.id}
                className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{h.name}</div>
                  <button
                    onClick={() => deleteHabit(h.id)}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex overflow-hidden rounded-md border border-neutral-300 dark:border-neutral-700">
                    {["daily", "weekdays", "custom"].map((t) => (
                      <button
                        key={t}
                        onClick={() =>
                          setHabitSchedule(h.id, {
                            ...schedule,
                            type: t as HabitSchedule["type"],
                          })
                        }
                        className={`px-2 py-1 ${schedule.type === t ? "bg-calm-600 text-white" : "bg-white text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {schedule.type === "custom" && (
                    <div className="flex items-center gap-1">
                      {["S", "M", "T", "W", "T", "F", "S"].map((label, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            const days = new Set(schedule.daysOfWeek ?? []);
                            if (days.has(idx)) days.delete(idx);
                            else days.add(idx);
                            setHabitSchedule(h.id, {
                              ...schedule,
                              daysOfWeek: Array.from(days).sort(),
                            });
                          }}
                          className={`h-7 w-7 rounded-full text-center ${schedule.daysOfWeek?.includes(idx) ? "bg-calm-500 text-white" : "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"}`}
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
                    <Input
                      type="number"
                      uiSize="sm"
                      value={schedule.intervalWeeks ?? 1}
                      onChange={(e) =>
                        setHabitSchedule(h.id, {
                          ...schedule,
                          intervalWeeks: Math.max(
                            1,
                            Number(e.target.value) || 1,
                          ),
                        })
                      }
                      className="w-16"
                    />
                    <span>week(s)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!schedule.onlyCurrentQuarter}
                      onChange={(e) =>
                        setHabitSchedule(h.id, {
                          ...schedule,
                          onlyCurrentQuarter: e.target.checked,
                        })
                      }
                    />
                    <span>Only this quarter</span>
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
