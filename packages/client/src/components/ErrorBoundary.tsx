import { Component } from "react";

type Props = { children: React.ReactNode };

type State = { hasError: boolean; error?: any };

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-red-800 text-sm dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <div className="font-semibold">Something went wrong.</div>
          <div className="mt-1 opacity-80">
            Check the console for details. You can navigate to another tab.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
