import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, Download, CheckCircle2, Pause, Play, ArrowDown,
  Wifi, WifiOff, HardDrive, ShieldCheck, RefreshCw, Trash2, Cpu
} from 'lucide-react';
import { 
  subscribeOmniBrainState, 
  startOrResumeOmniBrainDownload, 
  pauseOmniBrainDownload, 
  deleteOmniBrainModel,
  initOmniBrainStatus,
  OmniBrainDownloadState
} from '../lib/capacitor';

interface OmniOfflinePageProps {
  onBack: () => void;
  onOpenChat?: () => void;
  onOpenQuiz?: () => void;
  theme?: string;
}

export const OmniOfflinePage: React.FC<OmniOfflinePageProps> = ({
  onBack,
  onOpenChat,
  onOpenQuiz,
  theme = 'dark'
}) => {
  const [downloadState, setDownloadState] = useState<OmniBrainDownloadState>({
    status: 'idle',
    downloadedBytes: 0,
    totalBytes: 398500000,
    progressPercent: 0,
    speedFormatted: '0 KB/s',
    downloadedFormatted: '0 MB',
    totalFormatted: '398.5 MB',
    error: null,
    lastUpdated: Date.now()
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    initOmniBrainStatus();
    const unsubscribe = subscribeOmniBrainState((state) => {
      setDownloadState({ ...state });
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const isDownloading = downloadState.status === 'downloading';
  const isCompleted = downloadState.status === 'completed' || downloadState.progressPercent >= 100;
  const isPaused = downloadState.status === 'paused';
  const isIdle = downloadState.status === 'idle' && downloadState.downloadedBytes === 0;

  const handleDownloadClick = () => {
    if (isDownloading) {
      pauseOmniBrainDownload();
    } else {
      startOrResumeOmniBrainDownload();
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between p-4 sm:p-8 font-sans ${isDark ? 'bg-[#0B0813] text-white' : 'bg-slate-50 text-slate-900'} select-none`}>
      {/* Top Bar with Back Button */}
      <div className="w-full max-w-2xl mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>

      {/* Main Center Content */}
      <div className="w-full max-w-lg mx-auto my-auto flex flex-col items-center text-center space-y-7 py-8">
        {/* Model Icon / Badge */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-900 via-indigo-800 to-purple-600 border border-purple-400/40 flex items-center justify-center shadow-2xl shadow-purple-900/50">
            {isCompleted ? (
              <CheckCircle2 size={40} className="text-emerald-400" />
            ) : (
              <ArrowDown size={38} className={`text-purple-200 stroke-[2.5] ${isDownloading ? 'animate-bounce' : ''}`} />
            )}
          </div>
          {isCompleted && (
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-300 shadow-md">
              READY
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Omni Offline Brain
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/70 max-w-sm mx-auto leading-relaxed">
            Use all ai powered tools online.
          </p>
        </div>

        {/* Action Button & Under-Text */}
        <div className="flex flex-col items-center space-y-2.5 w-full">
          {!isCompleted ? (
            <button
              type="button"
              onClick={handleDownloadClick}
              className={`w-full max-w-xs py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 transition-all shadow-2xl cursor-pointer active:scale-95 border ${
                isDownloading
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 shadow-amber-500/10'
                  : isPaused
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-red-600 text-white border-purple-400/40 hover:brightness-110 shadow-purple-600/30'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-red-600 text-white border-purple-400/40 hover:brightness-110 shadow-purple-600/30'
              }`}
            >
              {isDownloading ? (
                <>
                  <Pause size={18} />
                  <span>Pause Download</span>
                </>
              ) : isPaused ? (
                <>
                  <Play size={18} />
                  <span>Resume Download</span>
                </>
              ) : (
                <>
                  <ArrowDown size={18} className="stroke-[2.5]" />
                  <span>Download Omni Brain</span>
                </>
              )}
            </button>
          ) : (
            <div className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span>Omni Brain Active & Saved</span>
            </div>
          )}

          {/* Text under download button as requested */}
          <p className="text-[11px] font-medium text-white/50 tracking-wide">
            {isCompleted ? 'Weights stored in IndexedDB persistence' : 'download Omni Brain'}
          </p>
        </div>

        {/* LIVE LOADING HORIZONTAL BAR (Displayed when downloaded or downloading or paused) */}
        {(!isIdle || downloadState.downloadedBytes > 0) && (
          <div className="w-full max-w-md bg-[#140F24]/90 rounded-2xl p-4 sm:p-5 border border-purple-500/30 shadow-2xl space-y-3.5">
            {/* Top Metrics Row: Downloaded/Total & Speed & Real-Time Percentage */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-white/70">
                <HardDrive size={13} className="text-purple-400 shrink-0" />
                <span>{downloadState.downloadedFormatted}</span>
                <span className="text-white/40">/</span>
                <span>{downloadState.totalFormatted}</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Real-time Network Speed */}
                <div className="flex items-center gap-1 font-mono text-[11px] text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-500/20">
                  <Wifi size={11} className="text-purple-400" />
                  <span>{downloadState.speedFormatted}</span>
                </div>

                {/* Real-Time Percentage Text (RED while downloading, turns GREEN when 100% complete) */}
                <span className={`font-mono text-xs font-black tracking-tight ${
                  isCompleted 
                    ? 'text-emerald-400' 
                    : 'text-red-500'
                }`}>
                  {downloadState.progressPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Live Progress Bar with Thin Purple Container Stroke & Dynamic Green Fill */}
            <div className="w-full h-3.5 rounded-full bg-purple-950/40 p-[2px] border border-purple-500/40 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-200 ${
                  isCompleted
                    ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                    : 'bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_10px_rgba(16,185,129,0.7)]'
                }`}
                style={{ width: `${downloadState.progressPercent}%` }}
              />
            </div>

            {/* Error or Status message banner if any */}
            {downloadState.error && (
              <div className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl flex items-center justify-between">
                <span>{downloadState.error}</span>
                <button
                  type="button"
                  onClick={() => startOrResumeOmniBrainDownload()}
                  className="underline font-bold text-amber-200 cursor-pointer ml-2"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Delete / Reset option for completed model */}
            {isCompleted && (
              <div className="pt-2 flex items-center justify-between text-[11px] border-t border-white/10">
                <span className="text-white/50">Stored locally in persistent memory</span>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Do you want to delete the offline Omni model weights from local storage?")) {
                      deleteOmniBrainModel();
                    }
                  }}
                  className="text-red-400/80 hover:text-red-400 flex items-center gap-1 font-bold cursor-pointer transition-colors"
                >
                  <Trash2 size={12} />
                  <span>Delete Brain</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quick Launch Buttons after download is complete */}
        {isCompleted && (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md pt-2">
            {onOpenChat && (
              <button
                type="button"
                onClick={onOpenChat}
                className="w-full py-3 px-4 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <span>Test Offline Chat</span>
              </button>
            )}
            {onOpenQuiz && (
              <button
                type="button"
                onClick={onOpenQuiz}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-indigo-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Cpu size={15} />
                <span>Generate Offline Quiz</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer Info */}
      <div className="w-full max-w-md mx-auto text-center text-[10px] text-white/40 pb-2">
        <span>Resumable HTTP Range Chunks • IndexedDB Local Storage • High-Speed On-Device Engine</span>
      </div>
    </div>
  );
};
