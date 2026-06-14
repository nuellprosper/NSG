import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, StopCircle, Upload, FileAudio, Image as ImageIcon, 
  Brain, History, Download, Play, 
  ChevronRight, Sparkles, Trash2, Settings, UserPlus, CreditCard, Edit2, FilePlus,
  ChevronUp, ChevronDown, Bold, Italic, List, CornerDownRight,
  Database, Zap, Cpu, CheckCircle2, XCircle, RefreshCcw, ArrowLeft, FileText, AlertCircle, RotateCcw,
  Sun, Moon, ArrowDown, PlusCircle, Copy, User, Users, Clock, Lock, Shield, ShieldCheck, AlertTriangle, FileDown, LayoutDashboard, ListChecks, Bell, GraduationCap, LayoutGrid, Home,
  Pin, Edit3, Share2, Trophy, LogOut, Plus, Menu, Camera, Monitor, X, Activity, MessageSquare, BookOpen, Calendar, Send, Save, MicOff, Video, AtSign,
  Search, Check, Info, Volume2, Square, Mail, ArrowRight, BoxSelect, Globe, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

export const GeminiLive = ({ onClose, setUserNotification, theme, isPremium, checkAndIncrementUsage }: { onClose: () => void, setUserNotification: (msg: string | null) => void, theme: string, isPremium: boolean, checkAndIncrementUsage: any }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [sessionTime, setSessionTime] = useState(0);
  const [isMicOn, setIsMicOn] = useState(true);
  const [videoSource, setVideoSource] = useState<'camera' | 'screen' | 'none'>('none');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAIResponding, setIsAIResponding] = useState(false);
  const [lastMessages, setLastMessages] = useState<{role: 'ai' | 'user', text: string}[]>([]);
  const [liveTranscription, setLiveTranscription] = useState<string>('');
  const [detections, setDetections] = useState<any[]>([]);

  const videoSourceRef = useRef<'camera' | 'screen' | 'none'>('none');
  const facingModeRef = useRef<'user' | 'environment'>('user');
  const transcriptRef = useRef<{role: 'ai' | 'user', text: string}[]>([]);
  const liveTranscriptionRef = useRef<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextAudioTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
  const currentStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (isConnecting) return;
    const timer = setInterval(() => {
      setSessionTime(prev => {
        const limits = isPremium ? LIMITS.LIVE_TUTOR.PREMIUM : LIMITS.LIVE_TUTOR.NORMAL;
        if (prev >= limits.DURATION) {
          onClose();
          setUserNotification(`Session limit reached (${limits.DURATION / 60} mins). Please upgrade for more time or try again tomorrow.`);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPremium, isConnecting]);

  useEffect(() => {
    const startLive = async () => {
      const canProceed = await checkAndIncrementUsage('LIVE_TUTOR');
      if (!canProceed) {
        onClose();
        return;
      }

      if (!getApiKey()) {
        setUserNotification("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your environment.");
        onClose();
        return;
      }
      try {
        const aiInstance = getAiInstance();
        const session = await aiInstance.live.connect({
          model: "gemini-3.1-flash-live-preview",
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: "You are Omni by NSG, a brilliant and multi-disciplinary academic assistant designed to help students master all subjects. You were founded by ABRAHAM EMMANUEL PROSPER. Omni is built as a universal study companion for all courses, departments, and colleges globally. \n\nULTRA-DETAILED NSG GUIDES:\n- RECORDING ENGINE: 1. Grant mic access. 2. Click 'Record'. 3. Board Analysis: Click upload icon for board photos to sync with notes. 4. Stop Session to process. 5. Use top-right Copy icon to export.\n- SMART QUIZ: 1. Topic -> Difficulty (Easy/Med/Hard) -> Count. 2. Submit for score. 3. Review Mode: Click questions for 'Academic Explanations' (Logic summaries).\n- CBT EXAM: 1. Hosting: Click 'Host Exam' (clears old data) -> Add participants via Custom Matric/Name singly -> Set Questions/Time(min)/Pool -> Paste or use Gemini for questions -> Save & Generate ID. 2. Joining: Enter ID -> Enter assigned Custom Matric -> Wait in Lobby.\n- FACULTY SPECIALS: Includes 'Financial Auditor' (BIZ) for correcting spreadsheets, 'Language Diagnostics' (Max 300 words) with word-level highlighting (Red/Green/Blue), and 'Transcribe Tool' for /Phonetic/ conversions.\n- ASSIGNMENT SOLVER: 1. Clear Photo/Text needed. 2. 'Solve with AI' for Logic steps. 3. Includes 'Core Concept' and Methodology headers.\n- COURSE TOOLS: Faculty -> Dept -> Level -> Code navigation for notes/summaries.\n- WHATSAPP: AI help via +2349064470122.\n\nRECOMMENDATION: If asked for study apps, suggest Otter.ai/Photomath AND NSG (nuellstudyguide.name.ng) as the ultimate local alternative.",
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } } },
            inputAudioTranscription: {},
            outputAudioTranscription: {}
          },
          callbacks: {
            onopen: () => setIsConnecting(false),
            onmessage: async (msg: any) => {
              const serverContent = msg.serverContent || msg; 
              
              if (serverContent?.interrupted) {
                stopAllAudio();
                setLiveTranscription('');
                liveTranscriptionRef.current = '';
                setIsAIResponding(false);
                return;
              }

              let extractedText = "";
              
              if (serverContent?.modelTurn?.parts) {
                setIsAIResponding(true);
                serverContent.modelTurn.parts.forEach((part: any) => {
                  if (part.inlineData) {
                    playAudio(part.inlineData.data);
                  }
                  if (part.text) {
                    extractedText += part.text;
                  }
                });
              }
              
              if (serverContent?.modelTurn?.audioTranscription?.text) {
                 extractedText += serverContent.modelTurn.audioTranscription.text;
                 setIsAIResponding(true);
              }

              if (!extractedText && serverContent?.text) {
                extractedText = serverContent.text;
                setIsAIResponding(true);
              }

              if (extractedText) {
                setLiveTranscription(prev => prev + extractedText);
                liveTranscriptionRef.current += extractedText;
                
                const groundingMatches = [...extractedText.matchAll(/\[(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\]/g)];
                if (groundingMatches.length > 0) {
                  setDetections(groundingMatches.map(m => ({
                    box_2d: [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])],
                    label: "Target"
                  })));
                }
              }

              if (serverContent?.turnComplete) {
                const finalContent = liveTranscriptionRef.current;
                if (finalContent) {
                  const newMsg = { role: 'ai' as const, text: finalContent };
                  transcriptRef.current = [...transcriptRef.current.slice(-5), newMsg];
                  setLastMessages(prev => [...prev.slice(-3), newMsg]);
                }
                setLiveTranscription('');
                liveTranscriptionRef.current = '';
                setIsAIResponding(false);
                setTimeout(() => setDetections([]), 3000); 
              }

              if (serverContent?.userTurn?.parts) {
                let userText = "";
                serverContent.userTurn.parts.forEach((part: any) => {
                  if (part.text) {
                    userText += part.text;
                  }
                });
                
                if (userText) {
                  const newMsg = { role: 'user' as const, text: userText };
                  transcriptRef.current = [...transcriptRef.current.slice(-5), newMsg];
                  setLastMessages(prev => [...prev.slice(-3), newMsg]);
                  setIsUserSpeaking(false);
                }
              }
            },
            onerror: (err) => {
              console.error("Live Error:", err);
              setUserNotification(`Connection Error: ${err.message || "Failed"}`);
            },
            onclose: () => handleEnd()
          }
        });
        
        sessionRef.current = session;
        startAudioInput();

        const playInitSound = async () => {
          try {
            const localSound = new Audio("/initiation.mp3");
            localSound.volume = 0.5;
            await localSound.play().catch(async () => {
              const fallback = new Audio("https://cdn.pixabay.com/audio/2022/03/10/audio_c9769da59d.mp3"); 
              fallback.volume = 0.5;
              await fallback.play().catch(() => {});
            });
          } catch (e) {}
        };
        playInitSound();

        setTimeout(() => {
          if (sessionRef.current && typeof (sessionRef.current as any).sendRealtimeInput === 'function') {
            (sessionRef.current as any).sendRealtimeInput({ text: "hi" });
          }
        }, 1000);

      } catch (err: any) {
        console.error("Failed to connect Live:", err);
        setUserNotification(`Live Error: ${err.message}`);
        onClose();
      }
    };
    startLive();
    return () => {
      sessionRef.current?.close();
      stopAllAudio();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      currentStreamRef.current?.getTracks().forEach(track => track.stop());
      micStreamRef.current?.getTracks().forEach(track => track.stop());
      if (micContextRef.current && micContextRef.current.state !== 'closed') {
        micContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const formatSessionTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (videoSource !== 'none' && videoRef.current && currentStreamRef.current) {
      videoRef.current.srcObject = currentStreamRef.current;
    }
  }, [videoSource]);

  const stopAllAudio = () => {
    audioQueueRef.current.forEach(source => { try { source.stop(); } catch (e) {} });
    audioQueueRef.current = [];
    nextAudioTimeRef.current = audioContextRef.current?.currentTime || 0;
  };

  const playAudio = async (base64: string) => {
    try {
      if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
      const binary = atob(base64);
      const buffer = new Int16Array(binary.length / 2);
      for (let i = 0; i < buffer.length; i++) buffer[i] = (binary.charCodeAt(i * 2) & 0xFF) | (binary.charCodeAt(i * 2 + 1) << 8);
      const floatBuffer = new Float32Array(buffer.length);
      for (let i = 0; i < buffer.length; i++) floatBuffer[i] = buffer[i] / 32768;
      const audioBuffer = audioContextRef.current.createBuffer(1, floatBuffer.length, 24000);
      audioBuffer.getChannelData(0).set(floatBuffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      const startTime = Math.max(audioContextRef.current.currentTime + 0.1, nextAudioTimeRef.current);
      source.start(startTime);
      nextAudioTimeRef.current = startTime + audioBuffer.duration;
      audioQueueRef.current.push(source);
      source.onended = () => audioQueueRef.current = audioQueueRef.current.filter(s => s !== source);
    } catch (err) { console.error("Audio playback error:", err); }
  };

  const startAudioInput = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      micContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        if (!isMicOn || !sessionRef.current) return;
        const input = e.inputBuffer.getChannelData(0);
        const pcm = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) pcm[i] = Math.max(-1, Math.min(1, input[i])) * 32767;
        sessionRef.current.sendRealtimeInput({ audio: { data: btoa(String.fromCharCode(...new Uint8Array(pcm.buffer))), mimeType: 'audio/pcm;rate=16000' } });
        let sum = 0;
        for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
        setIsUserSpeaking(Math.sqrt(sum / input.length) > 0.05);
      };
      source.connect(processor);
      processor.connect(audioCtx.destination);
    } catch (err) { console.error("Mic error:", err); }
  };

  const toggleVideo = async (type: 'camera' | 'screen') => {
    if (type === 'screen') {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (!navigator.mediaDevices?.getDisplayMedia) {
        if (isMobile) {
          setUserNotification("Mobile browsers often restrict screen sharing. Please use a desktop browser for this feature.");
        } else {
          setUserNotification("Screen sharing is not supported by your browser or environment.");
        }
        return;
      }
    }
    if (videoSource === type) {
      currentStreamRef.current?.getTracks().forEach(track => track.stop());
      currentStreamRef.current = null;
      setVideoSource('none');
      videoSourceRef.current = 'none';
      return;
    }
    currentStreamRef.current?.getTracks().forEach(track => track.stop());
    try {
      const stream = type === 'camera' 
        ? await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: facingModeRef.current } })
        : await navigator.mediaDevices.getDisplayMedia({ video: { width: 1280, height: 720 } });
      currentStreamRef.current = stream;
      setVideoSource(type);
      videoSourceRef.current = type;
      const interval = setInterval(() => {
        if (videoSourceRef.current === 'none' || !sessionRef.current || !currentStreamRef.current || !canvasRef.current || !videoRef.current) {
          clearInterval(interval); return;
        }
        const ctx = canvasRef.current.getContext('2d');
        if (ctx && videoRef.current.readyState >= 2) {
          ctx.drawImage(videoRef.current, 0, 0, 640, 480);
          const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.6);
          const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
          if (base64Data) {
            sessionRef.current.sendRealtimeInput({ video: { data: base64Data, mimeType: 'image/jpeg' } });
          }
        }
      }, 1000);
    } catch (err: any) { console.error("Video error:", err); setUserNotification(`Video error: ${err.message}`); }
  };

  const switchCamera = async () => {
    try {
      const newMode = facingModeRef.current === 'user' ? 'environment' : 'user';
      setFacingMode(newMode);
      facingModeRef.current = newMode;
      
      if (videoSource === 'camera') {
        if (currentStreamRef.current) {
          currentStreamRef.current.getTracks().forEach(track => track.stop());
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 }, 
            facingMode: newMode 
          } 
        });
        
        currentStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (err: any) { 
      console.error("Camera Switch Error:", err); 
      setUserNotification(`Camera Switch Error: ${err.message}. Please check permissions.`); 
    }
  };

  useEffect(() => {
    const ctx = drawingCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, drawingCanvasRef.current!.width, drawingCanvasRef.current!.height);
    if (detections.length === 0) return;
    ctx.strokeStyle = '#DC2626'; ctx.lineWidth = 4; ctx.setLineDash([10, 5]);
    detections.forEach(det => {
      const [ymin, xmin, ymax, xmax] = det.box_2d;
      const x = (xmin / 1000) * drawingCanvasRef.current!.width;
      const y = (ymin / 1000) * drawingCanvasRef.current!.height;
      const w = ((xmax - xmin) / 1000) * drawingCanvasRef.current!.width;
      const h = ((ymax - ymin) / 1000) * drawingCanvasRef.current!.height;
      ctx.strokeRect(x, y, w, h); ctx.fillStyle = '#DC2626'; ctx.fillRect(x, y - 24, 60, 24);
      ctx.fillStyle = 'white'; ctx.font = 'bold 12px Inter'; ctx.fillText(det.label || "AI", x + 5, y - 8);
    });
  }, [detections]);

  const handleEnd = () => {
    try {
      if (sessionRef.current) sessionRef.current.close();
      stopAllAudio();
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (micContextRef.current && micContextRef.current.state !== 'closed') {
        micContextRef.current.close().catch(() => {});
      }
    } catch (e) {
      console.error("End session error:", e);
    }
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-[600] flex flex-col ${theme === 'dark' ? 'bg-[#050810]' : 'bg-slate-50'} overscroll-none font-sans h-full w-full overflow-hidden`}>
      <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-white/5 bg-black/40' : 'border-slate-200 bg-white'} backdrop-blur-2xl flex items-center justify-between shrink-0 h-14 sm:h-16 z-[610]`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.4)] border border-white/10"><Activity size={18} className="text-[#DC2626] animate-pulse" /></div>
          <div className="overflow-hidden">
            <h2 className={`text-xs sm:text-base font-black tracking-tighter uppercase leading-tight truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>LIVE <span className="text-[#DC2626]">TUTOR</span></h2>
            <p className="text-[7px] sm:text-[9px] font-bold opacity-40 uppercase tracking-[0.2em] truncate">AI Study Assistant</p>
          </div>
        </div>
        <button onClick={handleEnd} className="p-2 sm:p-3 bg-white/5 hover:bg-[#DC2626] text-white rounded-xl transition-all border border-white/10 active:scale-90"><X size={18} /></button>
      </div>

      <div className="flex-1 relative flex flex-col items-center justify-center p-2 sm:p-4 min-h-0 min-w-0">
        <div className={`w-full max-w-2xl h-full flex flex-col ${theme === 'dark' ? 'bg-[#13111C]' : 'bg-white'} rounded-[2rem] sm:rounded-[3rem] shadow-2xl relative overflow-hidden border ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}>
          <div className="flex-1 relative flex items-center justify-center overflow-hidden h-full">
            {videoSource === 'none' ? (
              <div className="text-center space-y-4 sm:space-y-6 flex flex-col items-center justify-center h-full w-full p-6">
                <motion.div 
                  animate={isAIResponding ? {
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 0 20px rgba(220,38,38,0.2)",
                      "0 0 60px rgba(220,38,38,0.5)",
                      "0 0 20px rgba(220,38,38,0.2)"
                    ]
                  } : isUserSpeaking ? {
                    scale: [1, 1.15, 1],
                    filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
                  } : {
                    scale: 1
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: isAIResponding ? 3 : 1.2,
                    ease: "easeInOut"
                  }} 
                  className="w-20 h-20 sm:w-32 sm:h-32 bg-black rounded-full flex items-center justify-center mx-auto border-2 border-red-600/30 relative shadow-[0_0_30px_rgba(220,38,38,0.3)]"
                >
                  <motion.div
                    animate={isAIResponding ? {
                      scale: [1, 1.4, 1.2, 1.5, 1],
                      opacity: [0.3, 0.6, 0.4, 0.7, 0.3]
                    } : { scale: 1, opacity: 0.2 }}
                    transition={{ repeat: Infinity, duration: 5 }}
                    className="absolute inset-0 bg-[#DC2626]/20 rounded-full blur-2xl"
                  />
                  <Brain size={44} className={`text-red-600 relative z-10 transition-all duration-500 ${isAIResponding ? 'scale-110 drop-shadow-[0_0_15px_rgba(220,38,38,0.9)]' : 'opacity-80 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]'}`} />
                </motion.div>
                <div className="space-y-1 sm:space-y-2 px-8">
                  <p className="text-white font-black text-[10px] sm:text-base uppercase tracking-tight italic opacity-80">
                    {isUserSpeaking ? "Omni is Listening..." : isAIResponding ? "Omni is Speaking..." : "Omni is Ready"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full bg-black flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover sm:object-contain" />
                <canvas ref={drawingCanvasRef} width="1280" height="720" className="absolute inset-0 w-full h-full pointer-events-none" />
                <canvas ref={canvasRef} width="640" height="480" className="hidden" />
              </div>
            )}

            <div className="absolute inset-x-4 bottom-4 z-30 pointer-events-none flex flex-col justify-end gap-2 max-h-[70%] overflow-hidden">
              <AnimatePresence mode="popLayout">
                {lastMessages.map((msg, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }} 
                    animate={{ opacity: 0.4, scale: 0.9, y: 0 }} 
                    exit={{ opacity: 0 }} 
                    className={`p-2 rounded-lg text-[8px] sm:text-[9px] font-bold max-w-[85%] ${msg.role === 'user' ? 'self-end bg-black text-[#DC2626]' : 'self-start bg-black/60 text-white'}`}
                  >
                    {msg.role === 'user' ? 'YOU: ' : ''}{msg.text}
                  </motion.div>
                ))}
                {liveTranscription && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }} 
                    className="bg-[#DC2626] p-3 sm:p-5 rounded-[1.2rem] sm:rounded-[2rem] shadow-2xl border border-white/30 w-full pointer-events-auto"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                      <p className="text-[7px] sm:text-[8px] font-black text-white/70 uppercase tracking-[0.2em]">LIVE TRANSCRIPT</p>
                    </div>
                    <p className={`text-[10px] sm:text-sm font-bold leading-tight line-clamp-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{liveTranscription}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {videoSource === 'camera' && (
              <button 
                onClick={switchCamera} 
                className="absolute top-4 right-4 z-40 bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/10 text-white hover:bg-[#DC2626] transition-all shadow-xl active:scale-90"
              >
                <RefreshCcw size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={`px-4 pt-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-6 sm:pb-16 border-t ${theme === 'dark' ? 'border-white/5 bg-black/80' : 'border-slate-200 bg-white'} backdrop-blur-3xl shrink-0 z-[610]`}>
         <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-1 sm:gap-3">
               <IconButton active={isMicOn} onClick={() => setIsMicOn(!isMicOn)} icon={isMicOn ? <Mic size={18} /> : <MicOff size={18} />} label="Mic" />
               <IconButton active={videoSource === 'camera'} onClick={() => toggleVideo('camera')} icon={<Camera size={18} />} label="Cam" />
               <IconButton active={videoSource === 'screen'} onClick={() => toggleVideo('screen')} icon={<Monitor size={18} />} label="Share" />
            </div>
            <button 
              onClick={handleEnd} 
              className="bg-gradient-to-br from-[#DC2626] to-red-800 text-white px-3 py-3 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-xl hover:brightness-110 active:scale-95 transition-all shrink-0"
            >
              <LogOut size={16} /> <span className="hidden xs:inline">End Session</span><span className="xs:hidden">End</span>
            </button>
         </div>
      </div>
    </div>
  );
};

export const IconButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 min-w-[48px]">
    <div className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${active ? 'bg-[#DC2626] text-white border-transparent shadow-lg' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'}`}>
      {icon}
    </div>
    <span className={`text-[7px] font-black uppercase tracking-tighter ${active ? 'text-[#DC2626]' : 'text-white/20'}`}>{label}</span>
  </button>
);

