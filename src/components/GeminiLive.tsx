import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Camera, Monitor, LogOut, Activity, X, Brain, RefreshCcw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Modality } from "@google/genai";
import { LIMITS, getApiKey, getAiInstance } from '../utils';

export const BlinkingBrain = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
    <div className="absolute inset-0 rounded-full border-4 border-t-red-500 border-r-blue-600 border-b-purple-500 border-l-pink-500 animate-spin" style={{ animationDuration: '1.5s' }} />
    <div className="absolute rounded-full bg-gradient-to-tr from-red-500/20 via-blue-500/20 to-purple-500/20 animate-pulse" style={{ width: size * 0.75, height: size * 0.75, animationDuration: '2s' }} />
    <Brain size={size * 0.55} className="text-red-500 absolute z-10 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)] animate-pulse" />
  </div>
);

const IconButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1 min-w-[48px]">
    <div className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${active ? 'bg-[#DC2626] text-white border-transparent shadow-lg' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'}`}>
      {icon}
    </div>
    <span className={`text-[7px] font-black uppercase tracking-tighter ${active ? 'text-[#DC2626]' : 'text-white/20'}`}>{label}</span>
  </button>
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
        setUserNotification("Gemini API Key is missing. Please set GEMINI_API_KEY in your environment.");
        onClose();
        return;
      }
      try {
        const aiInstance = getAiInstance();
        const session = await aiInstance.live.connect({
          model: "gemini-3.1-flash",
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
      console.error("Switch error:", err); 
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
            <p className="text-[7px] sm:text-[9px] font-bold opacity-40 uppercase tracking-[0.2em] truncate">AI Study Assistant (Time: {formatSessionTime(sessionTime)})</p>
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
export default GeminiLive;
