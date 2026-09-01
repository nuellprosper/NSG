import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Copy, Download, RefreshCcw, Check, Sparkles, Award, X } from 'lucide-react';
import { WhatsAppIcon } from '../subComponents';

export interface ShareModalProps {
  showShareModal: boolean;
  setShowShareModal: (val: boolean) => void;
  theme: 'light' | 'dark';
  shareQuizLink?: string;
  copyToClipboard?: (text: string, label?: string) => void;
  shareName?: string;
  setShareName?: (val: string) => void;
  downloadScorecard: () => void;
  isSharing?: boolean;
  shareCardRef: React.RefObject<any>;
  examConfig?: any;
  currentScore?: number;
  totalQuestions?: number;
  toolsSubTab?: string;
  adminNewSubject?: string;
  [key: string]: any;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  showShareModal,
  setShowShareModal,
  theme,
  shareQuizLink,
  copyToClipboard,
  shareName = 'Student',
  setShareName = () => {},
  downloadScorecard,
  isSharing = false,
  shareCardRef,
  examConfig,
  currentScore = 0,
  totalQuestions = 10,
  toolsSubTab,
  adminNewSubject,
}) => {
  if (!showShareModal) return null;

  const percentage = totalQuestions > 0 ? Math.round((currentScore / totalQuestions) * 100) : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          exit={{ scale: 0.9, opacity: 0 }} 
          className={`${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} border rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-6 relative shadow-2xl`}
        >
          <button 
            onClick={() => setShowShareModal(false)}
            className="absolute top-4 right-4 p-2 text-white/40 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>

          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#DC2626]/20 border border-[#DC2626]/40 flex items-center justify-center mx-auto text-[#DC2626]">
              <Award size={24} />
            </div>
            <h3 className={`text-xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Share Your Scorecard</h3>
            <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Enter your name to generate your verified scorecard.</p>
          </div>

          <div className="space-y-1">
            <label className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Your Name / Identifier</label>
            <input 
              type="text" 
              value={shareName} 
              onChange={(e) => setShareName(e.target.value)}
              placeholder="e.g. Kelechi Emmanuel"
              className={`w-full px-4 py-3 rounded-2xl border text-sm outline-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-[#DC2626]/50' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
            />
          </div>

          {shareQuizLink && (
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Shareable Quiz Link</p>
              <div className="flex items-center gap-2">
                <input readOnly value={shareQuizLink} className="flex-1 bg-transparent border-none outline-none text-[10px] text-[#DC2626] font-mono truncate" />
                {copyToClipboard && (
                  <button 
                    onClick={() => copyToClipboard(shareQuizLink, "Quiz link copied!")} 
                    className="p-1.5 text-white/40 hover:text-white"
                  >
                    <Copy size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button 
              onClick={() => setShowShareModal(false)}
              className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-slate-100 text-slate-600'}`}
            >
              Cancel
            </button>
            <button 
              onClick={downloadScorecard}
              disabled={isSharing || !shareName.trim()}
              className="flex-1 py-3.5 bg-[#DC2626] hover:bg-red-500 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/20 cursor-pointer"
            >
              <Download size={14} />
              <span>{isSharing ? 'Generating...' : 'Download PNG'}</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Hidden Scorecard for html2canvas */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none">
        <div 
          ref={shareCardRef} 
          className="w-[450px] p-8 bg-[#0E0C15] text-white rounded-3xl border border-red-500/30 space-y-6 shadow-2xl"
          style={{ fontFamily: 'Syne, DM Sans, sans-serif' }}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#DC2626] flex items-center justify-center font-black text-xs text-white">
                NSG
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight text-white uppercase">NSG Scholar Omni</h4>
                <p className="text-[9px] text-white/40 uppercase tracking-widest">Verified Academic Assessment</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">VERIFIED</span>
          </div>

          <div className="space-y-1 text-center py-2">
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Student</p>
            <h3 className="text-xl font-black text-white">{shareName || 'Student'}</h3>
            <p className="text-xs text-red-400 font-bold">{examConfig?.title || 'Academic Assessment'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
            <div>
              <p className="text-[9px] text-white/40 uppercase">Score</p>
              <p className="text-2xl font-black text-emerald-400">{currentScore} / {totalQuestions}</p>
            </div>
            <div>
              <p className="text-[9px] text-white/40 uppercase">Percentage</p>
              <p className="text-2xl font-black text-amber-400">{percentage}%</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] text-white/40 font-mono pt-2 border-t border-white/10">
            <span>ISSUED BY NSG SCHOLAR</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
