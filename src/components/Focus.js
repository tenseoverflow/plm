import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useAppState } from '../state';
function format(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}
export default function Focus() {
    const addFocusSession = useAppState((s) => s.addFocusSession);
    const [seconds, setSeconds] = useState(25 * 60);
    const [running, setRunning] = useState(false);
    const [label, setLabel] = useState('Deep focus');
    const timerRef = useRef(null);
    useEffect(() => {
        if (!running)
            return;
        timerRef.current = window.setInterval(() => {
            setSeconds((s) => (s > 0 ? s - 1 : 0));
        }, 1000);
        return () => {
            if (timerRef.current)
                window.clearInterval(timerRef.current);
            timerRef.current = null;
        };
    }, [running]);
    useEffect(() => {
        if (seconds === 0 && running) {
            setRunning(false);
            addFocusSession(25 * 60, label.trim() || undefined);
        }
    }, [seconds, running, addFocusSession, label]);
    function start() {
        if (seconds === 0)
            setSeconds(25 * 60);
        setRunning(true);
    }
    function pause() {
        setRunning(false);
    }
    function reset() {
        setRunning(false);
        setSeconds(25 * 60);
    }
    return (_jsxs("div", { className: "flex flex-col items-center gap-6", children: [_jsx("input", { value: label, onChange: (e) => setLabel(e.target.value), className: "w-full max-w-sm rounded-md border border-neutral-300 bg-white px-3 py-2 text-center text-sm dark:border-neutral-700 dark:bg-neutral-900", placeholder: "Session label" }), _jsx("div", { className: "text-6xl font-bold tabular-nums", children: format(seconds) }), _jsxs("div", { className: "flex gap-3", children: [!running ? (_jsx("button", { onClick: start, className: "rounded-md bg-calm-600 px-4 py-2 text-white", children: "Start" })) : (_jsx("button", { onClick: pause, className: "rounded-md bg-calm-600 px-4 py-2 text-white", children: "Pause" })), _jsx("button", { onClick: reset, className: "rounded-md border border-neutral-300 px-4 py-2 dark:border-neutral-700", children: "Reset" })] })] }));
}