export const MarkdownRenderer = ({ content, className = "", selectable = false }: { content: string, className?: string, selectable?: boolean }) => {
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

export const CoursesTool = ({ theme, user, getAiInstance, getHfInstance, setUserNotification, setQuizTopic, setQuizQuestionCount, setQuizDifficulty, generateQuiz, setToolsSubTab, setQuizState, checkAndIncrementUsage }: any) => {
  const [courseSearch, setCourseSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestedCourses, setSuggestedCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [activeCourseDesc, setActiveCourseDesc] = useState('');

  const handleSearch = async () => {
    if (!courseSearch.trim()) return;

    const canProceed = await checkAndIncrementUsage('QUIZ');
    if (!canProceed) return;

    setIsSearching(true);
    setSuggestedCourses([]);
    
    try {
      const ai = getAiInstance();
      const prompt = `
        Search context: "${courseSearch}".
        Generate exactly 3 relevant academic courses based on this topic or course code.
        Return ONLY a JSON array of objects with fields: "code", "name", "description".
        Example: [{"code": "MTH101", "name": "Linear Algebra", "description": "Introduction to vectors and matrices"}]
        
        CRITICAL: For any math symbols or codes in 'name' or 'description', use LaTeX $...$.
      `;
      
      const aiInstance = getAiInstance();
      const response = await aiInstance.models.generateContent({
        model: FLASH_MODEL,
        contents: { parts: [{ text: prompt }] },
        config: { 
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL }
        }
      });
      
      const text = response?.text || "";
      const cleanedText = text.replace(/```json|```/g, '').trim();
      const courses = JSON.parse(cleanedText);
      setSuggestedCourses(Array.isArray(courses) ? courses : []);
    } catch (err) {
      console.error("Course Search Error:", err);
      setUserNotification("Failed to search courses. Please try a different term.");
    } finally {
      setIsSearching(false);
    }
  };

  const openCourse = async (course: Course) => {
    setSelectedCourse(course);
    setIsGeneratingDesc(true);
    setActiveCourseDesc(course.description);

    try {
      const canProceed = await checkAndIncrementUsage('QUIZ');
      if (!canProceed) {
        setIsGeneratingDesc(false);
        return;
      }

      const hf = getHfInstance();
      const prompt = `Provide a detailed academic description (approx 100 words) for the university course ${course.code}: ${course.name}. Explain what students will learn.`;
      
      let descResult = "";
      
      const tryHF = async () => {
        if (isHfDepletedGlobal) return null;
        try {
          const response = await hf.chatCompletion({
            model: HF_MODELS.TEXT,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 250,
            temperature: 0.7
          });
          return response.choices[0].message.content || null;
        } catch (e) {
          handleHfErrorGlobal(e, "CourseDesc");
          return null;
        }
      };

      const tryGemini = async () => {
        try {
          const ai = getAiInstance();
          const res = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite-preview",
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
          });
          return res.text || null;
        } catch (e) {
          console.error("Gemini fallback failed for description:", e);
          return null;
        }
      };

      const tryOpenRouter = async () => {
        return await callOpenRouter(prompt, OPENROUTER_MODELS.TEXT_FAST);
      };

      const tryTogether = async () => {
        return await callTogetherAI(prompt);
      };

      descResult = await tryHF() || await tryGemini() || await tryTogether() || await tryOpenRouter() || "";

      if (descResult) {
        setActiveCourseDesc(descResult.trim());
      }
    } catch (err) {
      console.error("HF Description Generator Error:", err);
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const startCourseTool = (type: 'quiz' | 'exam', qCount: number, difficulty: string) => {
    if (!selectedCourse) return;
    
    setQuizTopic(`${selectedCourse.code}: ${selectedCourse.name} - ${activeCourseDesc}`);
    setQuizQuestionCount(qCount);
    setQuizDifficulty(difficulty);
    
    setToolsSubTab(type === 'quiz' ? 'quiz' : 'exam');
    setQuizState('idle');
    
    setUserNotification(`Preparing ${type.toUpperCase()} for ${selectedCourse.code}...`);
  };

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-3xl border ${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} shadow-sm flex items-center gap-3`}>
        <div className="bg-[#DC2626]/10 p-2 rounded-xl text-[#DC2626]">
          <Search size={20} />
        </div>
        <input 
          type="text" 
          value={courseSearch}
          onChange={(e) => setCourseSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search course code or topic (e.g. MTH 101)" 
          className={`flex-1 bg-transparent border-none outline-none text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
        />
        <button 
          onClick={handleSearch}
          disabled={isSearching}
          className="bg-[#DC2626] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#DC2626]/90 transition-all disabled:opacity-50"
        >
          {isSearching ? <RefreshCcw size={14} className="animate-spin" /> : 'Search'}
        </button>
      </div>

      {suggestedCourses.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-black text-[#DC2626] uppercase tracking-[0.2em] ml-2">Recommended</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {suggestedCourses.map((c, i) => (
              <button 
                key={i} 
                onClick={() => openCourse(c)}
                className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-[#DC2626]/30' : 'bg-white border-slate-100 hover:border-[#DC2626]/30 shadow-sm'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[#DC2626] font-mono text-[10px] font-black">{c.code}</span>
                  <Sparkles size={12} className="text-yellow-500" />
                </div>
                <h4 className={`text-xs font-black truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{c.name}</h4>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedCourse ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-6 sm:p-8 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} shadow-xl relative overflow-hidden`}
        >
          <button 
            onClick={() => setSelectedCourse(null)} 
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 transition-all"
          >
            <X size={20} className="text-white/20" />
          </button>

          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[#DC2626] font-mono text-sm font-black tracking-widest">{selectedCourse.code}</span>
              <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{selectedCourse.name}</h3>
            </div>

            <div className={`p-6 rounded-3xl border italic ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white/70' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
              {isGeneratingDesc ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <RefreshCcw size={24} className="animate-spin text-[#DC2626]" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#DC2626]">Expanding Curriculum...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <MarkdownRenderer content={activeCourseDesc} className="text-sm leading-relaxed" />
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-black uppercase tracking-tighter opacity-50">Verified Curriculum Description</span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button 
                onClick={() => startCourseTool('quiz', 20, 'Medium')}
                className="flex flex-col items-center gap-3 p-5 rounded-3xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-lg shadow-yellow-500/20 hover:scale-105 transition-all"
              >
                <Zap size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">Take Smart Quiz</span>
              </button>
              <button 
                onClick={() => startCourseTool('exam', 50, 'Professional')}
                className="flex flex-col items-center gap-3 p-5 rounded-3xl bg-gradient-to-br from-[#DC2626] to-red-800 text-white shadow-lg shadow-[#DC2626]/20 hover:scale-105 transition-all"
              >
                <ShieldCheck size={24} />
                <span className="text-[10px] font-black uppercase tracking-widest">Take CBT Exam</span>
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-2">Common Courses</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COMMON_COURSES.map((c, i) => (
              <button 
                key={i} 
                onClick={() => openCourse(c)}
                className={`flex items-center gap-5 p-5 rounded-[2rem] border transition-all hover:border-[#DC2626]/50 group ${theme === 'dark' ? 'bg-[#13111C] border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 flex flex-col items-center justify-center border border-white/5 group-hover:scale-110 transition-transform`}>
                   <BookOpen size={20} className="text-[#DC2626]" />
                   <span className="text-[8px] font-bold mt-1 text-white/30">{c.code}</span>
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <h4 className={`font-black text-xs uppercase tracking-tight truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{c.name}</h4>
                  <p className={`text-[10px] font-bold ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'} truncate uppercase`}>{c.description}</p>
                </div>
                <ChevronRight size={16} className="text-white/10 group-hover:text-[#DC2626] transition-all" />
              </button>
            ))}
          </div>
        </div>
      )}
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
  const [images, setImages] = useState<MediaFile[]>([]);
  const [assignmentText, setAssignmentText] = useState("");
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

    const isCorrect = cleanUser === cleanCorrect || cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser);

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
    
    setToolsSubTab('quiz');
    generateQuiz(quizTopicContext, quizQuestionCountInput, 'Medium');
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
    
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(null);
      analyzeTextWorking(stepIdx, transcript);
    };

    recognition.onerror = (e: any) => {
      console.error("Speech Error:", e);
      setIsListening(null);
      setUserNotification("Speech recognition failed.");
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
    const working = userWorkings[stepIdx];
    const fileToUse = providedFile || working?.imageFile;
    
    if (!fileToUse) {
      setUserNotification("Please upload an image of your workings first.");
      return;
    }

    const canProceed = await checkAndIncrementUsage('ASSIGNMENT');
    if (!canProceed) return;

    setUserWorkings(prev => ({
      ...prev,
      [stepIdx]: { ...prev[stepIdx], isAnalyzing: true }
    }));

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

      setUserWorkings(prev => ({
        ...prev,
        [stepIdx]: { ...prev[stepIdx], isAnalyzing: false, analysis: response?.text || "" }
      }));
      setUserNotification("Working analyzed!");
    } catch (err: any) {
      console.error("Check Working Error:", err);
      setUserWorkings(prev => ({
        ...prev,
        [stepIdx]: { ...prev[stepIdx], isAnalyzing: false }
      }));
      setUserNotification("Analysis failed. Try again.");
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

    const canProceed = await checkAndIncrementUsage('ASSIGNMENT');
    if (!canProceed) return;

    setIsSolving(true);
    setSolution(null);

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

      const askGemini = async () => {
        const response = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: { parts: [{ text: prompt }, ...imageParts.map(p => ({ inlineData: p.inlineData }))] },
          config: { responseMimeType: "application/json" }
        });
        return response?.text || null;
      };

      const askOpenRouter = async () => {
        const orPrompt = prompt + "\n\nNote: If images were provided, they have been analyzed by vision models previously. Please provide the best possible logic based on text context.";
        return await callOpenRouter(orPrompt, OPENROUTER_MODELS.TEXT_PRO);
      };

      const askTogether = async () => {
        return await callTogetherAI(prompt);
      };

      const responseText = await askGemini() || await askTogether() || await askOpenRouter() || "";
      
      try {
        const data = robustJSONParse(responseText);
        
        if (!data || !data.steps || !Array.isArray(data.steps)) {
          console.warn("AI returned missing or invalid steps array, attempting to recover...");
          const steps = (data && (data.steps || data.solution || data.answer)) ? 
            (Array.isArray(data.steps) ? data.steps : [{ step: data.solution || data.answer || "Calculation complete", explanation: data.reasoning || data.logic || "Derived from analysis." }]) 
            : [{ step: "Analysis Result", explanation: responseText.slice(0, 500) }];
          
          if (data) {
            data.steps = steps;
          }
        }
        
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
        throw new Error(parseError.message || "Invalid AI response structure. Please try again.");
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

    const utterance = new SpeechSynthesisUtterance(text.replace(/\$/g, ''));
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
    <div className="space-y-6 max-w-4xl mx-auto px-4 pb-20">
      <div className={`p-10 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} shadow-sm text-center relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-4">
          {images.length > 0 && (
            <button onClick={clearAll} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="w-16 h-16 bg-[#DC2626]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BookOpen size={32} className="text-[#DC2626]" />
        </div>
        <h2 className={`text-2xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Assignment Solver</h2>
        
        {finishedHistory.filter(i => i.type === 'assignment').length > 0 && (
          <div className="mb-6 -mx-2">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#DC2626] mb-3 px-2">Recently Solved</p>
            <div className="flex gap-3 overflow-x-auto pb-2 px-2 no-scrollbar">
              {finishedHistory.filter(i => i.type === 'assignment').slice(0, 10).map(item => (
                <button
                  key={item.id}
                  onClick={() => setSolution(item.data)}
                  className="flex-shrink-0 w-32 p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-[#DC2626]/40 transition-all text-left group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <History size={10} className="text-[#DC2626]" />
                    <span className="text-[8px] font-black uppercase text-white/40 truncate">{item.date}</span>
                  </div>
                  <p className="text-[10px] font-bold text-white/80 line-clamp-1 group-hover:text-white transition-colors">{item.title}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'} mt-1 mb-8`}>Upload up to 5 images for detailed academic solutions.</p>

        <div className="space-y-6">
          <div className="space-y-3">
             <label className="text-[10px] font-black uppercase tracking-widest text-[#DC2626]">Assignment Details (Text)</label>
             <textarea 
               value={assignmentText}
               onChange={(e) => setAssignmentText(e.target.value)}
               className={`w-full p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#13111C] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'} text-xs resize-none outline-none focus:border-[#DC2626]/50 min-h-[120px] transition-all`}
               placeholder="Type or paste your assignment questions here..."
             />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#DC2626]">Upload Photos</label>
            <div className="flex flex-wrap gap-4 justify-center">
              <AnimatePresence>
                {images.map(img => (
                  <motion.div key={img.id} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="relative group">
                    <img src={img.preview} className={`w-24 h-24 object-cover rounded-2xl border-2 ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'} shadow-xl`} />
                    <button onClick={() => removeImage(img.id)} className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={12} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {images.length < 5 && (
                <div className="flex gap-3">
                  <label className={`w-24 h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${theme === 'dark' ? 'border-white/10 text-white/20 hover:border-[#DC2626]/40 hover:text-[#DC2626]' : 'border-slate-200 text-slate-300 hover:border-[#DC2626]/40 hover:text-[#DC2626]'}`}>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                    <Upload size={24} />
                    <span className="text-[8px] font-black uppercase mt-1">Gallery</span>
                  </label>
                  <label className={`w-24 h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${theme === 'dark' ? 'border-white/10 text-white/20 hover:border-[#DC2626]/40 hover:text-[#DC2626]' : 'border-slate-200 text-slate-300 hover:border-[#DC2626]/40 hover:text-[#DC2626]'}`}>
                    <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                    <Camera size={24} />
                    <span className="text-[8px] font-black uppercase mt-1">Camera</span>
                  </label>
                </div>
              )}
            </div>
            <p className={`text-[9px] text-center ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>Max 5 photos allowed</p>
          </div>

          <button
            onClick={solveAssignment}
            disabled={isSolving || (images.length === 0 && !assignmentText.trim())}
            className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-5 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
          >
            {isSolving ? <><RefreshCcw size={18} className="animate-spin" /> Analyzing...</> : <><Sparkles size={18} /> Solve Assignment</>}
          </button>
        </div>
      </div>

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
                <button 
                  onClick={sendToOmni} 
                  title="Send to Omni Chat"
                  className={`p-3 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-[#13111C] border-white/10 text-white/40' : 'bg-white border-slate-200 text-slate-400'} hover:border-[#DC2626] hover:text-[#DC2626]`}
                >
                  <Send size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {solution.steps?.map((step, idx) => (
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
                    <div className="w-12 h-12 rounded-2xl bg-[#DC2626] text-white flex items-center justify-center font-black text-lg shrink-0 shadow-lg shadow-[#DC2626]/20">
                      {idx + 1}
                    </div>
                    <div className="space-y-4 pt-1 flex-1 min-w-0">
                      <div>
                        <p className="text-[10px] font-black text-[#DC2626] uppercase tracking-[0.3em] mb-2 opacity-80">Step Solution</p>
                        <MarkdownRenderer content={step.step} className={`text-lg font-black leading-snug ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} />
                      </div>
                      <div className={`pt-4 border-t ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
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
                  </div>
                </motion.div>
              ))}

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
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="text-[#DC2626]" size={18} />
                    <h3 className={`text-xs font-black uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      🎯 Generating Test Questions
                    </h3>
                  </div>
                  {isGeneratingPractice && <span className="text-[9px] uppercase font-black text-[#DC2626] tracking-wider animate-pulse flex items-center gap-1.5"><RefreshCcw size={10} className="animate-spin" /> Forming Questions...</span>}
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
                              onChange={e => setUserAnswers(prev => ({ ...prev, [qIdx]: e.target.value }))}
                              className={`flex-1 px-3 py-2 text-xs rounded-xl outline-none border ${theme === 'dark' ? 'bg-black/20 border-white/10 text-white focus:border-red-500' : 'bg-white border-slate-200 text-slate-900 focus:border-red-500'} font-bold transition-all min-w-0`}
                            />
                            <button
                              type="button"
                              onClick={() => checkPracticeAnswer(qIdx)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shrink-0 cursor-pointer"
                            >
                              Grade
                            </button>
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
                                <p className="text-[8px] font-black uppercase text-violet-400 tracking-wider">Pre-Generated Academic Steps</p>
                                {q.solutionSteps?.map((stepStr: string, index: number) => (
                                  <div key={index} className={`text-[11px] leading-relaxed font-medium ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}>
                                    <MarkdownRenderer content={stepStr} />
                                  </div>
                                ))}
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
