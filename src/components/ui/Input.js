import { jsx as _jsx } from "react/jsx-runtime";
import clsx from 'classnames';
export default function Input({ className, uiSize = 'md', ...props }) {
    const sizes = uiSize === 'sm' ? 'px-2 py-1 text-sm' : 'px-3 py-2 text-sm';
    return (_jsx("input", { className: clsx('w-full rounded-md border border-neutral-200 bg-white outline-none focus:ring-2 focus:ring-calm-300 dark:border-neutral-800 dark:bg-neutral-900', sizes, className), ...props }));
}
