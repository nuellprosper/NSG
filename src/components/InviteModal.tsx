import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, X, Gift, Copy, Share2, Award, Sparkles, Check, ChevronRight } from 'lucide-react';
import { WhatsAppIcon } from '../subComponents';

export interface InviteModalProps {
  showInviteModal: boolean;
  setShowInviteModal: (val: boolean) => void;
  currentUserData: any;
  copyToClipboard?: (text: string, label?: string) => void;
  handleShareInvite?: () => void;
  setUserNotification?: (msg: string) => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  showInviteModal,
  setShowInviteModal,
  currentUserData,
  copyToClipboard,
  handleShareInvite,
  setUserNotification,
}) => {
  if (!showInviteModal) return null;

  const handleCopy = (text: string, label: string) => {
    if (copyToClipboard) {
      copyToClipboard(text, label);
    } else {
      navigator.clipboard.writeText(text);
      if (setUserNotification) setUserNotification(label);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          exit={{ scale: 0.9, opacity: 0 }} 
          className="bg-[#13111C] border border-white/10 rounded-[2.5rem] p-6 max-w-sm sm:max-w-md w-full space-y-6 relative shadow-2xl overflow-hidden text-left"
        >
          {/* Abs decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#DC2626]/5 rounded-full translate-x-12 -translate-y-12 block pointer-events-none" />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Buddy Referral Hub</h3>
              <p className="text-[9px] font-black text-[#DC2626] uppercase tracking-widest mt-0.5">Start mutual 5-day study streaks</p>
            </div>
            <button 
              onClick={() => setShowInviteModal(false)} 
              className="p-2 hover:bg-white/5 rounded-xl transition-all font-black text-white/40 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Referral Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
              <span className="text-[8px] uppercase font-black text-white/30 tracking-widest block mb-1">Mates Invited</span>
              <span className="text-3xl font-black text-[#58CC02] block">{currentUserData?.invitedUsers?.length || 0}</span>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
              <span className="text-[8px] uppercase font-black text-white/30 tracking-widest block mb-1">Booster Points</span>
              <span className="text-3xl font-black text-[#FFC000] block">{(currentUserData?.invitedUsers?.length || 0) * 50} XP</span>
            </div>
          </div>

          {/* Share Code and URL Section */}
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Your Private Invite Code</p>
              <div className="flex items-center justify-between gap-2">
                <span className="flex-1 bg-transparent text-sm text-amber-400 font-bold font-mono tracking-widest select-all">
                  {currentUserData?.username || 'no_code_available'}
                </span>
                <button 
                  onClick={() => handleCopy(currentUserData?.username || '', "Invite code copied!")} 
                  className="p-2 text-white/40 hover:text-[#DC2626] transition-colors cursor-pointer"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Shareable Mobile Link</p>
              <div className="flex items-center justify-between gap-2">
                <input 
                  readOnly 
                  value={`https://nuellstudyguide.name.ng/?invite=${currentUserData?.username || ''}`} 
                  className="flex-1 bg-transparent border-none outline-none text-[10px] text-white/70 font-mono truncate" 
                />
                <button 
                  onClick={() => handleCopy(`https://nuellstudyguide.name.ng/?invite=${currentUserData?.username || ''}`, "Referral link copied!")} 
                  className="p-2 text-[#DC2626] hover:text-red-400 cursor-pointer"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Invited Users List */}
          <div className="space-y-2">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Invited Buddy Crew</p>
            {(!currentUserData?.invitedUsers || currentUserData.invitedUsers.length === 0) ? (
              <p className="text-[10px] text-white/20 italic text-center py-4 bg-white/5 rounded-2xl border border-dashed border-white/5">
                No active buddies yet. Share your invite code to get started!
              </p>
            ) : (
              <div className="max-h-32 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {currentUserData.invitedUsers.map((buddy: any, bIdx: number) => (
                  <div key={bIdx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-tight">@{buddy.username}</p>
                      <p className="text-[8px] text-white/40">{buddy.fullName || 'Anonymous'}</p>
                    </div>
                    <span className="text-[8px] text-[#58CC02] font-black uppercase tracking-widest">
                      +50 XP Applied
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => setShowInviteModal(false)} 
            className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-[#DC2626]/20 transition-all text-center cursor-pointer"
          >
            Close Referral Hub
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
