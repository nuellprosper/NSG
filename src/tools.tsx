import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cleanTextForSpeech } from './lib/tts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  Mic, StopCircle, Upload, FileAudio, Image as ImageIcon, 
  Brain, History, Download, Play, 
  ChevronRight, Sparkles, Trash2, Settings, UserPlus, CreditCard, Edit2, FilePlus,
  ChevronUp, ChevronDown, Bold, ThumbsUp, Volume2, VolumeX, Square, Send, Pin, CreditCard as Clock,
  ArrowLeft, RefreshCcw, Camera, Award, ShieldCheck, BookOpen, FileText, Zap, Info, AlertTriangle, Loader2,
  Share2, Trophy, Search, Check, X, ArrowLeft as ChevronLeft, GraduationCap, Users, User, Clock as ClockIcon,
  Activity, Video, Copy, PlusCircle, Plus, Italic, List, XCircle, CheckCircle2, MessageSquare,
  Undo2, Redo2, Save, CornerDownRight, Menu, ExternalLink, Percent, Bookmark, AlertCircle, Book, HelpCircle, Calculator,
  Shirt, MoreVertical, CheckSquare, ListTodo, Compass, Wand2, Palette, Type, Lock, Unlock
} from 'lucide-react';
import { isNativePlatform } from './lib/capacitor';

const WhatsAppIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.445 0 .081 5.363.079 11.969c0 2.112.551 4.172 1.597 5.979L0 24l6.163-1.617a11.83 11.83 0 005.883 1.553h.005c6.602 0 11.967-5.367 11.97-11.97a11.815 11.815 0 00-3.505-8.473z"/>
  </svg>
);

const ImageAttachmentPreview = ({ src, alt }: { src: string; alt: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <div 
        onClick={() => setIsOpen(true)}
        className="my-4 max-w-sm cursor-pointer rounded-2xl overflow-hidden border border-white/10 hover:border-[#DC2626]/30 shadow-md group relative hover:scale-[1.01] active:scale-[0.99] transition-all bg-white/5"
      >
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-black/60 rounded-md text-[8px] font-black uppercase text-white/70 tracking-widest flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
          Tap to Zoom
        </div>
        <img src={src} alt={alt} className="w-full h-auto max-h-48 object-cover block" referrerPolicy="no-referrer" />
        <div className="p-2.5 border-t border-white/5 bg-white/[0.02]">
          <p className="text-[10px] text-white/40 font-mono truncate">{alt || 'attachment.png'}</p>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex flex-col items-center justify-center p-4 cursor-zoom-out" onClick={() => setIsOpen(false)}>
          <button className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-[#DC2626] text-white rounded-full transition-all" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
          <img src={src} alt={alt} className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10" referrerPolicy="no-referrer" />
          {alt && <p className="text-white/60 text-xs mt-4 font-mono bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">{alt}</p>}
        </div>
      )}
    </>
  );
};

const DocumentAttachmentPreview = ({ href, name }: { href: string; name: string }) => {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="my-4 max-w-sm flex items-center justify-between p-3.5 bg-white/5 border border-white/10 hover:border-[#DC2626]/30 rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all select-none"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center shrink-0">
          <FileText size={18} className="text-yellow-400" />
        </div>
        <div className="overflow-hidden">
          <p className="text-[9px] font-black uppercase tracking-wider text-white/40">Attached Document</p>
          <p className="text-xs text-white/80 font-bold truncate">{name || 'source_document.pdf'}</p>
        </div>
      </div>
      <div className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
        <ExternalLink size={14} className="text-white/60" />
      </div>
    </a>
  );
};

