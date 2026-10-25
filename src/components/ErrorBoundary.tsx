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
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Skill Registry:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      // Clear current corrupted temporary state and reload
      this.setState({ hasError: false, error: null });
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  private handleClearStorage = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#070A13] text-[#1F1E1B] dark:text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#FFFFFF] dark:bg-[#0D1424] border border-[#E5DFD5] dark:border-rose-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-lg font-bold text-[#1F1E1B] dark:text-white">
              Something went wrong
            </h2>
            <p className="text-xs text-[#645F57] dark:text-slate-400">
              The application encountered an unexpected error while rendering this view.
            </p>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-[#F8F5EF] dark:bg-[#070A13] border border-[#E5DFD5] dark:border-slate-800 text-[11px] font-mono text-rose-600 dark:text-rose-400 text-left overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C15F3C] hover:bg-[#A84E2E] dark:bg-gradient-to-r dark:from-indigo-600 dark:to-cyan-600 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>

              <button
                onClick={this.handleClearStorage}
                className="px-4 py-2 rounded-xl border border-[#E5DFD5] dark:border-slate-700 hover:bg-[#F3EFEA] dark:hover:bg-slate-800 text-xs font-medium text-[#645F57] dark:text-slate-300 transition-all"
              >
                Reset Local Data
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
