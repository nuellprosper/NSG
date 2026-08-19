import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Cloud, Share2, MoreVertical, Plus, Bold, Italic, Underline,
  Mic, Image as ImageIcon, Edit3, List, ListOrdered, AlignLeft,
  ChevronDown, X, Play, Pause, RotateCcw, RotateCw, Trash2,
  FileText, Download, Check, Upload, Palette, Type,
  Folder, Sparkles, Volume2, Move, Scissors, Link, Users,
  GraduationCap, Settings, HelpCircle, Undo, Redo, Eraser, Eye,
  Quote, Strikethrough, Subscript, Superscript
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
  duration: number;
  createdAt: number;
  name: string;
}

interface DocumentBlock {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

// Convert any legacy or raw markdown syntax into pure rendered HTML nodes
function convertMarkdownToHtml(text: string): string {
  if (!text) return '<p><br></p>';

  // Replace markdown markers even if mixed with HTML
  let formatted = text;

  // Replace headers: # Heading, ## Subheading, ### Subtopic
  formatted = formatted.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-black text-white my-3 tracking-tight">$1</h1>');
  formatted = formatted.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-blue-400 my-2">$1</h2>');
  formatted = formatted.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-emerald-400 my-1.5">$1</h3>');

  // Replace Bold: **text** or __text__
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Replace Italic: *text* or _text_
  formatted = formatted.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Replace Highlight: ==text==
  formatted = formatted.replace(/==(.*?)==/g, '<mark style="background-color: rgba(250, 204, 21, 0.35); color: #FEF08A; padding: 0 4px; border-radius: 4px;">$1</mark>');

  // If text doesn't contain HTML paragraphs or block elements, wrap lines in <p>
  if (!formatted.includes('<p>') && !formatted.includes('<div>') && !formatted.includes('<h1>')) {
    const lines = formatted.split('\n');
    formatted = lines.map(line => {
      if (!line.trim()) return '<p><br></p>';
      if (line.startsWith('<ul>') || line.startsWith('<ol>') || line.startsWith('<h1>') || line.startsWith('<h2>') || line.startsWith('<h3>')) {
        return line;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return `<ul><li>${line.substring(2)}</li></ul>`;
      }
      return `<p>${line}</p>`;
    }).join('');
  }

  return formatted;
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
  const [title, setTitle] = useState(note.title || 'Untitled Note');
  const [folder, setFolder] = useState(note.folder || 'History');

  // Interactive blocks
  const [drawings, setDrawings] = useState<DrawingBlock[]>(note.drawings || []);
  const [audioRecordings, setAudioRecordings] = useState<AudioBlock[]>(note.audioRecordings || []);
  const [documents, setDocuments] = useState<DocumentBlock[]>(note.attachments || []);
  const [images, setImages] = useState<string[]>(note.images || []);

  // UI Menus & Popups
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Share & Course Modals
  const [showShareBottomSheet, setShowShareBottomSheet] = useState(false);
  const [showCourseFormModal, setShowCourseFormModal] = useState(false);
  const [courseFaculty, setCourseFaculty] = useState('Faculty of Engineering');
  const [courseDepartment, setCourseDepartment] = useState('Computer Engineering');
  const [courseAbout, setCourseAbout] = useState('Comprehensive study notes and reference materials.');
  const [courseCode, setCourseCode] = useState('CPE 301');

  // Drawing Canvas Fullscreen Studio
  const [isDrawingOpen, setIsDrawingOpen] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#EF4444');
  const [drawingTool, setDrawingTool] = useState<'pen' | 'eraser'>('pen');
  const [brushSize, setBrushSize] = useState(4);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // References
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const savedSelectionRangeRef = useRef<Range | null>(null);

  // Initialize editor content once
  useEffect(() => {
    setTitle(note.title || 'Untitled Note');
    setFolder(note.folder || 'History');
    setDrawings(note.drawings || []);
    setAudioRecordings(note.audioRecordings || []);
    setDocuments(note.attachments || []);
    setImages(note.images || []);

    if (editorRef.current) {
      const raw = typeof note.content === 'string' ? note.content : (note.content as any)?.text || '';
      const htmlContent = convertMarkdownToHtml(raw);
      if (editorRef.current.innerHTML !== htmlContent) {
        editorRef.current.innerHTML = htmlContent;
      }
    }
  }, [note.id]);

  // Save selection whenever selection changes or editor loses focus
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedSelectionRangeRef.current = range.cloneRange();
      }
    }
  }, []);

  // Restore saved selection
  const restoreSelection = useCallback(() => {
    if (!savedSelectionRangeRef.current || !editorRef.current) {
      if (editorRef.current) {
        editorRef.current.focus();
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
      return;
    }

    editorRef.current.focus();
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedSelectionRangeRef.current);
    }
  }, []);

  // Auto-Save Content
  const handleEditorInput = () => {
    saveSelection();
    if (!editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;

    const updated: NoteItem = {
      ...note,
      title: title || 'Untitled Note',
      content: currentHtml,
      folder,
      drawings,
      audioRecordings,
      attachments: documents,
      images,
      updatedAt: new Date().toISOString(),
    };
    onSaveNote(updated);
  };

  // Keyboard shortcut handler (Ctrl/Cmd + B, I, U)
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        document.execCommand('bold', false);
        handleEditorInput();
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        document.execCommand('italic', false);
        handleEditorInput();
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        document.execCommand('underline', false);
        handleEditorInput();
      }
    }
  };

  // Debounced auto-save on title or metadata change
  useEffect(() => {
    const handler = setTimeout(() => {
      if (!editorRef.current) return;
      const currentHtml = editorRef.current.innerHTML;
      const updated: NoteItem = {
        ...note,
        title: title || 'Untitled Note',
        content: currentHtml,
        folder,
        drawings,
        audioRecordings,
        attachments: documents,
        images,
        updatedAt: new Date().toISOString(),
      };
      onSaveNote(updated);
    }, 500);

    return () => clearTimeout(handler);
  }, [title, folder, drawings, audioRecordings, documents, images]);

  // Insert node at the exact caret position in the document
  const insertNodeAtCaret = (node: Node) => {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) {
      if (editorRef.current) {
        editorRef.current.appendChild(node);
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        editorRef.current.appendChild(p);
      }
      handleEditorInput();
      return;
    }

    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(node);

    // Insert line break / new paragraph after the embedded element so typing continues immediately
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    if (node.nextSibling) {
      node.parentNode?.insertBefore(p, node.nextSibling);
    } else {
      node.parentNode?.appendChild(p);
    }

    // Move caret after the new paragraph
    const newRange = document.createRange();
    newRange.setStart(p, 0);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
    savedSelectionRangeRef.current = newRange.cloneRange();

    handleEditorInput();
  };

  // --- Formatting Exec Commands (WYSIWYG Direct HTML node styling, NO raw markdown asterisks) ---
  const handleApplyBold = (e: React.MouseEvent) => {
    e.preventDefault();
    restoreSelection();
    document.execCommand('bold', false);
    handleEditorInput();
  };

  const handleApplyItalic = (e: React.MouseEvent) => {
    e.preventDefault();
    restoreSelection();
    document.execCommand('italic', false);
    handleEditorInput();
  };

  const handleApplyUnderline = (e: React.MouseEvent) => {
    e.preventDefault();
    restoreSelection();
    document.execCommand('underline', false);
    handleEditorInput();
  };

  const handleApplyHeading = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    restoreSelection();
    document.execCommand('formatBlock', false, '<h1>');
    setShowPlusMenu(false);
    handleEditorInput();
  };

  const handleApplySubtopic = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    restoreSelection();
    document.execCommand('formatBlock', false, '<h2>');
    setShowPlusMenu(false);
    handleEditorInput();
  };

  const handleApplyHighlight = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    restoreSelection();
    document.execCommand('hiliteColor', false, '#FEF08A');
    setShowPlusMenu(false);
    handleEditorInput();
  };

  const handleApplyColor = (colorHex: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    restoreSelection();
    document.execCommand('foreColor', false, colorHex);
    setShowColorPicker(false);
    setShowPlusMenu(false);
    handleEditorInput();
  };

  const handleApplyBulletList = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    restoreSelection();
    document.execCommand('insertUnorderedList', false);
    setShowPlusMenu(false);
    handleEditorInput();
  };

  const handleApplyNumberedList = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    restoreSelection();
    document.execCommand('insertOrderedList', false);
    setShowPlusMenu(false);
    handleEditorInput();
  };

  // --- Inline Document Upload (PDF / Docs) ---
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result as string;
      const docId = `doc-${Date.now()}`;
      const newDoc: DocumentBlock = {
        id: docId,
        name: file.name,
        size: file.size,
        type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
        url: result,
      };

      setDocuments(prev => [...prev, newDoc]);

      // Create Inline Document Card DOM element right where pointer is
      const docWrapper = document.createElement('div');
      docWrapper.className = 'omni-inline-doc not-prose my-3 select-none';
      docWrapper.contentEditable = 'false';
      docWrapper.dataset.docId = docId;

      const sizeKb = (file.size / 1024).toFixed(1);
      const isPdf = file.name.toLowerCase().endsWith('.pdf');

      docWrapper.innerHTML = `
        <div class="inline-flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#22242E] border border-blue-500/30 shadow-lg text-white max-w-md w-full">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div class="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
              ${isPdf ? '📄' : '📁'}
            </div>
            <div class="flex flex-col min-w-0 flex-1">
              <span class="font-bold text-xs text-white truncate">${file.name}</span>
              <span class="text-[10px] text-white/50">${sizeKb} KB • ${isPdf ? 'PDF Document' : 'Attachment'}</span>
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <a href="${result}" download="${file.name}" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-md transition-all">Download</a>
            <button type="button" class="delete-inline-doc-btn p-1.5 text-white/40 hover:text-red-400 rounded-lg transition-colors cursor-pointer" title="Remove">✕</button>
          </div>
        </div>
      `;

      const deleteBtn = docWrapper.querySelector('.delete-inline-doc-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          docWrapper.remove();
          setDocuments(prev => prev.filter(d => d.id !== docId));
          handleEditorInput();
        });
      }

      insertNodeAtCaret(docWrapper);
      setShowPlusMenu(false);
      if (setUserNotification) setUserNotification(`PDF "${file.name}" placed in note at cursor!`);
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // --- Inline Image Upload ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImages(prev => [...prev, result]);

      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'omni-inline-img not-prose my-3 select-none relative group max-w-lg';
      imgWrapper.contentEditable = 'false';

      imgWrapper.innerHTML = `
        <div class="relative rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-black/40">
          <img src="${result}" alt="Embedded Image" class="w-full max-h-96 object-contain rounded-2xl" />
          <button type="button" class="delete-inline-img-btn absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-full transition-all cursor-pointer">✕</button>
        </div>
      `;

      const deleteBtn = imgWrapper.querySelector('.delete-inline-img-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          imgWrapper.remove();
          setImages(prev => prev.filter(img => img !== result));
          handleEditorInput();
        });
      }

      insertNodeAtCaret(imgWrapper);
      setShowPlusMenu(false);
      if (setUserNotification) setUserNotification('Image placed directly at cursor');
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // --- Voice Recording Inline Insertion ---
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
          const audioId = `audio-${Date.now()}`;
          const newAudio: AudioBlock = {
            id: audioId,
            audioUrl: base64Url,
            duration: recordingSeconds,
            createdAt: Date.now(),
            name: `Voice Memo ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          };

          setAudioRecordings(prev => [...prev, newAudio]);

          // Insert Inline Audio Player at caret
          const audioWrapper = document.createElement('div');
          audioWrapper.className = 'omni-inline-audio not-prose my-3 select-none max-w-md';
          audioWrapper.contentEditable = 'false';

          audioWrapper.innerHTML = `
            <div class="p-3.5 rounded-2xl bg-[#22242E] border border-amber-500/40 shadow-xl space-y-2 text-white">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">🎙️</div>
                  <span class="text-xs font-bold">${newAudio.name}</span>
                </div>
                <button type="button" class="delete-inline-audio-btn p-1 text-white/40 hover:text-red-400 rounded cursor-pointer">✕</button>
              </div>
              <audio controls src="${base64Url}" class="w-full h-8 rounded-lg outline-none"></audio>
            </div>
          `;

          const deleteBtn = audioWrapper.querySelector('.delete-inline-audio-btn');
          if (deleteBtn) {
            deleteBtn.addEventListener('click', (ev) => {
              ev.stopPropagation();
              audioWrapper.remove();
              setAudioRecordings(prev => prev.filter(a => a.id !== audioId));
              handleEditorInput();
            });
          }

          insertNodeAtCaret(audioWrapper);
          if (setUserNotification) setUserNotification('Voice recording placed in note at cursor');
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Audio recording failed', err);
      if (setUserNotification) setUserNotification('Microphone access is required to record audio.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  // --- Drawing Studio & Inline Placement ---
  const openNewDrawing = () => {
    setIsDrawingOpen(true);
    setTimeout(() => initCanvas(), 100);
  };

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 700;
    canvas.height = 700;
    ctx.fillStyle = '#181A22';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setCanvasHistory([canvas.toDataURL()]);
  };

  const saveCanvasSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setCanvasHistory(prev => [...prev.slice(-10), canvas.toDataURL()]);
  };

  const undoCanvas = () => {
    if (canvasHistory.length <= 1) return;
    const newHist = [...canvasHistory];
    newHist.pop();
    const prevSnapshot = newHist[newHist.length - 1];
    setCanvasHistory(newHist);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = prevSnapshot;
  };

  const startCanvasDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = drawingTool === 'eraser' ? '#181A22' : drawingColor;
    ctx.lineWidth = drawingTool === 'eraser' ? brushSize * 4 : brushSize;
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
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopCanvasDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveCanvasSnapshot();
    }
  };

  const saveDrawingToNote = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const drawId = `draw-${Date.now()}`;

    const newDrawing: DrawingBlock = {
      id: drawId,
      dataUrl,
      createdAt: Date.now(),
      caption: 'Handwritten diagram',
    };
    setDrawings(prev => [...prev, newDrawing]);

    // Insert Inline Diagram Card at caret
    const drawWrapper = document.createElement('div');
    drawWrapper.className = 'omni-inline-drawing not-prose my-3 select-none max-w-sm relative group';
    drawWrapper.contentEditable = 'false';

    drawWrapper.innerHTML = `
      <div class="relative rounded-2xl overflow-hidden border-2 border-blue-500/60 bg-[#181A22] p-2 shadow-2xl">
        <img src="${dataUrl}" alt="Handwritten Diagram" class="w-full h-56 object-contain rounded-xl bg-[#181A22]" />
        <button type="button" class="delete-inline-draw-btn absolute top-3 right-3 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-full transition-all cursor-pointer">✕</button>
      </div>
    `;

    const deleteBtn = drawWrapper.querySelector('.delete-inline-draw-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        drawWrapper.remove();
        setDrawings(prev => prev.filter(d => d.id !== drawId));
        handleEditorInput();
      });
    }

    insertNodeAtCaret(drawWrapper);
    setIsDrawingOpen(false);
    if (setUserNotification) setUserNotification('Diagram placed in note at cursor');
  };

  // --- Publish Course ---
  const handlePublishCourse = () => {
    const htmlContent = editorRef.current?.innerHTML || '';
    const coursePayload = {
      id: `course-${Date.now()}`,
      title: title || 'Course Note',
      courseCode: courseCode || 'GEN 101',
      faculty: courseFaculty,
      department: courseDepartment,
      description: courseAbout,
      about: courseAbout,
      content: htmlContent,
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

    try {
      const existingShared = JSON.parse(localStorage.getItem('shared_user_courses') || '[]');
      existingShared.push(coursePayload);
      localStorage.setItem('shared_user_courses', JSON.stringify(existingShared));
    } catch (e) {
      console.warn('LocalStorage course cache', e);
    }

    setShowCourseFormModal(false);
    setShowShareBottomSheet(false);
    if (setUserNotification) {
      setUserNotification(`Successfully shared note as course to ${courseDepartment}!`);
    }
  };

  const colorOptions = [
    { label: 'White / Dark', hex: theme === 'dark' ? '#FFFFFF' : '#0F172A', colorClass: 'text-white' },
    { label: 'Sky Blue', hex: '#38BDF8', colorClass: 'text-sky-400' },
    { label: 'Emerald Green', hex: '#34D399', colorClass: 'text-emerald-400' },
    { label: 'Amber Gold', hex: '#FBBF24', colorClass: 'text-amber-400' },
    { label: 'Rose Coral', hex: '#FB7185', colorClass: 'text-rose-400' },
    { label: 'Purple Violet', hex: '#A78BFA', colorClass: 'text-purple-400' },
  ];

  return (
    <div className={`w-full flex-1 flex flex-col h-full min-h-0 overflow-hidden font-sans relative ${
      theme === 'dark' ? 'bg-[#181920] text-white' : 'bg-[#F8FAFC] text-[#0F172A]'
    }`}>
      {/* 1. TOP BAR */}
      <div className={`sticky top-0 z-30 px-3 sm:px-6 py-2.5 flex items-center justify-between border-b shrink-0 backdrop-blur-md ${
        theme === 'dark' ? 'bg-[#181920]/95 border-white/10 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
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

          {/* Folder Name */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Folder size={14} className="text-amber-400" />
            <span>{folder}</span>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button 
            className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            title="Note is Synced"
          >
            <Cloud size={19} className="stroke-[2.2]" />
          </button>

          <button
            onClick={() => setShowShareBottomSheet(true)}
            className="text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Share Document / Share to Course"
          >
            <Share2 size={19} />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="More options"
            >
              <MoreVertical size={19} />
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
                      theme === 'dark' ? 'bg-[#22242E] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    {onStartPodcast && (
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          const plainText = editorRef.current?.innerText || '';
                          onStartPodcast(`${title}\n\n${plainText}`);
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
                        <span>Create Quiz on Note</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        const element = document.createElement('a');
                        const plainText = editorRef.current?.innerText || '';
                        const file = new Blob([`${title}\n\n${plainText}`], { type: 'text/plain' });
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
                      <span>Export as TXT</span>
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

      {/* 2. MAIN SCROLLABLE CONTENT BODY (Flows naturally without artificial spacers that cut off text) */}
      <div 
        className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-10 md:px-20 lg:px-32 py-5 custom-scrollbar flex flex-col space-y-4"
        onClick={() => {
          if (editorRef.current && !editorRef.current.contains(document.activeElement)) {
            editorRef.current.focus();
          }
        }}
      >
        {/* Note Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title of your note..."
          className={`w-full text-xl sm:text-2xl font-black bg-transparent border-none outline-none tracking-tight shrink-0 ${
            theme === 'dark' ? 'text-white placeholder:text-white/30' : 'text-slate-900 placeholder:text-slate-300'
          }`}
        />

        {/* Quick Action Pills */}
        <div className="flex items-center flex-wrap gap-2 pt-1 pb-1 shrink-0">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#252834] hover:bg-[#2F3240] border border-white/10 text-xs font-semibold transition-all cursor-pointer text-slate-200 shadow-sm"
          >
            <FileText size={14} className="text-blue-400" />
            <span>Upload PDF / Doc at Pointer</span>
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (isRecording) {
                stopRecording();
              } else {
                startRecording();
              }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              isRecording
                ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                : 'bg-[#252834] hover:bg-[#2F3240] border-white/10 text-slate-200'
            }`}
          >
            <Mic size={14} className={isRecording ? 'text-red-400' : 'text-amber-400'} />
            <span>{isRecording ? `Recording... (${recordingSeconds}s)` : 'Record Voice at Pointer'}</span>
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#252834] hover:bg-[#2F3240] border border-white/10 text-xs font-semibold transition-all cursor-pointer text-slate-200 shadow-sm"
          >
            <ImageIcon size={14} className="text-emerald-400" />
            <span>Insert Image</span>
          </button>
        </div>

        {/* TRUE WYSIWYG LIVE RICH-TEXT NOTE CANVAS (Direct text formatting, no raw markdown symbols) */}
        <div
          ref={editorRef}
          contentEditable={true}
          suppressContentEditableWarning={true}
          onInput={handleEditorInput}
          onKeyDown={handleEditorKeyDown}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          onTouchEnd={saveSelection}
          onBlur={saveSelection}
          data-placeholder="Start typing your study notes here... (Bold text and headings render live as you write)"
          className={`w-full flex-1 min-h-[350px] outline-none text-base leading-relaxed tracking-normal font-sans focus:outline-none transition-colors select-text pb-16 ${
            theme === 'dark' ? 'text-white' : 'text-[#0F172A]'
          } [&_h1]:text-2xl [&_h1]:font-black [&_h1]:my-3 [&_h1]:tracking-tight [&_h1]:text-white [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-2 [&_h2]:text-blue-400 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-1.5 [&_h3]:text-emerald-400 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2 [&_strong]:font-black [&_p]:my-1.5`}
        />
      </div>

      {/* Hidden File Inputs */}
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

      {/* 3. KEYBOARD-DOCKED TOOLBAR (Direct Formatting Actions, No Markdown Syntax) */}
      <div className={`sticky bottom-0 z-40 px-3 py-2 border-t backdrop-blur-xl shrink-0 ${
        theme === 'dark' ? 'bg-[#22242E] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center justify-between max-w-4xl mx-auto gap-2 overflow-x-auto no-scrollbar">
          {/* Plus (+) Button */}
          <div className="relative">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setShowPlusMenu(!showPlusMenu);
                setShowColorPicker(false);
              }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold transition-all cursor-pointer shrink-0 ${
                showPlusMenu ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Add Heading, Subtopic, PDF, Color, Image"
            >
              <Plus size={18} />
            </button>

            {/* Plus Menu Dropdown */}
            <AnimatePresence>
              {showPlusMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowPlusMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute bottom-12 left-0 w-72 rounded-2xl p-2 bg-[#1F222D] border border-white/10 text-white shadow-2xl z-50 flex flex-col gap-1 max-h-[75vh] overflow-y-auto custom-scrollbar"
                  >
                    <div className="px-2 py-1 text-[10px] font-black text-white/40 uppercase tracking-wider">
                      Insert at Caret Position
                    </div>

                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleApplyHeading}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-xs font-bold text-left cursor-pointer transition-all"
                    >
                      <Type size={16} className="text-blue-400 shrink-0" />
                      <div>
                        <div className="text-white">Heading</div>
                        <div className="text-[10px] text-white/50 font-normal">Large bold title line</div>
                      </div>
                    </button>

                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleApplySubtopic}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-xs font-bold text-left cursor-pointer transition-all"
                    >
                      <AlignLeft size={16} className="text-indigo-400 shrink-0" />
                      <div>
                        <div className="text-white">Subtopic / Subheading</div>
                        <div className="text-[10px] text-white/50 font-normal">Medium bold subtitle line</div>
                      </div>
                    </button>

                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setShowPlusMenu(false);
                        setShowColorPicker(true);
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-xs font-bold text-left cursor-pointer transition-all"
                    >
                      <Palette size={16} className="text-amber-400 shrink-0" />
                      <div>
                        <div className="text-white">Text Color</div>
                        <div className="text-[10px] text-white/50 font-normal">Change color of selected text</div>
                      </div>
                    </button>

                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleApplyHighlight}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-xs font-bold text-left cursor-pointer transition-all"
                    >
                      <Sparkles size={16} className="text-yellow-400 shrink-0" />
                      <div>
                        <div className="text-white">Highlight Text</div>
                        <div className="text-[10px] text-white/50 font-normal">Highlight selected text in yellow</div>
                      </div>
                    </button>

                    <div className="h-px bg-white/10 my-1" />

                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setShowPlusMenu(false);
                        fileInputRef.current?.click();
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-xs font-bold text-left cursor-pointer transition-all"
                    >
                      <FileText size={16} className="text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-white">Upload PDF or Document</div>
                        <div className="text-[10px] text-white/50 font-normal">Embeds PDF card right at your pointer</div>
                      </div>
                    </button>

                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setShowPlusMenu(false);
                        imageInputRef.current?.click();
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-xs font-bold text-left cursor-pointer transition-all"
                    >
                      <ImageIcon size={16} className="text-rose-400 shrink-0" />
                      <div>
                        <div className="text-white">Add Image</div>
                        <div className="text-[10px] text-white/50 font-normal">Embeds photo right at your pointer</div>
                      </div>
                    </button>

                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setShowPlusMenu(false);
                        if (isRecording) stopRecording();
                        else startRecording();
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-xs font-bold text-left cursor-pointer transition-all"
                    >
                      <Mic size={16} className="text-red-400 shrink-0" />
                      <div>
                        <div className="text-white">Voice Recording</div>
                        <div className="text-[10px] text-white/50 font-normal">Record voice player at pointer</div>
                      </div>
                    </button>

                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setShowPlusMenu(false);
                        openNewDrawing();
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-xs font-bold text-left cursor-pointer transition-all"
                    >
                      <Edit3 size={16} className="text-purple-400 shrink-0" />
                      <div>
                        <div className="text-white">Handwritten Diagram</div>
                        <div className="text-[10px] text-white/50 font-normal">Draw and embed sketch at pointer</div>
                      </div>
                    </button>

                    <div className="h-px bg-white/10 my-1" />

                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleApplyBulletList}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 text-xs font-bold text-left cursor-pointer transition-all"
                    >
                      <List size={16} className="text-cyan-400 shrink-0" />
                      <span>Bullet List</span>
                    </button>

                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleApplyNumberedList}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 text-xs font-bold text-left cursor-pointer transition-all"
                    >
                      <ListOrdered size={16} className="text-teal-400 shrink-0" />
                      <span>Numbered List</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Bold Button (B) - Directly applies bold formatting to highlighted text */}
          <button
            onMouseDown={handleApplyBold}
            className="p-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-all font-black text-sm cursor-pointer shrink-0"
            title="Bold Selection (Ctrl+B)"
          >
            <Bold size={17} />
          </button>

          {/* Italic Button (/) - Directly applies italic formatting */}
          <button
            onMouseDown={handleApplyItalic}
            className="p-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-all text-sm cursor-pointer shrink-0"
            title="Italic Selection (Ctrl+I)"
          >
            <Italic size={17} />
          </button>

          {/* Underline Button (U) - Directly applies underline formatting */}
          <button
            onMouseDown={handleApplyUnderline}
            className="p-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-all text-sm cursor-pointer shrink-0"
            title="Underline Selection (Ctrl+U)"
          >
            <Underline size={17} />
          </button>

          {/* Voice Microphone Button */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (isRecording) {
                stopRecording();
              } else {
                startRecording();
              }
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
              isRecording ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-white/10 text-white/90 hover:text-white'
            }`}
            title="Record Voice"
          >
            <Mic size={17} />
          </button>

          {/* Add Image Button */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => imageInputRef.current?.click()}
            className="p-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-all cursor-pointer shrink-0"
            title="Insert Image"
          >
            <ImageIcon size={17} />
          </button>

          {/* Drawing Box Button */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={openNewDrawing}
            className="p-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-all cursor-pointer shrink-0"
            title="Draw Diagram Box"
          >
            <Edit3 size={17} />
          </button>

          {/* Bullet List Button */}
          <button
            onMouseDown={handleApplyBulletList}
            className="p-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-all cursor-pointer shrink-0"
            title="Bullet List"
          >
            <List size={17} />
          </button>

          {/* Palette Color Picker */}
          <div className="relative">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 rounded-xl hover:bg-white/10 text-white/90 hover:text-white transition-all cursor-pointer shrink-0"
              title="Text Color"
            >
              <Palette size={17} />
            </button>

            <AnimatePresence>
              {showColorPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowColorPicker(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    className="absolute bottom-12 right-0 w-52 rounded-2xl p-2 bg-[#22242E] border border-white/10 text-white shadow-2xl z-50 flex flex-col gap-1"
                  >
                    <div className="px-2 py-1 text-[10px] font-bold text-white/50 uppercase tracking-wider">
                      Select Text Color
                    </div>
                    {colorOptions.map((opt) => (
                      <button
                        key={opt.hex}
                        onMouseDown={(e) => handleApplyColor(opt.hex, e)}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm shrink-0"
                          style={{ backgroundColor: opt.hex }}
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

      {/* 4. DRAWING STUDIO FULLSCREEN CANVAS */}
      <AnimatePresence>
        {isDrawingOpen && (
          <div className="fixed inset-0 z-50 bg-[#14151C] flex flex-col justify-between">
            <div className="px-5 py-3 flex items-center justify-between border-b border-white/10 shrink-0">
              <button className="text-white/60 hover:text-white cursor-pointer">
                <HelpCircle size={20} />
              </button>
              <span className="text-xs font-bold text-white">Diagram Sketch Studio</span>
              <button
                onClick={() => setIsDrawingOpen(false)}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 bg-[#181A22]">
              <div className="w-full max-w-sm aspect-square bg-[#181A22] rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startCanvasDrawing}
                  onMouseMove={drawOnCanvas}
                  onMouseUp={stopCanvasDrawing}
                  onMouseLeave={stopCanvasDrawing}
                  onTouchStart={startCanvasDrawing}
                  onTouchMove={drawOnCanvas}
                  onTouchEnd={stopCanvasDrawing}
                  className="w-full h-full touch-none cursor-crosshair"
                />
              </div>
            </div>

            <div className="px-4 py-2.5 bg-[#1F212B] border-t border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {[
                  { color: '#FFFFFF' },
                  { color: '#EF4444' },
                  { color: '#FBBF24' },
                  { color: '#38BDF8' },
                  { color: '#34D399' },
                ].map((c) => (
                  <button
                    key={c.color}
                    onClick={() => {
                      setDrawingColor(c.color);
                      setDrawingTool('pen');
                    }}
                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer border-2 ${
                      drawingColor === c.color && drawingTool === 'pen' ? 'scale-110 border-white ring-2 ring-blue-500/50' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.color }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3 text-white/70 text-xs font-bold">
                <button
                  onClick={undoCanvas}
                  className="p-1 text-white/60 hover:text-white cursor-pointer"
                  title="Undo"
                >
                  <Undo size={16} />
                </button>
              </div>
            </div>

            <div className="px-6 py-3 bg-[#171821] border-t border-white/10 flex items-center justify-between shrink-0">
              <button
                onClick={() => setDrawingTool('pen')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  drawingTool === 'pen' ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white'
                }`}
                title="Pen"
              >
                <Edit3 size={18} />
              </button>

              <button
                onClick={() => setDrawingTool('eraser')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  drawingTool === 'eraser' ? 'bg-blue-600 text-white shadow-md' : 'text-white/60 hover:text-white'
                }`}
                title="Eraser"
              >
                <Eraser size={18} />
              </button>

              <button
                onClick={() => initCanvas()}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Clear
              </button>

              <button
                onClick={saveDrawingToNote}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 cursor-pointer active:scale-95"
              >
                Insert in Note
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. SHARE DOCUMENT BOTTOM SHEET */}
      <AnimatePresence>
        {showShareBottomSheet && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center">
            <div className="fixed inset-0" onClick={() => setShowShareBottomSheet(false)} />
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              className="relative z-10 w-full max-w-md bg-[#252834] rounded-t-3xl border-t border-white/10 p-5 space-y-4 pb-8"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto" />

              <h2 className="text-base font-bold text-white">Share document</h2>

              <div className="rounded-2xl p-4 bg-gradient-to-b from-[#1E293B] to-[#172033] border border-blue-500/30 space-y-3 shadow-xl">
                <div className="flex items-center gap-2 text-blue-400">
                  <GraduationCap size={20} />
                  <h3 className="text-sm font-bold text-white">Share to a Course</h3>
                </div>

                <p className="text-xs text-white/70 leading-relaxed">
                  Share to <strong className="text-blue-400">unlock free AI</strong> that turns your notes into summaries, flashcards, quizzes, and more.
                </p>

                <ul className="text-xs text-white/80 space-y-1 pt-1">
                  <li className="flex items-center gap-1.5">• Free AI study materials</li>
                  <li className="flex items-center gap-1.5">• Saved to user storage exactly as written</li>
                  <li className="flex items-center gap-1.5">• Includes all attached documents and drawings</li>
                </ul>

                <button
                  onClick={() => {
                    setShowShareBottomSheet(false);
                    setShowCourseFormModal(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  Share to a Course
                </button>
              </div>

              <div
                onClick={() => {
                  if (navigator.clipboard) {
                    const plainText = editorRef.current?.innerText || '';
                    navigator.clipboard.writeText(`${title}\n\n${plainText}`);
                    if (setUserNotification) setUserNotification('Share link copied to clipboard');
                  }
                  setShowShareBottomSheet(false);
                }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1E212B] hover:bg-[#252834] border border-white/5 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Link size={18} className="text-slate-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Share with Link</h4>
                    <p className="text-[10px] text-white/40">Copy note contents link</p>
                  </div>
                </div>
                <span className="text-white/40">›</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. SHARE TO COURSE FORM MODAL */}
      <AnimatePresence>
        {showCourseFormModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-md rounded-3xl bg-[#1F222D] border border-white/10 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Publish Course</h3>
                    <p className="text-[11px] text-white/50">Preserved exactly as written in note</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCourseFormModal(false)}
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
                    About / Description of Course
                  </label>
                  <textarea
                    rows={3}
                    value={courseAbout}
                    onChange={(e) => setCourseAbout(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-medium outline-none focus:border-blue-500 resize-none"
                    placeholder="Describe what students will learn in this note..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowCourseFormModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublishCourse}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-600/30 cursor-pointer active:scale-95"
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
