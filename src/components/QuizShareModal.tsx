import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, Copy, RefreshCcw, Check, Brain, Clock, ShieldCheck, Sparkles, Send, MessageSquare, ChevronLeft } from 'lucide-react';
import { WhatsAppIcon } from '../subComponents';

export interface QuizShareModalProps {
  showQuizShareModal: boolean;
  setShowQuizShareModal: (val: boolean) => void;
  theme: 'light' | 'dark';
  shareQuizLink: string;
  shareQuizTitle: string;
  copyToClipboard?: (text: string, label?: string) => void;
  handleShareQuizToPlatform: (platform: 'whatsapp' | 'telegram' | 'native') => void;
  isGeneratingShareImage: boolean;
  quizShareCardRef: React.RefObject<any>;
  quizQuestions: any[];
  currentQuizIndex?: number;
  quizTimeRemaining?: number;
}

export const QuizShareModal: React.FC<QuizShareModalProps> = ({
  showQuizShareModal,
  setShowQuizShareModal,
  theme,
  shareQuizLink,
  shareQuizTitle,
  copyToClipboard,
  handleShareQuizToPlatform,
  isGeneratingShareImage,
  quizShareCardRef,
  quizQuestions = [],
  currentQuizIndex = 0,
  quizTimeRemaining = 0,
}) => {
  if (!showQuizShareModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          exit={{ scale: 0.9, opacity: 0 }} 
          className={`${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-slate-900 border-slate-700'} border rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative`}
        >
          <button 
            onClick={() => setShowQuizShareModal(false)}
            className="absolute top-4 right-4 p-2 text-white/40 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#DC2626]/20 border border-[#DC2626]/40 flex items-center justify-center mx-auto text-[#DC2626]">
              <Share2 size={24} />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Share Quiz</h3>
            <p className="text-xs text-white/50 max-w-xs mx-auto">
              Share this quiz link and question card with your study partners!
            </p>
          </div>

          {shareQuizLink && (
            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Quiz Share Link</p>
              <div className="flex items-center gap-2">
                <input 
                  readOnly 
                  value={shareQuizLink} 
                  className="flex-1 bg-transparent border-none outline-none text-xs text-red-400 font-mono truncate" 
                />
                {copyToClipboard && (
                  <button 
                    onClick={() => copyToClipboard(shareQuizLink, "Quiz link copied to clipboard!")}
                    className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#DC2626]/90 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shrink-0 shadow-lg shadow-[#DC2626]/20 cursor-pointer"
                  >
                    <Copy size={12} />
                    <span>Copy</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SOCIAL BUTTONS */}
          <div className="space-y-2">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest text-center">Share via</p>
            <div className="grid grid-cols-3 gap-3">
              {/* WhatsApp */}
              <button
                onClick={() => handleShareQuizToPlatform('whatsapp')}
                disabled={isGeneratingShareImage}
                className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] transition-all font-bold group disabled:opacity-50 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-[#25D366]/20 group-hover:scale-110 transition-transform">
                  <MessageSquare size={20} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider">WhatsApp</span>
              </button>

              {/* Telegram */}
              <button
                onClick={() => handleShareQuizToPlatform('telegram')}
                disabled={isGeneratingShareImage}
                className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 text-[#0088cc] transition-all font-bold group disabled:opacity-50 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0088cc] text-white flex items-center justify-center shadow-lg shadow-[#0088cc]/20 group-hover:scale-110 transition-transform">
                  <Send size={20} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider">Telegram</span>
              </button>

              {/* Others */}
              <button
                onClick={() => handleShareQuizToPlatform('native')}
                disabled={isGeneratingShareImage}
                className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 transition-all font-bold group disabled:opacity-50 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/20 group-hover:scale-110 transition-transform">
                  <Share2 size={20} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider">Others</span>
              </button>
            </div>
          </div>

          {isGeneratingShareImage && (
            <p className="text-[10px] font-bold text-center text-red-400 uppercase tracking-widest animate-pulse">
              Generating Quiz Image Card...
            </p>
          )}
        </motion.div>
      </div>

      {/* HIDDEN QUIZ CARD FOR PREVIEW IMAGE GENERATION */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none">
        <div 
          ref={quizShareCardRef} 
          className="w-[620px] p-6 bg-[#0B0D17] text-white rounded-3xl border border-slate-800 flex flex-col space-y-4 shadow-2xl relative overflow-hidden"
          style={{ fontFamily: 'DM Sans, sans-serif' }}
        >
          {/* Active Quiz Header & Top Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-purple-300">
                {shareQuizTitle || "INTERACTIVE QUIZ"}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white">
              <Share2 size={18} />
            </div>
          </div>

          {/* Segmented Bar & Stats Header */}
          <div className="flex items-center gap-3">
            <div className="flex-1 flex gap-1 h-2">
              {Array.from({ length: Math.min(quizQuestions.length || 10, 30) }, (_, i) => (
                <div key={i} className={`h-2 flex-1 rounded-full ${i === 0 ? 'bg-purple-500' : 'bg-white/20'}`} />
              ))}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-bold text-white/80">1 / {quizQuestions.length || 10}</span>
            </div>
          </div>

          {/* Main Question Container */}
          <div className="bg-[#0F1424] border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-black text-xs">
                Q1
              </span>
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wide">
                Question 1 of {quizQuestions.length || 10}
              </span>
            </div>

            <h3 className="text-white text-base font-bold leading-relaxed">
              {quizQuestions[0]?.question || "What is the primary concept covered in this study module?"}
            </h3>

            <div className="space-y-2.5 pt-1">
              {(quizQuestions[0]?.options || [
                "Core theoretical principles and foundational framework",
                "Advanced empirical analysis and experimental verification",
                "Practical methodology applied in modern research environments",
                "Comprehensive summary of historical development and progress"
              ]).slice(0, 4).map((optText: string, optIdx: number) => (
                <div 
                  key={optIdx} 
                  className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-center gap-3"
                >
                  <div className="w-7 h-7 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-200 font-extrabold flex items-center justify-center text-xs shrink-0">
                    {String.fromCharCode(65 + optIdx)}
                  </div>
                  <span className="text-slate-200 text-sm font-semibold leading-snug">
                    {optText}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card Footer */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 px-1 text-[10px]">
            <span className="text-slate-400 font-mono font-bold">NSG SCHOLAR OMNI • PRACTICE QUIZ</span>
            <span className="text-purple-400 font-bold tracking-wider">{shareQuizLink || 'https://nsg-scholar.app'}</span>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
