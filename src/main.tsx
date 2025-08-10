import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { loadRemote, scheduleSave } from './lib/sync';
import { useAppState, type AppState } from './state';
import App from './App';

function applySystemTheme() {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const root = document.documentElement;
    if (prefersDark) root.classList.add('dark');
    else root.classList.remove('dark');
}

applySystemTheme();
if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    try {
        mq.addEventListener('change', applySystemTheme);
    } catch {
        // Safari
        // @ts-ignore
        mq.addListener(applySystemTheme);
    }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// Attempt initial sync load after mount
void (async () => {
    try {
        const data = await loadRemote();
        if (data) {
            const s = useAppState.getState();
            useAppState.setState({ ...s, ...data });
        }
    } catch { }
})();

// Auto-sync on any state change (debounced)
useAppState.subscribe((state: AppState) => {
    try {
        scheduleSave(state);
    } catch { }
});
