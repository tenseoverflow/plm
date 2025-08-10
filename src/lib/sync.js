export async function loadRemote() {
    try {
        const res = await fetch("/api/sync", { credentials: "include" });
        if (!res.ok)
            return null;
        const json = await res.json();
        return json.data;
    }
    catch {
        return null;
    }
}
let saveTimer = null;
export function scheduleSave(state, delayMs = 1000) {
    if (saveTimer)
        window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
        void saveNow(state);
    }, delayMs);
}
export async function saveNow(state) {
    try {
        await fetch("/api/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(state),
        });
    }
    catch {
        // ignore
    }
}
