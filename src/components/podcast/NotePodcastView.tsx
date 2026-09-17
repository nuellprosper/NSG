import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ArrowLeft, Play, Pause, RotateCcw, SkipBack, 
  SkipForward, Sparkles, Send, Layers, MessageSquare, 
  Share2, Volume2, VolumeX, RefreshCw, Check, Copy, 
  CornerDownRight, X, AlertCircle, Bookmark, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  NotePodcast, 
  NotePodcastMessage, 
  PodcastSpeaker, 
  GenerationProgressStep 
} from '../../types/podcast';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { podcastAudioEngine } from '../../services/podcast/podcastAudioEngine';
import { SourceTraceabilityModal } from './SourceTraceabilityModal';
import { MaterialSelectionModal } from './MaterialSelectionModal';
import { NoteItem } from '../NotesVaultHome';
import { 
  generateUserInteractiveReply, 
  regenerateSingleMessage 
} from '../../services/podcast/orchestrator';

export interface NotePodcastViewProps {
  podcast: NotePodcast;
  note: NoteItem;
  userNotes?: NoteItem[];
  theme: 'light' | 'dark';
  onBack: () => void;
  onSavePodcast: (updatedPodcast: NotePodcast) => Promise<void>;
  onOpenPdf?: (pdfUrl: string, name: string) => void;
  onOpenImage?: (imageUrl: string) => void;
  isGenerating?: boolean;
  currentProgressStep?: GenerationProgressStep | null;
  onTriggerRegeneration?: (mode: 'entire_note' | 'folder', folderId?: string, folderName?: string) => void;
  onTriggerUpdateWithNewMaterial?: () => void;
  hasDetectedChanges?: boolean;
}

