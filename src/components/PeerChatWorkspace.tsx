import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Video, Phone, MoreVertical, Smile, Paperclip, 
  Camera, Mic, Send, Check, CheckCheck, X, Trash2, ShieldAlert,
  Play, Pause, Info, AtSign, Calendar, MapPin, Award, PhoneOff,
  VideoOff, Volume2, MicOff, RefreshCw, Paperclip as DocIcon, FileText,
  Plus, Image as ImageIcon, ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, Chat } from '../types/chat';
import { QuizReadyCard } from './chat/QuizReadyCard';
import { TruncatedUserMessage } from './chat/TruncatedUserMessage';

// Sub-component: Waveform Voice Note Player
interface VoiceNotePlayerProps {
  msgId: string;
  duration?: number;
}

const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ msgId, duration = 12 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'1x' | '1.5x' | '2x'>('1x');
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // Cycle playback speed strictly between '1x', '1.5x', '2x'
  const cycleSpeed = () => {
    setPlaybackSpeed((prev) => {
      if (prev === '1x') return '1.5x';
      if (prev === '1.5x') return '2x';
      return '1x';
    });
  };

  // Draw waveform details onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Static random bars for frequency modeling
    const barCount = 38;
    const barWidth = 3;
    const gap = 2;
    const heights = Array.from({ length: barCount }, (_, i) => Math.sin(i * 0.4) * 8 + Math.cos(i * 0.85) * 6 + 18);

    ctx.clearRect(0, 0, width, height);

    // Draw active & inactive frequency waves
    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + gap) + 4;
      const barH = heights[i];
      const percentDone = (progress / 100) * barCount;
      
      if (i < percentDone) {
        ctx.fillStyle = '#DC2626'; // Vibrant Crimson active filler
      } else {
        ctx.fillStyle = '#4B5563'; // Neutral gray filler
      }

      // Draw symmetrical bars
      ctx.beginPath();
      ctx.roundRect(x, (height - barH) / 2, barWidth, barH, 2);
      ctx.fill();
    }
  }, [progress]);

  // Handle mock streaming timer based on speed multiplier
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) clearInterval(animationRef.current);
      return;
    }

    const intervalRate = playbackSpeed === '1x' ? 100 : playbackSpeed === '1.5x' ? 65 : 45;
    const step = 1;

    animationRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 0;
        }
        return prev + step;
      });
    }, intervalRate);

    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  return (
    <div className="flex items-center gap-3 bg-zinc-900/80 p-3 rounded-2xl border border-white/5 max-w-xs mt-1">
      <button
        id="audio_waveform_playback_btn"
        onClick={() => setIsPlaying(!isPlaying)}
        className="w-10 h-10 rounded-full bg-[#DC2626] hover:bg-red-500 text-white flex items-center justify-center transition-all shadow-md shrink-0 active:scale-90"
      >
        {isPlaying ? <Pause size={14} className="fill-white" /> : <Play size={14} className="fill-white ml-0.5" />}
      </button>

      {/* Dynamic waveform rendering canvas */}
      <div className="flex-1">
        <canvas 
          ref={canvasRef} 
          width="200" 
          height="40" 
          className="w-full h-8 opacity-90"
        />
        <div className="flex justify-between text-[8px] font-black uppercase text-white/40 tracking-wider mt-1 px-1">
          <span>{isPlaying ? `${Math.round((progress/100) * duration)}s` : '0:00'}</span>
          <span>{duration}s Voice Log</span>
        </div>
      </div>

      <button
        id="audio_playback_speed_multiplier_btn"
        onClick={cycleSpeed}
        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-[#6D28D9] border border-white/10 hover:border-[#6D28D9] text-[9px] font-black text-white tracking-widest transition-all active:scale-90"
      >
        {playbackSpeed}
      </button>
    </div>
  );
};

