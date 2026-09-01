import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Plus, MessageSquare, Pin, MoreVertical, 
  Edit3, Trash2, Check, Settings, Sparkles, Zap
} from 'lucide-react';
import { Message } from '../../types/chat';

export interface OmniChatSession {
  id: string;
  title: string;
  timestamp: Date | string;
  isPinned?: boolean;
  messages: Message[];
  lastMessage?: string;
}

export interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chatSessions: OmniChatSession[];
  activeSessionId?: string | null;
  thinkingChatIds?: Record<string, boolean>;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRenameSession?: (id: string, newTitle: string) => void;
  onPinSession?: (id: string) => void;
  onDeleteSession?: (id: string) => void;
  user: any;
  userHandle: string;
  onOpenSettings?: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  chatSessions,
  activeSessionId,
  thinkingChatIds = {},
  onSelectSession,
  onNewChat,
  onRenameSession,
  onPinSession,
  onDeleteSession,
  user,
  userHandle,
  onOpenSettings
}) => {
  const [activeMenuSessionId, setActiveMenuSessionId] = useState<string | null>(null);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameTitleInput, setRenameTitleInput] = useState('');

  // Close menus on outside click handled at drawer level
  const handleBackdropClick = () => {
    setActiveMenuSessionId(null);
    setRenamingSessionId(null);
    onClose();
  };

  // Sort sessions: Pinned first, then by recency
  const sortedSessions = [...chatSessions].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Semi-transparent Backdrop */}
          <motion.div
            id="chat_drawer_backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 cursor-pointer"
          />

          {/* Slide-out Left Drawer Panel */}
          <motion.div
            id="chat_history_drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-[#120F1D] border-r border-white/10 z-50 flex flex-col shadow-2xl p-4 text-left select-none"
            style={{
              paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)'
            }}
          >
            {/* Header: Title "Omni" / "Gemini" & Close Button */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#DC2626] to-red-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-red-900/30">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider leading-none">Omni AI</h3>
                  <span className="text-[10px] text-white/40 font-medium">Academic Study Companion</span>
                </div>
              </div>

              <button 
                id="close_drawer_btn"
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close Drawer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Start New Chat CTA */}
            <button
              id="drawer_new_chat_btn"
              type="button"
              onClick={() => {
                onNewChat();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#DC2626] to-rose-700 hover:from-red-600 hover:to-rose-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 active:scale-95 transition-all mb-4 cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>Start New Omni Chat</span>
            </button>

            {/* Recent History List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1 min-h-0">
              <div className="flex items-center justify-between px-1 mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Recents</p>
                <span className="text-[9px] font-mono text-white/30">{chatSessions.length} sessions</span>
              </div>

              {sortedSessions.length === 0 ? (
                <div className="text-center py-16 text-white/30 space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-white/20">
                    <MessageSquare size={24} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/50">No Chats Yet</p>
                  <p className="text-[10px] text-white/30 max-w-[180px] mx-auto">
                    Ask Omni questions to generate and preserve your academic chat history.
                  </p>
                </div>
              ) : (
                sortedSessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  const isPinned = Boolean(session.isPinned);
                  const isRenaming = renamingSessionId === session.id;

                  return (
                    <div
                      key={session.id}
                      className={`relative group rounded-2xl border transition-all ${
                        isActive 
                          ? 'bg-[#DC2626]/20 border-[#DC2626]/50 text-white shadow-md shadow-red-950/20' 
                          : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/80'
                      }`}
                    >
                      {isRenaming ? (
                        <div className="p-2.5 flex items-center gap-1.5">
                          <input
                            type="text"
                            value={renameTitleInput}
                            onChange={(e) => setRenameTitleInput(e.target.value)}
                            className="flex-1 bg-black/50 border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-red-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && renameTitleInput.trim() && onRenameSession) {
                                onRenameSession(session.id, renameTitleInput.trim());
                                setRenamingSessionId(null);
                              } else if (e.key === 'Escape') {
                                setRenamingSessionId(null);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (onRenameSession && renameTitleInput.trim()) {
                                onRenameSession(session.id, renameTitleInput.trim());
                              }
                              setRenamingSessionId(null);
                            }}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenamingSessionId(null)}
                            className="p-1.5 bg-white/10 text-white/60 rounded-lg text-xs cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="p-3 flex items-center justify-between gap-2">
                          <div
                            onClick={() => {
                              onSelectSession(session.id);
                              onClose();
                            }}
                            className="flex-1 min-w-0 cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              {isPinned && <Pin size={11} className="text-amber-400 fill-amber-400/30 shrink-0" />}
                              <h4 className="text-xs font-bold truncate text-white">
                                {session.title || 'New Chat'}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {thinkingChatIds[session.id] ? (
                                <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-amber-400 animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                  Generating response...
                                </span>
                              ) : (
                                <p className="text-[9.5px] text-white/40 truncate">
                                  {typeof session.timestamp === 'string' ? session.timestamp : 'Recent chat'}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* 3-dots Context Menu for Pin, Rename, Delete */}
                          <div className="relative shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuSessionId(activeMenuSessionId === session.id ? null : session.id);
                              }}
                              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                              title="Options"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {activeMenuSessionId === session.id && (
                              <div 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-8 z-50 bg-[#1C182B] border border-white/15 rounded-2xl p-1.5 shadow-2xl min-w-[130px] flex flex-col gap-1 text-left backdrop-blur-xl"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuSessionId(null);
                                    setRenamingSessionId(session.id);
                                    setRenameTitleInput(session.title);
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-xs text-white/90 font-medium cursor-pointer"
                                >
                                  <Edit3 size={13} className="text-blue-400" /> Rename
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuSessionId(null);
                                    if (onPinSession) onPinSession(session.id);
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-xs text-white/90 font-medium cursor-pointer"
                                >
                                  <Pin size={13} className={isPinned ? 'text-amber-400' : 'text-white/40'} /> 
                                  {isPinned ? 'Unpin' : 'Pin'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuSessionId(null);
                                    if (onDeleteSession) onDeleteSession(session.id);
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-500/20 text-xs text-red-400 font-medium cursor-pointer"
                                >
                                  <Trash2 size={13} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer: User Profile Row with Avatar & Status */}
            <div className="border-t border-white/10 pt-3.5 mt-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden border border-white/15 shadow-md">
                  {user?.photoURL ? (
                    <img referrerPolicy="no-referrer" src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(user?.displayName || userHandle || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user?.displayName || userHandle || 'Scholar'}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-block px-1.5 py-0.2 bg-red-600/30 border border-red-500/40 text-red-400 text-[8.5px] font-black uppercase rounded tracking-wider">
                      PLUS
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> Active
                    </span>
                  </div>
                </div>
              </div>

              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Profile & Settings"
                >
                  <Settings size={18} />
                </button>
              )}
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
