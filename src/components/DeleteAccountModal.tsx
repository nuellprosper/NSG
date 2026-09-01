import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Trash2, RefreshCcw, AlertTriangle, Loader2 } from 'lucide-react';

export interface DeleteAccountModalProps {
  isDeleteAccountOpen: boolean;
  setIsDeleteAccountOpen: (val: boolean) => void;
  deleteConfirmInput: string;
  setDeleteConfirmInput: (val: string) => void;
  isDeletingAccount?: boolean;
  handleDeleteAccount: () => void;
  theme: 'light' | 'dark';
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isDeleteAccountOpen,
  setIsDeleteAccountOpen,
  deleteConfirmInput,
  setDeleteConfirmInput,
  isDeletingAccount = false,
  handleDeleteAccount,
  theme,
}) => {
  return (
<AnimatePresence>
      {isDeleteAccountOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => { setIsDeleteAccountOpen(false); setDeleteConfirmInput(""); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full max-w-sm ${theme === 'dark' ? 'bg-[#13111C] border-red-500/30' : 'bg-white border-red-100'} border-[2px] rounded-3xl p-6 shadow-2xl space-y-6 text-left`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-red-500/10 text-red-500 flex-shrink-0 animate-pulse">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className={`font-black uppercase tracking-tighter text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Delete My Account</h3>
                  <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>This action is permanent and irreversible.</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className={`text-xs font-semibold leading-relaxed ${theme === 'dark' ? 'text-white/60' : 'text-slate-605'}`}>
                  To continue de-registering your index of academic notes, AI chat history, and active performance credentials, please type <span className="font-bold text-red-500 select-none">delete my account</span> in the input field below:
                </p>

                <input
                  type="text"
                  placeholder="delete my account"
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  className={`w-full py-4 px-5 rounded-2xl outline-none border transition-all text-sm font-bold ${
                    theme === 'dark' 
                      ? 'bg-red-500/5 focus:bg-red-500/15 border-white/10 focus:border-red-500 text-white' 
                      : 'bg-red-50/50 focus:bg-white border-slate-200 focus:border-red-500 text-slate-800'
                  }`}
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => { setIsDeleteAccountOpen(false); setDeleteConfirmInput(""); }}
                  className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    theme === 'dark' ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                  }`}
                >
                  ABORT
                </button>
                <button 
                  disabled={deleteConfirmInput.trim().toLowerCase() !== "delete my account" || isDeletingAccount}
                  onClick={handleDeleteAccount}
                  className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-white shadow-lg flex items-center justify-center gap-1.5 ${
                    deleteConfirmInput.trim().toLowerCase() === "delete my account"
                      ? 'bg-red-600 hover:bg-red-700 hover:shadow-red-600/30 active:translate-y-[2px]'
                      : 'bg-red-953/20 text-red-500/20 shadow-none cursor-not-allowed border border-white/5'
                  }`}
                >
                  {isDeletingAccount ? <Loader2 size={14} className="animate-spin" /> : 'DELETE MY ACCOUNT'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
  );
};
