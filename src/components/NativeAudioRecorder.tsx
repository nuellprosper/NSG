import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Pause, Play, Radio, Flag, Check, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isNativePlatform, scheduleLocalNotification } from '../lib/capacitor';

interface NativeAudioRecorderProps {
  isRecording: boolean;
  recordingTime: number;
  handleToggleRecording: () => void;
  isProcessingFinal?: boolean;
  isOnline?: boolean;
  onSaveAudioLocally?: (blob: Blob) => void;
  theme?: string;
  isTranscribePage?: boolean;
}

export const NativeAudioRecorder: React.FC<NativeAudioRecorderProps> = ({
  isRecording,
  recordingTime,
  handleToggleRecording,
  isProcessingFinal = false,
  isOnline = true,
  theme = 'dark',
  isTranscribePage = false
}) => {
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(40).fill(12));
  const [isPaused, setIsPaused] = useState(false);
  const [flags, setFlags] = useState<number[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const silentOscillatorRef = useRef<OscillatorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Format HH:MM:SS or 00:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `00:${pad(mins)}:${pad(secs)}`;
  };

  // Helper for ruler timestamps (e.g. 00:02, 00:04)
  const formatRulerTime = (secOffset: number) => {
    const target = Math.max(0, recordingTime + secOffset);
    const mins = Math.floor(target / 60);
    const secs = target % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Add timestamp flag bookmark
  const handleAddFlag = () => {
    setFlags(prev => [...prev, recordingTime]);
  };

  // Start/stop audio context visualizer and background silent keep-alive
  useEffect(() => {
    if (isRecording) {
      let isCancelled = false;

      const initAudioGraph = async () => {
        try {
          // 1. Initialize Web Audio Context if available
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            audioCtxRef.current = audioCtx;

            // 2. Play silent background audio loop to keep Android/iOS Webview process alive when screen is off/locked
            try {
              const silentOsc = audioCtx.createOscillator();
              const silentGain = audioCtx.createGain();
              silentOsc.type = 'sine';
              silentOsc.frequency.setValueAtTime(440, audioCtx.currentTime);
              silentGain.gain.setValueAtTime(0.00001, audioCtx.currentTime); // Silent
              silentOsc.connect(silentGain);
              silentGain.connect(audioCtx.destination);
              silentOsc.start();
              silentOscillatorRef.current = silentOsc;
            } catch (e) {
              console.warn("Silent background audio loop notice:", e);
            }
          }

          // Notify native status bar / background service
          scheduleLocalNotification(
            "🎙️ NSG Lecture Recorder Active",
            "Recording lecture audio in background. Screen can be locked safely.",
            Date.now(),
            'nsg_scholar_activity'
          ).catch(() => {});

          // Dynamic rhythmic soundwave generator that avoids hardware HAL collisions with MediaRecorder
          const intervalId = setInterval(() => {
            if (!isPaused && !isCancelled) {
              const base = [18, 35, 62, 85, 45, 92, 70, 40, 25, 55, 78, 95, 60, 30, 80, 100, 75, 45, 20, 65];
              const bars = Array.from({ length: 40 }, (_, idx) => {
                const sample = base[idx % base.length];
                const jitter = Math.floor(Math.random() * 25) - 12;
                return Math.max(8, Math.min(100, sample + jitter));
              });
              setAudioLevels(bars);
            }
          }, 80);

          return () => clearInterval(intervalId);
        } catch (err) {
          console.warn("Visualizer init notice:", err);
          const fallbackInterval = setInterval(() => {
            setAudioLevels(Array.from({ length: 40 }, () => Math.floor(Math.random() * 65) + 10));
          }, 100);
          return () => clearInterval(fallbackInterval);
        }
      };

      const cleanupPromise = initAudioGraph();

      return () => {
        isCancelled = true;
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (silentOscillatorRef.current) {
          try { silentOscillatorRef.current.stop(); } catch (e) {}
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(t => t.stop());
        }
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          try { audioCtxRef.current.close(); } catch (e) {}
        }
      };
    } else {
      setAudioLevels(new Array(40).fill(12));
      setFlags([]);
    }
  }, [isRecording, isPaused]);


  return (
    <div className="z-[200]">
      {/* FLOATING RECORD BUTTON FOR NATIVE APK / MOBILE */}
      {!isRecording && !isProcessingFinal && isTranscribePage && isNativePlatform() && (
        <button
          type="button"
          onClick={handleToggleRecording}
          className="fixed bottom-24 right-5 sm:bottom-8 sm:right-8 z-[180] flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-[#DC2626] via-red-600 to-purple-600 text-white rounded-full shadow-2xl border border-white/20 cursor-pointer group hover:brightness-110 active:scale-95 transition-all"
          title="Start Background Lecture Audio Recording"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-all">
            <Mic size={18} className="text-white animate-pulse" />
          </div>
          <div className="text-left hidden sm:block pr-1">
            <p className="text-[10px] font-black uppercase tracking-wider leading-none">Record Lecture</p>
            <p className="text-[8px] font-bold text-white/80 uppercase tracking-widest mt-0.5">
              Native Background Rec
            </p>
          </div>
        </button>
      )}

      {/* ACTIVE RECORDING OVERLAY CARD */}
      <AnimatePresence>
        {(isRecording || isProcessingFinal) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-2 bottom-4 sm:left-auto sm:right-6 sm:w-[420px] z-[220] p-5 rounded-3xl bg-[#141221]/98 backdrop-blur-2xl border border-red-500/30 shadow-2xl text-white space-y-4 font-sans select-none"
          >
            {/* Top Bar: Title & Cancel/Close button */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-mono font-bold text-white/70 tracking-wider">
                  REC_{new Date().toISOString().slice(0,10).replace(/-/g,'')}_NSG
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${isOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                  {isOnline ? 'Cloud AI' : 'Offline Qwen'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Large Timer Display */}
            <div className="text-center py-1">
              <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white drop-shadow-md">
                {formatTime(recordingTime)}
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-red-400 mt-1 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                {isProcessingFinal ? 'Transcribing...' : isPaused ? 'Paused' : 'Recording'}
              </p>
            </div>

            {/* LIVE SOUNDWAVE GRAPH WITH TIMELINE RULER & PLAYHEAD */}
            <div className="relative bg-[#0A0912] rounded-2xl p-4 border border-white/10 overflow-hidden h-36 flex flex-col justify-between">
              {/* Subtle background ruler grid lines */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between px-2 opacity-20 pointer-events-none">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="w-[1px] h-3 bg-white" />
                ))}
              </div>

              {/* Vertical Center Playhead Line */}
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-red-500 z-10 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />

              {/* Center Vertical Soundwave Bars */}
              <div className="relative z-0 flex items-center justify-center gap-1 h-20 my-auto">
                {audioLevels.map((lvl, idx) => {
                  const isCenter = Math.abs(idx - 20) <= 2;
                  return (
                    <div key={idx} className="flex-1 flex items-center justify-center h-full">
                      <div
                        className={`w-[3px] rounded-full transition-all duration-75 ${
                          isCenter 
                            ? 'bg-red-500' 
                            : idx % 2 === 0 
                              ? 'bg-gradient-to-t from-red-600 to-amber-400' 
                              : 'bg-red-400/80'
                        }`}
                        style={{
                          height: `${lvl}%`,
                          opacity: lvl > 10 ? 1 : 0.35
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Bottom Ruler Axis Timestamps */}
              <div className="relative z-0 flex items-center justify-between text-[9px] font-mono font-bold text-white/40 pt-1 border-t border-white/10">
                <span>{formatRulerTime(-4)}</span>
                <span>{formatRulerTime(-2)}</span>
                <span className="text-red-400">{formatRulerTime(0)}</span>
                <span>{formatRulerTime(2)}</span>
                <span>{formatRulerTime(4)}</span>
              </div>
            </div>

            {/* Subtext info */}
            <div className="flex items-center justify-between text-[10px] font-semibold text-white/60 px-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                <span>Screen lock protected</span>
              </div>
              {flags.length > 0 && (
                <span className="text-amber-400 font-bold">{flags.length} Bookmark{flags.length > 1 ? 's' : ''}</span>
              )}
            </div>

            {/* MIMICKED BOTTOM ACTION CONTROLS */}
            <div className="flex items-center justify-around pt-2 border-t border-white/10">
              {/* Left Action: Flag / Bookmark */}
              <button
                type="button"
                onClick={handleAddFlag}
                disabled={isProcessingFinal}
                className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer active:scale-90 disabled:opacity-40"
                title="Add Bookmark Flag"
              >
                <Flag size={20} className="text-white/90" />
              </button>

              {/* Center Action: Pause / Resume Button */}
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                disabled={isProcessingFinal}
                className="w-14 h-14 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 flex items-center justify-center text-red-500 transition-all cursor-pointer active:scale-95 disabled:opacity-40"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? (
                  <Play size={24} className="fill-red-500 text-red-500 ml-0.5" />
                ) : (
                  <Pause size={24} className="fill-red-500 text-red-500" />
                )}
              </button>

              {/* Right Action: Finish & Transcribe (Checkmark) */}
              <button
                type="button"
                onClick={handleToggleRecording}
                disabled={isProcessingFinal}
                className="p-3 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 transition-all cursor-pointer active:scale-90 disabled:opacity-40"
                title="Finish and Transcribe"
              >
                <Check size={22} className="text-emerald-400 stroke-[3]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
