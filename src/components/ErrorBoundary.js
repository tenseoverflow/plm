import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        // eslint-disable-next-line no-console
        console.error('ErrorBoundary caught', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (_jsxs("div", { className: "rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200", children: [_jsx("div", { className: "font-semibold", children: "Something went wrong." }), _jsx("div", { className: "mt-1 opacity-80", children: "Check the console for details. You can navigate to another tab." })] }));
        }
        return this.props.children;
    }
}
