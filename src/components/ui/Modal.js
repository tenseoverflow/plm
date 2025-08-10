import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import Card from './Card';
export default function Modal({ open, onClose, children, title }) {
    useEffect(() => {
        function onKey(e) {
            if (e.key === 'Escape')
                onClose();
        }
        if (open)
            document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", onClick: onClose, children: [_jsx("div", { className: "absolute inset-0 bg-black/40" }), _jsxs(Card, { className: "relative z-10 w-full max-w-md p-4", onClick: (e) => e.stopPropagation(), children: [title && _jsx("div", { className: "mb-2 text-sm font-semibold", children: title }), children] })] }));
}