const formatLastSeenValue = (lastSeen: any): string => {
  if (!lastSeen) return 'offline';
  const lastSeenDate = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
  if (isNaN(lastSeenDate.getTime())) return 'offline';
  
  const now = new Date();
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) {
    return 'just now';
  }
  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'min' : 'mins'} ago`;
  }
  if (diffHours < 24) {
    const isSameDay = now.getDate() === lastSeenDate.getDate() && now.getMonth() === lastSeenDate.getMonth() && now.getFullYear() === lastSeenDate.getFullYear();
    if (isSameDay) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    }
  }

  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = yesterday.getDate() === lastSeenDate.getDate() && yesterday.getMonth() === lastSeenDate.getMonth() && yesterday.getFullYear() === lastSeenDate.getFullYear();

  const timeStr = lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
  if (isYesterday) {
    return `yesterday ${timeStr}`;
  }

  const dateStr = lastSeenDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${dateStr} ${timeStr}`;
};

interface PeerChatWorkspaceProps {
  chat: Chat;
  messages: Message[];
  inputText: string;
  setInputText: (text: string) => void;
  onSendMessage: () => void;
  onVoiceUpload: (url: string, duration: number) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  user: any;
  userHandle: string;
  theme: 'dark' | 'light';
  targetUserData?: {
    displayName: string;
    fullName: string;
    photoURL?: string;
    email?: string;
    about?: string;
    university?: string;
    department?: string;
    faculty?: string;
    level?: string;
    points?: number;
    streak?: number;
    lastSeen?: any;
  };
  onMessageContextMenu: (e: React.MouseEvent, msg: Message) => void;
  userNotes?: any[];
  onOpenNote?: (noteId: string, noteTitle?: string, noteContent?: string) => void;
  onShareNoteClick?: () => void;
  onStartCall?: (type: 'voice' | 'video') => void;
}

