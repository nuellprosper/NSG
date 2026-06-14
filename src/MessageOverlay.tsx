import React, { useState } from 'react';
import { 
  Reply, Copy, ArrowRight, Star, Trash, X, Check, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message } from '../types/chat';

interface MessageOverlayProps {
  message: Message | null;
  triggerPosition: { x: number; y: number };
  onClose: () => void;
  onReact: (emoji: string) => void;
  onReplyInline: () => void;
  onCopyText: () => void;
  onForward: () => void;
  onStarMessage: () => void;
  onDeleteMessage: (type: 'me' | 'everyone') => void;
}

export const MessageOverlay: React.FC<MessageOverlayProps> = ({
  message,
  triggerPosition,
  onClose,
  onReact,
  onReplyInline,
  onCopyText,
  onForward,
  onStarMessage,
  onDeleteMessage
}) => {
  const [showDeletionPrompt, setShowDeletionPrompt] = useState(false);

  if (!message) return null;

  // Enforce mathematically correct position vectors within boundary constraints
  const rawX = triggerPosition.x;
  const rawY = triggerPosition.y;

  const styleX = Math.min(rawX, window.innerWidth - 260);
  const styleY = Math.min(rawY, window.innerHeight - 340);

  // Reaction picker emoticons strictly matching the spec
  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  return (
    <div className="fixed inset-0 z-50 text-left">
      {/* Tap backdrop to exit overlay securely */}
      <div 
        className="absolute inset-0 bg-[#0E0C16]/60 backdrop-blur-[1px] cursor-pointer" 
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{ left: styleX, top: styleY }}
        className="absolute w-56 bg-[#181628] border border-white/10 rounded-2xl p-2.5 shadow-2xl z-50 flex flex-col gap-2 font-sans"
      >
        {/* Horizontal Floating Emoji Reaction Bar */}
        <div className="flex justify-between items-center bg-zinc-950/90 py-1.5 px-2 rounded-xl border border-white/5">
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onReact(emoji);
                onClose();
              }}
              className="text-base hover:scale-135 transition-transform active:scale-95 cursor-pointer select-none"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Vertical contextual list options */}
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => {
              onReplyInline();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-[10px] uppercase font-black text-white/80 hover:text-white transition-all text-left"
          >
            <Reply size={13} className="text-red-500" />
            <span>Reply Inline</span>
          </button>

          <button
            onClick={() => {
              onCopyText();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-[10px] uppercase font-black text-white/80 hover:text-white transition-all text-left"
          >
            <Copy size={13} />
            <span>Copy Text</span>
          </button>

          <button
            onClick={() => {
              onForward();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-[10px] uppercase font-black text-white/80 hover:text-white transition-all text-left"
          >
            <ArrowRight size={13} />
            <span>Forward Message</span>
          </button>

          <button
            onClick={() => {
              onStarMessage();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-[10px] uppercase font-black text-white/80 hover:text-white transition-all text-left"
          >
            <Star size={13} className={message.starredBy?.length ? 'fill-yellow-400 text-yellow-400' : ''} />
            <span>Star Message</span>
          </button>

          <div className="border-t border-white/5 my-1" />

          {/* Delete action styled in bright Crimson Red text */}
          <button
            onClick={() => setShowDeletionPrompt(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-500/10 text-[10px] uppercase font-black text-[#DC2626] transition-all text-left"
          >
            <Trash size={13} />
            <span>Delete Message</span>
          </button>
        </div>
      </motion.div>

      {/* Safety prompt overlay offering custom options */}
      <AnimatePresence>
        {showDeletionPrompt && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              className="absolute inset-0 bg-black"
              onClick={() => setShowDeletionPrompt(false)}
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#181628] border border-white/10 rounded-3xl p-6 shadow-2xl relative z-50 text-center max-w-xs w-full"
            >
              <h4 className="text-xs font-black uppercase tracking-widest text-[#DC2626] mb-2">Delete Message</h4>
              <p className="text-xs text-white/50 leading-relaxed mb-5">Confirm if this scholarly message should be permanently wiped from databases</p>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    onDeleteMessage('me');
                    setShowDeletionPrompt(false);
                    onClose();
                  }}
                  className="w-full py-3 bg-[#DC2626]/10 hover:bg-[#DC2626]/20 border border-[#DC2626]/20 rounded-2xl text-[9px] font-black uppercase text-white tracking-widest transition-all"
                >
                  Delete for Me
                </button>
                <button
                  onClick={() => {
                    onDeleteMessage('everyone');
                    setShowDeletionPrompt(false);
                    onClose();
                  }}
                  className="w-full py-3 bg-[#6D28D9]/10 hover:bg-[#6D28D9]/20 border border-[#6D28D9]/20 rounded-2xl text-[9px] font-black uppercase text-[#DC2626] tracking-widest transition-all"
                >
                  Delete for Everyone
                </button>
                <button
                  onClick={() => setShowDeletionPrompt(false)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] font-black uppercase text-white/40 tracking-widest transition-all"
                >
                  Cancel Action
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
