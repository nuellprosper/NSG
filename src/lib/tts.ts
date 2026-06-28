// Advanced Custom Text-to-Speech Engine
// Implements custom voice profiles with pitch, rate, and native voice-selection mappings

export interface CustomVoice {
  id: string;
  name: string;
  gender: 'female' | 'male';
  description: string;
  pitch: number;
  rate: number;
  langKeyword?: string; // e.g. 'GB' or 'US'
}

export const CUSTOM_VOICES: CustomVoice[] = [
  {
    id: 'omni',
    name: 'Omni (Female)',
    gender: 'female',
    description: 'High-clarity adaptive academic tutor voice',
    pitch: 1.15,
    rate: 0.95
  },
  {
    id: 'zeal',
    name: 'Zeal (Male)',
    gender: 'male',
    description: 'Deep authoritative study supervisor voice',
    pitch: 0.82,
    rate: 0.90
  },
  {
    id: 'seera',
    name: 'Seera (Female)',
    gender: 'female',
    description: 'Energetic UK English examiner tone',
    pitch: 1.25,
    rate: 1.05,
    langKeyword: 'GB'
  },
  {
    id: 'zud',
    name: 'Zud (Male)',
    gender: 'male',
    description: 'Warm baritone cognitive mentor',
    pitch: 0.68,
    rate: 0.85,
    langKeyword: 'GB'
  },
  {
    id: 'aura',
    name: 'Aura (Ethereal Female)',
    gender: 'female',
    description: 'Soft whisper-like mnemonic guide',
    pitch: 1.40,
    rate: 0.80
  },
  {
    id: 'orion',
    name: 'Orion (Deep Space Male)',
    gender: 'male',
    description: 'Low-frequency resonance pattern',
    pitch: 0.55,
    rate: 0.95
  }
];

export const speakText = (text: string, voiceId: string, onStart?: () => void, onEnd?: () => void) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech synthesis is not supported on this device.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const profile = CUSTOM_VOICES.find(v => v.id === voiceId) || CUSTOM_VOICES[0];

  utterance.rate = profile.rate;

  // Retrieve native browser voices
  const nativeVoices = window.speechSynthesis.getVoices();

  // Try to find the best matching native voice based on gender, language, or system name
  let matchedVoice = null;

  const maleNames = ['male', 'david', 'daniel', 'mark', 'ravi', 'george', 'alex', 'fred', 'rishi', 'brian', 'russell', 'geraint', 'guy', 'stephen', 'james', 'jack', 'natural (male)', 'standard-b'];
  const femaleNames = ['female', 'zira', 'samantha', 'google us english', 'victoria', 'hazel', 'susan', 'karen', 'fiona', 'moira', 'tessa', 'standard-c', 'standard-a', 'standard-d', 'standard-e'];

  if (profile.gender === 'female') {
    // Look for typical female voice names in browser TTS systems
    matchedVoice = nativeVoices.find(v => 
      (v.lang.startsWith('en') || v.lang.includes('en')) && 
      femaleNames.some(name => v.name.toLowerCase().includes(name))
    );
  } else {
    // Look for typical male voice names
    matchedVoice = nativeVoices.find(v => 
      (v.lang.startsWith('en') || v.lang.includes('en')) && 
      maleNames.some(name => v.name.toLowerCase().includes(name))
    );
  }

  // Fallback to any English voice
  if (!matchedVoice) {
    matchedVoice = nativeVoices.find(v => v.lang.startsWith('en') || v.lang.includes('en'));
  }

  // Fallback to default voice
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  // Ensure male voices don't sound like weird pitch-shifted females
  const isActuallyMale = matchedVoice && maleNames.some(name => matchedVoice!.name.toLowerCase().includes(name));

  if (profile.gender === 'male') {
    if (isActuallyMale) {
      utterance.pitch = profile.pitch; // Deep male voice pitch
    } else {
      // It fell back to a female/neutral voice, use normal pitch 1.0 to sound natural
      utterance.pitch = 1.0;
    }
  } else {
    utterance.pitch = profile.pitch;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;

  window.speechSynthesis.speak(utterance);
};

export const getAvailableCustomVoices = (): CustomVoice[] => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return CUSTOM_VOICES;
  }
  const nativeVoices = window.speechSynthesis.getVoices();
  if (nativeVoices.length === 0) {
    // If native voices are not loaded yet, return all to be safe
    return CUSTOM_VOICES;
  }
  
  const maleNames = ['male', 'david', 'daniel', 'mark', 'ravi', 'george', 'alex', 'fred', 'rishi', 'brian', 'russell', 'geraint', 'guy', 'stephen', 'james', 'jack', 'natural (male)', 'standard-b'];
  
  // Check if there is any English male voice or any male voice
  const hasMaleVoice = nativeVoices.some(v => {
    const name = v.name.toLowerCase();
    return maleNames.some(m => name.includes(m));
  });

  if (!hasMaleVoice) {
    // If absolutely no male voice is found, filter out all male voices so we don't play fake male voices
    return CUSTOM_VOICES.filter(v => v.gender !== 'male');
  }

  return CUSTOM_VOICES;
};
