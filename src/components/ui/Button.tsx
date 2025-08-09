import React from 'react';
import clsx from 'classnames';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'ghost' | 'outline';
    size?: 'sm' | 'md';
};

export default function Button({ variant = 'primary', size = 'md', className, ...props }: Props) {
    const base = 'inline-flex items-center justify-center rounded-md transition-colors';
    const sizes = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm';
    const variants =
        variant === 'primary'
            ? 'bg-calm-600 text-white hover:bg-calm-700'
            : variant === 'outline'
                ? 'border border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900'
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-900';
    return <button className={clsx(base, sizes, variants, className)} {...props} />;
}
