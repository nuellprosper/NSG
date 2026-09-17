import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, ScrollText, CheckCircle2, ArrowRight } from 'lucide-react';
import { 
  TERMS_TITLE, 
  TERMS_LAST_UPDATED, 
  TERMS_PREAMBLE, 
  TERMS_SECTIONS 
} from '../constants/terms';

export interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  theme?: 'light' | 'dark';
}

export const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className={`relative z-10 w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
              isDark 
                ? 'bg-[#12131C] border-white/10 text-white' 
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className={`p-5 sm:p-6 border-b flex items-center justify-between shrink-0 ${
              isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/70'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 shadow-inner">
                  <ScrollText size={20} />
                </div>
                <div>
                  <h3 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {TERMS_TITLE}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                      <Shield size={12} />
                      Official Student Agreement
                    </span>
                    <span className={`text-[11px] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>•</span>
                    <span className={`text-[11px] ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                      Updated {TERMS_LAST_UPDATED}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                aria-label="Close Terms modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 custom-scrollbar text-sm leading-relaxed">
              {/* Preamble Card */}
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-2.5 ${
                isDark 
                  ? 'bg-purple-950/20 border-purple-800/30 text-purple-100/90' 
                  : 'bg-purple-50/70 border-purple-100 text-purple-900'
              }`}>
                {TERMS_PREAMBLE.map((paragraph, index) => (
                  <p key={index} className="text-xs sm:text-sm font-normal">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Sections */}
              <div className="space-y-6">
                {TERMS_SECTIONS.map((section) => (
                  <section 
                    key={section.id} 
                    className={`p-4 sm:p-5 rounded-2xl border space-y-3 transition-colors ${
                      isDark 
                        ? 'bg-white/[0.02] border-white/5 hover:border-white/10' 
                        : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <h4 className={`text-sm sm:text-base font-bold flex items-center gap-2 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                      {section.title}
                    </h4>

                    <div className={`space-y-2 text-xs sm:text-sm ${
                      isDark ? 'text-white/70' : 'text-slate-600'
                    }`}>
                      {section.content.map((paragraph, pIdx) => (
                        <p key={pIdx}>{paragraph}</p>
                      ))}

                      {section.bullets && section.bullets.length > 0 && (
                        <ul className="space-y-1.5 pt-1 pl-1">
                          {section.bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-2 text-xs sm:text-sm">
                              <span className="text-purple-400 mt-1 shrink-0">•</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className={`p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
              isDark ? 'border-white/10 bg-[#0E0F17]' : 'border-slate-100 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>Fair academic use & student data privacy protected</span>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isDark 
                      ? 'bg-white/5 hover:bg-white/10 text-white/80' 
                      : 'bg-slate-200/80 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Close
                </button>
                {onAccept ? (
                  <button
                    type="button"
                    onClick={() => {
                      onAccept();
                      onClose();
                    }}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-lg shadow-purple-900/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>I Agree & Accept</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-lg shadow-purple-900/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>I Understand</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
