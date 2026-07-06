import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-red-500/10 text-red-500 rounded-full border border-red-500/20">
                <AlertOctagon className="w-10 h-10" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
              <p className="text-slate-400 text-sm">
                An unexpected error occurred. Don't worry, your session status is safe.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 text-left overflow-x-auto max-h-40">
                <p className="text-red-400 font-mono text-xs whitespace-pre-wrap">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="pt-2 flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-medium rounded-xl border border-slate-700 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
