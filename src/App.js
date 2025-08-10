import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import TopNav from './components/TopNav';
import History from './components/pages/History';
import Week from './components/pages/Week';
import { todayString, useAppState } from './state';
import MoodSelector from './components/MoodSelector';
import Input from './components/ui/Input';
import Quarterly from './components/pages/Quarterly';
import Button from './components/ui/Button';
import { finishServerLogin, startServerLogin } from './lib/webauthn';
export default function App() {
    const [tab, setTab] = useState('week');
    const container = 'mx-auto max-w-4xl';
    const ui = useAppState((s) => s.ui);
    const locked = useAppState((s) => s.locked);
    const setLocked = useAppState((s) => s.setLocked);
    // const user = useAppState((s) => s.user);
    // Deprecated /register route removed; account is managed in Settings
    React.useEffect(() => {
        if (ui.passkeyEnabled && ui.passkeyCredentialId && locked !== false) {
            setLocked(true);
        }
    }, [ui.passkeyEnabled, ui.passkeyCredentialId]);
    if (ui.passkeyEnabled && (locked ?? false)) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center p-6", children: _jsxs("div", { className: "w-full max-w-sm rounded-xl border border-neutral-200 p-6 text-center dark:border-neutral-800", children: [_jsx("div", { className: "mb-2 text-sm text-neutral-500", children: "Private mode" }), _jsx("h1", { className: "mb-4 text-xl font-semibold", children: "Unlock with passkey" }), _jsx(LoginWithPasskey, { onUnlocked: () => setLocked(false) })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen", children: [_jsx(TopNav, { active: tab, onChange: setTab }), _jsxs("main", { className: "px-4 py-6", children: [tab === 'week' && (_jsx(HeaderHome, { className: container })), tab === 'week' && (_jsx(_Fragment, { children: _jsx(Week, {}) })), tab === 'quarterly' && (_jsx("div", { className: container, children: _jsx(Quarterly, {}) })), tab === 'history' && (_jsx("div", { className: container, children: _jsx(History, {}) })), tab === 'settings' && (_jsx("div", { className: container, children: _jsx(SettingsLazy, {}) }))] }), _jsx("footer", { className: "px-4 pb-10 text-center text-xs text-neutral-400", children: "Built for minimalism, simplicity, productivity, and mindfulness. Your data stays on this device. iCloud sync planned." })] }));
}
function LoginWithPasskey({ onUnlocked }) {
    const [email, setEmail] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    return (_jsxs("div", { className: "space-y-3", children: [_jsx("input", { className: "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900", placeholder: "Email", value: email, onChange: (e) => setEmail(e.target.value) }), _jsx(Button, { onClick: async () => {
                    setLoading(true);
                    try {
                        const { userId, options } = await startServerLogin(email.trim());
                        const cred = (await navigator.credentials.get({ publicKey: options }));
                        if (!cred)
                            throw new Error('Cancelled');
                        await finishServerLogin(userId, email.trim(), cred);
                        onUnlocked();
                    }
                    catch (e) {
                        alert(e?.message ?? 'Login failed');
                    }
                    finally {
                        setLoading(false);
                    }
                }, disabled: loading || !email.trim(), children: loading ? 'Authenticating…' : 'Use passkey' })] }));
}
function HeaderHome({ className }) {
    const ui = useAppState((s) => s.ui);
    const dateStr = todayString();
    const mood = useAppState((s) => s.moodByDate[dateStr]);
    const setMood = useAppState((s) => s.setMood);
    const intention = useAppState((s) => s.intentionByDate[dateStr] ?? '');
    const setIntention = useAppState((s) => s.setIntention);
    const hour = new Date().getHours();
    const greeting = hour >= 22 || hour <= 4 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const morningMsgs = [
        'Start gently. One mindful step at a time.',
        'Breathe in clarity. Today is spacious.',
        'Set a calm tone. Small steps compound.',
    ];
    const afternoonMsgs = [
        'Keep a steady pace. Pause, then continue.',
        'Soft focus beats hard pressure.',
        'Return to the present. One thing at a time.',
    ];
    const eveningMsgs = [
        "Unwind and reflect. You've done enough.",
        'Celebrate small wins. Rest is productive.',
        'Release the day. Be kind to yourself.',
    ];
    const nightMsgs = [
        'Quiet the mind. Deep rest restores focus.',
        'Slow down. Tomorrow is a fresh page.',
        'Gratitude for the day. Ease into rest.',
    ];
    const msgs = hour >= 22 || hour <= 4 ? nightMsgs : hour < 12 ? morningMsgs : hour < 18 ? afternoonMsgs : eveningMsgs;
    const msg = msgs[(dateStr.charCodeAt(8) + dateStr.charCodeAt(9)) % msgs.length];
    return (_jsx("header", { className: `mb-6 ${className}`, children: _jsx("div", { className: "rounded-xl border border-calm-200/50 bg-gradient-to-r from-calm-400/15 via-calm-300/10 to-transparent p-5 dark:border-calm-800/50", children: _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm text-neutral-500", children: new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) }), _jsxs("h1", { className: "mt-1 text-3xl font-semibold tracking-tight", children: [greeting, "."] }), _jsx("p", { className: "mt-1 text-xl text-neutral-600 dark:text-neutral-400", children: msg })] }), ui.showMindfulnessInWeek && (_jsxs("div", { className: "flex flex-col items-stretch gap-2 sm:w-[380px]", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("span", { className: "text-sm text-neutral-500", children: "How are you?" }), _jsx(MoodSelector, { value: mood, onChange: (v) => setMood(dateStr, v) })] }), _jsx(Input, { value: intention, onChange: (e) => setIntention(dateStr, e.target.value), placeholder: "Set an intention (e.g., Be present and kind)" })] }))] }) }) }));
}
function SettingsLazy() {
    const [Comp, setComp] = useState(null);
    React.useEffect(() => {
        import('./components/pages/Settings').then((m) => setComp(() => m.default));
    }, []);
    if (!Comp)
        return _jsx("div", { className: "text-sm text-neutral-500", children: "Loading\u2026" });
    return _jsx(Comp, {});
}
