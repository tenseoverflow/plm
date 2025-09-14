import { useEffect } from "react";
import { syncDataToServer } from "../lib/webauthn";
import { useAppState } from "../store/index";

export function useAutoSync() {
  const state = useAppState();
  const { auth } = state;

  useEffect(() => {
    // Only sync if user is authenticated
    if (!auth.isAuthenticated || !auth.userId) {
      return;
    }

    // Extract only the data we want to sync (not the action functions)
    const dataToSync = {
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

    // Debounce sync calls - wait 2 seconds after last state change
    const timeoutId = setTimeout(() => {
      syncDataToServer(dataToSync, auth.userId).catch((error) => {
        console.warn("Auto-sync failed:", error);
        // Don't show alerts for auto-sync failures to avoid interrupting user
      });
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [state, auth.isAuthenticated, auth.userId]);
}
