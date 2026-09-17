import React, { useState } from 'react';
import { 
  X, ExternalLink, FileText, BookOpen, 
  Image as ImageIcon, Mic, File, ChevronRight, 
  CheckCircle2, Layers, Search, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SourceNode, NotePodcastMessage, NoteSourceGraph } from '../../types/podcast';
import { getSourcesForMessage } from '../../services/podcast/sourceGraphEngine';

export interface SourceTraceabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  graph: NoteSourceGraph;
  selectedMessage?: NotePodcastMessage | null;
  allMessages: NotePodcastMessage[];
  onOpenPdf?: (pdfUrl: string, name: string) => void;
  onOpenImage?: (imageUrl: string) => void;
  theme: 'light' | 'dark';
}

export const SourceTraceabilityModal: React.FC<SourceTraceabilityModalProps> = ({
  isOpen,
  onClose,
  graph,
  selectedMessage,
  allMessages,
  onOpenPdf,
  onOpenImage,
  theme
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'message_sources' | 'all_sources'>(
    selectedMessage ? 'message_sources' : 'all_sources'
  );
  const [selectedSourceDetail, setSelectedSourceDetail] = useState<SourceNode | null>(null);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  // Sources attached to selected message
  const messageSources = selectedMessage 
    ? getSourcesForMessage(graph, selectedMessage) 
    : [];

  // All sources in graph
  const allSources = Object.values(graph.nodes);

  const displayedSources = (activeTab === 'message_sources' && selectedMessage ? messageSources : allSources)
    .filter(s => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.extractedContent.toLowerCase().includes(q) || s.type.toLowerCase().includes(q);
    });

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'pdf_page':
        return <BookOpen size={15} className="text-red-400" />;
      case 'image':
        return <ImageIcon size={15} className="text-amber-400" />;
      case 'audio':
      case 'audio_segment':
        return <Mic size={15} className="text-pink-400" />;
      case 'document':
        return <File size={15} className="text-emerald-400" />;
      default:
        return <FileText size={15} className="text-blue-400" />;
    }
  };

  const getSourceTypeLabel = (src: SourceNode) => {
    if (src.type === 'pdf_page') return `PDF Page ${src.pageNumber || ''}`;
    if (src.type === 'audio_segment') return `Audio Segment ${src.sectionIndex || ''}`;
    if (src.type === 'text_section') return `Note Section ${src.sectionIndex || ''}`;
    if (src.type === 'note_text') return 'Note Content';
    if (src.type === 'pdf') return 'PDF Document';
    if (src.type === 'image') return 'Visual Diagram';
    if (src.type === 'audio') return 'Voice Recording';
    return 'Document';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className={`w-full max-w-2xl max-h-[85vh] rounded-3xl p-6 shadow-2xl border flex flex-col gap-4 ${
          isDark 
            ? 'bg-[#161722] border-white/10 text-white shadow-purple-950/20' 
            : 'bg-white border-slate-200 text-slate-800 shadow-slate-300/40'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Source Traceability & Graph</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {selectedMessage 
                  ? `Verified citations supporting this ${selectedMessage.speaker === 'omni' ? 'Omni' : 'Zeal'} point` 
                  : 'All grounded sources mapped into this Note Podcast'}
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

        {/* Selected Message Banner if applicable */}
        {selectedMessage && (
          <div className={`p-3 rounded-2xl border flex flex-col gap-1.5 ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">
              {selectedMessage.speaker.toUpperCase()} EXPLANATION
            </span>
            <p className="text-xs italic line-clamp-2 text-slate-300">
              "{selectedMessage.text}"
            </p>
          </div>
        )}

        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {selectedMessage && (
            <div className={`flex p-1 rounded-xl border self-start ${
              isDark ? 'bg-black/30 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setActiveTab('message_sources')}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'message_sources'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Attached Sources ({messageSources.length})
              </button>
              <button
                onClick={() => setActiveTab('all_sources')}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'all_sources'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Sources ({allSources.length})
              </button>
            </div>
          )}

          <div className={`relative flex-1 max-w-xs ${!selectedMessage ? 'max-w-full' : ''}`}>
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search extracted citations..."
              className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs outline-none transition-colors ${
                isDark ? 'bg-[#1C1E2B] border-white/10 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>
        </div>

        {/* Source List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
          {displayedSources.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center justify-center gap-2">
              <Layers size={28} className="text-slate-600" />
              <p className="text-xs text-slate-500">No matching sources found in the source graph.</p>
            </div>
          ) : (
            displayedSources.map((src) => {
              const isSelected = selectedSourceDetail?.id === src.id;

              return (
                <div
                  key={src.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2 ${
                    isSelected 
                      ? 'border-purple-500 bg-purple-500/10'
                      : isDark ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 rounded-xl bg-black/20 shrink-0">
                        {getSourceIcon(src.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold truncate block">{src.name}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 shrink-0">
                            {getSourceTypeLabel(src)}
                          </span>
                        </div>
                        {src.folderName && (
                          <span className="text-[10px] text-slate-400">Folder: {src.folderName}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {src.mediaUrl && (src.type === 'pdf' || src.type === 'pdf_page') && onOpenPdf && (
                        <button
                          onClick={() => onOpenPdf(src.mediaUrl!, src.name)}
                          className="flex items-center gap-1 py-1 px-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <ExternalLink size={12} />
                          <span>View PDF</span>
                        </button>
                      )}

                      {src.mediaUrl && src.type === 'image' && onOpenImage && (
                        <button
                          onClick={() => onOpenImage(src.mediaUrl!)}
                          className="flex items-center gap-1 py-1 px-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600 text-amber-200 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <ExternalLink size={12} />
                          <span>View Image</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedSourceDetail(isSelected ? null : src)}
                        className={`p-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isSelected ? 'Collapse' : 'Details'}
                      </button>
                    </div>
                  </div>

                  {/* Summary / Extracted Content Snippet */}
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {isSelected ? src.extractedContent : (src.summary || src.extractedContent.slice(0, 180) + '...')}
                  </p>

                  {/* Provenance Metadata if expanded */}
                  {isSelected && (
                    <div className={`mt-2 pt-2 border-t text-[11px] flex flex-wrap gap-4 ${
                      isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'
                    }`}>
                      <span>Content Hash: <code>{src.contentHash.slice(0, 12)}</code></span>
                      <span>Processed: {new Date(src.processedAt).toLocaleTimeString()}</span>
                      {src.metadata?.wordCount && <span>Words: {src.metadata.wordCount}</span>}
                      {src.metadata?.pageCount && <span>Pages: {src.metadata.pageCount}</span>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <CheckCircle2 size={13} className="text-emerald-400" />
            <span>100% Verified against note documents & images</span>
          </div>

          <button
            onClick={onClose}
            className={`py-2 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            Close Inspector
          </button>
        </div>
      </motion.div>
    </div>
  );
};
