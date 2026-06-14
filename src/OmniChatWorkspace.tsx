import React, { useState, useEffect, useRef } from 'react';
import { 
  Paperclip, Mic, Send, StopCircle, Brain, ArrowLeft, 
  Sparkles, Check, Copy, User, HelpCircle, BookOpen, FileText, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Message } from '../types/chat';

// Embedded Typewriter and copyable Markdown element
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
      index += 5; // Flow smooth rendering character increments
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

  return (
    <div className="relative">
      <ReactMarkdown 
        remarkPlugins={[remarkMath]} 
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeVal = String(children).replace(/\n$/, '');
            return className && match ? (
              <div className="relative group/code my-3 rounded-xl overflow-hidden border border-white/5 bg-zinc-950 font-mono">
                <div className="px-4 py-2 bg-zinc-900 border-[#1E1B2E] border-b flex items-center justify-between text-white/40 text-[9px] font-black uppercase tracking-widest">
                  <span>{match[1]}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(codeVal);
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
  onClose: () => void;
  user: any;
  userHandle: string;
  theme: 'dark' | 'light';
  userNotes?: any[];
  onOpenNote?: (id: string, title?: string, content?: string) => void;
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
  onClose,
  user,
  userHandle,
  theme,
  userNotes = [],
  onOpenNote
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showNoteSelector, setShowNoteSelector] = useState(false);
  const [selectedImportedNote, setSelectedImportedNote] = useState<any | null>(null);

  // Auto scroll logic
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

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
    <div className="flex flex-col h-full bg-[#13111C] text-slate-100 overflow-hidden relative">
      {/* Zero border sticky clean header */}
      <div className="px-6 py-4 bg-[#13111C]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            id="omni_back_nav_btn"
            onClick={onClose}
            className="p-2 -ml-2 rounded-xl transition-all hover:bg-white/5 text-white/40 hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-left">
            <h2 className="text-sm font-black uppercase tracking-tight italic text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)] flex items-center gap-1.5">
              <Brain size={16} /> Omni Workspace
            </h2>
            <p className="text-[8.5px] font-bold uppercase tracking-wider text-white/30">Google Gemini Powered Academic Assistant</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[7.5px] bg-[#DC2626]/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full uppercase font-black tracking-widest select-none flex items-center gap-1 animate-pulse">
            <span className="w-1 h-1 bg-red-500 rounded-full inline-block" /> Live Core Sync
          </span>
        </div>
      </div>

      {/* Main scrolling viewport (uninhibited Gemini-style full horizontal alignment) */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto w-full custom-scrollbar flex flex-col pt-4 pb-28"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto my-auto text-center gap-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-[#DC2626] to-[#9933FF] p-0.5 shadow-2xl animate-spin-slow">
              <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center">
                <Brain size={32} className="text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,1)]" />
              </div>
            </div>
            
            <div>
              <h1 className="text-xl font-black uppercase tracking-tighter italic text-white">How can I support your study guide today?</h1>
              <p className="text-[10px] uppercase font-black tracking-widest text-[#DC2626] mt-1.5">Omni Multimodal Academic Nexus</p>
              <p className="text-xs text-white/40 leading-relaxed max-w-md mt-3 font-medium">Explain equations, parse complex engineering schematics, outline study schedules, or generate practice quizzes instantly.</p>
            </div>

            {/* Elegant grid of suggestion cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mt-4 text-left">
              {[
                { 
                  title: '🎓 Syllabus Blueprint', 
                  desc: 'Draft structured educational syllabus review matrices on mechanical processes.',
                  prompt: 'Prepare a highly exhaustive syllabus review guide for advanced fluid dynamics, outline the core 5 chapters and formulate quick-recall principles.'
                },
                { 
                  title: '⚡ Formula Cheat-Sheet', 
                  desc: 'Compile chemical structures and physics constants lists for active recall.',
                  prompt: 'Generate an extensive physics formula memory cheat sheet covering general thermodynamics, fluid expansion rates, and kinetic motion formulas.'
                },
                { 
                  title: '❓ MCQ Exam Practice', 
                  desc: 'Generate interactive multiple-choice testing questions directly.',
                  prompt: 'Synthesize exactly 5 high-difficulty scholastic multiple-choice questions on organic polymer synthesis. Provide full detailed rationales for each.'
                },
                { 
                  title: '🔬 Fluid Concept Review', 
                  desc: 'Break down complex conceptual technical equations into layperson prose.',
                  prompt: 'Explain quantum entanglement and basic entanglement states with extremely simple, digestible analogies suitable for a novice level.'
                }
              ].map((card, index) => (
                <button
                  key={index}
                  onClick={() => loadSuggestion(card.prompt)}
                  className="p-4 bg-white/[0.02]/30 hover:bg-white/5 border border-white/5 hover:border-[#DC2626]/20 rounded-2xl transition-all cursor-pointer text-left focus:outline-none hover:shadow-xl active:scale-95 flex flex-col gap-1 relative"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-100">{card.title}</p>
                  <p className="text-xs text-white/40 leading-snug font-medium">{card.desc}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col w-full">
            {messages.map((msg, index) => {
              const isMe = msg.senderId === user?.uid || msg.senderHandle === userHandle;
              
              if (isMe) {
                // User Messages: Wrapped in Cold Purple (#1E1B2E) background band, full horizontal width
                return (
                  <div key={msg.id || index} className="w-full bg-[#1E1B2E]/90 border-y border-white/[0.03] py-6 px-6 md:px-12 flex gap-4 text-left font-sans">
                    <div className="w-7 h-7 rounded-lg bg-[#6D28D9] border border-white/10 shrink-0 flex items-center justify-center text-white/80">
                      <User size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-2">
                        {user?.displayName || 'SCHOLASTIC USER'} <span className="text-[7.5px] text-white/20 font-bold">● {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just Now'}</span>
                      </p>
                      
                      {msg.mediaUrl && msg.type === 'image' && (
                        <div className="max-w-md rounded-xl overflow-hidden border border-white/10 mb-2">
                          <img referrerPolicy="no-referrer" src={msg.mediaUrl} alt="Scholastic scan upload" className="w-full h-auto object-cover" />
                        </div>
                      )}

                      <div className="text-sm font-semibold tracking-tight text-white leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              } else {
                // AI Responses: No bubbles or defined container boundaries. Render directly inline.
                return (
                  <div key={msg.id || index} className="w-full py-8 px-6 md:px-12 flex gap-4 text-left font-sans">
                    <div className="w-7 h-7 rounded-lg bg-zinc-950 border border-red-500/20 shrink-0 flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.4)]">
                      <Brain size={14} className="text-red-500 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-1 flex items-center gap-2">
                        OMNI AI companion <span className="text-[7.5px] text-white/20 font-bold">● {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                      </p>
                      
                      <div className="text-[14px] leading-relaxed text-slate-200 tracking-normal font-medium prose prose-invert max-w-none">
                        <TypewriterText 
                          text={msg.text} 
                          msgId={msg.id} 
                          isOmniReply={index === messages.length - 1} // Typewriter stream effects on last message
                        />
                      </div>
                    </div>
                  </div>
                );
              }
            })}

            {isThinking && (
              <div className="w-full py-8 px-6 md:px-12 flex gap-4 text-left">
                <div className="w-7 h-7 rounded-lg bg-zinc-950 border border-red-500/20 shrink-0 flex items-center justify-center animate-spin">
                  <Sparkles size={14} className="text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#DC2626] mb-1">Omni Streaming Engines Active</p>
                  <div className="flex gap-1.5 items-center py-2">
                    <span className="w-1.5 h-1.5 bg-[#DC2626] rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-[#DC2626] rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-[#DC2626] rounded-full animate-bounce" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/25 ml-2">Assembling scholastic tokens...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Tray Bottom Control Panel */}
      <div className="absolute bottom-0 left-0 w-full bg-[#13111C]/90 backdrop-blur-md border-t border-white/5 py-4 px-6 shrink-0 z-20 flex flex-col gap-2.5 items-center">
        
        {/* Floating omni_stop_generation_btn visible strictly during active inference stream */}
        <AnimatePresence>
          {isThinking && (
            <motion.button
              id="omni_stop_generation_btn"
              initial={{ scale: 0.9, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 15, opacity: 0 }}
              onClick={onStopGeneration}
              className="px-4 py-2 bg-red-650 hover:bg-red-600 border border-red-500/30 text-white rounded-full font-black text-[9px] uppercase tracking-widest transition-all hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center gap-2"
            >
              <StopCircle size={12} className="animate-spin" /> Halt Assembly System
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
              className="w-full max-w-4xl bg-[#1c182ee0] border border-white/10 rounded-2xl p-3 mb-2 space-y-2 max-h-40 overflow-y-auto custom-scrollbar text-left"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-1">
                <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
                  <BookOpen size={12} /> Select Academic Note to Import
                </p>
                <button onClick={() => setShowNoteSelector(false)} className="text-white/40 hover:text-white">
                  <X size={12} />
                </button>
              </div>
              {userNotes.length === 0 ? (
                <p className="text-[10px] text-white/30 text-center py-4">No notes found. Create a study note in your notebook first!</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {userNotes.map(n => (
                    <button
                      key={n.id}
                      onClick={() => {
                        setSelectedImportedNote(n);
                        setShowNoteSelector(false);
                      }}
                      className="flex flex-col items-start p-2.5 rounded-xl bg-white/5 hover:bg-violet-600/20 border border-white/5 hover:border-violet-500/30 transition-all text-left w-full cursor-pointer"
                    >
                      <span className="text-xs font-bold text-white line-clamp-1">{n.title || 'Untitled note'}</span>
                      <span className="text-[9px] text-zinc-400 line-clamp-1 mt-0.5">{n.content ? n.content.substring(0, 100) : 'Empty note'}</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Imported Note Action Box */}
        <AnimatePresence>
          {selectedImportedNote && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full max-w-4xl bg-violet-950/40 border border-violet-500/25 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-left mb-2.5"
            >
              <div className="flex items-center gap-2.5 overflow-hidden w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-violet-600/25 border border-violet-500/30 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-violet-300" />
                </div>
                <div className="leading-tight overflow-hidden">
                  <p className="text-[8px] font-black uppercase tracking-wider text-violet-400">Imported Study Source</p>
                  <h4 className="text-xs font-black text-white truncate mt-0.5">{selectedImportedNote.title || 'Untitled Note'}</h4>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                <button
                  onClick={() => {
                    setInputText(`Please analyze, explain, and write deep academic summaries of the following study note:\nTitle: ${selectedImportedNote.title}\nContent:\n"""\n${selectedImportedNote.content}\n"""`);
                    setSelectedImportedNote(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-violet-600/30 border border-violet-500/30 text-violet-300 font-bold text-[10px] uppercase tracking-wider hover:bg-violet-650/45 transition-all text-center cursor-pointer"
                >
                  Analyze & Explain
                </button>
                <button
                  onClick={() => {
                    setInputText(`Please generate an interactive practice quiz on the following study note:\nTitle: ${selectedImportedNote.title}\nContent:\n"""\n${selectedImportedNote.content}\n"""\n\nYou MUST end your response exactly with this structured trigger: [[GENERATE_QUIZ: ${selectedImportedNote.title}, 10]] so I can launch the interactive CBT quiz player.`);
                    setSelectedImportedNote(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-[#DC2626]/20 border border-[#DC2626]/30 text-red-400 font-bold text-[10px] uppercase tracking-wider hover:bg-[#DC2626]/35 transition-all text-center cursor-pointer"
                >
                  Generate Quiz
                </button>
                <button
                  onClick={() => setSelectedImportedNote(null)}
                  className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic input control bar wrapper */}
        <div className="flex items-center gap-3 w-full max-w-4xl bg-[#0A0713]/90 border border-white/10 rounded-2xl p-2 shadow-2xl relative">
          
          <button
            id="omni_attach_file_btn"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-xl transition-all"
            title="Attach educational material"
          >
            <Paperclip size={16} />
          </button>

          <button
            id="omni_import_note_btn"
            onClick={() => setShowNoteSelector(prev => !prev)}
            className={`p-3 rounded-xl transition-all ${showNoteSelector ? 'bg-violet-600/25 text-violet-400' : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white'}`}
            title="Import a notebook study context"
          >
            <BookOpen size={16} />
          </button>
          
          <input 
            type="file"
            ref={fileInputRef}
            onChange={onFileUpload}
            className="hidden"
            accept="image/*,application/pdf"
          />

          <button
            id="omni_voice_record_btn"
            onClick={isRecording ? onStopVoiceRecord : onStartVoiceRecord}
            className={`p-3 rounded-xl transition-all ${
              isRecording 
                ? 'bg-red-600 text-white animate-pulse' 
                : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white'
            }`}
            title={isRecording ? 'Stop recording micro audio' : 'Initialize voice recorder'}
          >
            <Mic size={16} />
          </button>

          {/* Text input area */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isRecording ? 'Capturing audio stream parameters...' : 'Exchange notes with Omni...'}
            disabled={isRecording}
            rows={1}
            className="flex-1 bg-transparent px-2 py-2 text-xs text-white max-h-32 resize-none outline-none placeholder-white/20 select-text font-medium leading-relaxed"
          />

          <button
            id="omni_send_message_btn"
            onClick={onSendMessage}
            disabled={!inputText.trim() && !isRecording}
            className={`p-3 rounded-xl transition-all ${
              inputText.trim() 
                ? 'bg-red-600 hover:bg-red-500 text-white active:translate-y-0.5' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
            title="Execute message transmission"
          >
            <Send size={16} />
          </button>
        </div>
        
        <p className="text-[8px] font-bold text-white/10 uppercase tracking-widest select-none">
          Nuell Study Guide Platform Safeguard Matrix Activated ● End-to-End Cryptography Logged
        </p>
      </div>
    </div>
  );
};
