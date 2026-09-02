import React, { useState, useEffect, useRef } from 'react';
import { 
  Paperclip, Mic, ArrowLeft, 
  Copy, BookOpen, X,
  Plus, Image as ImageIcon, ArrowDown, Maximize2,
  ChevronDown, SquarePen, ArrowUp,
  Pin, Trash2, Edit3, Check, MessageSquare, Zap,
  Camera, Settings, Sparkles, Download, Pause, Play, StopCircle, RefreshCw, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Message } from '../../types/chat';
import { Capacitor } from '@capacitor/core';
import { 
  subscribeOmniBrainState, 
  startOrResumeOmniBrainDownload, 
  pauseOmniBrainDownload, 
  initOmniBrainStatus,
  isOmniBrainDownloaded,
  OmniBrainDownloadState,
  ESTIMATED_TOTAL_BYTES,
  requestMicrophonePermission
} from '../../lib/capacitor';
import { cleanupRAM } from '../../services/aiEngine';
import { getApiKey } from '../../utils';
import { ChatDrawer, OmniChatSession } from './ChatDrawer';
import { AudioPreviewGraph, RecordedAudioData } from './AudioPreviewGraph';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { QuizReadyCard } from './QuizReadyCard';
import { TruncatedUserMessage } from './TruncatedUserMessage';

export type { OmniChatSession, RecordedAudioData };

export interface OmniChatWorkspaceProps {
  messages: Message[];
  inputText: string;
  setInputText: (text: string) => void;
  isThinking: boolean;
  isRecording: boolean;
  currentStreamedText?: string;
  onSendMessage: () => void;
  onStopGeneration?: () => void;
  onStartVoiceRecord: () => void;
  onStopVoiceRecord: () => void;
  onSendAudioMessage?: (blob: Blob, url: string, duration: number, caption?: string) => Promise<void>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadToCloudinary?: (file: File | Blob) => Promise<string>;
  onSendImageMessage?: (file: File, caption: string) => Promise<void>;
  onClose?: () => void;
  user: any;
  userHandle: string;
  theme?: 'dark' | 'light';
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
  thinkingChatIds?: Record<string, boolean>;
  onSelectSession?: (id: string) => void;
  onNewChat?: () => void;
  onRenameSession?: (id: string, newTitle: string) => void;
  onPinSession?: (id: string) => void;
  onDeleteSession?: (id: string) => void;
}

// Clean topic helper for interactive quiz buttons
function cleanTopicName(raw: string) {
  return raw.replace(/generate|quiz|start|take|link|here/gi, '').trim() || 'Study Quiz';
}

