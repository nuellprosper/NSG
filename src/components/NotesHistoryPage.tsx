import React, { useState } from 'react';
import { ArrowLeft, BookMarked, Search, Clock, FileText, ChevronRight, ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';
import { formatSafeDate } from '../utils';
import { isCapacitorNative } from '../lib/capacitor';

interface NotesHistoryPageProps {
  userNotes: any[];
  setActiveTab: (tab: any) => void;
  setToolsSubTab: (subtab: any) => void;
  setSelectedNote: (note: any) => void;
}

export const NotesHistoryPage: React.FC<NotesHistoryPageProps> = ({
  userNotes = [],
  setActiveTab,
  setToolsSubTab,
  setSelectedNote
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotes = userNotes.filter((note) => {
    const title = note.title || 'Untitled Study Note';
    const content = note.content || '';
    const q = searchQuery.toLowerCase();
    return title.toLowerCase().includes(q) || content.toLowerCase().includes(q);
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
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white transition-all text-xs font-bold cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>
        <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <BookMarked size={14} /> Notes History
        </span>
      </div>

      {/* Title & Description */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Study Notes History
        </h1>
        <p className="text-xs text-white/60 leading-relaxed font-medium">
          Access all your generated study notes, summaries, and AI-transcribed lecture notes.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          placeholder="Search saved notes or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 bg-[#120F1F] border border-white/10 rounded-2xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
        />
      </div>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="bg-[#120F1F] border border-white/5 rounded-3xl p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
            <BookMarked size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Notes Saved Yet</h3>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              You haven't saved any study notes. Create notes from lecture recordings or AI summaries!
            </p>
          </div>
          <button
            onClick={() => {
              setActiveTab('tools');
              setToolsSubTab('notebook');
            }}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:opacity-95 transition-all cursor-pointer"
          >
            Create / Open Notebook
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note, idx) => {
            const title = note.title || 'Untitled Study Note';
            const snippet = (note.content || '').replace(/[#*`]/g, '').substring(0, 120) + '...';
            const dateStr = formatSafeDate(note.date || note.createdAt, 'Saved Note');

            return (
              <div
                key={`${note.id || 'note-hist'}-${idx}`}
                onClick={() => {
                  setSelectedNote(note);
                  setActiveTab('tools');
                  setToolsSubTab('notebook');
                }}
                className="p-4 sm:p-5 rounded-2xl bg-[#131022] border border-white/10 hover:border-emerald-500/40 transition-all shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[9px] font-black uppercase tracking-wider border border-emerald-500/20">
                      Note
                    </span>
                    <span className="text-[10px] text-white/40 flex items-center gap-1 font-medium">
                      <Clock size={11} /> {dateStr}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                    {snippet}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs group-hover:translate-x-1 transition-transform shrink-0">
                  <span>Open Note</span>
                  <ChevronRight size={16} />
                </div>
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
