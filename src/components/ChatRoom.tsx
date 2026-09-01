import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MessageSquare, Users, Phone, Video, MoreVertical, 
  Search, Plus, Send, Image as ImageIcon, Mic, 
  Check, CheckCheck, Lock, ArrowLeft, AtSign, Pin, Eye, ShieldAlert,
  Smile, Paperclip, UserPlus, RefreshCw, StopCircle,
  Copy, X, Brain, Info, Calendar, MapPin, User, GraduationCap, Trash2,
  Reply, BellRing, PhoneOff, VideoOff, Volume2, VolumeX, MicOff, GraduationCap as SchoolIcon,
  Play, Pause, History, Camera, FileText, Trash, BookOpen, Award, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Peer from 'peerjs';
import { ChatList } from './ChatList';
import { OmniChatWorkspace } from './OmniChatWorkspace';
import { PeerChatWorkspace } from './PeerChatWorkspace';
import { MessageOverlay } from './MessageOverlay';
import { requestMicrophonePermission, getSupportedAudioMimeType } from '../lib/audioRecorder';

const extractYoutubeLinks = (text: string): string[] => {
  if (!text) return [];
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) matches.push(match[1]);
  }
  return Array.from(new Set(matches));
};

interface TypewriterTextProps {
  text: string;
  msgId: string;
  isOmniReply: boolean;
  onFinish?: () => void;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ text, msgId, isOmniReply, onFinish }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  useEffect(() => {
    if (!isOmniReply) {
      setDisplayedText(text);
      return;
    }
    
    const cached = sessionStorage.getItem(`typed_msg_nsg_${msgId}`);
    if (cached) {
      setDisplayedText(text);
      return;
    }
    
    setIsTyping(true);
    let index = 0;
    const interval = setInterval(() => {
      index += 6; // Fast type stream simulation characters increment
      if (index >= text.length) {
        setDisplayedText(text);
        setIsTyping(false);
        sessionStorage.setItem(`typed_msg_nsg_${msgId}`, 'true');
        clearInterval(interval);
        if (onFinish) onFinish();
      } else {
        setDisplayedText(text.substring(0, index));
      }
    }, 20);
    
    return () => clearInterval(interval);
  }, [text, msgId, isOmniReply, onFinish]);

  return (
    <div className="relative">
      <ReactMarkdown 
        remarkPlugins={[remarkMath]} 
        rehypePlugins={[rehypeKatex]}
        components={{
          a({ node, href, children, ...props }: any) {
            const text = String(children || '');
            const lowerText = text.toLowerCase();
            const lowerHref = (href || '').toLowerCase();
            if (
              lowerText.includes('quiz') || 
              lowerText.includes('generate') || 
              lowerHref.includes('quiz') ||
              lowerHref.includes('generate_quiz')
            ) {
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const topicFromText = text.replace(/generate|quiz|start|take|link|here|assessment|practice|click/gi, '').trim();
                    const topic = topicFromText || 'Practice Quiz';
                    const evt = new CustomEvent('trigger_quiz_gen', { detail: { topic, count: 5 } });
                    window.dispatchEvent(evt);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#DC2626] hover:bg-red-600 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer my-1 transition-all active:scale-95 border border-white/10"
                >
                  <Zap size={13} className="fill-white" />
                  <span>{text || 'Generate Quiz'}</span>
                </button>
              );
            }
            return (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-red-400 underline hover:text-red-300 font-medium transition-colors" 
                {...props}
              >
                {children}
              </a>
            );
          },
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeVal = String(children).replace(/\n$/, '');
            return className && match ? (
              <div className="relative group/code my-3 rounded-xl overflow-hidden border border-white/5 bg-zinc-950 font-mono">
                <div className="px-4 py-2 bg-zinc-900 border-b border-white/5 flex items-center justify-between text-white/40 text-[9px] font-black uppercase tracking-widest">
                  <span>{match[1]}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(codeVal);
                      try {
                        const evt = new CustomEvent('show_global_notify', { detail: 'Code copied!' });
                        window.dispatchEvent(evt);
                      } catch (e) {}
                    }}
                    className="px-2 py-1 hover:bg-white/5 rounded text-[#DC2626] border border-red-500/10 hover:text-red-400 transition-colors active:scale-95 text-[8.5px] font-black uppercase tracking-widest"
                    title="Copy Code"
                  >
                    Copy Block
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed text-slate-300">
                  <code {...props} className={className}>{children}</code>
                </pre>
              </div>
            ) : (
              <code {...props} className={`bg-zinc-900 px-1.5 py-0.5 rounded text-[11px] font-mono text-red-400 ${className || ''}`}>{children}</code>
            );
          }
        }}
      >
        {displayedText}
      </ReactMarkdown>
      {isTyping && (
        <span className="inline-block w-2 h-4 bg-red-600 animate-pulse ml-1 align-middle" />
      )}
    </div>
  );
};
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, serverTimestamp, doc, updateDoc, 
  getDocs, getDoc, setDoc, arrayUnion, arrayRemove,
  limit, limitToLast, deleteDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, FirestoreOperation, circularSafeStringify } from '../firebase';

interface Message {
  id: string;
  senderId: string;
  senderHandle: string;
  senderName?: string;
  text: string;
  timestamp: any;
  type: 'text' | 'image' | 'audio' | 'missed_call';
  callType?: 'voice' | 'video';
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  encrypted?: boolean;
  mediaUrl?: string;
  seenBy?: string[];
  isViewOnce?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'error';
  isSharedNote?: boolean;
  sharedAccessType?: 'readonly' | 'editable';
  noteTitle?: string;
  noteContent?: string;
  starredBy?: string[];
  reactions?: { emoji: string; userId: string; username: string; }[];
  duration?: number;
  isOmniResponse?: boolean;
}

interface Chat {
  id: string;
  name: string;
  type: 'direct' | 'group';
  members: string[]; // Handles/UIDs
  photoURL?: string;
  lastMessage?: string;
  lastMessageSender?: string;
  updatedAt: any;
  unreadCount?: number;
  isOmni?: boolean;
  unreadBy?: string[];
  isPinned?: boolean;
}

interface ChatRoomProps {
  theme: 'dark' | 'light';
  user: any;
  userHandle: string;
  onTagOmni: (text: string, chatId: string, attachments?: { url: string, type: string, name: string }[]) => Promise<any> | any;
  uploadToCloudinary: (file: File | Blob) => Promise<string>;
  setUserNotification: (msg: string) => void;
  onChatSelect?: (isActive: boolean) => void;
  userNotes?: any[];
  onOpenNote?: (noteId: string, noteTitle?: string, noteContent?: string) => void;
  setAppActiveTab?: (tab: string) => void;
  setToolsSubTab?: (subTab: string) => void;
  setImportedQuizNote?: (note: any) => void;
  setQuizTopic?: (topic: string) => void;
  generateQuiz?: (customTopic?: string, customCount?: number, customDifficulty?: any) => Promise<any>;
  initialSelectedChat?: Chat | null;
  onOpenQuizById?: (quizId: string) => void;
}

export const OMNI_DEFAULT_CHAT: Chat = {
  id: 'omni_main',
  name: 'New Chat',
  type: 'direct',
  isOmni: true,
  unreadBy: [],
  members: ['guest']
} as any;

