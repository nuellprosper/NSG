import React, { useState } from 'react';
import { ArrowLeft, X, Lock, ChevronDown, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PremiumPageProps {
  isPremium: boolean;
  onClose: () => void;
  setUserNotification: (msg: string) => void;
  setIsPremium: (val: boolean) => void;
  initializeMonthly?: (config?: any) => void;
  initializeYearly?: (config?: any) => void;
  handleSubscriptionSuccess?: (plan: 'monthly' | 'yearly', reference: string) => void;
}

export const PremiumPage: React.FC<PremiumPageProps> = ({
  isPremium,
  onClose,
  setUserNotification,
  setIsPremium,
  initializeMonthly,
  initializeYearly,
  handleSubscriptionSuccess
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleActivate = () => {
    if (selectedPlan === 'monthly' && initializeMonthly) {
      initializeMonthly({
        onSuccess: (response: any) => {
          if (handleSubscriptionSuccess) {
            handleSubscriptionSuccess('monthly', response.reference);
          } else {
            setIsPremium(true);
            setUserNotification('🎉 Premium Plan Activated! Enjoy unlimited access to all NSG features.');
          }
        },
        onClose: () => setUserNotification("Payment cancelled.")
      });
    } else if (selectedPlan === 'yearly' && initializeYearly) {
      initializeYearly({
        onSuccess: (response: any) => {
          if (handleSubscriptionSuccess) {
            handleSubscriptionSuccess('yearly', response.reference);
          } else {
            setIsPremium(true);
            setUserNotification('🎉 Premium Plan Activated! Enjoy unlimited access to all NSG features.');
          }
        },
        onClose: () => setUserNotification("Payment cancelled.")
      });
    } else {
      setIsPremium(true);
      setUserNotification('🎉 Premium Plan Activated! Enjoy unlimited access to all NSG features.');
      onClose();
    }
  };

  // If user is already Premium, show clean active status view
  if (isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="max-w-md mx-auto px-4 py-8 font-sans text-center flex flex-col justify-center min-h-[60vh] space-y-6 select-none"
      >
        <div className="bg-gradient-to-br from-[#1E112A] via-[#160E22] to-[#0F0A18] border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
            <ShieldCheck size={36} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              NSG Premium Active
            </h2>
            <p className="text-xs text-amber-200/80 font-medium leading-relaxed">
              You have full access to unlimited AI voice transcriptions, Gemini Omni Oracle, CBT Exam Hostings, and custom academic analytics.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="max-w-md mx-auto px-3 sm:px-4 py-3 font-sans text-left flex flex-col space-y-4 select-none"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-1 border-b border-white/5">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1A1425] hover:bg-[#251D35] border border-white/10 text-white transition-all text-xs font-semibold cursor-pointer active:scale-95"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-4 py-1 rounded-full border border-amber-500/30 shadow-sm">
          NSG PREMIUM
        </span>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl bg-[#1A1425] hover:bg-[#251D35] border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer active:scale-95"
          title="Close Premium"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-gradient-to-b from-[#181126] via-[#140E20] to-[#0E0B16] border border-[#3D265A] rounded-[2rem] p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden">
        
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <h1 className="text-5xl font-black text-white tracking-tight leading-none font-sans">
            NSG
          </h1>
          <p className="text-xs font-black text-amber-400 tracking-[0.4em] uppercase">
            PREMIUM
          </p>
          
          <h2 className="text-lg font-bold text-white tracking-tight pt-3">
            Unlock the full power of NSG
          </h2>
          <p className="text-xs text-white/60 font-normal leading-relaxed max-w-xs mx-auto">
            Upgrade to Premium and take your academics to the next level.
          </p>
        </div>

        {/* Pricing Option Cards */}
        <div className="space-y-3 pt-1">
          {/* MONTHLY CARD */}
          <div
            onClick={() => setSelectedPlan('monthly')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-left relative ${
              selectedPlan === 'monthly'
                ? 'bg-[#1D162B] border-[#EAB308] shadow-lg shadow-amber-500/10'
                : 'bg-[#151020] border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#EAB308]">
                MONTHLY
              </span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedPlan === 'monthly' ? 'border-[#EAB308]' : 'border-white/30'
              }`}>
                {selectedPlan === 'monthly' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
                )}
              </div>
            </div>

            <div className="text-2xl font-black text-white mt-1">
              ₦300 <span className="text-xs font-normal text-white/50">/ month</span>
            </div>
            <p className="text-xs text-white/50 font-normal mt-0.5">
              Billed monthly
            </p>
          </div>

          {/* ANNUAL CARD */}
          <div
            onClick={() => setSelectedPlan('yearly')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-left relative ${
              selectedPlan === 'yearly'
                ? 'bg-[#1D162B] border-[#EAB308] shadow-lg shadow-amber-500/10'
                : 'bg-[#151020] border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#EAB308]">
                  ANNUAL
                </span>
                <span className="bg-[#EF4444] text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                  BEST VALUE
                </span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedPlan === 'yearly' ? 'border-[#EAB308]' : 'border-white/30'
              }`}>
                {selectedPlan === 'yearly' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
                )}
              </div>
            </div>

            <div className="text-2xl font-black text-white mt-1">
              ₦3,500 <span className="text-xs font-normal text-white/50">/ year</span>
            </div>
            <p className="text-xs text-white/50 font-normal mt-0.5">
              Full 1 year access
            </p>
          </div>
        </div>

        {/* Expandable Accordion: See what Premium unlocks */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full bg-[#1B1428] hover:bg-[#231A33] border border-white/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer text-white transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5">
              <Lock size={16} className="text-white/80 shrink-0" />
              <span className="text-xs font-bold text-white">See what Premium unlocks</span>
            </div>
            <ChevronDown size={18} className={`text-white/70 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="space-y-2.5 pt-3 text-left">
                  {[
                    { title: "Multi-Option Quiz Selection", desc: "Combine True/False, Single Choice, and Multiple Choice questions into a single quiz, or select any combination." },
                    { title: "Generate Up to 50 Questions per Quiz", desc: "Unlock 50-question comprehensive mock quizzes (free users limited to 20 questions)." },
                    { title: "Unlimited Quizzes per Day", desc: "Generate unlimited AI quizzes daily (free users limited to 3 quizzes per day)." },
                    { title: "Transcribe Lecture Audios", desc: "Transcribe uploaded lecture audios with instant AI summaries & key notes." },
                    { title: "Unlimited Omni Access", desc: "Unlimited AI chats, instant problem solver & lecture material breakdown." },
                    { title: "CBT Exam Simulations & Hosting", desc: "Host exams for up to 100+ students with live score leaderboards & analytics." },
                    { title: "20 Image & 5 Document Uploads per Quiz", desc: "Asset upload: Up to 20 images and 5 documents per quiz." }
                  ].map((perk, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Zap size={13} />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-white leading-snug">{perk.title}</h4>
                        <p className="text-[11px] text-white/50 leading-normal">{perk.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleActivate}
          className="w-full bg-gradient-to-r from-[#FACC15] via-[#EAB308] to-[#CA8A04] hover:brightness-110 text-black font-black text-xs sm:text-sm uppercase tracking-wider py-4 px-6 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer border-none"
        >
          <Zap size={18} className="fill-black text-black" />
          <span>ACTIVATE {selectedPlan === 'monthly' ? '₦300 MONTHLY' : '₦3,500 ANNUAL'} PREMIUM</span>
        </button>

        {/* Footer Subtext */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/50 font-medium text-center pt-1">
          <Lock size={12} className="text-white/40" />
          <span>Secure payment. Cancel anytime.</span>
        </div>
      </div>
    </motion.div>
  );
};
