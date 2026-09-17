import React, { useState, useMemo } from 'react';
import { 
  X, Sparkles, Folder, FileText, File, 
  Image as ImageIcon, Mic, Play, ChevronRight, 
  AlertCircle, RefreshCw, BookOpen, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NoteItem } from '../NotesVaultHome';
import { NotePodcast, MaterialStats } from '../../types/podcast';
import { normalizeHtmlText } from '../../services/podcast/sourceProcessor';

export interface MaterialSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: NoteItem;
  userNotes?: NoteItem[];
  existingPodcast?: NotePodcast | null;
  hasDetectedChanges?: boolean;
  onStartGeneration: (mode: 'entire_note' | 'folder', folderId?: string, folderName?: string) => void;
  onOpenExistingPodcast: () => void;
  onContinueListening: () => void;
  onReviewSources: () => void;
  onUpdatePodcast: () => void;
  theme: 'light' | 'dark';
}

export const MaterialSelectionModal: React.FC<MaterialSelectionModalProps> = ({
  isOpen,
  onClose,
  note,
  userNotes = [],
  existingPodcast,
  hasDetectedChanges = false,
  onStartGeneration,
  onOpenExistingPodcast,
  onContinueListening,
  onReviewSources,
  onUpdatePodcast,
  theme
}) => {
  const [selectedMode, setSelectedMode] = useState<'entire_note' | 'folder'>('entire_note');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');

  // Find all available folders (child notes that are folders or unique folder names)
  const availableFolders = useMemo(() => {
    const list: Array<{ id: string; name: string; count: number }> = [];
    const directChildrenFolders = userNotes.filter(n => n.parentId === note.id || n.folder === note.title);
    
    directChildrenFolders.forEach(f => {
      list.push({
        id: f.id,
        name: f.title || 'Untitled Folder',
        count: (f.attachments?.length || 0) + 1
      });
    });

    if (note.folder && !list.some(f => f.name === note.folder)) {
      list.push({
        id: `folder_${note.folder}`,
        name: note.folder,
        count: 1
      });
    }

    return list;
  }, [note, userNotes]);

  // Compute stats of material to be processed
  const stats: MaterialStats = useMemo(() => {
    let cleanText = normalizeHtmlText(note.content || '');
    let documents = 0;
    let pdfs = 0;
    let images = note.images?.length || 0;
    let audios = note.audioRecordings?.length || 0;

    const attachments = note.attachments || [];
    attachments.forEach(att => {
      const name = (att.name || '').toLowerCase();
      const type = (att.type || '').toLowerCase();
      if (name.endsWith('.pdf') || type.includes('pdf')) {
        pdfs++;
      } else if (name.endsWith('.jpg') || name.endsWith('.png') || name.endsWith('.jpeg') || type.includes('image')) {
        images++;
      } else if (name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.m4a') || name.endsWith('.webm') || type.includes('audio')) {
        audios++;
      } else {
        documents++;
      }
    });

    // If folder mode is selected, compute folder specific items
    if (selectedMode === 'folder' && selectedFolderId) {
      const targetChild = userNotes.find(n => n.id === selectedFolderId);
      if (targetChild) {
        cleanText = normalizeHtmlText(targetChild.content || '');
        documents = 0;
        pdfs = 0;
        images = targetChild.images?.length || 0;
        audios = targetChild.audioRecordings?.length || 0;

        (targetChild.attachments || []).forEach(att => {
          const name = (att.name || '').toLowerCase();
          const type = (att.type || '').toLowerCase();
          if (name.endsWith('.pdf') || type.includes('pdf')) pdfs++;
          else if (type.includes('image')) images++;
          else if (type.includes('audio')) audios++;
          else documents++;
        });
      }
    }

    const words = cleanText.split(/\s+/).filter(Boolean).length;
    const hasContent = words > 10 || pdfs > 0 || documents > 0 || images > 0 || audios > 0;

    return {
      noteWordCount: words,
      textSectionsCount: Math.max(1, Math.ceil(words / 150)),
      documentCount: documents,
      pdfCount: pdfs,
      imageCount: images,
      audioCount: audios,
      totalSources: (words > 10 ? 1 : 0) + documents + pdfs + images + audios,
      hasContent
    };
  }, [note, selectedMode, selectedFolderId, userNotes]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border flex flex-col gap-5 ${
          isDark 
            ? 'bg-[#161722] border-white/10 text-white shadow-purple-950/20' 
            : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/40'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Create Note Podcast</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Choose the material you want Omni and Zeal to discuss.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* If Podcast Already Exists */}
        {existingPodcast && (
          <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${
            isDark ? 'bg-purple-950/20 border-purple-500/30' : 'bg-purple-50 border-purple-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                  Existing Podcast Ready
                </span>
              </div>
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {existingPodcast.messages?.length || 0} discussion turns
              </span>
            </div>

            {hasDetectedChanges && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>New or updated study material detected in this note!</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => {
                  onClose();
                  onContinueListening();
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors shadow-md cursor-pointer"
              >
                <Play size={14} className="fill-white" />
                <span>Continue Listening</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenExistingPodcast();
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <BookOpen size={14} />
                <span>Open Discussion</span>
              </button>

              {hasDetectedChanges && (
                <button
                  onClick={() => {
                    onClose();
                    onUpdatePodcast();
                  }}
                  className="col-span-2 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Update Podcast with New Material</span>
                </button>
              )}

              <button
                onClick={() => {
                  onClose();
                  onReviewSources();
                }}
                className={`col-span-2 text-center text-xs font-medium py-1 transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Review Source Graph & Citations →
              </button>
            </div>
          </div>
        )}

        {/* Material Selection Mode */}
        <div className="flex flex-col gap-2">
          <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Scope of Discussion
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedMode('entire_note')}
              className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                selectedMode === 'entire_note'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-400 shadow-md ring-1 ring-purple-500'
                  : isDark ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-xs">
                <Layers size={14} />
                <span>Entire Note</span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                All text, documents, PDFs, images, and audio
              </p>
            </button>

            <button
              onClick={() => {
                setSelectedMode('folder');
                if (availableFolders.length > 0 && !selectedFolderId) {
                  setSelectedFolderId(availableFolders[0].id);
                }
              }}
              disabled={availableFolders.length === 0}
              className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                availableFolders.length === 0 ? 'opacity-40 cursor-not-allowed' : ''
              } ${
                selectedMode === 'folder'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-400 shadow-md ring-1 ring-purple-500'
                  : isDark ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-xs">
                <Folder size={14} />
                <span>Choose a Folder</span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {availableFolders.length === 0 ? 'No child folders in note' : 'Focus on a specific child folder'}
              </p>
            </button>
          </div>
        </div>

        {/* Folder Select Dropdown if Folder mode */}
        {selectedMode === 'folder' && availableFolders.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Select Folder
            </label>
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs outline-none transition-colors cursor-pointer ${
                isDark ? 'bg-[#1C1E2B] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {availableFolders.map(f => (
                <option key={f.id} value={f.id}>
                  📁 {f.name} ({f.count} items)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Material Breakdown Preview */}
        <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${
          isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Material to be Processed
            </span>
            <span className="text-xs font-semibold text-purple-400">
              {stats.totalSources} total sources
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-blue-400 shrink-0" />
              <span>Note text: <strong>{stats.noteWordCount}</strong> words</span>
            </div>
            <div className="flex items-center gap-2">
              <File size={14} className="text-emerald-400 shrink-0" />
              <span>Documents: <strong>{stats.documentCount}</strong> files</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-red-400 shrink-0" />
              <span>PDFs: <strong>{stats.pdfCount}</strong> files</span>
            </div>
            <div className="flex items-center gap-2">
              <ImageIcon size={14} className="text-amber-400 shrink-0" />
              <span>Images & Diagrams: <strong>{stats.imageCount}</strong></span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <Mic size={14} className="text-pink-400 shrink-0" />
              <span>Audio recordings: <strong>{stats.audioCount}</strong> files</span>
            </div>
          </div>

          {!stats.hasContent && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>
                This note does not have enough content to generate a podcast yet. Please add text, upload documents, PDFs, or audio notes first.
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            onClick={onClose}
            className={`py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            Cancel
          </button>

          <button
            onClick={() => {
              const selectedFolder = availableFolders.find(f => f.id === selectedFolderId);
              onStartGeneration(
                selectedMode, 
                selectedMode === 'folder' ? selectedFolderId : undefined,
                selectedMode === 'folder' ? selectedFolder?.name : undefined
              );
              onClose();
            }}
            disabled={!stats.hasContent}
            className={`flex items-center gap-2 py-2.5 px-5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
              stats.hasContent
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
                : 'bg-slate-700/50 text-slate-500 cursor-not-allowed shadow-none'
            }`}
          >
            <Sparkles size={14} />
            <span>Generate Podcast</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