export const NotePodcastView: React.FC<NotePodcastViewProps> = ({
  podcast,
  note,
  userNotes = [],
  theme,
  onBack,
  onSavePodcast,
  onOpenPdf,
  onOpenImage,
  isGenerating = false,
  currentProgressStep,
  onTriggerRegeneration,
  onTriggerUpdateWithNewMaterial,
  hasDetectedChanges = false
}) => {
  const isDark = theme === 'dark';

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSpeechIndex, setActiveSpeechIndex] = useState<number | null>(null);
  const [lastResumeIndex, setLastResumeIndex] = useState<number>(podcast.audioState?.lastPlayedIndex || 0);

  // Inspector & Modal States
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [selectedMessageForSources, setSelectedMessageForSources] = useState<NotePodcastMessage | null>(null);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);

  // Composer & Interactive State
  const [userInput, setUserInput] = useState('');
  const [isSendingUserMessage, setIsSendingUserMessage] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<NotePodcastMessage | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null);

  // Mention Autocomplete
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');

  // Mobile Swipe-to-Reply
  const [swipedMessageId, setSwipedMessageId] = useState<string | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Scrolling & viewport
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const isUserScrolledUpRef = useRef<boolean>(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Initialize and synchronize audio engine
  useEffect(() => {
    podcastAudioEngine.setMessages(podcast.messages);
    podcastAudioEngine.initListeners(
      (idx) => {
        setActiveSpeechIndex(idx);
        if (idx !== null) {
          setLastResumeIndex(idx);
          // Auto scroll to message unless user scrolled
          if (!isUserScrolledUpRef.current) {
            const el = document.getElementById(`podcast-msg-${idx}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        }
      },
      (playing) => {
        setIsPlaying(playing);
      },
      () => {
        setIsPlaying(false);
        setActiveSpeechIndex(null);
      }
    );

    return () => {
      podcastAudioEngine.pause();
    };
  }, [podcast.messages]);

  // Track user scroll position
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    isUserScrolledUpRef.current = distanceFromBottom > 150;
  };

  // Audio Control Handlers
  const handlePlayToggle = () => {
    if (isPlaying) {
      podcastAudioEngine.pause();
    } else {
      const startIndex = activeSpeechIndex !== null ? activeSpeechIndex : lastResumeIndex;
      podcastAudioEngine.playFromIndex(startIndex);
    }
  };

  const handleSkipNext = () => {
    podcastAudioEngine.skipNext();
  };

  const handleSkipPrev = () => {
    podcastAudioEngine.skipPrevious();
  };

  const handlePlaySpecificMessage = (index: number) => {
    podcastAudioEngine.playFromIndex(index);
  };

  // User Interactive Message Handler
  const handleSendInteractiveMessage = async (textToSend?: string) => {
    const text = (textToSend || userInput).trim();
    if (!text || isSendingUserMessage || isGenerating) return;

    setUserInput('');
    setShowMentionSuggestions(false);
    setIsSendingUserMessage(true);

    const now = new Date().toISOString();
    const userMsgId = `user_${Math.random().toString(36).substring(7)}`;

    const userMsg: NotePodcastMessage = {
      id: userMsgId,
      podcastId: podcast.podcastId,
      speaker: 'user',
      text,
      replyToMessageId: replyingToMessage?.id,
      replyToSpeaker: replyingToMessage?.speaker,
      replyToTextSnippet: replyingToMessage?.text.slice(0, 100),
      createdAt: now,
      generationType: 'user_interaction',
      sourceVersion: podcast.podcastVersion
    };

    const currentReplyTarget = replyingToMessage;
    setReplyingToMessage(null);

    // Optimistically append user message
    const updatedMessages = [...podcast.messages, userMsg];
    const interimPodcast: NotePodcast = {
      ...podcast,
      messages: updatedMessages,
      updatedAt: now
    };
    await onSavePodcast(interimPodcast);

    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      // Build Knowledge Pack if available or construct lightweight pack
      const knowledgePack = podcast.knowledgePack || {
        noteId: note.id,
        noteTitle: note.title,
        noteVersion: 1,
        noteText: note.content || '',
        sources: Object.values(podcast.sourceGraph?.nodes || {}),
        topics: [],
        keyDefinitions: [],
        misconceptions: [],
        visualObservations: [],
        audioInsights: [],
        sourceGraph: podcast.sourceGraph,
        generatedAt: now
      };

      const replies = await generateUserInteractiveReply(
        text,
        currentReplyTarget,
        updatedMessages,
        knowledgePack
      );

      const newAiMessages: NotePodcastMessage[] = replies.map((rep, idx) => ({
        id: `${rep.speaker}_${Math.random().toString(36).substring(7)}`,
        podcastId: podcast.podcastId,
        speaker: rep.speaker,
        text: rep.text,
        sourceRefs: rep.sourceRefs,
        createdAt: new Date().toISOString(),
        generationType: 'user_interaction',
        sourceVersion: podcast.podcastVersion
      }));

      const finalMessages = [...updatedMessages, ...newAiMessages];
      const finalPodcast: NotePodcast = {
        ...podcast,
        messages: finalMessages,
        updatedAt: new Date().toISOString()
      };

      await onSavePodcast(finalPodcast);

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error("Failed to generate AI interactive reply:", err);
    } finally {
      setIsSendingUserMessage(false);
    }
  };

  // Targeted Single-Message Regeneration
  const handleRegenerateMessage = async (msg: NotePodcastMessage) => {
    if (regeneratingMessageId || msg.speaker === 'user') return;
    setRegeneratingMessageId(msg.id);

    try {
      const msgIndex = podcast.messages.findIndex(m => m.id === msg.id);
      const surrounding = podcast.messages.slice(Math.max(0, msgIndex - 2), Math.min(podcast.messages.length, msgIndex + 3));

      const knowledgePack = podcast.knowledgePack || {
        noteId: note.id,
        noteTitle: note.title,
        noteVersion: 1,
        noteText: note.content || '',
        sources: Object.values(podcast.sourceGraph?.nodes || {}),
        topics: [],
        keyDefinitions: [],
        misconceptions: [],
        visualObservations: [],
        audioInsights: [],
        sourceGraph: podcast.sourceGraph,
        generatedAt: new Date().toISOString()
      };

      const improvedText = await regenerateSingleMessage(msg, surrounding, knowledgePack);

      const updatedMessages = podcast.messages.map(m => {
        if (m.id === msg.id) {
          return {
            ...m,
            text: improvedText,
            generationType: 'regenerated' as const,
            isStale: false
          };
        }
        return m;
      });

      const updatedPodcast: NotePodcast = {
        ...podcast,
        messages: updatedMessages,
        updatedAt: new Date().toISOString()
      };

      await onSavePodcast(updatedPodcast);
    } catch (err) {
      console.error("Message regeneration error:", err);
    } finally {
      setRegeneratingMessageId(null);
    }
  };

  // Copy Message Text
  const handleCopyText = (msg: NotePodcastMessage) => {
    navigator.clipboard.writeText(`${msg.speaker.toUpperCase()}: ${msg.text}`);
    setCopiedMessageId(msg.id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Mobile Touch Handlers for Swipe-to-Reply
  const handleTouchStart = (e: React.TouchEvent, msg: NotePodcastMessage) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent, msg: NotePodcastMessage) => {
    if (!touchStartRef.current) return;
    const diffX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const diffY = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);

    // Swipe right gesture (> 60px horizontal, < 40px vertical deviation)
    if (diffX > 60 && diffY < 40) {
      setReplyingToMessage(msg);
      inputRef.current?.focus();
    }
    touchStartRef.current = null;
  };

  // Detect "@" for Autocomplete
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setUserInput(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos !== -1 && lastAtPos >= textBeforeCursor.length - 10) {
      const q = textBeforeCursor.slice(lastAtPos + 1).toLowerCase();
      setMentionQuery(q);
      setShowMentionSuggestions(true);
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const insertMention = (speaker: 'Omni' | 'Zeal') => {
    if (!inputRef.current) return;
    const val = userInput;
    const cursorPos = inputRef.current.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos !== -1) {
      const before = val.slice(0, lastAtPos);
      const after = val.slice(cursorPos);
      const replacement = `@${speaker} `;
      setUserInput(before + replacement + after);
    } else {
      setUserInput(`${val}@${speaker} `);
    }

    setShowMentionSuggestions(false);
    inputRef.current.focus();
  };

  const activePlayingMessage = activeSpeechIndex !== null && podcast.messages[activeSpeechIndex]
    ? podcast.messages[activeSpeechIndex]
    : null;

  return (
    <div className={`relative flex flex-col h-full w-full overflow-hidden ${
      isDark ? 'bg-[#0F0E17] text-white' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* Top Header Bar */}
      <div className={`flex items-center justify-between px-4 py-3 border-b z-20 shrink-0 backdrop-blur-md ${
        isDark ? 'bg-[#141320]/90 border-white/10' : 'bg-white/90 border-slate-200'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
              isDark ? 'hover:bg-white/10 text-slate-300 hover:text-white' : 'hover:bg-slate-100 text-slate-600'
            }`}
            title="Back to Note"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold truncate max-w-[220px] sm:max-w-md">
                {note.title || 'Untitled Note'}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30 shrink-0 hidden sm:inline-block">
                Omni & Zeal • Note Podcast
              </span>
            </div>
            <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Interactive study dialogue grounded in your note materials
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Prominent Play / Pause Button */}
          <button
            onClick={handlePlayToggle}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/30'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause size={14} className="fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={14} className="fill-current" />
                <span>{activeSpeechIndex !== null ? 'Resume' : 'Play Podcast'}</span>
              </>
            )}
          </button>

          {/* Source Graph Pill */}
          <button
            onClick={() => {
              setSelectedMessageForSources(null);
              setIsSourceModalOpen(true);
            }}
            className={`flex items-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              isDark 
                ? 'border-white/10 hover:bg-white/5 text-slate-300 hover:text-white' 
                : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
            title="Inspect Source Citations & Graph"
          >
            <Layers size={14} className="text-purple-400" />
            <span className="hidden sm:inline">Sources ({Object.keys(podcast.sourceGraph?.nodes || {}).length})</span>
          </button>

          {/* Options / Scope Button */}
          <button
            onClick={() => setIsOptionsModalOpen(true)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              hasDetectedChanges 
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-300' 
                : isDark ? 'border-white/10 hover:bg-white/5 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
            title="Podcast Options & Material Selection"
          >
            <RefreshCw size={15} className={hasDetectedChanges ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Floating Audio Sticky Bar when active or paused with progress */}
      {(isPlaying || activeSpeechIndex !== null) && (
        <div className={`px-4 py-2.5 border-b z-10 flex items-center justify-between gap-3 text-xs transition-colors ${
          isDark ? 'bg-[#181628] border-purple-500/20 text-slate-200' : 'bg-purple-50 border-purple-200 text-purple-950'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Waveform indicator */}
            <div className="flex items-center gap-0.5 h-4">
              <span className={`w-1 rounded-full bg-purple-500 ${isPlaying ? 'animate-bounce h-4' : 'h-2'}`} />
              <span className={`w-1 rounded-full bg-indigo-500 ${isPlaying ? 'animate-bounce h-3 delay-75' : 'h-1.5'}`} />
              <span className={`w-1 rounded-full bg-purple-400 ${isPlaying ? 'animate-bounce h-4 delay-150' : 'h-3'}`} />
            </div>

            <div className="min-w-0">
              <span className="font-bold uppercase tracking-wider text-[11px] text-purple-400">
                {activePlayingMessage?.speaker === 'omni' ? 'Omni Speaking' : (activePlayingMessage?.speaker === 'zeal' ? 'Zeal Speaking' : 'Speaking')}
              </span>
              <p className="text-[11px] truncate max-w-xs sm:max-w-md opacity-80">
                {activePlayingMessage?.text.slice(0, 70)}...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] opacity-70">
              Turn {(activeSpeechIndex || 0) + 1} of {podcast.messages.length}
            </span>

            <button
              onClick={handleSkipPrev}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-purple-200'
              }`}
              title="Previous message"
            >
              <SkipBack size={14} />
            </button>

            <button
              onClick={handlePlayToggle}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-purple-200'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current" />}
            </button>

            <button
              onClick={handleSkipNext}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-purple-200'
              }`}
              title="Next message"
            >
              <SkipForward size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Generation Progress Indicator Banner */}
      {isGenerating && (
        <div className={`p-4 border-b flex flex-col gap-2 z-10 ${
          isDark ? 'bg-purple-950/40 border-purple-500/30' : 'bg-purple-50 border-purple-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw size={15} className="animate-spin text-purple-400" />
              <span className="text-xs font-bold tracking-tight text-purple-300">
                {currentProgressStep?.label || 'Processing study material and generating podcast...'}
              </span>
            </div>
            <span className="text-[11px] text-purple-400 font-semibold animate-pulse">
              Google 3.1 Flash Grounding
            </span>
          </div>
          {currentProgressStep?.detail && (
            <p className="text-[11px] text-slate-400">{currentProgressStep.detail}</p>
          )}
        </div>
      )}

      {/* Messages Scroll Viewport */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-5 space-y-4 max-w-4xl mx-auto w-full"
      >
        {podcast.messages.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Sparkles size={24} className="animate-pulse" />
            </div>
            <h3 className="text-sm font-bold">No Discussion Generated Yet</h3>
            <p className={`text-xs max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Click below to choose whether to discuss the entire note or a specific folder.
            </p>
            <button
              onClick={() => setIsOptionsModalOpen(true)}
              className="mt-2 py-2.5 px-5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/30 cursor-pointer"
            >
              Choose Material & Create Podcast
            </button>
          </div>
        ) : (
          podcast.messages.map((msg, index) => {
            const isOmni = msg.speaker === 'omni';
            const isZeal = msg.speaker === 'zeal';
            const isUser = msg.speaker === 'user';
            const isCurrentlySpeaking = activeSpeechIndex === index;
            const hasSources = (msg.sourceRefs && msg.sourceRefs.length > 0) || false;

            return (
              <motion.div
                id={`podcast-msg-${index}`}
                key={msg.id || `msg-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onTouchStart={(e) => handleTouchStart(e, msg)}
                onTouchEnd={(e) => handleTouchEnd(e, msg)}
                className={`flex gap-3 transition-all ${isUser ? 'justify-end' : 'justify-start'} ${
                  isCurrentlySpeaking ? 'scale-[1.01]' : ''
                }`}
              >
                {/* AI Avatar */}
                {!isUser && (
                  <div 
                    onClick={() => handlePlaySpecificMessage(index)}
                    title="Click to play from here"
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-md cursor-pointer transition-transform hover:scale-105 ${
                      isOmni 
                        ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-blue-500/20' 
                        : 'bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-purple-500/20'
                    }`}
                  >
                    {isCurrentlySpeaking ? (
                      <Volume2 size={16} className="animate-pulse" />
                    ) : (
                      <span>{isOmni ? 'O' : 'Z'}</span>
                    )}
                  </div>
                )}

                {/* Message Body Container */}
                <div className={`flex flex-col gap-1.5 max-w-[88%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Speaker Label & Role */}
                  <div className="flex items-center gap-2 px-1">
                    <span className={`text-[11px] font-bold tracking-tight ${
                      isOmni ? 'text-blue-400' : isZeal ? 'text-purple-400' : 'text-slate-400'
                    }`}>
                      {isOmni ? 'Omni (Lead Tutor)' : isZeal ? 'Zeal (Discussion Partner)' : 'You'}
                    </span>

                    {msg.generationType === 'incremental' && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                        New Material
                      </span>
                    )}

                    {isCurrentlySpeaking && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 font-bold animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        Speaking
                      </span>
                    )}
                  </div>

                  {/* Quoted Reply Preview if user or AI replied */}
                  {msg.replyToTextSnippet && (
                    <div className={`p-2 rounded-xl border text-[11px] max-w-full flex items-center gap-2 opacity-80 ${
                      isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}>
                      <CornerDownRight size={12} className="text-purple-400 shrink-0" />
                      <span className="font-semibold text-purple-400 uppercase tracking-wider shrink-0 text-[10px]">
                        {msg.replyToSpeaker || 'Reply'}:
                      </span>
                      <span className="truncate italic">{msg.replyToTextSnippet}</span>
                    </div>
                  )}

                  {/* Message Bubble Card */}
                  <div className={`p-4 rounded-3xl border shadow-sm transition-all relative ${
                    isUser
                      ? 'bg-purple-600 text-white border-purple-500 rounded-tr-sm'
                      : isOmni
                        ? isDark
                          ? isCurrentlySpeaking 
                            ? 'bg-[#182032] border-cyan-500/50 shadow-cyan-500/10 ring-1 ring-cyan-500/30 rounded-tl-sm' 
                            : 'bg-[#141824] border-blue-500/20 rounded-tl-sm'
                          : isCurrentlySpeaking
                            ? 'bg-blue-50 border-blue-400 shadow-blue-200 ring-1 ring-blue-300 rounded-tl-sm text-slate-800'
                            : 'bg-white border-slate-200 rounded-tl-sm text-slate-800'
                        : isDark
                          ? isCurrentlySpeaking 
                            ? 'bg-[#20182C] border-purple-500/50 shadow-purple-500/10 ring-1 ring-purple-500/30 rounded-tl-sm' 
                            : 'bg-[#191424] border-purple-500/20 rounded-tl-sm'
                          : isCurrentlySpeaking
                            ? 'bg-purple-50 border-purple-400 shadow-purple-200 ring-1 ring-purple-300 rounded-tl-sm text-slate-800'
                            : 'bg-white border-slate-200 rounded-tl-sm text-slate-800'
                  }`}>
                    {/* Rendered Text with Markdown and Math */}
                    <div className="text-xs sm:text-sm leading-relaxed">
                      <MarkdownRenderer content={msg.text} />
                    </div>

                    {/* Footer Actions (Sources pill, Reply, Regenerate, Copy, Play) */}
                    <div className={`mt-3 pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-[11px] ${
                      isUser ? 'border-white/20 text-purple-100' : (isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500')
                    }`}>
                      <div className="flex items-center gap-1.5">
                        {/* Sources Pill */}
                        {!isUser && hasSources && (
                          <button
                            onClick={() => {
                              setSelectedMessageForSources(msg);
                              setIsSourceModalOpen(true);
                            }}
                            className={`flex items-center gap-1 py-1 px-2.5 rounded-full font-semibold transition-colors cursor-pointer ${
                              isDark ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300' : 'bg-purple-100 hover:bg-purple-200 text-purple-800'
                            }`}
                          >
                            <Bookmark size={11} />
                            <span>Sources ({msg.sourceRefs?.length})</span>
                          </button>
                        )}

                        {/* Play single message */}
                        {!isUser && (
                          <button
                            onClick={() => handlePlaySpecificMessage(index)}
                            className={`flex items-center gap-1 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                              isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                            }`}
                            title="Play this message aloud"
                          >
                            <Play size={11} className="fill-current" />
                            <span>Play</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Contextual Desktop Reply Button */}
                        {!isUser && (
                          <button
                            onClick={() => {
                              setReplyingToMessage(msg);
                              inputRef.current?.focus();
                            }}
                            className={`flex items-center gap-1 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                              isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                            }`}
                            title="Reply to this point"
                          >
                            <CornerDownRight size={11} />
                            <span>Reply</span>
                          </button>
                        )}

                        {/* Regenerate this specific message */}
                        {!isUser && (
                          <button
                            onClick={() => handleRegenerateMessage(msg)}
                            disabled={regeneratingMessageId === msg.id}
                            className={`flex items-center gap-1 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                              isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                            }`}
                            title="Regenerate this specific point"
                          >
                            <RefreshCw size={11} className={regeneratingMessageId === msg.id ? 'animate-spin' : ''} />
                            <span className="hidden sm:inline">Regenerate</span>
                          </button>
                        )}

                        {/* Copy button */}
                        <button
                          onClick={() => handleCopyText(msg)}
                          className={`p-1 rounded-lg transition-colors cursor-pointer ${
                            isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                          }`}
                          title="Copy text"
                        >
                          {copiedMessageId === msg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-9 h-9 rounded-2xl bg-slate-700 flex items-center justify-center font-bold text-xs shrink-0 text-white shadow-md">
                    U
                  </div>
                )}
              </motion.div>
            );
          })
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer Section */}
      <div className={`p-4 border-t shrink-0 z-20 backdrop-blur-md ${
        isDark ? 'bg-[#141320]/95 border-white/10' : 'bg-white/95 border-slate-200'
      }`}>
        <div className="max-w-4xl mx-auto flex flex-col gap-2 relative">
          {/* Active Reply Banner */}
          {replyingToMessage && (
            <div className={`flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs ${
              isDark ? 'bg-purple-950/30 border-purple-500/30 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-900'
            }`}>
              <div className="flex items-center gap-2 truncate">
                <CornerDownRight size={13} className="text-purple-400 shrink-0" />
                <span>Replying to <strong>{replyingToMessage.speaker.toUpperCase()}</strong>: "{replyingToMessage.text.slice(0, 70)}..."</span>
              </div>
              <button
                onClick={() => setReplyingToMessage(null)}
                className="p-1 hover:opacity-70 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Mention Autocomplete Suggestions Popup */}
          {showMentionSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`absolute bottom-full mb-2 left-0 w-64 rounded-2xl p-2 shadow-2xl border flex flex-col gap-1 z-30 ${
                isDark ? 'bg-[#1A1829] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 px-2 py-1">
                Mention Host
              </span>

              <button
                onClick={() => insertMention('Omni')}
                className={`flex items-center gap-2.5 p-2 rounded-xl text-left text-xs font-semibold cursor-pointer ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  O
                </div>
                <div>
                  <span className="block font-bold">@Omni</span>
                  <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Lead Academic Tutor</span>
                </div>
              </button>

              <button
                onClick={() => insertMention('Zeal')}
                className={`flex items-center gap-2.5 p-2 rounded-xl text-left text-xs font-semibold cursor-pointer ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-[10px]">
                  Z
                </div>
                <div>
                  <span className="block font-bold">@Zeal</span>
                  <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Second Lecturer & Partner</span>
                </div>
              </button>
            </motion.div>
          )}

          {/* Quick Suggestion Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[11px]">
            <button
              onClick={() => handleSendInteractiveMessage("Explain this more simply with an analogy.")}
              className={`px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors cursor-pointer ${
                isDark ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
            >
              💡 Explain more simply
            </button>
            <button
              onClick={() => handleSendInteractiveMessage("Give me a concrete real-world example.")}
              className={`px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors cursor-pointer ${
                isDark ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
            >
              🌍 Give an example
            </button>
            <button
              onClick={() => handleSendInteractiveMessage("What common mistakes do students make on this topic in exams?")}
              className={`px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors cursor-pointer ${
                isDark ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
            >
              ⚠️ Common exam traps
            </button>
            <button
              onClick={() => handleSendInteractiveMessage("@Omni and @Zeal, compare the main opposing perspectives here.")}
              className={`px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors cursor-pointer ${
                isDark ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
            >
              ⚖️ Compare perspectives
            </button>
          </div>

          {/* Input Box & Send Button */}
          <div className={`flex items-end gap-2 p-2 rounded-2xl border transition-all ${
            isDark ? 'bg-[#161426] border-white/10 focus-within:border-purple-500' : 'bg-slate-50 border-slate-200 focus-within:border-purple-500'
          }`}>
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendInteractiveMessage();
                }
              }}
              placeholder="Ask Omni and Zeal a question, or type @ to mention..."
              rows={1}
              className={`w-full p-1.5 bg-transparent resize-none text-xs sm:text-sm outline-none ${
                isDark ? 'text-white placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'
              }`}
            />

            <button
              onClick={() => handleSendInteractiveMessage()}
              disabled={!userInput.trim() || isSendingUserMessage || isGenerating}
              className={`p-2.5 rounded-xl transition-all shadow-md cursor-pointer shrink-0 ${
                userInput.trim() && !isSendingUserMessage && !isGenerating
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              {isSendingUserMessage ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Source Traceability & Citation Inspector Modal */}
      <SourceTraceabilityModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        graph={podcast.sourceGraph || { nodes: {}, edges: [], updatedAt: '' }}
        selectedMessage={selectedMessageForSources}
        allMessages={podcast.messages}
        onOpenPdf={onOpenPdf}
        onOpenImage={onOpenImage}
        theme={theme}
      />

      {/* Material Selection Modal for Regneration or Updating */}
      <MaterialSelectionModal
        isOpen={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
        note={note}
        userNotes={userNotes}
        existingPodcast={podcast}
        hasDetectedChanges={hasDetectedChanges}
        onStartGeneration={(mode, fId, fName) => {
          if (onTriggerRegeneration) {
            onTriggerRegeneration(mode, fId, fName);
          }
        }}
        onOpenExistingPodcast={() => {}}
        onContinueListening={() => handlePlayToggle()}
        onReviewSources={() => {
          setSelectedMessageForSources(null);
          setIsSourceModalOpen(true);
        }}
        onUpdatePodcast={() => {
          if (onTriggerUpdateWithNewMaterial) {
            onTriggerUpdateWithNewMaterial();
          }
        }}
        theme={theme}
      />
    </div>
  );
};
