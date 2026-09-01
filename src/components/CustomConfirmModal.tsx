import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, AlertTriangle, Trash2, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  isDanger?: boolean;
  onConfirm: () => void;
}

export interface CustomConfirmModalProps {
  confirmModal: ConfirmModalState;
  setConfirmModal: React.Dispatch<React.SetStateAction<ConfirmModalState>>;
  theme: 'light' | 'dark';
}

export const CustomConfirmModal: React.FC<CustomConfirmModalProps> = ({
  confirmModal,
  setConfirmModal,
  theme,
}) => {
  return (
    <AnimatePresence>
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full max-w-sm ${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} border rounded-3xl p-6 shadow-2xl space-y-6`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${confirmModal.isDanger ? 'bg-red-500/10 text-red-500' : 'bg-[#DC2626]/10 text-[#DC2626]'}`}>
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className={`font-black uppercase tracking-tighter text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{confirmModal.title}</h3>
                <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>{confirmModal.message}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
              >
                Cancel
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-white shadow-lg ${confirmModal.isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-[#DC2626] hover:bg-[#DC2626]/90 shadow-[#DC2626]/20'}`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