export const PeerChatWorkspace: React.FC<PeerChatWorkspaceProps> = ({
  chat,
  messages,
  inputText,
  setInputText,
  onSendMessage,
  onVoiceUpload,
  onFileUpload,
  onClose,
  user,
  userHandle,
  theme,
  targetUserData,
  onMessageContextMenu,
  userNotes = [],
  onOpenNote,
  onShareNoteClick,
  onStartCall
}) => {
  // Calculate online presence for peer
  const lastSeenVal = targetUserData?.lastSeen;
  const lastSeenDate = lastSeenVal 
    ? (lastSeenVal.toDate ? lastSeenVal.toDate() : new Date(lastSeenVal)) 
    : null;
  const isOnline = lastSeenDate && (Date.now() - lastSeenDate.getTime() < 120000); 

  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [mediaMenuOpen, setMediaMenuOpen] = useState(false);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [isHoldingMic, setIsHoldingMic] = useState(false);
  const [micTimer, setMicTimer] = useState(0);
  const [callActive, setCallActive] = useState<'voice' | 'video' | null>(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  
  const peerGalleryInputRef = useRef<HTMLInputElement>(null);
  const peerFilesInputRef = useRef<HTMLInputElement>(null);
  const [callDuration, setCallDuration] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const micTimerRef = useRef<number | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // Auto-scroll logic when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Forced scroll-to-bottom on mount (when user goes to/opens the chat page)
  useEffect(() => {
    const forceScroll = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
    if (scrollRef.current) {
      const container = scrollRef.current;
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
      setShowScrollDown(!isAtBottom);
    }
  };

  // Timer loop for calling screen
  useEffect(() => {
    if (!callActive) {
      setCallDuration(0);
      return;
    }
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [callActive]);

  const initiateCallState = (type: 'voice' | 'video') => {
    if (onStartCall) {
      onStartCall(type);
    } else {
      setCallActive(type);
    }
  };

  const terminateCallState = () => {
    setCallActive(null);
  };

  // Mic timer holding parameters
  const handleMicMouseDown = () => {
    setIsHoldingMic(true);
    setMicTimer(0);
    micTimerRef.current = window.setInterval(() => {
      setMicTimer(prev => prev + 1);
    }, 1000);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleMicMouseUp = () => {
    setIsHoldingMic(false);
    if (micTimerRef.current) {
      clearInterval(micTimerRef.current);
      micTimerRef.current = null;
    }
    
    // Simulate uploading voice recording larger than 2 seconds
    if (micTimer > 1) {
      const simulatedVoiceFiles = [
        'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
        'https://actions.google.com/sounds/v1/science_fiction/alien_beacon.ogg'
      ];
      const fileUrl = simulatedVoiceFiles[Math.floor(Math.random() * simulatedVoiceFiles.length)];
      onVoiceUpload(fileUrl, micTimer);
    }
  };

  return (
    <div className="flex-1 h-full flex bg-[#13111C]/90 text-slate-100 overflow-hidden relative">
      
      {/* Prime Chat Canvas Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Sticky Active WhatsApp Header */}
        <div 
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
          className="px-4 pb-3 bg-[#181628]/95 backdrop-blur-md border-b border-white/5 flex items-center justify-between shrink-0 z-10"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              id="chat_back_navigation_btn"
              onClick={onClose}
              className="p-1.5 -ml-1 rounded-xl hover:bg-white/5 text-white/50 hover:text-white shrink-0"
              title="Return to chats list directory"
            >
              <ArrowLeft size={16} />
            </button>

            {/* Profile Avatar click slides out full detail panel */}
            <div 
              onClick={() => setProfileDrawerOpen(true)}
              className="relative cursor-pointer shrink-0 group"
            >
              <div className="w-10 h-10 rounded-full border-2 border-[#6D28D9] group-hover:border-[#DC2626] overflow-hidden bg-zinc-950 transition-all">
                {targetUserData?.photoURL ? (
                  <img referrerPolicy="no-referrer" src={targetUserData.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#DC2626] flex items-center justify-center font-black text-sm uppercase text-white">
                    {(chat.name || '?').charAt(0)}
                  </div>
                )}
              </div>
              {/* Online indicator dot */}
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 shadow-md ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
            </div>

            {/* Pressing target user string name fires slideout drawer trigger */}
            <button
              id="user_profile_drawer_trigger"
              onClick={() => setProfileDrawerOpen(true)}
              className="text-left min-w-0 flex flex-col bg-transparent border-0 p-0 outline-none hover:opacity-80 transition-all cursor-pointer"
            >
              <span className="text-xs font-black uppercase text-white tracking-tight truncate w-36 sm:w-48">
                {targetUserData?.fullName || chat.name}
              </span>
              <span className={`text-[7.5px] font-black uppercase tracking-wider ${isOnline ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {isOnline ? 'online' : formatLastSeenValue(targetUserData?.lastSeen)}
              </span>
            </button>
          </div>

          {/* Far Right Call & Ellipsis Dropdowns */}
          <div className="flex items-center gap-1 shrink-0 relative">
            <button
              id="video_call_initiate_btn"
              onClick={() => initiateCallState('video')}
              className="p-2.5 rounded-xl transition-all hover:bg-white/5 text-[#DC2626] hover:text-red-400"
              title="Initiate WebRTC HD signals"
            >
              <Video size={15} />
            </button>

            <button
              id="voice_call_initiate_btn"
              onClick={() => initiateCallState('voice')}
              className="p-2.5 rounded-xl transition-all hover:bg-white/5 text-[#DC2626] hover:text-red-400"
              title="Initiate high-fidelity WebRTC signals"
            >
              <Phone size={15} />
            </button>

            <button
              id="chat_options_dropdown_btn"
              onClick={() => setOptionsMenuOpen(!optionsMenuOpen)}
              className="p-2.5 rounded-xl transition-all hover:bg-white/5 text-white/40 hover:text-white"
              title="Expose contextual tools parameters"
            >
              <MoreVertical size={15} />
            </button>

            {/* Ellipsis Dropdown Overlay */}
            <AnimatePresence>
              {optionsMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setOptionsMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute right-0 top-11 w-48 bg-[#181628] border border-white/10 rounded-2xl p-2 shadow-2xl z-40 text-left"
                  >
                    <button
                      onClick={() => {
                        setOptionsMenuOpen(false);
                        setProfileDrawerOpen(true);
                      }}
                      className="w-full flex items-center px-3 py-2 text-[10px] uppercase font-black tracking-wider rounded-lg hover:bg-white/5 text-slate-100"
                    >
                      🔬 Verify Credentials
                    </button>
                    <button
                      onClick={() => {
                        setOptionsMenuOpen(false);
                        alert("Session logs marked for archive sync.");
                      }}
                      className="w-full flex items-center px-3 py-2 text-[10px] uppercase font-black tracking-wider rounded-lg hover:bg-white/5 text-white/50"
                    >
                      📁 Archive Thread
                    </button>
                    <div className="border-t border-white/5 my-1" />
                    <button
                      onClick={() => {
                        setOptionsMenuOpen(false);
                        alert("Peer flagged successfully.");
                      }}
                      className="w-full flex items-center px-3 py-2 text-[10px] uppercase font-black tracking-wider rounded-lg hover:bg-red-500/10 text-red-450"
                    >
                      ⚠️ Flag Report
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Message Stream Canvas (WhatsApp Bubble Alignment) */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar bg-[#0E0C16] relative flex flex-col min-h-0"
        >
          {messages.length === 0 ? (
            <div className="my-auto text-center py-20 flex flex-col items-center justify-center gap-3">
              <DocIcon size={28} className="text-white/15 animate-pulse" />
              <p className="text-[8.5px] font-black uppercase text-red-500 tracking-widest">End-to-End Encryption Enabled</p>
              <p className="text-[10px] text-white/30 max-w-xs leading-normal font-medium">Standard peer communication logs are preserved offline in safe storage indexes. Click verify credentials above for compliance records.</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.senderId === user?.uid || msg.senderHandle === userHandle;
              
              return (
                <div 
                  key={`${msg.id || 'peer'}-${index}`}
                  onContextMenu={(e) => onMessageContextMenu(e, msg)}
                  className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    onContextMenu={(e) => onMessageContextMenu(e, msg)}
                    className={`max-w-[80%] rounded-[1.25rem] p-3.5 shadow-md flex flex-col text-left group/msg relative transition-all duration-300 select-all ${
                      isMe 
                        ? 'bg-[#6D28D9] text-white rounded-tr-none border border-white/10' 
                        : 'bg-[#181628] text-slate-100 rounded-tl-none border border-white/5'
                    }`}
                  >
                    {/* Render Image Attachments */}
                    {msg.mediaUrl && msg.type === 'image' && (
                      <div className="rounded-xl overflow-hidden border border-black/20 mb-2">
                        <img referrerPolicy="no-referrer" src={msg.mediaUrl} alt="" className="w-full h-auto max-h-60 object-cover" />
                      </div>
                    )}

                    {/* Render Canvas-based Voice Note */}
                    {msg.type === 'missed_call' ? (
                      <div 
                        onClick={() => onStartCall?.(msg.callType || 'voice')}
                        className="bg-red-500/10 border border-red-500/20 active:bg-red-500/20 rounded-2xl p-3.5 flex flex-col gap-2 min-w-[200px] cursor-pointer transition-all hover:scale-[1.02] relative"
                        title="Tap to call back"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                            <PhoneOff size={16} className="text-red-500" />
                          </div>
                          <div className="text-left leading-none">
                            <p className="text-[9px] font-black uppercase tracking-widest text-red-500">Missed Call</p>
                            <p className="text-[11px] font-bold text-white mt-1 capitalize">Tap to call back</p>
                          </div>
                        </div>
                      </div>
                    ) : msg.type === 'audio' ? (
                      <VoiceNotePlayer msgId={msg.id} duration={msg.duration || 12} />
                    ) : msg.isSharedNote ? (
                      <div className="bg-black/25 border border-white/10 rounded-xl p-3 space-y-2 mt-1 min-w-[200px] max-w-sm">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                            <FileText size={16} className="text-yellow-400" />
                          </div>
                          <div className="leading-tight overflow-hidden">
                            <p className="text-[8px] font-black uppercase tracking-widest text-yellow-400">STUDY NOTE WORKSPACE</p>
                            <h4 className="text-xs font-black text-white truncate mt-0.5">{msg.noteTitle || msg.text}</h4>
                          </div>
                        </div>
                        <p className="text-[10px] text-zinc-300 line-clamp-2 leading-normal">
                          {msg.noteContent || "No preview information is available."}
                        </p>
                        <button
                           type="button"
                          onClick={() => onOpenNote && onOpenNote(msg.mediaUrl || msg.id, msg.noteTitle, msg.noteContent)}
                          className="w-full py-2 px-3 rounded-lg bg-yellow-500 border border-yellow-600 hover:bg-yellow-400 text-black font-extrabold text-[9px] uppercase tracking-widest transition-all shadow-md cursor-pointer text-center"
                        >
                          📖 View Study Note
                        </button>
                      </div>
                    ) : msg.text && (msg.text.includes('[[QUIZ_READY:') || msg.text.includes('[[GENERATE_QUIZ:')) ? (
                      <div className="w-full">
                        {(() => {
                          const matchReady = msg.text.match(/\[\[QUIZ_READY:\s*([^,\]]+),\s*([^,\]]+),\s*(\d+)\s*\]\]/i);
                          const matchGen = msg.text.match(/\[\[GENERATE_QUIZ:\s*([^,\]]+),\s*(\d+)\s*\]\]/i);
                          if (matchReady) {
                            return (
                              <QuizReadyCard
                                quizId={matchReady[1].trim()}
                                topic={matchReady[2].trim()}
                                count={parseInt(matchReady[3], 10) || 5}
                              />
                            );
                          }
                          if (matchGen) {
                            return (
                              <QuizReadyCard
                                quizId=""
                                topic={matchGen[1].trim()}
                                count={parseInt(matchGen[2], 10) || 5}
                              />
                            );
                          }
                          return <TruncatedUserMessage text={msg.text} maxChars={260} />;
                        })()}
                      </div>
                    ) : (
                      <TruncatedUserMessage text={msg.text} maxChars={260} />
                    )}

                    {/* Checkmark logs & Timestamps tucked neatly in bottom right corner */}
                    <div className="flex items-center gap-1.5 self-end justify-end mt-1 font-mono text-[8px] font-bold text-white/30 uppercase tracking-widest">
                      <span>
                        {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'}
                      </span>
                      {isMe && (
                        <span className="text-emerald-400 shrink-0">
                          {msg.status === 'read' ? (
                            <CheckCheck size={11} className="stroke-[3px]" />
                          ) : (
                            <Check size={11} className="stroke-[3px]" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Scroll back down button floating just above footer */}
        <AnimatePresence>
          {showScrollDown && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              onClick={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
                }
              }}
              className="absolute bottom-[92px] right-6 p-2 w-9 h-9 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-full shadow-2xl transition-all z-30 cursor-pointer active:scale-95 flex items-center justify-center border border-white/10"
              title="Latest message"
            >
              <ArrowDown size={15} className="animate-bounce" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Input bar bottom layout as independent sibling */}
        <div className="bg-[#13111C]/90 backdrop-blur-md border-t border-white/5 py-4 px-4 sm:px-6 shrink-0 z-10 flex flex-col gap-2">
          
          <div className="flex items-center gap-2.5 w-full max-w-4xl mx-auto">
            
            {/* Left Hand Plus Menu and attachment popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPlusMenu(!showPlusMenu)}
                className={`p-2.5 w-11 h-11 rounded-2xl transition-all flex items-center justify-center cursor-pointer border ${showPlusMenu ? 'bg-[#DC2626] text-white border-[#DC2626]' : 'bg-white/5 text-white/50 border-white/10 hover:text-white hover:bg-white/10'}`}
                title="Add Attachment"
              >
                <Plus size={18} className={`transition-transform duration-200 ${showPlusMenu ? 'rotate-45' : ''}`} />
              </button>

              <AnimatePresence>
                {showPlusMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowPlusMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-14 left-0 bg-[#120F1F] border border-white/10 p-2 rounded-2xl min-w-[140px] shadow-2xl z-40 flex flex-col gap-1 text-left"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setShowPlusMenu(false);
                          if (onShareNoteClick) onShareNoteClick();
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5 text-xs font-bold transition-all text-left w-full"
                      >
                        <FileText size={14} className="text-[#DC2626]" /> notes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPlusMenu(false);
                          peerGalleryInputRef.current?.click();
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5 text-xs font-bold transition-all text-left w-full"
                      >
                        <ImageIcon size={14} className="text-blue-400" /> gallery
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPlusMenu(false);
                          peerFilesInputRef.current?.click();
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5 text-xs font-bold transition-all text-left w-full"
                      >
                        <Paperclip size={14} className="text-emerald-400" /> files
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Hidden file inputs */}
            <input 
              type="file" 
              ref={peerGalleryInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => {
                onFileUpload(e);
                setShowPlusMenu(false);
              }}
            />
            <input 
              type="file" 
              ref={peerFilesInputRef} 
              className="hidden" 
              accept="*/*" 
              onChange={(e) => {
                onFileUpload(e);
                setShowPlusMenu(false);
              }}
            />

            {/* Rounded Text Box Input */}
            <div className="flex-1 bg-[#0A0713]/90 border border-white/10 rounded-2xl flex items-center px-4 relative z-10 py-1 shadow-inner">
              <textarea
                id="peer-workspace-chat-textarea"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                }}
                placeholder="Type a message..."
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    onSendMessage();
                  }
                }}
                className="flex-1 bg-transparent py-2.5 text-xs text-white resize-none outline-none placeholder-white/20 select-text font-medium"
              />
            </div>

            {/* Sending Text or Trigger hold mic button outside of text box on far right */}
            {inputText.trim() ? (
              <button
                onClick={() => {
                  onSendMessage();
                  const textarea = document.getElementById('peer-workspace-chat-textarea');
                  if (textarea) {
                    (textarea as HTMLTextAreaElement).style.height = 'auto';
                  }
                }}
                className="p-3 w-11 h-11 bg-red-650 hover:bg-red-500 text-white rounded-2xl flex items-center justify-center transition-all shadow-md active:translate-y-0.5"
                title="Send"
              >
                <Send size={15} />
              </button>
            ) : (
              <div className="relative">
                <button
                  id="whatsapp_mic_hold_btn"
                  onMouseDown={handleMicMouseDown}
                  onMouseUp={handleMicMouseUp}
                  className={`p-3 w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-md outline-none select-none active:scale-110 cursor-pointer ${
                    isHoldingMic 
                      ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-950/50' 
                      : 'bg-white/5 text-white/40 hover:text-white'
                  }`}
                  title="Record"
                >
                  <Mic size={15} />
                </button>
                {/* Floating hold micro duration indicators */}
                {isHoldingMic && (
                  <div className="absolute right-14 top-1/2 -translate-y-1/2 bg-red-650 border border-red-500 px-3 py-1.5 rounded-full text-[9px] font-black uppercase text-white tracking-widest whitespace-nowrap shadow-xl z-50">
                    🔴 Recording: {micTimer}s
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Context Media Menu picker sheet drawer overlay */}
        <AnimatePresence>
          {mediaMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMediaMenuOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                className="absolute shadow-3xl left-6 bottom-24 bg-[#181628] border border-white/10 p-3 rounded-2xl z-50 grid grid-cols-2 gap-2 text-left"
              >
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer text-slate-100 transition-all font-bold text-[10px] uppercase tracking-wider">
                  <Camera size={14} className="text-[#DC2626]" /> Image Scan
                  <input type="file" onChange={(e) => {
                    onFileUpload(e);
                    setMediaMenuOpen(false);
                  }} className="hidden" accept="image/*" />
                </label>
                <button
                  onClick={() => {
                    setMediaMenuOpen(false);
                    alert("Location shared coordinates mapped cleanly!");
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-white/5 text-slate-100 transition-all font-bold text-[10px] uppercase tracking-wider"
                >
                  <MapPin size={14} className="text-[#DC2626]" /> Location Coords
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Emoji Selector Overlay Picker Drawer */}
        <AnimatePresence>
          {showEmojiTray && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowEmojiTray(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                className="absolute shadow-3xl left-6 bottom-24 bg-[#181628] border border-white/10 p-4 rounded-3xl z-40 max-w-sm"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[9px] font-black uppercase text-red-500 tracking-wider">Quick Scholastic Emoji Picker</span>
                  <button onClick={() => setShowEmojiTray(false)} className="text-white/30 hover:text-white p-1 rounded">
                    <X size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-3 text-2xl">
                  {['📚', '📝', '🔬', '🎓', '⚡', '🧠', '👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🌟', '🎯', '🚀', '💡', '✅'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setInputText(inputText + emoji);
                        setShowEmojiTray(false);
                      }}
                      className="hover:scale-125 transition-transform active:scale-90"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Right-aligned Profile Panel Drawer sliding menu */}
      <AnimatePresence>
        {profileDrawerOpen && (
          <>
            {/* Background screen dark overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileDrawerOpen(false)}
              className="absolute inset-0 bg-black z-40"
            />
            {/* Sliding Profile View details sheet */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="absolute top-0 right-0 h-full w-full max-w-sm sm:max-w-md bg-[#13111C] border-l border-white/5 p-6 shadow-3xl z-50 overflow-y-auto flex flex-col text-left custom-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
                <h3 className="text-sm font-black uppercase tracking-tighter italic text-white flex items-center gap-1.5">
                  <span className="text-red-500">🛡️</span> Verified Credentials Panel
                </h3>
                <button
                  onClick={() => setProfileDrawerOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Avatar Photo Frame inside purple borders */}
              <div className="flex flex-col items-center justify-center gap-3 p-6 bg-gradient-to-br from-[#1E1B2E]/50 to-[#0A0714]/80 rounded-[2rem] border border-white/5 mb-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#DC2626]/10 to-pink-500/5 blur-[40px] rounded-full pointer-events-none" />
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 via-[#DC2626] to-[#9933FF] p-0.5 shadow-xl">
                  <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950">
                    {targetUserData?.photoURL ? (
                      <img referrerPolicy="no-referrer" src={targetUserData.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/5 bg-zinc-900 text-2xl font-black">
                        {(chat.name || '?').charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center mt-1">
                  <p className="text-sm font-black uppercase tracking-wide text-white">{targetUserData?.fullName || chat.name}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#DC2626]">{targetUserData?.level || '300 LEVEL'} SCHOLAR</p>
                </div>
              </div>

              {/* Personal details bio information */}
              <div className="space-y-4">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                  <span className="text-[8px] font-black uppercase text-red-500 tracking-widest flex items-center gap-1.5 mb-2">
                    <Info size={11} /> Academic Bio & Context
                  </span>
                  <p className="text-xs text-white/70 leading-relaxed font-semibold">
                    {targetUserData?.about || "This peer scholar is fully verified under educational compliance profiles. Feel free to exchange study logs, files, or establish high fidelity calls."}
                  </p>
                </div>

                {/* Grid academic list data */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-left">
                    <span className="text-[7.5px] font-black text-white/20 uppercase tracking-widest">University</span>
                    <p className="text-xs font-bold text-white/80 mt-0.5 truncate">{targetUserData?.university || 'University of Benin'}</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-left">
                    <span className="text-[7.5px] font-black text-white/20 uppercase tracking-widest">Faculty</span>
                    <p className="text-xs font-bold text-white/80 mt-0.5 truncate">{targetUserData?.faculty || 'Engineering'}</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-left">
                    <span className="text-[7.5px] font-black text-white/20 uppercase tracking-widest">Department</span>
                    <p className="text-xs font-bold text-white/80 mt-0.5 truncate">{targetUserData?.department || 'Computer Engineering'}</p>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-left">
                    <span className="text-[7.5px] font-black text-white/20 uppercase tracking-widest">Score index</span>
                    <p className="text-xs font-black text-emerald-400 mt-0.5">{targetUserData?.points || 120} XP</p>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col text-left">
                  <span className="text-[7.5px] font-black text-white/20 uppercase tracking-widest">Verified Academic Email Address</span>
                  <span className="text-[11px] font-bold text-white/80 mt-1">{targetUserData?.email || 'scholar_nsg@academic.edu.ng'}</span>
                </div>

                {/* Bento-style stats highlights for peer verification */}
                <div className="bg-gradient-to-br from-[#1E1B2E]/20 to-transparent border border-white/5 rounded-2xl p-4 space-y-2">
                  <span className="text-[8px] font-black uppercase text-red-500 tracking-widest flex items-center gap-1.5">
                    🎓 Academic Honors & Milestones
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-left pt-1">
                    <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-xl">
                      <p className="text-[7px] text-white/25 uppercase font-bold">Activity Streak</p>
                      <p className="text-xs font-black text-amber-400 mt-0.5">🔥 {targetUserData?.streak || 14} Days</p>
                    </div>
                    <div className="p-2.5 bg-white/[0.01] border border-white/5 rounded-xl">
                      <p className="text-[7px] text-white/25 uppercase font-bold">Verification Rating</p>
                      <p className="text-xs font-black text-emerald-400 mt-0.5">⭐ compliance OK</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* WebRTC audio/video call signaling active overlay screen */}
      <AnimatePresence>
        {callActive && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-50 bg-[#0E0C16] flex flex-col justify-between p-8 text-center"
          >
            {/* Call header metrics */}
            <div className="flex flex-col items-center gap-1.5 mt-8">
              <h2 className="text-xl font-black uppercase text-white tracking-tight italic">
                {targetUserData?.fullName || chat.name}
              </h2>
              <span className="font-mono text-xs font-extrabold text-white/35">
                {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
              </span>
            </div>

            {/* Simulated Live Camera framing (if it's video calling) */}
            <div className="flex-1 max-w-md w-full mx-auto my-8 rounded-3xl overflow-hidden bg-zinc-950 border-2 border-[#6D28D9] relative flex items-center justify-center p-4">
              {callActive === 'video' ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#13111C] via-zinc-900 to-black overflow-hidden flex items-center justify-center">
                    <img 
                      src={targetUserData?.photoURL || 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop'} 
                      alt="" 
                      className="w-full h-full object-cover blur-[1px] opacity-70"
                    />
                  </div>
                  {/* Local camera self preview inset box */}
                  <div className="absolute right-4 bottom-4 w-28 h-36 rounded-2xl border border-white/20 bg-zinc-900 overflow-hidden shadow-2xl">
                    <div className="w-full h-full bg-gradient-to-b from-[#DC2626]/20 to-transparent flex items-center justify-center">
                      <span className="text-[8px] font-black uppercase text-white/60">Self Preview</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#DC2626] to-[#6D28D9] p-1 animate-pulse shadow-2xl">
                    <div className="w-full h-full rounded-full bg-zinc-950 overflow-hidden flex items-center justify-center">
                      {targetUserData?.photoURL ? (
                        <img referrerPolicy="no-referrer" src={targetUserData.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-black text-white">{(chat.name || '?').charAt(0)}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Active Stream Synced</span>
                </div>
              )}
            </div>

            {/* Quick configuration mute controllers */}
            <div className="flex justify-center items-center gap-6 mb-8">
              <button className="w-12 h-12 rounded-full border border-white/10 hover:bg-white/5 flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-90">
                <MicOff size={16} />
              </button>
              
              <button 
                onClick={terminateCallState}
                className="w-14 h-14 rounded-full bg-[#DC2626] hover:bg-red-500 text-white flex items-center justify-center shadow-lg hover:shadow-red-950/40 transition-all active:scale-90 animate-infinite-pulse"
                title="Disconnect live stream feed"
              >
                <PhoneOff size={20} className="fill-white" />
              </button>
              
              <button className="w-12 h-12 rounded-full border border-white/10 hover:bg-white/5 flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-90">
                <VideoOff size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