const MarkdownRenderer = ({ content, className = "", selectable = false }: { content: string, className?: string, selectable?: boolean }) => {
  // Pre-process content to ensure LaTeX is correctly formatted for remark-math
  // Handle both escaped \( \) and \[ \] as well as raw strings that AI might send
  let processedContent = (content || "")
    .replace(/\\\\\((.*?)\\\\\)/g, '$$$1$')
    .replace(/\\\\\[(.*?)\\\\\]/g, '$$$$$1$$$$')
    .replace(/\\\((.*?)\\\)/g, '$$$1$')
    .replace(/\\\[(.*?)\\\]/g, '$$$$$1$$$$');

  // Helper to auto-wrap only math expressions within a line to avoid wrapping text
  const autoWrapMath = (text: string): string => {
    if (!text) return "";
    
    // Protect existing math blocks
    const protectedBlocks: string[] = [];
    let processed = text.replace(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g, (match) => {
      protectedBlocks.push(match);
      return `__MATH_BLOCK_${protectedBlocks.length - 1}__`;
    });

    // Match raw math/LaTeX-like strings and wrap them
    // Match strings containing subscripts, superscripts, operators, and specific LaTeX math words
    processed = processed.replace(/(?:[0-9a-zA-Z_,\.\(\)\{\}\[\]\+\-\*\/\=\^\s]|\\(?![a-zA-Z]{4,}))*(?:\\(?:frac|cdot|left|right|times|sqrt|pi|rho|sigma|delta|Omega|alpha|beta|theta|mu|lambda|approx|neq|le|ge)[a-zA-Z]*|_[0-9a-zA-Z]+|\^[0-9a-zA-Z]+)(?:[0-9a-zA-Z_,\.\(\)\{\}\[\]\+\-\*\/\=\^\s]|\\(?![a-zA-Z]{4,}))*/g, (match) => {
      const trimmed = match.trim();
      if (!trimmed) return match;
      if (trimmed.length < 3) return match;
      if (trimmed.includes('\\') || trimmed.includes('_') || trimmed.includes('^') || trimmed.includes('=')) {
        const words = trimmed.match(/[a-zA-Z]{4,}/g) || [];
        const mathWords = ['frac', 'cdot', 'left', 'right', 'times', 'sqrt', 'approx', 'omega', 'alpha', 'beta', 'theta', 'delta', 'sigma', 'lambda', 'text', 'math'];
        const nonMathWords = words.filter((w: string) => !mathWords.includes(w.toLowerCase()));
        if (nonMathWords.length > 2) {
          return match;
        }
        return ` $${trimmed}$ `;
      }
      return match;
    });

    // Restore protected blocks
    processed = processed.replace(/__MATH_BLOCK_(\d+)__/g, (_, idx) => {
      return protectedBlocks[parseInt(idx, 10)];
    });

    return processed;
  };

  // Apply autoWrapMath to each line that doesn't already have math indicators
  processedContent = processedContent.split('\n').map(line => {
    const trimmed = line.trim();
    if (trimmed.includes('$')) {
      return line;
    }
    return autoWrapMath(line);
  }).join('\n');

  return (
    <div className={`markdown-body overflow-x-auto ${selectable ? 'select-text' : 'select-none'} selection:bg-[#DC2626]/20 custom-scrollbar ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkMath]} 
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
            const isAttachment = href && (href.startsWith('http') || href.startsWith('data:') || href.includes('cloudinary') || href.includes('upload'));
            if (isAttachment) {
              return (
                <DocumentAttachmentPreview href={href} name={children ? String(children) : 'Attached Document'} />
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
          h1: ({node, ...props}) => <h1 className="text-base font-black uppercase tracking-tight text-white mb-2 mt-4 border-b border-white/10 pb-1" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-sm font-black uppercase tracking-tight text-white/95 mb-1.5 mt-3" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-xs font-bold uppercase tracking-tight text-white/90 mb-1 mt-2" {...props} />,
          p: ({node, ...props}) => <p className="leading-relaxed mb-3.5 text-white/85 text-xs sm:text-sm tracking-normal whitespace-pre-wrap font-sans font-medium" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3.5 space-y-1.5 text-white/85 text-xs sm:text-sm font-sans font-medium" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3.5 space-y-1.5 text-white/85 text-xs sm:text-sm font-sans font-medium" {...props} />,
          li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-red-500/50 bg-white/5 px-3 py-2 rounded-r-lg italic my-3 text-white/70 text-xs sm:text-sm" {...props} />,
          code({node, inline, className, children, ...props}: any) {
            const match = /language-(\w+)/.exec(className || '');
            const rawCode = String(children || '').replace(/\n$/, '');
            return !inline ? (
              <div className="my-4 border border-white/10 rounded-xl overflow-hidden bg-[#0A0712] shadow-2xl relative">
                <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/[0.05] text-[9px] font-mono text-white/40 uppercase tracking-widest">
                  <span>{match ? match[1] : 'code'}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(rawCode)}
                    className="hover:text-white transition-colors flex items-center gap-1 text-[8px] font-black tracking-wider uppercase"
                  >
                    Copy Block
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-[11px] sm:text-xs leading-5 font-mono text-red-400/90 whitespace-pre overflow-y-hidden custom-scrollbar">
                  <code {...props} className={className}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="px-1.5 py-0.5 rounded bg-white/10 text-red-400 font-mono text-xs font-semibold mx-0.5 select-all" {...props}>
                {children}
              </code>
            );
          },
          img: ({node, src, alt, ...props}: any) => {
            return (
              <ImageAttachmentPreview src={src || ''} alt={alt || ''} />
            );
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

const LOCAL_DICTIONARY: Record<string, string> = {
  hemisphere: "A half of a sphere, especially of the earth divided into northern and southern halves by the equator, or into eastern and western halves by a meridian.",
  volume: "The amount of space that a substance or object occupies, or that is enclosed within a container.",
  radius: "A straight line from the center to the circumference of a circle or sphere.",
  mathematics: "The abstract science of number, quantity, and space, either as abstract concepts (pure mathematics), or as applied to other disciplines such as physics and engineering.",
  physics: "The branch of science concerned with the nature and properties of matter and energy.",
  chemistry: "The branch of science that deals with the identification of the substances of which matter is composed.",
  constant: "A situation or state of affairs that does not change; in mathematics, a number or quantity that is placed in a formula to represent a fixed value.",
  rate: "A measure, quantity, or frequency, typically one measured against some other quantity or measure.",
  biology: "The study of living organisms, divided into many specialized fields that cover their morphology, physiology, anatomy, behavior, origin, and distribution."
};

export const ToolsPage = (props: any) => {
  const [showSetQuizHelp, setShowSetQuizHelp] = React.useState(false);
  const [showQuizConfigPopup, setShowQuizConfigPopup] = React.useState(false);
  const [configQuizCount, setConfigQuizCount] = React.useState(10);
  const [configQuizDifficulty, setConfigQuizDifficulty] = React.useState<"Easy" | "Medium" | "Hard" | "Professional">('Medium');
  const [isScrolledUp, setIsScrolledUp] = React.useState(false);
  const [showOmniQuizModal, setShowOmniQuizModal] = React.useState(false);
  const [resultFilter, setResultFilter] = React.useState<'all' | 'correct' | 'incorrect'>('all');
  const {
    theme,
    user,
    currentUserData,
    activeTab,
    setActiveTab,
    toolsSubTab,
    setToolsSubTab,
    setUserNotification,
    checkAndIncrementUsage,
    isPremium,
    showHelp,
    setShowHelp,
    showAuthModal,
    setShowAuthModal,

    // Custom Components from props
    CoursesTool,
    AssignmentSolver,
    AILibrary,

    // AI services & helper props
    getAiInstance,
    getHfInstance,
    fileToGenerativePart,
    chatSessions = [],
    setChatSessions,
    activeChatSessionId,
    setActiveChatSessionId,
    handleSendMessage,
    chatHistory = [],
    setChatHistory,

    // Core states & handlers
    sessions,
    selectedSession,
    setSelectedSession,
    deleteLectureSession,
    togglePinLectureSession,
    loadRecordingSession,
    showRecordSidebar,
    setShowRecordSidebar,
    showAnalysisInRecord,
    setShowAnalysisInRecord,
    isTranscribing,
    transcriptionNotes,
    isAnalyzing,
    analysisResult,
    setAnalysisResult,
    refurbishedResult,
    setRefurbishedResult,
    isRecording,
    isProcessingFinal,
    recordingTime,
    audioUrl,
    setAudioUrl,
    recordedBlob,
    setRecordedBlob,
    uploadedImages,
    setUploadedImages,
    isNotebookDrawerOpen,
    setIsNotebookDrawerOpen,
    isPodcastActive,
    setIsPodcastActive,
    isTeacherMode,
    setIsTeacherMode,
    podcastDialogue,
    generatePodcastDiscussion,
    isGeneratingPodcast,
    handlePodcastInput,
    replyingTo,
    setReplyingTo,
    showPodcastUploadMenu,
    setShowPodcastUploadMenu,
    selectedNote,
    setSelectedNote,
    importedQuizNote,
    setImportedQuizNote,
    userNotes,
    setUserNotes,
    saveNote,
    deleteNote,
    quizState,
    setQuizState,
    quizTopic,
    setQuizTopic,
    quizQuestionCount,
    setQuizQuestionCount,
    quizDifficulty,
    setQuizDifficulty,
    quizAnswerType = 'multiple_choice',
    setQuizAnswerType,
    quizAnswerTypes = ['multiple_choice'],
    setQuizAnswerTypes,
    dailyQuizUsedCount = 0,
    quizImages,
    setQuizImages,
    isUploadingQuizImages = false,
    isUploadingQuizDocs = false,
    handleQuizImageUpload,
    removeQuizImage,
    quizDocuments = [],
    handleQuizDocumentUpload,
    removeQuizDocument,
    isGeneratingQuiz,
    generateQuiz,
    examLobbyState,
    setExamLobbyState,
    studentName,
    setStudentName,
    matricNumber,
    setMatricNumber,
    showAdminLogin,
    setShowAdminLogin,
    examIdInput,
    setExamIdInput,
    isAuthLoading,
    adminMode,
    setAdminMode,
    adminPin,
    setAdminPin,
    handleAdminLogin,
    handleMatricLogin,
    isTakingPaid,
    examConfig,
    startExam,
    examTimer,
    currentExamIndex,
    setCurrentExamIndex,
    examQuestions,
    submitExam,
    examAnswers,
    setExamAnswers,
    examScore,
    subjectScores,
    quizQuestions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    shareQuiz,
    userQuizAnswers,
    setUserQuizAnswers = props.setUserQuizAnswers,
    selectedOption,
    setSelectedOption,
    isAnswered,
    setIsAnswered,
    handleOptionSelect,
    prevQuestion,
    nextQuestion,
    quizScore,
    handleShareResult,
    uploadNoteFile,
    notePreviewMode,
    setNotePreviewMode,
    podcastSpeechIndex,
    stopPodcastSpeech,
    playPodcastDialogueLine,
    scrollContainerRef,
    handleNoteScroll,
    setSelectedNoteTitle,
    handleNoteContentChange,
    lastFocusedBlock,
    insertText,
    noteBlocks,
    updateBlock,
    removeBlock,
    noteScrollPos,
    scrollToPosition,
    noteHistory,
    setNoteHistory,
    redoStack,
    setRedoStack,
    undoNote,
    redoNote,
    initializePayment,
    handleTakingPaymentSuccess,
    handlePaystackClose,
    uploadHistoryToOmni,
    shareAnalysis,
    handleToggleRecording,
    handleSaveFacultyHistory,
    addToFinishedHistory,
    finishedHistory,
    activeAssignmentSolution,
    setActiveAssignmentSolution,
    studentActiveQuestions,
    activeStudentSubject,
    setActiveStudentSubject,
    handleUploadAudioRecordPage,
    activeAudioNoteId,
    isAudioTranscribing,
    audioTranscribingPopup,
    setAudioTranscribingPopup,
    onGlobalBack
  } = props;

  const [localQuizCreationMethod, setLocalQuizCreationMethod] = useState<'omni' | 'pdf' | 'image' | null>(null);
  const quizCreationMethod = props.quizCreationMethod !== undefined ? props.quizCreationMethod : localQuizCreationMethod;
  const setQuizCreationMethod = props.setQuizCreationMethod || setLocalQuizCreationMethod;

  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect'>('all');

  React.useEffect(() => {
    if (selectedNote) {
      setTimeout(() => {
        if (scrollContainerRef && scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
        window.scrollTo(0, 0);
        let parent = scrollContainerRef?.current?.parentElement;
        while (parent) {
          if (parent.scrollTop > 0) parent.scrollTop = 0;
          parent = parent.parentElement;
        }
      }, 50);
    }
  }, [selectedNote?.id, notePreviewMode]);

  const handleLaunchOmniQuizDiscussion = (targetSessionId: 'new' | string) => {
    const percentage = Math.round((quizScore / ((quizQuestions && quizQuestions.length) || 1)) * 100);
    
    let docsContext = '';
    if (quizDocuments && quizDocuments.length > 0) {
      docsContext = `\nAttached Documents: ${quizDocuments.map((d: any) => d.name).join(', ')}`;
    }
    let imagesContext = '';
    if (quizImages && quizImages.length > 0) {
      imagesContext = `\nAttached Photos: ${quizImages.length} study image(s) uploaded.`;
    }

    const breakdown = (quizQuestions || []).map((q: any, idx: number) => {
      const userAns = userQuizAnswers[idx];
      const userChoiceText = userAns !== undefined && q.options && q.options[userAns] ? `${String.fromCharCode(65 + userAns)}) ${q.options[userAns]}` : 'Not Answered / Skipped';
      const correctChoiceText = q.options && q.options[q.correctAnswer] ? `${String.fromCharCode(65 + q.correctAnswer)}) ${q.options[q.correctAnswer]}` : 'N/A';
      const isCorrect = userAns === q.correctAnswer;
      
      return `Question ${idx + 1}: ${q.question}
Options: ${(q.options || []).map((opt: string, oIdx: number) => `${String.fromCharCode(65 + oIdx)}) ${opt}`).join(' | ')}
Student Selected: ${userChoiceText}
Correct Answer: ${correctChoiceText}
Status: ${isCorrect ? 'CORRECT ✅' : 'INCORRECT ❌'}
Explanation: ${q.explanation || 'N/A'}`;
    }).join('\n\n');

    const contextPrompt = `📚 QUIZ PERFORMANCE & DETAILED REVIEW REQUEST
Topic: "${quizTopic || 'Study Material'}"
Score: ${quizScore} / ${(quizQuestions && quizQuestions.length) || 0} (${percentage}% Grade)${docsContext}${imagesContext}

DETAILED QUESTION & ANSWER BREAKDOWN:
${breakdown}

Hi Omni! I just finished taking this quiz on "${quizTopic || 'Study Material'}". Please review my score and performance breakdown above. Point out my mistakes, explain why my wrong choices were incorrect and why the right options were correct, teach me the core concepts I missed, and provide a friendly study coaching summary!`;

    setShowOmniQuizModal(false);
    if (props.onOpenOmniWithPrompt) {
      props.onOpenOmniWithPrompt(contextPrompt, targetSessionId);
    } else {
      if (setActiveTab) {
        setActiveTab('chat');
      }
      if (handleSendMessage) {
        setTimeout(() => {
          handleSendMessage(contextPrompt);
        }, 150);
      }
    }
  };

  const getAudioSrc = useCallback((session: any) => {
    if (!session) return "";
    if (session.audioUrl) return session.audioUrl;
    if (session.audioBase64) {
      return `data:audio/webm;base64,${session.audioBase64}`;
    }
    return "";
  }, []);

  // Custom states inside Tools
  const [noteTheme, setNoteTheme] = useState<'dark' | 'light'>(theme === 'light' ? 'light' : 'dark');
  const [showNoteMenu, setShowNoteMenu] = useState(false);
  const [showAaFormattingMenu, setShowAaFormattingMenu] = useState(false);
  const [showNoteInsertMenu, setShowNoteInsertMenu] = useState(false);
  const [activeNotebookTab, setActiveNotebookTab] = useState<'write' | 'sources'>('write');
  const [noteToDelete, setNoteToDelete] = useState<any | null>(null);
  const [showSubmitConfirmLocal, setShowSubmitConfirmLocal] = useState(false);
  const [showExamCalculator, setShowExamCalculator] = useState(false);
  const [showQuizCalculator, setShowQuizCalculator] = useState(false);
  const [calcQuestionInput, setCalcQuestionInput] = useState('');
  const [calcSolutionOutput, setCalcSolutionOutput] = useState('');
  const [isSolvingCalc, setIsSolvingCalc] = useState(false);
  const [examCalcValue, setExamCalcValue] = useState('');
  const [showExamDictionary, setShowExamDictionary] = useState(false);
  const [examDictSearch, setExamDictSearch] = useState('');
  const [examDictResult, setExamDictResult] = useState('');
  const [examBookmarked, setExamBookmarked] = useState<Record<string | number, boolean>>({});
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [localStudentSubject, setLocalStudentSubject] = useState<string>("");
  const [showDownloadResultModal, setShowDownloadResultModal] = useState(false);
  const [showReviewWithOmniModal, setShowReviewWithOmniModal] = useState(false);
  const [resultUserName, setResultUserName] = useState(user?.displayName || 'Student');

  const generateResultImage = (userNameToUse: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 800, 500);
    grad.addColorStop(0, '#1E1B4B');
    grad.addColorStop(1, '#311042');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 500);

    // Decorative Borders
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 760, 460);

    ctx.strokeStyle = 'rgba(236, 72, 153, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 740, 440);

    // Header Logo / Branding
    ctx.fillStyle = '#C084FC';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('OMNI ACADEMY • QUIZ PERFORMANCE CERTIFICATE', 50, 70);

    // User Name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(userNameToUse || 'Student', 50, 130);

    // Topic Title
    ctx.fillStyle = '#E9D5FF';
    ctx.font = 'bold 20px sans-serif';
    const topicText = `Quiz Topic: ${props.quizTopic || 'General Study Quiz'}`;
    ctx.fillText(topicText, 50, 175);

    // Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 205);
    ctx.lineTo(750, 205);
    ctx.stroke();

    // Stats Grid Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(50, 235, 700, 140, 16);
      ctx.fill();
    } else {
      ctx.fillRect(50, 235, 700, 140);
    }

    const totalQs = props.quizQuestions ? props.quizQuestions.length : 1;
    const scoreVal = props.quizScore || 0;
    const percentage = Math.round((scoreVal / totalQs) * 100);

    // Stat 1: Score %
    ctx.fillStyle = percentage >= 50 ? '#4ADE80' : '#F87171';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(`${percentage}%`, 80, 305);
    ctx.fillStyle = '#A7F3D0';
    ctx.font = '13px sans-serif';
    ctx.fillText('ACCURACY SCORE', 80, 335);

    // Stat 2: Correct Questions
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`${scoreVal} / ${totalQs}`, 360, 305);
    ctx.fillStyle = '#D8B4FE';
    ctx.font = '13px sans-serif';
    ctx.fillText('CORRECT ANSWERS', 360, 335);

    // Stat 3: Status Stamp
    ctx.fillStyle = percentage >= 50 ? '#22C55E' : '#EF4444';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(percentage >= 50 ? 'PASSED ✓' : 'NEEDS REVIEW ✕', 580, 305);

    // Footer date & info
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '13px sans-serif';
    ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, 50, 440);
    ctx.fillText('Generated by Omni Study AI', 580, 440);

    // Trigger download
    const link = document.createElement('a');
    link.download = `Quiz_Result_${(userNameToUse || 'User').replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    if (setUserNotification) setUserNotification("Result image generated & downloaded!");
  };

  const validateAndEvaluateMath = useCallback((str: string): { isValid: boolean; result?: number; error?: string } => {
    const trimmed = str.trim();
    if (!trimmed) return { isValid: true, result: undefined };

    // Pre-process: convert 'sqrt' to '√'
    const preProcessed = trimmed.replace(/sqrt/gi, '√');

    // 1. Check for letters or text words
    if (/[a-zA-UW-Zu-z]/.test(preProcessed)) {
      return { isValid: false, error: 'Contains text or non-mathematical letters' };
    }

    // 2. Check for disallowed symbols
    if (/[^0-9+\-*/×÷^√.()% \t]/.test(preProcessed)) {
      return { isValid: false, error: 'Contains unsupported symbols' };
    }

    // 3. Check for invalid consecutive operator sequences (e.g., ÷/, 1-+, ++, --, etc.)
    if (/[\+\*\/\×\÷\^]{2,}|[\+\-\*\/\×\÷\^][\+\*\/\×\÷\^]|\-\+|\+\-|\-\-/.test(preProcessed)) {
      return { isValid: false, error: 'Invalid operator sequence (e.g. ÷/, 1-+)' };
    }

    // 4. Cannot start with binary operator
    if (/^[*/×÷^%]/.test(preProcessed)) {
      return { isValid: false, error: 'Cannot start with an operator' };
    }

    // 5. Cannot end with operator
    if (/[+\-*/×÷^√]$/.test(preProcessed)) {
      return { isValid: false, error: 'Cannot end with an operator' };
    }

    // 6. Check brackets balance
    let parenCount = 0;
    for (const char of preProcessed) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (parenCount < 0) return { isValid: false, error: 'Mismatched parentheses' };
    }
    if (parenCount !== 0) return { isValid: false, error: 'Unclosed parentheses' };
    if (/\(\s*\)/.test(preProcessed)) return { isValid: false, error: 'Empty parentheses' };

    // 7. Evaluate math expression safely
    try {
      let expr = preProcessed
        .replace(/×/g, '*')
        .replace(/÷/g, '/');

      // Implicit multiplication before/after brackets or √ e.g. 2(3+4) -> 2*(3+4), 2√16 -> 2*√16
      expr = expr.replace(/(\d)\s*\(/g, '$1*(');
      expr = expr.replace(/(\d)\s*√/g, '$1*√');
      expr = expr.replace(/\)\s*(\d|\(|√)/g, ')*$1');

      // Handle percentages e.g. 50% -> (50/100)
      expr = expr.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

      // Handle square roots
      let maxIter = 20;
      while (expr.includes('√') && maxIter-- > 0) {
        expr = expr.replace(/√\s*\(([^()]+)\)/g, 'Math.sqrt($1)');
        expr = expr.replace(/√\s*(\d+(?:\.\d+)?)/g, 'Math.sqrt($1)');
      }
      if (expr.includes('√')) return { isValid: false, error: 'Invalid square root syntax' };

      // Handle exponentiation
      expr = expr.replace(/\^/g, '**');

      const result = new Function(`return ${expr}`)();
      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        return { isValid: false, error: 'Mathematical error (e.g. division by zero)' };
      }

      const formattedResult = Number.isInteger(result) ? result : Number(result.toFixed(8));
      return { isValid: true, result: formattedResult };
    } catch (err) {
      return { isValid: false, error: 'Invalid mathematical syntax' };
    }
  }, []);

  const mathValidation = useMemo(() => validateAndEvaluateMath(calcQuestionInput), [calcQuestionInput, validateAndEvaluateMath]);
  const isCalcInputInvalid = Boolean(calcQuestionInput.trim() && !mathValidation.isValid);

  const handleSolveCalcQuestion = () => {
    if (!calcQuestionInput.trim()) return;
    if (!mathValidation.isValid) {
      setCalcSolutionOutput(`Error: ${mathValidation.error || 'Invalid mathematical expression'}`);
      return;
    }
    if (mathValidation.result !== undefined) {
      setCalcSolutionOutput(`${mathValidation.result}`);
    }
  };

  const toggleSpeakQuestion = (text: string, options?: string[]) => {
    if ('speechSynthesis' in window) {
      if (isSpeakingQuestion || window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setIsSpeakingQuestion(false);
      } else {
        let fullSpeech = `Question: ${text}`;
        if (options && Array.isArray(options) && options.length > 0) {
          const formattedOptions = options.map((opt, i) => `Option ${String.fromCharCode(65 + i)}: ${opt}`).join('. ');
          fullSpeech += `. ${formattedOptions}`;
        }
        const cleanText = cleanTextForSpeech(fullSpeech);
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.onend = () => setIsSpeakingQuestion(false);
        utterance.onerror = () => setIsSpeakingQuestion(false);
        setIsSpeakingQuestion(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Navigation stack for back button tracking
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['menu']);

  useEffect(() => {
    setNavigationHistory(prev => {
      // Don't record same subtab consecutively
      if (prev[prev.length - 1] === toolsSubTab) return prev;
      // If we go back to menu, clear the stack to ['menu'] to reset cleanly
      if (toolsSubTab === 'menu') return ['menu'];
      return [...prev, toolsSubTab];
    });
  }, [toolsSubTab]);

  const handleToolsBack = useCallback(() => {
    if (onGlobalBack) {
      const handled = onGlobalBack();
      if (handled) return;
    }
    if (quizCreationMethod !== null) {
      setQuizCreationMethod(null);
      return;
    }
    if (quizState === 'active' || quizState === 'preview' || quizState === 'finished' || quizState === 'review') {
      setQuizState('idle');
      return;
    }
    if (selectedNote) {
      setSelectedNote(null);
      return;
    }
    if (activeAssignmentSolution) {
      setActiveAssignmentSolution(null);
      return;
    }
    if (navigationHistory.length > 1) {
      const newStack = navigationHistory.slice(0, -1);
      const previous = newStack[newStack.length - 1] || 'menu';
      setNavigationHistory(newStack);
      setToolsSubTab(previous as any);
    } else {
      setNavigationHistory(['menu']);
      setToolsSubTab('menu');
    }
  }, [onGlobalBack, quizCreationMethod, setQuizCreationMethod, quizState, setQuizState, selectedNote, setSelectedNote, activeAssignmentSolution, setActiveAssignmentSolution, navigationHistory, setToolsSubTab]);

  const handleToolClick = useCallback((tool: any) => {
    if (tool.id === 'whatsapp') {
      window.open("https://wa.me/2349064470122", "_blank");
      return;
    }
    if (tool.action) {
      tool.action();
    } else {
      setToolsSubTab(tool.id);
    }
  }, [setToolsSubTab]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const FormatTime = formatTime;



  const isOwner = user?.email?.toLowerCase().trim() === 'nuellkelechi@gmail.com';

  const toolItems = useMemo(() => [
    { id: 'record', title: 'Transcribe Audio', icon: FileAudio, color: 'from-red-600 to-red-400', desc: 'Audio Transcription & Notes' },
    { id: 'quiz', title: 'Smart Quiz', icon: Zap, color: 'from-yellow-500 to-amber-400', desc: 'Test Your Knowledge' },
    { id: 'exam', title: 'CBT Exam', icon: ShieldCheck, color: 'from-orange-600 to-orange-400', desc: 'Professional Testing' },
    { id: 'faculty', title: 'Faculty Specials', icon: GraduationCap, color: 'from-blue-600 to-indigo-400', desc: 'Department Specific' },
    { id: 'assignment', title: 'Solve', icon: BookOpen, color: 'from-purple-600 to-pink-400', desc: 'Step-by-Step AI Solutions' },
    { id: 'notebook', title: 'Notebook Tool', icon: FileText, color: 'from-amber-600 to-yellow-400', desc: 'AI-Powered Sources' },
    { id: 'whatsapp', title: 'Omni WhatsApp', icon: WhatsAppIcon, color: 'from-green-600 to-green-400', desc: '+2349064470122' }
  ], [setActiveTab]);

  const comingSoonTools = useMemo(() => [
    { id: 'courses', title: 'Courses Tool', icon: BookOpen, color: 'from-emerald-600/60 to-teal-400/60', desc: 'Coming Soon' },
    { id: 'class', title: 'Live Classroom', icon: Video, color: 'from-pink-600/60 to-rose-400/60', desc: 'Coming Soon' },
    { id: 'gst', title: 'Study GST Tool', icon: GraduationCap, color: 'from-teal-600/60 to-cyan-400/60', desc: 'Coming Soon' }
  ], []);

  const handleComingSoonClick = useCallback((tool: any) => {
    if (isOwner) {
      if (tool.action) {
        tool.action();
      } else {
        setToolsSubTab(tool.id);
      }
    } else {
      if (setUserNotification) {
        setUserNotification(`🚧 ${tool.title} is coming soon! Stay tuned.`);
      }
    }
  }, [isOwner, setToolsSubTab, setUserNotification]);

  return (
    <motion.div 
      key="tools" 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0 }} 
      className={toolsSubTab === 'notebook' ? "w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden" : "space-y-6"}
    >
      {toolsSubTab === 'menu' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className={`text-xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Tools & Study</h2>
            <Brain size={20} className="text-[#DC2626]" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-8">
            {toolItems.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool)}
                className={`flex flex-col items-center justify-center text-center p-5 rounded-3xl h-44 transition-all duration-300 transform-gpu active:scale-[0.98] active:translate-y-0 group relative overflow-hidden select-none cursor-pointer ${
                  theme === 'dark' 
                    ? 'bg-white/[0.04] backdrop-blur-xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_1px_rgba(255,255,255,0.12),0_8px_32px_rgba(0,0,0,0.37)] hover:-translate-y-1 hover:bg-white/[0.08] hover:shadow-[inset_0_0_0_1px_rgba(220,38,38,0.35),0_12px_36px_rgba(220,38,38,0.18),inset_0_1px_1px_rgba(255,255,255,0.15)]' 
                    : 'bg-white/80 backdrop-blur-xl shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.9),0_8px_24px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:bg-white/95 hover:shadow-[inset_0_0_0_1px_rgba(220,38,38,0.22),0_12px_28px_rgba(220,38,38,0.10),inset_0_1px_1.5px_rgba(255,255,255,0.95)]'
                }`}
              >
                <div className={`p-4 rounded-2xl bg-gradient-to-tr ${tool.color} text-white shadow-md group-hover:scale-110 transition-transform duration-300 shrink-0 mb-3`}>
                  <tool.icon size={24} />
                </div>
                <div className="space-y-1 w-full text-center z-10">
                  <h3 className={`font-extrabold text-[11px] sm:text-xs uppercase tracking-tight group-hover:text-[#DC2626] transition-colors leading-tight truncate px-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{tool.title}</h3>
                  <p className={`text-[8px] uppercase tracking-wider font-bold leading-none truncate px-1 block ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>{tool.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* COMING SOON SECTION BELOW ALL TOOLS */}
          <div className="pt-6 border-t border-white/10 space-y-4 pb-12">
            <div className="flex items-center justify-between px-2">
              <h3 className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Coming Soon</h3>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 uppercase tracking-widest">In Development</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {comingSoonTools.map((tool) => (
                <div
                  key={tool.id}
                  onClick={() => handleComingSoonClick(tool)}
                  className={`flex flex-col items-center justify-center text-center p-5 rounded-3xl h-44 transition-all duration-300 relative overflow-hidden select-none cursor-pointer ${
                    isOwner 
                      ? 'opacity-90 hover:opacity-100 hover:-translate-y-1' 
                      : 'opacity-75 hover:opacity-100'
                  } ${
                    theme === 'dark' 
                      ? 'bg-white/[0.02] border border-dashed border-white/10 hover:border-white/20' 
                      : 'bg-slate-100/60 border border-dashed border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider flex items-center gap-1 ${
                    isOwner 
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' 
                      : 'bg-[#DC2626]/15 border border-[#DC2626]/30 text-[#DC2626]'
                  }`}>
                    {isOwner ? (
                      <>
                        <Unlock size={8} />
                        <span>Owner Access</span>
                      </>
                    ) : (
                      <>
                        <Lock size={8} />
                        <span>Coming Soon</span>
                      </>
                    )}
                  </div>
                  <div className={`p-4 rounded-2xl bg-gradient-to-tr ${tool.color} text-white shadow-md shrink-0 mb-3 ${isOwner ? '' : 'grayscale-[25%]'}`}>
                    <tool.icon size={24} />
                  </div>
                  <div className="space-y-1 w-full text-center z-10">
                    <h3 className={`font-extrabold text-[11px] sm:text-xs uppercase tracking-tight leading-tight truncate px-1 ${theme === 'dark' ? 'text-white/70' : 'text-slate-700'}`}>{tool.title}</h3>
                    <p className={`text-[8px] uppercase tracking-wider font-bold leading-none truncate px-1 block ${isOwner ? 'text-emerald-400 font-extrabold' : 'text-[#DC2626]'}`}>
                      {isOwner ? 'Click to Open' : tool.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {toolsSubTab === 'record' && (
        <motion.div key="record" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <button onClick={handleToolsBack} className="text-white/40 hover:text-[#DC2626] transition-colors flex items-center gap-1.5 text-xs font-black uppercase"><ArrowLeft size={14} /> Back</button>
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                id="record-page-audio-upload" 
                accept="audio/*" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && handleUploadAudioRecordPage) {
                    handleUploadAudioRecordPage(file);
                  }
                  e.target.value = '';
                }} 
              />
              <button 
                onClick={() => document.getElementById('record-page-audio-upload')?.click()}
                className="px-3.5 py-1.5 bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black text-[10px] rounded-xl shadow-lg shadow-[#DC2626]/20 transition-all uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                title={`Upload audio (${isPremium ? 'Up to 4 hours for Premium' : 'Up to 30 mins'})`}
              >
                <PlusCircle size={14} />
                <span>Upload Audio</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-black/20 font-mono">{isPremium ? '4HR MAX' : '30MIN MAX'}</span>
              </button>
              <button onClick={() => setShowHelp(true)} className="p-2 hover:bg-white/5 rounded-xl transition-all"><Info size={18} className="text-white/40 hover:text-white" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className={`${theme === 'dark' ? 'bg-[#13111C]/60 border-white/5' : 'bg-white border-slate-200'} border p-6 sm:p-10 rounded-[2.5rem] relative flex flex-col items-center text-center justify-center min-h-[350px] overflow-hidden`}>
                <div className="space-y-6 my-auto relative z-10 w-full max-w-md flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-1 shadow-lg shadow-red-500/5">
                    <FileAudio size={40} />
                  </div>

                  {!isProcessingFinal && (
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-xl text-white">Transcribe Recorded Audio</h3>
                      <p className="text-xs text-white/50 max-w-sm mx-auto leading-relaxed">Upload your pre-recorded lecture audio to automatically transcribe speech into structured study notes and AI summaries.</p>
                    </div>
                  )}

                  {!isProcessingFinal && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                      {isNativePlatform() && handleToggleRecording && (
                        <button 
                          type="button"
                          onClick={handleToggleRecording}
                          className="px-6 py-3.5 bg-gradient-to-r from-[#DC2626] via-red-600 to-purple-600 hover:brightness-110 text-white font-black text-xs rounded-2xl shadow-xl shadow-[#DC2626]/30 transition-all uppercase tracking-wider flex items-center gap-2 cursor-pointer active:scale-95 border border-white/20"
                        >
                          <Mic size={16} className="animate-pulse" />
                          <span>Record Lecture Audio</span>
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={() => document.getElementById('record-page-audio-upload')?.click()}
                        className={`px-6 py-3.5 ${isNativePlatform() ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10' : 'bg-[#DC2626] hover:bg-[#DC2626]/90 text-white shadow-xl shadow-[#DC2626]/20'} font-black text-xs rounded-2xl transition-all uppercase tracking-wider flex items-center gap-2 cursor-pointer active:scale-95`}
                      >
                        <Upload size={16} />
                        <span>Upload Recorded Audio</span>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-black/20 font-mono">{isPremium ? '4HR MAX' : '30MIN MAX'}</span>
                      </button>
                    </div>
                  )}

                  {isProcessingFinal && (
                    <div className="space-y-4 py-4 w-full">
                      <div className="w-12 h-12 bg-[#DC2626]/10 rounded-2xl flex items-center justify-center mx-auto animate-spin"><RefreshCcw size={20} className="text-[#DC2626]" /></div>
                      <div className="space-y-1">
                        <p className="text-xs font-black text-white uppercase tracking-wider">Processing Audio Session</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Converting Sound into structured markdown notes...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {isTranscribing && (
                <div className="p-5 bg-white/5 border border-white/5 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase text-[#DC2626] tracking-wider">Transcribing Lecture Speech...</p></div>
                  <p className="text-xs text-white/80 leading-relaxed max-h-[150px] overflow-y-auto custom-scrollbar italic">{transcriptionNotes || 'Waiting for voice audio streams...'}</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="p-5 bg-white/5 border border-white/5 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase text-[#DC2626] tracking-wider">Analyzing Concepts...</p></div>
                  <p className="text-xs text-white/40">Compiling extracted text with visual board notes to structure study guides...</p>
                </div>
              )}

              {selectedSession && getAudioSrc(selectedSession) && (
                <div className={`${theme === 'dark' ? 'bg-[#181D2C] border-white/10' : 'bg-slate-50 border-slate-200'} p-5 sm:p-6 rounded-[2rem] border space-y-4 shadow-xl relative overflow-hidden`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <Mic size={20} className="text-[#DC2626]" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase tracking-tight`}>Voice Recording Audio</h4>
                      <p className={`text-[8px] ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'} tracking-wider uppercase font-bold`}>{selectedSession.title} | {selectedSession.duration}</p>
                    </div>
                  </div>
                  <audio 
                    src={getAudioSrc(selectedSession)} 
                    controls 
                    className="w-full h-10 rounded-xl bg-transparent focus:outline-none"
                  />
                </div>
              )}

              {analysisResult && (
                <div className={`${theme === 'dark' ? 'bg-[#181D2C] border-white/10' : 'bg-white border-slate-200'} p-6 rounded-[2rem] border space-y-6 relative overflow-hidden shadow-xl`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-black text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>Main Notes & Voice Transcript</h3>
                      <p className={`text-[10px] ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'} tracking-wider uppercase font-bold`}>Generated Literal Transcription</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { navigator.clipboard.writeText(analysisResult); setUserNotification("Custom notes copied!"); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all" title="Copy Notes"><Copy size={16} className="text-white/60 hover:text-white" /></button>
                      <button onClick={() => { if(selectedSession) uploadHistoryToOmni(selectedSession); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-[#DC2626]" title="Discuss with Omni AI"><Brain size={16} className="" /></button>
                      <button onClick={() => shareAnalysis(analysisResult)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all" title="Share Notes"><Share2 size={16} className="text-white/60 hover:text-white" /></button>
                    </div>
                  </div>
                  <div className={`markdown-body prose ${theme === 'dark' ? 'prose-invert prose-p:text-white/70 prose-headings:text-white text-white/85' : 'prose-slate text-slate-800'} max-w-none text-xs sm:text-sm leading-relaxed max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar pr-4`}>
                    <MarkdownRenderer selectable={true} content={analysisResult} />
                  </div>
                </div>
              )}

              {refurbishedResult && (
                <div className={`${theme === 'dark' ? 'bg-[#141221] border-[#DC2626]/20' : 'bg-rose-50/50 border-rose-100'} p-6 sm:p-8 rounded-[2rem] border space-y-6 relative overflow-hidden shadow-2xl mt-6`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-black text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter flex items-center gap-2`}>
                        <span className="text-[#DC2626]">✨</span> Refurbished Note
                      </h3>
                      <p className={`text-[10px] ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'} tracking-wider uppercase font-bold`}>Refined, polished, and expanded study companion</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { navigator.clipboard.writeText(refurbishedResult); setUserNotification("Refurbished note copied!"); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all" title="Copy Notes"><Copy size={16} className="text-white/60 hover:text-white" /></button>
                      <button onClick={() => shareAnalysis(refurbishedResult)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all" title="Share Notes"><Share2 size={16} className="text-white/60 hover:text-white" /></button>
                    </div>
                  </div>
                  <div className={`markdown-body prose ${theme === 'dark' ? 'prose-invert prose-p:text-white/70 prose-headings:text-white text-white/85' : 'prose-slate text-slate-800'} max-w-none text-xs sm:text-sm leading-relaxed max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar pr-4`}>
                    <MarkdownRenderer selectable={true} content={refurbishedResult} />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className={`${theme === 'dark' ? 'bg-[#13111C]/40 border-white/5' : 'bg-white border-slate-200'} border p-5 sm:p-6 rounded-3xl space-y-5 flex flex-col`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-tight">Recordings</h3>
                  <History size={16} className="text-white/20" />
                </div>

                <div className="space-y-2.5 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                  {sessions.length === 0 ? (
                    <div className="text-center py-10 opacity-10 space-y-2">
                      <Mic size={32} className="mx-auto" />
                      <p className="text-[9px] font-black uppercase tracking-widest">No Recordings Found</p>
                    </div>
                  ) : (
                    sessions.map((session: any) => (
                      <div 
                        key={session.id} 
                        onClick={() => loadRecordingSession(session)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer relative group overflow-hidden ${selectedSession?.id === session.id ? 'bg-[#DC2626]/5 border-[#DC2626]/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                      >
                        <div className="flex items-start justify-between relative z-10">
                          <div className="space-y-0.5">
                            <h4 className="text-[10px] font-black text-white uppercase tracking-tight line-clamp-1 group-hover:text-[#DC2626] transition-colors">{session.title}</h4>
                            <p className="text-[8px] text-white/40 uppercase tracking-widest font-bold">{session.date} | {session.duration}</p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); togglePinLectureSession(session.id); }} className="p-1.5 hover:text-red-500 bg-slate-100 dark:bg-white/5 rounded-lg transition-all" title="Pin Recording">
                              <Pin size={10} className={session.isPinned ? "text-[#DC2626] fill-[#DC2626]" : "text-white/30"} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteLectureSession(session.id); }} className="p-1.5 hover:text-red-500 bg-slate-100 dark:bg-white/5 rounded-lg transition-all" title="Delete Recording">
                              <Trash2 size={10} className="text-white/30 hover:text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {toolsSubTab === 'notebook' && (
        <motion.div key="notebook" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={selectedNote ? "w-full flex-1 flex flex-col h-full min-h-0 overflow-hidden" : "w-full flex-1 flex flex-col h-full min-h-0 overflow-y-auto px-4 py-4 space-y-6 custom-scrollbar"}>
          {!selectedNote && (
            <div className="flex items-center justify-between px-2 sticky top-0 z-40 bg-transparent py-2">
              <button onClick={() => { setSelectedNote(null); handleToolsBack(); }} className="text-white/40 hover:text-[#DC2626] transition-all flex items-center gap-1.5 text-xs font-black uppercase cursor-pointer">
                <ArrowLeft size={14} /> Back
              </button>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setSelectedNote({ title: '', content: '', attachments: [], createdAt: new Date() });
                    if (typeof setNotePreviewMode === 'function') {
                      setNotePreviewMode(false);
                    }
                  }} 
                  className="px-3.5 py-1.5 bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black text-[10px] rounded-xl shadow-lg shadow-[#DC2626]/20 transition-all uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle size={12} /> New
                </button>
              </div>
            </div>
          )}

          {selectedNote ? (
            isPodcastActive ? (
              // FULL SCREEN PODCAST PAGE SEAMLESSLY INTEGRATED
              <div className="w-full flex-1 flex flex-col bg-[#070A12] min-h-[calc(100vh-65px)]">
                <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0B0F1D]/80 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/10 rounded-xl flex items-center justify-center animate-pulse">
                      <Volume2 className="text-green-400" size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Omni &amp; Zeal</h3>
                      <p className="text-[8px] text-green-500 font-bold uppercase tracking-widest">Podcast Chat Active</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {podcastDialogue.length > 0 && (
                      <div className="flex items-center gap-2">
                        {podcastSpeechIndex !== null ? (
                          <button 
                            onClick={stopPodcastSpeech}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 border border-red-600/30 text-red-500 hover:bg-red-600/30 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all animate-pulse shadow-lg shadow-red-500/10 cursor-pointer"
                            title="Stop Audio Discussion"
                          >
                            <Volume2 size={12} className="animate-bounce" />
                            <span>Stop</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => playPodcastDialogueLine(0, podcastDialogue)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                            title="Listen to Podcast"
                          >
                            <VolumeX size={12} />
                            <span>Speak</span>
                          </button>
                        )}
                      </div>
                    )}
                    <button onClick={() => setIsPodcastActive(false)} className="text-white/40 hover:text-white shrink-0 cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-[#08070F]">
                  {podcastDialogue.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
                      <div className="flex items-center justify-center gap-4 relative">
                        <div className="absolute inset-0 bg-red-500/10 blur-3xl rounded-full" />
                        <div className="relative w-16 h-16 bg-black border-2 border-red-500/50 rounded-2xl flex items-center justify-center shadow-2xl shadow-red-500/20">
                          <Brain size={28} className="text-red-500 drop-shadow-[0_0_10px_#EF4444] animate-pulse" />
                        </div>
                        <span className="text-red-500/30 text-lg font-bold font-mono">&amp;</span>
                        <div className="relative w-16 h-16 bg-black border-2 border-red-950/50 rounded-2xl flex items-center justify-center shadow-2xl">
                          <span className="font-display font-black text-red-800 text-2xl">Z</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-lg font-black text-white uppercase tracking-tight">Podcast Analysis</h4>
                        <p className="text-xs text-white/40 max-w-xs mx-auto">Omni and Zeal are ready to discuss your source content.</p>
                      </div>
                      <button 
                        onClick={() => generatePodcastDiscussion(selectedNote.content)}
                        disabled={isGeneratingPodcast}
                        className="px-8 py-4 bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:scale-110 active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-[#DC2626]/20 cursor-pointer"
                      >
                        {isGeneratingPodcast ? 'Analyzing...' : 'Create Podcast'}
                      </button>
                    </div>
                  ) : (
                    podcastDialogue.map((d: any, idx: number) => (
                      <motion.div 
                        key={d.id || idx} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${d.char === 'User' ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`max-w-[90%] p-4 rounded-3xl text-xs leading-relaxed relative group ${d.char === 'User' ? 'bg-[#DC2626] text-white shadow-lg shadow-[#DC2626]/10' : 'bg-white/5 text-white/95 border border-white/10'}`}>
                          <div className="flex items-center justify-between gap-6 mb-2">
                            <span className={`text-[8px] font-black uppercase tracking-widest ${d.char === 'User' ? 'text-white/60' : (d.char === 'Omni' ? 'text-blue-400' : 'text-purple-400')}`}>{d.char}</span>
                            {d.char !== 'User' && (
                              <button 
                                onClick={() => {
                                  setReplyingTo(d);
                                  const inp = document.getElementById('tools-podcast-chat-input');
                                  if (inp) inp.focus();
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter cursor-pointer"
                              >
                                Tag & Reply
                              </button>
                            )}
                          </div>
                          
                          {d.replyTo && (
                            <div className="mb-2 p-2 bg-white/5 border-l-2 border-white/20 rounded-xl text-[9px] opacity-60 italic max-h-12 overflow-hidden truncate">
                              {d.replyTo}
                            </div>
                          )}

                          <p className="leading-relaxed font-sans">{d.text}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                  {isGeneratingPodcast && (
                    <div className="flex items-center gap-2 text-white/20 ml-2">
                      <div className="animate-bounce">●</div>
                      <div className="animate-bounce delay-75">●</div>
                      <div className="animate-bounce delay-150">●</div>
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t border-white/10 bg-[#050811] shrink-0">
                  {replyingTo && (
                    <div className="mb-3 p-3 bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-1.5 bg-[#DC2626]/20 rounded-lg">
                          <CornerDownRight size={12} className="text-[#DC2626]" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[8px] font-black text-[#DC2626] uppercase tracking-widest">Tagging {replyingTo.char}</p>
                          <p className="text-[10px] text-white/60 truncate line-clamp-1">{replyingTo.text}</p>
                        </div>
                      </div>
                      <button onClick={() => setReplyingTo(null)} className="p-2 text-white/20 hover:text-white shrink-0 cursor-pointer">
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <button 
                        onClick={() => setShowPodcastUploadMenu(!showPodcastUploadMenu)}
                        className={`p-1.5 rounded-lg transition-all ${showPodcastUploadMenu ? 'bg-[#DC2626] text-white shadow-lg' : 'bg-white/5 text-white/40 hover:text-white'}`}
                      >
                        <Plus size={16} />
                      </button>
                      
                      <AnimatePresence>
                        {showPodcastUploadMenu && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowPodcastUploadMenu(false)} />
                            <motion.div 
                              initial={{ y: 20, opacity: 0, scale: 0.9 }}
                              animate={{ y: -160, opacity: 1, scale: 1 }}
                              exit={{ y: 20, opacity: 0, scale: 0.9 }}
                              className="absolute left-0 w-44 bg-[#0F172A] border border-white/10 rounded-2xl p-1 shadow-2xl z-50 flex flex-col gap-1 ring-1 ring-white/10"
                            >
                              <label className="flex items-center gap-2.5 p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer group">
                                <div className="p-1.5 bg-blue-500/10 rounded-lg"><ImageIcon size={14} className="text-blue-400" /></div>
                                <span className="text-[8px] font-black text-white uppercase tracking-widest">Image Source</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => { uploadNoteFile(e, 'image'); setShowPodcastUploadMenu(false); }} />
                              </label>
                              <label className="flex items-center gap-2.5 p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer group">
                                <div className="p-1.5 bg-green-500/10 rounded-lg"><Mic size={14} className="text-green-400" /></div>
                                <span className="text-[8px] font-black text-white uppercase tracking-widest">Voice Memo</span>
                                <input type="file" className="hidden" accept="audio/*" onChange={(e) => { uploadNoteFile(e, 'audio'); setShowPodcastUploadMenu(false); }} />
                              </label>
                              <label className="flex items-center gap-2.5 p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer group">
                                <div className="p-1.5 bg-yellow-500/10 rounded-lg"><FileText size={14} className="text-yellow-400" /></div>
                                <span className="text-[8px] font-black text-white uppercase tracking-widest">Document</span>
                                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={(e) => { uploadNoteFile(e, 'doc'); setShowPodcastUploadMenu(false); }} />
                              </label>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    <textarea 
                      id="tools-podcast-chat-input"
                      autoComplete="off"
                      placeholder="Chat with Omni &amp; Zeal..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-3 text-xs text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-white/20 resize-none h-[42px] min-h-[42px] max-h-[112px] custom-scrollbar leading-relaxed"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          const target = e.target as HTMLTextAreaElement;
                          if (target.value.trim()) {
                            handlePodcastInput(target.value);
                            target.value = '';
                            target.style.height = '42px';
                          }
                        }
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${Math.min(target.scrollHeight, 112)}px`;
                      }}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <button 
                        onClick={() => {
                          const input = document.getElementById('tools-podcast-chat-input') as HTMLTextAreaElement;
                          if (input && input.value.trim()) {
                            handlePodcastInput(input.value);
                            input.value = '';
                            input.style.height = '42px';
                          }
                        }}
                        className="p-1.5 bg-[#DC2626] text-white rounded-lg shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // INTEGRATED SEAMLESS ACTIVE NOTE WORKSPACE (READ & EDIT MODES)
              <div className={`flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden relative transition-colors duration-200 ${noteTheme === 'light' ? 'bg-[#F6F4FA] text-[#1D1235]' : 'bg-[#0B0818] text-white'}`}>
                {/* STATIONARY TOP HEADER BAR */}
                <div className={`sticky top-0 z-40 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0 backdrop-blur-md border-b transition-colors ${
                  noteTheme === 'light' 
                    ? 'bg-[#EFEAF7]/95 border-[#D8CEEB] text-[#1D1235]' 
                    : 'bg-[#120D24]/95 border-white/10 text-white'
                }`}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button 
                      onClick={() => {
                        setSelectedNote(null);
                      }} 
                      className={`p-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold ${
                        noteTheme === 'light' ? 'hover:bg-purple-200/60 text-purple-950' : 'hover:bg-white/10 text-white/80'
                      }`}
                      title="Back to Notes list"
                    >
                      <ArrowLeft size={18} />
                      <span className="hidden sm:inline">Notes</span>
                    </button>

                    {notePreviewMode ? (
                      <h2 className="text-base sm:text-lg font-black truncate px-2 max-w-[200px] sm:max-w-md">
                        {selectedNote.title || 'Notes'}
                      </h2>
                    ) : (
                      <input 
                        value={selectedNote.title || ''} 
                        onChange={(e) => setSelectedNote({...selectedNote, title: e.target.value})}
                        readOnly={selectedNote?.sharedAccessType === 'readonly'}
                        className={`bg-transparent border-none text-base sm:text-lg font-black outline-none flex-1 px-2 truncate focus:ring-1 rounded-lg transition-all ${
                          noteTheme === 'light' ? 'text-[#1D1235] placeholder:text-purple-900/40 focus:ring-purple-400' : 'text-white placeholder:text-white/30 focus:ring-white/20'
                        }`}
                        placeholder="Note Title..."
                      />
                    )}
                  </div>

                  {/* HEADER ACTION BUTTONS GROUP */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {notePreviewMode ? (
                      /* READ MODE TOP HEADER BUTTONS (Image 1 style) */
                      <>
                        {/* Share Button */}
                        <button 
                          onClick={() => {
                            if (navigator.clipboard && selectedNote?.content) {
                              navigator.clipboard.writeText(`${selectedNote.title || 'Note'}\n\n${selectedNote.content}`);
                              if (setUserNotification) setUserNotification("Note content copied to clipboard!");
                            }
                          }}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            noteTheme === 'light' ? 'hover:bg-purple-200/60 text-purple-900' : 'hover:bg-white/10 text-white/80'
                          }`}
                          title="Share Note"
                        >
                          <Share2 size={18} />
                        </button>

                        {/* Theme / Shirt Toggle Button */}
                        <button 
                          onClick={() => setNoteTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                          className={`p-2 rounded-xl transition-all cursor-pointer ${
                            noteTheme === 'light' ? 'bg-purple-200/80 text-purple-950 hover:bg-purple-300/80' : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                          title={`Switch to ${noteTheme === 'dark' ? 'Light Theme' : 'Dark Theme'}`}
                        >
                          <Shirt size={18} />
                        </button>

                        {/* 3-Dots Menu */}
                        <div className="relative">
                          <button 
                            onClick={() => setShowNoteMenu(!showNoteMenu)}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${
                              noteTheme === 'light' ? 'hover:bg-purple-200/60 text-purple-900' : 'hover:bg-white/10 text-white/80'
                            }`}
                            title="Note Options"
                          >
                            <MoreVertical size={18} />
                          </button>

                          <AnimatePresence>
                            {showNoteMenu && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowNoteMenu(false)} />
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                  className={`absolute right-0 mt-2 w-52 rounded-2xl p-2 shadow-2xl z-50 border flex flex-col gap-1 ${
                                    noteTheme === 'light' ? 'bg-white border-purple-200 text-purple-950' : 'bg-[#181329] border-white/10 text-white'
                                  }`}
                                >
                                  <button 
                                    onClick={() => {
                                      setShowNoteMenu(false);
                                      if (setNotePreviewMode) setNotePreviewMode(false);
                                    }}
                                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-purple-500/10 text-xs font-bold transition-all text-left cursor-pointer"
                                  >
                                    <Edit2 size={14} className="text-purple-400" />
                                    <span>Switch to Edit Mode</span>
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setShowNoteMenu(false);
                                      setIsPodcastActive(true);
                                      setIsTeacherMode(false);
                                      if (selectedNote) {
                                        let sourceContent = `${selectedNote.title || ''}\n\n${selectedNote.content || ''}`;
                                        if (selectedNote.attachments && selectedNote.attachments.length > 0) {
                                          sourceContent += `\n\nAttached Documents in Note:\n` + selectedNote.attachments.map((att: any) => `- ${att.name || 'Attachment'}: ${att.extractedText || att.text || ''}`).join('\n');
                                        }
                                        generatePodcastDiscussion(sourceContent);
                                      }
                                    }}
                                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-purple-500/10 text-xs font-bold transition-all text-left cursor-pointer"
                                  >
                                    <Mic size={14} className="text-indigo-400" />
                                    <span>Create Podcast</span>
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setShowNoteMenu(false);
                                      if (selectedNote) {
                                        setImportedQuizNote(selectedNote);
                                        setQuizTopic(selectedNote.title || 'Study Note');
                                        
                                        // Convert note attachments into quiz documents if available
                                        if (selectedNote.attachments && selectedNote.attachments.length > 0) {
                                          const docItems = selectedNote.attachments.map((att: any, idx: number) => ({
                                            id: att.id || `att-${Date.now()}-${idx}`,
                                            name: att.name || `Attachment ${idx + 1}`,
                                            size: att.size || 0,
                                            extractedText: att.extractedText || att.text || (att.url ? `Document: ${att.name}` : ''),
                                            pageImages: att.pageImages || []
                                          }));
                                          if ((props as any).setQuizDocuments) {
                                            (props as any).setQuizDocuments(docItems);
                                          }
                                        }
                                        
                                        if (setToolsSubTab) {
                                          setToolsSubTab('quiz');
                                        }
                                        setUserNotification(`Loaded "${selectedNote.title || 'Note'}" into Quiz Generator. Set your options and click Create Quiz!`);
                                      }
                                    }}
                                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-purple-500/10 text-xs font-bold transition-all text-left cursor-pointer"
                                  >
                                    <Zap size={14} className="text-yellow-400" />
                                    <span>Set Quiz on Note</span>
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setShowNoteMenu(false);
                                      const element = document.createElement("a");
                                      const file = new Blob([`${selectedNote.title}\n\n${selectedNote.content}`], {type: 'text/plain'});
                                      element.href = URL.createObjectURL(file);
                                      element.download = `${selectedNote.title || 'note'}.txt`;
                                      document.body.appendChild(element);
                                      element.click();
                                      document.body.removeChild(element);
                                    }}
                                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-purple-500/10 text-xs font-bold transition-all text-left cursor-pointer"
                                  >
                                    <Download size={14} className="text-green-400" />
                                    <span>Export as TXT</span>
                                  </button>
                                  {deleteNote && (
                                    <button 
                                      onClick={() => {
                                        setShowNoteMenu(false);
                                        if (selectedNote?.id) {
                                          deleteNote(selectedNote.id);
                                          setSelectedNote(null);
                                        }
                                      }}
                                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-red-500/10 text-red-400 text-xs font-bold transition-all text-left cursor-pointer"
                                    >
                                      <Trash2 size={14} />
                                      <span>Delete Note</span>
                                    </button>
                                  )}
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </>
                    ) : (
                      /* EDIT MODE TOP HEADER BUTTONS (Image 2 & 3 style) */
                      <>
                        {/* Undo */}
                        <button 
                          onMouseDown={(e) => { e.preventDefault(); if (undoNote) undoNote(); }} 
                          disabled={!noteHistory || noteHistory.length === 0} 
                          className={`p-2 rounded-xl transition-all cursor-pointer disabled:opacity-30 ${
                            noteTheme === 'light' ? 'hover:bg-purple-200/60 text-purple-900' : 'hover:bg-white/10 text-white/80'
                          }`} 
                          title="Undo"
                        >
                          <Undo2 size={18} />
                        </button>

                        {/* Redo */}
                        <button 
                          onMouseDown={(e) => { e.preventDefault(); if (redoNote) redoNote(); }} 
                          disabled={!redoStack || redoStack.length === 0} 
                          className={`p-2 rounded-xl transition-all cursor-pointer disabled:opacity-30 ${
                            noteTheme === 'light' ? 'hover:bg-purple-200/60 text-purple-900' : 'hover:bg-white/10 text-white/80'
                          }`} 
                          title="Redo"
                        >
                          <Redo2 size={18} />
                        </button>

                        {/* 3-Dots Menu */}
                        <div className="relative">
                          <button 
                            onClick={() => setShowNoteMenu(!showNoteMenu)}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${
                              noteTheme === 'light' ? 'hover:bg-purple-200/60 text-purple-900' : 'hover:bg-white/10 text-white/80'
                            }`}
                            title="Note Options"
                          >
                            <MoreVertical size={18} />
                          </button>

                          <AnimatePresence>
                            {showNoteMenu && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowNoteMenu(false)} />
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                  className={`absolute right-0 mt-2 w-52 rounded-2xl p-2 shadow-2xl z-50 border flex flex-col gap-1 ${
                                    noteTheme === 'light' ? 'bg-white border-purple-200 text-purple-950' : 'bg-[#181329] border-white/10 text-white'
                                  }`}
                                >
                                  <button 
                                    onClick={() => {
                                      setShowNoteMenu(false);
                                      if (setNotePreviewMode) setNotePreviewMode(true);
                                    }}
                                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-purple-500/10 text-xs font-bold transition-all text-left cursor-pointer"
                                  >
                                    <BookOpen size={14} className="text-purple-400" />
                                    <span>Switch to Read Mode</span>
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setShowNoteMenu(false);
                                      setNoteTheme(prev => prev === 'dark' ? 'light' : 'dark');
                                    }}
                                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-purple-500/10 text-xs font-bold transition-all text-left cursor-pointer"
                                  >
                                    <Shirt size={14} className="text-indigo-400" />
                                    <span>Toggle Theme ({noteTheme === 'dark' ? 'Light' : 'Dark'})</span>
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Checkmark button (Done / Save Editing) */}
                        <button 
                          onClick={() => {
                            if (saveNote) saveNote(selectedNote.content || '', selectedNote.title || 'Untitled Note', selectedNote.id);
                            if (setNotePreviewMode) setNotePreviewMode(true);
                            if (setUserNotification) setUserNotification("Saved & Switched to Read Mode!");
                          }} 
                          className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg transition-all flex items-center justify-center cursor-pointer active:scale-95 ml-1" 
                          title="Done Editing & Save"
                        >
                          <Check size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* MAIN SCROLLABLE CONTENT AREA */}
                <div className="flex-1 flex flex-col relative min-h-0 h-full overflow-hidden">
                  <div 
                    ref={scrollContainerRef}
                    onScroll={(e) => {
                      if (handleNoteScroll) handleNoteScroll(e);
                      const el = e.currentTarget;
                      const isUp = el.scrollTop < el.scrollHeight - el.clientHeight - 80;
                      setIsScrolledUp(isUp);
                    }}
                    className="flex-1 overflow-y-auto min-h-0 h-full px-4 sm:px-12 md:px-20 lg:px-28 py-6 custom-scrollbar relative overscroll-contain touch-pan-y"
                    style={{
                      WebkitOverflowScrolling: 'touch',
                    }}
                  >
                    {(selectedNote.isTranscribing || (props.isAudioTranscribing && selectedNote.id === props.activeAudioNoteId)) && (
                      <div className="mb-6 flex items-center gap-2.5 px-4 py-2.5 bg-red-500/15 border border-red-500/30 rounded-xl w-fit">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                          <RefreshCcw size={12} className="animate-spin" /> Transcribing Audio &amp; Writing Note...
                        </span>
                      </div>
                    )}

                    {notePreviewMode ? (
                      /* READ MODE VIEW (Matching Image 1) */
                      <div className="space-y-6 relative z-10 select-text pb-36 min-h-full">
                        <div className="border-b border-purple-500/20 pb-4 mb-4">
                          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${noteTheme === 'light' ? 'text-[#1D1235]' : 'text-white'}`}>
                            {selectedNote.title || 'Untitled Note'}
                          </h1>
                          <p className={`text-[10px] font-mono mt-1 uppercase tracking-widest flex items-center gap-2 ${noteTheme === 'light' ? 'text-purple-900/50' : 'text-white/40'}`}>
                            <span className="text-emerald-500 font-bold">Read Mode</span>
                            <span>•</span>
                            <span>{selectedNote.createdAt ? new Date(selectedNote.createdAt).toLocaleDateString() : 'Just now'}</span>
                          </p>
                        </div>

                        <div className={`prose max-w-none text-sm sm:text-base leading-[28px] font-sans ${noteTheme === 'light' ? 'prose-slate text-[#1D1235]' : 'prose-invert text-white/90'}`}>
                          <MarkdownRenderer selectable={true} content={selectedNote.content || "_No content. Tap edit button or toolbar below to start writing._"} />
                        </div>

                        {selectedNote.attachments && selectedNote.attachments.length > 0 && (
                          <div className="mt-8 border-t border-purple-500/20 pt-4 space-y-3">
                            <p className={`text-[10px] font-bold tracking-widest uppercase ${noteTheme === 'light' ? 'text-purple-900/60' : 'text-white/60'}`}>
                              Attachments ({selectedNote.attachments.length})
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {selectedNote.attachments.map((att: any, attIdx: number) => (
                                <div key={attIdx} className={`border rounded-2xl p-3 flex items-center justify-between ${noteTheme === 'light' ? 'bg-purple-100/50 border-purple-200 text-purple-950' : 'bg-white/5 border-white/10 text-white'}`}>
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    <FileText size={18} className="text-purple-400 shrink-0" />
                                    <p className="text-xs font-bold truncate">{att.name || 'attachment'}</p>
                                  </div>
                                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-purple-500/10 rounded-lg">
                                    <ExternalLink size={14} />
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* EDIT MODE VIEW (Matching Image 2 & 3) */
                      <div className="flex-1 relative z-10 pb-36 min-h-full flex flex-col">
                        <textarea
                          id="note-main-textarea"
                          style={{ 
                            minHeight: '65vh',
                            lineHeight: '28px'
                          }}
                          value={selectedNote.content || ''}
                          onChange={(e) => handleNoteContentChange(e.target.value)}
                          readOnly={selectedNote?.sharedAccessType === 'readonly'}
                          onFocus={(e) => {
                            lastFocusedBlock.current = { id: 'main', start: e.target.selectionStart, end: e.target.selectionEnd };
                          }}
                          onBlur={(e) => {
                            lastFocusedBlock.current = { id: 'main', start: e.target.selectionStart, end: e.target.selectionEnd };
                          }}
                          className={`w-full bg-transparent border-none text-sm sm:text-base leading-[28px] outline-none resize-none font-sans p-0 focus:outline-none flex-1 ${
                            noteTheme === 'light' ? 'text-[#1D1235] placeholder:text-purple-900/30' : 'text-white/90 placeholder:text-white/20'
                          }`}
                          placeholder="Type your notes here..."
                        />
                      </div>
                    )}
                  </div>

                  {/* Scroll Down Floating Button */}
                  {isScrolledUp && (
                    <button
                      onClick={() => {
                        if (scrollContainerRef.current) {
                          scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
                        }
                        setIsScrolledUp(false);
                      }}
                      className="absolute bottom-20 right-6 p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-2xl z-40 transition-all flex items-center justify-center animate-bounce cursor-pointer"
                      title="Scroll to Bottom"
                    >
                      <ChevronDown size={18} />
                    </button>
                  )}
                </div>

                {/* READ MODE BOTTOM DOCKED TOOLBAR (Matching Image 1) */}
                {notePreviewMode ? (
                  <div className="absolute bottom-4 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
                    <div className={`pointer-events-auto flex items-center justify-around gap-4 sm:gap-6 px-6 py-3.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl border ${
                      noteTheme === 'light'
                        ? 'bg-[#E5DFFA]/95 border-purple-300 text-purple-950'
                        : 'bg-[#18122B]/95 border-purple-500/30 text-white'
                    }`}>
                      {/* 1. AI Sparkles / Generator */}
                      <button 
                        onClick={() => {
                          if (setNotePreviewMode) setNotePreviewMode(false);
                          insertText('**AI Summary:** ', '');
                        }}
                        className="p-2.5 rounded-2xl hover:bg-purple-500/20 transition-all cursor-pointer hover:scale-110 active:scale-95"
                        title="AI Assistant"
                      >
                        <Sparkles size={22} className="text-purple-400" />
                      </button>

                      {/* 2. Camera / Image Attachment */}
                      <label className="p-2.5 rounded-2xl hover:bg-purple-500/20 transition-all cursor-pointer hover:scale-110 active:scale-95">
                        <Camera size={22} className="text-indigo-400" />
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadNoteFile(e, 'image')} />
                      </label>

                      {/* 3. Mic / Voice */}
                      <label className="p-2.5 rounded-2xl hover:bg-purple-500/20 transition-all cursor-pointer hover:scale-110 active:scale-95">
                        <Mic size={22} className="text-red-400" />
                        <input type="file" className="hidden" accept="audio/*" onChange={(e) => uploadNoteFile(e, 'audio')} />
                      </label>

                      {/* 4. Canvas / Drawing */}
                      <button 
                        onClick={() => {
                          if (setNotePreviewMode) setNotePreviewMode(false);
                          insertText('\n> [Drawing/Canvas Area]\n', '');
                        }}
                        className="p-2.5 rounded-2xl hover:bg-purple-500/20 transition-all cursor-pointer hover:scale-110 active:scale-95"
                        title="Canvas / Compass"
                      >
                        <Compass size={22} className="text-blue-400" />
                      </button>

                      {/* 5. Checklist / Tasks */}
                      <button 
                        onClick={() => {
                          if (setNotePreviewMode) setNotePreviewMode(false);
                          insertText('\n- [ ] ', '');
                        }}
                        className="p-2.5 rounded-2xl hover:bg-purple-500/20 transition-all cursor-pointer hover:scale-110 active:scale-95"
                        title="Add Checklist"
                      >
                        <CheckSquare size={22} className="text-emerald-400" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* EDIT MODE BOTTOM TOOLBAR (Matching Image 2 & 3) */
                  <div className={`sticky bottom-0 z-30 px-4 py-3 border-t flex items-center justify-around gap-2 shrink-0 backdrop-blur-md ${
                    noteTheme === 'light'
                      ? 'bg-[#EFEAF7]/95 border-[#D8CEEB] text-[#1D1235]'
                      : 'bg-[#120D24]/95 border-white/10 text-white'
                  }`}>
                    {/* 1. AI Sparkles */}
                    <button 
                      onClick={() => insertText('**AI Note:** ', '')}
                      className="p-2 rounded-xl hover:bg-purple-500/20 transition-all cursor-pointer"
                      title="AI Prompt"
                    >
                      <Sparkles size={18} className="text-purple-400" />
                    </button>

                    {/* 2. Aa Formatting Menu */}
                    <div className="relative">
                      <button 
                        onClick={() => setShowAaFormattingMenu(!showAaFormattingMenu)}
                        className="p-2 rounded-xl hover:bg-purple-500/20 transition-all cursor-pointer font-bold text-xs"
                        title="Text Style (Aa)"
                      >
                        Aa
                      </button>
                      <AnimatePresence>
                        {showAaFormattingMenu && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowAaFormattingMenu(false)} />
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 p-2 rounded-2xl shadow-2xl border flex items-center gap-1 z-50 ${
                                noteTheme === 'light' ? 'bg-white border-purple-200 text-purple-950' : 'bg-[#1B162C] border-white/10 text-white'
                              }`}
                            >
                              <button onClick={() => { insertText('# ', ''); setShowAaFormattingMenu(false); }} className="px-2 py-1 text-xs font-black hover:bg-purple-500/20 rounded-lg">H1</button>
                              <button onClick={() => { insertText('## ', ''); setShowAaFormattingMenu(false); }} className="px-2 py-1 text-xs font-black hover:bg-purple-500/20 rounded-lg">H2</button>
                              <button onClick={() => { insertText('**', '**'); setShowAaFormattingMenu(false); }} className="p-1.5 hover:bg-purple-500/20 rounded-lg"><Bold size={14} /></button>
                              <button onClick={() => { insertText('*', '*'); setShowAaFormattingMenu(false); }} className="p-1.5 hover:bg-purple-500/20 rounded-lg"><Italic size={14} /></button>
                              <button onClick={() => { insertText('\n- ', ''); setShowAaFormattingMenu(false); }} className="p-1.5 hover:bg-purple-500/20 rounded-lg"><List size={14} /></button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* 3. Camera */}
                    <label className="p-2 rounded-xl hover:bg-purple-500/20 transition-all cursor-pointer">
                      <Camera size={18} className="text-indigo-400" />
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => uploadNoteFile(e, 'image')} />
                    </label>

                    {/* 4. Mic */}
                    <label className="p-2 rounded-xl hover:bg-purple-500/20 transition-all cursor-pointer">
                      <Mic size={18} className="text-red-400" />
                      <input type="file" className="hidden" accept="audio/*" onChange={(e) => uploadNoteFile(e, 'audio')} />
                    </label>

                    {/* 5. Compass / Canvas */}
                    <button 
                      onClick={() => insertText('\n> [Canvas]\n', '')}
                      className="p-2 rounded-xl hover:bg-purple-500/20 transition-all cursor-pointer"
                      title="Canvas"
                    >
                      <Compass size={18} className="text-blue-400" />
                    </button>

                    {/* 6. Checklist */}
                    <button 
                      onClick={() => insertText('\n- [ ] ', '')}
                      className="p-2 rounded-xl hover:bg-purple-500/20 transition-all cursor-pointer"
                      title="Checklist"
                    >
                      <CheckSquare size={18} className="text-emerald-400" />
                    </button>
                  </div>
                )}

                {/* SEAMLESS FOOTER STATUS BAR */}
                  <div className="px-4 sm:px-6 py-2.5 border-t border-white/10 bg-[#060810] flex items-center justify-between shrink-0 text-xs text-white/40 font-mono select-none">
                    <span>Notebook Workspace</span>
                    <span>{selectedNote.content ? selectedNote.content.split(' ').filter(Boolean).length : 0} words</span>
                  </div>
                </div>
            )
          ) : (
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar bg-[#13111C]">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pb-20">
                {userNotes.length === 0 ? (
                  <div className="col-span-full py-20 text-center opacity-10 space-y-6">
                    <FileText size={64} className="mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Notebook Empty</p>
                  </div>
                ) : (
                  userNotes.map((note: any) => {
                    let pressTimer: any = null;
                    const startPress = () => {
                      pressTimer = setTimeout(() => {
                        setNoteToDelete(note);
                      }, 700);
                    };
                    const cancelPress = () => {
                      if (pressTimer) clearTimeout(pressTimer);
                    };
                    return (
                      <motion.div 
                        key={note.id} 
                        onClick={() => {
                          setSelectedNote(note);
                          setNoteHistory([]);
                          setRedoStack([]);
                          setIsPodcastActive(false);
                          setActiveNotebookTab('write');
                          if (setNotePreviewMode) setNotePreviewMode(false);
                        }}
                        onMouseDown={startPress}
                        onMouseUp={cancelPress}
                        onMouseLeave={cancelPress}
                        onTouchStart={startPress}
                        onTouchEnd={cancelPress}
                        className={`p-4 rounded-xl border transition-all cursor-pointer relative group overflow-hidden ${theme === 'dark' ? 'bg-[#151B2B] border-white/5 hover:border-[#DC2626]/50 shadow-xl' : 'bg-white border-slate-200 shadow-sm'}`}
                      >
                        {(note.isTranscribing || note.id === activeAudioNoteId) && (
                          <div className="absolute top-2.5 left-2.5 z-30 flex items-center justify-center">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#DC2626]"></span>
                            </span>
                          </div>
                        )}
                        {note.attachments?.length > 0 && (
                          <div className="absolute top-0 right-0 p-1 text-[5px] font-black text-[#DC2626] bg-[#DC2626]/10 rounded-bl-lg border-l border-b border-white/10 uppercase">
                            {note.attachments.length}
                          </div>
                        )}
                        <div className="flex items-start justify-between relative z-10 w-full h-full">
                          <div className="space-y-1 w-full">
                            {(note.isTranscribing || note.id === activeAudioNoteId) && (
                              <div className="mb-1 pl-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#DC2626]/15 border border-[#DC2626]/30 text-[#DC2626] text-[8px] font-black uppercase tracking-widest">
                                <RefreshCcw size={9} className="animate-spin" /> IN PROGRESS
                              </div>
                            )}
                            <h4 className="text-[10px] font-black text-white uppercase tracking-tight line-clamp-1 group-hover:text-[#DC2626] transition-colors font-sans">
                              {note.title || 'Untitled Source'}
                            </h4>
                            <p className="text-[9px] text-white/40 line-clamp-2 leading-tight">
                              {note.content ? note.content.replace(/[#*`_!\[\]\(\)]/g, '').substring(0, 50) : '...'}
                            </p>
                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/5 font-sans">
                              <p className="text-[7px] font-bold text-white/10 uppercase tracking-widest">{note.updatedAt?.toDate ? note.updatedAt.toDate().toLocaleDateString() : 'Now'}</p>
                              <div 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNoteToDelete(note);
                                }} 
                                className="p-1 opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-500 transition-all bg-white/5 rounded-md"
                              >
                                <Trash2 size={8} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Note Deletion Custom Inline Confirmation Dialog */}
              {noteToDelete && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-sm p-6 bg-[#0E0B16] border border-white/10 rounded-3xl shadow-2xl text-center space-y-4"
                  >
                    <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto text-red-500">
                      <Trash2 size={24} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-white text-base uppercase tracking-tight font-sans">Delete Source Note?</h3>
                      <p className="text-xs text-white/40 leading-relaxed font-sans font-medium">Are you sure you want to permanently delete "{noteToDelete.title || 'Untitled Source'}"? This action cannot be undone.</p>
                    </div>
                    <div className="flex gap-3 pt-2 font-sans">
                      <button 
                        onClick={() => setNoteToDelete(null)}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          if (noteToDelete.id) {
                            deleteNote(noteToDelete.id);
                          }
                          setNoteToDelete(null);
                        }}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/20 transition-all"
                      >
                        Yes, Delete
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {toolsSubTab === 'quiz' && (
        <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if (quizCreationMethod !== null) {
                    setQuizCreationMethod(null);
                  } else if (quizState === 'active' || quizState === 'finished' || quizState === 'review') {
                    setQuizState('idle');
                  } else {
                    handleToolsBack();
                  }
                }} 
                className={`p-2 rounded-xl transition-colors flex items-center justify-center ${
                  theme === 'dark' ? 'text-purple-300 hover:text-amber-400 hover:bg-white/5' : 'text-purple-900 hover:text-purple-950 hover:bg-black/5'
                }`}
              >
                <ChevronLeft size={22} />
              </button>

              {(isPremium || (user?.email?.toLowerCase().trim() === 'nuellkelechi@gmail.com')) ? (
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-400" /> Premium
                </span>
              ) : (
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                  dailyQuizUsedCount >= 7 
                    ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse' 
                    : (theme === 'dark' ? 'bg-purple-900/50 text-purple-200 border-purple-500/30' : 'bg-purple-100 text-purple-900 border-purple-200')
                }`}>
                  Quizzes: {dailyQuizUsedCount}/7
                </span>
              )}
            </div>

            <h2 className={`font-black text-lg tracking-wide ${theme === 'dark' ? 'text-white' : 'text-purple-950'}`}>
              Create
            </h2>

            <button
              onClick={() => {
                try {
                  localStorage.removeItem('nsg_current_quiz_progress');
                  setQuizState('idle');
                  setQuizCreationMethod(null);
                  if (setQuizTopic) setQuizTopic('');
                  if (setQuizImages) setQuizImages([]);
                  if (setImportedQuizNote) setImportedQuizNote(null);
                  if (props.setQuizQuestions) props.setQuizQuestions([]);
                  if (props.setUserQuizAnswers) props.setUserQuizAnswers([]);
                  if (props.setQuizScore) props.setQuizScore(0);
                  if (props.setCurrentQuestionIndex) props.setCurrentQuestionIndex(0);
                  if (props.setIsGeneratingQuiz) props.setIsGeneratingQuiz(false);
                  if (setUserNotification) setUserNotification("Quiz session reset.");
                } catch (e) {}
              }}
              className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg transition-all border ${
                theme === 'dark' 
                  ? 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border-purple-500/20' 
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200'
              }`}
            >
              Reset
            </button>
          </div>

          {(quizState === 'idle' || !quizState || (quizState === 'active' && (!quizQuestions || !Array.isArray(quizQuestions) || quizQuestions.length === 0))) && (
            <div className="space-y-6 pt-4 pb-8 transition-all">
              {!user ? (
                <div className="text-center space-y-4 py-12">
                  <p className={`text-sm ${theme === 'dark' ? 'text-purple-200/70' : 'text-slate-600'}`}>You must be logged in to generate quizzes.</p>
                  <button 
                    onClick={() => setShowAuthModal(true)} 
                    className="w-full bg-[#7E22CE] hover:bg-[#6B21A8] text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-purple-600/30 transition-all cursor-pointer"
                  >
                    LOGIN TO PROCEED
                  </button>
                </div>
              ) : quizCreationMethod === null ? (
                /* LANDING VIEW WITH EMPTY TOP & BOTTOM CONTENT (EXACT MATCH TO IMAGES 1 & 8) */
                <div className="min-h-[480px] flex flex-col justify-between pt-12 sm:pt-20 pb-4">
                  <div className="flex-1" />

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-purple-300/60' : 'text-slate-500'}`}>
                        Welcome!
                      </p>
                      <h1 className={`text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        Let's get started!<br />
                        Pick a way to create<br />
                        your quiz.
                      </h1>
                    </div>

                    <div className="space-y-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setQuizCreationMethod('omni')}
                        className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all cursor-pointer border ${
                          theme === 'dark'
                            ? 'bg-[#1D1636] border-purple-500/30 text-white hover:bg-[#261E45]'
                            : 'bg-[#EAE5FE] border-purple-200 text-slate-900 hover:bg-[#E0D8FD] shadow-xs'
                        }`}
                      >
                        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span>Create with AI</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setQuizCreationMethod('pdf')}
                        className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all cursor-pointer border ${
                          theme === 'dark'
                            ? 'bg-[#1D1636] border-purple-500/30 text-white hover:bg-[#261E45]'
                            : 'bg-[#EAE5FE] border-purple-200 text-slate-900 hover:bg-[#E0D8FD] shadow-xs'
                        }`}
                      >
                        <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span>Upload a PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setQuizCreationMethod('image')}
                        className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all cursor-pointer border ${
                          theme === 'dark'
                            ? 'bg-[#1D1636] border-purple-500/30 text-white hover:bg-[#261E45]'
                            : 'bg-[#EAE5FE] border-purple-200 text-slate-900 hover:bg-[#E0D8FD] shadow-xs'
                        }`}
                      >
                        <Camera className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span>Scan a Document</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* SUB-PAGE FORM VIEW */
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className={`font-black text-2xl sm:text-3xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {quizCreationMethod === 'omni' && "Describe the topic."}
                      {quizCreationMethod === 'pdf' && "Upload a document."}
                      {quizCreationMethod === 'image' && "Upload image."}
                    </h3>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-purple-300/70' : 'text-slate-500'}`}>
                      We'll generate the questions.
                    </p>
                  </div>

                  {importedQuizNote && (
                    <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                      theme === 'dark' ? 'bg-purple-950/40 border-purple-500/30' : 'bg-white border-purple-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className={`text-[9px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-purple-300/50' : 'text-purple-700/60'}`}>Active Study Note</p>
                          <p className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{importedQuizNote.title || 'Untitled Note'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setImportedQuizNote(null)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all border ${
                          theme === 'dark' ? 'bg-white/5 border-white/10 text-white/60 hover:text-white' : 'bg-purple-50 border-purple-200 text-slate-600'
                        }`}
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {/* Input Box according to creation method */}
                  {quizCreationMethod === 'omni' && (
                    <div className="relative">
                      <textarea
                        value={quizTopic}
                        onChange={(e) => setQuizTopic(e.target.value)}
                        placeholder="English vocabulary for beginners"
                        className={`w-full rounded-2xl px-5 py-4 text-sm outline-none transition-all min-h-[140px] resize-none border ${
                          theme === 'dark'
                            ? 'bg-[#1D1636] border-purple-500/30 text-white placeholder-purple-300/30 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                            : 'bg-white border-purple-200 text-slate-900 placeholder-slate-400 focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 shadow-sm'
                        }`}
                      />
                      <div className="absolute bottom-3 right-3">
                        <p className={`text-[10px] font-bold ${
                          quizTopic.split(/\s+/).filter(Boolean).length > (isPremium ? 20000 : 300)
                            ? 'text-rose-500'
                            : (theme === 'dark' ? 'text-purple-300/40' : 'text-slate-400')
                        }`}>
                          {quizTopic.split(/\s+/).filter(Boolean).length}/300
                        </p>
                      </div>
                    </div>
                  )}

                  {quizCreationMethod === 'pdf' && (
                    <div className="space-y-3">
                      <label className={`cursor-pointer group block border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                        theme === 'dark'
                          ? 'bg-[#1D1636]/60 border-purple-500/40 hover:border-purple-400'
                          : 'bg-white border-purple-200 hover:border-purple-500 shadow-sm'
                      }`}>
                        <FileText size={32} className="mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                        <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {isUploadingQuizDocs ? 'Uploading PDF...' : 'Upload PDF or Document'}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-purple-300/50' : 'text-slate-400'}`}>
                          Supports PDF, DOC, TXT files
                        </p>
                        <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt,.md" multiple onChange={handleQuizDocumentUpload} disabled={isUploadingQuizDocs} />
                      </label>

                      {quizDocuments && quizDocuments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {quizDocuments.map((docItem: any) => (
                            <div key={docItem.id} className={`border rounded-xl p-2.5 flex items-center gap-2.5 ${
                              theme === 'dark' ? 'bg-purple-950/40 border-purple-500/40 text-white' : 'bg-purple-50 border-purple-200 text-slate-900'
                            }`}>
                              <FileText size={16} className="text-purple-600" />
                              <span className="text-xs font-bold truncate max-w-[160px]">{docItem.name}</span>
                              <button onClick={() => removeQuizDocument && removeQuizDocument(docItem.id)} className="p-1 text-rose-500">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <textarea
                        value={quizTopic}
                        onChange={(e) => setQuizTopic(e.target.value)}
                        placeholder="Optional: Add specific instructions or focus areas for the PDF..."
                        className={`w-full rounded-2xl px-5 py-3 text-sm outline-none transition-all min-h-[90px] resize-none border ${
                          theme === 'dark'
                            ? 'bg-[#1D1636] border-purple-500/30 text-white placeholder-purple-300/30'
                            : 'bg-white border-purple-200 text-slate-900 placeholder-slate-400 shadow-sm'
                        }`}
                      />
                    </div>
                  )}

                  {quizCreationMethod === 'image' && (
                    <div className="space-y-3">
                      <label className={`cursor-pointer group block border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                        theme === 'dark'
                          ? 'bg-[#1D1636]/60 border-purple-500/40 hover:border-purple-400'
                          : 'bg-white border-purple-200 hover:border-purple-500 shadow-sm'
                      }`}>
                        <Camera size={32} className="mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                        <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {isUploadingQuizImages ? 'Uploading Image...' : 'Upload Image or Photo'}
                        </p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-purple-300/50' : 'text-slate-400'}`}>
                          Supports PNG, JPG, WebP
                        </p>
                        <input type="file" className="hidden" accept="image/*" multiple onChange={handleQuizImageUpload} disabled={isUploadingQuizImages} />
                      </label>

                      {quizImages && quizImages.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {quizImages.map((img: any) => (
                            <div key={img.id} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-purple-500/30 shrink-0">
                              <img src={img.preview} className="w-full h-full object-cover" />
                              <button onClick={() => removeQuizImage(img.id)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                <Trash2 size={14} className="text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <textarea
                        value={quizTopic}
                        onChange={(e) => setQuizTopic(e.target.value)}
                        placeholder="Optional: Describe what to focus on in the image..."
                        className={`w-full rounded-2xl px-5 py-3 text-sm outline-none transition-all min-h-[90px] resize-none border ${
                          theme === 'dark'
                            ? 'bg-[#1D1636] border-purple-500/30 text-white placeholder-purple-300/30'
                            : 'bg-white border-purple-200 text-slate-900 placeholder-slate-400 shadow-sm'
                        }`}
                      />
                    </div>
                  )}

                  {/* Number of Questions Selector */}
                  <div className="space-y-2">
                    <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      Number of Questions
                    </p>
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                      {[10, 20, 30, 50].map(count => {
                        const isSelected = quizQuestionCount === count;
                        return (
                          <button
                            key={count}
                            type="button"
                            onClick={() => {
                              if (count > 20 && !isPremium && currentUserData?.role !== 'admin' && !currentUserData?.bypassAllPayments) {
                                if (setUserNotification) setUserNotification("Generating up to 50 questions is a Premium feature! Upgrade to unlock up to 50 questions.");
                                if (setActiveTab) setActiveTab('premium');
                                return;
                              }
                              setQuizQuestionCount(count);
                            }}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                              isSelected
                                ? (theme === 'dark'
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400'
                                    : 'bg-white text-slate-900 border border-purple-200 shadow-sm')
                                : (theme === 'dark'
                                    ? 'text-purple-300/60 hover:text-white'
                                    : 'text-slate-500 hover:text-slate-900')
                            }`}
                          >
                            {count}
                          </button>
                        );
                      })}
                    </div>
                    {(isPremium || (user?.email?.toLowerCase().trim() === 'nuellkelechi@gmail.com') || currentUserData?.bypassAllPayments) && (
                      <div className="pt-2 flex items-center gap-3">
                        <span className="text-xs font-bold text-purple-300">Custom Count:</span>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={quizQuestionCount === 0 ? '' : quizQuestionCount}
                          onChange={(e) => {
                            if (e.target.value === '') {
                              setQuizQuestionCount(0);
                              return;
                            }
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              setQuizQuestionCount(Math.min(50, Math.max(1, val)));
                            }
                          }}
                          onBlur={() => {
                            if (!quizQuestionCount || quizQuestionCount < 1) setQuizQuestionCount(10);
                          }}
                          className="w-20 px-3 py-1.5 rounded-xl bg-[#1D1636] border border-purple-500/30 text-white text-xs font-bold outline-none focus:border-purple-400"
                        />
                      </div>
                    )}
                  </div>

                  {/* Difficulty Level Selector */}
                  <div className="space-y-2">
                    <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      Difficulty Level
                    </p>
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                      {[
                        { label: 'Easy', val: 'Easy' },
                        { label: 'Moderate', val: 'Medium' },
                        { label: 'High', val: 'Hard' }
                      ].map(item => {
                        const isSelected = quizDifficulty === item.val || (item.val === 'Medium' && quizDifficulty === 'Moderate');
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setQuizDifficulty(item.val as any)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                              isSelected
                                ? (theme === 'dark'
                                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400'
                                    : 'bg-white text-slate-900 border border-purple-200 shadow-sm')
                                : (theme === 'dark'
                                    ? 'text-purple-300/60 hover:text-white'
                                    : 'text-slate-500 hover:text-slate-900')
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Answer Type Selector (Multi-select enabled for Premium users) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        Answer Type
                      </p>
                      {!(isPremium || (user?.email?.toLowerCase().trim() === 'nuellkelechi@gmail.com') || currentUserData?.bypassAllPayments) && (
                        <span className="text-[10px] font-bold text-white/40">
                          (Upgrade for Multi-Option Quizzes)
                        </span>
                      )}
                    </div>

                    <div className={`rounded-2xl border p-2 space-y-1 ${
                      theme === 'dark'
                        ? 'bg-[#191130] border-purple-500/20'
                        : 'bg-[#F3F0FF] border-purple-100'
                    }`}>
                      {[
                        { key: 'true_false', label: 'True/False' },
                        { key: 'multiple_choice', label: 'Multiple Choice' },
                        { key: 'single_choice', label: 'Single Choice' }
                      ].map(type => {
                        const currentTypes = Array.isArray(quizAnswerTypes) && quizAnswerTypes.length > 0 
                          ? quizAnswerTypes 
                          : [quizAnswerType || 'multiple_choice'];
                        
                        const isSelected = currentTypes.includes(type.key);

                        const handleSelectOption = () => {
                          const userIsPremium = isPremium || (user?.email?.toLowerCase().trim() === 'nuellkelechi@gmail.com') || currentUserData?.bypassAllPayments;

                          if (userIsPremium) {
                            let nextTypes: string[];
                            if (isSelected) {
                              if (currentTypes.length > 1) {
                                nextTypes = currentTypes.filter(t => t !== type.key);
                              } else {
                                nextTypes = currentTypes; // Keep at least 1 selected
                              }
                            } else {
                              nextTypes = [...currentTypes, type.key];
                            }
                            if (setQuizAnswerTypes) setQuizAnswerTypes(nextTypes);
                            if (setQuizAnswerType) setQuizAnswerType(nextTypes[0] as any);
                          } else {
                            if (!isSelected) {
                              if (setQuizAnswerTypes) setQuizAnswerTypes([type.key]);
                              if (setQuizAnswerType) setQuizAnswerType(type.key as any);
                            }
                          }
                        };

                        return (
                          <div
                            key={type.key}
                            onClick={handleSelectOption}
                            className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all ${
                              isSelected
                                ? (theme === 'dark' ? 'bg-purple-900/40 border border-purple-500/30' : 'bg-white/80 shadow-xs border border-purple-200')
                                : 'hover:bg-white/40 dark:hover:bg-purple-900/20'
                            }`}
                          >
                            <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                              {type.label}
                            </span>
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-[#7C3AED] dark:bg-purple-600 text-white'
                                : 'border-2 border-purple-300 dark:border-purple-600/60'
                            }`}>
                              {isSelected && <Check size={14} className="stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button 
                    onClick={() => {
                      const isOwner = user?.email?.toLowerCase().trim() === 'nuellkelechi@gmail.com';
                      const userIsPremium = isPremium || isOwner;
                      if (!userIsPremium && dailyQuizUsedCount >= 7) {
                        if (setUserNotification) setUserNotification("subscribe for premium to panswer quiz");
                        if (setActiveTab) setActiveTab('premium');
                        return;
                      }
                      const selectedTypes = (Array.isArray(quizAnswerTypes) && quizAnswerTypes.length > 0)
                        ? quizAnswerTypes 
                        : [quizAnswerType || 'multiple_choice'];
                      generateQuiz(quizTopic, quizQuestionCount, quizDifficulty, true, selectedTypes);
                    }} 
                    disabled={isGeneratingQuiz} 
                    className="w-full bg-[#7E22CE] hover:bg-[#6B21A8] text-white font-black py-4 rounded-2xl text-base shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
                  >
                    {isGeneratingQuiz ? (
                      <><RefreshCcw size={18} className="animate-spin text-purple-200" /> Generating quiz...</>
                    ) : (
                      <>{(!isPremium && user?.email?.toLowerCase().trim() !== 'nuellkelechi@gmail.com' && dailyQuizUsedCount >= 7) ? "Subscribe for Premium to Create Quiz" : "Create quiz"}</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* GENERATING LOADING SCREEN */}
          {isGeneratingQuiz && (
            <div className="flex flex-col items-center justify-center min-h-[450px] py-16 space-y-5 text-center">
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-2xl bg-white border border-purple-200/80 shadow-2xl flex items-center justify-center animate-pulse">
                  <div className="relative">
                    <Sparkles size={32} className="text-amber-400 fill-amber-300 animate-spin-slow" />
                    <Sparkles size={16} className="text-sky-400 fill-sky-300 absolute -top-1 -right-2 animate-bounce" />
                  </div>
                </div>
              </div>
              <p className={`text-base sm:text-lg font-bold tracking-tight ${theme === 'dark' ? 'text-purple-100' : 'text-slate-800'}`}>
                Creating your quiz...
              </p>
            </div>
          )}

          {/* QUIZ PREVIEW VIEW */}
          {!isGeneratingQuiz && quizState === 'preview' && quizQuestions && quizQuestions.length > 0 && (
            <div className="space-y-6 pb-24">
              {/* Quiz Header Info */}
              <div className="p-5 rounded-3xl bg-[#120D24] border border-purple-500/20 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-extrabold uppercase tracking-widest">
                    Quiz Preview
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-300/80">
                    0 of {quizQuestions.length} Answered
                  </span>
                </div>
                <h2 className="text-xl font-black text-white leading-tight">
                  {quizTopic || "Generated Quiz"}
                </h2>
                <div className="flex items-center gap-4 text-xs font-bold text-white/60 pt-1">
                  <span>Difficulty: <strong className="text-purple-300">{quizDifficulty}</strong></span>
                  <span>Total Questions: <strong className="text-purple-300">{quizQuestions.length}</strong></span>
                </div>
              </div>

              {/* Questions Preview List */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider px-1">Questions Breakdown</h3>
                {quizQuestions.map((q: any, qIdx: number) => (
                  <div key={qIdx} className="p-4 sm:p-5 rounded-2xl bg-[#0F0B1E] border border-white/10 space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="w-6 h-6 rounded-lg bg-purple-600/30 border border-purple-500/40 text-purple-300 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {qIdx + 1}
                      </span>
                      <p className="text-sm sm:text-base font-bold text-white leading-relaxed flex-1">
                        {q.question}
                      </p>
                    </div>

                    <div className="space-y-2 pl-8">
                      {(q.options || []).map((opt: string, optIdx: number) => (
                        <div key={optIdx} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                          <span className="w-5 h-5 rounded-md bg-white/10 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-white/90">
                            {opt}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Fixed Bottom Bar: Take Quiz & Share */}
              <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-[#0B0813]/90 backdrop-blur-xl border-t border-white/10 max-w-md sm:max-w-xl mx-auto flex items-center gap-3">
                <button
                  onClick={() => setQuizState('active')}
                  className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-2xl text-sm shadow-lg shadow-purple-600/30 transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Take Quiz</span>
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={shareQuiz}
                  className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl text-sm transition-all border border-white/15 uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 size={16} />
                  <span>Share</span>
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE QUIZ VIEW (EDGE-TO-EDGE VERTICAL SCROLL WITH INSTANT HEADER BAR & DASHES) */}
          {!isGeneratingQuiz && quizState === 'active' && quizQuestions && quizQuestions.length > 0 && (() => {
            let correctCount = 0;
            let incorrectCount = 0;
            let answeredCount = 0;

            quizQuestions.forEach((q: any, idx: number) => {
              const uAns = userQuizAnswers[idx];
              if (uAns !== undefined) {
                answeredCount++;
                if (uAns === q.correctAnswer) correctCount++;
                else incorrectCount++;
              }
            });

            return (
              <div className="space-y-4 pb-20">
                {/* TOP HEADER & DASHED PROGRESS BAR MATCHING EXACT DESIGN */}
                <div className="sticky top-0 z-40 p-3 bg-[#0B0813]/95 backdrop-blur-md border-b border-white/10 space-y-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
                  {/* TOP ROW: BACK ICON & SHARE ICON */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setQuizState('idle')}
                      className="p-1.5 -ml-1 text-white/80 hover:text-white transition-colors cursor-pointer"
                      title="Exit Quiz"
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <button
                      onClick={shareQuiz}
                      className="p-1.5 -mr-1 text-white/80 hover:text-white transition-colors cursor-pointer"
                      title="Share Quiz"
                    >
                      <Share2 size={20} />
                    </button>
                  </div>

                  {/* SECOND ROW: SEGMENTED DASH BAR & STATS PILLS */}
                  <div className="flex items-center justify-between gap-3 pt-1 flex-wrap sm:flex-nowrap">
                    {/* SEGMENTED DASH PROGRESS BAR */}
                    <div className="flex items-center gap-1.5 max-w-[120px] sm:max-w-[180px] overflow-x-auto no-scrollbar py-1 shrink">
                      {quizQuestions.map((q: any, idx: number) => {
                        const uAns = userQuizAnswers[idx];
                        const isAns = uAns !== undefined;
                        const isCorrect = isAns && uAns === q.correctAnswer;
                        const isWrong = isAns && !isCorrect;
                        const isCurrent = currentQuestionIndex === idx;

                        let dashBg = "bg-white/20";
                        let borderStyle = "";

                        if (isCorrect) {
                          dashBg = "bg-blue-600";
                        } else if (isWrong) {
                          dashBg = "bg-red-600";
                        } else if (isAns) {
                          dashBg = "bg-purple-500";
                        } else if (isCurrent) {
                          dashBg = "bg-white/40";
                          borderStyle = "ring-2 ring-white/90";
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setCurrentQuestionIndex(idx);
                              const el = document.getElementById(`quiz-question-${idx}`);
                              if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
                            }}
                            className={`h-2 min-w-[12px] flex-1 max-w-[28px] rounded-full transition-all shrink-0 cursor-pointer ${dashBg} ${borderStyle}`}
                            title={`Question ${idx + 1}`}
                          />
                        );
                      })}
                    </div>

                    {/* LIVE STATS: QUESTION COUNTER, FAILED PILL, CORRECT PILL WITH SPACED GAP */}
                    <div className="flex items-center gap-4 sm:gap-6 shrink-0 ml-auto">
                      <span className="text-xs sm:text-sm font-semibold text-slate-200/90 font-mono">
                        {currentQuestionIndex + 1} / {quizQuestions.length}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Failed Count Tag (Dark Red Pill) */}
                        <div className="px-2.5 py-1 rounded-full bg-[#4A0000] border border-red-800/40 text-red-300 text-xs font-black flex items-center gap-1 shadow-sm">
                          <span className="text-red-400 text-xs font-black">✕</span>
                          <span>{incorrectCount}</span>
                        </div>

                        {/* Passed / Correct Count Tag (Dark Blue Pill) */}
                        <div className="px-2.5 py-1 rounded-full bg-[#0D184A] border border-blue-800/40 text-blue-300 text-xs font-black flex items-center gap-1 shadow-sm">
                          <span className="text-blue-400 text-xs font-black">✓</span>
                          <span>{correctCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CONTINUOUS VERTICAL SCROLL OF ALL QUESTIONS (EDGE-TO-EDGE) */}
                <div className="space-y-6 pt-2">
                  {quizQuestions.map((q: any, qIdx: number) => {
                    const userAns = userQuizAnswers[qIdx];
                    const hasAnswered = userAns !== undefined;

                    return (
                      <div
                        id={`quiz-question-${qIdx}`}
                        key={qIdx}
                        className="py-4 border-b border-white/10 space-y-3"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-black text-xs shrink-0 mt-0.5">
                            Q{qIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if ('speechSynthesis' in window) {
                                window.speechSynthesis.cancel();
                                const cleaned = cleanTextForSpeech(q.question);
                                const utterance = new SpeechSynthesisUtterance(cleaned);
                                utterance.rate = 0.95;
                                utterance.pitch = 1.05;
                                const voices = window.speechSynthesis.getVoices();
                                const preferredVoice = voices.find(v => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Karen')) && v.lang.startsWith('en')) || voices.find(v => v.lang.startsWith('en'));
                                if (preferredVoice) utterance.voice = preferredVoice;
                                window.speechSynthesis.speak(utterance);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white shrink-0 transition-colors cursor-pointer mt-0.5"
                            title="Read question aloud without markdown symbols"
                          >
                            <Volume2 size={16} />
                          </button>
                          <div className="flex-1">
                            <MarkdownRenderer
                              content={q.question}
                              className="text-base sm:text-lg font-bold text-white leading-relaxed"
                            />
                          </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-2.5 pt-1">
                          {(q.options || []).map((opt: string, optIdx: number) => {
                            const isSelected = userAns === optIdx;
                            const isCorrectOpt = optIdx === q.correctAnswer;

                            let optStyle = "bg-white/5 border-white/10 text-white hover:bg-white/10";
                            let badgeStyle = "bg-white/10 text-white border-white/20";

                            if (hasAnswered) {
                              if (isCorrectOpt) {
                                optStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold";
                                badgeStyle = "bg-emerald-500 text-white border-emerald-400";
                              } else if (isSelected) {
                                optStyle = "bg-red-500/20 border-red-500 text-red-200 font-bold";
                                badgeStyle = "bg-red-500 text-white border-red-400";
                              }
                            } else if (isSelected) {
                              optStyle = "bg-purple-600/30 border-purple-500 text-white font-bold";
                              badgeStyle = "bg-purple-600 text-white border-purple-400";
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() => {
                                  if (handleOptionSelect) {
                                    handleOptionSelect(optIdx, qIdx);
                                  } else if (setUserQuizAnswers) {
                                    setUserQuizAnswers((prev: any) => {
                                      const newAns = [...(prev || [])];
                                      newAns[qIdx] = optIdx;
                                      return newAns;
                                    });
                                  }
                                  setCurrentQuestionIndex(qIdx);
                                  setSelectedOption(optIdx);
                                  setIsAnswered(true);
                                }}
                                className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${optStyle}`}
                              >
                                <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black border shrink-0 transition-all ${badgeStyle}`}>
                                  {hasAnswered && isCorrectOpt ? <Check size={14} /> : hasAnswered && isSelected ? <X size={14} /> : String.fromCharCode(65 + optIdx)}
                                </span>
                                <div className="flex-1">
                                  <MarkdownRenderer
                                    content={opt}
                                    className="text-sm font-semibold text-white"
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Explanation Review */}
                        {hasAnswered && q.explanation && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-1 mt-2"
                          >
                            <div className="flex items-center gap-1.5 text-purple-300 text-[10px] font-black uppercase tracking-widest">
                              <Info size={12} /> Review Explanation
                            </div>
                            <MarkdownRenderer
                              content={q.explanation}
                              className="text-xs text-white/90 font-medium leading-relaxed"
                            />
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* FINISH QUIZ BUTTON */}
                <div className="pt-6">
                  <button
                    onClick={() => {
                      if (nextQuestion) nextQuestion();
                      else setQuizState('finished');
                    }}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white font-black rounded-2xl text-base shadow-xl shadow-purple-600/30 transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>Submit & View Results</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            );
          })()}

          {quizState === 'finished' && (() => {
            let correctCount = 0;
            let incorrectCount = 0;
            quizQuestions.forEach((q: any, idx: number) => {
              const uAns = userQuizAnswers[idx];
              if (uAns !== undefined && uAns === q.correctAnswer) correctCount++;
              else if (uAns !== undefined && uAns !== q.correctAnswer) incorrectCount++;
            });

            const filteredQuestions = quizQuestions.filter((q: any, idx: number) => {
              const uAns = userQuizAnswers[idx];
              const isCorrect = uAns !== undefined && uAns === q.correctAnswer;
              if (resultFilter === 'correct') return isCorrect;
              if (resultFilter === 'incorrect') return !isCorrect;
              return true;
            });

            return (
              <div className="space-y-5 pb-24 max-w-2xl mx-auto">
                {/* TOP HEADER BAR */}
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <button
                    onClick={() => setQuizState('idle')}
                    className={`p-2 rounded-xl transition-colors flex items-center justify-center cursor-pointer ${
                      theme === 'dark' ? 'text-white hover:bg-white/10' : 'text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <h2 className={`font-black text-lg tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Result
                  </h2>
                  <button
                    onClick={shareQuiz}
                    className={`p-2 rounded-xl transition-colors flex items-center justify-center cursor-pointer ${
                      theme === 'dark' ? 'text-purple-300 hover:bg-white/10' : 'text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <Share2 size={18} />
                  </button>
                </div>

                {/* FILTER PILLS (ALL, CORRECT, INCORRECT) */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => setResultFilter('all')}
                    className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                      resultFilter === 'all'
                        ? 'bg-[#7E22CE] text-white border-purple-500 shadow-md shadow-purple-600/30'
                        : 'bg-white text-slate-700 border-slate-200 dark:bg-[#1A142D] dark:text-purple-200 dark:border-purple-500/20'
                    }`}
                  >
                    <span>All</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      resultFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800 dark:bg-purple-950 dark:text-purple-300'
                    }`}>
                      {quizQuestions.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setResultFilter('correct')}
                    className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                      resultFilter === 'correct'
                        ? 'bg-[#7E22CE] text-white border-purple-500 shadow-md shadow-purple-600/30'
                        : 'bg-white text-slate-700 border-slate-200 dark:bg-[#1A142D] dark:text-purple-200 dark:border-purple-500/20'
                    }`}
                  >
                    <span>Correct</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      resultFilter === 'correct' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800 dark:bg-purple-950 dark:text-purple-300'
                    }`}>
                      {correctCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setResultFilter('incorrect')}
                    className={`px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                      resultFilter === 'incorrect'
                        ? 'bg-[#7E22CE] text-white border-purple-500 shadow-md shadow-purple-600/30'
                        : 'bg-white text-slate-700 border-slate-200 dark:bg-[#1A142D] dark:text-purple-200 dark:border-purple-500/20'
                    }`}
                  >
                    <span>Incorrect</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      resultFilter === 'incorrect' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800 dark:bg-purple-950 dark:text-purple-300'
                    }`}>
                      {incorrectCount}
                    </span>
                  </button>

                  {/* DOWNLOAD RESULT BUTTON BESIDE THE INCORRECT BUTTON */}
                  <button
                    onClick={() => setShowDownloadResultModal(true)}
                    className="px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/30 shadow-md shrink-0"
                  >
                    <Download size={14} />
                    <span>Download Result</span>
                  </button>
                </div>

                {/* SUMMARY & QUICK ACTIONS */}
                <div className={`p-5 sm:p-6 rounded-3xl border shadow-lg space-y-3 ${
                  theme === 'dark' ? 'bg-[#120D24] border-purple-500/20 text-white' : 'bg-purple-50/70 border-purple-200 text-slate-900'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-black leading-tight">
                        {quizTopic || "Quiz Results"}
                      </h3>
                      <p className={`text-xs font-semibold mt-0.5 ${theme === 'dark' ? 'text-purple-300/80' : 'text-slate-600'}`}>
                        {correctCount} of {quizQuestions.length} correct ({Math.round((correctCount / quizQuestions.length) * 100)}%)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={shareQuiz}
                        className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#DC2626]/90 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                      >
                        <Share2 size={14} />
                        <span>Share Results</span>
                      </button>
                      
                      {/* REVIEW WITH OMNI BUTTON REPLACING RETAKE */}
                      <button
                        onClick={() => setShowReviewWithOmniModal(true)}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                      >
                        <Sparkles size={14} />
                        <span>Review with Omni</span>
                      </button>

                      <button
                        onClick={() => setQuizState('idle')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          theme === 'dark' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                        }`}
                      >
                        New
                      </button>
                    </div>
                  </div>
                </div>

                {/* INCORRECT REVIEW CONTAINER SHARE BAR */}
                {resultFilter === 'incorrect' && (
                  <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-center justify-between gap-3 shadow-lg">
                    <div className="space-y-0.5 text-left">
                      <p className="text-xs font-black text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-red-400" />
                        <span>Incorrect Questions ({incorrectCount})</span>
                      </p>
                      <p className="text-[10px] text-white/60">Review your incorrect choices or export your performance breakdown.</p>
                    </div>
                    <button
                      onClick={shareQuiz}
                      className="px-4 py-2 bg-[#DC2626] hover:bg-[#DC2626]/90 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 transition-all"
                    >
                      <Share2 size={14} />
                      <span>Share Results</span>
                    </button>
                  </div>
                )}

                {/* DETAILED QUESTION BREAKDOWN CARDS */}
                <div className="space-y-4">
                  {filteredQuestions.map((q: any) => {
                    const realIndex = quizQuestions.indexOf(q);
                    const userAns = userQuizAnswers[realIndex];
                    const isCorrect = userAns !== undefined && userAns === q.correctAnswer;

                    return (
                      <div
                        key={realIndex}
                        className={`p-5 rounded-3xl border shadow-sm space-y-3 transition-all ${
                          theme === 'dark'
                            ? 'bg-[#120D24] border-purple-500/20 text-white'
                            : 'bg-white border-slate-200/80 text-slate-900 shadow-purple-900/5'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-center justify-between">
                          <span className={`px-3.5 py-1 rounded-full text-xs font-black text-white shadow-sm ${
                            isCorrect ? 'bg-[#65A30D]' : 'bg-[#DC2626]'
                          }`}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                          <span className={`text-xs font-bold ${
                            theme === 'dark' ? 'text-purple-300/60' : 'text-slate-400'
                          }`}>
                            Question {realIndex + 1} / {quizQuestions.length}
                          </span>
                        </div>

                        {/* Question Text */}
                        <h4 className={`text-base sm:text-lg font-bold leading-relaxed ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          {q.question}
                        </h4>

                        <div className={`border-b my-2 ${
                          theme === 'dark' ? 'border-purple-500/20' : 'border-slate-100'
                        }`} />

                        {/* Options List */}
                        <div className="space-y-2.5">
                          {(q.options || []).map((opt: string, optIdx: number) => {
                            const isUserSelected = userAns === optIdx;
                            const isCorrectOpt = optIdx === q.correctAnswer;

                            let optStyle = "text-slate-600 dark:text-purple-200/70 font-medium";
                            let numStyle = "text-slate-400 dark:text-purple-300/50 font-bold";

                            if (isCorrect) {
                              if (isCorrectOpt) {
                                optStyle = "font-bold text-[#65A30D] dark:text-emerald-400";
                                numStyle = "font-bold text-[#65A30D] dark:text-emerald-400";
                              }
                            } else {
                              if (isUserSelected) {
                                optStyle = "line-through text-slate-700 dark:text-rose-300 font-bold";
                                numStyle = "line-through text-slate-700 dark:text-rose-300 font-bold";
                              } else if (isCorrectOpt) {
                                optStyle = "font-bold text-[#65A30D] dark:text-emerald-400";
                                numStyle = "font-bold text-[#65A30D] dark:text-emerald-400";
                              }
                            }

                            return (
                              <div key={optIdx} className="flex items-start gap-2.5 text-sm sm:text-base leading-snug">
                                <span className={`shrink-0 ${numStyle}`}>
                                  {optIdx + 1}.
                                </span>
                                <span className={`flex-1 ${optStyle}`}>
                                  {opt}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        {q.explanation && (
                          <div className={`mt-3 p-3.5 rounded-2xl border text-xs leading-relaxed space-y-1 ${
                            theme === 'dark'
                              ? 'bg-purple-950/40 border-purple-500/30 text-purple-200'
                              : 'bg-amber-50 border-amber-200 text-slate-800'
                          }`}>
                            <p className="font-extrabold text-amber-500 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                              <Info size={13} /> Explanation
                            </p>
                            <p className="font-medium">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* DOWNLOAD RESULT CERTIFICATE MODAL */}
                {showDownloadResultModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${
                      theme === 'dark' ? 'bg-[#150F28] border-purple-500/30 text-white' : 'bg-white border-purple-200 text-slate-900'
                    }`}>
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <h3 className="text-base font-black flex items-center gap-2">
                          <Download size={18} className="text-emerald-400" />
                          <span>Download Result Certificate</span>
                        </h3>
                        <button
                          onClick={() => setShowDownloadResultModal(false)}
                          className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-bold tracking-wider uppercase opacity-70">
                          Enter Your Name
                        </label>
                        <input
                          type="text"
                          value={resultUserName}
                          onChange={(e) => setResultUserName(e.target.value)}
                          placeholder="e.g. Alex Johnson"
                          className={`w-full px-4 py-3 rounded-xl border text-sm font-semibold outline-none transition-all ${
                            theme === 'dark'
                              ? 'bg-[#1F173B] border-purple-500/40 text-white placeholder-purple-300/30 focus:border-purple-400'
                              : 'bg-slate-50 border-purple-200 text-slate-900 placeholder-slate-400 focus:border-purple-600'
                          }`}
                        />
                      </div>

                      {/* Mini Certificate Preview */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900/60 to-indigo-950/60 border border-purple-500/30 space-y-2">
                        <p className="text-[10px] font-black uppercase text-purple-300 tracking-wider">Preview Certificate</p>
                        <p className="text-sm font-black text-white">{resultUserName || 'Student'}</p>
                        <p className="text-xs text-purple-200/80 font-medium">
                          Topic: {quizTopic || 'General Study Quiz'} • Accuracy: {Math.round((correctCount / quizQuestions.length) * 100)}% ({correctCount}/{quizQuestions.length})
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          onClick={() => setShowDownloadResultModal(false)}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            generateResultImage(resultUserName);
                            setShowDownloadResultModal(false);
                          }}
                          className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg cursor-pointer flex items-center gap-1.5"
                        >
                          <Download size={15} />
                          <span>Generate & Download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* REVIEW WITH OMNI MODAL */}
                {showReviewWithOmniModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${
                      theme === 'dark' ? 'bg-[#150F28] border-purple-500/30 text-white' : 'bg-white border-purple-200 text-slate-900'
                    }`}>
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <h3 className="text-base font-black flex items-center gap-2">
                          <Sparkles size={18} className="text-purple-400" />
                          <span>Review Quiz with Omni</span>
                        </h3>
                        <button
                          onClick={() => setShowReviewWithOmniModal(false)}
                          className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <p className="text-xs text-purple-200/70 leading-relaxed font-medium">
                        Choose how you would like to continue your study session with Omni AI:
                      </p>

                      <div className="space-y-2.5 pt-1">
                        {/* Option 1: New History */}
                        <button
                          onClick={() => {
                            setShowReviewWithOmniModal(false);
                            const incorrectList = quizQuestions.filter((q: any, i: number) => userQuizAnswers[i] !== q.correctAnswer);
                            const prompt = `Hi Omni! I just finished a quiz on "${quizTopic || 'Study Topic'}". I scored ${correctCount}/${quizQuestions.length}. Here are the questions I struggled with:\n${incorrectList.map((q: any, i: number) => `${i+1}. ${q.question} (Correct Answer: ${q.options ? q.options[q.correctAnswer] : q.correctAnswer})`).join('\n')}\nCan you review these with me step-by-step?`;
                            
                            if (props.setActiveChatSessionId) props.setActiveChatSessionId(null);
                            if (props.setInputMessage) props.setInputMessage(prompt);
                            if (props.setActiveTab) props.setActiveTab('ai');
                          }}
                          className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                            theme === 'dark' ? 'bg-purple-900/30 border-purple-500/30 hover:bg-purple-900/50' : 'bg-purple-50 border-purple-200 hover:bg-purple-100'
                          }`}
                        >
                          <div className="p-2 rounded-xl bg-purple-600 text-white shrink-0 mt-0.5">
                            <Plus size={18} />
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-sm font-black text-white">New History / Fresh Chat</h4>
                            <p className="text-xs text-purple-200/70 font-medium">Start a brand new chat session focused exclusively on reviewing this quiz.</p>
                          </div>
                        </button>

                        {/* Option 2: Previous History */}
                        <button
                          onClick={() => {
                            setShowReviewWithOmniModal(false);
                            const incorrectList = quizQuestions.filter((q: any, i: number) => userQuizAnswers[i] !== q.correctAnswer);
                            const prompt = `I'd like to review my latest quiz on "${quizTopic || 'Study Topic'}". Score: ${correctCount}/${quizQuestions.length}. ${incorrectList.length > 0 ? `Incorrect items:\n${incorrectList.map((q: any, i: number) => `${i+1}. ${q.question}`).join('\n')}` : 'I passed all questions!'}`;
                            
                            if (props.setInputMessage) props.setInputMessage(prompt);
                            if (props.setActiveTab) props.setActiveTab('ai');
                          }}
                          className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                            theme === 'dark' ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
                            <History size={18} />
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="text-sm font-black text-white">Previous History / Active Chat</h4>
                            <p className="text-xs text-purple-200/70 font-medium">Append this quiz breakdown to your ongoing chat session with Omni.</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </motion.div>
      )}

      {toolsSubTab === 'exam' && (
        <motion.div key="exam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
          <div className="flex items-center justify-between px-2">
            {examLobbyState === 'login' ? (
              <button onClick={handleToolsBack} className="text-white/40 hover:text-[#DC2626] transition-colors flex items-center gap-1.5 text-xs font-black uppercase">
                <ArrowLeft size={14} /> Back to Tools
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>CBT Examination</span>
              <ShieldCheck size={20} className="text-[#DC2626]" />
            </div>
          </div>

          {examLobbyState === 'login' && (
            <div className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-5 sm:p-8 rounded-3xl border space-y-6 shadow-sm`}>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-[#DC2626]/10 rounded-2xl flex items-center justify-center mx-auto mb-2"><User size={24} className="text-[#DC2626]" /></div>
                <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Student Verification</h3>
                <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Enter your credentials to access the examination hall.</p>
              </div>
              {!showAdminLogin ? (
                <div className="space-y-4">
                  {!user ? (
                    <div className="text-center space-y-4 py-6">
                      <p className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>You must be logged in to access examinations.</p>
                      <button onClick={() => setShowAuthModal(true)} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all">
                        LOGIN TO PROCEED
                      </button>
                    </div>
                  ) : studentName ? (
                    <div className={`p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} rounded-3xl border space-y-4 text-center`}>
                      <div className="w-16 h-16 bg-[#DC2626] rounded-full flex items-center justify-center text-white font-black text-2xl mx-auto shadow-lg shadow-[#DC2626]/20">{(studentName || '?').charAt(0)}</div>
                      <div>
                        <p className={`text-[10px] font-black ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'} uppercase tracking-widest`}>Authenticated Student</p>
                        <p className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{studentName}</p>
                        <p className="text-xs font-mono text-[#DC2626] font-bold">{matricNumber}</p>
                      </div>
                      
                      {isTakingPaid ? (
                        <div className="pt-4 space-y-3 border-t border-white/10">
                          <button onClick={handleMatricLogin} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all">PROCEED TO HALL</button>
                          <button onClick={() => { setStudentName(''); setMatricNumber(''); }} className={`w-full text-[10px] font-black ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'} uppercase hover:text-[#DC2626] transition-all`}>Not you? Switch Account</button>
                        </div>
                      ) : (
                        <div className="pt-4 space-y-3 border-t border-white/10">
                          <p className={`text-[10px] ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'} leading-relaxed italic`}>
                            {isPremium ? "Premium Active: Exam access granted for free." : `This examination requires a one-time access fee of \u{20A6}100. Please complete payment to proceed.`}
                          </p>
                          <button 
                            onClick={() => {
                              if (isPremium || (user?.email?.toLowerCase().trim() === 'nuellkelechi@gmail.com') || currentUserData?.bypassAllPayments || currentUserData?.bypassTakingPayment) {
                                handleTakingPaymentSuccess({ reference: 'GOD_MODE_BYPASS' });
                              } else {
                                initializePayment({ onSuccess: handleTakingPaymentSuccess, onClose: handlePaystackClose });
                              }
                            }} 
                            className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-[11px] font-bold shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2"
                          >
                            <CreditCard size={18} /> 
                            {isPremium || (user?.email?.toLowerCase().trim() === 'nuellkelechi@gmail.com') ? "ENTER EXAM HALL" : "PAY \u{20A6}100 & PROCEED"}
                          </button>
                          <button onClick={() => { setStudentName(''); setMatricNumber(''); }} className={`w-full text-[10px] font-black ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'} uppercase hover:text-[#DC2626] transition-all`}>Not you? Switch Account</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">Exam ID</p>
                        <input type="text" value={examIdInput} onChange={(e) => setExamIdInput(e.target.value.toUpperCase())} placeholder="Enter 7-Character ID" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-[#DC2626]/50 transition-all font-mono text-white" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">Matric Number</p>
                        <input type="text" value={matricNumber} onChange={(e) => setMatricNumber(e.target.value)} placeholder="Enter Matric Number" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-[#DC2626]/50 transition-all text-white" />
                      </div>
                      <button onClick={handleMatricLogin} disabled={isAuthLoading} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2">
                        {isAuthLoading ? <RefreshCcw size={18} className="animate-spin" /> : <Zap size={18} />} VERIFY & PROCEED
                      </button>
                      <button 
                        onClick={() => setAdminMode(true)} 
                        className="w-full bg-white/5 text-white/60 font-bold py-3 rounded-2xl text-xs hover:bg-[#DC2626]/10 transition-all"
                      >
                        {"HOST AN EXAM (\u{20A6}200)"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <input type="password" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} placeholder="Admin PIN" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-[#DC2626]/50 transition-all text-white" />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowAdminLogin(false)} 
                      className="flex-1 bg-white/5 text-white/60 font-bold py-4 rounded-2xl text-sm"
                    >
                      BACK
                    </button>
                    <button onClick={handleAdminLogin} className="flex-[2] bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all">LOGIN AS ADMIN</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {examLobbyState === 'briefing' && (
            <div className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-5 sm:p-8 rounded-3xl border space-y-6 shadow-sm`}>
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="w-12 h-12 bg-[#DC2626] rounded-full flex items-center justify-center text-white font-black text-xl">{(studentName || '?').charAt(0)}</div>
                <div><p className="font-black text-white uppercase tracking-tighter">{studentName}</p><p className="text-[10px] text-white/40 font-mono">{matricNumber}</p></div>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-white">Examination Briefing</h3>
                <div className="bg-[#DC2626]/5 border border-[#DC2626]/20 p-4 rounded-2xl space-y-3">
                  <p className="text-xs text-[#DC2626] font-bold flex items-center gap-2"><XCircle size={14} /> IMPORTANT BRIEFING</p>
                  <div className="text-xs text-white/60 leading-relaxed space-y-2 text-left">
                    {examConfig?.warningMessage ? (
                      <MarkdownRenderer content={examConfig.warningMessage} />
                    ) : (
                      <>
                        <p>WARNING: {studentName}, if you leave this app, you automatically forfeit the exam.</p>
                        <p>This is a professional CBT Mock Exam. You have {examConfig?.duration || 30} minutes to answer {examConfig?.questionCount || 20} randomized questions. Use only your brain. Good luck.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={startExam} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2">
                <Zap size={18} /> START EXAMINATION NOW
              </button>
            </div>
          )}

          {examLobbyState === 'exam' && examQuestions && examQuestions.length > 0 && (() => {
            const activeExamPool = (studentActiveQuestions && studentActiveQuestions.length > 0) ? studentActiveQuestions : examQuestions;
            const configuredSubjects = (examConfig?.subjects && examConfig.subjects.length > 0)
              ? examConfig.subjects.map((s: any) => s.name).filter(Boolean)
              : [];
            const poolSubjects = Array.from(new Set(activeExamPool.map((q: any) => (q.subject || configuredSubjects[0] || "General Section").trim()))).filter(Boolean) as string[];
            const distinctExamSubjects = configuredSubjects.length > 0
              ? configuredSubjects.filter((name: string) => poolSubjects.some((ps: string) => ps.toLowerCase() === name.trim().toLowerCase()))
              : (poolSubjects.length > 0 ? poolSubjects : ["General Section"]);
            const currentExamQuestion = activeExamPool[currentExamIndex || 0] || activeExamPool[0];
            const realPoolIndex = currentExamIndex || 0;
            const currentExamSub = (currentExamQuestion?.subject || activeStudentSubject || localStudentSubject || distinctExamSubjects[0] || "General Section").trim();
            const filteredExamQuestions = activeExamPool.filter((q: any) => {
              const qSub = (q.subject || distinctExamSubjects[0] || "General Section").trim();
              return qSub.toLowerCase() === currentExamSub.toLowerCase();
            });
            const gridExamQuestions = distinctExamSubjects.length > 1 ? filteredExamQuestions : activeExamPool;

            const totalAnsweredCount = activeExamPool.filter((q: any, idx: number) => {
              const ans = examAnswers[q.id] !== undefined ? examAnswers[q.id] : examAnswers[idx];
              return ans !== undefined && ans !== null;
            }).length;

            return (
            <div className="space-y-4 sm:space-y-6">
              {showSubmitConfirmLocal ? (
                /* Dedicated Confirmation Page */
                <div className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-5 sm:p-8 rounded-3xl border space-y-6 sm:space-y-8 shadow-sm`}>
                  <div className="text-center space-y-3">
                    <div className="w-14 h-14 bg-[#DC2626]/10 rounded-full flex items-center justify-center mx-auto text-[#DC2626]">
                      <ShieldCheck size={32} />
                    </div>
                    <div className="space-y-1">
                      <h3 className={`text-lg sm:text-xl font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        Review & Submit Exam
                      </h3>
                      <p className={`text-[10px] sm:text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                        Review your progress. Click any question card below to resume answering, or submit now.
                      </p>
                    </div>
                  </div>

                  {/* Progress Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className={`p-3.5 rounded-2xl border text-center ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                      <p className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>Total</p>
                      <p className={`text-xl sm:text-2xl font-black mt-0.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{activeExamPool.length}</p>
                    </div>
                    <div className={`p-3.5 rounded-2xl border text-center ${theme === 'dark' ? 'bg-green-500/5 border-green-500/20' : 'bg-green-50 border-green-100'}`}>
                      <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-green-500">Answered</p>
                      <p className="text-xl sm:text-2xl font-black mt-0.5 text-green-500">
                        {totalAnsweredCount}
                      </p>
                    </div>
                    <div className={`p-3.5 rounded-2xl border text-center ${theme === 'dark' ? 'bg-[#DC2626]/5 border-[#DC2626]/15' : 'bg-red-50 border-red-100'}`}>
                      <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-[#DC2626]">Unanswered</p>
                      <p className="text-xl sm:text-2xl font-black mt-0.5 text-[#DC2626]">
                        {activeExamPool.length - totalAnsweredCount}
                      </p>
                    </div>
                  </div>

                  {/* Question Index Grid */}
                  <div className="space-y-3">
                    <h4 className={`text-[9px] font-black uppercase tracking-wider ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>
                      Question Navigator Map
                    </h4>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-h-48 overflow-y-auto p-2 border border-dashed border-white/5 rounded-2xl custom-scrollbar bg-white/[0.01]">
                      {activeExamPool.map((q: any, idx: number) => {
                        const ans = examAnswers[q.id] !== undefined ? examAnswers[q.id] : examAnswers[idx];
                        const isAnswered = ans !== undefined && ans !== null;
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setCurrentExamIndex(idx);
                              setShowSubmitConfirmLocal(false);
                            }}
                            className={`py-2.5 rounded-xl text-xs font-black border transition-all flex flex-col items-center justify-center gap-0.5 ${
                              isAnswered 
                                ? 'bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20' 
                                : `${theme === 'dark' ? 'bg-white/5 border-white/10 text-white/40' : 'bg-slate-50 border-slate-200 text-slate-500'} hover:bg-white/[0.08]`
                            }`}
                          >
                            <span>{idx + 1}</span>
                            <span className="text-[7px] uppercase font-black tracking-tighter opacity-60">
                              {isAnswered ? "DONE" : "OMIT"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Alerts & Submission Warnings */}
                  <div className={`p-4 rounded-2xl border text-left flex items-start gap-3 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-amber-50/50 border-amber-200'}`}>
                    <AlertTriangle className="text-[#DC2626] shrink-0 mt-0.5" size={16} />
                    <div className="space-y-1">
                      <p className={`text-[10px] font-black uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        Submit Confirmation Warning
                      </p>
                      <p className={`text-[10px] leading-relaxed ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>
                        Check your questions list above. You can click any square to go back to that question. If you are ready, press the confirm button below.
                      </p>
                    </div>
                  </div>

                  {/* Submission Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button 
                      onClick={() => setShowSubmitConfirmLocal(false)}
                      className={`flex-1 py-3.5 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all border ${
                        theme === 'dark' ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/15' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Cancel & Return
                    </button>
                    <button 
                      onClick={() => {
                        setShowSubmitConfirmLocal(false);
                        submitExam();
                      }}
                      className="flex-1 py-3.5 rounded-2xl bg-[#DC2626] hover:bg-[#DC2626]/90 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-[#DC2626]/15"
                    >
                      Yes, Submit Exam Now
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal Question Answering */
                (() => {
                  const gridBtnSize = gridExamQuestions.length > 40 ? 'w-4.5 h-4.5 text-[8px]' : gridExamQuestions.length > 20 ? 'w-5 h-5 text-[9px]' : 'w-6 h-6 text-[10px]';
                  return (
                  <div className="flex flex-col h-[calc(100vh-130px)] max-h-[850px] justify-between space-y-2 overflow-hidden">
                    {/* CONSTANTLY VISIBLE COMPACT GRADIENT HEADING BAR */}
                    <div className="sticky top-0 z-30 shrink-0 bg-gradient-to-r from-red-600 via-purple-700 to-blue-700 text-white p-2 sm:p-2.5 rounded-xl shadow-md border border-white/20 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setShowExamCalculator(true)}
                            className="w-7.5 h-7.5 rounded-lg bg-black/30 hover:bg-black/50 border border-white/30 flex items-center justify-center text-white shadow-inner shrink-0 transition-all"
                            title="Calculator"
                          >
                            <Calculator size={15} />
                          </button>
                          <button
                            onClick={() => toggleSpeakQuestion(currentExamQuestion?.question || '', currentExamQuestion?.options || [])}
                            className={`w-7.5 h-7.5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${isSpeakingQuestion ? 'bg-amber-500 border-amber-400 text-white animate-pulse' : 'bg-black/30 border-white/30 text-white hover:bg-black/50'}`}
                            title="Read Aloud"
                          >
                            <Volume2 size={15} />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-lg border border-white/20">
                          <Clock size={13} className="text-red-400 animate-pulse" />
                          <span className="font-mono text-xs font-black text-white">
                            {Math.floor(examTimer / 60)}:{(examTimer % 60).toString().padStart(2, '0')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-widest bg-black/30 px-2.5 py-1 rounded-lg border border-white/20 text-white font-mono hidden sm:inline-block">
                            PROGRESS: {totalAnsweredCount}/{activeExamPool.length}
                          </span>
                          <button 
                            onClick={() => setShowSubmitConfirmLocal(true)} 
                            className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md transition-all border border-white/20 shrink-0"
                          >
                            Submit Exam
                          </button>
                        </div>
                      </div>

                      {/* TOP FRONT SUBJECT BUTTONS INSIDE HEADING */}
                      {distinctExamSubjects.length > 0 && (
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-0.5 no-scrollbar border-t border-white/15">
                          <span className="text-[8px] font-black text-white/60 uppercase tracking-wider px-1 shrink-0">Subjects:</span>
                          {distinctExamSubjects.map((sub: string) => {
                            const isSelectedSub = sub.toLowerCase() === currentExamSub.toLowerCase();
                            const subQs = activeExamPool.filter((q: any) => (q.subject || distinctExamSubjects[0] || "General Section").trim().toLowerCase() === sub.toLowerCase());
                            const subAnsCount = subQs.filter((q: any) => {
                              const idx = activeExamPool.indexOf(q);
                              const ans = examAnswers[q.id] !== undefined ? examAnswers[q.id] : examAnswers[idx];
                              return ans !== undefined && ans !== null;
                            }).length;
                            return (
                              <button
                                key={sub}
                                onClick={() => {
                                  setLocalStudentSubject(sub);
                                  if (setActiveStudentSubject) setActiveStudentSubject(sub);
                                  const firstMatch = activeExamPool.findIndex((q: any) => (q.subject || distinctExamSubjects[0] || "General Section").trim().toLowerCase() === sub.toLowerCase());
                                  if (firstMatch !== -1) setCurrentExamIndex(firstMatch);
                                }}
                                className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all shrink-0 border flex items-center gap-1 ${
                                  isSelectedSub
                                    ? 'bg-white text-slate-900 border-white shadow-sm'
                                    : 'bg-black/30 text-white/70 border-white/20 hover:bg-white/20'
                                }`}
                              >
                                <span>{sub}</span>
                                <span className={`text-[8px] px-1 py-0.2 rounded font-mono ${isSelectedSub ? 'bg-slate-200 text-slate-900' : 'bg-white/10 text-white/60'}`}>
                                  {subAnsCount}/{subQs.length}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* NUMBER OF QUESTIONS ARRANGED IN GRID FOR SELECTED SUBJECT */}
                      <div className="flex flex-wrap items-center gap-1 max-h-14 sm:max-h-16 overflow-y-auto custom-scrollbar pt-1 border-t border-white/15">
                        {gridExamQuestions.map((q: any, idx: number) => {
                          const realIdx = activeExamPool.indexOf(q);
                          const ans = examAnswers[q.id] !== undefined ? examAnswers[q.id] : examAnswers[realIdx];
                          const isAns = ans !== undefined && ans !== null;
                          const isCur = realIdx === realPoolIndex;
                          return (
                            <button
                              key={idx}
                              onClick={() => setCurrentExamIndex(realIdx)}
                              className={`${gridBtnSize} rounded-md font-black border flex items-center justify-center transition-all shrink-0 ${
                                isCur
                                  ? 'bg-white text-slate-900 border-white shadow-md scale-110 z-10'
                                  : isAns
                                  ? 'bg-green-500 text-white border-green-400'
                                  : 'bg-black/30 text-white/70 border-white/20 hover:bg-white/20'
                              }`}
                            >
                              {realIdx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* CONSTANTLY VISIBLE QUESTIONS AND OPTIONS CONTAINER WITH FIXED BOTTOM BAR */}
                    {currentExamQuestion && (
                    <div className={`flex-1 flex flex-col justify-between overflow-hidden ${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-3.5 sm:p-5 rounded-2xl border shadow-sm`}>
                      <div className="space-y-3 sm:space-y-4 overflow-y-auto custom-scrollbar pr-1 flex-1">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2 shrink-0">
                          <span className="text-xs font-black uppercase tracking-widest text-[#DC2626]">
                            Question {realPoolIndex + 1} of {activeExamPool.length} ({filteredExamQuestions.indexOf(currentExamQuestion) + 1}/{filteredExamQuestions.length} in {currentExamSub})
                          </span>
                          <span className="text-[10px] font-black uppercase text-white/40">
                            {currentExamQuestion.subject || currentExamSub}
                          </span>
                        </div>

                        <div className="shrink-0">
                          <MarkdownRenderer 
                            content={currentExamQuestion.question}
                            className="text-base sm:text-lg font-bold leading-relaxed text-white"
                          />
                        </div>

                        <div className="space-y-2">
                          {(currentExamQuestion.options || []).map((option: string, idx: number) => {
                            const curAns = examAnswers[currentExamQuestion.id] !== undefined ? examAnswers[currentExamQuestion.id] : examAnswers[realPoolIndex];
                            const isSelected = curAns === idx;
                            return (
                              <button 
                                key={idx} 
                                onClick={() => {
                                  const newAns = { ...examAnswers, [realPoolIndex]: idx };
                                  if (currentExamQuestion.id !== undefined) newAns[currentExamQuestion.id] = idx;
                                  setExamAnswers(newAns);
                                }} 
                                className={`w-full text-left p-3 sm:p-3.5 rounded-xl border transition-all flex items-center gap-3 ${isSelected ? 'border-[#DC2626] bg-[#DC2626]/10 text-white shadow-md font-bold' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'}`}
                              >
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black border shrink-0 transition-all ${isSelected ? 'bg-[#DC2626] border-[#DC2626] text-white' : 'bg-white/5 border-white/20 text-white/40'}`}>
                                  {String.fromCharCode(65 + idx)}
                                </div>
                                <div className="flex-1">
                                  <MarkdownRenderer 
                                    content={option}
                                    className="text-xs sm:text-sm font-medium"
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* CONSTANTLY VISIBLE COMPACT FIXED NEXT & PREVIOUS BUTTONS AT BOTTOM */}
                      <div className="pt-2 border-t border-white/10 flex gap-2 shrink-0 bg-inherit sticky bottom-0 z-20">
                        <button 
                          onClick={() => setCurrentExamIndex(Math.max(0, realPoolIndex - 1))}
                          disabled={realPoolIndex <= 0}
                          className="px-3.5 sm:px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/15 text-white font-black rounded-lg text-[10px] sm:text-[11px] transition-all flex items-center justify-center gap-1.5 uppercase tracking-widest shrink-0"
                        >
                          <ArrowLeft size={13} /> Back
                        </button>
                        {realPoolIndex < activeExamPool.length - 1 ? (
                          <button 
                            onClick={() => setCurrentExamIndex(Math.min(activeExamPool.length - 1, realPoolIndex + 1))}
                            className="flex-1 py-2 bg-gradient-to-r from-red-600 to-blue-600 hover:opacity-95 text-white font-black rounded-lg text-[10px] sm:text-[11px] shadow-md transition-all flex items-center justify-center gap-1.5 uppercase tracking-widest"
                          >
                            <span>Next Question</span> <ChevronRight size={13} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => setShowSubmitConfirmLocal(true)}
                            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-black rounded-lg text-[10px] sm:text-[11px] shadow-md transition-all flex items-center justify-center gap-1.5 uppercase tracking-widest"
                          >
                            <span>Review & Submit</span> <Check size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    )}
                  </div>
                  );
                })()
              )}
            </div>
          );
          })()}

          {examLobbyState === 'result' && (() => {
            const activePool = (studentActiveQuestions && studentActiveQuestions.length > 0) ? studentActiveQuestions : examQuestions;
            const totalSatFor = activePool.length || 1;
            return (
              <div className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-10 rounded-3xl border text-center space-y-6 shadow-sm`}>
                <div className="w-20 h-20 bg-[#DC2626]/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={48} className="text-[#DC2626]" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Exam Submitted</h3>
                  <p className="text-xs sm:text-sm mt-1 text-white/40">Your results have been recorded in the system.</p>
                </div>
                <div className="py-6 border-y border-white/5 space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Total Score</p>
                    <p className="text-5xl font-black text-[#DC2626]">{examScore} / {totalSatFor}</p>
                    <p className="text-xs sm:text-sm font-bold mt-2 text-white">{Math.round((examScore / totalSatFor) * 100)}% Proficiency</p>
                  </div>

                  {subjectScores && subjectScores.length > 0 && (
                    <div className="pt-4 border-t border-white/5">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Score Breakdown By Subject</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                        {subjectScores.map((sub, sIdx) => (
                          <div key={sIdx} className="bg-white/5 border border-white/5 p-3 rounded-2xl flex items-center justify-between">
                            <span className="text-xs font-bold text-white/80">{sub.subject}</span>
                            <span className="text-xs font-black text-[#DC2626]">{sub.score} / {sub.total}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setExamLobbyState('review')} 
                    className="w-full bg-[#DC2626] text-white font-black py-4 rounded-2xl text-xs sm:text-sm shadow-xl shadow-[#DC2626]/20 hover:bg-[#DC2626]/90 transition-all flex items-center justify-center gap-2"
                  >
                    <Search size={18} /> REVIEW EXAM & EXPLANATIONS ({totalSatFor} QUESTIONS)
                  </button>
                  <button 
                    onClick={() => setExamLobbyState('login')} 
                    className="w-full bg-white/5 text-white/60 font-black py-4 rounded-2xl text-xs sm:text-sm transition-all"
                  >
                    LOGOUT
                  </button>
                </div>
              </div>
            );
          })()}

          {examLobbyState === 'review' && (() => {
            const activePool = (studentActiveQuestions && studentActiveQuestions.length > 0) ? studentActiveQuestions : examQuestions;
            if (!activePool || activePool.length === 0) return null;
            return (
              <div className="space-y-6">
                <div className={`flex items-center justify-between ${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-4 rounded-2xl border shadow-sm`}>
                  <button onClick={() => setExamLobbyState('result')} className="text-white/40 hover:text-[#DC2626] flex items-center gap-1 text-xs font-bold uppercase"><ArrowLeft size={14} /> Back to Results</button>
                  <h3 className="text-sm font-black text-white uppercase tracking-tighter">Exam Review ({activePool.length} Questions Sat For)</h3>
                  <div className="w-10"></div>
                </div>

                <div className="space-y-4">
                  {activePool.map((q: any, qIdx: number) => {
                    const realPoolIndex = examQuestions ? examQuestions.indexOf(q) : qIdx;
                    const userAns = examAnswers[q.id] !== undefined 
                      ? examAnswers[q.id] 
                      : (realPoolIndex !== -1 && examAnswers[realPoolIndex] !== undefined ? examAnswers[realPoolIndex] : examAnswers[qIdx]);
                    const isCorrect = userAns !== undefined && userAns !== null && userAns === q.correctAnswer;
                    
                    return (
                      <div key={qIdx} className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-6 rounded-3xl border space-y-4 shadow-sm`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-[10px] font-black text-[#DC2626] uppercase mb-1">Question {qIdx + 1}</p>
                            <MarkdownRenderer content={q.question} className="text-sm font-bold text-white leading-tight" />
                          </div>
                          <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${isCorrect ? 'bg-green-500/10 text-green-500' : (userAns !== undefined && userAns !== null ? 'bg-[#DC2626]/10 text-[#DC2626]' : 'bg-amber-500/10 text-amber-500')}`}>
                            {isCorrect ? 'Correct' : (userAns !== undefined && userAns !== null ? 'Incorrect' : 'Unattempted')}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          {q.options.map((opt: string, oIdx: number) => {
                            const isUserChoice = userAns === oIdx;
                            const isCorrectChoice = q.correctAnswer === oIdx;
                            
                            let borderClass = 'border-white/5 bg-white/5';
                            let textClass = 'text-white/60';
                            let label = '';
                            
                            if (isCorrectChoice) {
                              borderClass = 'border-green-500/50 bg-green-500/10';
                              textClass = 'text-green-500 font-bold';
                              label = 'CORRECT ANSWER';
                            } else if (isUserChoice && !isCorrect) {
                              borderClass = 'border-[#DC2626]/50 bg-[#DC2626]/10';
                              textClass = 'text-[#DC2626] font-bold';
                              label = 'YOUR CHOICE';
                            } else if (isUserChoice && isCorrect) {
                              label = 'YOUR CHOICE (CORRECT)';
                            }

                            return (
                              <div key={oIdx} className={`p-3 rounded-xl border text-xs flex items-center gap-3 ${borderClass} ${textClass}`}>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${isCorrectChoice ? 'border-green-500 bg-green-500 text-white' : (isUserChoice ? 'border-[#DC2626] bg-[#DC2626] text-white' : 'border-white/20')}`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </div>
                                <div className="flex-1 flex flex-col">
                                  <MarkdownRenderer content={opt} />
                                  {label && <span className="text-[8px] font-black uppercase mt-1 opacity-60">{label}</span>}
                                </div>
                                {isCorrectChoice && <Check size={14} />}
                                {isUserChoice && !isCorrect && <X size={14} />}
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} border border-dashed border-white/10`}>
                            <p className="text-[9px] font-black text-white/30 uppercase mb-2 flex items-center gap-1.5">
                              <Info size={12} className="text-[#DC2626]" /> Explanation
                            </p>
                            <MarkdownRenderer content={q.explanation} className="text-xs text-white/70 leading-relaxed" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button onClick={() => setExamLobbyState('login')} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2">
                  FINISH REVIEW & LOGOUT
                </button>
              </div>
            );
          })()}
        </motion.div>
      )}

      {toolsSubTab === 'assignment' && (
        <motion.div key="assignment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <button onClick={handleToolsBack} className="text-white/40 hover:text-[#DC2626] transition-colors flex items-center gap-1.5 text-xs font-black uppercase">
              <ArrowLeft size={14} /> Back to Tools
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>Solve</span>
              <BookOpen size={20} className="text-[#DC2626]" />
            </div>
          </div>
          <AssignmentSolver 
            theme={theme} 
            user={user} 
            isPremium={isPremium} 
            getAiInstance={getAiInstance}
            fileToGenerativePart={fileToGenerativePart}
            setUserNotification={setUserNotification}
            setChatHistory={setChatHistory}
            setActiveTab={setActiveTab}
            setActiveChatSessionId={setActiveChatSessionId}
            addToFinishedHistory={addToFinishedHistory}
            finishedHistory={finishedHistory}
            solution={activeAssignmentSolution}
            setSolution={setActiveAssignmentSolution}
            checkAndIncrementUsage={checkAndIncrementUsage}
            generateQuiz={generateQuiz}
            setToolsSubTab={setToolsSubTab}
          />
        </motion.div>
      )}

      {toolsSubTab === 'courses' && (
        !isOwner ? (
          <div className="p-8 text-center space-y-4 my-8 rounded-3xl bg-white/[0.03] border border-white/10 max-w-lg mx-auto backdrop-blur-xl">
            <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-2">
              <Lock size={28} />
            </div>
            <h3 className={`text-base font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Courses Tool — Coming Soon</h3>
            <p className={`text-xs leading-relaxed max-w-md mx-auto ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>
              This tool is currently under active development. Access is reserved for site administrator preview.
            </p>
            <button 
              onClick={handleToolsBack} 
              className="mt-2 px-5 py-2.5 bg-[#DC2626] hover:bg-red-700 rounded-2xl text-xs font-bold uppercase text-white shadow-md transition-all active:scale-95"
            >
              Back to Tools
            </button>
          </div>
        ) : (
          <motion.div key="courses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <button onClick={handleToolsBack} className="text-white/40 hover:text-[#DC2626] transition-colors flex items-center gap-1.5 text-xs font-black uppercase">
                <ArrowLeft size={14} /> Back to Tools
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Unlock size={10} /> Owner Access
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>Courses Tool</span>
                <BookOpen size={20} className="text-[#DC2626]" />
              </div>
            </div>
            <CoursesTool 
              theme={theme}
              user={user}
              getAiInstance={getAiInstance}
              getHfInstance={getHfInstance}
              setUserNotification={setUserNotification}
              setQuizTopic={setQuizTopic}
              setQuizQuestionCount={setQuizQuestionCount}
              setQuizDifficulty={setQuizDifficulty}
              generateQuiz={generateQuiz}
              setToolsSubTab={setToolsSubTab}
              setQuizState={setQuizState}
              checkAndIncrementUsage={checkAndIncrementUsage}
            />
          </motion.div>
        )
      )}

      {toolsSubTab === 'faculty' && (
        <div className="h-full space-y-4">
          <div className="flex items-center justify-between px-2">
            <button onClick={handleToolsBack} className="text-white/40 hover:text-[#DC2626] transition-colors flex items-center gap-1.5 text-xs font-black uppercase">
              <ArrowLeft size={14} /> Back to Tools
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>Faculty Specials</span>
              <GraduationCap size={20} className="text-[#DC2626]" />
            </div>
          </div>
          <AILibrary 
            theme={theme} 
            user={user}
            getAiInstance={getAiInstance}
            fileToGenerativePart={fileToGenerativePart}
            setUserNotification={setUserNotification} 
            onSaveHistory={handleSaveFacultyHistory}
            checkAndIncrementUsage={checkAndIncrementUsage}
          />
        </div>
      )}


      
      {/* UNIVERSAL CALCULATOR & QUESTION SOLVER POPUP */}
      <AnimatePresence>
        {(showQuizCalculator || showExamCalculator) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className={`w-full max-w-md ${theme === 'dark' ? 'bg-[#13111C]' : 'bg-white'} rounded-[2rem] shadow-2xl overflow-hidden border ${theme === 'dark' ? 'border-white/15' : 'border-slate-200'} p-6 space-y-5`}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                    <Calculator size={18} />
                  </div>
                  <div>
                    <h3 className={`text-base font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} tracking-tight`}>
                      Smart Calculator & Solver
                    </h3>
                    <p className="text-[10px] text-white/60 uppercase font-bold tracking-wider">Supports +, -, ×, ÷, /, √, ^, (), %, and numbers only</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowQuizCalculator(false); setShowExamCalculator(false); }}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/50 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <textarea
                    value={calcQuestionInput}
                    onChange={(e) => {
                      setCalcQuestionInput(e.target.value);
                      setCalcSolutionOutput('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (calcQuestionInput.trim() && !isCalcInputInvalid) {
                          handleSolveCalcQuestion();
                        }
                      }
                    }}
                    placeholder="Enter math expression (e.g. 25 × 14 ÷ 2 or √(144) + 2^4)..."
                    rows={3}
                    className={`w-full ${theme === 'dark' ? 'bg-white/5 text-white placeholder-white/30' : 'bg-slate-50 text-slate-900 placeholder-slate-400'} border rounded-2xl p-3.5 text-sm font-medium outline-none transition-all resize-none ${
                      isCalcInputInvalid
                        ? 'border-red-500 ring-2 ring-red-500/50 shadow-[0_0_18px_rgba(239,68,68,0.5)] focus:border-red-500'
                        : theme === 'dark'
                        ? 'border-white/10 focus:border-blue-500'
                        : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  {isCalcInputInvalid && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-red-400 px-1"
                    >
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{mathValidation.error || "Invalid expression. Only numbers and +, -, ×, ÷, /, √, ^ are allowed."}</span>
                    </motion.div>
                  )}
                </div>

                <button
                  onClick={handleSolveCalcQuestion}
                  disabled={isSolvingCalc || !calcQuestionInput.trim() || isCalcInputInvalid}
                  className="w-full py-3 bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 hover:opacity-95 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Calculator size={16} />
                  <span>Calculate Answer</span>
                </button>

                {calcSolutionOutput && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-2xl border ${
                      calcSolutionOutput.startsWith('Error')
                        ? 'bg-red-500/10 border-red-500/30 text-red-300'
                        : theme === 'dark'
                        ? 'bg-green-500/10 border-green-500/30 text-white'
                        : 'bg-green-50 border-green-200 text-slate-900'
                    } text-sm font-mono leading-relaxed max-h-48 overflow-y-auto custom-scrollbar`}
                  >
                    <div className={`font-bold text-[10px] uppercase tracking-wider ${calcSolutionOutput.startsWith('Error') ? 'text-red-400' : 'text-green-400'} mb-1`}>
                      {calcSolutionOutput.startsWith('Error') ? 'Calculation Error:' : 'Answer Result:'}
                    </div>
                    <div className="text-lg sm:text-xl font-black">{calcSolutionOutput.replace(/^Error:\s*/, '')}</div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OMNI QUIZ SELECTION MODAL */}
      <AnimatePresence>
        {showOmniQuizModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg ${theme === 'dark' ? 'bg-[#0F1322] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} p-6 rounded-3xl border shadow-2xl space-y-6 relative overflow-hidden`}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-rose-600 flex items-center justify-center text-white shadow-lg">
                    <Sparkles size={20} className="animate-pulse text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-tight">Discuss Quiz with Omni AI</h3>
                    <p className="text-[11px] font-medium opacity-60">Personalized tutoring & mistake corrections</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowOmniQuizModal(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-white/60 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold opacity-80">Select where you would like to discuss and review this quiz with Omni:</p>

                <button
                  onClick={() => handleLaunchOmniQuizDiscussion('new')}
                  className="w-full p-4 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-600/10 via-rose-600/10 to-transparent hover:border-purple-500/60 transition-all text-left flex items-start gap-3.5 group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                    <PlusCircle size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-purple-400">✨ Start a New Omni Chat Session</h4>
                      <span className="text-[9px] font-extrabold uppercase bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-md">Recommended</span>
                    </div>
                    <p className="text-[11px] opacity-70 font-medium mt-0.5">Creates a fresh chat session dedicated to reviewing "{quizTopic || 'this quiz'}".</p>
                  </div>
                </button>

                <div className="pt-2">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Or attach context to an existing chat history:</p>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {chatSessions && chatSessions.length > 0 ? (
                      chatSessions.slice(0, 10).map((session: any) => (
                        <button
                          key={session.id}
                          onClick={() => handleLaunchOmniQuizDiscussion(session.id)}
                          className="w-full p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-left flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 line-clamp-1 flex-1 pr-2">
                            <MessageSquare size={14} className="text-red-400 shrink-0" />
                            <span className="text-xs font-bold truncate">{session.title || 'Conversation'}</span>
                          </div>
                          <span className="text-[9px] font-mono opacity-40 shrink-0">
                            {session.history ? `${session.history.length} msgs` : ''}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center border border-dashed border-white/10 rounded-xl opacity-50 text-xs">
                        No previous chat history found. Click "Start a New Omni Chat Session" above!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowOmniQuizModal(false)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/60 font-bold rounded-2xl text-xs uppercase transition-all cursor-pointer"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <HelpOverlay 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
        toolId={toolsSubTab} 
        theme={theme} 
      />
    </motion.div>
  );
};

const helpContent = {
  record: {
    title: "Recording Engine Help",
    items: [
      {
        question: "How to transcribe audio & generate notes?",
        steps: [
          "Upload or select an audio file to transcribe.",
          "Click the 'Transcribe' button to start processing.",
          "The processing indicator shows that the transcription engine is active.",
          "Wait a few seconds for the AI to synthesize the audio into structured notes.",
          "Access your generated notes and create practice quizzes from the transcription."
        ]
      },
      {
        question: "How to use AI Board Analysis?",
        steps: [
          "While recording, or after, click the 'Camera/Upload' icon.",
          "Capture a clear photo of the classroom board or your handwritten notes.",
          "Omni will extract the text and diagrams from the image.",
          "This data is automatically integrated into your final study summary.",
          "Ensure there is no glare on the board for 100% text accuracy."
        ]
      },
      {
        question: "How to copy and export notes?",
        steps: [
          "Once generated, look for the 'Copy' button at the header of the notes card.",
          "Clicking it copies the entire markdown structure (headings, lists, text).",
          "You can paste this into Google Docs, Microsoft Word, or Notepad.",
          "Notes are formatted professionally for easy reading and printing."
        ]
      }
    ]
  },
  quiz: {
    title: "Quiz Engine Help",
    items: [
      {
        question: "How to generate a specific quiz?",
        steps: [
          "Type the specific topic in the input field (e.g., 'Thermodynamics').",
          "Select difficulty: 'Easy' (Basics), 'Medium' (Standard), or 'Hard' (Advanced).",
          "Set the question count to allow for a quick test or a deep dive.",
          "Click 'Generate' to let the AI build a unique question set.",
          "Refresh to get a different set of questions for the same topic."
        ]
      },
      {
         question: "How does the Review Mode work?",
         steps: [
           "After clicking 'Submit Quiz', your percentage score is calculated.",
           "Scroll through your answers to see visual feedback: Green (Correct), Red (Wrong).",
           "Click on any question to see the 'Academic Explanation'.",
           "This explanation provides the logic behind the correct answer to help you learn.",
           "Use this mode to master topics you missed during the test."
         ]
      }
    ]
  },
  exam: {
    title: "CBT Examination Help",
    items: [
      {
        question: "How to host a professional exam?",
        steps: [
          "Click the 'Host exam' button (Note: This will end previous exams and clear old data automatically).",
          "Type in the Custom Matric Number and Name of each participant and add them singly to the authorized list.",
          "Configure the Exam: Set the Total Questions, Time (in minutes), and the Total Pool Questions.",
          "Add Questions: Paste your own questions into the input or type your Course Name for Gemini to automatically generate them.",
          "Save your changes and click 'Generate Exam ID'.",
          "Copy the unique Exam ID and share it with your participants.",
          "Provide the participants with their assigned Custom Matric Numbers and the Exam ID so they can join the session."
        ]
      },
      {
        question: "How to join as a candidate?",
        steps: [
          "Locate the 'Join Exam' field on the landing page.",
          "Input the Exam ID provided by your host.",
          "The system will verify the ID and show you the exam metadata.",
          "Enter your Full Name and Matric Number (if required) to log in.",
          "Wait in the virtual lobby until the host signals the start."
        ]
      },
      {
        question: "Rules of the Exam Hall?",
        steps: [
          "The timer starts immediately upon clicking 'Start Exam'.",
          "The page will automatically submit your work if the timer hits zero.",
          "Switching tabs or minimizing the browser may trigger a warning or auto-submit.",
          "Ensure your internet connection is stable before starting the session."
        ]
      }
    ]
  },
  assignment: {
    title: "Assignment Solver Help",
    items: [
      {
        question: "How to solve via photo/image?",
        steps: [
          "Ensure the text or math problem is readable and well-lit.",
          "Click the image icon and upload the file from your device.",
          "Wait for the 'Vision Preview' to confirm the image is uploaded.",
          "Click 'Solve with AI' to trigger the logical reasoning mode.",
          "Omni will show the problem extraction followed by the steps."
        ]
      },
      {
        question: "Understanding the Step-by-Step Logic?",
        steps: [
          "Omni doesn't just give answers; it provides the 'Methodology'.",
          "Check the 'Core Concept' section first to understand the underlying theory.",
          "Follow each numbered step to see the mathematical or logical progression.",
          "Refer to the 'Final Result' at the bottom of the solution container.",
          "If the solution uses math, it will be rendered in beautiful, readable LaTeX."
        ]
      }
    ]
  },
  courses: {
    title: "Course-Specific Tools Help",
    items: [
      {
        question: "How to navigate the library?",
        steps: [
          "Step 1: Select your Faculty (e.g., Engineering, Medicine).",
          "Step 2: Choose your Department/Program.",
          "Step 3: Drill down into the Level (100L - 500L).",
          "Step 4: Click the Course Code (e.g., MTH101) to open folders.",
          "You will find 'Summaries', 'Past Questions', and 'Lecture Notes'."
        ]
      }
    ]
  },
  faculty: {
    title: "Faculty Specials Help",
    items: [
      {
        question: "How to use the BIZ Financial Auditor?",
        steps: [
          "Navigate to the BIZ (Business/Accounting) section within Faculty Specials.",
          "Upload or paste your financial draft, ledger table, or balance sheet.",
          "Click 'Audit Document' to let the specialized AI scan for discrepancies.",
          "The Auditor will highlight errors in red and provide the corrected entry immediately.",
          "Use the 'Export Audit' button to save a report of all identified mistakes."
        ]
      },
      {
        question: "How to use Language Diagnostics?",
        steps: [
          "Select the Language/Art faculty and open the 'Diagnostics' tool.",
          "Input text (Max 300 words) for analysis.",
          "The engine performs a deep linguistic audit of your syntax and grammar.",
          "Original Box: Wrong words appear in Red, correct ones in Blue.",
          "Correction Box: Corrected words appear in Green, already correct ones in Blue.",
          "Review the 'Academic Logic' below for a summary of mistakes."
        ]
      },
      {
        question: "How to use the Transcribe Tool?",
        steps: [
          "Located within the Language/Edu section of Faculty Specials.",
          "Conversion: Text to Phonetic Sounds (/IPA/) and vice versa.",
          "For Sounds to Text: Enter sounds in slashes like /kaɪnd/.",
          "Click 'Transcribe to Sound' or 'Decode Sounds' to process.",
          "Results are displayed with full phonetic accuracy."
        ]
      },
      {
        question: "What are specialized tools?",
        steps: [
          "Engineering: Specialized for diagrams, CAD descriptions, and calculations.",
          "Medical: Focuses on clinical symptoms, diagnosis simulation, and anatomy.",
          "Law: Handles legal drafting, case law retrieval, and logical arguments.",
          "These tools use fine-tuned parameters specific to each professional field."
        ]
      }
    ]
  }
};

const HelpOverlay = ({ isOpen, onClose, toolId, theme }: { isOpen: boolean, onClose: () => void, toolId: string, theme: string }) => {
  const content = helpContent[toolId as keyof typeof helpContent];
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  if (!content) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`w-full max-w-lg ${theme === 'dark' ? 'bg-[#13111C]' : 'bg-white'} rounded-[2rem] shadow-2xl overflow-hidden border ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'} flex flex-col max-h-[80vh]`}
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>{content.title}</h2>
                <p className="text-[10px] text-[#DC2626] uppercase font-bold tracking-widest">Step-by-Step Guide</p>
              </div>
              <button onClick={() => { setSelectedQuestion(null); onClose(); }} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                <X size={20} className={theme === 'dark' ? 'text-white/40' : 'text-slate-400'} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {!selectedQuestion ? (
                <div className="space-y-3">
                  {content.items.map((item, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setSelectedQuestion(item.question)}
                      className={`w-full flex items-center justify-between p-4 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'} border rounded-2xl hover:border-[#DC2626]/40 transition-all text-left`}
                    >
                      <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}>{item.question}</span>
                      <ChevronRight size={18} className="text-[#DC2626]" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <button 
                    onClick={() => setSelectedQuestion(null)}
                    className="flex items-center gap-2 text-[10px] font-black text-[#DC2626] uppercase tracking-widest mb-4 hover:opacity-70"
                  >
                    <ArrowLeft size={14} /> Back to questions
                  </button>
                  <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} tracking-tight`}>{selectedQuestion}</h3>
                  <div className="space-y-4">
                    {content.items.find(i => i.question === selectedQuestion)?.steps.map((step, sIdx) => (
                      <motion.div 
                        key={sIdx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: sIdx * 0.1 }}
                        className={`flex gap-4 p-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} border border-white/5 rounded-2xl`}
                      >
                        <div className="w-8 h-8 bg-[#DC2626]/20 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xs font-black text-[#DC2626]">{sIdx + 1}</span>
                        </div>
                        <p className={`text-xs ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'} leading-relaxed font-semibold`}>{step}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
