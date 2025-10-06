import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { loadRemote, scheduleSave } from "./lib/sync";
import { type AppState, useAppState } from "./store";

function applySystemTheme() {
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const root = document.documentElement;
  if (prefersDark) root.classList.add("dark");
  else root.classList.remove("dark");
}

applySystemTheme();
if (window.matchMedia) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  if (mq.addEventListener) {
    mq.addEventListener("change", applySystemTheme);
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Attempt initial sync load after mount
void (async () => {
  try {
    const data = await loadRemote();
    if (data) {
      const s = useAppState.getState();
      useAppState.setState({ ...s, ...data });
    }
  } catch {
    // Silently fail - user will work with local data
  }
})();

// Auto-sync on any state change (debounced)
useAppState.subscribe((state: AppState) => {
  try {
    scheduleSave(state);
  } catch {
    // Silently fail - will retry on next change
  }
});
