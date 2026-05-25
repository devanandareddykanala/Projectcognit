import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "oklch(0.92 0.06 25)" }}
            >
              <span
                className="text-2xl font-bold font-display"
                style={{ color: "oklch(0.50 0.18 25)" }}
              >
                !
              </span>
            </div>
            <h2 className="font-display text-2xl text-primary mb-3">
              Something went wrong
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xs">
              Please reload the page to continue.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Reload
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
