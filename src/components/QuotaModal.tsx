import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Clock } from 'lucide-react';

export interface QuotaModalProps {
  showQuotaModal: boolean;
  setShowQuotaModal: (show: boolean) => void;
  quotaModalMessage: string;
}

export const QuotaModal: React.FC<QuotaModalProps> = ({
  showQuotaModal,
  setShowQuotaModal,
  quotaModalMessage,
}) => {
  return (
    <AnimatePresence>
      {showQuotaModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-[#161224] border border-amber-500/30 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 text-center shadow-2xl text-white relative overflow-hidden"
          >
            {/* Header Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

            {/* Warning Icon */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
              <AlertTriangle size={32} />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight text-amber-400">
                Daily Quota Limit Reached
              </h3>
              <p className="text-xs text-white/70 leading-relaxed">
                {quotaModalMessage || "Your daily operation limit has been reached. Please try again tomorrow morning or contact admin."}
              </p>
            </div>

            {/* Refresh Time Info Box */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Clock size={20} />
              </div>
              <div className="text-xs">
                <span className="font-bold text-amber-300 block mb-0.5">Automatic Reset at 9:00 AM</span>
                <span className="text-white/60 text-[11px] leading-tight block">
                  Our server quota limit has been reached for today. Operations will automatically refresh and resume at <strong>9:00 AM</strong>.
                </span>
              </div>
            </div>

            {/* Button */}
            <button
              onClick={() => setShowQuotaModal(false)}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-98 transition-all cursor-pointer"
            >
              I Understand
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
