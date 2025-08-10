import { jsx as _jsx } from "react/jsx-runtime";
import clsx from 'classnames';
export default function Container({ width = 'md', className, ...props }) {
    const max = width === 'sm' ? 'max-w-2xl' : width === 'lg' ? 'max-w-6xl' : 'max-w-4xl';
    return _jsx("div", { className: clsx('mx-auto', max, className), ...props });
}
