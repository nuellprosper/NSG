import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, X, Zap, Brain, BookOpen, Mic, Volume2, LayoutDashboard } from 'lucide-react';

export interface AboutUsModalProps {
  showAboutUsModal: boolean;
  setShowAboutUsModal: (show: boolean) => void;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({
  showAboutUsModal,
  setShowAboutUsModal,
}) => {
  return (
    <AnimatePresence>
      {showAboutUsModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-[#12101D] border border-white/10 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6 text-left shadow-2xl text-white relative"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/20 text-cyan-400 rounded-2xl flex items-center justify-center border border-cyan-500/30">
                  <Info size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">About Nuell Study Guide (NSG)</h2>
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Empowerment Through Next-Gen Learning AI</p>
                </div>
              </div>
              <button
                onClick={() => setShowAboutUsModal(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs text-white/80 leading-relaxed font-sans">
              <p>
                <strong>Nuell Study Guide (NSG)</strong>, founded by <strong>Abraham Emmanuel Prosper</strong>, is an advanced, all-in-one AI academic platform designed to empower university students and lifelong learners. NSG integrates state-of-the-art AI technology to transform how students study, practice CBT exams, transcribe lectures, and master complex subjects.
              </p>

              <h3 className="text-sm font-black text-white uppercase tracking-wider text-cyan-300 pt-2 border-t border-white/5">
                🛠️ Comprehensive Tools & Capabilities
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs">
                    <Zap size={16} />
                    <span>1. Smart Quiz & CBT Engine</span>
                  </div>
                  <p className="text-[11px] text-white/70">
                    Generate interactive quizzes in seconds. Supports Multiple Choice, True/False, and Theory with timed exam simulation and step-by-step AI answers.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                    <Brain size={16} />
                    <span>2. Omni AI Academic Oracle</span>
                  </div>
                  <p className="text-[11px] text-white/70">
                    Your personal empathetic AI tutor. Solves questions, analyzes study history, guides revision, and answers complex academic queries in real time.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                    <BookOpen size={16} />
                    <span>3. Smart Notebook & Docs</span>
                  </div>
                  <p className="text-[11px] text-white/70">
                    Organize notes and attach study files (PDFs, images). Allows 1-click quiz generation and podcast creation directly from note text and document attachments.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <Mic size={16} />
                    <span>4. Audio Transcription</span>
                  </div>
                  <p className="text-[11px] text-white/70">
                    Upload recorded audio files directly. Our AI transcribes the audio into clean, structured text notes, extracts key study takeaways, and builds practice quizzes from the transcription.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-green-400 font-bold text-xs">
                    <Volume2 size={16} />
                    <span>5. Interactive Podcast (Omni & Zeal)</span>
                  </div>
                  <p className="text-[11px] text-white/70">
                    Converts notes and study documents into dynamic dual-host audio & text podcast discussions for conversational, auditory learning.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                    <LayoutDashboard size={16} />
                    <span>6. Host Exam Control Room</span>
                  </div>
                  <p className="text-[11px] text-white/70">
                    Host institutional CBT exams with matriculation login, candidate tracking, live timers, and automated score reports.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowAboutUsModal(false)}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-cyan-600/20"
              >
                Close & Continue Learning
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