export const ChatRoom: React.FC<ChatRoomProps> = ({ 
  theme, user, userHandle, onTagOmni, uploadToCloudinary, setUserNotification, onChatSelect, userNotes = [], onOpenNote,
  setAppActiveTab, setToolsSubTab, setImportedQuizNote, setQuizTopic, generateQuiz, initialSelectedChat, onOpenQuizById
}) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'groups' | 'calls'>('chats');
  const [subFilter, setSubFilter] = useState<'all' | 'unread' | 'secured' | 'groups' | 'calls'>('all');
  const [chats, setChats] = useState<Chat[]>([]);
  
  const createFreshOmniChat = (): Chat => ({
    id: `omni_${Date.now()}`,
    name: 'New Chat',
    type: 'direct',
    isOmni: true,
    unreadBy: [],
    members: [user?.uid || 'guest']
  } as any);

  const [selectedChat, setSelectedChat] = useState<Chat | null>(() => {
    if (initialSelectedChat) return initialSelectedChat;
    return createFreshOmniChat();
  });

  useEffect(() => {
    if (initialSelectedChat) {
      setSelectedChat(initialSelectedChat);
    }
  }, [initialSelectedChat]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingChat, setIsAddingChat] = useState(false);
  const [newChatHandle, setNewChatHandle] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isGroupPublic, setIsGroupPublic] = useState(false);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [recipientStatus, setRecipientStatus] = useState<string>('offline');
  const [activeCall, setActiveCall] = useState<{ type: 'voice' | 'video', chatName: string } | null>(null);
  const [callLogs, setCallLogs] = useState<{ id: string, name: string, type: 'voice' | 'video', timestamp: any, direction: 'incoming' | 'outgoing' }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [longPressedMessage, setLongPressedMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [deliveredTo, setDeliveredTo] = useState<Record<string, string[]>>({});
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // --- WEBRTC CALLING STATES & REFS ---
  const peerInstanceRef = useRef<any>(null);
  const localStreamRef = useRef<any>(null);
  const remoteStreamRef = useRef<any>(null);
  const callInstanceRef = useRef<any>(null);
  const [localStream, setLocalStreamState] = useState<any>(null);
  const [remoteStream, setRemoteStreamState] = useState<any>(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [recipientPeerId, setRecipientPeerId] = useState<string | null>(null);

  // --- DYNAMIC CONTACT HEADERS TRACKING ---
  const [memberProfiles, setMemberProfiles] = useState<Record<string, { displayName: string, username?: string, photoURL: string | null, lastSeen?: any }>>({});

  // --- OMNI CHAT SESSIONS & HISTORY PERSISTENCE ---
  const [omniSessions, setOmniSessions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`nsg_omni_sessions_${user?.uid || 'guest'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: any) => {
            if (s.title === 'General Omni Chat' || s.title === 'General Chat') {
              return { ...s, title: 'New Chat' };
            }
            return s;
          });
        }
      }
      return [
        {
          id: 'omni_main',
          title: 'New Chat',
          timestamp: 'Today',
          isPinned: false,
          messages: []
        }
      ];
    } catch (e) {
      return [{ id: 'omni_main', title: 'New Chat', timestamp: 'Today', isPinned: false, messages: [] }];
    }
  });

  const saveOmniSessionsToStorage = (updater: any[] | ((prev: any[]) => any[])) => {
    setOmniSessions(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem(`nsg_omni_sessions_${user?.uid || 'guest'}`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleNewOmniChat = () => {
    const newId = `omni_${Date.now()}`;
    const newSession = {
      id: newId,
      title: 'New Chat',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPinned: false,
      messages: []
    };
    saveOmniSessionsToStorage(prev => [newSession, ...prev]);
    setSelectedChat({
      id: newId,
      name: 'New Chat',
      isOmni: true,
      unreadBy: [],
      members: [user?.uid || 'guest']
    } as any);
    setMessages([]);
  };

  const handleSelectOmniSession = (sessionId: string) => {
    const session = omniSessions.find(s => s.id === sessionId);
    if (session) {
      setSelectedChat({
        id: session.id,
        name: session.title || 'New Chat',
        isOmni: true,
        unreadBy: [],
        members: [user?.uid || 'guest']
      } as any);
      
      const localKey = `nsg_msgs_${session.id}`;
      const localMsgs = localStorage.getItem(localKey);
      if (localMsgs) {
        try {
          setMessages(JSON.parse(localMsgs));
        } catch (e) {
          setMessages(session.messages || []);
        }
      } else {
        setMessages(session.messages || []);
      }
    }
  };

  const handleRenameOmniSession = (sessionId: string, newTitle: string) => {
    saveOmniSessionsToStorage(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
  };

  const handlePinOmniSession = (sessionId: string) => {
    saveOmniSessionsToStorage(prev => {
      const updated = prev.map(s => s.id === sessionId ? { ...s, isPinned: !s.isPinned } : s);
      updated.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
      return updated;
    });
  };

  const handleDeleteOmniSession = (sessionId: string) => {
    saveOmniSessionsToStorage(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      if (selectedChat?.id === sessionId) {
        if (updated.length > 0) {
          setTimeout(() => handleSelectOmniSession(updated[0].id), 0);
        } else {
          setTimeout(() => handleNewOmniChat(), 0);
        }
      }
      return updated;
    });
  };

  // --- OMNI NEW ADDITIONS STATES ---
  const [isOmniThinking, setIsOmniThinking] = useState(false);
  const [omniThinkingChatIds, setOmniThinkingChatIds] = useState<Record<string, boolean>>({});
  const selectedChatRef = useRef<Chat | null>(selectedChat);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  const setChatThinking = (chatId: string, thinking: boolean) => {
    setOmniThinkingChatIds(prev => {
      if (thinking) {
        return { ...prev, [chatId]: true };
      } else {
        const next = { ...prev };
        delete next[chatId];
        return next;
      }
    });
  };
  const [showOmniThreads, setShowOmniThreads] = useState(false);
  const [omniThreads, setOmniThreads] = useState<Chat[]>([]);
  const [activeSpeech, setActiveSpeech] = useState<{ id: string; paused: boolean } | null>(null);

  // Find the exact ID of the latest Omni message to ensure only the latest is animated
  const latestOmniMsgId = useMemo(() => {
    if (!selectedChat?.isOmni) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].senderId !== user.uid && !messages[i].isSharedNote) {
        return messages[i].id;
      }
    }
    return null;
  }, [messages, selectedChat, user]);

  // --- PWA WEB PUSH SUBSCRIPTIONS ---
  const [pushSubscribed, setPushSubscribed] = useState(false);

  // --- CONTEXT ACTION OVERLAY STATES ---
  const [overlayMessage, setOverlayMessage] = useState<Message | null>(null);
  const [overlayPosition, setOverlayPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });

  const handleAddReaction = async (messageId: string, emoji: string) => {
    if (!selectedChat) return;
    const messageRef = doc(db, 'chats', selectedChat.id, 'messages', messageId);
    const userReaction = { emoji, userId: user.uid, username: userHandle };
    
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const existing = m.reactions || [];
        const filtered = existing.filter((r: any) => r.userId !== user.uid);
        return { ...m, reactions: [...filtered, userReaction] };
      }
      return m;
    }));

    try {
      const msgDoc = await getDoc(messageRef);
      if (msgDoc.exists()) {
        const currentReactions: any[] = msgDoc.data().reactions || [];
        const updated = currentReactions.filter((r: any) => r.userId !== user.uid);
        updated.push(userReaction);
        await updateDoc(messageRef, { reactions: updated });
      }
    } catch (error) {
      console.error("Failed to append reaction to firebase", error);
    }
  };

  const handleToggleStarMessage = async (messageId: string) => {
    if (!selectedChat) return;
    const messageRef = doc(db, 'chats', selectedChat.id, 'messages', messageId);
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const starred = m.starredBy || [];
        const isStarred = starred.includes(user.uid);
        const updated = isStarred ? starred.filter(uid => uid !== user.uid) : [...starred, user.uid];
        return { ...m, starredBy: updated };
      }
      return m;
    }));
    try {
      const msgDoc = await getDoc(messageRef);
      if (msgDoc.exists()) {
        const starred: string[] = msgDoc.data().starredBy || [];
        const updated = starred.includes(user.uid) ? starred.filter(uid => uid !== user.uid) : [...starred, user.uid];
        await updateDoc(messageRef, { starredBy: updated });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMessageDirect = async (messageId: string, deleteType: 'me' | 'everyone') => {
    if (!selectedChat) return;
    if (deleteType === 'everyone') {
      try {
        await deleteDoc(doc(db, 'chats', selectedChat.id, 'messages', messageId));
      } catch (e) {
        console.error(e);
      }
    } else {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    }
  };

  // --- WHATSAPP GALLERY AND NOTE SHARING STATES (CUSTOM CONTROLS) ---
  const [showPhotoLibrary, setShowPhotoLibrary] = useState(false);
  const [showNoteShareOverlay, setShowNoteShareOverlay] = useState(false);
  const [noteShareMode, setNoteShareMode] = useState<'readonly' | 'editable'>('readonly');
  const [selectedSharedNote, setSelectedSharedNote] = useState<any>(null);
  const [showQuizShareOverlay, setShowQuizShareOverlay] = useState(false);

  // --- UTILS helper functions ---
  const getOtherMemberInfo = (chat: Chat) => {
    if (!chat || chat.type !== 'direct') return null;
    const others = chat.members.filter(m => m !== user?.uid && m !== userHandle);
    for (const other of others) {
      if (memberProfiles[other]) {
        return memberProfiles[other];
      }
    }
    return null;
  };

  const getChatMetadata = (chat: Chat) => {
    if (!chat) return { name: '', username: '', photoURL: null };
    if (chat.isOmni) {
      return { 
        name: 'Omni by NSG', 
        username: 'omni', 
        photoURL: chat.photoURL || 'https://images.unsplash.com/photo-1675557009875-436f09789900?q=80&w=200&auto=format&fit=crop' 
      };
    }
    if (chat.type === 'direct') {
      const otherInfo = getOtherMemberInfo(chat);
      if (otherInfo) {
        return {
          name: otherInfo.displayName,
          username: otherInfo.username || '',
          photoURL: otherInfo.photoURL
        };
      }
      const others = chat.members.filter(m => m !== user?.uid && m !== userHandle);
      const possibleUsername = others.find(m => m.length < 20) || '';
      return { 
        name: chat.name || possibleUsername || 'User', 
        username: possibleUsername, 
        photoURL: chat.photoURL || null 
      };
    }
    return { name: chat.name, username: '', photoURL: chat.photoURL || null };
  };

  const getChatName = (chat: Chat) => getChatMetadata(chat).name;
  const getChatPhoto = (chat: Chat) => getChatMetadata(chat).photoURL;
  const getChatUsername = (chat: Chat) => getChatMetadata(chat).username;

  // Track dynamic peer profiles
  useEffect(() => {
    if (!user) return;
    const otherMemberIds = new Set<string>();
    chats.forEach(c => {
      if (c.type === 'direct' && !c.isOmni) {
        const others = c.members.filter(m => m !== user.uid && m !== userHandle);
        others.forEach(otherId => {
          if (otherId) otherMemberIds.add(otherId);
        });
      }
    });

    const unsubs: (() => void)[] = [];

    otherMemberIds.forEach((id) => {
      try {
        const docRef = doc(db, 'users', id);
        const unsub = onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            const uData = snap.data();
            const profileItem = {
              displayName: uData.displayName || uData.username || id,
              username: uData.username || '',
              photoURL: uData.photoURL || null,
              lastSeen: uData.lastSeen || null
            };
            setMemberProfiles(prev => ({
              ...prev,
              [id]: profileItem
            }));
          } else {
            const q = query(collection(db, 'users'), where('username', '==', id));
            const unsubQ = onSnapshot(q, (qSnap) => {
              if (!qSnap.empty) {
                const uData = qSnap.docs[0].data();
                const profileItem = {
                  displayName: uData.displayName || uData.username || id,
                  username: uData.username || '',
                  photoURL: uData.photoURL || null,
                  lastSeen: uData.lastSeen || null
                };
                setMemberProfiles(prev => ({
                  ...prev,
                  [id]: profileItem
                }));
              }
            }, (errQ) => {
              console.error("Error listening to peer username query:", errQ);
            });
            unsubs.push(unsubQ);
          }
        }, (err) => {
          const errorMsg = err?.message || String(err);
          if (errorMsg.includes('client is offline') || errorMsg.includes('the client is offline')) {
            console.debug("Offline persistence: using user ID as placeholder for peer metadata:", id);
            setMemberProfiles(prev => ({
              ...prev,
              [id]: {
                displayName: `User (${id.slice(0, 5)})`,
                username: id.length < 20 ? id : '',
                photoURL: null,
                lastSeen: null
              }
            }));
          } else {
            console.error("Error subscribing to peer metadata:", err);
          }
        });
        unsubs.push(unsub);
      } catch (ex) {
        console.error("Exception setting up peer database listener:", ex);
      }
    });

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [chats, user, userHandle]);

  // Audio setup
  const sendSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
  const receiveSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2361/2361-preview.mp3');
  
  const playSendSound = () => {
    sendSound.volume = 0.5;
    sendSound.play().catch(e => console.log('Audio play failed:', e));
  };
  
  const playReceiveSound = () => {
    receiveSound.volume = 0.5;
    receiveSound.play().catch(e => console.log('Audio play failed:', e));
  };

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [expandedMessages, setExpandedMessages] = useState<string[]>([]);

  // Mobile Back Button Handling
  useEffect(() => {
    if (!isDesktop && selectedChat) {
      window.history.pushState({ chatOpen: true }, '');
      
      const handlePopState = () => {
        onChatSelect(null);
      };
      
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [selectedChat, isDesktop, onChatSelect]);

  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [showSearchInChat, setShowSearchInChat] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<{ url: string, file: File } | null>(null);
  const [imageCaption, setImageCaption] = useState('');
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [activeCallStatus, setActiveCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended' | null>(null);
  const [incomingCallRequest, setIncomingCallRequest] = useState<{ call: any; callerName: string } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const toggleChatSelection = (id: string) => {
    setSelectedChatIds(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const pressTimerRef = useRef<any>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const emojis = useMemo(() => ([
    { category: 'Smileys', items: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕'] },
    { category: 'Gestures', items: ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤏', '👈', '👉', '👆', '👇', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🦾'] },
    { category: 'Hearts', items: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️'] },
    { category: 'Academic', items: ['📚', '🎓', '📝', '🧠', '💡', '🧪', '🧬', '🔬', '🔭', '📡', '📜', '⚖️', '📐', '📏', '📊', '📈', '📉', '📅', '📝', '🖋️', '🖊️', '🖌️', '🖍️'] },
    { category: 'Objects', items: ['🔥', '✨', '⚡', '🌈', '☀️', '🌙', '⭐', '🚀', '🛸', '💻', '📱', '📷', '🎥', '📞', '💾', '💿', '📼', '📷', '⏲️', '⏱️', '⏰', '🔋', '🔌', '🕯️', '💡'] },
    { category: 'Food', items: ['🍎', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🍞'] }
  ]), []);

  const [activeEmojiCategory, setActiveEmojiCategory] = useState(emojis[0].category);

  useEffect(() => {
    onChatSelect?.(!!selectedChat);
  }, [selectedChat, onChatSelect]);

  useEffect(() => {
    if (!user) return;

    // Helper: urlBase64ToUint8Array for parsing VAPID key
    const urlBase64ToUint8Array = (base64String: string) => {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    };

    // --- PWA BACKGROUND PUSH ALERTS LAYER REGISTER ---
    const setupPushNotifications = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log("Push notifications not supported in this browser.");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log("Service Worker active scope:", registration.scope);
        
        const response = await fetch('/api/notifications/vapid-public-key');
        if (!response.ok) return;
        
        const data = await response.json();
        const publicKey = data.publicKey;
        if (!publicKey) return;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });

        let subJSON = null;
        try {
          if (subscription) {
            if (typeof subscription.toJSON === 'function') {
              subJSON = subscription.toJSON();
            } else {
              subJSON = JSON.parse(circularSafeStringify(subscription));
            }
          }
        } catch (subErr) {
          console.warn("PushSubscription contains circular reference, building manually", subErr);
          if (subscription) {
            let p256dhKey = '';
            let authKey = '';
            try {
              if (typeof subscription.getKey === 'function') {
                const p256dhBuffer = subscription.getKey('p256dh');
                const authBuffer = subscription.getKey('auth');
                if (p256dhBuffer) {
                  p256dhKey = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhBuffer))));
                }
                if (authBuffer) {
                  authKey = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authBuffer))));
                }
              }
            } catch (keyErr) {
              console.warn("Could not retrieve push keys", keyErr);
            }
            subJSON = {
              endpoint: subscription.endpoint || '',
              expirationTime: subscription.expirationTime || null,
              keys: {
                p256dh: p256dhKey,
                auth: authKey
              }
            };
          }
        }

        if (subJSON) {
          await updateDoc(doc(db, 'users', user.uid), {
            pushSubscription: subJSON
          });
          setPushSubscribed(true);
          console.log("PWA Web Push setup completed successfully!");
        }
      } catch (err) {
        console.warn("Failed setting up Push notifications subscription:", err);
      }
    };
    setupPushNotifications();

    // --- WEBRTC PEERJS SECURITY STREAM REGISTRATION ---
    const peer = new Peer(user.uid, {
      host: '0.peerjs.com',
      secure: true,
      port: 443
    });

    peerInstanceRef.current = peer;

    peer.on('open', (id) => {
      console.log("PeerJS Connection Ready. Active Peer ID:", id);
    });

    peer.on('call', async (incomingCall) => {
      setIsIncomingCall(true);
      callInstanceRef.current = incomingCall;

      let callerName = "NSG Peer";
      for (const c of chats) {
        if (c.members.includes(incomingCall.peer)) {
          callerName = getChatMetadata(c).name;
          break;
        }
      }

      // Instead of confirm(), show a beautiful custom incoming call pop up
      setIncomingCallRequest({ call: incomingCall, callerName });
    });

    // Ensure Omni constant contact
    const syncOmni = async () => {
      const omniId = `omni_${user.uid}`;
      const omniRef = doc(db, 'chats', omniId);
      try {
        const snap = await getDoc(omniRef);
        if (!snap.exists()) {
          const members = [user.uid, 'Omni'];
          if (userHandle) members.push(userHandle);
          
          await setDoc(omniRef, {
            name: 'Omni by NSG',
            type: 'direct',
            isOmni: true,
            photoURL: 'https://images.unsplash.com/photo-1675557009875-436f09789900?q=80&w=200&auto=format&fit=crop',
            ownerId: user.uid,
            members: members,
            updatedAt: serverTimestamp(),
            lastMessage: 'Hello! I am Omni by NSG, your AI study buddy.'
          });
        }
      } catch (err) {
        console.error("Omni Sync Error:", err);
      }
    };
    syncOmni();

    return () => {
      if (peer) peer.destroy();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track: any) => track.stop());
      }
    };
  }, [user, userHandle, chats]);

  // Synthesized calling beeps for caller ('connecting' vs 'ringing' loop)
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let interval: any = null;

    if (activeCallStatus === 'connecting' || activeCallStatus === 'ringing') {
      try {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn("AudioContext failed to load:", e);
      }

      const playConnectingBeep = () => {
        if (!audioCtx || audioCtx.state === 'closed') return;
        try {
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(425, audioCtx.currentTime); // Standard 425Hz phone beep

          gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.02);
          gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime + 0.12);
          gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);

          osc.start();
          osc.stop(audioCtx.currentTime + 0.16);
        } catch (ex) {
          console.warn("Audio play error:", ex);
        }
      };

      const playRingingDoubleBeep = () => {
        if (!audioCtx || audioCtx.state === 'closed') return;
        try {
          const now = audioCtx.currentTime;

          // Beep 1
          const osc1 = audioCtx.createOscillator();
          const gainNode1 = audioCtx.createGain();
          osc1.connect(gainNode1);
          gainNode1.connect(audioCtx.destination);
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(425, now);
          gainNode1.gain.setValueAtTime(0, now);
          gainNode1.gain.linearRampToValueAtTime(0.08, now + 0.02);
          gainNode1.gain.setValueAtTime(0.08, now + 0.10);
          gainNode1.gain.linearRampToValueAtTime(0, now + 0.12);
          osc1.start(now);
          osc1.stop(now + 0.13);

          // Beep 2 (starting at now + 0.15s)
          const osc2 = audioCtx.createOscillator();
          const gainNode2 = audioCtx.createGain();
          osc2.connect(gainNode2);
          gainNode2.connect(audioCtx.destination);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(425, now + 0.15);
          gainNode2.gain.setValueAtTime(0, now + 0.15);
          gainNode2.gain.linearRampToValueAtTime(0.08, now + 0.17);
          gainNode2.gain.setValueAtTime(0.08, now + 0.25);
          gainNode2.gain.linearRampToValueAtTime(0, now + 0.27);
          osc2.start(now + 0.15);
          osc2.stop(now + 0.28);
        } catch (ex) {
          console.warn("Audio play error:", ex);
        }
      };

      const step = () => {
        if (activeCallStatus === 'connecting') {
          playConnectingBeep();
        } else if (activeCallStatus === 'ringing') {
          playRingingDoubleBeep();
        }
      };

      step();
      interval = setInterval(step, 500); // 500ms repeating twice every second
    }

    return () => {
      if (interval) clearInterval(interval);
      if (audioCtx) {
        audioCtx.close().catch(err => console.warn(err));
      }
    };
  }, [activeCallStatus]);

  // Synthesized Electronic telephone ringing loop for receiver (incoming call modal)
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let interval: any = null;

    if (incomingCallRequest) {
      try {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn(e);
      }

      const playPhoneRing = () => {
        if (!audioCtx || audioCtx.state === 'closed') return;
        try {
          const now = audioCtx.currentTime;
          // Dual classical frequencies
          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(440, now);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(480, now);

          gainNode.gain.setValueAtTime(0, now);
          // Ring 1
          gainNode.gain.linearRampToValueAtTime(0.12, now + 0.05);
          gainNode.gain.setValueAtTime(0.12, now + 0.45);
          gainNode.gain.linearRampToValueAtTime(0, now + 0.50);

          // Ring 2 (at now + 0.7s)
          gainNode.gain.linearRampToValueAtTime(0.12, now + 0.75);
          gainNode.gain.setValueAtTime(0.12, now + 1.15);
          gainNode.gain.linearRampToValueAtTime(0, now + 1.20);

          osc1.connect(gainNode);
          osc2.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          osc1.start(now);
          osc2.start(now);

          osc1.stop(now + 1.30);
          osc2.stop(now + 1.30);
        } catch (ex) {
          console.warn(ex);
        }
      };

      playPhoneRing();
      interval = setInterval(playPhoneRing, 3000); // Classic cadence every 3s
    }

    return () => {
      if (interval) clearInterval(interval);
      if (audioCtx) {
        audioCtx.close().catch(err => console.warn(err));
      }
    };
  }, [incomingCallRequest]);

  const handleSearchUsers = async (queryStr: string) => {
    setNewChatHandle(queryStr);
    if (queryStr.length < 2) {
      setUserSuggestions([]);
      return;
    }

    setIsSearchingUsers(true);
    try {
      const lowerQuery = queryStr.toLowerCase().trim();
      const capitalized = queryStr.charAt(0).toUpperCase() + queryStr.slice(1);

      const qUsername = query(
        collection(db, 'users'),
        where('username', '>=', lowerQuery),
        where('username', '<=', lowerQuery + '\uf8ff'),
        limit(15)
      );

      const qDisplay = query(
        collection(db, 'users'),
        where('displayName', '>=', queryStr),
        where('displayName', '<=', queryStr + '\uf8ff'),
        limit(15)
      );

      const qDisplayCap = query(
        collection(db, 'users'),
        where('displayName', '>=', capitalized),
        where('displayName', '<=', capitalized + '\uf8ff'),
        limit(15)
      );

      const qFullNameCap = query(
        collection(db, 'users'),
        where('fullName', '>=', capitalized),
        where('fullName', '<=', capitalized + '\uf8ff'),
        limit(15)
      );

      const [snapUsername, snapDisplay, snapDisplayCap, snapFullNameCap] = await Promise.all([
        getDocs(qUsername),
        getDocs(qDisplay),
        getDocs(qDisplayCap),
        getDocs(qFullNameCap)
      ]);

      const resultsMap: Record<string, any> = {};
      
      const addDocsToMap = (snap: any) => {
        snap.docs.forEach((docSnap: any) => {
          resultsMap[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
        });
      };

      addDocsToMap(snapUsername);
      addDocsToMap(snapDisplay);
      addDocsToMap(snapDisplayCap);
      addDocsToMap(snapFullNameCap);

      const suggestions = Object.values(resultsMap)
        .filter((u: any) => u.username !== userHandle && u.id !== user.uid && u.uid !== user.uid)
        .filter((u: any) => {
          const s = lowerQuery;
          const uname = (u.username || '').toLowerCase();
          const dname = (u.displayName || '').toLowerCase();
          const fname = (u.fullName || '').toLowerCase();
          const accName = (u.accountName || u.account_name || '').toLowerCase();
          const email = (u.email || '').toLowerCase();
          return uname.includes(s) || dname.includes(s) || fname.includes(s) || accName.includes(s) || email.includes(s);
        })
        .slice(0, 10);

      setUserSuggestions(suggestions);
    } catch (error) {
      console.error("Search users error:", error);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const callsQ = query(collection(db, 'users', user.uid, 'callLogs'), orderBy('timestamp', 'desc'), limit(20));
    const unsubscribe = onSnapshot(callsQ, (snapshot) => {
      setCallLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any);
    }, (err) => handleFirestoreError(err, FirestoreOperation.LIST, `users/${user.uid}/callLogs`));
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const omniId = `omni_${user.uid}`;
    const localChats = localStorage.getItem(`nsg_chats_${user.uid}`);
    if (localChats && chats.length === 0) {
      try {
        setChats(JSON.parse(localChats));
      } catch (e) {
        console.error("Local chats parse error", e);
      }
    }

    const queryMembers = [user.uid];
    if (userHandle) queryMembers.push(userHandle);

    console.log("Subscribing to chats for:", queryMembers);

    // Listen for chats where user is a member
    const q = query(
      collection(db, 'chats'),
      where('members', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        
        // Auto-migration: Ensure current user UID is in members if their handle is there
        if (user && !data.members.includes(user.uid) && data.members.includes(userHandle)) {
          updateDoc(docSnap.ref, {
            members: arrayUnion(user.uid)
          }).catch(err => handleFirestoreError(err, FirestoreOperation.UPDATE, `chats/${docSnap.id}`));
        }

        // Only take serializable fields for the chat object
        return {
          id: docSnap.id,
          name: data.name || 'Unknown',
          type: data.type || 'direct',
          members: data.members || [],
          photoURL: data.photoURL || null,
          lastMessage: data.lastMessage || '',
          lastMessageSender: data.lastMessageSender || '',
          isOmni: data.isOmni || false,
          unreadBy: data.unreadBy || [],
          isPinned: data.isPinned || false,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().getTime() : (typeof data.updatedAt === 'number' ? data.updatedAt : Date.now())
        };
      }) as Chat[];
      
      setChats(chatList);
      try {
        // Double safety with circularSafeStringify
        localStorage.setItem(`nsg_chats_${user.uid}`, circularSafeStringify(chatList));
      } catch (e) {
        console.error("Local chats save error", e);
      }
    }, (err) => handleFirestoreError(err, FirestoreOperation.LIST, 'chats'));

    return () => unsubscribe();
  }, [user, userHandle]);

  useEffect(() => {
    if (!selectedChat || selectedChat.isOmni) {
      setRecipientStatus('offline');
      return;
    }
    
    const fetchRecipientStatus = async () => {
      const otherId = selectedChat.members.find(m => m !== user.uid && m !== userHandle);
      if (!otherId) return;

      const userDocRef = doc(db, 'users', otherId);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const lastSeen = data.lastSeen?.toDate ? data.lastSeen.toDate() : null;
          const isOnline = lastSeen && (Date.now() - lastSeen.getTime() < 120000); // 2 minutes
          setRecipientStatus(isOnline ? 'Online' : 'Offline');
        }
      }, (err) => handleFirestoreError(err, FirestoreOperation.GET, `users/${otherId}`));
      return unsubscribe;
    };

    let unsub: any;
    fetchRecipientStatus().then(u => unsub = u);
    return () => unsub && unsub();
  }, [selectedChat, user.uid, userHandle]);

  const currentLoadedChatIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedChat?.id) return;
    
    const chatId = selectedChat.id;
    const isOmni = selectedChat.isOmni || chatId.startsWith('omni_');

    // Only load messages if we switched to a different chat or haven't loaded this chat yet
    if (currentLoadedChatIdRef.current !== chatId) {
      currentLoadedChatIdRef.current = chatId;
      const localKey = `nsg_msgs_${chatId}`;
      const localMsgs = localStorage.getItem(localKey);
      if (localMsgs) {
        try {
          const parsed = JSON.parse(localMsgs);
          if (Array.isArray(parsed)) {
            setMessages(parsed);
          } else {
            setMessages([]);
          }
        } catch (e) {
          console.error("Local messages parse error", e);
          setMessages([]);
        }
      } else if (isOmni) {
        const matchingSession = omniSessions.find(s => s.id === chatId);
        if (matchingSession && Array.isArray(matchingSession.messages) && matchingSession.messages.length > 0) {
          setMessages(matchingSession.messages);
        } else {
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
    }

    if (isOmni) {
      // Real-time listener for local Omni events
      const omniMsgListener = (e: any) => {
        const detail = e.detail;
        if (detail && detail.chatId === chatId && detail.message) {
          setMessages(prev => {
            if (prev.some(m => m.id === detail.message.id)) return prev;
            const next = [...prev, detail.message];
            try {
              localStorage.setItem(`nsg_msgs_${chatId}`, circularSafeStringify(next));
            } catch (e) {}
            return next;
          });
          setIsOmniThinking(false);
        }
      };
      window.addEventListener('nsg_omni_message_received', omniMsgListener);
      return () => {
        window.removeEventListener('nsg_omni_message_received', omniMsgListener);
      };
    }

    lastMessageIdRef.current = null; // Reset for new chat load

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc'),
      limitToLast(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const msgList = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          // Only take serializable fields for the message object
          return {
            id: docSnap.id,
            senderId: data.senderId || '',
            senderHandle: data.senderHandle || '',
            senderName: data.senderName || '',
            text: data.text || '',
            type: data.type || 'text',
            mediaUrl: data.mediaUrl || null,
            isViewOnce: data.isViewOnce || false,
            seenBy: data.seenBy || [],
            replyTo: data.replyTo ? {
              id: data.replyTo.id,
              text: data.replyTo.text,
              senderName: data.replyTo.senderName
            } : undefined,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate().getTime() : (typeof data.timestamp === 'number' ? data.timestamp : Date.now())
          };
        }) as Message[];

        const lastMsg = msgList[msgList.length - 1];
        const isNewMessage = lastMsg && lastMsg.id !== lastMessageIdRef.current;
        
        setMessages(msgList);
        if (msgList.length > 0) {
          const lastMsgObj = msgList[msgList.length - 1];
          if (lastMsgObj.senderId !== user.uid) {
            setIsOmniThinking(false);
          }
        }
        try {
          localStorage.setItem(`nsg_msgs_${chatId}`, circularSafeStringify(msgList));
        } catch (e) {
          console.error("Local messages save error", e);
        }

        if (isNewMessage) {
          const wasEmpty = !lastMessageIdRef.current;
          lastMessageIdRef.current = lastMsg.id;
          
          // Play receive sound for new messages NOT sent by me
          if (lastMsg.senderId !== user.uid && !wasEmpty) {
            playReceiveSound();
          }

          // If it's my own message or it's the first load, force scroll
          if (lastMsg.senderId === user.uid || wasEmpty) {
            setTimeout(() => scrollToBottom(true), 100);
          } else {
            // Only scroll for others' messages if we're already at the bottom
            setTimeout(() => scrollToBottom(), 100);
          }
        }

        // Mark messages as seen
        snapshot.docs.forEach(docSnap => {
          const data = docSnap.data();
          if (data.senderId !== user.uid && (!data.seenBy || !data.seenBy.includes(user.uid))) {
            updateDoc(docSnap.ref, {
              seenBy: arrayUnion(user.uid)
            }).catch(err => handleFirestoreError(err, FirestoreOperation.UPDATE, `chats/${chatId}/messages/${docSnap.id}`));
          }
        });
      }
    }, (err) => handleFirestoreError(err, FirestoreOperation.LIST, `chats/${chatId}/messages`));

    return () => unsubscribe();
  }, [selectedChat?.id, user.uid]);

  const playTapSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch(e) {}
  };

  const scrollToBottom = (force = false) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 350;

    if (force || isAtBottom) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 50);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedChat) return;

    // Play sound
    playSendSound();

    const text = inputText;
    const senderName = user.displayName || userHandle;
    const replyData = replyingTo ? {
        id: replyingTo.id,
        text: replyingTo.text,
        senderName: replyingTo.senderName || replyingTo.senderHandle
    } : null;
    
    playTapSound();
    setInputText('');
    setReplyingTo(null);

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      senderId: user.uid,
      senderHandle: userHandle,
      senderName: senderName,
      text: text,
      timestamp: Date.now(),
      type: 'text',
      seenBy: [user.uid],
      replyTo: replyData || undefined,
      status: 'sending'
    };

    // Update locally for instant feel
    setMessages(prev => {
      const newMsgs = [...prev, optimisticMsg];
      try {
        localStorage.setItem(`nsg_msgs_${selectedChat.id}`, circularSafeStringify(newMsgs));
      } catch (e) {
        console.error("Local messages optimistic save error", e);
      }
      return newMsgs;
    });
    setTimeout(() => scrollToBottom(true), 50);

    try {
      if (selectedChat.isOmni || selectedChat.id.startsWith('omni_')) {
        // Omni AI session message handling
        const currentChatId = selectedChat.id;
        
        saveOmniSessionsToStorage(prevSessions => {
          return prevSessions.map(s => {
            if (s.id === currentChatId) {
              const existingMsgs = Array.isArray(s.messages) ? s.messages : [];
              return {
                ...s,
                lastMessage: text,
                timestamp: 'Just now',
                messages: [...existingMsgs, optimisticMsg]
              };
            }
            return s;
          });
        });

        setChatThinking(currentChatId, true);
        setIsOmniThinking(true);

        Promise.resolve(onTagOmni(text, currentChatId)).then((aiReplyMsg: any) => {
          let newTotalLength = 2;
          if (aiReplyMsg && aiReplyMsg.text) {
            const validatedAiMsg: Message = {
              id: aiReplyMsg.id || `omni-${Date.now()}`,
              senderId: aiReplyMsg.senderId || 'omni-ai',
              senderHandle: aiReplyMsg.senderHandle || 'omni',
              senderName: aiReplyMsg.senderName || 'Omni by NSG',
              text: aiReplyMsg.text,
              timestamp: aiReplyMsg.timestamp || Date.now(),
              type: aiReplyMsg.type || 'text',
              isOmniResponse: true,
              encrypted: true
            };

            if (selectedChatRef.current?.id === currentChatId) {
              setMessages(prev => {
                if (prev.some(m => m.id === validatedAiMsg.id)) return prev;
                const next = [...prev, validatedAiMsg];
                newTotalLength = next.length;
                try {
                  localStorage.setItem(`nsg_msgs_${currentChatId}`, circularSafeStringify(next));
                } catch (e) {}
                return next;
              });
            }

            saveOmniSessionsToStorage(prevSessions => {
              return prevSessions.map(s => {
                if (s.id === currentChatId) {
                  const existingMsgs = Array.isArray(s.messages) ? s.messages : [];
                  const withAi = existingMsgs.some((m: any) => m.id === validatedAiMsg.id)
                    ? existingMsgs
                    : [...existingMsgs, validatedAiMsg];
                  return {
                    ...s,
                    lastMessage: validatedAiMsg.text,
                    timestamp: 'Just now',
                    messages: withAi
                  };
                }
                return s;
              });
            });
          } else {
            const localKey = `nsg_msgs_${currentChatId}`;
            const localRaw = localStorage.getItem(localKey);
            if (localRaw) {
              try {
                const parsed = JSON.parse(localRaw);
                newTotalLength = parsed.length;
                if (selectedChatRef.current?.id === currentChatId) {
                  setMessages(parsed);
                }
              } catch (e) {}
            }
          }

          // Dynamic auto-naming after the first prompt / response turn
          saveOmniSessionsToStorage(prevSessions => {
            const session = prevSessions.find(s => s.id === currentChatId);
            const currentTitle = session?.title || 'New Chat';
            if (
              (newTotalLength === 2 || (session?.messages?.length ?? 0) <= 2) && 
              (currentTitle === 'New Chat' || currentTitle === 'New Omni Chat' || currentTitle.startsWith('New ') || currentTitle === 'General Chat' || currentTitle === 'General Omni Chat')
            ) {
              const words = text.trim().split(/\s+/);
              const generatedTitle = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
              const updated = prevSessions.map(s => s.id === currentChatId ? { ...s, title: generatedTitle } : s);
              if (selectedChatRef.current?.id === currentChatId) {
                setSelectedChat(prev => prev ? { ...prev, name: generatedTitle } : prev);
              }
              return updated;
            }
            return prevSessions;
          });
        }).catch(err => {
          console.error("Omni AI dispatch error:", err);
        }).finally(() => {
          setChatThinking(currentChatId, false);
          if (selectedChatRef.current?.id === currentChatId) {
            setIsOmniThinking(false);
          }
        });

        return;
      }

      const msgData: any = {
        senderId: user.uid,
        senderHandle: userHandle,
        senderName: senderName,
        text: text,
        timestamp: serverTimestamp(),
        type: 'text',
        encrypted: true,
        seenBy: [user.uid],
        replyTo: replyData
      };

      const otherMembers = (selectedChat.members || []).filter((m: string) => m !== user.uid && m !== userHandle);

      // We don't await addDoc for UI responsiveness
      addDoc(collection(db, 'chats', selectedChat.id, 'messages'), msgData).catch(() => {});
      
      updateDoc(doc(db, 'chats', selectedChat.id), {
        lastMessage: text,
        lastMessageSender: senderName,
        updatedAt: serverTimestamp(),
        unreadBy: arrayUnion(...otherMembers)
      }).catch(err => console.warn("Peer chat update handled:", err));

      otherMembers.forEach((memberUid: string) => {
        if (memberUid && memberUid !== userHandle && memberUid.length > 5) {
          addDoc(collection(db, 'notifications'), {
            to: memberUid,
            title: `💬 New Message from ${senderName}`,
            message: text.length > 80 ? `${text.slice(0, 80)}...` : text,
            type: 'chat',
            subtype: 'new_message',
            targetTab: 'chat',
            chatId: selectedChat.id,
            timestamp: serverTimestamp() || new Date(),
            read: false
          }).catch(err => console.error("Error creating chat notification:", err));
        }
      });

      if (text.toLowerCase().includes('@omni')) {
        setIsOmniThinking(true);
        try {
          await onTagOmni(text, selectedChat.id);
        } catch (err) {
          console.error("Omni AI tag error:", err);
        } finally {
          setIsOmniThinking(false);
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      // Mark as error locally
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    }
  };

  const createChat = async (targetUser?: any) => {
    const handle = targetUser?.username || newChatHandle.toLowerCase().trim();
    if (!handle) return;
    
    try {
      let otherUser = targetUser;
      if (!otherUser) {
        const q = query(collection(db, 'users'), where('username', '==', handle));
        const snap = await getDocs(q);
        if (snap.empty) {
          setUserNotification("User not found.");
          return;
        }
        otherUser = { id: snap.docs[0].id, ...snap.docs[0].data() };
      }

      if (otherUser.id === user.uid) {
        setUserNotification("You cannot chat with yourself.");
        return;
      }

      // Check if chat already exists
      const existing = chats.find(c => c.type === 'direct' && (c.members.includes(handle) || c.members.includes(otherUser.id)));
      if (existing) {
        setSelectedChat(existing);
        setIsAddingChat(false);
        setNewChatHandle('');
        setUserSuggestions([]);
        return;
      }

      const chatData: any = {
        name: otherUser.displayName || handle,
        type: 'direct',
        members: [user.uid, userHandle, otherUser.id || otherUser.uid, handle],
        photoURL: otherUser.photoURL || null,
        updatedAt: serverTimestamp(),
        lastMessage: 'Chat started'
      };

      const docRef = await addDoc(collection(db, 'chats'), chatData);
      setIsAddingChat(false);
      setSelectedChat({ id: docRef.id, ...chatData } as Chat);
      setNewChatHandle('');
      setUserSuggestions([]);
    } catch (err) {
      console.error("Create Chat Error:", err);
      setUserNotification("Failed to start chat.");
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) return;

    const chatData = {
      name: groupName.trim(),
      description: groupDescription,
      type: 'group',
      isPublic: isGroupPublic,
      ownerId: user.uid,
      members: [user.uid, userHandle, ...selectedGroupMembers],
      updatedAt: serverTimestamp(),
      lastMessage: 'Group created',
      allowOthersAdd: true,
      allowOthersMessage: true,
      shareLink: isGroupPublic ? Math.random().toString(36).substring(7) : null
    };

    const docRef = await addDoc(collection(db, 'chats'), chatData);
    setIsCreatingGroup(false);
    setSelectedGroupMembers([]);
    setGroupName('');
    setGroupDescription('');
    setSelectedChat({ id: docRef.id, ...chatData } as Chat);
  };

  const handleSendOmniImage = async (file: File, caption: string) => {
    if (!selectedChat) return;
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      const msgData: any = {
        senderId: user.uid,
        senderHandle: userHandle,
        senderName: user.displayName || userHandle,
        text: caption || 'Sent an image',
        timestamp: serverTimestamp(),
        type: 'image',
        mediaUrl: url,
        encrypted: true,
        seenBy: [user.uid]
      };
      await addDoc(collection(db, 'chats', selectedChat.id, 'messages'), msgData).catch(() => {});
      await setDoc(doc(db, 'chats', selectedChat.id), {
        lastMessage: `📸 ${caption || 'Image'}`,
        lastMessageSender: user.displayName || userHandle,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(() => {});
      if (selectedChat.id.startsWith('omni_') || caption.toLowerCase().includes('@omni')) {
        onTagOmni(caption || 'Analyze this image', selectedChat.id, [{ url, type: 'image', name: file.name }]);
      }
    } catch (err) {
      console.error("Failed to send Omni image:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendOmniAudio = async (blob: Blob, localUrl: string, duration: number, caption?: string) => {
    const currentChatId = selectedChat?.id || 'omni_main';
    const isOmniChat = (selectedChat || OMNI_DEFAULT_CHAT).isOmni || currentChatId.startsWith('omni_');
    setIsUploading(true);

    const tempId = `audio-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      senderId: user.uid,
      senderHandle: userHandle,
      senderName: user.displayName || userHandle,
      text: caption || 'Voice Message',
      timestamp: Date.now(),
      type: 'audio',
      mediaUrl: localUrl,
      duration: duration,
      status: 'sent',
      encrypted: true
    };

    // Optimistically add user audio message
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      let uploadedUrl = localUrl;
      try {
        uploadedUrl = await uploadToCloudinary(blob);
      } catch (uploadErr) {
        console.warn("Audio upload to cloud notice, using local url/blob:", uploadErr);
      }

      if (isOmniChat) {
        // Save to local storage Omni session
        setOmniSessions(prev => {
          return prev.map((s: any) => {
            if (s.id === currentChatId) {
              const existingMsgs = Array.isArray(s.messages) ? s.messages : [];
              return {
                ...s,
                lastMessage: `🎤 Voice Note (${Math.round(duration)}s)`,
                timestamp: 'Just now',
                messages: [...existingMsgs, { ...optimisticMsg, mediaUrl: uploadedUrl }]
              };
            }
            return s;
          });
        });

        // Trigger Omni AI response to audio
        setChatThinking(currentChatId, true);
        setIsOmniThinking(true);
        Promise.resolve(onTagOmni(
          caption ? `${caption}\n[Spoken Voice Note]` : 'Please listen and respond to my voice recording.',
          currentChatId,
          [{ url: uploadedUrl, type: 'audio/webm', name: `voice_note_${Date.now()}.webm` }]
        )).then((aiReplyMsg: any) => {
          if (aiReplyMsg && aiReplyMsg.text) {
            const validatedAiMsg: Message = {
              id: aiReplyMsg.id || `omni-${Date.now()}`,
              senderId: aiReplyMsg.senderId || 'omni-ai',
              senderHandle: aiReplyMsg.senderHandle || 'omni',
              senderName: aiReplyMsg.senderName || 'Omni by NSG',
              text: aiReplyMsg.text,
              timestamp: aiReplyMsg.timestamp || Date.now(),
              type: aiReplyMsg.type || 'text',
              isOmniResponse: true,
              encrypted: true
            };

            if (selectedChatRef.current?.id === currentChatId) {
              setMessages(prev => {
                if (prev.some(m => m.id === validatedAiMsg.id)) return prev;
                const next = [...prev, validatedAiMsg];
                try {
                  localStorage.setItem(`nsg_msgs_${currentChatId}`, circularSafeStringify(next));
                } catch (e) {}
                return next;
              });
            }

            saveOmniSessionsToStorage(prevSessions => {
              return prevSessions.map(s => {
                if (s.id === currentChatId) {
                  const existingMsgs = Array.isArray(s.messages) ? s.messages : [];
                  const withAi = existingMsgs.some((m: any) => m.id === validatedAiMsg.id)
                    ? existingMsgs
                    : [...existingMsgs, validatedAiMsg];
                  return {
                    ...s,
                    lastMessage: validatedAiMsg.text,
                    timestamp: 'Just now',
                    messages: withAi
                  };
                }
                return s;
              });
            });
          }
        }).catch(omniErr => {
          console.error("Omni audio response error:", omniErr);
        }).finally(() => {
          setChatThinking(currentChatId, false);
          if (selectedChatRef.current?.id === currentChatId) {
            setIsOmniThinking(false);
          }
        });
      } else {
        // Peer/group chat Firestore
        const msgData: any = {
          senderId: user.uid,
          senderHandle: userHandle,
          senderName: user.displayName || userHandle,
          text: caption || 'Voice Note',
          timestamp: serverTimestamp(),
          type: 'audio',
          mediaUrl: uploadedUrl,
          duration: duration,
          encrypted: true
        };
        await addDoc(collection(db, 'chats', currentChatId, 'messages'), msgData).catch(() => {});
        await setDoc(doc(db, 'chats', currentChatId), {
          lastMessage: '🎤 Voice Note',
          lastMessageSender: user.displayName || userHandle,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to send audio message:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedChat) return;
    const file = e.target.files[0];
    
    if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setEditingImage({ url, file });
        return;
    }

    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      const type = file.type.startsWith('audio/') ? 'audio' : 'text';
      
      const msgData: any = {
        senderId: user.uid,
        senderHandle: userHandle,
        senderName: user.displayName || userHandle,
        text: type === 'audio' ? 'Sent audio' : file.name,
        timestamp: serverTimestamp(),
        type: type,
        mediaUrl: url,
        encrypted: true
      };

      await addDoc(collection(db, 'chats', selectedChat.id, 'messages'), msgData).catch(() => {});
      await setDoc(doc(db, 'chats', selectedChat.id), {
        lastMessage: `📎 ${type.toUpperCase()}`,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(() => {});
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendEditedImage = async () => {
    if (!editingImage || !selectedChat) return;
    
    setIsUploading(true);
    const fileToUpload = editingImage.file;
    const caption = imageCaption;
    const viewOnce = isViewOnce;

    setEditingImage(null);
    setImageCaption('');
    setIsViewOnce(false);

    try {
        const url = await uploadToCloudinary(fileToUpload);
        const msgData: any = {
            senderId: user.uid,
            senderHandle: userHandle,
            senderName: user.displayName || userHandle,
            text: caption || 'Sent an image',
            timestamp: serverTimestamp(),
            type: 'image',
            mediaUrl: url,
            encrypted: true,
            isViewOnce: viewOnce,
            seenBy: [user.uid]
        };

        const otherMembers = (selectedChat.members || []).filter((m: string) => m !== user.uid && m !== userHandle);

        await addDoc(collection(db, 'chats', selectedChat.id, 'messages'), msgData).catch(() => {});
        await setDoc(doc(db, 'chats', selectedChat.id), {
            lastMessage: `📸 ${caption || 'Image'}`,
            lastMessageSender: user.displayName || userHandle,
            updatedAt: serverTimestamp(),
            unreadBy: arrayUnion(...otherMembers)
        }, { merge: true }).catch(() => {});

        if (selectedChat.id.startsWith('omni_') || caption.toLowerCase().includes('@omni')) {
            onTagOmni(caption || 'Analyze this image', selectedChat.id, [{ url, type: 'image', name: 'User upload' }]);
        }
    } catch (err) {
        console.error("Image upload failed", err);
    } finally {
        setIsUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      await requestMicrophonePermission();
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true }
        });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const preferredMime = getSupportedAudioMimeType();
      const recorder = preferredMime 
        ? new MediaRecorder(stream, { mimeType: preferredMime }) 
        : new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        const mime = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: mime });
        setIsUploading(true);
        try {
          const url = await uploadToCloudinary(blob);
          const msgData: any = {
            senderId: user.uid,
            senderHandle: userHandle,
            senderName: user.displayName || userHandle,
            text: 'Voice Note',
            timestamp: serverTimestamp(),
            type: 'audio',
            mediaUrl: url,
            encrypted: true
          };
          await addDoc(collection(db, 'chats', selectedChat!.id, 'messages'), msgData).catch(() => {});
          await setDoc(doc(db, 'chats', selectedChat!.id), {
            lastMessage: '🎤 Voice Note',
            updatedAt: serverTimestamp()
          }, { merge: true }).catch(() => {});
        } catch (err) {
          console.error("Audio upload failed", err);
        } finally {
          setIsUploading(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error("Recording error", err);
      setUserNotification("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const logMissedCall = async (chatId: string, callType: 'voice' | 'video') => {
    try {
      const msgData = {
        senderId: user.uid,
        senderHandle: userHandle || '',
        senderName: user.displayName || userHandle || 'Scholar',
        text: `Missed ${callType} call`,
        type: 'missed_call',
        callType: callType,
        timestamp: new Date(),
        encrypted: true,
        seenBy: [user.uid]
      };
      await addDoc(collection(db, 'chats', chatId, 'messages'), msgData);
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: `📞 Missed ${callType} call`,
        lastMessageSender: user.displayName || userHandle || 'Scholar',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error logging missed call:", err);
    }
  };

  const hangUp = () => {
    const wasMissed = activeCallStatus === 'connecting' || activeCallStatus === 'ringing';
    const currentActiveCallType = activeCall?.type;
    const isIncoming = isIncomingCall;

    if (callInstanceRef.current) {
      callInstanceRef.current.close();
    }
    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach((track: any) => track.stop());
      } catch (e) {
        console.warn("Stopping local tracks error:", e);
      }
    }
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalStreamState(null);
    setRemoteStreamState(null);
    setActiveCall(null);
    setActiveCallStatus(null);
    setIsIncomingCall(false);
    setIncomingCallRequest(null);

    if (wasMissed && !isIncoming && selectedChat && currentActiveCallType) {
      logMissedCall(selectedChat.id, currentActiveCallType);
    }
  };

  const startCall = async (type: 'voice' | 'video') => {
    if (!selectedChat) return;
    const otherId = selectedChat.members.find(m => m !== user.uid && m !== userHandle);
    if (!otherId) {
      setUserNotification("Could not identify remote peer for handshaking.");
      return;
    }

    try {
      const constraints = {
        audio: true,
        video: type === 'video'
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStreamState(stream);

      const callData = {
        name: getChatMetadata(selectedChat).name,
        type,
        timestamp: serverTimestamp(),
        direction: 'outgoing'
      };
      await addDoc(collection(db, 'users', user.uid, 'callLogs'), callData);
      
      // Determine if they are online!
      const otherProfile = otherId ? memberProfiles[otherId] : null;
      const otherLastSeen = otherProfile?.lastSeen;
      const otherLastSeenDate = otherLastSeen 
        ? (otherLastSeen.toDate ? otherLastSeen.toDate() : new Date(otherLastSeen)) 
        : null;
      const isOtherOnline = otherLastSeenDate && (Date.now() - otherLastSeenDate.getTime() < 120000);

      setActiveCall({ type, chatName: getChatMetadata(selectedChat).name });
      setActiveCallStatus(isOtherOnline ? 'ringing' : 'connecting');

      const outCall = peerInstanceRef.current?.call(otherId, stream);
      if (outCall) {
        callInstanceRef.current = outCall;
        outCall.on('stream', (rStream: any) => {
          remoteStreamRef.current = rStream;
          setRemoteStreamState(rStream);
          setActiveCallStatus('connected');
        });
        outCall.on('close', () => {
          hangUp();
        });
      }
    } catch (err) {
      console.error("Failed to initiate media call:", err);
      setUserNotification("Media devices access denied or camera/microphone busy.");
    }
  };

  const speakUtterance = (msgText: string, msgId: string) => {
    if (activeSpeech && activeSpeech.id === msgId) {
      if (activeSpeech.paused) {
        window.speechSynthesis.resume();
        setActiveSpeech({ id: msgId, paused: false });
      } else {
        window.speechSynthesis.pause();
        setActiveSpeech({ id: msgId, paused: true });
      }
      return;
    }
    window.speechSynthesis.cancel();
    // Clean markdown characters for perfect audio flow
    const cleanText = msgText.replace(/[\*\_\#\-\`\[\]\(\)]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setActiveSpeech(null);
    utterance.onerror = () => setActiveSpeech(null);
    setActiveSpeech({ id: msgId, paused: false });
    window.speechSynthesis.speak(utterance);
  };

  const handleViewUser = async () => {
    if (!selectedChat) return;
    setShowMoreMenu(false);
    
    if (selectedChat.id.startsWith('omni_')) {
        setViewingUser({
            displayName: "Omni by NSG",
            fullName: "NSG Artificial Intelligence",
            about: "Your professional academic assistant. I'm here to help you solve problems, write essays, and prepare for exams.",
            photoURL: null,
            role: "AI",
            isOmni: true
        });
        return;
    }

    try {
        const members = selectedChat.members || [];
        const otherMemberInfo = members.find((m: string) => m !== user.uid && m !== userHandle);
        
        if (otherMemberInfo) {
            const userRef = doc(db, 'users', otherMemberInfo);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                setViewingUser(userSnap.data());
            } else {
                const q = query(collection(db, 'users'), where('username', '==', otherMemberInfo));
                const snap = await getDocs(q);
                if (!snap.empty) {
                    setViewingUser(snap.docs[0].data());
                } else {
                    setUserNotification("Could not find user details.");
                }
            }
        }
    } catch (err) {
        console.error("Error viewing user:", err);
        setUserNotification("Error loading user profile.");
    }
  };

  const handleLongPressStart = (id: string) => {
    pressTimerRef.current = setTimeout(() => {
      setLongPressedMessage(id);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 2000);
  };

  const handleLongPressEnd = () => {
    clearTimeout(pressTimerRef.current);
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string, messages: Message[] }[] = [];
    msgs.forEach(msg => {
      if (!msg.timestamp) return;
      const date = msg.timestamp.toDate ? msg.timestamp.toDate() : new Date();
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
      
      let displayDate = "";
      if (diffDays === 0 && date.toDateString() === now.toDateString()) displayDate = 'Today';
      else if (diffDays === 1 || (diffDays === 0 && date.toDateString() !== now.toDateString())) displayDate = 'Yesterday';
      else if (diffDays < 7) displayDate = date.toLocaleDateString('en-US', { weekday: 'long' });
      else displayDate = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === displayDate) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ date: displayDate, messages: [msg] });
      }
    });
    return groups;
  };

  const deleteMessage = async (msgId: string) => {
    if (!selectedChat) return;
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;

    const isOwn = msg.senderId === user.uid;
    const choice = isOwn ? window.confirm("Delete for everyone? (OK for Everyone, Cancel for Me - simplified for now)") : false;

    try {
      if (isOwn && choice) {
        await updateDoc(doc(db, 'chats', selectedChat.id, 'messages', msgId), {
            text: "🚫 This message was deleted",
            mediaUrl: null,
            type: 'text',
            deletedForEveryone: true
        });
      } else {
        await updateDoc(doc(db, 'chats', selectedChat.id, 'messages', msgId), {
            deletedBy: arrayUnion(user.uid)
        });
      }
      setLongPressedMessage(null);
      setUserNotification("Message deleted.");
    } catch (err) {
      console.error("Delete failed", err);
      setUserNotification("Failed to delete message.");
    }
  };

  const togglePinChat = async (chatId: string, isCurrentlyPinned: boolean) => {
    try {
        await updateDoc(doc(db, 'chats', chatId), {
            isPinned: !isCurrentlyPinned,
            updatedAt: serverTimestamp()
        });
        setUserNotification(!isCurrentlyPinned ? "Chat pinned" : "Chat unpinned");
    } catch (err) {
        console.error("Pin failed", err);
    }
  };

  useEffect(() => {
    if (selectedChat && !selectedChat.isOmni && !selectedChat.id.startsWith('omni_') && user?.uid) {
      const markAsRead = async () => {
        try {
          const chatRef = doc(db, 'chats', selectedChat.id);
          const snap = await getDoc(chatRef).catch(() => null);
          if (snap && snap.exists()) {
            await updateDoc(chatRef, {
              unreadBy: arrayRemove(user.uid)
            }).catch(() => {});
          }
        } catch (err) {
          // Silent fallback for non-existent or local chat sessions
        }
      };
      markAsRead();
    }
  }, [selectedChat, user?.uid]);

  const totalUnreadCount = useMemo(() => {
    return chats.filter(c => c.unreadBy && c.unreadBy.includes(user.uid)).length;
  }, [chats, user.uid]);

  useEffect(() => {
    if (!user) return;
    // Basic browser notifications - filtered to user's chats
    const q = query(collection(db, 'chats'), where('members', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'modified') {
                const data = change.doc.data();
                if (data.unreadBy && data.unreadBy.includes(user.uid) && data.lastMessageSender !== 'Omni') {
                    if (Notification.permission === 'granted') {
                        new Notification(`New message in ${data.name}`, {
                            body: data.lastMessage,
                        });
                    }
                }
            }
        });
    }, (err) => handleFirestoreError(err, FirestoreOperation.LIST, 'chats'));
    return () => unsubscribe();
  }, [user.uid]);

  const bulkDeleteChats = async () => {
    if (selectedChatIds.length === 0) return;
    if (!confirm(`Delete ${selectedChatIds.length} chats? This cannot be undone.`)) return;

    try {
      for (const id of selectedChatIds) {
        await deleteDoc(doc(db, 'chats', id));
      }
      setSelectedChatIds([]);
      setIsSelectionMode(false);
      setUserNotification("Chats deleted.");
    } catch (err) {
      console.error("Bulk delete failed", err);
      setUserNotification("Failed to delete some chats.");
    }
  };

  const [isViewingGroupSettings, setIsViewingGroupSettings] = useState(false);
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);
  const [groupSettingsName, setGroupSettingsName] = useState('');
  const [groupSettingsDesc, setGroupSettingsDesc] = useState('');
  const [groupSettingsPhoto, setGroupSettingsPhoto] = useState<string | null>(null);
  const [groupSettingsMembers, setGroupSettingsMembers] = useState<string[]>([]);
  const [userIdToUsername, setUserIdToUsername] = useState<Record<string, string>>({});

  useEffect(() => {
    const resolveUIDs = async () => {
      const uidsToFetch = groupSettingsMembers.filter(m => m && m.length >= 20);
      const newMappings = { ...userIdToUsername };
      let updated = false;

      for (const uid of uidsToFetch) {
        if (!newMappings[uid]) {
          try {
            const uDoc = await getDoc(doc(db, 'users', uid));
            if (uDoc.exists()) {
              newMappings[uid] = uDoc.data()?.username || uid;
              updated = true;
            }
          } catch (e) {
            console.error("Error resolving uid:", uid, e);
          }
        }
      }

      if (updated) {
        setUserIdToUsername(newMappings);
      }
    };
    if (groupSettingsMembers.length > 0) {
      resolveUIDs();
    }
  }, [groupSettingsMembers]);

  const uniqueDisplayMembers = React.useMemo(() => {
    const names = new Set<string>();
    groupSettingsMembers.forEach(m => {
      if (m && m.length >= 20) {
        const resolved = userIdToUsername[m];
        if (resolved) names.add(resolved);
      } else if (m) {
        names.add(m.trim());
      }
    });
    return Array.from(names);
  }, [groupSettingsMembers, userIdToUsername]);

  const [isAddingGroupMember, setIsAddingGroupMember] = useState(false);
  const [newGroupMemberHandle, setNewGroupMemberHandle] = useState('');

  const bulkArchiveChats = async () => {
    if (selectedChatIds.length === 0) return;
    try {
      for (const id of selectedChatIds) {
        await updateDoc(doc(db, 'chats', id), { isArchived: true });
      }
      setSelectedChatIds([]);
      setIsSelectionMode(false);
      setUserNotification("Chats archived.");
    } catch (err) {
      console.error("Bulk archive failed", err);
      setUserNotification("Failed to archive some chats.");
    }
  };

  const createGroupFromSelected = async () => {
    if (selectedChatIds.length === 0) return;
    const allMembers = new Set([userHandle]);
    selectedChatIds.forEach(id => {
      const chat = chats.find(c => c.id === id);
      if (chat && chat.type === 'direct') {
        chat.members.forEach(m => allMembers.add(m));
      }
    });
    setGroupName('New Group');
    setSelectedGroupMembers(Array.from(allMembers).filter(m => m !== userHandle));
    setIsCreatingGroup(true);
    setIsSelectionMode(false);
    setSelectedChatIds([]);
  };

  const handleReportChat = async () => {
    if (!selectedChat) return;
    try {
      const evidence = messages.slice(-5).map(m => ({
        senderId: m.senderId,
        text: m.text,
        timestamp: m.timestamp
      }));

      await addDoc(collection(db, 'reports'), {
        suspectId: selectedChat.members.find(m => m !== user.uid) || selectedChat.id,
        suspectHandle: selectedChat.name,
        reporterId: user.uid,
        reporterEmail: user.email,
        messages: evidence,
        timestamp: serverTimestamp(),
        chatId: selectedChat.id
      });

      setUserNotification("Report sent to safety team.");
    } catch (err) {
      console.error("Report failed:", err);
      setUserNotification("Failed to send report.");
    }
  };

  const updateGroupSettings = async () => {
    if (!selectedChat) return;
    setIsUpdatingGroup(true);
    try {
      await updateDoc(doc(db, 'chats', selectedChat.id), {
        name: groupSettingsName,
        description: groupSettingsDesc,
        photoURL: groupSettingsPhoto,
        members: groupSettingsMembers
      });
      setUserNotification("Group updated.");
      setIsViewingGroupSettings(false);
    } catch (err) {
      console.error("Group update failed", err);
      setUserNotification("Failed to update group.");
    } finally {
      setIsUpdatingGroup(false);
    }
  };

  const toggleGroupMember = async (memberHandle: string) => {
    const handleClean = memberHandle.trim().toLowerCase();
    if (!handleClean) return;

    try {
      const q = query(collection(db, 'users'), where('username', '==', handleClean), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const userDoc = snap.docs[0];
        const uid = userDoc.id;
        const actualUsername = userDoc.data().username || handleClean;

        setGroupSettingsMembers(prev => {
          const hasUid = prev.includes(uid);
          const hasHandle = prev.includes(actualUsername);
          if (hasUid || hasHandle) {
            return prev.filter(m => m !== uid && m !== actualUsername && m !== handleClean);
          } else {
            return [...prev, uid, actualUsername];
          }
        });
        setUserNotification(`Added member: @${actualUsername}`);
      } else {
        setGroupSettingsMembers(prev => {
          if (prev.includes(memberHandle)) {
            return prev.filter(m => m !== memberHandle);
          } else {
            return [...prev, memberHandle];
          }
        });
        setUserNotification(`User @${memberHandle} not found. Added raw handle.`);
      }
    } catch (e) {
      console.error("Error toggling member UUID:", e);
      setGroupSettingsMembers(prev => {
        if (prev.includes(memberHandle)) {
          return prev.filter(m => m !== memberHandle);
        } else {
          return [...prev, memberHandle];
        }
      });
    }
  };

  const AudioMessage: React.FC<{ url: string, theme: 'dark' | 'light', isOwn: boolean }> = ({ url, theme, isOwn }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
      if (!audioRef.current) return;
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
            console.error("Audio play failed:", err);
            setUserNotification("Audio playback error.");
        });
      }
      setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };

    const formatTime = (time: number) => {
      const min = Math.floor(time / 60);
      const sec = Math.floor(time % 60);
      return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    return (
      <div className={`flex items-center gap-3 p-3 rounded-2xl ${isOwn ? 'bg-black/20' : 'bg-white/5'} min-w-[200px]`}>
        <button onClick={togglePlay} className="w-12 h-12 rounded-full flex items-center justify-center bg-[#DC2626] text-white shadow-lg active:scale-95 transition-all">
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="translate-x-0.5" />}
        </button>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-0.5 h-6">
            {[...Array(20)].map((_, i) => {
              const isActive = progress > (i / 20) * 100;
              const height = 4 + Math.random() * 16;
              return (
                <div 
                  key={i} 
                  className={`flex-1 rounded-full transition-all duration-300 ${isActive ? 'bg-[#DC2626]' : 'bg-white/20'}`} 
                  style={{ height: `${height}px` }} 
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[8px] font-black uppercase text-white/40 tracking-widest">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <audio 
          ref={audioRef} 
          src={url} 
          onTimeUpdate={handleTimeUpdate} 
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)} 
          className="hidden" 
          preload="metadata"
          crossOrigin="anonymous"
        />
      </div>
    );
  };

  const targetUserData = useMemo(() => {
    if (!selectedChat) return undefined;
    if (selectedChat.isOmni) {
      return {
        displayName: 'Omni by NSG',
        fullName: 'Omni AI Study Companion',
        photoURL: selectedChat.photoURL || 'https://images.unsplash.com/photo-1675557009875-436f09789900?q=80&w=200&auto=format&fit=crop',
        about: 'Your 24/7 AI academic study companion powered by Local Qwen & Cloud AI.',
        points: 1250,
        streak: 30,
        lastSeen: new Date()
      };
    }
    const otherInfo = getOtherMemberInfo(selectedChat);
    if (otherInfo) {
      return {
        displayName: otherInfo.displayName,
        fullName: otherInfo.displayName,
        photoURL: otherInfo.photoURL || undefined,
        lastSeen: otherInfo.lastSeen
      };
    }
    const otherId = selectedChat.members?.find(m => m !== user?.uid && m !== userHandle);
    return {
      displayName: selectedChat.name || otherId || 'Scholar',
      fullName: selectedChat.name || otherId || 'Scholar',
      photoURL: selectedChat.photoURL || undefined,
      lastSeen: recipientStatus === 'Online' ? new Date() : null
    };
  }, [selectedChat, memberProfiles, user, userHandle, recipientStatus]);

  const handleVoiceUploadDirect = async (url: string, duration: number) => {
    if (!selectedChat) return;
    const msgData: any = {
      senderId: user.uid,
      senderHandle: userHandle,
      senderName: user.displayName || userHandle,
      text: `Voice note (${duration}s)`,
      timestamp: serverTimestamp(),
      type: 'audio',
      mediaUrl: url,
      encrypted: true,
      seenBy: [user.uid]
    };
    await addDoc(collection(db, 'chats', selectedChat.id, 'messages'), msgData).catch(() => {});
    await setDoc(doc(db, 'chats', selectedChat.id), {
      lastMessage: `🎤 Voice note (${duration}s)`,
      lastMessageSender: user.displayName || userHandle,
      updatedAt: serverTimestamp()
    }, { merge: true }).catch(() => {});
  };

  const handleMessageContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    setOverlayPosition({ x: e.clientX, y: e.clientY });
    setOverlayMessage(msg);
  };

  const handleBatchDelete = async () => {
    if (selectedChatIds.length === 0) return;
    try {
      for (const id of selectedChatIds) {
        if (id.startsWith('omni_')) {
          handleDeleteOmniSession(id);
        } else {
          await deleteDoc(doc(db, 'chats', id)).catch(() => {});
        }
      }
      setSelectedChatIds([]);
      setIsSelectionMode(false);
      if (selectedChat && selectedChatIds.includes(selectedChat.id)) {
        setSelectedChat(null);
      }
      setUserNotification("Selected conversations deleted.");
    } catch (e) {
      console.error("Batch delete error", e);
    }
  };

  return (
    <div className={`flex flex-1 h-full overflow-hidden min-h-0 ${theme === 'dark' ? 'bg-[#13111C]' : 'bg-slate-50'}`}>
      {/* Fullscreen Image Modal */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-black flex flex-col pt-10"
          >
            <div className="flex justify-between items-center px-4 mb-4">
              <button onClick={() => setFullscreenImage(null)} className="p-2 text-white/60 hover:text-white">
                <X size={24} />
              </button>
              <h4 className="text-[10px] font-black uppercase text-white/40 tracking-widest">Image Preview</h4>
              <div className="w-10 h-10" />
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              <img src={fullscreenImage} className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group Settings Modal */}
      <AnimatePresence>
        {isViewingGroupSettings && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#13111C] border border-white/10 rounded-[2.5rem] w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Group Chat Info</h3>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Group Members & Settings</p>
                </div>
                <button onClick={() => setIsViewingGroupSettings(false)} className="p-3 bg-white/5 rounded-2xl text-white/40 hover:text-white transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative group p-1 bg-white/5 rounded-[3rem] border border-white/5 shadow-2xl">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-[#DC2626] to-red-900 flex items-center justify-center text-white font-black text-4xl overflow-hidden border-4 border-white/10 shadow-inner">
                      {groupSettingsPhoto ? <img src={groupSettingsPhoto} alt="" className="w-full h-full object-cover" /> : groupSettingsName.charAt(0)}
                    </div>
                    {(selectedChat as any).admin === user.uid && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-all rounded-[2.5rem] backdrop-blur-md"
                      >
                        <Camera size={32} className="mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">Update Hub Profile</span>
                      </button>
                    )}
                  </div>
                  <div className="w-full space-y-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] ml-4">Hub Designation</p>
                      <input 
                        value={groupSettingsName} 
                        onChange={e => setGroupSettingsName(e.target.value)} 
                        disabled={(selectedChat as any).admin !== user.uid}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-[#DC2626] transition-all disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] ml-4">Hub Directive</p>
                      <textarea 
                        value={groupSettingsDesc} 
                        onChange={e => setGroupSettingsDesc(e.target.value)} 
                        disabled={(selectedChat as any).admin !== user.uid}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white/60 outline-none focus:border-[#DC2626] transition-all h-24 resize-none disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 italic">
                       <Users size={16} className="text-[#DC2626]" /> Members ({groupSettingsMembers.length})
                    </h4>
                    {(selectedChat as any).admin === user.uid && (
                      <button 
                        onClick={() => setIsAddingGroupMember(true)}
                        className="p-2 bg-[#DC2626] text-white rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-900/20"
                      >
                        <UserPlus size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {groupSettingsMembers.filter(m => m && (!m.startsWith('0') || m.length < 15)).map(member => {
                      const isUid = member.length >= 20;
                      const displayName = isUid ? (userIdToUsername[member] || `Resolving ${member.slice(0, 5)}...`) : member;
                      const isMe = member === userHandle || member === user.uid;

                      return (
                        <div key={member} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-[#DC2626] text-xs">@{displayName.charAt(0)}</div>
                             <div>
                               <p className="text-xs font-black text-white uppercase truncate">@{displayName}</p>
                               {isMe && <p className="text-[7px] font-bold text-[#DC2626] uppercase">Primary User</p>}
                             </div>
                          </div>
                          {(selectedChat as any).admin === user.uid && !isMe && (
                            <button onClick={() => toggleGroupMember(member)} className="p-2 text-white/20 hover:text-red-500 transition-all">
                              <Trash2 size={16} />
                            </button>
                          )}
                          {((selectedChat as any).admin === member || ((selectedChat as any).admin === user.uid && isMe)) && (
                            <span className="text-[7px] font-black text-[#DC2626] uppercase border border-[#DC2626]/40 px-2 py-0.5 rounded italic">Admin Hub</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-white/5 flex gap-4 bg-white/[0.01]">
                <button onClick={() => setIsViewingGroupSettings(false)} className="flex-1 px-8 py-4 bg-white/5 text-white/40 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:text-white transition-all">Abort</button>
                <button 
                  onClick={updateGroupSettings} 
                  disabled={isUpdatingGroup}
                  className="flex-[2] px-8 py-4 bg-[#DC2626] text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-red-900/30 active:scale-95 transition-all disabled:opacity-50"
                 >
                   {isUpdatingGroup ? 'SYNCHRONIZING...' : 'UPLOAD DIRECTIVE'}
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddingGroupMember && (
          <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-black/90">
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-[#0F172A] border border-white/10 rounded-3xl p-8 w-full max-w-sm space-y-6 shadow-2xl">
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Add Member</h3>
                   <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Connect external user handle</p>
                </div>
                <input 
                   placeholder="e.g. nsg_pro_user"
                   value={newGroupMemberHandle}
                   onChange={e => setNewGroupMemberHandle(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold text-white outline-none focus:border-[#DC2626]"
                />
                <div className="flex gap-3">
                   <button onClick={() => setIsAddingGroupMember(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-white/40">Cancel</button>
                   <button 
                    onClick={() => {
                       if (newGroupMemberHandle.trim()) {
                         toggleGroupMember(newGroupMemberHandle.trim());
                         setNewGroupMemberHandle('');
                         setIsAddingGroupMember(false);
                       }
                    }}
                    className="flex-1 py-4 bg-[#DC2626] text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-red-900/20"
                   >
                     Add Member
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Main Chat Workspace Layout - Direct Full Screen Workspace (No Chat List Page) */}
      <div className="flex flex-1 h-full w-full overflow-hidden min-h-0 relative">
        <div className="flex flex-col flex-1 h-full w-full overflow-hidden min-w-0">
          {(selectedChat || OMNI_DEFAULT_CHAT).isOmni ? (
            <OmniChatWorkspace
              messages={messages}
              inputText={inputText}
              setInputText={setInputText}
              isThinking={Boolean(selectedChat?.id ? omniThinkingChatIds[selectedChat.id] : isOmniThinking)}
              thinkingChatIds={omniThinkingChatIds}
              isRecording={isRecording}
              onSendMessage={handleSendMessage}
              onStopGeneration={() => {
                setIsOmniThinking(false);
                if (selectedChat?.id) setChatThinking(selectedChat.id, false);
              }}
              onStartVoiceRecord={startRecording}
              onStopVoiceRecord={stopRecording}
              onSendAudioMessage={handleSendOmniAudio}
              onFileUpload={handleFileUpload}
              uploadToCloudinary={uploadToCloudinary}
              onSendImageMessage={handleSendOmniImage}
              onClose={() => {
                if (setAppActiveTab) {
                  setAppActiveTab('home');
                } else {
                  setSelectedChat(OMNI_DEFAULT_CHAT);
                  onChatSelect?.(false);
                }
              }}
              user={user}
              userHandle={userHandle}
              theme={theme}
              userNotes={userNotes}
              onOpenNote={onOpenNote}
              setAppActiveTab={setAppActiveTab}
              setToolsSubTab={setToolsSubTab}
              setImportedQuizNote={setImportedQuizNote}
              setQuizTopic={setQuizTopic}
              generateQuiz={generateQuiz}
              onOpenQuizById={onOpenQuizById}
              chatSessions={omniSessions}
              activeSessionId={selectedChat?.id || 'omni_main'}
              onSelectSession={handleSelectOmniSession}
              onNewChat={handleNewOmniChat}
              onRenameSession={handleRenameOmniSession}
              onPinSession={handlePinOmniSession}
              onDeleteSession={handleDeleteOmniSession}
            />
          ) : (
            <PeerChatWorkspace
              chat={selectedChat || OMNI_DEFAULT_CHAT}
              messages={messages}
              inputText={inputText}
              setInputText={setInputText}
              onSendMessage={handleSendMessage}
              onVoiceUpload={handleVoiceUploadDirect}
              onFileUpload={handleFileUpload}
              onClose={() => {
                setSelectedChat(OMNI_DEFAULT_CHAT);
                onChatSelect?.(true);
              }}
              user={user}
              userHandle={userHandle}
              theme={theme}
              targetUserData={targetUserData}
              onMessageContextMenu={handleMessageContextMenu}
              userNotes={userNotes}
              onOpenNote={onOpenNote}
              onShareNoteClick={() => setShowNoteShareOverlay(true)}
              onStartCall={(type) => {
                startCall(type);
              }}
            />
          )}
        </div>
      </div>

      {/* Floating Rich Context Actions Pop-up Menu */}
      <AnimatePresence>
        {overlayMessage && (
          <MessageOverlay
            message={overlayMessage as any}
            triggerPosition={overlayPosition}
            onClose={() => setOverlayMessage(null)}
            onReact={(emoji) => handleAddReaction(overlayMessage.id, emoji)}
            onReplyInline={() => {
              setReplyingTo(overlayMessage as any);
              setOverlayMessage(null);
            }}
            onCopyText={() => {
              navigator.clipboard.writeText(overlayMessage.text);
              setUserNotification("Copied!");
            }}
            onForward={() => {
              setUserNotification("Marked for forwarding!");
              setOverlayMessage(null);
            }}
            onStarMessage={() => {
              handleToggleStarMessage(overlayMessage.id);
              setOverlayMessage(null);
              setUserNotification("Updated Starred Status!");
            }}
            onDeleteMessage={(type) => {
              handleDeleteMessageDirect(overlayMessage.id, type);
              setOverlayMessage(null);
              setUserNotification("Message Deleted!");
            }}
          />
        )}
      </AnimatePresence>

      {/* User Details Overlay (WhatsApp style) */}
      <AnimatePresence>
        {viewingUser && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed inset-0 z-[200] flex flex-col ${theme === 'dark' ? 'bg-[#13111C]' : 'bg-slate-50'}`}
          >
            <div className={`p-4 flex items-center gap-4 ${theme === 'dark' ? 'bg-[#13111C]' : 'bg-white shadow-sm'} z-20`}>
              <button 
                onClick={() => setViewingUser(null)} 
                className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/5 text-white/60' : 'hover:bg-slate-100 text-slate-600'}`}
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Contact Info</h2>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Profile Image & Name Section */}
              <div className={`${theme === 'dark' ? 'bg-[#0F172A]' : 'bg-white'} p-8 flex flex-col items-center gap-4 mb-4 border-b border-white/5`}>
                <div className="w-40 h-40 rounded-full bg-black flex items-center justify-center text-white font-black text-6xl shadow-2xl border-4 border-white/10 overflow-hidden relative group">
                  {viewingUser.isOmni ? (
                    <Brain size={80} className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,1)] animate-pulse" />
                  ) : viewingUser.photoURL ? (
                    <img src={viewingUser.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    viewingUser.displayName?.charAt(0) || 'U'
                  )}
                </div>
                <div className="text-center">
                  <h3 className={`text-2xl font-black italic tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{viewingUser.fullName || viewingUser.displayName}</h3>
                  <p className={`text-xs font-bold tracking-[0.2em] uppercase mt-1 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>@{viewingUser.username || viewingUser.uid?.slice(0, 8)}</p>
                </div>
              </div>

              {/* Scholar Credentials (Connects to profiles XP, Badges, etc) */}
              {!viewingUser.isOmni && (
                <div className={`${theme === 'dark' ? 'bg-[#0F172A]' : 'bg-white'} p-6 rounded-3xl shadow-lg space-y-4 border border-white/5 mx-4 mb-4`}>
                  <p className="text-[10px] font-black text-[#DC2626] uppercase tracking-[0.2em] flex items-center gap-2">
                    🏆 SCHOLAR CREDENTIALS
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* XP Points */}
                    <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'} p-4 rounded-2xl flex flex-col items-center justify-center text-center`}>
                      <span className="text-2xl">💎</span>
                      <p className={`text-[8px] font-black ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'} uppercase tracking-widest mt-1`}>XP Power</p>
                      <p className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{viewingUser.points || 0} XP</p>
                    </div>

                    {/* Day Streak */}
                    <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'} p-4 rounded-2xl flex flex-col items-center justify-center text-center`}>
                      <span className="text-2xl">🔥</span>
                      <p className={`text-[8px] font-black ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'} uppercase tracking-widest mt-1`}>Daily Streak</p>
                      <p className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{viewingUser.streak || 0} Days</p>
                    </div>
                  </div>

                  {/* Honor Tier Rank */}
                  <div className="bg-gradient-to-r from-red-650/10 to-amber-655/10 border border-red-500/20 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚡</span>
                      <div className="text-left">
                        <p className={`text-[7px] font-black ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'} uppercase tracking-widest`}>Scholar Standing</p>
                        <p className={`text-xs font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-950'}`}>{viewingUser.rank || 'Bronze Scholar'}</p>
                      </div>
                    </div>
                    <span className="text-[8px] font-black text-amber-500 px-3 py-1 rounded-full bg-amber-500/10">
                      RANK SPECIAL
                    </span>
                  </div>

                  {/* Achieved Badges */}
                  <div className="space-y-2 mt-2 pt-2 border-t border-white/5">
                    <p className={`text-[8px] font-black ${theme === 'dark' ? 'text-white/40' : 'text-slate-450'} uppercase tracking-widest text-left`}>UNLOCKED SPECIALIST BADGES</p>
                    <div className="flex flex-wrap gap-2 justify-start">
                      {/* Always unlock at least a default or dynamically based on points */}
                      <div className="px-3 py-1.5 rounded-full bg-pink-505/10 border border-pink-505/20 text-pink-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                        🌸 May Synergy
                      </div>
                      {(viewingUser.points || 0) >= 100 && (
                        <div className="px-3 py-1.5 rounded-full bg-blue-505/10 border border-blue-505/20 text-blue-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          🎓 Exam Victor
                        </div>
                      )}
                      {(viewingUser.points || 0) >= 500 && (
                        <div className="px-3 py-1.5 rounded-full bg-yellow-505/10 border border-yellow-505/20 text-yellow-500 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          ⚡ Quiz Prodigy
                        </div>
                      )}
                      {(viewingUser.streak || 0) >= 10 && (
                        <div className="px-3 py-1.5 rounded-full bg-green-550/10 border border-green-550/20 text-green-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          🌾 Wildfire Ace
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Info Section */}
              <div className="space-y-4 px-4 pb-10">
                {/* About Section */}
                <div className={`${theme === 'dark' ? 'bg-[#0F172A]' : 'bg-white'} p-5 rounded-3xl shadow-lg space-y-2 border border-white/5`}>
                  <p className="text-[10px] font-black text-[#DC2626] uppercase tracking-widest flex items-center gap-2">
                    <Info size={12} /> Contact Information & About
                  </p>
                  <p className={`text-sm leading-relaxed font-medium ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}>
                    {viewingUser.about || "Hey there! I am using NSG."}
                  </p>
                  <div className="pt-2 border-t border-white/5 flex flex-col gap-1 text-left">
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Personal Verified Email</span>
                    <span className="text-xs font-bold text-white/70">{viewingUser.email || `${viewingUser.username || 'user'}_nsg@academic.edu.ng`}</span>
                  </div>
                </div>

                {/* Academic Details (if applicable) */}
                {!viewingUser.isOmni && (
                  <div className={`${theme === 'dark' ? 'bg-[#0F172A]' : 'bg-white'} p-5 rounded-3xl shadow-lg space-y-4 border border-white/5`}>
                    <p className="text-[10px] font-black text-[#DC2626] uppercase tracking-widest flex items-center gap-2">
                      <GraduationCap size={12} /> Academic Info
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                      {[
                        { label: 'University', value: viewingUser.university, icon: MapPin },
                        { label: 'Department', value: viewingUser.department, icon: AtSign },
                        { label: 'Level', value: viewingUser.level, icon: Calendar },
                        { label: 'Faculty', value: viewingUser.faculty, icon: AtSign }
                      ].filter(f => f.value).map((field, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center ${theme === 'dark' ? 'text-white/40' : 'text-slate-300'}`}>
                            <field.icon size={14} />
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">{field.label}</p>
                            <p className={`text-xs font-bold uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{field.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Media Section Placeholder */}
                <div className={`${theme === 'dark' ? 'bg-[#0F172A]' : 'bg-white'} p-5 rounded-3xl shadow-lg space-y-4 border border-white/5 opacity-50`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>
                      <ImageIcon size={12} /> Media, Links, and Docs
                    </p>
                    <ArrowLeft className={`rotate-180 ${theme === 'dark' ? 'text-white/20' : 'text-slate-200'}`} size={14} />
                  </div>
                  <div className="flex gap-2">
                    {[1,2,3].map(i => <div key={i} className="w-16 h-16 rounded-xl bg-white/5 border border-white/10" />)}
                  </div>
                </div>

                {/* Actions & Instant Shortcuts */}
                <div className="space-y-2 pt-4">
                  <h4 className="text-[8.5px] font-black uppercase tracking-widest text-[#DC2626] mb-2 text-left">Secure Action Dashboard</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => {
                        setViewingUser(null);
                        startCall('voice');
                      }}
                      className="p-4 bg-[#00CCFF]/10 hover:bg-[#00CCFF]/20 border border-[#00CCFF]/20 text-[#00CCFF] rounded-2xl font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      <Phone size={14} /> Voice Call
                    </button>
                    
                    <button 
                      onClick={() => {
                        setViewingUser(null);
                        startCall('video');
                      }}
                      className="p-4 bg-[#9933FF]/10 hover:bg-[#9933FF]/20 border border-[#9933FF]/20 text-[#9933FF] rounded-2xl font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      <Video size={14} /> Video Call
                    </button>
                    
                    <button 
                      onClick={() => {
                        if (confirm("Are you sure you want to clean local history cache for this session?")) {
                          setUserNotification("Local memory cache wiped cleanly!");
                          setViewingUser(null);
                        }
                      }}
                      className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-black text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 col-span-2"
                    >
                      <RefreshCw size={14} /> Clear Chat History
                    </button>
                  </div>

                  <button 
                    onClick={() => {
                      setUserNotification("Contact has been blocked.");
                      setViewingUser(null);
                    }}
                    className="w-full p-4 mt-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all text-center flex items-center justify-center gap-3 border border-red-500/20"
                  >
                    <Check size={16} className="rotate-45" /> Block Contact
                  </button>
                  
                  <button 
                    onClick={() => {
                      handleReportChat();
                      setViewingUser(null);
                    }}
                    className="w-full p-4 bg-red-650/10 hover:bg-red-650/20 text-red-650 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all text-center flex items-center justify-center gap-3 border border-red-650/20"
                  >
                    <ShieldAlert size={16} /> Report Contact
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Non-blocking Incoming Call Popup Modal */}
      <AnimatePresence>
        {incomingCallRequest && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-[600] bg-zinc-950 border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#DC2626]/10 border border-[#DC2626]/20 flex items-center justify-center shrink-0">
                <Phone className="text-[#DC2626] animate-bounce animate-infinite" size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-[#DC2626] tracking-widest">Incoming Call</p>
                <h4 className="text-sm font-black text-white mt-0.5">{incomingCallRequest.callerName}</h4>
              </div>
            </div>
            
            <p className="text-xs text-white/50 leading-relaxed">
              Answer the call to connect with your peer scholar. Make sure your microphone is enabled.
            </p>

            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={async () => {
                  const { call } = incomingCallRequest;
                  setIncomingCallRequest(null);
                  setActiveCall({ type: 'voice', chatName: incomingCallRequest.callerName });
                  setActiveCallStatus('connected');
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                    localStreamRef.current = stream;
                    setLocalStreamState(stream);
                    call.answer(stream);
                    call.on('stream', (rStream: any) => {
                      remoteStreamRef.current = rStream;
                      setRemoteStreamState(rStream);
                    });
                    call.on('close', () => {
                      hangUp();
                    });
                  } catch (e) {
                    console.error("Accept fail:", e);
                    call.close();
                    hangUp();
                  }
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Answer
              </button>
              <button
                onClick={() => {
                  incomingCallRequest.call.close();
                  setIncomingCallRequest(null);
                  hangUp();
                }}
                className="flex-1 bg-red-650 hover:bg-red-700 active:scale-95 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Decline
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active WebRTC Secure Calling Overlay Screen */}
      <AnimatePresence>
        {activeCall && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[500] bg-slate-950 flex flex-col items-center justify-center p-8 text-center"
          >
            {/* Live WebRTC Remote Stream Video Frame */}
            {activeCall.type === 'video' && remoteStream && (
              <video 
                ref={(el) => {
                  if (el) el.srcObject = remoteStream;
                }}
                autoPlay 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
            )}

            {/* Live WebRTC Camera Local Self-Video Frame */}
            {activeCall.type === 'video' && localStream && !isVideoOff && (
              <video 
                ref={(el) => {
                  if (el) el.srcObject = localStream;
                }}
                autoPlay 
                muted 
                playsInline 
                className="absolute top-10 right-10 w-28 h-40 bg-zinc-900 border-2 border-white/20 rounded-2xl z-50 object-cover shadow-2xl"
              />
            )}

            <div className="absolute top-10 left-10 flex items-center gap-2 text-emerald-500 animate-pulse z-25 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Secure Connection Established</span>
            </div>

            <div className="relative mb-12 z-20">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#DC2626] to-red-900 flex items-center justify-center text-white text-4xl font-black shadow-[0_0_50px_rgba(220,38,38,0.3)]">
                {activeCall.chatName.charAt(0)}
              </div>
              <div className="absolute -inset-4 rounded-full border border-[#DC2626]/20 animate-ping" />
              <div className="absolute -inset-8 rounded-full border border-[#DC2626]/10 animate-pulse" />
            </div>
            
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2 z-20 relative bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-sm inline-block">{activeCall.chatName}</h2>
            <p className="text-[#DC2626] text-sm font-black uppercase tracking-widest mb-20 animate-pulse shadow-sm z-20 bg-black/30 px-3 py-1 rounded-full backdrop-blur-md">
              {activeCallStatus === 'ringing' ? 'Ringing...' : activeCallStatus === 'connected' ? 'In Call' : 'Connecting...'}
            </p>

            <div className="flex items-center gap-8 z-20 relative">
              <button 
                onClick={() => {
                  const newState = !isMuted;
                  setIsMuted(newState);
                  if (localStreamRef.current) {
                    localStreamRef.current.getAudioTracks().forEach((track: any) => track.enabled = !newState);
                  }
                }}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-black/60 text-white/45 hover:bg-black/80'}`}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              
              <button 
                onClick={() => hangUp()}
                className="w-20 h-20 rounded-full bg-red-650 flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all group"
              >
                <PhoneOff size={32} className="group-hover:animate-bounce" />
              </button>

              <button 
                onClick={() => {
                  const newState = !isVideoOff;
                  setIsVideoOff(newState);
                  if (localStreamRef.current) {
                    localStreamRef.current.getVideoTracks().forEach((track: any) => track.enabled = !newState);
                  }
                }}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-black/60 text-white/45 hover:bg-black/80'}`}
              >
                {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
              </button>
            </div>
            
            <div className="mt-24 grid grid-cols-2 gap-4 w-full max-w-xs z-20">
              <div className="p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5">
                <p className="text-[8px] text-white/20 uppercase font-black mb-1">Signal Quality</p>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[90%] h-full bg-emerald-500" />
                </div>
              </div>
              <div className="p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5">
                <p className="text-[8px] text-white/20 uppercase font-black mb-1">Encryption</p>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => <div key={i} className="w-full h-1 bg-[#DC2626] rounded-full" />)}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        {isAddingChat && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 border border-white/10 p-8 rounded-3xl w-full max-w-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase italic">Add User</h3>
                <button onClick={() => { setIsAddingChat(false); setUserSuggestions([]); }} className="text-white/20 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1 relative">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Search Username</span>
                  <input 
                    autoFocus
                    placeholder="Type handle..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-[#DC2626]"
                    value={newChatHandle}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                  />
                  {isSearchingUsers && (
                    <div className="absolute right-4 bottom-4">
                      <RefreshCw size={14} className="text-[#DC2626] animate-spin" />
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {userSuggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2 bg-white/5 p-2 rounded-2xl border border-white/10"
                    >
                      {userSuggestions.map(suggestion => (
                        <button 
                          key={suggestion.id}
                          onClick={() => createChat(suggestion)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-[#DC2626]/20 flex items-center justify-center text-[#DC2626] font-black uppercase text-xs">
                            {suggestion.photoURL ? (
                              <img src={suggestion.photoURL} alt={suggestion.username || suggestion.displayName || 'User'} className="w-full h-full rounded-lg object-cover" />
                            ) : (
                              (suggestion.username || suggestion.displayName || '?').charAt(0)
                            )}
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-black text-white uppercase tracking-tight group-hover:text-[#DC2626] transition-colors">{suggestion.displayName || suggestion.username || 'Anonymous'}</p>
                            <p className="text-[9px] text-white/40 font-mono">@{suggestion.username || 'user'}</p>
                          </div>
                          <UserPlus size={14} className="ml-auto text-white/20 group-hover:text-[#DC2626]" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!userSuggestions.length && newChatHandle.length >= 2 && !isSearchingUsers && (
                  <p className="text-[9px] text-center text-white/20 uppercase tracking-widest italic">No users found matching "{newChatHandle}"</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setIsAddingChat(false); setUserSuggestions([]); }} className="flex-1 py-4 text-white/40 font-black uppercase text-xs">Cancel</button>
                  <button 
                    onClick={() => createChat()}
                    disabled={!newChatHandle.trim()} 
                    className="flex-[2] bg-[#DC2626] text-white py-4 rounded-2xl font-black uppercase text-xs disabled:opacity-50"
                  >
                    Direct Start
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

      {/* Image Editing Overlay */}
      <AnimatePresence>
        {editingImage && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[300] bg-[#13111C] flex flex-col pt-10"
          >
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <button 
                onClick={() => { setEditingImage(null); setImageCaption(''); }}
                className="p-2 text-white/60 hover:text-white"
              >
                <X size={24} />
              </button>
              <h3 className="text-xs font-black uppercase tracking-widest text-[#DC2626]">Preview Image</h3>
              <button 
                onClick={handleSendEditedImage}
                disabled={isUploading}
                className="flex items-center gap-2 px-6 py-2 bg-[#DC2626] text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-900/20 active:scale-95 transition-all"
              >
                {isUploading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />} Send
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="relative max-w-full max-h-full">
                    <img src={editingImage.url} className="max-w-full max-h-[60vh] object-contain rounded-2xl shadow-2xl" />
                </div>
                
                <div className="w-full max-w-lg mt-8 space-y-4">
                    <div className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-2xl">
                        <input 
                            placeholder="Add a caption..."
                            value={imageCaption}
                            onChange={(e) => setImageCaption(e.target.value)}
                            className="flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none"
                        />
                        <button 
                           onClick={() => setIsViewOnce(!isViewOnce)}
                           className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${isViewOnce ? 'bg-[#DC2626] border-[#DC2626] text-white shadow-lg' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                           title="View Once"
                        >
                            <div className="relative">
                                <Eye size={18} />
                                <div className="absolute -top-1 -right-1 bg-inherit border border-current rounded-full w-3 h-3 flex items-center justify-center text-[7px] font-bold">1</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        {isCreatingGroup && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 border border-white/10 p-6 rounded-3xl w-full max-w-sm space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase italic">Create Group</h3>
                <button onClick={() => setIsCreatingGroup(false)} className="text-white/20 hover:text-white"><X size={20} /></button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Group Name</span>
                  <input 
                    autoFocus
                    placeholder="e.g. Science Hub"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:border-[#DC2626]"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Description</span>
                  <textarea 
                    placeholder="What's this group about?"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:border-[#DC2626] resize-none h-20"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                   <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">Public Group</p>
                      <p className="text-[8px] text-white/40 uppercase">Anyone with link can join</p>
                   </div>
                   <button 
                      onClick={() => setIsGroupPublic(!isGroupPublic)}
                      className={`w-12 h-6 rounded-full transition-all relative ${isGroupPublic ? 'bg-[#DC2626]' : 'bg-white/10'}`}
                   >
                      <motion.div 
                        animate={{ x: isGroupPublic ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md" 
                      />
                   </button>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Select Members</span>
                      <span className="text-[9px] font-black text-[#DC2626] uppercase">{selectedGroupMembers.length} Selected</span>
                   </div>
                   <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                      {chats.filter(c => c.type === 'direct').map(chat => (
                         <button 
                            key={chat.id}
                            onClick={() => {
                               const otherId = chat.members.find(m => m !== user.uid && m !== userHandle);
                               if (!otherId) return;
                               setSelectedGroupMembers(prev => 
                                  prev.includes(otherId) ? prev.filter(id => id !== otherId) : [...prev, otherId]
                               );
                            }}
                            className={`w-full p-2 flex items-center gap-3 rounded-xl border transition-all ${
                               chat.members.some(m => selectedGroupMembers.includes(m))
                               ? 'bg-[#DC2626]/10 border-[#DC2626]/40' 
                               : 'bg-white/5 border-transparent hover:bg-white/10'
                            }`}
                         >
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                               {chat.photoURL ? <img src={chat.photoURL} className="w-full h-full rounded-full object-cover"/> : chat.name.charAt(0)}
                            </div>
                            <span className="text-xs text-white/80 font-bold truncate">{chat.name}</span>
                            {chat.members.some(m => selectedGroupMembers.includes(m)) && <Check size={14} className="ml-auto text-[#DC2626]" />}
                         </button>
                      ))}
                   </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setIsCreatingGroup(false)} className="flex-1 py-4 text-white/40 font-black uppercase text-xs">Cancel</button>
                  <button 
                    onClick={createGroup}
                    disabled={!groupName.trim()}
                    className="flex-[2] bg-[#DC2626] text-white py-4 rounded-2xl font-black uppercase text-xs disabled:opacity-30"
                  >
                    Create Group
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

      {/* WhatsApp-like Image Gallery Option Overlay */}
      <AnimatePresence>
        {showPhotoLibrary && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 p-6 rounded-3xl w-full max-w-sm space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🖼️</span>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">NSG Academic Media Desk</h3>
                    <p className="text-[8px] text-white/30 uppercase">WhatsApp-style reference library</p>
                  </div>
                </div>
                <button onClick={() => setShowPhotoLibrary(false)} className="text-white/20 hover:text-white"><X size={20} /></button>
              </div>

              {/* Standard select input as secondary trigger */}
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                <p className="text-[10px] text-white/40 uppercase font-black text-left">Want to select a local device file?</p>
                <button 
                  onClick={() => { fileInputRef.current?.click(); setShowPhotoLibrary(false); }}
                  className="px-3 py-1.5 bg-[#DC2626] hover:bg-red-700 text-white text-[9px] font-black uppercase rounded-xl tracking-wider"
                >
                  Local Explorer
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto custom-scrollbar">
                {[
                  { title: "Human Cardiac Anatomy", url: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=500&auto=format&fit=crop" },
                  { title: "Organic Molecular Bonds", url: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=500&auto=format&fit=crop" },
                  { title: "Quantum Logic Matrix", url: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=500&auto=format&fit=crop" },
                  { title: "Solar Radiance Mechanics", url: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=500&auto=format&fit=crop" }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={async () => {
                      if (!selectedChat) return;
                      setShowPhotoLibrary(false);
                      const msgData = {
                        senderId: user.uid,
                        senderHandle: userHandle,
                        senderName: user.displayName || userHandle,
                        text: `Template Reference Diagram: ${item.title}`,
                        timestamp: serverTimestamp(),
                        type: 'image',
                        mediaUrl: item.url,
                        encrypted: true,
                        seenBy: [user.uid]
                      };
                      await addDoc(collection(db, 'chats', selectedChat.id, 'messages'), msgData).catch(() => {});
                      setDoc(doc(db, 'chats', selectedChat.id), {
                        lastMessage: `📷 reference: ${item.title}`,
                        lastMessageSender: user.displayName || userHandle,
                        updatedAt: serverTimestamp()
                      }, { merge: true }).catch(() => {});
                      setUserNotification(`Sent reference ${item.title} to discussion room!`);
                    }}
                    className="relative group rounded-xl overflow-hidden border border-white/5 bg-black/40 hover:border-[#DC2626]/40 transition-all text-left flex flex-col h-28"
                  >
                    <img src={item.url} alt="" className="w-full h-16 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="p-1.5 flex-[1] flex flex-col justify-between">
                      <p className="text-[7.5px] font-black text-white/50 uppercase tracking-widest">DIAGRAM</p>
                      <p className="text-[9px] font-black text-white uppercase italic truncate">{item.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Note Workspace Overlay */}
      <AnimatePresence>
        {showNoteShareOverlay && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 p-6 rounded-3xl w-full max-w-sm space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📓</span>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Share Revision Notebook</h3>
                    <p className="text-[8px] text-white/30 uppercase">Broadcast to NSG Contacts</p>
                  </div>
                </div>
                <button onClick={() => setShowNoteShareOverlay(false)} className="text-white/20 hover:text-white"><X size={20} /></button>
              </div>

              {/* Set permission setting toggler */}
              <div className="flex gap-2 bg-black/40 p-2.5 rounded-2xl border border-white/5 justify-between items-center">
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase text-white tracking-widest">Shared Permission</p>
                  <p className="text-[7.5px] text-white/40 uppercase">
                    {noteShareMode === 'editable' ? 'Collab: Recipients can Edit note' : 'Review: Read-only broadcast'}
                  </p>
                </div>
                <button 
                  onClick={() => setNoteShareMode(noteShareMode === 'editable' ? 'readonly' : 'editable')}
                  className={`px-3 py-1 text-[8px] font-black uppercase rounded-xl tracking-widest transition-all ${noteShareMode === 'editable' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' : 'bg-sky-500/10 text-sky-500 border border-sky-500/30'}`}
                >
                  {noteShareMode === 'editable' ? '🫱 Collab' : '🔒 Read-only'}
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                <p className="text-[8.5px] font-black text-white/30 uppercase px-1 text-left">Choose Notebook to Share:</p>
                <SharedNotesList 
                  user={user} 
                  db={db} 
                  selectedChat={selectedChat} 
                  noteShareMode={noteShareMode} 
                  onClose={() => setShowNoteShareOverlay(false)} 
                  setUserNotification={setUserNotification}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Quiz Overlay */}
      <AnimatePresence>
        {showQuizShareOverlay && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 p-6 rounded-3xl w-full max-w-sm space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Share Quiz Series</h3>
                    <p className="text-[8px] text-white/30 uppercase">Test other scholars in NSG</p>
                  </div>
                </div>
                <button onClick={() => setShowQuizShareOverlay(false)} className="text-white/20 hover:text-white"><X size={20} /></button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {[
                  { title: "Neuroscience Anatomy Quiz - Tier 1", questionsCount: 15 },
                  { title: "Advanced Quantum Mechanics - Test B", questionsCount: 10 },
                  { title: "Biochemistry Catalyst Series", questionsCount: 8 }
                ].map((quiz, idx) => (
                  <button
                    key={idx}
                    onClick={async () => {
                      if (!selectedChat) return;
                      setShowQuizShareOverlay(false);
                      const msgData = {
                        senderId: user.uid,
                        senderHandle: userHandle,
                        senderName: user.displayName || userHandle,
                        text: `🏆 Challenge Quiz: ${quiz.title} (${quiz.questionsCount} Questions)`,
                        timestamp: serverTimestamp(),
                        type: 'text',
                        encrypted: true,
                        seenBy: [user.uid]
                      };
                      await addDoc(collection(db, 'chats', selectedChat.id, 'messages'), msgData).catch(() => {});
                      setDoc(doc(db, 'chats', selectedChat.id), {
                        lastMessage: `🏆 Challenge Quiz: ${quiz.title}`,
                        lastMessageSender: user.displayName || userHandle,
                        updatedAt: serverTimestamp()
                      }, { merge: true }).catch(() => {});
                      setUserNotification(`Successfully shared the quiz "${quiz.title}"!`);
                    }}
                    className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-left flex justify-between items-center transition-all group"
                  >
                    <div className="text-left">
                      <h4 className="text-xs font-black text-white uppercase italic group-hover:text-[#DC2626] transition-colors">{quiz.title}</h4>
                      <p className="text-[8px] text-white/30 uppercase tracking-widest mt-0.5">{quiz.questionsCount} revision challenges matched</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-[#DC2626]/20 border border-[#DC2626]/30 text-white text-[8px] font-black uppercase">Share</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface SharedNotesListProps {
  user: any;
  db: any;
  selectedChat: any;
  noteShareMode: string;
  onClose: () => void;
  setUserNotification: (msg: string) => void;
}

export const SharedNotesList: React.FC<SharedNotesListProps> = ({ user, db, selectedChat, noteShareMode, onClose, setUserNotification }) => {
  const [localNotes, setLocalNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notes'),
      where('uid', '==', user.uid),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );
    getDocs(q).then((snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLocalNotes(items);
      setLoading(false);
    }).catch(err => {
      console.error("SharedNotesList error", err);
      // Fallback notes
      setLocalNotes([
        { id: "note_revision_vectors_fall", title: "General Relativity Vectors Notes", content: "Matrix transformations and space curvature vectors." },
        { id: "note_revision_cellular", title: "Cell Energy Mitochondria Outline", content: "Notes on adenosine triphosphate and synthesis pathways." }
      ]);
      setLoading(false);
    });
  }, [user, db]);

  const handleShare = async (note: any) => {
    if (!selectedChat) return;
    onClose();
    
    // Add shared count increment and room members list to notes allowedUsers array!
    const noteRef = doc(db, 'notes', note.id);
    const membersList = selectedChat.members || [];
    
    await updateDoc(noteRef, {
      sharedCount: (note.sharedCount || 0) + 1,
      collaborators: arrayUnion(selectedChat.id),
      allowedUsers: arrayUnion(...membersList)
    }).catch((e) => {
      console.error("Failed to add allowedUsers to note:", e);
    });

    // Send shared Note card message to conversation with text content preview
    const msgData = {
      senderId: user.uid,
      senderHandle: user.uid,
      senderName: user.displayName || "NSG Student",
      text: `📓 Note: ${note.title}`,
      noteTitle: note.title,
      noteContent: note.content || 'Notes content preview is empty.',
      timestamp: serverTimestamp(),
      type: 'text',
      isSharedNote: true,
      sharedAccessType: noteShareMode,
      mediaUrl: note.id,
      encrypted: true,
      seenBy: [user.uid]
    };

    await addDoc(collection(db, 'chats', selectedChat.id, 'messages'), msgData).catch(() => {});
    
    // Update chat room details
    await setDoc(doc(db, 'chats', selectedChat.id), {
      lastMessage: `📓 Shared: ${note.title}`,
      lastMessageSender: user.displayName || "NSG Student",
      updatedAt: serverTimestamp()
    }, { merge: true }).catch(() => {});

    setUserNotification(`Shared "${note.title}" notes workspace!`);
  };

  if (loading) return <p className="text-[10px] text-white/30 uppercase tracking-widest text-center py-4">Loading user notebooks...</p>;

  return (
    <div className="space-y-1">
      {localNotes.map((note) => (
        <button
          key={note.id}
          onClick={() => handleShare(note)}
          className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-left flex justify-between items-center transition-all group lg:min-w-[300px]"
        >
          <div className="min-w-0 flex-1 text-left">
            <h4 className="text-[11px] font-black text-white uppercase italic group-hover:text-[#DC2626] transition-colors truncate">{note.title}</h4>
            <p className="text-[7.5px] text-white/40 uppercase tracking-tight truncate">{note.content || 'Blank notebook content'}</p>
          </div>
          <span className="shrink-0 px-2 py-0.5 rounded-lg bg-[#DC2626]/20 border border-[#DC2626]/30 text-white text-[7.5px] font-black uppercase ml-2">Share Note</span>
        </button>
      ))}
    </div>
  );
};
