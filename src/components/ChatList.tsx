import React, { useState } from 'react';
import { 
  Search, MoreVertical, Plus, Brain, Pin, Check, X, Trash2, 
  Settings, User, Lock, Eye, ShieldAlert, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Chat } from '../types/chat';

interface ChatListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  setSelectedChat: (chat: Chat | null) => void;
  user: any;
  userHandle: string;
  theme: 'dark' | 'light';
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  subFilter: 'all' | 'unread' | 'secured' | 'groups' | 'calls';
  setSubFilter: (filter: 'all' | 'unread' | 'secured' | 'groups' | 'calls') => void;
  activeTab: 'chats' | 'groups' | 'calls';
  setActiveTab: (tab: 'chats' | 'groups' | 'calls') => void;
  getChatName: (chat: Chat) => string;
  getChatPhoto: (chat: Chat) => string | undefined;
  getChatUsername: (chat: Chat) => string;
  onNewChatTrigger: () => void;
  onOpenSettings: () => void;
  selectedChatIds: string[];
  isSelectionMode: boolean;
  setIsSelectionMode: (mode: boolean) => void;
  toggleChatSelection: (id: string) => void;
  onBatchDelete: () => void;
  memberProfiles?: Record<string, { displayName: string, username?: string, photoURL: string | null, lastSeen?: any }>;
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedChat,
  setSelectedChat,
  user,
  userHandle,
  theme,
  searchQuery,
  setSearchQuery,
  subFilter,
  setSubFilter,
  activeTab,
  setActiveTab,
  getChatName,
  getChatPhoto,
  getChatUsername,
  onNewChatTrigger,
  onOpenSettings,
  selectedChatIds,
  isSelectionMode,
  setIsSelectionMode,
  toggleChatSelection,
  onBatchDelete,
  memberProfiles = {}
}) => {
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  // Core Sorting & Pin Logic (OMNI at index 0 always)
  const processChatsList = (): Chat[] => {
    // 1. Separate Omni from standard threads
    const omniChat = chats.find(c => c.isOmni || c.id.startsWith('omni_'));
    const secondaryChats = chats.filter(c => !(c.isOmni || c.id.startsWith('omni_')));

    // 2. Sort standard chats: Pinned first, then latest updated time
    const sortedSecondary = [...secondaryChats].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const tA = a.updatedAt?.toMillis?.() || (a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0);
      const tB = b.updatedAt?.toMillis?.() || (b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0);
      return tB - tA;
    });

    // 3. Render Omni fixed at index 0 if found
    const finalChain: Chat[] = [];
    if (omniChat) {
      finalChain.push(omniChat);
    }
    finalChain.push(...sortedSecondary);

    return finalChain;
  };

  const processedChats = processChatsList();

  // Apply search/sub-filters
  const filteredChats = processedChats.filter(chat => {
    const chatName = getChatName(chat).toLowerCase();
    const queryMatch = chatName.includes(searchQuery.toLowerCase());
    if (!queryMatch) return false;

    // Sub filter logic
    if (subFilter === 'unread') {
      return chat.unreadBy?.includes(user?.uid || '');
    }
    if (subFilter === 'secured') {
      // Direct clean non-AI P2P conversations (no Omni, no Group)
      return !chat.isOmni && !chat.id.startsWith('omni_') && chat.type !== 'group';
    }
    if (subFilter === 'groups') {
      return chat.type === 'group';
    }
    return true; // includes 'all'
  });

  return (
    <div className="flex flex-col h-full bg-[#13111C] border-r border-white/5 relative overflow-hidden">
      {/* Sticky Top-aligned Header Component */}
      <div className="sticky top-0 z-30 bg-gradient-to-b from-[#181628] to-[#13111C]/95 backdrop-blur-md px-6 py-4 border-b border-white/5 shrink-0">
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isSelectionMode ? (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-4 w-full justify-between"
              >
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setIsSelectionMode(false);
                      // Clear selections
                      chats.forEach(c => {
                        if (selectedChatIds.includes(c.id)) {
                          toggleChatSelection(c.id);
                        }
                      });
                    }}
                    className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                  <span className="text-xs font-black uppercase tracking-widest text-[#DC2626]">
                    {selectedChatIds.length} Selected
                  </span>
                </div>
                {selectedChatIds.length > 0 && (
                  <button 
                    onClick={onBatchDelete}
                    className="p-2 bg-red-650/15 hover:bg-red-500/25 border border-red-500/25 text-[#DC2626] rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center gap-1.5"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between w-full"
              >
                <h1 className="text-md font-black uppercase tracking-tighter italic text-white flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-[#DC2626] rounded-full inline-block" />
                  NSG Chats
                </h1>
                
                <div className="flex items-center gap-1 relative z-40">
                  <button 
                    onClick={() => setShowSearchInput(!showSearchInput)}
                    className="p-2 rounded-xl transition-all hover:bg-white/5 text-[#DC2626] focus:outline-none"
                    title="Search scholarly database"
                  >
                    <Search size={16} />
                  </button>

                  <button 
                    onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                    className="p-2 rounded-xl transition-all hover:bg-white/5 text-white/50 hover:text-white focus:outline-none"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {/* Settings dropdown menu */}
                  <AnimatePresence>
                    {showSettingsDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowSettingsDropdown(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute right-0 top-11 w-48 bg-[#1E1B2E] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 text-left"
                        >
                          <button
                            onClick={() => {
                              setShowSettingsDropdown(false);
                              onOpenSettings();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/5 text-xs text-white/80 hover:text-white transition-all font-bold uppercase tracking-wider"
                          >
                            <User size={13} className="text-[#DC2626]" /> Edit Profile
                          </button>
                          <div className="border-t border-white/5 my-1" />
                          <div className="px-3 py-1.5 text-[8px] font-black text-white/30 uppercase tracking-widest">
                            Nuell Study Guide v3.4
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Expandable slide search */}
        <AnimatePresence>
          {showSearchInput && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Query academic key words..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0A0713] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#DC2626]/50 transition-all font-medium"
                />
                <Search size={14} className="absolute left-3.5 top-3 text-white/30" />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 p-1 rounded-md text-white/30 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* WhatsApp style dynamic filter array */}
      <div className="flex overflow-x-auto gap-1.5 px-6 py-2.5 pb-3 border-b border-white/5 bg-[#13111C]/40 text-left scrollbar-none shrink-0 scroll-smooth">
        {[
          { id: 'all', label: 'All Chats' },
          { id: 'unread', label: 'Unread' },
          { id: 'groups', label: 'Groups' }
        ].map((f) => {
          const active = subFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => {
                setSubFilter(f.id as any);
                setActiveTab('chats');
              }}
              className={`px-3 py-1.5 text-[8.5px] font-black uppercase tracking-widest rounded-xl whitespace-nowrap transition-all border shrink-0 ${
                active 
                  ? 'bg-[#DC2626] border-[#DC2626] text-white shadow-lg shadow-red-950/20' 
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Chat Lists Canvas */}
      <div className="flex-1 overflow-y-auto px-4 py-2.5 space-y-1 pb-24 text-left custom-scrollbar">
        {filteredChats.map((chat, idx) => {
          const isOmni = chat.isOmni || chat.id.startsWith('omni_');
          const isSelected = selectedChat?.id === chat.id;
          const isChosen = selectedChatIds.includes(chat.id);
          const hasUnread = chat.unreadBy?.includes(user?.uid || '');

          // Custom presence badges corresponding strictly to spec
          let presenceStatus = 'Offline';
          if (isOmni) {
            presenceStatus = 'Online';
          } else if (chat.type === 'direct') {
            const others = chat.members.filter(m => m !== user?.uid && m !== userHandle);
            const otherId = others[0];
            const profile = otherId ? memberProfiles[otherId] : null;
            if (profile && profile.lastSeen) {
              const lastSeenDate = profile.lastSeen.toDate ? profile.lastSeen.toDate() : new Date(profile.lastSeen);
              const isOnline = lastSeenDate && (Date.now() - lastSeenDate.getTime() < 120000); // 2 minutes
              presenceStatus = isOnline ? 'Online' : 'Offline';
            }
          }

          // Ensure visual pinning index is properly styled
          return (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03, ease: 'easeOut' }}
              onClick={() => {
                if (isSelectionMode) {
                  toggleChatSelection(chat.id);
                } else {
                  setSelectedChat(chat);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setIsSelectionMode(true);
                toggleChatSelection(chat.id);
              }}
              className={`group flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all border relative ${
                isChosen
                  ? 'bg-[#DC2626]/10 border-[#DC2626]/30 shadow-inner'
                  : isSelected
                    ? 'bg-white/5 border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.3)]'
                    : isOmni
                      ? 'bg-[#181628]/95 border-red-500/15 shadow-[0_4px_15px_rgba(239,68,68,0.06)] hover:border-red-500/30'
                      : 'bg-transparent border-transparent hover:bg-white/5'
              }`}
            >
              {isSelectionMode && (
                <div className={`w-4 h-4 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${isChosen ? 'bg-[#DC2626] border-[#DC2626]' : 'border-white/20'}`}>
                  {isChosen && <Check size={10} className="text-white font-black" />}
                </div>
              )}

              {/* Avatar picture with precise borders & presence ring indicator */}
              <div className="relative shrink-0 select-none">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center overflow-hidden border transition-all ${
                  isOmni 
                    ? 'bg-zinc-950 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]' 
                    : 'bg-[#DC2626] border-white/10 group-hover:border-white/20'
                }`}>
                  {isOmni ? (
                    <Brain size={20} className="text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)] animate-pulse" />
                  ) : getChatPhoto(chat) ? (
                    <img referrerPolicy="no-referrer" src={getChatPhoto(chat)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-black text-sm uppercase tracking-tighter">
                      {getChatName(chat).charAt(0)}
                    </span>
                  )}
                </div>

                {/* Status Presence Badge details */}
                {!isOmni && (
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-950 ${
                    presenceStatus === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'
                  }`} />
                )}
                {isOmni && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-red-500 border-2 border-zinc-950 animate-ping" />
                )}
              </div>

              {/* Chat details title, timestamp text and badges */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className={`text-xs font-black uppercase tracking-tight truncate whitespace-nowrap group-hover:text-[#DC2626] transition-colors ${isOmni ? 'text-red-400 font-extrabold tracking-wide drop-shadow-[0_0_4px_rgba(239,68,68,0.2)]' : 'text-white'}`}>
                    {getChatName(chat)}
                    {isOmni && (
                      <span className="ml-1.5 text-[6.5px] bg-red-500/10 text-[#DC2626] border border-red-500/20 px-1.5 py-0.5 rounded uppercase font-black tracking-widest select-none font-sans">
                        OMNI
                      </span>
                    )}
                  </h3>
                  <span className="text-[8px] font-bold text-white/25 uppercase tracking-widest whitespace-nowrap ml-2">
                    {chat.updatedAt?.toDate ? chat.updatedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : chat.updatedAt instanceof Date ? chat.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                
                <div className="flex justify-between items-center gap-2">
                  <p className="text-[10px] text-white/40 truncate font-semibold leading-tight flex-1">
                    {chat.lastMessageSender && chat.type === 'group' && (
                      <span className="text-[#DC2626]/70 font-bold mr-1">{chat.lastMessageSender}:</span>
                    )}
                    {chat.lastMessage || 'Open thread to exchange scholarly logs...'}
                  </p>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    {chat.isPinned && <Pin size={9} className="text-[#DC2626] rotate-45 shrink-0" />}
                    {hasUnread && (
                      <div className="min-w-[14px] h-[14px] bg-[#DC2626] rounded-full flex items-center justify-center px-1 text-[7.5px] font-black text-white shrink-0">
                        1
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredChats.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
            <BookOpen className="text-white/10" size={36} />
            <p className="text-[8.5px] font-black uppercase tracking-widest text-[#DC2626]">No Scholarly Logs Found</p>
            <p className="text-[10px] text-white/30 tracking-tight max-w-[200px]">Initiate a direct channel or academic group to verify credentials.</p>
          </div>
        )}
      </div>

      {/* Primary Floating Action Button (FAB) at Bottom Right */}
      <div className="absolute right-6 bottom-6 z-40">
        <button
          onClick={onNewChatTrigger}
          className="w-12 h-12 rounded-full bg-[#6D28D9] border-2 border-transparent hover:border-[#DC2626] hover:bg-[#5B21B6] text-white flex items-center justify-center shadow-lg hover:shadow-red-950/40 active:scale-95 transition-all outline-none"
          title="Initiate academic connection"
        >
          <Plus size={24} className="stroke-[3px]" />
        </button>
      </div>
    </div>
  );
};
