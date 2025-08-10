import { jsx as _jsx } from "react/jsx-runtime";
import clsx from 'classnames';
export default function Card({ subtle = false, className, ...props }) {
    return (_jsx("div", { className: clsx('rounded-xl border bg-white dark:bg-neutral-950', subtle ? 'border-neutral-200 dark:border-neutral-800' : 'border-neutral-300 dark:border-neutral-700', className), ...props }));
}
