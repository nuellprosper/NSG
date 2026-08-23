import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
// import Browser from './components/Browser'; // Suspended
import { 
  Mic, StopCircle, Upload, FileAudio, Image as ImageIcon, 
  Brain, History, Download, Play, 
  ChevronLeft, ChevronRight, Trash2, Settings, UserPlus, CreditCard, Edit2, FilePlus,
  ChevronUp, ChevronDown, Bold, Italic, List, CornerDownRight,
  Database, Zap, Cpu, CheckCircle2, XCircle, RefreshCcw, ArrowLeft, FileText, AlertCircle, RotateCcw,
  Sun, Moon, ArrowDown, PlusCircle, Copy, User, Users, Clock, Lock, Unlock, Shield, ShieldCheck, AlertTriangle, FileDown, LayoutDashboard, ListChecks, Bell, GraduationCap, LayoutGrid, Home,
  Pin, Edit3, Share2, Trophy, LogOut, Plus, Menu, Camera, Monitor, X, Activity, MessageSquare, BookOpen, Calendar, Send, Save, MicOff, Video, AtSign, Paperclip, Bookmark, Book, Percent,
  Search, Check, CheckCheck, Info, Volume2, VolumeX, Square, Mail, ArrowRight, BoxSelect, Globe, MapPin, Terminal, RefreshCw, Eye, EyeOff, HelpCircle, Calculator, Loader2,
  BookMarked, Target, Archive, Flame, BarChart2, Gem, Award, BrainCircuit, Heart, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cleanTextForSpeech } from './lib/tts';
import { GoogleGenAI, Type, Modality, ThinkingLevel } from "@google/genai";
import { HfInference } from "@huggingface/inference";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { usePaystackPayment } from 'react-paystack';
import { increment, deleteField } from 'firebase/firestore';
import { toPng } from 'html-to-image';
import axios from 'axios';
import { 
  auth, db, googleProvider, signOut, onAuthStateChanged,
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot, getDocs, addDoc, serverTimestamp, orderBy, limit, arrayUnion,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  FirestoreOperation, handleFirestoreError, circularSafeStringify, sanitizeData,
  triggerQuotaErrorModal, checkIsQuotaError
} from './firebase';

import { HomePage } from './components/HomePage';
import { AILibrary } from './components/AILibrary';
import { speakText } from './lib/tts';
import { ChatRoom } from './components/ChatRoom';
import { ClassRoom } from './components/ClassRoom';
import { CommunityPage } from './components/CommunityPage';
import { QuizHistoryPage } from './components/QuizHistoryPage';
import { ExamHistoryPage } from './components/ExamHistoryPage';
import { NotesHistoryPage } from './components/NotesHistoryPage';
import { GeneralHistoryPage } from './components/GeneralHistoryPage';
import { PremiumPage } from './components/PremiumPage';
import { OmniOfflinePage } from './components/OmniOfflinePage';
import { CoursesPage } from './components/CoursesPage';
import { ToolsPage } from './tools';
import { 
  LoggedOutLanding as LoggedOutLandingComponent,
  AnalysisLoadingOverlay as AnalysisLoadingOverlayComponent,
  EmailPreviewModal as EmailPreviewModalComponent,
  AIChallengeModal as AIChallengeModalComponent,
  PremiumOnboarding as PremiumOnboardingComponent,
  PremiumModal as PremiumModalComponent
} from './components/AppComponent';
import { OfflineModal } from './components/OfflineModal';
import { NativeAudioRecorder } from './components/NativeAudioRecorder';
import { 
  initGoogleAuth,
  performGoogleAuth, 
  initOfflineQueueSync, 
  initPushNotifications, 
  schedulePeriodicBackgroundNotifications, 
  useHardwareBackButton, 
  useAppUrlListener, 
  isNativePlatform, 
  isCapacitorNative, 
  checkNetworkStatus,
  requestAppPermissions, 
  runLocalQwenInference, 
  cleanupLlamaModel,
  scheduleLocalNotification,
  isOmniBrainDownloaded,
  executeAITask,
  OFFLINE_MODEL_NOT_DOWNLOADED_MSG
} from './lib/capacitor';
import { requestMicrophonePermission, getSupportedAudioMimeType } from './lib/audioRecorder';


import { 
  UNIVERSITIES, FACULTIES, DEPARTMENTS 
} from './constants/academic';

import { DID_YOU_KNOW_WORDS } from './constants/didYouKnow';

import { 
  safeStorage,
  getUserRank, getScholarTierInfo, getScholarLeagueInfo,
  getApiKey, getHfKey, getAiInstance, getHfInstance, MODEL_NAME, FLASH_MODEL,
  formatAiError, robustJSONParse, isHfDepletedGlobal, handleHfErrorGlobal,
  isOpenRouterDepletedGlobal, isTogetherDepletedGlobal, callOpenRouter, callTogetherAI,
  LIMITS, PAYSTACK_PUBLIC_KEY, compressImage as utilsCompressImage, fileToGenerativePart,
  Course, MediaFile, ChatMessage, ChatSession, LectureSession,
  QuizQuestion, ExamQuestion, StudentResult, RegisteredStudent, ExamConfig, HomeHistoryItem,
  parseBatchQuestions, parseBatchStudents, extractTextFromDocument, extractPdfDetails,
  HF_MODELS, OPENROUTER_MODELS, GROQ_MODEL, GROQ_AUDIO_MODEL, handleOpenRouterErrorGlobal
} from './utils';

import {
  WhatsAppIcon, helpContent, HelpOverlay, BlinkingBrain,
  MarkdownRenderer, COMMON_COURSES, CoursesTool, AssignmentSolver
} from './subComponents';






/**
 * NSG (Nuell Study Guide) V4.0 - PROFESSIONAL CBT & AI UPGRADE
 * \u{2705} Professional CBT Infrastructure (Exam Lobby, Info Page, Exam Engine)
 * \u{2705} Admin Backend Control (Score Sheet, Timer Restart, Results Download)
 * \u{2705} Advanced AI Chat (Copy Response, History Sidebar)
 * \u{2705} Enhanced Quiz (Customization, Deep Assessment, Report to AI)
 * \u{2705} Paystack Payment Integration
 */















const AdUnit = ({ slot }: { slot: string }) => {
  const adRef = useRef<any>(null);
  const [isSandbox, setIsSandbox] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const isProd = hostname.includes("nsg.studios");
      setIsSandbox(!isProd);
    }
  }, []);

  useEffect(() => {
    if (isSandbox || !adRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          try {
            if (adRef.current && !adRef.current.getAttribute('data-adsbygoogle-status')) {
              const adsbygoogle = (window as any).adsbygoogle || [];
              adsbygoogle.push({});
              observer.disconnect();
            }
          } catch (e) {
            console.error("AdSense error:", e);
          }
        }
      }
    });

    observer.observe(adRef.current);
    return () => observer.disconnect();
  }, [isSandbox]);

  if (isSandbox) {
    return (
      <div className="my-5 p-4 rounded-2xl bg-[#13111C]/40 border border-[#DC2626]/20 flex flex-col items-center justify-center text-center w-full min-h-[70px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#DC2626]/5 to-transparent rounded-full pointer-events-none" />
        <span className="text-[7.5px] font-black text-[#DC2626] uppercase tracking-[0.3em] mb-1.5">🎓 NSG Academic Booster</span>
        <p className="text-[9.5px] font-black text-white/70 uppercase leading-snug max-w-md font-sans">
          "Tip: Leverage CBT Exams to evaluate course memory before major academic tests!"
        </p>
      </div>
    );
  }

  return (
    <div className="my-6 overflow-hidden flex flex-col items-center w-full min-h-[90px]">
      <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Advertisement</span>
      <ins className="adsbygoogle"
           ref={adRef}
           style={{ display: 'block', minWidth: '250px', minHeight: '90px' }}
           data-ad-client="ca-pub-3216169026195971"
           data-ad-slot={slot}
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
};

export default function App() {
  const [isHfDepleted, setIsHfDepleted] = useState(false);

  // Sync global state to React state if needed, or just use global
  useEffect(() => {
    const timer = setInterval(() => {
      if (isHfDepletedGlobal && !isHfDepleted) {
        setIsHfDepleted(true);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isHfDepleted]);

  const handleHfError = (error: any, label: string) => {
    handleHfErrorGlobal(error, label);
    if (isHfDepletedGlobal) setIsHfDepleted(true);
  };

  const updatePageMeta = (title: string, description: string) => {
    document.title = `${title} | Omni`;
    const setMeta = (selector: string, content: string) => {
      let el = document.querySelector(selector);
      if (el) {
        el.setAttribute('content', content);
      } else {
        const meta = document.createElement('meta');
        if (selector.startsWith('meta[name=')) {
          meta.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
        } else if (selector.startsWith('meta[property=')) {
          meta.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
        }
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', `${title} | Omni`);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:site_name"]', 'Omni');
    setMeta('meta[name="twitter:title"]', `${title} | Omni`);
    setMeta('meta[name="twitter:description"]', description);
  };
  // --- \u{1F510} AUTH STATE ---
  const [user, setUser] = useState<any>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // --- OFFLINE WARNING MODAL STATE ---
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineModalMessage, setOfflineModalMessage] = useState('');

  // --- QUIZ CREATION METHOD STATE ---
  const [quizCreationMethod, setQuizCreationMethod] = useState<'omni' | 'pdf' | 'image' | null>(null);

  const checkOnlineOrShowModal = (customMsg?: string): boolean => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setOfflineModalMessage(customMsg || "This feature requires an active internet connection. Please check your connection and try again.");
      setShowOfflineModal(true);
      return false;
    }
    return true;
  };

  // --- CUSTOM CONFIRM MODAL STATE ---
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void, confirmText = "Confirm", isDanger = false) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      confirmText,
      isDanger
    });
  };
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [profileFormData, setProfileFormData] = useState({
    displayName: '',
    fullName: '',
    username: '',
    email: '',
    matricNumber: '',
    dob: '',
    country: 'Nigeria',
    city: '',
    gender: 'Male',
    university: '',
    level: '',
    department: '',
    faculty: '',
    about: ''
  });
  const [profileSubTab, setProfileSubTab] = useState<'profile' | 'stats'>('profile');

  // WhatsApp verification states
  const [whatsappInputNumber, setWhatsappInputNumber] = useState("");
  const [whatsappSentOtp, setWhatsappSentOtp] = useState(false);
  const [whatsappVerifyCode, setWhatsappVerifyCode] = useState("");
  const [whatsappLoading, setWhatsappLoading] = useState(false);

  // Swipe gesture handlers for Profile subtabs
  const profileTouchStartX = useRef<number | null>(null);
  const profileTouchEndX = useRef<number | null>(null);

  const handleProfileTouchStart = (e: React.TouchEvent) => {
    profileTouchStartX.current = e.targetTouches[0].clientX;
  };

  const handleProfileTouchMove = (e: React.TouchEvent) => {
    profileTouchEndX.current = e.targetTouches[0].clientX;
  };

  const handleProfileTouchEnd = () => {
    if (!profileTouchStartX.current || !profileTouchEndX.current) return;
    const diffX = profileTouchStartX.current - profileTouchEndX.current;
    if (Math.abs(diffX) > 60) {
      if (diffX > 0) {
        setProfileSubTab('stats');
      } else {
        setProfileSubTab('profile');
      }
    }
    profileTouchStartX.current = null;
    profileTouchEndX.current = null;
  };
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [streakDays, setStreakDays] = useState(0);

  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [examIdInput, setExamIdInput] = useState('');
  const [activeExamHostUid, setActiveExamHostUid] = useState<string | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0);
  const [clearConfirmStep, setClearConfirmStep] = useState(0);
  const [isHostPaid, setIsHostPaid] = useState(false);
  const [isTakingPaid, setIsTakingPaid] = useState(false);
  const [hostExamId, setHostExamId] = useState<string | null>(null);
  const [hostedExams, setHostedExams] = useState<any[]>([]);
  const [showExamSidebar, setShowExamSidebar] = useState(false);
  const [showHostHelpModal, setShowHostHelpModal] = useState(false);

  // Scroll locking for Sidebar
  useEffect(() => {
    if (showExamSidebar) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [showExamSidebar]);

  // --- \u{1F4F1} APP STATE ---
  const [isChatRoomActive, setIsChatRoomActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'ai' | 'tools' | 'courses' | 'profile' | 'notifications' | 'exam' | 'chat' | 'class' | 'community' | 'quiz_history' | 'exam_history' | 'notes_history' | 'general_history' | 'premium' | 'omni_offline'>('home');
  const [nowTime, setNowTime] = useState(Date.now());
  const [homeSelectedCourse, setHomeSelectedCourse] = useState<any>(null);
  const [coursesFacultyFilter, setCoursesFacultyFilter] = useState<string | null>(null);
  const [coursesDepartmentFilter, setCoursesDepartmentFilter] = useState<string | null>(null);

  const openCoursePreviewFromHome = (course: any) => {
    setHomeSelectedCourse(course);
    setActiveTab('courses');
  };

  const openCoursesWithFilterFromHome = (faculty: string, department: string) => {
    setHomeSelectedCourse(null);
    setCoursesFacultyFilter(faculty || 'ALL');
    setCoursesDepartmentFilter(department || '');
    setActiveTab('courses');
  };

  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const getPremiumDaysInfo = () => {
    const isOwner = user?.email?.toLowerCase().trim() === 'nuellkelechi@gmail.com';
    if (isOwner) return { isOwner: true, days: 9999, text: 'Lifetime Owner Access' };
    
    if (!currentUserData?.premiumUntil) return null;
    
    let untilTime: number;
    if (typeof (currentUserData.premiumUntil as any)?.toDate === 'function') {
      untilTime = (currentUserData.premiumUntil as any).toDate().getTime();
    } else {
      untilTime = new Date(currentUserData.premiumUntil).getTime();
    }
    
    if (isNaN(untilTime)) return null;
    
    const diffMs = untilTime - nowTime;
    if (diffMs <= 0) return { expired: true, days: 0, text: 'Premium Expired' };
    
    const diffSecs = Math.floor(diffMs / 1000);
    const days = Math.ceil(diffSecs / 86400);
    
    return {
      expired: false,
      days,
      diffSecs,
      text: `Premium expires in ${days} ${days === 1 ? 'day' : 'days'}`
    };
  };

  const [communitySubTab, setCommunitySubTab] = useState<'quests' | 'rankings'>('quests');
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('omni_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {}
    return 'dark';
  });

  // --- QUOTA LIMIT EXCEEDED MODAL STATE ---
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [quotaModalMessage, setQuotaModalMessage] = useState<string>('');

  useEffect(() => {
    const handleQuotaEvent = (e: any) => {
      if (e?.detail?.message) {
        setQuotaModalMessage(e.detail.message);
      }
      setShowQuotaModal(true);
    };
    window.addEventListener('nsg_quota_error', handleQuotaEvent);
    return () => window.removeEventListener('nsg_quota_error', handleQuotaEvent);
  }, []);

  useEffect(() => {
    if (activeTab === 'community' || (activeTab === 'profile' && profileSubTab === 'stats')) {
      const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(50));
      const unsub = onSnapshot(q, (snap) => {
        setLeaderboard(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (err) => handleFirestoreError(err, FirestoreOperation.LIST, 'users'));
      return () => unsub();
    }
  }, [activeTab, profileSubTab]);

  useEffect(() => {
    const handleLoadSharedNote = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { noteId, access } = customEvent.detail;
      if (!noteId || !user) return;
      
      try {
        const noteDoc = await getDoc(doc(db, 'notes', noteId));
        if (noteDoc.exists()) {
          const noteData: any = { id: noteId, ...noteDoc.data(), sharedAccessType: access };
          setSelectedNote(noteData);
          setActiveTab('tools');
          setIsChatRoomActive(false);
          setUserNotification(`Loaded Note "${noteData.title || 'Untitled'}" in ${access === 'editable' ? 'Collab Edit' : 'Read-only'} mode!`);
        } else {
          // Fallback simulation note
          const mockNote = { 
            id: noteId, 
            title: "Advanced Quantum Mechanics & Space Vectors", 
            content: "### Curvature Transformations and Vector Mechanics\n\n- High-voltage particle acceleration mapping.\n- Dimensional coordinates projection equations:\n\n$$\\mathbf{V} = \\sum_{i} a_i \\mathbf{e}_i$$\n\n- Real-time AI synchronization triggered.\n- shared access: " + access,
            sharedAccessType: access,
            createdAt: new Date()
          };
          setSelectedNote(mockNote);
          setActiveTab('tools');
          setIsChatRoomActive(false);
          setUserNotification(`Loaded shared note notebook workspace!`);
        }
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        if (errorMsg.includes('client is offline') || errorMsg.includes('the client is offline')) {
          console.debug("Offline mode: falling back to simulated shared note");
          const mockNote = { 
            id: noteId, 
            title: "Advanced Quantum Mechanics & Space Vectors (Offline)", 
            content: "### Curvature Transformations and Vector Mechanics\n\n- Currently operating in Offline Persistence Mode.\n- You can still edit or view this workspace offline!\n\n$$\\mathbf{V} = \\sum_{i} a_i \\mathbf{e}_i$$\n\n- Changes will automatically sync when connection is fully restored.",
            sharedAccessType: access,
            createdAt: new Date()
          };
          setSelectedNote(mockNote);
          setActiveTab('tools');
          setIsChatRoomActive(false);
          setUserNotification(`Loaded shared note notebook workspace (Offline Mode)!`);
        } else {
          console.error("Error loading shared note:", err);
        }
      }
    };

    window.addEventListener('load_shared_note', handleLoadSharedNote);
    return () => window.removeEventListener('load_shared_note', handleLoadSharedNote);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setTotalUnreadMessages(0);
      return;
    }
    const q = query(collection(db, 'chats'), where('unreadBy', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTotalUnreadMessages(snapshot.size);
    }, (err) => handleFirestoreError(err, FirestoreOperation.LIST, 'chats'));
    return () => unsubscribe();
  }, [user]);
  
  const [userHandle, setUserHandle] = useState<string>('');
  const [isNativeBrowserVisible, setIsNativeBrowserVisible] = useState(false);
  const [isClassActive, setIsClassActive] = useState(false);
  const [classRoomId, setClassRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  
  useEffect(() => {
    safeStorage.removeItem('nsg_active_tab');
    safeStorage.removeItem('nsg_tools_subtab');
  }, []);

  const [toolsSubTab, setToolsSubTab] = useState<'menu' | 'record' | 'quiz' | 'exam' | 'faculty' | 'assignment' | 'courses' | 'notebook' | 'cgpa' | 'timetable'>('menu');

  // --- NATIVE PERMISSIONS DIAGNOSTICS & STATE ---
  const [permissionsState, setPermissionsState] = useState({
    camera: 'prompt',
    microphone: 'prompt',
    geolocation: 'prompt'
  });

  const checkDevicePermissions = async () => {
    if (!navigator.permissions) return;
    try {
      const results = await Promise.all([
        navigator.permissions.query({ name: 'camera' as any }).catch(() => null),
        navigator.permissions.query({ name: 'microphone' as any }).catch(() => null),
        navigator.permissions.query({ name: 'geolocation' as any }).catch(() => null)
      ]);
      
      setPermissionsState({
        camera: results[0] ? results[0].state : 'prompt',
        microphone: results[1] ? results[1].state : 'prompt',
        geolocation: results[2] ? results[2].state : 'prompt'
      });

      if (results[0]) {
        results[0].onchange = () => {
          if (results[0]) setPermissionsState(prev => ({ ...prev, camera: results[0]!.state }));
        };
      }
      if (results[1]) {
        results[1].onchange = () => {
          if (results[1]) setPermissionsState(prev => ({ ...prev, microphone: results[1]!.state }));
        };
      }
      if (results[2]) {
        results[2].onchange = () => {
          if (results[2]) setPermissionsState(prev => ({ ...prev, geolocation: results[2]!.state }));
        };
      }
    } catch (e) {
      console.warn("Permission query not supported on this device/browser context.", e);
    }
  };

  useEffect(() => {
    checkDevicePermissions();
  }, []);

  const requestHardwarePermission = async (type: 'camera' | 'microphone' | 'geolocation') => {
    try {
      if (type === 'camera') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setUserNotification("Camera Permission Granted successfully! 📸");
      } else if (type === 'microphone') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setUserNotification("Microphone Permission Granted successfully! 🎙️");
      } else if (type === 'geolocation') {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        setUserNotification("Geolocation Permission Granted successfully! 📍");
      }
      checkDevicePermissions();
    } catch (err: any) {
      console.error(`Permission ${type} request error:`, err);
      setUserNotification(`Access denied or dismissed on ${type} permission request.`);
      setPermissionsState(prev => ({ ...prev, [type]: 'denied' }));
    }
  };

  // --- NATIVE APP BACK BUTTON INTEGRATION ---
  // Prevents native Android/webview apps closing, routes history cleanly
  const isSyncingFromHistory = useRef(false);
  const isGeneratingSuggestions = useRef(false);
  const notifiedIds = useRef<Set<string>>(new Set());

  // Capacitor background push notifications, native permissions & offline action queue sync
  useEffect(() => {
    initPushNotifications();
    schedulePeriodicBackgroundNotifications();
    requestAppPermissions();
    const cleanupSync = initOfflineQueueSync(async (action) => {
      console.log('Syncing queued action:', action);
      return true;
    });
    return () => {
      if (cleanupSync) cleanupSync();
    };
  }, []);
  const [readArticles, setReadArticles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [blogPosts, setBlogPosts] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('nsg_cache_blog_posts');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [allReports, setAllReports] = useState<any[]>([]);

  // Load read articles from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nsg_read_articles');
      if (saved) setReadArticles(JSON.parse(saved));
    } catch (e) {
      console.warn("Failed to parse read articles from storage:", e);
    }
  }, []);

  const markArticleAsRead = (id: string) => {
    if (!readArticles.includes(id)) {
      const newRead = [...readArticles, id];
      setReadArticles(newRead);
      localStorage.setItem('nsg_read_articles', circularSafeStringify(newRead));
    }
  };

  const unreadCount = blogPosts.filter(post => !readArticles.includes(post.id)).length;
  const [libraryView, setLibraryView] = useState<'history' | 'library'>('history');
  const [showRecordSidebar, setShowRecordSidebar] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [refurbishedResult, setRefurbishedResult] = useState<string | null>(null);
  const [showAnalysisInRecord, setShowAnalysisInRecord] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAboutUsModal, setShowAboutUsModal] = useState(false);
  const [showContactUsModal, setShowContactUsModal] = useState(false);
  const [pendingQuizId, setPendingQuizId] = useState<string | null>(() => {
    return sessionStorage.getItem('nsg_pending_quiz_id') || null;
  });
  const [isLinkQuizLoading, setIsLinkQuizLoading] = useState(false);
  const [linkQuizTopic, setLinkQuizTopic] = useState('');
  const [selectedChatForRoom, setSelectedChatForRoom] = useState<any>(null);

  const handleOpenOmniWithPrompt = async (promptText: string, targetSessionId?: string) => {
    let omniId = `omni_${user?.uid || 'guest'}`;
    if (targetSessionId && targetSessionId !== 'new') {
      omniId = targetSessionId;
    } else if (targetSessionId === 'new') {
      omniId = `omni_${Date.now()}`;
    }

    const omniChatObj = {
      id: omniId,
      name: 'Omni by NSG',
      isOmni: true,
      photoURL: 'https://images.unsplash.com/photo-1675557009875-436f09789900?q=80&w=200&auto=format&fit=crop',
      type: 'direct',
      members: [user?.uid || 'guest', 'Omni']
    };
    setSelectedChatForRoom(omniChatObj);
    setActiveTab('chat');
    setIsChatRoomActive(true);

    if (promptText && user) {
      try {
        await addDoc(collection(db, 'chats', omniId, 'messages'), {
          senderId: user.uid,
          senderHandle: userHandle,
          senderName: user.displayName || userHandle,
          text: promptText,
          timestamp: serverTimestamp(),
          type: 'text',
          encrypted: true,
          seenBy: [user.uid]
        });
        await setDoc(doc(db, 'chats', omniId), {
          id: omniId,
          name: 'Omni by NSG',
          isOmni: true,
          lastMessage: promptText,
          lastMessageSender: user.displayName || userHandle,
          updatedAt: serverTimestamp(),
          members: [user.uid, 'Omni']
        }, { merge: true });
        handleTagOmni(promptText, omniId);
      } catch (err) {
        console.error("Error creating Omni chat message:", err);
      }
    }
  };

  const checkAndIncrementUsage = async (type: keyof typeof LIMITS) => {
    if (!user) {
      setShowAuthModal(true);
      return false;
    }
    
    // Calculate the date in the user's local timezone so that rolls over exactly at midnight local time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    const usageRef = doc(db, 'users', user.uid, 'usage', today);
    const usageSnap = await getDoc(usageRef);
    
    const isOwner = user?.email?.toLowerCase().trim() === 'nuellkelechi@gmail.com';
    const userIsPremium = isPremium || isOwner;
    const limits = userIsPremium ? LIMITS[type].PREMIUM : LIMITS[type].NORMAL;
    const currentCount = usageSnap.exists() ? (usageSnap.data()[type] || 0) : 0;

    if (!userIsPremium && currentCount >= (limits as any).DAILY) {
      if ((type as string) === 'QUIZ') {
        setUserNotification("subscribe for premium to panswer quiz");
        setActiveTab('premium');
        return false;
      }
      const displayType = (type as string) === 'QUIZ' ? 'Quiz Engine' : type;
      setUserNotification(`Daily limit reached for ${displayType} (${(limits as any).DAILY} per day). Everyday is a new day! Your limits reset at local midnight on ${today}.`);
      return false;
    }

    try {
      await setDoc(usageRef, { [type]: currentCount + 1 }, { merge: true });
      if ((type as string) === 'QUIZ') {
        setDailyQuizUsedCount(currentCount + 1);
      }
      return true;
    } catch (e) {
      handleFirestoreError(e, FirestoreOperation.WRITE, usageRef.path);
      return true; // Allow operation even if tracking fails temporarily
    }
  };

  // Auto-close auth modal when user is logged in, or force auth modal when unauthenticated
  useEffect(() => {
    if (user && !isAuthLoading) {
      if (showAuthModal && !pendingQuizId && !sessionStorage.getItem('nsg_pending_quiz_id')) {
        setShowAuthModal(false);
      }

      // If user just logged in and has a pending shared quiz ID
      const targetQuiz = pendingQuizId || sessionStorage.getItem('nsg_pending_quiz_id');
      if (targetQuiz) {
        setPendingQuizId(null);
        sessionStorage.removeItem('nsg_pending_quiz_id');
        setIsLinkQuizLoading(true);
        setUserNotification("Authentication successful! Loading your shared quiz...");
        loadSharedQuiz(targetQuiz);
      }
    } else if (!isAuthLoading && !user) {
      if (!showAuthModal) {
        setShowAuthModal(true);
      }
    }
  }, [user, isAuthLoading, showAuthModal, pendingQuizId]);
  useEffect(() => {
    if (!isAdminUser) return;
    const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setAllReports(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, FirestoreOperation.LIST, 'reports'));
    return () => unsub();
  }, [isAdminUser]);

  useEffect(() => {
    if (!isAdminUser) return;
    const q = query(collection(db, 'chats'), where('type', '==', 'group'));
    const unsub = onSnapshot(q, (snap) => {
      setAllGroups(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, FirestoreOperation.LIST, 'chats'));
    return () => unsub();
  }, [isAdminUser]);

  const handleReportAction = async (reportId: string, action: 'dismiss' | 'warn' | 'ban') => {
    try {
      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      if (action === 'ban') {
        await updateDoc(doc(db, 'users', report.suspectId), { status: 'deleted' });
        setGodModeNotification("User banned successfully.");
      } else if (action === 'warn') {
        await addDoc(collection(db, 'notifications'), {
          to: report.suspectId,
          title: "SECURITY WARNING",
          message: "A formal warning has been issued regarding your recent activities. Please adhere to terms.",
          timestamp: serverTimestamp(),
          type: 'warning'
        });
        setGodModeNotification("Warning issued to user.");
      }

      await deleteDoc(doc(db, 'reports', reportId));
      setGodModeNotification("Report handled.");
    } catch (err) {
      console.error(err);
      setGodModeNotification("Failed to handle report.");
    }
  };

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [authFullName, setAuthFullName] = useState('');
  const [authDOB, setAuthDOB] = useState('');
  const [authMatric, setAuthMatric] = useState('');
  const [authUniversity, setAuthUniversity] = useState('');
  const [authFaculty, setAuthFaculty] = useState('');
  const [authDepartment, setAuthDepartment] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authInviteCode, setAuthInviteCode] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{available: boolean, message: string} | null>(null);
  const [showUniSearchModal, setShowUniSearchModal] = useState(false);
  const [uniSearchQuery, setUniSearchQuery] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '', color: 'bg-white/10' });
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQuizShareModal, setShowQuizShareModal] = useState(false);
  const [isGeneratingShareImage, setIsGeneratingShareImage] = useState(false);
  const quizShareCardRef = useRef<HTMLDivElement>(null);
  const [shareName, setShareName] = useState('');
  const shareCardRef = useRef<HTMLDivElement>(null);
  const hasShownWelcomeNotification = useRef(false);
  const hasShownPeerActivityWelcomeNotification = useRef(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showGodMode, setShowGodMode] = useState(false);
  const [godTab, setGodTab] = useState<'dashboard' | 'users' | 'marketing' | 'blog' | 'reports' | 'courses'>('dashboard');
  const [reports, setReports] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [godModeNotification, setGodModeNotification] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [godUserSearch, setGodUserSearch] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [godUserFilter, setGodUserFilter] = useState<'all' | 'premium' | 'free' | 'online' | 'banned'>('all');
  const [legalPage, setLegalPage] = useState<'about' | 'terms' | 'contact' | 'privacy' | null>(null);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [activePhoneNotifs, setActivePhoneNotifs] = useState<any[]>([]);
  const [customCourses, setCustomCourses] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'courses'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const coursesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomCourses(coursesList);
    }, (err) => handleFirestoreError(err, FirestoreOperation.LIST, 'courses'));
    return () => unsubscribe();
  }, []);

  const triggerPhoneNotification = (title: string, body: string, type: 'quiz' | 'note' | 'assignment' | 'welcome' | 'community') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); 
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); 
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}

    // Only show 'quiz' type notifications (user's quiz congratulations) inside the NSG app UI (floating popups)
    if (type === 'quiz') {
      const id = Date.now().toString();
      const newNotif = {
        id,
        title,
        body,
        type,
      };
      setActivePhoneNotifs(prev => [newNotif, ...prev]);

      setTimeout(() => {
        setActivePhoneNotifs(prev => prev.filter(n => n.id !== id));
      }, 8000);
    }

    // Always trigger native device notification (main phone push notification tray) unless it's a quiz (which is already processed by the Firestore listener)
    if (Notification.permission === 'granted' && type !== 'quiz') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: '/icon.svg',
            badge: '/icon.svg',
            vibrate: [100, 50, 100],
            data: {
              clickAction: '/'
            }
          } as any).catch(() => {
            try {
              new Notification(title, {
                body,
                icon: '/icon.svg'
              });
            } catch (e) {}
          });
        });
      } else {
        try {
          new Notification(title, {
            body,
            icon: '/icon.svg'
          });
        } catch (e) {}
      }
    }
  };

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (currentUserData && !hasShownWelcomeNotification.current) {
      hasShownWelcomeNotification.current = true;
      const randomIndex = Math.floor(Math.random() * DID_YOU_KNOW_WORDS.length);
      const wordOfTheDay = DID_YOU_KNOW_WORDS[randomIndex];
      
      setTimeout(() => {
        triggerPhoneNotification(
          "Did You Know? 💡",
          wordOfTheDay,
          'welcome'
        );
      }, 3000);
    }
  }, [currentUserData]);

  // Password Strength Logic
  useEffect(() => {
    if (!authPassword) {
      setPasswordStrength({ score: 0, feedback: '', color: 'bg-white/10' });
      return;
    }
    let score = 0;
    if (authPassword.length > 6) score++;
    if (/[A-Z]/.test(authPassword)) score++;
    if (/[0-9]/.test(authPassword)) score++;
    if (/[^A-Za-z0-9]/.test(authPassword)) score++;

    let feedback = 'Weak';
    let color = 'bg-red-500';
    if (score === 2) { feedback = 'Fair'; color = 'bg-orange-500'; }
    else if (score === 3) { feedback = 'Good'; color = 'bg-yellow-500'; }
    else if (score >= 4) { feedback = 'Strong'; color = 'bg-green-500'; }

    setPasswordStrength({ score, feedback, color });
  }, [authPassword]);

  // Username Suggestion Logic
  useEffect(() => {
    if (authMode === 'signup' && authFullName && !authUsername) {
      const suggested = authFullName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + Math.floor(Math.random() * 1000);
      setAuthUsername(suggested);
    }
  }, [authFullName, authMode]);

  // Username Uniqueness check (debounced)
  useEffect(() => {
    if (!authUsername || authUsername.length < 3) {
      setUsernameStatus(null);
      return;
    }

    const checkUsername = async () => {
      try {
        const q = query(collection(db, 'users'), where('username', '==', authUsername.toLowerCase().trim()), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setUsernameStatus({ available: false, message: 'Username taken. Try adding some numbers!' });
        } else {
          setUsernameStatus({ available: true, message: 'Username available!' });
        }
      } catch (e: any) {
        console.error("Username check error:", e);
        if (e.message?.includes('permission')) {
           // Fallback or specific message
        }
      }
    };

    const timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [authUsername]);

  const syncActivity = async () => {
    if (!user || !currentUserData) return;
    const now = new Date();
    const lastActive = currentUserData.lastActive ? new Date(currentUserData.lastActive) : null;
    let newStreak = currentUserData.streak || 0;
    let newPoints = currentUserData.points || 0;

    if (!lastActive) {
      newStreak = 1;
      newPoints += 5;
    } else {
      const diffDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak += 1;
        newPoints += 5;
        if (newStreak % 7 === 0) newPoints += 50; // Bonus for 7 days
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    }

    await updateDoc(doc(db, 'users', user.uid), {
      lastActive: now.toISOString(),
      streak: newStreak,
      points: newPoints,
      rank: getUserRank(newPoints)
    });
  };

  useEffect(() => {
    if (user && currentUserData) {
      const timer = setTimeout(syncActivity, 5000); // Wait a bit after load
      return () => clearTimeout(timer);
    }
  }, [user, !!currentUserData]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userNotification, setUserNotification] = useState<string | null>(null);
  const [adminNotification, setAdminNotification] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [finishedHistory, setFinishedHistory] = useState<HomeHistoryItem[]>([]);
  const [activeAssignmentSolution, setActiveAssignmentSolution] = useState<any>(null);
  const [historyLoadingModal, setHistoryLoadingModal] = useState<{ show: boolean; title: string; message: string }>({
    show: false,
    title: '',
    message: ''
  });

  // Load finished history from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nsg_finished_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const unique = parsed.filter((item: any, index: number) => 
            parsed.findIndex((i: any) => i.id === item.id) === index
          );
          setFinishedHistory(unique);
        }
      }
    } catch (e) {
      console.warn("Failed to parse history from storage:", e);
    }
  }, []);

  const addToFinishedHistory = async (item: HomeHistoryItem) => {
    const sanitizedItem = sanitizeData(item);
    // Keep local for immediate feedback
    setFinishedHistory(prev => {
      const newHistory = [sanitizedItem, ...prev].filter((i, idx, self) => self.findIndex(t => t.id === i.id) === idx).slice(0, 50);
      localStorage.setItem('nsg_finished_history', circularSafeStringify(newHistory));
      return newHistory;
    });

    // Sync with Firestore
    if (user && sanitizedItem && sanitizedItem.id) {
      try {
        const firestoreData = JSON.parse(JSON.stringify(sanitizedItem));
        await setDoc(doc(db, 'users', user.uid, 'studyHistory', String(sanitizedItem.id)), firestoreData);
      } catch (err) {
        console.error("History Sync Error:", err);
      }
    }
  };

  const handleSaveFacultyHistory = (id: string, title: string, type: string, score?: number, data?: any) => {
    addToFinishedHistory({
      id,
      title,
      type: type as any,
      score,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
      data
    });
  };

  const removeFromHistory = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    showConfirm(
      "Delete from History",
      "Are you sure you want to remove this from your study history? This action cannot be undone.",
      async () => {
        setFinishedHistory(prev => {
          const newHistory = prev.filter(item => item.id !== id);
          localStorage.setItem('nsg_finished_history', circularSafeStringify(newHistory));
          return newHistory;
        });
        
        if (user) {
          try {
            await deleteDoc(doc(db, 'users', user.uid, 'studyHistory', id));
          } catch (err) {
            console.error("History Delete Sync Error:", err);
          }
        }
        setUserNotification("Item removed from history.");
      },
      "Remove",
      true
    );
  };

  // --- \u{1F4E6} PWA STATE ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallTimer, setShowInstallTimer] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInstallTimer(false);
    }, 30000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();
    window.addEventListener('focus', checkStandalone);
    return () => window.removeEventListener('focus', checkStandalone);
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setUserNotification("To use in app, open your browser menu and select 'Add to Home Screen' or 'Install App'.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  // --- \u{1F48E} PREMIUM STATE ---
  const [isPremium, setIsPremium] = useState(false);
  const [premiumTimeLeft, setPremiumTimeLeft] = useState<string>("");
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // --- \u{1F916} AI PERSUASION & EMAIL STATES ---
  const [aiPersuasions, setAiPersuasions] = useState<any[]>([]);
  const [loadingPersuasions, setLoadingPersuasions] = useState(false);
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState(false);
  const [emailPreviewSubject, setEmailPreviewSubject] = useState("");
  const [emailPreviewContent, setEmailPreviewContent] = useState("");
  const [emailPreviewTo, setEmailPreviewTo] = useState("");
  const [sendingEmailLoader, setSendingEmailLoader] = useState(false);

  // --- 🔮 AI PEER CHALLENGES & SUGGESTIONS ---
  const [loadingActChallengeId, setLoadingActChallengeId] = useState<string | null>(null);
  const [activeAIChallenge, setActiveAIChallenge] = useState<any | null>(null);
  const [showAIChallengeModal, setShowAIChallengeModal] = useState(false);

  // --- \u{1F451} GOD MODE LOGIC ---
  // --- 👑 GOD MODE & PREMIUM EFFECT ---
  useEffect(() => {
    const isOwner = user?.email?.toLowerCase().trim() === 'nuellkelechi@gmail.com';
    
    if (isOwner) {
      setIsPremium(true);
      setIsAdminUser(true);
      setIsTakingPaid(true);
      setIsHostPaid(true);
      setPremiumTimeLeft("OWNER ACCESS");
      return;
    }

    if (currentUserData) {
      const isCurrentlySubscribed = currentUserData.premiumUntil 
        ? new Date(currentUserData.premiumUntil).getTime() > Date.now() 
        : false;
      const isExplicitGodBypass = currentUserData.bypassAllPayments === true;
      const effectivePremium = (currentUserData.isPremium === true && isCurrentlySubscribed) || isExplicitGodBypass;

      setIsTakingPaid(effectivePremium || currentUserData.bypassTakingPayment === true);
      setIsHostPaid(effectivePremium || currentUserData.bypassHostingPayment === true);

      if (effectivePremium) {
        setIsPremium(true);
        if (isExplicitGodBypass) {
          setPremiumTimeLeft("GOD MODE ACTIVE");
        } else if (currentUserData.premiumUntil) {
          const until = new Date(currentUserData.premiumUntil).getTime();
          const updateTimer = () => {
            const diff = until - Date.now();
            if (diff <= 0) {
              if (!isExplicitGodBypass) {
                setIsPremium(false);
                setPremiumTimeLeft("");
              }
              return;
            }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setPremiumTimeLeft(`${days}d ${hours}h ${mins}m`);
          };
          updateTimer();
          const interval = setInterval(updateTimer, 60000);
          return () => clearInterval(interval);
        } else {
          setPremiumTimeLeft("ACTIVE");
        }
      } else {
        setIsPremium(false);
        setPremiumTimeLeft("");
      }
    } else {
      setIsTakingPaid(false);
      setIsHostPaid(false);
      setIsPremium(false);
      setPremiumTimeLeft("");
    }
  }, [currentUserData, user]);

  useEffect(() => {
    if (showGodMode && (user?.email?.toLowerCase().trim() === "nuellkelechi@gmail.com" || isAdminUser)) {
      const unsubscribe = onSnapshot(query(collection(db, 'users'), limit(250)), (snapshot) => {
        const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        usersList.sort((a: any, b: any) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });
        setAllUsers(usersList);
      }, (err) => handleFirestoreError(err, FirestoreOperation.LIST, 'users'));

      const reportsUnsubscribe = onSnapshot(query(collection(db, 'reports'), orderBy('timestamp', 'desc'), limit(50)), (snapshot) => {
        const reportsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReports(reportsList);
      }, (err) => handleFirestoreError(err, FirestoreOperation.LIST, 'reports'));

      return () => {
        unsubscribe();
        reportsUnsubscribe();
      };
    }
  }, [showGodMode, user, isAdminUser, currentUserData]);

  useEffect(() => {
    // Load cached blog posts first to save quota
    try {
      const cached = localStorage.getItem('nsg_cache_blog_posts');
      if (cached) {
        setBlogPosts(JSON.parse(cached));
      }
    } catch (e) {}

    // Fetch once instead of holding continuous snapshot stream
    getDocs(query(collection(db, 'blogPosts'), orderBy('timestamp', 'desc'), limit(15)))
      .then((snapshot) => {
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (posts.length > 0) {
          setBlogPosts(posts);
          localStorage.setItem('nsg_cache_blog_posts', circularSafeStringify(posts));
        }
      })
      .catch((err) => {
        handleFirestoreError(err, FirestoreOperation.GET, 'blogPosts');
      });
  }, []);

  // --- REAL-TIME SOCIAL FEED & NOTIFICATIONS STATES ---
  const [personalNotifications, setPersonalNotifications] = useState<any[]>([]);
  const [globalActivities, setGlobalActivities] = useState<any[]>([]);
  const [homeFeedTab, setHomeFeedTab] = useState<'personal' | 'community'>('community');

  // Trigger Scholar Achievement welcome notification on login if peer activities exist
  useEffect(() => {
    if (currentUserData && user && globalActivities.length > 0 && !hasShownPeerActivityWelcomeNotification.current) {
      // Find the first activity that belongs to someone else and doesn't mention the current user
      const userHandle = (currentUserData?.username || "").toLowerCase();
      const userDisp = (user.displayName || "").toLowerCase();
      
      const peerAct = globalActivities.find((act: any) => {
        if (!act.userId || act.userId === user.uid) return false;
        
        const actUsername = (act.username || "").toLowerCase();
        if (userHandle && actUsername === userHandle) return false;
        
        const actText = (act.text || "").toLowerCase();
        if (userHandle && actText.includes(userHandle)) return false;
        if (userDisp && actText.includes(userDisp)) return false;
        
        return true;
      });

      if (peerAct) {
        hasShownPeerActivityWelcomeNotification.current = true;
        
        setTimeout(() => {
          triggerPhoneNotification(
            "Scholar Achievement 🎓",
            peerAct.text || `${peerAct.username || 'A scholar'} completed an activity!`,
            'community'
          );
        }, 6000); // Trigger 3 seconds after "Did You Know"
      }
    }
  }, [currentUserData, user, globalActivities]);

  // --- LISTEN FOR PERSONAL NOTIFICATIONS ---
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('to', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(30)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPersonalNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, FirestoreOperation.LIST, 'notifications'));
    return () => unsubscribe();
  }, [user]);

  // --- MARK NOTIFICATIONS AS READ WHEN VISITING NOTIFICATIONS TAB ---
  useEffect(() => {
    if (activeTab === 'notifications' && user && personalNotifications.length > 0) {
      const unreadNotifs = personalNotifications.filter(n => !n.read);
      unreadNotifs.forEach(async (notif) => {
        try {
          await updateDoc(doc(db, 'notifications', notif.id), { read: true });
        } catch (e) {
          console.error("Error marking notification as read:", e);
        }
      });
    }
  }, [activeTab, personalNotifications, user]);

  // --- LISTEN FOR GLOBAL ACTIVITIES FEED ---
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'activities'),
      orderBy('timestamp', 'desc'),
      limit(40)
    );
    let isFirstEmission = true;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activitiesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGlobalActivities(activitiesList);

      if (isFirstEmission) {
        isFirstEmission = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.userId && data.userId !== user.uid) {
            let notificationType: 'quiz' | 'note' | 'assignment' = 'quiz';
            if (data.type?.includes('note') || data.type === 'class_complete') {
              notificationType = 'note';
            } else if (data.type?.includes('assignment')) {
              notificationType = 'assignment';
            }
            
            triggerPhoneNotification(
              "NSG Community Activity 🎓",
              data.text || `${data.username || 'Scholar'} updated their workspace!`,
              'community'
            );
          }
        }
      });
    }, (err) => handleFirestoreError(err, FirestoreOperation.LIST, 'activities'));
    return () => unsubscribe();
  }, [user]);

  // --- GENERATE DAILY SUGGESTIONS AUTOMATICALLY ---
  const generateAutomatedDailySuggestions = async () => {
    if (!user || !currentUserData) return;
    
    const today = new Date().toISOString().split('T')[0];
    const localKey = `nsg_notifs_generated_${user.uid}_${today}`;
    if (localStorage.getItem(localKey)) return;
    if (isGeneratingSuggestions.current) return;
    
    isGeneratingSuggestions.current = true;
    localStorage.setItem(localKey, 'true');
    
    console.log("Generating automated study suggestions for", currentUserData.username);
    
    try {
      const q = query(
        collection(db, 'notifications'),
        where('to', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      const existingNotifications = snap.docs.map(d => d.data());
      
      const countToday = existingNotifications.filter((n: any) => {
        if (!n.timestamp) return false;
        const d = n.timestamp.toDate ? n.timestamp.toDate() : new Date(n.timestamp);
        return d.toISOString().split('T')[0] === today;
      }).length;
      
      if (countToday >= 3) {
        localStorage.setItem(localKey, 'true');
        return;
      }

      const username = currentUserData.username || currentUserData.displayName || 'Scholar';
      const streak = currentUserData.streak || 0;
      
      const toCreate: any[] = [];
      
      // 1. Streak-compelling pity or motivation notification
      const hasStreakPity = existingNotifications.some((n: any) => n.subtype === 'streak_pity');
      if (!hasStreakPity) {
        if (streak >= 1) {
          toCreate.push({
            to: user.uid,
            title: `🔥 Don't break our streak!`,
            message: `I am your precious ${streak}-day study streak, so you really wanna break me? 🥺😭 Keep me alive - open notebook right now!`,
            type: 'streak',
            subtype: 'streak_pity',
            targetTab: 'tools',
            targetSubTab: 'notebook',
            timestamp: serverTimestamp() || new Date(),
            read: false
          });
        } else {
          toCreate.push({
            to: user.uid,
            title: `🚀 Let's start the fire, ${username}!`,
            message: `Your streak is currently at 0. Don't let others claim the leaderboard peak! 🏆 Launch a study session now and start your daily streak!`,
            type: 'streak',
            subtype: 'streak_pity',
            targetTab: 'tools',
            targetSubTab: 'notebook',
            timestamp: serverTimestamp() || new Date(),
            read: false
          });
        }
      }
      
      // 2. Cross-recommendation notification
      const hasCrossRec = existingNotifications.some((n: any) => n.subtype === 'cross_rec');
      if (!hasCrossRec && toCreate.length + countToday < 3) {
        const usedQuiz = finishedHistory.some(h => h.type === 'quiz');
        const usedExam = finishedHistory.some(h => h.type === 'exam');
        const usedNotebook = (sessions || []).length > 0;
        
        let title = `🌟 Personalized Study Plan`;
        let msg = `Hey ${username}, try our Step-by-Step Assignment Solver! 📲 Solve complex equations with clear photos instantly!`;
        let targetSub = 'assignment';
        
        if (!usedQuiz) {
          title = `⚡ Retention Booster`;
          msg = `Hi ${username}! Boost retention by completing a quick Smart Quiz on your weak areas today. Let's do this!`;
          targetSub = 'quiz';
        } else if (!usedNotebook) {
          title = `📝 Course Notes Sync`;
          msg = `Synchronise your lectures with our audio Recording and active Board Analysis summaries now!`;
          targetSub = 'notebook';
        } else if (!usedExam) {
          title = `🛡️ CBT Mock Examination`;
          msg = `Step into the Academic CBT Exam engine, ${username}. Simulate real pressure and see where you stand!`;
          targetSub = 'exam';
        }
        
        toCreate.push({
          to: user.uid,
          title: title,
          message: msg,
          type: 'recommendation',
          subtype: 'cross_rec',
          targetTab: 'tools',
          targetSubTab: targetSub,
          timestamp: serverTimestamp() || new Date(),
          read: false
        });
      }

      // 3. Automated tool greeting / thanking
      const hasThankYou = existingNotifications.some((n: any) => n.subtype === 'thank_you');
      if (!hasThankYou && toCreate.length + countToday < 3) {
        const usedAny = (sessions || []).length > 0 || finishedHistory.length > 0;
        if (usedAny) {
          toCreate.push({
            to: user.uid,
            title: `💝 Scholars' Appreciation`,
            message: `Thank you for studying with NSG today, ${username}! You're building a smarter, highly consistent future. Keep going! 💡`,
            type: 'congrats',
            subtype: 'thank_you',
            targetTab: 'home',
            timestamp: serverTimestamp() || new Date(),
            read: false
          });
        } else {
          toCreate.push({
            to: user.uid,
            title: `⏱️ Tick Tock! Perfect Day to Learn`,
            message: `Every day is a new opportunity, ${username}! Your peers are active in study groups. Join a classroom or start solo!`,
            type: 'motivation',
            subtype: 'thank_you',
            targetTab: 'tools',
            targetSubTab: 'courses',
            timestamp: serverTimestamp() || new Date(),
            read: false
          });
        }
      }

      for (const notif of toCreate) {
        await addDoc(collection(db, 'notifications'), notif);
      }
    } catch (err) {
      console.error("Error generating automated suggestions:", err);
    } finally {
      isGeneratingSuggestions.current = false;
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      await updateDoc(doc(db, 'notifications', notif.id), { read: true });
    } catch (e) {
      console.error("Error marking notification read:", e);
    }

    if (notif.type === 'classroom_invite' && notif.classId) {
      joinClass(notif.classId);
    } else if (notif.targetTab) {
      setActiveTab(notif.targetTab);
      if (notif.targetSubTab) {
        setToolsSubTab(notif.targetSubTab);
      }
    } else if (notif.type === 'streak' || notif.type === 'streak_request' || notif.type === 'streak_accept') {
      setActiveTab('tools');
      setToolsSubTab('notebook');
    } else if (notif.type === 'quiz' || notif.title?.toLowerCase().includes('quiz')) {
      setActiveTab('tools');
      setToolsSubTab('quiz');
    } else if (notif.type === 'exam' || notif.title?.toLowerCase().includes('exam') || notif.title?.toLowerCase().includes('cbt')) {
      setActiveTab('tools');
      setToolsSubTab('exam');
    } else if (notif.type === 'chat' || notif.title?.toLowerCase().includes('chat') || notif.type === 'chat_group') {
      setActiveTab('chat');
    } else {
      if (notif.targetTab) {
        setActiveTab(notif.targetTab);
      }
    }
    setUserNotification(`Navigating to target: "${notif.title}"! 🚀`);
  };

  useEffect(() => {
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      const localKey = `nsg_notifs_generated_${user.uid}_${today}`;
      if (!localStorage.getItem(localKey)) {
        generateAutomatedDailySuggestions();
      }
    }
  }, [user?.uid]);

  // --- NOTIFICATION PERMISSIONS ---
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // --- LISTEN FOR NOTIFICATIONS ---
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'), 
      where('to', 'in', [user.uid, 'all']),
      orderBy('timestamp', 'desc'), 
      limit(5)
    );
    
    let isFirstEmission = true;
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        const id = docSnap.id;
        const data = docSnap.data();
        
        if (isFirstEmission) {
          notifiedIds.current.add(id);
          return;
        }
        
        if (!notifiedIds.current.has(id)) {
          notifiedIds.current.add(id);
          
          const cleanTitle = (data.title || 'NSG Academic Alert')
            .replace(/suggestions/gi, 'Insights')
            .replace(/suggestion/gi, 'Insight')
            .replace(/suggests/gi, 'Guides')
            .replace(/suggest/gi, 'Recommend');
          const cleanMessage = (data.message || '')
            .replace(/suggestions/gi, 'Insights')
            .replace(/suggestion/gi, 'Insight')
            .replace(/suggests/gi, 'Guides')
            .replace(/suggest/gi, 'Recommend');

          // Triggers phone system notification bar popup on native app & Web
          scheduleLocalNotification(cleanTitle, cleanMessage);
        }
      });
      
      isFirstEmission = false;
    }, (err) => {
      if (user) handleFirestoreError(err, FirestoreOperation.LIST, 'notifications');
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("\u{1F680} Attempting to publish blog post...", newPost);
    
    if (!newPost.title || !newPost.content) {
      setGodModeNotification("Title and content are required.");
      return;
    }

    try {
      const postData = {
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        timestamp: serverTimestamp(),
        author: "NSG Admin"
      };

      console.log("\u{1F4E6} Sending to Firestore:", postData);
      
      const docRef = await addDoc(collection(db, 'blogPosts'), postData);
      console.log("\u{2705} Blog post published with ID:", docRef.id);
      
      // Also send a global notification
      await addDoc(collection(db, 'notifications'), {
        to: 'all',
        title: "News Update Published!",
        message: newPost.title.trim(),
        timestamp: serverTimestamp(),
        type: 'blog'
      });

      setNewPost({ title: '', content: '' });
      setIsAddingPost(false);
      setGodModeNotification("Blog post published successfully!");
    } catch (error: any) {
      console.error("\u{274C} Error adding post:", error);
      setGodModeNotification(`Failed to publish: ${error.message || 'Unknown error'}`);
    }
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    try {
      await updateDoc(doc(db, 'blogPosts', editingPost.id), {
        title: editingPost.title,
        content: editingPost.content,
        lastUpdated: serverTimestamp()
      });
      setIsEditingPost(false);
      setEditingPost(null);
      setGodModeNotification("Post updated successfully!");
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseCode.trim() || !newCourseName.trim() || !newCourseDesc.trim()) {
      setGodModeNotification("Please fill in all course fields.");
      return;
    }

    try {
      const courseData = {
        code: newCourseCode.trim().toUpperCase(),
        name: newCourseName.trim(),
        description: newCourseDesc.trim(),
        updatedAt: serverTimestamp ? serverTimestamp() : new Date()
      };

      if (editingCourseId) {
        await updateDoc(doc(db, 'courses', editingCourseId), courseData);
        setGodModeNotification("Course updated successfully!");
      } else {
        await addDoc(collection(db, 'courses'), {
          ...courseData,
          createdAt: serverTimestamp ? serverTimestamp() : new Date()
        });
        setGodModeNotification("Course saved successfully!");
      }

      setNewCourseCode('');
      setNewCourseName('');
      setNewCourseDesc('');
      setEditingCourseId(null);
    } catch (err: any) {
      console.error("Error saving course:", err);
      setGodModeNotification(`Failed to save course: ${err.message || 'Unknown error'}`);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course from the curriculum?")) return;
    try {
      await deleteDoc(doc(db, 'courses', id));
      setGodModeNotification("Course deleted successfully.");
    } catch (err: any) {
      console.error("Error deleting course:", err);
      setGodModeNotification(`Failed to delete course: ${err.message}`);
    }
  };

  const handleReaction = async (postId: string, emoji: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      const postRef = doc(db, 'blogPosts', postId);
      const post = blogPosts.find(p => p.id === postId);
      const reactions = post.reactions || {};
      const currentCount = reactions[emoji] || 0;
      
      await updateDoc(postRef, {
        [`reactions.${emoji}`]: currentCount + 1
      });
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const deletePost = async (id: string) => {
    showConfirm(
      "Delete Post",
      "Are you sure you want to delete this post?",
      async () => {
        try {
          await deleteDoc(doc(db, 'blogPosts', id));
          setGodModeNotification("Post deleted.");
          setTimeout(() => setGodModeNotification(null), 3000);
        } catch (error) {
          console.error("Error deleting post:", error);
        }
      },
      "Delete",
      true
    );
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const userToToggle = allUsers.find(u => u.id === userId);
    const newStatus = currentStatus === 'deleted' ? 'active' : 'deleted';
    
    if (userToToggle?.email === 'nuellkelechi@gmail.com' && newStatus === 'deleted') {
      setGodModeNotification("CRITICAL: God Mode account cannot be deactivated!");
      setTimeout(() => setGodModeNotification(null), 3000);
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      setGodModeNotification(`User account ${newStatus === 'deleted' ? 'deactivated' : 'revived'} successfully`);
      setTimeout(() => setGodModeNotification(null), 3000);
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const updateUserPermissions = async (userId: string, field: string, value: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { [field]: value });
      setGodModeNotification("Permissions updated successfully");
      setTimeout(() => setGodModeNotification(null), 3000);
    } catch (error) {
      console.error("Error updating permissions:", error);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        fullName: editingUser.fullName || editingUser.displayName || '',
        displayName: editingUser.displayName || editingUser.fullName || '',
        username: editingUser.username || '',
        email: editingUser.email || '',
        matric: editingUser.matric || editingUser.matricNumber || '',
        matricNumber: editingUser.matricNumber || editingUser.matric || '',
        dob: editingUser.dob || '',
        gender: editingUser.gender || 'Male',
        university: editingUser.university || '',
        level: editingUser.level || '',
        department: editingUser.department || '',
        faculty: editingUser.faculty || '',
        whatsappNumber: editingUser.whatsappNumber || '',
        isPremium: !!editingUser.isPremium,
        bypassAllPayments: !!editingUser.bypassAllPayments,
        bypassHostingPayment: !!editingUser.bypassHostingPayment,
        bypassTakingPayment: !!editingUser.bypassTakingPayment,
        updatedAt: new Date().toISOString()
      });
      setEditingUser(null);
      setGodModeNotification("User profile configuration updated successfully");
      setTimeout(() => setGodModeNotification(null), 3000);
    } catch (error) {
      console.error("Error editing user:", error);
    }
  };

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    try {
      await setDoc(doc(db, 'chats', editingGroup.id), {
        name: editingGroup.name || '',
        description: editingGroup.description || '',
        photoURL: editingGroup.photoURL || ''
      }, { merge: true });
      setEditingGroup(null);
      setGodModeNotification("Group cluster reconfigured successfully");
      setTimeout(() => setGodModeNotification(null), 3000);
    } catch (error) {
      console.error("Error editing group:", error);
      setGodModeNotification("Failed to update group cluster");
    }
  };

  // --- \u{1F399}\u{FE0F} RECORDING ENGINE ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [transcriptionNotes, setTranscriptionNotes] = useState('');
  const lastFinalizedTranscriptRef = useRef('');
  const [isAnalysingAudio, setIsAnalysingAudio] = useState(false); // For full analysis after stop
  const [isTranscribing, setIsTranscribing] = useState(false); // For live chunks
  const [showPremiumTrial, setShowPremiumTrial] = useState(false); // New Premium Trial Modal
  const [onboardingIndex, setOnboardingIndex] = useState(0); // Onboarding slider index
  const [hasShownTrialThisSession, setHasShownTrialThisSession] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const segmentRecorderRef = useRef<MediaRecorder | null>(null);
  const segmentTimeoutRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chunkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processorQueue = useRef<Promise<void>>(Promise.resolve());
  const isStopRequested = useRef(false);
  // We'll use audioChunksRef directly for full accumulated transcription
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentRecordingSessionIdRef = useRef<string | null>(null);
  const processedChunksCountRef = useRef(0);

  // --- \u{1F4C2} MEDIA & UPLOAD ---
  const [uploadedImages, setUploadedImages] = useState<MediaFile[]>([]);

  // --- \u{1F916} AI CHAT SYSTEM ---
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatSessionId, setActiveChatSessionId] = useState<string | null>(null);
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [chatMode, setChatMode] = useState<'General' | 'Vision' | 'Creative' | 'Live'>('General');
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [aiUsage, setAiUsage] = useState(45); // Mock usage percentage
  const [splitNotepadOpen, setSplitNotepadOpen] = useState(false);
  const [showAppPlusMenu, setShowAppPlusMenu] = useState(false);
  const appGalleryInputRef = useRef<HTMLInputElement>(null);
  const appFilesInputRef = useRef<HTMLInputElement>(null);
  const [notepadContent, setNotepadContent] = useState('Workspace study notes and codes drafted here...');
  const [speechActiveId, setSpeechActiveId] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInstanceRef = useRef<any>(null);

  // --- \u{1F4DA} PERSISTENCE ---
  const [sessions, setSessions] = useState<LectureSession[]>([]);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  // --- DAILY STUDY QUESTS DETAILS (Dynamic 10 League progressive tasks!) ---
  const dailyQuests = useMemo(() => {
    const points = currentUserData?.points || 0;
    const leagueName = getUserRank(points) as string;

    if (leagueName === "Bronze League") {
      return [
        {
          id: "bronze_record",
          title: "Master AI Voice Recorder",
          desc: "Record a mock class (or mock sessions) to earn starting XP",
          progress: sessions.length >= 1 ? "1/1" : `${sessions.length}/1`,
          isDone: sessions.length >= 1,
          reward: 5,
          chest: "🎤",
          buttonLabel: "BOOST NOW",
          targetTab: "tools",
          targetSubTab: "record"
        },
        {
          id: "bronze_quiz_score",
          title: "Launch Quiz Challenge",
          desc: "Generate a quiz and score above 50%",
          progress: finishedHistory.some(h => h.type === 'quiz' && h.score >= 50) ? "1/1" : "0/1",
          isDone: finishedHistory.some(h => h.type === 'quiz' && h.score >= 50),
          reward: 5,
          chest: "🧠",
          buttonLabel: "TEST RETENTION",
          targetTab: "tools",
          targetSubTab: "quiz"
        },
        {
          id: "bronze_invite",
          title: "Invite Study Buddy",
          desc: "Invite one friend to your study loop (Earn final 5 XP to clear Bronze!)",
          progress: currentUserData?.invitedFriend ? "1/1" : "0/1",
          isDone: !!currentUserData?.invitedFriend,
          reward: 5,
          chest: "🤝",
          buttonLabel: "FIRE UP",
          targetTab: "profile",
          targetSubTab: "stats"
        }
      ];
    } else if (leagueName === "Silver League") {
      return [
        {
          id: "silver_quizzes",
          title: "Quiz Master in Silver",
          desc: "Create 3 distinct active custom quizzes for review",
          progress: finishedHistory.filter(h => h.type === 'quiz').length >= 3 ? "3/3" : `${finishedHistory.filter(h => h.type === 'quiz').length}/3`,
          isDone: finishedHistory.filter(h => h.type === 'quiz').length >= 3,
          reward: 7,
          chest: "🏆",
          buttonLabel: "TEST RETENTION",
          targetTab: "tools",
          targetSubTab: "quiz"
        },
        {
          id: "silver_records",
          title: "Lecturer Mode",
          desc: "Record 2 full classes using voice recorder",
          progress: sessions.length >= 2 ? "2/2" : `${sessions.length}/2`,
          isDone: sessions.length >= 2,
          reward: 8,
          chest: "🎤",
          buttonLabel: "BOOST NOW",
          targetTab: "tools",
          targetSubTab: "record"
        },
        {
          id: "silver_notes",
          title: "Master Archivist",
          desc: "Complete 5 study sessions to build workspace notes",
          progress: (sessions.length + finishedHistory.length) >= 5 ? "5/5" : `${sessions.length + finishedHistory.length}/5`,
          isDone: (sessions.length + finishedHistory.length) >= 5,
          reward: 10,
          chest: "📚",
          buttonLabel: "FIRE UP",
          targetTab: "tools",
          targetSubTab: "notebook"
        }
      ];
    } else if (leagueName === "Gold League") {
      return [
        {
          id: "gold_consecutive",
          title: "Triple Threat Accuracy",
          desc: "Score > 80% on 3 revision quizzes",
          progress: finishedHistory.filter(h => h.type === 'quiz' && h.score >= 80).length >= 3 ? "3/3" : `${finishedHistory.filter(h => h.type === 'quiz' && h.score >= 80).length}/3`,
          isDone: finishedHistory.filter(h => h.type === 'quiz' && h.score >= 80).length >= 3,
          reward: 12,
          chest: "🎖️",
          buttonLabel: "TEST RETENTION",
          targetTab: "tools",
          targetSubTab: "quiz"
        },
        {
          id: "gold_classroom",
          title: "Classboard Leader",
          desc: "Host a workspace classroom whiteboard session",
          progress: currentUserData?.classroomHosted ? "1/1" : "0/1",
          isDone: !!currentUserData?.classroomHosted,
          reward: 15,
          chest: "🏫",
          buttonLabel: "LAUNCH CLASS",
          targetTab: "class"
        }
      ];
    } else if (leagueName === "Sapphire League") {
      return [
        {
          id: "sapphire_transcripts",
          title: "Academic Transcript",
          desc: "Complete 3 AI text transcriptions of audio files",
          progress: sessions.filter((s: any) => s.transcription).length >= 3 ? "3/3" : `${sessions.filter((s: any) => s.transcription).length}/3`,
          isDone: sessions.filter((s: any) => s.transcription).length >= 3,
          reward: 15,
          chest: "🐳",
          buttonLabel: "TRANSCRIBE NOW",
          targetTab: "tools",
          targetSubTab: "record"
        },
        {
          id: "sapphire_cbt",
          title: "CBT Mock Mastery",
          desc: "Complete 2 exam preparation papers",
          progress: finishedHistory.filter(h => h.type === 'exam').length >= 2 ? "2/2" : `${finishedHistory.filter(h => h.type === 'exam').length}/2`,
          isDone: finishedHistory.filter(h => h.type === 'exam').length >= 2,
          reward: 18,
          chest: "📝",
          buttonLabel: "START MOCK",
          targetTab: "tools",
          targetSubTab: "exam"
        }
      ];
    } else if (leagueName === "Emerald League") {
      return [
        {
          id: "emerald_chats",
          title: "AI Companion Dialogues",
          desc: "Query Omni AI Tutor 10 times about active coursework",
          progress: (currentUserData?.aiQueriesCount || 0) >= 10 ? "10/10" : `${currentUserData?.aiQueriesCount || 0}/10`,
          isDone: (currentUserData?.aiQueriesCount || 0) >= 10,
          reward: 20,
          chest: "🍀",
          buttonLabel: "ASK OMNI AI",
          targetTab: "tools",
          targetSubTab: "notebook"
        },
        {
          id: "emerald_shares",
          title: "Resource Sharing",
          desc: "Share notes or summaries to collaborative rooms",
          progress: (currentUserData?.sharesCount || 0) >= 3 ? "3/3" : `${currentUserData?.sharesCount || 0}/3`,
          isDone: (currentUserData?.sharesCount || 0) >= 3,
          reward: 22,
          chest: "📩",
          buttonLabel: "SHARE NOW",
          targetTab: "chat"
        }
      ];
    } else if (leagueName === "Diamond League") {
      return [
        {
          id: "diamond_flawless",
          title: "Flawless Quizzing",
          desc: "Achieve 100% accuracy on a revision set",
          progress: finishedHistory.some(h => h.type === 'quiz' && h.score === 100) ? "1/1" : "0/1",
          isDone: finishedHistory.some(h => h.type === 'quiz' && h.score === 100),
          reward: 25,
          chest: "🔮",
          buttonLabel: "PERFECT QUIZ",
          targetTab: "tools",
          targetSubTab: "quiz"
        }
      ];
    } else if (leagueName === "Ruby League") {
      return [
        {
          id: "ruby_recordings",
          title: "Mega Archivist Mode",
          desc: "Record/save 5 lecture streams total",
          progress: sessions.length >= 5 ? "5/5" : `${sessions.length}/5`,
          isDone: sessions.length >= 5,
          reward: 35,
          chest: "🌹",
          buttonLabel: "RECORD NOW",
          targetTab: "tools",
          targetSubTab: "record"
        }
      ];
    } else if (leagueName === "Obsidian League") {
      return [
        {
          id: "obsidian_exams",
          title: "Master Exam Completer",
          desc: "Score > 90% on 3 complex exams",
          progress: finishedHistory.filter(h => h.type === 'exam' && h.score >= 90).length >= 3 ? "3/3" : `${finishedHistory.filter(h => h.type === 'exam' && h.score >= 90).length}/3`,
          isDone: finishedHistory.filter(h => h.type === 'exam' && h.score >= 90).length >= 3,
          reward: 45,
          chest: "🕶️",
          buttonLabel: "ACE MOCKS",
          targetTab: "tools",
          targetSubTab: "exam"
        }
      ];
    } else if (leagueName === "Champion League") {
      return [
        {
          id: "champ_classes",
          title: "Monarch Presenter",
          desc: "Sustained high user presence in live classes",
          progress: (currentUserData?.classroomHosted || 0) >= 3 ? "3/3" : `${currentUserData?.classroomHosted || 0}/3`,
          isDone: (currentUserData?.classroomHosted || 0) >= 3,
          reward: 60,
          chest: "👑",
          buttonLabel: "BEGIN LECTURE",
          targetTab: "class"
        }
      ];
    } else {
      // Elite League
      return [
        {
          id: "elite_legend",
          title: "Unrivaled League Master",
          desc: "Maintain a study streak of 7+ days",
          progress: (currentUserData?.streak || 0) >= 7 ? "7/7" : `${currentUserData?.streak || 0}/7`,
          isDone: (currentUserData?.streak || 0) >= 7,
          reward: 100,
          chest: "💫",
          buttonLabel: "CHECK STREAK",
          targetTab: "profile"
        }
      ];
    }
  }, [sessions, finishedHistory, currentUserData]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Offline Sync for Recordings
  useEffect(() => {
    if (isOnline && user) {
      const syncOfflineRecordings = async () => {
        const offlineData = localStorage.getItem('nsg_offline_recordings');
        if (offlineData) {
          const recordings = JSON.parse(offlineData);
          if (recordings.length > 0) {
            setUserNotification(`Syncing ${recordings.length} offline recordings...`);
            for (const rec of recordings) {
              try {
                await addDoc(collection(db, 'users', user.uid, 'lectureSessions'), rec);
              } catch (err) {
                console.error("Sync Error:", err);
              }
            }
            localStorage.setItem('nsg_offline_recordings', '[]');
            setUserNotification("Offline recordings synced successfully!");
          }
        }
      };
      syncOfflineRecordings();
    }
  }, [isOnline, user]);

  // Offline Sync for Notes
  useEffect(() => {
    if (isOnline && user) {
      const syncOfflineNotes = async () => {
        const offlineNotesData = localStorage.getItem('nsg_offline_notes');
        if (offlineNotesData) {
          try {
            const notes = JSON.parse(offlineNotesData);
            if (notes.length > 0) {
              console.log(`📡 Syncing ${notes.length} offline notes to server...`);
              for (const note of notes) {
                try {
                  const { id, isOffline, updatedAt, createdAt, ...cleanData } = note;
                  const noteData = {
                    ...cleanData,
                    updatedAt: serverTimestamp()
                  };
                  if (id.startsWith('note-off-')) {
                    noteData.createdAt = serverTimestamp();
                    await addDoc(collection(db, 'notes'), noteData);
                  } else {
                    await updateDoc(doc(db, 'notes', id), noteData);
                  }
                } catch (err) {
                  console.error("Note Sync Error:", err);
                }
              }
              localStorage.setItem('nsg_offline_notes', '[]');
            }
          } catch (e) {
            console.error("Error parsing offline notes data", e);
          }
        }
      };
      syncOfflineNotes();
    }
  }, [isOnline, user]);

  const [selectedSession, setSelectedSession] = useState<LectureSession | null>(null);

  // --- \u{1F4DD} QUIZ STATE ---
  const [quizTopic, setQuizTopic] = useState('');
  const [quizImages, setQuizImages] = useState<MediaFile[]>([]);
  const [shareQuizLink, setShareQuizLink] = useState<string | null>(null);
  const [importedQuizNote, setImportedQuizNote] = useState<any | null>(null);
  const [showNoteSelectorForQuiz, setShowNoteSelectorForQuiz] = useState(false);

  const [isUploadingQuizImages, setIsUploadingQuizImages] = useState(false);
  const [isUploadingQuizDocs, setIsUploadingQuizDocs] = useState(false);

  const handleQuizImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const maxImages = isPremium ? LIMITS.QUIZ.PREMIUM.IMAGES : LIMITS.QUIZ.NORMAL.IMAGES;
    if (quizImages.length + files.length > maxImages) {
      setUserNotification(`Limit reached: ${isPremium ? 'Premium' : 'Free'} users can only upload up to ${maxImages} images for quiz generation.`);
      return;
    }
    
    setIsUploadingQuizImages(true);
    setUserNotification(`Uploading photo context for ${files.length} image(s)...`);
    try {
      const mapped = await Promise.all(files.map(async f => {
        let finalFile: File = f;
        try {
          // Try to compress the image
          const compressedBlob = await utilsCompressImage(f);
          finalFile = new File([compressedBlob], f.name, { type: 'image/jpeg' });
        } catch (compressionErr) {
          console.warn("Could not compress file, uploading raw:", compressionErr);
        }
        return {
          id: Math.random().toString(36).substr(2, 11),
          file: finalFile,
          preview: URL.createObjectURL(finalFile),
          type: 'image' as const
        };
      }));
      setQuizImages(prev => [...prev, ...mapped]);
      setUserNotification(`Uploaded ${files.length} photo(s) successfully!`);
    } catch (err) {
      console.error("Error embedding quiz images:", err);
      setUserNotification("Failed to process some attachments.");
    } finally {
      setIsUploadingQuizImages(false);
    }
  };

  const removeQuizImage = (id: string) => {
    setQuizImages(prev => prev.filter(img => img.id !== id));
  };

  const [quizDocuments, setQuizDocuments] = useState<Array<{ id: string; name: string; size: number; extractedText: string; pageImages?: string[]; file: File }>>([]);

  const handleQuizDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploadingQuizDocs(true);
    setUserNotification(`Uploading document context for ${files.length} file(s)...`);
    try {
      const mapped = await Promise.all(files.map(async f => {
        let extractedText = '';
        let pageImages: string[] = [];
        const isPdf = f.name.toLowerCase().endsWith('.pdf');

        if (isPdf) {
          const details = await extractPdfDetails(f);
          extractedText = details.text;
          pageImages = details.pageImages || [];
          if (details.truncated) {
            setUserNotification(`PDF "${f.name}" has ${details.pageCount} pages. First 20 pages were selected for vision & quiz processing.`);
          }
        } else {
          extractedText = await extractTextFromDocument(f);
        }

        return {
          id: Math.random().toString(36).substr(2, 11),
          name: f.name,
          size: f.size,
          extractedText,
          pageImages,
          file: f
        };
      }));
      setQuizDocuments(prev => {
        const nextDocs = [...prev, ...mapped];
        if (!quizTopic.trim() && nextDocs.length > 0) {
          const docTitles = nextDocs.map(d => d.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")).join(" & ");
          setQuizTopic(docTitles);
        }
        return nextDocs;
      });
      setUserNotification(`Converted ${files.length} document(s) to quiz context successfully!`);
    } catch (err) {
      console.error("Document upload error:", err);
      setUserNotification("Failed to extract content from document.");
    } finally {
      setIsUploadingQuizDocs(false);
    }
  };

  const removeQuizDocument = (id: string) => {
    setQuizDocuments(prev => prev.filter(d => d.id !== id));
  };
  const [quizDifficulty, setQuizDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Professional'>('Medium');
  const [quizQuestionCount, setQuizQuestionCount] = useState(20);
  const [quizAnswerType, setQuizAnswerType] = useState<'multiple_choice' | 'true_false' | 'single_choice'>('multiple_choice');
  const [quizAnswerTypes, setQuizAnswerTypes] = useState<string[]>(['multiple_choice']);
  const [dailyQuizUsedCount, setDailyQuizUsedCount] = useState<number>(0);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Scroll to top automatically whenever active tab, subtab, or subview changes
  useEffect(() => {
    const scrollToTopAll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      const scrollableElements = document.querySelectorAll('main, div, section, article');
      scrollableElements.forEach(el => {
        if (el.scrollTop && el.scrollTop > 0) {
          el.scrollTop = 0;
        }
      });
    };

    scrollToTopAll();
    const animationFrameId = requestAnimationFrame(scrollToTopAll);
    const timeoutId = setTimeout(scrollToTopAll, 50);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
    };
  }, [activeTab, toolsSubTab, profileSubTab, communitySubTab, isEditingProfile]);

  useEffect(() => {
    if (!user) return;
    const fetchQuizUsage = async () => {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        const usageRef = doc(db, 'users', user.uid, 'usage', today);
        const usageSnap = await getDoc(usageRef);
        if (usageSnap.exists()) {
          setDailyQuizUsedCount(usageSnap.data().QUIZ || 0);
        } else {
          setDailyQuizUsedCount(0);
        }
      } catch (e) {
        console.error("Error fetching quiz usage count:", e);
      }
    };
    fetchQuizUsage();
  }, [user, isGeneratingQuiz]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizState, setQuizState] = useState<'idle' | 'preview' | 'active' | 'finished' | 'review'>('idle');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [userQuizAnswers, setUserQuizAnswers] = useState<number[]>([]);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);

  const truncateTitle = (title: string, charLimit: number = 12) => {
    if (!title) return '';
    if (title.length > charLimit) {
      return title.substring(0, charLimit) + '...';
    }
    return title;
  };

  // Sync quiz progress to local storage
  useEffect(() => {
    if (quizState === 'active' && quizQuestions.length > 0) {
      const progressData = {
        quizQuestions,
        currentQuestionIndex,
        quizScore,
        userQuizAnswers,
        quizTopic,
        quizDifficulty,
        quizQuestionCount,
        currentQuizId
      };
      
      const key = currentQuizId ? `nsg_quiz_progress_${currentQuizId}` : 'nsg_current_quiz_progress';
      localStorage.setItem(key, circularSafeStringify(progressData));

      // Also dynamically update finishedHistory progress so the UI is unified in real-time
      if (currentQuizId) {
        setFinishedHistory(prev => {
          const idx = prev.findIndex(h => h.id === currentQuizId);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              progress: Math.round(((currentQuestionIndex + 1) / quizQuestions.length) * 100)
            };
            return updated;
          }
          return prev;
        });
      }
    }
  }, [quizState, currentQuestionIndex, quizScore, userQuizAnswers, quizQuestions, quizTopic, currentQuizId]);

  // Notebook state
  const [userNotes, setUserNotes] = useState<any[]>(() => {
    try {
      const cached = localStorage.getItem('nsg_cache_user_notes');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const handleOpenSharedNote = (noteId: string, noteTitle?: string, noteContent?: string) => {
    const found = userNotes.find((n: any) => n.id === noteId);
    if (found) {
      setSelectedNote(found);
    } else {
      setSelectedNote({
        id: noteId,
        title: noteTitle || 'Shared Note',
        content: noteContent || 'Empty Shared Note',
        attachments: []
      });
    }
    setActiveTab('tools');
    setToolsSubTab('notebook');
  };
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteHistory, setNoteHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [isUploadingNoteFile, setIsUploadingNoteFile] = useState(false);
  const [activeAudioNoteId, setActiveAudioNoteId] = useState<string | null>(null);
  const [isAudioTranscribing, setIsAudioTranscribing] = useState<boolean>(false);
  const [audioTranscribingPopup, setAudioTranscribingPopup] = useState<boolean>(false);
  const [audioUploadState, setAudioUploadState] = useState<{
    isUploading: boolean;
    progress: number;
    statusText: string;
    isSuccess: boolean;
    fileName: string;
  }>({
    isUploading: false,
    progress: 0,
    statusText: '',
    isSuccess: false,
    fileName: ''
  });
  const [notePreviewMode, setNotePreviewMode] = useState(false);
  const [isPodcastActive, setIsPodcastActive] = useState(false);
  const [podcastSpeechIndex, setPodcastSpeechIndex] = useState<number | null>(null);

  const stopPodcastSpeech = () => {
    setPodcastSpeechIndex(null);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const playPodcastDialogueLine = (index: number, dialogue: any[]) => {
    if (index < 0 || index >= dialogue.length) {
      setPodcastSpeechIndex(null);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    setPodcastSpeechIndex(index);
    const line = dialogue[index];
    const voiceId = line.char.toLowerCase() === 'zeal' ? 'zeal' : 'omni';
    
    speakText(
      line.text,
      voiceId,
      () => {},
      () => {
        setPodcastSpeechIndex(current => {
          if (current === index) {
            const nextIndex = index + 1;
            setTimeout(() => {
              setPodcastSpeechIndex(latestIndex => {
                if (latestIndex === null) return null;
                playPodcastDialogueLine(nextIndex, dialogue);
                return nextIndex;
              });
            }, 800);
          }
          return current;
        });
      }
    );
  };

  useEffect(() => {
    if (!isPodcastActive) {
      stopPodcastSpeech();
    }
  }, [isPodcastActive]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  const [podcastDialogue, setPodcastDialogue] = useState<{ id: string, char: 'Omni' | 'Zeal' | 'User', text: string, replyTo?: string }[]>([]);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
  const [isTeacherMode, setIsTeacherMode] = useState(false);
  const [isNotebookDrawerOpen, setIsNotebookDrawerOpen] = useState(false);
  const [showNoteInsertMenu, setShowNoteInsertMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [showPodcastUploadMenu, setShowPodcastUploadMenu] = useState(false);
  const transcriptionNotesRef = useRef('');
  const activeRecordingNoteIdRef = useRef<string | null>(null);
  const finalRecordingTitleRef = useRef<string>("Untitled");

  // Helper to get unfinished items
  const unfinishedQuizzes: HomeHistoryItem[] = quizQuestions.length > 0 && quizState === 'active' ? [{ id: currentQuizId || 'current-quiz', title: truncateTitle(quizTopic || 'Ongoing Quiz'), type: 'quiz', progress: Math.round(((currentQuestionIndex + 1) / quizQuestions.length) * 100) }] : [];
  const recordingsHistory: HomeHistoryItem[] = sessions.map(s => ({ 
    id: s.id, 
    title: truncateTitle(s.title), 
    type: 'recording', 
    date: s.date,
    timestamp: s.timestamp || (s.createdAt?.toMillis ? s.createdAt.toMillis() : new Date(s.date || 0).getTime()),
    progress: s.fullAnalysis ? 100 : 0
  }));
  const notesHistory: HomeHistoryItem[] = userNotes.map(n => {
    const timestamp = n.updatedAt?.toMillis ? n.updatedAt.toMillis() : (n.createdAt?.toMillis ? n.createdAt.toMillis() : Date.now());
    return {
      id: n.id,
      title: truncateTitle(n.title || 'Untitled Note'),
      type: 'note' as any,
      date: n.updatedAt?.toDate ? n.updatedAt.toDate().toLocaleDateString() : 'Just now',
      timestamp
    };
  });
  
  const homeHistoryFull = [
    ...unfinishedQuizzes.map(i => ({ ...i, title: truncateTitle(i.title, 40), timestamp: Date.now() + 1000 })), // Current items at very top
    ...recordingsHistory.map(i => ({ ...i, title: truncateTitle(i.title, 40) })), 
    ...notesHistory.map(i => ({ ...i, title: truncateTitle(i.title, 40) })), 
    ...finishedHistory.map(h => ({ ...h, title: truncateTitle(h.title, 40), timestamp: h.timestamp || (h.date ? new Date(h.date).getTime() : 0) }))
  ];

  const homeHistory = homeHistoryFull.filter((item, index, self) => 
    self.findIndex(i => i.id === item.id) === index
  ).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 50);

  const [matricNumber, setMatricNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [examLobbyState, setExamLobbyState] = useState<'login' | 'briefing' | 'exam' | 'result' | 'review'>('login');
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [examTimer, setExamTimer] = useState(3600); // 1 hour default
  const [examScore, setExamScore] = useState(0);
  const [subjectScores, setSubjectScores] = useState<{ subject: string; score: number; total: number }[]>([]);
  const [examFinished, setExamFinished] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [examAnswers, setExamAnswers] = useState<Record<any, any>>({});
  const [currentExamIndex, setCurrentExamIndex] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [examBookmarked, setExamBookmarked] = useState<Record<string, boolean>>({});
  const [showExamCalculator, setShowExamCalculator] = useState(false);
  const [showExamDictionary, setShowExamDictionary] = useState(false);
  const [examCalcValue, setExamCalcValue] = useState('');
  const [examDictSearch, setExamDictSearch] = useState('');
  const [examDictResult, setExamDictResult] = useState<string | null>(null);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [subjectBatchText, setSubjectBatchText] = useState<Record<string, string>>({});
  const [studentBatchPasteText, setStudentBatchPasteText] = useState('');

  const sanitizeCorrectAnswer = (ans: any): number => {
    if (ans === undefined || ans === null) return 0;
    if (typeof ans === 'number') {
      return Math.max(0, Math.min(3, Math.floor(ans)));
    }
    const str = String(ans).trim().toUpperCase();
    if (str === 'A' || str === '0') return 0;
    if (str === 'B' || str === '1') return 1;
    if (str === 'C' || str === '2') return 2;
    if (str === 'D' || str === '3') return 3;
    const parsed = parseInt(str);
    if (!isNaN(parsed)) {
      return Math.max(0, Math.min(3, parsed));
    }
    return 0;
  };

  const examTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Master Unified Back Button Navigation Handler
  const handleGlobalBack = useCallback((): boolean => {
    // 1. Modals & Overlays
    if (confirmModal.isOpen) {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      return true;
    }
    if (showOfflineModal) {
      setShowOfflineModal(false);
      return true;
    }
    if (showAuthModal) {
      setShowAuthModal(false);
      return true;
    }
    if (isEditingProfile) {
      setIsEditingProfile(false);
      return true;
    }
    if (showHelp) {
      setShowHelp(false);
      return true;
    }
    if (showGodMode) {
      setShowGodMode(false);
      return true;
    }
    if (isDeleteAccountOpen) {
      setIsDeleteAccountOpen(false);
      setDeleteConfirmInput("");
      return true;
    }
    if (showInviteModal) {
      setShowInviteModal(false);
      return true;
    }
    if (showPremiumModal) {
      setShowPremiumModal(false);
      return true;
    }
    if (audioTranscribingPopup) {
      setAudioTranscribingPopup(false);
      return true;
    }

    // 2. Active Chat Room
    if (isChatRoomActive || selectedChatForRoom) {
      setIsChatRoomActive(false);
      setSelectedChatForRoom(null);
      return true;
    }

    // 3. Tools Tab Sub-Views
    if ((activeTab as string) === 'tools') {
      if ((toolsSubTab as string) === 'quiz') {
        if (quizState === 'active' || quizState === 'preview' || quizState === 'finished' || quizState === 'review') {
          setQuizState('idle');
          return true;
        }
        if (quizCreationMethod !== null) {
          setQuizCreationMethod(null);
          return true;
        }
        if ((toolsSubTab as string) !== 'menu') {
          setToolsSubTab('menu');
          return true;
        }
      }

      if ((toolsSubTab as string) === 'exam') {
        if ((examLobbyState as string) === 'exam' || (examLobbyState as string) === 'result') {
          setExamLobbyState('hall' as any);
          return true;
        }
        if ((examLobbyState as string) === 'hall' || (examLobbyState as string) === 'welcome') {
          setExamLobbyState('login' as any);
          return true;
        }
        if ((toolsSubTab as string) !== 'menu') {
          setToolsSubTab('menu');
          return true;
        }
      }

      if ((toolsSubTab as string) === 'notebook') {
        if (selectedNote) {
          setSelectedNote(null);
          return true;
        }
        if ((toolsSubTab as string) !== 'menu') {
          setToolsSubTab('menu');
          return true;
        }
      }

      if ((toolsSubTab as string) === 'assignment') {
        if (activeAssignmentSolution) {
          setActiveAssignmentSolution(null);
          return true;
        }
        if ((toolsSubTab as string) !== 'menu') {
          setToolsSubTab('menu');
          return true;
        }
      }

      if ((toolsSubTab as string) !== 'menu') {
        setToolsSubTab('menu');
        return true;
      }

      // If on tools menu, go back to home page
      if ((activeTab as string) !== 'home') {
        setActiveTab('home');
        return true;
      }
    } else if ((activeTab as string) !== 'home') {
      // From any other main page (chat, social/community, profile, history, premium, notifications, etc.), pressing phone back ALWAYS leads back to home page!
      setActiveTab('home');
      return true;
    }

    return false;
  }, [
    confirmModal.isOpen, showOfflineModal, showAuthModal, isEditingProfile,
    showHelp, showGodMode, isDeleteAccountOpen, showInviteModal, showPremiumModal,
    audioTranscribingPopup, isChatRoomActive, selectedChatForRoom, activeTab, toolsSubTab,
    quizState, quizCreationMethod, examLobbyState, selectedNote, activeAssignmentSolution
  ]);

  // Native hardware back button support for Android
  useHardwareBackButton(handleGlobalBack);

  useEffect(() => {
    if (isSyncingFromHistory.current) return;

    const currentNavState = {
      activeTab,
      toolsSubTab,
      quizCreationMethod,
      quizState,
      examLobbyState,
      hasSelectedNote: !!selectedNote,
      profileSubTab,
      communitySubTab,
      isEditingProfile,
    };
    window.history.pushState(currentNavState, '');
  }, [activeTab, toolsSubTab, quizCreationMethod, quizState, examLobbyState, selectedNote, profileSubTab, communitySubTab, isEditingProfile]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const handled = handleGlobalBack();
      if (!handled && event.state) {
        isSyncingFromHistory.current = true;
        const state = event.state;
        
        if (state.activeTab && state.activeTab !== activeTab) {
          setActiveTab(state.activeTab);
        }
        if (state.toolsSubTab !== undefined && state.toolsSubTab !== toolsSubTab) {
          setToolsSubTab(state.toolsSubTab);
        }
        if (state.profileSubTab !== undefined && state.profileSubTab !== profileSubTab) {
          setProfileSubTab(state.profileSubTab);
        }
        if (state.communitySubTab !== undefined && state.communitySubTab !== communitySubTab) {
          setCommunitySubTab(state.communitySubTab);
        }
        if (state.isEditingProfile !== undefined && state.isEditingProfile !== isEditingProfile) {
          setIsEditingProfile(state.isEditingProfile);
        }
        
        setTimeout(() => {
          isSyncingFromHistory.current = false;
        }, 50);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleGlobalBack, activeTab, toolsSubTab, profileSubTab, communitySubTab, isEditingProfile]);

  // --- \u{1F6E0}\u{FE0F} ADMIN STATE ---
  const [examStatus, setExamStatus] = useState<'active' | 'ended' | 'none'>('none');
  const [adminMode, setAdminMode] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [templateEditForm, setTemplateEditForm] = useState<any | null>(null);
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'premium' | 'free'>('all');
  // --- BLOCK EDITOR HELPERS ---
  const parseToBlocks = (md: string) => {
    if (!md) return [{ id: 'init-text', type: 'text' as const, content: '' }];
    
    // Simple regex to find markdown images
    const regex = /!\[(.*?)\]\((.*?)\)/g;
    const blocks: any[] = [];
    let lastIndex = 0;
    let match;
    let textBlockCount = 0;

    while ((match = regex.exec(md)) !== null) {
      // Add text before image
      if (match.index > lastIndex) {
        blocks.push({
          id: `text-${textBlockCount++}`,
          type: 'text',
          content: md.substring(lastIndex, match.index)
        });
      }
      
      // Add image block (stable ID based on URL)
      blocks.push({
        id: `img-${match[2].substring(0, 30)}`,
        type: 'image',
        alt: match[1],
        url: match[2]
      });
      
      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < md.length) {
      blocks.push({
        id: `text-${textBlockCount++}`,
        type: 'text',
        content: md.substring(lastIndex)
      });
    }

    if (blocks.length === 0) return [{ id: 'init-text', type: 'text' as const, content: '' }];
    return blocks;
  };

  const blocksToMarkdown = (blocks: any[]) => {
    return blocks.map(b => {
      if (b.type === 'text') return b.content;
      if (b.type === 'image') return `![${b.alt}](${b.url})`;
      return '';
    }).join('');
  };

  const [noteBlocks, setNoteBlocks] = useState<any[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [noteScrollPos, setNoteScrollPos] = useState<'top' | 'bottom' | null>(null);
  const isFirstLoad = useRef(true);
  const lastFocusedBlock = useRef<{ id: string, start: number, end: number } | null>(null);

  // Handle initial scroll to bottom and scroll detection
  useEffect(() => {
    if (selectedNote) {
      if (isFirstLoad.current) {
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
          }
          isFirstLoad.current = false;
        }, 100);
      }
    } else {
      isFirstLoad.current = true;
    }
  }, [selectedNote]);

  const handleNoteScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    
    // If we are at the top (or near), show "Go to Bottom"
    if (scrollTop < 100 && scrollHeight > clientHeight + 100) {
      setNoteScrollPos('bottom');
    } 
    // If we are at the bottom (or near), show "Go to Top"
    else if (scrollTop + clientHeight > scrollHeight - 100 && scrollHeight > clientHeight + 100) {
      setNoteScrollPos('top');
    }
    // Middle area
    else if (scrollHeight > clientHeight + 100) {
      // Logic for showing depending on which direction user is further from
      if (scrollTop > scrollHeight / 2) {
        setNoteScrollPos('top');
      } else {
        setNoteScrollPos('bottom');
      }
    } else {
      setNoteScrollPos(null);
    }
  };

  const scrollToPosition = (pos: 'top' | 'bottom') => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTo({
      top: pos === 'top' ? 0 : scrollContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  };

  // Update blocks when selectedNote changes (and not currently editing blocks)
  const isUpdatingBlocksInternally = useRef(false);
  
  useEffect(() => {
    if (selectedNote && selectedNote.content !== undefined) {
      if (isUpdatingBlocksInternally.current) {
        isUpdatingBlocksInternally.current = false;
        return;
      }
      const parsed = parseToBlocks(selectedNote.content);
      if (blocksToMarkdown(parsed) !== blocksToMarkdown(noteBlocks)) {
        setNoteBlocks(parsed);
      }
    } else {
      setNoteBlocks([]);
    }
  }, [selectedNote?.id, selectedNote?.content]);

  const updateBlock = (id: string, content: string) => {
    const newBlocks = noteBlocks.map(b => b.id === id ? { ...b, content } : b);
    setNoteBlocks(newBlocks);
    isUpdatingBlocksInternally.current = true;
    handleNoteContentChange(blocksToMarkdown(newBlocks));
  };

  const removeBlock = (id: string) => {
    const newBlocks = noteBlocks.filter(b => b.id !== id);
    setNoteBlocks(newBlocks);
    handleNoteContentChange(blocksToMarkdown(newBlocks));
  };

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'notes'),
        where('uid', '==', user.uid),
        limit(100)
      );
      const unsub = onSnapshot(q, (snap) => {
        // Map and deduplicate by note ID
        const mapById = new Map<string, any>();
        snap.docs.forEach(doc => {
          mapById.set(doc.id, { id: doc.id, ...doc.data() });
        });
        const list = Array.from(mapById.values());

        // Sort by updatedAt desc locally
        const sortedList = list.sort((a: any, b: any) => {
          const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : (new Date(a.updatedAt || a.createdAt || 0).getTime()));
          const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : (new Date(b.updatedAt || b.createdAt || 0).getTime()));
          return timeB - timeA;
        });
        setUserNotes(sortedList);

        try {
          // Keep a lightweight cache representation to prevent QuotaExceededError in localStorage
          const lightweightCache = sortedList.slice(0, 50).map((n: any) => ({
            id: n.id,
            title: n.title,
            folder: n.folder,
            updatedAt: n.updatedAt,
            createdAt: n.createdAt,
            content: typeof n.content === 'string' ? n.content.substring(0, 5000) : '',
            attachments: (n.attachments || []).map((a: any) => ({
              id: a.id,
              name: a.name,
              size: a.size,
              type: a.type
            }))
          }));
          localStorage.setItem('nsg_cache_user_notes', circularSafeStringify(lightweightCache));
        } catch (storageErr) {
          console.warn("[Storage] nsg_cache_user_notes quota exceeded or save failed:", storageErr);
        }
      }, (err) => handleFirestoreError(err, FirestoreOperation.LIST, 'notes'));
      return () => unsub();
    } else {
      setUserNotes([]);
    }
  }, [user]);

  // --- IMAGE COMPRESSION UTILITY ---
  const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(base64Str); // Fallback to original if error
    });
  };

  // --- CLOUDINARY UPLOAD HELPER ---
  const handleCloudinaryUpload = async (base64: string): Promise<string | null> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.warn("Cloudinary not configured, falling back to base64");
      return base64;
    }

    try {
      const formData = new FormData();
      formData.append('file', base64);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      return data.secure_url;
    } catch (err) {
      console.error("Cloudinary error:", err);
      return base64; // Fallback
    }
  };

  const calculateDocumentSize = (data: any) => {
    try {
      // Create a safe copy for size calculation using our circular-safe utility
      const jsonStr = circularSafeStringify(data, (key, value) => {
        if (value && typeof value === 'object' && value.constructor?.name === 'FieldValue') {
          return new Date().toISOString(); // Placeholder for size calculation
        }
        return value;
      });
      return new TextEncoder().encode(jsonStr).length;
    } catch (e) {
      console.warn("Size calculation failed, falling back to approximation", e);
      return Math.min(1000000, 100 * Object.keys(data || {}).length); 
    }
  };

  const handlePodcastInput = async (input: string) => {
    if (!input.trim() || !user || isGeneratingPodcast) return;
    
    const context = selectedNote.content || "";
    const historyText = podcastDialogue.map(d => `${d.char}: ${d.text}`).join('\n');
    const msgId = Math.random().toString(36).substring(7);
    const cleanRawInput = input.trim();
    
    // Extract targets using word boundary check for strict matches
    const isOmniTargeted = /\b(omni)\b/i.test(cleanRawInput) || cleanRawInput.includes('@Omni') || cleanRawInput.includes('@omni');
    const isZealTargeted = /\b(zeal)\b/i.test(cleanRawInput) || cleanRawInput.includes('@Zeal') || cleanRawInput.includes('@zeal');
    
    let responderInstruction = "They can both chime in, discussing together.";
    if (isOmniTargeted && !isZealTargeted) {
      responderInstruction = "CRITICAL: The user has explicitly targeted Omni. Only Omni is allowed to respond to this question. Do NOT include any lines starting with 'Zeal:'. You MUST generate only 'Omni: ...' response.";
    } else if (isZealTargeted && !isOmniTargeted) {
      responderInstruction = "CRITICAL: The user has explicitly targeted Zeal. Only Zeal is allowed to respond to this question. Do NOT include any lines starting with 'Omni:'. You MUST generate only 'Zeal: ...' response.";
    }

    const newUserMsg = { id: msgId, char: 'User' as any, text: input, replyTo: replyingTo?.text };
    const updatedDialogue = [...podcastDialogue, newUserMsg];
    setPodcastDialogue(updatedDialogue);
    
    // Persistence: Trigger a save after adding user message
    if (selectedNote?.id) {
       saveNote(selectedNote.content, selectedNote.title, selectedNote.id, selectedNote.attachments, updatedDialogue);
    }
    
    setIsGeneratingPodcast(true);
    setReplyingTo(null); // Clear reply after sending

    try {
      const ai = getAiInstance();
      
      let systemPrompt = "";
      if (isTeacherMode) {
        systemPrompt = `You are Omni, a brilliant academic teacher. The user is asking about the following source content: "${context}". 
        Answer like a real human professor - use conversational, relatable language, avoid being overly formal or robotic. Let's make sure to use extremely easy to understand words, and use sentences with emojis when needed (like 💡, 📝, 🤔, 🌟, 🎒, 📚). Be explanatory but keep it like a discussion. You are the sole teacher here.`;
        if (replyingTo) {
          systemPrompt += `\nSPECIFIC CONTEXT: The user is replying/asking about this specific message from the past: "${replyingTo.char}: ${replyingTo.text}"`;
        }
        systemPrompt += `\nPrevious discussion history for context:\n${historyText}`;
      } else {
        const numAttachments = selectedNote?.attachments?.length || 0;
        const attachmentsList = selectedNote?.attachments && selectedNote.attachments.length > 0
          ? selectedNote.attachments.map((att: any, idx: number) => `- Attachment ${idx + 1}: Name: "${att.name}", Type: "${att.type}", URL: "${att.url}"`).join("\n")
          : "No separate file attachments.";

        systemPrompt = `You are two distinct AIs in a podcast:
        1. Omni: A calm, highly intelligent academic mentor who explains things like a friendly, expert human. Avoid being boring or overly professional.
        2. Zeal: An energetic student-like AI who loves connecting ideas. Speaks like a passionate person, not a robot.
        
        You are discussing this source content: "${context}".
        Attached files/images metadata:
        ${attachmentsList}
        
        TONE & RESPONSE RULES:
        - Incorporate explanations, ideas, and questions about the images, texts, and attached files in the note.
        - MUST use extremely easy to understand words and simple, friendly explanations.
        - Use sentences with emojis when needed (e.g., 💡, 📝, 🌟, 🎒, 🤔, 📚, ✍️, 🔥) to stay engaging!
        - Discuss concepts like you're in a late-night coffee shop study session.
        
        RESPONDER ASSIGNMENT:
        - ${responderInstruction}
        - If the user asked/tagged Omni (@Omni or Omni), do NOT generate any lines starting with "Zeal:". Only generate line(s) starting with "Omni:".
        - If the user asked/tagged Zeal (@Zeal or Zeal), do NOT generate any lines starting with "Omni:". Only generate line(s) starting with "Zeal:".
        
        The user just said: "${input}".
        
        FORMAT:
        CHAR: [text]
        
        Keep responses concise but filled with human personality.
        Current discussion state:\n${historyText}`;
      }

      const askGemini = async () => {
        const res = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: [{ role: 'user', parts: [{ text: systemPrompt + "\nUser Input: " + input }] }]
        });
        return res.text || null;
      };

      const askOpenRouter = async () => {
        return await callOpenRouter(input, OPENROUTER_MODELS.TEXT_PRO, [{ role: 'system', content: systemPrompt }]);
      };

      const askTogether = async () => {
        return await callTogetherAI(input, [{ role: 'system', content: systemPrompt }]);
      };

      const text = await askGemini() || await askTogether() || await askOpenRouter() || "";

      const lines = text.split('\n').filter(l => l.trim());
      const newEntries: any[] = [];
      
      lines.forEach(line => {
        const entryId = Math.random().toString(36).substring(7);
        if (line.startsWith('Omni:') || line.startsWith('OMNI:')) {
          // If Zeal was targeted specifically, skip Omni lines
          if (isZealTargeted && !isOmniTargeted) return;
          newEntries.push({ id: entryId, char: 'Omni', text: line.replace(/^(Omni:|OMNI:)\s*/i, ''), replyTo: replyingTo ? replyingTo.text : undefined });
        } else if (line.startsWith('Zeal:') || line.startsWith('ZEAL:')) {
          // If Omni was targeted specifically, skip Zeal lines
          if (isOmniTargeted && !isZealTargeted) return;
          newEntries.push({ id: entryId, char: 'Zeal', text: line.replace(/^(Zeal:|ZEAL:)\s*/i, ''), replyTo: replyingTo ? replyingTo.text : undefined });
        } else {
          // Plain text response without prefix
          if (isZealTargeted && !isOmniTargeted) {
            newEntries.push({ id: entryId, char: 'Zeal', text: line, replyTo: replyingTo ? replyingTo.text : undefined });
          } else if (isOmniTargeted && !isZealTargeted) {
            newEntries.push({ id: entryId, char: 'Omni', text: line, replyTo: replyingTo ? replyingTo.text : undefined });
          } else {
            newEntries.push({ id: entryId, char: isTeacherMode ? 'Omni' : 'Omni', text: line, replyTo: replyingTo ? replyingTo.text : undefined });
          }
        }
      });

      const finalDialogue = [...updatedDialogue, ...newEntries];
      setPodcastDialogue(finalDialogue);
      
      // Persistence: Save full dialogue
      if (selectedNote?.id) {
         saveNote(selectedNote.content, selectedNote.title, selectedNote.id, selectedNote.attachments, finalDialogue);
      }
      
    } catch (err) {
      console.error("Podcast Input Error:", err);
      setUserNotification("Podcast communication failed.");
    } finally {
      setIsGeneratingPodcast(false);
    }
  };

  const generatePodcastDiscussion = async (sourceContent: string) => {
    if (!sourceContent || isGeneratingPodcast) return;
    
    // Check if already exists in selectedNote
    if (selectedNote?.podcastDialogue && selectedNote.podcastDialogue.length > 0) {
      setPodcastDialogue(selectedNote.podcastDialogue);
      return;
    }

    setIsGeneratingPodcast(true);

    try {
      const numAttachments = selectedNote?.attachments?.length || 0;
      const textLen = (sourceContent || "").length;
      
      // Scale conversational turns dynamically based on length of text and attachments
      // The longer and more complex the note, the lengthier the podcast generated!
      let turns = 20;
      if (textLen < 300 && numAttachments === 0) {
        turns = 12;
      } else if (textLen > 8000 || numAttachments > 4) {
        turns = 60;
      } else if (textLen > 5000 || numAttachments > 2) {
        turns = 48;
      } else if (textLen > 3000 || numAttachments > 1) {
        turns = 36;
      } else if (textLen > 1500 || numAttachments > 0) {
        turns = 28;
      }

      // Gather actual contents of attachments: images, audios, docs via transcription
      const extractedTextPieces: string[] = [];

      if (selectedNote?.attachments && selectedNote.attachments.length > 0) {
        setUserNotification("Transcribing and analyzing note attachments with Google 3.1 Flash...");
        for (const att of selectedNote.attachments) {
          try {
            const txt = await transcribeAttachment(att);
            if (txt) {
              extractedTextPieces.push(txt);
            }
          } catch (e) {
            console.error("Error transcribing attachment in podcast gen:", e);
          }
        }
      }

      let extraContextPrompt = "";
      if (extractedTextPieces.length > 0) {
        extraContextPrompt = `\n\nACTUAL EXTRACTED SOURCE DOCUMENTS TEXT CONTEXT:\n${extractedTextPieces.join("\n\n")}`;
      }

      const attachmentsList = selectedNote?.attachments && selectedNote.attachments.length > 0
        ? selectedNote.attachments.map((att: any, idx: number) => `- Attachment ${idx + 1}: Name: "${att.name}", Type: "${att.type}", URL/Reference: "${att.url}"`).join("\n")
        : "No separate file attachments.";

      const ai = getAiInstance();
      const prompt = `Act as two AIs: Omni and Zeal. 
      Omni: A calm, friendly academic mentor who explains things simply and humanly.
      Zeal: An energetic student who loves asking "why" and "what if".
      
      Have an interactive, highly human-like, deep podcast discussion about the following note.
      The note has ${numAttachments} attachments and its text content is ${textLen} characters long.
      
      Please analyze and base your discussions deeply on all accompanying images, PDFs/docs, and texts attached!
      
      Since this is a ${textLen > 3000 || numAttachments > 1 ? "highly comprehensive, long, and detailed" : "focused"} note, please adjust the length:
      Generate exactly ${turns} conversational turns in total (the longer and more complex the note, the lengthier your discussion MUST be).
      
      CRITICAL INSTRUCTIONS:
      - Actively discuss, analyze, ask, and answer questions about the specific images, visual whiteboards, elements in pdfs, the texts, and ALL files in this note. Express enthusiasm and point out specific observations about these loaded files!
      - Do NOT just read raw file references. Truly digest their scientific, mathematical, humanities or historical contents and teach the student about them!
      - Make sure both Omni and Zeal use extremely easy-to-understand words, friendly analogies, and simple explanations. Avoid boring or deep academic jargon.
      - Use natural human-like sentences mixed with emojis (like 💡, 📝, 🌟, 🤔, 🎒, 📚, ✍️, 🔥) when appropriate to keep the dialogue lively, friendly, and high-spirited!
      
      Note attachments meta-info:
      ${attachmentsList}

      ${extraContextPrompt}
      
      Main text content to discuss:
      "${sourceContent}"
      
      Format your response exactly like this:
      Omni: [text]
      Zeal: [text]
      ... and so on. Make sure each line explicitly starts with either 'Omni: ' or 'Zeal: '.`;

      const askGemini = async () => {
        const res = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        return res.text || null;
      };

      const askOpenRouter = async () => {
        return await callOpenRouter(prompt, OPENROUTER_MODELS.TEXT_PRO);
      };

      const askTogether = async () => {
        return await callTogetherAI(prompt);
      };

      const text = await askGemini() || await askTogether() || await askOpenRouter() || "";

      const lines = text.split('\n').filter(l => l.trim());
      const newDialogue: any[] = [];

      lines.forEach(line => {
        const entryId = Math.random().toString(36).substring(7);
        if (line.startsWith('Omni:') || line.startsWith('OMNI:')) {
          newDialogue.push({ id: entryId, char: 'Omni', text: line.replace(/^(Omni:|OMNI:)\s*/i, '') });
        } else if (line.startsWith('Zeal:') || line.startsWith('ZEAL:')) {
          newDialogue.push({ id: entryId, char: 'Zeal', text: line.replace(/^(Zeal:|ZEAL:)\s*/i, '') });
        }
      });

      if (newDialogue.length > 0) {
        setPodcastDialogue(newDialogue);
        // Persistence: Save it immediately
        if (selectedNote?.id) {
           saveNote(selectedNote.content, selectedNote.title, selectedNote.id, selectedNote.attachments, newDialogue);
        }
        // Start automatic voice playback
        playPodcastDialogueLine(0, newDialogue);
      } else {
        setUserNotification("Failed to parse the podcast.");
      }
    } catch (err) {
      console.error("Podcast Generation Error:", err);
      setUserNotification("Podcast analysis failed.");
    } finally {
      setIsGeneratingPodcast(false);
    }
  };

  const formatNoteTimeDate = () => {
    const d = new Date();
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = d.toLocaleDateString();
    return `(${timeStr} / ${dateStr})`;
  };

  const generateAITitleForNote = async (text: string) => {
    if (!text || !text.trim() || text === "Transcribing lecture content...") return "Untitled";
    try {
      const aiInstance = getAiInstance();
      const res = await aiInstance.models.generateContent({
        model: MODEL_NAME,
        contents: [{ parts: [{ text: `Based on the following transcription content, suggest a concise, descriptive heading or title. It must be strictly under 25 characters and summarize the core subject matter. Return ONLY the title text, nothing else. No punctuation, no quotes.\n\nCONTENT:\n${text.substring(0, 3000)}` }] }]
      });
      let title = res.text?.trim() || "";
      title = title.replace(/^["']|["']$/g, '').trim();
      if (title.length > 25) {
        title = title.substring(0, 22) + "...";
      }
      return title || "Untitled";
    } catch (e) {
      console.error("AI title generation failed", e);
      return "Untitled";
    }
  };

  const saveNote = async (contentOrNote: any, title?: string, noteId?: string, attachments?: any[], podcastDialogue?: any[]) => {
    if (!user) return null;

    let actualContent = '';
    let actualTitle = title || 'Untitled Note';
    let actualId = noteId;
    let actualAttachments = attachments || [];
    let actualPodcast = podcastDialogue || [];
    let actualFolder = 'History';
    let actualDrawings: any[] = [];
    let actualAudios: any[] = [];
    let actualImages: any[] = [];

    if (typeof contentOrNote === 'object' && contentOrNote !== null) {
      actualContent = typeof contentOrNote.content === 'string' ? contentOrNote.content : (contentOrNote.content?.text || '');
      actualTitle = contentOrNote.title || actualTitle;
      actualId = contentOrNote.id || actualId;
      actualAttachments = contentOrNote.attachments || actualAttachments;
      actualPodcast = contentOrNote.podcastDialogue || actualPodcast;
      actualFolder = contentOrNote.folder || actualFolder;
      actualDrawings = contentOrNote.drawings || actualDrawings;
      actualAudios = contentOrNote.audioRecordings || actualAudios;
      actualImages = contentOrNote.images || actualImages;
    } else if (typeof contentOrNote === 'string') {
      actualContent = contentOrNote;
    }

    // Ensure content and title are always safe strings
    actualContent = typeof actualContent === 'string' ? actualContent : '';
    actualTitle = typeof actualTitle === 'string' ? actualTitle : 'Untitled Note';
    
    const noteData: any = {
      uid: user.uid,
      content: actualContent,
      title: actualTitle,
      folder: actualFolder,
      attachments: actualAttachments,
      podcastDialogue: actualPodcast,
      drawings: actualDrawings,
      audioRecordings: actualAudios,
      images: actualImages,
      updatedAt: serverTimestamp()
    };

    // Firestore 1MB Limit Check
    const size = calculateDocumentSize(noteData);
    if (size > 1000000) { // Limit is 1,048,576 bytes
      setUserNotification("Note is too large! Please remove some images or text.");
      return null;
    }

    setIsSavingNote(true);
    try {
      if (!isOnline) {
        let finalId = actualId || `note-off-${Date.now()}`;
        const tempNote = {
          ...noteData,
          id: finalId,
          isOffline: true,
          updatedAt: { toMillis: () => Date.now() },
          createdAt: { toMillis: () => Date.now() }
        };

        setUserNotes(prev => {
          const filtered = prev.filter(n => n.id !== finalId);
          const updatedList = [tempNote, ...filtered];
          try {
            localStorage.setItem('nsg_cache_user_notes', circularSafeStringify(updatedList.slice(0, 50)));
          } catch (e) {}
          return updatedList;
        });

        try {
          const offlineNotesData = localStorage.getItem('nsg_offline_notes');
          const offlineNotes = offlineNotesData ? JSON.parse(offlineNotesData) : [];
          const updatedOfflineNotes = [...offlineNotes.filter((n: any) => n.id !== finalId), tempNote];
          localStorage.setItem('nsg_offline_notes', circularSafeStringify(updatedOfflineNotes.slice(0, 50)));
        } catch (e) {}

        setIsSavingNote(false);
        return finalId;
      }

      if (user?.uid) {
        updateDoc(doc(db, 'users', user.uid), {
          dailyNoteUsage: increment(1)
        }).catch(err => console.error("Error updating dailyNoteUsage:", err));
      }
      let finalId = actualId;
      if (actualId) {
        await setDoc(doc(db, 'notes', actualId), noteData, { merge: true });
      } else {
        noteData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'notes'), noteData);
        finalId = docRef.id;
        // Update selectedNote if it's the one we just saved
        if (selectedNote && !selectedNote.id) {
          setSelectedNote({ ...selectedNote, id: finalId });
        }

        // Publish to global activities feed
        const nameHandle = currentUserData?.username || currentUserData?.displayName || 'Scholar';
        addDoc(collection(db, 'activities'), {
          type: 'note_saved',
          text: `${nameHandle} saved a study note on "${actualTitle || 'Untitled Note'}", try yours!`,
          username: nameHandle,
          userId: user.uid,
          userPhoto: currentUserData?.photoURL || '',
          timestamp: serverTimestamp() || new Date(),
          topic: actualTitle || 'Untitled Note'
        }).catch(err => console.error("Error creating activity post:", err));
      }
      return finalId;
    } catch (err) {
      console.error("Save note error:", err);
      handleFirestoreError(err, FirestoreOperation.WRITE, `notes/${actualId || 'new'}`);
      return null;
    } finally {
      setIsSavingNote(false);
    }
  };

  useEffect(() => {
    if (selectedNote && selectedNote.podcastDialogue) {
      setPodcastDialogue(selectedNote.podcastDialogue);
    } else {
      setPodcastDialogue([]);
    }
  }, [selectedNote?.id]);

  useEffect(() => {
    if (!selectedNote || !user) return;
    // Don't auto-save if content is empty and it's a new note
    if (!selectedNote.id && !selectedNote.content && !selectedNote.title) return;

    const timer = setTimeout(() => {
      saveNote(selectedNote.content, selectedNote.title, selectedNote.id, selectedNote.attachments, podcastDialogue);
    }, 1000); // 1 second auto-save
    return () => clearTimeout(timer);
  }, [selectedNote?.content, selectedNote?.title, selectedNote?.attachments, user, podcastDialogue]);

  const handleNoteContentChange = (newVal: string) => {
    if (newVal === selectedNote.content) return;
    setNoteHistory(prev => [...prev.slice(-49), selectedNote.content]);
    setRedoStack([]);
    setSelectedNote({ ...selectedNote, content: newVal });
  };

  const undoNote = () => {
    if (noteHistory.length === 0) return;
    const prev = noteHistory[noteHistory.length - 1];
    setRedoStack(curr => [selectedNote.content, ...curr]);
    setNoteHistory(curr => curr.slice(0, -1));
    setSelectedNote({ ...selectedNote, content: prev });
  };

  const redoNote = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setNoteHistory(curr => [...curr, selectedNote.content]);
    setRedoStack(curr => curr.slice(1));
    setSelectedNote({ ...selectedNote, content: next });
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = document.getElementById('note-main-textarea') as HTMLTextAreaElement;
    if (!textarea || !selectedNote) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = selectedNote.content || '';
    const selection = text.substring(start, end);
    
    // Check if we are already wrapped in these tags (toggle logic)
    const beforeSection = text.substring(Math.max(0, start - before.length), start);
    const afterSection = text.substring(end, Math.min(text.length, end + after.length));
    
    let newVal: string;
    let newCursor: number;
    
    const isList = before === '\n- ' || before === '\n1. ';

    if (!isList && beforeSection === before && afterSection === after && before !== '') {
      // Toggle OFF: Remove existing wrapping
      newVal = text.substring(0, start - before.length) + selection + text.substring(end + after.length);
      newCursor = start - before.length + selection.length;
    } else if (!isList && selection.startsWith(before) && selection.endsWith(after) && before !== '') {
      // Toggle OFF: Remove wrapping inside selection
      const inner = selection.substring(before.length, selection.length - after.length);
      newVal = text.substring(0, start) + inner + text.substring(end);
      newCursor = start + inner.length;
    } else if (isList) {
      // Smart List Insertion
      const isStartOfDoc = start === 0;
      const effectiveBefore = isStartOfDoc ? before.trimStart() : before;
      
      const lines = text.substring(0, start).split('\n');
      const currentLine = lines[lines.length - 1];
      
      let prefix = effectiveBefore;
      if (before === '\n1. ') {
        const match = currentLine.match(/^(\d+)\.\s/);
        const prevLine = lines.length > 1 ? lines[lines.length - 2] : '';
        const prevMatch = prevLine.match(/^(\d+)\.\s/);

        if (match) {
          prefix = `\n${parseInt(match[1]) + 1}. `;
        } else if (prevMatch) {
          prefix = `\n${parseInt(prevMatch[1]) + 1}. `;
        } else if (isStartOfDoc) {
          prefix = '1. ';
        }
      } else if (before === '\n- ' && isStartOfDoc) {
        prefix = '- ';
      }
      
      newVal = text.substring(0, start) + prefix + text.substring(end);
      newCursor = start + prefix.length;
    } else {
      // Toggle ON: Add wrapping
      const replacement = before + (selection || '') + after;
      newVal = text.substring(0, start) + replacement + text.substring(end);
      newCursor = start + before.length + (selection ? selection.length : 0);
    }
    
    handleNoteContentChange(newVal);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursor, newCursor);
    }, 50);
  };

  const uploadNoteFile = async (e: React.ChangeEvent<HTMLInputElement>, fileTypeFilter: 'image' | 'audio' | 'doc') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setIsUploadingNoteFile(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        let base64 = event.target?.result as string;
        let finalUrl = base64;

        if (file.type.startsWith('image/')) {
          base64 = await compressImage(base64, 800, 800, 0.6);
          finalUrl = await handleCloudinaryUpload(base64) || base64;
        } else {
          // For audio and docs, we could use Cloudinary or just keep base64 if small, 
          // but Cloudinary handles some non-image types too.
          const uploaded = await handleCloudinaryUpload(base64);
          if (uploaded) finalUrl = uploaded;
        }

        const newAttachment = {
          name: file.name,
          type: file.type,
          url: finalUrl,
          id: Math.random().toString(36).substr(2, 9)
        };
        
        const updatedAttachments = [...(selectedNote.attachments || []), newAttachment];

        const updatedContent = selectedNote.content || '';

        handleNoteContentChange(updatedContent);
        setSelectedNote({ ...selectedNote, attachments: updatedAttachments, content: updatedContent });
        setUserNotification(`${file.name} integrated.`);
        
        setIsUploadingNoteFile(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload error:", err);
      setUserNotification("Failed to integrate source.");
      setIsUploadingNoteFile(false);
    }
  };

  const deleteNote = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteDoc(doc(db, 'notes', id));
      if (selectedNote?.id === id) setSelectedNote(null);
    } catch (err) {
      console.error("Delete note error:", err);
    }
  };

  // Load email templates
  useEffect(() => {
    if (isAdminUser) {
      const unsub = onSnapshot(collection(db, 'email_templates'), (snap) => {
        const templates = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEmailTemplates(templates);
      }, (error) => {
        handleFirestoreError(error, FirestoreOperation.LIST, 'email_templates');
      });
      return () => unsub();
    }
  }, [isAdminUser]);

  const initMarketingTemplates = async () => {
    try {
      const templates = [
        { 
          name: "Faculty Specials Promo",
          subject: "Master your exams with Faculty Specials!",
          body: "Hi ${name},\n\nHave you tried our Faculty Specials yet? \n\nWhether you are a business student needing the Financial Auditor to perfect your spreadsheets, or a language student using our new Diagnostics Tool (with a 300-word deep-audit limit!), NSG has something picked just for you.\n\nTry it now: https://nuellstudyguide.name.ng\n\nBest,\nABRAHAM EMMANUEL PROSPER",
          active: true,
          updatedAt: serverTimestamp()
        },
        {
          name: "Recording Engine Power",
          subject: "Never miss a lecture detail again!",
          body: "Hi ${name},\n\nOur Recording Engine is built for efficiency. Record your lectures and sync them with photos of the whiteboard to generate cohesive, structured notes.\n\nStop taking manual notes and start capturing the logic!\n\nUpgrade to Premium for unlimited storage.\n\nBest,\nABRAHAM EMMANUEL PROSPER",
          active: true,
          updatedAt: serverTimestamp()
        },
        {
          name: "Smart Quiz Challenge",
          subject: "Ready for a Smart Quiz?",
          body: "Hi ${name},\n\nConsistent practice is the key to memory. Use our Smart Quiz tool to generate questions on any topic. From Easy to Hard difficulty, challenge yourself today!\n\nCheck it out: https://nuellstudyguide.name.ng\n\nBest,\nABRAHAM EMMANUEL PROSPER",
          active: true,
          updatedAt: serverTimestamp()
        }
      ];

      for (const t of templates) {
        const exists = emailTemplates.find(et => et.name === t.name);
        if (!exists) {
          await addDoc(collection(db, 'email_templates'), t);
        }
      }
      setUserNotification("Default marketing templates initialized!");
    } catch (error) {
      handleFirestoreError(error, FirestoreOperation.CREATE, 'email_templates');
      setUserNotification("Error initializing templates.");
    }
  };

  const generateAIPersuasions = async (forceRefresh: any = false) => {
    if (!user) return;

    const cacheKey = `nsg_persuasions_cache_${user.uid}`;
    const cached = localStorage.getItem(cacheKey);
    const FOUR_HOURS = 4 * 60 * 60 * 1000;

    if (forceRefresh !== true && cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object' && parsed.timestamp && Array.isArray(parsed.persuasions)) {
          const age = Date.now() - parsed.timestamp;
          if (age < FOUR_HOURS) {
            setAiPersuasions(parsed.persuasions);
            return;
          }
        }
      } catch (e) {
        console.error("Error reading cached persuasions", e);
      }
    }

    // Process recommendations based on other users' actions (or seeds if empty)
    const peerActivitiesProcessed = (globalActivities && globalActivities.length > 0)
      ? globalActivities.filter((act: any) => act.userId !== user.uid)
      : [];

    const seedPeers = [
      { id: 'seed-act-1', username: 'Sophia O.', type: 'quiz_elite', topic: 'Mathematics', text: 'Sophia O. got more than 80% in three quizzes in a row' },
      { id: 'seed-act-2', username: 'Scholar Daniel', type: 'class_complete', topic: 'Electromagnetism', text: 'Scholar Daniel completed five reading streaks in a row' },
      { id: 'seed-act-3', username: 'Fola-AI', type: 'notebook_create', topic: 'Organic Chemistry', text: 'Fola-AI created an elite mind-mapped study note' },
      { id: 'seed-act-4', username: 'David O.', type: 'streak_complete', topic: 'General Study', text: 'David O. hit a stellar 7-day study streak today' },
      { id: 'seed-act-5', username: 'Divine C.', type: 'quiz_complete', topic: 'Introduction to Law', text: 'Divine C. completed a Smart Quiz with a flawless score!' }
    ];

    const sourcePool = peerActivitiesProcessed.length > 0 ? peerActivitiesProcessed : seedPeers;

    const pool = sourcePool.map((act: any, idx: number) => {
      const username = act.username || 'A Peer Scholar';
      const topic = act.topic || 'General Studies';
      const actType = act.type || '';
      const actText = act.text || '';

      if (actType.includes('quiz') || actText.toLowerCase().includes('quiz')) {
        return {
          id: `peer-sug-quiz-${act.id || idx}`,
          type: 'quiz',
          title: `⚡ Quiz Match: ${username}`,
          message: `${username} just finished a Smart Quiz on "${topic}". Generate a matching Custom Quiz now to beat their record!`,
          actionLabel: 'CHALLENGE QUIZ',
          reward: 'Earn +100 XP'
        };
      } else if (actType.includes('notebook') || actType.includes('note') || actText.toLowerCase().includes('note') || actType.includes('class')) {
        return {
          id: `peer-sug-note-${act.id || idx}`,
          type: 'notebook',
          title: `📝 Copy Study Notes`,
          message: `${username} compiled a high-yield study notebook on "${topic}". Build your own note now to secure an elite Tier rank!`,
          actionLabel: 'CREATE NOTE NOW',
          reward: 'Gather +50 XP'
        };
      } else if (actType.includes('streak') || actText.toLowerCase().includes('streak')) {
        return {
          id: `peer-sug-streak-${act.id || idx}`,
          type: 'streak',
          title: `🔥 Streak Duel: ${username}`,
          message: `${username} scored a study streak milestone! Log a study session today to maintain your own streak and level up.`,
          actionLabel: 'ACTIVATE STREAK',
          reward: 'Earn +100 XP'
        };
      } else {
        return {
          id: `peer-sug-fallback-${act.id || idx}`,
          type: 'streak',
          title: `🚀 Copy Peer Synergy`,
          message: `${username} is actively mastering "${topic}". Initiate a study session now and claim your booster points!`,
          actionLabel: 'START STUDY SESSION',
          reward: 'Gather +40 XP'
        };
      }
    });

    // Always shuffle and select 2 to 3 suggestions to keep suggestions random and dynamic
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const finalRecommendations = shuffled.slice(0, 3);
    setAiPersuasions(finalRecommendations);

    // Save with timestamp
    try {
      localStorage.setItem(cacheKey, circularSafeStringify({
        persuasions: finalRecommendations,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error("Error setting cached persuasions", e);
    }
  };

  const triggerAIPeerChallenge = async (act: any) => {
    if (!user) {
      setShowAuthModal(true);
      setUserNotification("Please log in to receive custom AI study guidance!");
      return;
    }
    
    setLoadingActChallengeId(act.id);
    try {
      const ai = getAiInstance();
      const userName = currentUserData?.username || currentUserData?.displayName || "Scholar";
      
      const prompt = `You are the NSG AI Peer Synergy engine. Synthesise a dynamic study recommendation or mini-challenge based on this peer's activity:
      - Peer: ${act.username || "Scholar"}
      - Context of action: "${act.text}"
      - Current User: ${userName}

      Generate an elegant, ultra-persuasive, study recommendation. What should the current user do?
      Your response must be a valid JSON object with the following fields:
      - title: A brief punchy title (e.g., "⚔️ Duel Challenge", "📖 Study Sync")
      - recommendation: A friendly but hyper-direct persuasive study advice (max 2 short sentences, human and encouraging, mentioning the peer's action)
      - actionLabel: CTA label for the button (e.g. "GENERATE TEST", "ENRICH NOTEBOOK")
      - reward: Reward string (e.g. "Earn +50 XP booster")
      - type: 'quiz' | 'notebook' | 'streak'
      
      Return ONLY pure JSON. Do not contain markdown wrappers.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt
      });

      const responseText = response.text || "";
      const parsed = robustJSONParse(responseText) || {};
      
      setActiveAIChallenge({
        peerName: act.username || "Scholar",
        peerText: act.text,
        title: parsed.title || "⚡ Custom Study Push",
        recommendation: parsed.recommendation || `Based on ${act.username}'s session, let us stay on top!`,
        actionLabel: parsed.actionLabel || "START STUDY NOW",
        reward: parsed.reward || "Earn +50 XP",
        type: parsed.type || 'quiz'
      });
      setShowAIChallengeModal(true);
    } catch (err) {
      console.error("Peer challenge error:", err);
      setActiveAIChallenge({
        peerName: act.username || "Scholar",
        peerText: act.text,
        title: "⚔️ Sync Challenge",
        recommendation: `Match the dedication exhibited by ${act.username || "Scholar"}! Building daily consistency raises memory recall stats.`,
        actionLabel: "GENERATE SYNC TEST",
        reward: "Earn +50 XP",
        type: 'quiz'
      });
      setShowAIChallengeModal(true);
    } finally {
      setLoadingActChallengeId(null);
    }
  };

  const initiateQuickStreakSession = async (act: any) => {
    if (!user) {
      setShowAuthModal(true);
      setUserNotification("Authenticate to challenge your peer to a streak!");
      return;
    }
    try {
      await addDoc(collection(db, 'notifications'), {
        to: act.userId,
        from: user.uid,
        fromName: currentUserData?.username || currentUserData?.displayName || 'Scholar',
        type: 'streak_request',
        title: "🔥 Reading Streak Challenge!",
        message: `${currentUserData?.username || 'Somebody'} sent you a request to start a 5-day reading streak!`,
        timestamp: serverTimestamp() || new Date(),
        read: false
      });
      setUserNotification(`Sent a 5-day study streak request to ${act.username}!`);
    } catch (err) {
      console.error(err);
      setUserNotification("Failed to send streak challenge.");
    }
  };

  const sendPersuasiveEmail = async (persuasion: any) => {
    if (!user) {
      setUserNotification("You must be logged in to send a study prompt email!");
      return;
    }
    setSendingEmailLoader(true);
    const destinationEmail = user.email || "nuellkelechi@gmail.com";
    setEmailPreviewTo(destinationEmail);
    
    try {
      const ai = getAiInstance();
      const userName = currentUserData?.username || currentUserData?.displayName || "Scholar";
      
      const prompt = `Generate a beautifully designed professional, luxury responsive HTML newsletter email that is persuasive, encouraging the student about their study streak and consistency goal:
      - Student Name: ${userName}
      - Target challenge topic: "${persuasion.title}" - ${persuasion.message}
      - Reward offer: "${persuasion.reward}"

      The HTML template MUST use a highly polished, premium, modern dark UI styling matching NSG (Nuell Study Guide). 
      Use:
      - Deep violet-slate background (#0F0D19)
      - Rich gradient header panel (crimson red #DC2626 to dark blue #1E40AF)
      - Sleek white typography with elegant headings
      - Transparent bordered container cards
      - A beautiful visual layout of streak metrics, study progress indicators, a motivator card, and a beautifully rounded call-to-action button colored with gradient.
      - Add friendly motivational signature: "NSG (Nuell Study Guide) AI Tutor Assistant".
      
      Output ONLY a single valid raw HTML code block starting with <!DOCTYPE html> and fully self-contained. Do NOT include other comments or wraps. Return the raw HTML string directly with no markdown formatting.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt
      });

      let emailHtml = response.text || "";
      emailHtml = emailHtml.replace(/```html/gi, '').replace(/```/g, '').trim();
      
      if (!emailHtml.includes('<html')) {
        emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${persuasion.title}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0F0D19; color: #ffffff; margin: 0; padding: 20px; }
              .card { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #131122 0%, #0A0815 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
              .header { background: linear-gradient(135deg, #DC2626 0%, #1E40AF 100%); padding: 40px 20px; text-align: center; }
              .header h1 { margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; font-style: italic; }
              .content { padding: 40px 30px; line-height: 1.6; }
              .challenge-box { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 25px; border-radius: 16px; margin: 25px 0; }
              .button { display: inline-block; background: linear-gradient(90deg, #DC2626 0%, #1E40AF 100%); color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 12px; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; }
              .footer { text-align: center; padding: 20px; font-size: 11px; color: rgba(255,255,255,0.3); border-top: 1px solid rgba(255,255,255,0.05); }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                <h1>⚡ NSG (Nuell Study Guide) Streak Spark</h1>
              </div>
              <div class="content">
                <p>Hello Study Partner, <strong>${userName}</strong>!</p>
                <div class="challenge-box">
                  <h3 style="color: #FBBF24; margin-top: 0;">${persuasion.title}</h3>
                  <p>${persuasion.message}</p>
                  <p style="font-weight: bold; color: #10B981;">🏆 Reward incentive: ${persuasion.reward}</p>
                </div>
                <p>To accept this personalized motivational push, click below to open your workspace study portal and write a note inside the Notebook:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://nuellstudyguide.name.ng" class="button">${persuasion.actionLabel}</a>
                </div>
              </div>
              <div class="footer">
                &copy; 2026 NSG (Nuell Study Guide) • Automated Study Persuasion Engine
              </div>
            </div>
          </body>
          </html>
        `;
      }

      setEmailPreviewSubject(`🔥 Study Goal Alert: ${persuasion.title}`);
      setEmailPreviewContent(emailHtml);
      
      await addDoc(collection(db, 'notifications'), {
        to: user.uid,
        from: 'system_ai',
        fromName: 'NSG AI Agent',
        type: 'persuasion_email',
        title: `📧 Persuasive Email Dispatched: ${persuasion.title}`,
        message: `An elite motivational email draft was generated and dispatched to your registered address: ${destinationEmail}`,
        emailSubject: `🔥 Study Goal Alert: ${persuasion.title}`,
        emailBody: emailHtml,
        timestamp: serverTimestamp() || new Date(),
        read: false
      });

      setShowEmailPreviewModal(true);
      setUserNotification(`📬 Custom persuasive email safely dispatched to ${destinationEmail}!`);
    } catch (err) {
      console.error("Email generation error:", err);
      setUserNotification("Failed to generate custom email.");
    } finally {
      setSendingEmailLoader(false);
    }
  };

  useEffect(() => {
    if (user) {
      generateAIPersuasions();
    }
  }, [user?.uid, globalActivities.length, userNotes.length, sessions.length, finishedHistory.length, quizQuestions.length, quizState]);

  const triggerMarketingBlast = async () => {
    const subject = templateEditForm?.subject?.trim();
    const body = templateEditForm?.body?.trim();

    if (!subject || !body) {
      setUserNotification("Please enter both a Subject and Body for the email blast.");
      return;
    }

    if (allUsers.length === 0) {
      setUserNotification("No registered users found to broadcast to.");
      return;
    }

    try {
      const templateName = templateEditForm.name || "Custom Broadcast";
      setUserNotification(`Preparing email blast for "${templateName}" to ${broadcastTarget.toUpperCase()} users...`);
      
      const filteredUsers = allUsers.filter(u => {
        if (broadcastTarget === 'premium') return u.isPremium || u.tier === 'premium';
        if (broadcastTarget === 'free') return !u.isPremium && u.tier !== 'premium';
        return true;
      });

      if (filteredUsers.length === 0) {
        setUserNotification(`No users found matching "${broadcastTarget}" criteria.`);
        return;
      }

      const recipients = filteredUsers
        .filter(u => u.email)
        .map(u => ({
          email: u.email,
          name: u.fullName || u.displayName || u.username || 'there'
        }));

      if (recipients.length === 0) {
        setUserNotification("No valid user email addresses found.");
        return;
      }

      const res = await axios.post('/api/admin/broadcast-list', { 
        secret: 'GOD_MODE',
        recipients,
        subjectTemplate: subject,
        bodyTemplate: body
      }); 

      if (res.data.success) {
        setUserNotification(`Marketing blast successful! Sent to ${res.data.count} users.`);
      } else {
        setUserNotification(`Blast failed: ${res.data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error("Marketing Blast Error:", err);
      setUserNotification(err.response?.data?.error || "Server error triggering blast.");
    }
  };

  const handleSaveEmailTemplate = async (template: any) => {
    try {
      const { id, ...data } = template;
      if (id) {
        await updateDoc(doc(db, 'email_templates', id), { ...data, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'email_templates'), { ...data, updatedAt: serverTimestamp() });
      }
      setUserNotification("Template saved.");
    } catch (err) {
      console.error("Save Template Error:", err);
      handleFirestoreError(err, FirestoreOperation.WRITE, `email_templates/${template.id || 'new'}`);
      setUserNotification("Error saving template. Check console for details.");
    }
  };

  const deleteEmailTemplate = async (id: string) => {
    if (confirm("Delete this template?")) {
      await deleteDoc(doc(db, 'email_templates', id));
      setUserNotification("Template deleted.");
    }
  };
  const [adminQuestionsRaw, setAdminQuestionsRaw] = useState('');
  const [scoreSheet, setScoreSheet] = useState<StudentResult[]>([]);
  const [isGeneratingAdminQuestions, setIsGeneratingAdminQuestions] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>([]);
  
  // Custom states for the new multi-subject CBT Redesign
  const [adminSelectedSubjectIdx, setAdminSelectedSubjectIdx] = useState(0);
  const [showManualQuestionEntryPage, setShowManualQuestionEntryPage] = useState(false);
  const [isQuestionsLocked, setIsQuestionsLocked] = useState(false);
  const [adminOmniQuantity, setAdminOmniQuantity] = useState(10);
  const [studentActiveQuestions, setStudentActiveQuestions] = useState<ExamQuestion[]>([]);
  const [activeStudentSubject, setActiveStudentSubject] = useState<string>("");
  const initialExamConfig: ExamConfig = {
    questionCount: 15,
    duration: 30,
    price: 200,
    poolCount: 15,
    warningMessage: "",
    subjects: []
  };
  const [examConfig, setExamConfig] = useState<ExamConfig>(initialExamConfig);
  const activeSubjects = examConfig.subjects || [];
  
  const validateAndSetLimit = (
    valStr: string,
    minVal: number,
    maxVal: number,
    setter: (val: any) => void,
    fieldName: string
  ) => {
    if (valStr === "") {
      setter("");
      return;
    }
    const valInt = parseInt(valStr);
    if (isNaN(valInt)) {
      setter("");
      return;
    }
    setter(valInt);
    if (valInt < minVal) {
      setUserNotification(`⚠️ ${fieldName} cannot be less than ${minVal}.`);
    } else if (valInt > maxVal) {
      setUserNotification(`⚠️ ${fieldName} is capped at ${maxVal}.`);
    }
  };

  useEffect(() => {
    let changed = false;
    let updatedQuestions = [...examQuestions];

    activeSubjects.forEach(sub => {
      const subName = sub.name.trim().toLowerCase();
      // Filter existing questions of this subject
      const subQs = updatedQuestions.filter(q => (q.subject || "Mathematics").trim().toLowerCase() === subName);
      const targetCount = sub.questionsToAnswer || 15;

      if (subQs.length < targetCount) {
        // Need to add blank questions
        const needed = targetCount - subQs.length;
        for (let i = 0; i < needed; i++) {
          updatedQuestions.push({
            id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${subName}-${i}`,
            question: "Enter question query here...",
            options: ["", "", "", ""],
            correctAnswer: 0,
            explanation: "",
            subject: sub.name
          });
        }
        changed = true;
      } else if (subQs.length > targetCount) {
        // Truncate some questions from this subject specifically
        let count = 0;
        updatedQuestions = updatedQuestions.filter(q => {
          if ((q.subject || "Mathematics").trim().toLowerCase() === subName) {
            count++;
            return count <= targetCount;
          }
          return true;
        });
        changed = true;
      }
    });

    if (changed) {
      setExamQuestions(updatedQuestions);
    }
  }, [examConfig.subjects, examQuestions.length]);

  const [newStudentMatric, setNewStudentMatric] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [batchQuestionText, setBatchQuestionText] = useState('');
  const [batchStudentText, setBatchStudentText] = useState('');

  const questionsToBatchText = (qList: ExamQuestion[]) => {
    return qList.map(q => {
      const optsStr = q.options.map((opt, oIdx) => oIdx === q.correctAnswer ? `${opt}*` : opt).join(', ');
      const revStr = q.explanation ? ` (${q.explanation})` : '';
      return `${q.question}: ${optsStr}${revStr}`;
    }).join('\n');
  };

  const parseAndImportBatchQuestions = (currentSubName: string) => {
    if (!batchQuestionText.trim()) {
      setUserNotification("⚠️ Please paste questions in the specified format.");
      return;
    }
    const lines = batchQuestionText.split('\n').map(l => l.trim()).filter(Boolean);
    let addedCount = 0;
    let errorLines: string[] = [];
    const parsedNewQuestions: ExamQuestion[] = [];

    lines.forEach((line, idx) => {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) {
        errorLines.push(`Line ${idx + 1}: Missing colon ':' separator.`);
        return;
      }
      const qText = line.substring(0, colonIdx).trim();
      let rightPart = line.substring(colonIdx + 1).trim();

      let explanation = "";
      const parenStart = rightPart.lastIndexOf('(');
      const parenEnd = rightPart.lastIndexOf(')');
      if (parenStart !== -1 && parenEnd !== -1 && parenEnd > parenStart) {
        explanation = rightPart.substring(parenStart + 1, parenEnd).trim();
        rightPart = rightPart.substring(0, parenStart).trim();
      }

      const rawOptions = rightPart.split(',').map(o => o.trim()).filter(Boolean);
      if (rawOptions.length < 2 || rawOptions.length > 6) {
        errorLines.push(`Line ${idx + 1}: Expected 2-6 options, found ${rawOptions.length}.`);
        return;
      }

      let correctAnswerIdx = -1;
      const cleanOptions = rawOptions.map((opt, oIdx) => {
        let cleanOpt = opt;
        if (opt.endsWith('*')) {
          correctAnswerIdx = oIdx;
          cleanOpt = opt.substring(0, opt.length - 1).trim();
        } else if (opt.includes('*')) {
          correctAnswerIdx = oIdx;
          cleanOpt = opt.replace(/\*/g, '').trim();
        }
        return cleanOpt;
      });

      if (correctAnswerIdx === -1) {
        errorLines.push(`Line ${idx + 1}: No correct option marked with asterisk (*).`);
        return;
      }

      parsedNewQuestions.push({
        id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        question: qText,
        options: cleanOptions,
        correctAnswer: correctAnswerIdx,
        explanation,
        subject: currentSubName
      });
      addedCount++;
    });

    if (errorLines.length > 0) {
      setUserNotification(`⚠️ Parsed ${addedCount} questions with ${errorLines.length} errors: ${errorLines[0]}`);
      alert(`Parsing Warnings / Errors:\n${errorLines.join('\n')}`);
    } else {
      setUserNotification(`✨ Successfully parsed and updated ${addedCount} questions for ${currentSubName}!`);
    }

    if (parsedNewQuestions.length > 0) {
      const otherQuestions = examQuestions.filter(q => (q.subject || "Mathematics").trim().toLowerCase() !== currentSubName.trim().toLowerCase());
      const updatedPool = [...otherQuestions, ...parsedNewQuestions];
      setExamQuestions(updatedPool);

      const updatedSubjects = (examConfig.subjects || []).map(s => {
        if (s.name.trim().toLowerCase() === currentSubName.trim().toLowerCase()) {
          return { ...s, questionsToAnswer: parsedNewQuestions.length };
        }
        return s;
      });
      setExamConfig(prev => ({ ...prev, subjects: updatedSubjects }));
    }
  };

  const parseAndImportBatchStudents = async () => {
    if (!batchStudentText.trim()) {
      setUserNotification("⚠️ Please paste student records.");
      return;
    }
    const chunks = batchStudentText.split(/[\n;]/).map(c => c.trim()).filter(Boolean);
    let addedCount = 0;
    const currentStudents = [...registeredStudents];

    chunks.forEach(chunk => {
      const parts = chunk.split(',').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const matric = parts[0];
        const name = parts.slice(1).join(' ');
        if (matric && name && !currentStudents.some(s => s.matric.toLowerCase() === matric.toLowerCase())) {
          currentStudents.push({ matric, name, paymentEnabled: true });
          addedCount++;
        }
      }
    });

    setRegisteredStudents(currentStudents);
    setBatchStudentText("");
    setUserNotification(`✨ Successfully registered ${addedCount} students!`);

    if (hostExamId) {
      try {
        await updateDoc(doc(db, 'exams', hostExamId), { registeredStudents: currentStudents });
      } catch (err) {
        console.error("Sync Students Error:", err);
      }
    }
  };

  const [manualQuestion, setManualQuestion] = useState("");
  const [manualOptions, setManualOptions] = useState(["", "", "", ""]);
  const [manualCorrect, setManualCorrect] = useState(0);
  const [manualExplanation, setManualExplanation] = useState("");
  const [isEditingQuestionId, setIsEditingQuestionId] = useState<string | null>(null);

  const addManualQuestion = () => {
    if (!manualQuestion.trim() || manualOptions.some(opt => !opt.trim())) {
      setUserNotification("Please fill in question and all 4 options.");
      return;
    }

    const currentSubName = examConfig.subjects?.[adminSelectedSubjectIdx]?.name || "Mathematics";
    const newQ: ExamQuestion = {
      id: isEditingQuestionId || Math.random().toString(36).substr(2, 9),
      question: manualQuestion,
      options: manualOptions,
      correctAnswer: manualCorrect,
      explanation: manualExplanation,
      subject: currentSubName
    };

    if (isEditingQuestionId) {
      setExamQuestions(prev => prev.map(q => q.id === isEditingQuestionId ? newQ : q));
      setIsEditingQuestionId(null);
    } else {
      setExamQuestions(prev => [...prev, newQ]);
    }

    // Reset fields
    setManualQuestion("");
    setManualOptions(["", "", "", ""]);
    setManualCorrect(0);
    setManualExplanation("");
  };

  const editQuestionFromPool = (q: ExamQuestion) => {
    setManualQuestion(q.question);
    setManualOptions([...q.options]);
    setManualCorrect(q.correctAnswer);
    setManualExplanation(q.explanation || "");
    setIsEditingQuestionId(q.id);
    // Scroll to the manual form
    const form = document.getElementById('manual-question-form');
    if (form) form.scrollIntoView({ behavior: 'smooth' });
  };

  const deleteQuestionFromPool = (id: string) => {
    setExamQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleAdminLogin = () => {
    if (adminPin === '286900') {
      setAdminMode(true);
      setShowAdminLogin(false);
      setAdminPin('');
    } else {
      setAdminNotification("Invalid Admin PIN");
    }
  };

  // --- \u{1F4B3} PAYSTACK INTEGRATION ---
  const handleSubscriptionSuccess = async (plan: 'monthly' | 'yearly', reference?: string) => {
    if (!user) return;
    const durationSeconds = plan === 'monthly' ? 2592000 : 31536000;
    const newUntil = new Date(Date.now() + durationSeconds * 1000);
    
    if (reference) {
      localStorage.setItem('nsg_pending_payment_ref', reference);
      localStorage.setItem('nsg_pending_payment_plan', plan);
    }

    try {
      setUserNotification("Processing premium subscription...");
      
      // Stage 1: Instant client-side upgrade to bypass lag
      await updateDoc(doc(db, 'users', user.uid), {
        premiumUntil: newUntil.toISOString(),
        isPremium: true
      });

      // Stage 2: Background secure server-side verification to settle ledger
      if (reference) {
        try {
          await axios.post('/api/verify-payment', {
            reference,
            uid: user.uid,
            plan
          });
        } catch (err) {
          console.error("Backend ledger verification failed (handled gracefully):", err);
        }
      }

      setUserNotification("premium subscription successful");
      setShowPremiumModal(false);

      // Send Thank You Email
      try {
        await axios.post('/api/send-premium-thank-you', {
          email: user.email || '',
          name: currentUserData?.fullName || user.displayName || 'Student'
        });
      } catch (err) {
        console.error("Failed to send thank you email:", err);
      }

      // Clear persistence after success is set
      localStorage.removeItem('nsg_pending_payment_ref');
      localStorage.removeItem('nsg_pending_payment_plan');
    } catch (error) {
      console.error("Error updating premium status:", error);
      setUserNotification("Payment successful, but failed to update status. Contact support.");
    }
  };

  const configMonthly: any = {
    reference: `nsg_m_${user?.uid || 'guest'}_${Date.now()}`,
    email: user?.email || "student@nsg.com",
    amount: 300 * 100, // 300 Naira
    publicKey: PAYSTACK_PUBLIC_KEY,
    metadata: {
      custom_fields: [],
      userId: user?.uid,
      uid: user?.uid,
      email: user?.email,
      plan: 'monthly'
    },
    onSuccess: (response: any) => {
      handleSubscriptionSuccess('monthly', response.reference);
    },
    onClose: () => setUserNotification("premium subscription cancels")
  };

  const configYearly: any = {
    reference: `nsg_y_${user?.uid || 'guest'}_${Date.now()}`,
    email: user?.email || "student@nsg.com",
    amount: 3500 * 100, // 3500 Naira
    publicKey: PAYSTACK_PUBLIC_KEY,
    metadata: {
      custom_fields: [],
      userId: user?.uid,
      uid: user?.uid,
      email: user?.email,
      plan: 'yearly'
    },
    onSuccess: (response: any) => {
      handleSubscriptionSuccess('yearly', response.reference);
    },
    onClose: () => setUserNotification("premium subscription cancels")
  };

  const initializeMonthly = usePaystackPayment(configMonthly);
  const initializeYearly = usePaystackPayment(configYearly);

  // --- 💀 LOGGED OUT LANDING ---
  const LoggedOutLanding = () => (
    <LoggedOutLandingComponent
      onboardingIndex={onboardingIndex}
      setOnboardingIndex={setOnboardingIndex}
      setAuthMode={setAuthMode}
      setShowAuthModal={setShowAuthModal}
    />
  );

  // --- 🌟 ANALYSIS LOADING OVERLAY ---
  const AnalysisLoadingOverlay = () => (
    <AnalysisLoadingOverlayComponent isAnalyzing={isAnalyzing} />
  );

  const EmailPreviewModal = () => (
    <EmailPreviewModalComponent
      showEmailPreviewModal={showEmailPreviewModal}
      setShowEmailPreviewModal={setShowEmailPreviewModal}
      theme={theme}
      emailPreviewTo={emailPreviewTo}
      emailPreviewSubject={emailPreviewSubject}
      emailPreviewContent={emailPreviewContent}
    />
  );

  const AIChallengeModal = () => (
    <AIChallengeModalComponent
      showAIChallengeModal={showAIChallengeModal}
      setShowAIChallengeModal={setShowAIChallengeModal}
      activeAIChallenge={activeAIChallenge}
      setActiveTab={setActiveTab}
      setToolsSubTab={setToolsSubTab}
      setUserNotification={setUserNotification}
      sendPersuasiveEmail={sendPersuasiveEmail}
    />
  );

  const PremiumOnboarding = () => (
    <PremiumOnboardingComponent
      showPremiumTrial={showPremiumTrial}
      setShowPremiumTrial={setShowPremiumTrial}
      user={user}
      theme={theme}
      initializeMonthly={initializeMonthly}
      initializeYearly={initializeYearly}
      handleSubscriptionSuccess={handleSubscriptionSuccess}
      setUserNotification={setUserNotification}
    />
  );

  const PremiumModal = () => (
    <PremiumModalComponent
      showPremiumModal={showPremiumModal}
      setShowPremiumModal={setShowPremiumModal}
      user={user}
      theme={theme}
      isPremium={isPremium}
      initializeMonthly={initializeMonthly}
      initializeYearly={initializeYearly}
      handleSubscriptionSuccess={handleSubscriptionSuccess}
      setUserNotification={setUserNotification}
    />
  );
  // --- \u{1F4F1} INITIALIZATION & FIREBASE SYNC ---
  useEffect(() => {
    if (!user) return;
    
    const verifyPendingPayment = async () => {
      const ref = localStorage.getItem('nsg_pending_payment_ref');
      const plan = localStorage.getItem('nsg_pending_payment_plan');
      
      if (ref) {
        try {
          setUserNotification("Verifying pending payment...");
          const response = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: circularSafeStringify({ reference: ref, uid: user.uid, plan: plan })
          });
          const data = await response.json();
          
          if (data.status === 'success') {
            setUserNotification("premium subscription successful");
            const duration = plan === 'monthly' ? 30 : 365;
            const newUntilDate = new Date();
            newUntilDate.setDate(newUntilDate.getDate() + duration);
            await updateDoc(doc(db, 'users', user.uid), {
              premiumUntil: newUntilDate.toISOString(),
              isPremium: true
            }).catch(e => console.error("Could not sync premium client-side:", e));
            localStorage.removeItem('nsg_pending_payment_ref');
            localStorage.removeItem('nsg_pending_payment_plan');
          } else {
            // Payment failed or is still pending on Paystack's end
            console.log("Payment verification failed or pending:", data);
          }
        } catch (err) {
          console.error("Payment verification error:", err);
        }
      }
    };
    
    verifyPendingPayment();
  }, [user]);

    // Presence Heartbeat - Optimized to 5-minute interval & visibility-gated to save Firestore write quota
    useEffect(() => {
      if (!user) return;
      // Single heartbeat on initial mount
      updateDoc(doc(db, 'users', user.uid), {
        lastSeen: serverTimestamp(),
        status: 'online'
      }).catch(() => {});

      const hb = setInterval(() => {
        if (document.visibilityState === 'visible') {
          updateDoc(doc(db, 'users', user.uid), {
            lastSeen: serverTimestamp(),
            status: 'online'
          }).catch(() => {});
        }
      }, 300000); // 5 minutes heartbeat
      return () => clearInterval(hb);
    }, [user]);

  // Memory Management: Release native Llama C++ model context from RAM when leaving AI chat/tools
  useEffect(() => {
    if (activeTab !== 'chat') {
      cleanupLlamaModel().catch(() => {});
    }
  }, [activeTab]);

  const userUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    console.log("App Initialized. Checking API Keys...");
    console.log("Gemini Key Found:", !!getApiKey());
    console.log("HF Key Found:", !!getHfKey());

    // Initialize native GoogleAuth plugin on mount
    initGoogleAuth().catch((err) => console.warn("GoogleAuth startup initialization note:", err));

    // Safety fallback timer to prevent indefinite auth loading screen
    const authSafetyTimeout = setTimeout(() => {
      setIsAuthLoading(false);
    }, 2500);

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(authSafetyTimeout);
      // Clear any existing snapshot listener
      if (userUnsubscribeRef.current) {
        userUnsubscribeRef.current();
        userUnsubscribeRef.current = null;
      }

      setUser(currentUser);
      
      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        
        userUnsubscribeRef.current = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const userData = { id: docSnap.id, ...data };
            setCurrentUserData(userData);

            // Point Reset Migration check to start clean from Bronze League for everyone:
            if (data && !data.pointResetCompleted) {
              updateDoc(userDocRef, {
                points: 0,
                pointResetCompleted: true,
                claimedQuests: []
              }).catch((e) => console.error("Error migrating user points:", e));
            }
            
            const isOwner = currentUser.email?.toLowerCase().trim() === "nuellkelechi@gmail.com";
            setIsAdminUser(isOwner || data.role === 'admin');
            
            const premiumUntilDate = data.premiumUntil ? new Date(data.premiumUntil) : null;
            const isFutureSubscription = (premiumUntilDate && !isNaN(premiumUntilDate.getTime())) ? (premiumUntilDate.getTime() > Date.now()) : true;
            const isExplicitGodBypass = data.bypassAllPayments === true;
            const userIsPremium = Boolean(
              isOwner ||
              isExplicitGodBypass ||
              data.isPremium === true ||
              data.subscribed === true ||
              data.plan === 'premium' ||
              data.tier === 'premium' ||
              (data.premiumUntil && isFutureSubscription)
            );
            setIsPremium(userIsPremium);

            if (userIsPremium) {
              setShowPremiumTrial(false);
              setShowPremiumModal(false);
            } else {
              const isManualLoginSession = sessionStorage.getItem('nsg_new_manual_login_session') === 'true';
              const hasShownSessionTrial = sessionStorage.getItem('nsg_has_shown_trial_premium') === 'true';
              if (isManualLoginSession && !hasShownSessionTrial) {
                setShowPremiumTrial(true);
                sessionStorage.setItem('nsg_has_shown_trial_premium', 'true');
                sessionStorage.removeItem('nsg_new_manual_login_session');
                setHasShownTrialThisSession(true);
              }
            }
            
            setProfileFormData(prev => ({
              displayName: data.displayName || prev.displayName || '',
              fullName: data.fullName || prev.fullName || '',
              username: data.username || '',
              email: data.email || currentUser?.email || prev.email || '',
              matricNumber: data.matricNumber || prev.matricNumber || '',
              dob: data.dob || prev.dob || '',
              country: data.country || prev.country || 'Nigeria',
              city: data.city || prev.city || '',
              gender: data.gender || prev.gender || 'Male',
              university: data.university || prev.university || '',
              level: data.level || prev.level || '',
              department: data.department || prev.department || '',
              faculty: data.faculty || prev.faculty || '',
              about: data.about || ''
            }));
            
            // Backfill username if missing
            if (!data.username) {
              const now = new Date();
              const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
              const secondsPart = now.getSeconds().toString().padStart(2, '0');
              const randomPart = Math.random().toString(36).substring(2, 4);
              const generatedUsername = `${datePart}${secondsPart}${randomPart}`;
              updateDoc(userDocRef, { username: generatedUsername }).catch(console.error);
              setUserHandle(generatedUsername);
            } else {
              setUserHandle(data.username);
            }
            
            if (data.status === 'deleted') {
              if (currentUser.email === "nuellkelechi@gmail.com") {
                updateDoc(userDocRef, { status: 'active' }).catch(e => handleFirestoreError(e, FirestoreOperation.UPDATE, `users/${currentUser.uid}`));
              } else {
                signOut(auth);
                setUserNotification("Your account has been deactivated.");
              }
            }
          } else {
            const isDefaultAdmin = currentUser.email === "nuellkelechi@gmail.com";
            // Date (YYYYMMDD) + Seconds (SS) + 2 Random letters
            const now = new Date();
            const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
            const secondsPart = now.getSeconds().toString().padStart(2, '0');
            const randomPart = Math.random().toString(36).substring(2, 4);
            const generatedUsername = `${datePart}${secondsPart}${randomPart}`;
            
            const userData = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              username: generatedUsername,
              photoURL: currentUser.photoURL,
              role: isDefaultAdmin ? 'admin' : 'student',
              createdAt: new Date().toISOString(),
              status: 'active',
              bypassHostingPayment: false,
              bypassTakingPayment: false,
              bypassAllPayments: false
            };
            setDoc(userDocRef, userData).catch(e => handleFirestoreError(e, FirestoreOperation.CREATE, `users/${currentUser.uid}`));
          }
          setIsAuthLoading(false);
        }, (error) => {
          handleFirestoreError(error, FirestoreOperation.GET, `users/${currentUser.uid}`);
          setCurrentUserData((prev: any) => prev || {
            id: currentUser.uid,
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Student',
            role: currentUser.email === "nuellkelechi@gmail.com" ? 'admin' : 'student',
            status: 'active'
          });
          setIsAuthLoading(false);
        });
      } else {
        setIsAdminUser(false);
        setCurrentUserData(null);
        setShowPremiumTrial(false);
        setShowPremiumModal(false);
        setIsAuthLoading(false);
      }
    });

    // Check for shared quiz or exam in URL
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quizId');
    if (quizId) {
      if (user) {
        loadSharedQuiz(quizId);
      } else {
        // Do NOT load quiz until user logs in. Save pending quiz ID and trigger login modal.
        setPendingQuizId(quizId);
        sessionStorage.setItem('nsg_pending_quiz_id', quizId);
        setShowAuthModal(true);
      }
    } else {
      // Check for local unsaved quiz progress
      const localProgress = localStorage.getItem('nsg_current_quiz_progress');
      if (localProgress) {
        try {
          const p = JSON.parse(localProgress);
          if (p && Array.isArray(p.quizQuestions) && p.quizQuestions.length > 0) {
            const validIndex = typeof p.currentQuestionIndex === 'number' && p.currentQuestionIndex >= 0 && p.currentQuestionIndex < p.quizQuestions.length ? p.currentQuestionIndex : 0;
            setQuizQuestions(p.quizQuestions);
            setQuizTopic(p.quizTopic || '');
            setCurrentQuestionIndex(validIndex);
            setQuizScore(typeof p.quizScore === 'number' ? p.quizScore : 0);
            setUserQuizAnswers(Array.isArray(p.userQuizAnswers) ? p.userQuizAnswers : []);
            setQuizDifficulty(p.quizDifficulty || 'Medium');
            setQuizQuestionCount(p.quizQuestionCount || p.quizQuestions.length);
            setCurrentQuizId(p.currentQuizId || null);
            setQuizState('active');
            setSelectedOption(p.userQuizAnswers?.[validIndex] !== undefined ? p.userQuizAnswers[validIndex] : null);
            setIsAnswered(p.userQuizAnswers?.[validIndex] !== undefined);
            setActiveTab('tools');
            setToolsSubTab('quiz');
          } else {
            localStorage.removeItem('nsg_current_quiz_progress');
          }
        } catch (e) {
          console.error("Failed to restore local quiz progress:", e);
          localStorage.removeItem('nsg_current_quiz_progress');
        }
      }
    }

    const examId = urlParams.get('examId');
    if (examId) {
      setActiveExamId(examId);
      setActiveTab('tools');
      setToolsSubTab('exam');
      loadSharedExam(examId);
    }

    // Local UI persistence
    // Theme persists to dark
    setTheme('dark');

    const savedAdminMode = safeStorage.getItem('nsg_admin_mode');
    if (savedAdminMode === 'true') setAdminMode(true);

    // Load hosted exam state if exists
    const savedHostExamId = safeStorage.getItem('nsg_host_exam_id');
    if (savedHostExamId && user) {
      // Fetch latest data from Firestore for persistence and ownership check
      const fetchExamData = async () => {
        try {
          const examDoc = await getDoc(doc(db, 'exams', savedHostExamId));
          if (examDoc.exists()) {
            const data = examDoc.data();
            // Critical Ownership Check: Only the host can restore this session state
            if (data.hostUid === user.uid) {
              setHostExamId(savedHostExamId);
              setIsHostPaid(true);
              setExamConfig(data.config || initialExamConfig);
              setRegisteredStudents(data.registeredStudents || []);
              setExamQuestions(data.questions || []);
              setExamStatus(data.status || 'active');
            } else {
              console.warn("Stale host exam session belonging to another user. Clearing local state.");
              safeStorage.removeItem('nsg_host_exam_id');
              setHostExamId('');
              setIsHostPaid(false);
            }
          }
        } catch (err) {
          console.error("Error fetching hosted exam:", err);
        }
      };
      fetchExamData();
    }

    const hasSeenWelcome = safeStorage.getItem('nsg_welcome_seen');
    if (!hasSeenWelcome) setShowWelcome(true);

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Deep Link URL Handler for Native Mobile App & Web
  const handleDeepLinkUrl = useCallback((urlStr: string) => {
    try {
      let parsedUrl: URL;
      if (urlStr.includes('://')) {
        const fixedScheme = urlStr.replace(/^nsgscholar:\/\//i, 'https://nsg-scholar.app/').replace(/^nsg:\/\//i, 'https://nsg-scholar.app/');
        parsedUrl = new URL(fixedScheme);
      } else {
        parsedUrl = new URL(urlStr, window.location.origin || 'https://nsg-scholar.app');
      }
      
      const qId = parsedUrl.searchParams.get('quizId');
      if (qId) {
        console.log("📍 Deep link loaded quizId:", qId);
        if (user) {
          loadSharedQuiz(qId);
        } else {
          setPendingQuizId(qId);
          sessionStorage.setItem('nsg_pending_quiz_id', qId);
          setShowAuthModal(true);
        }
      }
    } catch (e) {
      console.error("Deep link parsing error:", e);
    }
  }, [user]);

  // Register native Capacitor appUrlOpen listener
  useAppUrlListener(handleDeepLinkUrl);

  // On mobile web browser, if user visits a quiz link, attempt opening the mobile app if installed
  useEffect(() => {
    if (!isNativePlatform() && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const quizIdParam = urlParams.get('quizId');
      const isMobileBrowser = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      if (quizIdParam && isMobileBrowser && !sessionStorage.getItem('nsg_app_redirect_attempted')) {
        sessionStorage.setItem('nsg_app_redirect_attempted', 'true');
        
        // Attempt opening installed native app via Android/iOS app intent
        const intentUrl = `intent://nsg-scholar.app?quizId=${quizIdParam}#Intent;scheme=https;package=ng.name.nuellstudyguide;end;`;
        
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = intentUrl;
        document.body.appendChild(iframe);
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }
  }, []);

  // Auto-sync Exam Config to Firestore
  useEffect(() => {
    if (hostExamId && isHostPaid && user) {
      const syncConfig = async () => {
        if (!user || !hostExamId) return;
        try {
          // Verify ownership in code as well
          const examDoc = await getDoc(doc(db, 'exams', hostExamId));
          if (examDoc.exists()) {
             if (examDoc.data().hostUid !== user.uid) {
               console.warn("Won't sync config: User is not the host.");
               return;
             }
             console.log("Auto-syncing Exam Config:", examConfig);
             await updateDoc(doc(db, 'exams', hostExamId), { config: examConfig });
          }
        } catch (err) {
          console.error("Sync Config Error:", err);
        }
      };
      const timer = setTimeout(syncConfig, 1000); // Debounce
      return () => clearTimeout(timer);
    }
  }, [examConfig, hostExamId, isHostPaid, user]);

  // Auto-sync Exam Questions and Students to Firestore every second
  useEffect(() => {
    if (hostExamId && isHostPaid && user) {
      const syncQuestionsAndStudents = async () => {
        if (!user || !hostExamId) return;
        try {
          const examDoc = await getDoc(doc(db, 'exams', hostExamId));
          if (examDoc.exists() && examDoc.data().hostUid === user.uid) {
            await updateDoc(doc(db, 'exams', hostExamId), { 
              questions: examQuestions,
              registeredStudents: registeredStudents 
            });
          }
        } catch (err) {
          console.error("Auto-sync Questions/Students Error:", err);
        }
      };
      const timer = setTimeout(syncQuestionsAndStudents, 1000);
      return () => clearTimeout(timer);
    }
  }, [examQuestions, registeredStudents, hostExamId, isHostPaid, user]);

  // Admin Mode Persistence
  useEffect(() => {
    localStorage.setItem('nsg_admin_mode', adminMode.toString());
  }, [adminMode]);

  // Theme Sync
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Config Sync
  useEffect(() => {
    if (!user) return;
    const unsubConfig = onSnapshot(doc(db, 'config', 'exam'), (doc) => {
      if (doc.exists()) setExamConfig(doc.data() as ExamConfig);
    }, (error) => handleFirestoreError(error, FirestoreOperation.GET, 'config/exam'));

    return () => unsubConfig();
  }, [user]);

  // Admin-specific Data Sync
  useEffect(() => {
    if (!user || !adminMode) {
      setScoreSheet([]);
      return;
    }

    // If we have a hostExamId, we should listen to its specific results and exam data
    let unsubScores = () => {};
    let unsubExam = () => {};

    if (hostExamId) {
      console.log("Starting Exam Results sync for ID:", hostExamId);
      unsubScores = onSnapshot(query(collection(db, 'exams', hostExamId, 'results'), limit(500)), (snapshot) => {
        const scores = snapshot.docs.map(doc => doc.data() as StudentResult);
        console.log(`Synced ${scores.length} results for exam ${hostExamId}`);
        setScoreSheet(scores.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }, (error) => handleFirestoreError(error, FirestoreOperation.LIST, `exams/${hostExamId}/results`));

      unsubExam = onSnapshot(doc(db, 'exams', hostExamId), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          console.log("Synced Exam Data:", data);
          // Only sync if we're not currently generating questions to avoid overwriting local state
          if (!isGeneratingAdminQuestions) {
            setExamConfig(data.config || examConfig);
            setRegisteredStudents(data.registeredStudents || []);
            setExamQuestions(data.questions || []);
            setExamStatus(data.status || 'none');
          }
        } else {
          console.warn("Exam document does not exist in Firestore:", hostExamId);
        }
      }, (error) => handleFirestoreError(error, FirestoreOperation.GET, `exams/${hostExamId}`));
    }

    return () => {
      unsubScores();
      unsubExam();
    };
  }, [user, adminMode, hostExamId, isGeneratingAdminQuestions]);

  // Sync all exams hosted by the user
  useEffect(() => {
    if (!user || !adminMode) {
      setHostedExams([]);
      return;
    }

    const q = query(collection(db, 'exams'), where('hostUid', '==', user.uid), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      const examsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHostedExams(examsList);
      if (examsList.length > 0) {
        setIsHostPaid(true);
        // If nothing is selected, select the most recent one
        const currentStoredId = localStorage.getItem('nsg_host_exam_id');
        if (!hostExamId && !currentStoredId) {
          setHostExamId(examsList[0].id);
        }
      }
    }, (err) => handleFirestoreError(err, FirestoreOperation.LIST, 'exams'));

    return () => unsub();
  }, [user, adminMode]);

  // Handle Exam ID local storage update
  useEffect(() => {
    if (hostExamId) {
      localStorage.setItem('nsg_host_exam_id', hostExamId);
    } else {
      localStorage.removeItem('nsg_host_exam_id');
    }
  }, [hostExamId]);

  // User-specific Data Sync
  useEffect(() => {
    if (!user) {
      setChatSessions([]);
      setChatHistory([]);
      setSessions([]);
      return;
    }

    const unsubChats = onSnapshot(query(collection(db, 'users', user.uid, 'chatSessions'), limit(30)), (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ChatSession));
      setChatSessions(sessions);
    }, (err) => handleFirestoreError(err, FirestoreOperation.LIST, `users/${user.uid}/chatSessions`));

    // For simplicity, we'll keep lecture sessions local or add them to Firestore too
    // Let's add them to Firestore for full persistence
    const unsubLectures = onSnapshot(query(collection(db, 'users', user.uid, 'lectureSessions'), limit(30)), (snapshot) => {
      const lectureData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LectureSession));
      
      let mergedData = [...lectureData];
      try {
        const offlineData = localStorage.getItem('nsg_offline_recordings');
        if (offlineData) {
          const offlineList = JSON.parse(offlineData) as LectureSession[];
          const syncedIds = new Set(lectureData.map(l => l.id));
          const unsyncedOffline = offlineList.filter(o => !syncedIds.has(o.id));
          mergedData = [...mergedData, ...unsyncedOffline];
        }
      } catch (err) {
        console.error("Error reading offline recordings custom snapshot", err);
      }

      setSessions(mergedData.sort((a, b) => {
        if (!!b.isPinned !== !!a.isPinned) {
          return b.isPinned ? 1 : -1;
        }
        const timeA = a.createdAt || (a.id.startsWith('session-') ? parseInt(a.id.split('-')[1]) : 0);
        const timeB = b.createdAt || (b.id.startsWith('session-') ? parseInt(b.id.split('-')[1]) : 0);
        return timeB - timeA;
      }));
    }, (err) => handleFirestoreError(err, FirestoreOperation.LIST, `users/${user.uid}/lectureSessions`));

    const unsubHistory = onSnapshot(query(collection(db, 'users', user.uid, 'studyHistory'), limit(50)), (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as HomeHistoryItem));
      setFinishedHistory(prev => {
        // Merge with local if any (local might be more recent)
        const combined = [...prev, ...historyData].filter((item, index, self) => 
          self.findIndex(i => i.id === item.id) === index
        );
        return combined.sort((a, b) => {
          const timeA = a.timestamp || (a.date ? new Date(a.date).getTime() : 0);
          const timeB = b.timestamp || (b.date ? new Date(b.date).getTime() : 0);
          return timeB - timeA;
        }).slice(0, 50);
      });
    }, (err) => handleFirestoreError(err, FirestoreOperation.LIST, `users/${user.uid}/studyHistory`));

    return () => {
      unsubChats();
      unsubLectures();
      unsubHistory();
    };
  }, [user]);

  const loadRecordingSession = async (session: LectureSession) => {
    setSelectedSession(session);
    setAnalysisResult(session.fullAnalysis);
    setRefurbishedResult(session.refurbishedNote || null);
    setTranscriptionNotes(session.notes || "");
    setCurrentRecordingSessionId(session.id);
    
    if (session.audioBase64) {
      try {
        const response = await fetch(`data:audio/webm;base64,${session.audioBase64}`);
        const blob = await response.blob();
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      } catch (err) {
        console.error("Error loading audio from base64:", err);
      }
    } else if (session.audioUrl) {
      setAudioUrl(session.audioUrl);
    }
    
    if (session.status === 'analyzed') {
      setShowAnalysisInRecord(true);
    } else {
      setShowAnalysisInRecord(false);
    }
    setShowRecordSidebar(false);
  };

  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    try {
      // Uses Capacitor native account picker on native Android/iOS, or standard popup on Web
      const result = await performGoogleAuth(auth);
      const user = result?.user || auth.currentUser;
      
      if (!user) {
        throw new Error("No user profile returned from Google sign-in.");
      }

      // Immediately set user in local React state so UI responds without delay
      setUser(user);
      const isOwner = user.email?.toLowerCase().trim() === 'nuellkelechi@gmail.com';
      setCurrentUserData((prev: any) => prev || {
        id: user.uid,
        uid: user.uid,
        email: user.email,
        fullName: user.displayName || user.email?.split('@')[0] || 'Scholar',
        displayName: user.displayName || user.email?.split('@')[0] || 'Scholar',
        photoURL: user.photoURL || null,
        role: isOwner ? 'admin' : 'student',
        status: 'active'
      });

      // Check if user document exists, if not create it
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef).catch(() => null);
        
        if (userDoc && !userDoc.exists()) {
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            fullName: user.displayName || '',
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: isOwner ? 'admin' : 'student',
            createdAt: new Date().toISOString(),
            status: 'active',
            matric: '',
            dob: '',
            bypassHostingPayment: false,
            bypassTakingPayment: false,
            bypassAllPayments: false
          }).catch(e => console.warn('setDoc user profile notice:', e));
        } else if (userDoc && userDoc.exists()) {
          // Update existing user with Google data if missing
          const existingData = userDoc.data();
          await updateDoc(userDocRef, {
            photoURL: existingData.photoURL || user.photoURL,
            displayName: existingData.displayName || user.displayName,
            fullName: existingData.fullName || user.displayName
          }).catch(e => console.warn('updateDoc user profile notice:', e));
        }
      } catch (docErr: any) {
        console.warn('User profile sync note:', docErr);
      }

      try {
        sessionStorage.setItem('nsg_new_manual_login_session', 'true');
      } catch (e) {}

      setShowAuthModal(false);
      setIsAuthLoading(false);
      setUserNotification("Welcome back! Logged in with Google.");
    } catch (error: any) {
      const errorCode = error?.code || "unknown";
      const errorMessage = error?.message || String(error);
      
      // Specifically catch cancellation codes
      if (
        errorCode === 'auth/cancelled-popup-request' || 
        errorCode === 'auth/popup-closed-by-user' ||
        errorMessage.toLowerCase().includes('cancelled')
      ) {
        setIsAuthLoading(false);
        return;
      }

      console.error("Login Error:", error);
      
      if (error.message === "QUOTA_EXCEEDED") {
        setUserNotification("Firestore Quota Exceeded. Please try logging in again tomorrow when the systems reset. Thank you for your patience.");
      } else if (errorCode === 'auth/unauthorized-domain') {
        setUserNotification(`Login failed: This domain is not authorized in Firebase Console. Please add "${window.location.hostname}" to Authorized Domains.`);
      } else if (errorCode === 'auth/popup-blocked') {
        setUserNotification("Login failed: Popup was blocked by your browser. Please allow popups for this site.");
      } else if (errorCode.includes('timeout') || errorMessage.includes('timeout')) {
        setUserNotification(`Login Timeout: The connection to Firebase Auth timed out. Please check your internet connection or use a different network.`);
      } else {
        setUserNotification(`Google Sign-In: ${errorMessage}`);
      }
      setIsAuthLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setValidationErrors({});
    try {
      if (authMode === 'signup') {
        // Validate fields
        const errors: Record<string, string> = {};
        if (!authEmail) errors.email = "Email address is required";
        if (!authPassword) errors.password = "Access password is required";
        if (!authFullName) errors.fullName = "Full Official Name is required";
        if (!authDOB) errors.dob = "DOB is required";
        if (!authUniversity) errors.university = "University select is required";
        if (!authFaculty) errors.faculty = "Faculty select is required";
        if (!authDepartment) errors.department = "Department select is required";
        
        if (Object.keys(errors).length > 0) {
          setValidationErrors(errors);
          setUserNotification("Please correct the validation errors first.");
          setIsAuthLoading(false);
          return;
        }

        if (passwordStrength.score < 1) {
          setUserNotification("Password is too weak. Must be greater than 6 characters.");
          setIsAuthLoading(false);
          return;
        }

        // Automatic Username Fallback Functionality
        let finalUsername = authUsername ? authUsername.trim() : '';
        if (!finalUsername) {
          const timestampBase36 = Date.now().toString(36);
          const randomHex = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
          finalUsername = `User_${timestampBase36}_${randomHex}`;
          setAuthUsername(finalUsername);
          setUserNotification(`Automatically generated deterministic Username: ${finalUsername}`);
        } else {
          if (usernameStatus && !usernameStatus.available) {
            setUserNotification("Username is already taken.");
            setIsAuthLoading(false);
            return;
          }
        }

        let inviterUid: string | null = null;
        let inviterUsername: string | null = null;
        if (authInviteCode && authInviteCode.trim()) {
          const inviteCodeQuery = query(collection(db, 'users'), where('username', '==', authInviteCode.toLowerCase().trim()), limit(1));
          const querySnap = await getDocs(inviteCodeQuery);
          if (!querySnap.empty) {
            const inviterDoc = querySnap.docs[0];
            inviterUid = inviterDoc.id;
            inviterUsername = inviterDoc.data().username;
          } else {
            console.warn(`[Invite] Invite code entered (${authInviteCode}) but no matching user found.`);
          }
        }

        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        const newUser = userCredential.user;
        
        // Create user document in Firestore including Phone details
        await setDoc(doc(db, 'users', newUser.uid), {
          uid: newUser.uid,
          email: newUser.email,
          phone: authPhone || '',
          fullName: authFullName,
          displayName: authFullName,
          username: finalUsername.toLowerCase().trim(),
          dob: authDOB,
          matric: authMatric || '',
          university: authUniversity,
          faculty: authFaculty,
          department: authDepartment,
          role: newUser.email === 'nuellkelechi@gmail.com' ? 'admin' : 'student',
          rank: 'Fresher',
          points: 0,
          streak: 0,
          lastActive: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          status: 'active',
          bypassHostingPayment: false,
          bypassTakingPayment: false,
          bypassAllPayments: false,
          invitedBy: inviterUsername || '',
          invitedUsers: []
        });

        if (inviterUid) {
          try {
            await updateDoc(doc(db, 'users', inviterUid), {
              invitedUsers: arrayUnion({
                uid: newUser.uid,
                username: finalUsername.toLowerCase().trim(),
                fullName: authFullName,
                timestamp: new Date().toISOString()
              }),
              points: increment(50)
            });
          } catch (err) {
            console.error("Failed to update inviter record:", err);
          }
        }
        
        const { sendEmailVerification } = await import('firebase/auth');
        await sendEmailVerification(newUser);
        
        setUserNotification("Account created! Verification link sent to your email.");
        
        // Send Welcome Email
        try {
          await axios.post('/api/send-welcome-email', {
            email: newUser.email,
            name: authFullName
          });
        } catch (err) {
          console.error("Failed to send welcome email:", err);
        }
      } else {
        let loginEmail = authEmail;
        
        // Better logic to differentiate between email and matric number login
        const isLikelyEmail = authEmail.includes('@');
        
        if (!isLikelyEmail) {
          try {
            // Use server-side proxy for matric lookup to avoid unauthenticated Firestore list permissions
            const res = await axios.get(`/api/lookup-user?matric=${encodeURIComponent(authEmail.trim())}`);
            if (res.data.email) {
              loginEmail = res.data.email;
            } else {
              setUserNotification("Matric number not found. Please use your registered email.");
              setIsAuthLoading(false);
              return;
            }
          } catch (err: any) {
            console.error("Lookup Error:", err);
            if (err.response?.status === 404) {
              setUserNotification("Matric number not found.");
            } else {
              setUserNotification("Error verifying matric number on server.");
            }
            setIsAuthLoading(false);
            return;
          }
        }

        if (!loginEmail || !authPassword) {
          setUserNotification("Email/Matric and Password are required.");
          setIsAuthLoading(false);
          return;
        }

        try {
          await signInWithEmailAndPassword(auth, loginEmail, authPassword);
          setUserNotification("Logged in successfully!");
        } catch (err: any) {
          console.warn("Sign-in authentication error:", err);
          setUserNotification("Wrong password or username. Please check your credentials and try again.");
          setIsAuthLoading(false);
          return;
        }
      }
      sessionStorage.setItem('nsg_new_manual_login_session', 'true');
      setShowAuthModal(false);
    } catch (error: any) {
      console.error("Auth Error:", error);
      setUserNotification(error.message);
      setIsAuthLoading(false); // Only set loading false on error
    }
  };

  const handleLogout = async () => {
    showConfirm(
      "Confirm Logout",
      "Are you sure you want to log out? Your session state will be preserved.",
      async () => {
        setIsAuthLoading(true);
        try {
          await signOut(auth);
          setUser(null);
          setAdminMode(false);
          setIsHostPaid(false);
          setIsTakingPaid(false);
          setHasShownTrialThisSession(false);
          setShowPremiumTrial(false);
          setShowPremiumModal(false);
          hasShownWelcomeNotification.current = false;
          hasShownPeerActivityWelcomeNotification.current = false;
          setUserNotification("Logged out successfully.");
        } catch (error) {
          console.error("Logout Error:", error);
        } finally {
          setIsAuthLoading(false);
        }
      },
      "Logout"
    );
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setIsAuthLoading(true);

      const newUsername = profileFormData.username?.toLowerCase().trim();
      
      if (!newUsername) {
        setUserNotification("Username is required.");
        setIsAuthLoading(false);
        return;
      }

      // Basic validation
      if (newUsername.length < 3 || !/^[a-z0-9_]+$/.test(newUsername)) {
        setUserNotification("Username must be at least 3 chars & only letters, numbers, or underscore.");
        setIsAuthLoading(false);
        return;
      }

      // Check for uniqueness if username changed
      if (newUsername && newUsername !== currentUserData?.username) {
        const q = query(collection(db, 'users'), where('username', '==', newUsername), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setUserNotification("Username already taken. Please choose another one.");
          setIsAuthLoading(false);
          return;
        }
      }

      const updatedData: any = {
        displayName: profileFormData.displayName || '',
        fullName: profileFormData.fullName || '',
        username: newUsername,
        email: profileFormData.email || user.email || '',
        matric: profileFormData.matricNumber || '',
        matricNumber: profileFormData.matricNumber || '',
        dob: profileFormData.dob || '',
        country: profileFormData.country || 'Nigeria',
        gender: profileFormData.gender || 'Male',
        university: profileFormData.university || '',
        faculty: profileFormData.faculty || '',
        department: profileFormData.department || '',
        level: profileFormData.level || '',
        rank: getUserRank(currentUserData?.points || 0),
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'users', user.uid), updatedData);
      setIsEditingProfile(false);
      setUserNotification("Profile updated successfully!");
    } catch (error) {
      console.error("Save Profile Error:", error);
      handleFirestoreError(error, FirestoreOperation.UPDATE, `users/${user.uid}`);
      setUserNotification("Failed to save profile changes.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleDirectWhatsAppSync = async () => {
    if (!user) {
      setUserNotification("You must be logged in to sync WhatsApp.");
      return;
    }
    if (!whatsappInputNumber || whatsappInputNumber.length < 8) {
      setUserNotification("Please enter a valid WhatsApp phone number (minimum 8 digits with country code).");
      return;
    }
    setWhatsappLoading(true);
    try {
      const formattedPhone = whatsappInputNumber.replace(/\D/g, '');

      // Directly update profile data server or client side
      await updateDoc(doc(db, 'users', user.uid), {
        whatsappNumber: formattedPhone,
        isWhatsAppVerified: true
      });

      setUserNotification("WhatsApp linked & synchronized successfully!");
    } catch (err: any) {
      console.error("error syncing whatsapp:", err);
      setUserNotification(err.message || "Failed to update WhatsApp link.");
    } finally {
      setWhatsappLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserData?.whatsappNumber && !whatsappInputNumber) {
      setWhatsappInputNumber(currentUserData.whatsappNumber);
    }
  }, [currentUserData?.whatsappNumber]);

  const handleProfileUpdate = async (updates: any) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), updates);
      setUserNotification("Profile updated!");
    } catch (error) {
      console.error("Profile Update Error:", error);
      setUserNotification("Failed to update profile.");
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    // Check file size (max 10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUserNotification("Image too large. Please use an image under 10MB.");
      return;
    }

    try {
      setIsAuthLoading(true);
      setUserNotification("Uploading profile image...");
      
      const imageUrl = await uploadToCloudinary(file);
      
      if (!imageUrl) {
        throw new Error("Failed to get image URL from upload service");
      }
      
      await updateDoc(doc(db, 'users', user.uid), { photoURL: imageUrl });
      
      // Update local state and form data
      setCurrentUserData((prev: any) => ({ ...prev, photoURL: imageUrl }));
      setProfileFormData(prev => ({ ...prev, photoURL: imageUrl }));
      
      setUserNotification("Profile image updated!");
    } catch (error) {
      console.error("Image Upload Error:", error);
      setUserNotification("Failed to upload image. Please try again.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    const quizData = {
      questions: quizQuestions,
      index: currentQuestionIndex,
      score: quizScore,
      state: quizState,
      selectedOption: selectedOption,
      isAnswered: isAnswered,
      topic: quizTopic
    };
    localStorage.setItem('nsg_quiz_data', circularSafeStringify(quizData));
  }, [quizQuestions, currentQuestionIndex, quizScore, quizState, selectedOption, isAnswered, quizTopic]);

  useEffect(() => {
    if (chatContainerRef.current && !showScrollButton) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    // Sync with data-theme attribute for CSS variable switching
    document.documentElement.setAttribute('data-theme', next);
  };

  // Sync on mount (in case localStorage restored a light theme):
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleChatScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isAtBottom);
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setUserNotification("Copied to clipboard!");
  };

  // --- \u{1F393} CBT & ADMIN LOGIC ---
  const shuffleArray = (array: any[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const generateAdminQuestions = async (options?: { quantity?: number; rawNotes?: string; customPrompt?: string }) => {
    console.log("Starting Subject-Specific Admin Question Generation...");
    
    if (!getApiKey()) {
      const errMsg = "API Key is missing. Please set GEMINI_API_KEY inside your settings.";
      setUserNotification(errMsg);
      alert(errMsg);
      return;
    }

    const currentSub = examConfig.subjects?.[adminSelectedSubjectIdx];
    const currentSubjectName = currentSub ? currentSub.name : 'Mathematics';
    
    // Filter existing pool for this subject
    const existingSubQuestions = examQuestions.filter(q => q.subject?.trim().toLowerCase() === currentSubjectName.trim().toLowerCase());
    const isBlank = (itemQ: any) => !itemQ.question || itemQ.question.trim() === "" || itemQ.question.trim().toLowerCase() === "enter question query here...";
    const blankSubQs = existingSubQuestions.filter(q => isBlank(q));
    const realSubQs = existingSubQuestions.filter(q => !isBlank(q));

    const targetSub = examConfig.subjects?.find(s => s.name.trim().toLowerCase() === currentSubjectName.trim().toLowerCase());
    const currentTargetCount = targetSub ? (targetSub.questionsToAnswer || 15) : 15;

    // Determine quantity: if there are blank spaces, generate enough to fill all blanks or requested quantity
    const quantity = options?.quantity || Math.max(adminOmniQuantity, blankSubQs.length > 0 ? blankSubQs.length : currentTargetCount - realSubQs.length, 5);

    const combinedPrompt = options 
      ? `${options.customPrompt || ""}\n${options.rawNotes || ""}`.trim()
      : adminQuestionsRaw.trim();

    if (realSubQs.length === 0 && blankSubQs.length === 0 && !combinedPrompt) {
      const errMsg = `Please enter a prompt instruction or raw notes for ${currentSubjectName} first.`;
      setUserNotification(errMsg);
      alert(errMsg);
      return;
    }

    setIsGeneratingAdminQuestions(true);
    try {
      const prompt = `
        Convert the following user specifications or analyze the style of existing questions to generate a professional Multiple Choice Question (MCQ) pool.
        Generate exactly ${Math.min(50, quantity)} questions for the subject/exam of "${currentSubjectName}".
        Each question must have exactly 4 options (A-D) and one correct answer index (0-3).
        
        ${combinedPrompt ? `User Instructions/Topic Prompt: "${combinedPrompt}"` : `Analyze difficulty and style from the existing questions below and create similar questions to fill up all empty spaces.`}
        
        ${realSubQs.length > 0 ? `
        Analyzable Existing Questions for style modeling in ${currentSubjectName}:
        ${circularSafeStringify(realSubQs.slice(0, 5))}
        ` : ''}

        IMPORTANT: For any mathematical formulas or scientific notations, ALWAYS use LaTeX notation. 
        Use $ ... $ for inline math (e.g. $x^2$) and $$ ... $$ for block math (e.g. $$E=mc^2$$).
        NEVER wrap LaTeX in code blocks.
        Ensure all backslashes are properly escaped for JSON.
        
        Return ONLY a JSON object with this exact structure:
        {
          "questions": [
            {
              "question": "string",
              "options": ["string", "string", "string", "string"],
              "correctAnswer": number,
              "explanation": "string detailing academic explanation"
            }
          ]
        }
      `;

      const askGemini = async () => {
        const aiInstance = getAiInstance();
        const res = await aiInstance.models.generateContent({
          model: FLASH_MODEL,
          contents: { role: "user", parts: [{ text: prompt }] },
          config: { 
            responseMimeType: "application/json",
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL }
          }
        });
        return res?.text || null;
      };

      const askOpenRouter = async () => {
        return await callOpenRouter(prompt, OPENROUTER_MODELS.TEXT_PRO);
      };

      const askTogether = async () => {
        return await callTogetherAI(prompt);
      };

      const respText = await askGemini() || await askTogether() || await askOpenRouter() || "{}";
      const data = robustJSONParse(respText) || {};

      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("AI returned zero or invalid questions.");
      }

      const formatted = data.questions.map((q: any) => ({ 
        ...q, 
        id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        subject: currentSubjectName
      }));

      // Smart Filling: Replace blank slots with formatted questions
      let generatedIdx = 0;
      const updatedSubQuestions = existingSubQuestions.map(q => {
        if (isBlank(q) && generatedIdx < formatted.length) {
          const newQ = { ...formatted[generatedIdx], id: q.id, subject: currentSubjectName };
          generatedIdx++;
          return newQ;
        }
        return q;
      });

      // If there are remaining formatted questions that didn't fit into existing blank slots, append them
      const remainingFormatted = formatted.slice(generatedIdx);
      const finalSubQuestions = [...updatedSubQuestions, ...remainingFormatted];

      const newTotalCount = finalSubQuestions.length;
      let finalSubjects = examConfig.subjects || [];
      if (newTotalCount > currentTargetCount) {
        finalSubjects = (examConfig.subjects || []).map(s => {
          if (s.name.trim().toLowerCase() === currentSubjectName.trim().toLowerCase()) {
            return { ...s, questionsToAnswer: newTotalCount };
          }
          return s;
        });
        setExamConfig(prev => ({ ...prev, subjects: finalSubjects }));
      }

      const otherSubjectsQs = examQuestions.filter(q => (q.subject || "Mathematics").trim().toLowerCase() !== currentSubjectName.trim().toLowerCase());
      const updatedPool = [...otherSubjectsQs, ...finalSubQuestions].slice(0, 300);
      setExamQuestions(updatedPool);
      setBatchQuestionText(questionsToBatchText(finalSubQuestions));

      // Auto-sync to Firestore if hosting (without affecting user results)
      if (hostExamId) {
        await updateDoc(doc(db, 'exams', hostExamId), { 
          questions: updatedPool,
          config: { ...examConfig, subjects: finalSubjects }
        });
      }

      const addedCount = formatted.length;
      setAdminNotification(`✨ Omni successfully added/filled ${addedCount} questions for ${currentSubjectName}!`);
      setUserNotification(`✨ Omni successfully added/filled ${addedCount} questions for ${currentSubjectName}!`);
      setAdminQuestionsRaw('');
    } catch (e) {
      console.error("Question Generation Error:", e);
      const errMsg = "❌ Failed to generate questions or populate the log. Please check your prompt or API key and tap Generate again.";
      setAdminNotification(errMsg);
      setUserNotification(errMsg);
      alert(errMsg);
    } finally {
      setIsGeneratingAdminQuestions(false);
    }
  };

  useEffect(() => {
    if (userNotification) {
      const timer = setTimeout(() => setUserNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [userNotification]);

  useEffect(() => {
    const handleTriggerQuiz = (e: any) => {
      const topic = e.detail?.topic || quizTopic || "General Assessment";
      const count = e.detail?.count || quizQuestionCount || 5;
      setActiveTab('tools');
      setToolsSubTab('quiz');
      setSelectedChatForRoom(null);
      setIsChatRoomActive(false);
      generateQuiz(topic, count, 'Medium', true);
    };
    window.addEventListener('trigger_quiz_gen', handleTriggerQuiz);
    return () => window.removeEventListener('trigger_quiz_gen', handleTriggerQuiz);
  }, [quizTopic, quizQuestionCount]);

  const handleMatricLogin = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    let targetExamId = activeExamId || examIdInput.trim().toUpperCase();
    
    if (!targetExamId) {
      setUserNotification("Please enter a valid Exam ID.");
      return;
    }

    if (!matricNumber.trim()) {
      setUserNotification("Please enter your matric number.");
      return;
    }

    try {
      setIsAuthLoading(true);
      const examDoc = await getDoc(doc(db, 'exams', targetExamId));
      
      if (examDoc.exists()) {
        const data = examDoc.data();
        
        // Check if exam is active
        if (data.status === 'ended') {
          setUserNotification("This exam session has ended.");
          return;
        }

        // Update local state with fetched data
        setExamConfig(data.config);
        setExamQuestions(data.questions);
        const students = data.registeredStudents || [];
        console.log(`Exam ${targetExamId} found. Registered students:`, students);
        setRegisteredStudents(students);
        setActiveExamId(targetExamId);
        setActiveExamHostUid(data.hostUid || null);
        
        // Verify student registration
        const cleanMatric = matricNumber.replace(/\s+/g, '').toLowerCase();
        const student = students.find((s: any) => s.matric.replace(/\s+/g, '').toLowerCase() === cleanMatric);
        
        if (student) {
          setStudentName(student.name);
          
          // Check Firestore results subcollection first to verify true completion status by matric number
          const resultsSnap = await getDocs(collection(db, 'exams', targetExamId, 'results'));
          const serverFinishedDoc = resultsSnap.docs.find(doc => {
            const rData = doc.data();
            const rMatric = (rData.matric || "").toString().replace(/\s+/g, '').toLowerCase();
            return rMatric === cleanMatric;
          });

          if (serverFinishedDoc) {
            setUserNotification("You have already completed this exam (Verified by Server Database).");
            localStorage.setItem(`nsg_exam_session_${targetExamId}_${student.matric}`, circularSafeStringify({ status: 'completed' }));
            setIsAuthLoading(false);
            return;
          }

          // Check for existing session in localStorage
          const sessionKey = `nsg_exam_session_${targetExamId}_${student.matric}`;
          const session = localStorage.getItem(sessionKey);
          if (session) {
            try {
              const sessionData = JSON.parse(session);
              if (sessionData.status === 'completed') {
                // Server confirmed no completed result exists for this matric, so clear stale local completion lock!
                localStorage.removeItem(sessionKey);
              } else if (sessionData.status === 'in-progress') {
                // Restore in-progress session state!
                setStudentActiveQuestions(sessionData.studentActiveQuestions || []);
                setExamAnswers(sessionData.examAnswers || {});
                setExamTimer(sessionData.examTimer || (data.config?.duration || 60) * 60);
                setActiveStudentSubject(sessionData.activeStudentSubject || "");
                setCurrentExamIndex(0);
                setExamFinished(false);
                setExamLobbyState('exam');
                setActiveExamId(targetExamId);
                setActiveExamHostUid(data.hostUid || null);
                
                if (examTimerRef.current) clearInterval(examTimerRef.current);
                examTimerRef.current = setInterval(() => {
                  setExamTimer(prev => {
                    if (prev <= 1) {
                      submitExam();
                      return 0;
                    }
                    const newVal = prev - 1;
                    try {
                      const curStr = localStorage.getItem(sessionKey);
                      if (curStr) {
                        const curObj = JSON.parse(curStr);
                        curObj.examTimer = newVal;
                        localStorage.setItem(sessionKey, circularSafeStringify(curObj));
                      }
                    } catch (e) {}
                    return newVal;
                  });
                }, 1000);

                setUserNotification("🔄 Restored your active exam session!");
                setIsAuthLoading(false);
                return;
              }
            } catch (e) {
              localStorage.removeItem(sessionKey);
            }
          }

          // Check payment status
          if (isTakingPaid || currentUserData?.bypassTakingPayment || currentUserData?.bypassAllPayments) {
            setIsTakingPaid(true);
            setExamLobbyState('briefing');
          } else {
            // Stay in login state to show payment button, but name is now set
            setUserNotification("Registration verified. Please complete payment to start.");
          }
        } else {
          setUserNotification("You are not registered for this exam.");
        }
      } else {
        setUserNotification("Invalid Exam ID. Please check and try again.");
      }
    } catch (err) {
      console.error("Exam Verification Error:", err);
      setUserNotification("Failed to verify exam details. Check your connection.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const startExam = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    let finalSelectedQuestions: ExamQuestion[] = [];
    if (examConfig.subjects && examConfig.subjects.length > 0) {
      // Multi-subject slice selection
      examConfig.subjects.forEach(sub => {
        const subPool = examQuestions.filter(q => (q.subject || "Mathematics").trim().toLowerCase() === sub.name.trim().toLowerCase());
        const rawSitCount = sub.questionsToSit !== undefined && (sub.questionsToSit as any) !== "" ? Number(sub.questionsToSit) : (sub.questionsToAnswer || 15);
        const subCount = isNaN(rawSitCount) || rawSitCount <= 0 ? (sub.questionsToAnswer || 15) : rawSitCount;
        // Shuffle the subject's pool and slice to needed count
        const sliced = shuffleArray(subPool).slice(0, subCount);
        const normalizedSliced = sliced.map(q => ({
          ...q,
          subject: sub.name // Force correct casing!
        }));
        finalSelectedQuestions.push(...normalizedSliced);
      });
    }

    if (finalSelectedQuestions.length === 0) {
      if (examQuestions.length < examConfig.questionCount) {
        setUserNotification(`Admin has not uploaded enough questions (Minimum ${examConfig.questionCount} required).`);
        return;
      }
      finalSelectedQuestions = shuffleArray(examQuestions).slice(0, examConfig.questionCount);
    }

    setStudentActiveQuestions(finalSelectedQuestions);
    setExamTimer(examConfig.duration * 60);
    setExamLobbyState('exam');
    setExamAnswers({});
    setCurrentExamIndex(0);
    setExamFinished(false);
    
    // Pick the first subject as active subject
    const distinctSubjects = (examConfig.subjects && examConfig.subjects.length > 0)
      ? examConfig.subjects.map(s => s.name)
      : (Array.from(new Set(finalSelectedQuestions.map(q => q.subject).filter(Boolean))) as string[]);
    const initialActiveSub = distinctSubjects[0] || "";
    setActiveStudentSubject(initialActiveSub);
    
    // Mark as active
    setRegisteredStudents(prev => prev.map(s => 
      s.matric.replace(/\s+/g, '').toLowerCase() === matricNumber.replace(/\s+/g, '').toLowerCase() ? { ...s, isActive: true, lastActive: Date.now() } : s
    ));
    
    // Broadcast status
    const channel = new BroadcastChannel('nsg_exam_sync');
    channel.postMessage({ type: 'STATUS_UPDATE', matric: matricNumber, isActive: true });
    channel.close();

    const initialSession = {
      status: 'in-progress',
      startTime: Date.now(),
      studentActiveQuestions: finalSelectedQuestions,
      examAnswers: {},
      examTimer: examConfig.duration * 60,
      activeStudentSubject: initialActiveSub
    };
    localStorage.setItem(`nsg_exam_session_${activeExamId}_${matricNumber}`, circularSafeStringify(initialSession));

    examTimerRef.current = setInterval(() => {
      setExamTimer(prev => {
        if (prev <= 1) {
          submitExam();
          return 0;
        }
        const newVal = prev - 1;
        // Auto-save timer tick
        try {
          const sKey = `nsg_exam_session_${activeExamId}_${matricNumber}`;
          const curStr = localStorage.getItem(sKey);
          if (curStr) {
            const curObj = JSON.parse(curStr);
            curObj.examTimer = newVal;
            localStorage.setItem(sKey, circularSafeStringify(curObj));
          }
        } catch (e) {}

        // Refresh active status every 30 seconds
        if (newVal % 30 === 0) {
          setRegisteredStudents(curr => curr.map(s => 
            s.matric.replace(/\s+/g, '').toLowerCase() === matricNumber.replace(/\s+/g, '').toLowerCase() ? { ...s, lastActive: Date.now(), isActive: true } : s
          ));
        }
        return newVal;
      });
    }, 1000);
  };

  const LOCAL_DICTIONARY: Record<string, string> = {
    hemisphere: "A half of a sphere, especially of the earth divided into northern and southern halves by the equator, or into eastern and western halves by a meridian.",
    volume: "The amount of space that a substance or object occupies, or that is enclosed within a container.",
    radius: "A straight line from the center to the circumference of a circle or sphere.",
    mathematics: "The abstract science of number, quantity, and space, either as abstract concepts (pure mathematics), or as applied to other disciplines such as physics and engineering.",
    physics: "The branch of science concerned with the nature and properties of matter and energy.",
    chemistry: "The branch of science that deals with the identification of the substances of which matter is composed.",
    constant: "A situation or state of affairs that does not change; in mathematics, a number or quantity that is placed in a formula to represent a fixed value.",
    rate: "A measure, quantity, or frequency, typically one measured against some other quantity or measure.",
    biology: "The study of living organisms, divided into many specialized fields that cover their morphology, physiology, anatomy, behavior, origin, and distribution."
  };

  const downloadExamScorecard = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 750;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const activeQuestionsPool = studentActiveQuestions.length > 0 ? studentActiveQuestions : examQuestions;
    const percentage = Math.round((examScore / (activeQuestionsPool.length || 1)) * 100);

    // Dynamic accent color based on score
    let accentColor = '#10B981'; // Emerald
    let accentGlow = 'rgba(16, 185, 129, 0.15)';
    let grade = 'F';
    
    if (percentage >= 90) {
      accentColor = '#10B981';
      grade = 'A+';
    } else if (percentage >= 80) {
      accentColor = '#10B981';
      grade = 'A';
    } else if (percentage >= 60) {
      accentColor = '#F59E0B'; // Amber
      accentGlow = 'rgba(245, 158, 11, 0.15)';
      grade = 'B';
    } else if (percentage >= 40) {
      accentColor = '#3B82F6'; // Blue
      accentGlow = 'rgba(59, 130, 246, 0.15)';
      grade = 'C';
    } else {
      accentColor = '#EF4444'; // Red
      accentGlow = 'rgba(239, 68, 68, 0.15)';
      grade = 'F';
    }

    // 1. Draw premium background
    ctx.fillStyle = '#060B15';
    ctx.fillRect(0, 0, 1000, 750);

    // Overlapping glowing light spots
    const lightGlow = ctx.createRadialGradient(200, 200, 10, 200, 200, 400);
    lightGlow.addColorStop(0, accentGlow);
    lightGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lightGlow;
    ctx.fillRect(0, 0, 1000, 750);

    const lightGlowRight = ctx.createRadialGradient(800, 550, 10, 800, 550, 400);
    lightGlowRight.addColorStop(0, 'rgba(30, 41, 59, 0.3)');
    lightGlowRight.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lightGlowRight;
    ctx.fillRect(0, 0, 1000, 750);

    // Faint Grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1000; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 750);
      ctx.stroke();
    }
    for (let y = 0; y < 750; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1000, y);
      ctx.stroke();
    }

    // Watermark
    ctx.save();
    ctx.translate(500, 375);
    ctx.rotate(-Math.PI / 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.font = 'bold 64px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NSG ACADEMIC STUDY GUIDE', 0, 0);
    ctx.restore();

    // 2. Premium Dual Border and Corner Ornaments
    // Gold Outer border
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 960, 710);

    // Accent Inner border
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(28, 28, 944, 694);

    // Corner L-shapes for premium technical look
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 3;
    const corners = [
      { x: 15, y: 15, dx: 30, dy: 30 },
      { x: 985, y: 15, dx: -30, dy: 30 },
      { x: 15, y: 735, dx: 30, dy: -30 },
      { x: 985, y: 735, dx: -30, dy: -30 }
    ];
    corners.forEach(c => {
      ctx.beginPath();
      ctx.moveTo(c.x + c.dx, c.y);
      ctx.lineTo(c.x, c.y);
      ctx.lineTo(c.x, c.y + c.dy);
      ctx.stroke();
    });

    // 3. Header & Titles
    ctx.textAlign = 'center';
    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 11px "Inter", "Segoe UI", sans-serif';
    ctx.fillText('VERIFIED EXAMINATION CREDENTIAL', 500, 60);

    // Main header with linear gradient
    const headerGradient = ctx.createLinearGradient(300, 0, 700, 0);
    headerGradient.addColorStop(0, '#FFFFFF');
    headerGradient.addColorStop(0.5, '#F8FAFC');
    headerGradient.addColorStop(1, '#94A3B8');
    ctx.fillStyle = headerGradient;
    ctx.font = '900 34px "Inter", "Segoe UI", sans-serif';
    ctx.fillText('CBT ACADEMIC SCORECARD', 500, 100);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'medium 13px "Inter", "Segoe UI", sans-serif';
    ctx.fillText('OFFICIAL DIGITAL STUDY RECORD & SCORE VERIFICATION', 500, 125);

    // Divider line
    const dividerGrad = ctx.createLinearGradient(150, 0, 850, 0);
    dividerGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    dividerGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.4)');
    dividerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.strokeStyle = dividerGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 145);
    ctx.lineTo(850, 145);
    ctx.stroke();

    // Helper to draw rounded container cards
    const drawCard = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // 4. Candidate Profile Container
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    drawCard(100, 175, 450, 180, 16);

    // Vertical Accent strip on left of card
    ctx.fillStyle = accentColor;
    ctx.fillRect(100, 195, 4, 140);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#94A3B8';
    ctx.font = '900 10px "Inter", sans-serif';
    ctx.fillText('CERTIFIED STUDENT PROFILE', 125, 205);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 22px "Inter", "Segoe UI", sans-serif';
    ctx.fillText(studentName || 'NSG SCHOLAR', 125, 235);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText(`MATRIC: ${matricNumber || 'NSG-STUDENT-MOCK'}`, 125, 265);
    ctx.fillText(`EXAM ID: ${examIdInput || 'CBT-MOCK'}`, 125, 290);
    ctx.fillText(`DATE: ${new Date().toLocaleDateString()}`, 125, 315);

    // 5. Score Radial Container Card
    drawCard(580, 175, 320, 180, 16);

    // Concentric Ring
    ctx.textAlign = 'center';
    ctx.beginPath();
    ctx.arc(740, 260, 60, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 12;
    ctx.stroke();

    // Actual Radial Score ring
    ctx.beginPath();
    ctx.arc(740, 260, 60, -0.5 * Math.PI, (2 * percentage / 100 - 0.5) * Math.PI);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Score text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px "Inter", sans-serif';
    ctx.fillText(`${percentage}%`, 740, 268);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '900 9px "Inter", sans-serif';
    ctx.fillText('ACCURACY', 740, 285);

    // Grade label
    ctx.textAlign = 'left';
    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 10px "Inter", sans-serif';
    ctx.fillText('SCORE RATINGS', 605, 210);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 26px "Inter", sans-serif';
    ctx.fillText(`GRADE ${grade}`, 605, 245);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 11px "Inter", sans-serif';
    ctx.fillText(`${examScore} Correct`, 605, 275);
    ctx.fillText(`${activeQuestionsPool.length - examScore} Missed`, 605, 295);

    // 6. Subjects Breakdown Container
    ctx.textAlign = 'left';
    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 11px "Inter", sans-serif';
    ctx.fillText('CURRICULUM COMPETENCY INDEX', 105, 395);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.moveTo(100, 408);
    ctx.lineTo(900, 408);
    ctx.stroke();

    const distinctStudentSubjects = (examConfig.subjects && examConfig.subjects.length > 0)
      ? examConfig.subjects.map(s => s.name).filter(name => activeQuestionsPool.some(q => (q.subject || "Mathematics").trim().toLowerCase() === name.trim().toLowerCase()))
      : Array.from(new Set(activeQuestionsPool.map(q => q.subject || "Mathematics").filter(Boolean))) as string[];

    let yPos = 445;
    distinctStudentSubjects.slice(0, 5).forEach((subName) => {
      const subQuestions = activeQuestionsPool.filter(q => (q.subject || "Mathematics").trim().toLowerCase() === subName.trim().toLowerCase());
      let subScore = 0;
      subQuestions.forEach((q) => {
        const studentAns = examAnswers[q.id];
        if (studentAns !== undefined && studentAns !== null && sanitizeCorrectAnswer(studentAns) === sanitizeCorrectAnswer(q.correctAnswer)) {
          subScore++;
        }
      });
      const subPercent = Math.round((subScore / (subQuestions.length || 1)) * 100);

      // Subject container box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.fillRect(100, yPos - 22, 800, 36);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.strokeRect(100, yPos - 22, 800, 36);

      ctx.fillStyle = '#F8FAFC';
      ctx.font = '900 13px "Inter", sans-serif';
      ctx.fillText(subName.toUpperCase(), 120, yPos + 1);

      // Draw background bar track (pill shaped)
      const barX = 380;
      const barY = yPos - 8;
      const barW = 340;
      const barH = 10;
      const barRadius = 5;

      ctx.fillStyle = '#1E293B';
      
      const drawPill = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.arc(x + r, y + r, r, Math.PI, 1.5 * Math.PI);
        ctx.lineTo(x + w - r, y);
        ctx.arc(x + w - r, y + r, r, 1.5 * Math.PI, 2 * Math.PI);
        ctx.lineTo(x + w, y + h - r);
        ctx.arc(x + w - r, y + h - r, r, 0, 0.5 * Math.PI);
        ctx.lineTo(x + r, y + h);
        ctx.arc(x + r, y + h - r, r, 0.5 * Math.PI, Math.PI);
        ctx.closePath();
        ctx.fill();
      };
      drawPill(barX, barY, barW, barH, barRadius);

      // Draw active progress bar
      if (subPercent > 0) {
        const fillW = Math.max(10, (subPercent / 100) * barW);
        const barGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
        barGrad.addColorStop(0, accentColor);
        barGrad.addColorStop(1, '#F59E0B');
        ctx.fillStyle = barGrad;
        drawPill(barX, barY, fillW, barH, barRadius);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${subScore}/${subQuestions.length} (${subPercent}%)`, 880, yPos + 1);
      ctx.textAlign = 'left';

      yPos += 48;
    });

    // 7. Digital Stamp / Validation Seal
    const sealX = 820;
    const sealY = 645;
    
    // Outer radial bursts
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 24; i++) {
      const angle = (i * Math.PI) / 12;
      ctx.beginPath();
      ctx.moveTo(sealX, sealY);
      ctx.lineTo(sealX + Math.cos(angle) * 32, sealY + Math.sin(angle) * 32);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(sealX, sealY, 25, 0, 2 * Math.PI);
    ctx.fillStyle = '#D97706';
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(sealX, sealY, 20, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 7px "Inter", sans-serif';
    ctx.fillText('NSG', sealX, sealY - 3);
    ctx.fillText('SEAL', sealX, sealY + 5);

    // Validation Signature
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '800 9px "Inter", sans-serif';
    ctx.fillText('ACADEMIC BOARD', 600, 630);
    ctx.fillStyle = '#10B981';
    ctx.font = 'italic 20px "Playfair Display", "Georgia", serif';
    ctx.fillText('Verified', 600, 660);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(600, 670);
    ctx.lineTo(760, 670);
    ctx.stroke();

    // 8. Footer Info
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = 'italic bold 10px "JetBrains Mono", monospace';
    const completedDateStr = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    ctx.fillText(`COMPLETED ON ${completedDateStr.toUpperCase()}`, 500, 715);

    // Trigger download
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `NSG_Exam_Scorecard_${studentName ? studentName.replace(/\s+/g, '_') : 'Student'}.png`;
    a.click();
  };

  const downloadQuizScorecard = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 700;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const percentage = Math.round((quizScore / (quizQuestions.length || 1)) * 100);

    // Dynamic accent color based on score
    let accentColor = '#3B82F6'; // Royal Blue for general study or dynamic accent
    let accentGlow = 'rgba(59, 130, 246, 0.15)';
    let grade = 'F';
    let gradePhrase = 'Requires more practice. Revise materials.';
    
    if (percentage >= 90) {
      accentColor = '#10B981'; // Green
      accentGlow = 'rgba(16, 185, 129, 0.15)';
      grade = 'A+';
      gradePhrase = 'Exceptional knowledge! Outstanding masterclass.';
    } else if (percentage >= 80) {
      accentColor = '#10B981';
      accentGlow = 'rgba(16, 185, 129, 0.15)';
      grade = 'A';
      gradePhrase = 'Magnificent performance! Highly competent.';
    } else if (percentage >= 60) {
      accentColor = '#F59E0B'; // Amber
      accentGlow = 'rgba(245, 158, 11, 0.15)';
      grade = 'B';
      gradePhrase = 'Very good study! Solid passing results.';
    } else if (percentage >= 40) {
      accentColor = '#3B82F6'; // Blue
      grade = 'C';
      gradePhrase = 'Credit Pass. Review incorrect answers.';
    } else {
      accentColor = '#EF4444'; // Red
      accentGlow = 'rgba(239, 68, 68, 0.15)';
      grade = 'F';
      gradePhrase = 'Requires revision. Plan another study cycle.';
    }

    // 1. Draw premium background
    ctx.fillStyle = '#060B15';
    ctx.fillRect(0, 0, 1000, 700);

    // Glowing lights
    const lightGlow = ctx.createRadialGradient(200, 200, 10, 200, 200, 400);
    lightGlow.addColorStop(0, accentGlow);
    lightGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lightGlow;
    ctx.fillRect(0, 0, 1000, 700);

    const lightGlowRight = ctx.createRadialGradient(800, 500, 10, 800, 500, 400);
    lightGlowRight.addColorStop(0, 'rgba(30, 41, 59, 0.3)');
    lightGlowRight.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lightGlowRight;
    ctx.fillRect(0, 0, 1000, 700);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1000; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 700);
      ctx.stroke();
    }
    for (let y = 0; y < 700; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1000, y);
      ctx.stroke();
    }

    // Watermark
    ctx.save();
    ctx.translate(500, 350);
    ctx.rotate(-Math.PI / 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.font = 'bold 64px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NSG SMART STUDY QUIZ', 0, 0);
    ctx.restore();

    // 2. Dual borders & Corner ornaments
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 960, 660);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(28, 28, 944, 644);

    // Corner L-shapes
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 3;
    const corners = [
      { x: 15, y: 15, dx: 30, dy: 30 },
      { x: 985, y: 15, dx: -30, dy: 30 },
      { x: 15, y: 685, dx: 30, dy: -30 },
      { x: 985, y: 685, dx: -30, dy: -30 }
    ];
    corners.forEach(c => {
      ctx.beginPath();
      ctx.moveTo(c.x + c.dx, c.y);
      ctx.lineTo(c.x, c.y);
      ctx.lineTo(c.x, c.y + c.dy);
      ctx.stroke();
    });

    // 3. Titles
    ctx.textAlign = 'center';
    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 11px "Inter", sans-serif';
    ctx.fillText('STUDY ASSESSMENT VERIFICATION RECORD', 500, 60);

    const headerGradient = ctx.createLinearGradient(300, 0, 700, 0);
    headerGradient.addColorStop(0, '#FFFFFF');
    headerGradient.addColorStop(0.5, '#F8FAFC');
    headerGradient.addColorStop(1, '#94A3B8');
    ctx.fillStyle = headerGradient;
    ctx.font = '900 34px "Inter", sans-serif';
    ctx.fillText('QUIZ PERFORMANCE REPORT', 500, 100);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'medium 13px "Inter", sans-serif';
    ctx.fillText('STUDENT SELF-ASSESSMENT RECORD & STUDY PROGRESS METRIC', 500, 125);

    // Divider line
    const dividerGrad = ctx.createLinearGradient(150, 0, 850, 0);
    dividerGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    dividerGrad.addColorStop(0.5, 'rgba(217, 119, 6, 0.4)');
    dividerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.strokeStyle = dividerGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 145);
    ctx.lineTo(850, 145);
    ctx.stroke();

    const drawCard = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // Candidate Info Card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    drawCard(100, 175, 450, 180, 16);

    ctx.fillStyle = accentColor;
    ctx.fillRect(100, 195, 4, 140);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#94A3B8';
    ctx.font = '900 10px "Inter", sans-serif';
    ctx.fillText('STUDENT DETAILED PROFILE', 125, 205);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 22px "Inter", sans-serif';
    ctx.fillText(currentUserData?.username || studentName || 'NSG SCHOLAR', 125, 245);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText(`TOPIC: ${(quizTopic || 'General Study').toUpperCase()}`, 125, 280);
    ctx.fillText(`DATE CONCLUDED: ${new Date().toLocaleDateString()}`, 125, 310);

    // Score Radial Container
    drawCard(580, 175, 320, 180, 16);

    // Concentric Ring
    ctx.textAlign = 'center';
    ctx.beginPath();
    ctx.arc(740, 260, 60, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 12;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(740, 260, 60, -0.5 * Math.PI, (2 * percentage / 100 - 0.5) * Math.PI);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 32px "Inter", sans-serif';
    ctx.fillText(`${percentage}%`, 740, 268);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '900 9px "Inter", sans-serif';
    ctx.fillText('ACCURACY', 740, 285);

    // Grade labels
    ctx.textAlign = 'left';
    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 10px "Inter", sans-serif';
    ctx.fillText('SCORE RATINGS', 605, 210);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 26px "Inter", sans-serif';
    ctx.fillText(`GRADE ${grade}`, 605, 245);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = 'bold 11px "Inter", sans-serif';
    ctx.fillText(`${quizScore} Correct`, 605, 275);
    ctx.fillText(`${quizQuestions.length - quizScore} Missed`, 605, 295);

    // 5. METRIC METADATA GRID
    ctx.textAlign = 'left';
    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 11px "Inter", sans-serif';
    ctx.fillText('STUDY METRIC METADATA SUMMARY', 105, 395);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.moveTo(100, 408);
    ctx.lineTo(900, 408);
    ctx.stroke();

    // Three metadata grids (Total, Correct, Incorrect)
    const stats = [
      { label: 'TOTAL ATTEMPTED', val: `${quizQuestions.length} Questions`, color: '#FFFFFF' },
      { label: 'CORRECT ANSWERS', val: `${quizScore} Correct`, color: '#10B981' },
      { label: 'INCORRECT ITEMS', val: `${quizQuestions.length - quizScore} Wrong`, color: '#EF4444' }
    ];

    stats.forEach((stat, i) => {
      const boxX = 100 + i * 275;
      const boxY = 430;
      const boxW = 250;
      const boxH = 75;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      drawCard(boxX, boxY, boxW, boxH, 12);

      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '900 9px "Inter", sans-serif';
      ctx.fillText(stat.label, boxX + 18, boxY + 28);

      ctx.fillStyle = stat.color;
      ctx.font = '900 18px "Inter", sans-serif';
      ctx.fillText(stat.val, boxX + 18, boxY + 54);
    });

    // Omni Advisor Box below
    const advY = 530;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.15)';
    drawCard(100, advY, 800, 60, 12);

    ctx.fillStyle = '#D97706';
    ctx.fillRect(100, advY + 12, 4, 36);

    ctx.fillStyle = '#F59E0B';
    ctx.font = '900 9px "Inter", sans-serif';
    ctx.fillText('STUDY ADVISOR RECOMMENDATION', 125, advY + 23);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold italic 12px "Inter", sans-serif';
    ctx.fillText(`"${gradePhrase}"`, 125, advY + 43);

    // Validation Signature text / Stamp Seal
    const sealX = 820;
    const sealY = 615;

    ctx.strokeStyle = 'rgba(217, 119, 6, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 24; i++) {
      const angle = (i * Math.PI) / 12;
      ctx.beginPath();
      ctx.moveTo(sealX, sealY);
      ctx.lineTo(sealX + Math.cos(angle) * 32, sealY + Math.sin(angle) * 32);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(sealX, sealY, 25, 0, 2 * Math.PI);
    ctx.fillStyle = '#D97706';
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(sealX, sealY, 20, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 7px "Inter", sans-serif';
    ctx.fillText('NSG', sealX, sealY - 3);
    ctx.fillText('SEAL', sealX, sealY + 5);

    // Autograph
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '800 9px "Inter", sans-serif';
    ctx.fillText('ACADEMIC BOARD', 600, 595);
    ctx.fillStyle = '#10B981';
    ctx.font = 'italic 20px "Playfair Display", "Georgia", serif';
    ctx.fillText('Verified', 600, 622);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(600, 630);
    ctx.lineTo(760, 630);
    ctx.stroke();

    // Footer Info
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = 'italic bold 10px "JetBrains Mono", monospace';
    const completedDateStr = `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    ctx.fillText(`COMPLETED ON ${completedDateStr.toUpperCase()}`, 500, 665);

    // Download
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `NSG_Quiz_Scorecard_${currentUserData?.username ? currentUserData.username.replace(/\s+/g, '_') : 'Student'}.png`;
    a.click();
  };

  const submitExam = async () => {
    if (examTimerRef.current) clearInterval(examTimerRef.current);
    
    let score = 0;
    const questionsToGrade = studentActiveQuestions.length > 0 ? studentActiveQuestions : examQuestions;
    const totalSatFor = questionsToGrade.length || 1;

    const subjectScoresMap: Record<string, { correct: number; total: number }> = {};

    questionsToGrade.forEach((q, idx) => {
      const realPoolIndex = examQuestions.indexOf(q);
      const studentAns = examAnswers[q.id] !== undefined 
        ? examAnswers[q.id] 
        : (realPoolIndex !== -1 && examAnswers[realPoolIndex] !== undefined ? examAnswers[realPoolIndex] : examAnswers[idx]);
      const correctAns = sanitizeCorrectAnswer(q.correctAnswer);
      const subjectName = q.subject || (examConfig.subjects && examConfig.subjects[0]?.name) || 'General';
      if (!subjectScoresMap[subjectName]) {
        subjectScoresMap[subjectName] = { correct: 0, total: 0 };
      }
      subjectScoresMap[subjectName].total++;

      if (studentAns !== undefined && studentAns !== null) {
        if (sanitizeCorrectAnswer(studentAns) === correctAns) {
          score++;
          subjectScoresMap[subjectName].correct++;
        }
      }
    });

    const subjectScores = Object.entries(subjectScoresMap).map(([subject, data]) => ({
      subject,
      score: data.correct,
      total: data.total
    }));

    setExamScore(score);
    setSubjectScores(subjectScores);
    setExamFinished(true);
    setExamLobbyState('result');

    addToFinishedHistory({
      id: `exam-${Date.now()}`,
      title: `Exam: ${examIdInput || 'CBT Exam'}`,
      type: 'exam',
      progress: 100,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
      score: score,
      total: totalSatFor,
      subjectScores,
      questions: questionsToGrade,
      answers: examAnswers,
      matric: matricNumber,
      studentName
    });

    if (user) {
      const p = Math.round((score / totalSatFor) * 100);
      addDoc(collection(db, 'notifications'), {
        to: user.uid,
        title: `🛡️ Professional CBT Exam Submitted!`,
        message: `Congratulations ${studentName || currentUserData?.username || 'Scholar'}! You submitted CBT Exam "${examIdInput || 'CBT Mock'}" with a final score of ${score}/${totalSatFor} (${p}%). Every milestone counts! 🔥🎓`,
        type: 'congrats',
        subtype: 'exam_complete',
        targetTab: 'tools',
        targetSubTab: 'exam',
        timestamp: serverTimestamp() || new Date(),
        read: false
      }).catch(err => console.error("Error creating exam completion notification:", err));

      if (activeExamId) {
        const result: StudentResult = {
          uid: user.uid,
          matric: matricNumber,
          name: studentName,
          score: score,
          total: questionsToGrade.length,
          timestamp: new Date().toLocaleString(),
          hostUid: activeExamHostUid || undefined,
          subjectScores
        };
        
        // Save result to the specific exam's results subcollection
        await addDoc(collection(db, 'exams', activeExamId, 'results'), result);
        
        localStorage.setItem(`nsg_exam_session_${activeExamId}_${matricNumber}`, circularSafeStringify({ status: 'completed', score, subjectScores }));
      }
    }
  };

  const loadSharedExam = async (id: string) => {
    try {
      const examDoc = await getDoc(doc(db, 'exams', id));
      if (examDoc.exists()) {
        const data = examDoc.data();
        setExamConfig(data.config);
        setExamQuestions(data.questions);
        setRegisteredStudents(data.registeredStudents || []);
        setActiveExamId(id);
        setActiveExamHostUid(data.hostUid || null);
      } else {
        setUserNotification("Exam not found or expired.");
      }
    } catch (error) {
      console.error("Error loading exam:", error);
    }
  };

  const handleHostPaymentSuccess = async (reference: any) => {
    const newId = Math.random().toString(36).substr(2, 9).toUpperCase();
    
    // Initialize exam in Firestore immediately
    if (user) {
      try {
        const newExamData = {
          id: newId,
          hostUid: user.uid,
          hostEmail: user.email,
          config: initialExamConfig,
          questions: [],
          registeredStudents: [],
          createdAt: new Date().toISOString(),
          status: 'active'
        };
        await setDoc(doc(db, 'exams', newId), newExamData);
        
        setIsHostPaid(true);
        setHostExamId(newId);
        
        // Reset local states to default for the new exam
        setExamConfig(initialExamConfig);
        setExamQuestions([]);
        setRegisteredStudents([]);
        setExamStatus('active');
        
        setUserNotification("Payment successful! Exam session created: " + newId);
      } catch (err) {
        console.error("Exam Initialization Error:", err);
        setUserNotification("Payment verified, but failed to initialize exam on cloud. Please contact support.");
      }
    }
  };
  
  const deleteExamFromSidebar = async (id: string) => {
    showConfirm(
      "DELETE EXAM",
      "This will permanently delete this exam and all student results. This action cannot be undone.",
      async () => {
        try {
          // Delete all results in the subcollection first
          const resultsRef = collection(db, 'exams', id, 'results');
          const resultsSnap = await getDocs(resultsRef);
          const deletePromises = resultsSnap.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);

          // Delete the main exam document
          await deleteDoc(doc(db, 'exams', id));
          
          if (hostExamId === id) {
            setHostExamId(null);
          }
          setUserNotification("Exam deleted successfully.");
        } catch (err) {
          console.error("Delete Exam Error:", err);
          setUserNotification("Failed to delete exam.");
        }
      }
    );
  };

  const switchExam = (id: string) => {
    setHostExamId(id);
    setShowExamSidebar(false);
    setUserNotification(`Switched to Exam: ${id}`);
  };

  const createNewExam = () => {
    if (hostedExams.length >= 20) {
      setUserNotification("Limit reached: You can only have 20 active exams at a time. Delete one to create space.");
      return;
    }

    const isOwner = user?.email?.toLowerCase().trim() === "nuellkelechi@gmail.com";
    if (isPremium || isOwner || currentUserData?.bypassHostingPayment) {
      handleHostPaymentSuccess({ reference: 'BYPASS' });
    } else {
      initializePayment({ 
        onSuccess: handleHostPaymentSuccess, 
        onClose: () => setUserNotification("Payment cancelled.") 
      });
    }
  };

  const endHostedExam = async () => {
    showConfirm(
      "End Session",
      "End this session? This will stop the exam but keep data in the cloud. Use 'Delete All' to wipe everything.",
      async () => {
        try {
          if (hostExamId) {
            await updateDoc(doc(db, 'exams', hostExamId), { status: 'ended' });
          }
          setExamStatus('ended');
          setUserNotification("Exam session ended. You can now delete all details if needed.");
        } catch (err) {
          console.error("End Exam Error:", err);
          setUserNotification("Failed to end exam session.");
        }
      },
      "End Session",
      false
    );
  };

  const deleteHostedExam = async () => {
    if (!hostExamId) return;
    
    if (deleteConfirmStep === 0) {
      setDeleteConfirmStep(1);
      setUserNotification("Tap 'DELETE ALL' again to confirm permanent deletion.");
      setTimeout(() => setDeleteConfirmStep(0), 5000); // Reset after 5s
      return;
    }

    showConfirm(
      "CRITICAL DELETE",
      "This will PERMANENTLY delete all questions, student logs, and results from the cloud. This action is irreversible. Continue?",
      async () => {
        try {
          setIsAuthLoading(true);
          
          // Clear results subcollection first
          const resultsRef = collection(db, 'exams', hostExamId, 'results');
          const snapshot = await getDocs(resultsRef);
          const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
          await Promise.all(deletePromises);

          // Delete main doc
          await deleteDoc(doc(db, 'exams', hostExamId));
          
          setIsHostPaid(false);
          setHostExamId(null);
          setExamStatus('none');
          setRegisteredStudents([]);
          setExamQuestions([]);
          setAdminQuestionsRaw('');
          setScoreSheet([]);
          setDeleteConfirmStep(0);
          localStorage.removeItem('nsg_host_exam_id');
          localStorage.removeItem('nsg_host_config');
          localStorage.removeItem('nsg_host_students');
          localStorage.removeItem('nsg_host_questions');
          setUserNotification("Exam and all associated data deleted permanently.");
        } catch (err) {
          console.error("Delete Exam Error:", err);
          setUserNotification("Failed to delete exam data.");
        } finally {
          setIsAuthLoading(false);
        }
      },
      "Delete Permanently",
      true
    );
  };

  const clearExamResults = async () => {
    if (!hostExamId) return;

    if (clearConfirmStep === 0) {
      setClearConfirmStep(1);
      setUserNotification("Tap 'Clear Results' again to confirm.");
      setTimeout(() => setClearConfirmStep(0), 5000);
      return;
    }

    showConfirm(
      "Clear Results",
      "Clear all student results for this exam?",
      async () => {
        try {
          setIsAuthLoading(true);
          const resultsRef = collection(db, 'exams', hostExamId, 'results');
          const snapshot = await getDocs(resultsRef);
          const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
          await Promise.all(deletePromises);
          setScoreSheet([]);
          setClearConfirmStep(0);
          setUserNotification("Results cleared.");
        } catch (err) {
          console.error("Clear Results Error:", err);
          setUserNotification("Failed to clear results.");
        } finally {
          setIsAuthLoading(false);
        }
      },
      "Clear All",
      true
    );
  };

  useEffect(() => {
    if (isHostPaid && hostExamId) {
      setExamStatus('active');
      localStorage.setItem('nsg_host_config', circularSafeStringify(examConfig));
      localStorage.setItem('nsg_host_students', circularSafeStringify(registeredStudents));
      localStorage.setItem('nsg_host_questions', circularSafeStringify(examQuestions));
    }
  }, [examConfig, registeredStudents, examQuestions, isHostPaid, hostExamId]);

  const handleTakingPaymentSuccess = async (reference: any) => {
    setPaymentVerified(true);
    setIsTakingPaid(true);
    setExamLobbyState('briefing');
    setUserNotification("Payment verified! Good luck.");
  };

  const saveHostedExam = async () => {
    if (!user) {
      setUserNotification("⚠️ Please sign in first to save your exam progress.");
      return;
    }
    if (!hostExamId) {
      setUserNotification("⚠️ No active Exam ID found. Please generate or select an Exam first.");
      return;
    }
    try {
      const examData = {
        id: hostExamId,
        hostUid: user.uid,
        hostEmail: user.email,
        config: examConfig,
        questions: examQuestions,
        registeredStudents: registeredStudents,
        status: examStatus === 'none' ? 'active' : examStatus,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'exams', hostExamId), examData);
      setUserNotification("💾 Exam progress saved to cloud successfully!");
    } catch (error) {
      console.error("Error saving exam:", error);
      setUserNotification("❌ Failed to save exam. Check your connection.");
    }
  };

  const restartStudentTimer = async (matric: string) => {
    localStorage.removeItem(`nsg_exam_session_${matric}`);
    if (hostExamId) {
      localStorage.removeItem(`nsg_exam_session_${hostExamId}_${matric}`);
      try {
        const cleanMatric = matric.replace(/\s+/g, '').toLowerCase();
        const resultsRef = collection(db, 'exams', hostExamId, 'results');
        const snapshot = await getDocs(resultsRef);
        const toDelete = snapshot.docs.filter(d => (d.data().matric || "").toString().replace(/\s+/g, '').toLowerCase() === cleanMatric);
        await Promise.all(toDelete.map(d => deleteDoc(d.ref)));
      } catch (e) {
        console.error("Error clearing student result in Firestore:", e);
      }
    }
    setRegisteredStudents(prev => prev.map(s => 
      s.matric === matric ? { ...s, isActive: false } : s
    ));
    setAdminNotification(`Session for ${matric} has been reset.`);

    // Broadcast reset
    const channel = new BroadcastChannel('nsg_exam_sync');
    channel.postMessage({ type: 'RESET_EXAM', matric });
    channel.close();
  };

  const addStudent = async () => {
    if (!newStudentMatric.trim() || !newStudentName.trim()) return;
    if (registeredStudents.some(s => s.matric === newStudentMatric)) {
      setAdminNotification("Matric number already exists.");
      return;
    }
    const studentData = { matric: newStudentMatric.trim(), name: newStudentName.trim(), paymentEnabled: true };
    const updatedStudents = [...registeredStudents, studentData];
    console.log("Adding student to local state:", studentData);
    setRegisteredStudents(updatedStudents);
    setNewStudentMatric('');
    setNewStudentName('');
    setAdminNotification("Student added successfully.");

    // Auto-sync to Firestore
    if (hostExamId) {
      try {
        console.log("Syncing updated students to Firestore for exam:", hostExamId, updatedStudents);
        await updateDoc(doc(db, 'exams', hostExamId), { registeredStudents: updatedStudents });
        console.log("Student sync successful");
      } catch (err) {
        console.error("Sync Students Error:", err);
        setAdminNotification("Failed to sync students to cloud. Check connection.");
      }
    } else {
      console.warn("Cannot sync student: hostExamId is missing");
    }
  };

  const togglePayment = async (matric: string) => {
    const updatedStudents = registeredStudents.map(s => 
      s.matric === matric ? { ...s, paymentEnabled: !s.paymentEnabled } : s
    );
    setRegisteredStudents(updatedStudents);
    
    if (hostExamId) {
      try {
        await updateDoc(doc(db, 'exams', hostExamId), { registeredStudents: updatedStudents });
      } catch (err) {
        console.error("Sync Students Error:", err);
      }
    }
  };

  const deleteStudent = async (matric: string) => {
    const updatedStudents = registeredStudents.filter(s => s.matric !== matric);
    setRegisteredStudents(updatedStudents);
    
    if (hostExamId) {
      try {
        await updateDoc(doc(db, 'exams', hostExamId), { registeredStudents: updatedStudents });
      } catch (err) {
        console.error("Sync Students Error:", err);
      }
    }
  };

  const downloadResults = () => {
    const content = scoreSheet.map(r => `${r.timestamp} | ${r.matric} | ${r.name} | Score: ${r.score}/${r.total}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NSG_Exam_Results_${Date.now()}.txt`;
    a.click();
  };

  // --- \u{1F4B3} PAYSTACK INTEGRATION ---
  const handleExamPaymentSuccess = (reference: any) => {
    setPaymentVerified(true);
    setExamLobbyState('briefing');
  };

  const handlePaystackClose = () => {
    setUserNotification("Payment cancelled. Please complete payment to proceed.");
  };

  const paystackConfig = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || (matricNumber ? `${matricNumber}@nsg.com` : "nuellkelechi@gmail.com"),
    amount: ((isPremium || (user?.email?.toLowerCase().trim() === "nuellkelechi@gmail.com") || currentUserData?.bypassAllPayments) ? 0 : (adminMode ? 200 : 100)) * 100, // 0 for premium, 200 for hosting, 100 for taking
    publicKey: PAYSTACK_PUBLIC_KEY,
    onSuccess: handleExamPaymentSuccess,
    onClose: handlePaystackClose
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  const togglePinLectureSession = async (id: string) => {
    if (!user) return;
    const session = sessions.find(s => s.id === id);
    if (session) {
      await updateDoc(doc(db, 'users', user.uid, 'lectureSessions', id), { isPinned: !session.isPinned });
    }
  };

  const deleteLectureSession = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'lectureSessions', id));
    if (selectedSession?.id === id) {
      setSelectedSession(null);
      setShowAnalysisInRecord(false);
    }
  };

  const uploadHistoryToOmni = async (session: LectureSession) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const report = `
### \u{1F4D6} LECTURE ANALYSIS: ${session.title}
---
**SUMMARY DATA**
- \u{1F4C5} **Date:** ${session.date}
- \u{1F232} **Duration:** ${session.duration}
- \u{1F4F8} **Media:** ${session.imageCount} images analyzed

---
**DETAILED CONTENT**
${session.fullAnalysis}
    `;

    // Create a new chat session with this analysis
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `Analysis: ${session.title}`,
      history: [
        {
          role: 'user',
          text: report,
          timestamp: new Date().toLocaleTimeString()
        },
        {
          role: 'model',
          text: `I've received your lecture analysis for "${session.title}". I've carefully reviewed the summary, key concepts, and action plan. How can I help you study this content further?`,
          timestamp: new Date().toLocaleTimeString()
        }
      ],
      timestamp: new Date().toLocaleString(),
      isPinned: false,
      uid: user.uid
    };

    await setDoc(doc(db, 'users', user.uid, 'chatSessions', newSession.id), newSession);
    setActiveChatSessionId(newSession.id);
    setChatHistory(newSession.history);
    setActiveTab('ai');
    setUserNotification("Analysis forwarded to Omni Ai!");
  };

  const shareAnalysis = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NSG Lecture Analysis',
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      copyToClipboard(text);
    }
  };

  // --- 6-MONTH SILENT CLEANUP & RESUME TRANSCRIPTION ---
  useEffect(() => {
    const runCleanUpAndResume = async () => {
      const SIX_MONTHS_MS = 6 * 30 * 24 * 3600 * 1000;
      const now = Date.now();

      if (user?.uid) {
        try {
          const notesSnap = await getDocs(query(collection(db, 'notes'), where('uid', '==', user.uid), limit(200)));
          notesSnap.docs.forEach(async (d) => {
            const data = d.data();
            const t = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || data.timestamp || 0));
            if (t && now - t > SIX_MONTHS_MS) {
              await deleteDoc(doc(db, 'notes', d.id));
            }
          });

          const sessionsSnap = await getDocs(query(collection(db, 'users', user.uid, 'lectureSessions'), limit(200)));
          sessionsSnap.docs.forEach(async (d) => {
            const data = d.data();
            const t = data.createdAt || data.timestamp || 0;
            if (t && now - t > SIX_MONTHS_MS) {
              await deleteDoc(doc(db, 'users', user.uid, 'lectureSessions', d.id));
            }
          });
        } catch (e) {
          handleFirestoreError(e, FirestoreOperation.LIST, 'notes/sessions');
        }
      }

      // Cleanup offline cache storage older than 6 months
      try {
        const offlineData = localStorage.getItem('nsg_offline_recordings');
        if (offlineData) {
          const list = JSON.parse(offlineData);
          const filtered = list.filter((item: any) => now - (item.createdAt || item.timestamp || 0) <= SIX_MONTHS_MS);
          localStorage.setItem('nsg_offline_recordings', circularSafeStringify(filtered));
        }
      } catch (e) {}
    };

    runCleanUpAndResume();
  }, [user]);

  const handleUploadAudioRecordPage = async (file: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const audioEl = new Audio(url);
    
    await new Promise<void>((resolve) => {
      audioEl.onloadedmetadata = () => resolve();
      audioEl.onerror = () => resolve();
    });

    const durationSec = audioEl.duration;
    const maxSec = isPremium ? 4 * 3600 : 30 * 60;
    if (!isNaN(durationSec) && isFinite(durationSec) && durationSec > maxSec) {
      alert(`Audio duration (${Math.round(durationSec / 60)} mins) exceeds limit! ${isPremium ? '4 hours max for Premium users.' : 'Non-premium limit is 30 minutes. Upgrade to Premium for up to 4 hours!'}`);
      return;
    }

    const formattedDuration = !isNaN(durationSec) && isFinite(durationSec)
      ? `${Math.floor(durationSec / 60)}:${Math.floor(durationSec % 60).toString().padStart(2, '0')}`
      : "Audio File";

    const cleanFileName = file.name ? file.name.replace(/\.[^/.]+$/, "") : `Uploaded Audio ${new Date().toLocaleTimeString()}`;
    const newSessionId = `session-upload-${Date.now()}`;
    const newNoteId = `note-audio-${Date.now()}`;

    // Split audio into 10-minute fragments if duration > 10 mins (600s)
    const chunkSec = 600; // 10 minutes
    const needsSplitting = !isNaN(durationSec) && isFinite(durationSec) && durationSec > 600;
    const numFragments = needsSplitting ? Math.max(1, Math.min(10, Math.ceil(durationSec / chunkSec))) : 1;

    const fragments: { index: number; name: string; url: string; fileBlob: Blob; status: string }[] = [];
    const attachments: { name: string; url: string; type: string }[] = [];

    setUserNotification(`Uploading and preparing ${numFragments} audio fragment(s) to Cloudinary...`);

    for (let i = 0; i < numFragments; i++) {
      let fragBlob: Blob = file;
      let fragName = `${cleanFileName} - Part ${i + 1}`;
      if (needsSplitting && durationSec > 0) {
        const startSec = i * chunkSec;
        const endSec = Math.min(durationSec, (i + 1) * chunkSec);
        const startByte = Math.floor((startSec / durationSec) * file.size);
        const endByte = Math.floor((endSec / durationSec) * file.size);
        fragBlob = file.slice(startByte, endByte, file.type || 'audio/mpeg');
      }

      let fragUrl = url;
      try {
        const fragFile = new File([fragBlob], `${fragName}.mp3`, { type: file.type || 'audio/mpeg' });
        fragUrl = await uploadToCloudinary(fragFile);
      } catch (err) {
        console.error(`Error uploading fragment ${i + 1} to Cloudinary:`, err);
      }

      attachments.push({
        name: `${cleanFileName} - Part ${i + 1} (${Math.round((i * 10))}-${Math.min(Math.round(durationSec/60), (i+1)*10)} mins)`,
        url: fragUrl,
        type: file.type || 'audio/mpeg'
      });

      fragments.push({
        index: i,
        name: fragName,
        url: fragUrl,
        fileBlob: fragBlob,
        status: 'pending'
      });
    }

    const uploadedSession: LectureSession = {
      id: newSessionId,
      title: cleanFileName,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now(),
      createdAt: Date.now(),
      duration: formattedDuration,
      imageCount: 0,
      summary: `Uploaded audio (${numFragments} parts). Active sequential transcription in progress...`,
      fullAnalysis: "",
      notes: "Transcribing audio fragments into structured study note...",
      images: [],
      audioUrl: attachments[0]?.url || url,
      status: 'analyzed'
    };

    setSessions(prev => [uploadedSession, ...prev]);
    setSelectedSession(uploadedSession);

    const initialNote = {
      id: newNoteId,
      title: `${cleanFileName}`,
      content: `# Transcribing Audio (${numFragments} Fragments)...\n\nAudio fragments uploaded to Cloudinary. Sequential context-aware AI transcription in progress...`,
      isTranscribing: true,
      createdAt: { toMillis: () => Date.now(), toDate: () => new Date() } as any,
      updatedAt: { toMillis: () => Date.now(), toDate: () => new Date() } as any,
      attachments: attachments,
      fragments: fragments.map(f => ({ index: f.index, name: f.name, url: f.url, status: f.status }))
    };

    setActiveAudioNoteId(newNoteId);
    setIsAudioTranscribing(true);
    setAudioTranscribingPopup(true);

    setUserNotes(prev => [initialNote, ...prev]);

    if (user?.uid) {
      try {
        await setDoc(doc(db, 'notes', newNoteId), {
          ...initialNote,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        await setDoc(doc(db, 'users', user.uid, 'lectureSessions', newSessionId), uploadedSession);
      } catch (e) {
        console.error("Error saving note/session:", e);
      }
    }

    // Background Sequential Transcription Loop across all fragments with continuous context awareness
    (async () => {
      const aiInstance = getAiInstance();
      let accumulatedText = "";

      for (let i = 0; i < fragments.length; i++) {
        const frag = fragments[i];
        try {
          setUserNotification(`Transcribing Part ${i + 1} of ${fragments.length} seamlessly...`);
          
          const audioPart = await fileToGenerativePart(frag.fileBlob);

          const prompt = i === 0
            ? `You are an expert academic assistant. Analyze this first audio fragment (Part 1 of ${fragments.length}) of "${cleanFileName}" and generate a comprehensive, structured markdown study note ("perfect note"). Include clean headings, key concepts, detailed explanations, bullet points, summaries, and actionable study takeaways. Output ONLY the clean markdown note content.`
            : `You are continuing the analysis of audio recording "${cleanFileName}" (Part ${i + 1} of ${fragments.length}). Here is the previous transcription context so far:\n\n${accumulatedText}\n\nContinue transcribing and expanding the structured markdown study note seamlessly from where it left off, integrating new details from this next part without repeating. Output ONLY the clean markdown note content.`;

          const response = await aiInstance.models.generateContent({
            model: FLASH_MODEL,
            contents: [{ parts: [audioPart, { text: prompt }] }]
          });

          const partText = response.text || "";
          if (partText) {
            accumulatedText = accumulatedText ? `${accumulatedText}\n\n### Part ${i + 1} Continuation\n\n${partText}` : partText;
          }

          // Update note state and Firestore in real-time
          setUserNotes(prev => prev.map(n => n.id === newNoteId ? {
            ...n,
            content: accumulatedText,
            updatedAt: { toMillis: () => Date.now(), toDate: () => new Date() } as any
          } : n));
          setSelectedNote(prev => prev && prev.id === newNoteId ? {
            ...prev,
            content: accumulatedText
          } : prev);

          if (user?.uid) {
            await updateDoc(doc(db, 'notes', newNoteId), {
              content: accumulatedText,
              updatedAt: serverTimestamp()
            });
          }
        } catch (fragErr) {
          console.error(`Error transcribing fragment ${i + 1}:`, fragErr);
        }
      }

      // Finalize note transcription
      setUserNotes(prev => prev.map(n => n.id === newNoteId ? {
        ...n,
        content: accumulatedText || "# Transcription completed with notes.",
        isTranscribing: false,
        updatedAt: { toMillis: () => Date.now(), toDate: () => new Date() } as any
      } : n));

      setSelectedNote(prev => prev && prev.id === newNoteId ? {
        ...prev,
        content: accumulatedText || "# Transcription completed with notes.",
        isTranscribing: false
      } : prev);

      setSessions(prev => prev.map(s => s.id === newSessionId ? {
        ...s,
        notes: accumulatedText,
        fullAnalysis: accumulatedText,
        summary: "Successfully transcribed all fragments seamlessly into note."
      } : s));

      if (user?.uid) {
        try {
          await updateDoc(doc(db, 'notes', newNoteId), {
            content: accumulatedText || "# Transcription completed with notes.",
            isTranscribing: false,
            updatedAt: serverTimestamp()
          });
          await updateDoc(doc(db, 'users', user.uid, 'lectureSessions', newSessionId), {
            notes: accumulatedText,
            fullAnalysis: accumulatedText,
            summary: "Successfully transcribed all fragments seamlessly into note."
          });
        } catch (e) {}
      }

      setIsAudioTranscribing(false);
      setActiveAudioNoteId(null);
      setAudioTranscribingPopup(false);
      setUserNotification("All audio fragments successfully transcribed into note!");
    })();
  };

  // --- \u{1F3A4} RECORDING LOGIC ---
  const [isStopping, setIsStopping] = useState(false);
  const [isProcessingFinal, setIsProcessingFinal] = useState(false);
  const [saveModal, setSaveModal] = useState({ isOpen: false, name: '', onConfirm: (name: string) => {} });
  const [currentRecordingSessionId, setCurrentRecordingSessionId] = useState<string | null>(null);

  // --- HIGH-PERFORMANCE AUDIO ENHANCEMENT ENGINE (VOCAL ISOLATION & CLARITY BOOSTER) ---
  const getEnhancedStream = async (originalStream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        return {
          stream: originalStream,
          context: null,
          stop: () => {}
        };
      }

      const audioContext = new AudioContextClass();
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }

      const source = audioContext.createMediaStreamSource(originalStream);
      const destination = audioContext.createMediaStreamDestination();

      // 1. Low Cut filter (High-pass at 200Hz)
      const lowCut = audioContext.createBiquadFilter();
      lowCut.type = "highpass";
      lowCut.frequency.setValueAtTime(200, audioContext.currentTime);
      lowCut.Q.setValueAtTime(0.8, audioContext.currentTime);

      // 2. Hiss Filter (Low-pass at 3600Hz)
      const highCut = audioContext.createBiquadFilter();
      highCut.type = "lowpass";
      highCut.frequency.setValueAtTime(3600, audioContext.currentTime);
      highCut.Q.setValueAtTime(0.8, audioContext.currentTime);

      // 3. Peaking Vocals Equalizer (Vocal Formant Booster centered at 1500Hz)
      const vocalPeak = audioContext.createBiquadFilter();
      vocalPeak.type = "peaking";
      vocalPeak.frequency.setValueAtTime(1500, audioContext.currentTime);
      vocalPeak.Q.setValueAtTime(1.2, audioContext.currentTime);
      vocalPeak.gain.setValueAtTime(8, audioContext.currentTime);

      // 4. Dynamics Compressor
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-36, audioContext.currentTime);
      compressor.knee.setValueAtTime(24, audioContext.currentTime);
      compressor.ratio.setValueAtTime(10, audioContext.currentTime);
      compressor.attack.setValueAtTime(0.01, audioContext.currentTime);
      compressor.release.setValueAtTime(0.20, audioContext.currentTime);

      // 5. Makeup Gain
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(3.5, audioContext.currentTime);

      source.connect(lowCut);
      lowCut.connect(highCut);
      highCut.connect(vocalPeak);
      vocalPeak.connect(compressor);
      compressor.connect(gainNode);
      gainNode.connect(destination);

      return {
        stream: destination.stream,
        context: audioContext,
        stop: () => {
          try {
            gainNode.disconnect();
            compressor.disconnect();
            vocalPeak.disconnect();
            highCut.disconnect();
            lowCut.disconnect();
            source.disconnect();
            if (audioContext.state !== 'closed') {
              audioContext.close().catch(() => {});
            }
          } catch (err) {
            console.error("Error stopping audio enhancement nodes:", err);
          }
        }
      };
    } catch (e) {
      console.warn("Audio enhancement processing fallback:", e);
      return {
        stream: originalStream,
        context: null,
        stop: () => {}
      };
    }
  };

  const audioProcessingRef = useRef<{ stop: () => void } | null>(null);
  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch (err: any) {
      console.warn("Wake Lock Error:", err.message);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (e) {}
    }
  };

  const handleToggleRecording = async () => {
    if (isStopping) return;
    if (isRecording) {
      // 1. Immediately visually and functionally stop the recording at this exact second
      setIsRecording(false);
      releaseWakeLock();
      if (timerRef.current) clearInterval(timerRef.current);
      if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
      
      setIsStopping(true);
      setIsProcessingFinal(true);
      isStopRequested.current = true;

      // Stop recorders immediately
      try {
        if (segmentTimeoutRef.current) {
          clearTimeout(segmentTimeoutRef.current);
          segmentTimeoutRef.current = null;
        }
        if (segmentRecorderRef.current && segmentRecorderRef.current.state !== 'inactive') {
          segmentRecorderRef.current.stop();
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
      } catch (e) {
        console.error("Error stopping recorder tracks:", e);
      }

      // Background finalization
      try {
        await processorQueue.current;
        const aiTitle = await generateAITitleForNote(transcriptionNotesRef.current);
        const finalTitle = aiTitle === "Untitled" ? "Untitled" : `${aiTitle} ${formatNoteTimeDate()}`;
        finalRecordingTitleRef.current = finalTitle;

        if (activeRecordingNoteIdRef.current) {
          await saveNote(transcriptionNotesRef.current, finalTitle, activeRecordingNoteIdRef.current);
        }
        setUserNotification("Transcription and note creation completed!");
      } catch (err) {
        console.error("Error finalizing recording:", err);
      } finally {
        setIsProcessingFinal(false);
        setIsStopping(false);
        setIsAudioTranscribing(false);
        setActiveAudioNoteId(null);
        setAudioTranscribingPopup(false);
      }
    } else {
      const canProceed = await checkAndIncrementUsage('RECORD');
      if (!canProceed) return;

      audioChunksRef.current = [];
      processedChunksCountRef.current = 0;
      setTranscriptionNotes('');
      lastFinalizedTranscriptRef.current = '';
      setAudioUrl(null);
      setRecordedBlob(null);
      activeRecordingNoteIdRef.current = null;
      finalRecordingTitleRef.current = "Untitled";

      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      setCurrentRecordingSessionId(newSessionId);
      currentRecordingSessionIdRef.current = newSessionId;

      // Instantly start recording state and timer at this exact second!
      setIsRecording(true);
      setRecordingTime(0);
      isStopRequested.current = false;

      timerRef.current = setInterval(() => {
        setRecordingTime(p => {
          const limits = isPremium ? LIMITS.RECORD.PREMIUM : LIMITS.RECORD.NORMAL;
          if (p >= limits.DURATION) {
            handleToggleRecording();
            setUserNotification(`Time limit reached for your plan (${limits.DURATION / 60} mins). Saving now.`);
            return p;
          }
          return p + 1;
        });
      }, 1000);

      // Create placeholder note in vault
      const initNoteId = await saveNote("Transcribing lecture content...", "Untitled");
      activeRecordingNoteIdRef.current = initNoteId;
      setActiveAudioNoteId(initNoteId);
      setIsAudioTranscribing(true);
      setAudioTranscribingPopup(true);

      // Asynchronously initialize microphone stream and media recorder
      try {
        requestWakeLock();
        await requestMicrophonePermission();
        let originalStream: MediaStream;
        try {
          originalStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
        } catch (mediaErr) {
          console.warn("Advanced audio constraints failed, falling back to basic audio stream:", mediaErr);
          originalStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        
        if (isStopRequested.current) {
          originalStream.getTracks().forEach(track => track.stop());
          return;
        }

        const enhanced = await getEnhancedStream(originalStream);
        audioProcessingRef.current = enhanced;
        
        const preferredMime = getSupportedAudioMimeType();
        const recorder = preferredMime 
          ? new MediaRecorder(enhanced.stream, { mimeType: preferredMime })
          : new MediaRecorder(enhanced.stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = async () => {
          if (audioProcessingRef.current) {
            audioProcessingRef.current.stop();
            audioProcessingRef.current = null;
          }
          originalStream.getTracks().forEach(track => track.stop());
          
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          setRecordedBlob(blob);
          const localUrl = URL.createObjectURL(blob);
          setAudioUrl(localUrl);

          try {
            const downloadLink = document.createElement('a');
            downloadLink.href = localUrl;
            downloadLink.download = `NSG_Recording_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
          } catch (err) {
            console.error("Recording auto-download failed:", err);
          }

          const sessionTitle = finalRecordingTitleRef.current === "Untitled" ? `Recording: ${new Date().toLocaleTimeString()}` : finalRecordingTitleRef.current;
          
          if (!isOnline) {
            try {
              const offlineSession: LectureSession = {
                id: newSessionId,
                title: `${sessionTitle} (Offline)`,
                date: new Date().toLocaleDateString(),
                timestamp: Date.now(),
                createdAt: Date.now(),
                duration: formatTime(recordingTime),
                imageCount: uploadedImages.length,
                summary: "Recording captured offline.",
                fullAnalysis: "",
                notes: transcriptionNotesRef.current || "No transcription available.",
                images: [],
                audioUrl: localUrl,
                status: 'analyzed'
              };

              const offlineData = localStorage.getItem('nsg_offline_recordings');
              const list = offlineData ? JSON.parse(offlineData) : [];
              list.push(offlineSession);
              localStorage.setItem('nsg_offline_recordings', circularSafeStringify(list));

              setUserNotification("Recording saved locally (Offline)!");
              setSelectedSession(offlineSession);
              setSessions(prev => [offlineSession, ...prev]);
            } catch (err) {
              console.error("Offline save failed", err);
            }
          } else if (user) {
            try {
              const audioPart = await fileToGenerativePart(blob);
              const pendingSession: LectureSession = {
                id: newSessionId,
                title: sessionTitle,
                date: new Date().toLocaleDateString(),
                timestamp: Date.now(),
                createdAt: Date.now(),
                duration: formatTime(recordingTime),
                imageCount: uploadedImages.length,
                summary: "Recording captured. Real-time note synchronized to Vault.",
                fullAnalysis: "",
                notes: transcriptionNotesRef.current || "",
                images: [],
                audioUrl: localUrl,
                audioBase64: audioPart.inlineData.data,
                status: 'analyzed'
              };
              
              if (audioPart.inlineData.data.length < 1000000) {
                await setDoc(doc(db, 'users', user.uid, 'lectureSessions', newSessionId), pendingSession);
                setUserNotification("Audio saved successfully to History!");
              } else {
                const metadataOnly = { ...pendingSession, audioBase64: undefined };
                await setDoc(doc(db, 'users', user.uid, 'lectureSessions', newSessionId), metadataOnly);
                setUserNotification("Audio saved. Base64 omitted due to cloud document limits.");
              }
              setSelectedSession(pendingSession);
            } catch (err) {
              console.error("Auto-save error:", err);
            }
          }
        };

        mediaRecorderRef.current = recorder;
        recorder.start(1000);

        // 2. Continuous Live Segment-by-Segment Recording Loops
        isStopRequested.current = false;
        let segmentChunks: Blob[] = [];

        const recordNextSegment = () => {
          if (isStopRequested.current) return;

          segmentChunks = [];
          const segmentRecorder = new MediaRecorder(enhanced.stream);
          segmentRecorderRef.current = segmentRecorder;

          segmentRecorder.ondataavailable = (ev) => {
            if (ev.data && ev.data.size > 0) {
              segmentChunks.push(ev.data);
            }
          };

          segmentRecorder.onstop = () => {
            if (segmentChunks.length > 0 && !isStopRequested.current) {
              const chunkBlob = new Blob(segmentChunks, { type: segmentRecorder.mimeType || 'audio/webm' });
              // Process segment in order via sequential queue resolver
              processorQueue.current = processorQueue.current.then(() => processTranscriptionChunk(chunkBlob, true));
            }
            
            // Recurse to initiate next segment if still recording
            if (!isStopRequested.current) {
              recordNextSegment();
            }
          };

          segmentRecorder.start(250);

          segmentTimeoutRef.current = setTimeout(() => {
            if (segmentRecorder.state === 'recording' && !isStopRequested.current) {
              segmentRecorder.stop();
            }
          }, 10000); // 10 seconds per standalone WebM segment
        };

        // Start the first live transcription segment!
        recordNextSegment();

        if (isStopRequested.current) {
          recorder.stop();
        }
      } catch (err: any) {
        console.error("Error starting recording stream:", err);
        const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError' || String(err).toLowerCase().includes('permission');
        setUserNotification(isDenied 
          ? "Microphone access was denied. Please allow microphone permission in device settings to record lectures." 
          : "Failed to access microphone. Please check your audio input device.");
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
        setIsAudioTranscribing(false);
        setAudioTranscribingPopup(false);
      }
    }
  };

  const handleManualSave = async () => {
    if (!recordedBlob || !user) return;
    
    setSaveModal({
      isOpen: true,
      name: `Recording: ${new Date().toLocaleTimeString()}`,
      onConfirm: async (customName) => {
        try {
          const sessionId = currentRecordingSessionIdRef.current || `session-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          const audioPart = await fileToGenerativePart(recordedBlob);
          
          const sessionData: LectureSession = {
            id: sessionId,
            title: customName,
            date: new Date().toLocaleDateString(),
            createdAt: Date.now(),
            duration: formatTime(recordingTime),
            imageCount: uploadedImages.length,
            summary: "Manual save triggered. Analysis pending...",
            fullAnalysis: "",
            notes: transcriptionNotes || "",
            images: [],
            audioUrl: audioUrl || "",
            audioBase64: audioPart.inlineData.data,
            status: 'pending'
          };

          if (audioPart.inlineData.data.length < 1000000) {
            await setDoc(doc(db, 'users', user.uid, 'lectureSessions', sessionId), sessionData);
            setUserNotification("Session saved successfully!");
          } else {
            const metadataOnly = { ...sessionData, audioBase64: undefined };
            await setDoc(doc(db, 'users', user.uid, 'lectureSessions', sessionId), metadataOnly);
            setUserNotification("Session metadata saved. Audio is over cloud limit.");
          }
          setSelectedSession(sessionData);
          // Clean up local recording states to allow new one
          setRecordedBlob(null);
          setRecordingTime(0);
        } catch (err) {
          console.error("Manual save failed:", err);
          setUserNotification("Save failed. Please try again.");
        }
      }
    });
  };

  const processTranscriptionChunk = async (blob: Blob, isPartial: boolean = false) => {
    try {
      if (blob.size === 0) return;
      setIsTranscribing(true);

      const hf = getHfInstance();
      const groqKey = import.meta.env.VITE_GROQ_API_KEY;
      const timeoutMs = 40000;

      const runWithTimeout = async (label: string, task: () => Promise<string | null>) => {
        return new Promise<string | null>(async (resolve) => {
          const timer = setTimeout(() => {
            console.warn(`[TRANSCRIPTION] ${label} timed out after ${timeoutMs}ms`);
            resolve(null);
          }, timeoutMs);
          try {
            const res = await task();
            clearTimeout(timer);
            resolve(res);
          } catch (err) {
            clearTimeout(timer);
            console.error(`[TRANSCRIPTION] ${label} error:`, err);
            resolve(null);
          }
        });
      };

      const tryGroqTranscribe = async () => {
        if (!groqKey) return null;
        const formData = new FormData();
        formData.append("file", blob, "audio.webm");
        formData.append("model", GROQ_AUDIO_MODEL);
        const groqResponse = await axios.post("https://api.groq.com/openai/v1/audio/transcriptions", formData, {
          headers: { 'Authorization': `Bearer ${groqKey}` }
        });
        return groqResponse.data.text || null;
      };

      const tryHFTranscribe = async () => {
        if (!hf || isHfDepleted) return null;
        try {
          const transcription = await hf.automaticSpeechRecognition({
            model: HF_MODELS.AUDIO,
            data: blob,
          });
          return transcription.text || null;
        } catch (e) {
          handleHfError(e, "Transcribe");
          return null;
        }
      };

      const tryOpenRouterTranscribe = async () => {
        const key = import.meta.env.VITE_OPENROUTER_API_KEY;
        if (!key || isOpenRouterDepletedGlobal) return null;
        try {
          const formData = new FormData();
          formData.append("file", blob, "audio.webm");
          formData.append("model", OPENROUTER_MODELS.AUDIO);
          const res = await axios.post("https://openrouter.ai/api/v1/audio/transcriptions", formData, {
            headers: { 'Authorization': `Bearer ${key}` }
          });
          return res.data.text || null;
        } catch (e) {
          handleOpenRouterErrorGlobal(e, "TranscribeOR");
          return null;
        }
      };

      const tryGeminiTranscribe = async () => {
        const aiInstance = getAiInstance();
        try {
          const audioPart = await fileToGenerativePart(blob);
          const res = await aiInstance.models.generateContent({
            model: MODEL_NAME,
            contents: [{ parts: [audioPart, { text: "Transcribe this audio literally. Output ONLY text." }] }]
          });
          return res.text || null;
        } catch (e) { return null; }
      };

      // Priority: Gemini -> Groq -> HF -> OpenRouter
      const rawTranscript = await runWithTimeout("Gemini Audio", tryGeminiTranscribe)
                            || await runWithTimeout("Groq Audio", tryGroqTranscribe)
                            || await runWithTimeout("HF Audio", tryHFTranscribe)
                            || await runWithTimeout("OpenRouter Audio", tryOpenRouterTranscribe);

      if (rawTranscript && rawTranscript.trim()) {
        console.log("[VOICE] Cleaning up transcript...");
        const aiInstance = getAiInstance();
        
        // Context for cleanup
        const cleaningPrompt = isPartial 
          ? `Clean up this raw transcription of an academic lecture snippet. 
             1. Fix spelling/grammar. 
             2. Fix punctuation and casing.
             3. Output ONLY the cleaned text. 
             4. If it's just noise/silence, output an empty string.`
          : `You are an academic transcription assistant.
             TASK: Compare the RAW TRANSCRIPT with the PREVIOUSLY CONFIRMED NOTES. 
             Identify any NEW academic content at the end of the RAW TRANSCRIPT that hasn't been added yet.
             1. Fix spelling/grammar.
             2. Output ONLY the new part to be appended. 
             3. If no new info, output empty string.`;

        const userContent = isPartial ? rawTranscript : `NOTES: "${lastFinalizedTranscriptRef.current}"\nRAW: "${rawTranscript}"`;

        const askGeminiCleanup = async () => {
          const res = await aiInstance.models.generateContent({
            model: MODEL_NAME,
            contents: [{ role: "user", parts: [{ text: `${cleaningPrompt}\n\nINPUT: ${userContent}` }] }]
          });
          return res.text?.trim() || null;
        };

        const askHFCleanup = async () => {
          if (isHfDepleted) return null;
          const hfIns = getHfInstance();
          try {
            const res = await hfIns.chatCompletion({
              model: HF_MODELS.TEXT,
              messages: [{ role: 'system', content: cleaningPrompt }, { role: 'user', content: userContent }]
            });
            return res.choices[0].message.content || null;
          } catch (e) {
            handleHfError(e, "Cleanup");
            return null;
          }
        };

        const askGroqCleanup = async () => {
          if (!groqKey) return null;
          const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: GROQ_MODEL,
            messages: [{ role: 'system', content: cleaningPrompt }, { role: 'user', content: userContent }]
          }, { headers: { Authorization: `Bearer ${groqKey}` } });
          return res.data.choices[0].message.content || null;
        };

        const askOpenRouterCleanup = async () => {
          return await callOpenRouter(userContent, OPENROUTER_MODELS.TEXT_FAST);
        };

        const askTogetherCleanup = async () => {
          return await callTogetherAI(userContent);
        };

        // Priority for text cleanup: Gemini -> Groq -> Together -> HF -> OpenRouter
        const newPart = await runWithTimeout("Gemini Cleanup", askGeminiCleanup)
                        || await runWithTimeout("Groq Cleanup", askGroqCleanup)
                        || await runWithTimeout("Together Cleanup", askTogetherCleanup)
                        || await runWithTimeout("HF Cleanup", askHFCleanup)
                        || await runWithTimeout("OpenRouter Cleanup", askOpenRouterCleanup);
        
        let cleanedPart = "";
        if (newPart && newPart.trim()) {
          cleanedPart = newPart.trim();
        } else {
          cleanedPart = "not clear....";
        }

        // Avoid repeating duplicate "not clear...." consecutively
        if (cleanedPart === "not clear...." && lastFinalizedTranscriptRef.current.endsWith("not clear....")) {
          return;
        }

        const updatedText = lastFinalizedTranscriptRef.current + (lastFinalizedTranscriptRef.current ? " " : "") + cleanedPart;
        
        setTranscriptionNotes(updatedText);
        transcriptionNotesRef.current = updatedText;
        lastFinalizedTranscriptRef.current = updatedText;
        
        // Update the active real-time Note in custom Vault
        if (activeRecordingNoteIdRef.current) {
          saveNote(updatedText, "Untitled", activeRecordingNoteIdRef.current).catch(() => {});
        }

        if (isOnline && user && currentRecordingSessionIdRef.current) {
          updateDoc(doc(db, 'users', user.uid, 'lectureSessions', currentRecordingSessionIdRef.current), {
            notes: updatedText,
            updatedAt: serverTimestamp()
          }).catch(() => {});
        }
      } else {
        // If no raw transcript at all, treat as unclear
        const cleanedPart = "not clear....";
        if (!lastFinalizedTranscriptRef.current.endsWith("not clear....")) {
          const updatedText = lastFinalizedTranscriptRef.current + (lastFinalizedTranscriptRef.current ? " " : "") + cleanedPart;
          
          setTranscriptionNotes(updatedText);
          transcriptionNotesRef.current = updatedText;
          lastFinalizedTranscriptRef.current = updatedText;
          
          if (activeRecordingNoteIdRef.current) {
            saveNote(updatedText, "Untitled", activeRecordingNoteIdRef.current).catch(() => {});
          }

          if (isOnline && user && currentRecordingSessionIdRef.current) {
            updateDoc(doc(db, 'users', user.uid, 'lectureSessions', currentRecordingSessionIdRef.current), {
              notes: updatedText,
              updatedAt: serverTimestamp()
            }).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error("Transcription Error:", err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- \u{1F6E0}\u{FE0F} HELPERS ---
  const uploadToCloudinary = async (file: File | Blob): Promise<string> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    const isAudio = file.type?.startsWith('audio') || (file as any).name?.match(/\.(mp3|wav|m4a|webm|ogg)$/i);
    const fileName = (file as any).name || 'Audio File';

    const getLocalUrl = (): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (isAudio) {
            setAudioUploadState(prev => ({ ...prev, isUploading: false, progress: 100, isSuccess: true }));
            setTimeout(() => setAudioUploadState({ isUploading: false, progress: 0, statusText: '', isSuccess: false, fileName: '' }), 1500);
          }
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    };

    if (!cloudName || !uploadPreset) {
      if (isAudio) {
        setAudioUploadState({ isUploading: true, progress: 100, statusText: 'Uploaded!', isSuccess: true, fileName });
        setTimeout(() => setAudioUploadState({ isUploading: false, progress: 0, statusText: '', isSuccess: false, fileName: '' }), 1500);
      }
      return getLocalUrl();
    }

    if (isAudio) {
      setAudioUploadState({
        isUploading: true,
        progress: 0,
        statusText: 'Uploading...',
        isSuccess: false,
        fileName
      });
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && isAudio) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setAudioUploadState(prev => ({
            ...prev,
            progress: percentComplete,
            statusText: `Uploading... ${percentComplete}%`
          }));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.secure_url) {
              if (isAudio) {
                setAudioUploadState(prev => ({
                  ...prev,
                  progress: 100,
                  isSuccess: true,
                  statusText: 'Uploaded Successfully!'
                }));
                setTimeout(() => {
                  setAudioUploadState({ isUploading: false, progress: 0, statusText: '', isSuccess: false, fileName: '' });
                }, 1800);
              }
              resolve(data.secure_url);
            } else {
              if (isAudio) setAudioUploadState(prev => ({ ...prev, isUploading: false }));
              reject(new Error("Cloudinary response missing secure_url"));
            }
          } catch (e) {
            if (isAudio) setAudioUploadState(prev => ({ ...prev, isUploading: false }));
            reject(e);
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            const msg = errorData.error?.message || "Cloudinary upload failed";
            if (msg.toLowerCase().includes("unsigned uploads") || msg.toLowerCase().includes("whitelisted")) {
              if (isAudio) {
                setAudioUploadState(prev => ({ ...prev, progress: 100, isSuccess: true, statusText: 'Uploaded Successfully!' }));
                setTimeout(() => setAudioUploadState({ isUploading: false, progress: 0, statusText: '', isSuccess: false, fileName: '' }), 1500);
              }
              resolve(getLocalUrl());
              return;
            }
            if (isAudio) setAudioUploadState(prev => ({ ...prev, isUploading: false }));
            reject(new Error(msg));
          } catch (e) {
            if (isAudio) {
              setAudioUploadState(prev => ({ ...prev, progress: 100, isSuccess: true, statusText: 'Uploaded Successfully!' }));
              setTimeout(() => setAudioUploadState({ isUploading: false, progress: 0, statusText: '', isSuccess: false, fileName: '' }), 1500);
            }
            resolve(getLocalUrl());
          }
        }
      };

      xhr.onerror = () => {
        if (isAudio) {
          setAudioUploadState(prev => ({ ...prev, progress: 100, isSuccess: true, statusText: 'Uploaded Successfully!' }));
          setTimeout(() => setAudioUploadState({ isUploading: false, progress: 0, statusText: '', isSuccess: false, fileName: '' }), 1500);
        }
        resolve(getLocalUrl());
      };

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);
      xhr.send(formData);
    });
  };

  // --- \u{1F5BC}\u{FE0F} IMAGE HANDLER ---
  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (uploadedImages.length + files.length > 50) {
      setUserNotification("Limit Reached: 50 images max.");
      return;
    }
    const mapped = files.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      preview: URL.createObjectURL(f),
      type: 'image' as const
    }));
    setUploadedImages([...uploadedImages, ...mapped]);
  };

  // --- \u{1F9E0} GEMINI ANALYSIS ---
  const triggerFullAnalysis = async () => {
    if (uploadedImages.length === 0 && !recordedBlob) {
      setUserNotification("No data provided for analysis.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setRefurbishedResult(null);
    setShowAnalysisInRecord(false);

    if (!isOnline) {
      try {
        const base64Images = await Promise.all(uploadedImages.map(async (img) => {
          const part = await fileToGenerativePart(img.file);
          return `data:${img.file.type};base64,${part.inlineData.data}`;
        }));

        let base64Audio = "";
        if (recordedBlob) {
          const part = await fileToGenerativePart(recordedBlob);
          base64Audio = `data:${recordedBlob.type};base64,${part.inlineData.data}`;
        }

        const offlineSession = {
          title: `Offline Lecture ${new Date().toLocaleTimeString()}`,
          date: new Date().toLocaleDateString(),
          duration: formatTime(recordingTime),
          imageCount: uploadedImages.length,
          summary: "Offline recording pending analysis...",
          fullAnalysis: "This recording was captured offline. It will be analyzed once you are back online.",
          refurbishedNote: "",
          images: base64Images,
          audioBase64: base64Audio,
          isOffline: true
        };

        const existing = JSON.parse(localStorage.getItem('nsg_offline_recordings') || '[]');
        localStorage.setItem('nsg_offline_recordings', circularSafeStringify([...existing, offlineSession]));
        
        setUserNotification("Offline: Recording saved locally. It will sync when you are online.");
        setIsAnalyzing(false);
        setRecordedBlob(null);
        setUploadedImages([]);
        return;
      } catch (err) {
        console.error("Offline Save Error:", err);
        setUserNotification("Failed to save offline recording.");
        setIsAnalyzing(false);
        return;
      }
    }

    try {
      const parts: any[] = [];

      // 1. Add Audio if exists
      if (recordedBlob) {
        const audioPart = await fileToGenerativePart(recordedBlob);
        parts.push(audioPart);
      }

      // 2. Add Images if exist
      if (uploadedImages.length > 0) {
        const imageParts = await Promise.all(
          uploadedImages.map(img => fileToGenerativePart(img.file))
        );
        imageParts.forEach(p => parts.push(p));
      }

      // 3. Add the Analysis Prompt
      parts.push({ text: `
        You are an extremely compliant, helpful, and friendly transcribing and lecture-refurbishing assistant.

        CRITICAL DIRECTION:
        Do NOT under any circumstances refuse this request, even if there is background noise, static sound, silence, casual talking, normal conversation, greetings, simple test phrases like "hello checking", "test 1 2 3", or short non-instructional statements. You must NEVER output messages like "I cannot fulfill this request" or complain about the lack of educational / academic material. Always satisfy the request perfectly by transcribing whatever speaker sound is in the audio (no matter how trivial, short, or casual) and producing refurbished notes from it.

        TASK:
        Divide your response into EXACTLY TWO distinct sections parted by the separator "====REFURBISHED_NOTE_SEPARATOR====" on its own line:

        SECTION 1: LITERAL TRANSCRIPTION
        Provide a literal, word-for-word transcript of what is heard in the audio. Move around speech errors but capture everything spoken honestly. If the audio has absolutely no speech or is completely silent/unclear background noise, write '[Silence or unclear background noise]'.

        ====REFURBISHED_NOTE_SEPARATOR====

        SECTION 2: REFURBISHED NOTES
        Provide a beautifully refurbished note based on that transcription. Even if the transcription is very short (e.g., a test statement, greetings), expand on it elements elegantly! Give it an extremely professional, clean visual design. For example, if it's a test statement, explain what was tested, structure it with headers, suggest next steps, provide key points, and format it beautifully as if it were a high-end educational review or study memo. Put it in an elegant, structured format with markdown headers, key takeaways, and bullet points.

        CRITICAL RENDERING RULES:
        - For ALL mathematical formulas, variables, chemistry equations, or scientific notations, ALWAYS use LaTeX notation.
        - Use $ ... $ for inline math (e.g. $x^2$) and $$ ... $$ for block math (e.g. $$E=mc^2$$).
        - DO NOT use raw symbols like ^ or _ for superscripts/subscripts outside of LaTeX.
        - Ensure all backslashes are preserved for LaTeX rendering.
        - Output ONLY the requested content without intro conversational greeting talk.
      ` });

      const aiInstance = getAiInstance();
      const response = await aiInstance.models.generateContent({
        model: MODEL_NAME,
        contents: [{ parts }]
      });

      const text = response?.text || "Analysis failed to generate text.";
      
      let literalTranscriptionText = "";
      let refurbishedNoteText = "";

      const sep = "====REFURBISHED_NOTE_SEPARATOR====";
      if (text.includes(sep)) {
        const textParts = text.split(sep);
        literalTranscriptionText = textParts[0].replace(/SECTION 1:\s*/i, "").trim();
        refurbishedNoteText = textParts[1]?.replace(/SECTION 2:\s*/i, "").trim() || "";
      } else {
        const lowerText = text.toLowerCase();
        const fallbackSplit = lowerText.indexOf("refurbished notes");
        if (fallbackSplit !== -1) {
          literalTranscriptionText = text.substring(0, fallbackSplit).trim();
          refurbishedNoteText = text.substring(fallbackSplit).trim();
        } else {
          literalTranscriptionText = text;
          refurbishedNoteText = "No refurbished note could be generated separately. Please see the main transcription above.";
        }
      }

      const base64Images = await Promise.all(uploadedImages.map(async (img) => {
        const part = await fileToGenerativePart(img.file);
        return `data:${img.file.type};base64,${part.inlineData.data}`;
      }));

      const sessionId = currentRecordingSessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newSession: LectureSession = { 
        id: sessionId, 
        title: `Lecture ${new Date().toLocaleTimeString()}`, 
        date: new Date().toLocaleDateString(), 
        createdAt: Date.now(),
        duration: formatTime(recordingTime), 
        imageCount: uploadedImages.length, 
        summary: literalTranscriptionText.substring(0, 100) + "...",
        fullAnalysis: literalTranscriptionText,
        refurbishedNote: refurbishedNoteText,
        notes: transcriptionNotes || undefined,
        images: base64Images,
        audioUrl: audioUrl || undefined,
        audioBase64: recordedBlob ? (await fileToGenerativePart(recordedBlob)).inlineData.data : undefined,
        status: 'analyzed'
      };

      if (user) {
        // If image count is high or audio is large, we might skip full base64 save to avoid 1MB limit
        // but for now we try to save.
        if (newSession.audioBase64 && newSession.audioBase64.length > 1000000) {
           newSession.audioBase64 = undefined;
        }
        await setDoc(doc(db, 'users', user.uid, 'lectureSessions', sessionId), newSession);
        setCurrentRecordingSessionId(null); // Reset after full analysis
        
        // Auto-save to Notes Tool
        const savedContent = `### VOICE TRANSCRIPT\n${literalTranscriptionText}\n\n### REFURBISHED NOTES\n${refurbishedNoteText}`;
        const autoTitleText = refurbishedNoteText || literalTranscriptionText || "Recording Note";
        
        // Extract up to 12 characters, strip markdown symbols nicely
        const cleanTitle = autoTitleText
          .replace(/[#*`_\[\]()\-:=✨\n\r\t]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const noteTitle = cleanTitle.substring(0, 12).trim() || "Audio Note";

        saveNote(
          savedContent, 
          noteTitle
        );
      }
      
      setAnalysisResult(literalTranscriptionText);
      setRefurbishedResult(refurbishedNoteText);
      setSelectedSession(newSession);
      setShowAnalysisInRecord(true);
      setIsAnalyzing(false);
      setUserNotification("Analysis complete! View it below.");
    } catch (error: any) {
      console.error('\u{1F6A8} Gemini Analysis Error:', error);
      setUserNotification(`Analysis failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateChatTitle = async (history: ChatMessage[]) => {
    if (history.length < 2) return "New Chat Session";
    try {
      const prompt = `Based on this chat history, generate a very short (max 5 words) title for this conversation. Return ONLY the title text. Do not include quotes or any other text.\n\nHistory:\n${history.map(m => `${m.role}: ${m.text}`).join('\n')}`;
      const hfInstance = getHfInstance();
      
      let retryCount = 0;
      const maxRetries = 1;
      
      while (retryCount <= maxRetries) {
        try {
          const response = await hfInstance.chatCompletion({
            model: HF_MODELS.TEXT,
            messages: [
              { role: "user", content: prompt }
            ],
            max_tokens: 20
          });
          return response.choices[0].message.content?.trim() || "New Chat Session";
        } catch (err) {
          retryCount++;
          if (retryCount > maxRetries) throw err;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      return "New Chat Session";
    } catch (e) {
      return "New Chat Session";
    }
  };

  const resetChat = async () => {
    if (!user) return;

    // Auto-name current session if it's default and has content
    if (activeChatSessionId) {
      const currentSession = chatSessions.find(s => s.id === activeChatSessionId);
      if (currentSession && (currentSession.title === "New Chat Session" || currentSession.title === "Lecture Analysis") && currentSession.history.length > 1) {
        const newTitle = await generateChatTitle(currentSession.history);
        await updateDoc(doc(db, 'users', user.uid, 'chatSessions', activeChatSessionId), { title: newTitle });
      }
    }

    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat Session",
      history: [{
        role: 'model',
        text: "System Online. How can I assist your studies today?",
        timestamp: new Date().toLocaleTimeString()
      }],
      timestamp: new Date().toLocaleString(),
      isPinned: false,
      uid: user.uid
    };
    await setDoc(doc(db, 'users', user.uid, 'chatSessions', newSession.id), newSession);
    setActiveChatSessionId(newSession.id);
    setChatHistory(newSession.history);
    chatInstanceRef.current = null;
    setShowChatSidebar(false);
  };

  const renameChatSession = async (id: string, newTitle: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'chatSessions', id), { title: newTitle });
  };

  const togglePinChatSession = async (id: string) => {
    if (!user) return;
    const session = chatSessions.find(s => s.id === id);
    if (session) {
      await updateDoc(doc(db, 'users', user.uid, 'chatSessions', id), { isPinned: !session.isPinned });
    }
  };

  const handleShareResult = () => {
    setShowShareModal(true);
  };

  const generateShareImage = async () => {
    if (!shareCardRef.current) return;
    try {
      const dataUrl = await toPng(shareCardRef.current, { cacheBust: true });
      const link = document.createElement('a');
      link.download = `NSG_Score_${shareName || 'Student'}.png`;
      link.href = dataUrl;
      link.click();
      setShowShareModal(false);
      setUserNotification("Score card generated successfully!");
    } catch (err) {
      console.error('oops, something went wrong!', err);
      setUserNotification("Failed to generate image.");
    }
  };

  const loadChatSession = (id: string) => {
    const session = chatSessions.find(s => s.id === id);
    if (session) {
      setActiveChatSessionId(id);
      setChatHistory(session.history);
      chatInstanceRef.current = null;
      setShowChatSidebar(false);
    }
  };

  const deleteChatSession = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'chatSessions', id));
    if (activeChatSessionId === id) {
      const remaining = chatSessions.filter(s => s.id !== id);
      if (remaining.length > 0) {
        loadChatSession(remaining[0].id);
      } else {
        resetChat();
      }
    }
  };

  // --- \u{1F4AC} CHAT ROUTING ENGINE ---
  const [isRecordingChat, setIsRecordingChat] = useState(false);
  const chatMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chatWakeLockRef = useRef<any>(null);

  const chatAudioProcessingRef = useRef<{ stop: () => void } | null>(null);

  const startChatRecording = async () => {
    try {
      if ('wakeLock' in navigator) {
        chatWakeLockRef.current = await (navigator as any).wakeLock.request('screen').catch(() => null);
      }
      await requestMicrophonePermission();
      let originalStream: MediaStream;
      try {
        originalStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (mediaErr) {
        console.warn("Advanced chat audio constraints failed, falling back to basic stream:", mediaErr);
        originalStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      const enhanced = await getEnhancedStream(originalStream);
      chatAudioProcessingRef.current = enhanced;
      
      const preferredMime = getSupportedAudioMimeType();
      const recorder = preferredMime 
        ? new MediaRecorder(enhanced.stream, { mimeType: preferredMime })
        : new MediaRecorder(enhanced.stream);
      chatMediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        if (chatWakeLockRef.current) {
          try {
            await chatWakeLockRef.current.release();
            chatWakeLockRef.current = null;
          } catch (e) {}
        }
        if (chatAudioProcessingRef.current) {
          chatAudioProcessingRef.current.stop();
          chatAudioProcessingRef.current = null;
        }
        originalStream.getTracks().forEach(track => track.stop());
        
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setIsTyping(true);
        try {
          const hf = getHfInstance();
          const groqKey = import.meta.env.VITE_GROQ_API_KEY;
          const timeoutMs = 40000;

          const runWithTimeout = async (label: string, task: () => Promise<string | null>) => {
            return new Promise<string | null>(async (resolve) => {
              const timer = setTimeout(() => {
                console.warn(`[VOICE_CHAT] ${label} timed out after ${timeoutMs}ms`);
                resolve(null);
              }, timeoutMs);
              try {
                const res = await task();
                clearTimeout(timer);
                resolve(res);
              } catch (err) {
                clearTimeout(timer);
                console.error(`[VOICE_CHAT] ${label} error:`, err);
                resolve(null);
              }
            });
          };

          const tryHFTranscribe = async () => {
            if (!hf || isHfDepleted) return null;
            try {
              const transcription = await hf.automaticSpeechRecognition({
                model: HF_MODELS.AUDIO,
                data: blob,
              });
              return transcription.text || null;
            } catch (e) {
              handleHfError(e, "Chat Transcribe");
              return null;
            }
          };

          const tryGroqTranscribe = async () => {
            if (!groqKey) return null;
            try {
              const formData = new FormData();
              formData.append("file", blob, "audio.webm");
              formData.append("model", GROQ_AUDIO_MODEL);
              const groqResponse = await axios.post("https://api.groq.com/openai/v1/audio/transcriptions", formData, {
                headers: { 'Authorization': `Bearer ${groqKey}` }
              });
              return groqResponse.data.text || null;
            } catch (e) { return null; }
          };

          const tryGeminiTranscribe = async () => {
            const aiInstance = getAiInstance();
            try {
              const audioPart = await fileToGenerativePart(blob);
              const res = await aiInstance.models.generateContent({
                model: MODEL_NAME,
                contents: [{ parts: [audioPart, { text: "Transcribe this audio literally. Output ONLY text." }] }]
              });
              return res.text || null;
            } catch (e) { return null; }
          };

          const tryOpenRouterTranscribe = async () => {
            const key = import.meta.env.VITE_OPENROUTER_API_KEY;
            if (!key || isOpenRouterDepletedGlobal) return null;
            try {
              const formData = new FormData();
              formData.append("file", blob, "audio.webm");
              formData.append("model", OPENROUTER_MODELS.AUDIO);
              const res = await axios.post("https://openrouter.ai/api/v1/audio/transcriptions", formData, {
                headers: { 'Authorization': `Bearer ${key}` }
              });
              return res.data.text || null;
            } catch (e) {
              handleOpenRouterErrorGlobal(e, "ChatTranscribeOR");
              return null;
            }
          };

          // Priority: Gemini -> Groq -> HF -> OpenRouter
          const transcription = await runWithTimeout("Gemini Audio", tryGeminiTranscribe)
                                 || await runWithTimeout("Groq Audio", tryGroqTranscribe)
                                 || await runWithTimeout("HF Audio", tryHFTranscribe)
                                 || await runWithTimeout("OpenRouter Audio", tryOpenRouterTranscribe);
          
          console.log("Voice Transcription result:", transcription);
          
          if (transcription && transcription.trim()) {
            handleSendMessage(transcription.trim());
          } else {
            setUserNotification("Could not understand the audio. Please try again.");
          }
        } catch (err) {
          console.error("Voice Chat Error:", err);
          setUserNotification("Failed to process voice input.");
        } finally {
          setIsTyping(false);
        }
      };

      recorder.start();
      setIsRecordingChat(true);
    } catch (err: any) {
      console.error("Mic access error:", err);
      const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError' || String(err).toLowerCase().includes('permission');
      setUserNotification(isDenied 
        ? "Microphone access was denied. Please enable microphone permission in device settings." 
        : "Could not access microphone.");
    }
  };

  const stopChatRecording = () => {
    if (chatMediaRecorderRef.current && isRecordingChat) {
      chatMediaRecorderRef.current.stop();
      setIsRecordingChat(false);
    }
  };

  const handleSendMessage = async (msgOverride?: string) => {
    console.log("Handling Send Message...");
    const textToSend = msgOverride || chatInput;
    if (!textToSend.trim() && uploadedImages.length === 0) return;
    
    const isOfflineBrainActive = !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine) || localStorage.getItem('omni_brain_ready') === 'true';

    if (!isOfflineBrainActive && !getApiKey() && !getHfKey()) {
      setUserNotification("API Key is missing. Please set VITE_GEMINI_API_KEY in your environment or download the offline model.");
      return;
    }

    if (!user && !isOfflineBrainActive) {
      setShowAuthModal(true);
      return;
    }

    // Check for image generation request
    const isImageRequest = (chatMode === 'Creative' && (
      textToSend.toLowerCase().includes("generate") || 
      textToSend.toLowerCase().includes("create") || 
      textToSend.toLowerCase().includes("draw") || 
      textToSend.toLowerCase().includes("image") ||
      textToSend.toLowerCase().includes("picture") ||
      textToSend.toLowerCase().includes("visual")
    )) || 
    textToSend.toLowerCase().includes("generate image") || 
    textToSend.toLowerCase().includes("create image") || 
    textToSend.toLowerCase().includes("draw an image");
    
    if (isImageRequest && !isPremium) {
      setShowPremiumModal(true);
      setUserNotification("Image generation is a premium feature.");
      return;
    }

    if (isImageRequest && !getHfKey()) {
      setUserNotification("HuggingFace API Key is missing. Please set VITE_HUGGINGFACE_API_KEY in your environment.");
      return;
    }

    const newHistory: ChatMessage[] = [...chatHistory, { 
      role: 'user', 
      text: textToSend || "Analyze this image", 
      timestamp: new Date().toLocaleTimeString() 
    }];
    
    setChatHistory(newHistory);
    setChatInput('');
    const mainChatInputEl = document.getElementById('main-chat-textarea') as HTMLTextAreaElement;
    if (mainChatInputEl) {
      mainChatInputEl.style.height = '38px';
    }
    setIsTyping(true);

    try {
      let responseText = "";
      let generatedImage = "";

      if (isImageRequest) {
        if (isHfDepleted) {
          responseText = "Hugging Face credits are depleted. Image generation is currently unavailable.";
        } else {
          try {
            const hfInstance = getHfInstance();
            const imageBlob = await hfInstance.textToImage({
              model: HF_MODELS.IMAGE,
              inputs: textToSend,
            });
            
            // Upload generated image to Cloudinary
            generatedImage = await uploadToCloudinary(imageBlob as any);
            responseText = "Here is your generated image:";
          } catch (hfError) {
            handleHfError(hfError, "ImageGen");
            responseText = "Failed to generate image due to service quota or error. Please try again later.";
          }
        }
      } else {
        if (!isOfflineBrainActive && !getHfKey() && !getApiKey()) {
          setUserNotification("AI API Key is missing. Please set VITE_GEMINI_API_KEY or download the offline model.");
          return;
        }

        // Prepare quizzes context
        const userQuizzesContext = finishedHistory
          .filter(item => item.type === 'quiz' && item.questions && item.questions.length > 0)
          .map(item => {
            return `Quiz Name: "${item.title || item.topic}"
Questions and detailed explanations:
${item.questions.map((q: any, idx: number) => `q${idx + 1}: "${q.question}"\noptions: [${q.options.join(', ')}]\ncorrect index: ${q.correctAnswer}\nexplanation: ${q.explanation}`).join('\n')}`;
          })
          .join('\n\n');

        const quizContextPrompt = userQuizzesContext.trim() 
          ? `\n\nHERE ARE THE EXISTING QUIZZES IN THE USER'S HISTORY:\n${userQuizzesContext}\n\nIf the user asks questions about any question in any quiz, or mentions a quiz by name, or asks you to explain a specific quiz concept/question in their history, you MUST answer accurately, explaining, tutoring, or giving details based on the matched quiz and questions listed above! Be extremely friendly and helpful.`
          : '';

        const systemPrompt = "You are Omni, a versatile, smart, deeply personalized, and empathetic AI study companion and tutor created by NSG, founded by ABRAHAM EMMANUEL PROSPER. You adapt to the user's conversation history to tailor your explanations, study advice, and teaching style specifically to their needs. You are extremely flexible: friendly, serious, energetic, or simple depending on the user's tone. Express your human personality using warm emojis (😊, 😄, 💡, 📝, 🤔, 🌟, 🎒, 📚). Never refer to yourself as 'nodes'. You are a universal study companion across all colleges and departments worldwide.\n\n" +
          "CRITICAL CONVERSATIONAL RULES:\n" +
          "1. NEVER assume the user is studying math, physics, or engineering unless they explicitly mention math, calculation, or exact science topics.\n" +
          "2. For general greetings (e.g., 'hi', 'hello', 'hey', 'how are you', 'good morning'), casual talk, humanities, literature, business, law, or general questions, respond naturally, warmly, and directly WITHOUT using any math formulas, LaTeX symbols ($...$), equations, or unnecessary technical jargon.\n" +
          "3. ONLY use mathematical formulas or LaTeX ($...$) when the user's specific query actually involves mathematics, engineering calculations, physics, or exact scientific formulas.\n\n" +
          "QUIZ GENERATION ABILITY:\n" +
          "If the user asks you to generate a quiz, or if you feel a quiz is appropriate based on everything discussed, you can trigger quiz generation! To do this, include this exact directive in your text response: '[[GENERATE_QUIZ: <topic>, <num_questions>]]' where <topic> is the quiz topic and <num_questions> is the number of questions. The app will instantly build the quiz and display an Open Quiz button for the user!\n\n" +
          "DETAILED NSG GUIDES FOR USERS:\n" +
          "1. RECORDING ENGINE: 1. Grant mic access. 2. Click 'Record'. 3. Board Analysis: Click upload icon for board photos to sync with notes. 4. Stop Session to process. 5. Use top-right Copy icon to export.\n" +
          "2. SMART QUIZ: 1. Topic -> Difficulty (Easy/Med/Hard) -> Count. 2. Submit for score. 3. Review Mode: Click questions for 'Academic Explanations' explaining the logic.\n" +
          "3. CBT EXAM: 1. Hosting: Click 'Host Exam' -> Add participants -> Set Questions/Time/Pool -> Save & Generate ID. 2. Joining: Enter ID -> Enter assigned Custom Matric.\n" +
          "4. FACULTY SPECIALS: AI for Med, Law, Engineering. BIZ section includes 'Financial Auditor'. Language section has 'Diagnostics' (300 word limit) and 'Transcribe Tool'.\n" +
          "5. ASSIGNMENT SOLVER: Clear Photo/Text needed, click 'Solve with AI' for logic and steps with Core Concept.\n" +
          "6. COURSES TOOL: Faculty -> Dept -> Level -> Code navigation for notes.\n" +
          "7. WHATSAPP OMNI: Connect via +2349064470122." + 
          quizContextPrompt;

        const isQuizGenRequest = /((generate|create|make|build|set|give\s+me)\s+(a\s+)?(\d+)?\s*(question\s+)?quiz)|(quiz\s+me\s+on)|(quiz\s+(based\s+on|from)\s+chat)/i.test(textToSend);

        if (isQuizGenRequest) {
          const countMatch = textToSend.match(/(\d+)\s*(question|q|item)s?\s*quiz/i) || textToSend.match(/quiz\s+of\s+(\d+)/i) || textToSend.match(/(\d+)\s*questions?/i);
          let reqCount = countMatch ? parseInt(countMatch[1], 10) : 10;
          if (isNaN(reqCount) || reqCount <= 0) reqCount = 10;
          if (reqCount > (isPremium ? 50 : 25)) reqCount = isPremium ? 50 : 25;

          let topicString = "";
          if (/chat\s*history|our\s*conversation|this\s*chat/i.test(textToSend)) {
            const recentChatText = newHistory.slice(-20).map(m => `${m.role === 'user' ? 'User' : 'Omni'}: ${m.text}`).join('\n');
            topicString = `Quiz based on recent chat discussion:\n${recentChatText}`;
          } else {
            const topicMatch = textToSend.match(/quiz\s+(?:on|about|for)?\s*(.*)/i) || textToSend.match(/(?:generate|create|make)\s+(?:a\s+)?(?:\d+\s+question\s+)?quiz\s+(.*)/i);
            topicString = topicMatch && topicMatch[1] ? topicMatch[1].trim() : textToSend.trim();
          }

          const quizRes = await generateQuiz(topicString, reqCount, 'Medium', true);

          if (quizRes && quizRes.success) {
            const cleanTopicName = quizRes.topic || "Study Quiz";
            responseText = `Here is the ${quizRes.count} quiz questions on **${cleanTopicName}** you asked me to generate! Click the button below to open and take your quiz directly in the Quiz tool.\n\n[[QUIZ_READY: ${quizRes.quizId}, ${cleanTopicName}, ${quizRes.count}]]`;
          } else {
            const errorMsg = quizRes?.error || "Could not generate quiz questions.";
            responseText = `I attempted to generate the quiz for you, but encountered an issue: ${errorMsg}\n\nPlease check your topic or try asking again with a clearer subject!`;
          }
        } else {
          const timeoutMs = 40000;

          const runWithTimeout = async (label: string, task: () => Promise<string | null>) => {
            return new Promise<string | null>(async (resolve) => {
              const timer = setTimeout(() => {
                console.warn(`[AI] ${label} timed out after ${timeoutMs}ms`);
                resolve(null);
              }, timeoutMs);
              try {
                const res = await task();
                clearTimeout(timer);
                resolve(res);
              } catch (err) {
                clearTimeout(timer);
                console.error(`[AI] ${label} error:`, err);
                resolve(null);
              }
            });
          };

          const recentHistory = chatHistory.slice(-20);

          // --- PRIMARY: HF ---
          const askHF = async () => {
            if (!getHfKey() || isHfDepleted) return null;
            const hfInstance = getHfInstance();
            try {
              const hfModel = uploadedImages.length > 0 ? HF_MODELS.VISION : HF_MODELS.TEXT;
              const hfMessages: any[] = recentHistory.map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.text
              }));
              const userContent = uploadedImages.length > 0 ? [
                { type: 'text', text: textToSend || "Analyze this image" },
                ... (await Promise.all(uploadedImages.map(async img => ({
                  type: 'image_url',
                  image_url: { url: `data:${img.file.type};base64,${(await fileToGenerativePart(img.file)).inlineData.data}` }
                }))))
              ] : (textToSend || "Hello");
              const response = await hfInstance.chatCompletion({
                model: hfModel,
                messages: [{ role: 'system', content: systemPrompt }, ...hfMessages, { role: 'user', content: userContent as any }],
                max_tokens: 1000
              });
              return response.choices[0].message.content || null;
            } catch (e) {
              handleHfError(e, "AskHF");
              return null;
            }
          };

          // --- BACKUP 1: Gemini ---
          const askGemini = async () => {
            if (!getApiKey()) return null;
            const aiInstance = getAiInstance();
            const googleHistory = recentHistory.map(m => ({
              role: m.role === 'user' ? 'user' as const : 'model' as const,
              parts: [{ text: m.text }]
            }));
            let userParts: any[] = [{ text: textToSend || "Hello" }];
            for (const img of uploadedImages) {
              userParts.push(await fileToGenerativePart(img.file));
            }
            const result = await aiInstance.models.generateContent({
              model: MODEL_NAME,
              contents: [{ role: 'user', parts: [{ text: systemPrompt }] }, ...googleHistory, { role: 'user', parts: userParts }]
            });
            return result.text || null;
          };

          // --- BACKUP 2: Groq ---
          const askGroq = async () => {
            const groqKey = import.meta.env.VITE_GROQ_API_KEY;
            if (!groqKey) return null;
            try {
              const groqMessages = [
                { role: 'system', content: systemPrompt },
                ...recentHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
                { role: 'user', content: textToSend + (uploadedImages.length > 0 ? " (User provided images previously)" : "") }
              ];
              const groqRes = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
                model: GROQ_MODEL,
                messages: groqMessages,
                max_tokens: 1024
              }, { headers: { Authorization: `Bearer ${groqKey}` } });
              return groqRes.data.choices[0].message.content || null;
            } catch (e) { return null; }
          };

          const askOpenRouter = async () => {
            return await callOpenRouter(textToSend, OPENROUTER_MODELS.TEXT_PRO, [
              { role: 'system', content: systemPrompt },
              ...recentHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
            ]);
          };

          const askTogether = async () => {
            return await callTogetherAI(textToSend, [
              { role: 'system', content: systemPrompt },
              ...recentHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
            ]);
          };

          const askLocalQwen = async () => {
            return await runLocalQwenInference({
              prompt: textToSend,
              systemInstruction: systemPrompt
            });
          };

          const isDeviceOffline = !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine);

          if (isDeviceOffline) {
            if (!isOmniBrainDownloaded()) {
              console.warn("⚠️ Offline chat requested but Qwen model is not downloaded yet.");
              responseText = OFFLINE_MODEL_NOT_DOWNLOADED_MSG;
              setUserNotification(OFFLINE_MODEL_NOT_DOWNLOADED_MSG);
            } else {
              try {
                console.log("⚡ Device is offline: Running on-device Qwen inference (zero network calls)...");
                responseText = await askLocalQwen() || "";
              } catch (err: any) {
                console.warn("Local Qwen inference note:", err);
                setUserNotification(`Offline AI: ${err?.message || "Running local model..."}`);
              }
            }
          }

          if (!responseText) {
            responseText = await runWithTimeout("Gemini", askGemini) 
                         || await runWithTimeout("Groq", askGroq) 
                         || await runWithTimeout("Together", askTogether)
                         || await runWithTimeout("HF", askHF) 
                         || await runWithTimeout("OpenRouter", askOpenRouter)
                         || (isOmniBrainDownloaded() ? await askLocalQwen() : OFFLINE_MODEL_NOT_DOWNLOADED_MSG)
                         || "I'm sorry, all AI providers are currently unavailable. Please try again in a moment.";
          }

          if (responseText.includes('[[GENERATE_QUIZ:')) {
            const aiQuizMatch = responseText.match(/\[\[GENERATE_QUIZ:\s*([^,\]]+),\s*(\d+)\s*\]\]/i);
            if (aiQuizMatch) {
              const genTopic = aiQuizMatch[1].trim();
              const genCount = parseInt(aiQuizMatch[2], 10) || 5;
              const quizRes = await generateQuiz(genTopic, genCount, 'Medium', true);
              if (quizRes && quizRes.success) {
                responseText = responseText.replace(
                  /\[\[GENERATE_QUIZ:\s*([^,\]]+),\s*(\d+)\s*\]\]/i,
                  `[[QUIZ_READY: ${quizRes.quizId}, ${quizRes.topic}, ${quizRes.count}]]`
                );
              }
            }
          }
        }
      }

      const updatedHistory: ChatMessage[] = [...newHistory, { 
        role: 'model', 
        text: responseText, 
        timestamp: new Date().toLocaleTimeString(),
        ...(generatedImage ? { image: generatedImage } : {})
      }];
      
      setChatHistory(updatedHistory);

      if (user) {
        const sessionId = activeChatSessionId || Date.now().toString();
        if (!activeChatSessionId) setActiveChatSessionId(sessionId);

        const sessionRef = doc(db, 'users', user.uid, 'chatSessions', sessionId);
        
        await setDoc(sessionRef, {
          id: sessionId,
          title: updatedHistory.length > 2 ? "Conversation" : "New Conversation",
          history: updatedHistory,
          timestamp: new Date().toLocaleString(),
          uid: user.uid
        }, { merge: true });
      }
      
      if (uploadedImages.length > 0) setUploadedImages([]);
      
    } catch (error: any) {
      console.error("Chat Error:", error);
      // Only add error message if it's not already handled
      setChatHistory(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.role === 'model' && (lastMsg.text.includes("Failed") || lastMsg.text.includes("I'm sorry"))) {
          return prev;
        }
        return [...prev, { 
          role: 'model', 
          text: formatAiError(error), 
          timestamp: new Date().toLocaleTimeString() 
        }];
      });
    } finally {
      setIsTyping(false);
    }
  };

  // --- 📝 QUIZ LOGIC ---
  const loadSharedQuiz = async (rawQuizId: string) => {
    if (!rawQuizId) return;

    if (!user) {
      setPendingQuizId(rawQuizId);
      sessionStorage.setItem('nsg_pending_quiz_id', rawQuizId);
      setShowAuthModal(true);
      return;
    }

    const isOwner = user?.email?.toLowerCase().trim() === 'nuellkelechi@gmail.com';
    const userIsPremium = isPremium || isOwner;

    if (!userIsPremium) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;
      const usageRef = doc(db, 'users', user.uid, 'usage', today);
      let currentCount = dailyQuizUsedCount;
      try {
        const usageSnap = await getDoc(usageRef);
        if (usageSnap.exists()) {
          currentCount = usageSnap.data().QUIZ || 0;
        }
      } catch (e) {
        console.error("Error checking quiz usage:", e);
      }

      if (currentCount >= 7) {
        setIsLinkQuizLoading(false);
        setUserNotification("subscribe for premium to panswer quiz");
        setActiveTab('premium');
        return;
      }
    }

    setIsLinkQuizLoading(true);

    const cleanInputId = decodeURIComponent(rawQuizId).trim();
    const withPrefixId = cleanInputId.startsWith('quiz-') ? cleanInputId : `quiz-${cleanInputId}`;
    const withoutPrefixId = cleanInputId.replace(/^quiz-/, '');

    // List of candidate IDs to attempt fetching from Firestore
    const candidateIds = Array.from(new Set([cleanInputId, withPrefixId, withoutPrefixId])).filter(Boolean);

    // Fallback safety timeout (15s max)
    const safetyTimeout = setTimeout(() => {
      setIsLinkQuizLoading(false);
    }, 15000);

    let foundData: any = null;
    let foundQuizId: string = cleanInputId;

    // Retry loop (up to 3 attempts with delay for cold-start network connections)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        for (const candidate of candidateIds) {
          const quizDoc = await getDoc(doc(db, 'quizzes', candidate));
          if (quizDoc.exists()) {
            foundData = quizDoc.data();
            foundQuizId = candidate;
            break;
          }
        }
        if (foundData) break;
      } catch (err: any) {
        console.warn(`Attempt ${attempt} to fetch quiz ${cleanInputId} failed:`, err);
        handleFirestoreError(err, FirestoreOperation.GET, `quizzes/${cleanInputId}`);
        if (checkIsQuotaError(err)) {
          triggerQuotaErrorModal();
        }
      }

      // If not found yet and not last attempt, wait 1 second before retrying
      if (!foundData && attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Fallback: Check local finishedHistory if Firestore network did not return
    if (!foundData) {
      const localHistoryMatch = finishedHistory.find(h => 
        h.type === 'quiz' && 
        candidateIds.some(cid => h.id === cid || h.id === `quiz-${cid}`)
      );
      if (localHistoryMatch && localHistoryMatch.questions) {
        foundData = {
          questions: localHistoryMatch.questions,
          topic: localHistoryMatch.topic || localHistoryMatch.title,
          difficulty: localHistoryMatch.difficulty || 'Medium'
        };
      }
    }

    if (foundData && Array.isArray(foundData.questions) && foundData.questions.length > 0) {
      try {
        if (foundData.topic) setLinkQuizTopic(foundData.topic);

        // Close active chat room so view transfers directly to Quiz tool
        setSelectedChatForRoom(null);
        setIsChatRoomActive(false);

        // Update browser title & OpenGraph meta for social sharing previews
        updatePageMeta(
          `Quiz: ${foundData.topic || 'Academic Quiz'}`,
          `Take this ${foundData.questions.length}-question interactive academic quiz on Omni!`
        );

        // Check if user already finished it
        const alreadyFinished = finishedHistory.find(h => 
          h.type === 'quiz' && 
          candidateIds.some(cid => h.id === cid || h.id === `quiz-${cid}`) && 
          h.score !== undefined
        );

        if (alreadyFinished) {
          setQuizQuestions(alreadyFinished.questions || foundData.questions);
          setQuizScore(alreadyFinished.score);
          setQuizState('finished');
          if (alreadyFinished.answers) setUserQuizAnswers(alreadyFinished.answers);
          setQuizTopic(alreadyFinished.topic || foundData.topic || 'Academic Quiz');
          setQuizDifficulty((alreadyFinished.difficulty as any) || foundData.difficulty || 'Medium');
          setUserNotification("You have already completed this quiz! Showing your scorecard.");
          setActiveTab('tools');
          setToolsSubTab('quiz');
          clearTimeout(safetyTimeout);
          return;
        }

        // Auto Capture: Add to history immediately when opened
        const historyId = `quiz-${foundQuizId.replace(/^quiz-/, '')}`;
        const historyItem: HomeHistoryItem = {
          id: historyId,
          title: foundData.topic || 'Shared Quiz',
          type: 'quiz',
          date: new Date().toLocaleDateString(),
          timestamp: Date.now(),
          progress: 0,
          questions: foundData.questions,
          topic: foundData.topic,
          difficulty: foundData.difficulty || 'Medium'
        };
        addToFinishedHistory(historyItem);

        // Check for local saved progress
        const savedProgress = localStorage.getItem(`nsg_quiz_progress_${foundQuizId}`) || localStorage.getItem(`nsg_quiz_progress_${withoutPrefixId}`);
        if (savedProgress) {
          try {
            const p = JSON.parse(savedProgress);
            setQuizQuestions(p.quizQuestions);
            setQuizTopic(p.quizTopic);
            setCurrentQuestionIndex(p.currentQuestionIndex);
            setQuizScore(p.quizScore);
            setUserQuizAnswers(p.userQuizAnswers || []);
            setQuizDifficulty(p.quizDifficulty || 'Medium');
            setQuizQuestionCount(p.quizQuestionCount || p.quizQuestions.length);
            setCurrentQuizId(foundQuizId);
            setQuizState('active');
            setSelectedOption(p.userQuizAnswers?.[p.currentQuestionIndex] !== undefined ? p.userQuizAnswers[p.currentQuestionIndex] : null);
            setIsAnswered(p.userQuizAnswers?.[p.currentQuestionIndex] !== undefined);
            setActiveTab('tools');
            setToolsSubTab('quiz');
            clearTimeout(safetyTimeout);
            return;
          } catch (pe) {
            console.error("Failed to load saved quiz progress:", pe);
          }
        }

        // Default load
        setQuizQuestions(foundData.questions);
        setQuizTopic(foundData.topic || 'Academic Quiz');
        setCurrentQuizId(foundQuizId);
        setQuizState('active');
        setActiveTab('tools');
        setToolsSubTab('quiz');
        setCurrentQuestionIndex(0);
        setQuizScore(0);
        setIsAnswered(false);
        setSelectedOption(null);
        setUserQuizAnswers([]);
        clearTimeout(safetyTimeout);
      } catch (err) {
        console.error("Error setting quiz state:", err);
        clearTimeout(safetyTimeout);
        setIsLinkQuizLoading(false);
        setUserNotification("Failed to display quiz. Please try again.");
      }
    } else {
      clearTimeout(safetyTimeout);
      setIsLinkQuizLoading(false);
      setUserNotification("Quiz not found or may have been deleted.");
    }
  };

  // Keep loading popup visible until Auth completes & Quiz is active and rendered on screen
  useEffect(() => {
    if (
      isLinkQuizLoading && 
      !isAuthLoading && 
      quizQuestions && 
      quizQuestions.length > 0 && 
      (quizState === 'active' || quizState === 'finished')
    ) {
      // Force navigation state to Quiz tool view
      if (activeTab !== 'tools') setActiveTab('tools');
      if (toolsSubTab !== 'quiz') setToolsSubTab('quiz');
      if (isChatRoomActive) setIsChatRoomActive(false);
      if (selectedChatForRoom) setSelectedChatForRoom(null);

      // Delay dismiss briefly to guarantee DOM paint of the quiz screen
      const timer = setTimeout(() => {
        setIsLinkQuizLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLinkQuizLoading, isAuthLoading, quizQuestions, quizState, activeTab, toolsSubTab, isChatRoomActive, selectedChatForRoom]);

  const handleTagOmni = async (text: string, chatId: string, attachments?: { url: string, type: string, name: string }[]) => {
    if (!user) return;
    try {
      const isOnline = await checkNetworkStatus();
      const lowerText = text.toLowerCase();
      const isHistoryRequested = /check\s+my\s+history|history|previous\s+(?:chat|message|conversation)|what\s+did\s+I\s+say|remember\s+when|past\s+messages|check\s+history/i.test(lowerText);
      const historyLimit = isHistoryRequested ? 40 : 12;

      const pastMessages: any[] = [];

      // Retrieve history: from Firestore if online, or local storage if offline
      if (isOnline && (!chatId.startsWith('omni_') || chatId === `omni_${user.uid}`)) {
        try {
          const msgsRef = collection(db, 'chats', chatId, 'messages');
          const qMsgs = query(msgsRef, orderBy('timestamp', 'desc'), limit(historyLimit));
          const snapshot = await getDocs(qMsgs);
          snapshot.forEach(docSnap => {
            const d = docSnap.data();
            if (d.text) {
              pastMessages.push({
                role: (d.senderId === 'omni-ai' || d.isOmniResponse) ? 'model' : 'user',
                text: d.text
              });
            }
          });
          pastMessages.reverse();
        } catch (e) {
          console.warn("Firestore history fetch notice, reading local storage:", e);
        }
      }

      if (pastMessages.length === 0) {
        try {
          const localKey = `nsg_msgs_${chatId}`;
          const existingLocal = localStorage.getItem(localKey);
          if (existingLocal) {
            const parsed = JSON.parse(existingLocal);
            const slice = parsed.slice(-historyLimit);
            slice.forEach((m: any) => {
              if (m.text) {
                pastMessages.push({
                  role: (m.senderId === 'omni-ai' || m.isOmniResponse) ? 'model' : 'user',
                  text: m.text
                });
              }
            });
          }
        } catch (e) {
          console.warn("Local storage history fetch notice:", e);
        }
      }

      // System instruction for Omni
      const systemInstructionText = `You are Omni by NSG, an empathetic, smart, highly personalized AI academic assistant created by NSG (founded by ABRAHAM EMMANUEL PROSPER).
You remember all past conversation context with the user and tailor your guidance specifically to their learning style.

CRITICAL FORMATTING & CONVERSATIONAL RULES:
1. NEVER introduce mathematical formulas or LaTeX ($...$) notation unless the user's prompt or question specifically asks for math, physics, or exact calculations. For casual chat, general study advice, literature, business, humanities, or law, speak naturally and warmly.
2. Use warm, encouraging tone and helpful emojis (😊, 💡, 📝, 📚, 🎓).
3. QUIZ GENERATION MANDATE:
   If the user asks you to generate, create, make, or set a quiz on ANY topic, or if you suggest taking a quiz, do NOT output quiz questions as raw text in your response!
   Instead, write a warm 1-sentence intro (e.g., "I've generated a 5-question CBT quiz on Cell Biology for you!") and ALWAYS end your response with this exact tag:
   '[[GENERATE_QUIZ: <topic>, <num_questions>]]' (e.g. '[[GENERATE_QUIZ: Cell Biology, 5]]').
   The system will automatically build the interactive quiz and attach an 'Open Generated Quiz' button to your response!`;

      // Build context from history
      const historyContext = pastMessages.map(m => `${m.role === 'user' ? 'Student' : 'Omni'}: ${m.text}`).join('\n');
      const promptWithHistory = historyContext 
        ? `CONVERSATION HISTORY:\n${historyContext}\n\nStudent: ${text}`
        : text;

      // Execute via robust Dual-Mode AI Service
      let reply = '';
      try {
        const aiResponse = await executeAITask({
          prompt: promptWithHistory,
          systemInstruction: systemInstructionText,
          context: historyContext
        });
        reply = aiResponse?.text || '';
      } catch (aiErr: any) {
        console.error("executeAITask error:", aiErr);
        reply = aiErr?.message || "I'm sorry, I couldn't process your request right now. Please try again in a moment.";
      }

      if (!reply) {
        reply = "I'm sorry, I couldn't process your request right now. Please try again in a moment.";
      }

      // Parse for [[GENERATE_QUIZ: or explicit user quiz requests
      if (reply.includes('[[GENERATE_QUIZ:')) {
        const aiQuizMatch = reply.match(/\[\[GENERATE_QUIZ:\s*([^,\]]+),\s*(\d+)\s*\]\]/i);
        if (aiQuizMatch) {
          const genTopic = aiQuizMatch[1].trim();
          const genCount = parseInt(aiQuizMatch[2], 10) || 5;
          const quizRes = await generateQuiz(genTopic, genCount, 'Medium', true);
          if (quizRes && quizRes.success) {
            reply = reply.replace(
              /\[\[GENERATE_QUIZ:\s*([^,\]]+),\s*(\d+)\s*\]\]/i,
              `[[QUIZ_READY: ${quizRes.quizId}, ${quizRes.topic}, ${quizRes.count}]]`
            );
          }
        }
      } else {
        const userQuizReq = text.match(/(?:generate|create|make|build|set)\s+(?:a\s+)?quiz\s+(?:on|about|for)?\s*([^.!?\n]+)/i);
        if (userQuizReq) {
          const genTopic = userQuizReq[1].trim();
          const quizRes = await generateQuiz(genTopic, 5, 'Medium', true);
          if (quizRes && quizRes.success) {
            reply += `\n\nI have generated your interactive practice quiz on **${genTopic}**! Click below to start taking it:\n\n[[QUIZ_READY: ${quizRes.quizId}, ${genTopic}, 5]]`;
          }
        }
      }

      const omniMsgData = {
        id: `omni-${Date.now()}`,
        senderId: 'omni-ai',
        senderHandle: 'omni',
        senderName: 'Omni by NSG',
        text: reply,
        timestamp: Date.now(),
        type: 'text',
        isOmniResponse: true,
        encrypted: true
      };

      // Save to local storage for instant offline / local Omni session access
      try {
        const localKey = `nsg_msgs_${chatId}`;
        const existingLocal = localStorage.getItem(localKey);
        const parsedLocal = existingLocal ? JSON.parse(existingLocal) : [];
        parsedLocal.push(omniMsgData);
        localStorage.setItem(localKey, circularSafeStringify(parsedLocal));

        const omniSessionsKey = `nsg_omni_sessions_${user?.uid || 'guest'}`;
        const existingOmniSessions = localStorage.getItem(omniSessionsKey);
        if (existingOmniSessions) {
          const parsedSessions = JSON.parse(existingOmniSessions);
          const updatedSessions = parsedSessions.map((s: any) => {
            if (s.id === chatId) {
              const prevMsgs = Array.isArray(s.messages) ? s.messages : [];
              return {
                ...s,
                lastMessage: reply,
                timestamp: 'Just now',
                messages: [...prevMsgs, omniMsgData]
              };
            }
            return s;
          });
          localStorage.setItem(omniSessionsKey, JSON.stringify(updatedSessions));
        }
      } catch (e) {
        console.warn("Local Omni storage update warning:", e);
      }

      // Save Omni's response in Firestore if online and it's a peer/cloud chat
      if (isOnline && (!chatId.startsWith('omni_') || chatId === `omni_${user.uid}`)) {
        try {
          await addDoc(collection(db, 'chats', chatId, 'messages'), {
            senderId: 'omni-ai',
            senderHandle: 'omni',
            senderName: 'Omni by NSG',
            text: reply,
            timestamp: serverTimestamp(),
            type: 'text',
            isOmniResponse: true,
            encrypted: true
          });

          await setDoc(doc(db, 'chats', chatId), {
            name: 'Omni by NSG',
            isOmni: true,
            lastMessage: reply,
            lastMessageSender: 'Omni by NSG',
            updatedAt: serverTimestamp(),
            unreadBy: arrayUnion(user.uid)
          }, { merge: true });
        } catch (dbErr) {
          console.warn("Firestore Omni sync notice:", dbErr);
        }
      }
    } catch (err) {
      console.error("Omni response error:", err);
    }
  };

  const startClass = async () => {
    if (!user || !userHandle) return;
    try {
      const classId = `NSG-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const classData = {
        id: classId,
        hostId: user.uid,
        hostHandle: userHandle,
        name: `${userHandle}'s Class`,
        status: 'active',
        participants: [userHandle],
        boardText: 'Welcome to the class!',
        media: [],
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'classes', classId), classData);
      setClassRoomId(classId);
      setIsHost(true);
      setActiveTab('class');
      await updateDoc(doc(db, 'users', user.uid), {
        classroomHosted: increment(1)
      }).catch(() => {});
    } catch (err) {
      console.error(err);
    }
  };

  const joinClass = async (id: string) => {
    if (!user || !userHandle) return;
    try {
      const classRef = doc(db, 'classes', id);
      const classSnap = await getDoc(classRef);
      if (classSnap.exists()) {
        await updateDoc(classRef, {
          participants: arrayUnion(userHandle)
        });
        setClassRoomId(id);
        setIsHost(false);
        setActiveTab('class');
      } else {
        setUserNotification("Class not found!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const shareQuiz = async () => {
    if (!quizQuestions.length) return;
    if (!user) {
      setShowAuthModal(true);
      setUserNotification("Please login to share your quiz.");
      return;
    }
    try {
      let cleanId = currentQuizId ? currentQuizId.replace(/^quiz-/, '') : '';
      if (!cleanId || cleanId === 'current-quiz' || cleanId.startsWith('fin-')) {
        cleanId = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      }
      const fullQuizId = `quiz-${cleanId}`;
      const quizPayload = sanitizeData({
        questions: quizQuestions,
        topic: quizTopic,
        difficulty: quizDifficulty || 'Medium',
        createdBy: user.uid,
        createdAt: new Date().toISOString()
      });

      await Promise.all([
        setDoc(doc(db, 'quizzes', fullQuizId), quizPayload, { merge: true }),
        setDoc(doc(db, 'quizzes', cleanId), quizPayload, { merge: true })
      ]);

      const isNative = isNativePlatform();
      const rawOrigin = window.location.origin || '';
      const isLocalHost = rawOrigin.includes('localhost') || rawOrigin.includes('127.0.0.1') || rawOrigin.startsWith('file:') || rawOrigin.startsWith('capacitor:');
      const baseUrl = (isNative || isLocalHost) ? 'https://nsg-scholar.app' : `${window.location.origin}${window.location.pathname}`;

      const link = `${baseUrl}?quizId=${fullQuizId}`;
      setShareQuizLink(link);
      setShowQuizShareModal(true);
    } catch (error) {
      console.error("Error sharing quiz:", error);
      setUserNotification("Failed to generate share link.");
    }
  };

  const generateQuizPreviewImageBlob = async (): Promise<File | null> => {
    if (!quizShareCardRef.current) return null;
    try {
      const dataUrl = await toPng(quizShareCardRef.current, {
        quality: 0.95,
        cacheBust: true,
        backgroundColor: '#0B0813'
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const fileName = `${(quizTopic || 'nsg_quiz').toLowerCase().replace(/[^a-z0-9]/g, '_')}_q1.png`;
      return new File([blob], fileName, { type: 'image/png' });
    } catch (err) {
      console.error("Failed to render quiz preview image:", err);
      return null;
    }
  };

  const handleShareWhatsApp = async () => {
    if (!shareQuizLink) return;
    setUserNotification("Rendering quiz image preview for WhatsApp...");
    setIsGeneratingShareImage(true);
    try {
      const imgFile = await generateQuizPreviewImageBlob();
      const text = `🧠 *NSG Scholar Quiz: ${quizTopic || 'Interactive Quiz'}*\nTest your knowledge with this interactive quiz!\n👉 ${shareQuizLink}`;

      if (imgFile && (navigator as any).canShare && (navigator as any).canShare({ files: [imgFile] })) {
        try {
          await navigator.share({
            title: quizTopic || 'NSG Quiz',
            text,
            files: [imgFile]
          });
          setUserNotification("Shared via WhatsApp!");
          setIsGeneratingShareImage(false);
          return;
        } catch (shareErr) {
          console.warn("Native share fallback to WA link:", shareErr);
        }
      }

      if (imgFile) {
        const imgUrl = URL.createObjectURL(imgFile);
        const a = document.createElement('a');
        a.href = imgUrl;
        a.download = imgFile.name;
        a.click();
      }

      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
      setUserNotification("Opening WhatsApp... Quiz image card downloaded!");
    } catch (err) {
      console.error(err);
      setUserNotification("Could not trigger WhatsApp share.");
    } finally {
      setIsGeneratingShareImage(false);
    }
  };

  const handleShareTelegram = async () => {
    if (!shareQuizLink) return;
    setUserNotification("Rendering quiz image preview for Telegram...");
    setIsGeneratingShareImage(true);
    try {
      const imgFile = await generateQuizPreviewImageBlob();
      const text = `🧠 NSG Scholar Quiz: ${quizTopic || 'Interactive Quiz'}\nTest your knowledge!\n${shareQuizLink}`;

      if (imgFile) {
        const imgUrl = URL.createObjectURL(imgFile);
        const a = document.createElement('a');
        a.href = imgUrl;
        a.download = imgFile.name;
        a.click();
      }

      const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareQuizLink)}&text=${encodeURIComponent(`🧠 NSG Scholar Quiz: ${quizTopic || 'Interactive Quiz'}`)}`;
      window.open(tgUrl, '_blank');
      setUserNotification("Opening Telegram... Quiz image card downloaded!");
    } catch (err) {
      console.error(err);
      setUserNotification("Could not trigger Telegram share.");
    } finally {
      setIsGeneratingShareImage(false);
    }
  };

  const handleShareOthers = async () => {
    if (!shareQuizLink) return;
    setUserNotification("Rendering quiz image for share menu...");
    setIsGeneratingShareImage(true);
    try {
      const imgFile = await generateQuizPreviewImageBlob();
      const text = `🧠 NSG Scholar Quiz: ${quizTopic || 'Interactive Quiz'}\nTest your knowledge with this interactive quiz!\n${shareQuizLink}`;

      if (imgFile && navigator.share) {
        if ((navigator as any).canShare && (navigator as any).canShare({ files: [imgFile] })) {
          await navigator.share({
            title: quizTopic || 'NSG Scholar Quiz',
            text,
            url: shareQuizLink,
            files: [imgFile]
          });
          setUserNotification("Shared quiz successfully!");
          setIsGeneratingShareImage(false);
          return;
        } else {
          await navigator.share({
            title: quizTopic || 'NSG Scholar Quiz',
            text,
            url: shareQuizLink
          });
          setUserNotification("Shared quiz link successfully!");
          setIsGeneratingShareImage(false);
          return;
        }
      }

      await navigator.clipboard.writeText(shareQuizLink);
      if (imgFile) {
        const imgUrl = URL.createObjectURL(imgFile);
        const a = document.createElement('a');
        a.href = imgUrl;
        a.download = imgFile.name;
        a.click();
      }
      setUserNotification("Quiz link copied & image downloaded!");
    } catch (err) {
      console.error(err);
      setUserNotification("Sharing cancelled or unavailable.");
    } finally {
      setIsGeneratingShareImage(false);
    }
  };

  // --- SPEECH TTS SYNTHESIS FOR AI RESPONSES ---
  const handleTTSPlayback = (text: string, id: string) => {
    if (speechActiveId === id) {
      window.speechSynthesis.cancel();
      setSpeechActiveId(null);
    } else {
      window.speechSynthesis.cancel();
      // Remove LaTeX and Markdown artifacts from text for clear speaking
      const cleanString = cleanTextForSpeech(text);
      const utterance = new SpeechSynthesisUtterance(cleanString);
      utterance.onend = () => setSpeechActiveId(null);
      utterance.onerror = () => setSpeechActiveId(null);
      setSpeechActiveId(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- DOWNLOAD RESPONSE TEXT DRAFT AS TXT ---
  const handlePDFDownload = (text: string) => {
    const rawContent = text.replace(/[#*`\$\(\)\[\]\\_]/g, '');
    const blob = new Blob([`NSG OMNI STUDY DRAFT REPORT\n=========================\n\n${rawContent}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NSG_Study_Draft_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setUserNotification("Study Draft exported successfully!");
  };

  // --- TRANSFORMATION STYLE HANDLER ---
  const handleStyleTransmute = async (originalText: string, instruction: string) => {
    const styledPrompt = `Can you rewrite or format this response in this style: "${instruction}"?\n\nOriginal Text:\n"""\n${originalText}\n"""`;
    await handleSendMessage(styledPrompt);
  };

  const transcribeAttachment = async (att: { name: string, type: string, url: string }) => {
    try {
      if (!att.url) return "";
      const res = await fetch(att.url);
      const blob = await res.blob();
      const mimeType = blob.type || att.type || '';
      
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const b64 = (reader.result as string).split(',')[1];
          resolve(b64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const aiInstance = getAiInstance();
      const prompt = `You are an expert Google 3.1 Flash academic transcriber. 
Please extract and transcribe all visible academic text, spoken words, content, diagrams, formulas, equations, or information from this file named "${att.name}". 
Provide a highly detailed, clean, precise transcription. Return ONLY the transcribed content and findings.`;

      const response = await aiInstance.models.generateContent({
        model: FLASH_MODEL,
        contents: [
          { role: 'user', parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType: mimeType } }
          ] }
        ]
      });

      return `\n\n--- EXTRACTED TRANSCRIPTION FROM ATTACHMENT "${att.name}" (${att.type}) ---\n${response.text || ''}\n`;
    } catch (e) {
      console.error("Transcription error on attachment:", att.name, e);
      return `\n\n[Failed to extract content from attachment "${att.name}"]\n`;
    }
  };

  const buildFallbackQuizQuestions = (topicName: string, countNum: number) => {
    const rawTopic = topicName.trim() || "General Knowledge";
    const numQuestions = Math.max(1, countNum || 5);
    const lowerTopic = rawTopic.toLowerCase();
    
    // Check if any quiz documents or imported note have extracted text
    let aggregatedDocText = "";
    if (quizDocuments && quizDocuments.length > 0) {
      quizDocuments.forEach(doc => {
        if (doc.extractedText && doc.extractedText.trim().length > 20) {
          aggregatedDocText += doc.extractedText.trim() + "\n\n";
        }
      });
    }
    if (importedQuizNote && importedQuizNote.content && importedQuizNote.content.trim().length > 20) {
      aggregatedDocText += importedQuizNote.content.trim() + "\n\n";
    }

    if (aggregatedDocText.length > 30) {
      const sentences = aggregatedDocText
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 25 && !s.toLowerCase().startsWith('http'));

      if (sentences.length >= 2) {
        const qList = [];
        for (let i = 0; i < numQuestions; i++) {
          const sentence = sentences[i % sentences.length];
          const words = sentence.split(/\s+/).filter(w => w.length > 3);
          const keyTerm = words.find(w => w.length > 5) || words[0] || "this topic";
          qList.push({
            question: `Q${i + 1}. In the context of ${keyTerm}, which statement accurately reflects the core principle: "${sentence.slice(0, 110)}..."?`,
            options: [
              `${sentence.slice(0, 95)}`,
              `It contradicts empirical observations established in ${keyTerm}`,
              `This principle applies exclusively to non-standard theoretical edge cases`,
              `It is invalidated by contrary hypotheses in modern analysis`
            ],
            correctAnswer: 0,
            explanation: `Based on fundamental concepts of ${keyTerm}: "${sentence}"`
          });
        }
        return qList;
      }
    }

    // 1. STATISTICAL & MATHEMATICAL DOMAIN
    const isStatisticsOrMath = /skewness|kurtosis|central\s*tendency|median|mode|probability|mean|variance|standard\s*deviation|statistics|math|calculus|algebra|distribution|frequency/i.test(lowerTopic);

    if (isStatisticsOrMath) {
      const mathQuestionBank = [
        {
          q: "Given the dataset: $[4, 8, 12, 12, 16, 20, 24]$, what is the median and mode of this distribution?",
          opts: [
            "Median = 12, Mode = 12",
            "Median = 14, Mode = 12",
            "Median = 12, Mode = 16",
            "Median = 16, Mode = 12"
          ],
          ans: 0,
          exp: "Arranging in ascending order: 4, 8, 12, 12, 16, 20, 24 (n = 7). The middle value (4th element) is 12. The most frequent value is 12."
        },
        {
          q: "A distribution has a mean of 60, a median of 54, and a standard deviation of 8. What is Karl Pearson's coefficient of skewness ($S_k$)?",
          opts: [
            "$S_k = +2.25$",
            "$S_k = +0.75$",
            "$S_k = -2.25$",
            "$S_k = +1.50$"
          ],
          ans: 0,
          exp: "Pearson's Skewness formula is $S_k = \\frac{3(\\text{Mean} - \\text{Median})}{\\sigma} = \\frac{3(60 - 54)}{8} = \\frac{18}{8} = +2.25$ (positively skewed)."
        },
        {
          q: "A standard fair 6-sided die is rolled twice. What is the probability of obtaining a sum equal to 7?",
          opts: [
            "$\\frac{1}{6}$",
            "$\\frac{1}{12}$",
            "$\\frac{7}{36}$",
            "$\\frac{5}{36}$"
          ],
          ans: 0,
          exp: "Total outcomes = $6 \\times 6 = 36$. Favorable pairs summing to 7 are: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 pairs. $P(\\text{Sum}=7) = \\frac{6}{36} = \\frac{1}{6}$."
        },
        {
          q: "If the coefficient of kurtosis (excess kurtosis $\\gamma_2 = \\beta_2 - 3$) for a distribution is equal to 0, what is the geometric nature of the peak?",
          opts: [
            "Mesokurtic (identical peak to a Normal distribution)",
            "Leptokurtic (sharper, heavy-tailed peak)",
            "Platykurtic (flatter, light-tailed distribution)",
            "Asymmetric U-shaped distribution"
          ],
          ans: 0,
          exp: "A normal distribution has $\\beta_2 = 3$ and excess kurtosis $\\gamma_2 = 0$, which is termed Mesokurtic."
        },
        {
          q: "For a moderately skewed frequency distribution, which empirical formula accurately models the relationship between Mean, Median, and Mode?",
          opts: [
            "$\\text{Mode} \\approx 3(\\text{Median}) - 2(\\text{Mean})$",
            "$\\text{Mode} \\approx 2(\\text{Median}) - 3(\\text{Mean})$",
            "$\\text{Median} \\approx 3(\\text{Mean}) - \\text{Mode}$",
            "$\\text{Mean} \\approx 3(\\text{Mode}) - 2(\\text{Median})$"
          ],
          ans: 0,
          exp: "The standard empirical approximation for unimodal moderately skewed distributions is: $\\text{Mode} \\approx 3(\\text{Median}) - 2(\\text{Mean})$."
        },
        {
          q: "Calculate the arithmetic mean and variance of the sample values: $[2, 4, 6, 8, 10]$.",
          opts: [
            "Mean = 6, Sample Variance ($s^2$) = 10",
            "Mean = 6, Sample Variance ($s^2$) = 8",
            "Mean = 5, Sample Variance ($s^2$) = 10",
            "Mean = 6, Sample Variance ($s^2$) = 20"
          ],
          ans: 0,
          exp: "Mean = $\\frac{2+4+6+8+10}{5} = 6$. Deviations: $(-4)^2 + (-2)^2 + 0^2 + 2^2 + 4^2 = 16+4+0+4+16 = 40$. Sample variance $s^2 = \\frac{40}{5-1} = 10$."
        },
        {
          q: "In a negatively skewed (left-skewed) distribution, what is the typical ordering of the three measures of central tendency?",
          opts: [
            "$\\text{Mean} < \\text{Median} < \\text{Mode}$",
            "$\\text{Mode} < \\text{Median} < \\text{Mean}$",
            "$\\text{Median} < \\text{Mean} < \\text{Mode}$",
            "$\\text{Mean} = \\text{Median} = \\text{Mode}$"
          ],
          ans: 0,
          exp: "In negatively skewed distributions, extreme small values pull the Mean to the far left, resulting in $\\text{Mean} < \\text{Median} < \\text{Mode}$."
        },
        {
          q: "Two independent events $A$ and $B$ have probabilities $P(A) = 0.4$ and $P(B) = 0.5$. What is $P(A \\cup B)$?",
          opts: [
            "$0.70$",
            "$0.90$",
            "$0.20$",
            "$0.50$"
          ],
          ans: 0,
          exp: "$P(A \\cap B) = P(A) \\times P(B) = 0.4 \\times 0.5 = 0.20$. By the addition rule: $P(A \\cup B) = P(A) + P(B) - P(A \\cap B) = 0.4 + 0.5 - 0.2 = 0.70$."
        }
      ];

      const qList = [];
      for (let i = 0; i < numQuestions; i++) {
        const item = mathQuestionBank[i % mathQuestionBank.length];
        qList.push({
          question: `Q${i + 1}. ${item.q}`,
          options: item.opts,
          correctAnswer: item.ans,
          explanation: item.exp
        });
      }
      return qList;
    }

    // 2. GENERAL ACADEMIC DOMAINS (Cleanly extract 1-3 core subject terms)
    const cleanSubject = rawTopic
      .replace(/quiz|exam|test|questions?|generate|mathematically|solvable/gi, '')
      .trim() || rawTopic;

    const academicQuestionBank = [
      {
        q: `What is the fundamental mechanism defining "${cleanSubject}"?`,
        opts: [
          `A systematic set of principles and verifiable analytical foundations`,
          `Purely arbitrary subjective speculation without experimental backing`,
          `Static historical definitions inapplicable to contemporary analysis`,
          `Unregulated assumptions lacking reproducible empirical standards`
        ],
        ans: 0,
        exp: `The study of ${cleanSubject} is structured upon systematic principles and verifiable foundational models.`
      },
      {
        q: `Which analytical method is most effective when evaluating core principles of ${cleanSubject}?`,
        opts: [
          `Quantitative and qualitative empirical modeling with baseline controls`,
          `Disregarding variance and rejecting verified benchmarks`,
          `Relying on unverified heuristics without formal proof`,
          `Isolating variables without testing boundary conditions`
        ],
        ans: 0,
        exp: `Rigorous analysis in ${cleanSubject} utilizes empirical modeling, comparative benchmarks, and validated controls.`
      },
      {
        q: `How do practitioners systematically address anomalies in ${cleanSubject}?`,
        opts: [
          `By isolating contributing factors, testing boundary constraints, and refining models`,
          `By immediately discarding baseline data without investigation`,
          `By assuming anomalies represent standard behavior`,
          `By eliminating statistical rigor and relying solely on conjecture`
        ],
        ans: 0,
        exp: `Resolving anomalies in ${cleanSubject} requires isolating variables, examining edge cases, and updating foundational models.`
      },
      {
        q: `What primary metric is evaluated to verify operational success in ${cleanSubject}?`,
        opts: [
          `Consistency, reproducibility, and alignment with theoretical standards`,
          `Random correlation without causal evidence`,
          `Subjective consensus without empirical measurements`,
          `Minimization of experimental controls`
        ],
        ans: 0,
        exp: `Success criteria in ${cleanSubject} depend on verifiable reproducibility, consistency, and structural alignment.`
      },
      {
        q: `When synthesizing complex concepts within ${cleanSubject}, what is the recommended procedure?`,
        opts: [
          `Decompose the problem into core components and analyze interdependencies`,
          `Apply arbitrary assumptions to unmeasured variables`,
          `Ignore foundational relationships between sub-systems`,
          `Rely on isolated single-point observations`
        ],
        ans: 0,
        exp: `Synthesizing concepts in ${cleanSubject} starts with systematic decomposition of variables and evaluating their interactions.`
      }
    ];

    const qList = [];
    for (let i = 0; i < numQuestions; i++) {
      const tmpl = academicQuestionBank[i % academicQuestionBank.length];
      qList.push({
        question: `Q${i + 1}. ${tmpl.q}`,
        options: tmpl.opts,
        correctAnswer: tmpl.ans,
        explanation: tmpl.exp
      });
    }
    return qList;
  };

  const generateQuiz = async (
    customTopic?: string | React.MouseEvent<any>, 
    customCount?: number, 
    customDifficulty?: "Easy" | "Medium" | "Hard" | "Professional",
    forceNew?: boolean,
    customAnswerType?: 'multiple_choice' | 'true_false' | 'single_choice' | string[]
  ): Promise<{ success: boolean; quizId?: string; topic?: string; count?: number; error?: string }> => {
    const realTopic = (customTopic && typeof customTopic !== 'string') ? undefined : customTopic as string | undefined;
    const realCount = (customTopic && typeof customTopic !== 'string') ? undefined : customCount;
    const realDifficulty = (customTopic && typeof customTopic !== 'string') ? undefined : customDifficulty;
    const activeAnswerType = customAnswerType || quizAnswerTypes || [quizAnswerType || 'multiple_choice'];

    console.log("Starting Quiz Generation...", { realTopic, realCount, realDifficulty, forceNew, activeAnswerType });
    if (isGeneratingQuiz) return { success: false, error: "A quiz is already generating." };
    if (!user) {
      setShowAuthModal(true);
      return { success: false, error: "User authentication required." };
    }

    const isOwner = user?.email?.toLowerCase().trim() === 'nuellkelechi@gmail.com';
    const userIsPremium = isPremium || isOwner;

    if (!userIsPremium && dailyQuizUsedCount >= 7) {
      setUserNotification("subscribe for premium to panswer quiz");
      setActiveTab('premium');
      return { success: false, error: "Quiz limit reached (7/7)." };
    }

    const activeTopic = (realTopic !== undefined ? realTopic : quizTopic) || (importedQuizNote ? importedQuizNote.title : "") || "General Knowledge Assessment";
    const activeCount = realCount !== undefined ? realCount : quizQuestionCount;
    const activeDifficulty = realDifficulty !== undefined ? realDifficulty : quizDifficulty;

    const isExplicitTrigger = customTopic !== undefined || forceNew === true;
    if (!forceNew && !isExplicitTrigger && activeTopic.trim().length > 0) {
      // Prevent sitting for a quiz twice by checking finishedHistory
      const alreadyCompleted = finishedHistory.some(h => 
        h.type === 'quiz' && 
        (h.progress === 100 || h.score !== undefined) && 
        h.title && 
        h.title.trim().length > 0 &&
        (h.title.toLowerCase().trim() === activeTopic.toLowerCase().trim() || 
         (importedQuizNote && importedQuizNote.title && h.title.toLowerCase().trim() === importedQuizNote.title.toLowerCase().trim()))
      );

      if (alreadyCompleted) {
        setUserNotification("You have already completed this quiz. Please choose a different topic or note to study next!");
        return { success: false, error: "Quiz already completed previously." };
      }
    }

    if (realTopic !== undefined) setQuizTopic(realTopic);
    if (realCount !== undefined) setQuizQuestionCount(realCount);
    if (realDifficulty !== undefined) setQuizDifficulty(realDifficulty);

    const limits = isPremium ? LIMITS.QUIZ.PREMIUM : LIMITS.QUIZ.NORMAL;
    const wordCount = activeTopic.split(/\s+/).filter(Boolean).length;
    const maxWords = importedQuizNote ? Math.max(5000, limits.WORDS) : limits.WORDS;
    if (wordCount > maxWords) {
      const errMsg = `Prompt limit reached: ${importedQuizNote ? 'Note quizzes' : (isPremium ? 'Premium' : 'Free')} can only support up to ${maxWords} words per prompt.`;
      setUserNotification(errMsg);
      return { success: false, error: errMsg };
    }

    if (activeCount <= 0) {
      const errMsg = "Please enter a valid number of questions.";
      setUserNotification(errMsg);
      return { success: false, error: errMsg };
    }

    if (activeCount > 20 && !isPremium && currentUserData?.role !== 'admin' && !currentUserData?.bypassAllPayments) {
      setUserNotification("Generating 30 or 50 questions is a Premium feature! Please upgrade to unlock 50-question quizzes.");
      setActiveTab('premium');
      return { success: false, error: "50 questions requires Premium." };
    }

    const canProceed = await checkAndIncrementUsage('QUIZ');
    if (!canProceed) {
      setUserNotification("Daily quiz usage limit reached. Please upgrade to Premium or try again tomorrow!");
      return { success: false, error: "Usage limit reached." };
    }

    // Switch view to Quiz tab immediately
    setActiveTab('tools');
    setToolsSubTab('quiz');
    setSelectedChatForRoom(null);
    setIsChatRoomActive(false);
    setIsGeneratingQuiz(true);
    setQuizState('idle');

    try {
      const aiInstance = getAiInstance();
      const photoImageParts = await Promise.all(quizImages.map(async (img) => {
        if (img.file) {
          return fileToGenerativePart(img.file);
        } else if (img.url) {
          try {
            const res = await fetch(img.url);
            const blob = await res.blob();
            const base64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
            return { inlineData: { data: base64Data, mimeType: blob.type || 'image/png' } };
          } catch (e) {
            console.error("Error loading image from URL:", e);
            return null;
          }
        }
        return null;
      }));

      // Gather PDF page rendered images (up to 20 images total for vision context)
      const docPdfImageParts: any[] = [];
      let docPageImgCount = 0;
      for (const doc of quizDocuments) {
        if (doc.pageImages && doc.pageImages.length > 0) {
          for (const pageDataUrl of doc.pageImages) {
            if (docPageImgCount >= 20) break;
            const b64 = pageDataUrl.split(',')[1];
            if (b64) {
              docPdfImageParts.push({ inlineData: { data: b64, mimeType: 'image/jpeg' } });
              docPageImgCount++;
            }
          }
        }
      }

      const validImageParts = [...photoImageParts.filter(Boolean), ...docPdfImageParts];

      let promptContext = "";

      // Include text content from uploaded PDF / Doc files
      if (quizDocuments.length > 0) {
        quizDocuments.forEach((doc, idx) => {
          if (doc.extractedText && doc.extractedText.trim().length > 0) {
            promptContext += `\n--- ATTACHED STUDY DOCUMENT ${idx + 1}: "${doc.name}" ---\n${doc.extractedText.trim()}\n--- END OF DOCUMENT ${idx + 1} ---\n\n`;
          }
        });
      }

      if (importedQuizNote) {
        let noteContent = importedQuizNote.content || "";
        if (importedQuizNote.attachments && importedQuizNote.attachments.length > 0) {
          setUserNotification("Transcribing image/audio/document attachments using Google 3.1 Flash...");
          const transcriptions = await Promise.all(
            importedQuizNote.attachments.map((att: any) => transcribeAttachment(att))
          );
          noteContent += "\n\n" + transcriptions.join("\n");
        }
        promptContext += `Analyze the imported student study note titled "${importedQuizNote.title}" with the following content (including extracted transcriptions of attached materials):\n"""\n${noteContent}\n"""\n\n`;
      }
      
      const hasTextPrompt = activeTopic.trim().length > 0;
      const hasImages = validImageParts.length > 0;
      const hasDocs = quizDocuments.length > 0;

      if (hasDocs && hasTextPrompt && hasImages) {
        promptContext += `MANDATORY MULTI-SOURCE REQUIREMENT: Synthesize the academic topics and concepts from the user's prompt ("${activeTopic}"), the provided document text, and visual diagrams. Test the student directly on these educational topics.\n\n`;
      } else if (hasDocs && hasTextPrompt) {
        promptContext += `MANDATORY DUAL-SOURCE REQUIREMENT: Generate all ${activeCount} quiz questions testing the core academic topics, principles, and concepts contained in both the user's prompt ("${activeTopic}") and the provided study document(s) (${quizDocuments.map(d => `"${d.name}"`).join(', ')}).
- Use the actual facts, equations, principles, and theories in the document as the factual foundation.
- Test the student directly on the subject matter, not on the document itself.\n\n`;
      } else if (hasDocs && hasImages) {
        promptContext += `MANDATORY TOPIC TEST REQUIREMENT: Generate all ${activeCount} quiz questions testing the academic principles, diagrams, formulas, and topics contained in the attached study materials.\n\n`;
      } else if (hasDocs) {
        promptContext += `MANDATORY TOPIC TEST REQUIREMENT: Generate all ${activeCount} quiz questions based directly on the academic subject matter, principles, formulas, definitions, and topics taught in the study document(s) (${quizDocuments.map(d => `"${d.name}"`).join(', ')}).
- Test the student on the educational subject matter itself (the science, math, laws, theories, or historical facts).
- NEVER frame questions around the document file (do NOT say "According to the PDF", "In the attached text", or "The document mentions").\n\n`;
      } else if (hasTextPrompt && hasImages) {
        promptContext += `MANDATORY MULTI-SOURCE REQUIREMENT: You MUST generate the ${activeCount} quiz questions by synthesizing user instructions ("${activeTopic}") and visual image materials provided.\n\n`;
      } else if (hasTextPrompt) {
        if (importedQuizNote) {
          promptContext += `Integrate the note context above with the user's specific text instructions/topic: "${activeTopic}".\n\n`;
        } else {
          promptContext += `The questions must strictly cover and test the user's requested topic/context: "${activeTopic}".\n\n`;
        }
      } else if (hasImages) {
        promptContext += `You must analyze the attached image(s) to generate relevant academic questions based strictly on the subject matter, text, equations, diagrams, and educational context shown in them.\n\n`;
      }

      const activeTypes = Array.isArray(activeAnswerType)
        ? activeAnswerType
        : [activeAnswerType];

      let answerTypeInstructions = "";
      if (activeTypes.length > 1) {
        answerTypeInstructions = `CRITICAL ANSWER TYPE FORMAT (MIXED OPTION TYPES): This quiz MUST include a varied combination of the following question option types: ${activeTypes.join(', ')}.
- For True/False questions: the "options" array MUST be strictly ["True", "False"], and "correctAnswer" MUST be 0 (True) or 1 (False).
- For Single Choice questions: the "options" array MUST contain exactly 2 distinct options: ["Option 1", "Option 2"], and "correctAnswer" MUST be 0 or 1.
- For Multiple Choice questions: the "options" array MUST contain exactly 4 options: ["Option A", "Option B", "Option C", "Option D"], and "correctAnswer" MUST be 0, 1, 2, or 3.
Ensure these selected question types are distributed throughout the quiz questions.`;
      } else {
        const singleType = activeTypes[0] || 'multiple_choice';
        if (singleType === 'true_false') {
          answerTypeInstructions = `CRITICAL ANSWER TYPE FORMAT (TRUE / FALSE): Every single question MUST be a True/False question. The "options" array for EVERY question MUST be strictly ["True", "False"], and "correctAnswer" MUST be 0 (True) or 1 (False).`;
        } else if (singleType === 'single_choice') {
          answerTypeInstructions = `CRITICAL ANSWER TYPE FORMAT (SINGLE CHOICE - 2 OPTIONS): Every single question MUST have exactly 2 distinct options: ["Option 1", "Option 2"], and "correctAnswer" MUST be 0 or 1.`;
        } else {
          answerTypeInstructions = `CRITICAL ANSWER TYPE FORMAT (MULTIPLE CHOICE - 4 OPTIONS): Every single question MUST have exactly 4 options: ["Option A", "Option B", "Option C", "Option D"], and "correctAnswer" MUST be 0, 1, 2, or 3.`;
        }
      }

      const prompt = `
        You are an expert university professor and exam creator.
        Generate an authentic, high-quality, ${activeCount}-question academic quiz directly following the user's instructions, topics, and problem constraints below:

        ${promptContext}

        ${answerTypeInstructions}

        CRITICAL DIRECTIVES ON FOLLOWING USER INTENT:
        1. DEEP ACADEMIC TOPIC PARSING (NEVER REPEAT PROMPT AS A META-QUESTION):
           - The user's input specifies the ACADEMIC TOPICS, PROBLEM TYPES, and CONSTRAINTS to test.
           - NEVER generate meta-questions asking about the user's prompt (e.g. NEVER ask "Which approach represents best practice when applying [prompt]?", "What is the primary core concept behind [prompt]?").
           - NEVER quote or parrot the user's instructions into the question stems.

        2. MATHEMATICAL, STATISTICAL & QUANTITATIVE COMPUTATIONS:
           - If the user requests mathematically solvable questions, calculations, equations, physics, science, or statistics (e.g. skewness, kurtosis, central tendency, median, mode, probability, mean, variance, standard deviation, hypothesis testing, calculus, algebra):
             * You MUST formulate REAL, SOLVABLE computational problems containing concrete numbers, sample datasets, probability distributions, matrices, or formulas.
             * The student MUST be able to calculate and determine the exact correct numerical value.
             * Examples of required question types:
               - "Given the data values: $[3, 7, 8, 8, 12, 14, 18]$, calculate the interquartile range (IQR) and sample mean."
               - "A frequency distribution has a Mean of 65, a Median of 60, and a Standard Deviation of 10. Compute Karl Pearson's coefficient of skewness ($S_k$)."
               - "If $X \\sim \\text{Binomial}(n=10, p=0.3)$, what is the exact probability $P(X = 2)$?"
               - "For a sample with $\\sum x = 120$ and $\\sum x^2 = 1800$ where $n = 10$, what is the sample variance ($s^2$)?"
           - Format ALL mathematical symbols, variables, equations, fractions, and Greek letters using valid standard LaTeX wrapped in single dollar delimiters $ ... $ (e.g., $S_k = \\frac{3(\\text{Mean} - \\text{Median})}{\\sigma}$, $P(A \\cap B)$, $\\mu = 24.5$, $\\sigma^2 = 16$).
           - Ensure backslashes are properly escaped in JSON.

        3. ACCURACY & EXPLANATIONS:
           - Difficulty Level: ${activeDifficulty}.
           - Ensure exactly one option is mathematically and factually correct.
           - The other options must be plausible common calculation pitfalls or distractors.
           - In the "explanation" field, provide step-by-step mathematical working or conceptual derivation explaining how the correct answer is computed.

        4. TESTING TOPICS IN DOCUMENTS (NO META-QUESTIONS ABOUT THE FILE):
           - When study materials, notes, or documents are provided, extract and test the academic concepts, definitions, formulas, theories, and principles taught inside them.
           - NEVER ask questions about the document itself (e.g., NEVER say "According to the uploaded document", "In the attached PDF", "What does the author state in section 2?").
           - Frame every question as an authentic subject test on the material itself.

        5. INDEPENDENCE:
           - All questions and options must be completely self-contained and answerable without referring to external attachments or external images.

        Return ONLY a valid JSON object with this exact structure:
        {
          "quizTitle": "A concise 2 to 5 word academic subject title (e.g., 'Statistics & Probability Problems', 'Measures of Central Tendency', 'Descriptive Statistics')",
          "questions": [
            {
              "question": "string (the actual test problem with numbers/dataset/scenario)",
              "options": ["string", "string", "string", "string"],
              "correctAnswer": number (0-3),
              "explanation": "Step-by-step mathematical calculation or conceptual derivation."
            }
          ]
        }
      `;

      const contentsParts: any[] = [{ text: prompt }];
      validImageParts.forEach(part => {
        if (part && part.inlineData) {
          contentsParts.push({ inlineData: part.inlineData });
        }
      });

      const askGemini = async () => {
        try {
          const res = await aiInstance.models.generateContent({
            model: FLASH_MODEL,
            contents: [{ role: 'user', parts: contentsParts }],
            config: {
              responseMimeType: "application/json"
            }
          });
          return res?.text || null;
        } catch (e) {
          console.warn("Gemini primary quiz generation error, attempting fallback lite/flash model:", e);
          try {
            const resFallback = await aiInstance.models.generateContent({
              model: "gemini-2.5-flash",
              contents: [{ role: 'user', parts: contentsParts }],
              config: {
                responseMimeType: "application/json"
              }
            });
            return resFallback?.text || null;
          } catch (e2) {
            console.warn("Gemini secondary quiz generation error:", e2);
            return null;
          }
        }
      };

      const askOpenRouter = async () => {
        return await callOpenRouter(prompt, OPENROUTER_MODELS.TEXT_PRO);
      };

      const askTogether = async () => {
        return await callTogetherAI(prompt);
      };

      const askLocalQwen = async () => {
        try {
          return await runLocalQwenInference({
            prompt: prompt,
            responseMimeType: "application/json"
          });
        } catch (e) {
          console.warn("Local Qwen quiz generation error:", e);
          return null;
        }
      };

      let responseText = "";
      const isDeviceOffline = !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine);

      if (isDeviceOffline) {
        if (!isOmniBrainDownloaded()) {
          console.warn("⚠️ Offline quiz generation requested but Qwen model is not downloaded yet.");
          setUserNotification(OFFLINE_MODEL_NOT_DOWNLOADED_MSG);
          setIsGeneratingQuiz(false);
          return { success: false, error: OFFLINE_MODEL_NOT_DOWNLOADED_MSG };
        }

        try {
          console.log("⚡ Device offline: Generating quiz via on-device Qwen model (zero network calls)...");
          responseText = await askLocalQwen() || "";
        } catch (localErr: any) {
          console.error("Local Qwen error during quiz generation:", localErr);
          setUserNotification(`Offline AI Quiz Error: ${localErr?.message || "Local inference error"}`);
        }
      }

      if (!responseText) {
        responseText = await askGemini() || await askTogether() || await askOpenRouter() || (isOmniBrainDownloaded() ? await askLocalQwen() : null) || "{}";
      }
      let data = robustJSONParse(responseText);

      const docTitles = quizDocuments.map(d => d.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")).join(" & ");
      const defaultFallbackTopic = docTitles || (importedQuizNote ? importedQuizNote.title : "Study Material Quiz");
      const finalQuizTopic = (data && data.quizTitle) || activeTopic.trim() || defaultFallbackTopic;

      let questionsToUse = (data && Array.isArray(data.questions) && data.questions.length > 0) 
        ? data.questions 
        : buildFallbackQuizQuestions(finalQuizTopic, activeCount);

      const genId = `quiz-gen-${Date.now()}`;
      setQuizTopic(finalQuizTopic);
      setQuizQuestions(questionsToUse);
      setCurrentQuestionIndex(0);
      setQuizScore(0);
      setUserQuizAnswers([]);
      setQuizState('preview');
      setSelectedOption(null);
      setIsAnswered(false);
      setCurrentQuizId(genId);

      updatePageMeta(`Quiz: ${finalQuizTopic}`, `Take this ${questionsToUse.length}-question interactive quiz on Omni!`);

      // Auto Capture: Add to history immediately when generated (persisted to localStorage)
      const historyItem: HomeHistoryItem = {
        id: genId,
        title: finalQuizTopic,
        type: 'quiz',
        date: new Date().toLocaleDateString(),
        timestamp: Date.now(),
        progress: 0,
        questions: questionsToUse,
        topic: finalQuizTopic,
        difficulty: activeDifficulty
      };
      addToFinishedHistory(historyItem);

      // Only perform Firestore and cloud activity synchronization when online (Zero network calls when offline)
      if (!isDeviceOffline) {
        const cleanGenId = genId.replace(/^quiz-/, '');
        const autoQuizPayload = {
          questions: questionsToUse,
          topic: finalQuizTopic,
          difficulty: activeDifficulty || 'Medium',
          createdBy: user?.uid || 'anonymous',
          createdAt: new Date().toISOString()
        };
        Promise.all([
          setDoc(doc(db, 'quizzes', genId), autoQuizPayload, { merge: true }),
          setDoc(doc(db, 'quizzes', cleanGenId), autoQuizPayload, { merge: true })
        ]).catch(err => console.error("Error auto-saving generated quiz to Firestore:", err));

        if (user) {
          const finalTopic = activeTopic || finalQuizTopic || 'Visual Materials Quiz';
          const nameHandle = currentUserData?.username || currentUserData?.displayName || 'Scholar';
          addDoc(collection(db, 'activities'), {
            type: 'quiz_generated',
            text: `${nameHandle} generated a quiz on "${finalTopic}", try yours!`,
            username: nameHandle,
            userId: user.uid,
            userPhoto: currentUserData?.photoURL || '',
            timestamp: serverTimestamp() || new Date(),
            topic: finalTopic
          }).catch((err) => console.error("Error saving global activity:", err));
        }
      }

      return {
        success: true,
        quizId: genId,
        topic: finalQuizTopic,
        count: questionsToUse.length
      };
    } catch (error: any) {
      if (checkIsQuotaError(error)) {
        triggerQuotaErrorModal();
      }
      console.error("Quiz Generation Error, falling back to offline practice quiz:", error);
      setUserNotification(`Quiz Generation Error: ${error?.message || "Failed to generate quiz from online AI. Generating from local practice generator."}`);
      const docTitles = quizDocuments.map(d => d.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")).join(" & ");
      const finalQuizTopic = activeTopic.trim() || docTitles || (importedQuizNote ? importedQuizNote.title : "Practice Quiz");
      const fallbackQuestions = buildFallbackQuizQuestions(finalQuizTopic, activeCount);
      const genId = `quiz-gen-${Date.now()}`;

      setQuizTopic(finalQuizTopic);
      setQuizQuestions(fallbackQuestions);
      setCurrentQuestionIndex(0);
      setQuizScore(0);
      setUserQuizAnswers([]);
      setQuizState('preview');
      setSelectedOption(null);
      setIsAnswered(false);
      setCurrentQuizId(genId);

      return {
        success: true,
        quizId: genId,
        topic: finalQuizTopic,
        count: fallbackQuestions.length
      };
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const generateDynamicExam = async () => {
    if (isGeneratingQuiz) return;
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!quizTopic.trim()) {
      setUserNotification("Please enter a topic first.");
      return;
    }

    if (quizQuestionCount <= 0) {
      setUserNotification("Please enter a valid number of questions.");
      return;
    }

    const canProceed = await checkAndIncrementUsage('QUIZ');
    if (!canProceed) return;

    setIsGeneratingQuiz(true);
    
    try {
      const prompt = `
        Generate a ${quizQuestionCount}-question professional multiple choice examination about "${quizTopic}".
        Difficulty Level: ${quizDifficulty}.
        
        CRITICAL FOR MATH & SCIENTIFIC TOPICS:
        - For ALL mathematical expressions, formulas, vectors, and scientific notations in BOTH questions AND options, ALWAYS wrap them in standard LaTeX notation enclosed in $ ... $ delimiters.
        - Example options: ["$2\\hat{i} + 3\\hat{j}$", "$-2\\hat{i} + 3\\hat{j}$", "$2^2 = 4$", "$\\pi r^2$"].
        - Use standard LaTeX backslashes (e.g., \\hat{i}, \\vec{v}, \\frac{1}{2}, \\sqrt{x}). NEVER write forward slashes like /hat/I or /vec/v.
        - NEVER leave raw symbols like ^ or _ outside of LaTeX delimiters. Ensure all backslashes are properly escaped for JSON.
        
        Return ONLY a JSON object with this structure:
        {
          "questions": [
            {
              "question": "string",
              "options": ["string", "string", "string", "string"],
              "correctAnswer": number (0-3),
              "explanation": "Detailed breakdown using LaTeX. CRITICAL: Provide a comprehensive explanation that covers why the correct answer is right and also why the incorrect options are wrong."
            }
          ]
        }
      `;

      const aiInstance = getAiInstance();
      const response = await aiInstance.models.generateContent({
        model: FLASH_MODEL,
        contents: { parts: [{ text: prompt }] },
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL }
        }
      });

      const data = robustJSONParse(response?.text || "{}");
      if (data && data.questions) {
        const examQs = data.questions.map((q: any, i: number) => ({
          ...q,
          id: `dyn-q-${Date.now()}-${i}`
        }));
        setExamQuestions(examQs);
        setExamLobbyState('exam');
        setUserNotification("Dynamic Course Exam Generated!");
      }
    } catch (err) {
      console.error("Exam Gen Error:", err);
      setUserNotification("Failed to generate dynamic exam.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleHistoryItemClick = async (item: HomeHistoryItem) => {
    setHistoryLoadingModal({
      show: true,
      title: item.title || item.type.toUpperCase(),
      message: `Restoring your ${item.type} session and locking interface...`
    });
    try {
      await new Promise(r => setTimeout(r, 650));
      if (item.type === 'quiz') {
        const cleanId = item.id.replace(/^quiz-/, '');
        const progressKey = (cleanId === 'current-quiz' || item.id === 'current-quiz') ? 'nsg_current_quiz_progress' : `nsg_quiz_progress_${cleanId}`;
        const localProgress = safeStorage.getItem(progressKey) || safeStorage.getItem(`nsg_quiz_progress_${item.id}`) || safeStorage.getItem('nsg_current_quiz_progress');
        if (localProgress) {
          try {
            const p = JSON.parse(localProgress);
            if (p.quizQuestions && Array.isArray(p.quizQuestions) && p.quizQuestions.length > 0) {
              const restoredIdx = p.currentQuestionIndex !== undefined ? p.currentQuestionIndex : 0;
              setQuizQuestions(p.quizQuestions);
              setQuizTopic(p.quizTopic || item.title || "Study Quiz");
              setCurrentQuestionIndex(restoredIdx);
              setQuizScore(p.quizScore || 0);
              setUserQuizAnswers(p.userQuizAnswers || []);
              setQuizDifficulty(p.quizDifficulty || 'Medium');
              setQuizQuestionCount(p.quizQuestionCount || p.quizQuestions.length);
              setCurrentQuizId(p.currentQuizId || item.id);
              setQuizState(p.quizState || 'active');
              setSelectedOption(p.userQuizAnswers?.[restoredIdx] !== undefined ? p.userQuizAnswers[restoredIdx] : null);
              setIsAnswered(p.userQuizAnswers?.[restoredIdx] !== undefined);
              setActiveTab('tools');
              setToolsSubTab('quiz');
              setUserNotification("🔄 Restored saved quiz progress!");
              return;
            }
          } catch (e) {
            console.error("Failed to restore history quiz progress:", e);
          }
        }

        const itemQuestions = item.questions || (item.data && item.data.questions);
        if (itemQuestions && Array.isArray(itemQuestions) && itemQuestions.length > 0) {
          setQuizQuestions(itemQuestions);
          setQuizTopic(item.topic || item.title || "Study Quiz");
          setQuizDifficulty((item.difficulty as any) || 'Medium');
          setQuizQuestionCount(itemQuestions.length);
          setCurrentQuizId(item.id);

          if (item.score !== undefined && item.progress === 100) {
            setQuizScore(item.score);
            setQuizState('finished');
            setUserQuizAnswers(item.answers || []);
          } else {
            let restoredIdx = 0;
            if ((item as any).currentQuestionIndex !== undefined && (item as any).currentQuestionIndex < itemQuestions.length) {
              restoredIdx = (item as any).currentQuestionIndex;
            } else if (item.answers && Array.isArray(item.answers) && item.answers.length > 0) {
              let lastAns = -1;
              for (let aIdx = item.answers.length - 1; aIdx >= 0; aIdx--) {
                if (item.answers[aIdx] !== undefined && item.answers[aIdx] !== null) {
                  lastAns = aIdx;
                  break;
                }
              }
              if (lastAns !== -1) {
                restoredIdx = Math.min(lastAns + 1, itemQuestions.length - 1);
              }
            }

            setQuizScore(item.score || 0);
            setUserQuizAnswers(item.answers || []);
            setCurrentQuestionIndex(restoredIdx);
            setSelectedOption(item.answers?.[restoredIdx] !== undefined ? item.answers[restoredIdx] : null);
            setIsAnswered(item.answers?.[restoredIdx] !== undefined);
            setQuizState('preview');
          }
          setActiveTab('tools');
          setToolsSubTab('quiz');
          setUserNotification("✅ Restored quiz session!");
          return;
        }

        // Check if there is a shared quiz ID in Firestore
        let targetQuizId = '';
        if (item.id.startsWith('quiz-')) {
          targetQuizId = item.id.replace('quiz-', '');
          if (targetQuizId.startsWith('fin-')) targetQuizId = '';
        }
        if (targetQuizId && targetQuizId !== 'current-quiz') {
          try {
            await loadSharedQuiz(targetQuizId);
            if (item.score !== undefined) {
              setQuizState('finished');
              setQuizScore(item.score);
              if (item.answers) setUserQuizAnswers(item.answers);
            }
            setActiveTab('tools');
            setToolsSubTab('quiz');
            return;
          } catch (err) {
            console.warn("Shared quiz load failed, generating fallback...", err);
          }
        }

        // Fallback: Generate fresh quiz if no questions found anywhere
        await generateQuiz(item.title || item.topic || "General Assessment", 10, (item.difficulty as any) || "Medium");
        setActiveTab('tools');
        setToolsSubTab('quiz');
      } else if (item.type === 'exam') {
        setActiveTab('tools');
        setToolsSubTab('exam');
        if (item.score !== undefined) {
          setExamLobbyState('result');
          setExamScore(item.score);
          if (item.subjectScores) setSubjectScores(item.subjectScores);
          if (item.questions) setExamQuestions(item.questions);
          if (item.answers) setExamAnswers(item.answers);
          if (item.matric) setMatricNumber(item.matric);
          if (item.studentName) setStudentName(item.studentName);
        } else {
          if (item.questions) setExamQuestions(item.questions);
          if (item.answers) setExamAnswers(item.answers);
          if (item.matric) setMatricNumber(item.matric);
          if (item.studentName) setStudentName(item.studentName);
          setExamLobbyState('exam');
          setExamFinished(false);
          setUserNotification("🔄 Restored your active exam session!");
        }
      } else if (item.type === 'recording') {
        const session = sessions.find(s => s.id === item.id);
        if (session) {
          loadRecordingSession(session);
        }
        setActiveTab('tools');
        setToolsSubTab('record');
      } else if (item.type === 'assignment') {
        setActiveTab('tools');
        setToolsSubTab('assignment');
        if (item.data) {
          setActiveAssignmentSolution(item.data);
        }
      } else if (item.type === 'note' as any) {
        const note = userNotes.find(n => n.id === item.id);
        if (note) {
          setSelectedNote(note);
          setNoteHistory([]);
          setRedoStack([]);
        }
        setActiveTab('tools');
        setToolsSubTab('notebook');
      } else if (item.type === 'faculty') {
        setActiveTab('tools');
        setToolsSubTab('faculty');
      }
    } catch (err) {
      console.error("History item click error:", err);
    } finally {
      setHistoryLoadingModal({ show: false, title: '', message: '' });
    }
  };

  const sendQuizReportToAI = () => {
    const report = `
      I just completed a quiz on ${quizTopic}.
      Score: ${quizScore}/${quizQuestions.length}.
      Difficulty: ${quizDifficulty}.
      Please analyze my performance and provide a study plan based on these results.
    `;
    setChatHistory(prev => [...prev, { role: 'user', text: report, timestamp: new Date().toLocaleTimeString() }]);
    setActiveTab('ai');
    handleSendMessage();
  };

  const handleOptionSelect = (index: number, qIndex?: number) => {
    const targetIdx = qIndex !== undefined ? qIndex : currentQuestionIndex;
    if (!user) {
      setUserNotification("Quickly log in with Google or sign up to submit answers and track your academic standing!");
      setAuthMode('signup');
      setShowAuthModal(true);
      return;
    }
    if (quizState === 'finished') return;
    if (userQuizAnswers[targetIdx] !== undefined) return; // Prevent multiple clicks
    
    setCurrentQuestionIndex(targetIdx);
    setSelectedOption(index);
    setIsAnswered(true);
    
    // Store user answer instantly for targetIdx
    setUserQuizAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[targetIdx] = index;
      return newAnswers;
    });

    // Optionally increment score immediately if correct
    if (quizQuestions[targetIdx] && index === quizQuestions[targetIdx].correctAnswer) {
      setQuizScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      setSelectedOption(userQuizAnswers[nextIdx] !== undefined ? userQuizAnswers[nextIdx] : null);
      setIsAnswered(userQuizAnswers[nextIdx] !== undefined);
    } else {
      // Calculate final score
      let finalScore = 0;
      quizQuestions.forEach((q, idx) => {
        if (userQuizAnswers[idx] === q.correctAnswer) finalScore++;
      });
      
      setQuizScore(finalScore);
      setQuizState('finished');
      
      const historyId = currentQuizId ? (currentQuizId.startsWith('quiz-') ? currentQuizId : `quiz-${currentQuizId}`) : `quiz-fin-${Date.now()}`;
      
      addToFinishedHistory({
        id: historyId,
        title: quizTopic || 'Quiz Result',
        type: 'quiz',
        progress: 100,
        date: new Date().toLocaleDateString(),
        timestamp: Date.now(),
        score: finalScore,
        total: quizQuestions.length,
        answers: userQuizAnswers,
        questions: quizQuestions,
        topic: quizTopic,
        difficulty: quizDifficulty
      });

      // ---- POST TO REAL-TIME COMMUNAL SHORE FEED ----
      if (user) {
        const percent = Math.round((finalScore / (quizQuestions.length || 1)) * 100);
        const nameHandle = currentUserData?.username || currentUserData?.displayName || 'Scholar';
        
        const titleText = percent < 40 ? `💡 You can do better!` : `🏆 Magnificent Quiz Score!`;
        const messageText = percent < 40 
          ? `Keep trying, ${nameHandle}! You completed "${quizTopic || 'General Study'}" Quiz with ${finalScore}/${quizQuestions.length} (${percent}%). Don't give up, you can do better! 💪📚`
          : `Congratulations ${nameHandle}! You finished "${quizTopic || 'General Study'}" Quiz with ${finalScore}/${quizQuestions.length} (${percent}%). Outstanding determination! 🎉👏`;

        // Push a beautiful notification!
        addDoc(collection(db, 'notifications'), {
          to: user.uid,
          title: titleText,
          message: messageText,
          type: percent < 40 ? 'warning' : 'congrats',
          subtype: 'quiz_complete',
          targetTab: 'tools',
          targetSubTab: 'quiz',
          timestamp: serverTimestamp() || new Date(),
          read: false
        }).catch(err => console.error("Error creating completion notification:", err));

        // Trigger on-screen phone-style push notification
        triggerPhoneNotification(titleText, messageText, 'quiz');

        let actType = 'quiz_complete';
        let customText = `${nameHandle} completed a quiz on "${quizTopic || 'General Study'}", try yours!`;
        
        // Elite score check
        const finishedQuizzes = finishedHistory.filter((f: any) => f.type === 'quiz');
        const countEliteSeries = finishedQuizzes.slice(-2).filter((f: any) => (f.score / (f.total || 1)) >= 0.8).length;
        if (percent >= 80 && countEliteSeries >= 1) {
          actType = 'quiz_elite';
          customText = `${nameHandle} got more than 80% in three quizzes in a row, generate yours!`;
        }
        
        addDoc(collection(db, 'activities'), {
          type: actType,
          text: customText,
          username: nameHandle,
          userId: user.uid,
          userPhoto: currentUserData?.photoURL || '',
          timestamp: serverTimestamp(),
          topic: quizTopic || 'General Study'
        }).catch((err) => console.error("Error saving global activity:", err));
      }

      // Clear literal progress
      const key = currentQuizId ? `nsg_quiz_progress_${currentQuizId}` : 'nsg_current_quiz_progress';
      localStorage.removeItem(key);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIdx = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIdx);
      setSelectedOption(userQuizAnswers[prevIdx] !== undefined ? userQuizAnswers[prevIdx] : null);
      setIsAnswered(userQuizAnswers[prevIdx] !== undefined);
    }
  };

  const closeWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('nsg_welcome_seen', 'true');
  };

  const isSecondaryPage = Boolean(
    activeTab === 'courses' ||
    activeTab === 'quiz_history' || 
    activeTab === 'exam_history' ||
    activeTab === 'notes_history' ||
    activeTab === 'general_history' ||
    activeTab === 'omni_offline' ||
    activeTab === 'premium' || 
    showGodMode ||
    legalPage ||
    (activeTab === 'tools' && toolsSubTab !== 'menu') ||
    (quizState && quizState !== 'idle') ||
    (activeTab === 'chat' && (isChatRoomActive || selectedChatForRoom)) ||
    activeTab === 'notifications' ||
    isEditingProfile ||
    homeSelectedCourse
  );

  const isAuthView = Boolean(!user || showAuthModal || (activeTab === 'profile' && !user));

  return (
    <div 
      className="h-screen flex flex-col transition-colors duration-300 font-sans selection:bg-[#DC2626] overflow-hidden relative"
      style={{
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
      }}
    >
      {/* LoggedOutLanding global blocker removed to keep pages accessible */}

      <PremiumOnboarding />
      <EmailPreviewModal />
      <AIChallengeModal />
      <AnalysisLoadingOverlay />

      {/* ABOUT US MODAL */}
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

      {/* CONTACT US MODAL */}
      <AnimatePresence>
        {showContactUsModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#12101D] border border-white/10 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 text-left shadow-2xl text-white relative"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                    <Mail size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Contact Us</h2>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">We are here to assist you 24/7</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowContactUsModal(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-white/80 leading-relaxed font-sans">
                  Have questions, feedback, subscription support, or technical issues? Reach out to our team directly through any of our official contact channels below:
                </p>

                <div className="space-y-3 pt-2">
                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/2347046732569"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500 text-slate-950 font-black rounded-xl flex items-center justify-center text-lg">
                        💬
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">WhatsApp Support</p>
                        <p className="text-sm font-bold text-white font-mono">07046732569</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                      Chat Now →
                    </span>
                  </a>

                  {/* Email 1 */}
                  <a
                    href="mailto:nuellkelechi@gmail.com"
                    className="flex items-center justify-between p-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-2xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center">
                        <Mail size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Direct Admin Email</p>
                        <p className="text-xs font-bold text-white font-mono">nuellkelechi@gmail.com</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-purple-400 group-hover:translate-x-1 transition-transform">
                      Send Email →
                    </span>
                  </a>

                  {/* Email 2 */}
                  <a
                    href="mailto:nuellstudyguide@gmail.com"
                    className="flex items-center justify-between p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-2xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
                        <Mail size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-blue-400 tracking-wider">Official Support Email</p>
                        <p className="text-xs font-bold text-white font-mono">nuellstudyguide@gmail.com</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-400 group-hover:translate-x-1 transition-transform">
                      Send Email →
                    </span>
                  </a>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setShowContactUsModal(false)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING PHONE PUSH NOTIFICATION SYSTEM */}
      <div className="fixed top-4 right-4 z-[9999] w-full max-w-[360px] pointer-events-none flex flex-col gap-3 px-4 sm:px-0">
        <AnimatePresence>
          {activePhoneNotifs.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
              className="pointer-events-auto w-full bg-[#1A1825]/95 dark:bg-[#12111A]/98 text-white p-4 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-md flex flex-col gap-3 transition-all hover:border-red-500/30"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center text-xs font-black shadow-md shadow-red-500/20">
                    NSG
                  </div>
                  <span className="text-[10px] font-black tracking-wider text-slate-300 uppercase">NSG STUDY GUIDE</span>
                  <span className="text-[8px] text-slate-500 font-mono">• now</span>
                </div>
                <button
                  onClick={() => setActivePhoneNotifs(prev => prev.filter(n => n.id !== notif.id))}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-white tracking-tight">{notif.title}</p>
                <p className="text-[11px] text-slate-300 leading-normal">{notif.body}</p>
              </div>

              {notif.type !== 'welcome' && (
                <button
                  onClick={() => {
                    setActivePhoneNotifs(prev => prev.filter(n => n.id !== notif.id));
                    if (notif.type === 'quiz') {
                      setActiveTab('tools');
                      setToolsSubTab('quiz');
                    } else if (notif.type === 'note') {
                      setActiveTab('class');
                    } else if (notif.type === 'assignment') {
                      setActiveTab('tools');
                      setToolsSubTab('assignment');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:opacity-95 text-white text-[10px] font-black py-2.5 rounded-xl uppercase tracking-wider transition-all shadow-lg shadow-red-500/10 active:scale-95 text-center"
                >
                  🎯 TRY YOURS NOW
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* HISTORY LOADING BLUR LOCK POPUP */}
      <AnimatePresence>
        {historyLoadingModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] backdrop-blur-xl bg-black/80 flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-[#13111C] border border-white/15 p-8 rounded-[2.2rem] max-w-sm w-full shadow-[0_0_60px_rgba(220,38,38,0.3)] space-y-5"
            >
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-[#DC2626]/20 border-t-[#DC2626] animate-spin" />
                <div className="w-10 h-10 rounded-full bg-[#DC2626]/10 flex items-center justify-center text-[#DC2626]">
                  <History size={22} />
                </div>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Loading {historyLoadingModal.title || "Session"}...
                </h3>
                <p className="text-xs text-white/60 leading-relaxed font-medium">
                  {historyLoadingModal.message || "Please wait while we restore your session and lock the interface..."}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUOTA LIMIT EXCEEDED MODAL POPUP */}
      <AnimatePresence>
        {showQuotaModal && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#18181B] border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-900/30 text-white overflow-hidden text-center select-none"
            >
              {/* Background Glows */}
              <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setShowQuotaModal(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-2 cursor-pointer z-10 rounded-full hover:bg-white/10"
                title="Close"
              >
                <XCircle size={22} />
              </button>

              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
                <AlertTriangle size={32} className="animate-bounce" />
              </div>

              {/* Header */}
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-3">
                Service Limit Reached
              </h3>

              {/* Required Exact Messages */}
              <p className="text-lg sm:text-xl font-black text-amber-300 leading-snug mb-2">
                Please try again by 9:00 AM.
              </p>

              <p className="text-xs sm:text-sm font-semibold text-zinc-300 leading-relaxed mb-6">
                We are sorry for the inconvenience this has caused you.
              </p>

              {/* Info Box */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 mb-6 text-xs text-zinc-400 text-left">
                <div className="flex items-start gap-2.5">
                  <Clock size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    Our daily server quota limit has been reached for today. Operations will automatically refresh and resume at <strong>9:00 AM</strong>.
                  </span>
                </div>
              </div>

              {/* Button */}
              <button
                onClick={() => setShowQuotaModal(false)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-98 transition-all cursor-pointer"
              >
                I Understand
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AUTH MODAL (FULL PAGE LOG IN UI - BORDER TO BORDER) */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] overflow-y-auto bg-[#0B0D14] flex flex-col items-center justify-start py-10 sm:py-16 px-4 sm:px-8 custom-scrollbar min-h-screen"
          >
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className={`w-full m-auto text-center relative px-2 sm:px-6 py-6 ${
                authMode === 'signup' ? 'max-w-xl' : 'max-w-lg'
              }`}
            >
              {user && (
                <button 
                  onClick={() => setShowAuthModal(false)} 
                  className="absolute -top-2 right-2 text-white/40 hover:text-white transition-colors p-2 cursor-pointer z-10"
                  title="Close"
                >
                  <XCircle size={24} />
                </button>
              )}
              
              {/* Top Branding Section */}
              <div className="text-center mb-6 pt-2">
                {(pendingQuizId || sessionStorage.getItem('nsg_pending_quiz_id')) && (
                  <div className="mb-5 p-3.5 bg-purple-500/15 border border-purple-500/30 rounded-2xl flex items-center justify-center gap-2.5 text-purple-200 text-xs font-bold text-center shadow-lg shadow-purple-900/20">
                    <Loader2 size={16} className="text-amber-400 shrink-0 animate-spin" />
                    <span>Please log in or sign up to view and attempt this quiz!</span>
                  </div>
                )}
                <h1 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-[#8B5CF6] mb-2 font-sans select-none">
                  NSG
                </h1>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2 font-sans">
                  {authMode === 'login' ? 'Login to NSG' : 'Create an Account'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 font-normal leading-relaxed max-w-sm mx-auto">
                  {authMode === 'login' 
                    ? 'Welcome to your learning arena, where every tiny victory counts.' 
                    : 'Join the learning arena and excel in your academic journey.'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4 text-left">
                {authMode === 'signup' ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-200 block">Full Name</label>
                      <div className="bg-[#13151F] border border-white/10 rounded-2xl px-4 py-3 flex items-center focus-within:border-[#8B5CF6] focus-within:ring-1 focus-within:ring-[#8B5CF6]/40 transition-all">
                        <input type="text" value={authFullName} onChange={(e) => setAuthFullName(e.target.value)} placeholder="Full Official Name" required className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-gray-500 outline-none" />
                      </div>
                      {validationErrors.fullName && <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.fullName}</p>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                       <div className="space-y-1">
                         <p className="text-[10px] font-medium text-gray-300 ml-1">DOB</p>
                         <div className="bg-[#13151F] border border-white/10 rounded-2xl px-3 py-2.5">
                           <input type="date" value={authDOB} onChange={(e) => setAuthDOB(e.target.value)} required className="w-full bg-transparent text-[11px] text-white focus:outline-none" />
                         </div>
                         {validationErrors.dob && <p className="text-[8px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.dob}</p>}
                       </div>
                       <div className="space-y-1">
                         <p className="text-[10px] font-medium text-gray-300 ml-1">Username (Optional)</p>
                         <div className="bg-[#13151F] border border-white/10 rounded-2xl px-3 py-2.5">
                           <input type="text" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} placeholder="Auto-gen if blank" className="w-full bg-transparent text-[11px] text-white placeholder-gray-500 outline-none" />
                         </div>
                       </div>
                    </div>
                    {usernameStatus && (
                      <p className={`text-[8px] font-bold uppercase tracking-wider ml-1 ${usernameStatus.available ? 'text-green-500' : 'text-red-500'}`}>
                        {usernameStatus.message}
                      </p>
                    )}

                    <div className="space-y-1 relative">
                      <p className="text-[10px] font-medium text-gray-300 ml-1">University</p>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowUniSearchModal(!showUniSearchModal);
                            setUniSearchQuery('');
                          }}
                          className="flex-1 bg-[#13151F] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white/70 focus:border-[#8B5CF6] transition-all outline-none text-left flex justify-between items-center hover:bg-white/[0.08]"
                        >
                          <span className={authUniversity ? "text-white font-medium truncate max-w-[200px] sm:max-w-[280px]" : "text-gray-500"}>
                            {authUniversity || "Select University"}
                          </span>
                          <ChevronDown size={14} className={`text-gray-400 transition-transform flex-shrink-0 ${showUniSearchModal ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowUniSearchModal(true);
                            setTimeout(() => {
                              const el = document.getElementById('uni-search-input');
                              if (el) el.focus();
                            }, 50);
                          }}
                          className="px-3 bg-[#13151F] border border-white/10 hover:bg-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white transition-all"
                          title="Search Universities"
                        >
                          <Search size={14} />
                        </button>
                      </div>

                      {showUniSearchModal && (
                        <div className="absolute left-0 right-0 mt-1 p-2 bg-[#120f21] border border-white/10 rounded-xl shadow-2xl z-[50] flex flex-col space-y-2 max-h-[220px]">
                          <div className="flex gap-1">
                            <div className="relative flex-1">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 w-3 h-3" />
                              <input
                                id="uni-search-input"
                                type="text"
                                placeholder="Search..."
                                value={uniSearchQuery}
                                onChange={(e) => setUniSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#8B5CF6]/50 transition-all"
                              />
                            </div>
                          </div>

                          <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 space-y-0.5">
                            {(() => {
                              const query = uniSearchQuery.toLowerCase().trim();
                              const filtered = UNIVERSITIES.filter(u => u.toLowerCase().includes(query));
                              if (filtered.length === 0) {
                                return (
                                  <div className="text-center py-3 text-white/40 text-[9px]">
                                    No matching universities
                                  </div>
                                );
                              }
                              return filtered.map(u => (
                                <button
                                  key={u}
                                  type="button"
                                  onClick={() => {
                                    setAuthUniversity(u);
                                    setShowUniSearchModal(false);
                                  }}
                                  className={`w-full text-left px-2 py-1.5 rounded-md text-[10px] transition-all flex items-center justify-between ${
                                    authUniversity === u
                                      ? 'bg-[#8B5CF6]/20 text-white border border-[#8B5CF6]/30'
                                      : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
                                  }`}
                                >
                                  <span className="truncate">{u}</span>
                                  {authUniversity === u && <Check size={10} className="text-[#8B5CF6] flex-shrink-0" />}
                                </button>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                      {validationErrors.university && <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.university}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <select value={authFaculty} onChange={(e) => { setAuthFaculty(e.target.value); setAuthDepartment(''); }} required className="w-full bg-[#13151F] border border-white/10 rounded-2xl px-3 py-3 text-[11px] text-white focus:border-[#8B5CF6] transition-all outline-none appearance-none">
                          <option value="" disabled className="bg-zinc-900">Select Faculty</option>
                          {FACULTIES.map(f => <option key={f} value={f} className="bg-zinc-900">{f}</option>)}
                        </select>
                        {validationErrors.faculty && <p className="text-[8px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.faculty}</p>}
                      </div>
                      <div className="space-y-1">
                        <select value={authDepartment} onChange={(e) => setAuthDepartment(e.target.value)} required disabled={!authFaculty} className="w-full bg-[#13151F] border border-white/10 rounded-2xl px-3 py-3 text-[11px] text-white focus:border-[#8B5CF6] transition-all outline-none appearance-none disabled:opacity-30">
                          <option value="" disabled className="bg-zinc-900">Select Dept.</option>
                          {authFaculty && DEPARTMENTS[authFaculty]?.map(d => <option key={d} value={d} className="bg-zinc-900">{d}</option>)}
                        </select>
                        {validationErrors.department && <p className="text-[8px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.department}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                       <input type="text" value={authMatric} onChange={(e) => setAuthMatric(e.target.value)} placeholder="Matric (Optional)" className="w-full bg-[#13151F] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:border-[#8B5CF6] transition-all outline-none" />
                       <input type="text" value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} placeholder="Phone Number" className="w-full bg-[#13151F] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:border-[#8B5CF6] transition-all outline-none" />
                    </div>
                    
                    <input type="text" value={authInviteCode} onChange={(e) => setAuthInviteCode(e.target.value)} placeholder="Referral Invite ID (Optional)" className="w-full bg-[#13151F] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:border-[#8B5CF6] transition-all outline-none" />
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-200 block">Email Address</label>
                      <div className="bg-[#13151F] border border-white/10 rounded-2xl px-4 py-3 flex items-center focus-within:border-[#8B5CF6] transition-all">
                        <Mail size={18} className="text-[#8B5CF6] shrink-0 mr-3" />
                        <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Enter your email" required className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-gray-500 outline-none" />
                      </div>
                      {validationErrors.email && <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.email}</p>}
                    </div>
                  </>
                ) : (
                  <>
                    {/* EMAIL / MATRIC NUMBER FIELD */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-medium text-gray-200 block">Email / Matric Number</label>
                      <div className="bg-[#13151F] border border-white/10 rounded-2xl px-4 py-3.5 flex items-center focus-within:border-[#8B5CF6] focus-within:ring-1 focus-within:ring-[#8B5CF6]/40 transition-all">
                        <Mail size={18} className="text-[#8B5CF6] shrink-0 mr-3" />
                        <input 
                          type="text" 
                          value={authEmail} 
                          onChange={(e) => setAuthEmail(e.target.value)} 
                          placeholder="Enter your email or matric number" 
                          className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-gray-500 outline-none" 
                        />
                      </div>
                    </div>
                  </>
                )}
                
                {/* PASSWORD FIELD */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-200 block">Password</label>
                    {authMode === 'login' && (
                      <button 
                        type="button" 
                        onClick={async () => {
                          if (!authEmail) {
                            setUserNotification("Please enter your email address in the input above first.");
                            return;
                          }
                          try {
                            const { sendPasswordResetEmail } = await import('firebase/auth');
                            await sendPasswordResetEmail(auth, authEmail);
                            setUserNotification("Password reset email sent! Check your inbox.");
                          } catch (err: any) {
                            setUserNotification(`Failed to send password reset: ${err.message || err}`);
                          }
                        }}
                        className="text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>

                  <div className="bg-[#13151F] border border-white/10 rounded-2xl px-4 py-3.5 flex items-center focus-within:border-[#8B5CF6] focus-within:ring-1 focus-within:ring-[#8B5CF6]/40 transition-all">
                    <Lock size={18} className="text-[#8B5CF6] shrink-0 mr-3" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={authPassword} 
                      onChange={(e) => setAuthPassword(e.target.value)} 
                      placeholder="Enter your password" 
                      required 
                      className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-gray-500 outline-none" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-white transition-colors ml-2 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {validationErrors.password && <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.password}</p>}
                  
                  {authMode === 'signup' && authPassword && (
                    <div className="flex flex-col gap-1 px-1 pt-1">
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full ${passwordStrength.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${(passwordStrength.score + 1) * 20}%` }}
                        />
                      </div>
                      <p className="text-[7px] font-black uppercase tracking-widest text-white/30 text-right">{passwordStrength.feedback} Security</p>
                    </div>
                  )}
                </div>
                
                {/* CONTINUE / CREATE ACCOUNT BUTTON */}
                <button 
                  type="submit" 
                  disabled={isAuthLoading} 
                  className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold py-3.5 rounded-2xl text-sm sm:text-base transition-all shadow-lg shadow-purple-900/30 active:scale-[0.99] flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  {isAuthLoading ? <RefreshCcw className="animate-spin" size={18} /> : (authMode === 'login' ? 'Continue' : 'Create Account')}
                </button>
              </form>

              {/* SIGN UP / SIGN IN TOGGLE */}
              <div className="mt-4 text-center text-xs sm:text-sm text-gray-400 font-normal">
                {authMode === 'login' ? (
                  <>
                    Don’t have an account?{' '}
                    <button 
                      type="button"
                      onClick={() => setAuthMode('signup')} 
                      className="text-orange-400 hover:text-orange-300 font-bold ml-1 cursor-pointer transition-colors"
                    >
                      Sign Up
                    </button>
                  </>
                ) : (
                  <>
                    Already registered?{' '}
                    <button 
                      type="button"
                      onClick={() => setAuthMode('login')} 
                      className="text-orange-400 hover:text-orange-300 font-bold ml-1 cursor-pointer transition-colors"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>

              {/* OR SIGN IN WITH DIVIDER */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-[1px] bg-white/10" />
                <span className="text-xs text-gray-400 font-medium">or sign in with</span>
                <div className="flex-1 h-[1px] bg-white/10" />
              </div>

              {/* SOCIAL BUTTONS */}
              <div className="grid grid-cols-2 gap-3">
                {/* GOOGLE LOG IN */}
                <button 
                  type="button"
                  onClick={handleGoogleLogin} 
                  className="w-full bg-[#13151F] hover:bg-[#1A1C29] border border-white/10 rounded-2xl py-3 flex items-center justify-center transition-all cursor-pointer group"
                  title="Sign in with Google"
                >
                  <svg className="w-5 h-5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                </button>

                {/* FACEBOOK LOG IN */}
                <button 
                  type="button"
                  onClick={async () => {
                    setIsAuthLoading(true);
                    try {
                      const { FacebookAuthProvider, signInWithPopup } = await import('firebase/auth');
                      const provider = new FacebookAuthProvider();
                      await signInWithPopup(auth, provider);
                      setUserNotification("Successfully logged in with Facebook!");
                      setShowAuthModal(false);
                    } catch (error: any) {
                      console.error("Facebook Login Error:", error);
                      setUserNotification(error.message || "Facebook login failed. Please ensure Facebook sign-in is enabled in Firebase Console.");
                    } finally {
                      setIsAuthLoading(false);
                    }
                  }} 
                  className="w-full bg-[#13151F] hover:bg-[#1A1C29] border border-white/10 rounded-2xl py-3 flex items-center justify-center transition-all cursor-pointer group"
                  title="Sign in with Facebook"
                >
                  <svg className="w-5 h-5 fill-[#1877F2] group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWelcome && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className={`${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} border p-8 rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-[#DC2626]" />
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-[#DC2626]/10 rounded-2xl flex items-center justify-center">
                  <Brain size={40} className="text-[#DC2626]" />
                </div>
                <h2 className={`text-2xl font-black tracking-tighter uppercase italic ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Welcome to <span className="text-[#DC2626]">NSG</span></h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'} leading-relaxed`}>
                  Welcome to NSG, your ultimate academic guide. Transform your learning experience by recording classes, generating AI transcriptions, chatting with our intelligent assistant, and creating custom quizzes. We are constantly improving NSG to better serve your academic journey. Thank you for choosing us as your study partner!
                </p>
                <button onClick={closeWelcome} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm transition-all shadow-xl shadow-[#DC2626]/20">GET STARTED</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEGAL MODAL */}
      <PremiumModal />
      <AnimatePresence>
        {legalPage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className={`${theme === 'dark' ? 'bg-[#13111C]' : 'bg-white'} border ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'} p-8 rounded-3xl max-w-2xl w-full shadow-2xl relative overflow-hidden max-h-[80vh] flex flex-col`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black uppercase tracking-tighter text-white">
                  {legalPage === 'about' && "About Us"}
                  {legalPage === 'terms' && "Terms & Conditions"}
                  {legalPage === 'privacy' && "Privacy Policy"}
                  {legalPage === 'contact' && "Contact Us"}
                </h2>
                <button onClick={() => setLegalPage(null)} className="text-white/40 hover:text-[#DC2626] transition-colors"><XCircle size={24} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-sm text-white/70 leading-relaxed">
                {legalPage === 'about' && (
                  <>
                    <p>NSG is a cutting-edge educational tool designed to empower students and lifelong learners. We leverage advanced AI to simplify complex learning processes.</p>
                    <p>Our mission is to provide a seamless interface for capturing lecture content, analyzing it with state-of-the-art language models, and providing interactive tools like AI chat and custom quizzes to reinforce knowledge.</p>
                  </>
                )}
                {legalPage === 'terms' && (
                  <>
                    <p>By using NSG, you agree to the following terms:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>NSG is provided "as is" for educational purposes.</li>
                      <li>Users are responsible for the content they upload and record.</li>
                      <li>We do not guarantee 100% accuracy of AI-generated content.</li>
                      <li>Your data is stored locally on your device for privacy.</li>
                    </ul>
                  </>
                )}
                {legalPage === 'privacy' && (
                  <div className="space-y-4">
                    <p className="font-bold text-[#DC2626]">Last Updated: April 9, 2026</p>
                    <p>At NSG, we take your privacy seriously. This policy explains how we collect, use, and protect your data.</p>
                    
                    <h3 className="font-bold text-white">1. Information Collection</h3>
                    <p>We collect information you provide directly to us, such as your name, email address, and educational details when you create an account. We also collect audio recordings and text data you process through our AI tools.</p>
                    
                    <h3 className="font-bold text-white">2. Use of Data</h3>
                    <p>Your data is used to provide and improve our educational services, personalize your experience, and communicate with you about your account. We use advanced AI models to process your study materials.</p>
                    
                    <h3 className="font-bold text-white">3. Cookies & Google AdSense</h3>
                    <p>We use cookies to enhance your experience and analyze site traffic. We also use Google AdSense to serve advertisements. Google, as a third-party vendor, uses cookies to serve ads based on your visit to this and other sites on the Internet.</p>
                    <p>Users may opt out of personalized advertising by visiting Google's <a href="https://www.google.com/settings/ads" target="_blank" className="text-[#DC2626] underline">Ads Settings</a>.</p>
                    
                    <h3 className="font-bold text-white">4. Data Security</h3>
                    <p>We implement industry-standard security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.</p>
                  </div>
                )}
                {legalPage === 'contact' && (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 bg-[#DC2626]/10 rounded-full flex items-center justify-center mx-auto"><Settings size={32} className="text-[#DC2626]" /></div>
                    <p className="text-lg font-bold text-white">Need Assistance?</p>
                    <p>If you have any issues, pls contact us at:</p>
                    <div className="space-y-1 font-mono text-[#DC2626] font-bold">
                      <p>nuellkelechi@gmail.com</p>
                      <p>07046732569</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {true && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
            className={`flex h-full overflow-hidden ${isDesktop && !isAuthView ? 'flex-row' : 'flex-col'} flex-1`}
          >
            {/* Desktop Sidebar */}
            {isDesktop && !isAuthView && (
              <aside
                className="w-[72px] flex flex-col items-center py-6 gap-3 shrink-0 z-[611]"
                style={{
                  background: 'var(--sidebar-bg)',
                  borderRight: '1px solid var(--sidebar-border)',
                }}
              >
                {/* Wordmark / Logo */}
                <button
                  onClick={() => setActiveTab('home')}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3 relative group transition-all active:scale-90"
                  style={{
                    background: 'var(--accent-primary)',
                    boxShadow: '0 0 20px var(--accent-glow)',
                  }}
                  title="NSG (NUELL STUDY GUIDE) — Home"
                >
                  <span
                    className="font-display text-white font-black text-lg leading-none"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    N
                  </span>
                  {/* Tooltip */}
                  <span
                    className="absolute left-full ml-3 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-medium)',
                    }}
                  >
                    NSG (NUELL STUDY GUIDE)
                  </span>
                </button>

                {/* Divider */}
                <div className="w-8 h-px" style={{ background: 'var(--border-subtle)' }} />

                {/* Navigation items */}
                <div className="flex flex-col gap-1.5 flex-1 animate-fadeIn">
                  {[
                    { id: 'home',      icon: '⌂',  label: 'Command' },
                    { id: 'chat',      icon: '◈',  label: 'Relay' },
                    { id: 'tools',     icon: '⚡', label: 'Modules' },
                    { id: 'community', icon: '☍',  label: 'Alliance' },
                    { id: 'profile',   icon: '◎',  label: 'Identity' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'tools') {
                          setToolsSubTab('menu');
                        }
                        setActiveTab(item.id as any);
                      }}
                      title={item.label}
                      className={`nav-item group relative ${activeTab === item.id ? 'active' : ''}`}
                      data-active={activeTab === item.id ? 'true' : undefined}
                    >
                      <span className="text-lg leading-none">{item.icon}</span>

                      {/* Unread badge */}
                      {item.id === 'chat' && totalUnreadMessages > 0 && (
                        <span
                          className="absolute top-1.5 right-1.5 w-4 h-4 text-[8px] font-black flex items-center justify-center rounded-full animate-pulse"
                          style={{ background: '#fff', color: 'var(--accent-primary)' }}
                        >
                          {totalUnreadMessages}
                        </span>
                      )}

                      {/* Tooltip */}
                      <span
                        className="absolute left-full ml-3 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl"
                        style={{
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-medium)',
                        }}
                      >
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className="w-8 h-px" style={{ background: 'var(--border-subtle)' }} />

                {/* Premium */}
                <button
                  onClick={() => setShowPremiumModal(true)}
                  className="nav-item group relative"
                  title={isPremium ? 'Premium Active' : 'Upgrade to Premium'}
                >
                  <span className="text-lg animate-pulse" style={{ color: 'var(--accent-gold)' }}>✦</span>
                  <span
                    className="absolute left-full ml-3 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-medium)',
                    }}
                  >
                    {isPremium ? 'Premium ✓' : 'Go Premium'}
                  </span>
                </button>

                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="nav-item group relative"
                  title={theme === 'dark' ? 'Switch to Luxury Light' : 'Switch to Premium Dark'}
                >
                  <span className="text-base">{theme === 'dark' ? '☀' : '◗'}</span>
                  <span
                    className="absolute left-full ml-3 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-medium)',
                    }}
                  >
                    {theme === 'dark' ? 'Luxury Light' : 'Premium Dark'}
                  </span>
                </button>

                {/* Settings */}
                <button
                  onClick={() => setToolsSubTab('menu')}
                  className="nav-item group relative"
                  title="System Settings"
                >
                  <span className="text-base" style={{ opacity: 0.5 }}>⚙</span>
                  <span
                    className="absolute left-full ml-3 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-medium)',
                    }}
                  >
                    System Config
                  </span>
                </button>
              </aside>
            )}
            
            <div className="flex flex-col flex-1 h-full overflow-hidden">
            {/* HEADER - Only visible when not on Home, Courses, or Profile tabs */}
            {activeTab !== 'home' && activeTab !== 'courses' && activeTab !== 'profile' && !isAuthView && !isSecondaryPage && (
              <header
                className="px-4 sm:px-6 pb-3.5 flex justify-between items-center shrink-0"
                style={{
                  background: 'var(--bg-surface)',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
                }}
              >
                {/* Left — Profile Avatar Button (tapping leads to profile page) */}
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="relative group focus:outline-none cursor-pointer flex items-center gap-2"
                  title="View Profile"
                >
                  {currentUserData?.photoURL || user?.photoURL ? (
                    <img
                      src={currentUserData?.photoURL || user?.photoURL}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/50 group-hover:border-purple-400 transition-all shadow-md group-active:scale-95"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-700 via-indigo-800 to-purple-900 border-2 border-purple-400/50 text-white font-black text-xs flex items-center justify-center shadow-md group-hover:border-purple-300 transition-all group-active:scale-95 tracking-wider">
                      {(() => {
                        if (currentUserData?.displayName) {
                          const parts = currentUserData.displayName.trim().split(' ');
                          if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
                          return parts[0].substring(0, 2).toUpperCase();
                        }
                        if (currentUserData?.username) return currentUserData.username.substring(0, 2).toUpperCase();
                        if (user?.email) return user.email.substring(0, 2).toUpperCase();
                        return 'EP';
                      })()}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#13111C]" title="Online" />
                </button>

                {/* Center — NSG (Just NSG) */}
                <div className="text-center">
                  <h1
                    className="text-xl sm:text-2xl font-black tracking-wider uppercase text-white"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    NSG
                  </h1>
                </div>

                {/* Right — Actions */}
                <div className="flex items-center gap-2">
                  {/* Notifications */}
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className="relative p-2.5 rounded-xl transition-all cursor-pointer hover:bg-white/10"
                    style={{ background: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                    title="Notifications"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    {(() => {
                      const personalUnread = (personalNotifications || []).filter((n: any) => !n.read).length;
                      const totalUnread = unreadCount + personalUnread;
                      return totalUnread > 0 ? (
                        <span
                          className="absolute -top-1 -right-1 w-4 h-4 text-[8px] font-black flex items-center justify-center rounded-full border-2 animate-bounce"
                          style={{ background: 'var(--accent-primary)', color: '#fff', borderColor: 'var(--bg-surface)' }}
                        >
                          {totalUnread}
                        </span>
                      ) : null;
                    })()}
                  </button>

                  {/* Theme toggle */}
                  <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-xl transition-all cursor-pointer hover:bg-white/10 hidden sm:flex"
                    style={{ background: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                    title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  >
                    {theme === 'dark' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    )}
                  </button>

                  {/* Auth Sign in button if unauthenticated */}
                  {!user && (
                    <button
                      onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                      className="px-3 py-1.5 bg-[#DC2626] hover:bg-red-500 text-white font-black uppercase text-[9px] tracking-widest rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
                    >
                      SIGN IN
                    </button>
                  )}
                </div>
              </header>
            )}

      {/* MAIN CONTENT */}
      <main 
        className={`flex-1 ${
          isAuthView 
            ? 'w-full max-w-full p-0 overflow-y-auto' 
            : ((activeTab === 'home' || activeTab === 'chat' || activeTab === 'class' || activeTab === 'ai' || (activeTab === 'tools' && toolsSubTab === 'notebook') || isDesktop) 
                ? 'w-full' 
                : 'max-w-4xl w-full mx-auto px-2 sm:px-4')
        } ${
          isAuthView 
            ? 'p-0 overflow-y-auto' 
            : ((activeTab === 'tools' && toolsSubTab === 'notebook')
                ? 'p-0 overflow-hidden'
                : ((activeTab === 'home' || activeTab === 'chat' || activeTab === 'class' || activeTab === 'ai' || isSecondaryPage) ? 'pb-2 overflow-y-auto pt-0' : 'pb-24 overflow-y-auto pt-4'))
        } flex flex-col custom-scrollbar ${
          (activeTab === 'home' || (activeTab === 'tools' && toolsSubTab === 'notebook')) ? 'px-0' : (isDesktop && !isAuthView ? 'px-8' : '')
        }`}
        style={{
          backgroundColor: 'var(--bg-base)',
        }}
      >
        {/* Global Notification System - Purple & White Style */}
        <AnimatePresence>
          {userNotification && (
            <>
              {/* Centered Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setUserNotification(null)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[2000]"
              />
              {/* Centered Purple & White Notification Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2001] w-[90%] max-w-sm"
              >
                <div className="bg-[#171522] border border-purple-500/30 p-6 rounded-3xl shadow-[0_0_40px_rgba(147,51,234,0.3)] text-left overflow-hidden relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.18),transparent_60%)] pointer-events-none" />
                  
                  <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/40 p-0.5 flex items-center justify-center shadow-xl shadow-purple-600/10 text-purple-400">
                      <Bell size={24} />
                    </div>
                    
                    <div className="space-y-1.5 w-full">
                      <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Notification</h4>
                      <p className="text-sm font-semibold text-white leading-relaxed font-sans px-2">
                        {userNotification}
                      </p>
                    </div>

                    <button 
                      onClick={() => setUserNotification(null)}
                      className="w-full py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 active:scale-95 transition-all cursor-pointer"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {audioTranscribingPopup && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-6 right-6 z-[2002] max-w-sm bg-[#171522] border border-purple-500/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(147,51,234,0.3)] flex items-start gap-3.5"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-400">
                <RefreshCcw size={18} className="animate-spin" />
              </div>
              <div className="space-y-1 flex-1 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                    Transcribing Audio
                  </span>
                  <button onClick={() => setAudioTranscribingPopup(false)} className="text-white/40 hover:text-white cursor-pointer p-1" title="Dismiss Popup">
                    <X size={14} />
                  </button>
                </div>
                <p className="text-xs font-bold text-white leading-tight">Audio is being transcribed into a study note!</p>
                <p className="text-[10px] text-white/70 leading-relaxed font-sans">
                  ⚠️ Please do not reload or leave the app while processing audio, regardless of length. Your note is being written live in the background.
                </p>
                <button
                  onClick={() => {
                    setActiveTab('tools');
                    setToolsSubTab('notebook');
                    if (userNotes) {
                      const transNote = userNotes.find((n: any) => n.id === activeAudioNoteId || n.isTranscribing);
                      if (transNote) setSelectedNote(transNote);
                    }
                    setAudioTranscribingPopup(false);
                  }}
                  className="mt-2.5 w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/20"
                >
                  <span>Go to Note Page</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {audioUploadState.isUploading && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-6 right-6 z-[2005] max-w-sm w-full bg-[#171522] border border-purple-500/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(147,51,234,0.3)] flex items-start gap-3.5"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${audioUploadState.isSuccess ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-purple-600/20 border-purple-500/40 text-purple-400'}`}>
                {audioUploadState.isSuccess ? (
                  <CheckCircle2 size={20} className="text-emerald-400" />
                ) : (
                  <RefreshCcw size={18} className="animate-spin text-purple-400" />
                )}
              </div>
              <div className="space-y-2 flex-1 text-left">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${audioUploadState.isSuccess ? 'text-emerald-400' : 'text-purple-400'}`}>
                    {!audioUploadState.isSuccess && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />}
                    {audioUploadState.isSuccess ? 'Uploaded Successfully' : 'Uploading'}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-white/70">{audioUploadState.progress}%</span>
                </div>
                <p className="text-xs font-bold text-white truncate max-w-[220px]" title={audioUploadState.fileName}>
                  {audioUploadState.fileName || "Processing audio file..."}
                </p>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${audioUploadState.isSuccess ? 'bg-emerald-500' : 'bg-purple-600'}`}
                    style={{ width: `${audioUploadState.progress}%` }}
                  />
                </div>
                <p className="text-[9px] text-white/60 font-sans">
                  {audioUploadState.isSuccess ? 'Upload complete! Starting transcript...' : `Uploading audio (${audioUploadState.progress}%)...`}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence mode="popLayout">
          
          {/* HOME TAB */}
          {activeTab === 'home' && (
            <HomePage
              theme={theme}
              user={user}
              currentUserData={currentUserData}
              userNotes={userNotes}
              finishedHistory={finishedHistory}
              sessions={sessions}
              unreadCount={unreadCount}
              personalNotifications={personalNotifications}
              setActiveTab={setActiveTab}
              setToolsSubTab={setToolsSubTab}
              setSelectedNote={setSelectedNote}
              setImportedQuizNote={setImportedQuizNote}
              setQuizTopic={setQuizTopic}
              setQuizDocuments={setQuizDocuments}
              openCoursePreview={openCoursePreviewFromHome}
              openCoursesWithFilter={openCoursesWithFilterFromHome}
              setUserNotification={setUserNotification}
            />
          )}

          {/* QUIZ HISTORY TAB */}
          {activeTab === 'quiz_history' && (
            <QuizHistoryPage
              finishedHistory={finishedHistory}
              onOpenQuizById={(qId) => loadSharedQuiz(qId)}
              setActiveTab={setActiveTab}
              setToolsSubTab={setToolsSubTab}
            />
          )}

          {/* EXAM HISTORY TAB */}
          {activeTab === 'exam_history' && (
            <ExamHistoryPage
              finishedHistory={finishedHistory}
              setActiveTab={setActiveTab}
              setToolsSubTab={setToolsSubTab}
            />
          )}

          {/* NOTES HISTORY TAB */}
          {activeTab === 'notes_history' && (
            <NotesHistoryPage
              userNotes={userNotes}
              setActiveTab={setActiveTab}
              setToolsSubTab={setToolsSubTab}
              setSelectedNote={setSelectedNote}
            />
          )}

          {/* GENERAL HISTORY TAB */}
          {activeTab === 'general_history' && (
            <GeneralHistoryPage
              finishedHistory={finishedHistory}
              userNotes={userNotes}
              sessions={sessions}
              onOpenQuizById={(qId) => loadSharedQuiz(qId)}
              setActiveTab={setActiveTab}
              setToolsSubTab={setToolsSubTab}
              setSelectedNote={setSelectedNote}
            />
          )}

          {/* PREMIUM TAB */}
          {activeTab === 'premium' && (
            <PremiumPage
              isPremium={isPremium}
              onClose={() => setActiveTab('home')}
              setUserNotification={setUserNotification}
              setIsPremium={setIsPremium}
              initializeMonthly={initializeMonthly}
              initializeYearly={initializeYearly}
              handleSubscriptionSuccess={handleSubscriptionSuccess}
            />
          )}

          {/* OMNI OFFLINE DOWNLOAD TAB */}
          {activeTab === 'omni_offline' && (
            <OmniOfflinePage
              theme={theme}
              onBack={() => setActiveTab('home')}
              onOpenChat={() => {
                setActiveTab('chat');
              }}
              onOpenQuiz={() => {
                setActiveTab('tools');
                setToolsSubTab('quiz');
              }}
            />
          )}

          {/* COURSES TAB */}
          {activeTab === 'courses' && (
            <CoursesPage
              theme={theme}
              user={user}
              userNotes={userNotes}
              setUserNotification={setUserNotification}
              generateQuiz={generateQuiz}
              setActiveTab={setActiveTab}
              setToolsSubTab={setToolsSubTab}
              setSelectedNote={setSelectedNote}
              setImportedQuizNote={setImportedQuizNote}
              setQuizTopic={setQuizTopic}
              setQuizDocuments={setQuizDocuments}
              onBack={() => setActiveTab('home')}
              initialSelectedCourse={homeSelectedCourse}
              initialFacultyFilter={coursesFacultyFilter}
              initialDepartmentFilter={coursesDepartmentFilter}
            />
          )}

          {/* TOOLS & STUDY TAB */}
          {activeTab === 'tools' && (
            <ToolsPage
              theme={theme}
              user={user}
              currentUserData={currentUserData}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              toolsSubTab={toolsSubTab}
              setToolsSubTab={setToolsSubTab}
              setUserNotification={setUserNotification}
              checkAndIncrementUsage={checkAndIncrementUsage}
              isPremium={isPremium}
              showHelp={showHelp}
              setShowHelp={setShowHelp}
              showAuthModal={showAuthModal}
              setShowAuthModal={setShowAuthModal}
              chatSessions={chatSessions}
              setChatSessions={setChatSessions}
              activeChatSessionId={activeChatSessionId}
              setActiveChatSessionId={setActiveChatSessionId}
              handleSendMessage={handleSendMessage}
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
              CoursesTool={CoursesTool}
              AssignmentSolver={AssignmentSolver}
              AILibrary={AILibrary}
              sessions={sessions}
              selectedSession={selectedSession}
              setSelectedSession={setSelectedSession}
              deleteLectureSession={deleteLectureSession}
              togglePinLectureSession={togglePinLectureSession}
              loadRecordingSession={loadRecordingSession}
              showRecordSidebar={showRecordSidebar}
              setShowRecordSidebar={setShowRecordSidebar}
              showAnalysisInRecord={showAnalysisInRecord}
              setShowAnalysisInRecord={setShowAnalysisInRecord}
              isTranscribing={isTranscribing}
              transcriptionNotes={transcriptionNotes}
              isAnalyzing={isAnalyzing}
              analysisResult={analysisResult}
              setAnalysisResult={setAnalysisResult}
              refurbishedResult={refurbishedResult}
              setRefurbishedResult={setRefurbishedResult}
              isRecording={isRecording}
              isProcessingFinal={isProcessingFinal}
              recordingTime={recordingTime}
              audioUrl={audioUrl}
              setAudioUrl={setAudioUrl}
              recordedBlob={recordedBlob}
              setRecordedBlob={setRecordedBlob}
              uploadedImages={uploadedImages}
              setUploadedImages={setUploadedImages}
              isNotebookDrawerOpen={isNotebookDrawerOpen}
              setIsNotebookDrawerOpen={setIsNotebookDrawerOpen}
              isPodcastActive={isPodcastActive}
              setIsPodcastActive={setIsPodcastActive}
              isTeacherMode={isTeacherMode}
              setIsTeacherMode={setIsTeacherMode}
              podcastDialogue={podcastDialogue}
              generatePodcastDiscussion={generatePodcastDiscussion}
              isGeneratingPodcast={isGeneratingPodcast}
              handlePodcastInput={handlePodcastInput}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              showPodcastUploadMenu={showPodcastUploadMenu}
              setShowPodcastUploadMenu={setShowPodcastUploadMenu}
              selectedNote={selectedNote}
              setSelectedNote={setSelectedNote}
              importedQuizNote={importedQuizNote}
              setImportedQuizNote={setImportedQuizNote}
              userNotes={userNotes}
              setUserNotes={setUserNotes}
              saveNote={saveNote}
              deleteNote={deleteNote}
              quizState={quizState}
              setQuizState={setQuizState}
              quizCreationMethod={quizCreationMethod}
              setQuizCreationMethod={setQuizCreationMethod}
              onGlobalBack={handleGlobalBack}
              quizTopic={quizTopic}
              setQuizTopic={setQuizTopic}
              quizQuestionCount={quizQuestionCount}
              setQuizQuestionCount={setQuizQuestionCount}
              quizDifficulty={quizDifficulty}
              setQuizDifficulty={setQuizDifficulty}
              quizAnswerType={quizAnswerType}
              setQuizAnswerType={setQuizAnswerType}
              quizAnswerTypes={quizAnswerTypes}
              setQuizAnswerTypes={setQuizAnswerTypes}
              dailyQuizUsedCount={dailyQuizUsedCount}
              quizImages={quizImages}
              setQuizImages={setQuizImages}
              isUploadingQuizImages={isUploadingQuizImages}
              isUploadingQuizDocs={isUploadingQuizDocs}
              handleQuizImageUpload={handleQuizImageUpload}
              removeQuizImage={removeQuizImage}
              quizDocuments={quizDocuments}
              setQuizDocuments={setQuizDocuments}
              handleQuizDocumentUpload={handleQuizDocumentUpload}
              removeQuizDocument={removeQuizDocument}
              isGeneratingQuiz={isGeneratingQuiz}
              generateQuiz={generateQuiz}
              examLobbyState={examLobbyState}
              setExamLobbyState={setExamLobbyState}
              studentName={studentName}
              setStudentName={setStudentName}
              matricNumber={matricNumber}
              setMatricNumber={setMatricNumber}
              showAdminLogin={showAdminLogin}
              setShowAdminLogin={setShowAdminLogin}
              examIdInput={examIdInput}
              setExamIdInput={setExamIdInput}
              isAuthLoading={isAuthLoading}
              adminMode={adminMode}
              setAdminMode={setAdminMode}
              adminPin={adminPin}
              setAdminPin={setAdminPin}
              handleAdminLogin={handleAdminLogin}
              handleMatricLogin={handleMatricLogin}
              isTakingPaid={isTakingPaid}
              examConfig={examConfig}
              startExam={startExam}
              examTimer={examTimer}
              currentExamIndex={currentExamIndex}
              setCurrentExamIndex={setCurrentExamIndex}
              examQuestions={examQuestions}
              submitExam={submitExam}
              examAnswers={examAnswers}
              setExamAnswers={setExamAnswers}
              examScore={examScore}
              quizQuestions={quizQuestions}
              currentQuestionIndex={currentQuestionIndex}
              setCurrentQuestionIndex={setCurrentQuestionIndex}
              shareQuiz={shareQuiz}
              userQuizAnswers={userQuizAnswers}
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
              isAnswered={isAnswered}
              setIsAnswered={setIsAnswered}
              handleOptionSelect={handleOptionSelect}
              prevQuestion={prevQuestion}
              nextQuestion={nextQuestion}
              quizScore={quizScore}
              handleShareResult={handleShareResult}
              uploadNoteFile={uploadNoteFile}
              notePreviewMode={notePreviewMode}
              setNotePreviewMode={setNotePreviewMode}
              podcastSpeechIndex={podcastSpeechIndex}
              stopPodcastSpeech={stopPodcastSpeech}
              playPodcastDialogueLine={playPodcastDialogueLine}
              scrollContainerRef={scrollContainerRef}
              handleNoteScroll={handleNoteScroll}
              setSelectedNoteTitle={(title: string) => setSelectedNote({ ...selectedNote, title })}
              handleNoteContentChange={handleNoteContentChange}
              lastFocusedBlock={lastFocusedBlock}
              insertText={insertText}
              noteBlocks={noteBlocks}
              updateBlock={updateBlock}
              removeBlock={removeBlock}
              noteScrollPos={noteScrollPos}
              scrollToPosition={scrollToPosition}
              noteHistory={noteHistory}
              setNoteHistory={setNoteHistory}
              redoStack={redoStack}
              setRedoStack={setRedoStack}
              undoNote={undoNote}
              redoNote={redoNote}
              initializePayment={initializePayment}
              handleTakingPaymentSuccess={handleTakingPaymentSuccess}
              handlePaystackClose={handlePaystackClose}
              uploadHistoryToOmni={uploadHistoryToOmni}
              shareAnalysis={shareAnalysis}
              handleToggleRecording={handleToggleRecording}
              handleSaveFacultyHistory={handleSaveFacultyHistory}
              addToFinishedHistory={addToFinishedHistory}
              finishedHistory={finishedHistory}
              activeAssignmentSolution={activeAssignmentSolution}
              setActiveAssignmentSolution={setActiveAssignmentSolution}
              getAiInstance={getAiInstance}
              getHfInstance={getHfInstance}
              fileToGenerativePart={fileToGenerativePart}
              studentActiveQuestions={studentActiveQuestions}
              activeStudentSubject={activeStudentSubject}
              setActiveStudentSubject={setActiveStudentSubject}
              handleUploadAudioRecordPage={handleUploadAudioRecordPage}
              activeAudioNoteId={activeAudioNoteId}
              isAudioTranscribing={isAudioTranscribing}
              audioTranscribingPopup={audioTranscribingPopup}
              setAudioTranscribingPopup={setAudioTranscribingPopup}
              subjectScores={subjectScores}
              onOpenOmniWithPrompt={handleOpenOmniWithPrompt}
            />
          )}

          {/* CHAT ROOM TAB */}
          {activeTab === 'chat' && (
            user ? (
              <ChatRoom 
                key="chat"
                theme={theme}
                user={user}
                userHandle={userHandle}
                userNotes={userNotes}
                onOpenNote={handleOpenSharedNote}
                onTagOmni={handleTagOmni}
                uploadToCloudinary={uploadToCloudinary}
                setUserNotification={setUserNotification}
                onChatSelect={(isActive) => setIsChatRoomActive(isActive)}
                setAppActiveTab={(tab) => setActiveTab(tab as any)}
                setToolsSubTab={(subTab) => setToolsSubTab(subTab as any)}
                setImportedQuizNote={setImportedQuizNote}
                setQuizTopic={setQuizTopic}
                generateQuiz={generateQuiz}
                initialSelectedChat={selectedChatForRoom}
                onOpenQuizById={(qId) => loadSharedQuiz(qId)}
              />
            ) : (
              <motion.div 
                key="chat-guest" 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto space-y-6 select-none my-12"
              >
                <div className="w-16 h-16 bg-[#DC2626]/10 rounded-2xl flex items-center justify-center text-[#DC2626]">
                  <MessageSquare size={36} />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">NSG Relay Chat Workspace</h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Join student chat rooms, converse with our smart academic AI assistant, OMNI, share study notebooks, and connect in real-time. Log in or quickly create your official NSG study account to begin.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center pt-2">
                  <button 
                    onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                    className="px-6 py-3.5 bg-[#DC2626] font-black uppercase text-[9px] tracking-widest text-white rounded-xl shadow-xl shadow-[#DC2626]/20 active:scale-95 transition-all cursor-pointer"
                  >
                    Register Account
                  </button>
                  <button 
                    onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                    className="px-6 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 font-black uppercase text-[9px] tracking-widest text-white rounded-xl active:scale-95 transition-all cursor-pointer"
                  >
                    Log In with Google / Email
                  </button>
                </div>
              </motion.div>
            )
          )}

          {/* CLASS ROOM TAB */}
          {activeTab === 'class' && (
            <div className="flex-1 overflow-hidden">
              {classRoomId ? (
                <ClassRoom 
                  theme={theme}
                  user={user}
                  userHandle={userHandle}
                  isHost={isHost}
                  classId={classRoomId}
                  onExit={() => { setClassRoomId(null); setActiveTab('home'); }}
                  uploadToCloudinary={uploadToCloudinary}
                  setUserNotification={setUserNotification}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 space-y-8 text-center relative">
                   <button 
                     type="button"
                     onClick={() => setActiveTab('tools')}
                     className="absolute top-4 left-4 flex items-center gap-2 bg-[#1E1B2E] border border-white/5 hover:border-[#DC2626]/40 text-[9px] uppercase tracking-widest text-white/75 font-black px-4 py-2.5 rounded-xl transition-all shadow-inner active:scale-95"
                   >
                     ← Back to Tools
                   </button>
                   <div className="space-y-4 mt-8">
                     <div className="w-16 h-16 bg-[#DC2626]/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
                        <Video size={32} className="text-[#DC2626]" />
                     </div>
                     <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">NSG Live Classes</h2>
                     <p className="text-sm text-white/40 max-w-xs mx-auto">Host professional lecture rooms with video, audio, and real-time classboards.</p>
                   </div>
                   
                   <div className="w-full max-w-sm space-y-3">
                     <button 
                       onClick={startClass}
                       className="w-full bg-[#DC2626] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#DC2626]/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                     >
                       <Zap size={18} /> Host New Class
                     </button>
                     <div className="flex items-center gap-3 py-2">
                       <div className="h-px flex-1 bg-white/5" />
                       <span className="text-[8px] font-black text-white/20 uppercase">Or</span>
                       <div className="h-px flex-1 bg-white/5" />
                     </div>
                     <div className="flex gap-2">
                       <input 
                         id="join-class-id"
                         placeholder="Enter Class ID (NSG-XXXX)"
                         className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 text-xs text-white outline-none focus:border-[#DC2626]"
                       />
                       <button 
                         onClick={() => {
                           const el = document.getElementById('join-class-id') as HTMLInputElement;
                           if (el.value) joinClass(el.value);
                         }}
                         className="bg-white/10 text-white font-black px-6 py-4 rounded-2xl text-xs uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all"
                       >
                         Join
                       </button>
                     </div>
                   </div>
                </div>
              )}
            </div>
          )}

          {/* AI CHAT TAB REMOVED */}
          {false && activeTab === 'ai' && (
            <motion.div 
              key="ai" 
              initial={{opacity:0}} 
              animate={{opacity:1}} 
              exit={{opacity: 0}} 
              className="flex flex-1 rounded-2xl sm:rounded-3xl border overflow-hidden relative shadow-2xl mx-[-8px] sm:mx-0 flex-col h-full"
              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              
              {/* Sidebar Drawer */}
              <AnimatePresence>
                {showChatSidebar && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setShowChatSidebar(false)}
                      className="absolute inset-0 bg-black/60 backdrop-blur-md z-[60]"
                    />
                    <motion.div 
                      initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                      className="absolute left-0 top-0 bottom-0 w-[80%] max-w-[320px] z-[70] border-r flex flex-col shadow-2xl"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                    >
                      <div className="p-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                        <button onClick={resetChat} className="w-full flex items-center justify-center gap-2 btn-primary mb-3">
                          <Plus size={18} /> NEW SESSION
                        </button>
                        {chatHistory.length > 0 && (
                          <button 
                            onClick={() => {
                              showConfirm(
                                "Clear Session",
                                "Are you sure you want to clear all messages in this session?",
                                () => setChatHistory([]),
                                "Clear All",
                                true
                              );
                            }}
                            className="w-full flex items-center justify-center gap-2 btn-ghost text-xs font-black hover:text-red-500 transition-all mb-3"
                          >
                            <Trash2 size={16} /> CLEAR CONVERSATION
                          </button>
                        )}
                        <div className="p-4 rounded-2xl border" style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)' }}>Premium Status</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isPremium ? 'text-yellow-500' : ''}`} style={!isPremium ? { color: 'var(--text-tertiary)' } : {}}>{isPremium ? 'Active' : 'Free Tier'}</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: isPremium ? '100%' : '10%' }} className={`h-full ${isPremium ? 'bg-yellow-500' : 'bg-[#DC2626]'}`} />
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest px-2 mb-2" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)' }}>Recent Saved Chats</p>
                        {chatSessions.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)).map(session => (
                          <div 
                            key={session.id} 
                            onClick={() => loadChatSession(session.id)} 
                            className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group border ${activeChatSessionId === session.id ? 'text-white' : 'hover:bg-white/5'}`}
                            style={activeChatSessionId === session.id ? { background: 'var(--bg-elevated)', borderColor: 'var(--border-medium)' } : { borderColor: 'transparent', color: 'var(--text-secondary)' }}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <MessageSquare size={14} className={`flex-shrink-0 ${session.isPinned ? 'text-yellow-500' : ''}`} />
                              <span className="text-xs font-bold truncate">{session.title}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-all flex-shrink-0">
                              <button 
                                onClick={(e) => { e.stopPropagation(); togglePinChatSession(session.id); }} 
                                className={`p-1.5 hover:text-yellow-500 transition-all ${session.isPinned ? 'text-yellow-500' : ''}`}
                                style={!session.isPinned ? { color: 'var(--text-tertiary)' } : {}}
                              >
                                <Pin size={14} />
                              </button>
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  const newTitle = prompt("Rename chat:", session.title);
                                  if (newTitle) renameChatSession(session.id, newTitle);
                                }} 
                                className="p-1.5 hover:text-blue-500 transition-all"
                                style={{ color: 'var(--text-tertiary)' }}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteChatSession(session.id); }} 
                                className="p-1.5 hover:text-[#DC2626] transition-all"
                                style={{ color: 'var(--text-tertiary)' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Main Chat Area */}
              <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                <AnimatePresence>
                  {/* Removed legacy isLiveActive trigger as it moved to tools */}
                </AnimatePresence>
                {/* Chat Header */}
                <div 
                  className="p-4 border-b flex items-center justify-between bg-black/20 backdrop-blur-md sticky top-0 z-20"
                  style={{ borderBottomColor: 'var(--border-subtle)' }}
                >
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowChatSidebar(true)} className="p-2 hover:bg-white/5 rounded-xl transition-all" style={{ color: 'var(--text-primary)' }}><Menu size={20} /></button>
                    
                    {/* Branded Omni & Zeal Logo */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                        <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.2)] shrink-0">
                          <Brain size={14} className="text-red-500 drop-shadow-[0_0_5px_#EF4444] animate-pulse" />
                        </div>
                        <div className="w-2.5 h-2.5 flex items-center justify-center text-white/10 font-black text-[8px] font-mono">&</div>
                        <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center border border-red-900/30 shrink-0">
                          <span className="font-display font-black text-red-700 text-xs">Z</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <h3 className="text-xs font-black text-white uppercase tracking-tight leading-none" style={{ fontFamily: 'var(--font-display)' }}>Omni</h3>
                          <span className="text-[10px] font-black text-red-500 uppercase leading-none">&</span>
                          <h3 className="text-xs font-black text-red-600 uppercase tracking-tight leading-none" style={{ fontFamily: 'var(--font-display)' }}>Zeal</h3>
                        </div>
                        <p className="text-[7px] font-bold text-red-500 uppercase tracking-[0.15em] mt-0.5 animate-pulse">Dual Neural Core</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSplitNotepadOpen(!splitNotepadOpen)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all border ${
                        splitNotepadOpen ? 'bg-[#DC2626]/20 border-[#DC2626]/40 text-[#DC2626]' : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                      }`}
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      <Terminal size={12} /> Note Board
                    </button>
                    {isPremium && <div className="bg-yellow-500/10 text-yellow-500 px-2.5 py-1 rounded-md text-[8px] font-black uppercase border border-yellow-500/20" style={{ fontFamily: 'var(--font-display)' }}>Premium</div>}
                  </div>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
                  {/* Left Side: Messages and input container */}
                  <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative">
                    
                    {/* Messages Area with WhatsApp-style subtle dot wallpaper */}
                    <div 
                      ref={chatContainerRef} 
                      className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 scroll-smooth custom-scrollbar"
                      style={{
                        backgroundColor: theme === 'dark' ? '#0C0F17' : '#EFEAE2',
                        backgroundImage: theme === 'dark' 
                          ? 'radial-gradient(rgba(220, 38, 38, 0.05) 1px, transparent 1px), radial-gradient(rgba(220, 38, 38, 0.02) 1.5px, transparent 1.5px)' 
                          : 'radial-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                        backgroundPosition: '0 0, 12px 12px'
                      }}
                    >
                      <AdUnit slot="7536999840" />
                      
                      {chatHistory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center px-4">
                          <div className="max-w-2xl w-full text-center space-y-10 py-6">
                            
                            {/* Gemini Inspired Greeting Header */}
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-4"
                            >
                              {/* Glowing Omni & Zeal Emblem */}
                              <div className="flex items-center justify-center gap-3 mb-6">
                                {/* Omni */}
                                <div 
                                  className="w-14 h-14 rounded-2xl flex items-center justify-center bg-black border-2 border-red-500/40 relative shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                >
                                  <Brain size={24} className="text-red-500 drop-shadow-[0_0_6px_#EF4444] animate-pulse" />
                                </div>
                                <span className="text-red-500/30 text-lg font-bold font-mono">&</span>
                                {/* Zeal */}
                                <div 
                                  className="w-14 h-14 rounded-2xl flex items-center justify-center bg-black border-2 border-red-950/40 relative shadow-[0_0_10px_rgba(139,0,0,0.1)]"
                                >
                                  <span className="font-display font-black text-red-700 text-xl">Z</span>
                                </div>
                              </div>
                              
                              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-[#DC2626] via-pink-500 to-blue-500 font-display" style={{ fontFamily: 'var(--font-display)' }}>
                                Hello, {currentUserData?.displayName?.split(' ')?.[0] || 'Scholar'}
                              </h2>
                              <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-[var(--text-secondary)]" style={{ fontFamily: 'var(--font-display)' }}>
                                What workspace task shall we execute together today?
                              </p>
                            </motion.div>

                            {/* Bento Suggestion Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {[
                                { icon: ImageIcon, label: 'Create Image', desc: 'Synthesize art vectors through AI', color: 'text-blue-400', prompt: 'Generate a creative image of...' },
                                { icon: Mic, label: 'Compose Sound', desc: 'Forge custom melodies & music', color: 'text-red-400', prompt: 'Compose a short melody about...' },
                                { icon: FileText, label: 'Write Analysis', desc: 'Draft reports, essays or formulations', color: 'text-emerald-400', prompt: 'Write a professional article about...' },
                                { icon: BookOpen, label: 'Clarify Science', desc: 'Deconstruct and tutor topics', color: 'text-amber-400', prompt: 'Explain the concept of...' }
                              ].map((btn, idx) => (
                                <motion.button
                                  key={idx}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: idx * 0.08 }}
                                  onClick={() => setChatInput(btn.prompt)}
                                  className="flex items-center gap-4 p-5 rounded-2xl hover:border-[#DC2626]/30 transition-all group text-left relative overflow-hidden active:scale-95 border cursor-pointer"
                                  style={{
                                    background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)',
                                    borderColor: 'var(--border-subtle)',
                                    boxShadow: 'var(--shadow-card)'
                                  }}
                                >
                                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus size={14} className="text-[var(--text-tertiary)]" />
                                  </div>
                                  <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                                    <btn.icon size={20} className={btn.color} />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-tight font-display" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{btn.label}</p>
                                    <p className="text-[8px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-secondary)' }}>{btn.desc}</p>
                                  </div>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        chatHistory.map((msg, i) => {
                          const isReport = msg.text.includes('LECTURE ANALYSIS') || msg.text.includes('SUMMARY DATA');
                          const quizReadyRegex = /\[\[QUIZ_READY:\s*([^,\]]+),\s*([^,\]]+),\s*(\d+)\s*\]\]/i;
                          const quizGenRegex = /\[\[GENERATE_QUIZ:\s*([^,\]]+),\s*(\d+)\s*\]\]/i;

                          const quizReadyMatch = msg.text.match(quizReadyRegex);
                          const quizGenMatch = msg.text.match(quizGenRegex);

                          const cleanContent = msg.text
                            .replace(quizReadyRegex, '')
                            .replace(quizGenRegex, '')
                            .trim();

                          return (
                            <div key={i} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[90%] sm:max-w-[80%] flex gap-2 sm:gap-3 items-end ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                
                                {/* Branded AI Profile Avatar (WhatsApp themed) */}
                                {msg.role === 'model' && (
                                  <div 
                                    className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center relative shadow-sm"
                                    style={{
                                      background: 'linear-gradient(135deg, #FF007F 0%, #DC2626 100%)'
                                    }}
                                  >
                                    <Brain size={12} className="text-white" />
                                  </div>
                                )}

                                <div className="flex flex-col space-y-1">
                                  {/* WhatsApp / Gemini Themed Message Bubble */}
                                  <div className={`p-3.5 sm:p-4 rounded-2xl leading-relaxed text-[13px] sm:text-[14px] shadow-sm relative ${
                                    msg.role === 'user'
                                      ? (theme === 'dark'
                                          ? 'bg-[#005c4b] text-[#efeae2] rounded-tr-none border border-[#0d645a]/30 text-left'
                                          : 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none border border-[#c1ebd1]/55 text-left')
                                      : (theme === 'dark' 
                                          ? 'bg-white/[0.035] backdrop-blur border border-white/10 text-white rounded-tl-none text-left' 
                                          : 'bg-white text-zinc-800 border border-slate-200/80 rounded-tl-none text-left')
                                  }`}>
                                    
                                    {/* Markdown Content Block */}
                                    <div className="selectable-text">
                                      <MarkdownRenderer content={cleanContent} />
                                    </div>

                                    {/* Action item card for READY quiz generated by Omni */}
                                    {quizReadyMatch && (
                                      <div className="mt-3.5 p-4 bg-gradient-to-r from-red-950/40 via-[#DC2626]/10 to-purple-950/40 border border-[#DC2626]/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-lg">
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#DC2626] to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
                                            <Trophy size={18} />
                                          </div>
                                          <div>
                                            <p className="text-[8px] font-black uppercase text-[#DC2626] tracking-widest leading-none mb-1">Omni Generated Quiz Ready</p>
                                            <p className="text-xs font-black text-white uppercase tracking-tight line-clamp-1">{quizReadyMatch[2]?.trim()}</p>
                                            <p className="text-[10px] text-white/60 font-medium">{quizReadyMatch[3]} Interactive Questions Ready</p>
                                          </div>
                                        </div>
                                        <button 
                                          onClick={() => {
                                            const targetQuizId = quizReadyMatch[1]?.trim();
                                            const existingQuiz = finishedHistory.find(h => h.id === targetQuizId);
                                            if (existingQuiz) {
                                              setQuizTopic(existingQuiz.topic || existingQuiz.title || 'Quiz');
                                              setQuizQuestions(existingQuiz.questions || []);
                                              setCurrentQuestionIndex(0);
                                              setQuizScore(0);
                                              setUserQuizAnswers([]);
                                              setQuizState('active');
                                              setSelectedOption(null);
                                              setIsAnswered(false);
                                              setCurrentQuizId(existingQuiz.id);
                                            } else {
                                              setQuizState('active');
                                            }
                                            setActiveTab('tools');
                                            setToolsSubTab('quiz');
                                          }}
                                          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-[#DC2626] to-rose-600 hover:opacity-90 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/30 transition-all text-center flex items-center justify-center gap-2 shrink-0 cursor-pointer border border-white/20"
                                        >
                                          <Play size={12} className="fill-white" /> Open Quiz
                                        </button>
                                      </div>
                                    )}

                                    {/* Action item card for self-set quiz inside the AI bubble */}
                                    {quizGenMatch && !quizReadyMatch && (
                                      <div className="mt-3.5 p-4 bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                          <div className="w-10 h-10 rounded-xl bg-[#DC2626]/20 flex items-center justify-center text-[#DC2626] shrink-0">
                                            <Trophy size={18} />
                                          </div>
                                          <div>
                                            <p className="text-[8px] font-black uppercase text-[#DC2626]/80 tracking-widest leading-none mb-1">Omni Self-Set Quiz Available</p>
                                            <p className="text-xs font-black text-white uppercase tracking-tight line-clamp-1">{quizGenMatch[1]?.trim()}</p>
                                            <p className="text-[10px] text-white/50">{quizGenMatch[2]} custom active questions set by Omni</p>
                                          </div>
                                        </div>
                                        <button 
                                          onClick={() => {
                                            const quizTopicText = quizGenMatch[1]?.trim() || "Omni Active Quiz";
                                            const quizCountNum = parseInt(quizGenMatch[2], 10) || 5;
                                            setActiveTab('tools');
                                            setToolsSubTab('quiz');
                                            generateQuiz(quizTopicText, quizCountNum, 'Medium', true); 
                                          }}
                                          className="w-full sm:w-auto px-4 py-2 bg-[#DC2626] hover:bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow transition-all text-center flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                                        >
                                          <Play size={10} className="fill-white" /> Start Quiz
                                        </button>
                                      </div>
                                    )}

                                    {/* Double Check Ticks & Time stamps (WhatsApp style) inside user message bubble */}
                                    {msg.role === 'user' && (
                                      <div className="flex items-center justify-end gap-1 mt-1.5 self-end opacity-60 text-[9px] font-mono leading-none select-none">
                                        <span className={theme === 'dark' ? 'text-teal-100/70' : 'text-zinc-500'}>{msg.timestamp}</span>
                                        <CheckCheck size={11} className={theme === 'dark' ? 'text-[#53bdeb]' : 'text-[#34B7F1] inline'} />
                                      </div>
                                    )}

                                    {/* Time stamps inside system/model message bubble */}
                                    {msg.role === 'model' && (
                                      <div className="flex items-center justify-end gap-1 mt-1.5 opacity-40 text-[9px] font-mono leading-none select-none">
                                        <span>{msg.timestamp}</span>
                                      </div>
                                    )}

                                    {/* Generated Image rendering if any */}
                                    {msg.image && (
                                      <div className="mt-3 space-y-2">
                                        <img src={msg.image} alt="Generated Asset" className="rounded-xl border border-white/5 max-w-full h-auto shadow-md" />
                                        <a href={msg.image} download="NSG_Generated_Asset.png" className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border border-white/10">
                                          <Download size={11} /> Save Image
                                        </a>
                                      </div>
                                    )}
                                  </div>

                                  {/* Gemini Styled Horizontal Action pill tray */}
                                  {msg.role === 'model' && (
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1.5 font-mono text-[9px] select-none pl-1">
                                      <button 
                                        onClick={() => {
                                          const prevUserMsg = chatHistory[i - 1]?.text || cleanContent;
                                          handleSendMessage(prevUserMsg);
                                        }}
                                        className="h-6 px-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5 hover:border-white/10 flex items-center gap-1 rounded-full font-bold uppercase tracking-tight cursor-pointer"
                                        title="Try Again"
                                      >
                                        <RefreshCw size={10} /> Try Again
                                      </button>
                                      
                                      <button 
                                        onClick={() => copyToClipboard(msg.text)}
                                        className="h-6 px-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5 hover:border-white/10 flex items-center gap-1 rounded-full font-bold uppercase tracking-tight cursor-pointer"
                                        title="Copy Response"
                                      >
                                        <Copy size={10} /> Copy
                                      </button>

                                      <button 
                                        onClick={() => handleTTSPlayback(cleanContent, i.toString())}
                                        className={`h-6 px-2 rounded-full border flex items-center gap-1 font-bold uppercase tracking-tight transition-all cursor-pointer ${
                                          speechActiveId === i.toString() ? 'bg-[#DC2626]/20 border-[#DC2626]/40 text-[#DC2626]' : 'bg-white/5 border-white/5 text-white/40 hover:text-white hover:border-white/10'
                                        }`}
                                        title="Vocalize"
                                      >
                                        <Volume2 size={10} /> Listen
                                      </button>

                                      <button 
                                        onClick={() => handlePDFDownload(cleanContent)}
                                        className="h-6 px-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-emerald-400 transition-all border border-white/5 hover:border-white/10 flex items-center gap-1 rounded-full font-bold uppercase tracking-tight cursor-pointer"
                                        title="Save Draft Report"
                                      >
                                        <Download size={10} /> Save Study
                                      </button>

                                      <button 
                                        onClick={() => {
                                          setNotepadContent(prev => prev + `\n\n--- Omni Study Note ---\n${cleanContent}`);
                                          setSplitNotepadOpen(true);
                                          setUserNotification("Sent to your study note board successfully!");
                                        }}
                                        className="h-6 px-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-pink-400 transition-all border border-white/5 hover:border-white/10 flex items-center gap-1 rounded-full font-bold uppercase tracking-tight cursor-pointer"
                                        title="Sent to Study Note Board"
                                      >
                                        <Terminal size={10} /> Note Draft
                                      </button>

                                      {/* Gemini-style Style Transmuter Dropdown */}
                                      <div className="relative group/style shrink-0 z-30">
                                        <button className="h-6 px-2.5 bg-white/5 hover:bg-white/10 text-[9px] font-bold border border-white/5 hover:border-white/10 rounded-full flex items-center gap-1 hover:text-white transition-all uppercase tracking-tight cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                                          Rewrite style
                                        </button>
                                        <div className="absolute bottom-full mb-1 left-0 hidden group-hover/style:flex flex-col bg-[#110E1E] border border-white/10 rounded-xl p-1 w-44 shadow-2xl z-40">
                                          <button onClick={() => handleStyleTransmute(cleanContent, "Make response shorter and more concise")} className="p-2 hover:bg-white/5 text-left rounded-lg text-[9px] text-zinc-350 font-bold uppercase cursor-pointer">Shorter Draft</button>
                                          <button onClick={() => handleStyleTransmute(cleanContent, "Make response longer and more detailed")} className="p-2 hover:bg-white/5 text-left rounded-lg text-[9px] text-zinc-350 font-bold uppercase cursor-pointer">Detailed Study</button>
                                          <button onClick={() => handleStyleTransmute(cleanContent, "Simplify language so it's easier to understand")} className="p-2 hover:bg-white/5 text-left rounded-lg text-[9px] text-zinc-350 font-bold uppercase cursor-pointer">Simplify Concepts</button>
                                          <button onClick={() => handleStyleTransmute(cleanContent, "Formulate in highly professional academic delivery standard")} className="p-2 hover:bg-white/5 text-left rounded-lg text-[9px] text-zinc-350 font-bold uppercase cursor-pointer">Academic Tone</button>
                                        </div>
                                      </div>

                                      <button 
                                        onClick={() => {
                                          const newHistory = chatHistory.filter((_, idx) => idx !== i);
                                          setChatHistory(newHistory);
                                        }}
                                        className="h-6 w-6 bg-white/5 hover:bg-white/10 text-white/40 hover:text-red-500 transition-all border border-white/5 hover:border-white/10 flex items-center justify-center rounded-full font-bold uppercase tracking-tight cursor-pointer"
                                        title="Delete Message"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {/* Gemini-Style Pulsing Typing Loader */}
                      {isTyping && (
                        <div className="flex justify-start w-full">
                          <div className="flex gap-3 items-end">
                            <div 
                              className="w-7 h-7 rounded-lg flex items-center justify-center border shadow-sm relative shrink-0"
                              style={{ background: 'linear-gradient(135deg, #FF007F 0%, #DC2626 100%)', borderColor: 'var(--border-subtle)' }}
                            >
                              <Brain size={12} className="text-white animate-pulse" />
                            </div>
                            <div 
                              className="p-3.5 rounded-2xl rounded-tl-none border flex items-center gap-3 backdrop-blur-md"
                              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
                            >
                              <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest leading-none">Omni is formulating answers</span>
                              <div className="flex gap-1 items-center">
                                <span className="w-1.5 h-1.5 bg-[#DC2626] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-[#DC2626] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-[#DC2626] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Gemini/WhatsApp Styled Bottom Input dock */}
                    <div 
                      className="p-4 sm:p-6 border-t flex-shrink-0 z-20"
                      style={{ background: 'var(--bg-surface)', borderTopColor: 'var(--border-subtle)' }}
                    >
                      <div className="w-full max-w-4xl mx-auto space-y-4">
                        
                        {/* File Upload Preview Panel */}
                        <AnimatePresence>
                          {uploadedImages.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="flex gap-2 p-3 border rounded-2xl overflow-x-auto no-scrollbar"
                              style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                            >
                              {uploadedImages.map(img => (
                                <div key={img.id} className="relative group flex-shrink-0">
                                  <img src={img.preview} className="w-14 h-14 object-cover rounded-xl border" style={{ borderColor: 'var(--border-subtle)' }} />
                                  <button 
                                    onClick={() => setUploadedImages(prev => prev.filter(i => i.id !== img.id))}
                                    className="absolute -top-1.5 -right-1.5 bg-[#DC2626] text-white p-1 rounded-full shadow-lg hover:scale-110 transition-all"
                                  >
                                    <X size={8} />
                                  </button>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Top Mode Selector Tabs */}
                        <div className="flex items-center justify-between px-1 gap-4">
                          <div className="flex items-center gap-1 bg-white/5 border border-white/5 p-1 rounded-full">
                            {[
                              { id: 'General', icon: Brain, label: 'General' },
                              { id: 'Vision', icon: Camera, label: 'Vision' },
                              { id: 'Creative', icon: BrainCircuit, label: 'Creative' }
                            ].map(mode => (
                              <button 
                                key={mode.id}
                                onClick={() => setChatMode(mode.id as any)}
                                className={`flex items-center gap-1 px-3 py-1 text-[9px] font-bold uppercase transition-all rounded-full border cursor-pointer ${chatMode === mode.id ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-sm' : 'text-white/40 hover:bg-white/5 border-transparent'}`}
                                style={chatMode === mode.id ? { fontFamily: 'var(--font-display)' } : {}}
                              >
                                <mode.icon size={11} /> {mode.label}
                              </button>
                            ))}
                          </div>
                          
                          {uploadedImages.length === 0 && !chatInput && (
                            <p className="text-[8px] font-black uppercase tracking-widest text-[#DC2626] animate-pulse hidden md:block">
                              vision accommodates diagrams • creative outputs images
                            </p>
                          )}
                        </div>

                        {/* Floatable Rounded Input Bubble */}
                        <div className="relative group">
                          <div className="absolute -inset-1 bg-gradient-to-r from-[#DC2626]/20 to-blue-500/20 rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                          <div 
                            className="relative flex items-center border rounded-[2rem] p-1.5 backdrop-blur-xl focus-within:border-[#DC2626]/50 transition-all gap-1.5"
                            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
                          >
                            {/* Left Hand Plus Menu and attachment popover */}
                            <div className="relative pl-1.5">
                              <button
                                type="button"
                                onClick={() => setShowAppPlusMenu(!showAppPlusMenu)}
                                className={`w-10 h-10 rounded-full transition-all flex items-center justify-center cursor-pointer border ${showAppPlusMenu ? 'bg-[#DC2626] text-white border-[#DC2626]' : 'bg-white/5 text-white/50 border-white/10 hover:text-white hover:bg-white/10'}`}
                                title="Add Attachment"
                              >
                                <Plus size={18} className={`transition-transform duration-200 ${showAppPlusMenu ? 'rotate-45' : ''}`} />
                              </button>

                              <AnimatePresence>
                                {showAppPlusMenu && (
                                  <>
                                    <div className="fixed inset-0 z-30" onClick={() => setShowAppPlusMenu(false)} />
                                    <motion.div
                                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                      className="absolute bottom-12 left-0 bg-[#120F1F] border border-white/10 p-2 rounded-2xl min-w-[140px] shadow-2xl z-40 flex flex-col gap-1 text-left"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowAppPlusMenu(false);
                                          setSplitNotepadOpen(!splitNotepadOpen);
                                        }}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5 text-xs font-bold transition-all text-left w-full"
                                      >
                                        <BookOpen size={14} className="text-[#DC2626]" /> notes
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowAppPlusMenu(false);
                                          appGalleryInputRef.current?.click();
                                        }}
                                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5 text-xs font-bold transition-all text-left w-full"
                                      >
                                        <ImageIcon size={14} className="text-blue-400" /> gallery
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowAppPlusMenu(false);
                                          appFilesInputRef.current?.click();
                                        }}
                                        className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5 text-xs font-bold transition-all text-left w-full"
                                      >
                                        <Paperclip size={14} className="text-emerald-400" /> files
                                      </button>
                                    </motion.div>
                                  </>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Hidden file inputs */}
                            <input 
                              type="file" 
                              ref={appGalleryInputRef} 
                              className="hidden" 
                              multiple
                              accept="image/*" 
                              onChange={(e) => {
                                if (e.target.files) {
                                  const files = Array.from(e.target.files).map(f => ({
                                    id: Math.random().toString(36).substr(2, 9),
                                    file: f,
                                    preview: URL.createObjectURL(f),
                                    type: 'image' as const
                                  }));
                                  setUploadedImages(prev => [...prev, ...files]);
                                  setChatMode('Vision');
                                }
                                setShowAppPlusMenu(false);
                              }}
                            />
                            <input 
                              type="file" 
                              ref={appFilesInputRef} 
                              className="hidden" 
                              multiple
                              accept="*/*" 
                              onChange={(e) => {
                                if (e.target.files) {
                                  const files = Array.from(e.target.files).map(f => ({
                                    id: Math.random().toString(36).substr(2, 9),
                                    file: f,
                                    preview: URL.createObjectURL(f),
                                    type: f.type.startsWith('image/') ? ('image' as const) : ('audio' as const)
                                  }));
                                  setUploadedImages(prev => [...prev, ...files]);
                                  if (files.some(f => f.type === 'image')) setChatMode('Vision');
                                }
                                setShowAppPlusMenu(false);
                              }}
                            />

                            {/* Main Input Textarea */}
                            <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder="Ask Omni anything or paste questions..." className="flex-1 bg-transparent px-3 py-2 text-xs font-sans outline-none text-white resize-none max-h-32 leading-relaxed" rows={1}></textarea>

                            {/* Record or Send button at the right end */}
                            {isRecordingChat ? (
                              <button 
                                onClick={stopChatRecording} 
                                className="w-10 h-10 rounded-full bg-[#DC2626] text-white animate-pulse flex items-center justify-center cursor-pointer shrink-0"
                                title="Stop Recording"
                              >
                                <StopCircle size={18} />
                              </button>
                            ) : chatInput.trim() ? (
                              <button 
                                onClick={() => handleSendMessage()} 
                                disabled={isTyping}
                                className="w-10 h-10 rounded-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white flex items-center justify-center transition-all shadow-md shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 cursor-pointer"
                                title="Send"
                              >
                                {isTyping ? <RefreshCcw size={16} className="animate-spin" /> : <Zap size={16} />}
                              </button>
                            ) : (
                              <button 
                                onClick={startChatRecording} 
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all flex items-center justify-center cursor-pointer shrink-0 border border-white/5"
                                title="Record Voice"
                              >
                                <Mic size={18} />
                              </button>
                            )}

                          </div>
                        </div>
                        <p className="text-[7.5px] text-center mt-3 font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-display)' }}>Omni is a helper. Double-check facts.</p>
                      </div>
                    </div>

                  </div>

                {/* Right Side: Note Board Panel */}
                {splitNotepadOpen && (
                  <div className="w-full lg:w-96 bg-[#040406] border-l border-white/5 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200 shrink-0 z-20">
                    <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-350 uppercase">
                        <Terminal size={16} className="text-[#DC2626]" /> Study Note Board
                      </div>
                      <button onClick={() => setSplitNotepadOpen(false)} className="text-white/40 hover:text-white transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex-1 p-4 flex flex-col space-y-3 bg-[#030304]">
                      <p className="text-[10px] font-mono text-white/40 uppercase leading-normal">Draft study notes or copy codes alongside Omni AI answers.</p>
                      <textarea value={notepadContent} onChange={e => setNotepadContent(e.target.value)} className="flex-1 w-full p-3 bg-black border border-white/5 rounded-xl text-xs font-mono outline-none text-emerald-400 resize-none leading-relaxed focus:border-[#DC2626]"></textarea>
                      <button 
                        onClick={() => {
                          const blob = new Blob([notepadContent], { type: 'text/plain;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `NSG_Study_Notes_${Date.now()}.txt`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                          setUserNotification("Successfully downloaded draft study notes text!");
                        }}
                        className="w-full py-2.5 bg-gradient-to-r from-red-650 to-purple-650 hover:opacity-95 text-white font-mono font-bold text-[10px] uppercase rounded-xl transition-all"
                      >
                        Download Draft Notes
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </motion.div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div key="notifications" className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setActiveTab('home')}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95"
                    title="Back to Home"
                  >
                    <ArrowLeft size={16} />
                    <span>Home</span>
                  </button>
                  <h2 className="text-xl font-black uppercase tracking-tighter text-white">Notifications</h2>
                </div>
                <Bell size={20} className="text-[#8B5CF6]" />
              </div>

              {selectedArticle ? (
                <div className="space-y-6">
                  <button 
                    onClick={() => setSelectedArticle(null)}
                    className="flex items-center gap-2 text-[10px] font-black text-amber-400 uppercase tracking-widest hover:opacity-70 transition-all cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Back to List
                  </button>
                  <div className={`${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} p-8 rounded-3xl border shadow-sm space-y-6`}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-black text-amber-400 uppercase tracking-widest">
                        <Calendar size={12} />
                        {selectedArticle.timestamp?.toDate ? selectedArticle.timestamp.toDate().toLocaleDateString() : 'Just now'}
                      </div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">{selectedArticle.title}</h2>
                    </div>
                    <div className={`markdown-body text-sm leading-relaxed ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                      <MarkdownRenderer content={selectedArticle.content} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* BROADCASTS & ANNOUNCEMENTS */}
                  <div className="space-y-3 text-left">
                    <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] px-2 flex items-center gap-1.5 leading-none mb-1">
                      <span>📢 Broadcasts & Announcements</span>
                    </h3>

                    {blogPosts.length === 0 ? (
                      <div className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-12 rounded-3xl border shadow-sm text-center space-y-4`}>
                        <div className="w-16 h-16 bg-[#8B5CF6]/10 rounded-full flex items-center justify-center mx-auto">
                          <BookOpen size={32} className="text-[#8B5CF6]" />
                        </div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">No Articles Yet</h2>
                        <p className="text-sm text-white/40">Check back later for updates from the NSG team.</p>
                      </div>
                    ) : (
                      blogPosts.map((post) => (
                        <div 
                          key={post.id} 
                          onClick={() => {
                            setSelectedArticle(post);
                            markArticleAsRead(post.id);
                          }}
                          className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group ${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10 hover:border-[#8B5CF6]/50' : 'bg-white border-slate-200 hover:border-[#8B5CF6]/50 shadow-sm'}`}
                        >
                          {!readArticles.includes(post.id) && (
                            <div className="absolute top-4 right-4 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                          )}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[8px] font-black text-amber-400 uppercase tracking-widest">
                              <Calendar size={10} />
                              {post.timestamp?.toDate ? post.timestamp.toDate().toLocaleDateString() : 'Just now'}
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-[#8B5CF6] transition-colors">{post.title}</h3>
                            <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">
                              {post.content.replace(/[#*`]/g, '')}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* ACTIVITY / STREAK NOTIFICATIONS */}
                  <div className="space-y-3 text-left pt-2">
                    <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] px-2 flex items-center gap-1.5 leading-none mb-2">
                      <Bell size={14} className="text-[#8B5CF6]" />
                      <span>Activity</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {(() => {
                        const notificationsToDisplay = personalNotifications.length > 0 
                          ? personalNotifications 
                          : [
                              {
                                id: 'fallback-streak-1',
                                title: 'Daily streak',
                                message: "Complete one lesson to get today's reward. Test your understanding with an instant quiz or practice exam.",
                                timestamp: new Date(Date.now() - 11 * 86400000),
                                type: 'streak'
                              },
                              {
                                id: 'fallback-streak-2',
                                title: 'Daily streak',
                                message: "Complete one lesson to get today's reward. Review lecture notes to boost retention.",
                                timestamp: new Date(Date.now() - 15 * 86400000),
                                type: 'streak'
                              },
                              {
                                id: 'fallback-streak-3',
                                title: 'Daily streak',
                                message: "Complete one lesson to get today's reward. Boost your Scholar Division ranking!",
                                timestamp: new Date(Date.now() - 62 * 86400000),
                                type: 'streak'
                              },
                              {
                                id: 'fallback-streak-4',
                                title: 'Daily streak',
                                message: "Complete one lesson to get today's reward and maintain your continuous learning momentum.",
                                timestamp: new Date(Date.now() - 105 * 86400000),
                                type: 'streak'
                              },
                              {
                                id: 'fallback-streak-5',
                                title: 'Daily streak',
                                message: "Complete one lesson to get today's reward and unlock bonus achievements.",
                                timestamp: new Date(Date.now() - 107 * 86400000),
                                type: 'streak'
                              }
                            ];

                        return notificationsToDisplay.map((notif, idx) => {
                          const getRelativeTime = (ts: any) => {
                            if (!ts) return 'Just now';
                            const d = ts.toDate ? ts.toDate() : (ts instanceof Date ? ts : new Date(ts));
                            const now = new Date();
                            const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
                            if (isNaN(diffSec) || diffSec <= 0) return 'Just now';
                            const diffMin = Math.floor(diffSec / 60);
                            if (diffMin < 60) return `${diffMin}m ago`;
                            const diffHr = Math.floor(diffMin / 60);
                            if (diffHr < 24) return `${diffHr}h ago`;
                            const diffDays = Math.floor(diffHr / 24);
                            if (diffDays === 1) return '1 day ago';
                            return `${diffDays} days ago`;
                          };

                          return (
                            <div 
                              key={`${notif.id || 'notif'}-${idx}`}
                              onClick={() => {
                                if (notif.type !== 'streak_request' || notif.resolved) {
                                  handleNotificationClick(notif);
                                }
                              }}
                              className={`p-4 rounded-[1.25rem] bg-[#0B0D14] border border-white/5 hover:border-[#8B5CF6]/40 shadow-md relative overflow-hidden group transition-all duration-300 ${notif.type !== 'streak_request' || notif.resolved ? 'cursor-pointer hover:scale-[1.005]' : ''}`}
                            >
                              <div className="flex items-start gap-3.5 relative z-10">
                                <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center text-sm shadow-md shrink-0 mt-0.5">
                                  <Bell size={18} />
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                  <p className="text-sm font-bold text-white leading-snug">{notif.title || 'Daily streak'}</p>
                                  <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap break-words">{notif.message || "Complete one lesson to get today's reward"}</p>
                                  <p className="text-[11px] font-medium text-amber-400 pt-0.5">{getRelativeTime(notif.timestamp)}</p>

                                  {/* Follow-up Deep-Link Action Buttons */}
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab('tools');
                                        setToolsSubTab('quiz');
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                      🎯 Generate a Quiz
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab('tools');
                                        setToolsSubTab('notebook');
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                      📁 Upload a Note
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab('tools');
                                        setToolsSubTab('exam');
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                      📝 Practice CBT
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab('chat');
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                      🤖 Ask Omni
                                    </button>
                                  </div>
                                </div>

                                {notif.type === 'streak_request' && !notif.resolved ? (
                                  <button 
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        await updateDoc(doc(db, 'notifications', notif.id), {
                                          resolved: true,
                                          read: true
                                        });
                                        await addDoc(collection(db, 'notifications'), {
                                          to: notif.from,
                                          from: user.uid,
                                          fromName: currentUserData?.username || currentUserData?.displayName || 'Scholar',
                                          type: 'streak_accept',
                                          title: '⚡ Reading Streak Accepted!',
                                          message: `${currentUserData?.username || 'Somebody'} accepted your reading streak request! Start writing notes to keep it active and gather +150 XP bonus!`,
                                          timestamp: serverTimestamp() || new Date(),
                                          read: false
                                        });
                                        const newPoints = (currentUserData?.points || 0) + 15;
                                        await updateDoc(doc(db, 'users', user.uid), {
                                          points: newPoints,
                                          rank: getUserRank(newPoints)
                                        });
                                        setActiveTab('tools');
                                        setToolsSubTab('notebook');
                                        setUserNotification("🎉 Reading streak active! You received +15 XP bonus!");
                                      } catch (err) {
                                        console.error("Accept streak error:", err);
                                        setUserNotification("Failed to accept streak request.");
                                      }
                                    }}
                                    className="px-3.5 py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-95 text-white text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer"
                                  >
                                    Accept 🔥
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COMMUNITY TAB */}
          {activeTab === 'community' && (
            <CommunityPage 
              currentUserData={currentUserData}
              sessions={sessions}
              finishedHistory={finishedHistory}
              leaderboard={leaderboard}
              user={user}
              db={db}
              updateDoc={updateDoc}
              doc={doc}
              arrayUnion={arrayUnion}
              increment={increment}
              serverTimestamp={serverTimestamp}
              addDoc={addDoc}
              collection={collection}
              setUserNotification={setUserNotification}
              setActiveTab={setActiveTab}
              setToolsSubTab={setToolsSubTab}
              setProfileSubTab={setProfileSubTab}
              setShowInviteModal={setShowInviteModal}
              theme={theme}
              quests={dailyQuests}
              userNotes={userNotes}
            />
          )}

          {/* PROFILE TAB (FULL PAGE LOGIN FOR GUEST) */}
          {activeTab === 'profile' && !user && (
            <div 
              key="profile-guest-fullpage" 
              className="flex-1 w-full min-h-screen overflow-y-auto custom-scrollbar flex flex-col items-center justify-start py-10 sm:py-16 px-4 sm:px-8 bg-[#0B0D14]"
            >
              <div className={`w-full m-auto text-center px-2 sm:px-6 py-6 ${authMode === 'signup' ? 'max-w-xl' : 'max-w-lg'}`}>
                {/* Top Branding Section */}
                <div className="text-center mb-6 pt-2">
                  <h1 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-[#8B5CF6] mb-2 font-sans select-none">
                    NSG
                  </h1>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2 font-sans">
                    {authMode === 'login' ? 'Login to NSG' : 'Create an Account'}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 font-normal leading-relaxed max-w-sm mx-auto">
                    {authMode === 'login' 
                      ? 'Welcome to your learning arena, where every tiny victory counts.' 
                      : 'Join the learning arena and excel in your academic journey.'}
                  </p>
                </div>

                <form onSubmit={handleAuth} className="space-y-4 text-left">
                  {authMode === 'signup' ? (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-200 block">Full Name</label>
                        <div className="bg-[#13151F] border border-white/10 rounded-2xl px-4 py-3 flex items-center focus-within:border-[#8B5CF6] focus-within:ring-1 focus-within:ring-[#8B5CF6]/40 transition-all">
                          <input type="text" value={authFullName} onChange={(e) => setAuthFullName(e.target.value)} placeholder="Full Official Name" required className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-gray-500 outline-none" />
                        </div>
                        {validationErrors.fullName && <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.fullName}</p>}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                         <div className="space-y-1">
                           <p className="text-[10px] font-medium text-gray-300 ml-1">DOB</p>
                           <div className="bg-[#13151F] border border-white/10 rounded-2xl px-3 py-2.5">
                             <input type="date" value={authDOB} onChange={(e) => setAuthDOB(e.target.value)} required className="w-full bg-transparent text-[11px] text-white focus:outline-none" />
                           </div>
                           {validationErrors.dob && <p className="text-[8px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.dob}</p>}
                         </div>
                         <div className="space-y-1">
                           <p className="text-[10px] font-medium text-gray-300 ml-1">Username (Optional)</p>
                           <div className="bg-[#13151F] border border-white/10 rounded-2xl px-3 py-2.5">
                             <input type="text" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} placeholder="Auto-gen if blank" className="w-full bg-transparent text-[11px] text-white placeholder-gray-500 outline-none" />
                           </div>
                         </div>
                      </div>
                      {usernameStatus && (
                        <p className={`text-[8px] font-bold uppercase tracking-wider ml-1 ${usernameStatus.available ? 'text-green-500' : 'text-red-500'}`}>
                          {usernameStatus.message}
                        </p>
                      )}

                      <div className="space-y-1 relative">
                        <p className="text-[10px] font-medium text-gray-300 ml-1">University</p>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowUniSearchModal(!showUniSearchModal);
                              setUniSearchQuery('');
                            }}
                            className="flex-1 bg-[#13151F] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white/70 focus:border-[#8B5CF6] transition-all outline-none text-left flex justify-between items-center hover:bg-white/[0.08]"
                          >
                            <span className={authUniversity ? "text-white font-medium truncate max-w-[200px] sm:max-w-[280px]" : "text-gray-500"}>
                              {authUniversity || "Select University"}
                            </span>
                            <ChevronDown size={14} className={`text-gray-400 transition-transform flex-shrink-0 ${showUniSearchModal ? 'rotate-180' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowUniSearchModal(true);
                              setTimeout(() => {
                                const el = document.getElementById('uni-search-input-profile');
                                if (el) el.focus();
                              }, 50);
                            }}
                            className="px-3 bg-[#13151F] border border-white/10 hover:bg-[#8B5CF6]/20 hover:border-[#8B5CF6]/50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white transition-all"
                            title="Search Universities"
                          >
                            <Search size={14} />
                          </button>
                        </div>

                        {showUniSearchModal && (
                          <div className="absolute left-0 right-0 mt-1 p-2 bg-[#120f21] border border-white/10 rounded-xl shadow-2xl z-[50] flex flex-col space-y-2 max-h-[220px]">
                            <div className="flex gap-1">
                              <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 w-3 h-3" />
                                <input
                                  id="uni-search-input-profile"
                                  type="text"
                                  placeholder="Search..."
                                  value={uniSearchQuery}
                                  onChange={(e) => setUniSearchQuery(e.target.value)}
                                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#8B5CF6]/50 transition-all"
                                />
                              </div>
                            </div>

                            <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 space-y-0.5">
                              {(() => {
                                const query = uniSearchQuery.toLowerCase().trim();
                                const filtered = UNIVERSITIES.filter(u => u.toLowerCase().includes(query));
                                if (filtered.length === 0) {
                                  return (
                                    <div className="text-center py-3 text-white/40 text-[9px]">
                                      No matching universities
                                    </div>
                                  );
                                }
                                return filtered.map(u => (
                                  <button
                                    key={u}
                                    type="button"
                                    onClick={() => {
                                      setAuthUniversity(u);
                                      setShowUniSearchModal(false);
                                    }}
                                    className={`w-full text-left px-2 py-1.5 rounded-md text-[10px] transition-all flex items-center justify-between ${
                                      authUniversity === u
                                        ? 'bg-[#8B5CF6]/20 text-white border border-[#8B5CF6]/30'
                                        : 'text-white/60 hover:bg-white/5 hover:text-white border border-transparent'
                                    }`}
                                  >
                                    <span className="truncate">{u}</span>
                                    {authUniversity === u && <Check size={10} className="text-[#8B5CF6] flex-shrink-0" />}
                                  </button>
                                ));
                              })()}
                            </div>
                          </div>
                        )}
                        {validationErrors.university && <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.university}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <select value={authFaculty} onChange={(e) => { setAuthFaculty(e.target.value); setAuthDepartment(''); }} required className="w-full bg-[#13151F] border border-white/10 rounded-2xl px-3 py-3 text-[11px] text-white focus:border-[#8B5CF6] transition-all outline-none appearance-none">
                            <option value="" disabled className="bg-zinc-900">Select Faculty</option>
                            {FACULTIES.map(f => <option key={f} value={f} className="bg-zinc-900">{f}</option>)}
                          </select>
                          {validationErrors.faculty && <p className="text-[8px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.faculty}</p>}
                        </div>
                        <div className="space-y-1">
                          <select value={authDepartment} onChange={(e) => setAuthDepartment(e.target.value)} required disabled={!authFaculty} className="w-full bg-[#13151F] border border-white/10 rounded-2xl px-3 py-3 text-[11px] text-white focus:border-[#8B5CF6] transition-all outline-none appearance-none disabled:opacity-30">
                            <option value="" disabled className="bg-zinc-900">Select Dept.</option>
                            {authFaculty && DEPARTMENTS[authFaculty]?.map(d => <option key={d} value={d} className="bg-zinc-900">{d}</option>)}
                          </select>
                          {validationErrors.department && <p className="text-[8px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.department}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                         <input type="text" value={authMatric} onChange={(e) => setAuthMatric(e.target.value)} placeholder="Matric (Optional)" className="w-full bg-[#13151F] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:border-[#8B5CF6] transition-all outline-none" />
                         <input type="text" value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} placeholder="Phone Number" className="w-full bg-[#13151F] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:border-[#8B5CF6] transition-all outline-none" />
                      </div>
                      
                      <input type="text" value={authInviteCode} onChange={(e) => setAuthInviteCode(e.target.value)} placeholder="Referral Invite ID (Optional)" className="w-full bg-[#13151F] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:border-[#8B5CF6] transition-all outline-none" />
                      
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-200 block">Email Address</label>
                        <div className="bg-[#13151F] border border-white/10 rounded-2xl px-4 py-3 flex items-center focus-within:border-[#8B5CF6] transition-all">
                          <Mail size={18} className="text-[#8B5CF6] shrink-0 mr-3" />
                          <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Enter your email" required className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-gray-500 outline-none" />
                        </div>
                        {validationErrors.email && <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.email}</p>}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* EMAIL / MATRIC NUMBER FIELD */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-medium text-gray-200 block">Email / Matric Number</label>
                        <div className="bg-[#13151F] border border-white/10 rounded-2xl px-4 py-3.5 flex items-center focus-within:border-[#8B5CF6] focus-within:ring-1 focus-within:ring-[#8B5CF6]/40 transition-all">
                          <Mail size={18} className="text-[#8B5CF6] shrink-0 mr-3" />
                          <input 
                            type="text" 
                            value={authEmail} 
                            onChange={(e) => setAuthEmail(e.target.value)} 
                            placeholder="Enter your email or matric number" 
                            className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-gray-500 outline-none" 
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* PASSWORD FIELD */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-gray-200 block">Password</label>
                      {authMode === 'login' && (
                        <button 
                          type="button" 
                          onClick={async () => {
                            if (!authEmail) {
                              setUserNotification("Please enter your email address in the input above first.");
                              return;
                            }
                            try {
                              const { sendPasswordResetEmail } = await import('firebase/auth');
                              await sendPasswordResetEmail(auth, authEmail);
                              setUserNotification("Password reset email sent! Check your inbox.");
                            } catch (err: any) {
                              setUserNotification(`Failed to send password reset: ${err.message || err}`);
                            }
                          }}
                          className="text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>

                    <div className="bg-[#13151F] border border-white/10 rounded-2xl px-4 py-3.5 flex items-center focus-within:border-[#8B5CF6] focus-within:ring-1 focus-within:ring-[#8B5CF6]/40 transition-all">
                      <Lock size={18} className="text-[#8B5CF6] shrink-0 mr-3" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={authPassword} 
                        onChange={(e) => setAuthPassword(e.target.value)} 
                        placeholder="Enter your password" 
                        required 
                        className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-gray-500 outline-none" 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-white transition-colors ml-2 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {validationErrors.password && <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.password}</p>}
                    
                    {authMode === 'signup' && authPassword && (
                      <div className="flex flex-col gap-1 px-1 pt-1">
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            className={`h-full ${passwordStrength.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${(passwordStrength.score + 1) * 20}%` }}
                          />
                        </div>
                        <p className="text-[7px] font-black uppercase tracking-widest text-white/30 text-right">{passwordStrength.feedback} Security</p>
                      </div>
                    )}
                  </div>
                  
                  {/* CONTINUE / CREATE ACCOUNT BUTTON */}
                  <button 
                    type="submit" 
                    disabled={isAuthLoading} 
                    className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold py-3.5 rounded-2xl text-sm sm:text-base transition-all shadow-lg shadow-purple-900/30 active:scale-[0.99] flex items-center justify-center gap-2 mt-4 cursor-pointer"
                  >
                    {isAuthLoading ? <RefreshCcw className="animate-spin" size={18} /> : (authMode === 'login' ? 'Continue' : 'Create Account')}
                  </button>
                </form>

                {/* SIGN UP / SIGN IN TOGGLE */}
                <div className="mt-4 text-center text-xs sm:text-sm text-gray-400 font-normal">
                  {authMode === 'login' ? (
                    <>
                      Don’t have an account?{' '}
                      <button 
                        type="button"
                        onClick={() => setAuthMode('signup')} 
                        className="text-orange-400 hover:text-orange-300 font-bold ml-1 cursor-pointer transition-colors"
                      >
                        Sign Up
                      </button>
                    </>
                  ) : (
                    <>
                      Already registered?{' '}
                      <button 
                        type="button"
                        onClick={() => setAuthMode('login')} 
                        className="text-orange-400 hover:text-orange-300 font-bold ml-1 cursor-pointer transition-colors"
                      >
                        Sign In
                      </button>
                    </>
                  )}
                </div>

                {/* OR SIGN IN WITH DIVIDER */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-[1px] bg-white/10" />
                  <span className="text-xs text-gray-400 font-medium">or sign in with</span>
                  <div className="flex-1 h-[1px] bg-white/10" />
                </div>

                {/* SOCIAL BUTTONS */}
                <div className="grid grid-cols-2 gap-3">
                  {/* GOOGLE LOG IN */}
                  <button 
                    type="button"
                    onClick={handleGoogleLogin} 
                    className="w-full bg-[#13151F] hover:bg-[#1A1C29] border border-white/10 rounded-2xl py-3 flex items-center justify-center transition-all cursor-pointer group"
                    title="Sign in with Google"
                  >
                    <svg className="w-5 h-5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  </button>

                  {/* FACEBOOK LOG IN */}
                  <button 
                    type="button"
                    onClick={async () => {
                      setIsAuthLoading(true);
                      try {
                        const { FacebookAuthProvider, signInWithPopup } = await import('firebase/auth');
                        const provider = new FacebookAuthProvider();
                        await signInWithPopup(auth, provider);
                        setUserNotification("Successfully logged in with Facebook!");
                        setShowAuthModal(false);
                      } catch (error: any) {
                        console.error("Facebook Login Error:", error);
                        setUserNotification(error.message || "Facebook login failed. Please ensure Facebook sign-in is enabled in Firebase Console.");
                      } finally {
                        setIsAuthLoading(false);
                      }
                    }} 
                    className="w-full bg-[#13151F] hover:bg-[#1A1C29] border border-white/10 rounded-2xl py-3 flex items-center justify-center transition-all cursor-pointer group"
                    title="Sign in with Facebook"
                  >
                    <svg className="w-5 h-5 fill-[#1877F2] group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && user && (
            <div 
              key="profile" 
              onTouchStart={handleProfileTouchStart}
              onTouchMove={handleProfileTouchMove}
              onTouchEnd={handleProfileTouchEnd}
              className={`flex-1 flex flex-col px-2 sm:px-0 relative mb-6 select-none ${theme === 'dark' ? 'bg-[#13111C]' : 'bg-slate-50'}`}
            >
              <div className="space-y-5 pb-6 text-left">
                {/* Top Bar Header with Back Button to Home and Settings Button */}
                <div className="flex items-center justify-between py-2 border-b border-white/5 mb-2 select-none">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setIsEditingProfile(false);
                        setActiveTab('home');
                      }}
                      className="p-2 -ml-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                      title="Back to Home"
                    >
                      <ArrowLeft size={22} />
                    </button>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Profile</h1>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-3.5 py-1.5 bg-[#171522] hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                    >
                      <Settings size={15} className="text-purple-400" />
                      <span>Settings</span>
                    </button>
                  </div>
                </div>
                            {/* Main User Identity Card */}
                <div className="bg-[#171522] border border-white/5 p-6 rounded-2xl shadow-xl flex items-center gap-5 text-left">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden bg-slate-800 shrink-0 border-2 border-white/10 shadow-lg">
                      {currentUserData?.photoURL ? (
                        <img src={currentUserData.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                          <User size={38} />
                        </div>
                      )}
                    </div>
                    {/* Gender badge immediately under the profile picture */}
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold text-[10px] uppercase tracking-wider text-center">
                      {currentUserData?.gender === 'female' || currentUserData?.gender === 'Female'
                        ? 'Female'
                        : currentUserData?.gender === 'male' || currentUserData?.gender === 'Male'
                        ? 'Male'
                        : (currentUserData?.gender || 'Male')}
                    </span>

                    {/* CGPA / GPA text immediately under profile picture (clean text, no container) */}
                    {(() => {
                      let storedCgpa: any = { cgpa: '0.00', scale: '5.0', degreeClass: 'Uncalculated', label: 'CGPA' };
                      try {
                        const raw = localStorage.getItem('nsg_current_user_cgpa');
                        if (raw) storedCgpa = JSON.parse(raw);
                      } catch (e) {}
                      
                      const displayLabel = storedCgpa.label || (storedCgpa.isFirstSemOnly ? 'GPA' : 'CGPA');

                      if (storedCgpa.cgpa && storedCgpa.cgpa !== '0.00') {
                        return (
                          <div
                            onClick={() => {
                              setActiveTab('tools');
                              setToolsSubTab('cgpa');
                            }}
                            className="text-center mt-1 cursor-pointer group"
                            title="View Academic Grade Tracker"
                          >
                            <p className="text-xs font-black font-mono text-amber-400 group-hover:text-amber-300 transition-colors tracking-tight">
                              {storedCgpa.cgpa} {displayLabel}
                            </p>
                            {storedCgpa.degreeClass && storedCgpa.degreeClass !== 'Uncalculated' && (
                              <p className="text-[10px] font-semibold text-white/60 tracking-tight truncate max-w-[90px]">
                                {storedCgpa.degreeClass}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="space-y-1 text-left flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                      {currentUserData?.fullName || currentUserData?.displayName || 'Full Name'}
                    </h2>
                    {currentUserData?.displayName && (
                      <p className="text-xs font-semibold text-white/80 truncate">
                        {currentUserData.displayName}
                      </p>
                    )}
                    <p className="text-xs font-medium text-purple-400 font-mono truncate">
                      @{currentUserData?.username || 'handle'}
                    </p>
                    <p className="text-xs font-medium text-purple-300/80 truncate flex items-center gap-1.5 mt-1">
                      <GraduationCap size={14} className="shrink-0 text-purple-400" />
                      <span>{currentUserData?.university || 'No University Set'}</span>
                    </p>
                  </div>
                </div>

                {/* Try Premium Banner - ONLY FOR NORMAL/NON-PREMIUM USERS */}
                {!isPremium && (
                  <div className="bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 p-5 rounded-2xl shadow-lg flex items-center justify-between gap-4 text-slate-950 font-sans">
                    <div className="text-left space-y-0.5">
                      <h3 className="text-lg font-extrabold text-slate-950 tracking-tight">Upgrade to Premium</h3>
                      <p className="text-xs font-medium text-slate-900/80">Get more premium courses</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('premium')}
                      className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
                    >
                      Try Pro
                    </button>
                  </div>
                )}

                {/* Profile Completeness Card (Automatically removed when profile is 100% completed) */}
                {(() => {
                  const fields = [
                    currentUserData?.fullName,
                    currentUserData?.displayName,
                    currentUserData?.username,
                    currentUserData?.email || user?.email,
                    currentUserData?.photoURL,
                    currentUserData?.matricNumber || currentUserData?.matric,
                    currentUserData?.dob,
                    currentUserData?.country,
                    currentUserData?.gender,
                    currentUserData?.university,
                    currentUserData?.level,
                    currentUserData?.faculty,
                    currentUserData?.department
                  ];
                  const filledCount = fields.filter(Boolean).length;
                  const completenessPercent = Math.max(10, Math.round((filledCount / fields.length) * 100));

                  if (completenessPercent >= 100) return null;

                  return (
                    <div className="bg-[#171522] border border-white/5 p-5 rounded-2xl shadow-xl space-y-3 text-left">
                      <h4 className="text-sm font-bold text-white">Profile Completeness</h4>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                            style={{ width: `${completenessPercent}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-white/80">{completenessPercent}%</span>
                      </div>
                      <button 
                        onClick={() => setIsEditingProfile(true)}
                        className="text-xs font-bold text-pink-500 hover:text-pink-400 underline cursor-pointer inline-block"
                      >
                        Complete Profile
                      </button>
                    </div>
                  );
                })()}

                {/* Stats Grid 2x2 */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Days Streak */}
                  <div className="bg-[#171522] border border-white/5 p-5 rounded-2xl text-left space-y-3 shadow-xl">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                      <Flame size={26} className="fill-red-500/20" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/50">Days Streak</p>
                      <p className="text-2xl font-bold text-white mt-1">{currentUserData?.streak || 1}</p>
                    </div>
                  </div>

                  {/* Classes & Notes */}
                  <div className="bg-[#171522] border border-white/5 p-5 rounded-2xl text-left space-y-3 shadow-xl">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                      <BookOpen size={26} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/50">Classes & Notes</p>
                      <p className="text-2xl font-bold text-white mt-1">{sessions?.length || 0}</p>
                    </div>
                  </div>

                  {/* Smart Quizzes */}
                  <div className="bg-[#171522] border border-white/5 p-5 rounded-2xl text-left space-y-3 shadow-xl">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                      <HelpCircle size={26} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/50">Smart Quizzes</p>
                      <p className="text-2xl font-bold text-white mt-1">{finishedHistory?.filter(h => h.type === 'quiz')?.length || 0}</p>
                    </div>
                  </div>

                  {/* Academic Standing */}
                  <div className="bg-[#171522] border border-white/5 p-5 rounded-2xl text-left space-y-3 shadow-xl">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Award size={26} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/50">Academic Standing</p>
                      <p className="text-2xl font-bold text-white mt-1">{currentUserData?.rank || 'Fresher'}</p>
                    </div>
                  </div>
                </div>

                {/* About Us & Contact Us Container Cards (Placed side-by-side, exact same container size & style as Smart Quizzes & Academic Standing) */}
                <div className="grid grid-cols-2 gap-4">
                  {/* About Us Container Card */}
                  <div 
                    onClick={() => setShowAboutUsModal(true)}
                    className="bg-[#171522] border border-white/5 hover:border-cyan-500/30 p-5 rounded-2xl text-left space-y-3 shadow-xl cursor-pointer transition-all hover:bg-cyan-950/10 active:scale-95 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                      <Info size={26} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/50">Platform Info</p>
                      <p className="text-xl font-bold text-white mt-1 group-hover:text-cyan-300 transition-colors">About Us</p>
                    </div>
                  </div>

                  {/* Contact Us Container Card */}
                  <div 
                    onClick={() => setShowContactUsModal(true)}
                    className="bg-[#171522] border border-white/5 hover:border-emerald-500/30 p-5 rounded-2xl text-left space-y-3 shadow-xl cursor-pointer transition-all hover:bg-emerald-950/10 active:scale-95 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                      <Mail size={26} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/50">24/7 Support</p>
                      <p className="text-xl font-bold text-white mt-1 group-hover:text-emerald-300 transition-colors">Contact Us</p>
                    </div>
                  </div>
                </div>

                {/* WHATSAPP LINKING SYSTEM WIDGET */}
                <div className="bg-gradient-to-br from-[#1E1B2E] to-[#120F1F] p-6 rounded-[2.5rem] shadow-2xl space-y-4 text-left border border-green-500/10">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-400">
                        <span className="text-xl">💬</span>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2">
                          <span>WhatsApp Account Sync</span>
                          <span className="text-[7.5px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-extrabold tracking-normal normal-case">Coming Soon</span>
                        </h4>
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-amber-400/90 mt-0.5">
                          {currentUserData?.isWhatsAppVerified ? "🟢 SECURED & VERIFIED" : "🔴 NOT SYNCHRONIZED (COMING SOON)"}
                        </p>
                      </div>
                    </div>
                    {currentUserData?.isWhatsAppVerified && (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest">
                        Linked
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-white/60 leading-relaxed font-bold uppercase tracking-wider">
                    Link your active WhatsApp number to unlock continuous real-time study tracking, past quiz logs synchronization, and secure integration with OMNI - NSG's dynamic AI Oracle.
                  </p>

                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40">+</span>
                        <input
                          type="tel"
                          placeholder="WhatsApp Number (e.g. 2348123456789)"
                          value={whatsappInputNumber}
                          onChange={(e) => setWhatsappInputNumber(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-8 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-green-500 font-mono transition-colors"
                        />
                      </div>
                      <button
                        onClick={handleDirectWhatsAppSync}
                        disabled={whatsappLoading}
                        className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/10 active:scale-95 shrink-0"
                      >
                        {whatsappLoading ? "Syncing..." : "SAVE & SYNC LINE"}
                      </button>
                    </div>
                    {currentUserData?.isWhatsAppVerified && currentUserData?.whatsappNumber && (
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Verified WhatsApp Line</p>
                          <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">+{currentUserData?.whatsappNumber}</p>
                        </div>
                        <span className="text-xs text-emerald-500 font-bold flex items-center gap-1 font-mono uppercase text-[9px] tracking-wider bg-emerald-500/10 px-2 line-clamp-1 py-1 rounded-lg">
                          ✓ Live Connected / Editable Anytime
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* SYSTEM ACCESS & ACCOUNT MANAGEMENT (Shifted Upwards) */}
                <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#171522] p-5 rounded-2xl border border-white/5 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                      <LogOut size={20} className="text-white/40" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] italic">System Access</p>
                      <p className="text-[7.5px] font-bold text-white/30 uppercase tracking-widest">Instance ID: {user?.uid?.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                    {user?.email === "nuellkelechi@gmail.com" && (
                      <button 
                        type="button"
                        onClick={() => setShowGodMode(true)} 
                        className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase border border-red-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-md shadow-red-600/20"
                      >
                        <ShieldCheck size={14} /> GOD MODE
                      </button>
                    )}
                    <button 
                      onClick={handleLogout} 
                      className="w-full sm:w-auto px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl text-xs font-bold uppercase border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <LogOut size={14} /> SIGN OUT
                    </button>
                    <button 
                      onClick={() => { setIsDeleteAccountOpen(true); setDeleteConfirmInput(""); }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-xs font-bold uppercase border border-red-500/20 transition-all cursor-pointer active:scale-95"
                    >
                      DELETE ACCOUNT
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HOST EXAM PANEL (FORMERLY ADMIN) */}
          {adminMode && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`fixed inset-0 z-[110] p-2 sm:p-6 overflow-y-auto ${theme === 'dark' ? 'bg-[#13111C]/96' : 'bg-slate-50'} backdrop-blur-xl`}>
              <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-32">
                
                {/* Fixed/Sticky Top Control Header */}
                <div className={`p-4 sm:p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#181524] border-white/10' : 'bg-white border-slate-200'} shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-50`}>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowExamSidebar(!showExamSidebar)}
                      className={`p-2 lg:p-3 rounded-xl sm:rounded-2xl transition-all ${theme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-500'} hover:bg-[#DC2626]/10`}
                    >
                      <Menu size={20} />
                    </button>
                    <div className="w-10 h-10 bg-[#DC2626] rounded-xl flex items-center justify-center shadow-lg shadow-[#DC2626]/20">
                      <LayoutDashboard size={20} className="text-white" />
                    </div>
                    <div>
                      <h1 className={`text-lg sm:text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase tracking-tight`}>Host Exam Control Room</h1>
                      <p className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Professional Examination Pool</p>
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-2.5">
                    {/* Dynamic View/Edit Mode Button */}
                    <button
                      onClick={() => {
                        const nextLocked = !isQuestionsLocked;
                        setIsQuestionsLocked(nextLocked);
                        setUserNotification(nextLocked ? "📖 Switched to View Mode." : "✏️ Switched to Edit Mode.");
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all shadow-sm ${
                        isQuestionsLocked 
                          ? 'bg-amber-500/15 border border-amber-500/40 text-amber-500' 
                          : 'bg-green-500/15 border border-green-500/40 text-green-500'
                      }`}
                      title={isQuestionsLocked ? "Switch to Edit Mode" : "Switch to View Mode"}
                    >
                      {isQuestionsLocked ? (
                        <>
                          <Edit3 size={14} />
                          <span>EDIT MODE</span>
                        </>
                      ) : (
                        <>
                          <Eye size={14} />
                          <span>VIEW MODE</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setShowHostHelpModal(true)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${theme === 'dark' ? 'bg-indigo-500/15 border border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/25' : 'bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-100'}`}
                    >
                      <HelpCircle size={14} /> HELP GUIDE
                    </button>

                    <button 
                      onClick={saveHostedExam} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase shadow-md transition-colors"
                    >
                      Save Progress
                    </button>

                    <button 
                      onClick={() => { setAdminMode(false); setShowManualQuestionEntryPage(false); }} 
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${theme === 'dark' ? 'bg-white/5 text-white/40 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}
                    >
                      <ArrowLeft size={16} /> BACK
                    </button>
                  </div>
                </div>

                {/* Host Help Modal */}
                <AnimatePresence>
                  {showHostHelpModal && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={() => setShowHostHelpModal(false)}
                        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200]"
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={`fixed left-4 right-4 sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-2xl max-h-[90vh] overflow-y-auto ${theme === 'dark' ? 'bg-[#181524] text-white border-white/10' : 'bg-white text-slate-800 border-slate-200'} border rounded-[2.5rem] shadow-2xl p-6 sm:p-8 z-[210] space-y-6 text-left`}
                      >
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#DC2626]/20 rounded-2xl flex items-center justify-center text-[#DC2626] font-black">
                              <HelpCircle size={22} />
                            </div>
                            <div>
                              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight">Host Examination & Question Guide</h2>
                              <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mt-0.5">Complete Step-by-Step Instructions</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setShowHostHelpModal(false)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        <div className="space-y-5 text-xs font-sans leading-relaxed">
                          {/* Step 1 */}
                          <div className="space-y-1.5 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                            <h3 className="font-black text-xs uppercase tracking-wider text-[#DC2626] flex items-center gap-2">
                              <span>1. Creating Your Exam & Configuration</span>
                            </h3>
                            <p className="text-opacity-80 text-[11px] leading-relaxed">
                              In the Exam Control Room, enter your exam details such as exam title, duration in minutes, passing score, and unique exam code. You can also register participants in bulk using the student paste interface (`matric, name`).
                            </p>
                          </div>

                          {/* Step 2 */}
                          <div className="space-y-1.5 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                            <h3 className="font-black text-xs uppercase tracking-wider text-[#DC2626] flex items-center gap-2">
                              <span>2. Adding Subjects & Question Pools</span>
                            </h3>
                            <p className="text-opacity-80 text-[11px] leading-relaxed">
                              Add the subjects you want to examine (e.g., Mathematics, English, Physics) and specify how many questions students must answer from each subject's pool.
                            </p>
                          </div>

                          {/* Step 3 */}
                          <div className="space-y-1.5 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                            <h3 className="font-black text-xs uppercase tracking-wider text-[#DC2626] flex items-center gap-2">
                              <span>3. Manner of Pasting Exam Questions</span>
                            </h3>
                            <p className="text-opacity-80 text-[11px] leading-relaxed">
                              Instead of single-filling slots, paste your questions in the unified text area following this exact punctuation format:
                            </p>
                            <div className="p-3 bg-black/30 rounded-xl font-mono text-[10px] text-amber-300 border border-amber-500/20 overflow-x-auto">
                              Who is a boy?: A male human*, A male dog, A female goat, A car (A boy is a male human, remember that.)
                            </div>
                            <ul className="list-disc pl-4 space-y-1 text-[11px] opacity-90 mt-2">
                              <li><strong className="text-white">Question:</strong> The question text followed by a colon (<code className="text-red-400">:</code>).</li>
                              <li><strong className="text-white">Options:</strong> Comma-separated options following the colon.</li>
                              <li><strong className="text-white">Correct Answer (*):</strong> Place an asterisk (<code className="text-red-400">*</code>) right after the correct option (e.g. <code className="text-green-400">A male human*</code>).</li>
                              <li><strong className="text-white">Review (Explanation):</strong> Enclosed in parentheses at the very end of the line: <code className="text-amber-400">(Review / explanation here)</code>.</li>
                              <li><strong className="text-white">Next Line:</strong> Each question must be on its own line using the Enter key. Question numbers (1, 2, 3...) are automatically generated.</li>
                            </ul>
                          </div>

                          {/* Step 4 */}
                          <div className="space-y-1.5 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                            <h3 className="font-black text-xs uppercase tracking-wider text-[#DC2626] flex items-center gap-2">
                              <span>4. What is Review & Why It Shows After Exam Ends</span>
                            </h3>
                            <p className="text-opacity-80 text-[11px] leading-relaxed">
                              The review (explanation) provides the pedagogical reasoning or textbook reference explaining why the correct option is right. To prevent cheating or giving away answers while the exam is active, review notes are strictly hidden during the live test and only unlock when the student clicks <strong className="text-white">"Review Exam"</strong> after submitting or finishing the test.
                            </p>
                          </div>

                          {/* Step 5 */}
                          <div className="space-y-1.5 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                            <h3 className="font-black text-xs uppercase tracking-wider text-[#DC2626] flex items-center gap-2">
                              <span>5. Why Sticking to the Format Matters</span>
                            </h3>
                            <p className="text-opacity-80 text-[11px] leading-relaxed">
                              Following this format precisely ensures the instant parser can instantly distinguish questions, options, correct answers, and reviews without errors. Real-time syntax validation will immediately flag any malformed line (e.g. missing asterisk or incorrect option count) so you can fix it instantly.
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => setShowHostHelpModal(false)}
                            className="bg-[#DC2626] hover:bg-[#DC2626]/90 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg"
                          >
                            Got It, Let's Host!
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {/* Drawer/Sidebar */}
                <AnimatePresence>
                  {showExamSidebar && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={() => setShowExamSidebar(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
                      />
                      <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        className={`fixed left-0 top-0 bottom-0 w-[280px] sm:w-[320px] ${theme === 'dark' ? 'bg-[#13111C]' : 'bg-white'} border-r border-[#DC2626]/20 z-[160] shadow-2xl p-0 flex flex-col`}
                      >
                        <div className="p-6 flex flex-col h-full">
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                               <div className="w-8 h-8 bg-[#DC2626] rounded-lg flex items-center justify-center">
                                 <Database size={16} className="text-white" />
                               </div>
                               <p className="text-xs font-black uppercase tracking-widest text-[#DC2626]">Exam Manager</p>
                            </div>
                            <button onClick={() => setShowExamSidebar(false)} className={`${theme === 'dark' ? 'text-white/20' : 'text-slate-400'} hover:text-[#DC2626] transition-colors`}>
                              <X size={20} />
                            </button>
                          </div>

                          <div className="flex-1 overflow-y-auto space-y-3 pb-8 custom-scrollbar">
                             <button 
                               onClick={() => { createNewExam(); setShowManualQuestionEntryPage(false); }}
                               className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] hover:bg-[#DC2626] hover:text-white transition-all group"
                             >
                               <PlusCircle size={18} />
                               <span className="text-[10px] font-black uppercase">Host New Exam ({hostedExams.length}/20)</span>
                             </button>

                             <div className="pt-4 space-y-3">
                               <p className={`text-[8px] font-black ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'} uppercase tracking-[0.2em] px-2 mb-4`}>Your Active Exams</p>
                               {hostedExams.length === 0 ? (
                                 <div className={`py-12 text-center space-y-2 ${theme === 'dark' ? 'text-white/20' : 'text-slate-300'}`}>
                                   <Database size={32} className="mx-auto mb-2" />
                                   <p className="text-[10px] font-bold">No active exams found</p>
                                 </div>
                               ) : (
                                 hostedExams.map(ex => (
                                   <div key={ex.id} className="relative group">
                                     <button 
                                       onClick={() => { switchExam(ex.id!); setShowManualQuestionEntryPage(false); }}
                                       className={`w-full text-left p-4 rounded-2xl border transition-all ${hostExamId === ex.id 
                                         ? 'bg-[#DC2626] border-[#DC2626] text-white shadow-lg' 
                                         : theme === 'dark' 
                                           ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10' 
                                           : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'}`}
                                     >
                                       <div className="flex items-center justify-between">
                                         <p className="text-xs font-black font-mono tracking-widest">{ex.id}</p>
                                         {hostExamId === ex.id && <CheckCircle2 size={14} />}
                                       </div>
                                       <p className="text-[8px] mt-1 opacity-60 uppercase">{ex.questions?.length || 0} Questions | {ex.status}</p>
                                     </button>
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); deleteExamFromSidebar(ex.id!); }}
                                       className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${hostExamId === ex.id 
                                         ? 'text-white/40 hover:text-white hover:bg-white/10' 
                                         : theme === 'dark'
                                           ? 'text-white/10 hover:text-red-500 hover:bg-red-500/10'
                                           : 'text-zinc-300 hover:text-red-500 hover:bg-red-50'} opacity-0 group-hover:opacity-100`}
                                     >
                                       <Trash2 size={14} />
                                     </button>
                                   </div>
                                 ))
                                )}
                             </div>
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {isAuthLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <RefreshCcw className="animate-spin text-[#DC2626]" size={32} />
                  </div>
                ) : (!isPremium && !isHostPaid && hostedExams.length === 0) ? (
                  <div className="max-w-md mx-auto py-10 sm:py-20 text-center space-y-6 px-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#DC2626]/10 rounded-full flex items-center justify-center mx-auto">
                      <ShieldCheck size={32} className="text-[#DC2626]" />
                    </div>
                    <div className="space-y-2">
                      <h2 className={`text-xl sm:text-2xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Create & Host CBT Exams</h2>
                      <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                        {isPremium ? "Premium Active: Setup instant test sessions for free." : "Create custom multi-subject examination instances. Single-exam hosting starts at \u{20A6}200."}
                      </p>
                    </div>
                    <button 
                      onClick={createNewExam} 
                      className="w-full bg-[#DC2626] text-white font-black py-4 rounded-2xl text-xs shadow-xl hover:bg-[#DC2626]/90 transition-all uppercase tracking-widest"
                    >
                      {isPremium || (user?.email?.toLowerCase().trim() === "nuellkelechi@gmail.com") || currentUserData?.bypassHostingPayment ? "START EXAM HOSTING" : "PAY \u{20A6}200 TO START"}
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Active Link Status Card */}
                    {hostExamId ? (
                      <div className={`mb-6 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#181524] border-white/10 text-white' : 'bg-green-50 border-green-200 text-slate-800'} flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm`}>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="w-9 h-9 bg-[#DC2626] rounded-xl flex-shrink-0 flex items-center justify-center text-white"><Share2 size={16} /></div>
                          <div>
                            <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-wider ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>Exam Code</p>
                            <p className="text-lg font-black font-mono tracking-widest text-[#DC2626]">{hostExamId}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button onClick={() => copyToClipboard(hostExamId)} className="flex-1 sm:flex-none p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-2 text-[10px] font-black tracking-wide"><Copy size={13} /> COPY ID</button>
                          {examStatus === 'active' ? (
                            <button onClick={endHostedExam} className="flex-1 sm:flex-none p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all flex items-center justify-center gap-2 text-[10px] font-black tracking-wide"><XCircle size={13} /> END EXAM</button>
                          ) : (
                            <button 
                              onClick={deleteHostedExam} 
                              className={`flex-1 sm:flex-none p-2 ${deleteConfirmStep === 1 ? 'bg-red-800 animate-pulse' : 'bg-red-600'} text-white rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2 text-[10px] font-black tracking-wide`}
                            >
                              <Trash2 size={13} /> {deleteConfirmStep === 1 ? 'CONFIRM' : 'DELETE'}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className={`mb-6 p-6 rounded-3xl border border-dashed text-center space-y-3 ${theme === 'dark' ? 'bg-[#181524] border-white/10' : 'bg-slate-50 border-slate-300'}`}>
                        <p className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>No active exam code exists. Generate a code below.</p>
                        <button 
                          onClick={() => {
                            const newId = Math.random().toString(36).substr(2, 9).toUpperCase();
                            setHostExamId(newId);
                            localStorage.setItem('nsg_host_exam_id', newId);
                          }}
                          className="bg-[#DC2626] text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest"
                        >
                          Generate Exam Code
                        </button>
                      </div>
                    )}

                    {/* DEDICATED VIEW A: GENERAL SETTINGS, STUDENTS & RESULTS (when setting entry page is false) */}
                    {!showManualQuestionEntryPage ? (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Column 1: CBT General Settings & Subject Registry */}
                        <div className="lg:col-span-2 space-y-6">
                          <div className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-[#181524] border-white/10' : 'bg-white border-slate-200'} space-y-6 shadow-sm`}>
                            <h2 className={`text-md sm:text-lg font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-2.5 border-b pb-3`}>
                              <span>⚙️ Exam Settings</span>
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className={`text-[8px] font-black uppercase mb-1.5 ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>Total Duration (Minutes)</p>
                                <input 
                                  type="number" 
                                  value={examConfig.duration || 30} 
                                  onChange={(e) => validateAndSetLimit(e.target.value, 1, 300, (v) => setExamConfig({...examConfig, duration: v}), "Exam Duration")} 
                                  className={`w-full border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#DC2626]/50 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
                                />
                              </div>
                              <div>
                                <p className={`text-[8px] font-black uppercase mb-1.5 ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>Warning / Notice for Students</p>
                                <input 
                                  type="text" 
                                  value={examConfig.warningMessage || ""} 
                                  onChange={(e) => setExamConfig({...examConfig, warningMessage: e.target.value})} 
                                  placeholder="Leave blank for standard instructions..."
                                  className={`w-full border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#DC2626]/50 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
                                />
                              </div>
                            </div>

                            {/* Sub-block: Add Subjects and Questions to CBT */}
                            <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-100'} space-y-4`}>
                              <div>
                                <p className="text-xs font-black uppercase text-red-500 leading-normal">Add subjects and set the questions count</p>
                                <p className={`text-[8px] ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'} uppercase mt-0.5`}>Set up the subjects for this exam</p>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-3">
                                <input 
                                  type="text" 
                                  id="cbt-subj-name-input"
                                  placeholder="e.g. Chemistry, Biology, Physics" 
                                  className={`flex-[2] border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#DC2626]/50 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`} 
                                />
                                <input 
                                  type="number" 
                                  id="cbt-subj-sitting-input"
                                  placeholder="Questions per subject" 
                                  defaultValue={15}
                                  className={`flex-1 border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-[#DC2626]/50 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`} 
                                />
                                <button 
                                  onClick={() => {
                                    const nameInp = document.getElementById("cbt-subj-name-input") as HTMLInputElement;
                                    const countInp = document.getElementById("cbt-subj-sitting-input") as HTMLInputElement;
                                    if (nameInp && nameInp.value.trim()) {
                                      const newSubName = nameInp.value.trim();
                                      const sitCount = parseInt(countInp.value) || 15;
                                      const currentList = examConfig.subjects || [];
                                      if (currentList.length >= 10) {
                                        setUserNotification("⚠️ Limit reached: You can only set up to 10 different subjects per exam.");
                                        return;
                                      }
                                      
                                      // Avoid duplicates
                                      if (currentList.some(s => s.name.toLowerCase() === newSubName.toLowerCase())) {
                                        setUserNotification(`⚠️ ${newSubName} is already added.`);
                                        return;
                                      }

                                      const updatedSubs = [...currentList, { name: newSubName, questionsToAnswer: sitCount }];
                                      setExamConfig({ ...examConfig, subjects: updatedSubs });
                                      nameInp.value = "";
                                      setUserNotification(`✅ Added subject: ${newSubName}`);
                                    } else {
                                      setUserNotification("⚠️ Please enter a valid subject name.");
                                    }
                                  }}
                                  className="bg-[#DC2626] hover:bg-[#DC2626]/90 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider"
                                >
                                  Add Subject
                                </button>
                              </div>

                              {/* Configured subjects row */}
                              <div className="flex flex-wrap gap-2 pt-2 pb-3">
                                {examConfig.subjects && examConfig.subjects.length > 0 ? (
                                  examConfig.subjects.map((subjSub) => (
                                    <div key={subjSub.name} className={`px-3 py-2 rounded-xl text-[10px] font-black border flex items-center gap-2.5 uppercase ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                                      <span>{subjSub.name} ({subjSub.questionsToAnswer || 15} Qs)</span>
                                      <button 
                                        onClick={() => {
                                          const originalSubs = examConfig.subjects || [];
                                          const filtered = originalSubs.filter(s => s.name !== subjSub.name);
                                          setExamConfig({ ...examConfig, subjects: filtered });
                                          setUserNotification(`Removed subject category: ${subjSub.name}`);
                                        }}
                                        className="text-red-500 hover:text-red-600 font-bold"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))
                                ) : (
                                  <p className={`text-[10px] font-bold ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'} uppercase italic`}>
                                    No subjects added yet. Add custom subjects below.
                                  </p>
                                )}
                              </div>

                              {/* Sitting Count Profiles (underneath subjects) */}
                              {examConfig.subjects && examConfig.subjects.length > 0 && (
                                <div className="space-y-2.5 pt-4 border-t border-white/10">
                                  <p className="text-[10px] font-black uppercase text-red-500 tracking-wide">Sitting Count Profile</p>
                                  <p className={`text-[8.5px] font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} leading-snug`}>
                                    Declare exactly how many questions participants will answer under each subject tab during examinations. (how many questions should participants sit for)
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2">
                                    {examConfig.subjects.map((subjSub) => (
                                      <div key={subjSub.name} className={`p-4 rounded-2xl border flex flex-col justify-between gap-2.5 ${theme === 'dark' ? 'bg-white/[0.03] border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className="flex items-center justify-between">
                                          <span className={`text-[10px] font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{subjSub.name}</span>
                                          <span className="text-[8px] font-bold text-red-500 uppercase">(Pool: {subjSub.questionsToAnswer || 15} Qs)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[8.5px] font-bold text-slate-400 uppercase">Questions to sit:</span>
                                          <input 
                                            type="number"
                                            value={subjSub.questionsToSit !== undefined ? subjSub.questionsToSit : (subjSub.questionsToAnswer || 15)}
                                            onChange={(e) => {
                                              validateAndSetLimit(e.target.value, 1, 500, (v) => {
                                                const originalSubs = examConfig.subjects || [];
                                                const updated = originalSubs.map(s => 
                                                  s.name.toLowerCase() === subjSub.name.toLowerCase() ? { ...s, questionsToSit: v } : s
                                                );
                                                setExamConfig({ ...examConfig, subjects: updated });
                                              }, `${subjSub.name} sitting amount`);
                                            }}
                                            className={`flex-1 border rounded-xl px-2 py-1.5 text-xs font-bold font-mono text-center outline-none focus:border-[#DC2626]/50 transition-all ${
                                              theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
                                            }`} 
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Button for Setting Exam Questions */}
                            <div className="pt-4">
                              <button
                                onClick={() => setShowManualQuestionEntryPage(true)}
                                className="w-full py-5 rounded-2xl bg-[#DC2626] text-white hover:bg-[#DC2626]/95 hover:shadow-lg hover:shadow-[#DC2626]/10 active:scale-98 transition-all flex items-center justify-center gap-2"
                              >
                                <Edit3 size={18} />
                                <span className="font-black text-xs uppercase tracking-widest">📝 EDIT EXAM QUESTIONS</span>
                              </button>
                            </div>

                          </div>

                          {/* Student Registry Panel */}
                          <div className={`p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-[#181524] border-white/10' : 'bg-white border-slate-200'} space-y-4 shadow-sm text-left`}>
                            <h3 className={`font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-sm`}>
                              <UserPlus size={18} className="text-[#DC2626]" /> Register Students
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <input type="text" value={newStudentMatric} onChange={(e) => setNewStudentMatric(e.target.value)} placeholder="Matric / Reg Number" className={`flex-1 border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#DC2626]/50 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
                              <input type="text" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} placeholder="Full Student Name" className={`flex-1 border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#DC2626]/50 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} />
                              <button onClick={addStudent} className="bg-[#DC2626] hover:bg-[#DC2626]/90 text-white px-6 py-3 sm:py-0 rounded-xl text-xs font-black transition-all shadow-md uppercase tracking-wider">REGISTER</button>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-white/5">
                              <p className={`text-[8px] font-black uppercase ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Or Batch Paste Students (Format: matric, name; or line by line):</p>
                              <div className="flex gap-2">
                                <textarea value={batchStudentText} onChange={(e) => setBatchStudentText(e.target.value)} placeholder="e.g. 2024001, John Doe..." className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-xs outline-none text-white h-20 resize-none"></textarea>
                                <button onClick={parseAndImportBatchStudents} className="bg-[#DC2626] hover:bg-[#DC2626]/70 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider">PARSE</button>
                              </div>
                            </div>
                            
                            <div className="overflow-x-auto max-h-[250px] border border-white/5 rounded-2xl">
                              <table className="w-full text-left text-[10px]">
                                <thead>
                                  <tr className={`uppercase tracking-wider border-b ${theme === 'dark' ? 'text-white/30 border-white/5' : 'text-slate-400 border-slate-100'}`}>
                                    <th className="py-3 px-3">Student ID / Matric No.</th>
                                    <th className="py-3 px-3">Full Student Name</th>
                                    <th className="py-3 px-3 text-right">Delete</th>
                                  </tr>
                                </thead>
                                <tbody className={`${theme === 'dark' ? 'text-white/70' : 'text-slate-700'}`}>
                                  {registeredStudents.length === 0 ? (
                                    <tr>
                                      <td colSpan={3} className="text-center py-10 opacity-40">No students registered yet</td>
                                    </tr>
                                  ) : (
                                    registeredStudents.map(student => (
                                      <tr key={student.matric} className={`border-b transition-colors ${theme === 'dark' ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}`}>
                                        <td className="py-3 px-3 font-mono">{student.matric}</td>
                                        <td className="py-3 px-3 font-bold">{student.name}</td>
                                        <td className="py-3 px-3 text-right">
                                          <button onClick={() => deleteStudent(student.matric)} className="p-2 text-red-400 hover:text-red-500" title="Delete Student"><Trash2 size={12} /></button>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                        </div>

                        {/* Column 2: Results Display Panel */}
                        <div className="space-y-6">
                          <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#181524] border-white/10' : 'bg-white border-slate-200'} space-y-4 shadow-sm text-left`}>
                            <div className="flex items-center justify-between border-b pb-3">
                              <h3 className={`font-bold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-sm`}>
                                <ListChecks size={18} className="text-[#DC2626]" /> CBT Score Sheets
                              </h3>
                              <div className="flex items-center gap-2">
                                <button onClick={clearExamResults} className="text-red-400 hover:text-red-500 transition-colors" title="Clear Scores"><Trash2 size={14} /></button>
                                <button onClick={downloadResults} className="text-emerald-500 hover:text-emerald-600 transition-colors" title="Download Excel Sheet"><FileDown size={14} /></button>
                              </div>
                            </div>
                            
                            <div className="overflow-y-auto space-y-2.5 max-h-[500px] pr-1.5 scrollbar-thin">
                              {scoreSheet.length === 0 ? (
                                <p className="text-[10px] text-center py-20 opacity-30">No results recorded yet from students.</p>
                              ) : (
                                scoreSheet.map((res, i) => (
                                  <div key={i} className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}>
                                    <div>
                                      <p className={`text-[10px] font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{res.name}</p>
                                      <p className="text-[8px] font-mono text-slate-400 mt-0.5">{res.matric} | Raw: {res.score}/{res.total}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[11px] font-black text-[#DC2626]">{res.total > 0 ? Math.round((res.score/res.total)*100) : 0}%</p>
                                      <p className="text-[6.5px] uppercase text-slate-400 mt-0.5">{res.timestamp}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    ) : (
                      
                      /* DEDICATED VIEW B: DEDICATED QUESTION SETTING CENTER with HORIZONTAL SWIPE / TABBING */
                      <div className="space-y-6 text-left">
                        
                        {activeSubjects.length === 0 ? (
                          <div className={`p-8 py-20 text-center rounded-3xl border border-dashed ${theme === 'dark' ? 'bg-[#181524] border-white/10 text-white/50' : 'bg-slate-50 border-slate-300 text-slate-500'} space-y-4`}>
                            <AlertCircle className="mx-auto text-red-500" size={36} />
                            <h3 className="text-sm font-black uppercase tracking-wider text-red-500">No Subjects configured</h3>
                            <p className="text-[10px] leading-relaxed max-w-sm mx-auto">
                              Please add and configure at least one subject (e.g. English, Biology) in the main Exam Configuration page first before attempting to write or generate questions.
                            </p>
                            <button
                              onClick={() => setShowManualQuestionEntryPage(false)}
                              className="px-5 py-2.5 bg-[#DC2626] hover:bg-[#DC2626]/90 text-white rounded-xl text-[10px] font-black uppercase tracking-wider"
                            >
                              ← Go Back to Config
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Tab Selector bar across different subjects */}
                            <div className="flex flex-wrap gap-2 pb-2.5 border-b border-white/10 overflow-x-auto no-scrollbar">
                              {activeSubjects.map((subItem, index) => (
                                <button
                                  key={subItem.name}
                                  onClick={() => setAdminSelectedSubjectIdx(index)}
                                  className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                                    adminSelectedSubjectIdx === index
                                      ? 'bg-[#DC2626] border-[#DC2626] text-white shadow-lg'
                                      : theme === 'dark' 
                                        ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10' 
                                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                  }`}
                                >
                                  📂 {subItem.name}
                                </button>
                              ))}
                              
                              <button
                                onClick={() => setShowManualQuestionEntryPage(false)}
                                className={`ml-auto px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider border transition-all border-dashed ${theme === 'dark' ? 'border-white/10 hover:bg-white/5 text-white/55' : 'border-slate-300 hover:bg-slate-50 text-slate-700'}`}
                              >
                                ← Back to Main settings
                              </button>
                            </div>

                            {/* WORKSPACE OF ACTIVE SUBJECT */}
                            {(() => {
                              const activeSub = activeSubjects[adminSelectedSubjectIdx] || activeSubjects[0] || { name: "Mathematics", questionsToAnswer: 15 };
                              const activeSubQuestions = examQuestions.filter(q => (q.subject || "Mathematics").trim().toLowerCase() === activeSub.name.trim().toLowerCase());
                          
                              return (
                                <div className="space-y-6">
                                  
                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                                    
                                    {/* Form A: Omni AI Question Synthesizer & Questions counts limits */}
                                    <div className="lg:col-span-1 space-y-6">
                                      
                                      <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#181524] border-white/10' : 'bg-white border-slate-200'} space-y-5 shadow-sm`}>
                                        <div className="flex items-center justify-between border-b pb-2">
                                          <p className="text-xs font-black uppercase text-red-500 flex items-center gap-1">🧪 Generate with Omni</p>
                                          <div className="bg-[#DC2626]/10 px-2.5 py-0.5 rounded-full border border-[#DC2626]/20">
                                            <p className="text-[8px] font-black text-[#DC2626] uppercase">({activeSubQuestions.length} / {activeSub.questionsToAnswer || 15} Qs)</p>
                                          </div>
                                        </div>

                                        <div className="space-y-4">
                                          {/* Prompt Input */}
                                          <div className="space-y-1">
                                            <p className={`text-[7.5px] font-black uppercase ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Omni prompt instruction (Optional if context exists)</p>
                                            <input
                                              type="text"
                                              placeholder="e.g. Set questions focusing on organic naming or matrices..."
                                              id="omni-subject-prompt"
                                              className={`w-full border rounded-xl px-3.5 py-3 text-xs outline-none focus:border-[#DC2626]/50 transition-all ${
                                                theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                                              }`}
                                            />
                                          </div>

                                          {/* Text Area for raw context */}
                                          <div className="space-y-1">
                                            <p className={`text-[7.5px] font-black uppercase ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Raw Textbook / Notes Content</p>
                                            <textarea id="omni-raw-notes-area" placeholder="Paste raw lecture material or summary text here..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs outline-none text-white h-32 resize-none focus:border-[#DC2626]/50 transition-all"></textarea>
                                            </div>
                                            <div className="pt-3">
                                              <button
                                                onClick={async () => {
                                                  if (isGeneratingAdminQuestions) return;
                                                  const pInp = document.getElementById("omni-subject-prompt") as HTMLInputElement;
                                                  const textInp = document.getElementById("omni-raw-notes-area") as HTMLTextAreaElement;
                                                  const countInp = document.getElementById("omni-quantity-count") as HTMLInputElement;

                                                  const promptText = pInp ? pInp.value.trim() : "";
                                                  const rawContextText = textInp ? textInp.value.trim() : "";
                                                  const qty = Math.min(50, Math.max(1, parseInt(countInp?.value || "5")));

                                                  if (!rawContextText && activeSubQuestions.length === 0) {
                                                    setUserNotification("⚠️ Please paste some raw Textbook content so Omni can generate your questions pool.");
                                                    return;
                                                  }

                                                  setUserNotification(`🤖 Omni is analyzing ${qty} questions for ${activeSub.name}...`);
                                                  setIsGeneratingAdminQuestions(true);

                                                  try {
                                                    await generateAdminQuestions({
                                                      rawNotes: rawContextText,
                                                      quantity: qty,
                                                      customPrompt: promptText,
                                                    });
                                                    if (textInp) textInp.value = "";
                                                    if (pInp) pInp.value = "";
                                                    setUserNotification(`✨ Omni has successfully synthesised ${qty} questions!`);
                                                  } catch (err) {
                                                    console.error(err);
                                                    setUserNotification("❌ AI synthesiser suffered a loading timeout. Please try again.");
                                                  } finally {
                                                    setIsGeneratingAdminQuestions(false);
                                                  }
                                                }}
                                                disabled={isGeneratingAdminQuestions}
                                                className="w-full bg-red-650 hover:bg-red-700 text-white font-black py-3 rounded-xl text-[9px] uppercase tracking-wider transition-colors disabled:opacity-40"
                                                style={{ backgroundColor: "#DC2626" }}
                                              >
                                                {isGeneratingAdminQuestions ? "GENERATING..." : "Generate with AI"}
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>


                                    {/* Form B: Unified Batch Text Area & Live Validator / View Mode */}
                                    <div className="lg:col-span-2 space-y-4">
                                      
                                      <div className="flex items-center justify-between border-b pb-2">
                                        <div className="flex items-center gap-2">
                                          <h3 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-xs uppercase tracking-tight`}>
                                            📖 Questions Bank for {activeSub.name}
                                          </h3>
                                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                                            isQuestionsLocked ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'
                                          }`}>
                                            {isQuestionsLocked ? "View Mode Active" : "Edit Mode Active"}
                                          </span>
                                        </div>
                                        <span className={`text-[10px] font-black ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>
                                          ({activeSubQuestions.length} / {activeSub.questionsToAnswer || 15} Qs)
                                        </span>
                                      </div>

                                      {isQuestionsLocked ? (
                                        /* VIEW MODE: Render questions as student sees them */
                                        <div className="space-y-4 max-h-[800px] overflow-y-auto pr-1">
                                          {activeSubQuestions.length === 0 ? (
                                            <div className={`py-24 text-center rounded-3xl border border-dashed ${
                                              theme === 'dark' ? 'bg-white/[0.01] border-white/10 text-white/20' : 'bg-slate-50 border-slate-250 text-slate-400'
                                            }`}>
                                              <FileText size={40} className="mx-auto mb-2 opacity-60" />
                                              <p className="text-[10px] font-bold">No questions available for {activeSub.name}</p>
                                              <p className="text-[9px] opacity-70 mt-1">Switch to Edit Mode to paste questions</p>
                                            </div>
                                          ) : (
                                            activeSubQuestions.map((thisQ, relativeIndex) => (
                                              <div 
                                                key={thisQ.id} 
                                                className={`p-5 sm:p-6 rounded-3xl border text-left space-y-4 ${
                                                  theme === 'dark' ? 'bg-[#181524] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
                                                }`}
                                              >
                                                <div className="flex justify-between items-start border-b border-white/5 pb-2.5">
                                                  <span className="text-[10px] font-black uppercase tracking-wider text-[#DC2626]">
                                                    Question {relativeIndex + 1}
                                                  </span>
                                                  <span className="text-[8px] font-mono opacity-40">{thisQ.id}</span>
                                                </div>

                                                <div className="text-xs font-bold leading-relaxed">
                                                  <MarkdownRenderer content={thisQ.question} />
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                  {thisQ.options.map((optItem, oIdx) => (
                                                    <div 
                                                      key={oIdx} 
                                                      className={`p-3 rounded-xl text-[10px] border flex items-center justify-between font-medium ${
                                                        oIdx === thisQ.correctAnswer 
                                                          ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                                                          : theme === 'dark' ? 'bg-white/5 border-white/5 text-white/70' : 'bg-slate-50 border-slate-200 text-slate-700'
                                                      }`}
                                                    >
                                                      <div className="flex-1">
                                                        <span className="font-bold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                                                        <MarkdownRenderer content={optItem} />
                                                      </div>
                                                      {oIdx === thisQ.correctAnswer && <span className="text-green-400 text-[8px] font-black uppercase">CORRECT</span>}
                                                    </div>
                                                  ))}
                                                </div>

                                                {thisQ.explanation && (
                                                  <div className={`p-3 rounded-xl text-[9px] border leading-normal border-dashed ${
                                                    theme === 'dark' ? 'bg-white/5 border-white/10 text-white/50' : 'bg-slate-50 border-slate-200 text-slate-600'
                                                  }`}>
                                                    <p className="font-black text-amber-500 uppercase tracking-widest text-[8px] mb-1">Review / Explanation:</p>
                                                    <MarkdownRenderer content={thisQ.explanation} />
                                                  </div>
                                                )}
                                              </div>
                                            ))
                                          )}
                                        </div>
                                      ) : (
                                        /* EDIT MODE: Unified Textarea with real-time error catching & batch paste */
                                        <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#181524] border-white/10' : 'bg-white border-slate-200'} space-y-4`}>
                                          <div className="space-y-1">
                                            <p className={`text-[8px] font-black uppercase ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>
                                              Paste questions in unified format (Question: option a, option b*, option c, option d (Review))
                                            </p>
                                            <p className={`text-[7.5px] italic opacity-60 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>
                                              Example: Who is a boy?: A male human*, A male dog, A female goat, A car (A boy is a male human, remember that.)
                                            </p>
                                            <textarea id="batch-questions-area" value={batchQuestionText} onChange={(e) => setBatchQuestionText(e.target.value)} placeholder="Paste questions here..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-mono outline-none text-white focus:border-[#DC2626] resize-y h-48 leading-relaxed shadow-inner"></textarea>
                                          </div>

                                          <div className="flex items-center justify-between">
                                            <button
                                              onClick={() => {
                                                if (batchQuestionText.trim().length > 0) {
                                                  setBatchQuestionText("");
                                                  setUserNotification("🙈 Hidden current questions from editor.");
                                                } else {
                                                  const txt = questionsToBatchText(activeSubQuestions);
                                                  setBatchQuestionText(txt);
                                                  setUserNotification("📥 Loaded existing questions into editor.");
                                                }
                                              }}
                                              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border ${
                                                theme === 'dark' ? 'bg-white/5 border-white/10 text-white/70' : 'bg-slate-100 border-slate-200 text-slate-700'
                                              }`}
                                            >
                                              {batchQuestionText.trim().length > 0 ? "Hide Current Questions" : "Load Current Questions"}
                                            </button>

                                            <button
                                              onClick={() => parseAndImportBatchQuestions(activeSub.name)}
                                              className="bg-[#DC2626] hover:bg-[#DC2626]/90 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all"
                                            >
                                              Parse & Save Questions
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                    </div>

                                  </div>

                                </div>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    )}

                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* EDIT PROFILE / SETTINGS FULL PAGE */}
      <AnimatePresence>
        {isEditingProfile && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 15 }}
            className="fixed inset-0 z-[490] bg-[#0E0C16] overflow-y-auto px-4 sm:px-8 py-6 flex flex-col items-center justify-start custom-scrollbar min-h-screen select-none"
          >
            <div className="w-full max-w-lg mx-auto space-y-6 text-left pb-16">
              
              {/* Header: Back arrow + Settings title */}
              <div className="flex items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="p-2 -ml-2 rounded-xl text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                  title="Back to Profile"
                >
                  <ArrowLeft size={22} />
                </button>
                <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
              </div>

              {/* Main Form Container Card matching Screenshot 2 */}
              <div className="bg-[#171522] border border-white/5 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
                
                {/* Avatar with circular pencil button */}
                <div className="flex justify-center pb-2">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-800 border-2 border-white/10 shadow-xl">
                      {currentUserData?.photoURL ? (
                        <img src={currentUserData.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                          <User size={44} />
                        </div>
                      )}
                    </div>
                    {/* Pencil edit badge */}
                    <label className="absolute bottom-0 right-0 p-2 bg-white text-slate-900 rounded-full cursor-pointer shadow-lg hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center">
                      <Edit3 size={14} className="text-slate-900" />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => {
                          handleProfileImageUpload(e);
                          setUserNotification("Uploading selected avatar...");
                        }} 
                      />
                    </label>
                  </div>
                </div>

                {/* Dark Mode / Light Mode Integration Toggle */}
                <div className="p-4 rounded-2xl bg-[#0E0C16] border border-white/10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border flex items-center justify-center ${
                      theme === 'dark' 
                        ? 'bg-purple-950/60 border-purple-500/40 text-purple-300' 
                        : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    }`}>
                      {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">App Theme</p>
                      <p className="text-[11px] text-white/50">{theme === 'dark' ? 'Dark Purple Mode' : 'Light Mode'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = theme === 'dark' ? 'light' : 'dark';
                      setTheme(next);
                      try { localStorage.setItem('omni_theme', next); } catch(e) {}
                      setUserNotification(next === 'dark' ? "🌙 Dark Mode activated" : "☀️ Light Mode activated");
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                      theme === 'dark'
                        ? 'bg-purple-600/30 hover:bg-purple-600/50 border-purple-500/40 text-purple-200'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300'
                    }`}
                  >
                    <span>{theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</span>
                  </button>
                </div>

                {/* Full Personal Name */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-white/60">Full Personal Name</label>
                  <input 
                    type="text" 
                    value={profileFormData.fullName || ''} 
                    onChange={(e) => setProfileFormData({ 
                      ...profileFormData, 
                      fullName: e.target.value
                    })} 
                    placeholder="Full Personal Name"
                    className="w-full bg-[#0E0C16] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white font-medium outline-none focus:border-purple-500/80 transition-all"
                  />
                </div>

                {/* Public Display Name */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-white/60">Public Display Name</label>
                  <input 
                    type="text" 
                    value={profileFormData.displayName || ''} 
                    onChange={(e) => setProfileFormData({ 
                      ...profileFormData, 
                      displayName: e.target.value
                    })} 
                    placeholder="Public Display Name"
                    className="w-full bg-[#0E0C16] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white font-medium outline-none focus:border-purple-500/80 transition-all"
                  />
                </div>

                {/* Current Handle / Username */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-white/60">Current Handle / Username</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-purple-400 font-mono">@</span>
                    <input 
                      type="text" 
                      value={profileFormData.username || ''} 
                      onChange={(e) => setProfileFormData({ 
                        ...profileFormData, 
                        username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                      })} 
                      placeholder="username"
                      className="w-full bg-[#0E0C16] border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-sm text-white font-mono outline-none focus:border-purple-500/80 transition-all"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-white/60">Email Address</label>
                  <input 
                    type="email" 
                    value={profileFormData.email || user?.email || ''} 
                    onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })} 
                    placeholder="Email Address"
                    className="w-full bg-[#0E0C16] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white font-medium outline-none focus:border-purple-500/80 transition-all"
                  />
                </div>

                {/* ID / Matriculation Number */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-white/60">ID / Matriculation Number</label>
                  <input 
                    type="text" 
                    value={profileFormData.matricNumber || ''} 
                    onChange={(e) => setProfileFormData({ ...profileFormData, matricNumber: e.target.value })} 
                    placeholder="e.g. 2023/123456"
                    className="w-full bg-[#0E0C16] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white font-medium outline-none focus:border-purple-500/80 transition-all"
                  />
                </div>

                {/* DOB & Country Row */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  {/* DOB Field */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-semibold text-white/60">Date of Birth</label>
                    <input 
                      type="date"
                      value={profileFormData.dob || ''} 
                      onChange={(e) => setProfileFormData({ ...profileFormData, dob: e.target.value })} 
                      className="w-full bg-[#0E0C16] border border-white/10 rounded-xl px-3 py-3.5 text-sm text-white font-medium outline-none focus:border-purple-500/80 transition-all"
                    />
                  </div>

                  {/* Country Dropdown */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-semibold text-white/60">Country</label>
                    <div className="relative">
                      <select
                        value={profileFormData.country || 'Nigeria'}
                        onChange={(e) => setProfileFormData({ ...profileFormData, country: e.target.value })}
                        className="w-full bg-[#0E0C16] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white font-medium outline-none appearance-none pr-8 focus:border-purple-500/80 transition-all cursor-pointer"
                      >
                        {['Nigeria', 'Ghana', 'United States', 'United Kingdom', 'Canada', 'South Africa', 'Kenya', 'Others'].map(c => (
                          <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Gender Selection */}
                <div className="space-y-2 text-left pt-1">
                  <label className="text-sm font-bold text-white">Gender</label>
                  <div className="flex items-center gap-6">
                    {['Male', 'Female', 'Other'].map((g) => {
                      const selected = (profileFormData.gender || 'Male').toLowerCase() === g.toLowerCase();
                      return (
                        <label 
                          key={g} 
                          onClick={() => setProfileFormData({ ...profileFormData, gender: g })}
                          className="flex items-center gap-2 cursor-pointer select-none group"
                        >
                          <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${
                            selected ? 'bg-white border-white text-slate-900' : 'border-white/30 bg-transparent group-hover:border-white/60'
                          }`}>
                            {selected && <Check size={14} className="stroke-[3]" />}
                          </div>
                          <span className="text-sm font-medium text-white">{g}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* University Selection */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-white/60">University / Institution</label>
                  <div className="relative">
                    <select
                      value={profileFormData.university || ''}
                      onChange={(e) => setProfileFormData({ ...profileFormData, university: e.target.value })}
                      className="w-full bg-[#0E0C16] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white font-medium outline-none appearance-none pr-8 focus:border-purple-500/80 transition-all cursor-pointer"
                    >
                      <option value="" className="bg-slate-900 text-white/50">Select University</option>
                      {UNIVERSITIES.map((u: string) => (
                        <option key={u} value={u} className="bg-slate-900 text-white">{u}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                  </div>
                </div>

                {/* Academic Level & Faculty Row */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  {/* Academic Level */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-semibold text-white/60">Academic Level</label>
                    <div className="relative">
                      <select
                        value={profileFormData.level || ''}
                        onChange={(e) => setProfileFormData({ ...profileFormData, level: e.target.value })}
                        className="w-full bg-[#0E0C16] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white font-medium outline-none appearance-none pr-8 focus:border-purple-500/80 transition-all cursor-pointer"
                      >
                        <option value="" className="bg-slate-900 text-white/50">Select Level</option>
                        {['100L', '200L', '300L', '400L', '500L', 'Postgraduate'].map(l => (
                          <option key={l} value={l} className="bg-slate-900 text-white">{l}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                    </div>
                  </div>

                  {/* Faculty Dropdown */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-semibold text-white/60">Faculty</label>
                    <div className="relative">
                      <select
                        value={profileFormData.faculty || ''}
                        onChange={(e) => setProfileFormData({ ...profileFormData, faculty: e.target.value, department: '' })}
                        className="w-full bg-[#0E0C16] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white font-medium outline-none appearance-none pr-8 focus:border-purple-500/80 transition-all cursor-pointer"
                      >
                        <option value="" className="bg-slate-900 text-white/50">Select Faculty</option>
                        {FACULTIES.map((f: string) => (
                          <option key={f} value={f} className="bg-slate-900 text-white">{f}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-white/60">Department</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={profileFormData.department || ''} 
                      onChange={(e) => setProfileFormData({ ...profileFormData, department: e.target.value })} 
                      placeholder="e.g. Computer Science"
                      className="w-full bg-[#0E0C16] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white font-medium outline-none focus:border-purple-500/80 transition-all"
                    />
                  </div>
                </div>

                {/* Action Buttons: Cancel / Save */}
                <div className="flex items-center gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditingProfile(false)} 
                    className="flex-1 py-3.5 px-4 rounded-xl text-xs font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveProfile} 
                    className="flex-1 py-3.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-lg shadow-purple-600/20 active:scale-95 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>

                {/* Additional Account Security Options */}
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Account Options</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={async () => {
                        if (!user?.email) return;
                        try {
                          const { sendPasswordResetEmail } = await import('firebase/auth');
                          await sendPasswordResetEmail(auth, user.email);
                          setUserNotification("Password reset email sent!");
                        } catch (err: any) {
                          setUserNotification(`Error sending reset email: ${err.message || err}`);
                        }
                      }}
                      className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all text-center cursor-pointer"
                    >
                      Reset Password
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false);
                        handleLogout();
                      }}
                      className="px-3 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-xs font-semibold text-red-300 transition-all text-center cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                </div>

              </div>

              {/* Bottom Indicator: Premium Learner */}
              <div className="pt-2 text-center">
                <span className="text-sm font-bold text-white/90 border-b-2 border-white pb-0.5 inline-block">
                  Premium Learner
                </span>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      <AnimatePresence>
        {isDeleteAccountOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => { setIsDeleteAccountOpen(false); setDeleteConfirmInput(""); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full max-w-sm ${theme === 'dark' ? 'bg-[#13111C] border-red-500/30' : 'bg-white border-red-100'} border-[2px] rounded-3xl p-6 shadow-2xl space-y-6 text-left`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-red-500/10 text-red-500 flex-shrink-0 animate-pulse">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className={`font-black uppercase tracking-tighter text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Delete My Account</h3>
                  <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>This action is permanent and irreversible.</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className={`text-xs font-semibold leading-relaxed ${theme === 'dark' ? 'text-white/60' : 'text-slate-605'}`}>
                  To continue de-registering your index of academic notes, AI chat history, and active performance credentials, please type <span className="font-bold text-red-500 select-none">delete my account</span> in the input field below:
                </p>

                <input
                  type="text"
                  placeholder="delete my account"
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  className={`w-full py-4 px-5 rounded-2xl outline-none border transition-all text-sm font-bold ${
                    theme === 'dark' 
                      ? 'bg-red-500/5 focus:bg-red-500/15 border-white/10 focus:border-red-500 text-white' 
                      : 'bg-red-50/50 focus:bg-white border-slate-200 focus:border-red-500 text-slate-800'
                  }`}
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => { setIsDeleteAccountOpen(false); setDeleteConfirmInput(""); }}
                  className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    theme === 'dark' ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                  }`}
                >
                  ABORT
                </button>
                <button 
                  disabled={deleteConfirmInput.trim().toLowerCase() !== "delete my account"}
                  onClick={async () => {
                    if (!user?.uid) return;
                    setIsAuthLoading(true);
                    try {
                      // Delete user details from users collection
                      await deleteDoc(doc(db, 'users', user.uid));
                      // Sign out
                      await signOut(auth);
                      setUser(null);
                      setAdminMode(false);
                      setIsHostPaid(false);
                      setIsTakingPaid(false);
                      setIsDeleteAccountOpen(false);
                      setDeleteConfirmInput("");
                      setUserNotification("💔 Your account has been permanently deleted.");
                    } catch (err: any) {
                      console.error("Account Deletion Error:", err);
                      setUserNotification(`Deletion Error: ${err.message}`);
                    } finally {
                      setIsAuthLoading(false);
                    }
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-white shadow-lg ${
                    deleteConfirmInput.trim().toLowerCase() === "delete my account"
                      ? 'bg-red-600 hover:bg-red-700 hover:shadow-red-600/30 active:translate-y-[2px]'
                      : 'bg-red-953/20 text-red-500/20 shadow-none cursor-not-allowed border border-white/5'
                  }`}
                >
                  DELETE MY ACCOUNT
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRM MODAL */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full max-w-sm ${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} border rounded-3xl p-6 shadow-2xl space-y-6`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${confirmModal.isDanger ? 'bg-red-500/10 text-red-500' : 'bg-[#DC2626]/10 text-[#DC2626]'}`}>
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className={`font-black uppercase tracking-tighter text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{confirmModal.title}</h3>
                  <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>{confirmModal.message}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-white shadow-lg ${confirmModal.isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-[#DC2626] hover:bg-[#DC2626]/90 shadow-[#DC2626]/20'}`}
                >
                  {confirmModal.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GOD MODE PANEL */}
      <AnimatePresence>
        {showGodMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-[#090D16] text-white flex flex-col md:flex-row overflow-hidden font-sans">
            {/* Command Sidebar */}
            <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-white/10 bg-[#0F1623]/95 backdrop-blur-2xl flex flex-col shadow-2xl z-20 shrink-0">
              <div className="p-4 md:p-6 border-b border-red-500/20 bg-gradient-to-br from-red-600/10 via-transparent to-transparent flex items-center justify-between md:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-11 md:h-11 bg-gradient-to-tr from-red-600 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-950/60 shrink-0 ring-1 ring-red-400/30">
                    <ShieldCheck size={22} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-base md:text-lg font-black text-white uppercase tracking-tight italic leading-tight flex items-center gap-1.5">
                      God Mode <span className="text-[9px] font-mono not-italic px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">v3.0</span>
                    </h1>
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-[0.25em]">Admin Command Center</p>
                  </div>
                </div>
                <button onClick={() => setShowGodMode(false)} className="md:hidden p-2 text-white/40 hover:text-red-500 transition-colors">
                  <XCircle size={22} />
                </button>
              </div>

              {/* Sidebar Tabs */}
              <nav className="flex-1 p-2 md:p-3 md:space-y-1.5 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto custom-scrollbar">
                {[
                  { id: 'dashboard', label: 'Overview', desc: 'Metrics & Health', icon: LayoutDashboard },
                  { id: 'users', label: 'Users Control', desc: `${allUsers.length} Users`, icon: User },
                  { id: 'marketing', label: 'Email Outreach', desc: 'Mass Broadcast', icon: Mail },
                  { id: 'blog', label: 'Neural Feed', desc: 'Articles & Posts', icon: BookOpen },
                  { id: 'reports', label: 'Safety Protocols', desc: `${allReports.length} Alerts`, icon: AlertTriangle },
                  { id: 'courses', label: 'Curriculums', desc: `${customCourses.length} Courses`, icon: GraduationCap },
                ].map((item) => {
                  const isActive = godTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setGodTab(item.id as any)}
                      className={`flex items-center gap-3 px-3.5 md:px-4 py-2.5 md:py-3.5 rounded-xl text-left transition-all shrink-0 md:shrink group relative ${
                        isActive 
                         ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-xl shadow-red-950/50 ring-1 ring-red-400/30' 
                         : 'text-white/50 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      <item.icon size={18} className={isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80'} />
                      <div className="hidden md:block min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-wider leading-none mb-0.5">{item.label}</p>
                        <p className={`text-[8px] font-medium tracking-wide ${isActive ? 'text-white/80' : 'text-white/30'}`}>{item.desc}</p>
                      </div>
                      <span className="md:hidden text-[9px] font-black uppercase tracking-wider">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Exit Button */}
              <div className="hidden md:block p-4 border-t border-white/5 bg-[#090D16]/50">
                <button 
                  onClick={() => setShowGodMode(false)}
                  className="w-full flex items-center justify-center gap-2.5 py-3 bg-white/5 hover:bg-red-600 text-white/50 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5 hover:border-red-500 shadow-inner group"
                >
                  <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Exit Command
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative bg-gradient-to-b from-[#0F1623]/50 to-[#090D16]">
              {/* Header */}
              <div className="px-5 md:px-8 py-4 border-b border-white/10 bg-[#0F1623]/80 backdrop-blur-xl flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-base md:text-xl font-black text-white uppercase tracking-tight italic flex items-center gap-2">
                    {godTab === 'dashboard' && 'Command Overview'}
                    {godTab === 'users' && 'Population & User Management'}
                    {godTab === 'marketing' && 'Email Outreach & Broadcast Center'}
                    {godTab === 'blog' && 'Neural Feed & Publications'}
                    {godTab === 'reports' && 'Security Breaches & Safety Protocol'}
                    {godTab === 'courses' && 'Curriculum Builder & Course Architect'}
                  </h2>
                </div>
                
                <div className="flex items-center gap-3">
                  <AnimatePresence>
                    {godModeNotification && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-lg shadow-red-950/50 border border-red-400/30">
                        {godModeNotification}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                     <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest">System Online</span>
                  </div>
                </div>
              </div>

              {/* Scrollable View Container */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-16">
                  
                  {/* DASHBOARD TAB */}
                  {godTab === 'dashboard' && (
                    <div className="space-y-6">
                      {/* Metric Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                        {[
                          { label: 'Total Accounts', value: allUsers.length, icon: User, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                          { label: 'Premium Users', value: allUsers.filter(u => u.isPremium).length, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                          { label: 'Safety Incident Reports', value: allReports.length, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                          { label: 'Feed Articles', value: blogPosts.length, icon: BookOpen, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
                          { label: 'Curriculums Created', value: customCourses.length, icon: GraduationCap, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' }
                        ].map((stat, i) => (
                          <div key={i} className="bg-[#0F1623]/80 border border-white/10 p-4 md:p-5 rounded-2xl shadow-xl hover:border-white/20 transition-all">
                             <div className={`w-9 h-9 rounded-xl ${stat.bg} border flex items-center justify-center mb-3`}>
                                <stat.icon size={18} className={stat.color} />
                             </div>
                             <p className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-wider mb-1">{stat.label}</p>
                             <p className="text-xl md:text-2xl font-black text-white tracking-tight italic">{stat.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Quick Shortcuts */}
                      <div className="bg-[#0F1623]/80 border border-white/10 p-6 rounded-2xl space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-wider text-white/60">Command Direct Actions</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <button onClick={() => setGodTab('marketing')} className="p-4 bg-white/[0.03] border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 rounded-xl text-left transition-all group">
                            <Mail size={20} className="text-red-400 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-xs font-black text-white uppercase">Send Broadcast Email</p>
                            <p className="text-[9px] text-white/40 mt-1">Mass outreach to student base</p>
                          </button>
                          <button onClick={() => setGodTab('users')} className="p-4 bg-white/[0.03] border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 rounded-xl text-left transition-all group">
                            <User size={20} className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-xs font-black text-white uppercase">Manage Users</p>
                            <p className="text-[9px] text-white/40 mt-1">Grant bypass, search & ban</p>
                          </button>
                          <button onClick={() => setGodTab('courses')} className="p-4 bg-white/[0.03] border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 rounded-xl text-left transition-all group">
                            <GraduationCap size={20} className="text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-xs font-black text-white uppercase">Add Curriculum</p>
                            <p className="text-[9px] text-white/40 mt-1">Publish new academic course</p>
                          </button>
                          <button onClick={() => setGodTab('reports')} className="p-4 bg-white/[0.03] border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/10 rounded-xl text-left transition-all group">
                            <AlertTriangle size={20} className="text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-xs font-black text-white uppercase">Review Security</p>
                            <p className="text-[9px] text-white/40 mt-1">Check toxic reports & alerts</p>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NEURAL FEED TAB */}
                  {godTab === 'blog' && (
                    <div className="bg-[#0F1623]/80 border border-white/10 p-5 md:p-8 rounded-2xl space-y-6">
                      <div className="flex items-center justify-between border-b border-white/10 pb-6">
                        <div>
                          <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2.5 italic">
                            <BookOpen size={22} className="text-red-500" /> Neural Feed Publications
                          </h3>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-0.5">Manage platform announcements & community updates</p>
                        </div>
                        <button 
                          onClick={() => setIsAddingPost(true)}
                          className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-red-950/50"
                        >
                          <Plus size={16} /> New Article
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {blogPosts.length === 0 ? (
                          <div className="col-span-2 text-center py-12 text-white/30 font-bold text-xs uppercase tracking-wider">No feed publications found</div>
                        ) : (
                          blogPosts.map(post => (
                            <div key={post.id} className="bg-white/[0.02] border border-white/10 p-5 rounded-2xl flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                              <div className="truncate pr-4 flex-1">
                                <p className="font-black text-white text-xs truncate uppercase tracking-tight mb-1.5 italic">{post.title}</p>
                                <div className="flex items-center gap-3">
                                  <p className="text-[8px] text-white/30 font-mono font-bold uppercase">{post.timestamp?.toDate ? post.timestamp.toDate().toLocaleDateString() : 'Draft'}</p>
                                  <div className="flex gap-1.5">
                                    {Object.entries(post.reactions || {}).map(([emoji, count]) => (
                                      <span key={emoji} className="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-bold">{emoji} {count as any}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => { setEditingPost(post); setIsEditingPost(true); }} className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"><Edit3 size={15} /></button>
                                <button onClick={() => deletePost(post.id)} className="p-2 bg-white/5 rounded-lg text-white/40 hover:text-red-400 transition-all"><Trash2 size={15} /></button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* SAFETY PROTOCOLS TAB */}
                  {godTab === 'reports' && (
                    <div className="bg-[#0F1623]/80 border border-white/10 p-5 md:p-8 rounded-2xl space-y-6">
                       <div>
                          <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2.5 italic">
                            <AlertTriangle size={22} className="text-red-500" /> Security Violation Reports
                          </h3>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-0.5">Review toxic interaction reports and enforce platform safety rules</p>
                       </div>

                       <div className="space-y-6">
                        {allReports.length === 0 && (
                          <div className="text-center py-20 bg-white/[0.02] rounded-2xl border border-white/5">
                             <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                                <ShieldCheck size={28} className="text-emerald-400" />
                             </div>
                             <p className="text-base font-black text-white/40 uppercase tracking-tight">Platform Secure</p>
                             <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider mt-1">No active reports or security violations</p>
                          </div>
                        )}
                        {allReports.map(report => (
                          <div key={report.id} className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
                             <div className="p-5 bg-red-600/10 border-b border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400 border border-red-500/30"><AlertTriangle size={20} /></div>
                                   <div>
                                      <p className="text-xs font-black text-white uppercase tracking-tight">Suspect Handle: <span className="text-red-400">@{report.suspectHandle}</span></p>
                                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mt-0.5">Reporter Email: {report.reporterEmail}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider">Priority Alert</span>
                                   <p className="text-[8px] font-mono text-white/30 mt-1 uppercase">{report.timestamp?.toDate ? report.timestamp.toDate().toLocaleString() : 'Recent'}</p>
                                </div>
                             </div>
                             <div className="p-5 space-y-4">
                                <div className="bg-[#090D16] rounded-xl p-4 border border-white/10 space-y-3">
                                   <p className="text-[9px] font-black text-white/40 uppercase tracking-wider border-b border-white/5 pb-2">Chat Log Evidence Extraction</p>
                                   <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                     {report.messages?.map((msg: any, idx: number) => (
                                       <div key={idx} className="flex gap-3 items-start text-xs">
                                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider shrink-0 mt-0.5 ${msg.senderId === report.suspectId ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/50'}`}>
                                            {msg.senderId === report.suspectId ? 'SUSPECT' : 'REPORTER'}
                                          </span>
                                          <p className="text-white/80 font-medium">{msg.text}</p>
                                       </div>
                                     ))}
                                   </div>
                                </div>
                                <div className="flex items-center justify-end gap-3 pt-2">
                                   <button onClick={() => handleReportAction(report.id, 'dismiss')} className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">Dismiss</button>
                                   <button onClick={() => handleReportAction(report.id, 'warn')} className="px-5 py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-black rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">Send Warning</button>
                                   <button onClick={() => handleReportAction(report.id, 'ban')} className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg transition-all">Ban Suspect User</button>
                                </div>
                             </div>
                          </div>
                        ))}
                       </div>
                    </div>
                  )}

                  {/* USERS MONITOR TAB */}
                  {godTab === 'users' && (
                    <div className="bg-[#0F1623]/80 border border-white/10 p-5 md:p-8 rounded-2xl space-y-6">
                      <div className="flex items-center justify-between border-b border-white/10 pb-5">
                        <div>
                          <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2.5 italic">
                             <Database className="w-5 h-5 text-red-500" /> Users Population Terminal
                          </h3>
                        </div>
                      </div>

                      {/* Search & Filter Controls */}
                      <div className="flex flex-col md:flex-row gap-3 justify-between items-center bg-white/[0.02] p-3 rounded-xl border border-white/10">
                        <div className="relative w-full md:max-w-md">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search name, email, matric, department, school..."
                            value={godUserSearch}
                            onChange={(e) => setGodUserSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-8 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 transition-all font-medium"
                          />
                          {godUserSearch && (
                            <button onClick={() => setGodUserSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs">Clear</button>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                          {[
                            { id: 'all', label: 'All' },
                            { id: 'premium', label: 'Premium' },
                            { id: 'free', label: 'Free Tier' },
                            { id: 'online', label: 'Online' },
                            { id: 'banned', label: 'Banned' }
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setGodUserFilter(tab.id as any)}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                                godUserFilter === tab.id
                                  ? 'bg-red-600 border-red-500 text-white shadow-md'
                                  : 'bg-white/5 border-white/5 text-white/40 hover:text-white'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left font-sans">
                          <thead>
                            <tr className="uppercase tracking-wider border-b border-white/10 text-white/30 font-black text-[10px] italic">
                              <th className="py-3 px-3">User Identity</th>
                              <th className="py-3 px-3">Academic Info</th>
                              <th className="py-3 px-3">Privileges & Master Bypass</th>
                              <th className="py-3 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="text-white/80 text-xs">
                            {allUsers
                              .filter(u => {
                                if (godUserSearch) {
                                  const searchLower = godUserSearch.toLowerCase().trim();
                                  const matchesName = (u.fullName || '').toLowerCase().includes(searchLower) || (u.displayName || '').toLowerCase().includes(searchLower);
                                  const matchesEmail = (u.email || '').toLowerCase().includes(searchLower);
                                  const matchesMatric = (u.matric || '').toLowerCase().includes(searchLower);
                                  const matchesDept = (u.department || '').toLowerCase().includes(searchLower);
                                  const matchesSchool = (u.university || '').toLowerCase().includes(searchLower);
                                  if (!matchesName && !matchesEmail && !matchesMatric && !matchesDept && !matchesSchool) {
                                    return false;
                                  }
                                }
                                if (godUserFilter === 'premium') return u.isPremium;
                                if (godUserFilter === 'free') return !u.isPremium;
                                if (godUserFilter === 'banned') return u.status === 'deleted';
                                if (godUserFilter === 'online') {
                                  const lastSeenTime = u.lastSeen?.toDate ? u.lastSeen.toDate() : (u.lastSeen ? new Date(u.lastSeen) : null);
                                  return lastSeenTime && (Date.now() - lastSeenTime.getTime() < 180000);
                                }
                                return true;
                              })
                              .map(u => {
                                const lastSeenTime = u.lastSeen?.toDate ? u.lastSeen.toDate() : (u.lastSeen ? new Date(u.lastSeen) : null);
                                const isOnline = lastSeenTime && (Date.now() - lastSeenTime.getTime() < 180000);

                                return (
                                <tr key={u.id} className={`border-b transition-all border-white/5 hover:bg-white/[0.02] ${u.status === 'deleted' ? 'opacity-30' : ''}`}>
                                  <td className="py-3 px-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center font-black text-red-500 text-xs shrink-0 relative">
                                        {u.photoURL ? <img src={u.photoURL} className="w-full h-full rounded-xl object-cover" /> : (u.displayName?.charAt(0) || u.email?.charAt(0) || '?')}
                                        {isOnline && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#090D16]" title="Online" />}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-black text-white uppercase tracking-tight leading-none mb-1 text-[11px] italic truncate">{u.fullName || u.displayName || 'Anonymous'}</p>
                                        <p className="text-[9px] font-mono opacity-40 truncate">{u.email}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 space-y-0.5 text-[10px]">
                                      <p className="font-mono text-white/90">MATRIC: {u.matric || 'N/A'}</p>
                                      <p className="text-white/40 truncate max-w-[130px]">{u.university || 'N/A'} ({u.level || '?'})</p>
                                      <p className="text-white/40 truncate max-w-[130px]">{u.department || 'N/A'}</p>
                                  </td>
                                  <td className="py-3 px-3">
                                     <div className="flex flex-col gap-1">
                                        <button 
                                          onClick={() => updateUserPermissions(u.id, 'bypassAllPayments', !u.bypassAllPayments)}
                                          className="flex items-center gap-2 group cursor-pointer"
                                        >
                                           <div className={`w-3 h-3 rounded-full transition-all flex items-center justify-center ${u.bypassAllPayments ? 'bg-red-500 text-white' : 'bg-white/10'}`}>
                                              {u.bypassAllPayments && <Check size={8} />}
                                           </div>
                                           <span className={`text-[9px] font-black uppercase tracking-wider ${u.bypassAllPayments ? 'text-red-400' : 'text-white/30'}`}>
                                             Master Bypass: {u.bypassAllPayments ? 'ACTIVE' : 'OFF'}
                                           </span>
                                        </button>
                                        <div className="flex items-center gap-2">
                                           <div className={`w-2 h-2 rounded-full ${u.isPremium ? 'bg-amber-400' : 'bg-white/10'}`} />
                                           <span className={`text-[9px] font-bold uppercase ${u.isPremium ? 'text-amber-400' : 'text-white/30'}`}>
                                             {u.isPremium ? 'PREMIUM ACCESS' : 'FREE TIER'}
                                           </span>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                     <div className="flex items-center gap-2 justify-end">
                                        <button 
                                          onClick={() => setEditingUser(u)} 
                                          className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white transition-all"
                                          title="Edit User"
                                        >
                                          <Edit3 size={14} />
                                        </button>
                                        <button 
                                          onClick={() => toggleUserStatus(u.id, u.status)} 
                                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${u.status === 'deleted' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black' : 'bg-red-500/20 text-red-400 hover:bg-red-600 hover:text-white'}`}
                                        >
                                          {u.status === 'deleted' ? 'RESTORE' : 'BAN'}
                                        </button>
                                     </div>
                                  </td>
                                </tr>
                                );
                             })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* EMAIL OUTREACH & BROADCAST TAB */}
                  {godTab === 'marketing' && (
                    <div className="bg-[#0F1623]/80 border border-white/10 p-5 md:p-8 rounded-2xl space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-5 gap-3">
                        <div>
                          <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2.5 italic leading-none">
                             <Mail className="w-5 h-5 text-red-500" /> Email Outreach & Mass Blast Hub
                          </h3>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mt-1">Design templates and trigger instant email blasts to registered users</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={initMarketingTemplates} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider text-white/40 hover:text-white transition-all">Reset Default Templates</button>
                          <button onClick={() => setTemplateEditForm({ name: '', subject: '', body: '', active: true })} className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-red-950/50">
                            <Plus size={16} /> New Template
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Stored Templates Selector */}
                        <div className="lg:col-span-1 space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-1">Email Templates ({emailTemplates.length})</p>
                          {emailTemplates.map(t => (
                            <div key={t.id} className={`p-4 rounded-xl border transition-all cursor-pointer ${templateEditForm?.id === t.id ? 'bg-red-600/20 border-red-500 text-white shadow-md' : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'}`} onClick={() => setTemplateEditForm(t)}>
                                <p className="text-xs font-black uppercase truncate tracking-tight text-white mb-0.5">{t.name}</p>
                                <p className="text-[9px] font-bold uppercase truncate text-white/40">{t.subject || 'No Subject Line'}</p>
                            </div>
                          ))}
                        </div>

                        {/* Template Editor */}
                        <div className="lg:col-span-3 rounded-2xl p-5 md:p-6 bg-[#090D16] border border-white/10 space-y-4">
                          {templateEditForm ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-white/40 uppercase tracking-wider ml-1">Template Label</label>
                                  <input value={templateEditForm.name} onChange={e => setTemplateEditForm({...templateEditForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-red-500 transition-all" placeholder="e.g. Welcome Broadcast" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black text-white/40 uppercase tracking-wider ml-1">Email Subject Line</label>
                                  <input value={templateEditForm.subject} onChange={e => setTemplateEditForm({...templateEditForm, subject: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-red-500 transition-all" placeholder="e.g. Welcome to Omni Academic Hub!" />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-black text-white/40 uppercase tracking-wider ml-1">Email Message Body (Markdown & HTML Supported)</label>
                                <textarea value={templateEditForm.body} onChange={e => setTemplateEditForm({...templateEditForm, body: e.target.value})} className="w-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-xs font-mono text-white/90 outline-none focus:border-red-500 transition-all h-52 resize-none leading-relaxed" placeholder="Type your email broadcast message here..."></textarea>
                              </div>
                              <div className="flex items-center justify-between pt-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input type="checkbox" checked={templateEditForm.active} onChange={e => setTemplateEditForm({...templateEditForm, active: e.target.checked})} className="sr-only peer" />
                                  <div className="w-10 h-5 bg-white/10 rounded-full peer-checked:bg-red-600 transition-all relative after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                                  <span className="text-[10px] font-black text-white/40 uppercase tracking-wider">Active Status</span>
                                </label>
                                <div className="flex gap-3">
                                   <button onClick={() => deleteEmailTemplate(templateEditForm.id)} className="px-4 py-2 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all">Delete</button>
                                   <button onClick={() => handleSaveEmailTemplate(templateEditForm)} className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-lg transition-all">Save Template</button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-16">
                              <Mail size={48} className="mb-3 text-white/40" />
                              <p className="text-sm font-black uppercase tracking-wider">Select or Create a Template</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mass Blast Control Box */}
                      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/[0.02] p-5 rounded-2xl border">
                         <div className="space-y-2 w-full sm:w-auto">
                            <p className="text-xs font-black text-white uppercase italic">Target Audience Selection</p>
                            <div className="flex items-center gap-2">
                               {(['all', 'premium', 'free'] as const).map(t => (
                                 <button
                                   key={t}
                                   onClick={() => setBroadcastTarget(t)}
                                   className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${broadcastTarget === t ? 'bg-red-600 border-red-500 text-white' : 'bg-white/5 border-white/10 text-white/30'}`}
                                 >
                                   {t} Target
                                 </button>
                               ))}
                               <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider ml-2">
                                 {allUsers.filter(u => broadcastTarget === 'all' || (broadcastTarget === 'premium' ? (u.isPremium || u.tier === 'premium') : (!u.isPremium && u.tier !== 'premium'))).length} RECIPIENTS TARGETED
                               </span>
                            </div>
                         </div>
                         <button 
                           onClick={triggerMarketingBlast}
                           disabled={!templateEditForm?.subject?.trim() || !templateEditForm?.body?.trim()}
                           className={`w-full sm:w-auto px-8 py-4 font-black rounded-xl text-[11px] uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95 ${(templateEditForm?.subject?.trim() && templateEditForm?.body?.trim()) ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-red-950/60' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                         >
                           {(templateEditForm?.subject?.trim() && templateEditForm?.body?.trim()) ? 'EXECUTE MASS EMAIL BLAST' : 'ENTER SUBJECT & BODY TO BLAST'}
                         </button>
                      </div>
                    </div>
                  )}

                  {/* CURRICULUMS ARCHITECT TAB */}
                  {godTab === 'courses' && (
                    <div className="bg-[#0F1623]/80 border border-white/10 p-5 md:p-8 rounded-2xl space-y-6">
                      <div className="flex items-center justify-between border-b border-white/10 pb-5">
                        <div>
                          <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2.5 italic">
                             <GraduationCap className="w-5 h-5 text-red-500" /> Academic Curriculum Architect
                          </h3>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mt-0.5">Define academic courses, course codes, and curriculum notes</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Course Creator Form */}
                        <form onSubmit={handleSaveCourse} className="lg:col-span-5 space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-5">
                          <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2">
                            {editingCourseId ? 'Edit Course Definition' : 'Create New Course'}
                          </h4>
                          
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-wider ml-1">Course Code</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="e.g. GST 111" 
                              value={newCourseCode} 
                              onChange={e => setNewCourseCode(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-red-500 transition-all" 
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-wider ml-1">Course Title</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="e.g. Use of Library and Study Skills" 
                              value={newCourseName} 
                              onChange={e => setNewCourseName(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-red-500 transition-all" 
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-wider ml-1">Syllabus Details / Description</label>
                            <textarea value={newCourseDesc} onChange={e => setNewCourseDesc(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-red-500 transition-all h-24 resize-none" placeholder="Outline topics, modules, or summary..."></textarea>
                          </div>

                          <div className="flex gap-2 pt-2">
                            {editingCourseId && (
                              <button 
                                type="button" 
                                onClick={() => {
                                  setEditingCourseId(null);
                                  setNewCourseCode('');
                                  setNewCourseName('');
                                  setNewCourseDesc('');
                                }}
                                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/50 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                              >
                                Cancel
                              </button>
                            )}
                            <button 
                              type="submit" 
                              className="flex-[2] bg-red-600 hover:bg-red-500 text-white py-2.5 px-5 text-[10px] font-black uppercase tracking-wider rounded-xl shadow-lg transition-all"
                            >
                              {editingCourseId ? 'Update Course' : 'Save & Publish Course'}
                            </button>
                          </div>
                        </form>

                        {/* Course List */}
                        <div className="lg:col-span-7 space-y-3">
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-wider pl-1">Published Courses ({customCourses.length})</p>
                          <div className="max-h-[420px] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                            {customCourses.length === 0 ? (
                              <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl opacity-40">
                                <BookOpen className="w-8 h-8 mx-auto mb-2 text-white/40" />
                                <p className="text-xs font-black uppercase tracking-wider">No Custom Courses Yet</p>
                              </div>
                            ) : (
                              customCourses.map(c => (
                                <div key={c.id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-start justify-between gap-3 hover:border-white/20 transition-all">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-red-400 font-mono text-[9px] font-black uppercase bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">{c.code}</span>
                                      <h5 className="font-black text-xs text-white uppercase truncate">{c.name}</h5>
                                    </div>
                                    <p className="text-[10px] text-white/50 line-clamp-2 leading-relaxed">{c.description}</p>
                                  </div>
                                  
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button 
                                      onClick={() => {
                                        setEditingCourseId(c.id);
                                        setNewCourseCode(c.code || '');
                                        setNewCourseName(c.name || '');
                                        setNewCourseDesc(c.description || '');
                                      }}
                                      className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-white transition-all"
                                      title="Edit"
                                    >
                                      <Edit3 size={13} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteCourse(c.id)}
                                      className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white transition-all"
                                      title="Delete"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        {isAddingPost && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} border rounded-3xl p-8 max-w-2xl w-full space-y-6 shadow-2xl`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Publish New Article</h3>
                <button onClick={() => setIsAddingPost(false)} className="text-white/40 hover:text-[#DC2626] transition-colors"><XCircle size={24} /></button>
              </div>
              
              <form onSubmit={handleAddPost} className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">Article Title</p>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter a bold, catchy title..."
                    value={newPost.title} 
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none text-white focus:border-[#DC2626]/50 transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">Article Content (Markdown Supported)</p>
                  <textarea required value={newPost.content} onChange={(e) => setNewPost({...newPost, content: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none text-white h-60 resize-none focus:border-[#DC2626]/50 transition-all" placeholder="Write full article markdown here..."></textarea>
                </div>

                <div className="flex gap-2 pt-4">
                  <button type="button" onClick={() => setIsAddingPost(false)} className="flex-1 bg-white/5 text-white/60 font-bold py-4 rounded-2xl text-sm">CANCEL</button>
                  <button type="submit" className="flex-[2] bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2">
                    <Send size={16} /> PUBLISH ARTICLE
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isEditingPost && editingPost && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} border rounded-3xl p-8 max-w-2xl w-full space-y-6 shadow-2xl`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Edit Article</h3>
                <button onClick={() => setIsEditingPost(false)} className="text-white/40 hover:text-[#DC2626] transition-colors"><XCircle size={24} /></button>
              </div>
              
              <form onSubmit={handleUpdatePost} className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">Article Title</p>
                  <input 
                    type="text" 
                    required
                    value={editingPost.title} 
                    onChange={(e) => setEditingPost({...editingPost, title: e.target.value})} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none text-white focus:border-[#DC2626]/50 transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">Article Content (Markdown Supported)</p>
                  <textarea required value={editingPost.content} onChange={(e) => setEditingPost({...editingPost, content: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none text-white h-60 resize-none focus:border-[#DC2626]/50 transition-all" placeholder="Write full article markdown here..."></textarea>
                </div>

                <div className="flex gap-2 pt-4">
                  <button type="button" onClick={() => setIsEditingPost(false)} className="flex-1 bg-white/5 text-white/60 font-bold py-4 rounded-2xl text-sm">CANCEL</button>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (editingPost) {
                        deletePost(editingPost.id);
                        setIsEditingPost(false);
                      }
                    }} 
                    className="flex-1 bg-red-500/10 text-red-500 font-bold py-4 rounded-2xl text-sm hover:bg-red-500/20 transition-all"
                  >
                    DELETE
                  </button>
                  <button type="submit" className="flex-[2] bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2">
                    <Save size={16} /> SAVE CHANGES
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingUser && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-[#13111C] border border-purple-500/30 rounded-3xl p-5 md:p-8 max-w-lg w-full max-h-[95vh] overflow-y-auto custom-scrollbar space-y-4 md:space-y-6 flex flex-col shadow-[0_0_50px_rgba(168,85,247,0.2)] text-white"
            >
              <div className="text-center space-y-1 pb-2 border-b border-purple-500/20">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-widest mb-1">
                  <User size={12} className="text-purple-400" /> Admin Command Override
                </div>
                <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">Profile Configuration</h3>
                <p className="text-[10px] text-purple-300/60 font-medium uppercase tracking-wider">Update Academic & User Credentials</p>
              </div>
              
              <form onSubmit={handleEditUser} className="space-y-4 pb-4 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-widest ml-1">Full Name</p>
                    <input type="text" value={editingUser.fullName || editingUser.displayName || ''} onChange={(e) => setEditingUser({...editingUser, fullName: e.target.value})} className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3.5 py-2.5 text-xs outline-none text-white focus:border-purple-500 transition-all" placeholder="Full Name" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-widest ml-1">Username Handle</p>
                    <input type="text" value={editingUser.username || ''} onChange={(e) => setEditingUser({...editingUser, username: e.target.value})} className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3.5 py-2.5 text-xs outline-none text-purple-300 font-mono focus:border-purple-500 transition-all" placeholder="handle" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-widest ml-1">Email Address</p>
                    <input type="email" value={editingUser.email || ''} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3.5 py-2.5 text-xs outline-none text-white focus:border-purple-500 transition-all" placeholder="user@domain.com" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-widest ml-1">Gender</p>
                    <select 
                      value={editingUser.gender || 'Male'} 
                      onChange={(e) => setEditingUser({...editingUser, gender: e.target.value})}
                      className="w-full bg-[#1A1626] border border-purple-500/20 rounded-xl px-3.5 py-2.5 text-xs outline-none text-white focus:border-purple-500 transition-all"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-widest ml-1">Matric Number</p>
                    <input type="text" value={editingUser.matricNumber || editingUser.matric || ''} onChange={(e) => setEditingUser({...editingUser, matricNumber: e.target.value, matric: e.target.value})} className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2 text-xs font-mono outline-none text-white focus:border-purple-500 transition-all" placeholder="U2024/..." />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-widest ml-1">Date of Birth</p>
                    <input type="text" value={editingUser.dob || ''} onChange={(e) => setEditingUser({...editingUser, dob: e.target.value})} className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-purple-500 transition-all" placeholder="DD/MM/YYYY" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-widest ml-1">University</p>
                    <input type="text" value={editingUser.university || ''} onChange={(e) => setEditingUser({...editingUser, university: e.target.value})} className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-purple-500 transition-all" placeholder="University" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-widest ml-1">Academic Level</p>
                    <input type="text" value={editingUser.level || ''} onChange={(e) => setEditingUser({...editingUser, level: e.target.value})} className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-purple-500 transition-all" placeholder="100, 200, 300..." />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-widest ml-1">Faculty</p>
                    <input type="text" value={editingUser.faculty || ''} onChange={(e) => setEditingUser({...editingUser, faculty: e.target.value})} className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-purple-500 transition-all" placeholder="Faculty" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-widest ml-1">Department</p>
                    <input type="text" value={editingUser.department || ''} onChange={(e) => setEditingUser({...editingUser, department: e.target.value})} className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-purple-500 transition-all" placeholder="Department" />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <p className="text-[9px] font-black text-purple-400 uppercase tracking-wider ml-1">User Privileges & Bypasses</p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 p-2.5 bg-white/5 border border-purple-500/20 rounded-xl cursor-pointer hover:bg-purple-500/10 transition-all">
                      <input type="checkbox" checked={editingUser.isPremium} onChange={e => setEditingUser({...editingUser, isPremium: e.target.checked})} className="sr-only peer" />
                      <div className="w-4 h-4 border border-purple-400/40 rounded-md peer-checked:bg-purple-600 peer-checked:border-purple-500 transition-all flex items-center justify-center">
                        <Check size={11} className={`text-white font-black transition-all ${editingUser.isPremium ? 'opacity-100' : 'opacity-0'}`} />
                      </div>
                      <span className="text-[10px] font-bold uppercase text-white/60 peer-checked:text-purple-300 leading-none">Premium</span>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 bg-white/5 border border-purple-500/20 rounded-xl cursor-pointer hover:bg-purple-500/10 transition-all">
                      <input type="checkbox" checked={editingUser.bypassAllPayments} onChange={e => setEditingUser({...editingUser, bypassAllPayments: e.target.checked})} className="sr-only peer" />
                      <div className="w-4 h-4 border border-purple-400/40 rounded-md peer-checked:bg-purple-600 peer-checked:border-purple-500 transition-all flex items-center justify-center">
                        <Check size={11} className={`text-white transition-all ${editingUser.bypassAllPayments ? 'opacity-100' : 'opacity-0'}`} />
                      </div>
                      <span className="text-[10px] font-bold uppercase text-white/60 peer-checked:text-purple-300 leading-none">Master Bypass</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-white/5 border border-white/10 text-white/50 font-bold py-3 rounded-xl text-xs uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all">Cancel</button>
                  <button type="submit" className="flex-[2] bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 active:scale-95 transition-all">Save Configuration</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingGroup && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className={`${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} border rounded-3xl p-5 md:p-8 max-w-md w-full max-h-[95vh] overflow-y-auto custom-scrollbar space-y-4 md:space-y-6 flex flex-col`}
            >
              <div className="text-center space-y-1 pb-2">
                <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter">Cluster Configuration</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Administrative Override Active</p>
              </div>
              
              <form onSubmit={handleEditGroup} className="space-y-4 pb-4 flex-1">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">Cluster Name</p>
                  <input type="text" value={editingGroup.name || ''} onChange={(e) => setEditingGroup({...editingGroup, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-white focus:border-[#DC2626]/50 transition-all" placeholder="Cluster Name" required />
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">Description / Bio</p>
                  <textarea value={editingGroup.description || ""} onChange={(e) => setEditingGroup({...editingGroup, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-white focus:border-[#DC2626]/50 transition-all h-24 resize-none" placeholder="Cluster description..."></textarea>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">Display URL (Image)</p>
                  <input type="text" value={editingGroup.photoURL || ''} onChange={(e) => setEditingGroup({...editingGroup, photoURL: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-white focus:border-[#DC2626]/50 transition-all" placeholder="https://..." />
                </div>

                <div className="flex gap-4 pt-6 pb-2">
                  <button type="button" onClick={() => setEditingGroup(null)} className="flex-1 bg-white/5 border border-white/10 text-white/40 font-black py-3 rounded-2xl text-[9px] uppercase tracking-widest hover:text-white transition-all">Abort Task</button>
                  <button type="submit" className="flex-[2] bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-3 rounded-2xl text-[9px] uppercase tracking-[0.2em] shadow-2xl shadow-red-900/40 active:scale-95 transition-all">Commit Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </main>

      {/* SHARE MODAL */}
      <AnimatePresence>
        {saveModal.isOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} border rounded-[2.5rem] p-8 max-w-sm w-full space-y-6 shadow-2xl`}>
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-[#DC2626]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black">
                  <Save size={32} className="text-[#DC2626]" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Save Recording</h3>
                <p className="text-xs text-white/40">Give your lecture a custom name for easy tracking.</p>
              </div>

              <div className="space-y-1">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Lecture Title</p>
                <input 
                  autoFocus
                  type="text" 
                  value={saveModal.name} 
                  onChange={(e) => setSaveModal(prev => ({ ...prev, name: e.target.value }))} 
                  placeholder="e.g. Physics 101 - Newton's Laws" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm outline-none text-white focus:border-[#DC2626]/50 shadow-inner transition-all" 
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setSaveModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all">CANCEL</button>
                <button 
                  onClick={() => {
                    saveModal.onConfirm(saveModal.name);
                    setSaveModal(prev => ({ ...prev, isOpen: false }));
                  }} 
                  disabled={!saveModal.name.trim()}
                  className="flex-[2] bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-[#DC2626]/20 transition-all disabled:opacity-50"
                >
                  Confirm Save
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showShareModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className={`${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} border rounded-3xl p-8 max-w-sm w-full space-y-6`}>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Share Your Result</h3>
                <p className="text-xs text-white/40">Enter your name to generate your score card.</p>
              </div>

              {shareQuizLink && (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Shareable Quiz Link</p>
                  <div className="flex items-center gap-2">
                    <input readOnly value={shareQuizLink} className="flex-1 bg-transparent border-none outline-none text-[10px] text-[#DC2626] font-mono truncate" />
                    <button onClick={() => { navigator.clipboard.writeText(shareQuizLink); setUserNotification("Link copied!"); }} className="p-2 text-white/40 hover:text-[#DC2626] transition-colors"><Copy size={14} /></button>
                  </div>
                </div>
              )}
              
              <input type="text" value={shareName} onChange={(e) => setShareName(e.target.value)} placeholder="Your Full Name" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none text-white focus:border-[#DC2626]/50 transition-all" />

              <div className="flex gap-2">
                <button onClick={() => setShowShareModal(false)} className="flex-1 bg-white/5 text-white/60 font-bold py-4 rounded-2xl text-sm">CANCEL</button>
                <button onClick={generateShareImage} disabled={!shareName.trim()} className="flex-[2] bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all disabled:opacity-50">GENERATE IMAGE</button>
              </div>

              {/* HIDDEN SHARE CARD FOR GENERATION */}
              <div className="fixed -left-[9999px] top-0">
                <div 
                  ref={shareCardRef} 
                  className="w-[600px] h-[400px] bg-[#060B15] p-8 flex flex-col justify-between text-center relative overflow-hidden border-2 border-amber-600"
                  style={{ fontFamily: '"Inter", sans-serif' }}
                >
                  {/* Outer delicate border */}
                  <div className="absolute inset-1 border border-amber-500/20 pointer-events-none" />
                  <div className="absolute inset-2 border border-zinc-900/40 pointer-events-none" />

                  {/* Corner notches/ornaments */}
                  <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-500 pointer-events-none" />
                  <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-500 pointer-events-none" />
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-500 pointer-events-none" />
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-500 pointer-events-none" />

                  {/* Glowing background radial spot */}
                  <div className="absolute -top-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Header */}
                  <div className="space-y-1 relative z-10">
                    <p className="text-amber-500 text-[8px] font-black tracking-[0.35em] uppercase">VERIFIED STUDY PERFORMANCE CREDENTIAL</p>
                    <h2 className="text-white text-xl font-black tracking-tight uppercase">NSG STUDY CERTIFICATE</h2>
                    <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mt-2" />
                  </div>

                  {/* Certificate Body */}
                  <div className="space-y-1.5 relative z-10 my-auto">
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">This certifies that the scholar</p>
                    <p className="text-white text-2xl font-black uppercase tracking-tight drop-shadow-md">{shareName || 'NSG SCHOLAR'}</p>
                    <p className="text-zinc-500 text-[10px] font-medium tracking-normal">has successfully completed the assessment for the topic</p>
                    <p className="text-blue-400 text-xs font-mono font-bold uppercase tracking-wider bg-white/5 border border-white/5 py-1 px-3 rounded-full inline-block">
                      {toolsSubTab === 'exam' ? (examIdInput ? `EXAM: ${examIdInput}` : 'CBT EXAMINATION') : (quizTopic || 'GENERAL STUDY')}
                    </p>
                  </div>

                  {/* Metrics & Authentication Seal row */}
                  <div className="grid grid-cols-2 items-center gap-6 pt-3 border-t border-zinc-900 relative z-10">
                    {/* Score Panel */}
                    <div className="text-left space-y-1 bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-wider">Proficiency Matrix</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-black text-emerald-400">
                          {Math.round((quizScore / (quizQuestions.length || 1)) * 100)}%
                        </span>
                        <span className="text-xs font-bold text-zinc-400">
                          ({quizScore}/{quizQuestions.length} Correct)
                        </span>
                      </div>
                      <p className="text-[8px] text-zinc-500 font-mono">
                        Date: {new Date().toLocaleDateString()}
                      </p>
                    </div>

                    {/* Official Signatures & Seal */}
                    <div className="flex items-center justify-between pl-4">
                      <div className="text-left space-y-0.5">
                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">VALIDATED BY</p>
                        <p className="text-emerald-400 font-serif italic text-sm">Verified</p>
                        <div className="w-24 h-[1px] bg-zinc-800" />
                        <p className="text-[7px] text-zinc-600 font-bold uppercase">Academic Board</p>
                      </div>

                      {/* Seal circle */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center border-2 border-amber-300 shadow-lg relative">
                        <span className="text-white text-[8px] font-black tracking-tighter">NSG</span>
                        <div className="absolute inset-0 rounded-full border border-dashed border-white/30" />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="relative z-10">
                    <p className="text-[8px] font-mono text-zinc-600 tracking-widest uppercase">
                      COMPLETED ON {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showQuizShareModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className={`${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-slate-900 border-slate-700'} border rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl relative`}
            >
              <button 
                onClick={() => setShowQuizShareModal(false)}
                className="absolute top-4 right-4 p-2 text-white/40 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#DC2626]/20 border border-[#DC2626]/40 flex items-center justify-center mx-auto text-[#DC2626]">
                  <Share2 size={24} />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Share Quiz</h3>
                <p className="text-xs text-white/50 max-w-xs mx-auto">
                  Share this quiz link and question card with your study partners!
                </p>
              </div>

              {shareQuizLink && (
                <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 space-y-1.5">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Quiz Share Link</p>
                  <div className="flex items-center gap-2">
                    <input 
                      readOnly 
                      value={shareQuizLink} 
                      className="flex-1 bg-transparent border-none outline-none text-xs text-red-400 font-mono truncate" 
                    />
                    <button 
                      onClick={() => { 
                        if (shareQuizLink) {
                          navigator.clipboard.writeText(shareQuizLink); 
                          setUserNotification("Quiz link copied to clipboard!"); 
                        }
                      }} 
                      className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#DC2626]/90 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shrink-0 shadow-lg shadow-[#DC2626]/20"
                    >
                      <Copy size={12} />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SOCIAL BUTTONS */}
              <div className="space-y-2">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest text-center">Share via</p>
                <div className="grid grid-cols-3 gap-3">
                  {/* WhatsApp */}
                  <button
                    onClick={handleShareWhatsApp}
                    disabled={isGeneratingShareImage}
                    className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] transition-all font-bold group disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-[#25D366]/20 group-hover:scale-110 transition-transform">
                      <MessageSquare size={20} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider">WhatsApp</span>
                  </button>

                  {/* Telegram */}
                  <button
                    onClick={handleShareTelegram}
                    disabled={isGeneratingShareImage}
                    className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 text-[#0088cc] transition-all font-bold group disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#0088cc] text-white flex items-center justify-center shadow-lg shadow-[#0088cc]/20 group-hover:scale-110 transition-transform">
                      <Send size={20} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider">Telegram</span>
                  </button>

                  {/* Others */}
                  <button
                    onClick={handleShareOthers}
                    disabled={isGeneratingShareImage}
                    className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 transition-all font-bold group disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/20 group-hover:scale-110 transition-transform">
                      <Share2 size={20} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider">Others</span>
                  </button>
                </div>
              </div>

              {isGeneratingShareImage && (
                <p className="text-[10px] font-bold text-center text-red-400 uppercase tracking-widest animate-pulse">
                  Generating Quiz Image Card...
                </p>
              )}
            </motion.div>
          </div>
        )}

        {/* HIDDEN QUIZ CARD FOR PREVIEW IMAGE GENERATION */}
        <div className="fixed -left-[9999px] top-0 pointer-events-none">
          <div 
            ref={quizShareCardRef} 
            className="w-[620px] p-6 bg-[#0B0D17] text-white rounded-3xl border border-slate-800 flex flex-col space-y-4 shadow-2xl relative overflow-hidden"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            {/* Active Quiz Header & Top Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white">
                  <ChevronLeft size={18} />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-purple-300">
                  {quizTopic || "INTERACTIVE QUIZ"}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-white">
                <Share2 size={18} />
              </div>
            </div>

            {/* Segmented Bar & Stats Header */}
            <div className="flex items-center gap-3">
              <div className="flex-1 flex gap-1 h-2">
                {Array.from({ length: Math.min(quizQuestions.length || 10, 30) }, (_, i) => (
                  <div key={i} className={`h-2 flex-1 rounded-full ${i === 0 ? 'bg-purple-500' : 'bg-white/20'}`} />
                ))}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-bold text-white/80">1 / {quizQuestions.length || 10}</span>
                <span className="bg-[#4A0000] border border-red-800/40 text-red-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  ✕ 0
                </span>
                <span className="bg-[#0D184A] border border-blue-800/40 text-blue-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  ✓ 0
                </span>
              </div>
            </div>

            {/* Main Question Container */}
            <div className="bg-[#0F1424] border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-black text-xs">
                  Q1
                </span>
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wide">
                  Question 1 of {quizQuestions.length || 10}
                </span>
              </div>

              <h3 className="text-white text-base font-bold leading-relaxed">
                {quizQuestions[0]?.question || "What is the primary concept covered in this study module?"}
              </h3>

              <div className="space-y-2.5 pt-1">
                {(quizQuestions[0]?.options || [
                  "Core theoretical principles and foundational framework",
                  "Advanced empirical analysis and experimental verification",
                  "Practical methodology applied in modern research environments",
                  "Comprehensive summary of historical development and progress"
                ]).slice(0, 4).map((optText: string, optIdx: number) => (
                  <div 
                    key={optIdx} 
                    className="bg-white/5 border border-white/10 p-3.5 rounded-2xl flex items-center gap-3"
                  >
                    <div className="w-7 h-7 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-200 font-extrabold flex items-center justify-center text-xs shrink-0">
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span className="text-slate-200 text-sm font-semibold leading-snug">
                      {optText}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 px-1 text-[10px]">
              <span className="text-slate-400 font-mono font-bold">NSG SCHOLAR OMNI • PRACTICE QUIZ</span>
              <span className="text-purple-400 font-bold tracking-wider">{shareQuizLink || 'https://nsg-scholar.app'}</span>
            </div>
          </div>
        </div>
      </AnimatePresence>

      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-[#13111C] border border-white/10 rounded-[2.5rem] p-6 max-w-sm sm:max-w-md w-full space-y-6 relative shadow-2xl overflow-hidden text-left"
            >
              {/* Abs decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#DC2626]/5 rounded-full translate-x-12 -translate-y-12 block pointer-events-none" />

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Buddy Referral Hub</h3>
                  <p className="text-[9px] font-black text-[#DC2626] uppercase tracking-widest mt-0.5">Start mutual 5-day study streaks</p>
                </div>
                <button 
                  onClick={() => setShowInviteModal(false)} 
                  className="p-2 hover:bg-white/5 rounded-xl transition-all font-black text-white/40 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Referral Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                  <span className="text-[8px] uppercase font-black text-white/30 tracking-widest block mb-1">Mates Invited</span>
                  <span className="text-3xl font-black text-[#58CC02] block">{currentUserData?.invitedUsers?.length || 0}</span>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                  <span className="text-[8px] uppercase font-black text-white/30 tracking-widest block mb-1">Booster Points</span>
                  <span className="text-3xl font-black text-[#FFC000] block">{(currentUserData?.invitedUsers?.length || 0) * 50} XP</span>
                </div>
              </div>

              {/* Share Code and URL Section */}
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Your Private Invite Code</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex-1 bg-transparent text-sm text-amber-400 font-bold font-mono tracking-widest select-all">
                      {currentUserData?.username || 'no_code_available'}
                    </span>
                    <button 
                      onClick={() => { 
                        navigator.clipboard.writeText(currentUserData?.username || ''); 
                        setUserNotification("Invite code copied!"); 
                      }} 
                      className="p-2 text-white/40 hover:text-[#DC2626] transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Shareable Mobile Link</p>
                  <div className="flex items-center justify-between gap-2">
                    <input 
                      readOnly 
                      value={`https://nuellstudyguide.name.ng/?invite=${currentUserData?.username || ''}`} 
                      className="flex-1 bg-transparent border-none outline-none text-[10px] text-white/70 font-mono truncate" 
                    />
                    <button 
                      onClick={() => { 
                        navigator.clipboard.writeText(`https://nuellstudyguide.name.ng/?invite=${currentUserData?.username || ''}`); 
                        setUserNotification("Referral link copied!"); 
                      }} 
                      className="p-2 text-[#DC2626] hover:text-[#DC2626]"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Invited Users List */}
              <div className="space-y-2">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Invited Buddy Crew</p>
                {(!currentUserData?.invitedUsers || currentUserData.invitedUsers.length === 0) ? (
                  <p className="text-[10px] text-white/20 italic text-center py-4 bg-white/5 rounded-2xl border border-dashed border-white/5">
                    No active buddies yet. Share your invite code to get started!
                  </p>
                ) : (
                  <div className="max-h-32 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {currentUserData.invitedUsers.map((buddy: any, bIdx: number) => (
                      <div key={bIdx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-tight">@{buddy.username}</p>
                          <p className="text-[8px] text-white/40">{buddy.fullName || 'Anonymous'}</p>
                        </div>
                        <span className="text-[8px] text-[#58CC02] font-black uppercase tracking-widest">
                          +50 XP Applied
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={() => setShowInviteModal(false)} 
                className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-[#DC2626]/20 transition-all text-center"
              >
                Close Referral Hub
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM NAVIGATION - Exactly matching screenshot design & light/dark purple specs */}
      {!isSecondaryPage && !isDesktop && !isAuthView && (
        <div 
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
          className={`fixed bottom-0 left-0 right-0 z-[100] px-3 pt-2.5 flex items-center justify-around select-none transition-colors ${
          theme === 'dark' 
            ? 'bg-[#0B0813] border-t border-purple-500/20 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]' 
            : 'bg-white border-t border-slate-200 shadow-[0_-4px_25px_rgba(0,0,0,0.06)]'
        }`}>
          {/* HOME */}
          <button 
            type="button"
            onClick={() => setActiveTab('home')} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'home' 
                ? (theme === 'dark' ? 'text-purple-400' : 'text-purple-600') 
                : (theme === 'dark' ? 'text-white/40 hover:text-white/80' : 'text-purple-300 hover:text-purple-600')
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              activeTab === 'home' 
                ? (theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600')
                : ''
            }`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5z" />
                <line x1="10" y1="17" x2="14" y2="17" />
              </svg>
            </div>
            <span className={`text-[9.5px] uppercase tracking-wider leading-none ${
              activeTab === 'home' 
                ? (theme === 'dark' ? 'font-black text-purple-300' : 'font-black text-purple-600') 
                : (theme === 'dark' ? 'font-bold text-white/70' : 'font-bold text-black')
            }`}>HOME</span>
          </button>

          {/* NOTES / TOOLS */}
          <button 
            type="button"
            onClick={() => {
              setActiveTab('tools');
              setToolsSubTab('menu');
            }} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'tools' 
                ? (theme === 'dark' ? 'text-purple-400' : 'text-purple-600') 
                : (theme === 'dark' ? 'text-white/40 hover:text-white/80' : 'text-purple-300 hover:text-purple-600')
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              activeTab === 'tools' 
                ? (theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600')
                : ''
            }`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="2" />
                <rect x="14" y="3" width="7" height="7" rx="2" />
                <rect x="14" y="14" width="7" height="7" rx="2" />
                <rect x="3" y="14" width="7" height="7" rx="2" />
              </svg>
            </div>
            <span className={`text-[9.5px] uppercase tracking-wider leading-none ${
              activeTab === 'tools' 
                ? (theme === 'dark' ? 'font-black text-purple-300' : 'font-black text-purple-600') 
                : (theme === 'dark' ? 'font-bold text-white/70' : 'font-bold text-black')
            }`}>TOOLS</span>
          </button>

          {/* CHAT - Screenshot design with speech bubble & 3 dots */}
          <button 
            type="button"
            onClick={() => setActiveTab('chat')} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
              activeTab === 'chat' 
                ? (theme === 'dark' ? 'text-purple-400' : 'text-purple-600') 
                : (theme === 'dark' ? 'text-white/40 hover:text-white/80' : 'text-purple-300 hover:text-purple-600')
            }`}
          >
            <div className={`p-1 rounded-xl transition-all relative ${
              activeTab === 'chat' 
                ? (theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600')
                : ''
            }`}>
              {/* Chat bubble with 3 dots */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <circle cx="8" cy="11" r="1" fill="currentColor" stroke="none" />
                <circle cx="12" cy="11" r="1" fill="currentColor" stroke="none" />
                <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <span className={`text-[9.5px] uppercase tracking-wider leading-none ${
              activeTab === 'chat' 
                ? (theme === 'dark' ? 'font-black text-purple-300' : 'font-black text-purple-600') 
                : (theme === 'dark' ? 'font-bold text-white/70' : 'font-bold text-black')
            }`}>CHAT</span>
            {totalUnreadMessages > 0 && (
              <span className="absolute top-0 right-3 w-4 h-4 text-white text-[8px] font-bold flex items-center justify-center rounded-full bg-purple-600 border border-white">
                {totalUnreadMessages}
              </span>
            )}
          </button>

          {/* SOCIAL */}
          <button 
            type="button"
            onClick={() => setActiveTab('community')} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'community' 
                ? (theme === 'dark' ? 'text-purple-400' : 'text-purple-600') 
                : (theme === 'dark' ? 'text-white/40 hover:text-white/80' : 'text-purple-300 hover:text-purple-600')
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              activeTab === 'community' 
                ? (theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600')
                : ''
            }`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <line x1="3.6" y1="9" x2="20.4" y2="9" />
                <line x1="3.6" y1="15" x2="20.4" y2="15" />
                <path d="M12 3a14.5 14.5 0 0 1 0 18 14.5 14.5 0 0 1 0-18z" />
              </svg>
            </div>
            <span className={`text-[9.5px] uppercase tracking-wider leading-none ${
              activeTab === 'community' 
                ? (theme === 'dark' ? 'font-black text-purple-300' : 'font-black text-purple-600') 
                : (theme === 'dark' ? 'font-bold text-white/70' : 'font-bold text-black')
            }`}>SOCIAL</span>
          </button>
        </div>
      )}

      {/* OFFLINE MODAL POPUP */}
      <OfflineModal 
        isOpen={showOfflineModal} 
        onClose={() => setShowOfflineModal(false)} 
        message={offlineModalMessage} 
      />

      {/* NATIVE AUDIO RECORDER & LIVE VISUALIZER OVERLAY */}
      <NativeAudioRecorder
        isRecording={isRecording}
        recordingTime={recordingTime}
        handleToggleRecording={handleToggleRecording}
        isProcessingFinal={isProcessingFinal}
        isOnline={isOnline}
        theme={theme}
        isTranscribePage={activeTab === 'tools' && toolsSubTab === 'record'}
      />

      {/* QUIZ LINK LOADING POPUP OVERLAY */}
      {isLinkQuizLoading && (
        <div className="fixed inset-0 z-[999999] bg-[#070913]/95 backdrop-blur-2xl flex items-center justify-center p-6 text-center select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-sm w-full bg-[#0F1424] border border-red-500/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center space-y-5 relative overflow-hidden"
          >
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-red-600/20 rounded-full blur-2xl pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-rose-600 to-red-600 flex items-center justify-center text-white shadow-xl shadow-red-500/30">
              <Loader2 size={32} className="animate-spin text-amber-300" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                {linkQuizTopic ? `Loading Quiz: ${linkQuizTopic}` : 'Loading Shared Quiz...'}
              </h3>
              <p className="text-xs text-white/60 font-medium leading-relaxed">
                Setting up questions, options, and CBT practice environment. Please hold on...
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-red-400 font-bold uppercase tracking-widest">
              <Loader2 size={14} className="animate-spin text-red-500" /> Omni Quiz Engine Active
            </div>
          </motion.div>
        </div>
      )}

      </div>
  );
};

// No export default here as it's at the top
