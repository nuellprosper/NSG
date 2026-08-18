import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Cloud, Share2, MoreVertical, Plus, Bold, Italic, 
  Mic, Image as ImageIcon, Edit3, List, CheckSquare, AlignLeft,
  ChevronDown, X, Play, Pause, RotateCcw, RotateCw, Trash2,
  FileText, Download, Check, Upload, Palette, Type, HighlightingIcon,
  Folder, Sparkles, Volume2, Move, Scissors
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NoteItem } from './NotesVaultHome';

export interface NoteEditorPageProps {
  note: NoteItem;
  theme: 'light' | 'dark';
  onBack: () => void;
  onSaveNote: (updatedNote: NoteItem) => void;
  onDeleteNote?: (noteId: string) => void;
  onShareAsCourse?: (courseData: any) => void;
  setUserNotification?: (msg: string) => void;
  onStartPodcast?: (sourceText: string) => void;
  onSetQuiz?: (note: NoteItem) => void;
}

interface DrawingBlock {
  id: string;
  dataUrl: string;
  createdAt: number;
  caption?: string;
}

interface AudioBlock {
  id: string;
  audioUrl: string;
  duration: number; // in seconds
  createdAt: number;
  name: string;
}

interface DocumentBlock {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  extractedText?: string;
}

export const NoteEditorPage: React.FC<NoteEditorPageProps> = ({
  note,
  theme,
  onBack,
  onSaveNote,
  onDeleteNote,
  onShareAsCourse,
  setUserNotification,
  onStartPodcast,
  onSetQuiz,
}) => {
  // Main note state
  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState(note.content || '');
  const [folder, setFolder] = useState(note.folder || 'History');
  const [textColor, setTextColor] = useState<string>('default');
  const [fontFamily, setFontFamily] = useState<string>('sans');

  // Interactive blocks attached to the note
  const [drawings, setDrawings] = useState<DrawingBlock[]>(note.drawings || []);
  const [audioRecordings, setAudioRecordings] = useState<AudioBlock[]>(note.audioRecordings || []);
  const [documents, setDocuments] = useState<DocumentBlock[]>(note.attachments || []);
  const [images, setImages] = useState<string[]>(note.images || []);

  // UI States
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Drawing Canvas Modal State
  const [isDrawingOpen, setIsDrawingOpen] = useState(false);
  const [activeDrawingId, setActiveDrawingId] = useState<string | null>(null);
  const [drawingColor, setDrawingColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(4);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingContextActionId, setDrawingContextActionId] = useState<string | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio Playback State (for embedded audio player with percentage)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({}); // id -> percentage
  const [audioCurrentTimes, setAudioCurrentTimes] = useState<Record<string, number>>({}); // id -> currentTime
  const activeAudioElementRef = useRef<HTMLAudioElement | null>(null);

  // Course Share Form State
  const [courseFaculty, setCourseFaculty] = useState('Faculty of Engineering');
  const [courseDepartment, setCourseDepartment] = useState('Computer Engineering');
  const [courseAbout, setCourseAbout] = useState(note.content ? note.content.slice(0, 160) : 'Comprehensive study notes and reference materials.');
  const [courseCode, setCourseCode] = useState('CPE 301');

  // Input refs
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state with prop
  useEffect(() => {
    setTitle(note.title || '');
    setContent(note.content || '');
    setFolder(note.folder || 'History');
    setDrawings(note.drawings || []);
    setAudioRecordings(note.audioRecordings || []);
    setDocuments(note.attachments || []);
    setImages(note.images || []);
  }, [note.id]);

  // Auto-save debounced
  useEffect(() => {
    const handler = setTimeout(() => {
      const updated: NoteItem = {
        ...note,
        title: title || 'Untitled Note',
        content,
        folder,
        drawings,
        audioRecordings,
        attachments: documents,
        images,
        updatedAt: new Date().toISOString(),
      };
      onSaveNote(updated);
    }, 600);

    return () => clearTimeout(handler);
  }, [title, content, folder, drawings, audioRecordings, documents, images]);

  // Apply bold to selected text in textarea
  const handleApplyBold = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    if (start === end) {
      // Insert placeholder bold
      const newText = currentVal.substring(0, start) + '**bold text**' + currentVal.substring(end);
      setContent(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 2, start + 11);
      }, 50);
    } else {
      const selected = currentVal.substring(start, end);
      const isAlreadyBold = selected.startsWith('**') && selected.endsWith('**');
      let newText = '';
      if (isAlreadyBold) {
        newText = currentVal.substring(0, start) + selected.slice(2, -2) + currentVal.substring(end);
      } else {
        newText = currentVal.substring(0, start) + `**${selected}**` + currentVal.substring(end);
      }
      setContent(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + selected.length + 4);
      }, 50);
    }
  };

  // Apply Italic
  const handleApplyItalic = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    if (start === end) {
      const newText = currentVal.substring(0, start) + '*italic text*' + currentVal.substring(end);
      setContent(newText);
    } else {
      const selected = currentVal.substring(start, end);
      const newText = currentVal.substring(0, start) + `*${selected}*` + currentVal.substring(end);
      setContent(newText);
    }
  };

  // Apply Heading (Makes the current line large bold header)
  const handleApplyHeading = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const pos = textarea.selectionStart;
    const currentVal = textarea.value;

    // Find start of current line
    const prevNewline = currentVal.lastIndexOf('\n', pos - 1);
    const lineStart = prevNewline === -1 ? 0 : prevNewline + 1;
    const nextNewline = currentVal.indexOf('\n', pos);
    const lineEnd = nextNewline === -1 ? currentVal.length : nextNewline;
    const currentLine = currentVal.substring(lineStart, lineEnd);

    // Toggle Heading 1
    let newLine = currentLine;
    if (currentLine.startsWith('# ')) {
      newLine = currentLine.substring(2);
    } else if (currentLine.startsWith('## ')) {
      newLine = '# ' + currentLine.substring(3);
    } else {
      newLine = '# ' + currentLine;
    }

    const newText = currentVal.substring(0, lineStart) + newLine + currentVal.substring(lineEnd);
    setContent(newText);
    setShowPlusMenu(false);
    if (setUserNotification) setUserNotification('Heading applied');
  };

  // Apply Subtopic (Heading 2)
  const handleApplySubtopic = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const pos = textarea.selectionStart;
    const currentVal = textarea.value;

    const prevNewline = currentVal.lastIndexOf('\n', pos - 1);
    const lineStart = prevNewline === -1 ? 0 : prevNewline + 1;
    const nextNewline = currentVal.indexOf('\n', pos);
    const lineEnd = nextNewline === -1 ? currentVal.length : nextNewline;
    const currentLine = currentVal.substring(lineStart, lineEnd);

    let newLine = currentLine;
    if (currentLine.startsWith('## ')) {
      newLine = currentLine.substring(3);
    } else if (currentLine.startsWith('# ')) {
      newLine = '## ' + currentLine.substring(2);
    } else {
      newLine = '## ' + currentLine;
    }

    const newText = currentVal.substring(0, lineStart) + newLine + currentVal.substring(lineEnd);
    setContent(newText);
    setShowPlusMenu(false);
    if (setUserNotification) setUserNotification('Subtopic applied');
  };

  // Apply Highlight
  const handleApplyHighlight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    if (start !== end) {
      const selected = currentVal.substring(start, end);
      const newText = currentVal.substring(0, start) + `==${selected}==` + currentVal.substring(end);
      setContent(newText);
    }
    setShowPlusMenu(false);
  };

  // Add bullet list or check item
  const handleAddBullet = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const pos = textarea.selectionStart;
    const currentVal = textarea.value;
    const newText = currentVal.substring(0, pos) + '\n- ' + currentVal.substring(pos);
    setContent(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(pos + 3, pos + 3);
    }, 50);
  };

  // Handle PDF / Document Upload
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result as string;
      const newDoc: DocumentBlock = {
        id: `doc-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
        url: result,
      };

      setDocuments(prev => [...prev, newDoc]);
      setShowPlusMenu(false);
      if (setUserNotification) setUserNotification(`Added document: ${file.name}`);
    };

    reader.readAsDataURL(file);
  };

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImages(prev => [...prev, result]);
      setShowPlusMenu(false);
      if (setUserNotification) setUserNotification(`Image added to note`);
    };

    reader.readAsDataURL(file);
  };

  // Voice Audio Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Url = reader.result as string;
          const newAudio: AudioBlock = {
            id: `audio-${Date.now()}`,
            audioUrl: base64Url,
            duration: recordingSeconds || 5,
            createdAt: Date.now(),
            name: `Voice Record #${audioRecordings.length + 1}`,
          };
          setAudioRecordings(prev => [...prev, newAudio]);
          if (setUserNotification) setUserNotification('Voice recording added to note!');
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Audio recording failed', err);
      if (setUserNotification) setUserNotification('Microphone access required for recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  // Audio playback controller with percentage updates
  const togglePlayAudio = (audioBlock: AudioBlock) => {
    if (playingAudioId === audioBlock.id) {
      // Pause
      if (activeAudioElementRef.current) {
        activeAudioElementRef.current.pause();
      }
      setPlayingAudioId(null);
    } else {
      // Stop any existing playback
      if (activeAudioElementRef.current) {
        activeAudioElementRef.current.pause();
      }

      const audio = new Audio(audioBlock.audioUrl);
      activeAudioElementRef.current = audio;
      setPlayingAudioId(audioBlock.id);

      audio.ontimeupdate = () => {
        const current = audio.currentTime;
        const total = audio.duration || audioBlock.duration || 1;
        const pct = Math.min(100, Math.round((current / total) * 100));
        setAudioProgress(prev => ({ ...prev, [audioBlock.id]: pct }));
        setAudioCurrentTimes(prev => ({ ...prev, [audioBlock.id]: Math.round(current) }));
      };

      audio.onended = () => {
        setPlayingAudioId(null);
        setAudioProgress(prev => ({ ...prev, [audioBlock.id]: 0 }));
      };

      audio.play().catch(e => console.error('Audio play error', e));
    }
  };

  const skipAudio = (audioBlock: AudioBlock, seconds: number) => {
    if (activeAudioElementRef.current && playingAudioId === audioBlock.id) {
      activeAudioElementRef.current.currentTime = Math.max(0, activeAudioElementRef.current.currentTime + seconds);
    }
  };

  // Open Drawing Canvas Modal
  const openNewDrawing = () => {
    setActiveDrawingId(null);
    setIsDrawingOpen(true);
    setTimeout(() => {
      initCanvas();
    }, 100);
  };

  const editDrawing = (drawing: DrawingBlock) => {
    setActiveDrawingId(drawing.id);
    setIsDrawingOpen(true);
    setTimeout(() => {
      initCanvas(drawing.dataUrl);
    }, 100);
  };

  const initCanvas = (initialDataUrl?: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 340;
    canvas.height = 260;

    // Background
    ctx.fillStyle = '#12141A';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (initialDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = initialDataUrl;
    }
  };

  const startCanvasDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = drawingColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const drawOnCanvas = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopCanvasDrawing = () => {
    setIsDrawing(false);
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    if (activeDrawingId) {
      // Update existing drawing
      setDrawings(prev => prev.map(d => d.id === activeDrawingId ? { ...d, dataUrl } : d));
    } else {
      // Add new drawing
      const newDrawing: DrawingBlock = {
        id: `draw-${Date.now()}`,
        dataUrl,
        createdAt: Date.now(),
        caption: 'Handwritten diagram',
      };
      setDrawings(prev => [...prev, newDrawing]);
    }

    setIsDrawingOpen(false);
    if (setUserNotification) setUserNotification('Drawing saved into note!');
  };

  // Course Sharing Action
  const handlePublishCourse = () => {
    const coursePayload = {
      id: `course-${Date.now()}`,
      title: title || 'Course Note',
      courseCode: courseCode || 'GEN 101',
      faculty: courseFaculty,
      department: courseDepartment,
      description: courseAbout,
      about: courseAbout,
      content: content,
      attachments: documents,
      images,
      drawings,
      audioRecordings,
      createdAt: new Date().toISOString(),
      downloadsCount: 0,
      rating: 5.0,
      isVerified: true,
    };

    if (onShareAsCourse) {
      onShareAsCourse(coursePayload);
    }

    // Store in local storage for durable offline backup
    try {
      const existingShared = JSON.parse(localStorage.getItem('shared_user_courses') || '[]');
      existingShared.push(coursePayload);
      localStorage.setItem('shared_user_courses', JSON.stringify(existingShared));
    } catch (e) {
      console.warn('LocalStorage course cache', e);
    }

    setShowShareModal(false);
    if (setUserNotification) {
      setUserNotification(`Successfully shared "${title}" to ${courseDepartment} courses!`);
    }
  };

  // Color options
  const colorOptions = [
    { label: 'White (Default)', value: 'default', color: '#FFFFFF' },
    { label: 'Sky Blue', value: 'text-sky-400', color: '#38BDF8' },
    { label: 'Emerald Green', value: 'text-emerald-400', color: '#34D399' },
    { label: 'Amber Gold', value: 'text-amber-400', color: '#FBBF24' },
    { label: 'Rose Coral', value: 'text-rose-400', color: '#FB7185' },
    { label: 'Lavender Gray', value: 'text-slate-300', color: '#CBD5E1' },
  ];

  return (
    <div className={`w-full flex-1 flex flex-col h-full min-h-0 overflow-hidden select-none font-sans relative ${
      theme === 'dark' ? 'bg-[#0A0C10] text-white' : 'bg-[#F8FAFC] text-[#0F172A]'
    }`}>
      {/* 1. TOP BAR (Folder dropdown, Cloud Sync status, Upload/Share course icon, More menu) */}
      <div className={`sticky top-0 z-30 px-3 sm:px-6 py-2.5 flex items-center justify-between border-b shrink-0 backdrop-blur-md ${
        theme === 'dark' ? 'bg-[#0E1117]/95 border-white/10 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className={`p-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer text-xs font-semibold ${
              theme === 'dark' ? 'hover:bg-white/10 text-white/80' : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Back to Vault"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Folder pill (e.g., "History") */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-medium">
            <Folder size={13} className="text-amber-400" />
            <span className="truncate max-w-[120px]">{folder}</span>
          </div>
        </div>

        {/* Action icons on top right */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Cloud Synced Icon */}
          <div 
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold"
            title="Saved & Synced to Storage"
          >
            <Cloud size={14} />
            <span className="hidden sm:inline">Synced</span>
          </div>

          {/* Upload / Share as Course Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            title="Share this note as a public or class course"
          >
            <Upload size={14} />
            <span>Share Course</span>
          </button>

          {/* More options menu */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                theme === 'dark' ? 'hover:bg-white/10 text-white/80' : 'hover:bg-slate-100 text-slate-700'
              }`}
              title="More Options"
            >
              <MoreVertical size={18} />
            </button>

            <AnimatePresence>
              {showMoreMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                    className={`absolute right-0 mt-2 w-52 rounded-2xl p-2 shadow-2xl z-50 border flex flex-col gap-1 ${
                      theme === 'dark' ? 'bg-[#151922] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    {onStartPodcast && (
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          const fullText = `${title}\n\n${content}`;
                          onStartPodcast(fullText);
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 text-xs font-semibold text-left cursor-pointer"
                      >
                        <Volume2 size={15} className="text-blue-400" />
                        <span>Discuss as Podcast</span>
                      </button>
                    )}

                    {onSetQuiz && (
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          onSetQuiz(note);
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 text-xs font-semibold text-left cursor-pointer"
                      >
                        <Sparkles size={15} className="text-amber-400" />
                        <span>Generate Quiz on Note</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        const element = document.createElement('a');
                        const file = new Blob([`${title}\n\n${content}`], { type: 'text/plain' });
                        element.href = URL.createObjectURL(file);
                        element.download = `${title || 'note'}.txt`;
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                        if (setUserNotification) setUserNotification('Exported TXT');
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 text-xs font-semibold text-left cursor-pointer"
                    >
                      <Download size={15} className="text-emerald-400" />
                      <span>Export as Text (.txt)</span>
                    </button>

                    {onDeleteNote && (
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          onDeleteNote(note.id);
                          onBack();
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-red-500/10 text-xs font-semibold text-red-400 text-left cursor-pointer"
                      >
                        <Trash2 size={15} />
                        <span>Delete Note</span>
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 2. MAIN SCROLLABLE CONTENT BODY */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-10 md:px-20 lg:px-32 py-5 space-y-4 custom-scrollbar pb-32">
        {/* Note Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title..."
          className={`w-full text-xl sm:text-2xl font-black bg-transparent border-none outline-none tracking-tight ${
            theme === 'dark' ? 'text-white placeholder:text-white/20' : 'text-slate-900 placeholder:text-slate-300'
          }`}
        />

        {/* Quick Action Buttons directly below Title (as seen in screenshots) */}
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold transition-all cursor-pointer text-slate-200"
          >
            <FileText size={14} className="text-blue-400" />
            <span>Upload PDF / Document</span>
          </button>

          <button
            onClick={() => {
              if (isRecording) {
                stopRecording();
              } else {
                startRecording();
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isRecording
                ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
            }`}
          >
            <Mic size={14} className={isRecording ? 'text-red-400' : 'text-emerald-400'} />
            <span>{isRecording ? `Recording... (${recordingSeconds}s)` : 'Record Voice'}</span>
          </button>
        </div>

        {/* Attached Document Preview Cards */}
        {documents.length > 0 && (
          <div className="flex flex-wrap gap-2.5 py-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#141821] border border-white/10 text-xs max-w-xs shadow-md group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                  <FileText size={16} />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-semibold text-white truncate">{doc.name}</span>
                  <span className="text-[10px] text-white/40">{(doc.size / 1024).toFixed(1)} KB</span>
                </div>
                <button
                  onClick={() => setDocuments(prev => prev.filter(d => d.id !== doc.id))}
                  className="p-1 text-white/30 hover:text-red-400 rounded transition-colors cursor-pointer"
                  title="Remove document"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Embedded Voice Recording Cards (Playback with ▶️, ⬅️ ⏸️ ➡️, and live percentage) */}
        {audioRecordings.length > 0 && (
          <div className="space-y-2 py-2">
            {audioRecordings.map((rec) => {
              const isPlaying = playingAudioId === rec.id;
              const pct = audioProgress[rec.id] || 0;

              return (
                <div
                  key={rec.id}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-[#131720] border border-white/10 text-xs shadow-md max-w-md"
                >
                  {/* Left Play / Pause Control */}
                  <button
                    onClick={() => togglePlayAudio(rec)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      isPlaying
                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                  </button>

                  {/* Scrub Controls & Progress percentage */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-[11px] truncate">{rec.name}</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">{pct}%</span>
                    </div>

                    {/* Progress bar line */}
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full transition-all duration-150"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Skip Rewind / Fast-Forward buttons */}
                  {isPlaying && (
                    <div className="flex items-center gap-1 text-white/60">
                      <button
                        onClick={() => skipAudio(rec, -5)}
                        className="p-1 hover:text-white cursor-pointer"
                        title="Back 5s"
                      >
                        <RotateCcw size={13} />
                      </button>
                      <button
                        onClick={() => skipAudio(rec, 5)}
                        className="p-1 hover:text-white cursor-pointer"
                        title="Forward 5s"
                      >
                        <RotateCw size={13} />
                      </button>
                    </div>
                  )}

                  {/* Delete audio */}
                  <button
                    onClick={() => {
                      if (playingAudioId === rec.id && activeAudioElementRef.current) {
                        activeAudioElementRef.current.pause();
                        setPlayingAudioId(null);
                      }
                      setAudioRecordings(prev => prev.filter(a => a.id !== rec.id));
                    }}
                    className="p-1 text-white/30 hover:text-red-400 rounded transition-colors cursor-pointer"
                    title="Delete recording"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Embedded Drawing Block Cards */}
        {drawings.length > 0 && (
          <div className="flex flex-wrap gap-4 py-2">
            {drawings.map((draw) => (
              <div
                key={draw.id}
                onDoubleClick={() => setDrawingContextActionId(draw.id)}
                className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#12141A] p-2 shadow-lg group max-w-sm"
              >
                <img
                  src={draw.dataUrl}
                  alt="Drawing"
                  className="w-full h-44 object-contain rounded-xl bg-black/40"
                />

                {/* Drawing Actions overlay bar */}
                <div className="flex items-center justify-between mt-2 px-1">
                  <span className="text-[10px] text-white/50 font-medium">✏️ Handwritten diagram</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => editDrawing(draw)}
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDrawings(prev => prev.filter(d => d.id !== draw.id))}
                      className="p-1 text-white/40 hover:text-red-400 rounded cursor-pointer"
                      title="Delete drawing"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Embedded Images */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-3 py-2">
            {images.map((imgUrl, idx) => (
              <div key={idx} className="relative rounded-2xl overflow-hidden border border-white/10 max-w-xs shadow-md group">
                <img src={imgUrl} alt="Note image" className="w-full h-44 object-cover" />
                <button
                  onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Live Note Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your note here... Use the toolbar below for headings, bold text, drawing, and voice recordings."
          rows={12}
          className={`w-full bg-transparent border-none outline-none resize-none text-base leading-relaxed tracking-normal font-sans ${
            textColor === 'default'
              ? (theme === 'dark' ? 'text-white placeholder:text-white/20' : 'text-black placeholder:text-slate-400')
              : textColor
          }`}
          style={{ minHeight: '300px' }}
        />
      </div>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleDocumentUpload}
        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
        className="hidden"
      />
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* 3. KEYBOARD-DOCKED TOOLBAR (Resting immediately on top of the keyboard) */}
      <div className={`sticky bottom-0 z-40 px-3 py-2 border-t backdrop-blur-xl shrink-0 ${
        theme === 'dark' ? 'bg-[#0F121A]/95 border-white/10 text-white' : 'bg-white/95 border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center justify-between max-w-4xl mx-auto gap-1 overflow-x-auto no-scrollbar">
          {/* Plus (+) Button for Rich Action List */}
          <div className="relative">
            <button
              onClick={() => {
                setShowPlusMenu(!showPlusMenu);
                setShowColorPicker(false);
                setShowFontPicker(false);
              }}
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
              title="Add heading, subtopic, file, or image"
            >
              <Plus size={18} />
            </button>

            {/* Plus Menu Popup */}
            <AnimatePresence>
              {showPlusMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowPlusMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    className="absolute bottom-11 left-0 w-64 rounded-2xl p-2 bg-[#151922] border border-white/10 text-white shadow-2xl z-50 flex flex-col gap-1"
                  >
                    <button
                      onClick={handleApplyHeading}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 text-xs font-bold text-left cursor-pointer"
                    >
                      <Type size={15} className="text-blue-400" />
                      <div>
                        <div className="text-white">Heading</div>
                        <div className="text-[10px] text-white/40 font-normal">Auto-bold large title line</div>
                      </div>
                    </button>

                    <button
                      onClick={handleApplySubtopic}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 text-xs font-bold text-left cursor-pointer"
                    >
                      <AlignLeft size={15} className="text-indigo-400" />
                      <div>
                        <div className="text-white">Subtopic</div>
                        <div className="text-[10px] text-white/40 font-normal">Bold subtitle line</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowPlusMenu(false);
                        setShowColorPicker(true);
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 text-xs font-bold text-left cursor-pointer"
                    >
                      <Palette size={15} className="text-amber-400" />
                      <div>
                        <div className="text-white">Text Color</div>
                        <div className="text-[10px] text-white/40 font-normal">Change text color palette</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowPlusMenu(false);
                        fileInputRef.current?.click();
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 text-xs font-bold text-left cursor-pointer"
                    >
                      <FileText size={15} className="text-emerald-400" />
                      <div>
                        <div className="text-white">Upload PDF / Document</div>
                        <div className="text-[10px] text-white/40 font-normal">Attach document preview card</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowPlusMenu(false);
                        imageInputRef.current?.click();
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 text-xs font-bold text-left cursor-pointer"
                    >
                      <ImageIcon size={15} className="text-rose-400" />
                      <div>
                        <div className="text-white">Add Image</div>
                        <div className="text-[10px] text-white/40 font-normal">Insert photo from device</div>
                      </div>
                    </button>

                    <button
                      onClick={handleApplyHighlight}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 text-xs font-bold text-left cursor-pointer"
                    >
                      <Sparkles size={15} className="text-yellow-400" />
                      <div>
                        <div className="text-white">Highlight Text</div>
                        <div className="text-[10px] text-white/40 font-normal">Wrap text with highlight</div>
                      </div>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Bold Button */}
          <button
            onClick={handleApplyBold}
            className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all font-black text-sm cursor-pointer shrink-0"
            title="Bold"
          >
            <Bold size={16} />
          </button>

          {/* Italic Button */}
          <button
            onClick={handleApplyItalic}
            className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all text-sm cursor-pointer shrink-0"
            title="Italic"
          >
            <Italic size={16} />
          </button>

          {/* Microphone Voice Recording Button */}
          <button
            onClick={() => {
              if (isRecording) {
                stopRecording();
              } else {
                startRecording();
              }
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
              isRecording ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-white/10 text-white/80 hover:text-white'
            }`}
            title="Record Voice"
          >
            <Mic size={16} />
          </button>

          {/* Add Image Button */}
          <button
            onClick={() => imageInputRef.current?.click()}
            className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer shrink-0"
            title="Insert Image"
          >
            <ImageIcon size={16} />
          </button>

          {/* Pencil Drawing Button */}
          <button
            onClick={openNewDrawing}
            className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer shrink-0"
            title="Draw diagram"
          >
            <Edit3 size={16} />
          </button>

          {/* Bullet List Button */}
          <button
            onClick={handleAddBullet}
            className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer shrink-0"
            title="Bullet point"
          >
            <List size={16} />
          </button>

          {/* Palette / Color picker trigger */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer shrink-0"
              title="Text Color"
            >
              <Palette size={16} />
            </button>

            <AnimatePresence>
              {showColorPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    className="absolute bottom-11 right-0 w-48 rounded-2xl p-2 bg-[#151922] border border-white/10 text-white shadow-2xl z-50 flex flex-col gap-1"
                  >
                    {colorOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setTextColor(opt.value);
                          setShowColorPicker(false);
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 text-xs font-semibold cursor-pointer"
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: opt.color }}
                        />
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 4. DRAWING CANVAS MODAL */}
      <AnimatePresence>
        {isDrawingOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg rounded-3xl bg-[#12151D] border border-white/15 p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 size={18} className="text-blue-400" />
                  <h3 className="text-sm font-bold text-white">Draw Diagram or Handwritten Note</h3>
                </div>
                <button
                  onClick={() => setIsDrawingOpen(false)}
                  className="p-1 text-white/50 hover:text-white rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Canvas element */}
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-black flex justify-center">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startCanvasDrawing}
                  onMouseMove={drawOnCanvas}
                  onMouseUp={stopCanvasDrawing}
                  onMouseLeave={stopCanvasDrawing}
                  onTouchStart={startCanvasDrawing}
                  onTouchMove={drawOnCanvas}
                  onTouchEnd={stopCanvasDrawing}
                  className="w-full h-64 touch-none cursor-crosshair"
                />
              </div>

              {/* Color & Tool options for drawing */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {['#FFFFFF', '#38BDF8', '#34D399', '#FBBF24', '#FB7185', '#A855F7'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setDrawingColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        drawingColor === c ? 'scale-125 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => initCanvas()}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    onClick={saveDrawing}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 cursor-pointer"
                  >
                    Save Drawing
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. SHARE AS COURSE MODAL (with faculty, department, about, and exact content preservation) */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-md rounded-3xl bg-[#141822] border border-white/15 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Upload size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Share as Course</h3>
                    <p className="text-[11px] text-white/50">Help others by sharing this note as a study course</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1 text-white/50 hover:text-white rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider block mb-1">
                    Course Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold outline-none focus:border-blue-500"
                    placeholder="e.g. Electrical Circuit Theory"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider block mb-1">
                      Course Code
                    </label>
                    <input
                      type="text"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold outline-none focus:border-blue-500"
                      placeholder="e.g. CPE 301"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider block mb-1">
                      Faculty
                    </label>
                    <input
                      type="text"
                      value={courseFaculty}
                      onChange={(e) => setCourseFaculty(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold outline-none focus:border-blue-500"
                      placeholder="Faculty of Engineering"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider block mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={courseDepartment}
                    onChange={(e) => setCourseDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold outline-none focus:border-blue-500"
                    placeholder="Department of Computer Science"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-white/70 uppercase tracking-wider block mb-1">
                    About this Course / Notes Summary
                  </label>
                  <textarea
                    rows={3}
                    value={courseAbout}
                    onChange={(e) => setCourseAbout(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-medium outline-none focus:border-blue-500 resize-none"
                    placeholder="Explain what this course note covers..."
                  />
                </div>

                {/* Content summary box */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Included in Course Download:
                  </span>
                  <div className="text-[11px] text-white/70 flex flex-wrap gap-2 pt-1">
                    <span>📝 Complete Note Texts</span>
                    {documents.length > 0 && <span>• 📄 {documents.length} Documents</span>}
                    {drawings.length > 0 && <span>• ✏️ {drawings.length} Diagrams</span>}
                    {audioRecordings.length > 0 && <span>• 🎙️ {audioRecordings.length} Audio Recordings</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublishCourse}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-blue-500/25 cursor-pointer active:scale-95"
                >
                  Publish &amp; Share Course
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
