import React, { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX, Check, Play, Music, Sparkles } from 'lucide-react';
import { 
  getAlarmSoundPreference, 
  setAlarmSoundPreference, 
  AlarmSoundType,
  registerExamAlarmActionTypes 
} from '../lib/capacitor';

export interface AlarmSoundOption {
  id: AlarmSoundType;
  label: string;
  description: string;
  isMute?: boolean;
}

const ALARM_OPTIONS: AlarmSoundOption[] = [
  {
    id: 'beep_alarm.mp3',
    label: 'Digital Beep Alarm',
    description: 'High-visibility energetic electronic pulse (Recommended for exam morning)'
  },
  {
    id: 'chime_alarm.wav',
    label: 'Crystal Chime',
    description: 'Clear harmonic chime melody for calm preparation'
  },
  {
    id: 'school_bell.mp3',
    label: 'Classic Examination Bell',
    description: 'Traditional school hall bell ring tone'
  },
  {
    id: 'default',
    label: 'Standard Device Ringtone',
    description: 'Uses your phone’s default Android alarm sound'
  },
  {
    id: 'mute',
    label: 'Mute / Silent (Vibrate Only)',
    description: 'Display heads-up countdown without audible ringing',
    isMute: true
  }
];

export const AlarmSettings: React.FC = () => {
  const [currentSound, setCurrentSound] = useState<AlarmSoundType>('beep_alarm.mp3');
  const [isPlayingPreview, setIsPlayingPreview] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setCurrentSound(getAlarmSoundPreference());
  }, []);

  const handleSelectSound = async (soundId: AlarmSoundType) => {
    setCurrentSound(soundId);
    setAlarmSoundPreference(soundId);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);

    // Re-register native channel with selected sound
    try {
      await registerExamAlarmActionTypes();
    } catch (e) {}
  };

  const playSoundPreview = (soundId: AlarmSoundType) => {
    if (soundId === 'mute') return;

    setIsPlayingPreview(soundId);

    // Synthesize audio preview for cross-platform browser & preview mode
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      if (soundId === 'beep_alarm.mp3') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc.frequency.setValueAtTime(1046.5, audioCtx.currentTime + 0.15); // C6
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      } else if (soundId === 'chime_alarm.wav') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.24); // G5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      } else if (soundId === 'school_bell.mp3') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      }

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.85);

      setTimeout(() => {
        setIsPlayingPreview(null);
      }, 850);
    } catch (e) {
      setIsPlayingPreview(null);
    }
  };

  return (
    <div id="exam-alarm-settings-panel" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Exam Alarm & Countdown Sounds
              {savedSuccess && (
                <span className="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium px-2 py-0.5 rounded-full flex items-center gap-1 animate-fade-in">
                  <Check className="w-3 h-3" /> Saved
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select the audio alert triggered 1 hour and 5 minutes before scheduled exams.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {ALARM_OPTIONS.map((opt) => {
          const isSelected = currentSound === opt.id;
          const isPreviewing = isPlayingPreview === opt.id;

          return (
            <div
              key={opt.id}
              onClick={() => handleSelectSound(opt.id)}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-red-500/80 bg-red-50/50 dark:bg-red-950/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center space-x-3 pr-2">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {opt.isMute ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {opt.label}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] bg-red-600 text-white font-medium px-1.5 py-0.2 rounded-md">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {!opt.isMute && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playSoundPreview(opt.id);
                    }}
                    className={`p-2 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                      isPreviewing
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    title="Preview Sound"
                  >
                    <Play className={`w-3.5 h-3.5 ${isPreviewing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Preview</span>
                  </button>
                )}

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    isSelected
                      ? 'bg-red-600 border-red-600 text-white'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Alarms include interactive <strong>5-min Snooze</strong> and <strong>Dismiss</strong> buttons.</span>
        </div>
      </div>
    </div>
  );
};

export default AlarmSettings;
