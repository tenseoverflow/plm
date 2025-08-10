import React from 'react';
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'ghost' | 'outline';
    size?: 'sm' | 'md';
};
export default function Button({ variant, size, className, ...props }: Props): import("react/jsx-runtime").JSX.Element;
export {};
