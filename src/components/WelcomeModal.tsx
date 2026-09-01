import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain } from 'lucide-react';

export interface WelcomeModalProps {
  showWelcome: boolean;
  closeWelcome: () => void;
  theme: 'light' | 'dark';
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  showWelcome,
  closeWelcome,
  theme,
}) => {
  return (
    <AnimatePresence>
      {showWelcome && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} 
            animate={{ scale: 1, y: 0 }} 
            className={`relative z-10 p-6 sm:p-8 rounded-3xl border shadow-2xl max-w-md w-full text-center overflow-hidden ${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'}`}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-[#DC2626]" />
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-[#DC2626]/10 rounded-2xl flex items-center justify-center">
                <Brain size={40} className="text-[#DC2626]" />
              </div>
              <h2 className={`text-2xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                Welcome to <span className="text-[#DC2626]">NSG</span>
              </h2>
              <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>
                Welcome to NSG, your ultimate academic guide. Transform your learning experience by recording classes, generating AI transcriptions, chatting with our intelligent assistant, and creating custom quizzes. We are constantly improving NSG to better serve your academic journey. Thank you for choosing us as your study partner!
              </p>
              <button 
                onClick={closeWelcome} 
                className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm transition-all shadow-xl shadow-[#DC2626]/20 cursor-pointer"
              >
                GET STARTED
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
