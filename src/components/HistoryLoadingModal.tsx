import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Lock } from 'lucide-react';

export interface HistoryLoadingModalProps {
  historyLoadingModal: {
    show: boolean;
    title: string;
    message: string;
  };
}

export const HistoryLoadingModal: React.FC<HistoryLoadingModalProps> = ({
  historyLoadingModal,
}) => {
  return (
    <AnimatePresence>
      {historyLoadingModal.show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999999] bg-[#0A0713]/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 select-none cursor-wait"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            className="bg-[#171328]/95 border border-purple-500/30 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-5"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <RefreshCw size={28} className="animate-spin text-purple-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500/90 border-2 border-[#171328] flex items-center justify-center text-white">
                <Lock size={12} />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                {historyLoadingModal.title || "Loading Session..."}
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                {historyLoadingModal.message || "Please wait while we restore your session and lock the interface..."}
              </p>
            </div>

            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 animate-pulse w-full rounded-full" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
