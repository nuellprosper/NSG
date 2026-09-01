import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Sparkles } from 'lucide-react';

export interface QuizLinkLoadingOverlayProps {
  isLinkQuizLoading: boolean;
  linkQuizTopic?: string;
}

export const QuizLinkLoadingOverlay: React.FC<QuizLinkLoadingOverlayProps> = ({
  isLinkQuizLoading,
  linkQuizTopic,
}) => {
  return (
    <AnimatePresence>
      {isLinkQuizLoading && (
        <div className="fixed inset-0 z-[999999] bg-[#070913]/95 backdrop-blur-2xl flex items-center justify-center p-6 text-center select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-sm w-full bg-[#0F1424] border border-red-500/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center space-y-5 relative overflow-hidden"
          >
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-red-600/20 rounded-full blur-2xl pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-rose-600 to-red-600 flex items-center justify-center text-white shadow-xl shadow-red-500/30">
              <Loader2 size={32} className="animate-spin text-amber-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                {linkQuizTopic ? `Loading Quiz: ${linkQuizTopic}` : 'Loading Shared Quiz...'}
              </h3>
              <p className="text-xs text-white/60 font-medium leading-relaxed">
                Setting up questions, options, and CBT practice environment. Please hold on...
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-red-400 font-bold uppercase tracking-widest">
              <Loader2 size={14} className="animate-spin text-red-500" /> Omni Quiz Engine Active
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
