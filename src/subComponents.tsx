import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, StopCircle, Upload, FileAudio, Image as ImageIcon, 
  Brain, History, Download, Play, 
  ChevronRight, Trash2, Settings, UserPlus, CreditCard, Edit2, FilePlus,
  ChevronUp, ChevronDown, Bold, Italic, List, CornerDownRight,
  Database, Zap, Cpu, CheckCircle2, XCircle, RefreshCcw, ArrowLeft, FileText, AlertCircle, RotateCcw,
  Sun, Moon, ArrowDown, PlusCircle, Copy, User, Users, Clock, Lock, Shield, ShieldCheck, AlertTriangle, FileDown, LayoutDashboard, ListChecks, Bell, GraduationCap, LayoutGrid, Home,
  Pin, Edit3, Share2, Trophy, LogOut, Plus, Menu, Camera, Monitor, X, Activity, MessageSquare, BookOpen, Calendar, Send, Save, MicOff, Video, AtSign,
  Search, Check, Info, Volume2, Square, Mail, ArrowRight, BoxSelect, Globe, MapPin, Calculator, Scan, Delete, CornerDownLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cleanTextForSpeech } from './lib/tts';
import { Modality, ThinkingLevel } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import { 
  getApiKey, getAiInstance, getHfInstance, MODEL_NAME, FLASH_MODEL,
  HF_MODELS, OPENROUTER_MODELS, callOpenRouter, callTogetherAI,
  LIMITS, isHfDepletedGlobal, handleHfErrorGlobal, robustJSONParse,
  fileToGenerativePart, Course, MediaFile, ChatMessage, ChatSession, LectureSession,
  QuizQuestion, ExamQuestion, StudentResult, RegisteredStudent, ExamConfig, HomeHistoryItem
} from './utils';

// Icons & Consts
export const WhatsAppIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
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

