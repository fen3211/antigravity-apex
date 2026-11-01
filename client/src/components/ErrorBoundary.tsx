import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Antigravity Apex] Uncaught error in React component tree:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
          <div className="card-obsidian max-w-lg w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto text-danger">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-obsidian tracking-tight">
                Application Error Encountered
              </h2>
              <p className="text-xs text-charcoal">
                An unexpected interface error occurred. The telemetry supervisor preserved your session.
              </p>
            </div>

            {this.state.error && (
              <pre className="text-[11px] font-mono text-left bg-surface-subtle p-3 rounded-lg border border-hairline text-charcoal overflow-x-auto max-h-40">
                {this.state.error.message}
              </pre>
            )}

            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-obsidian text-canvas hover:opacity-90 transition-opacity focus-ring"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
