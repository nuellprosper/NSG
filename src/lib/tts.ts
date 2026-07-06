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
    id: 'seera',
    name: 'Seera (Female)',
    gender: 'female',
    description: 'Energetic UK English examiner tone',
    pitch: 1.25,
    rate: 1.05,
    langKeyword: 'GB'
  },
  {
    id: 'aura',
    name: 'Aura (Ethereal Female)',
    gender: 'female',
    description: 'Soft whisper-like mnemonic guide',
    pitch: 1.30,
    rate: 0.85
  }
];

export const cleanTextForSpeech = (text: string): string => {
  if (!text) return '';
  let cleaned = text;

  // Replace common LaTeX command structures
  cleaned = cleaned.replace(/\\vec\s*\{([^}]+)\}/g, ' vector $1 ');
  cleaned = cleaned.replace(/\\vec\s+([A-Za-z0-9]+)/g, ' vector $1 ');

  // Remove hat command so user doesn't hear "hat" or backslash symbols
  cleaned = cleaned.replace(/\\hat\s*\{([^}]+)\}/g, ' $1 ');
  cleaned = cleaned.replace(/\\hat\s+([A-Za-z0-9]+)/g, ' $1 ');

  // \Omega or \omega -> ohms
  cleaned = cleaned.replace(/\\Omega/g, ' ohms ');
  cleaned = cleaned.replace(/\\omega/g, ' ohms ');

  // Greek letters or symbols
  cleaned = cleaned.replace(/\\alpha/g, ' alpha ');
  cleaned = cleaned.replace(/\\beta/g, ' beta ');
  cleaned = cleaned.replace(/\\gamma/g, ' gamma ');
  cleaned = cleaned.replace(/\\theta/g, ' theta ');
  cleaned = cleaned.replace(/\\pi/g, ' pi ');
  cleaned = cleaned.replace(/\\mu/g, ' micro ');
  cleaned = cleaned.replace(/\\Delta/g, ' delta ');
  cleaned = cleaned.replace(/\\sigma/g, ' sigma ');
  cleaned = cleaned.replace(/\\lambda/g, ' lambda ');
  cleaned = cleaned.replace(/\\epsilon/g, ' epsilon ');

  // Math operators
  cleaned = cleaned.replace(/\\times/g, ' times ');
  cleaned = cleaned.replace(/\\cdot/g, ' times ');
  cleaned = cleaned.replace(/\\div/g, ' divided by ');
  cleaned = cleaned.replace(/\\pm/g, ' plus or minus ');
  cleaned = cleaned.replace(/\\approx/g, ' approximately ');
  cleaned = cleaned.replace(/\\neq?/g, ' not equal to ');
  cleaned = cleaned.replace(/\\leq?/g, ' less than or equal to ');
  cleaned = cleaned.replace(/\\geq?/g, ' greater than or equal to ');
  cleaned = cleaned.replace(/\\circ/g, ' degrees ');
  cleaned = cleaned.replace(/\\degree/g, ' degrees ');

  // Fractions \frac{A}{B} -> A over B
  cleaned = cleaned.replace(/\\frac\s*\{([^}]+)\}\s*\{([^}]+)\}/g, ' $1 over $2 ');
  // Square root \sqrt{A} -> square root of A
  cleaned = cleaned.replace(/\\sqrt\s*\{([^}]+)\}/g, ' square root of $1 ');

  // Subscripts/Superscripts e.g., ^2 -> squared, ^3 -> cubed, ^n -> to the power of n
  cleaned = cleaned.replace(/\^2\b/g, ' squared ');
  cleaned = cleaned.replace(/\^3\b/g, ' cubed ');
  cleaned = cleaned.replace(/\^\{([^}]+)\}/g, ' to the power of $1 ');
  cleaned = cleaned.replace(/\^([0-9]+)/g, ' to the power of $1 ');

  // Remove dollar signs ($ or $$)
  cleaned = cleaned.replace(/\$/g, ' ');

  // Remove asterisks (* or **)
  cleaned = cleaned.replace(/\*/g, ' ');

  // Remove markdown headers (#), code ticks (` or ```), underscores (_)
  cleaned = cleaned.replace(/[#`_~]/g, ' ');

  // Remove lingering LaTeX backslashes or braces
  cleaned = cleaned.replace(/\\([a-zA-Z]+)/g, ' $1 ');
  cleaned = cleaned.replace(/[\{\}]/g, ' ');

  // Clean up extra whitespace
  return cleaned.replace(/\s+/g, ' ').trim();
};

export const speakText = (text: string, voiceId: string, onStart?: () => void, onEnd?: () => void) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech synthesis is not supported on this device.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const cleanString = cleanTextForSpeech(text);
  const utterance = new SpeechSynthesisUtterance(cleanString);
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