export const OmniChatWorkspace: React.FC<OmniChatWorkspaceProps> = ({
  messages,
  inputText,
  setInputText,
  isThinking,
  isRecording,
  currentStreamedText = '',
  onSendMessage,
  onStopGeneration,
  onStartVoiceRecord,
  onStopVoiceRecord,
  onSendAudioMessage,
  onFileUpload,
  uploadToCloudinary,
  onSendImageMessage,
  onClose,
  user,
  userHandle,
  theme = 'dark',
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
  thinkingChatIds = {},
  onSelectSession,
  onNewChat,
  onRenameSession,
  onPinSession,
  onDeleteSession
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [showScrollDown, setShowScrollDown] = useState(false);
  const [viewingFullImageUrl, setViewingFullImageUrl] = useState<string | null>(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showNoteSelector, setShowNoteSelector] = useState(false);
  const [selectedImportedNote, setSelectedImportedNote] = useState<any>(null);
  const [attachedImage, setAttachedImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Audio Recording & Audio Preview Graph States
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveAudioBars, setLiveAudioBars] = useState<number[]>(new Array(28).fill(15));
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudioData | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<any>(null);
  const liveBarsIntervalRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Live streaming text state for immediate, smooth token streaming
  const [liveStreamText, setLiveStreamText] = useState<string>(currentStreamedText);

  // Gemini API key state verification upon mount
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  useEffect(() => {
    const key = getApiKey();
    setGeminiApiKey(key || '');
  }, []);

  // Synchronize prop updates to live stream state
  useEffect(() => {
    if (currentStreamedText) {
      setLiveStreamText(currentStreamedText);
    }
  }, [currentStreamedText]);

  // Model Selector Options: Omni Flash (Gemini) vs Omni Brain (Local Qwen on native)
  const isNative = Capacitor.isNativePlatform();
  const availableModels = [
    { 
      id: 'flash' as const, 
      label: 'Omni Flash',
      sub: 'Gemini Cloud Assistant',
      icon: Sparkles,
      color: 'text-red-400',
      activeBg: 'bg-red-600/20 text-red-300 border border-red-500/30',
      iconBg: 'bg-red-600/20 border-red-500/30'
    },
    ...(isNative ? [{ 
      id: 'brain' as const, 
      label: 'Omni Brain',
      sub: 'On-Device Local Qwen Model',
      icon: Zap,
      color: 'text-amber-400',
      activeBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      iconBg: 'bg-amber-500/20 border-amber-500/30'
    }] : [])
  ];

  // Selected Model State
  const [selectedModel, setSelectedModel] = useState<'flash' | 'brain'>(() => {
    if (!Capacitor.isNativePlatform()) return 'flash';
    return (localStorage.getItem('nsg_omni_selected_model') as 'flash' | 'brain') || 'flash';
  });

  useEffect(() => {
    if (!Capacitor.isNativePlatform() && selectedModel === 'brain') {
      setSelectedModel('flash');
      localStorage.setItem('nsg_omni_selected_model', 'flash');
    }
  }, [selectedModel]);

  // Auto-generate concise 3-5 word chat title after the first user & AI turn completes
  useEffect(() => {
    if (messages.length === 2 && onRenameSession && activeSessionId) {
      const currentSession = chatSessions.find(s => s.id === activeSessionId);
      const currentChatTitle = currentSession?.title || 'New Chat';
      if (
        currentChatTitle === 'New Chat' || 
        currentChatTitle === 'New Omni Chat' || 
        currentChatTitle.startsWith('New ') ||
        currentChatTitle === 'General Chat' ||
        currentChatTitle === 'General Omni Chat'
      ) {
        const userFirstPrompt = messages[0]?.text || '';
        if (userFirstPrompt && userFirstPrompt.trim()) {
          const words = userFirstPrompt.trim().split(/\s+/);
          const generatedTitle = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
          onRenameSession(activeSessionId, generatedTitle);
        }
      }
    }
  }, [messages.length, activeSessionId, chatSessions, onRenameSession]);

  const markdownComponents = {
    a({ node, href, children, ...props }: any) {
      const childText = String(children || '');
      const lowerHref = String(href || '').toLowerCase();
      if (lowerHref.includes('generate_quiz') || lowerHref.includes('quiz_ready') || lowerHref.startsWith('#quiz-gen:')) {
        return (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              const cleanTopic = cleanTopicName(childText.replace(/take\s*quiz:?/i, '').trim() || 'Study Quiz');
              if (generateQuiz) {
                generateQuiz(cleanTopic, 5, 'Medium', true);
              } else {
                const evt = new CustomEvent('trigger_quiz_gen', { detail: { topic: cleanTopic, count: 5 } });
                window.dispatchEvent(evt);
              }
            }}
            className="inline-flex items-center gap-1.5 my-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-rose-600 to-red-600 text-white font-bold text-xs uppercase tracking-wider shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <span>⚡ Take Quiz: {cleanTopicName(childText)}</span>
          </button>
        );
      }
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-red-400 hover:text-red-300 underline font-medium break-all"
          {...props}
        >
          {children}
        </a>
      );
    },
    h1({ children }: any) {
      return <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-4 mb-2 [overflow-wrap:anywhere] break-words">{children}</h1>;
    },
    h2({ children }: any) {
      return <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-3 mb-2 [overflow-wrap:anywhere] break-words">{children}</h2>;
    },
    h3({ children }: any) {
      return <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-3 mb-1.5 [overflow-wrap:anywhere] break-words">{children}</h3>;
    },
    p({ children }: any) {
      return <p className="text-sm sm:text-base font-normal leading-relaxed text-slate-100 mb-3 [overflow-wrap:anywhere] break-words">{children}</p>;
    },
    ul({ children }: any) {
      return <ul className="list-disc pl-5 space-y-1.5 mb-3 text-sm sm:text-base text-slate-100 [overflow-wrap:anywhere]">{children}</ul>;
    },
    ol({ children }: any) {
      return <ol className="list-decimal pl-5 space-y-1.5 mb-3 text-sm sm:text-base text-slate-100 [overflow-wrap:anywhere]">{children}</ol>;
    },
    li({ children }: any) {
      return <li className="leading-relaxed [overflow-wrap:anywhere]">{children}</li>;
    },
    table({ children }: any) {
      return (
        <div className="w-full overflow-x-auto my-4 rounded-2xl border border-white/10 bg-white/[0.02] max-w-full">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">{children}</table>
        </div>
      );
    },
    th({ children }: any) {
      return <th className="p-3 bg-white/10 font-bold text-white border-b border-white/10">{children}</th>;
    },
    td({ children }: any) {
      return <td className="p-3 border-b border-white/5 text-slate-200">{children}</td>;
    },
    code({ inline, className, children, ...props }: any) {
      return inline ? (
        <code className="px-1.5 py-0.5 rounded-lg bg-white/10 text-red-300 font-mono text-xs font-semibold [overflow-wrap:anywhere] break-all" {...props}>
          {children}
        </code>
      ) : (
        <div className="relative my-3 rounded-2xl overflow-hidden bg-[#13111C] border border-white/10 font-mono text-xs w-full max-w-full shadow-lg">
          <div className="flex items-center justify-between px-3.5 py-2 bg-white/5 border-b border-white/5 text-white/50 text-[10px]">
            <span className="font-bold uppercase tracking-wider">Snippet</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(String(children));
                const evt = new CustomEvent('show_global_notify', { detail: 'Code copied!' });
                window.dispatchEvent(evt);
              }}
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <Copy size={11} /> Copy
            </button>
          </div>
          <pre className="p-3.5 overflow-x-auto text-slate-200 w-full">
            <code>{children}</code>
          </pre>
        </div>
      );
    }
  };

  const renderAiMessageWithQuizCards = (text: string) => {
    if (!text) return null;

    const quizRegex = /\[\[QUIZ_READY:\s*([^,\]]+),\s*([^,\]]+),\s*(\d+)\s*\]\]|\[\[GENERATE_QUIZ:\s*([^,\]]+),\s*(\d+)\s*\]\]/g;
    
    if (!quizRegex.test(text)) {
      return (
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkMath]} 
          rehypePlugins={[rehypeKatex]}
          components={markdownComponents}
        >
          {text}
        </ReactMarkdown>
      );
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    const regexInstance = new RegExp(/\[\[QUIZ_READY:\s*([^,\]]+),\s*([^,\]]+),\s*(\d+)\s*\]\]|\[\[GENERATE_QUIZ:\s*([^,\]]+),\s*(\d+)\s*\]\]/g);

    while ((match = regexInstance.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const textBefore = text.slice(lastIndex, match.index).trim();
        if (textBefore) {
          parts.push(
            <ReactMarkdown
              key={`md-before-${lastIndex}`}
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={markdownComponents}
            >
              {textBefore}
            </ReactMarkdown>
          );
        }
      }

      if (match[1]) {
        const qId = match[1].trim();
        const qTopic = match[2].trim();
        const qCount = parseInt(match[3], 10) || 5;
        parts.push(
          <QuizReadyCard
            key={`quiz-ready-${match.index}`}
            quizId={qId}
            topic={qTopic}
            count={qCount}
            onOpenQuizById={onOpenQuizById}
            generateQuiz={generateQuiz}
          />
        );
      } else if (match[4]) {
        const gTopic = match[4].trim();
        const gCount = parseInt(match[5], 10) || 5;
        parts.push(
          <QuizReadyCard
            key={`quiz-gen-${match.index}`}
            quizId=""
            topic={gTopic}
            count={gCount}
            onOpenQuizById={onOpenQuizById}
            generateQuiz={generateQuiz}
          />
        );
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      const textAfter = text.slice(lastIndex).trim();
      if (textAfter) {
        parts.push(
          <ReactMarkdown
            key={`md-after-${lastIndex}`}
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={markdownComponents}
          >
            {textAfter}
          </ReactMarkdown>
        );
      }
    }

    return <div className="space-y-2 w-full max-w-full overflow-hidden">{parts}</div>;
  };
  const [brainDownloadState, setBrainDownloadState] = useState<OmniBrainDownloadState>({
    status: 'idle',
    downloadedBytes: 0,
    totalBytes: ESTIMATED_TOTAL_BYTES,
    progressPercent: 0,
    speedFormatted: '0 KB/s',
    downloadedFormatted: '0 MB',
    totalFormatted: '398.5 MB',
    error: null,
    modelPath: null,
    lastUpdated: Date.now()
  });

  const checkIsBrainDownloaded = () => {
    if (typeof window === 'undefined') return false;
    return isOmniBrainDownloaded();
  };

  const [hasBrainModel, setHasBrainModel] = useState<boolean>(() => checkIsBrainDownloaded());

  useEffect(() => {
    initOmniBrainStatus();
    setHasBrainModel(checkIsBrainDownloaded());
    const unsub = subscribeOmniBrainState((state) => {
      setBrainDownloadState({ ...state });
      if (state.status === 'completed' || state.progressPercent >= 100 || state.modelPath || isOmniBrainDownloaded()) {
        setHasBrainModel(true);
      }
    });
    return () => unsub();
  }, []);

  // Listen to custom stream events for real-time live token rendering
  useEffect(() => {
    const handleStreamChunk = (e: any) => {
      const chunk = e.detail?.chunk || e.detail?.text || '';
      if (chunk) {
        setLiveStreamText(prev => prev + chunk);
      }
    };
    const handleStreamReset = () => {
      setLiveStreamText('');
    };
    window.addEventListener('omni_stream_chunk', handleStreamChunk);
    window.addEventListener('omni_stream_reset', handleStreamReset);
    return () => {
      window.removeEventListener('omni_stream_chunk', handleStreamChunk);
      window.removeEventListener('omni_stream_reset', handleStreamReset);
    };
  }, []);

  // Outside-click detection for dropdowns & attachment menu (+ popup)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (showPlusMenu && !target.closest('#omni_plus_menu_container') && !target.closest('#omni_plus_menu_btn')) {
        setShowPlusMenu(false);
      }
      if (showModelDropdown && !target.closest('#omni_model_dropdown_container') && !target.closest('#omni_model_btn')) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showPlusMenu, showModelDropdown]);

  // Auto-scroll to bottom on incoming messages or streaming text
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isThinking, liveStreamText]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollDown(!isNearBottom);
  };

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
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Auto-expanding textarea up to max-h-36 (~144px)
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const target = e.target;
    target.style.height = 'auto';
    const newHeight = Math.min(target.scrollHeight, 144);
    target.style.height = `${newHeight}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isUploadingImage) return;
      if (attachedImage) {
        handleSendWithImage();
      } else if (inputText.trim()) {
        setLiveStreamText('');
        onSendMessage();
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  const handleModelSelect = (model: 'flash' | 'brain') => {
    setSelectedModel(model);
    localStorage.setItem('nsg_omni_selected_model', model);
    setShowModelDropdown(false);
    setHasBrainModel(checkIsBrainDownloaded());
  };

  // 🎙️ Audio Recording & Preview Handlers
  const startAudioRecording = async () => {
    try {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        console.warn("Microphone permission was not granted.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      audioStreamRef.current = stream;

      const mimeType = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        
        // Generate realistic dynamic waveform bars
        const baseBars = [20, 35, 60, 85, 45, 90, 70, 40, 25, 55, 78, 95, 60, 30, 80, 100, 75, 45, 20, 65, 40, 70, 85, 50, 30, 60, 90, 40];
        const waveform = baseBars.map(b => Math.max(15, Math.min(100, b + Math.floor(Math.random() * 24) - 12)));

        setRecordedAudio({
          blob: audioBlob,
          url,
          duration: recordingSeconds || 1,
          waveform,
          mimeType: recorder.mimeType || 'audio/webm'
        });
        setIsRecordingAudio(false);
      };

      recorder.start(100);
      setIsRecordingAudio(true);
      setRecordingSeconds(0);

      // Start recording timer
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      // Live animated waveform pulse
      if (liveBarsIntervalRef.current) clearInterval(liveBarsIntervalRef.current);
      liveBarsIntervalRef.current = setInterval(() => {
        const dynamicBars = Array.from({ length: 28 }, () => Math.floor(Math.random() * 70) + 20);
        setLiveAudioBars(dynamicBars);
      }, 90);

    } catch (err) {
      console.error("Failed to start voice recording:", err);
      setIsRecordingAudio(false);
    }
  };

  const stopAudioRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (liveBarsIntervalRef.current) clearInterval(liveBarsIntervalRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }
  };

  const cancelAudioRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (liveBarsIntervalRef.current) clearInterval(liveBarsIntervalRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecordingAudio(false);
    setRecordingSeconds(0);
  };

  const discardRecordedAudio = () => {
    if (recordedAudio?.url) {
      URL.revokeObjectURL(recordedAudio.url);
    }
    setRecordedAudio(null);
  };

  const handleSendRecordedAudio = async () => {
    if (!recordedAudio) return;
    const audioToSend = recordedAudio;
    const caption = inputText.trim();

    // Clear state
    setRecordedAudio(null);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    if (onSendAudioMessage) {
      await onSendAudioMessage(
        audioToSend.blob,
        audioToSend.url,
        audioToSend.duration,
        caption
      );
    } else {
      onSendMessage();
    }
  };

  // Safe Native Microphone Permission & Record Trigger fallback
  const handleVoiceRecordClick = async () => {
    if (isRecordingAudio) {
      stopAudioRecording();
      return;
    }
    await startAudioRecording();
  };

  // Cleanup recorders and flush offline AI model from device RAM on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (liveBarsIntervalRef.current) clearInterval(liveBarsIntervalRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => t.stop());
      }
      // Guarantee the model is flushed from device RAM the moment the user leaves the chat page
      cleanupRAM().catch(err => console.warn('RAM cleanup note:', err));
    };
  }, []);

  const isBrainDownloading = brainDownloadState.status === 'downloading';
  const isBrainCompleted = brainDownloadState.status === 'completed' || brainDownloadState.progressPercent >= 100 || hasBrainModel;
  const isBrainPaused = brainDownloadState.status === 'paused';

  return (
    <div className="flex flex-col h-full bg-[#0F0E17] text-slate-100 overflow-hidden relative font-sans w-full">
      
      {/* 1. HEADER BAR (GEMINI MOBILE CLONE) */}
      <div 
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
        className="px-4 pb-3 bg-[#0F0E17]/95 backdrop-blur-md border-b border-white/5 flex items-center justify-between shrink-0 z-30"
      >
        {/* Left Icon: Two-stroke / double-line menu button (=) */}
        <button 
          id="omni_history_drawer_btn"
          type="button"
          onClick={() => setShowHistoryDrawer(true)}
          className="p-2 rounded-2xl text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex flex-col justify-center gap-1.5 w-10 h-10 items-center shrink-0 border border-white/5"
          title="Open Chat History"
        >
          <div className="w-5 h-[2.5px] bg-white/90 rounded-full" />
          <div className="w-5 h-[2.5px] bg-white/90 rounded-full" />
        </button>

        {/* Center: Dropdown selector showing current model ("Omni Flash ▾" / "Omni Brain ▾") */}
        <div id="omni_model_dropdown_container" className="relative">
          <button 
            id="omni_model_btn"
            type="button"
            onClick={() => {
              if (availableModels.length > 1) {
                setShowModelDropdown(!showModelDropdown);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <div className="flex items-center gap-1.5">
              {selectedModel === 'brain' ? (
                <Zap size={14} className="text-amber-400 fill-amber-400/20" />
              ) : (
                <Sparkles size={14} className="text-red-400 fill-red-400/20" />
              )}
              <span>{selectedModel === 'brain' ? 'Omni Brain' : 'Omni Flash'}</span>
            </div>
            {availableModels.length > 1 && (
              <ChevronDown size={14} className={`text-white/60 transition-transform duration-200 ${showModelDropdown ? 'rotate-180' : ''}`} />
            )}
          </button>

          {/* Model Dropdown Popup */}
          <AnimatePresence>
            {showModelDropdown && availableModels.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-12 left-1/2 -translate-x-1/2 bg-[#171424] border border-white/15 p-2 rounded-2xl min-w-[250px] shadow-2xl z-50 flex flex-col gap-1.5 text-left backdrop-blur-xl"
              >
                {availableModels.map((model) => {
                  const isSelected = selectedModel === model.id;
                  const IconComponent = model.icon;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => handleModelSelect(model.id)}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-medium transition-all w-full cursor-pointer ${
                        isSelected 
                          ? model.activeBg 
                          : 'text-white/80 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl ${model.iconBg} flex items-center justify-center ${model.color} shrink-0`}>
                          <IconComponent size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-white leading-tight">{model.label}</p>
                            {model.id === 'brain' && hasBrainModel && (
                              <span className="px-1.5 py-0.2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[8px] font-black rounded uppercase">
                                Ready
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-white/50">{model.sub}</p>
                        </div>
                      </div>
                      {isSelected && <Check size={16} className={model.color} />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Icons: New Chat button (SquarePen) & Close (X) button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            id="omni_new_chat_btn"
            type="button"
            onClick={() => {
              if (onNewChat) onNewChat();
              setLiveStreamText('');
            }}
            className="p-2 rounded-2xl text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer border border-white/5"
            title="New Chat"
          >
            <SquarePen size={19} />
          </button>

          <button 
            id="omni_close_btn"
            type="button"
            onClick={() => {
              if (onClose) {
                onClose();
              } else if (setAppActiveTab) {
                setAppActiveTab('home');
              }
            }}
            className="p-2 rounded-2xl text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer border border-white/5"
            title="Close Chat"
          >
            <X size={19} />
          </button>
        </div>
      </div>

      {/* 2. SLIDE-OUT HISTORY DRAWER COMPONENT */}
      <ChatDrawer
        isOpen={showHistoryDrawer}
        onClose={() => setShowHistoryDrawer(false)}
        chatSessions={chatSessions}
        activeSessionId={activeSessionId}
        thinkingChatIds={thinkingChatIds}
        onSelectSession={(id) => {
          if (onSelectSession) onSelectSession(id);
          setLiveStreamText('');
        }}
        onNewChat={() => {
          if (onNewChat) onNewChat();
          setLiveStreamText('');
        }}
        onRenameSession={onRenameSession}
        onPinSession={onPinSession}
        onDeleteSession={onDeleteSession}
        user={user}
        userHandle={userHandle}
        onOpenSettings={() => {
          if (setAppActiveTab) setAppActiveTab('profile');
        }}
      />

      {/* 3. DYNAMIC OFFLINE DOWNLOAD SCREEN (IF NATIVE BRAIN SELECTED BUT NOT DOWNLOADED) */}
      {isNative && selectedModel === 'brain' && !hasBrainModel ? (
        <div className="flex-1 overflow-y-auto w-full p-4 sm:p-8 flex flex-col items-center justify-center text-center select-none">
          <div className="max-w-md w-full bg-[#171424] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-400 shadow-lg">
              <Zap size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Download Omni Brain
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Omni Brain runs an on-device native local Qwen AI model directly in your device memory with 100% offline isolation.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 text-[11px] font-mono text-amber-300/90 bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-500/20">
              <span>Size: ~398.5 MB</span>
              <span>•</span>
              <span>100% Offline</span>
            </div>

            {(!brainDownloadState.status.includes('idle') || brainDownloadState.downloadedBytes > 0) && (
              <div className="space-y-2 text-left bg-black/30 p-3.5 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white/60">{brainDownloadState.downloadedFormatted} / {brainDownloadState.totalFormatted}</span>
                  <span className="text-amber-400 font-bold">{brainDownloadState.progressPercent.toFixed(1)}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-200"
                    style={{ width: `${brainDownloadState.progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-white/40 font-mono">
                  <span>Speed: {brainDownloadState.speedFormatted}</span>
                  <span className="capitalize">{brainDownloadState.status}</span>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  if (isBrainDownloading) {
                    pauseOmniBrainDownload();
                  } else {
                    startOrResumeOmniBrainDownload();
                  }
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:opacity-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-95 transition-all"
              >
                {isBrainDownloading ? (
                  <>
                    <Pause size={18} />
                    <span>Pause Download</span>
                  </>
                ) : isBrainPaused ? (
                  <>
                    <Play size={18} />
                    <span>Resume Download</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Download Omni Brain Now</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleModelSelect('flash')}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold transition-all cursor-pointer"
              >
                Switch Back to Omni Flash
              </button>
            </div>

          </div>
        </div>
      ) : (
        /* 4. MAIN CHAT MESSAGES VIEWPORT */
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto w-full custom-scrollbar flex flex-col pt-4 pb-6 min-h-0"
        >
          {messages.length === 0 && !liveStreamText ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto my-auto text-center gap-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 via-rose-600 to-red-600 p-0.5 shadow-2xl">
                <div className="w-full h-full rounded-full bg-[#0F0E17] flex items-center justify-center text-white font-black text-xl">
                  <Sparkles size={24} className="text-red-400" />
                </div>
              </div>
              
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">How can I help you today?</h1>
                <p className="text-xs text-white/50 mt-1">
                  {selectedModel === 'brain' ? 'Omni Brain is ready (On-Device Local AI)' : 'Omni Flash is ready (High-Speed Gemini Cloud)'}
                </p>
              </div>

              {/* Suggestion prompt shortcuts */}
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
                    type="button"
                    onClick={() => {
                      setInputText(card.prompt);
                      if (textareaRef.current) {
                        textareaRef.current.focus();
                      }
                    }}
                    className="p-3.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl transition-all cursor-pointer text-left focus:outline-none hover:shadow-lg active:scale-95 flex flex-col gap-1"
                  >
                    <p className="text-xs font-bold text-white">{card.title}</p>
                    <p className="text-[11px] text-white/50 leading-snug font-normal">{card.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col w-full max-w-4xl mx-auto px-4 sm:px-6">
              {messages.map((msg, index) => {
                const isMe = msg.senderId === user?.uid || msg.senderHandle === userHandle;
                
                if (isMe) {
                  /* USER MESSAGES: Compact, floating dark/blurred pill-style container with strict word/line breaking */
                  return (
                    <div key={`${msg.id || 'usr'}-${index}`} className="w-full flex justify-end">
                      <div className="bg-neutral-800/90 backdrop-blur-md text-white rounded-3xl p-4 max-w-[88%] sm:max-w-[75%] ml-auto mb-6 border border-white/10 shadow-lg text-left select-text relative overflow-hidden break-words break-all [overflow-wrap:anywhere]">
                        {msg.type === 'audio' || (msg.mediaUrl && (msg.mediaUrl.includes('audio') || msg.mediaUrl.match(/\.(webm|wav|mp3|m4a|ogg|aac)($|\?)/i))) ? (
                          <div className="my-1">
                            <VoiceNotePlayer 
                              mediaUrl={msg.mediaUrl || ''} 
                              duration={msg.duration} 
                              waveform={msg.waveform} 
                              caption={msg.text} 
                            />
                          </div>
                        ) : msg.mediaUrl ? (
                          <div className="mb-2.5">
                            <div 
                              onClick={() => setViewingFullImageUrl(msg.mediaUrl || null)}
                              className="relative group/img max-w-[220px] h-36 rounded-2xl overflow-hidden border border-white/15 bg-black/40 cursor-pointer shadow-lg hover:border-red-500/50 transition-all"
                            >
                              <img 
                                referrerPolicy="no-referrer" 
                                src={msg.mediaUrl} 
                                alt="Attachment" 
                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover/img:opacity-100 transition-opacity flex items-end p-2">
                                <span className="text-[8.5px] font-black uppercase text-white tracking-wider flex items-center gap-1 drop-shadow-md">
                                  <Maximize2 size={10} className="text-red-400" /> Tap to expand
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : null}
                        {msg.type !== 'audio' && (!msg.mediaUrl || (!msg.mediaUrl.includes('audio') && !msg.mediaUrl.match(/\.(webm|wav|mp3|m4a|ogg|aac)($|\?)/i))) && (
                          <TruncatedUserMessage text={msg.text} maxChars={260} />
                        )}
                      </div>
                    </div>
                  );
                } else {
                  /* AI MESSAGES: Full width (w-full) with interactive Quiz Cards */
                  return (
                    <div 
                      key={`${msg.id || 'omni'}-${index}`} 
                      className="w-full py-2 mb-6 flex flex-col text-left select-text max-w-full overflow-hidden"
                    >
                      <div className="w-full min-w-0 max-w-full overflow-hidden">
                        {renderAiMessageWithQuizCards(msg.text)}
                      </div>

                      {/* Action buttons under full-width AI message */}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(msg.text);
                            setCopiedMsgId(msg.id || `idx-${index}`);
                            setTimeout(() => setCopiedMsgId(null), 2000);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all border border-white/5 active:scale-95 cursor-pointer"
                          title="Copy response"
                        >
                          {copiedMsgId === (msg.id || `idx-${index}`) ? (
                            <>
                              <Check size={12} className="text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                }
              })}

              {/* REAL-TIME STREAMING STATE DISPLAY */}
              {liveStreamText && (
                <div className="w-full py-2 mb-6 flex flex-col text-left select-text animate-fadeIn">
                  <div className="w-full min-w-0">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkMath]} 
                      rehypePlugins={[rehypeKatex]}
                    >
                      {liveStreamText}
                    </ReactMarkdown>
                    <span className="inline-block w-2 h-4 bg-red-500 animate-pulse ml-1 align-middle" />
                  </div>
                </div>
              )}

              {/* THINKING INDICATOR */}
              {isThinking && !liveStreamText && (
                <div className="w-full py-4 flex flex-col text-left">
                  <div className="flex gap-1.5 items-center py-2">
                    <span className="w-2.5 h-2.5 bg-[#DC2626] rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2.5 h-2.5 bg-[#DC2626] rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2.5 h-2.5 bg-[#DC2626] rounded-full animate-bounce" />
                    <span className="text-xs font-bold text-white/40 ml-2 uppercase tracking-wider">Omni is generating response...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SCROLL BACK DOWN BUTTON */}
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
            className="absolute bottom-24 right-6 w-10 h-10 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-2xl transition-all z-30 cursor-pointer active:scale-95 flex items-center justify-center border border-white/15"
            title="Latest message"
          >
            <ArrowDown size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 5. BOTTOM INPUT BAR & INTERACTIVE (+) ATTACHMENT POPUP */}
      <div 
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
        className="w-full bg-[#0F0E17]/95 backdrop-blur-md pt-2 px-4 shrink-0 z-20 flex flex-col items-center"
      >
        
        {/* Stop Generation Button */}
        <AnimatePresence>
          {(isThinking || Boolean(liveStreamText)) && (
            <motion.button
              id="omni_stop_generation_btn"
              initial={{ scale: 0.9, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 10, opacity: 0 }}
              onClick={onStopGeneration}
              className="mb-2 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <StopCircle size={14} /> Stop Generating
            </motion.button>
          )}
        </AnimatePresence>

        {/* Selected Note Attachment Preview */}
        <AnimatePresence>
          {selectedImportedNote && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="mb-2 max-w-3xl w-full flex items-center justify-between bg-red-600/20 border border-red-500/40 rounded-2xl px-3.5 py-2"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <BookOpen size={15} className="text-red-400 shrink-0" />
                <span className="text-xs font-medium text-white truncate">Attached Note: {selectedImportedNote.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImportedNote(null)}
                className="text-white/50 hover:text-white p-1 cursor-pointer"
              >
                <X size={15} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Image Attachment Preview */}
        <AnimatePresence>
          {attachedImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-2 max-w-3xl w-full flex items-center justify-between bg-[#1A162B] border border-white/10 rounded-2xl p-2.5 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <img 
                  referrerPolicy="no-referrer"
                  src={attachedImage.previewUrl} 
                  alt="Attachment Preview" 
                  className="w-12 h-12 object-cover rounded-xl border border-white/10"
                />
                <div>
                  <p className="text-xs font-bold text-white truncate max-w-[200px]">{attachedImage.file.name}</p>
                  <p className="text-[10px] text-white/40">{(attachedImage.file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="p-1.5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all cursor-pointer"
                title="Remove attachment"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Note Selector Drawer/Overlay */}
        <AnimatePresence>
          {showNoteSelector && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full max-w-3xl bg-[#171424] border border-white/10 rounded-2xl p-3 mb-2 space-y-2 max-h-44 overflow-y-auto custom-scrollbar text-left"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-1">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={13} /> Select Academic Note
                </p>
                <button type="button" onClick={() => setShowNoteSelector(false)} className="text-white/40 hover:text-white cursor-pointer">
                  <X size={13} />
                </button>
              </div>
              {userNotes.length === 0 ? (
                <p className="text-[10px] text-white/30 text-center py-4">No saved notes found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {userNotes.map(n => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        setSelectedImportedNote(n);
                        setShowNoteSelector(false);
                      }}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-all cursor-pointer"
                    >
                      <p className="text-xs font-bold text-white truncate">{n.title || 'Untitled Note'}</p>
                      <p className="text-[10px] text-white/40 truncate">{n.content?.substring(0, 45) || 'Empty'}</p>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Bar Container */}
        <div className="w-full max-w-3xl bg-[#171424] border border-white/10 rounded-[32px] p-2 shadow-2xl flex items-end gap-2 relative">
          
          {/* Plus (+) Button with Floating Attachment Popup Menu */}
          <div id="omni_plus_menu_container" className="relative shrink-0">
            <button
              type="button"
              id="omni_plus_menu_btn"
              onClick={() => setShowPlusMenu(!showPlusMenu)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border cursor-pointer ${
                showPlusMenu 
                  ? 'bg-red-600 text-white border-red-500 rotate-45' 
                  : 'bg-white/5 text-white/70 border-white/10 hover:text-white hover:bg-white/10'
              }`}
              title="Add Attachment"
            >
              <Plus size={20} className="transition-transform duration-200" />
            </button>

            {/* Floating Attachment Popup Menu (Photos, Camera, Files, Upload Note) */}
            <AnimatePresence>
              {showPlusMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-14 left-0 bg-[#1A162B] border border-white/15 p-2 rounded-2xl min-w-[200px] shadow-2xl z-40 flex flex-col gap-1 text-left backdrop-blur-xl"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlusMenu(false);
                      galleryInputRef.current?.click();
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/85 hover:text-white hover:bg-white/10 text-xs font-bold transition-all text-left w-full cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400 shrink-0">
                      <ImageIcon size={15} />
                    </div>
                    <span>Photos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPlusMenu(false);
                      cameraInputRef.current?.click();
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/85 hover:text-white hover:bg-white/10 text-xs font-bold transition-all text-left w-full cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400 shrink-0">
                      <Camera size={15} />
                    </div>
                    <span>Camera</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPlusMenu(false);
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/85 hover:text-white hover:bg-white/10 text-xs font-bold transition-all text-left w-full cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
                      <FileText size={15} />
                    </div>
                    <span>Document/Files</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowPlusMenu(false);
                      setShowNoteSelector(!showNoteSelector);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/85 hover:text-white hover:bg-white/10 text-xs font-bold transition-all text-left w-full cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-400 shrink-0">
                      <BookOpen size={15} />
                    </div>
                    <span>Upload Note to Omni</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hidden File Inputs */}
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

          <input 
            type="file"
            ref={cameraInputRef}
            onChange={handleImagePickerChange}
            className="hidden"
            accept="image/*"
            capture="environment"
          />

          {/* CONDITIONAL INPUT BAR: Recording State vs Audio Preview Graph vs Standard Text Input */}
          {isRecordingAudio ? (
            /* 🎙️ LIVE AUDIO RECORDING STATE WITH REAL-TIME WAVEFORM BARS */
            <div className="w-full flex items-center justify-between gap-3 py-1.5 px-2">
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                <span className="text-xs font-mono font-black text-red-500 tracking-wider">
                  {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                </span>
              </div>

              {/* Dynamic live waveform bars */}
              <div className="flex-1 flex items-center justify-center gap-0.5 h-6 px-2 overflow-hidden">
                {liveAudioBars.map((lvl, i) => (
                  <div 
                    key={i} 
                    style={{ height: `${lvl}%` }} 
                    className="w-1 bg-red-500 rounded-full transition-all duration-75 min-h-[4px]"
                  />
                ))}
              </div>

              {/* Cancel & Done Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={cancelAudioRecording}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
                  title="Cancel Recording"
                >
                  <Trash2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={stopAudioRecording}
                  className="w-9 h-9 rounded-full bg-[#DC2626] hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
                  title="Finish Recording & Preview"
                >
                  <Check size={16} />
                </button>
              </div>
            </div>
          ) : recordedAudio ? (
            /* 🎵 AUDIO PREVIEW GRAPH IN CHAT INPUT BAR + SEND BUTTON */
            <div className="w-full space-y-2 py-1">
              <AudioPreviewGraph
                audioData={recordedAudio}
                onDiscard={discardRecordedAudio}
              />

              <div className="flex items-center gap-2">
                <textarea
                  ref={textareaRef}
                  id="omni-workspace-chat-textarea"
                  value={inputText}
                  onChange={handleTextareaInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendRecordedAudio();
                    }
                  }}
                  placeholder="Ask Omni about this audio or add notes..."
                  rows={1}
                  className="flex-1 bg-transparent px-2 py-1.5 text-xs text-white max-h-24 resize-none outline-none placeholder-white/30 select-text font-medium leading-relaxed custom-scrollbar"
                />

                {/* Send Button sends audio directly to Omni AI */}
                <button
                  id="omni_send_message_btn"
                  type="button"
                  onClick={handleSendRecordedAudio}
                  className="w-10 h-10 rounded-full bg-[#DC2626] hover:bg-red-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-600/40 active:scale-95 transition-all cursor-pointer"
                  title="Send audio to Omni AI"
                >
                  <ArrowUp size={19} />
                </button>
              </div>
            </div>
          ) : (
            /* 💬 STANDARD TEXT & MULTIMEDIA INPUT */
            <>
              {/* Auto-expanding Textarea (rows=1, max-h-36 with scrollbar beyond) */}
              <textarea
                ref={textareaRef}
                id="omni-workspace-chat-textarea"
                value={inputText}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder={isUploadingImage ? 'Uploading image...' : 'Ask Omni...'}
                disabled={isUploadingImage}
                rows={1}
                className="flex-1 bg-transparent px-2 py-2 text-sm text-white max-h-36 resize-none outline-none placeholder-white/30 select-text font-medium leading-relaxed disabled:opacity-50 custom-scrollbar"
              />

              {/* Microphone & Send Arrow Button */}
              <div className="flex items-center gap-1.5 shrink-0 mb-0.5">
                <button
                  id="omni_voice_record_btn"
                  type="button"
                  onClick={handleVoiceRecordClick}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                  title="Record Voice Note"
                >
                  <Mic size={19} />
                </button>

                {/* Circular Send Arrow Button */}
                <button
                  id="omni_send_message_btn"
                  type="button"
                  disabled={!inputText.trim() && !attachedImage}
                  onClick={() => {
                    if (attachedImage) {
                      handleSendWithImage();
                    } else if (inputText.trim()) {
                      setLiveStreamText('');
                      onSendMessage();
                      if (textareaRef.current) {
                        textareaRef.current.style.height = 'auto';
                      }
                    }
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    (inputText.trim() || attachedImage)
                      ? 'bg-[#DC2626] hover:bg-red-500 text-white shadow-lg cursor-pointer active:scale-95'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                  }`}
                  title="Send message"
                >
                  <ArrowUp size={19} />
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Fullscreen Image Preview Modal */}
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
              type="button"
              onClick={() => setViewingFullImageUrl(null)}
              className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-10 cursor-pointer"
            >
              <X size={22} />
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
