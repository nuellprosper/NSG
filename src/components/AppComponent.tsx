import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, Sparkles, XCircle, CheckCircle2, Cpu, Zap, ShieldCheck, User, RefreshCcw 
} from 'lucide-react';

// --- Prop Interfaces ---

export interface LoggedOutLandingProps {
  onboardingIndex: number;
  setOnboardingIndex: React.Dispatch<React.SetStateAction<number>>;
  setAuthMode: React.Dispatch<React.SetStateAction<'login' | 'signup'>>;
  setShowAuthModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface AnalysisLoadingOverlayProps {
  isAnalyzing: boolean;
}

export interface EmailPreviewModalProps {
  showEmailPreviewModal: boolean;
  setShowEmailPreviewModal: React.Dispatch<React.SetStateAction<boolean>>;
  theme: 'light' | 'dark';
  emailPreviewTo: string;
  emailPreviewSubject: string;
  emailPreviewContent: string;
}

export interface AIChallengeModalProps {
  showAIChallengeModal: boolean;
  setShowAIChallengeModal: React.Dispatch<React.SetStateAction<boolean>>;
  activeAIChallenge: {
    title: string;
    recommendation: string;
    reward: string;
    actionLabel?: string;
    type: 'quiz' | 'notebook' | 'class' | string;
    peerName?: string;
    peerText?: string;
  } | null;
  setActiveTab: React.Dispatch<React.SetStateAction<any>>;
  setToolsSubTab: React.Dispatch<React.SetStateAction<any>>;
  setUserNotification: (msg: string) => void;
  sendPersuasiveEmail: (challenge: any) => void;
}

export interface PremiumOnboardingProps {
  showPremiumTrial: boolean;
  setShowPremiumTrial: React.Dispatch<React.SetStateAction<boolean>>;
  user: any;
  theme: 'light' | 'dark';
  initializeMonthly: (config: any) => void;
  initializeYearly: (config: any) => void;
  handleSubscriptionSuccess: (plan: 'monthly' | 'yearly', reference: string) => void;
  setUserNotification: (msg: string) => void;
}

export interface PremiumModalProps {
  showPremiumModal: boolean;
  setShowPremiumModal: React.Dispatch<React.SetStateAction<boolean>>;
  user: any;
  theme: 'light' | 'dark';
  isPremium: boolean;
  initializeMonthly: (config: any) => void;
  initializeYearly: (config: any) => void;
  handleSubscriptionSuccess: (plan: 'monthly' | 'yearly', reference: string) => void;
  setUserNotification: (msg: string) => void;
}

// --- 💀 LOGGED OUT LANDING ---

export const LoggedOutLanding: React.FC<LoggedOutLandingProps> = ({
  onboardingIndex,
  setOnboardingIndex,
  setAuthMode,
  setShowAuthModal
}) => {
  const onboardingSlides = [
    {
      title: "Built for Students Like You",
      tagline: "DESIGNED FOR ACADEMIC TRIUMPH",
      description: "NSG was custom-built for students like you to master complex courses, organize study schedules, and build lifelong academic consistency.",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
    },
    {
      title: "Build Academic Consistency",
      tagline: "GENERATING QUIZZES & CHANCES",
      description: "With NSG you can build consistency by generating quizzes, chatting with friends like you, and testing your retention in real-time.",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop"
    },
    {
      title: "Host CBT Exam Sessions",
      tagline: "EXAM PRACTICE SIMULATION",
      description: "Host your own CBT exams with participants as possible, complete with real-time analytics, participant rankings, and precise answer sheets.",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop"
    },
    {
      title: "Lecture Recording & AI Summaries",
      tagline: "YOUR ULTIMATE READING CO-PILOT",
      description: "Transcript live recording speech, generate beautiful study notes, summarize academic archives, and unlock your true brain power.",
      image: "https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=800&auto=format&fit=crop"
    }
  ];

  const handleNext = () => {
    if (onboardingIndex < onboardingSlides.length - 1) {
      setOnboardingIndex(prev => prev + 1);
    } else {
      setAuthMode('signup');
      setShowAuthModal(true);
    }
  };

  const handleBack = () => {
    if (onboardingIndex > 0) {
      setOnboardingIndex(prev => prev - 1);
    }
  };

  const activeSlide = onboardingSlides[onboardingIndex];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[#0E0B16] overflow-hidden flex flex-col items-center justify-between p-6 sm:p-12 text-center"
    >
      {/* HARDWARE BACKGROUND - FULL WINDOW BACKDROP */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          key={onboardingIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.65, scale: 1 }}
          transition={{ duration: 1.0, ease: "easeInOut" }}
          className="absolute inset-0 bg-cover bg-center scale-100"
          style={{ 
            backgroundImage: `url(${activeSlide.image})`,
          }}
        />
        {/* MULTI-LAYER RICH VIGNETTE & GRAPHICS GRADIENT FOR ULTIMATE CONTRAST */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E0B16] via-[#0E0B16]/90 to-[#0E0B16]/70" />
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-gradient-to-br from-[#DC2626] to-blue-600 rounded-full blur-[160px] opacity-25 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#DC2626] rounded-full blur-[140px] opacity-15" />
      </div>

      {/* TOP UTILITY BRANDING */}
      <div className="z-10 flex items-center justify-between w-full max-w-4xl pt-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-[#DC2626] to-[#2563EB] rounded-lg flex items-center justify-center shadow-lg shadow-[#DC2626]/20">
            <Brain size={14} className="text-white" />
          </div>
          <span className="text-[10px] font-black tracking-widest text-white uppercase italic">NSG STUDY</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
            className="text-white/40 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all"
          >
            Skip to Sign Up
          </button>
          <span className="text-white/10 select-none text-[8px]">|</span>
          <button 
            onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
            className="text-white/40 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all"
          >
            Skip to Login
          </button>
        </div>
      </div>

      {/* MIDDLE SLIDES CONTENT */}
      <div className="z-10 w-full max-w-2xl my-auto py-10 flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={onboardingIndex}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="space-y-6"
          >
            {/* SLIDE TEXT */}
            <div className="space-y-3.5 max-w-lg mx-auto px-6">
              <span className="text-[9px] font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-blue-400 tracking-[0.3em] uppercase block">
                {activeSlide.tagline}
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                {activeSlide.title}
              </h1>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed pt-2 max-w-md mx-auto">
                {activeSlide.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* BOTTOM PAGINATION CONTROLS */}
      <div className="z-10 w-full max-w-md space-y-6 pb-6">
        {/* DOTS & RECTANGLE INDICATORS - RESIZED AND COMPACT */}
        <div className="flex items-center justify-center gap-1.5">
          {onboardingSlides.map((_, idx) => {
            const isActive = onboardingIndex === idx;
            const isLastIndex = idx === onboardingSlides.length - 1;

            if (isActive && isLastIndex) {
              return (
                <motion.button
                  key={idx}
                  onClick={() => {
                    setOnboardingIndex(idx);
                    setAuthMode('signup');
                    setShowAuthModal(true);
                  }}
                  initial={{ width: 4, borderRadius: "9999px" }}
                  animate={{ width: 14 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="h-1 bg-gradient-to-r from-red-500 to-blue-500 flex items-center justify-between px-0.5 shadow-none text-white outline-none"
                  title="Initialize Signup"
                >
                  <span className="text-[4px] ml-auto select-none font-bold">▶</span>
                </motion.button>
              );
            }

            return (
              <button
                key={idx}
                onClick={() => setOnboardingIndex(idx)}
                className={`h-1 rounded-full transition-all duration-300 outline-none ${
                  isActive 
                    ? 'w-4 bg-gradient-to-r from-red-500 to-blue-500' 
                    : 'w-1 bg-white/25 hover:bg-white/40'
                }`}
              />
            );
          })}
        </div>

        {/* CONTAINERLESS COMPACT ACTION BUTTONS */}
        <div className="flex items-center justify-between w-full max-w-xs mx-auto px-4">
          {onboardingIndex > 0 ? (
            <button 
              onClick={handleBack}
              className="text-white/40 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all outline-none"
            >
              ← Back
            </button>
          ) : (
            <div className="w-10 animate-pulse bg-transparent" />
          )}

          <button 
            onClick={handleNext}
            className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-blue-400 hover:from-white hover:to-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-all outline-none"
          >
            {onboardingIndex === onboardingSlides.length - 1 ? (
              <>Get Started <span className="text-[7px]">▶</span></>
            ) : (
              <>Next <span className="text-[7px]">▶</span></>
            )}
          </button>
        </div>

        <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.35em]">
          © 2026 NSG Studios • Built for Students
        </p>
      </div>
    </motion.div>
  );
};

// --- 🌟 ANALYSIS LOADING OVERLAY ---

export const AnalysisLoadingOverlay: React.FC<AnalysisLoadingOverlayProps> = ({ isAnalyzing }) => {
  return (
    <AnimatePresence>
      {isAnalyzing && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-[#13111C]/90 backdrop-blur-xl"
        >
          <div className="max-w-md w-full text-center space-y-6">
            <div className="relative inline-block">
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 rounded-[2rem] border-2 border-dashed border-[#DC2626]/30"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain size={40} className="text-[#DC2626] animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Analyzing Lecture</h2>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Omni is processing your content...</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
              <p className="text-[10px] text-[#DC2626] font-black uppercase tracking-widest animate-pulse">Wait a few seconds. Do not close.</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Subject Secure Email Client Mockup ---

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  showEmailPreviewModal,
  setShowEmailPreviewModal,
  theme,
  emailPreviewTo,
  emailPreviewSubject,
  emailPreviewContent
}) => {
  return (
    <AnimatePresence>
      {showEmailPreviewModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className={`w-full max-w-2xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl ${
              theme === 'dark' ? 'bg-[#0F0C1B]' : 'bg-slate-900'
            }`}
          >
            {/* Header / Email Client Window Controls */}
            <div className="bg-black/40 px-6 py-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                <span className="text-[10px] text-white/40 font-mono ml-3 uppercase tracking-wider">NSG Secure Email Client Mockup</span>
              </div>
              <button 
                onClick={() => setShowEmailPreviewModal(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>

            {/* Email Meta Info Banner */}
            <div className="bg-black/20 p-5 border-b border-white/5 text-left space-y-1.5">
              <div className="flex text-xs">
                <span className="text-white/40 w-16 uppercase font-mono tracking-widest text-[9px]">From:</span>
                <span className="text-white font-bold font-sans">NSG (Nuell Study Guide) AI Engine &lt;spark@nuellstudyguide.name.ng&gt;</span>
              </div>
              <div className="flex text-xs">
                <span className="text-white/40 w-16 uppercase font-mono tracking-widest text-[9px]">To:</span>
                <span className="text-red-400 font-mono font-bold">{emailPreviewTo}</span>
              </div>
              <div className="flex text-xs">
                <span className="text-white/40 w-16 uppercase font-mono tracking-widest text-[9px]">Subject:</span>
                <span className="text-yellow-400 font-bold">{emailPreviewSubject}</span>
              </div>
            </div>

            {/* Compiled HTML preview frame with custom bounds */}
            <div className="h-[420px] bg-[#0F0D19] relative overflow-hidden">
              <iframe 
                title="Persuasive Study Email Preview"
                srcDoc={emailPreviewContent}
                className="w-full h-full border-none"
                sandbox="allow-popups"
              />
            </div>

            {/* Bottom Actions banner */}
            <div className="bg-black/40 p-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[8px] font-mono uppercase text-green-400 animate-pulse tracking-wide flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                Handshake Sent & Persuasion Dispatched
              </span>
              <button
                onClick={() => setShowEmailPreviewModal(false)}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
              >
                Close Mailbox
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- 🔮 AI CHALLENGE MODAL ---

export const AIChallengeModal: React.FC<AIChallengeModalProps> = ({
  showAIChallengeModal,
  setShowAIChallengeModal,
  activeAIChallenge,
  setActiveTab,
  setToolsSubTab,
  setUserNotification,
  sendPersuasiveEmail
}) => {
  return (
    <AnimatePresence>
      {showAIChallengeModal && activeAIChallenge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="w-full max-w-sm rounded-3xl overflow-hidden bg-[#0A0713]/95 border border-white/5 shadow-2xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">🔮</span>
                <span className="text-[10px] font-black uppercase text-white tracking-widest leading-none">AI Instant Coach</span>
              </div>
              <button 
                onClick={() => setShowAIChallengeModal(false)}
                className="text-white/45 hover:text-white transition-all bg-transparent border-none outline-none cursor-pointer"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5">
              <span className="text-[7.5px] font-mono text-red-400 font-bold uppercase tracking-wider block leading-none">Peer Context Action</span>
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-tight mt-1.5 leading-none">
                @{activeAIChallenge.peerName || "Scholar"}
              </p>
              <p className="text-[10.5px] text-white/80 font-medium leading-relaxed italic mt-1.5">
                "{activeAIChallenge.peerText}"
              </p>
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-black text-yellow-500 uppercase tracking-tight leading-none">
                  {activeAIChallenge.title}
                </span>
                <span className="text-[7px] font-mono tracking-widest text-[#DC2626] font-black uppercase bg-[#DC2626]/10 px-1.5 py-0.5 rounded">
                  {activeAIChallenge.reward}
                </span>
              </div>
              <p className="text-[10.5px] text-white/95 leading-relaxed font-semibold">
                {activeAIChallenge.recommendation}
              </p>
            </div>

            <div className="flex items-stretch overflow-hidden rounded-xl border border-white/5 h-10">
              <button
                type="button"
                onClick={() => {
                  setShowAIChallengeModal(false);
                  if (activeAIChallenge.type === 'quiz') {
                    setActiveTab('tools');
                    setToolsSubTab('quiz');
                  } else if (activeAIChallenge.type === 'notebook') {
                    setActiveTab('tools');
                    setToolsSubTab('notebook');
                  } else {
                    setActiveTab('class');
                  }
                  setUserNotification(`Accepted Sync Challenge: "${activeAIChallenge.title}"!`);
                }}
                className="flex-1 bg-gradient-to-r from-red-500 to-blue-600 hover:opacity-95 text-white font-black text-[9px] uppercase tracking-widest text-center transition-all flex items-center justify-center border-none"
              >
                {activeAIChallenge.actionLabel || "ACCEPT SYNC"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAIChallengeModal(false);
                  sendPersuasiveEmail({
                    title: activeAIChallenge.title,
                    message: activeAIChallenge.recommendation,
                    reward: activeAIChallenge.reward,
                    actionLabel: activeAIChallenge.actionLabel,
                    type: activeAIChallenge.type
                  });
                }}
                className="px-4 bg-black/40 hover:bg-black/60 text-white/60 hover:text-white transition-all border-l border-white/5 flex items-center justify-center text-xs border-none"
                title="Dispatch Study Email Alert concerning streak"
              >
                📬
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- 🌟 PREMIUM ONBOARDING (MODAL STYLE) ---

export const PremiumOnboarding: React.FC<PremiumOnboardingProps> = ({
  showPremiumTrial,
  setShowPremiumTrial,
  user,
  theme,
  initializeMonthly,
  initializeYearly,
  handleSubscriptionSuccess,
  setUserNotification
}) => {
  return (
    <AnimatePresence>
      {showPremiumTrial && user && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className={`${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} border p-6 sm:p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl relative overflow-hidden shadow-yellow-500/10`}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
            <button onClick={() => setShowPremiumTrial(false)} className="absolute top-4 right-4 text-white/44 hover:text-yellow-500 transition-colors bg-transparent border-none outline-none cursor-pointer"><XCircle size={24} /></button>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles size={32} className="text-yellow-500" />
              </div>
              <h2 className="text-2xl font-black tracking-tighter uppercase italic text-white leading-none">Unlock <span className="text-yellow-500">Premium</span></h2>
              <p className="text-xs text-white/40 mt-2">Elevate your study experience with Omni</p>
            </div>

            <div className="space-y-3 mb-8 text-left">
              <div className="flex items-center gap-3 text-sm text-white/70 bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="p-2 bg-yellow-500/20 rounded-lg"><Cpu size={16} className="text-yellow-500" /></div>
                <span>Gemini 3.1 Pro Access</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70 bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="p-2 bg-yellow-500/20 rounded-lg"><Zap size={16} className="text-yellow-500" /></div>
                <span>Unlimited Transcriptions</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/70 bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="p-2 bg-yellow-500/20 rounded-lg"><ShieldCheck size={16} className="text-yellow-500" /></div>
                <span>Priority Support & Features</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => initializeMonthly({ onSuccess: (response: any) => handleSubscriptionSuccess('monthly', response.reference), onClose: () => setUserNotification("Payment cancelled.") })}
                className={`${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-zinc-100 border-zinc-200'} border p-4 rounded-2xl hover:border-yellow-500/50 transition-all text-center group`}
              >
                <p className={`text-[10px] font-black ${theme === 'dark' ? 'text-white/40' : 'text-zinc-400'} uppercase mb-1`}>Monthly</p>
                <p className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>N300</p>
                <p className="text-[8px] font-bold text-yellow-500 uppercase mt-1">Basic Access</p>
              </button>
              <button 
                onClick={() => initializeYearly({ onSuccess: (response: any) => handleSubscriptionSuccess('yearly', response.reference), onClose: () => setUserNotification("Payment cancelled.") })}
                className="bg-yellow-500 text-black p-4 rounded-2xl hover:bg-yellow-400 transition-all text-center group shadow-xl shadow-yellow-500/20"
              >
                <p className="text-[10px] font-black text-black/40 uppercase mb-1">Yearly</p>
                <p className="text-xl font-black text-black">N3,600</p>
                <p className="text-[8px] font-bold text-black/60 uppercase mt-1">Best Value</p>
              </button>
            </div>

            <button 
              onClick={() => setShowPremiumTrial(false)}
              className="w-full mt-6 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all text-center"
            >
              Continue with Free Tier
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- PREMIUM HARD WALL PAYWALL TRIGGER OR CELEBRATION MODAL ---

export const PremiumModal: React.FC<PremiumModalProps> = ({
  showPremiumModal,
  setShowPremiumModal,
  user,
  theme,
  isPremium,
  initializeMonthly,
  initializeYearly,
  handleSubscriptionSuccess,
  setUserNotification
}) => {
  return (
    <AnimatePresence>
      {showPremiumModal && user && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className={`${theme === 'dark' ? 'bg-[#13111C]' : 'bg-white'} border ${theme === 'dark' ? 'border-yellow-500/20 shadow-[0_0_50px_rgba(234,179,8,0.15)]' : 'border-slate-200'} p-6 sm:p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl relative overflow-hidden`}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
            <button onClick={() => setShowPremiumModal(false)} className={`absolute top-4 right-4 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'} hover:text-yellow-500 transition-colors bg-transparent border-none outline-none cursor-pointer`}><XCircle size={24} /></button>
            
            {isPremium ? (
              // CELEBRATIVE PREMIUM VIEW FOR SUBSCRIBED USERS
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-yellow-500/20 animate-bounce">
                  <Sparkles size={38} className="text-black" />
                </div>
                <h2 className={`text-2xl font-black tracking-tighter uppercase italic ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>You are Premium!</h2>
                <span className="inline-block bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mt-2">
                  ✦ active subscriber ✦
                </span>
                <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'} mt-3 max-w-xs mx-auto`}>
                  Thank you for supporting NSG. Enjoy unlimited power:
                </p>

                <div className="space-y-3.5 my-8 text-left bg-white/5 p-5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 text-sm text-yellow-500">
                    <CheckCircle2 size={18} className="text-yellow-500 flex-shrink-0" />
                    <span className="font-bold">No Ads & Unlimited Study Tokens</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-yellow-500">
                    <CheckCircle2 size={18} className="text-yellow-500 flex-shrink-0" />
                    <span className="font-bold">Unlimited Hosting of CBT Exams</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-yellow-500">
                    <CheckCircle2 size={18} className="text-yellow-500 flex-shrink-0" />
                    <span className="font-bold">Advanced AI Image Generation Unlocked</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-yellow-500">
                    <CheckCircle2 size={18} className="text-yellow-500 flex-shrink-0" />
                    <span className="font-bold">High-Priority Server Summarization</span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowPremiumModal(false)}
                  className="w-full bg-yellow-500 text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20"
                >
                  Keep Evolving
                </button>
              </div>
            ) : (
              // STANDARD PAYWALL VIEW FOR FREE USERS
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles size={32} className="text-yellow-500" />
                  </div>
                  <h2 className={`text-2xl font-black tracking-tighter uppercase italic ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Upgrade to Premium</h2>
                  <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'} mt-1`}>Unlock all features and remove limitations</p>
                </div>

                <div className="space-y-4 mb-8 text-left">
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span>No Ads & Unlimited Tokens</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span>Access to all CBT Exams</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span>Advanced AI Image Generation</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span>Priority Support</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => initializeMonthly({ onSuccess: (response: any) => handleSubscriptionSuccess('monthly', response.reference), onClose: () => setUserNotification("Payment cancelled.") })}
                    className={`${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-zinc-100 border-zinc-200'} border p-4 rounded-2xl hover:border-yellow-500/50 transition-all text-center group`}
                  >
                    <p className={`text-[10px] font-black ${theme === 'dark' ? 'text-white/40' : 'text-zinc-400'} uppercase mb-1`}>Monthly</p>
                    <p className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>N300</p>
                    <p className="text-[8px] font-bold text-yellow-500 uppercase mt-1">Save 0%</p>
                  </button>
                  <button 
                    onClick={() => initializeYearly({ onSuccess: (response: any) => handleSubscriptionSuccess('yearly', response.reference), onClose: () => setUserNotification("Payment cancelled.") })}
                    className="bg-yellow-500 text-black p-4 rounded-2xl hover:bg-yellow-400 transition-all text-center group"
                  >
                    <p className="text-[10px] font-black text-black/40 uppercase mb-1">Yearly</p>
                    <p className="text-xl font-black text-black">N3,600</p>
                    <p className="text-[8px] font-bold text-black/60 uppercase mt-1">Best Value</p>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
