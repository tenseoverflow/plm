import React from 'react';
type Props = React.InputHTMLAttributes<HTMLInputElement> & {
    uiSize?: 'sm' | 'md';
};
export default function Input({ className, uiSize, ...props }: Props): import("react/jsx-runtime").JSX.Element;
export {};
