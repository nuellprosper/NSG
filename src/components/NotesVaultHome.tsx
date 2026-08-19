import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, BookOpen, FileText, Mic, Image as ImageIcon, 
  File, Plus, Trash2, MoreVertical, Folder, ChevronRight, 
  ChevronDown, X, Sparkles, Pin, Check, ArrowLeft,
  Share2, RefreshCw, Youtube, Clipboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatSafeDate } from '../utils';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  attachments?: any[];
  folder?: string;
  createdAt?: any;
  updatedAt?: any;
  date?: any;
  isPinned?: boolean;
  isTranscribing?: boolean;
  type?: 'pdf' | 'audio' | 'text' | 'document' | 'photo';
  tags?: string[];
  drawings?: any[];
  audioRecordings?: any[];
  images?: string[];
  [key: string]: any;
}

export interface NotesVaultHomeProps {
  theme: 'light' | 'dark';
  user: any;
  currentUserData?: any;
  userNotes: NoteItem[];
  onSelectNote: (note: NoteItem) => void;
  onCreateNote: (initialData?: Partial<NoteItem>) => void;
  onDeleteNote: (noteId: string) => void;
  onBack?: () => void;
  setUserNotification?: (msg: string) => void;
}

export const NotesVaultHome: React.FC<NotesVaultHomeProps> = ({
  theme,
  user,
  currentUserData,
  userNotes = [],
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onBack,
  setUserNotification
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pdf' | 'audio' | 'text' | 'document' | 'photo' | 'youtube' | 'paste'>('all');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'History': true,
    'General': true
  });
  const [noteToDelete, setNoteToDelete] = useState<NoteItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = useRef<boolean>(false);

  // User display name & photo
  const displayName = currentUserData?.fullName || 
                      currentUserData?.name || 
                      user?.displayName || 
                      (user?.email ? user.email.split('@')[0] : 'Nuell Kelechi');
  
  const userPhoto = currentUserData?.photoURL || 
                    currentUserData?.profilePic || 
                    user?.photoURL || 
                    null;

  // Detect note media type
  const getNoteMediaType = (note: NoteItem): 'pdf' | 'audio' | 'text' | 'document' | 'photo' => {
    if (note.type) return note.type;
    const attachments = note.attachments || [];
    const hasPdf = attachments.some(a => 
      a.format === 'pdf' || 
      a.type === 'pdf' || 
      (typeof a.name === 'string' && a.name.toLowerCase().endsWith('.pdf'))
    );
    if (hasPdf) return 'pdf';

    const hasAudio = attachments.some(a => 
      a.format === 'audio' || 
      a.type === 'audio' || 
      (typeof a.name === 'string' && (a.name.toLowerCase().endsWith('.mp3') || a.name.toLowerCase().endsWith('.m4a') || a.name.toLowerCase().endsWith('.wav')))
    ) || (note.audioRecordings && note.audioRecordings.length > 0) || note.isTranscribing || note.audioUrl;
    if (hasAudio) return 'audio';

    const hasPhoto = attachments.some(a => 
      a.format === 'image' || 
      a.type === 'image' || 
      (typeof a.name === 'string' && (a.name.toLowerCase().endsWith('.png') || a.name.toLowerCase().endsWith('.jpg') || a.name.toLowerCase().endsWith('.jpeg')))
    ) || (note.images && note.images.length > 0);
    if (hasPhoto) return 'photo';

    const hasDoc = attachments.some(a => 
      a.format === 'doc' || 
      a.format === 'docx' || 
      a.type === 'document' || 
      (typeof a.name === 'string' && (a.name.toLowerCase().endsWith('.doc') || a.name.toLowerCase().endsWith('.docx') || a.name.toLowerCase().endsWith('.txt')))
    );
    if (hasDoc) return 'document';

    return 'text';
  };

  // Filter notes based on active filter and real-time search query keywords
  const filteredNotes = useMemo(() => {
    return userNotes.filter((note) => {
      // 1. Filter by media type
      if (activeFilter !== 'all') {
        const mediaType = getNoteMediaType(note);
        if (activeFilter === 'pdf' && mediaType !== 'pdf') return false;
        if (activeFilter === 'audio' && mediaType !== 'audio') return false;
        if (activeFilter === 'photo' && mediaType !== 'photo') return false;
        if (activeFilter === 'document' && mediaType !== 'document') return false;
        if (activeFilter === 'text' && mediaType !== 'text') return false;
      }

      // 2. Filter by search query keywords
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (note.title || '').toLowerCase().includes(q);
        const rawContent = typeof note.content === 'string' ? note.content : ((note.content as any)?.text || '');
        const contentMatch = rawContent.toLowerCase().includes(q);
        const folderMatch = (note.folder || '').toLowerCase().includes(q);
        const tagMatch = (note.tags || []).some(t => t.toLowerCase().includes(q));
        const attachmentMatch = (note.attachments || []).some(a => (a.name || '').toLowerCase().includes(q));
        
        return titleMatch || contentMatch || folderMatch || tagMatch || attachmentMatch;
      }

      return true;
    }).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === 'alphabetical') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'oldest') {
        const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : new Date(a.createdAt || a.date || 0).getTime();
        const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : new Date(b.createdAt || b.date || 0).getTime();
        return timeA - timeB;
      } else {
        const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : new Date(a.createdAt || a.date || 0).getTime();
        const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : new Date(b.createdAt || b.date || 0).getTime();
        return timeB - timeA;
      }
    });
  }, [userNotes, activeFilter, searchQuery, sortBy]);

  // Group notes into folders (defaulting to "History") with ID deduplication
  const groupedNotes = useMemo(() => {
    const groups: Record<string, NoteItem[]> = {};
    const seenIds = new Set<string>();
    
    filteredNotes.forEach((note, idx) => {
      const noteKey = note.id ? String(note.id) : `note-${idx}`;
      if (seenIds.has(noteKey)) return;
      seenIds.add(noteKey);

      const folderName = note.folder || 'History';
      if (!groups[folderName]) {
        groups[folderName] = [];
      }
      groups[folderName].push(note);
    });

    return groups;
  }, [filteredNotes]);

  // Long press handler for 0.5s haptic delete trigger
  const handleTouchStart = (note: NoteItem) => {
    isLongPressTriggeredRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(50);
        } catch (e) {
          // ignore
        }
      }
      setNoteToDelete(note);
      setShowDeleteConfirm(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleNoteClick = (note: NoteItem) => {
    if (isLongPressTriggeredRef.current) {
      isLongPressTriggeredRef.current = false;
      return;
    }
    onSelectNote(note);
  };

  const toggleFolder = (folderName: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  const executeDeleteNote = () => {
    if (noteToDelete) {
      onDeleteNote(noteToDelete.id);
      if (setUserNotification) {
        setUserNotification(`Deleted "${noteToDelete.title || 'Note'}"`);
      }
      setShowDeleteConfirm(false);
      setNoteToDelete(null);
    }
  };

  return (
    <div className={`w-full min-h-full flex-1 flex flex-col font-sans select-none transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#090B0E] text-white' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* 1. TOP HEADER BAR: USER AVATAR, NAME, OPTIONS MENU */}
      <div className={`sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between backdrop-blur-md border-b transition-colors ${
        theme === 'dark' 
          ? 'bg-[#0D1017]/90 border-white/10 text-white' 
          : 'bg-white/90 border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                theme === 'dark' ? 'bg-white/5 hover:bg-white/10 text-white/80' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              <FileText size={18} />
            </div>
            <div className="flex flex-col">
              <h1 className={`text-base font-black tracking-tight leading-tight ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Notes
              </h1>
              <span className="text-[10px] font-semibold text-slate-400">Notes &amp; Vault</span>
            </div>
          </div>
        </div>

        {/* Right Menu Options */}
        <div className="relative">
          <button
            onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              theme === 'dark' ? 'hover:bg-white/10 text-white/80' : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Options"
          >
            <MoreVertical size={20} />
          </button>

          <AnimatePresence>
            {showOptionsDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowOptionsDropdown(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  className={`absolute right-0 mt-2 w-52 rounded-2xl p-2 shadow-2xl z-50 border flex flex-col gap-1 ${
                    theme === 'dark' ? 'bg-[#141822] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <button
                    onClick={() => {
                      setShowOptionsDropdown(false);
                      onCreateNote({ title: '', content: '' });
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 text-xs font-bold transition-all text-left cursor-pointer"
                  >
                    <Plus size={15} className="text-blue-400" />
                    <span>New Blank Note</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowOptionsDropdown(false);
                      setSortBy(prev => prev === 'newest' ? 'oldest' : (prev === 'oldest' ? 'alphabetical' : 'newest'));
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 text-xs font-bold transition-all text-left cursor-pointer"
                  >
                    <RefreshCw size={15} className="text-emerald-400" />
                    <span>Sort: {sortBy.toUpperCase()}</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. MAIN SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6 max-w-4xl mx-auto w-full pb-28 custom-scrollbar">
        
        {/* HERO SEARCH & DISCOVERY CARD ("What do you want to find?") */}
        <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border shadow-xl transition-all ${
          theme === 'dark'
            ? 'bg-[#10141D] border-white/10 shadow-black/40'
            : 'bg-white border-slate-200 shadow-slate-200/50'
        }`}>
          <div className="flex flex-col items-center text-center space-y-4 relative z-10">
            {/* Glowing Book Icon Circle (Matching Screenshot) */}
            <div className="relative">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
                <div className={`w-full h-full rounded-full flex items-center justify-center ${
                  theme === 'dark' ? 'bg-[#0B0E14]' : 'bg-white'
                }`}>
                  <BookOpen size={28} className="text-blue-400 animate-pulse" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-400 items-center justify-center text-[8px] font-black text-black">✦</span>
              </span>
            </div>

            {/* Header Title: "What do you want to find?" */}
            <div className="space-y-1">
              <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                What do you want to find?
              </h1>
              <p className={`text-xs max-w-sm mx-auto font-medium ${
                theme === 'dark' ? 'text-white/60' : 'text-slate-500'
              }`}>
                Search keywords, tap formats to filter, or open your notes.
              </p>
            </div>

            {/* Search Input Bar */}
            <div className="w-full max-w-xl relative">
              <div className={`relative flex items-center rounded-2xl border transition-all ${
                theme === 'dark'
                  ? 'bg-[#0A0D13] border-white/10 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
                  : 'bg-slate-50 border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-sm'
              }`}>
                <Search size={18} className="ml-4 text-blue-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Ask about any topic or search keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-3 pr-10 py-3.5 bg-transparent border-none text-xs sm:text-sm font-medium outline-none ${
                    theme === 'dark' ? 'text-white placeholder-white/40' : 'text-slate-900 placeholder-slate-400'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 p-1 rounded-full text-white/40 hover:text-white cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* 6 Format / Filter Pills (Matching Screenshot Grid: Photo, PDF, YouTube, Record Audio, Paste, Document) */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 w-full max-w-xl">
              {/* 1. Photo */}
              <button
                type="button"
                onClick={() => setActiveFilter(activeFilter === 'photo' ? 'all' : 'photo')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                  activeFilter === 'photo'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                    : (theme === 'dark' ? 'bg-[#151922] hover:bg-white/10 text-white/80 border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200')
                }`}
              >
                <ImageIcon size={16} className="text-amber-400 shrink-0" />
                <span className="text-[11px]">Photo</span>
              </button>

              {/* 2. PDF */}
              <button
                type="button"
                onClick={() => setActiveFilter(activeFilter === 'pdf' ? 'all' : 'pdf')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                  activeFilter === 'pdf'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                    : (theme === 'dark' ? 'bg-[#151922] hover:bg-white/10 text-white/80 border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200')
                }`}
              >
                <FileText size={16} className="text-rose-400 shrink-0" />
                <span className="text-[11px]">PDF</span>
              </button>

              {/* 3. YouTube */}
              <button
                type="button"
                onClick={() => {
                  const url = prompt("Enter YouTube Lecture URL to import note:");
                  if (url) {
                    onCreateNote({
                      title: 'YouTube Lecture Note',
                      content: `Imported from YouTube Lecture: ${url}\n\nKey Concepts:\n- Intro\n- Main Analysis\n- Summary`,
                      folder: 'History'
                    });
                  }
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                  theme === 'dark' ? 'bg-[#151922] hover:bg-white/10 text-white/80 border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                }`}
              >
                <Youtube size={16} className="text-red-500 shrink-0" />
                <span className="text-[11px]">YouTube</span>
              </button>

              {/* 4. Record Audio */}
              <button
                type="button"
                onClick={() => setActiveFilter(activeFilter === 'audio' ? 'all' : 'audio')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                  activeFilter === 'audio'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                    : (theme === 'dark' ? 'bg-[#151922] hover:bg-white/10 text-white/80 border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200')
                }`}
              >
                <Mic size={16} className="text-emerald-400 shrink-0" />
                <span className="text-[11px]">Audio</span>
              </button>

              {/* 5. Paste */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    const clipboardText = await navigator.clipboard.readText();
                    if (clipboardText) {
                      onCreateNote({
                        title: 'Pasted Notes',
                        content: clipboardText,
                        folder: 'History'
                      });
                      if (setUserNotification) setUserNotification('Created note from clipboard!');
                    } else {
                      onCreateNote({ title: 'New Note', content: '', folder: 'History' });
                    }
                  } catch (e) {
                    onCreateNote({ title: 'New Note', content: '', folder: 'History' });
                  }
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                  theme === 'dark' ? 'bg-[#151922] hover:bg-white/10 text-white/80 border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                }`}
              >
                <Clipboard size={16} className="text-cyan-400 shrink-0" />
                <span className="text-[11px]">Paste</span>
              </button>

              {/* 6. Document */}
              <button
                type="button"
                onClick={() => setActiveFilter(activeFilter === 'document' ? 'all' : 'document')}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 p-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer border ${
                  activeFilter === 'document'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                    : (theme === 'dark' ? 'bg-[#151922] hover:bg-white/10 text-white/80 border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200')
                }`}
              >
                <File size={16} className="text-blue-400 shrink-0" />
                <span className="text-[11px]">Document</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. "YOUR NOTES" SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className={`text-base sm:text-lg font-black tracking-tight ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Your Notes
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {filteredNotes.length}
              </span>
            </div>

            <button
              onClick={() => onCreateNote({ title: '', content: '', folder: 'History' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>New Note</span>
            </button>
          </div>

          {/* Search Result Summary Banner (if searching) */}
          {searchQuery && (
            <div className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
              theme === 'dark' ? 'bg-white/5 border-white/10 text-white/70' : 'bg-slate-100 border-slate-200 text-slate-900'
            }`}>
              <span>Showing results for <strong className="font-bold">"{searchQuery}"</strong> ({filteredNotes.length} found)</span>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-blue-400 hover:underline font-bold text-[11px] cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          {/* FOLDERS & NOTES ACCORDION LIST */}
          {filteredNotes.length === 0 ? (
            <div className={`rounded-3xl border p-10 text-center space-y-4 ${
              theme === 'dark' ? 'bg-[#10141D] border-white/10' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
                <FileText size={28} />
              </div>
              <div className="space-y-1">
                <h3 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {searchQuery ? 'No Notes Match Your Search' : 'No Notes in this Category'}
                </h3>
                <p className={`text-xs max-w-sm mx-auto ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>
                  {searchQuery 
                    ? 'Try searching with different keywords or switch filters above.'
                    : 'Tap "+ New Note" to create a new study note or record audio.'}
                </p>
              </div>
              <button
                onClick={() => onCreateNote({ title: '', content: '', folder: 'History' })}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                Create Note Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedNotes).map(([folderName, notesInFolder]) => {
                const isExpanded = expandedFolders[folderName] !== false;

                return (
                  <div 
                    key={folderName} 
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      theme === 'dark' ? 'bg-[#11151F] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    {/* Folder Header Bar (History / Custom Folder) */}
                    <button
                      type="button"
                      onClick={() => toggleFolder(folderName)}
                      className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors cursor-pointer ${
                        theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Folder size={18} className="text-amber-400 fill-amber-400/20" />
                        <span className={`text-sm font-bold tracking-tight ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          {folderName}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          theme === 'dark' ? 'bg-white/10 text-white/60' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {notesInFolder.length}
                        </span>
                      </div>
                      
                      {isExpanded ? (
                        <ChevronDown size={18} className="text-white/40" />
                      ) : (
                        <ChevronRight size={18} className="text-white/40" />
                      )}
                    </button>

                    {/* Folder Notes Grid */}
                    {isExpanded && (
                      <div className="p-3 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {notesInFolder.map((note, noteIdx) => {
                          const mediaType = getNoteMediaType(note);
                          const rawContent = typeof note.content === 'string' ? note.content : ((note.content as any)?.text || '');
                          const cleanSnippet = rawContent ? rawContent.replace(/[#*`_!\[\]\(\)]/g, '').substring(0, 80) + '...' : 'No text content';
                          const dateStr = formatSafeDate(note.updatedAt || note.createdAt || note.date, 'Recently');

                          return (
                            <motion.div
                              key={`${note.id || 'note'}-${noteIdx}`}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => handleNoteClick(note)}
                              onMouseDown={() => handleTouchStart(note)}
                              onMouseUp={handleTouchEnd}
                              onMouseLeave={handleTouchEnd}
                              onTouchStart={() => handleTouchStart(note)}
                              onTouchEnd={handleTouchEnd}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between space-y-3 select-none ${
                                theme === 'dark' 
                                  ? 'bg-[#151924] border-white/10 hover:border-blue-500/50 hover:bg-[#1A1F2C]' 
                                  : 'bg-slate-50 border-slate-200 hover:border-blue-500/50 hover:bg-white shadow-sm'
                              }`}
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {mediaType === 'pdf' && <FileText size={14} className="text-rose-400 shrink-0" />}
                                    {mediaType === 'audio' && <Mic size={14} className="text-emerald-400 shrink-0" />}
                                    {mediaType === 'photo' && <ImageIcon size={14} className="text-amber-400 shrink-0" />}
                                    {mediaType === 'document' && <File size={14} className="text-blue-400 shrink-0" />}
                                    {mediaType === 'text' && <FileText size={14} className="text-cyan-400 shrink-0" />}
                                    
                                    <h3 className={`text-xs sm:text-sm font-bold truncate ${
                                      theme === 'dark' ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-600'
                                    }`}>
                                      {note.title || 'Untitled Note'}
                                    </h3>
                                  </div>

                                  {note.isPinned && (
                                    <Pin size={12} className="text-amber-400 fill-amber-400 shrink-0" />
                                  )}
                                </div>

                                <p className={`text-[11px] line-clamp-2 leading-relaxed ${
                                  theme === 'dark' ? 'text-white/60' : 'text-slate-500'
                                }`}>
                                  {cleanSnippet || 'No additional text content'}
                                </p>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                                <span className={theme === 'dark' ? 'text-white/40' : 'text-slate-400'}>
                                  {dateStr}
                                </span>
                                
                                <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[9px] ${
                                  mediaType === 'pdf' ? 'bg-rose-500/10 text-rose-400' :
                                  mediaType === 'audio' ? 'bg-emerald-500/10 text-emerald-400' :
                                  mediaType === 'photo' ? 'bg-amber-500/10 text-amber-400' :
                                  'bg-blue-500/10 text-blue-400'
                                }`}>
                                  {mediaType}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && noteToDelete && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm rounded-2xl bg-[#141822] border border-white/10 p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Delete Note?</h3>
                  <p className="text-xs text-white/60">"{noteToDelete.title || 'Untitled Note'}" will be permanently removed.</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setNoteToDelete(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDeleteNote}
                  className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
