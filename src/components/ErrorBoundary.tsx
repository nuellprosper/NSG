import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Trash2 } from 'lucide-react';

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
    console.error("Uncaught error in application:", error, errorInfo);
    // Auto-clean potentially corrupted session/local storage state that caused crash loop
    try {
      localStorage.removeItem('nsg_current_quiz_progress');
      localStorage.removeItem('nsg_tools_subtab');
      // If active tab was stuck on something that crashed, fall back to home
      const currentTab = localStorage.getItem('nsg_active_tab');
      if (currentTab === 'tools') {
        localStorage.setItem('nsg_active_tab', 'home');
      }
    } catch (e) {
      console.error("Failed to auto-clean storage on error:", e);
    }
  }

  private handleRecover = () => {
    try {
      localStorage.removeItem('nsg_current_quiz_progress');
      localStorage.removeItem('nsg_tools_subtab');
      localStorage.setItem('nsg_active_tab', 'home');
    } catch (e) {}
    window.location.href = '/';
  };

  private handleFullReset = () => {
    try {
      const keysToRemove = [
        'nsg_current_quiz_progress',
        'nsg_tools_subtab',
        'nsg_active_tab',
        'nsg_quiz_data',
        'nsg_host_exam_id',
        'nsg_host_config',
        'nsg_host_questions'
      ];
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0E0B16] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-[#13111C] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle size={32} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tight text-white">Temporary View Glitch</h2>
              <p className="text-xs text-white/60 leading-relaxed">
                We detected an issue while loading this page or quiz session. Don't worry, your core account data is safe.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-left overflow-x-auto max-h-28 custom-scrollbar">
                <p className="text-[10px] font-mono text-red-400 break-all">{this.state.error.message || this.state.error.toString()}</p>
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                onClick={this.handleRecover}
                className="w-full py-3.5 bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={15} /> Return to Home Lobby
              </button>
              
              <button
                onClick={this.handleFullReset}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-bold text-[11px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 size={13} /> Clear Cached Quiz Session
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
