import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Trash2, Volume2, Mic } from 'lucide-react';
import { motion } from 'motion/react';

export interface RecordedAudioData {
  blob: Blob;
  url: string;
  duration: number;
  waveform: number[];
  mimeType: string;
}

interface AudioPreviewGraphProps {
  audioData: RecordedAudioData;
  onDiscard: () => void;
  className?: string;
}

export const AudioPreviewGraph: React.FC<AudioPreviewGraphProps> = ({
  audioData,
  onDiscard,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio(audioData.url);
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.pause();
      audio.src = '';
    };
  }, [audioData.url]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.warn('Preview play error:', err));
    }
  };

  const handleSeek = (index: number, totalBars: number) => {
    if (!audioRef.current || !audioData.duration) return;
    const targetRatio = index / totalBars;
    const targetTime = targetRatio * audioData.duration;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalDuration = audioData.duration || 1;
  const progressRatio = Math.min(1, Math.max(0, currentTime / totalDuration));
  const bars = audioData.waveform && audioData.waveform.length > 0
    ? audioData.waveform
    : [20, 35, 60, 85, 45, 90, 70, 40, 25, 55, 78, 95, 60, 30, 80, 100, 75, 45, 20, 65, 40, 70, 85, 50, 30, 60, 90, 40];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 4 }}
      className={`w-full flex items-center justify-between gap-3 bg-neutral-900/90 backdrop-blur-md border border-red-500/30 rounded-2xl px-3 py-2.5 shadow-lg ${className}`}
    >
      {/* Left: Play / Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-[#DC2626] hover:bg-red-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
        title={isPlaying ? 'Pause preview' : 'Play preview'}
      >
        {isPlaying ? <Pause size={14} className="fill-current" /> : <Play size={14} className="fill-current ml-0.5" />}
      </button>

      {/* Center: Waveform Preview Graph */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-0.5 h-7 cursor-pointer select-none py-1" title="Click anywhere on waveform to seek">
          {bars.map((barVal, idx) => {
            const barProgress = idx / bars.length;
            const isPlayed = barProgress <= progressRatio;
            const barHeight = Math.max(15, Math.min(100, barVal));

            return (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSeek(idx, bars.length);
                }}
                className="flex-1 flex items-center justify-center h-full group/bar"
              >
                <div
                  style={{ height: `${barHeight}%` }}
                  className={`w-full rounded-full transition-all duration-150 ${
                    isPlayed 
                      ? 'bg-[#DC2626] shadow-[0_0_6px_rgba(220,38,38,0.5)]' 
                      : 'bg-white/20 group-hover/bar:bg-white/40'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Time Tracking Row */}
        <div className="flex items-center justify-between text-[10px] font-mono text-white/50 px-0.5 -mt-0.5">
          <span className="font-semibold text-white/80">{formatTime(currentTime)}</span>
          <span className="flex items-center gap-1">
            <Mic size={9} className="text-red-400" />
            <span>{formatTime(totalDuration)}</span>
          </span>
        </div>
      </div>

      {/* Right: Discard Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (audioRef.current) {
            audioRef.current.pause();
          }
          onDiscard();
        }}
        className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 flex items-center justify-center shrink-0 transition-all cursor-pointer"
        title="Discard recording"
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  );
};

export default AudioPreviewGraph;
