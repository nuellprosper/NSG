import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  Mic, StopCircle, Upload, FileAudio, Image as ImageIcon, 
  Brain, History, Download, Play, 
  ChevronRight, Sparkles, Trash2, Settings, UserPlus, CreditCard, Edit2, FilePlus,
  ChevronUp, ChevronDown, Bold, ThumbsUp, Volume2, Square, Send, Pin, CreditCard as Clock,
  ArrowLeft, RefreshCcw, Camera, Award, ShieldCheck, BookOpen, FileText, Zap, Info,
  Share2, Trophy, Search, Check, X, ArrowLeft as ChevronLeft, GraduationCap, Users, User, Clock as ClockIcon,
  Activity, Video, Copy, PlusCircle, Plus, Italic, List, XCircle, CheckCircle2,
  Undo2, Redo2, Save, CornerDownRight, Menu, ExternalLink
} from 'lucide-react';

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
  const processedContent = (content || "")
    .replace(/\\\\\((.*?)\\\\\)/g, '$$$1$')
    .replace(/\\\\\[(.*?)\\\\\]/g, '$$$$$1$$$$')
    .replace(/\\\((.*?)\\\)/g, '$$$1$')
    .replace(/\\\[(.*?)\\\]/g, '$$$$$1$$$$')
    .split('\n').map(line => {
      const trimmed = line.trim();
      if ((trimmed.includes('\\frac') || trimmed.includes('\\times') || trimmed.includes('\\sqrt') || (trimmed.includes('^') && trimmed.includes('='))) && !trimmed.includes('$')) {
        return `$$${trimmed}$$`;
      }
      return line;
    }).join('\n');

  return (
    <div className={`markdown-body overflow-x-auto select-text selection:bg-[#DC2626]/20 custom-scrollbar ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkMath]} 
        rehypePlugins={[rehypeKatex]}
        components={{
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
          },
          a: ({node, href, children, ...props}: any) => {
            const isAttachment = href && (href.startsWith('http') || href.startsWith('data:') || href.includes('cloudinary') || href.includes('upload'));
            if (isAttachment) {
              return (
                <DocumentAttachmentPreview href={href} name={children ? String(children) : 'Attached Document'} />
              );
            }
            return <a href={href} className="text-red-400 font-bold hover:underline" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export const ToolsPage = (props: any) => {
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
    GeminiLive,
    CoursesTool,
    AssignmentSolver,
    AILibrary,

    // AI services & helper props
    getAiInstance,
    getHfInstance,
    fileToGenerativePart,
    setChatHistory,
    setActiveChatSessionId,

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
    quizQuestions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    shareQuiz,
    userQuizAnswers,
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
    setActiveAssignmentSolution
  } = props;

  const getAudioSrc = useCallback((session: any) => {
    if (!session) return "";
    if (session.audioUrl && session.audioUrl.startsWith('http')) return session.audioUrl;
    if (session.audioUrl && session.audioUrl.startsWith('blob:')) return session.audioUrl;
    if (session.audioBase64) {
      return `data:audio/webm;base64,${session.audioBase64}`;
    }
    return "";
  }, []);

  // Custom states inside Tools
  const [showNoteInsertMenu, setShowNoteInsertMenu] = useState(false);
  const [activeNotebookTab, setActiveNotebookTab] = useState<'write' | 'sources'>('write');
  const [noteToDelete, setNoteToDelete] = useState<any | null>(null);

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
    setNavigationHistory(prev => {
      if (prev.length > 1) {
        const newHistory = [...prev];
        newHistory.pop(); // Remove current subtab
        const previous = newHistory[newHistory.length - 1] || 'menu';
        setToolsSubTab(previous as any);
        return newHistory;
      } else {
        setToolsSubTab('menu');
        return ['menu'];
      }
    });
  }, [setToolsSubTab]);

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

  const handleQuizImageUpload = (e: any) => {
    const files = Array.from(e.target.files);
    files.forEach((file: any) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQuizImages((prev: any) => [...prev, { id: Date.now().toString(), preview: reader.result, file }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const [quizImages, setQuizImages] = useState<any[]>([]);
  const removeQuizImage = (id: string) => {
    setQuizImages(prev => prev.filter(img => img.id !== id));
  };

  const toolItems = useMemo(() => [
    { id: 'record', title: 'Record Lecture', icon: Mic, color: 'from-red-600 to-red-400', desc: 'AI-Powered Recording' },
    { id: 'live', title: 'Live AI Tutor', icon: Activity, color: 'from-[#DC2626] to-red-600', desc: 'Vision-Enabled Help' },
    { id: 'class', title: 'Live Classroom', icon: Video, color: 'from-pink-600 to-rose-400', desc: 'Host or Join Lectures', action: () => setActiveTab('class') },
    { id: 'quiz', title: 'Smart Quiz', icon: Zap, color: 'from-yellow-500 to-amber-400', desc: 'Test Your Knowledge' },
    { id: 'exam', title: 'CBT Exam', icon: ShieldCheck, color: 'from-orange-600 to-orange-400', desc: 'Professional Testing' },
    { id: 'faculty', title: 'Faculty Specials', icon: GraduationCap, color: 'from-blue-600 to-indigo-400', desc: 'Department Specific' },
    { id: 'assignment', title: 'Assignment Solver', icon: BookOpen, color: 'from-purple-600 to-pink-400', desc: 'Step-by-Step AI Solutions' },
    { id: 'courses', title: 'Courses Tool', icon: BookOpen, color: 'from-emerald-600 to-teal-400', desc: 'Course-Specific Learning' },
    { id: 'notebook', title: 'Notebook Tool', icon: FileText, color: 'from-amber-600 to-yellow-400', desc: 'AI-Powered Sources' },
    { id: 'whatsapp', title: 'Omni WhatsApp', icon: WhatsAppIcon, color: 'from-green-600 to-green-400', desc: '+2349064470122' }
  ], [setActiveTab]);

  return (
    <motion.div key="tools" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
      {toolsSubTab === 'menu' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className={`text-xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Tools & Study</h2>
            <Brain size={20} className="text-[#DC2626]" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-12">
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
        </div>
      )}

      {toolsSubTab === 'record' && (
        <motion.div key="record" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <button onClick={handleToolsBack} className="text-white/40 hover:text-[#DC2626] transition-colors flex items-center gap-1.5 text-xs font-black uppercase"><ArrowLeft size={14} /> Back</button>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowHelp(true)} className="p-2 hover:bg-white/5 rounded-xl transition-all"><Info size={18} className="text-white/40 hover:text-white" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className={`${theme === 'dark' ? 'bg-[#13111C]/60 border-white/5' : 'bg-white border-slate-200'} border p-6 sm:p-10 rounded-[2.5rem] relative flex flex-col items-center text-center justify-center min-h-[350px] overflow-hidden`}>
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className={`px-2.5 py-1 ${isRecording ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-white/5 border-white/5 text-white/40'} border rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5`}>
                    <div className={`w-1.5 h-1.5 rounded-full bg-red-500 ${isRecording ? 'animate-ping' : ''}`} />
                    {isRecording ? 'RECORDING' : 'IDLE ENGINE'}
                  </div>
                </div>

                <div className="space-y-8 my-auto relative z-10 w-full max-w-md">
                  <div className="flex flex-col items-center justify-center">
                    <button 
                      onClick={handleToggleRecording} 
                      disabled={isProcessingFinal}
                      className={`w-28 h-28 rounded-full ${isRecording ? 'bg-red-600 hover:bg-red-700 shadow-[0_0_35px_rgba(220,38,38,0.4)]' : 'bg-white/5 hover:bg-white/10 border border-white/10'} flex items-center justify-center transition-all duration-500 transform hover:scale-105 active:scale-95 disabled:opacity-50`}
                    >
                      {isRecording ? <Square size={36} className="text-white fill-white" /> : <Mic size={40} className="text-red-500" />}
                    </button>
                    {isRecording && (
                      <div className="mt-4 font-mono text-3xl font-black text-white tracking-widest">{FormatTime(recordingTime)}</div>
                    )}
                  </div>

                  {!isRecording && !isProcessingFinal && (
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-lg text-white">Capture the Room</h3>
                      <p className="text-xs text-white/40 max-w-sm mx-auto leading-relaxed">Let Omni analyze live lectures, slide notes, and photos to craft beautiful summaries to study.</p>
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
        <motion.div key="notebook" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
          <div className="flex items-center justify-between px-2 sticky top-0 z-40 bg-transparent py-2">
            <button onClick={() => { setSelectedNote(null); handleToolsBack(); }} className="text-white/40 hover:text-[#DC2626] transition-all flex items-center gap-1.5 text-xs font-black uppercase">
              <ArrowLeft size={14} /> Back
            </button>
            
            <div className="flex items-center gap-2">
              {!selectedNote && (
                <button 
                  onClick={() => saveNote()} 
                  className="px-3.5 py-1.5 bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black text-[10px] rounded-xl shadow-lg shadow-[#DC2626]/20 transition-all uppercase tracking-wider flex items-center gap-1"
                >
                  <PlusCircle size={12} /> New Source
                </button>
              )}
              {selectedNote && (
                <>
                  <button 
                    onClick={() => {
                      setIsPodcastActive(!isPodcastActive);
                      if (!isPodcastActive) {
                        setIsTeacherMode(false);
                        if (podcastDialogue.length === 0) {
                          generatePodcastDiscussion(selectedNote.content);
                        }
                      }
                    }} 
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1.5 ${isPodcastActive ? 'bg-green-500/20 border-green-500/30 text-green-500' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90'}`}
                  >
                    <Mic size={12} /> Create Podcast
                  </button>
                  <button 
                    onClick={() => {
                      const newContent = prompt('Edit note title:', selectedNote.title);
                      if (newContent) setSelectedNoteTitle(newContent);
                    }}
                    className="p-2 hover:bg-white/5 rounded-xl transition-all"
                    title="Edit Note Title"
                  >
                    <Edit2 size={16} className="text-white/60 hover:text-white" />
                  </button>
                  <button onClick={() => { setSelectedNote(null); }} className="p-2 hover:bg-white/5 rounded-xl border border-white/10 transition-all" title="Close Note">
                    <X size={16} className="text-white/40 hover:text-white" />
                  </button>
                </>
              )}
            </div>
          </div>

          {selectedNote ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {(isPodcastActive || isTeacherMode) && (
                <div className="lg:col-span-1 space-y-6">
                  {isPodcastActive && (
                    <div className="flex-1 flex flex-col bg-[#050811] border border-white/10 rounded-3xl overflow-hidden shadow-2xl h-[82vh] min-h-0">
                      <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500/10 rounded-xl flex items-center justify-center animate-pulse">
                            <Volume2 className="text-green-400" size={16} />
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Omni & Zeal</h3>
                            <p className="text-[8px] text-green-500 font-bold uppercase tracking-widest">Podcast Chat Active</p>
                          </div>
                        </div>
                        <button onClick={() => setIsPodcastActive(false)} className="text-white/40 hover:text-white shrink-0">
                          <X size={16} />
                        </button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[#08070F]">
                        {podcastDialogue.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
                            <div className="relative">
                              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                              <div className="relative w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center border-4 border-white/10 shadow-2xl">
                                <Brain size={40} className="text-white animate-pulse" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-lg font-black text-white uppercase tracking-tight">Podcast Analysis</h4>
                              <p className="text-xs text-white/40 max-w-xs mx-auto">Omni and Zeal are ready to discuss your source content.</p>
                            </div>
                            <button 
                              onClick={() => generatePodcastDiscussion(selectedNote.content)}
                              disabled={isGeneratingPodcast}
                              className="px-8 py-4 bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:scale-110 active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-[#DC2626]/20"
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
                                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter"
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
                            <button onClick={() => setReplyingTo(null)} className="p-2 text-white/20 hover:text-white shrink-0">
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

                          <input 
                            id="tools-podcast-chat-input"
                            autoComplete="off"
                            placeholder="Chat with Omni & Zeal..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-3 text-xs text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-white/20"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const target = e.target as HTMLInputElement;
                                if (target.value.trim()) {
                                  handlePodcastInput(target.value);
                                  target.value = '';
                                }
                              }
                            }}
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <button 
                              onClick={() => {
                                const input = document.getElementById('tools-podcast-chat-input') as HTMLInputElement;
                                if (input && input.value.trim()) {
                                  handlePodcastInput(input.value);
                                  input.value = '';
                                }
                              }}
                              className="p-1.5 bg-[#DC2626] text-white rounded-lg shadow-lg hover:scale-110 active:scale-95 transition-all"
                            >
                              <Send size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isTeacherMode && (
                    <div className="p-6 bg-[#0E0B16] border border-white/10 rounded-3xl space-y-6 relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full translate-x-12 -translate-y-12" />
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-2xl flex items-center justify-center animate-pulse"><Award className="text-purple-400" size={20} /></div>
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">Interactive Lecture</h4>
                          <p className="text-[8px] text-purple-400 font-bold uppercase tracking-widest font-mono">Teacher Active</p>
                        </div>
                      </div>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                        {podcastDialogue.length === 0 ? (
                          <div className="text-center py-10 opacity-20 space-y-2">
                            <RefreshCcw size={24} className="animate-spin mx-auto text-purple-500" />
                            <p className="text-[8px] font-black uppercase text-white tracking-widest">Constructing Classroom Guide...</p>
                          </div>
                        ) : (
                          podcastDialogue.map((line: any, idx: number) => (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`p-3 rounded-2xl border ${line.speaker === 'Teacher' ? 'bg-purple-500/5 border-purple-500/10 text-purple-200' : 'bg-white/5 border-white/5 text-white/80'}`}
                            >
                              <p className="text-[9px] font-black uppercase tracking-wider mb-1 text-white/40">{line.speaker}</p>
                              <p className="text-xs leading-relaxed">{line.text}</p>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className={(isPodcastActive || isTeacherMode) ? 'lg:col-span-2' : 'col-span-full'}>
                <div className="flex flex-col h-[82vh] bg-[#0E0B16] border border-white/10 rounded-3xl overflow-hidden relative shadow-2xl">
                  <div className="p-4 border-b border-white/5 bg-white/[0.02] backdrop-blur-md flex items-center justify-between shrink-0 relative z-20">
                    <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl">
                      <button 
                        onClick={() => {
                          setActiveNotebookTab('write');
                          if (setNotePreviewMode) setNotePreviewMode(false);
                        }} 
                        className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${activeNotebookTab === 'write' ? 'bg-[#DC2626] text-white shadow-md' : 'text-white/40 hover:text-white'}`}
                      >
                        Write Mode
                      </button>
                      <button 
                        onClick={() => {
                          setActiveNotebookTab('sources');
                          if (setNotePreviewMode) setNotePreviewMode(true);
                        }} 
                        className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${activeNotebookTab === 'sources' ? 'bg-[#DC2626] text-white shadow-md' : 'text-white/40 hover:text-white'}`}
                      >
                        Read Mode
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {!notePreviewMode && (
                        <>
                          <button onMouseDown={(e) => { e.preventDefault(); insertText('**', '**'); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"><Bold size={14} /></button>
                          <button onMouseDown={(e) => { e.preventDefault(); insertText('*', '*'); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"><Italic size={14} /></button>
                          <button onMouseDown={(e) => { e.preventDefault(); insertText('\n- '); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"><List size={14} /></button>
                        </>
                      )}
                    </div>
                  </div>

                  <div 
                    ref={scrollContainerRef}
                    onScroll={handleNoteScroll}
                    className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar relative bg-[#13111C]"
                    style={{
                      backgroundImage: 'linear-gradient(to bottom, transparent 27px, rgba(255, 255, 255, 0.04) 27px)',
                      backgroundSize: '100% 28px',
                      lineHeight: '28px',
                    }}
                  >
                    {notePreviewMode ? (
                      <div className="space-y-6 relative z-10 select-text">
                        <h1 className="text-2xl font-black text-white uppercase tracking-tighter border-b border-white/5 pb-2">{selectedNote.title || 'Untitled Source'}</h1>
                        <div className="markdown-body prose prose-invert max-w-none text-white/80 text-sm leading-relaxed">
                          <MarkdownRenderer selectable={true} content={selectedNote.content || "_No source content yet._"} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <input 
                          value={selectedNote.title} 
                          onChange={(e) => setSelectedNote({...selectedNote, title: e.target.value})}
                          readOnly={selectedNote?.sharedAccessType === 'readonly'}
                          className="bg-transparent border-none text-xl font-black text-white uppercase tracking-tighter outline-none w-full mb-8 placeholder:text-white/10 relative z-10"
                          placeholder="Source Title..."
                        />
                        
                        <div className="flex-1 pb-32 relative z-10">
                          <textarea
                            id="note-main-textarea"
                            style={{ 
                              height: `${Math.max(450, (selectedNote.content || '').split('\n').length * 28 + 100)}px`,
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
                            className="w-full bg-transparent border-none text-white/80 text-sm outline-none resize-none font-mono placeholder:text-white/5 p-0 min-h-[50vh]"
                            placeholder="Start writing or typing..."
                          />

                          {/* Attachments Panel at bottom of Write Mode */}
                          {selectedNote.attachments && selectedNote.attachments.length > 0 && (
                            <div className="mt-12 border-t border-white/5 pt-6 space-y-3 relative z-20">
                              <p className="text-[10px] font-black tracking-widest text-[#DC2626] uppercase">Source Attachments ({selectedNote.attachments.length})</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {selectedNote.attachments.map((att: any, attIdx: number) => {
                                  const isImg = att.type?.startsWith('image/') || att.name?.toLowerCase().endsWith('.png') || att.name?.toLowerCase().endsWith('.jpg') || att.name?.toLowerCase().endsWith('.jpeg');
                                  return (
                                    <div key={attIdx} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between hover:border-[#DC2626]/30 transition-all select-none group/att">
                                      <div className="flex items-center gap-3 overflow-hidden">
                                        {isImg ? (
                                          <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/5 bg-black/40">
                                            <img src={att.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                          </div>
                                        ) : (
                                          <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center shrink-0">
                                            <FileText size={18} className="text-yellow-400" />
                                          </div>
                                        )}
                                        <div className="overflow-hidden">
                                          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">{isImg ? 'Attached Photo' : 'Attached Document'}</p>
                                          <p className="text-xs text-white/85 font-bold truncate max-w-[120px]">{att.name || 'attachment.png'}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 opacity-60 group-hover/att:opacity-100 transition-opacity">
                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 transition-all">
                                          <ExternalLink size={12} />
                                        </a>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="hidden">
                          {noteBlocks.map((block: any, idx: number) => (
                            <div key={block.id} className="group relative">
                              {block.type === 'text' ? (
                                <textarea
                                  data-block-id={block.id}
                                  value={block.content}
                                  onChange={(e) => updateBlock(block.id, e.target.value)}
                                  onFocus={(e) => {
                                    lastFocusedBlock.current = { id: block.id, start: e.target.selectionStart, end: e.target.selectionEnd };
                                  }}
                                  onBlur={(e) => {
                                    lastFocusedBlock.current = { id: block.id, start: e.target.selectionStart, end: e.target.selectionEnd };
                                  }}
                                  className="w-full bg-transparent border-none text-white/80 text-sm leading-[1.75rem] outline-none resize-none font-mono placeholder:text-white/5 p-0"
                                  placeholder={idx === 0 ? "Start typing..." : ""}
                                  style={{ height: 'auto' }}
                                  onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
                                    target.style.height = 'auto'; 
                                    target.style.height = target.scrollHeight + 'px';
                                  }}
                                  ref={(el) => {
                                    if (el) {
                                      el.style.height = 'auto';
                                      el.style.height = el.scrollHeight + 'px';
                                    }
                                  }}
                                />
                              ) : (
                                <div className="relative rounded-2xl overflow-hidden border border-white/10 group/img max-w-2xl mx-auto my-4 shadow-2xl">
                                  <img src={block.url} alt={block.alt} className="w-full h-auto block" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <button onClick={() => removeBlock(block.id)} className="p-3 bg-red-600 text-white rounded-full hover:scale-110 transition-all">
                                      <Trash2 size={20} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Floating Media Insert Button */}
                  <div className="absolute bottom-16 right-6 edit-floating-plus-container z-50 flex flex-col items-end gap-3">
                    <AnimatePresence>
                      {showNoteInsertMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowNoteInsertMenu(false)} />
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 15 }} 
                            animate={{ opacity: 1, scale: 1, y: 0 }} 
                            exit={{ opacity: 0, scale: 0.95, y: 15 }} 
                            className="bg-[#181525] border border-white/10 rounded-2xl shadow-2xl p-2.5 z-50 w-44"
                          >
                            <div className="grid grid-cols-2 gap-2">
                              <label className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 hover:border-green-500/30 border border-white/5 rounded-2xl transition-all cursor-pointer group text-center">
                                <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform"><Mic size={14} className="text-green-400" /></div>
                                <span className="block text-[8px] font-black text-white uppercase tracking-wide">Audio</span>
                                <input type="file" className="hidden" onChange={(e) => { uploadNoteFile(e, 'audio'); setShowNoteInsertMenu(false); }} accept="audio/*" />
                              </label>
                              <label className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 hover:border-yellow-500/30 border border-white/5 rounded-2xl transition-all cursor-pointer group text-center">
                                <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform"><FileText size={14} className="text-yellow-400" /></div>
                                <span className="block text-[8px] font-black text-white uppercase tracking-wide">Doc</span>
                                <input type="file" className="hidden" onChange={(e) => { uploadNoteFile(e, 'doc'); setShowNoteInsertMenu(false); }} accept=".pdf,.doc,.docx,.txt" />
                              </label>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                    <button 
                      onClick={() => setShowNoteInsertMenu(!showNoteInsertMenu)} 
                      className="w-12 h-12 rounded-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white shadow-xl shadow-[#DC2626]/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                      title="Insert Media"
                    >
                      <Plus size={24} className={`transition-transform duration-300 ${showNoteInsertMenu ? 'rotate-45' : ''}`} />
                    </button>
                  </div>

                  <AnimatePresence>
                    {noteScrollPos && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        onClick={() => scrollToPosition(noteScrollPos)}
                        className="absolute bottom-32 right-6 z-50 w-12 h-12 rounded-full bg-[#DC2626]/80 text-white shadow-xl flex items-center justify-center border border-white/10 hover:scale-110 active:scale-95 transition-all"
                      >
                        {noteScrollPos === 'top' ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                      </motion.button>
                    )}
                  </AnimatePresence>

                  <div className="p-3 border-t border-white/5 bg-white/2 backdrop-blur-md flex items-center justify-between shrink-0">
                    <p className="text-[7px] font-bold text-white/20 uppercase tracking-[0.3em]">Notebook AI Engine Active</p>
                  </div>
                </div>
              </div>
            </div>
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
                        {note.attachments?.length > 0 && (
                          <div className="absolute top-0 right-0 p-1 text-[5px] font-black text-[#DC2626] bg-[#DC2626]/10 rounded-bl-lg border-l border-b border-white/10 uppercase">
                            {note.attachments.length}
                          </div>
                        )}
                        <div className="flex items-start justify-between relative z-10 w-full h-full">
                          <div className="space-y-0.5 w-full">
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

      {toolsSubTab === 'live' && (
        <motion.div key="live" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100]">
          <GeminiLive 
            onClose={() => setToolsSubTab('menu')} 
            setUserNotification={setUserNotification} 
            theme={theme}
            isPremium={isPremium}
            checkAndIncrementUsage={checkAndIncrementUsage}
          />
        </motion.div>
      )}

      {toolsSubTab === 'quiz' && (
        <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <button 
              onClick={() => {
                if (quizState === 'active' || quizState === 'finished' || quizState === 'review') {
                  setQuizState('idle');
                } else {
                  handleToolsBack();
                }
              }} 
              className="text-white/40 hover:text-[#DC2626] transition-colors flex items-center gap-1.5 text-xs font-black uppercase"
            >
              <ArrowLeft size={14} /> Back to {quizState === 'idle' ? 'Tools' : 'Lobby'}
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>Quiz Engine</span>
              <Zap size={20} className="text-[#DC2626]" />
            </div>
          </div>

          {quizState === 'idle' && (
            <div className={`${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} p-8 rounded-3xl border space-y-6 shadow-sm`}>
              <div className="text-center space-y-2 mb-4">
                <div className="w-12 h-12 bg-[#DC2626]/10 rounded-2xl flex items-center justify-center mx-auto mb-2"><Sparkles size={24} className="text-[#DC2626]" /></div>
                <h3 className="font-bold text-lg text-white">Generate Interactive Quiz</h3>
                <p className="text-xs text-white/40">Test your knowledge with AI-generated questions.</p>
              </div>
              
              <div className="space-y-4">
                {!user ? (
                  <div className="text-center space-y-4 py-6">
                    <p className="text-sm text-white/60">You must be logged in to generate quizzes.</p>
                    <button onClick={() => setShowAuthModal(true)} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all">
                      LOGIN TO PROCEED
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2 ml-1">
                        <p className="text-[10px] font-black text-white/30 uppercase">Topic or Analysis Context</p>
                        <label className="cursor-pointer group flex items-center gap-1.5 px-2 py-1 bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-lg hover:bg-[#DC2626]/20 transition-all">
                          <Camera size={10} className="text-[#DC2626]" />
                          <span className="text-[8px] font-black text-[#DC2626] uppercase">Snap/Upload</span>
                          <input type="file" className="hidden" accept="image/*" multiple onChange={handleQuizImageUpload} />
                        </label>
                      </div>
                      <div className="relative">
                        <textarea 
                          value={quizTopic} 
                          onChange={(e) => setQuizTopic(e.target.value)} 
                          placeholder="Describe the topic or ask AI to analyze the images below..." 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-[#DC2626]/50 transition-all text-white min-h-[100px] resize-none"
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                          <p className={`text-[8px] font-black uppercase ${quizTopic.split(/\s+/).filter(Boolean).length > (isPremium ? 150 : 30) ? 'text-red-500' : 'text-white/20'}`}>
                            {quizTopic.split(/\s+/).filter(Boolean).length} / {isPremium ? 150 : 30} Words
                          </p>
                        </div>
                      </div>

                      {quizImages.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {quizImages.map((img: any) => (
                            <div key={img.id} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-white/10">
                              <img src={img.preview} className="w-full h-full object-cover" />
                              <button onClick={() => removeQuizImage(img.id)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                <Trash2 size={12} className="text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-black text-white/30 uppercase mb-2 ml-1">Questions</p>
                        <div className="flex flex-wrap gap-2 items-center">
                          {[15, 25, 50].map(count => (
                            <button key={count} onClick={() => setQuizQuestionCount(count)} className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${quizQuestionCount === count ? 'bg-[#DC2626] border-[#DC2626] text-white' : 'bg-white/5 border-white/10 text-white/40'}`}>
                              {count}
                            </button>
                          ))}
                          <div className="flex items-center gap-1.5 ml-1">
                            <p className="text-[8px] font-bold text-white/20 uppercase">Custom:</p>
                            <input 
                              type="number" 
                              min="1"
                              max="200"
                              value={![15, 25, 50].includes(quizQuestionCount) ? quizQuestionCount : ''} 
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if(!isNaN(val)) setQuizQuestionCount(val);
                                else if (e.target.value === '') setQuizQuestionCount(0);
                              }}
                              onBlur={(e) => {
                                if(!e.target.value || parseInt(e.target.value) <= 0) setQuizQuestionCount(25);
                              }}
                              className={`w-14 px-2 py-1.5 rounded-xl bg-white/5 border text-white text-[10px] font-bold outline-none transition-all ${![15, 25, 50].includes(quizQuestionCount) && quizQuestionCount !== 0 ? 'border-[#DC2626] bg-[#DC2626]/10' : 'border-white/10'}`}
                              placeholder="No."
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white/30 uppercase mb-2 ml-1">Difficulty</p>
                        <div className="flex flex-wrap gap-2">
                          {['Easy', 'Medium', 'Hard', 'Professional'].map(level => (
                            <button key={level} onClick={() => setQuizDifficulty(level as any)} className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${quizDifficulty === level ? 'bg-[#DC2626] border-[#DC2626] text-white' : 'bg-white/5 border-white/10 text-white/40'}`}>
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button onClick={generateQuiz} disabled={isGeneratingQuiz} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {isGeneratingQuiz ? <><RefreshCcw size={18} className="animate-spin" /> GENERATING...</> : <><Zap size={18} /> START ASSESSMENT</>}
              </button>
            </div>
          )}

          {quizState === 'active' && quizQuestions && quizQuestions.length > 0 && (
            <div className="space-y-6">
              <div className={`flex items-center justify-between ${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-4 rounded-2xl border shadow-sm`}>
                <button onClick={() => setQuizState('idle')} className="text-white/40 hover:text-[#DC2626] flex items-center gap-1 text-xs font-black uppercase"><ArrowLeft size={14} /> Exit Quiz</button>
                <div className="text-center"><p className="text-[10px] font-black text-white/30 uppercase">Progress</p><p className="text-sm font-black text-[#DC2626]">{currentQuestionIndex + 1} / {quizQuestions.length}</p></div>
                <button onClick={shareQuiz} className="text-white/40 hover:text-[#DC2626] flex items-center gap-1 text-xs font-bold uppercase">
                  <Share2 size={14} /> Share
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {quizQuestions.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      setSelectedOption(userQuizAnswers[idx] !== undefined ? userQuizAnswers[idx] : null);
                      setIsAnswered(userQuizAnswers[idx] !== undefined);
                    }}
                    className={`flex-shrink-0 w-8 h-8 rounded-lg text-[10px] font-black border transition-all ${
                      currentQuestionIndex === idx 
                        ? 'bg-[#DC2626] border-[#DC2626] text-white' 
                        : userQuizAnswers[idx] !== undefined 
                          ? 'bg-green-500/20 border-green-500/30 text-green-500' 
                          : 'bg-white/5 border-white/10 text-white/40'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <div className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-8 rounded-3xl border space-y-8 shadow-sm`}>
                <MarkdownRenderer 
                  content={quizQuestions[currentQuestionIndex].question}
                  className="text-lg font-bold leading-tight text-white"
                />
                <div className="space-y-3">
                  {quizQuestions[currentQuestionIndex].options.map((option: string, idx: number) => {
                    const isCorrect = idx === quizQuestions[currentQuestionIndex].correctAnswer;
                    const isSelected = selectedOption === idx;
                    const hasAnswered = userQuizAnswers[currentQuestionIndex] !== undefined;
                    
                    let variantClasses = 'bg-white/5 border-white/10 text-white/80';
                    let badgeClasses = 'border-white/20 text-white/40';
                    
                    if (hasAnswered) {
                      if (isCorrect) {
                        variantClasses = 'border-green-500 bg-green-500/10 text-green-500';
                        badgeClasses = 'border-green-500 bg-green-500 text-white';
                      } else if (isSelected) {
                        variantClasses = 'border-red-500 bg-red-500/10 text-red-500';
                        badgeClasses = 'border-red-500 bg-red-500 text-white';
                      }
                    } else if (isSelected) {
                      variantClasses = 'border-[#DC2626] bg-[#DC2626]/5 text-[#DC2626]';
                      badgeClasses = 'border-[#DC2626] bg-[#DC2626] text-white';
                    }

                    return (
                      <button 
                        key={idx} 
                        onClick={() => handleOptionSelect(idx)} 
                        disabled={hasAnswered}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3 ${variantClasses}`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border shrink-0 ${badgeClasses}`}>
                          {hasAnswered && isCorrect ? <Check size={12} /> : hasAnswered && isSelected && !isCorrect ? <X size={12} /> : String.fromCharCode(65 + idx)}
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

                {userQuizAnswers[currentQuestionIndex] !== undefined && quizQuestions[currentQuestionIndex].explanation && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-2"
                  >
                    <div className="flex items-center gap-2 text-[#DC2626] text-[10px] font-black uppercase tracking-[0.2em]">
                      <Info size={14} /> Explanation
                    </div>
                    <MarkdownRenderer 
                      content={quizQuestions[currentQuestionIndex].explanation}
                      className="text-xs sm:text-sm text-white/60 leading-relaxed font-semibold"
                    />
                  </motion.div>
                )}

                <div className="pt-4 flex gap-3">
                  {currentQuestionIndex > 0 && (
                    <button 
                      onClick={prevQuestion}
                      className={`flex-1 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'} font-black py-4 rounded-2xl text-xs sm:text-sm border transition-all flex items-center justify-center gap-2 uppercase tracking-widest`}
                    >
                      <ArrowLeft size={16} /> Back
                    </button>
                  )}
                  <button 
                    onClick={nextQuestion}
                    disabled={selectedOption === null}
                    className="flex-[2] bg-[#DC2626] text-white font-black py-4 rounded-2xl text-xs sm:text-sm shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50"
                  >
                    {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'} <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {quizState === 'finished' && (
            <div className={`${theme === 'dark' ? 'bg-[#13111C]' : 'bg-white'} p-10 rounded-3xl border text-center space-y-8 shadow-sm`}>
              <div className="w-24 h-24 bg-[#DC2626]/10 rounded-full flex items-center justify-center mx-auto relative">
                <Trophy size={48} className="text-[#DC2626]" />
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-[#DC2626]/5 rounded-full" />
              </div>
              <div>
                <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>Assessment Complete</h3>
                <p className={`${theme === 'dark' ? 'text-white/40' : 'text-slate-500'} text-xs sm:text-sm mt-1`}>You've successfully finished the quiz.</p>
              </div>
              <div className="py-8 border-y border-white/5">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Your Score</p>
                <p className="text-6xl font-black text-[#DC2626]">{quizScore} / {quizQuestions.length || 1}</p>
                <p className="text-xs font-bold text-white/30 mt-2 uppercase tracking-widest">{Math.round((quizScore / (quizQuestions.length || 1)) * 100)}% Proficiency</p>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={shareQuiz} className="w-full bg-white/5 text-white/60 font-bold py-4 rounded-2xl text-xs sm:text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  <Share2 size={18} /> SHARE QUIZ LINK
                </button>
                <button onClick={handleShareResult} className="w-full bg-red-500 hover:bg-red-500/90 text-white font-black py-4 rounded-2xl text-xs sm:text-sm shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-2">
                  <Share2 size={18} /> SHARE SCORE CARD
                </button>
                <button onClick={() => setQuizState('review')} className="w-full bg-[#DC2626] text-white font-black py-4 rounded-2xl text-xs sm:text-sm shadow-xl shadow-[#DC2626]/20 hover:bg-[#DC2626]/90 transition-all flex items-center justify-center gap-2">
                  <Search size={18} /> CHECK RESULTS
                </button>
                <button onClick={() => setQuizState('idle')} className="w-full bg-white/5 text-white/60 font-bold py-4 rounded-2xl text-xs sm:text-sm hover:bg-white/10 transition-all">TRY ANOTHER TOPIC</button>
              </div>
            </div>
          )}

          {quizState === 'review' && quizQuestions && (
            <div className="space-y-6">
              <div className={`flex items-center justify-between ${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-4 rounded-2xl border shadow-sm`}>
                <button onClick={() => setQuizState('finished')} className="text-white/40 hover:text-[#DC2626] flex items-center gap-1 text-xs font-bold uppercase"><ArrowLeft size={14} /> Back to Results</button>
                <h3 className="text-sm font-black text-white uppercase tracking-tighter">Detailed Review</h3>
                <div className="w-10"></div>
              </div>

              <div className="space-y-4">
                {quizQuestions.map((q: any, qIdx: number) => {
                  const userAns = userQuizAnswers[qIdx];
                  const isCorrect = userAns === q.correctAnswer;
                  
                  return (
                    <div key={qIdx} className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-6 rounded-3xl border space-y-4 shadow-sm`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-[#DC2626] uppercase mb-1">Question {qIdx + 1}</p>
                          <MarkdownRenderer content={q.question} className="text-sm font-bold text-white leading-tight" />
                        </div>
                        <div className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase ${isCorrect ? 'bg-green-500/10 text-green-500' : 'bg-[#DC2626]/10 text-[#DC2626]'}`}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
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

              <button onClick={() => setQuizState('idle')} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2">
                RETAKE OR TRY NEW TOPIC
              </button>
            </div>
          )}
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
                      <div className="w-16 h-16 bg-[#DC2626] rounded-full flex items-center justify-center text-white font-black text-2xl mx-auto shadow-lg shadow-[#DC2626]/20">{studentName.charAt(0)}</div>
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
                              if (isPremium || currentUserData?.bypassAllPayments || currentUserData?.bypassTakingPayment || (currentUserData?.role === 'admin')) {
                                handleTakingPaymentSuccess({ reference: 'GOD_MODE_BYPASS' });
                              } else {
                                initializePayment({ onSuccess: handleTakingPaymentSuccess, onClose: handlePaystackClose });
                              }
                            }} 
                            className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-[11px] font-bold shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2"
                          >
                            <CreditCard size={18} /> 
                            {isPremium || currentUserData?.role === 'admin' ? "ENTER EXAM HALL" : "PAY \u{20A6}100 & PROCEED"}
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
                <div className="w-12 h-12 bg-[#DC2626] rounded-full flex items-center justify-center text-white font-black text-xl">{studentName.charAt(0)}</div>
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

          {examLobbyState === 'exam' && examQuestions && examQuestions.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              <div className={`flex items-center justify-between ${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-3 sm:p-4 rounded-2xl border shadow-sm sticky top-16 sm:top-20 z-30`}>
                <div className="flex items-center gap-2 text-[#DC2626] font-black">
                  <Clock size={16} className="sm:size-[18px]" />
                  <span className="font-mono text-base sm:text-lg">{Math.floor(examTimer / 60)}:{(examTimer % 60).toString().padStart(2, '0')}</span>
                </div>
                <div className="text-center"><p className="text-[8px] sm:text-[10px] font-black text-white/30 uppercase">Question</p><p className="text-xs sm:text-sm font-black text-white">{currentExamIndex + 1} / {examQuestions.length}</p></div>
                <button onClick={submitExam} disabled={Object.keys(examAnswers).length < (examQuestions.length * 0.5)} className="bg-[#DC2626] text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest disabled:opacity-30">Submit</button>
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {examQuestions.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentExamIndex(idx)}
                    className={`flex-shrink-0 w-8 h-8 rounded-lg text-[10px] font-black border transition-all ${
                      currentExamIndex === idx 
                        ? 'bg-[#DC2626] border-[#DC2626] text-white' 
                        : examAnswers[idx] !== undefined 
                          ? 'bg-green-500/20 border-green-500/30 text-green-500' 
                          : 'bg-white/5 border-white/10 text-white/40'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <div className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-5 sm:p-8 rounded-3xl border space-y-6 sm:space-y-8 shadow-sm`}>
                <MarkdownRenderer 
                  content={examQuestions[currentExamIndex].question}
                  className="text-base sm:text-lg font-bold leading-tight text-white"
                />
                <div className="space-y-3">
                  {examQuestions[currentExamIndex].options.map((option: string, idx: number) => (
                    <button key={idx} onClick={() => setExamAnswers({ ...examAnswers, [currentExamIndex]: idx })} className={`w-full text-left p-4 rounded-2xl border transition-all ${examAnswers[currentExamIndex] === idx ? 'border-[#DC2626] bg-[#DC2626]/5 text-[#DC2626]' : 'bg-white/5 border-white/10 text-white/80'}`}>
                      <div className="flex items-start gap-3">
                        <MarkdownRenderer 
                          content={option}
                          className="flex-1 text-xs sm:text-sm font-medium"
                        />
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between pt-4">
                  <button onClick={() => setCurrentExamIndex((prev: number) => Math.max(0, prev - 1))} disabled={currentExamIndex === 0} className="p-3 text-white/40 hover:text-[#DC2626] disabled:opacity-20"><ArrowLeft size={24} /></button>
                  <button onClick={() => setCurrentExamIndex((prev: number) => Math.min(examQuestions.length - 1, prev + 1))} disabled={currentExamIndex === examQuestions.length - 1} className="p-3 text-white/40 hover:text-[#DC2626] disabled:opacity-20"><ChevronRight size={24} /></button>
                </div>
              </div>
            </div>
          )}

          {examLobbyState === 'result' && (
            <div className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-10 rounded-3xl border text-center space-y-6 shadow-sm`}>
              <div className="w-20 h-20 bg-[#DC2626]/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={48} className="text-[#DC2626]" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Exam Submitted</h3>
                <p className="text-xs sm:text-sm mt-1 text-white/40">Your results have been recorded in the system.</p>
              </div>
              <div className="py-6 border-y border-white/5">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Final Score</p>
                <p className="text-5xl font-black text-[#DC2626]">{examScore} / {examQuestions.length || 1}</p>
                <p className="text-xs sm:text-sm font-bold mt-2 text-white">{Math.round((examScore / (examQuestions.length || 1)) * 100)}% Proficiency</p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setExamLobbyState('review')} 
                  className="w-full bg-[#DC2626] text-white font-black py-4 rounded-2xl text-xs sm:text-sm shadow-xl shadow-[#DC2626]/20 hover:bg-[#DC2626]/90 transition-all flex items-center justify-center gap-2"
                >
                  <Search size={18} /> REVIEW EXAM & EXPLANATIONS
                </button>
                <button 
                  onClick={() => setExamLobbyState('login')} 
                  className="w-full bg-white/5 text-white/60 font-black py-4 rounded-2xl text-xs sm:text-sm transition-all"
                >
                  LOGOUT
                </button>
              </div>
            </div>
          )}

          {examLobbyState === 'review' && examQuestions && (
            <div className="space-y-6">
              <div className={`flex items-center justify-between ${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-4 rounded-2xl border shadow-sm`}>
                <button onClick={() => setExamLobbyState('result')} className="text-white/40 hover:text-[#DC2626] flex items-center gap-1 text-xs font-bold uppercase"><ArrowLeft size={14} /> Back to Results</button>
                <h3 className="text-sm font-black text-white uppercase tracking-tighter">Exam Review</h3>
                <div className="w-10"></div>
              </div>

              <div className="space-y-4">
                {examQuestions.map((q: any, qIdx: number) => {
                  const userAns = examAnswers[qIdx];
                  const isCorrect = userAns === q.correctAnswer;
                  
                  return (
                    <div key={qIdx} className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-6 rounded-3xl border space-y-4 shadow-sm`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-[#DC2626] uppercase mb-1">Question {qIdx + 1}</p>
                          <MarkdownRenderer content={q.question} className="text-sm font-bold text-white leading-tight" />
                        </div>
                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${isCorrect ? 'bg-green-500/10 text-green-500' : 'bg-[#DC2626]/10 text-[#DC2626]'}`}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
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
          )}
        </motion.div>
      )}

      {toolsSubTab === 'assignment' && (
        <motion.div key="assignment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <button onClick={handleToolsBack} className="text-white/40 hover:text-[#DC2626] transition-colors flex items-center gap-1.5 text-xs font-black uppercase">
              <ArrowLeft size={14} /> Back to Tools
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>Assignment Solver</span>
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
          />
        </motion.div>
      )}

      {toolsSubTab === 'courses' && (
        <motion.div key="courses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <button onClick={handleToolsBack} className="text-white/40 hover:text-[#DC2626] transition-colors flex items-center gap-1.5 text-xs font-black uppercase">
              <ArrowLeft size={14} /> Back to Tools
            </button>
            <div className="flex items-center gap-2">
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
        question: "How to record classes & sync audio?",
        steps: [
          "Ensure you are in a relatively quiet environment for best results.",
          "Grant microphone permissions when the browser pop-up appears.",
          "Click the large 'Record' button to start captured live audio.",
          "The 'Waveform' indicator shows that the engine is active.",
          "Click 'Stop Session' once the lecture concludes.",
          "Wait 10-20 seconds for the AI to synthesize the raw audio into structured notes."
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
  },
  live: {
    title: "Live AI Tutor Help",
    items: [
      {
        question: "How to use spatial grounding?",
        steps: [
          "Omni sees through your camera. Point it at an object or book.",
          "Omni can 'point' at things in your view using highlight boxes.",
          "Ask: 'What is this specifically?' while pointing the camera.",
          "Omni will respond using coordinates to tell you exactly what it sees.",
          "Ideal for diagrams, hardware parts, or complex physical notes."
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
