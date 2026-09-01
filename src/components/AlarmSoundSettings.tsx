import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Bell, BellRing, Volume2, VolumeX, Vibrate, Check, 
  Play, Square, ArrowLeft, Sparkles, ShieldCheck, Clock
} from 'lucide-react';
import { 
  AlarmSoundOption, 
  getSelectedAlarmSound, 
  setSelectedAlarmSound, 
  getAlarmVibrationEnabled, 
  setAlarmVibrationEnabled 
} from '../lib/capacitor/notifications';

interface AlarmSoundSettingsProps {
  onBack?: () => void;
  onSaved?: () => void;
}

interface SoundItem {
  id: AlarmSoundOption;
  label: string;
  desc: string;
  type: 'synth' | 'system' | 'mute';
  frequency?: number;
}

const SOUND_OPTIONS: SoundItem[] = [
  {
    id: 'default',
    label: 'System Default Alarm',
    desc: 'Standard native device alarm tone',
    type: 'system'
  },
  {
    id: 'alarm_bell.mp3',
    label: 'University Exam Bell',
    desc: 'Classic resonant academic bell sound',
    type: 'synth',
    frequency: 587.33 // D5
  },
  {
    id: 'digital_alarm.wav',
    label: 'Digital High-Priority Pulse',
    desc: 'Sharp, urgent electronic pulse for critical exams',
    type: 'synth',
    frequency: 880 // A5
  },
  {
    id: 'gentle_chime.mp3',
    label: 'Gentle Study Chime',
    desc: 'Calm, harmonic reminder chime',
    type: 'synth',
    frequency: 523.25 // C5
  },
  {
    id: 'mute',
    label: 'Silent (Mute / Vibration Only)',
    desc: 'Visual notification banner only with optional vibration',
    type: 'mute'
  }
];

export const AlarmSoundSettings: React.FC<AlarmSoundSettingsProps> = ({
  onBack,
  onSaved
}) => {
  const [selectedSound, setSelectedSoundState] = useState<AlarmSoundOption>(getSelectedAlarmSound());
  const [vibrationEnabled, setVibrationState] = useState<boolean>(getAlarmVibrationEnabled());
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };
  }, [audioCtx]);

  const handleSelectSound = (sound: AlarmSoundOption) => {
    setSelectedSoundState(sound);
    setSelectedAlarmSound(sound);
    if (onSaved) onSaved();
  };

  const handleToggleVibration = () => {
    const next = !vibrationEnabled;
    setVibrationState(next);
    setAlarmVibrationEnabled(next);
    if (onSaved) onSaved();
  };

  const playPreviewTone = (option: SoundItem) => {
    if (option.id === 'mute') return;

    if (playingSoundId === option.id) {
      setPlayingSoundId(null);
      return;
    }

    try {
      const ctx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioCtx) setAudioCtx(ctx);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = option.id === 'digital_alarm.wav' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(option.frequency || 659.25, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);

      if (option.id === 'digital_alarm.wav') {
        // Pulsing pattern
        gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.01, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.65);
      } else {
        // Ringing decay
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.25);
      }

      setPlayingSoundId(option.id);
      setTimeout(() => {
        setPlayingSoundId(null);
      }, 1300);
    } catch (e) {
      console.warn('Audio preview tone notice:', e);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Go back"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <BellRing size={20} className="text-red-400" />
              <span>Exam Alarm & Sound Settings</span>
            </h2>
            <p className="text-xs text-white/50">
              Configure alert tones and countdown notifications for scheduled exams
            </p>
          </div>
        </div>
      </div>

      {/* Info Card: Exact 1hr and 5min logic */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
          <Clock size={15} className="text-amber-400 shrink-0" />
          <span>Active Countdown Routine:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <span className="font-mono font-bold text-amber-400 text-[11px]">1 HOUR BEFORE EXAM</span>
            <p className="text-white/80 text-[12px] italic">
              &ldquo;You have [Subject] in the Next 1hr at [Exam hall], prepare!&rdquo;
            </p>
          </div>
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
            <span className="font-mono font-bold text-red-400 text-[11px]">5 MINS BEFORE EXAM</span>
            <p className="text-white/80 text-[12px] italic">
              &ldquo;Hope you are at [Exam hall] now, you have only five minutes to Sit for [Exam]&rdquo;
            </p>
          </div>
        </div>
        <p className="text-[11px] text-white/40 flex items-center gap-1.5 pt-1">
          <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
          <span>Action buttons &quot;Snooze&quot; (5 min) and &quot;Dismiss&quot; execute quietly in the background without opening the app.</span>
        </p>
      </div>

      {/* Sound Options List */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono font-bold uppercase text-white/60 tracking-wider">
          Alarm Tone Selection
        </h3>

        <div className="space-y-2">
          {SOUND_OPTIONS.map((option) => {
            const isSelected = selectedSound === option.id;
            const isPlaying = playingSoundId === option.id;

            return (
              <div
                key={option.id}
                onClick={() => handleSelectSound(option.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-red-500/10 border-red-500/40 shadow-sm shadow-red-500/10'
                    : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/10'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected 
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                      : 'bg-white/5 text-white/40 border border-white/10'
                  }`}>
                    {option.id === 'mute' ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </div>

                  <div className="min-w-0">
                    <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-white/80'}`}>
                      {option.label}
                    </h4>
                    <p className="text-xs text-white/40 truncate">
                      {option.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {option.id !== 'mute' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playPreviewTone(option);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold text-white/80 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Test Audio Tone"
                    >
                      {isPlaying ? <Square size={12} className="text-red-400 fill-current" /> : <Play size={12} className="text-emerald-400 fill-current" />}
                      <span className="text-[11px]">{isPlaying ? 'Stop' : 'Test'}</span>
                    </button>
                  )}

                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    isSelected 
                      ? 'bg-red-500 border-red-400 text-white shadow-sm shadow-red-500/40' 
                      : 'border-white/20 text-transparent'
                  }`}>
                    <Check size={13} strokeWidth={3} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vibration Setting Toggle */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Vibrate size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Device Vibration</h4>
            <p className="text-xs text-white/40">Vibrate phone when alarm triggers</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleVibration}
          className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
            vibrationEnabled ? 'bg-red-500' : 'bg-white/20'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
              vibrationEnabled ? 'left-6.5' : 'left-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  );
};
