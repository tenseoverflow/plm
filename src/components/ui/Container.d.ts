import React from 'react';
type Props = React.HTMLAttributes<HTMLDivElement> & {
    width?: 'sm' | 'md' | 'lg';
};
export default function Container({ width, className, ...props }: Props): import("react/jsx-runtime").JSX.Element;
export {};
