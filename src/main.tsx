import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
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
