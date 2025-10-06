import type { AppState } from "@store/index";

export async function loadRemote(): Promise<Partial<AppState> | null> {
  try {
    const res = await fetch("/api/sync", { credentials: "include" });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: Partial<AppState> };
    return json.data;
  } catch {
    return null;
  }
}

let saveTimer: number | null = null;
export function scheduleSave(state: AppState, delayMs = 1000) {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    void saveNow(state);
  }, delayMs);
}

export async function saveNow(state: AppState) {
  try {
    await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(state),
    });
  } catch {
    // ignore
  }
}
