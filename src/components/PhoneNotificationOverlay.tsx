import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export interface PhoneNotification {
  id: string;
  title: string;
  body: string;
  type?: 'welcome' | 'quiz' | 'note' | 'assignment' | string;
}

export interface PhoneNotificationOverlayProps {
  activePhoneNotifs: PhoneNotification[];
  setActivePhoneNotifs: React.Dispatch<React.SetStateAction<PhoneNotification[]>>;
  setActiveTab: (tab: any) => void;
  setToolsSubTab: (subTab: any) => void;
}

export const PhoneNotificationOverlay: React.FC<PhoneNotificationOverlayProps> = ({
  activePhoneNotifs,
  setActivePhoneNotifs,
  setActiveTab,
  setToolsSubTab,
}) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] w-full max-w-[360px] pointer-events-none flex flex-col gap-3 px-4 sm:px-0">
      <AnimatePresence>
        {activePhoneNotifs.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
            className="pointer-events-auto w-full bg-[#1A1825]/95 dark:bg-[#12111A]/98 text-white p-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-md flex flex-col gap-3 transition-all hover:border-red-500/30"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center text-xs font-black shadow-md shadow-red-500/20">
                  NSG
                </div>
                <span className="text-[10px] font-black tracking-wider text-slate-300 uppercase">NSG STUDY GUIDE</span>
                <span className="text-[8px] text-slate-500 font-mono">• now</span>
              </div>
              <button
                onClick={() => setActivePhoneNotifs(prev => prev.filter(n => n.id !== notif.id))}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-white tracking-tight">{notif.title}</p>
              <p className="text-[11px] text-slate-300 leading-normal">{notif.body}</p>
            </div>

            {notif.type !== 'welcome' && (
              <button
                onClick={() => {
                  setActivePhoneNotifs(prev => prev.filter(n => n.id !== notif.id));
                  if (notif.type === 'quiz') {
                    setActiveTab('tools');
                    setToolsSubTab('quiz');
                  } else if (notif.type === 'note') {
                    setActiveTab('class');
                  } else if (notif.type === 'assignment') {
                    setActiveTab('tools');
                    setToolsSubTab('assignment');
                  }
                }}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:opacity-95 text-white text-[10px] font-black py-2.5 rounded-xl uppercase tracking-wider transition-all shadow-lg shadow-red-500/10 active:scale-95 text-center cursor-pointer"
              >
                🎯 TRY YOURS NOW
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
