import React from 'react';
export default function Modal({ open, onClose, children, title }: {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
}): import("react/jsx-runtime").JSX.Element | null;
