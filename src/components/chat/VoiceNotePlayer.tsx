import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Mic } from 'lucide-react';

interface VoiceNotePlayerProps {
  mediaUrl: string;
  duration?: number;
  waveform?: number[];
  theme?: string;
  caption?: string;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  mediaUrl,
  duration = 10,
  waveform,
  caption
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<'1x' | '1.5x' | '2x'>('1x');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!mediaUrl) return;
    const audio = new Audio(mediaUrl);
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
  }, [mediaUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.playbackRate = playbackSpeed === '1.5x' ? 1.5 : playbackSpeed === '2x' ? 2 : 1;
      audioRef.current.play().catch(e => console.warn('Audio play error:', e));
    }
  };

  const cycleSpeed = () => {
    let nextSpeed: '1x' | '1.5x' | '2x' = '1x';
    if (playbackSpeed === '1x') nextSpeed = '1.5x';
    else if (playbackSpeed === '1.5x') nextSpeed = '2x';
    else nextSpeed = '1x';

    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed === '1.5x' ? 1.5 : nextSpeed === '2x' ? 2 : 1;
    }
  };

  const handleSeek = (barIndex: number, totalBars: number) => {
    if (!audioRef.current) return;
    const totalD = duration || audioRef.current.duration || 1;
    const target = (barIndex / totalBars) * totalD;
    audioRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalD = duration || (audioRef.current?.duration ? Math.round(audioRef.current.duration) : 10);
  const progressRatio = Math.min(1, Math.max(0, currentTime / (totalD || 1)));

  const defaultBars = [
    25, 40, 65, 80, 50, 95, 75, 45, 30, 60, 85, 100, 65, 35, 85, 90, 70, 50, 25, 70,
    45, 80, 95, 55, 35, 65, 90, 50, 30, 75, 60, 40
  ];
  const bars = waveform && waveform.length > 0 ? waveform : defaultBars;

  return (
    <div className="flex flex-col gap-2 min-w-[220px] sm:min-w-[280px]">
      <div className="flex items-center gap-2.5 bg-black/40 border border-white/10 rounded-2xl p-2.5">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-[#DC2626] hover:bg-red-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-600/30 active:scale-95 transition-all cursor-pointer"
          title={isPlaying ? 'Pause' : 'Play voice message'}
        >
          {isPlaying ? <Pause size={13} className="fill-current" /> : <Play size={13} className="fill-current ml-0.5" />}
        </button>

        {/* Waveform Bars */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-0.5 h-6 cursor-pointer select-none py-0.5" title="Click to seek">
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
                    className={`w-full rounded-full transition-all duration-100 ${
                      isPlayed
                        ? 'bg-[#DC2626] shadow-[0_0_4px_rgba(220,38,38,0.5)]'
                        : 'bg-white/20 group-hover/bar:bg-white/40'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Time and Speed */}
          <div className="flex items-center justify-between text-[9px] font-mono text-white/50 px-0.5 mt-0.5">
            <span className="font-medium text-white/70">{formatTime(currentTime)}</span>
            <div className="flex items-center gap-2">
              <span className="text-white/40">{formatTime(totalD)}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cycleSpeed();
                }}
                className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/80 text-[8.5px] font-bold font-mono transition-all cursor-pointer"
                title="Change playback speed"
              >
                {playbackSpeed}
              </button>
            </div>
          </div>
        </div>
      </div>

      {caption && caption !== 'Voice Note' && caption !== 'Voice Message' && (
        <p className="text-xs text-white/90 font-medium px-1 leading-relaxed">
          {caption}
        </p>
      )}
    </div>
  );
};

export default VoiceNotePlayer;
