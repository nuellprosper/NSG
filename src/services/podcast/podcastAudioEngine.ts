import { NotePodcastMessage, PodcastSpeaker } from '../../types/podcast';
import { cleanTextForSpeech } from '../../lib/tts';

export interface PodcastVoiceConfig {
  pitch: number;
  rate: number;
  gender: 'female' | 'male';
  preferredNameKeywords: string[];
}

export const PODCAST_VOICE_PROFILES: Record<PodcastSpeaker, PodcastVoiceConfig> = {
  omni: {
    pitch: 1.10,
    rate: 0.96,
    gender: 'female',
    preferredNameKeywords: ['samantha', 'victoria', 'zira', 'female', 'google us english', 'karen', 'hazel']
  },
  zeal: {
    pitch: 0.94,
    rate: 1.02,
    gender: 'male',
    preferredNameKeywords: ['daniel', 'david', 'alex', 'george', 'male', 'rishi', 'mark', 'natural (male)']
  },
  user: {
    pitch: 1.0,
    rate: 1.0,
    gender: 'female',
    preferredNameKeywords: ['en-us', 'default']
  }
};

class PodcastAudioEngine {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isPlaying: boolean = false;
  private activeMessageIndex: number = -1;
  private messages: NotePodcastMessage[] = [];
  private onActiveIndexChange: ((index: number | null) => void) | null = null;
  private onPlaybackStateChange: ((isPlaying: boolean) => void) | null = null;
  private onCompleted: (() => void) | null = null;

  public initListeners(
    onActiveIndexChange: (index: number | null) => void,
    onPlaybackStateChange: (isPlaying: boolean) => void,
    onCompleted?: () => void
  ) {
    this.onActiveIndexChange = onActiveIndexChange;
    this.onPlaybackStateChange = onPlaybackStateChange;
    this.onCompleted = onCompleted || null;
  }

  public setMessages(messages: NotePodcastMessage[]) {
    this.messages = messages;
  }

  public playFromIndex(startIndex: number = 0) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Web SpeechSynthesis not supported');
      return;
    }

    if (this.messages.length === 0) return;

    const targetIndex = Math.max(0, Math.min(startIndex, this.messages.length - 1));
    this.stop();
    this.isPlaying = true;
    this.activeMessageIndex = targetIndex;

    if (this.onPlaybackStateChange) this.onPlaybackStateChange(true);
    this.speakMessage(targetIndex);
  }

  private speakMessage(index: number) {
    if (!this.isPlaying || index >= this.messages.length) {
      this.isPlaying = false;
      this.activeMessageIndex = -1;
      if (this.onActiveIndexChange) this.onActiveIndexChange(null);
      if (this.onPlaybackStateChange) this.onPlaybackStateChange(false);
      if (this.onCompleted && index >= this.messages.length) {
        this.onCompleted();
      }
      return;
    }

    const msg = this.messages[index];
    this.activeMessageIndex = index;
    if (this.onActiveIndexChange) this.onActiveIndexChange(index);

    const clean = cleanTextForSpeech(msg.text);
    if (!clean.trim()) {
      // Empty or unreadable text, skip immediately to next
      this.speakMessage(index + 1);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(clean);
    this.currentUtterance = utterance;

    const profile = PODCAST_VOICE_PROFILES[msg.speaker] || PODCAST_VOICE_PROFILES.omni;
    utterance.pitch = profile.pitch;
    utterance.rate = profile.rate;

    // Resolve native voice
    const nativeVoices = window.speechSynthesis.getVoices();
    if (nativeVoices.length > 0) {
      let matchedVoice = nativeVoices.find(v => {
        const nameLower = v.name.toLowerCase();
        return (v.lang.startsWith('en') || v.lang.includes('en')) &&
          profile.preferredNameKeywords.some(kw => nameLower.includes(kw));
      });

      if (!matchedVoice) {
        // Fallback to any English voice
        matchedVoice = nativeVoices.find(v => v.lang.startsWith('en') || v.lang.includes('en'));
      }
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    utterance.onend = () => {
      if (this.isPlaying && this.activeMessageIndex === index) {
        this.speakMessage(index + 1);
      }
    };

    utterance.onerror = (e) => {
      // If manually canceled, do nothing
      if (e.error === 'canceled' || e.error === 'interrupted') return;
      console.warn('Podcast TTS playback note:', e);
      if (this.isPlaying && this.activeMessageIndex === index) {
        this.speakMessage(index + 1);
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  public pause() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    this.isPlaying = false;
    window.speechSynthesis.cancel();
    if (this.onPlaybackStateChange) this.onPlaybackStateChange(false);
  }

  public resume() {
    if (this.activeMessageIndex >= 0) {
      this.playFromIndex(this.activeMessageIndex);
    } else {
      this.playFromIndex(0);
    }
  }

  public stop() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    this.isPlaying = false;
    window.speechSynthesis.cancel();
    this.activeMessageIndex = -1;
    if (this.onActiveIndexChange) this.onActiveIndexChange(null);
    if (this.onPlaybackStateChange) this.onPlaybackStateChange(false);
  }

  public skipNext() {
    if (this.activeMessageIndex >= 0 && this.activeMessageIndex < this.messages.length - 1) {
      this.playFromIndex(this.activeMessageIndex + 1);
    }
  }

  public skipPrevious() {
    if (this.activeMessageIndex > 0) {
      this.playFromIndex(this.activeMessageIndex - 1);
    } else {
      this.playFromIndex(0);
    }
  }

  public getPlaybackState() {
    return {
      isPlaying: this.isPlaying,
      activeMessageIndex: this.activeMessageIndex
    };
  }
}

export const podcastAudioEngine = new PodcastAudioEngine();
