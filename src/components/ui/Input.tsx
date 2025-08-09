import React from 'react';
import clsx from 'classnames';

type Props = React.InputHTMLAttributes<HTMLInputElement> & { uiSize?: 'sm' | 'md' };

export default function Input({ className, uiSize = 'md', ...props }: Props) {
    const sizes = uiSize === 'sm' ? 'px-2 py-1 text-sm' : 'px-3 py-2 text-sm';
    return (
        <input
            className={clsx(
                'w-full rounded-md border border-neutral-200 bg-white outline-none focus:ring-2 focus:ring-calm-300 dark:border-neutral-800 dark:bg-neutral-900',
                sizes,
                className
            )}
            {...props}
        />
    );
}
