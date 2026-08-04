import React, { useState, useEffect, useRef } from 'react';
import { 
  Paperclip, Mic, Send, StopCircle, ArrowLeft, 
  Sparkles, Copy, User, BookOpen, FileText, X,
  Plus, Image as ImageIcon, ArrowDown, Loader2, Maximize2,
  Menu, ChevronDown, SquarePen, MoreHorizontal, ArrowUp, ArrowRight,
  Pin, Trash2, Edit3, Check, MoreVertical, MessageSquare, Zap, Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Message } from '../types/chat';

export interface OmniChatSession {
  id: string;
  title: string;
  timestamp: Date | string;
  isPinned?: boolean;
  messages: Message[];
}

// Embedded Typewriter and copyable Markdown element with rich text hierarchy
interface TypewriterTextProps {
  text: string;
  msgId: string;
  isOmniReply: boolean;
  onFinish?: () => void;
  onOpenQuizById?: (quizId: string) => void;
  generateQuiz?: (customTopic?: string, customCount?: number, customDifficulty?: any, forceNew?: boolean) => Promise<any>;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ text, msgId, isOmniReply, onFinish, onOpenQuizById, generateQuiz }) => {
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
      index += 6;
      if (index >= text.length) {
        setDisplayedText(text);
        setIsTyping(false);
        sessionStorage.setItem(`typed_msg_nsg_${msgId}`, 'true');
        clearInterval(interval);
        if (onFinish) onFinish();
      } else {
        setDisplayedText(text.substring(0, index));
      }
    }, 15);
    
    return () => clearInterval(interval);
  }, [text, msgId, isOmniReply, onFinish]);

  const quizReadyRegex = /\[\[QUIZ_READY:\s*([^,\]]+),\s*([^,\]]+),\s*(\d+)\s*\]\]/i;
  const quizGenRegex = /\[\[GENERATE_QUIZ:\s*([^,\]]+),\s*(\d+)\s*\]\]/i;
  
  const quizMatch = displayedText.match(quizReadyRegex);
  const quizGenMatch = displayedText.match(quizGenRegex);

  const cleanMarkdownText = displayedText
    .replace(quizReadyRegex, '')
    .replace(quizGenRegex, '')
    .trim();

  return (
    <div className="relative w-full">
      <ReactMarkdown 
        remarkPlugins={[remarkMath]} 
        rehypePlugins={[rehypeKatex]}
        components={{
          a({ node, href, children, ...props }: any) {
            const text = String(children || '');
            const lowerText = text.toLowerCase();
            const lowerHref = (href || '').toLowerCase();
            if (lowerText.includes('quiz') || lowerText.includes('generate') || lowerHref.includes('quiz')) {
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    const cleanTopic = text.replace(/generate|quiz|start|take|link|here/gi, '').trim() || 'Study Quiz';
                    if (generateQuiz) {
                      generateQuiz(cleanTopic, 5, 'Medium', true);
                    } else {
                      const evt = new CustomEvent('trigger_quiz_gen', { detail: { topic: cleanTopic, count: 5 } });
                      window.dispatchEvent(evt);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#DC2626] hover:bg-red-600 text-white font-bold text-xs rounded-lg shadow cursor-pointer my-1 transition-all"
                >
                  <Zap size={12} className="fill-white" />
                  <span>{text || 'Generate Quiz'}</span>
                </button>
              );
            }
            return <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-400 underline hover:text-purple-300" {...props}>{children}</a>;
          },
          h1({ children }) {
            return <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-4 mb-2 border-b border-white/10 pb-1 font-display">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-3 mb-1.5 font-display">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base sm:text-lg font-bold text-red-400 tracking-tight mt-2.5 mb-1 font-display">{children}</h3>;
          },
          strong({ children }) {
            return <strong className="font-extrabold text-white bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20">{children}</strong>;
          },
          p({ children }) {
            return <p className="my-2 leading-relaxed text-slate-100 text-sm sm:text-base font-normal">{children}</p>;
          },
          li({ children }) {
            return <li className="my-1 leading-relaxed text-sm sm:text-base font-normal text-slate-200">{children}</li>;
          },
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeVal = String(children).replace(/\n$/, '');
            return className && match ? (
              <div className="relative group/code my-3 rounded-xl overflow-hidden border border-white/10 bg-[#090810] font-mono w-full">
                <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between text-white/50 text-[9px] font-bold uppercase tracking-widest">
                  <span>{match[1]}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(codeVal);
                      const evt = new CustomEvent('show_global_notify', { detail: 'Code block copied!' });
                      window.dispatchEvent(evt);
                    }}
                    className="px-2 py-1 hover:bg-white/10 rounded text-red-400 transition-colors active:scale-95 text-[9px] font-bold uppercase"
                    title="Copy Code"
                  >
                    Copy Block
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-[12px] leading-relaxed text-slate-200">
                  <code {...props} className={className}>{children}</code>
                </pre>
              </div>
            ) : (
              <code {...props} className={`bg-white/10 px-1.5 py-0.5 rounded text-[12px] font-mono text-red-400 ${className || ''}`}>{children}</code>
            );
          }
        }}
      >
        {cleanMarkdownText}
      </ReactMarkdown>
      {isTyping && (
        <span className="inline-block w-2 h-4 bg-red-600 animate-pulse ml-1 align-middle" />
      )}

      {quizMatch && (
        <div className="mt-4 p-4 rounded-2xl bg-[#1A162B] border border-red-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-red-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Sparkles size={18} className="text-amber-300 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{quizMatch[2]}</p>
              <p className="text-[10px] text-white/60 font-medium">{quizMatch[3]} Questions Practice Quiz</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (onOpenQuizById) {
                onOpenQuizById(quizMatch[1]);
              }
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 via-rose-600 to-red-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shrink-0"
          >
            <span>Open & Take Quiz Now</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {quizGenMatch && !quizMatch && (
        <div className="mt-4 p-4 rounded-2xl bg-[#1A162B] border border-red-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Trophy size={18} className="text-amber-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{quizGenMatch[1]?.trim() || "Practice Quiz"}</p>
              <p className="text-[10px] text-white/60 font-medium">{quizGenMatch[2] || 5} Questions Set by Omni</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (generateQuiz) {
                generateQuiz(quizGenMatch[1]?.trim() || "Practice Quiz", parseInt(quizGenMatch[2], 10) || 5, 'Medium', true);
              } else {
                const evt = new CustomEvent('trigger_quiz_gen', { detail: { topic: quizGenMatch[1]?.trim(), count: parseInt(quizGenMatch[2], 10) || 5 } });
                window.dispatchEvent(evt);
              }
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 via-rose-600 to-red-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 shrink-0"
          >
            <span>⚡ Start & Generate Quiz</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

// Press and Hold hook (0.5s trigger)
const useLongPress = (onLongPress: () => void, ms = 500) => {
  const timerRef = useRef<any>(null);

  const start = () => {
    timerRef.current = setTimeout(() => {
      onLongPress();
    }, ms);
  };

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
  };
};

// User Message Item with Read More / Show Less truncation and Copy on Hold
const UserMessageItem: React.FC<{ 
  msg: Message; 
  user: any; 
  userHandle: string; 
  onZoomImage?: (url: string) => void; 
}> = ({ msg, onZoomImage }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const text = msg.text || '';
  const isLong = text.length > 220;
  const displayText = isLong && !isExpanded ? text.substring(0, 220) + '...' : text;

  const longPressProps = useLongPress(() => {
    setShowCopyPopup(true);
  }, 500);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setShowCopyPopup(false);
    const evt = new CustomEvent('show_global_notify', { detail: 'Message copied to clipboard!' });
    window.dispatchEvent(evt);
  };

  return (
    <div className="w-full py-2.5 px-3 sm:px-6 flex justify-end font-sans relative">
      <div className="max-w-[88%] sm:max-w-[75%] bg-[#1E1A2E]/90 border border-white/10 rounded-[22px] px-4 py-3 shadow-md text-left relative group select-text hover:border-white/20 transition-all">
        {msg.mediaUrl && (
          <div className="mb-2.5">
            <div 
              onClick={() => onZoomImage?.(msg.mediaUrl)}
              className="relative group/img max-w-[220px] h-36 rounded-xl overflow-hidden border border-white/15 bg-black/40 cursor-pointer shadow-lg hover:border-red-500/50 transition-all"
            >
              <img 
                referrerPolicy="no-referrer" 
                src={msg.mediaUrl} 
                alt="Attachment preview" 
                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover/img:opacity-100 transition-opacity flex items-end p-2">
                <span className="text-[8.5px] font-black uppercase text-white tracking-wider flex items-center gap-1 drop-shadow-md">
                  <Maximize2 size={10} className="text-red-400" /> Tap to view
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="text-sm font-medium tracking-tight text-white leading-relaxed whitespace-pre-wrap">
          {displayText}
          {isLong && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="text-xs font-bold text-red-400 hover:text-red-300 ml-1.5 focus:outline-none cursor-pointer hover:underline"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface OmniChatWorkspaceProps {
  messages: Message[];
  inputText: string;
  setInputText: (text: string) => void;
  isThinking: boolean;
  isRecording: boolean;
  onSendMessage: () => void;
  onStopGeneration: () => void;
  onStartVoiceRecord: () => void;
  onStopVoiceRecord: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadToCloudinary?: (file: File | Blob) => Promise<string>;
  onSendImageMessage?: (file: File, caption: string) => Promise<void>;
  onClose: () => void;
  user: any;
  userHandle: string;
  theme: 'dark' | 'light';
  userNotes?: any[];
  onOpenNote?: (id: string, title?: string, content?: string) => void;
  setAppActiveTab?: (tab: string) => void;
  setToolsSubTab?: (subTab: string) => void;
  setImportedQuizNote?: (note: any) => void;
  setQuizTopic?: (topic: string) => void;
  generateQuiz?: (customTopic?: string, customCount?: number, customDifficulty?: any, forceNew?: boolean) => Promise<any>;
  onOpenQuizById?: (quizId: string) => void;
  
  // History session handlers
  chatSessions?: OmniChatSession[];
  activeSessionId?: string | null;
  onSelectSession?: (id: string) => void;
  onNewChat?: () => void;
  onRenameSession?: (id: string, newTitle: string) => void;
  onPinSession?: (id: string) => void;
  onDeleteSession?: (id: string) => void;
}

export const OmniChatWorkspace: React.FC<OmniChatWorkspaceProps> = ({
  messages,
  inputText,
  setInputText,
  isThinking,
  isRecording,
  onSendMessage,
  onStopGeneration,
  onStartVoiceRecord,
  onStopVoiceRecord,
  onFileUpload,
  uploadToCloudinary,
  onSendImageMessage,
  onClose,
  user,
  userHandle,
  theme,
  userNotes = [],
  onOpenNote,
  setAppActiveTab,
  setToolsSubTab,
  setImportedQuizNote,
  setQuizTopic,
  generateQuiz,
  onOpenQuizById,
  chatSessions = [],
  activeSessionId,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onPinSession,
  onDeleteSession
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [viewingFullImageUrl, setViewingFullImageUrl] = useState<string | null>(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showNoteSelector, setShowNoteSelector] = useState(false);
  const [selectedImportedNote, setSelectedImportedNote] = useState<any>(null);
  const [attachedImage, setAttachedImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // State for session context menu (Rename, Pin, Delete)
  const [activeMenuSessionId, setActiveMenuSessionId] = useState<string | null>(null);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameTitleInput, setRenameTitleInput] = useState('');

  // Copy popup for Omni responses
  const [activeOmniCopyMsgId, setActiveOmniCopyMsgId] = useState<string | null>(null);

  const initiallyLoadedIdsRef = useRef<Set<string>>(new Set());
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    if (!initialLoadDone && messages.length > 0) {
      messages.forEach(m => {
        const idKey = m.id || `msg_hash_${m.text?.length || 0}_${(m.text || '').substring(0, 30)}`;
        initiallyLoadedIdsRef.current.add(idKey);
      });
      setInitialLoadDone(true);
    }
  }, [messages, initialLoadDone]);

  const handleImagePickerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file);
      setAttachedImage({ file, previewUrl });
    } else {
      onFileUpload(e);
    }
    setShowPlusMenu(false);
  };

  const handleSendWithImage = async () => {
    if (!attachedImage) return;
    try {
      setIsUploadingImage(true);
      if (onSendImageMessage) {
        await onSendImageMessage(attachedImage.file, inputText.trim());
      } else {
        onSendMessage();
      }
    } catch (err) {
      console.error("Error sending image message:", err);
    } finally {
      setIsUploadingImage(false);
      setAttachedImage(null);
      setInputText('');
    }
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  useEffect(() => {
    const forceScroll = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    };
    forceScroll();
    const t1 = setTimeout(forceScroll, 80);
    const t2 = setTimeout(forceScroll, 250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
      setShowScrollDown(!isAtBottom);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const loadSuggestion = (suggestion: string) => {
    setInputText(suggestion);
  };

  return (
    <div className="flex flex-col h-full bg-[#0F0E17] text-slate-100 overflow-hidden relative font-sans">
      
      {/* Top Header */}
      <div className="px-4 py-3 bg-[#0F0E17]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between shrink-0 z-10">
        <button 
          id="omni_back_nav_btn"
          onClick={() => setShowHistoryDrawer(true)}
          className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Chat History"
        >
          <Menu size={20} />
        </button>

        {/* Center Model Selector Dropdown - Strictly OMNI */}
        <div className="relative">
          <button 
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all cursor-pointer"
          >
            <span>Omni</span>
            <ChevronDown size={14} className="text-white/60" />
          </button>
        </div>

        {/* Right Action Icons: New Chat & Close */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              if (onNewChat) onNewChat();
            }}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Start New Chat"
          >
            <SquarePen size={18} />
          </button>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close Workspace"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* SLIDING CHAT HISTORY DRAWER */}
      <AnimatePresence>
        {showHistoryDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryDrawer(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-[#131020] border-r border-white/10 z-50 flex flex-col shadow-2xl p-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#DC2626]/20 border border-[#DC2626]/40 flex items-center justify-center text-[#DC2626]">
                    <Sparkles size={16} />
                  </div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider">Omni Chat History</h3>
                </div>
                <button 
                  onClick={() => setShowHistoryDrawer(false)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              {/* New Chat Button inside drawer */}
              <button
                onClick={() => {
                  if (onNewChat) onNewChat();
                  setShowHistoryDrawer(false);
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#DC2626] to-red-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:opacity-95 active:scale-95 transition-all mb-4"
              >
                <Plus size={16} />
                <span>Start New Omni Chat</span>
              </button>

              {/* Chat Sessions List */}
              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                {chatSessions.length === 0 ? (
                  <div className="text-center py-12 text-white/30 space-y-2">
                    <MessageSquare size={32} className="mx-auto text-white/20" />
                    <p className="text-xs font-bold uppercase">No Saved Chats Yet</p>
                    <p className="text-[10px] font-normal">Start asking Omni questions to save chat history!</p>
                  </div>
                ) : (
                  chatSessions.map((session) => {
                    const isActive = session.id === activeSessionId;
                    const isPinned = Boolean(session.isPinned);
                    const isRenaming = renamingSessionId === session.id;

                    return (
                      <div
                        key={session.id}
                        className={`relative group p-3 rounded-xl border transition-all ${
                          isActive 
                            ? 'bg-[#DC2626]/15 border-[#DC2626]/40 text-white shadow-md' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/80'
                        }`}
                      >
                        {isRenaming ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={renameTitleInput}
                              onChange={(e) => setRenameTitleInput(e.target.value)}
                              className="flex-1 bg-black/40 border border-white/20 rounded-lg px-2 py-1 text-xs text-white outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                if (onRenameSession && renameTitleInput.trim()) {
                                  onRenameSession(session.id, renameTitleInput.trim());
                                }
                                setRenamingSessionId(null);
                              }}
                              className="p-1 bg-emerald-600 text-white rounded-md text-[9px] font-bold"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setRenamingSessionId(null)}
                              className="p-1 bg-white/10 text-white/60 rounded-md text-[9px]"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div
                              onClick={() => {
                                if (onSelectSession) onSelectSession(session.id);
                                setShowHistoryDrawer(false);
                              }}
                              className="flex-1 min-w-0 cursor-pointer"
                            >
                              <div className="flex items-center gap-1.5">
                                {isPinned && <Pin size={12} className="text-yellow-400 shrink-0" />}
                                <h4 className="text-xs font-bold truncate text-white">
                                  {session.title || 'Omni Chat Session'}
                                </h4>
                              </div>
                              <p className="text-[9px] text-white/40 mt-0.5 truncate">
                                {typeof session.timestamp === 'string' ? session.timestamp : 'Recent session'}
                              </p>
                            </div>

                            {/* Three dots option trigger */}
                            <div className="relative shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuSessionId(activeMenuSessionId === session.id ? null : session.id);
                                }}
                                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                              >
                                <MoreVertical size={14} />
                              </button>

                              {/* Action Menu (Rename, Pin, Delete) */}
                              {activeMenuSessionId === session.id && (
                                <div className="absolute right-0 top-8 z-50 bg-[#1E1B2E] border border-white/15 rounded-xl p-1.5 shadow-2xl min-w-[120px] flex flex-col gap-1 text-left">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuSessionId(null);
                                      setRenamingSessionId(session.id);
                                      setRenameTitleInput(session.title);
                                    }}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-xs text-white/90 font-medium"
                                  >
                                    <Edit3 size={13} className="text-blue-400" /> Rename
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuSessionId(null);
                                      if (onPinSession) onPinSession(session.id);
                                    }}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-xs text-white/90 font-medium"
                                  >
                                    <Pin size={13} className={isPinned ? 'text-yellow-400' : 'text-white/40'} /> 
                                    {isPinned ? 'Unpin' : 'Pin'}
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuSessionId(null);
                                      if (onDeleteSession) onDeleteSession(session.id);
                                    }}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-xs text-red-400 font-medium"
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main scrolling viewport */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto w-full custom-scrollbar flex flex-col pt-4 pb-6 min-h-0"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto my-auto text-center gap-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 via-rose-600 to-red-600 p-0.5 shadow-xl">
              <div className="w-full h-full rounded-full bg-[#0F0E17] flex items-center justify-center text-white font-black text-xl">
                O
              </div>
            </div>
            
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">How can I help you today?</h1>
            </div>

            {/* Clean, minimalist suggestion pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mt-2 text-left">
              {[
                { 
                  title: 'Syllabus Review', 
                  prompt: 'Prepare a structured syllabus review guide for my upcoming exams.'
                },
                { 
                  title: 'Formula Cheat-Sheet', 
                  prompt: 'Generate an extensive formula cheat sheet covering key principles.'
                },
                { 
                  title: 'Practice CBT Quiz', 
                  prompt: 'Generate a 5-question practice quiz on my study topic.'
                },
                { 
                  title: 'Concept Breakdown', 
                  prompt: 'Explain complex concepts in simple, digestible terms.'
                }
              ].map((card, index) => (
                <button
                  key={index}
                  onClick={() => loadSuggestion(card.prompt)}
                  className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl transition-all cursor-pointer text-left focus:outline-none hover:shadow-lg active:scale-95 flex flex-col gap-1"
                >
                  <p className="text-xs font-bold text-white">{card.title}</p>
                  <p className="text-[11px] text-white/50 leading-snug font-normal">{card.prompt}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col w-full max-w-4xl mx-auto">
            {messages.map((msg, index) => {
              const isMe = msg.senderId === user?.uid || msg.senderHandle === userHandle;
              
              if (isMe) {
                return (
                  <UserMessageItem 
                    key={msg.id || index}
                    msg={msg}
                    user={user}
                    userHandle={userHandle}
                    onZoomImage={(url) => setViewingFullImageUrl(url)}
                  />
                );
              } else {
                const idKey = msg.id || `msg_hash_${msg.text?.length || 0}_${(msg.text || '').substring(0, 30)}`;
                const isNewResponse = initialLoadDone && !initiallyLoadedIdsRef.current.has(idKey);
                const isCopyActive = activeOmniCopyMsgId === (msg.id || String(index));

                return (
                  <div 
                    key={msg.id || index} 
                    className="w-full py-4 px-3 sm:px-6 flex flex-col text-left font-sans border-b border-white/[0.03] relative group"
                  >
                    {/* Omni Response text container */}
                    <div className="w-full min-w-0 select-text">
                      <TypewriterText 
                        text={msg.text} 
                        msgId={msg.id} 
                        isOmniReply={index === messages.length - 1 && isNewResponse} 
                        onOpenQuizById={onOpenQuizById}
                        generateQuiz={generateQuiz}
                      />
                    </div>

                    {/* Permanent clean action bar under each Omni response: Copy button only */}
                    <div className="mt-2.5 flex items-center justify-start gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(msg.text);
                          const evt = new CustomEvent('show_global_notify', { detail: 'Copied!' });
                          window.dispatchEvent(evt);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all border border-white/5 active:scale-95 cursor-pointer"
                        title="Copy response"
                      >
                        <Copy size={12} />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                );
              }
            })}

            {isThinking && (
              <div className="w-full py-4 px-3 sm:px-6 flex flex-col text-left">
                <div className="flex gap-1.5 items-center py-2">
                  <span className="w-2.5 h-2.5 bg-[#DC2626] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2.5 h-2.5 bg-[#DC2626] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2.5 h-2.5 bg-[#DC2626] rounded-full animate-bounce" />
                  <span className="text-xs font-bold text-white/40 ml-2 uppercase tracking-wider">Omni is thinking...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scroll back down button */}
      <AnimatePresence>
        {showScrollDown && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            onClick={() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
              }
            }}
            className="absolute bottom-24 right-6 w-9 h-9 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-2xl transition-all z-30 cursor-pointer active:scale-95 flex items-center justify-center border border-white/10"
            title="Latest message"
          >
            <ArrowDown size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Bottom Control Panel */}
      <div className="w-full bg-[#0F0E17]/90 backdrop-blur-md pb-4 pt-2 px-4 shrink-0 z-20 flex flex-col items-center">
        
        {/* Stop generation button */}
        <AnimatePresence>
          {isThinking && (
            <motion.button
              id="omni_stop_generation_btn"
              initial={{ scale: 0.9, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 10, opacity: 0 }}
              onClick={onStopGeneration}
              className="mb-2 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold text-xs shadow-lg transition-all flex items-center gap-2"
            >
              <StopCircle size={14} /> Stop
            </motion.button>
          )}
        </AnimatePresence>

        {/* Note Selector Overlay */}
        <AnimatePresence>
          {showNoteSelector && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full max-w-3xl bg-[#171424] border border-white/10 rounded-2xl p-3 mb-2 space-y-2 max-h-40 overflow-y-auto custom-scrollbar text-left"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-1">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={12} /> Select Academic Note
                </p>
                <button onClick={() => setShowNoteSelector(false)} className="text-white/40 hover:text-white">
                  <X size={12} />
                </button>
              </div>
              {userNotes.length === 0 ? (
                <p className="text-[10px] text-white/30 text-center py-4">No notes found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {userNotes.map(n => (
                    <button
                      key={n.id}
                      onClick={() => {
                        setSelectedImportedNote(n);
                        setShowNoteSelector(false);
                      }}
                      className="flex flex-col items-start p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left w-full cursor-pointer"
                    >
                      <span className="text-xs font-bold text-white line-clamp-1">{n.title || 'Untitled note'}</span>
                      <span className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{n.content ? n.content.substring(0, 80) : 'Empty note'}</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Imported Note Box */}
        <AnimatePresence>
          {selectedImportedNote && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-3xl bg-[#171424] border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3 text-left mb-2"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-red-400" />
                </div>
                <div className="truncate">
                  <h4 className="text-xs font-bold text-white truncate">{selectedImportedNote.title || 'Untitled Note'}</h4>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setInputText(`Please analyze and summarize this study note:\nTitle: ${selectedImportedNote.title}\nContent:\n${selectedImportedNote.content}`);
                    setSelectedImportedNote(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 text-white font-bold text-[10px] uppercase hover:bg-white/20 transition-all cursor-pointer"
                >
                  Analyze
                </button>
                <button
                  onClick={() => setSelectedImportedNote(null)}
                  className="p-1 hover:bg-white/10 rounded-lg text-white/50 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Draft Attached Image Container */}
        <AnimatePresence>
          {attachedImage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-3xl bg-[#171424] border border-white/10 rounded-2xl p-2.5 flex items-center justify-between gap-3 mb-2"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/15 shrink-0 bg-black">
                  <img src={attachedImage.previewUrl} alt="Attached draft" className="w-full h-full object-cover" />
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <Loader2 size={14} className="text-red-500 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="leading-tight overflow-hidden text-left">
                  <p className="text-xs text-white/80 font-medium truncate">{attachedImage.file.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAttachedImage(null);
                  setIsUploadingImage(false);
                }}
                className="p-1.5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all cursor-pointer"
                title="Remove attachment"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Bar Container */}
        <div className="w-full max-w-3xl bg-[#171424] border border-white/10 rounded-[32px] p-2 shadow-2xl flex items-center gap-2 relative">
          
          {/* Plus Attachment Button */}
          <div className="relative">
            <button
              type="button"
              id="omni_plus_menu_btn"
              onClick={() => setShowPlusMenu(!showPlusMenu)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border ${
                showPlusMenu 
                  ? 'bg-red-600 text-white border-red-500' 
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
              }`}
              title="Add content"
            >
              <Plus size={20} className={`transition-transform duration-200 ${showPlusMenu ? 'rotate-45' : ''}`} />
            </button>

            {/* Plus Menu Popup */}
            <AnimatePresence>
              {showPlusMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowPlusMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-14 left-0 bg-[#1A162B] border border-white/10 p-2 rounded-2xl min-w-[160px] shadow-2xl z-40 flex flex-col gap-1 text-left"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowPlusMenu(false);
                        setShowNoteSelector(!showNoteSelector);
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5 text-xs font-bold transition-all text-left w-full"
                    >
                      <BookOpen size={14} className="text-red-400" /> Notes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPlusMenu(false);
                        galleryInputRef.current?.click();
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5 text-xs font-bold transition-all text-left w-full"
                    >
                      <ImageIcon size={14} className="text-blue-400" /> Gallery
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPlusMenu(false);
                        fileInputRef.current?.click();
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5 text-xs font-bold transition-all text-left w-full"
                    >
                      <Paperclip size={14} className="text-emerald-400" /> Files
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleImagePickerChange}
            className="hidden"
            accept="image/*,application/pdf"
          />

          <input 
            type="file"
            ref={galleryInputRef}
            onChange={handleImagePickerChange}
            className="hidden"
            accept="image/*"
          />

          {/* Textarea */}
          <textarea
            id="omni-workspace-chat-textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                if (isUploadingImage) return;
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                if (attachedImage) {
                  e.preventDefault();
                  handleSendWithImage();
                } else {
                  handleKeyPress(e);
                }
              }
            }}
            placeholder={isUploadingImage ? 'Uploading image...' : isRecording ? 'Recording audio...' : 'Ask Omni...'}
            disabled={isRecording || isUploadingImage}
            rows={1}
            className="flex-1 bg-transparent px-2 py-2 text-sm text-white max-h-32 resize-none outline-none placeholder-white/30 select-text font-medium leading-relaxed disabled:opacity-50"
          />

          {/* Microphone and Send Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="omni_voice_record_btn"
              type="button"
              onClick={isRecording ? onStopVoiceRecord : onStartVoiceRecord}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isRecording ? 'bg-red-600 text-white animate-pulse' : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
              title="Voice"
            >
              <Mic size={18} />
            </button>

            {/* Circular Send Arrow Button matching reference screenshot */}
            <button
              id="omni_send_message_btn"
              type="button"
              disabled={!inputText.trim() && !attachedImage}
              onClick={() => {
                if (attachedImage) {
                  handleSendWithImage();
                } else {
                  onSendMessage();
                }
                const textarea = document.getElementById('omni-workspace-chat-textarea');
                if (textarea) {
                  (textarea as HTMLTextAreaElement).style.height = 'auto';
                }
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                (inputText.trim() || attachedImage)
                  ? 'bg-[#DC2626] hover:bg-red-500 text-white shadow-lg cursor-pointer active:scale-95'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
              title="Send"
            >
              <ArrowUp size={18} />
            </button>
          </div>

        </div>
      </div>

      {/* Full screen image modal preview */}
      <AnimatePresence>
        {viewingFullImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewingFullImageUrl(null)}
            className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          >
            <button
              onClick={() => setViewingFullImageUrl(null)}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-10"
            >
              <X size={20} />
            </button>
            <img
              referrerPolicy="no-referrer"
              src={viewingFullImageUrl}
              alt="Full view"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

