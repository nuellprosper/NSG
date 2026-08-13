import React, { useState } from 'react';
import { ArrowLeft, Search, Target, FileText, BookMarked, Mic, History, PlayCircle, ChevronRight, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { formatSafeDate } from '../utils';

interface GeneralHistoryPageProps {
  finishedHistory: any[];
  userNotes: any[];
  sessions: any[];
  onOpenQuizById: (id: string) => void;
  setActiveTab: (tab: any) => void;
  setToolsSubTab: (subtab: any) => void;
  setSelectedNote: (note: any) => void;
}

export const GeneralHistoryPage: React.FC<GeneralHistoryPageProps> = ({
  finishedHistory = [],
  userNotes = [],
  sessions = [],
  onOpenQuizById,
  setActiveTab,
  setToolsSubTab,
  setSelectedNote
}) => {
  const [filter, setFilter] = useState<'all' | 'quiz' | 'cbt' | 'notes' | 'recording'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Combine history items
  const combined: any[] = [];

  // Add quizzes & CBTs
  finishedHistory.forEach((item) => {
    const isCbt = item.type === 'cbt' || item.type === 'exam' || item.isCbt;
    combined.push({
      id: item.id || item.quizId,
      category: isCbt ? 'cbt' : 'quiz',
      title: item.topic || item.subject || item.title || (isCbt ? 'CBT Exam Practice' : 'Quiz Practice'),
      subtitle: item.score !== undefined ? `Score: ${item.score}%` : 'Completed',
      date: formatSafeDate(item.date || item.timestamp, 'Recent'),
      rawItem: item
    });
  });

  // Add Notes
  userNotes.forEach((note) => {
    combined.push({
      id: note.id,
      category: 'notes',
      title: note.title || 'Untitled Study Note',
      subtitle: (note.content || '').replace(/[#*`]/g, '').substring(0, 90) + '...',
      date: formatSafeDate(note.date || note.createdAt, 'Saved Note'),
      rawItem: note
    });
  });

  // Add Audio Recordings
  sessions.forEach((sess) => {
    combined.push({
      id: sess.id,
      category: 'recording',
      title: sess.title || sess.topic || 'Recorded Audio Lecture',
      subtitle: sess.duration ? `Duration: ${sess.duration}` : 'Lecture Recording',
      date: formatSafeDate(sess.date, 'Recorded Session'),
      rawItem: sess
    });
  });

  const filteredItems = combined.filter((item) => {
    if (filter !== 'all' && item.category !== filter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q);
  });

  return (
    <div
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
          <History size={14} /> Academic History
        </span>
      </div>

      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Overall Study History
        </h1>
        <p className="text-xs text-white/60 leading-relaxed font-medium">
          Comprehensive timeline of all your quizzes, CBT practice exams, study notes, and lecture recordings.
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {[
          { id: 'all', label: 'All History' },
          { id: 'quiz', label: 'Quizzes' },
          { id: 'cbt', label: 'CBT Exams' },
          { id: 'notes', label: 'Notes' },
          { id: 'recording', label: 'Audio Recordings' }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              filter === f.id
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/20'
                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Search study history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 bg-[#120F1F] border border-white/10 rounded-2xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-red-500 transition-colors shadow-inner"
        />
      </div>

      {/* List */}
      {filteredItems.length === 0 ? (
        <div className="bg-[#120F1F] border border-white/5 rounded-3xl p-10 text-center space-y-3">
          <History size={36} className="text-white/20 mx-auto" />
          <h3 className="text-base font-bold text-white">No Matching History Found</h3>
          <p className="text-xs text-white/50">Try clearing search filters or practice more tools!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item, idx) => {
            const isQuiz = item.category === 'quiz';
            const isCbt = item.category === 'cbt';
            const isNote = item.category === 'notes';
            const isRec = item.category === 'recording';

            return (
              <div
                key={`${item.id || 'gen-hist'}-${idx}`}
                onClick={() => {
                  if (isQuiz) {
                    if (item.id) onOpenQuizById(item.id);
                    else { setActiveTab('tools'); setToolsSubTab('quiz'); }
                  } else if (isCbt) {
                    setActiveTab('tools'); setToolsSubTab('cbt');
                  } else if (isNote) {
                    setSelectedNote(item.rawItem);
                    setActiveTab('tools'); setToolsSubTab('notebook');
                  } else if (isRec) {
                    setActiveTab('tools'); setToolsSubTab('record');
                  }
                }}
                className="p-4 sm:p-5 rounded-2xl bg-[#131022] border border-white/10 hover:border-red-500/40 transition-all shadow-md flex items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isQuiz
                        ? 'bg-red-500/15 border-red-500/30 text-red-400'
                        : isCbt
                        ? 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                        : isNote
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-fuchsia-500/15 border-fuchsia-500/30 text-fuchsia-400'
                    }`}
                  >
                    {isQuiz && <Target size={18} />}
                    {isCbt && <FileText size={18} />}
                    {isNote && <BookMarked size={18} />}
                    {isRec && <Mic size={18} />}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-white/50">
                        {isQuiz ? 'Quiz' : isCbt ? 'CBT Exam' : isNote ? 'Study Note' : 'Recording'}
                      </span>
                      <span className="text-[9px] text-white/30">• {item.date}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-red-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-white/50 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="text-white/40 group-hover:text-white transition-colors shrink-0">
                  <ChevronRight size={18} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