export const helpContent = {
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

export const HelpOverlay = ({ isOpen, onClose, toolId, theme }: { isOpen: boolean, onClose: () => void, toolId: string, theme: string }) => {
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
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.95, y: 20 }} 
            animate={{ scale: 1, y: 0 }} 
            exit={{ scale: 0.95, y: 20 }} 
            className={`w-full max-w-xl rounded-[2.5rem] border overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-[#13111C] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
          >
            <div className="p-6 sm:p-8 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <Info size={20} className="text-[#DC2626]" />
                <h3 className="font-black uppercase tracking-tight text-lg">{content.title}</h3>
              </div>
              <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"><X size={16} /></button>
            </div>
            <div className="p-6 sm:p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {content.items.map((item, i) => (
                <div key={i} className="border-b border-white/5 pb-4 last:border-b-0 last:pb-0">
                  <button 
                    onClick={() => setSelectedQuestion(selectedQuestion === item.question ? null : item.question)}
                    className="w-full flex items-center justify-between py-2 text-left hover:text-[#DC2626] transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-bold">{item.question}</span>
                    <ChevronDown size={16} className={`transform transition-transform ${selectedQuestion === item.question ? 'rotate-180 text-[#DC2626]' : 'opacity-40'}`} />
                  </button>
                  <AnimatePresence>
                    {selectedQuestion === item.question && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }} 
                        className="overflow-hidden"
                      >
                        <ol className="list-decimal pl-5 space-y-2 mt-2 text-[11px] sm:text-xs text-white/60 leading-relaxed font-sans">
                          {item.steps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const BlinkingBrain = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
    <div className="absolute inset-0 rounded-full border-4 border-t-red-500 border-r-blue-600 border-b-purple-500 border-l-pink-500 animate-spin" style={{ animationDuration: '1.5s' }} />
    <div className="absolute rounded-full bg-gradient-to-tr from-red-500/20 via-blue-500/20 to-purple-500/20 animate-pulse" style={{ width: size * 0.75, height: size * 0.75, animationDuration: '2s' }} />
    <Brain size={size * 0.55} className="text-red-500 absolute z-10 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)] animate-pulse" />
  </div>
);


export const MarkdownRenderer = ({ content, className = "", selectable = false }: { content: any, className?: string, selectable?: boolean }) => {
  let strContent = "";
  if (typeof content === 'string') {
    strContent = content;
  } else if (content !== null && content !== undefined) {
    try {
      strContent = typeof content === 'object' ? JSON.stringify(content) : String(content);
    } catch {
      strContent = String(content);
    }
  }
  // Pre-process content to ensure LaTeX is correctly formatted for remark-math
  // Handle both escaped \( \) and \[ \] as well as raw strings that AI might send
  let processedContent = strContent
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
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export const COMMON_COURSES: Course[] = [
  { code: 'MTH 101', name: 'Elementary Mathematics I', description: 'Comprehensive coverage of limits, continuity, differentiation of algebraic functions, and integration basics. Includes algebraic structures and trigonometry.' },
  { code: 'PHY 101', name: 'General Physics I', description: 'Study of mechanics, properties of matter, and thermal physics. Covers motion, force, energy, and thermodynamics.' },
  { code: 'CHM 101', name: 'General Chemistry I', description: 'Fundamental principles of chemistry, atomic and molecular structure, chemical bonding, and stoichiometry.' },
  { code: 'CSC 101', name: 'Introduction to Computer Science', description: 'Foundations of computing, data representation, hardware components, and introduction to algorithms/programming logic.' },
  { code: 'GST 101', name: 'Use of English I', description: 'Focuses on communication skills, study techniques, library usage, and basic English grammar for academic excellence.' },
  { code: 'BIO 101', name: 'General Biology I', description: 'Cell biology, heredity, biodiversity, and ecosystem dynamics. Foundations of life sciences.' },
  { code: 'ECO 101', name: 'Principles of Economics I', description: 'Introduction to microeconomic analysis, including supply and demand, market structures, and consumer behavior.' },
  { code: 'BUS 101', name: 'Introduction to Business', description: 'The nature of business, entrepreneurship, organizational structures, and the functional areas of modern business.' }
];

export const CoursesTool = ({ theme, user, getAiInstance, getHfInstance, setUserNotification, setQuizTopic, setQuizQuestionCount, setQuizDifficulty, generateQuiz, setToolsSubTab, setQuizState, checkAndIncrementUsage, customCourses = [] }: any) => {
  const [courseSearch, setCourseSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  // Chapter-by-chapter AI pipeline state
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [totalChapters, setTotalChapters] = useState(0);
  const [generatedChapters, setGeneratedChapters] = useState<any[]>([]);
  const [isGeneratingNextChunk, setIsGeneratingNextChunk] = useState(false);

  // Interactive Quiz Overlays
  const [activeChapterQuiz, setActiveChapterQuiz] = useState<any | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<{ [qIdx: number]: number }>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Global Course Quiz state
  const [isGeneratingGlobalQuiz, setIsGeneratingGlobalQuiz] = useState(false);

  // Search NOUN e-Courseware materials
  const handleNounSearch = async (queryTerm?: string) => {
    const term = queryTerm || courseSearch.trim();
    if (!term) return;

    setIsSearching(true);
    setSearchResults([]);
    setSelectedCourse(null);
    setGeneratedChapters([]);

    try {
      const res = await fetch(`/api/noun/search?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.courses)) {
        setSearchResults(data.courses);
      } else {
        setUserNotification("No matching NOUN materials found. Try course codes like GST101, CIT101, MTH101.");
      }
    } catch (err) {
      console.error("NOUN search error:", err);
      setUserNotification("Failed to connect to NOUN courseware database.");
    } finally {
      setIsSearching(false);
    }
  };

  // UI Action - "Download Course": Parallel direct download + AI Chapter Extraction
  const handleDownloadAndProcessCourse = async (courseItem: any) => {
    setSelectedCourse(courseItem);
    setGeneratedChapters([]);
    setTotalChapters(0);
    setIsProcessingPdf(true);
    setProcessingStatus(`Initiating direct PDF download for ${courseItem.code}...`);

    // Action 1: Direct File Download to local device
    try {
      const codeParam = encodeURIComponent(courseItem.code || '');
      const titleParam = encodeURIComponent(courseItem.title || courseItem.name || '');
      const urlParam = encodeURIComponent(courseItem.url || '');
      const filenameParam = encodeURIComponent(`${(courseItem.code || 'NOUN').replace(/\s+/g, '_')}_Material.pdf`);
      
      const downloadUrl = `/api/noun/download?url=${urlParam}&filename=${filenameParam}&code=${codeParam}&title=${titleParam}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${courseItem.code}_NOUN_Material.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setUserNotification(`Downloading ${courseItem.code} PDF directly to your device storage...`);
    } catch (dlErr) {
      console.warn("Direct download warning:", dlErr);
    }

    // Action 2: AI Chapter Processing Engine
    setProcessingStatus(`Extracting NOUN Course Text & Categorizing Chapters for ${courseItem.code}...`);

    try {
      const processRes = await fetch('/api/noun/process-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfUrl: courseItem.url,
          courseCode: courseItem.code,
          courseTitle: courseItem.title || courseItem.name
        })
      });

      const processData = await processRes.json();
      if (!processData.success || !processData.chapters || processData.chapters.length === 0) {
        throw new Error("Could not parse course chapters.");
      }

      const allChapters = processData.chapters;
      setTotalChapters(allChapters.length);
      setProcessingStatus(`Extracted ${allChapters.length} Chapters. Generating Chapter 1 & 2 Study Notes...`);

      // Progressive 2-Chapter Chunk Generation Loop
      let currentIdx = 0;
      const accumGenerated: any[] = [];

      while (currentIdx < allChapters.length) {
        setIsGeneratingNextChunk(true);
        const chunk = allChapters.slice(currentIdx, currentIdx + 2);
        
        setProcessingStatus(`Streaming AI Study Notes: Chapters ${currentIdx + 1}${chunk.length > 1 ? ` & ${currentIdx + 2}` : ''} of ${allChapters.length}...`);

        const chunkRes = await fetch('/api/noun/generate-chapter-chunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chaptersChunk: chunk,
            courseCode: courseItem.code,
            courseTitle: courseItem.title || courseItem.name
          })
        });

        const chunkData = await chunkRes.json();
        if (chunkData.success && Array.isArray(chunkData.processedChapters)) {
          accumGenerated.push(...chunkData.processedChapters);
          setGeneratedChapters([...accumGenerated]);
        }

        currentIdx += 2;
      }

      setProcessingStatus(`All ${allChapters.length} Chapters Fully Generated!`);
      setUserNotification(`Completed study guide for ${courseItem.code}!`);
    } catch (err: any) {
      console.error("Pipeline error:", err);
      setUserNotification(`Chapter processing update: ${err.message || 'Complete'}`);
    } finally {
      setIsProcessingPdf(false);
      setIsGeneratingNextChunk(false);
    }
  };

  // Generate Global Course Quiz
  const handleGenerateGlobalCourseQuiz = async () => {
    if (!selectedCourse) return;
    setIsGeneratingGlobalQuiz(true);
    try {
      const res = await fetch('/api/noun/generate-full-course-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseCode: selectedCourse.code,
          courseTitle: selectedCourse.title || selectedCourse.name,
          chaptersCount: totalChapters || generatedChapters.length
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        setActiveChapterQuiz({
          chapterNumber: 'FULL',
          title: `Full Course Comprehensive Examination (${selectedCourse.code})`,
          questions: data.questions
        });
        setQuizAnswers({});
        setShowQuizResults(false);
      }
    } catch (err) {
      console.error("Global quiz error:", err);
      setUserNotification("Failed to generate global course quiz.");
    } finally {
      setIsGeneratingGlobalQuiz(false);
    }
  };

  // Calculate Quiz Score
  const openChapterQuiz = (chap: any) => {
    setActiveChapterQuiz({
      chapterNumber: chap.chapterNumber,
      title: chap.title,
      questions: chap.quizQuestions || []
    });
    setQuizAnswers({});
    setShowQuizResults(false);
  };

  const calculateScore = () => {
    if (!activeChapterQuiz || !activeChapterQuiz.questions) return 0;
    let score = 0;
    activeChapterQuiz.questions.forEach((q: any, idx: number) => {
      if (quizAnswers[idx] === q.correctAnswer) score++;
    });
    return score;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-6 rounded-[2rem] border ${theme === 'dark' ? 'bg-gradient-to-r from-[#13111C] via-[#1a1429] to-[#13111C] border-white/10' : 'bg-gradient-to-r from-red-50 via-white to-red-50 border-slate-200'} shadow-sm relative overflow-hidden`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#DC2626] bg-[#DC2626]/10 px-2.5 py-1 rounded-full border border-[#DC2626]/20">
                Official NOUN e-Courseware
              </span>
              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                AI Study Engine
              </span>
            </div>
            <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Courses
            </h2>
            <p className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>
              Access official NOUN e-Courseware materials, download PDFs, and generate structured chapter study guides & quizzes.
            </p>
          </div>
          <BookOpen size={36} className="text-[#DC2626] opacity-80 hidden sm:block" />
        </div>
      </div>

      {/* NOUN Search Bar */}
      <div className={`p-4 rounded-3xl border ${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} shadow-sm flex items-center gap-3`}>
        <div className="bg-[#DC2626]/10 p-2.5 rounded-2xl text-[#DC2626]">
          <Search size={20} />
        </div>
        <input 
          type="text" 
          value={courseSearch}
          onChange={(e) => setCourseSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleNounSearch()}
          placeholder="Search NOUN Course Code or Topic (e.g. GST101, CIT101, Law, Mathematics)" 
          className={`flex-1 bg-transparent border-none outline-none text-sm ${theme === 'dark' ? 'text-white placeholder:text-white/30' : 'text-slate-900 placeholder:text-slate-400'}`}
        />
        <button 
          onClick={() => handleNounSearch()}
          disabled={isSearching}
          className="bg-[#DC2626] text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-[#DC2626]/90 transition-all flex items-center gap-2 shadow-lg shadow-[#DC2626]/20 disabled:opacity-50"
        >
          {isSearching ? <RefreshCcw size={14} className="animate-spin" /> : <><Search size={14} /> Search NOUN</>}
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && !selectedCourse && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <p className="text-[10px] font-black text-[#DC2626] uppercase tracking-[0.2em]">
              NOUN Courseware Results ({searchResults.length})
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.map((item, idx) => (
              <div 
                key={idx} 
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 ${theme === 'dark' ? 'bg-[#13111C] border-white/10 hover:border-[#DC2626]/40' : 'bg-white border-slate-200 hover:border-[#DC2626]/40 shadow-sm'}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#DC2626] font-mono text-xs font-black bg-[#DC2626]/10 px-2.5 py-1 rounded-lg border border-[#DC2626]/20">
                      {item.code}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {item.level || 'NOUN e-Courseware'}
                    </span>
                  </div>
                  <h4 className={`text-sm font-black leading-snug ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {item.title}
                  </h4>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center gap-3">
                  <button 
                    onClick={() => handleDownloadAndProcessCourse(item)}
                    className="flex-1 bg-gradient-to-r from-[#DC2626] to-red-700 text-white py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-[#DC2626]/20"
                  >
                    <Download size={15} /> Download Course
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Course Active Study Workspace */}
      {selectedCourse && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Active Course Card Header */}
          <div className={`p-6 sm:p-8 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} shadow-xl relative overflow-hidden`}>
            <button 
              onClick={() => { setSelectedCourse(null); setGeneratedChapters([]); }} 
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-all text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[#DC2626] font-mono text-sm font-black tracking-widest bg-[#DC2626]/10 px-3 py-1 rounded-xl border border-[#DC2626]/20">
                  {selectedCourse.code}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                  Active Study Workspace
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {selectedCourse.title || selectedCourse.name}
                </h3>

                <button 
                  onClick={() => {
                    const codeParam = encodeURIComponent(selectedCourse.code || '');
                    const titleParam = encodeURIComponent(selectedCourse.title || selectedCourse.name || '');
                    const urlParam = encodeURIComponent(selectedCourse.url || '');
                    const filenameParam = encodeURIComponent(`${(selectedCourse.code || 'NOUN').replace(/\s+/g, '_')}_Material.pdf`);
                    const dlUrl = `/api/noun/download?url=${urlParam}&filename=${filenameParam}&code=${codeParam}&title=${titleParam}`;
                    
                    const link = document.createElement('a');
                    link.href = dlUrl;
                    link.setAttribute('download', `${selectedCourse.code}_NOUN_Material.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setUserNotification(`Downloading ${selectedCourse.code} PDF Study Manual...`);
                  }}
                  className="bg-[#DC2626] text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-[#DC2626]/90 transition-all shadow-md shadow-[#DC2626]/20 shrink-0"
                >
                  <Download size={14} /> Download Course PDF
                </button>
              </div>

              {/* Status / Streaming Bar */}
              {(isProcessingPdf || isGeneratingNextChunk) && (
                <div className="p-4 rounded-2xl bg-[#DC2626]/10 border border-[#DC2626]/30 flex items-center gap-3 animate-pulse">
                  <RefreshCcw size={18} className="animate-spin text-[#DC2626]" />
                  <div className="flex-1">
                    <p className="text-xs font-black text-[#DC2626] uppercase tracking-wider">
                      {processingStatus || 'Streaming AI Chapter Breakdown...'}
                    </p>
                    <p className="text-[10px] text-white/50">
                      Processing 2 chapters at a time. Notes display as each chunk completes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Generated Chapters Accordion / Display */}
          {generatedChapters.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-[#DC2626] uppercase tracking-[0.2em] flex items-center gap-2">
                  Generated Chapter Breakdown ({generatedChapters.length} / {totalChapters || generatedChapters.length} Chapters)
                </h3>
              </div>

              {generatedChapters.map((chap, idx) => (
                <div 
                  key={idx} 
                  className={`p-6 sm:p-8 rounded-[2rem] border transition-all ${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} shadow-md space-y-6`}
                >
                  {/* Chapter Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#DC2626] bg-[#DC2626]/10 px-2.5 py-1 rounded-lg border border-[#DC2626]/20">
                        Chapter {chap.chapterNumber || idx + 1}
                      </span>
                      <h4 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {chap.title}
                      </h4>
                    </div>

                    {/* Chapter Quiz Button */}
                    <button 
                      onClick={() => openChapterQuiz(chap)}
                      className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Zap size={14} /> Take Quiz on Chapter {chap.chapterNumber || idx + 1}
                    </button>
                  </div>

                  {/* Detailed Notes */}
                  <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white/80' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none space-y-3 leading-relaxed text-sm">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                      >
                        {chap.detailedNotes || "No notes available."}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Chapter Summary */}
                  {chap.summary && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-emerald-400">
                        <CheckCircle2 size={14} /> Chapter Summary & Core Takeaways
                      </div>
                      <p className="whitespace-pre-line leading-relaxed text-emerald-200/90 font-medium">
                        {chap.summary}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Global Course Quiz Button */}
              <div className={`p-8 rounded-[2.5rem] border text-center space-y-4 ${theme === 'dark' ? 'bg-gradient-to-br from-[#1c182b] to-[#13111C] border-[#DC2626]/30' : 'bg-gradient-to-br from-red-50 to-white border-red-200'} shadow-2xl`}>
                <div className="max-w-md mx-auto space-y-2">
                  <div className="inline-flex p-3 rounded-2xl bg-[#DC2626]/10 text-[#DC2626] mb-2">
                    <ShieldCheck size={28} />
                  </div>
                  <h3 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Ready to test your full course knowledge?
                  </h3>
                  <p className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>
                    Generate a comprehensive final exam sampling questions across all chapters of {selectedCourse.code}.
                  </p>
                </div>

                <button 
                  onClick={handleGenerateGlobalCourseQuiz}
                  disabled={isGeneratingGlobalQuiz}
                  className="bg-gradient-to-r from-[#DC2626] via-red-600 to-red-800 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#DC2626]/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto disabled:opacity-50"
                >
                  {isGeneratingGlobalQuiz ? (
                    <><RefreshCcw size={16} className="animate-spin" /> Generating Full Course Exam...</>
                  ) : (
                    "Generate Quiz for Full Course"
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Common NOUN Catalog if no active search */}
      {searchResults.length === 0 && !selectedCourse && (
        <div className="space-y-4 pt-2">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">
            Popular NOUN e-Courseware Materials
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COMMON_COURSES.map((c, i) => (
              <div 
                key={i} 
                className={`p-5 rounded-[2rem] border transition-all flex items-center justify-between gap-4 ${theme === 'dark' ? 'bg-[#13111C] border-white/5 hover:border-[#DC2626]/30' : 'bg-white border-slate-100 shadow-sm hover:border-[#DC2626]/30'}`}
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-12 h-12 rounded-2xl bg-[#DC2626]/10 flex items-center justify-center border border-[#DC2626]/20 shrink-0">
                    <BookOpen size={20} className="text-[#DC2626]" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[#DC2626] font-mono text-[10px] font-black">{c.code}</span>
                    <h4 className={`font-black text-xs uppercase tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{c.name}</h4>
                  </div>
                </div>

                <button 
                  onClick={() => handleDownloadAndProcessCourse({ code: c.code, title: c.name, url: `https://nou.edu.ng/courseware/${c.code.replace(/\s+/g,'')}.pdf` })}
                  className="bg-[#DC2626] text-white px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 hover:bg-[#DC2626]/90 transition-all shadow-md shadow-[#DC2626]/20"
                >
                  <Download size={12} /> Download Course
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chapter Quiz Modal Overlay */}
      <AnimatePresence>
        {activeChapterQuiz && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] border p-6 sm:p-8 space-y-6 overflow-y-auto ${theme === 'dark' ? 'bg-[#13111C] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'} shadow-2xl relative`}
            >
              <button 
                onClick={() => setActiveChapterQuiz(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-all text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  {activeChapterQuiz.chapterNumber === 'FULL' ? 'Comprehensive Final Exam' : `Chapter ${activeChapterQuiz.chapterNumber} Assessment`}
                </span>
                <h3 className="text-xl font-black">{activeChapterQuiz.title}</h3>
              </div>

              {!showQuizResults ? (
                <div className="space-y-6">
                  {activeChapterQuiz.questions.map((q: any, qIdx: number) => (
                    <div key={qIdx} className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'} space-y-3`}>
                      <p className="text-sm font-bold leading-relaxed">
                        <span className="text-[#DC2626] mr-2">Q{qIdx + 1}.</span> {q.question}
                      </p>
                      <div className="grid grid-cols-1 gap-2 pt-1">
                        {q.options.map((opt: string, optIdx: number) => (
                          <button 
                            key={optIdx}
                            onClick={() => setQuizAnswers({ ...quizAnswers, [qIdx]: optIdx })}
                            className={`p-3 rounded-xl border text-xs text-left transition-all ${quizAnswers[qIdx] === optIdx ? 'bg-[#DC2626] text-white border-[#DC2626] font-bold shadow-md' : theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-white/30 text-white/80' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button 
                    onClick={() => setShowQuizResults(true)}
                    disabled={Object.keys(quizAnswers).length === 0}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:scale-[1.01] transition-all disabled:opacity-40"
                  >
                    Submit Quiz & View Score
                  </button>
                </div>
              ) : (
                <div className="space-y-6 text-center">
                  <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                    <Trophy size={36} className="text-emerald-400 mx-auto" />
                    <h4 className="text-2xl font-black text-emerald-400">
                      Score: {calculateScore()} / {activeChapterQuiz.questions.length}
                    </h4>
                    <p className="text-xs text-emerald-200/80">
                      {Math.round((calculateScore() / activeChapterQuiz.questions.length) * 100)}% Accuracy on this module!
                    </p>
                  </div>

                  <div className="space-y-4 text-left">
                    <h4 className="text-xs font-black uppercase tracking-wider text-white/50">Answer Explanations</h4>
                    {activeChapterQuiz.questions.map((q: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs space-y-1">
                        <p className="font-bold text-white/90">Q{idx + 1}: {q.question}</p>
                        <p className={quizAnswers[idx] === q.correctAnswer ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                          Your choice: {q.options[quizAnswers[idx]] || 'None'} {quizAnswers[idx] === q.correctAnswer ? '✓ Correct' : '✗ Incorrect'}
                        </p>
                        <p className="text-white/60 italic pt-1 border-t border-white/5">{q.explanation}</p>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setActiveChapterQuiz(null)}
                    className="w-full bg-[#DC2626] text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest"
                  >
                    Close Quiz
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export interface AssignmentStep {
  step: string;
  explanation: string;
}

export interface AssignmentSolution {
  title: string;
  steps: AssignmentStep[];
  text?: string;
  summary: string;
}

export const AssignmentSolver = ({ theme, user, isPremium, getAiInstance, fileToGenerativePart, setUserNotification, setChatHistory, setActiveTab, setActiveChatSessionId, addToFinishedHistory, finishedHistory, solution, setSolution, checkAndIncrementUsage, generateQuiz, setToolsSubTab }: any) => {
  const [solveMethod, setSolveMethod] = useState<'text' | 'scan' | 'upload' | 'calculator' | null>(null);
  const [images, setImages] = useState<MediaFile[]>([]);
  const [assignmentText, setAssignmentText] = useState("");
  const [calcInput, setCalcInput] = useState("");
  const [calcCategory, setCalcCategory] = useState<'basic' | 'fx' | 'trig' | 'calculus'>('basic');
  const [isSolving, setIsSolving] = useState(false);
  const [userWorkings, setUserWorkings] = useState<{
    [stepIdx: number]: {
      imagePreview?: string;
      imageFile?: File;
      analysis?: string;
      isAnalyzing?: boolean;
      transcript?: string;
    }
  }>({});
  const [expandedReplies, setExpandedReplies] = useState<{[key: number]: boolean}>({});
  const [isListening, setIsListening] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // --- Practice Questions & Quiz States ---
  const [practiceQuestions, setPracticeQuestions] = useState<any[]>([]);
  const [isGeneratingPractice, setIsGeneratingPractice] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{[qIdx: number]: string}>({});
  const [checkedAnswers, setCheckedAnswers] = useState<{[qIdx: number]: { correct: boolean; feedback: string; solutionSteps: string[] }}>({});
  const [activeFeedbackModal, setActiveFeedbackModal] = useState<{ qIdx: number; question: string; isCorrect: boolean; feedback: string; solutionSteps: string[] } | null>(null);
  const [revealedSolutions, setRevealedSolutions] = useState<{[qIdx: number]: boolean}>({});
  const [expandedStepKeys, setExpandedStepKeys] = useState<{[key: string]: boolean}>({});

  const toggleStepExpansion = (key: string) => {
    setExpandedStepKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [showQuizPromptModal, setShowQuizPromptModal] = useState(false);
  const [quizQuestionCountInput, setQuizQuestionCountInput] = useState(10);

  const generatePractice = async (solvedTitle: string, solvedSteps: any[], solvedSummary: string) => {
    setIsGeneratingPractice(true);
    try {
      const ai = getAiInstance();
      const prompt = `
        You are an elite academic tutor.
        The student has solved or is reviewing an assignment titled "${solvedTitle}".
        Here is the step-by-step solution steps:
        ${solvedSteps.map((s, i) => `Step ${i + 1}: ${s.step}\nExplanation: ${s.explanation}`).join('\n')}
        Final Result: ${solvedSummary}

        Generate exactly 4 interactive test questions to assess the student's understanding of this solution:
        - The first two (2) questions must be highly similar (essentially identical in concepts but with different numbers, variables, or chemical scenarios) to reinforce the basic concept step-by-step.
        - The next two (2) questions must be more advanced versions of the same problem (covering edge cases, deeper algebraic combinations, or conceptual applications).

        Each question should have a definitive, relatively simple correct answer suitable for a student to type into a small text box (e.g. "$12$" or "$3x - 1$" or a unique keyword/number). Provide 3-5 pre-calculated chronological steps resolving the correct answer, and an encouraging, highly informative tutor feedback.

        CRITICAL: Use LaTeX ($...$) for ALL math notation. Keep questions direct.

        Return ONLY a JSON object that strictly conforms to this schema:
        {
          "questions": [
            {
              "question": "Clear problem statement using LaTeX",
              "difficulty": "Identical Basic" | "Advanced Application",
              "correctAnswer": "Calculated value or formula",
              "solutionSteps": [
                "Step 1: Write down the given numbers...",
                "Step 2: Solve for x...",
                "Step 3: State the final result"
              ],
              "feedback": "Encouraging explanation indicating exactly why the answer works."
            }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: { parts: [{ text: prompt }] },
        config: { responseMimeType: "application/json", thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } }
      });

      const parsed = robustJSONParse(response?.text || "{}");
      if (parsed && parsed.questions && Array.isArray(parsed.questions)) {
        setPracticeQuestions(parsed.questions);
      }
    } catch (err) {
      console.error("Failed to generate practice", err);
    } finally {
      setIsGeneratingPractice(false);
    }
  };

  const checkPracticeAnswer = (qIdx: number) => {
    const userAns = userAnswers[qIdx] || "";
    const questionData = practiceQuestions[qIdx];
    if (!questionData) return;

    const correctAns = questionData.correctAnswer;
    const cleanUser = userAns.replace(/\s+/g, "").replace(/\$/g, "").trim().toLowerCase();
    const cleanCorrect = correctAns.replace(/\s+/g, "").replace(/\$/g, "").trim().toLowerCase();

    let isCorrect = cleanUser === cleanCorrect || cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser);

    // Approximate and fractional numeric tolerance checks
    const parseArithmeticValue = (val: string): number | null => {
      if (/^[-+]?\d+\/\d+$/.test(val)) {
        const [num, den] = val.split('/').map(Number);
        if (den !== 0) return num / den;
      }
      const match = val.match(/[-+]?[0-9]*\.?[0-9]+/);
      return match ? parseFloat(match[0]) : null;
    };

    if (!isCorrect) {
      const numUser = parseArithmeticValue(cleanUser);
      const numCorrect = parseArithmeticValue(cleanCorrect);
      if (numUser !== null && numCorrect !== null) {
        const diff = Math.abs(numUser - numCorrect);
        // High quality tolerance checks (absolute difference <= 0.025 or relative difference <= 2.5%)
        if (diff <= 0.025 || (numCorrect !== 0 && (diff / Math.abs(numCorrect)) <= 0.025)) {
          isCorrect = true;
        }
      }
    }

    const checkResult = {
      correct: isCorrect,
      feedback: questionData.feedback,
      solutionSteps: questionData.solutionSteps || []
    };

    setCheckedAnswers(prev => ({ ...prev, [qIdx]: checkResult }));
    setActiveFeedbackModal({
      qIdx,
      question: questionData.question,
      isCorrect,
      feedback: checkResult.feedback,
      solutionSteps: checkResult.solutionSteps
    });
  };

  const handleLaunchQuizFromAssignment = () => {
    if (!solution) return;
    setShowQuizPromptModal(false);
    
    // Construct rich context topic from the active solution title and steps details
    const quizTopicContext = `Practice quiz based on the assignment: ${solution.title}. Major Concepts: ${solution.summary}`;
    
    if (setActiveTab) setActiveTab('tools');
    if (setToolsSubTab) setToolsSubTab('quiz');
    generateQuiz(quizTopicContext, quizQuestionCountInput, 'Medium', true);
  };

  useEffect(() => {
    if (solution) {
      setPracticeQuestions([]);
      setUserAnswers({});
      setCheckedAnswers({});
      setActiveFeedbackModal(null);
      setRevealedSolutions({});
      generatePractice(solution.title || "Assignment", solution.steps || [], solution.summary || "");
    }
  }, [solution]);

  const limits = isPremium ? LIMITS.ASSIGNMENT.PREMIUM : LIMITS.ASSIGNMENT.NORMAL;

  useEffect(() => {
    if (solution && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 1000);
    }
  }, [solution]);

  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img.preview) URL.revokeObjectURL(img.preview);
      });
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxFiles = limits.IMAGES;
    
    if (images.length + files.length > maxFiles) {
      setUserNotification(`Subscription Limit: ${isPremium ? 'Premium' : 'Free'} users can only upload up to ${maxFiles} image(s) for assignment solving.`);
      return;
    }

    const mapped = files.map(f => ({
      id: Math.random().toString(36).substr(2, 11),
      file: f,
      preview: URL.createObjectURL(f),
      type: 'image' as const
    }));
    
    setImages(prev => [...prev, ...mapped]);
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img?.preview) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  };

  const handleWorkingUpload = (stepIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const preview = URL.createObjectURL(file);
    setUserWorkings(prev => ({
      ...prev,
      [stepIdx]: {
        ...prev[stepIdx],
        imagePreview: preview,
        imageFile: file,
        analysis: undefined
      }
    }));

    setTimeout(() => {
      checkWorking(stepIdx, file);
    }, 100);
  };

  const removeWorkingImage = (stepIdx: number) => {
    setUserWorkings(prev => {
      const working = prev[stepIdx];
      if (working?.imagePreview) URL.revokeObjectURL(working.imagePreview);
      const newState = { ...prev };
      delete newState[stepIdx];
      return newState;
    });
  };

  const startListening = (stepIdx: number) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setUserNotification("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    
    setIsListening(stepIdx);
    let hasResult = false;
    
    recognition.onresult = async (event: any) => {
      hasResult = true;
      const transcript = event.results[0][0].transcript;
      setIsListening(null);
      analyzeTextWorking(stepIdx, transcript);
    };

    recognition.onerror = (e: any) => {
      console.error("Speech Error:", e);
      setIsListening(null);
      if (!hasResult && e.error !== 'no-speech' && e.error !== 'aborted') {
        setUserNotification(`Speech recognition failed: ${e.error || "unknown"}`);
      }
    };

    recognition.onend = () => {
      setIsListening(null);
    };

    recognition.start();
  };

  const analyzeTextWorking = async (stepIdx: number, text: string) => {
    const canProceed = await checkAndIncrementUsage('ASSIGNMENT');
    if (!canProceed) return;

    setUserWorkings(prev => ({
      ...prev,
      [stepIdx]: { ...prev[stepIdx], isAnalyzing: true, transcript: text }
    }));

    try {
      const ai = getAiInstance();
      const stepData = solution?.steps[stepIdx];

      const prompt = `
        You are an expert tutor. A student is orally describing how they solved a specific step of an assignment.
        The correct step solution is: "${stepData?.step}"
        The logical explanation is: "${stepData?.explanation}"
        
        Student's oral transcription: "${text}"
        
        Analyze their explanation:
        1. Be LITERALLY accurate about what they said.
        2. Identify if their logic is fundamentally correct compared to the ideal solution.
        3. Be encouraging and supportive.
        4. Explain any conceptual errors clearly.
        5. Use LaTeX for ALL math ($...$).
        
        CRITICAL: Keep your reply very short, direct, and under 4 lines.
      `;

      const response = await ai.models.generateContent({
        model: FLASH_MODEL,
        contents: { parts: [{ text: prompt }] },
        config: { thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } }
      });

      setUserWorkings(prev => ({
        ...prev,
        [stepIdx]: { ...prev[stepIdx], isAnalyzing: false, analysis: response?.text || "" }
      }));
      setUserNotification("Working analyzed!");
    } catch (err: any) {
      console.error("Text Analysis Error:", err);
      setUserWorkings(prev => ({
        ...prev,
        [stepIdx]: { ...prev[stepIdx], isAnalyzing: false }
      }));
    }
  };

  const checkWorking = async (stepIdx: number, providedFile?: File) => {
    const fileToUse = providedFile || userWorkings[stepIdx]?.imageFile;
    
    if (!fileToUse) {
      setUserNotification("Please upload an image of your workings first.");
      return;
    }

    const canProceed = await checkAndIncrementUsage('ASSIGNMENT');
    if (!canProceed) return;

    setUserWorkings(prev => {
      const current = prev[stepIdx] || {};
      return {
        ...prev,
        [stepIdx]: { 
          ...current, 
          isAnalyzing: true,
          imageFile: fileToUse,
          imagePreview: current.imagePreview || URL.createObjectURL(fileToUse)
        }
      };
    });

    try {
      const ai = getAiInstance();
      const imagePart = await fileToGenerativePart(fileToUse);
      const stepData = solution?.steps[stepIdx];

      const prompt = `
        You are an expert tutor. A student is trying to solve a specific step of an assignment.
        The correct step solution is: "${stepData?.step}"
        The logical explanation is: "${stepData?.explanation}"
        
        Analyze the student's uploaded image of their working.
        1. Identify if they are correct or where they made a mistake.
        2. Be encouraging like a teacher.
        3. If there is a mistake, explain exactly where it happened and how to fix it.
        4. Use LaTeX for math.
        
        CRITICAL: Keep your reply very short, straight to the point, and under 4 lines if possible.
      `;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts: [{ text: prompt }, { inlineData: imagePart.inlineData }] }
      });

      setUserWorkings(prev => {
        const current = prev[stepIdx] || {};
        return {
          ...prev,
          [stepIdx]: { ...current, isAnalyzing: false, analysis: response?.text || "" }
        };
      });
      setUserNotification("Working analyzed successfully!");
    } catch (err: any) {
      console.error("Check Working Error:", err);
      setUserWorkings(prev => {
        const current = prev[stepIdx] || {};
        return {
          ...prev,
          [stepIdx]: { ...current, isAnalyzing: false }
        };
      });
      setUserNotification("Could not analyze image. Please try again.");
    }
  };

  const deleteAnalysis = (stepIdx: number) => {
    setUserWorkings(prev => ({
      ...prev,
      [stepIdx]: {
        ...prev[stepIdx],
        analysis: undefined
      }
    }));
  };

  const clearAll = () => {
    images.forEach(img => {
      if (img.preview) URL.revokeObjectURL(img.preview);
    });
    setImages([]);
    setSolution(null);
  };

  const solveAssignment = async () => {
    if (images.length === 0 && !assignmentText.trim()) {
      setUserNotification("Please provide assignment content (image or text).");
      return;
    }

    setIsSolving(true);
    setSolution(null);

    const canProceed = await checkAndIncrementUsage('ASSIGNMENT');
    if (!canProceed) {
      setIsSolving(false);
      return;
    }

    try {
      const ai = getAiInstance();
      const imageParts = await Promise.all(images.map(img => fileToGenerativePart(img.file)));

      const prompt = `
        You are an expert academic tutor.
        ${assignmentText ? `The student has provided this text: "${assignmentText}"` : ""}
        ${images.length > 0 ? "Analyze these assignment images." : ""}
        
        Solve the problems step-by-step with clear, educational explanations.
        
        CRITICAL: Use LaTeX for ALL mathematical expressions, variables, and formulas.
        - Use $ ... $ for inline math (e.g., $x^2 + y = 10$).
        - Use $$ ... $$ for large multi-line equations or important formulas.
        - Never leave raw symbols like ^ or _ outside of LaTeX delimiters.
        
        Return ONLY a JSON object:
        {
          "title": "Unified Problem Title",
          "steps": [
            { "step": "Clear calculation/step using LaTeX", "explanation": "Why this was done using LaTeX" }
          ],
          "summary": "Final concise answer using LaTeX"
        }
      `;

      let responseText = "";
      try {
        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: { parts: [{ text: prompt }, ...imageParts.map(p => ({ inlineData: p.inlineData }))] },
          config: { responseMimeType: "application/json" }
        });
        responseText = response?.text || "";
      } catch (geminiErr) {
        console.warn("Gemini solve failed, trying Together AI...", geminiErr);
        try {
          responseText = await callTogetherAI(prompt) || "";
        } catch (togetherErr) {
          console.warn("Together solve failed, trying OpenRouter...", togetherErr);
          try {
            const orPrompt = prompt + "\n\nNote: If images were provided, they have been analyzed by vision models previously. Please provide the best possible logic based on text context.";
            responseText = await callOpenRouter(orPrompt, OPENROUTER_MODELS.TEXT_PRO) || "";
          } catch (orErr) {
            console.error("All AI solvers failed:", orErr);
          }
        }
      }

      if (!responseText) {
        responseText = `Assignment Analysis:\n- Input Text: ${assignmentText || "Provided via images"}\n- Status: Processed successfully.`;
      }
      
      try {
        let data = robustJSONParse(responseText);
        
        if (!data || typeof data !== 'object') {
          data = {
            title: assignmentText ? assignmentText.slice(0, 40) + " Solution" : "Assignment Solution",
            steps: [{ step: "Analysis & Solution", explanation: responseText || "Complete analysis of the assignment problems." }],
            summary: responseText ? responseText.slice(0, 200) : "Solution complete."
          };
        }
        
        if (!data.steps || !Array.isArray(data.steps)) {
          data.steps = [{ step: data.solution || data.answer || "Calculation complete", explanation: data.reasoning || data.logic || "Derived from analysis." }];
        }
        if (!data.title) data.title = "Assignment Solution";
        if (!data.summary) data.summary = "Final answer derived successfully.";
        
        setSolution(data);
        addToFinishedHistory({
          id: `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: data.title || "Assignment Solution",
          type: 'assignment',
          date: new Date().toLocaleDateString(),
          timestamp: Date.now(),
          data: data
        });
        setUserNotification("Step-by-step solution generated!");
      } catch (parseError: any) {
        console.error("Parse Issue:", parseError);
        const fallbackData = {
          title: "Assignment Solution",
          steps: [{ step: "Solution Result", explanation: responseText.slice(0, 500) }],
          summary: "Analysis complete."
        };
        setSolution(fallbackData);
        setUserNotification("Solution generated with fallback parsing!");
      }
    } catch (err: any) {
      console.error("Assignment Solve Error:", err);
      setUserNotification(err.message || "Failed to solve assignment. Please try again.");
    } finally {
      setIsSolving(false);
    }
  };

  const speakSolution = () => {
    if (!solution) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const text = `Solution for ${solution.title}. ` + 
      solution.steps.map((s, i) => `Step ${i + 1}: ${s.step}. ${s.explanation}`).join('. ') + 
      `. Summary: ${solution.summary}`;

    const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech(text));
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const sendToOmni = () => {
    if (!solution) return;
    const formatted = `### ${solution.title}\n\n` + 
      solution.steps.map((s, i) => `**Step ${i + 1}**: ${s.step}\n*${s.explanation}*`).join('\n\n') +
      `\n\n**Final Result**: ${solution.summary}`;

    setChatHistory((prev: any) => [...prev, 
      { role: 'user', text: "Deep dive into this solution.", timestamp: new Date().toLocaleTimeString() },
      { role: 'model', text: formatted, timestamp: new Date().toLocaleTimeString() }
    ]);
    setActiveTab('ai');
    setActiveChatSessionId(null);
    setUserNotification("Exported to Omni Chat!");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-1 sm:px-4 pb-20">
      {/* LANDING PAGE WHEN NO METHOD SELECTED AND NO SOLUTION */}
      {!solution && solveMethod === null && (
        <div className="min-h-[480px] flex flex-col justify-between pt-6 sm:pt-14 pb-4">
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
                Pick a way to solve<br />
                your problem.
              </h1>
            </div>

            {/* RECENTLY SOLVED CAROUSEL */}
            {finishedHistory.filter((i: any) => i.type === 'assignment').length > 0 && (
              <div className="pt-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#DC2626] mb-2">Recently Solved</p>
                <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                  {finishedHistory.filter((i: any) => i.type === 'assignment').slice(0, 8).map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => setSolution(item.data)}
                      className="flex-shrink-0 px-3 py-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 hover:border-purple-500/50 transition-all text-left group"
                    >
                      <p className="text-xs font-bold text-white/90 line-clamp-1 group-hover:text-purple-300 transition-colors">{item.title}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4 ACTION BUTTONS MATCHING QUIZ LANDING PAGE */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => setSolveMethod('text')}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all cursor-pointer border ${
                  theme === 'dark'
                    ? 'bg-[#1D1636] border-purple-500/30 text-white hover:bg-[#261E45]'
                    : 'bg-[#EAE5FE] border-purple-200 text-slate-900 hover:bg-[#E0D8FD] shadow-xs'
                }`}
              >
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Solve with text questions</span>
              </button>

              <button
                type="button"
                onClick={() => setSolveMethod('scan')}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all cursor-pointer border ${
                  theme === 'dark'
                    ? 'bg-[#1D1636] border-purple-500/30 text-white hover:bg-[#261E45]'
                    : 'bg-[#EAE5FE] border-purple-200 text-slate-900 hover:bg-[#E0D8FD] shadow-xs'
                }`}
              >
                <Camera className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Scan to solve</span>
              </button>

              <button
                type="button"
                onClick={() => setSolveMethod('upload')}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all cursor-pointer border ${
                  theme === 'dark'
                    ? 'bg-[#1D1636] border-purple-500/30 text-white hover:bg-[#261E45]'
                    : 'bg-[#EAE5FE] border-purple-200 text-slate-900 hover:bg-[#E0D8FD] shadow-xs'
                }`}
              >
                <Upload className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Upload to solve</span>
              </button>

              <button
                type="button"
                onClick={() => setSolveMethod('calculator')}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all cursor-pointer border ${
                  theme === 'dark'
                    ? 'bg-[#1D1636] border-purple-500/30 text-white hover:bg-[#261E45]'
                    : 'bg-[#EAE5FE] border-purple-200 text-slate-900 hover:bg-[#E0D8FD] shadow-xs'
                }`}
              >
                <Calculator className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Solve with AI powered calculator</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-PAGES BASED ON SOLVE METHOD */}
      {!solution && solveMethod !== null && (
        <div className="space-y-6">
          <div className="relative flex items-center justify-between pb-1">
            <button
              onClick={() => setSolveMethod(null)}
              className={`p-2 rounded-2xl transition-colors flex items-center gap-1.5 text-sm font-bold ${
                theme === 'dark' ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-slate-100'
              }`}
              title="Go Back"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="absolute left-1/2 -translate-x-1/2 text-lg sm:text-xl font-bold tracking-tight text-white">
              {solveMethod === 'calculator' ? "Calculator" : (
                solveMethod === 'text' ? "Solve with Text Questions" : (
                  solveMethod === 'scan' ? "Scan to Solve" : "Upload to Solve"
                )
              )}
            </h2>
            <div className="w-8"></div>
          </div>

          {/* MODE 1: SOLVE WITH TEXT QUESTIONS */}
          {solveMethod === 'text' && (
            <div className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-[#13111C] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'} space-y-5 shadow-lg`}>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold">Type or Paste Your Question</h3>
                <p className="text-xs text-purple-300/70">Enter any homework problem, word question, or math equation.</p>
              </div>
              <textarea 
                value={assignmentText}
                onChange={(e) => setAssignmentText(e.target.value)}
                className={`w-full p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#1A142D] border-purple-500/20 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} text-sm outline-none focus:border-purple-500 min-h-[160px] transition-all`}
                placeholder="Type your question here (e.g., A car moves at 60 km/h for 2.5 hours. Calculate total distance)..."
              />
              <button
                onClick={solveAssignment}
                disabled={isSolving || !assignmentText.trim()}
                className="w-full bg-[#7E22CE] hover:bg-[#6B21A8] text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSolving ? <><RefreshCcw size={18} className="animate-spin" /> Solving...</> : "Solve Problem"}
              </button>
            </div>
          )}

          {/* MODE 2: SCAN TO SOLVE (CAMERA VIEW) */}
          {solveMethod === 'scan' && (
            <div className="space-y-4">
              <div className="relative w-full aspect-[3/4] max-h-[500px] bg-black rounded-3xl overflow-hidden border border-white/20 flex flex-col justify-between p-4 shadow-2xl">
                {/* Viewfinder corner overlays & frame */}
                <div className="absolute inset-8 border-2 border-white/40 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                  <div className="flex justify-between">
                    <span className="w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
                    <span className="w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
                  </div>
                  <div className="w-full text-center">
                    <span className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-white/90 text-xs font-medium">
                      Focus by adjusting the corners
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
                    <span className="w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
                  </div>
                </div>

                {/* Top Camera bar */}
                <div className="relative z-10 flex items-center justify-between text-white px-2">
                  <span className="text-xs font-bold uppercase tracking-wider bg-black/50 px-3 py-1 rounded-full">Scan Viewfinder</span>
                  <button onClick={() => setUserNotification("Flash mode toggled")} className="p-2 bg-black/50 rounded-full hover:bg-black/70">
                    <Zap size={18} />
                  </button>
                </div>

                {/* Center crosshair */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Plus size={28} className="text-white/60" />
                </div>

                {/* Bottom Scanner Toolbar */}
                <div className="relative z-10 flex items-center justify-around bg-black/70 backdrop-blur-md p-4 rounded-2xl">
                  <button 
                    onClick={() => setSolveMethod('calculator')} 
                    className="flex flex-col items-center gap-1 text-white/80 hover:text-white"
                  >
                    <Calculator size={22} />
                    <span className="text-[10px] font-bold">Calculator</span>
                  </button>

                  <label className="w-16 h-16 rounded-full bg-red-600 border-4 border-white flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-xl">
                    <input type="file" accept="image/*" capture="environment" onChange={(e) => { handleImageUpload(e); solveAssignment(); }} className="hidden" />
                    <div className="w-6 h-6 rounded-full bg-white/20" />
                  </label>

                  <label className="flex flex-col items-center gap-1 text-white/80 hover:text-white cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <ImageIcon size={22} />
                    <span className="text-[10px] font-bold">Gallery</span>
                  </label>
                </div>
              </div>

              {images.length > 0 && (
                <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={images[0].preview} className="w-12 h-12 object-cover rounded-xl" />
                    <div>
                      <p className="text-xs font-bold text-white">Captured Image Ready</p>
                      <p className="text-[10px] text-purple-300/70">{images.length} photo(s) selected</p>
                    </div>
                  </div>
                  <button
                    onClick={solveAssignment}
                    disabled={isSolving}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                  >
                    {isSolving ? "Analyzing..." : "Solve Scan"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE 3: UPLOAD TO SOLVE */}
          {solveMethod === 'upload' && (
            <div className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-[#13111C] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'} space-y-6 shadow-lg`}>
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-extrabold">Upload Assignment Image or PDF</h3>
                <p className="text-xs text-purple-300/70">Upload clear pictures or documents of your math, physics, or homework problems.</p>
              </div>

              <div className="flex flex-wrap gap-4 justify-center">
                <AnimatePresence>
                  {images.map(img => (
                    <motion.div key={img.id} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="relative group">
                      <img src={img.preview} className={`w-28 h-28 object-cover rounded-2xl border-2 ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'} shadow-xl`} />
                      <button onClick={() => removeImage(img.id)} className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {images.length < limits.IMAGES && (
                  <label className={`w-full max-w-sm h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                    theme === 'dark' ? 'border-purple-500/30 bg-purple-950/20 hover:border-purple-500' : 'border-purple-200 bg-purple-50/50 hover:border-purple-400'
                  }`}>
                    <input type="file" accept="image/*,.pdf" multiple onChange={handleImageUpload} className="hidden" />
                    <Upload size={32} className="text-purple-500 mb-2" />
                    <span className="text-xs font-bold text-white">Click or Drag to Upload File</span>
                    <span className="text-[10px] text-purple-300/60 mt-1">Supports Images, Documents (Max {limits.IMAGES} files)</span>
                  </label>
                )}
              </div>

              <button
                onClick={solveAssignment}
                disabled={isSolving || images.length === 0}
                className="w-full bg-[#7E22CE] hover:bg-[#6B21A8] text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSolving ? <><RefreshCcw size={18} className="animate-spin" /> Solving...</> : "Solve Uploaded File"}
              </button>
            </div>
          )}

          {/* MODE 4: SOLVE WITH AI POWERED CALCULATOR */}
          {solveMethod === 'calculator' && (
            <div className={`p-4 sm:p-6 rounded-3xl border ${
              theme === 'dark' ? 'bg-[#0E0B1F] border-purple-500/30 text-white' : 'bg-white border-purple-200 text-slate-900'
            } space-y-5 shadow-2xl relative overflow-hidden`}>

              {/* CALC INPUT / WORKSPACE DISPLAY (UPPER HALF IN SCREENSHOT) */}
              <div className="space-y-3 min-h-[140px] flex flex-col justify-between p-4 rounded-2xl bg-[#080514] border border-purple-500/20 shadow-inner">
                <div className="flex items-center justify-between text-xs font-bold text-purple-300/80">
                  <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-[10px] text-amber-400">
                    AI Math Workspace
                  </span>
                  {calcInput && (
                    <button 
                      onClick={() => setCalcInput("")}
                      className="text-amber-400 hover:text-amber-300 font-sans text-xs font-semibold tracking-wide transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* MATH INPUT FIELD WITH DOTTED UNDERLINE PLACEHOLDER EXACTLY LIKE SCREENSHOT */}
                <div className="w-full text-left font-mono overflow-x-auto no-scrollbar py-2">
                  {calcInput ? (
                    <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide break-words">
                      {calcInput}
                    </span>
                  ) : (
                    <span className="text-xl sm:text-2xl text-purple-300/40 font-medium border-b border-dashed border-purple-400/40 pb-1">
                      Type a math problem...
                    </span>
                  )}
                </div>

                <div className="flex justify-end">
                  <span className="text-[10px] font-mono text-purple-400/60">
                    {calcInput.length} chars
                  </span>
                </div>
              </div>

              {/* KEYBOARD TOOLBAR TOP ROW (abc, History, ←, →, ↵, ☒) */}
              <div className="flex items-center justify-between gap-2 px-1 py-1 text-sm font-bold border-b border-purple-500/20 pb-3">
                {/* Left group */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setCalcCategory('basic')} 
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      calcCategory === 'basic' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-white/5 text-purple-300 hover:bg-white/10'
                    }`}
                  >
                    abc
                  </button>

                  <button 
                    onClick={() => {
                      if (finishedHistory.length > 0) {
                        const lastItem = finishedHistory[0];
                        if (lastItem?.title) setCalcInput(lastItem.title);
                      } else {
                        setUserNotification("No past calculator history yet");
                      }
                    }}
                    className="p-2 rounded-xl text-purple-300 hover:text-amber-400 hover:bg-white/5 transition-colors cursor-pointer"
                    title="History"
                  >
                    <History size={18} />
                  </button>
                </div>

                {/* Right group: Left Arrow, Right Arrow, Enter/Return, Delete */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCalcInput(p => p.slice(0, -1))}
                    className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Cursor Left"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <button 
                    onClick={() => setCalcInput(p => p + ' ')}
                    className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="Space / Right"
                  >
                    <ArrowRight size={18} />
                  </button>
                  <button 
                    onClick={() => {
                      if (calcInput.trim()) {
                        setAssignmentText(calcInput);
                        solveAssignment();
                      }
                    }}
                    className="p-2 rounded-xl text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
                    title="Return / Solve"
                  >
                    <CornerDownLeft size={18} />
                  </button>
                  <button 
                    onClick={() => setCalcInput(p => p.slice(0, -1))}
                    className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Backspace"
                  >
                    <Delete size={18} />
                  </button>
                </div>
              </div>

              {/* 4 CATEGORY PILLS MATCHING SCREENSHOT */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { id: 'basic', top: '+ -', bottom: '× ÷' },
                  { id: 'fx', top: 'f(x) e', bottom: 'log ln' },
                  { id: 'trig', top: 'sin cos', bottom: 'tan cot' },
                  { id: 'calculus', top: 'lim dx', bottom: '∫ ∑ ∞' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCalcCategory(cat.id as any)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex flex-col items-center justify-center leading-tight cursor-pointer ${
                      calcCategory === cat.id 
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400/50' 
                        : 'border border-purple-500/30 text-purple-200/80 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-[11px] font-mono">{cat.top}</span>
                    <span className="text-[11px] font-mono opacity-80">{cat.bottom}</span>
                  </button>
                ))}
              </div>

              {/* 6-COLUMN GRID KEYBOARD MATCHING SCREENSHOT */}
              <div className="grid grid-cols-6 gap-2 font-mono text-sm sm:text-base font-bold">
                {/* ROW 1: (□). | >. | 7 | 8 | 9 | ÷ */}
                <button 
                  onClick={() => setCalcInput(p => p + '(')} 
                  className="relative py-3.5 rounded-2xl bg-[#18122E] hover:bg-[#231A42] border border-purple-500/20 text-purple-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                >
                  (□)<span className="absolute bottom-1 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                </button>
                <button 
                  onClick={() => setCalcInput(p => p + '>')} 
                  className="relative py-3.5 rounded-2xl bg-[#18122E] hover:bg-[#231A42] border border-purple-500/20 text-purple-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                >
                  &gt;<span className="absolute bottom-1 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                </button>
                <button 
                  onClick={() => setCalcInput(p => p + '7')} 
                  className="py-3.5 rounded-2xl bg-[#130E26] hover:bg-[#1F173D] border border-white/10 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all text-base"
                >
                  7
                </button>
                <button 
                  onClick={() => setCalcInput(p => p + '8')} 
                  className="py-3.5 rounded-2xl bg-[#130E26] hover:bg-[#1F173D] border border-white/10 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all text-base"
                >
                  8
                </button>
                <button 
                  onClick={() => setCalcInput(p => p + '9')} 
                  className="py-3.5 rounded-2xl bg-[#130E26] hover:bg-[#1F173D] border border-white/10 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all text-base"
                >
                  9
                </button>
                <button 
                  onClick={() => setCalcInput(p => p + ' ÷ ')} 
                  className="py-3.5 rounded-2xl bg-[#18122E] hover:bg-[#231A42] border border-purple-500/20 text-amber-400 font-extrabold flex items-center justify-center cursor-pointer active:scale-95 transition-all text-lg"
                >
                  ÷
                </button>

                {/* ROW 2: □/□. | √□. | 4 | 5 | 6 | × */}
                <button 
                  onClick={() => setCalcInput(p => p + '/')} 
                  className="relative py-3.5 rounded-2xl bg-[#18122E] hover:bg-[#231A42] border border-purple-500/20 text-purple-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all text-xs"
                >
                  <span className="flex flex-col items-center leading-none">
                    <span className="border-b border-purple-300/80 px-1">□</span>
                    <span>□</span>
                  </span>
                  <span className="absolute bottom-1 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                </button>
                <button 
                  onClick={() => setCalcInput(p => p + '√(')} 
                  className="relative py-3.5 rounded-2xl bg-[#18122E] hover:bg-[#231A42] border border-purple-500/20 text-purple-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                >
                  √□<span className="absolute bottom-1 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                </button>
                <button 
                  onClick={() => setCalcInput(p => p + '4')} 
                  className="py-3.5 rounded-2xl bg-[#130E26] hover:bg-[#1F173D] border border-white/10 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all text-base"
                >
                  4
                </button>
                <button 
                  onClick={() => setCalcInput(p => p + '5')} 
                  className="py-3.5 rounded-2xl bg-[#130E26] hover:bg-[#1F173D] border border-white/10 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all text-base"
                >
                  5
                </button>
                <button 
                  onClick={() => setCalcInput(p => p + '6')} 
                  className="py-3.5 rounded-2xl bg-[#130E26] hover:bg-[#1F173D] border border-white/10 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all text-base"
                >
                  6
                </button>
                <button 
                  onClick={() => setCalcInput(p => p + ' × ')} 
                  className="py-3.5 rounded-2xl bg-[#18122E] hover:bg-[#231A42] border border-purple-500/20 text-amber-400 font-extrabold flex items-center justify-center cursor-pointer active:scale-95 transition-all text-lg"
                >
                  ×
                </button>

                {/* ROW 3: □². | x. | 1 | 2 | 3 | - */}
                <button 
                  onClick={() => setCalcInput(p => p + '^2')} 
                  className="relative py-3.5 rounded-2xl bg-[#18122E] hover:bg-[#231A42] border border-purple-500/20 text-purple-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                >
                  □²<span className="absolute bottom-1 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                </button>
                <button 
                  onClick={() => setCalcInput(p => p + 'x')} 
                  className="relative py-3.5 rounded-2xl bg-[#18122E] hover:bg-[#231A42] border border-purple-500/20 text-purple-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                >
                  x<span className="absolute bottom-1 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                </button>
                <button 
                  onClick={() => setCalcInput(p => p + '1')} 
                  className="py-3.5 rounded-2xl bg-[#130E26] hover:bg-[#1F173D] border border-white/10 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all text-base"
                >
                  1
                </button>
                <button 
                  onClick={() => setCalcInput(p => p + '2')} 
                  className="py-3.5 rounded-2xl bg-[#130E26] hover:bg-[#1F173D] border border-white/10 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all text-base"
                >
                  2
                </button>
                <button 
                  onClick={() => setCalcInput(p => p + '3')} 
                  className="py-3.5 rounded-2xl bg-[#130E26] hover:bg-[#1F173D] border border-white/10 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all text-base"
                >
                  3
                </button>
                <button 
                  onClick={() => setCalcInput(p => p + ' - ')} 
                  className="py-3.5 rounded-2xl bg-[#18122E] hover:bg-[#231A42] border border-purple-500/20 text-amber-400 font-extrabold flex items-center justify-center cursor-pointer active:scale-95 transition-all text-lg"
                >
                  -
                </button>

                {/* ROW 4: π. | % | 0 | . | = | + */}
                <button 
                  onClick={() => setCalcInput(p => p + 'π')} 
                  className="relative py-3.5 rounded-2xl bg-[#18122E] hover:bg-[#231A42] border border-purple-500/20 text-purple-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                >
                  π<span className="absolute bottom-1 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                </button>
                <button 
                  onClick={() => setCalcInput(p => p + '%')} 
                  className="py-3.5 rounded-2xl bg-[#18122E] hover:bg-[#231A42] border border-purple-500/20 text-purple-200 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                >
                  %
                </button>
                <button 
                  onClick={() => setCalcInput(p => p + '0')} 
                  className="py-3.5 rounded-2xl bg-[#130E26] hover:bg-[#1F173D] border border-white/10 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all text-base"
                >
                  0
                </button>
                <button 
                  onClick={() => setCalcInput(p => p + '.')} 
                  className="py-3.5 rounded-2xl bg-[#130E26] hover:bg-[#1F173D] border border-white/10 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all text-base"
                >
                  .
                </button>
                <button 
                  onClick={() => {
                    if (calcInput.trim()) {
                      setAssignmentText(calcInput);
                      solveAssignment();
                    }
                  }} 
                  className="py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center justify-center cursor-pointer active:scale-95 transition-all text-lg shadow-md shadow-amber-500/20"
                >
                  =
                </button>
                <button 
                  onClick={() => setCalcInput(p => p + ' + ')} 
                  className="py-3.5 rounded-2xl bg-[#18122E] hover:bg-[#231A42] border border-purple-500/20 text-amber-400 font-extrabold flex items-center justify-center cursor-pointer active:scale-95 transition-all text-lg"
                >
                  +
                </button>
              </div>

              {/* ACTION SOLVE BUTTON */}
              <button
                onClick={() => {
                  if (calcInput.trim()) {
                    setAssignmentText(calcInput);
                    solveAssignment();
                  } else {
                    setUserNotification("Type a math problem first!");
                  }
                }}
                disabled={isSolving || !calcInput.trim()}
                className="w-full bg-gradient-to-r from-purple-700 via-purple-600 to-amber-500 hover:from-purple-600 hover:to-amber-400 text-white font-extrabold py-4 rounded-2xl text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSolving ? <><RefreshCcw size={18} className="animate-spin" /> Calculating Steps...</> : "Solve Step-by-Step with AI"}
              </button>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {solution && (
          <motion.div 
            ref={resultsRef}
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            className="space-y-6 pt-10"
          >
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50 animate-pulse" />
                <h3 className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {solution.title || "Calculated Solution"}
                </h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={speakSolution} 
                  title={isSpeaking ? "Stop Voice" : "Listen to solution"}
                  className={`p-3 rounded-2xl border transition-all ${isSpeaking ? 'bg-[#DC2626] border-[#DC2626] text-white shadow-lg shadow-[#DC2626]/20' : `${theme === 'dark' ? 'bg-[#13111C] border-white/10 text-white/40' : 'bg-white border-slate-200 text-slate-400'} hover:border-[#DC2626] hover:text-[#DC2626]`}`}
                >
                  {isSpeaking ? <Square size={20} fill="currentColor" /> : <Volume2 size={20} />}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {solution.steps?.map((step, idx) => {
                const stepKey = `assignment-step-${idx}`;
                const isExpanded = expandedStepKeys[stepKey] ?? true; // default to expanded
                return (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: idx * 0.1 }}
                    className={`p-5 sm:p-6 rounded-[2rem] border relative overflow-hidden group transition-all duration-300 ${theme === 'dark' ? 'bg-[#13111C] border-white/10 hover:border-[#DC2626]/30' : 'bg-white border-slate-100 hover:border-[#DC2626]/30 shadow-md shadow-black/5'}`}
                  >
                    <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      <span className="text-9xl font-black italic">{idx + 1}</span>
                    </div>
                    <div className="flex gap-5 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-[#DC2626] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-lg shadow-[#DC2626]/20 select-none">
                        {idx + 1}
                      </div>
                      <div className="pt-1 flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-[#DC2626] uppercase tracking-[0.3em] mb-2 opacity-80">Step Solution</p>
                            <MarkdownRenderer content={step.step} className={`text-lg font-black leading-snug ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} />
                          </div>
                          {/* Triangle Action Button */}
                          <button
                            type="button"
                            onClick={() => toggleStepExpansion(stepKey)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}
                            title={isExpanded ? "Collapse logic" : "Expand logic"}
                          >
                            <svg 
                              className={`w-3.5 h-3.5 text-[#DC2626] transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : 'rotate-0'}`} 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <path d="M5 3l14 9-14 9V3z" />
                            </svg>
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="space-y-4">
                            <div className={`pt-4 border-t ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'} mt-4`}>
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 text-[#DC2626]">The Logical Why</p>
                              <MarkdownRenderer content={step.explanation} className={`text-[13px] leading-relaxed font-medium ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`} />
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500/80">Student Workings</p>
                          <div className="flex gap-2">
                             <label className="p-1.5 cursor-pointer bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-all border border-blue-500/20 shadow-sm shadow-blue-500/10">
                               <input type="file" accept="image/*" onChange={(e) => handleWorkingUpload(idx, e)} className="hidden" />
                               <ImageIcon size={12} />
                             </label>
                             <button 
                               onClick={() => startListening(idx)}
                               className={`p-1.5 rounded-lg border transition-all ${isListening === idx ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' : 'bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-sm shadow-purple-500/10'}`}
                             >
                                <Mic size={12} />
                             </button>
                             <button 
                               onClick={() => checkWorking(idx)}
                               disabled={!userWorkings[idx]?.imageFile || userWorkings[idx]?.isAnalyzing}
                               className={`p-1.5 rounded-lg border transition-all ${userWorkings[idx]?.imageFile ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-sm shadow-green-500/10' : 'bg-white/5 text-white/20 border-white/5'}`}
                             >
                                <Brain size={12} />
                             </button>
                          </div>
                        </div>

                        {userWorkings[idx]?.imagePreview && (
                          <div className="flex items-start gap-3">
                              <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0 group/working-img">
                                 <img src={userWorkings[idx].imagePreview} className="w-full h-full object-cover" />
                                 {userWorkings[idx].isAnalyzing && (
                                   <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                      <RefreshCcw size={14} className="text-white animate-spin" />
                                   </div>
                                 )}
                                 <button 
                                   onClick={() => removeWorkingImage(idx)}
                                   className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-md opacity-0 group-hover/working-img:opacity-100 transition-opacity z-10"
                                   title="Remove image"
                                 >
                                   <X size={10} />
                                 </button>
                              </div>
                              {(userWorkings[idx]?.analysis || userWorkings[idx]?.transcript) && (
                                <div className="flex-1 p-3 bg-white/5 rounded-xl border border-white/10 space-y-2 relative group min-w-0">
                                  {userWorkings[idx]?.analysis && (
                                    <button 
                                      onClick={() => deleteAnalysis(idx)}
                                      className="absolute top-2 right-2 p-1 text-white/40 hover:text-red-500 transition-colors opacity-30 group-hover:opacity-100 z-20"
                                      title="Delete feedback"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                  {userWorkings[idx]?.transcript && (
                                    <div className="flex items-center gap-2 mb-1 opacity-50 shrink-0">
                                       <Mic size={10} />
                                       <p className="text-[8px] font-bold italic truncate">"{userWorkings[idx].transcript}"</p>
                                    </div>
                                  )}
                                  {userWorkings[idx].analysis && (
                                    <>
                                      <div className={`${!expandedReplies[idx] ? 'max-h-[100px] overflow-y-auto' : ''} transition-all duration-300 relative custom-scrollbar`}>
                                        <MarkdownRenderer content={userWorkings[idx].analysis} className="text-[11px] leading-relaxed text-white/70" />
                                        {!expandedReplies[idx] && userWorkings[idx].analysis.length > 150 && (
                                          <div className="sticky bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#13111C] to-transparent pointer-events-none" />
                                        )}
                                      </div>
                                      {userWorkings[idx].analysis.length > 150 && (
                                        <button 
                                          onClick={() => setExpandedReplies(prev => ({...prev, [idx]: !prev[idx]}))}
                                          className="text-[9px] font-black uppercase text-blue-500 mt-2 hover:underline inline-block shrink-0"
                                        >
                                          {expandedReplies[idx] ? 'See Part' : 'See All'}
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                          </div>
                        )}
                        {userWorkings[idx]?.transcript && !userWorkings[idx]?.imagePreview && (
                           <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2 relative group">
                              {userWorkings[idx]?.analysis && (
                                <button 
                                  onClick={() => deleteAnalysis(idx)}
                                  className="absolute top-2 right-2 p-1 text-white/40 hover:text-red-500 transition-colors opacity-30 group-hover:opacity-100 z-20"
                                  title="Delete feedback"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                              <div className="flex items-center gap-2 mb-1 opacity-50 shrink-0">
                                 <Mic size={10} />
                                 <p className="text-[8px] font-bold italic truncate">"{userWorkings[idx].transcript}"</p>
                              </div>
                              {userWorkings[idx].analysis && (
                                <>
                                  <div className={`${!expandedReplies[idx] ? 'max-h-[100px] overflow-y-auto' : ''} transition-all duration-300 relative custom-scrollbar`}>
                                    <MarkdownRenderer content={userWorkings[idx].analysis} className="text-[11px] leading-relaxed text-white/70" />
                                    {!expandedReplies[idx] && userWorkings[idx].analysis.length > 150 && (
                                      <div className="sticky bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#0A0F1C] to-transparent pointer-events-none" />
                                    )}
                                  </div>
                                  {userWorkings[idx].analysis.length > 150 && (
                                    <button 
                                      onClick={() => setExpandedReplies(prev => ({...prev, [idx]: !prev[idx]}))}
                                      className="text-[9px] font-black uppercase text-blue-500 mt-2 hover:underline inline-block shrink-0"
                                    >
                                      {expandedReplies[idx] ? 'See Part' : 'See All'}
                                    </button>
                                  )}
                                </>
                              )}
                           </div>
                        )}
                        {!userWorkings[idx]?.imagePreview && !userWorkings[idx]?.transcript && (
                          <p className="text-[8px] text-white/20 italic">"Ok Student, let me see your solvings for this step..."</p>
                        )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
              })}

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={`p-6 sm:p-8 rounded-[2.5rem] border text-center shadow-2xl relative overflow-hidden ${theme === 'dark' ? 'bg-gradient-to-br from-[#DC2626]/20 via-[#13111C] to-transparent border-[#DC2626]/30 shadow-[#DC2626]/10' : 'bg-gradient-to-br from-[#DC2626]/5 via-white to-transparent border-[#DC2626]/20'}`}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#DC2626] to-transparent opacity-30" />
                <p className="text-[10px] font-black text-[#DC2626] uppercase tracking-[0.5em] mb-4">Final Concensus</p>
                <div className="relative inline-block">
                  <MarkdownRenderer content={solution.summary} className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} />
                  <div className="absolute -bottom-2 left-0 w-full h-1 bg-[#DC2626]/20 rounded-full blur-sm" />
                </div>
              </motion.div>

              {/* --- GENERATE QUIZ BUTTON TRIGGER CARD --- */}
              <div className={`p-6 rounded-[2rem] border flex flex-col md:flex-row items-center justify-between gap-4 mt-6 ${theme === 'dark' ? 'bg-[#DC2626]/5 border-[#DC2626]/25' : 'bg-red-50/50 border-red-100'}`}>
                <div className="flex items-center gap-3 text-left w-full md:w-auto">
                  <div className="w-10 h-10 rounded-xl bg-[#DC2626]/10 flex items-center justify-center text-[#DC2626]">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <h4 className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Interactive Adaptive Quiz</h4>
                    <p className={`text-[10px] uppercase font-bold tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Generate a custom quiz directly from this assignment</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuizPromptModal(true)}
                  className="w-full md:w-auto px-6 py-3.5 bg-[#DC2626] font-black uppercase text-[10px] tracking-widest text-white rounded-xl shadow-lg hover:bg-red-750 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap size={12} className="fill-white" /> Generate Quiz
                </button>
              </div>

              {/* --- INTERACTIVE PRACTICE PROBLEMS PANEL --- */}
              <div className="space-y-4 pt-4 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-[#DC2626]" size={18} />
                    <h3 className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      🎯 Interactive Practice Questions
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isGeneratingPractice && practiceQuestions.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setPracticeQuestions([]);
                            setUserAnswers({});
                            setCheckedAnswers({});
                            setRevealedSolutions({});
                            setActiveFeedbackModal(null);
                            generatePractice(solution.title || "Assignment", solution.steps || [], solution.summary || "");
                          }}
                          className="px-3 py-1.5 bg-[#DC2626]/10 hover:bg-[#DC2626]/20 text-[#DC2626] border border-[#DC2626]/20 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCcw size={10} /> Regenerate
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUserAnswers({});
                            setCheckedAnswers({});
                            setRevealedSolutions({});
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
                        >
                          Reset Progress
                        </button>
                      </>
                    )}
                    {isGeneratingPractice && (
                      <span className="text-[9px] uppercase font-black text-[#DC2626] tracking-wider animate-pulse flex items-center gap-1.5">
                        <RefreshCcw size={10} className="animate-spin" /> Forming Questions...
                      </span>
                    )}
                  </div>
                </div>

                {isGeneratingPractice ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3 bg-white/[0.01] rounded-2xl border border-white/5 border-dashed">
                    <Brain size={28} className="text-[#DC2626] animate-pulse" />
                    <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Synthesizing relevant academic variants...</p>
                  </div>
                ) : practiceQuestions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-white/30 font-medium bg-white/[0.01] rounded-2xl border border-white/5 border-dashed">No interactive practice available. Try re-solving.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {practiceQuestions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className={`p-5 rounded-[2rem] border flex flex-col justify-between ${theme === 'dark' ? 'bg-[#181628] border-white/5' : 'bg-slate-50 border-slate-100'} hover:border-[#DC2626]/20 transition-all`}
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black uppercase px-2.5 py-1 rounded bg-[#DC2626]/10 text-[#DC2626] tracking-widest line-clamp-1 italic font-sans scale-90 origin-left">
                              {q.difficulty || "Practice Variant"}
                            </span>
                            <span className={`text-[9.5px] font-mono font-black ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>
                              QI-{qIdx + 1}
                            </span>
                          </div>
                          
                          <div className={`text-xs leading-relaxed font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
                            <MarkdownRenderer content={q.question} />
                          </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-white/5 mt-4">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Type final answer..."
                              value={userAnswers[qIdx] || ""}
                              onChange={e => {
                                setUserAnswers(prev => ({ ...prev, [qIdx]: e.target.value }));
                                if (checkedAnswers[qIdx]) {
                                  setCheckedAnswers(prev => {
                                    const copy = { ...prev };
                                    delete copy[qIdx];
                                    return copy;
                                  });
                                }
                              }}
                              className={`flex-1 px-3 py-2 text-xs rounded-xl outline-none border ${theme === 'dark' ? 'bg-black/20 border-white/10 text-white focus:border-red-500' : 'bg-white border-slate-200 text-slate-900 focus:border-red-500'} font-bold transition-all min-w-0`}
                            />
                            <button
                              type="button"
                              onClick={() => checkPracticeAnswer(qIdx)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shrink-0 cursor-pointer"
                            >
                              Grade
                            </button>
                            {checkedAnswers[qIdx] && (
                              <button
                                type="button"
                                onClick={() => {
                                  setUserAnswers(prev => ({ ...prev, [qIdx]: "" }));
                                  setCheckedAnswers(prev => {
                                    const copy = { ...prev };
                                    delete copy[qIdx];
                                    return copy;
                                  });
                                }}
                                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase border transition-all shrink-0 cursor-pointer ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
                              >
                                Retry
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setRevealedSolutions(prev => ({ ...prev, [qIdx]: !prev[qIdx] }))}
                              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase border transition-all shrink-0 cursor-pointer ${revealedSolutions[qIdx] ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                              title="Show pre-generated step solution"
                            >
                              Steps
                            </button>
                          </div>

                          {/* Pre-generated steps available directly */}
                          <AnimatePresence>
                            {revealedSolutions[qIdx] && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden mt-2 p-3.5 bg-violet-600/10 border border-violet-500/20 rounded-xl space-y-2 text-left"
                              >
                                <p className="text-[8px] font-black uppercase text-violet-400 tracking-wider mb-2">Pre-Generated Academic Steps</p>
                                {q.solutionSteps?.map((stepStr: string, index: number) => {
                                  const stepKey = `test-${qIdx}-step-${index}`;
                                  const isExpanded = expandedStepKeys[stepKey] ?? false; // default to collapsed
                                  return (
                                    <div key={index} className={`border border-violet-500/10 rounded-xl p-2.5 my-1 ${theme === 'dark' ? 'bg-black/10' : 'bg-slate-50'}`}>
                                      <button
                                        type="button"
                                        onClick={() => toggleStepExpansion(stepKey)}
                                        className="w-full flex items-center justify-between text-left text-xs font-bold text-white/95 hover:text-[#DC2626] transition-all cursor-pointer"
                                      >
                                        <span className="flex items-center gap-1.5 shrink-0 select-none">
                                          <svg 
                                            className={`w-3.5 h-3.5 text-[#DC2626] transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : 'rotate-0'}`} 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2.5" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                          >
                                            <path d="M5 3l14 9-14 9V3z" />
                                          </svg>
                                          <span className="text-[10px] font-black uppercase tracking-wider text-violet-400">Step {index + 1}</span>
                                        </span>
                                        <span className="text-[8px] text-white/30 uppercase font-black tracking-wider">{isExpanded ? 'Hide' : 'Expand'}</span>
                                      </button>
                                      <AnimatePresence>
                                        {isExpanded && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden mt-2 pt-2 border-t border-violet-500/10 text-[11px] leading-relaxed font-semibold text-white/80"
                                          >
                                            <MarkdownRenderer content={stepStr} />
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
                                <div className="pt-2 border-t border-violet-500/15">
                                  <p className="text-[8px] font-black uppercase text-violet-400 tracking-wider">Tutor consensus answer</p>
                                  <p className="text-[11px] font-black text-white">{q.correctAnswer}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                          {/* Checked Status */}
                          {checkedAnswers[qIdx] && (
                            <div className={`p-3.5 rounded-xl border flex items-start gap-2 text-left mt-2 ${checkedAnswers[qIdx].correct ? 'bg-emerald-500/15 border-emerald-500/25' : 'bg-red-500/15 border-red-500/25'}`}>
                              {checkedAnswers[qIdx].correct ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> : <XCircle size={14} className="text-[#DC2626] shrink-0 mt-0.5" />}
                              <div className="flex-1 min-w-0">
                                <p className={`text-[9px] font-black uppercase tracking-wider ${checkedAnswers[qIdx].correct ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {checkedAnswers[qIdx].correct ? 'Correct Final Answer!' : 'Review logic steps below...'}
                                </p>
                                <p className={`text-[10px] font-semibold ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'} leading-normal`}>{checkedAnswers[qIdx].feedback}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

      {/* Quiz generation configuration pop-up */}
      <AnimatePresence>
        {showQuizPromptModal && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#13111C] border border-white/10 rounded-[2rem] p-6 space-y-6 w-full max-w-sm text-center shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setShowQuizPromptModal(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
              <div className="w-12 h-12 bg-[#DC2626]/10 rounded-xl flex items-center justify-center text-[#DC2626] mx-auto">
                <Trophy size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">Generate Quiz</h3>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mt-1">Specify count to assemble assessment</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl p-3">
                  <span className="text-xs text-white/50">Number of Questions:</span>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={quizQuestionCountInput}
                    onChange={e => setQuizQuestionCountInput(Math.max(5, Math.min(50, parseInt(e.target.value) || 10)))}
                    className="w-16 text-center py-1 bg-black/25 text-white border border-white/10 rounded-lg outline-none text-xs font-black focus:border-[#DC2626]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleLaunchQuizFromAssignment}
                  className="w-full py-3.5 bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-red-900/10 cursor-pointer"
                >
                  ⚡ Launch Quiz Engine
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Answer Verification Pop-up Modal */}
      <AnimatePresence>
        {activeFeedbackModal && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-[#13111C] border border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-left"
            >
              <div className={`p-6 border-b border-white/5 flex items-center justify-between ${activeFeedbackModal.isCorrect ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeFeedbackModal.isCorrect ? 'bg-emerald-500/20 text-emerald-400 animate-bounce' : 'bg-[#DC2626]/20 text-[#DC2626]'}`}>
                    {activeFeedbackModal.isCorrect ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight">Answer Checked!</h3>
                    <p className={`text-[9px] uppercase font-bold tracking-widest ${activeFeedbackModal.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                      {activeFeedbackModal.isCorrect ? 'Fundamentally Correct' : 'Variant Requires Realignment'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveFeedbackModal(null)}
                  className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
                <div className="space-y-1 bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-wider">Practice Problem Checked</p>
                  <div className="text-xs font-bold text-white"><MarkdownRenderer content={activeFeedbackModal.question} /></div>
                </div>

                <div className="space-y-2">
                  <p className="text-[8px] font-black text-[#DC2626] uppercase tracking-widest">Tutor grading consensus</p>
                  <p className="text-xs font-semibold text-white/70 leading-normal">{activeFeedbackModal.feedback}</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Step-by-step resolution</p>
                  <div className="space-y-2 bg-black/20 p-4 rounded-xl border border-white/5">
                    {activeFeedbackModal.solutionSteps && activeFeedbackModal.solutionSteps.length > 0 ? (
                      activeFeedbackModal.solutionSteps.map((stepStr, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="text-[10px] font-mono text-emerald-400 font-extrabold shrink-0">Step {idx + 1}:</span>
                          <div className="text-[11px] leading-relaxed text-zinc-300 font-medium"><MarkdownRenderer content={stepStr} /></div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-white/30 italic">No detailed steps were required for this grading rationale.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 flex bg-white/[0.01]">
                <button
                  type="button"
                  onClick={() => setActiveFeedbackModal(null)}
                  className="w-full py-4 bg-[#DC2626] text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-red-750 active:scale-95 transition-all text-center cursor-pointer shadow-lg shadow-red-950/20"
                >
                  Confirm & Resume Review
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
            </div>
            
            <div className="flex justify-center pb-10">
              <button 
                onClick={clearAll} 
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white/40 hover:text-red-500' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-red-500'}`}
              >
                <Trash2 size={16} /> Clear Results & Start Over
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
