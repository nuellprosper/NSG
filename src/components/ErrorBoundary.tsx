import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: any;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    copied: false
  };

  public static getDerivedStateFromError(error: any): State {
    return { hasError: true, error, copied: false };
  }

  public componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error("Uncaught error in application render tree:", error, errorInfo);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('nsg_current_quiz_progress');
        localStorage.removeItem('nsg_tools_subtab');
        localStorage.removeItem('nsg_active_tab');
      }
    } catch (e) {
      console.error("Failed to auto-clean storage on error:", e);
    }
  }

  private handleRecover = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('nsg_current_quiz_progress');
        localStorage.removeItem('nsg_tools_subtab');
        localStorage.removeItem('nsg_active_tab');
      }
    } catch (e) {}
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleFullReset = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove = [
          'nsg_current_quiz_progress',
          'nsg_tools_subtab',
          'nsg_active_tab',
          'nsg_quiz_data',
          'nsg_host_exam_id',
          'nsg_host_config',
          'nsg_host_questions',
          'nsg_read_articles',
          'nsg_finished_history',
          'nsg_cache_blog_posts',
          'nsg_cache_user_notes'
        ];
        keysToRemove.forEach(k => {
          try { localStorage.removeItem(k); } catch (err) {}
        });
      }
    } catch (e) {}
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleCopyError = () => {
    const msg = this.getErrorMessage();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(msg).then(() => {
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2000);
      }).catch(() => {});
    }
  };

  private getErrorMessage = (): string => {
    const err = this.state.error;
    if (!err) return 'An unexpected error occurred while rendering.';
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message || err.toString();
    if (typeof err === 'object') {
      try {
        return err.message || err.description || JSON.stringify(err);
      } catch (e) {
        return String(err);
      }
    }
    return String(err);
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      const errorMessage = this.getErrorMessage();

      return (
        <div className="min-h-screen bg-[#0E0B16] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-[#13111C] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle size={32} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tight text-white">Temporary View Glitch</h2>
              <p className="text-xs text-white/60 leading-relaxed">
                We detected an issue while loading this page or session. Don't worry, your core account data is safe.
              </p>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-left overflow-x-auto max-h-28 custom-scrollbar relative group">
              <p className="text-[10px] font-mono text-red-400 break-all pr-6">{errorMessage}</p>
              <button
                type="button"
                onClick={this.handleCopyError}
                className="absolute top-2 right-2 p-1 bg-white/10 hover:bg-white/20 rounded text-white/70 hover:text-white transition-all text-[10px]"
                title="Copy error"
              >
                {this.state.copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleRecover}
                className="w-full py-3.5 bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={15} /> Return to Home Lobby
              </button>
              
              <button
                type="button"
                onClick={this.handleFullReset}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-bold text-[11px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} /> Clear Cached Session & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

