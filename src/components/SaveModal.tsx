import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save } from 'lucide-react';

export interface SaveModalProps {
  saveModal: {
    isOpen: boolean;
    name: string;
    onConfirm: (name: string) => void;
  };
  setSaveModal: React.Dispatch<React.SetStateAction<{
    isOpen: boolean;
    name: string;
    onConfirm: (name: string) => void;
  }>>;
  theme: 'light' | 'dark';
}

export const SaveModal: React.FC<SaveModalProps> = ({
  saveModal,
  setSaveModal,
  theme,
}) => {
  return (
<AnimatePresence>
      {saveModal.isOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} border rounded-[2.5rem] p-8 max-w-sm w-full space-y-6 shadow-2xl`}>
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-[#DC2626]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black">
                  <Save size={32} className="text-[#DC2626]" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Save Recording</h3>
                <p className="text-xs text-white/40">Give your lecture a custom name for easy tracking.</p>
              </div>

              <div className="space-y-1">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Lecture Title</p>
                <input 
                  autoFocus
                  type="text" 
                  value={saveModal.name} 
                  onChange={(e) => setSaveModal(prev => ({ ...prev, name: e.target.value }))} 
                  placeholder="e.g. Physics 101 - Newton's Laws" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm outline-none text-white focus:border-[#DC2626]/50 shadow-inner transition-all" 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setSaveModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all">CANCEL</button>
                <button 
                  onClick={() => {
                    saveModal.onConfirm(saveModal.name);
                    setSaveModal(prev => ({ ...prev, isOpen: false }));
                  }} 
                  disabled={!saveModal.name.trim()}
                  className="flex-[2] bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-[#DC2626]/20 transition-all disabled:opacity-50"
                >
                  Confirm Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
    </AnimatePresence>
  );
};
