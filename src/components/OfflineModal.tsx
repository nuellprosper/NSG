import React, { useEffect, useState } from 'react';
import { WifiOff, X, Zap, Cpu, Download, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeQwenProgress, initWebLlmQwen, QwenLoadProgress } from '../lib/capacitor';

interface OfflineModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export const OfflineModal: React.FC<OfflineModalProps> = ({
  isOpen,
  onClose,
  title = "YOU ARE OFFLINE",
  message = "This action requires an active internet connection. Please check your network and try again."
}) => {
  const [qwenProgress, setQwenProgress] = useState<QwenLoadProgress>({
    progress: 0,
    text: 'Not initialized',
    isLoading: false,
    isReady: false,
    error: null
  });

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = subscribeQwenProgress((state) => {
      setQwenProgress(state);
    });
    return () => unsubscribe();
  }, [isOpen]);

  const handleInitializeLocalModel = () => {
    initWebLlmQwen();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="bg-[#181628] border border-red-500/30 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl relative overflow-hidden"
          >
            {/* Glowing Accent */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-650/20 rounded-full blur-2xl pointer-events-none" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/40 hover:text-white rounded-full bg-white/5 transition-all"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto mb-4 shadow-lg shadow-red-500/10">
              <WifiOff size={32} className="animate-pulse" />
            </div>

            <h3 className="text-lg font-black text-white uppercase italic tracking-tight mb-2">
              {title}
            </h3>

            <p className="text-xs text-white/70 leading-relaxed font-medium mb-4">
              {message}
            </p>

            <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl mb-5 text-left">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                    <Cpu size={15} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Local Qwen AI Engine</p>
                    <p className="text-[10px] text-white/60">100% Offline WebGPU Model</p>
                  </div>
                </div>
                {qwenProgress.isReady ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <CheckCircle2 size={12} /> Ready
                  </span>
                ) : (
                  <button
                    onClick={handleInitializeLocalModel}
                    disabled={qwenProgress.isLoading}
                    className="text-[10px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    <Download size={12} /> {qwenProgress.isLoading ? 'Loading...' : 'Preload Model'}
                  </button>
                )}
              </div>

              {qwenProgress.isLoading && (
                <div className="mt-2.5">
                  <div className="flex justify-between text-[10px] text-white/70 font-mono mb-1">
                    <span className="truncate max-w-[190px]">{qwenProgress.text}</span>
                    <span className="font-bold text-amber-400">{qwenProgress.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300 rounded-full"
                      style={{ width: `${qwenProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {qwenProgress.error && (
                <p className="text-[10px] text-amber-300/80 mt-1.5 italic font-sans">
                  Note: Using structured local fallback engine on this device drivers.
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 bg-[#DC2626] hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-900/30 active:scale-95"
            >
              Got It
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

