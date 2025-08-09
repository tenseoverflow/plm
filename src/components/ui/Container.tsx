import React from 'react';
import clsx from 'classnames';

type Props = React.HTMLAttributes<HTMLDivElement> & { width?: 'sm' | 'md' | 'lg' };

export default function Container({ width = 'md', className, ...props }: Props) {
    const max = width === 'sm' ? 'max-w-2xl' : width === 'lg' ? 'max-w-6xl' : 'max-w-4xl';
    return <div className={clsx('mx-auto', max, className)} {...props} />;
}
