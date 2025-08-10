import React from 'react';
type Props = {
    children: React.ReactNode;
};
type State = {
    hasError: boolean;
    error?: any;
};
export default class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props);
    static getDerivedStateFromError(error: any): State;
    componentDidCatch(error: any, errorInfo: any): void;
    render(): string | number | boolean | import("react/jsx-runtime").JSX.Element | Iterable<React.ReactNode> | null | undefined;
}
export {};
