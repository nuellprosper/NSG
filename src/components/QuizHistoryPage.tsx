import React, { useState } from 'react';
import { ArrowLeft, Target, Search, Clock, Award, PlayCircle, BookOpen, ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';
import { formatSafeDate } from '../utils';
import { isCapacitorNative } from '../lib/capacitor';

interface QuizHistoryPageProps {
  finishedHistory: any[];
  onOpenQuizById: (id: string) => void;
  setActiveTab: (tab: any) => void;
  setToolsSubTab: (subtab: any) => void;
}

export const QuizHistoryPage: React.FC<QuizHistoryPageProps> = ({
  finishedHistory = [],
  onOpenQuizById,
  setActiveTab,
  setToolsSubTab
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const quizzes = finishedHistory.filter((item) => item.type === 'quiz' || item.quizId);

  const filteredQuizzes = quizzes.filter((item) => {
    const title = item.topic || item.title || item.subject || 'Quiz Practice';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <motion.div
      initial={{ x: 20, opacity: 1 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 1 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="space-y-6 pb-24 max-w-4xl mx-auto px-3 sm:px-6 font-sans text-left"
    >
      {/* Top Bar */}
      <div 
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
        className="flex items-center justify-between border-b border-white/10 pb-4"
      >
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white transition-all text-xs font-bold cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>
        <span className="text-xs font-black uppercase tracking-wider text-red-500 flex items-center gap-1.5 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
          <Target size={14} /> Quiz History
        </span>
      </div>

      {/* Title & Description */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Quiz & Mock History
        </h1>
        <p className="text-xs text-white/60 leading-relaxed font-medium">
          Review all your generated quizzes and mock practice sessions. Tap any item to view or retake it instantly.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Search quiz topic or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 bg-[#120F1F] border border-white/10 rounded-2xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-red-500 transition-colors shadow-inner"
        />
      </div>

      {/* Quiz List */}
      {filteredQuizzes.length === 0 ? (
        <div className="bg-[#120F1F] border border-white/5 rounded-3xl p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mx-auto">
            <Target size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Quiz History Found</h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              You haven't generated or completed any quizzes yet. Start taking quizzes in the study tools!
            </p>
          </div>
          <button
            onClick={() => {
              setActiveTab('tools');
              setToolsSubTab('quiz');
            }}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:opacity-95 transition-all cursor-pointer"
          >
            Generate New Quiz
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuizzes.map((item, idx) => {
            const rawTopic = item.topic || item.title || item.subject || 'Quiz Practice';
            const displayTopic = rawTopic.length > 45 ? `${rawTopic.slice(0, 42)}...` : rawTopic;
            const score = item.score !== undefined ? `${item.score}%` : (item.correctCount !== undefined ? `${item.correctCount}/${item.totalQuestions || 10}` : 'Completed');
            const dateStr = formatSafeDate(item.date || item.timestamp, 'Recent');

            return (
              <div
                key={`${item.id || 'quiz-hist'}-${idx}`}
                className="p-4 sm:p-5 rounded-2xl bg-[#131022] border border-white/10 hover:border-red-500/40 transition-all shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group overflow-hidden max-w-full"
              >
                <div className="space-y-1.5 min-w-0 flex-1 w-full overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-red-500/15 text-red-400 text-[9px] font-black uppercase tracking-wider border border-red-500/20 shrink-0">
                      Quiz
                    </span>
                    <span className="text-[10px] text-white/40 flex items-center gap-1 font-medium truncate">
                      <Clock size={11} className="shrink-0" /> {dateStr}
                    </span>
                  </div>
                  <h3 
                    className="text-sm font-bold text-white line-clamp-1 [overflow-wrap:anywhere] break-words break-all group-hover:text-red-400 transition-colors"
                    title={rawTopic}
                  >
                    {displayTopic}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-white/60 font-medium">
                    <span className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
                      <Award size={13} /> Score: {score}
                    </span>
                    <span>•</span>
                    <span className="shrink-0">{item.questions?.length || item.totalQuestions || 10} Questions</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (item.id || item.quizId) {
                      onOpenQuizById(item.id || item.quizId);
                    } else {
                      setActiveTab('tools');
                      setToolsSubTab('quiz');
                    }
                  }}
                  className="w-full sm:w-auto px-4 sm:px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
                >
                  <PlayCircle size={15} className="shrink-0" />
                  <span>Take / Review Quiz</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* USE OMNI OFFLINE BUTTON (Only displayed in native Capacitor APK) */}
      {isCapacitorNative() && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('omni_offline')}
            className="w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/90 via-[#190C2B] to-purple-900/90 border border-purple-500/40 hover:border-purple-400 text-left transition-all shadow-xl group cursor-pointer active:scale-[0.99] flex items-center justify-between gap-4"
          >
            <div className="space-y-1 min-w-0">
              <h4 className="text-sm sm:text-base font-bold text-white tracking-tight group-hover:text-purple-300 transition-colors">
                Use Omni Offline
              </h4>
              <p className="text-xs text-purple-200/70 font-normal">
                Generate quizzes, chat with Omni and Use AI powered tools Offline
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0 group-hover:scale-105 transition-transform">
              <ArrowDown size={20} className="text-purple-300 stroke-[2.5]" />
            </div>
          </button>
        </div>
      )}
    </motion.div>
  );
};
