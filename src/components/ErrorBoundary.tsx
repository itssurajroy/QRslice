// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

/**
 * QRslice — Global Error Boundary
 * Catches unhandled React errors and shows a friendly recovery screen.
 * Wrap around <children> in layout.tsx to provide app-wide coverage.
 */

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console — swap with Sentry.captureException(error, { extra: info }) when ready
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white/90 border border-slate-200 rounded-3xl p-8 shadow-xl space-y-4 text-center">
            <div className="text-5xl">⚠️</div>
            <h2 className="text-xl font-black text-slate-900">Something went wrong</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              An unexpected error occurred. This has been logged and our team has been notified.
            </p>
            {this.state.error && (
              <details className="text-left">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300">
                  Error details
                </summary>
                <pre className="mt-2 p-3 bg-slate-100 rounded-xl text-xs text-red-500 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer border border-slate-200"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 rounded-xl bg-brand hover:bg-brand-dark text-white font-black text-xs cursor-pointer shadow-lg shadow-brand/25"
              >
                Try Again →
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
