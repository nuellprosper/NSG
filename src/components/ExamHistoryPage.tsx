import React, { useState } from 'react';
import { ArrowLeft, Award, Search, Clock, PlayCircle, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { formatSafeDate } from '../utils';

interface ExamHistoryPageProps {
  finishedHistory: any[];
  setActiveTab: (tab: any) => void;
  setToolsSubTab: (subtab: any) => void;
}

export const ExamHistoryPage: React.FC<ExamHistoryPageProps> = ({
  finishedHistory = [],
  setActiveTab,
  setToolsSubTab
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const exams = finishedHistory.filter((item) => item.type === 'cbt' || item.type === 'exam' || item.isCbt);

  const filteredExams = exams.filter((item) => {
    const title = item.topic || item.subject || item.title || 'CBT Practice Exam';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 pb-24 max-w-4xl mx-auto px-3 sm:px-6 font-sans text-left"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white transition-all text-xs font-bold cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>
        <span className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
          <FileText size={14} /> CBT History
        </span>
      </div>

      {/* Title & Description */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          CBT Exam Practice History
        </h1>
        <p className="text-xs text-white/60 leading-relaxed font-medium">
          Detailed history of all past computer-based test (CBT) mock exams and timed test simulations.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Search CBT subject or topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 bg-[#120F1F] border border-white/10 rounded-2xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
        />
      </div>

      {/* Exam List */}
      {filteredExams.length === 0 ? (
        <div className="bg-[#120F1F] border border-white/5 rounded-3xl p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto">
            <FileText size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No CBT Exam History</h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              You haven't attempted any CBT exams yet. Practice exams to track your accuracy and speed!
            </p>
          </div>
          <button
            onClick={() => {
              setActiveTab('tools');
              setToolsSubTab('cbt');
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:opacity-95 transition-all cursor-pointer"
          >
            Start CBT Exam Practice
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExams.map((item, idx) => {
            const subject = item.topic || item.subject || item.title || 'CBT Practice Exam';
            const score = item.score !== undefined ? `${item.score}%` : 'Completed';
            const dateStr = formatSafeDate(item.date || item.timestamp, 'Recent');

            return (
              <div
                key={item.id || idx}
                className="p-4 sm:p-5 rounded-2xl bg-[#131022] border border-white/10 hover:border-purple-500/40 transition-all shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-400 text-[9px] font-black uppercase tracking-wider border border-purple-500/20">
                      CBT Exam
                    </span>
                    <span className="text-[10px] text-white/40 flex items-center gap-1 font-medium">
                      <Clock size={11} /> {dateStr}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                    {subject}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-white/60 font-medium">
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <Award size={13} /> Score: {score}
                    </span>
                    <span>•</span>
                    <span>Timed Mock Exam</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('tools');
                    setToolsSubTab('cbt');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 active:scale-95"
                >
                  <PlayCircle size={15} />
                  <span>Launch CBT Exam</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
