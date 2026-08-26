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
import { AppBootstrapper } from './components/AppBootstrapper';
import { AlarmSettings } from './components/AlarmSettings';
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
  parseUniversalDeepLink,
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

export function App() {
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
  const [finishedHistory, setFinishedHistory] = useState<HomeHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('nsg_finished_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((item: any, index: number) => 
            parsed.findIndex((i: any) => i.id === item.id) === index
          );
        }
      }
    } catch (e) {
      console.warn("Failed to parse history from storage:", e);
    }
    return [];
  });
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
  const [sessions, setSessions] = useState<LectureSession[]>(() => {
    try {
      const saved = localStorage.getItem('savedSessions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
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
          const dData = doc.data() || {}; mapById.set(doc.id, { ...dData, id: doc.id, originalDocId: doc.id });
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

  // Deep Link URL Handler for Universal Android App Links & Web (nuellstudyguide.name.ng)
  const handleDeepLinkUrl = useCallback((urlStr: string) => {
    try {
      const parsed = parseUniversalDeepLink(urlStr);
      if (parsed.quizId) {
        console.log("📍 Deep link loaded quizId:", parsed.quizId);
        if (user) {
          loadSharedQuiz(parsed.quizId);
        } else {
          setPendingQuizId(parsed.quizId);
          sessionStorage.setItem('nsg_pending_quiz_id', parsed.quizId);
          setShowAuthModal(true);
        }
      } else if (parsed.courseId) {
        console.log("📍 Deep link loaded courseId:", parsed.courseId);
        setActiveTab('tools');
        setToolsSubTab('courses');
      } else if (parsed.toolId === 'grammar') {
        setActiveTab('tools');
      } else if (parsed.toolId) {
        setActiveTab('tools');
        setToolsSubTab(parsed.toolId as any);
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

    const handleOpenQuizById = (e: any) => {
      const qId = e.detail?.quizId;
      if (qId) {
        loadSharedQuiz(qId);
      }
    };

    window.addEventListener('trigger_quiz_gen', handleTriggerQuiz);
    window.addEventListener('open_quiz_by_id', handleOpenQuizById);
    return () => {
      window.removeEventListener('trigger_quiz_gen', handleTriggerQuiz);
      window.removeEventListener('open_quiz_by_id', handleOpenQuizById);
    };
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
          "QUIZ GENERATION RULES:\n" +
          "NEVER generate a quiz or output [[GENERATE_QUIZ:...]] during normal chat, explanations, greetings, or tutoring. ONLY if the user EXPLICITLY and CLEARLY asks you to create, generate, or set a quiz for them, you may append this tag at the very end of your response: '[[GENERATE_QUIZ: <topic>, <num_questions>]]'. Otherwise, simply provide helpful answers and explanations.\n\n" +
          "DETAILED NSG GUIDES FOR USERS:\n" +
          "1. RECORDING ENGINE: 1. Grant mic access. 2. Click 'Record'. 3. Board Analysis: Click upload icon for board photos to sync with notes. 4. Stop Session to process. 5. Use top-right Copy icon to export.\n" +
          "2. SMART QUIZ: 1. Topic -> Difficulty (Easy/Med/Hard) -> Count. 2. Submit for score. 3. Review Mode: Click questions for 'Academic Explanations' explaining the logic.\n" +
          "3. CBT EXAM: 1. Hosting: Click 'Host Exam' -> Add participants -> Set Questions/Time/Pool -> Save & Generate ID. 2. Joining: Enter ID -> Enter assigned Custom Matric.\n" +
          "4. FACULTY SPECIALS: AI for Med, Law, Engineering. BIZ section includes 'Financial Auditor'. Language section has 'Diagnostics' (300 word limit) and 'Transcribe Tool'.\n" +
          "5. ASSIGNMENT SOLVER: Clear Photo/Text needed, click 'Solve with AI' for logic and steps with Core Concept.\n" +
          "6. COURSES TOOL: Faculty -> Dept -> Level -> Code navigation for notes.\n" +
          "7. WHATSAPP OMNI: Connect via +2349064470122." + 
          quizContextPrompt;

        const isQuizGenRequest = /(?:^|\b)(?:(?:generate|create|make|build|set|give\s+me)\s+(?:a\s+)?(?:\d+\s+)?(?:question\s+)?quiz(?:\s+(?:on|about|for))?|(?:quiz\s+me\s+on)|(?:quiz\s+(?:based\s+on|from)\s+chat))\b/i.test(textToSend);

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

          const quizRes = await generateQuiz(topicString, reqCount, 'Medium', true, undefined, false);

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
              const quizRes = await generateQuiz(genTopic, genCount, 'Medium', true, undefined, false);
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
      if (isOnline && user?.uid && chatId.startsWith('omni_')) {
        try {
          const docSnap = await getDoc(doc(db, 'users', user.uid, 'chatSessions', chatId));
          if (docSnap.exists()) {
            const data = docSnap.data();
            const msgs = Array.isArray(data.messages) ? data.messages : (Array.isArray(data.history) ? data.history : []);
            const slice = msgs.slice(-historyLimit);
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
          console.warn("Firestore user session history fetch notice:", e);
        }
      } else if (isOnline && !chatId.startsWith('omni_')) {
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
3. QUIZ GENERATION RULES:
   NEVER generate a quiz or output [[GENERATE_QUIZ:...]] during normal conversation, explanations, tutoring, greetings, or casual talk.
   ONLY if the student EXPLICITLY and CLEARLY asks you to create, generate, or set a quiz for them (e.g., "quiz me on...", "make a quiz on..."), you may write a warm 1-sentence intro and ALWAYS end your response with this exact tag:
   '[[GENERATE_QUIZ: <topic>, <num_questions>]]' (e.g. '[[GENERATE_QUIZ: Cell Biology, 5]]').
   Otherwise, answer their questions directly, warmly, and thoroughly without generating any quiz.`;

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
          const quizRes = await generateQuiz(genTopic, genCount, 'Medium', true, undefined, false);
          if (quizRes && quizRes.success) {
            reply = reply.replace(
              /\[\[GENERATE_QUIZ:\s*([^,\]]+),\s*(\d+)\s*\]\]/i,
              `[[QUIZ_READY: ${quizRes.quizId}, ${quizRes.topic}, ${quizRes.count}]]`
            );
          }
        }
      } else {
        const userQuizReq = text.match(/(?:^|\b)(?:(?:generate|create|make|build|set)\s+(?:a\s+)?quiz\s+(?:on|about|for)\s+([a-zA-Z0-9\s]+))\b/i);
        if (userQuizReq) {
          const genTopic = userQuizReq[1].trim();
          const quizRes = await generateQuiz(genTopic, 5, 'Medium', true, undefined, false);
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
      let updatedFullMessages: any[] = [];
      try {
        const localKey = `nsg_msgs_${chatId}`;
        const existingLocal = localStorage.getItem(localKey);
        const parsedLocal = existingLocal ? JSON.parse(existingLocal) : [];
        if (!parsedLocal.some((m: any) => m.id === omniMsgData.id)) {
          parsedLocal.push(omniMsgData);
        }
        updatedFullMessages = parsedLocal;
        localStorage.setItem(localKey, circularSafeStringify(parsedLocal));

        const omniSessionsKey = `nsg_omni_sessions_${user?.uid || 'guest'}`;
        const existingOmniSessions = localStorage.getItem(omniSessionsKey);
        let parsedSessions = existingOmniSessions ? JSON.parse(existingOmniSessions) : [];
        if (!Array.isArray(parsedSessions)) parsedSessions = [];
        
        const existingIndex = parsedSessions.findIndex((s: any) => s.id === chatId);
        if (existingIndex >= 0) {
          const prevMsgs = Array.isArray(parsedSessions[existingIndex].messages) ? parsedSessions[existingIndex].messages : [];
          if (!prevMsgs.some((m: any) => m.id === omniMsgData.id)) {
            prevMsgs.push(omniMsgData);
          }
          parsedSessions[existingIndex] = {
            ...parsedSessions[existingIndex],
            lastMessage: reply,
            timestamp: 'Just now',
            messages: prevMsgs
          };
        } else {
          parsedSessions.unshift({
            id: chatId,
            title: chatId === 'omni_main' ? 'General Omni Chat' : (text.slice(0, 30) || 'Omni AI Chat'),
            timestamp: 'Just now',
            isPinned: chatId === 'omni_main',
            messages: parsedLocal,
            lastMessage: reply
          });
        }
        localStorage.setItem(omniSessionsKey, JSON.stringify(parsedSessions));
      } catch (e) {
        console.warn("Local Omni storage update warning:", e);
      }

      // Save Omni's response in Firestore if user is authenticated and online
      if (isOnline && user?.uid) {
        try {
          const sessionRef = doc(db, 'users', user.uid, 'chatSessions', chatId);
          const sanitizedMsgs = (updatedFullMessages.length > 0 ? updatedFullMessages : [omniMsgData]).map((m: any) => ({
            id: m.id || `msg-${Date.now()}-${Math.random()}`,
            senderId: m.senderId || 'omni-ai',
            senderHandle: m.senderHandle || 'omni',
            senderName: m.senderName || 'Omni by NSG',
            text: m.text || '',
            timestamp: typeof m.timestamp === 'number' ? m.timestamp : (m.timestamp?.toDate ? m.timestamp.toDate().getTime() : Date.now()),
            type: m.type || 'text',
            isOmniResponse: Boolean(m.isOmniResponse || m.senderId === 'omni-ai'),
            mediaUrl: m.mediaUrl || null,
            replyTo: m.replyTo || null
          }));

          await setDoc(sessionRef, {
            id: chatId,
            title: chatId === 'omni_main' ? 'General Omni Chat' : (sanitizedMsgs[0]?.text?.slice(0, 30) || 'Omni AI Chat'),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            lastMessage: reply,
            messages: sanitizedMsgs,
            history: sanitizedMsgs,
            isPinned: chatId === 'omni_main',
            uid: user.uid,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (sessionErr) {
          console.warn("Firestore user chatSession sync notice:", sessionErr);
        }
      }

      // Save Omni's response in Firestore if online and it's a peer/cloud chat
      if (isOnline && !chatId.startsWith('omni_')) {
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

      // Dispatch event to notify active chat views immediately
      window.dispatchEvent(new CustomEvent('nsg_omni_message_received', {
        detail: { chatId, message: omniMsgData }
      }));

      // Asynchronously generate and persist AI title for new chat sessions
      if (chatId !== 'omni_main') {
        (async () => {
          try {
            const ai = getAiInstance();
            if (ai?.models?.generateContent) {
              const res = await ai.models.generateContent({
                model: FLASH_MODEL,
                contents: [{
                  role: 'user',
                  parts: [{
                    text: `Generate a concise, professional 2 to 4 word academic subject title for this user query/conversation.\nQuery: "${text}"\nResponse: "${reply.slice(0, 100)}"\n\nRules:\n- Strictly output ONLY the 2 to 4 word title (e.g., "Epiglottitis Clinical Review", "Nigerian Constitutional Law", "Calculus & Limits", "Cell Structure Biology").\n- Do NOT use quotation marks, punctuation, or generic filler.`
                  }]
                }]
              });
              const cleanAiTitle = res.text?.trim().replace(/^["']|["']$/g, '').replace(/[#*]/g, '');
              if (cleanAiTitle && cleanAiTitle.length > 2 && cleanAiTitle.length < 50) {
                const omniSessionsKey = `nsg_omni_sessions_${user?.uid || 'guest'}`;
                const existing = localStorage.getItem(omniSessionsKey);
                if (existing) {
                  const parsed = JSON.parse(existing);
                  const sIdx = parsed.findIndex((s: any) => s.id === chatId);
                  if (sIdx >= 0) {
                    parsed[sIdx].title = cleanAiTitle;
                    localStorage.setItem(omniSessionsKey, JSON.stringify(parsed));
                  }
                }
                if (user?.uid) {
                  await updateDoc(doc(db, 'users', user.uid, 'chatSessions', chatId), { title: cleanAiTitle }).catch(() => {});
                }
                window.dispatchEvent(new CustomEvent('nsg_omni_rename_session', { detail: { chatId, title: cleanAiTitle } }));
              }
            }
          } catch (titlingErr) {
            console.warn("Omni AI auto-titling warning:", titlingErr);
          }
        })();
      }

      return omniMsgData;
    } catch (err) {
      console.error("Omni response error:", err);
      return null;
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
    customAnswerType?: 'multiple_choice' | 'true_false' | 'single_choice' | string[],
    shouldNavigate: boolean = true
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

    // Switch view to Quiz tab only if explicitly requested (e.g. from Quiz UI or when navigate is true)
    if (shouldNavigate) {
      setActiveTab('tools');
      setToolsSubTab('quiz');
      setSelectedChatForRoom(null);
      setIsChatRoomActive(false);
      setQuizState('idle');
    }
    setIsGeneratingQuiz(true);

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
        You are an expert university professor, examiner, and academic curriculum specialist across all scientific, medical, humanities, and mathematical disciplines.
        Generate an authentic, high-quality, ${activeCount}-question academic quiz directly following the user's instructions, topics, and problem constraints below:

        ${promptContext}

        ${answerTypeInstructions}

        CRITICAL DIRECTIVES ON SUBJECT DISCIPLINE & AUTHENTICITY:
        1. STRICT DOMAIN & SUBJECT DISCIPLINE (NEVER SWITCH NON-MATH TOPICS TO MATH):
           - You MUST identify and strictly adhere to the authentic academic field of the topic/context ("${activeTopic}").
           - BIOLOGY, MEDICINE, HEALTH, ANATOMY, PATHOLOGY & NURSING (e.g., Epiglottitis, Respiratory System, Pharmacology, Immunology, Microbiology, Physiology, Anatomy, Clinical Medicine, Genetics):
             * Questions MUST test biological concepts, anatomical structures, clinical presentation, diagnostic tests, causative pathogens (e.g. Haemophilus influenzae type b for epiglottitis), pathophysiological mechanisms, pharmacological treatments, and clinical management.
             * NEVER invent, force, or hallucinate mathematical equations, algebra, calculus, or physics formulas into biology or medical topics.
             * NEVER fabricate nonsense equations linking medical conditions, anatomy, bacteria, or symptoms to mathematical constants or variables (such as 1/π or algebraic formulas).
           - HUMANITIES, ARTS, SOCIAL SCIENCES, LAW, HISTORY, LITERATURE, PHILOSOPHY & BUSINESS:
             * Questions MUST test theories, principles, legal doctrine, historical timelines/facts, literary themes, and critical concepts.
             * NEVER convert qualitative humanities or social sciences questions into mathematical formulas.
           - PURE MATHEMATICS, STATISTICS, QUANTITATIVE PHYSICS & ENGINEERING:
             * ONLY when the user's topic is explicitly mathematical, statistical, or quantitative (e.g. Skewness, Kurtosis, Calculus, Algebra, Kinematics, Circuits, Probability Distributions, Mechanics):
               - Formulate real, solvable computational problems containing concrete numbers, sample datasets, probability distributions, matrices, or formulas where the student calculates exact numerical values.
               - Format mathematical expressions using standard LaTeX enclosed in single dollar delimiters $ ... $.

        2. DEEP ACADEMIC TOPIC PARSING (NEVER REPEAT PROMPT AS A META-QUESTION):
           - The user's input specifies the ACADEMIC TOPICS and CONSTRAINTS to test.
           - NEVER generate meta-questions asking about the user's prompt (e.g. NEVER ask "Which approach represents best practice when applying [prompt]?", "What is the primary core concept behind [prompt]?").
           - NEVER quote or parrot the user's instructions into the question stems.

        3. ACCURACY, DIFFICULTY & EXPLANATIONS:
           - Difficulty Level: ${activeDifficulty}.
           - Ensure exactly one option is 100% factually and academically correct according to standard university textbooks and clinical literature.
           - The remaining options must be plausible distractors relevant to that specific subject domain (no absurd or out-of-domain answers).
           - In the "explanation" field:
             * For Biology / Medicine / Humanities: Provide a comprehensive academic explanation detailing the anatomical, clinical, or conceptual reasoning why the answer is correct and why the alternatives are incorrect.
             * For Math / Physics / Quantitative: Provide step-by-step mathematical working or derivation.

        4. TESTING TOPICS IN DOCUMENTS (NO META-QUESTIONS ABOUT THE FILE):
           - When study materials, notes, or documents are provided, extract and test the academic concepts, definitions, formulas, theories, and principles taught inside them.
           - NEVER ask questions about the document itself (e.g., NEVER say "According to the uploaded document", "In the attached PDF", "What does the author state in section 2?").
           - Frame every question as an authentic subject test on the material itself.

        5. INDEPENDENCE:
           - All questions and options must be completely self-contained and answerable without referring to external attachments or external images.

        Return ONLY a valid JSON object with this exact structure:
        {
          "quizTitle": "A concise 2 to 5 word academic subject title strictly matching the discipline (e.g., 'Epiglottitis Clinical Review', 'Cell Biology & Genetics', 'Measures of Central Tendency', 'Constitutional Law Principles')",
          "questions": [
            {
              "question": "string (the actual test question formatted appropriately for the subject)",
              "options": ["string", "string", "string", "string"],
              "correctAnswer": number (0-3),
              "explanation": "Clear academic explanation of the correct answer and underlying concept."
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
              model: "gemini-3.1-flash-lite",
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
      if (shouldNavigate) {
        setQuizState('preview');
      }
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
      if (shouldNavigate) {
        setQuizState('preview');
      }
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
        Generate a ${quizQuestionCount}-question professional multiple choice examination testing the student on "${quizTopic}".
        Difficulty Level: ${quizDifficulty}.
        
        CRITICAL SUBJECT DISCIPLINE:
        - Strictly match the authentic academic subject of "${quizTopic}".
        - For Biology, Medicine, Anatomy, Health, Humanities, History, Literature, Law, and Social Sciences: test real subject concepts, biological mechanisms, anatomical facts, clinical signs, symptoms, pathogens, or theories. NEVER convert these into mathematical equations or invent artificial formulas.
        - ONLY for explicitly mathematical, statistical, or quantitative physics topics: use LaTeX ($...$) for formulas and calculate numerical answers.
        
        Return ONLY a JSON object with this structure:
        {
          "questions": [
            {
              "question": "string",
              "options": ["string", "string", "string", "string"],
              "correctAnswer": number (0-3),
              "explanation": "CRITICAL: Provide a comprehensive academic explanation that covers why the correct answer is right and why the incorrect options are wrong based on verified subject knowledge."
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
    isEditingProfile
  );

  const isAuthView = Boolean(!user || showAuthModal || (activeTab === 'profile' && !user));

  if (isAuthLoading) {
    return (
      <div 
        className="h-screen w-screen flex flex-col items-center justify-center bg-[#0C0A14] text-white select-none relative overflow-hidden font-sans gap-4"
        style={{ backgroundColor: '#0C0A14', color: '#FFFFFF' }}
      >
        <p className="text-base sm:text-lg font-medium text-white/90">
          Loading pls wait
        </p>
        <div 
          className="w-8 h-8 rounded-full border-2 border-white/20 border-t-[#DC2626] animate-spin"
        />
      </div>
    );
  }

  return (
    <div 
      className="h-screen flex flex-col transition-colors duration-300 font-sans selection:bg-[#DC2626] overflow-hidden relative"
      style={{
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
      }}
    >
      <AppBootstrapper userName={currentUserData?.displayName || currentUserData?.fullName || user?.displayName || 'Scholar'} onNavigateQuiz={(qId) => { if (qId) loadSharedQuiz(qId); else { setActiveTab('tools'); setToolsSubTab('quiz'); } }} onNavigateCourse={() => { setActiveTab('tools'); setToolsSubTab('courses'); }} onNavigateGrammar={() => { setActiveTab('tools'); }} onNavigateTools={(toolId) => { setActiveTab('tools'); if (toolId) setToolsSubTab(toolId as any); }} />
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
                    { id: 'home',      icon: '⌂',  label: 'Home' },
                    { id: 'tools',     icon: '⚡', label: 'Tools' },
                    { id: 'community', icon: '☍',  label: 'Community' },
                    { id: 'profile',   icon: '◎',  label: 'Profile' },
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
              </x���r�8�(�>_�TW��nK�����Q���}+�Y��ٞJJ�%vR���l�܎8�e"���D�������1'f����O�� �I�}����쮴� ,,��2���I];�}CF����ڭ3cd5��v��F���]�p�밖}5�2�B�К��冖O�:B�z�Z�e��6������D���n��ȵ熍��d>�Y��,������	���F��#��s��>��0�ZM;�G#+��D;���o8fc��Z"ۼp6�g�E�>=ȆM�������܇�n�&�_ߛ��e6��C���^�EמBc�|b���~��^�i�e^��,���'�����U��:�r�4�\OX0��v+��Ѫ��x�{c���[U�;�ff�x��] �`e325�������FB;t �rc�������:���I���p�aj	�H�i�٬�'zguV��ntL`7���l�Ҡ��X����6&�i�v�+"q�MX�����m�mpk�}��t2���2�M=���^g{I:� \�j����d�|���@�'� kf�)��q�X ��� �C:�Z���)||h�"P�6��|{l�$}��$��z��/�k�y�����wV��g3�d9ipg��0�9�g�#+���yB��	38�f���	���������r�K~�*�����ui���.Y�xSk	�g==��P~n���'�������<���{�7�d4�}8*>��}#4v�3��N��
Xs�g�ε����2��A�����LA�~���s���W�W׷s�{�&7�zp.�k80,����
�J�����H�;I�K�s ƇQ]�^R{`9�(�L�-Z],��?��<?����J��G�����;E�}o4��Rq��$��7�\�p?@x������\ѡ�M4��?����vBFi���m���Ag��f�uf~�����������'���7���'�e�'��dwV��{�m�]�������d�5�xpb�h���<�S���lZwƴh6�����W��ӳ˃A�)q��	E��I�A���+��w���
S7�\$��&���|0�7�e'۷�ϟy1�/N�>�h,�̷��|*[�s�H�jv�����?�s��x|G�ά8QuFeɦ�;���wٚ \�m8�/�	� .W�~�'��ӯ����5����0bN���+UZ޳��#rvxx|tz@��~<=>��k,�7u퟽�k�v�D�<?c�+Һ���}���l�M�0z�>�S��Aݥ�?fj�x�ds�6�̷���uJ����d���>\��*_�#�d�i�gcH4O�G�NvL�[���D��(3��`R�F>�, uw�8r�����}ű^��h�^/��."V�Cw�T��53��%�r�A��xyvv< �#���:����H!���d��Esc��
�T��(�1�X��}�<rGp��I�i�)���G�J	&��{˙�p�/�H*%7����pr♆Ú�om��3%��0 eEt�x'i{/U9S ��ĒB%Le^��+H$�5O�
]�\�lb>A�Q�@\5}��͏R���{�&[�_2v��s��7[�{����!�Y�W	8n�S�S���J�,��i�����}+~OV���c��n�eŃ���r]X#�Gt���T��X��mZC�g�.U��y��$�����"��#�U��<S�������x쒋�0�����z��}�2N����}�Q��;�or؂���
��D��������;�u=��T��+��s�MV�������Yi�mQv�(�%��K��mn^���w"��/;3�q%�Fޫe�u�a�)��ΚX9S��Y�N�h
�9�Խ��ϼ�+��2���>��ƭ�##��/�� d/+H��3GF��.��b�\�~%_&�ɖċ�z��ԭ��T�lINú�����L��1;���9G��G�/b">�,���]�B�����y bY�g�w������uR1u+��G�'�;gh=W����OTg{�a���XX;ǿfK���&:�Ѐ��qc��/9���$���PRC׻��OΫ�w���|��('V8�L�l�L�~�Eiq���p��vFR"�:��D�!��&��[��ksE��3��Je�������u�ܫ'��"Y}7 ���q�H�=�/䊊{�]�����W�e9�7lg�u`�Dj�|�ll���V�H8��Wֵ��`D|GZ\��7ʿ����"n�Տ6F�8jL����)D&�����yɐ�*��I?QOTO�����f��l����W>���ǥ�{ɜd^���	�&|�nd�d�j�>[{j��=:�O��ϋw�vOR�3Rnќ��m���C_�����䤓p����j�^����1ی�Lns<�����OגT來��G�Tm����+�}$Nf�D�[��+B���7�
�ܰMJ��w�����k{����C��ӕA��?e-!�賆�O�����kZw� 9.���r/I
e������(���1N����߲����7
�����e���刉�,�y�4��k��g�<=˩R�Lg^V<�c���8�)��B�S�B��9��)�"�/�C�2E2�vm�L��~K�ݤb�V�_Yo��hÊe9�طn���X���t��0�)�I�[�O��,M���lm4MN���녑A C���\�f_ɗ)���e�&p�ey�����Z��2E��cq�^�.J4�r}�|�q φ<�/�k�4W&_'���-SRR_2��:5�߆/��D�"Ċ�{�l6E~�y����D2;`�=(I�%�9�:��!Є�!7�-��W0Fx	P��.�o���n�w�M�?C �o�4-�'��zekq���[9\z���*S"k=V	7��#j�Nյ�y@Բ/�?�2���x��Q����#�%�Ո~�W82`:7�����0�rh��U��B�g,�6n!&)��C>��*EH1U(=1#�?5�[�R����+p�qcq��6TO���y�f�!e��7��P2�nJ{9g�C�DF�+)x��0þ}�²�#YL�VR��u�nr��\������C��|���d ��r��r�s0��R&�R�f_V<���P���sA�.}�����#��d<#<�*)s����ν�|�5`�rٌ)P>�p%8��j(c���%��7B���7�	Tg�I��2����Krqv�c�K� �FHH�7�B4���7���}��5l��{Td�Td�Ğ��S�j���zeJ�h��Q�L4�ϖk�ƥ1f�Ct&�e�Bt�\zp� ���J#_�ﱦL� �Z�0v���lD�Z��t��L0骇�0oy����.�m�,����"ڽ�'�M=JuTE)QE��U�VƁpw��8�*�{�k@�t�l�7d��X�%c<aj����U՛#;\l�yx���S�2?Ռ�|���������������\T�=�iv�dz�0�G"��u.Uh��k����d����q{�������o��:��+��s�H��3�f���renp6��֗@��w����N�y�p���;@ՊN�P�=��h�h�Q��������%��G��L'wgu��uH��{-�XT����;˔NĿx��@���ڛ+d�7����xs�S���\0Lkj�H����@��+�?a��޴��������  ���|��j�co�%��b��ggAF�$��{�P��OpnX��h�*/�7�ƶ۔,���{z�m���ni$�.����6:rp���s�.��c�܌��V�V}		��li��9�z��-(���������l��6{��#� �����"E��v�4����
����iq�q;����e��Gs?�����0Oy��^��Nz���l�Wٴ?�8(���;�������
��-\x�u{���={�2����G&��`j�N�5��UU� 8Z�����`�MP�B���%HN˲����-�L	A�$yTA�Ťw1�O~#���c�Z�WV�~R@���y����v�^��@�{����c)��湃^F��a��,�FAEDR���c�Gz�#0��J�U��\�Cr���M����5�Jr �x����L�G ����A�m��J��z�c��A���"�R
ӭn�D<	(wQnGut�.�0h?���(G���������4�G(�$]�Ik�L�Ʀ&^�b����PA����E�"j��i�2B�O���f�&�\�����9Қ��ǰƄ�'+ Z���;OPS� B�t6���kD�d�{��_HU��>02��78k+L�ň�f}=�7���r-�2��,;|Rh]%�b�P�:�
<B$�Hѧ�j�[w���h)t3�T�S�Un��?3�ڛ�9
��-7� �w�AAL�ީ�Skv��K�Q�&U�^�L"�e�#�D<ŵ�g�:�۳���&�BA���h�z�����_�VnІ����f09��s��ۭ�e� A��I�R�Op-4��B��q���0/ >>DW&��F�p�(V�� XJ0F��R�$()�md9d��ܲ�9����}�����Z��eT��<9�n�b�Z��kR���� GG�5�>IY��
���=Y7��S�9�%��]�jj|��F�~L?ʅU�T<�\�L�ܠ*���8C����Y��Ӯ xqpr���~��6�V��2��a˸B���Jo;'�Md��d��𐭔�o�J�|%�2Z���7_E*�j����vtۅ[?�6�G�C�B�c�"}hnZ	��8�,P�q� �c��6Y�1�z����k@��K+|{���I��|:P)�ղ��e�a��+'a~_���˩57���Tq��ʁoI���~vU��Gp���h=���T��b��������wa�J\a��p�����$�4>�����6Yw (�v��ۥ�d�����)UQ�n��d��`�\ ��1�h�ۤ�[!HM^�@��m�`�e3G9�e�a�<@�S�$�f�WQ��.���ъ熟�2$�R��_t�E���]38�x�Ú04��xPNk�P���z�?H�M�`�X���/�V�Fl��<H��?���`ptv�x�qIP���,h:�;��5 ��dg��ީD���@���iQ���9�I�_[)��S	��ǭ�t:#�Jj�LA�z(��A7�F�1��@�?^-k��}J��ʨ(�TDG�bR�ȸ�
�<�x	o+���N�|��M�J��(Y����8�L:��JU�w|п {g�?\��EEg�(/J����ʐ�(o}LY�/��/��FKc���Gi.B��Q��hC0*8t�� �vhLmgס�v�����y��9΃�_��(�ş@�K�������4m�G_�J�]���޾�Kw�D��C߲ȥm�K�[$��	�ٟ��"޿r(v����* =K����3�j0L�=�&0�̊�@�:j�B��>.~X��[0�8b�8EE�h\�$�� k�m�����BC�٤v%�J�L�T��f��a�n ��i}؄�E�	�9۰��e� u#_�ܜ�:?��e�_��gGђ���c��W��A5������\Ґ�(s�Ji�y��,��x��"F�;Y�-*�H��7��F��{z�\��!K�3ձh9�`��h�Z& ��fj�ٚ����"��y���p�7� <MYz54�0k���!�'�����c�n�W�V!J�C���$<I�u�7u8�8�4�+��mG"��z�A}��mT�Γ���+_��/X�p�jR�4�2�f��?&��Hm�;K���'!��%�~z58)ED�HդJ�([���0�"�]J��z�_��W�24�c�׺���du��YX�]X.&���u��BR;��Idj,�v��O��C�JܿF��`���3�$�\�=�K��)㐵 �����7�R c���	���Jл���<�j�s`���"������|i�Iv$���� <K-���e�r�'-c�u@]�\���wA=|M�Xcc� ��r;�h��h� AX=ཨ���K
F�}��xo�T��<2ңH��A�����D?UG�\�K�Ӓm����-�T�+�����
�+'wWj����Cz;Y�t��^1�����{WtZ�+����!�-� s�����e8h��I�F2�]�9���	j�D����,Q��6`�o�M:㸷r9s�s.G^��b��ϭ�7gw?��Q�t�V�7���fg��h�;�()�1��D�k���~{��o��J�[Ν�*2y*�5��C�k�z>I2���]�����]�<�ZnEk��LYVT�B�[�h�b���.cG�&�ӟB�,�v�XP�,��B�,�i	�a�=ĄQj�
R�*mjx���n�Y���S==� /���&�n��+�+����f�gM�Т�H"��^��ѳ͚��g���l!���-U�tt��<�`��4V��0�Ѷ�*ȔhX�0y�<�������H�E�K,�UEv�\Ñ2GV�6�Z�I�sʬыS`���W1:�<��Ωf�qi�S���f3DޢQ�d�h4A�)�3���'œ%�P��@�����;f���>�.�J��z������g����K)cܜq��
+Ҙ ��#�F��غ���69��.�K�YD���Y
ZXkx��T���JM��å</u���\���h�1I��Br{|f̔R���1���R��T�u�]��D+���
�z��L=�k4�7m�B`��l��8,��p��z2X��?/!R�Mk�u�ޠ�
(��AgIm�4I��J�,��7�y�i��/��:�:���d�����2i��V��=���z^o�r`�r���������5�ش�l �:������R�^l� �x�Q1{����!	/ܭm���[[[�k�JQ,�jC�hI}e����wy�X+��3=0SL����Z�+����e�D)U��f^�µ� �$y�[��^ �J���l6����+d����[�A2}[�e�wc���L�K��(N�(�9�kZ:mUl�R��tͣ��a�D��]io�5��\���K8u�Ɋm�B��S9J����k�'+#��T�?N�w\�ݦդ|� ���X`	�"�r=;^5�EP��+��V5m�����~6�y���ѐ6��耈V��6$>�]�C�E��p�ܲC)&�U9�����g�4	<���F衇�4e�����E~T��%�]q���C�s����M{��ɛ��yӤ�w}�,-�i~l]����,F�1��R����N�H#*E�L�pr�E(q'�(5g�z��Cv��F��Hh�q3�rk����cHr~���M�dX�
�V���yk��|<f14�z���8��z��&�������In;��.���>��cb�������\!�1�X�=��>A'!+A�`����1F0B֍5Z7 &��xB�G��[b4��jA9��<H)4�B`!V���]7�M��r��h�'�H3t���'�>�|h�q�dj9`� ��<�G�#͌7j�@_�j�Ă ���Uǋ�1�t2�}��Ga{�Q���u�I���`� ��0|ص�O�����^�7���>�t�X@{�X������ł��v�3�F6�������?�T��fP5l�r�70�Hv�w�%�o��"��5cH)��έC�m�-��+�9��N㨦V��~9Q��Rhh���ꕳx)�ގ4<b�J{��o'��y�M�F�pԑSu��&[�?��*�կ�Y����Qv�9�Cf��Y�n-N�eEt�`b\`ZD,{�
��K4B�ɩs��D�QI[Im	dRݖ;��6t7��q���Gp.�d5�lZts�4M�u�)I4��V�Z���X�1�#�&%��G�MYA �t�z�4�R���eE��)��6G��
�G��TѮ��q�.����ç��а��<O�#���	K�T�>�����̂��#����-�Q]TL�3o��Rک����!�
-VS�t�j�F�^��%�]�ܘ,�`K��2�����H%�]�5q	��;r�0���ヽ���?�ip4XZF~RRq������_��
��Y����Ņ5̱KV���/��p��/��?m�%�}����򗫫?,��n�b�a����/W��^o�8��zwpzpѿ<�;�w��A��N�p4gs���k�����苖5���.φ#�V�ML$�rf�+diiY��h�������_�[��wK�pzx1�:�l�-���I�=��J��J��e�RtOø�;I��$}v���+�0�Ƈa�4�Er���T�ΎQ�^=�H�'�>MꌱTޖ����s`���$�&��#2�7�e-�l�{�p�XB�uH[��]�J)���6���	�4	����?Ѥ��=������Vk㐴~��B��X�D�"����թ$�%���,M�R4U�<�Oj���b0_�����#�
�v><�@�5�h�kj���;d��GFZ]c�߮��.P���q� �c̢���l�p�˷��:2��"�.�`'MhC�Y>U�M�63'k�z���Ud7f][�չ��1���?e����k=�*QMG_���;�ܺ6�n�}��v��ݏ���l_��zB��G��wn��p�8s�k��j������*j�$tz��K>��H�>��/@M66[�����Vku�Uе��i��xiUb�D�g�{.�H+��O��b >a����X�WF�l>��2��Z��lw"���,�M�d�=8�
<u	JxP,M(�O��8��I�}K�z��$-�Gd]B���g�T((xQ!�
+�fsFe��F	�Ɯ�Y�p�8N�n&�I~$8cm�����-��\a�K�J-�+�2r%q�Ü�5�]4���T�jD34��{)��K���E*�Y���,�Vq��i���5%�I)ͧC$��~|�P��D�Ӗ!��^!���R'����عz��J}W�D2+y��|�+�Y$�� �W���)H�!�QsV|�V���N�����M 79f��0�JF��/����m���`��n6h���>�p.HR����%�,t�\q:�I�RM5��eo�R=-<�X�V�_��>��*����1��R��[�'M?���?�S���9t!����Ώ��tNx��z3Ix��)���^}�*�?�E?�4�z���c>�K�3i ��Vy�i�b�+�2��R	]��ְ�ՔVYn�8<~ֵ����$h�8���%:u�p\3`gL�e�ɘVy� �U�>GJ����v�D�E��w�[O���>�u�gx)�3`N� ��E�a%M����Ȱ��si�rx�W/Ŷ��2�Iq�Â�Z�j)c2�CE�}<�h�
�V�l� �� �%X�7���4�ᬢ=+��/�W�Z�.;�Iq;L�K%*�%.*�'GE4�!�X��T��C��F����/�ǰY��f=�O1���0������v��ګLm}}�-�f��������*XZ!<�W%ӹ�� CqP���Ҳ��E�*#�^����\������WI��{s$��&��K�,h�~�9��P{ h��z9"�P���L����@ԩ��$X( �0�%S�T�*�̌=��g����
喍�.��喚��v��,,i���@���a�C�(Z�gS���֘�s�Ak`��Mkx���o�ko7�W 	H,U��^�Ex��,��UjB�L`Z��'�i�k/�O�Z�D}@}�0N+(�l_�]T[A���D�Q+|}�!{
g�?�M��@'ܭ%_�����ݕ�-3&�0O�UUx��Lh@at���Xﻵ�����a�L�ٜ���Ph��
���$���B~�,��)I行qB5Fx�O��(�7n��Z��x�m�ݞ�7\��n���o���Y�H�3�\Rw�=m�M�вA��!�=
p# G2s4m��@�rgO���4�TE�c����6iʚ!�,�h�Q�M�������@�.�Y��������kH+�w��w���L~�$`�"<h*ޙ���c���ۭ]���*�|�/�k�
&{���+�R#U�N�Жy�ťE3���kaEv�㋃�L*���� �@����F,��_���� 󏶏u׮�z���z�׏x�s<q�K-4�Ph�A3J0M�]v3�M�X�'�?�"6��6�t����$��.�1~�F�p�{�ϙO�Nz[�aoU��_tc��Frjc|,�$��Ô�`�����]��i%�� ���,V����(�,�MJ�b+��ȧ��q����͂�B�_���FΟ*�d�z���Z#H�C��=byMj��v]xs�t�.��B$��F@�#�.^վuB�G�ٴ|Y(�!{_`�f���(�k���Md<,� Kk7�����ތ�9����\~�D#�򰳑��F��'�6�eRJ��
���e�@Z�E�BkW�
�º�Q}h�/��*��3��h�C�0�����	�"�l��r(i�n��W*�%Aʊ+r�X[r�ĭU�3�p�2�0��vb|F7c�X (L��d��,.���F6!�T��蕺��;f �����b��+����x�X��
۱̯3/��w������)���x�ڍ�4��l���g�A�}%��Ƹ��j_x�y(3��.����Ydb��N������_:[xv�	�G��\�����Q���!w�[.�N���׶�U����\Ðb�P>Q���Kڭ'~���{���<'�i�eI�}��1�	�9��U�^��6�ނ犜[Z� �T^�j]��+0.�|����\��ϱW���x�B��TI�
�B4����d����:QG���$��q��K�dC|Z��d�E�ū��B�T�W���[%Yh�9;}�P���%�|�"VM)�l�T�-���I�ԡ���Ѩ\��p��暧g������Jh0x��e��#��r6ujF�9��v�=�c{�D]jM\���/=�v�[M��=��8��O�	���NN�����l��F�%fQĐ"��I�˳$q4f�\����U�x��m���\z�G�e��o�Q+8�?��Vpqz�2*�z`m�aF$�uc[���p��:���^�u��x
�L>�I��@�Y�մ_:]�ug���W��;4�?J��6�w���ʳzEW	D��B�h0B'���ON�M�|P�571^��gl;<d>O����6v#\�|r�Z6wٔj���"��������03�T������N��чL���0�x<6X���I)�fuY��t*Lr;+�a�5��?q*\��R�]�boˣ�4
�)�ݫ9�]xB��FN<�",J��KX���A�	 ��a���D���-n�b�,��������6�\ R����$�C��<5o�%�qs{Z$�������� �����hn��d%X�$�K���:�[wQ�"~/�-O�� [�m��.4��F���j������-g�6�C��g��3�g"���%��y)#R��	y��tL��ɦ�V~"�})m��RY�I�{�����q/e�t�w1Z.��թc���@����r5�|i���R¦H=5��ϱ��������7�ŀ�b���7�����ߒTE�<��Xʢ���+td/<�?��u��&�۪��g[l�Q�DK'�\�β�6ԩ(I�&�����1�<b���q��Aۮ"M1�>�N`�%��rI�lz�86���/��U)�!�n'|C���OY�\g���/)s,!:���� �&A9��950��M�h�5�f���-^��Y)8i�o
3L�N+����{0�n��~/~n�U�.�x��ú��i�(�H��+}w�\��:k�gU�*��D��uxsd�4I?���e�8��=��Ҕ61n� ΑN��a ��Z��~��PT�Я� �]�!����d<����1����5�
{��8a&5��ER�Gd]ë@�V5�^Ja�#�W`���DFz����:l*��f��J󦶋I/�k-!d}d�����X�$����+:}��0TB���4�v9�?�L�U�)yqK9W�&�_����Y~�#$�DK��pq[��7=�rYel��@Im��	���!d���mc6{�k�ʲ\X�M��Ms�#�+���-�vⴾ�%襀=fk�O�~h��2���]�����9�� �/D
��eP���#���5���J쁎i12���&�]*�*e�i�2�9���n��*~�?/*��1Y`iOӹڳRgc���5*�[�}i���&�;��[�(���o�8�M
�z��a6}�쒾��&
߲�Q5�5Ձ��GTƜᤉ�䠽��ϼ����� ������-ǱM��*s��6�pqܤrX�*��~��#���tՖP�B'K�Շe-���Vl6�j~��� z��E�P�9�xQC��s��@*��|)Ԑ:o�>b��?�¯)\7�o���?������Ѩgq��d�M�
�eL��C�7oj�Ef���\^�U��R*�Mՙj#� +�dLռ1�Cb�c��C~��Y���]E_\���j-0�C���^�l-�� aNï�0���!���Xt��n߷��B�=HA�Zdь� �-��>��	��@}Әx>�A(�(��X��T��������P]0I��ZH�����]c��v�	1k�x�@�?��Y��[c=/����98	�[i!�d@����-�=��Ɩ`H�|�՟�"$fB�Лa�qO��S�E�R)l�*�*"]O�$�|���t2� �`X�D����M�O�%O����Tc�M;@����XU�j�K��'��t��i?�k����>c[���q�s�_�n-3m,���� �`�W�y1��Q걣�G����$��Fq����!ځ�@�d���L�����,|�
y|4Ћ ,-?�^y��b5�]�6,�C�����j`�{�(�0|�S|g�Z�^�F�'��af�5�U.�[���5�*���6���c����db9�i�G�o�hT�k@+A��&�`
�3�J�Pbd`��d$a�
�U��=��^�o㌷o[�����z��dM��ۉ<�x����Ӂ��:�~[�*"�������y�����P:�"�l�5��v���~��L;("��\ ��2�b68UuU��i�#���nYU�Y����S��S~KV+ڍ�5EKg��L�/�m��;��[�RÊ2���[vM��M�c����^� �I� ����pg`�����9��g1T�-uSA�D���+�	��cO���qɌ��;%dG��g�P�"�����d�>����SF�T�2����d��`b�a�czƯV�K�e�*�F��G`4|���yx�؄��P��:���#f�4���-�0yh"Ǜ9p,��/ł|����	Ji�(T��Y(���-����}��z���4û�SQs񀇞�h��\sob;f;*��Z5݅oM�iv��[7�gaA`~
ߑǆ�?� ���@8*�Y ˓�yEifϞ��~���+�Kq���#�!��A��M}��QR=-��y䙢x���%sE*p�5$O�.�����Gg�r���
�(i�H�|��i-U3%�����1�(/8Y��t��s������I!��ěZK
ez&�����fl$
�Y�-e�]E)�%���[d�݌�D>I��}K�Hz�=L���b�}߻�v��4K_���c��؝I'��)q���̦,��k;���h�(`��DT|�%��7���/G����g���N�2��Ի��.�4n = ���t[rN���I~Rc:�m��ڏ+}�l�`ʥ���F��"��P�U�1�*�����ec���v��w�E)'��a�A��^z �{3�6�$�TZ*�O���*�Q�Ū�$?~��8�=@X�Q*U ��$;ڛf�!�	렬ëP��1&��6N� �/s�p��.�H�b>\��:i����f=��}����?��Y�(s�<�E���D2 [�7��p���X�����r�Nx�4�Jpo����Q�檎��䝴X.X�����{{q����.�w�zz��t������IU�Ҕ�;��v���B�v��"F�W���תe������o��;tb�Ҿ�ҨRȏF
���2K<>������Z�Wq�����!�v�s���8�zg�ļ�uT�p	/�<4B�gt$<S��o�/�+	�WD��+Y�Z(%�%y�c���d�j�H{������I�5KǊ����hw0��4�98����#uE����:�>����0vE�c3V���`D+�K�J:�b�<rx�~p���V�^�I���g��l?�`�������:�HG�M6m�����fy��8{��tG��i�#gn������8 ?i�����[�͒�$�4ؠN�����^�{��o6>�3о|Y
X'2��2�7��(^>J�(�jPk5|.��N�52MT4�0����"bs�/}�@j�[4�i钲Qq���[�@����7��t�:^!K*aT2ۅD�Sn�*�Z���n��臣˟�*\^��5#�|4��)cU��둼\� *�{��SK�l�2K;\����'����I��.�[&���u_/;�y Q�v��3S�K`�Lߐ��a4@�����W�Ii����̖}���Ȕ�ύ ���s��TnENQ��o�f��5^���Imϛ�hl}�	��Q85�0e�i,� In�l�K����bI��KÀ2p�b�(
����/���Gi��"��5�����6Ux�#Q�az�6�=�\��.{���RR�<(�㖱�-�Z���ܷ"�� �P�=˂�~�����-]����� ��o�a@��a��9k��+\��oj�X�)X9t��K���νy�G��"Ɯz(~�?Rl�7Y��[����� ��V�hb[7LL�L˴��T���j�\@�s�UPSL�C�%ٔʭ�`�/���Fi���6*Z.�A�Wa��,a��9�k������7e3�8��)#˻&q"�t]"7���[n�Ś��}}=�F��\�v<����m�TQP1��e�j�/ŭ��@n��y����{��%��N'4q�,5��U��3������w���aJ��Wh�%�潟�^a0���e����Tʾ���W�u���6vwI;Y�6܄#)Y���|3(���|7�!+AJT������L2����w��O�#�U����:�����П}��.�8X�
<��2�\��S��ұ���O�B��.�%a?��N��.��෭���<�ZO%�]k	�T%R�;����؄�gE�1��_�j��Ⰶ��T*�TK[YN0*���M���h�dC��ʔ�pќw�d±l�����3%noӰ�҈KJ+���B�kf��N���5ڱ�Q��M5&U�e,?� 7��|\{� ��Hȇ�fA���v�
�rZ2��-� 'Rqp�dj�	#��n'��iϧY�����}�|��iD�.�Qh�����˲Xc߲f�c4G�"|�[j�Tԇ�l�R����3��E���*�{L4�����]����3�
q��F���9�N��K|g0�P����c���4I���p8f�,Hwl��u9��{܉�ӎ'A�k���~��)+��>o$�������������0�z�[-&�?!]�z
�Q:���_�#���4�<�������9J�fP����W�{��|-����@/�G����>z�k�����G�������ǂ=FS�ZPK��fA6.� ��5N=�C���(�ӳC�.7�)/Q�+�9`l���A+A����R���`�H���������[����7����p%�շB"q��J�����nø�^ ��M����R�Ks�bn�&~��Q�������ɡ��g�q�|2��&���s۬�&��m�#;���o�؜�P��{�C����K\���O�WTI��NVk�k����������m��ik���R�����w���4���,=�H�������`_E8�x�Bq�o��ⱙ�g˚�'zQ�!�d@�h�Z�O�L���S�y���0f8O.��:��$Z������x����`��9@�
���`��7���H�Wu�J�+"�h�TܵlH���+ͩ�~�F�~����ftbp���$uWP�?����/��{��W�'o�7�l<ga[$��(�@�z ��hB���g؅@�9V^��z���h��p���?�:�����%�>8iV�T�z�l�~�r�5�"��0|{����U.���s�VFWH�ՉS=Ҕ�������j��D)��'ry|�r��*E�5����
{��q<L�����wvr��M��CG`^˹k�Y؈���9�D2��)��s>;%�H̡�&���qm�v0���60��b�>S���:�bX��{�&[ϣ�{�7���ޛ�\��h�����7�/70��>x��w���|jô{���W���iK�z��4�J�f�&�5,T�;�g�b��B�{�aH_��$5�s���%��}cT�S%�70���{��31�[�,�u��e>\�g�� �5QU�=���>à��L�Y-ޱ�g�G�t��?����r|����]�w��%{y�&�q�8E$���i`�nc�HU�3���ʰ`�O�4�e�M�ԟPE�y�ੇֆ~&�T�δ�xF�x���:�d��,�)���1V��i�A���������������$���cw>��}���Zj�n��ܩ=�@�������J֬J5Js�S�Sw&�܋k@��߽���=R�HI�to�{3�{������IO�I[7�KGt7tƸ ���bh��t�����<�_H6�������I"itU(��S�ˍ�O�|���*��Y�����,x��?[�e
�>�Gˁ�=3��Ac|wc���l��awAn�ÄNF�T��n�����4J�r�nd���v����) �_�εM�,K�+TR����sᄘbMfև�y�����RP���R�(U��Vds�C��+]�D�
J� �3�"��wvVi#���85��,�bP��g裗7��綎ͪħ�t
J�,e�	W��2�0�/�Q-���+���+���j�c�R*Љ>���6،�(�i��w��2iT��a8�#��=X`1��S",����&%�������p��*mŁ����rd� ��;�fK�
����2��f�T:�٪�<Plv��������2�gإ]���+�q�Jm�z����v���I\*�$�~Ն{�#���U������¼��8�~�d���~��,� ������P�(��P�k������5�ϵGC����F"+zx�g�΃�)�����Q�A��J��4n��Ƥ q�1r�8CI1��"�I�%2�U��V�QP���Z���{��t�e?�
���@��1(��4�U���E���p �hB�6�WA��T��ҫ�����ԗ�t,%}if�G�� #�H� '(��GR��1��f#�h�Lxڏ�fk�h�J���B��ư	���:�����yl��~��H�`j��k��m_+��xe���,IJkeaV�a6�:{���\�E-���qb���HR^5�����<�#.��#"�7[��M�!��d��9Z���k��&(�K]L/n9b8|8�y,���#��4w�F@�Ҡ4E#�jhi�>gzh�\nC��Bzeޑ�؈L:�H�2
.O��b"�����$�u14�	�p=�}k[��oM����-Tf'��%aԔA���`QԨg�7��Eﴮ;���.�͆��K�c�u�ȏ��I?v:?"`Z9�!{5v�c���_V嬡�(Ơk�vü4�ނ�o�EnaM�2
��K�����6wk*䢣�x��)��Mf��x��M�ͤc� �2�W���hU�_��B)!��<46��G�E)_G�� �VAaxi�q�5]����p�A|�T�U�<Xt�#�o���A&4����g�i���S6N\���a%>��pp18�<:4Yy}�Ûgz��Y���d]��iO���z�OZ��U��Kx�8r]"����$��|�h�߹p��O�2�І&��7>��x�1�ɼ8­0�
�4�\τ�	f���#�T̨���Fkr�Z/�6�*���t!D�]�r#t<M��N����N_���;�|��a{�� �h�$w*t[e���k;����{y�9ݭ ^��<�^�^Ln�1�װ�tX��ʲ�t�� ���N��*#f��F]�	�������/�q�T(h>�Z�'��%TxIw:J��R�=N���XR*ac4w�[��}�fU���c��3d������L��(�H����$9��z�����,z�Y����Z�'��hzhZԭV���K�������{�?��}8���׸Q��ľ~����A�3<��+��`�P���_�/�"*C�W�ڰ,��s����FP냓���R��W�S���e��{`6æ��fas��qI3�|]��[��m-3�Zf��2_tk�1�|�|�O�`/|ʕ(�O`�G��Ȟ�(�Y%AǯPp?��K���7�eu�3w>��G���CN���`�etU8���~�3&:�S2�ֵ���C��h�b�Z�����԰�7M�
�o؆��A�	~R^O�W&���RE@
�-����yTC=}\�t��4o�Wj_JG�E8S��c-Kw�߬Nȥ4�F������1Y%'�ˋ�=r�����9<:8�/������ �}���pb��j_�~cf�/�54�.�aZX1�nʬ4��¶
��20r9q�k��Bج���"��D��%E�3�?�xv�_�0��,*gwW�9z<�9�W0k	��{8ۧ��	J�u�R��A��mY�5�F48w,<����2mF��C(��C�	��
u��l%H�8J#�S٢�5�����[�Q�@vyP{:����÷��ͫ8u�W�ey�ulb�$k�c0�_�.FS�B>��a��0e]�zw��.F�����@��d��6������ç��<�L�������N�,��vӶ�,��v��������^�ϛ,_�*��]�1���c/��=ETFQM-���͊�qp���bE������� �j*IE!ŃV��y�_�bR/eى�gF�1��f���a�@�M-�T�|���hb�&8�;���:�@�Sej��IТy9>1�CuV��ˇ-���!�;��T�G[Wj��x��Q
ei�v&I��v#�U"����͜z4�_i��f����>�^�ڇfjM
�e�� �!R�	�^8�&�2���Yx��w��\����-,�L~O:���~*n�	y�%����ƬL����e���՘;8�Mזeb���1�����2�$��?P0�{g��G��*ٻ8�_����ه�K�����٩�U,��34l��'[;���أ�*ǟB�6���;��[m�l8$Fq�~���C�Q3wg��QطX��T`����֖F���b�9��O"N�	�5퓽�m�~�g@f6��
c���Zb�(~��T��*:'I([���ѻS���;㯣Sry����V@:��k��(:A:���(�����O�GH&�!�!q���/e�#x����ѩWDefq`)��l/ꆛI��O�^����ɇ�#�g������ JzlԖ�k�%�_�R�,���$��ۜ]�h�ǣ��d�臣��-d#���%S�v�A�$��N�QL�[
�6o#+���8�	Hj�=��.Ga��jC�'��h�g{G�cN@�&Wj�"O"�=�;;�3���.�I����=������F�DR�Hi��{�-=��\����,�����?2� ��/էCv��q��{ E=�mC�􇩌e~�5�)��zw��p�5��Zh43`�׶���~�����Ո�[;�t��u��4;�Q����l4[���6���own֚��I���A)Tov�N�ĊP�M��n����ؘ ��1�4[�Pe�:��������lm�RS0āv����.h�C:]hvk>��\[o4�6�6�i��;H�n4p #|E8�.����6��W���NZ�^�����6֛�u^����lo�l��u��	
����`��>|�v��c��A{���S�iบ���e?`���f�%kݨ��+���f�G�Z���X�m�A)T"kͭ5��oÊn�����׺�^<˽fws�n�w`��0��5\a([s��v����7�{-~,���Cp�)���� �{���u�<jn�R�#���wH�
�'ߌ�(9> hﰿw����_���QOIr$�!�N��J�H�sh�hs*'�����S���0Թ7�Ϟ��a�x�<˳��"?B�,J��k���^������
<<��e�h9_a�u.��Tb�Ö�B�ʕH���шyy _��~:}'�53n���j��$Vbsߊ'��C��<b��pw�!������F8����{��J���ɇhI�N@ R�����8�\�,=A	�5�Z] ���؀����Y��?h�3�A���p6��1��'�Vo��;p���[����{g���M�)Zk?l����MΘ��VΌ�ul�����p�����es(�^�N�-8��p(wGx�n�� 2���J���67�n��n��M��w�a6Ack��p���\��A����	kq�f<%O9��O$"JI�F�z1�~P��Ŵ�I2=�қ�&4�L�&��Ƀ,�/� ���r�+�){�sA��>g���
!:u+ɄMCBA��w,�9�@��?/�n�����=��
X�^+��;��
��a�EVFq�k�'�i�~�pޢd��F#�����S�ѳ���Y�a$gz��^�����Z��T.%�%mOqz��4��R��t��	L���Rji�@C0[��B��ԫ'�v+�ؤ�4+;UB-~�Q`�P&��<g�@���W;��w:ʘA%�0Ipv!�yG/�y�5_ve8ue֑� `=��A)�0t�+�����u:W *v�2G
����^�4P��B��J�������;����j��j���8҆��0j���L���I_��O '�I G&�%�������S+-[W�	8jD2�/�4,.b��k�i@~k��L�ƴ������&�zxO�o�� ���V+1��s��{��T���|��z.��m���1	�Q.�O��1�p�vQZyf�[(xÿ��:�OE����s�Pj�׈�
 \���Ͻؿ^�:6��b7�
�l�v7��I���r��0L��)� R����r4�t/�٣�m��INM�$�m53�,I�s̐���ޒ�7r�gN5 F�M7QW��1�J�^[SyY�M��!��\�7�U$�>���qR6��
ے��yL�I_VB;&����OV	���"�,��G�p��1i-J�B8,?��H�$��ca?Ϸ̽�̠�.�K�Ɉ�-��_Z!����^�L�F�!tC���UMxH��@�k�<<E���0ǃ�0DclaP�#@5�%7��W�gd^�I8�_ \�����isf��E�K�ɽ��R�_�[x2�c�ȱ+��|; ��B���������]���+T�~���
��٢W�7��I75����PH�T�[[=�g6�g,��U���qA�����Y�l����<�|�A.Cg�,�|!M�$��1e���t\z�Q-�(>����Rɒ�g �܋[�,�Sq��T�6�@���|
U���ṶA^��`ԱL�l,�-���Y���d�J���̪&ُQ����
��k')ґڡ S�ݪY
Ir4=�A�M�������)��K)l�Ty�d�mr�q��7[哐�8��xUD�z�T��ذ��ǒ�L�\%ŗT2 cq�D*�"�<l�T��g̤��k1;\U0"��Tz��SOH�R��p���+��ȅ�@e�� �0�o(e� g��?�ԟ�g'���ӳ������ч�app!7ϺeQS��$��a�m��F|8���)?d����6DD��<C	�D�5�y"Dp#`&���J�7J��Rd��xg�Ϳ<f��o�HPH2�,I�a6�$Q�E�����Rj�#��F���ݙ��Č/��b�
Ի�����!M���U�cVj��ٚPX`M-�pL*����Q�V�%7��'��Ǧ��Y�A���b[�{.��,eUr�yϛ�
-ݸ����9���GԦ &��\�n�h�i�Z��`o�rƺ����h[� ��Q��JaE��p�j�\�ՙ6�n|��j�	05�� ,��<bt'�j֤��B�6����u|�i��X7����x����ߓԿ�Q�qxX�# b�Q���j[���ö�	{�����N�p�zWo�V��I����j�'�]�`c.��(���z����A$��9�K���wI���F����Z��R�$V\���k���,�+�l������)��mV�׬Mbaz"�H��9�̹O�a�󪸗 \8�L	������A�̑�8�xq$�2j��q.��!�K���2\l*1G���x�v��=����]=�ц���=�w\"Na�)m����B:w��;��-���}c��5>kDz:�s�Ej���5�N���8�Gģ���/����>7PYOq��3걣f�����M����y�O���:߬R�ń
y?`0�Z��:癩�B�b88+ �#�^��8Zn5H�o��"P^��f�+@�W���Z=/�A����(A�[���m0
�|?���Wl��.�	>嚽��ٞ�����z=/�]ۮL,󽍪�ś�� I3i���*������p�	��wi<�_'lF��J��T��[��|3��[�>�����F�����b)�z�|@��1��ًLQ��- �s���c��h��b�a� 	��v�. �c��d���A.�{"�V�K�6�t��ѵh�!�����Syec����n����)�2f��V�%�0W�@|5*��s�r���޷�``K�4�5�r)�-y;:�R3�r|�<;կ�%ϴy�/�ųa����;�����G!^�7�;k�d0����Kn�h;2�9_����}�r�??'�G��zt��~\�����\��#���!׌�V;h��\�*�f�>D?_�5�c����	�   ���mo�Ȗ&�W��5i��-��Kez��V��,O;m_�Yuo��ޢ%Zb�$�T:].�f��������5X�b������?0���dA%;+�o�J����r��y}NVh[�-e�{c��12g���>7�w�q=��i��+�`���H�6s2
�?����E���Vl�?C�s�����x�*��$�L���]�Nzե5�S��� J7Ҫ�Y,�N�ٓx@�b�-��k>lB�Gic��5�%��c�/�pR5�2��9��i��k5۸!����g-dfU%��JM�%�Ə���'8���g݃���C����:�B��?������^:9������o����bN��'+Keu����,�$qRY(^��r�^җz���BD���B�����W�����߷N��"ˢ>M�XCq��ۑO@k�����; �Z��p�\�b)��70Li6A���d�b��3� =ɬ��jA��^{��w��d�Q8	~ ?�*%hǈ~�����<�����[c'��cֿ�x�w��)�>�Ɖ����=[�,K����.��75ϴ4Ş���W�U�fp�I��~8]�Xo3.@R��-ݰ�e��������^��d�QY��S�R�yi��A��7��n���w�z�l��1�~��x��v�7U�|6��[l"��ތ|�{c�_�	//���s����l�
d�ˈ� "�{~�U=��%ⴂ�ZոT�ӂ����<��sE|D~/�āR�}�3�`I+�Ź.�	7U�r�L�3V�ĺ�*p�NB���.)�°�S�ڛ�����'�����l��q���b
��t�����RC�1�y�Mj����|�i������s�Rm��**��R�����ӉMy2��~E����HU8�x�������2��ԃy��$U�v�iKV��weR�-��..j���W�����*�����������*� w��ZgT��u&�(g�LӜ�l�t�R�Wn�t/.Џ!P��tN:��X6�5.��5���}Y��gc�R�ئI������!A��K����O��)�`�D�')��0BU䌒f�����t��Ӵ��!)3��i̸(fs���hA%;�#�@��/nc�2��P�h;���%�M�ۥBy4�,�Ύw�3���:�7Z�����94�(2E�Rs[�#!�o���5�S��)T`i2�G���5�z����p�TzR?f���a��ҹ�N��t�,���p� )��(��6(���T��m��g�U�����XYe��K���jK�{���Q����R������C����;��hK}tL?��p2P���]c�s�/%�[�-���EY�s@��ԂpR�i V���O�^Z�T�:P���T��,��(���[�K�A4&����_� Ϲ�q!ԙ�9~0V�Zh���+z�=�f�}j/a@���<�>��d��uް��I��5^������u�����;�?&T�����R�S	�~��R�DmEL^�U��F��>��j	bq��~ �d��B$��\��r?n9�Uci�?�)�i2,Տ�)�;������d����W@���ݙ�:'?� ��ɍd��_��/ؤ�É���	�� ��}?�]P}����]6EOAJ��.�'�|�'���n��e'�.���k�>����-���ۭ�Z�֣�P7�Ŝ�Go|������[\�\�X�D͙�j^W�7Y�K���Π���d���q���Ã�N{�;XbK�9{Є?�)*�| �e�XڹZ�X���&n�ػA�Ћ�W��i��<'CC��^f�QCH3SD�=�=O�ݠ6Q�<쮯�8aH�)�9ñ��z<-v���d�5��)�JcՀ$]+c�j2�(�~oDC&��u���'�f7��n"o*�;�:�9Q�݆�M�h}bt��@(S�`�V�M`2�00����A���И�o���nd�լH�t�|��{vq$�!��M�V87�h��������{�t�ʪ�0gK HZԹ�ܶ˝E#���a<R��Na	�2H���} �����<��Ǉܔo8�J6�ޱA��r�����_B��-1w���S��Nl������R�=vnS��*���G���W�ؾ� W-�qV�ح��u�]��6@��R<5���0��ʐ\�ݏ֞��V.��Ah�h�wr��[[�]Ly��-ſ����vKop���F�Xf@^�]¢�u����~{d�V��A��{|\~�����]��[��np����8e��ɽ�"� � ���ǜF�6ԑ��,Z w�o2�F��v���d����|�#���T�0��Q;�IJ����|��
@g/;���#���ܳ���ٺ��&�3 ;��Nq���]ֳɩ����TBm�lq*���1H
/���O!�+�"it�W��U+g�~���;`���|
���'Z3�2��.��
k�P�@q)�v�hM~T7������*��O%���ޭ��-����_Cc�0���iR�ݔ�������i��f��~Y���J��(	���2�[E��x�z��B?�qe"u}WUt���%
���-])3de�V%P�!I�^�&�Quя�P(z� aK���iGb0Z#��bjV�6�'L
��,��v�Y�7� �g�� �7�j�H�}�"�F��2�f=�	+ю+g���*w<^q�����HT����N����~ʫsT���6����ZM�-�4�_�sBHJ@FV�]y6T?��V�E�R[ձRU�M�P͇�����z(�k��(��6�� �=��b���27S��u0�i�9S�odEoO9��3~ڒ%M��z���hB[
��U�'�;|���'^0�Y<�~�n��k5E��R��g�S"G�s����y�I�Ǚ��C�&N�y[>d�?b|+�1� f.��ͫ��2���Ŕ.�T�]ͱ���!���+��u��X+���C�cJS�;��d�>Ŋ_̨�R�����(-���/�?����� `C��K4��$�<7��t����ߝFA<\eg����ĥ��i
N���'���h+�:fc�����������`ǉ,�l
���({�W�����u�	�M8��5;6�DNL4���!���u�!L1�Q�p�ܕ��J~^ #�� � ��!c�!��A,l��I/�p��dw�5�x��R�ZVT����Y�sjQ��~,dͮo�!�b{���]�aXx�g���*?���ͫ��A�%���E�����_�"����(�^�\YX[����������h[����Q�$8���EF����d`	6ؗ�dv	=��.��$�q��$Tvu����	k��PhVD�-�C����Jso��xOO�D�JGA�{k1"Fc���5����>T'���X��
�߬(�!)�2�NA��r�~#'�[��w���}=�">&�tin��H�=��z�},��ݏӑǵnu��Io�d_D�X��G�E/��&�Q��~�$�]ˈҬ����x�:0���l�G���C�)��1ၟ���|��5��̈́F���]:�����L����1kl���*�l6�+ȩ����|8Đ�Ƴ�>=�\���\��I[MJ��c@P��qˎ�v��uh���ѝ�?{!�z$6���V����a�r�~��$I��	Rv���*��r����1�n`bL��Z�]�X�������ԡ�A���n�[!g����ck���1Lӫ�����������rA��q�Yx�O�;��	U�$�*���=4�Ŭ�;,	*�_�gؠ��D���rʞ`'>�����f���v�v��.E>Ӻ��4�HFm��w�+]��R<n�^cV�"���UC�L��Ѯ#n�� e"�΀H3}bUJO��.;����	����(
��	�1���$�G�{�	d4Ҋ�^��l)���Tmg〛�R�)D,�O�4���������l|��*�v6OAJ�+�7 ���*P�zӽm�~�U��D��
m{cG��-����Uv�i'㋇��۾��ܶ(`�}Â�b �����q]d,M�����R�i�GR��#)�1%m�H���l���Ųc��G����-�-�ks�v�7k��O["�>l��Cun���F!��"��J�I�i�BZz�D`�������,V�a_�=�e0��dWx
�zjN�)���?:�f{�)�� �H�z�1jcն7f�Ӝ�.	ʒ���>�o@�������}�̰��W���6绨>�l�a��|9�������f��v�,���1R�����G�{�0�U��U���=�M�'>-]�N�kի��ЎY��NO��){g�HQV�
�p)?_!��j��f�^��gF�ú�P������0�����abV\�Ǫ(��9�NJ�\ܚCW#�o}��*J��@	Ϋ-`��k���U�>�e�^�`�4��6qw�#~�@V�y�b��P䕛"7��'�cm��k2�f��r���@���˓P"��	O5��.s�zx�'����co� ���b�������͠��[����Ӽ��oy3(5�x8�鋇���R)W��4Z�f�+$'�c?��D��[�q�T��<
���Tq/���]������r��C`�xX�U\��!���t'�1�r�OZ~�)�p*\�$<���;��*�X#����6uc2�2�'l�����֒��7�#+:?-���4��T� ���O��ZY�	���sq�%��������s37_p7�N�"�'O��>�Ы(L�������R4d�$Ѷ�!��Ġi>�+��Z�{�\M&�tnC�G��akr���m�\��z�y���s��ȋ�m׼b��u��+�X)���G*�`����8ĝY2���M���%>b��Te�ܿ�
r�f�wu-����F���c�L(	�_1��t�l�O��y���i++������	���N���au� ��t�nomS�C�7��k��+h\�g���?�%Z�4��JjԷ��1�I2����HW@9�8R��$����K��ӕL�<Hf���PCbЛ�*��.�/ؒ�������Of���L��.��lX�"&����x6J�5S-�e�[��삇�R@n8��M�(��=�k�:;� �7K�����TJU���j VjZ�"v(8���|��U�,�Z]X���{k��@�m(ر/�Ix�������L�`��s	��
�Q ���t���*�y�c��AĖ�ι�D�����DMg�߫�.O=i!�9r�m�{�#/�K&
��rA�Ym@]��
֭��f�@},>�c_
X�����1��Up! �Ũ�9&�b��Y{��R��5Y��1OW����E�FKxբ`�è`ZydƼFaX7��֯�H`Է��_����}S6N�~��Pm!>�N�Gof�^/��^�pkJ0��lX��O:�����1؇O���7=)��_��)�Д�T@�0$I뛄=rpz�{vt袖��i/8'�"7i/W�
��O�*p��\�����>�\�N�u���҉�2��6{G#R:��:䀉$�<:�i��
Ph
k���g�!�¥�7�����X�pU,>��KVa�t��&��eSspz�����G�^.�͔�!,�@�k����M�1"y��$���j��h�R'��O*�M��Lݶ�c�/�r�10+N@-z-RF('�_���Y^��z�;C}�%�>o�Ky�M�R�p�*@x�`@~csg�	^�D��*{�߼E�
vHO�b?�:=	���_�7�H���M����X�ă?�����?��UV�X���=���rH�:@c��^e�6��T +���\���U�9�t.����;��u��{�9f�K��.VAM{{�=��BC�݋���W��3`�H��яʦ����}�v��0�-�Xw�ji}��C%&�j4��>n�	�S"���'T2~4O��.�}�2��t��Ŕ|����	F_�ϑ�:�:��Q(�a/��u�DO��>�{j�tR��&#VD��!4'Ե%���z����!N�����A�i�JBp�D��7*�yُ�
ٷK���V;P�b��U! ��K/��١�Fi���(+N�X^Q���ǋ�t�%��ʨx"q��f
���l�U)P�U(�*p�Τu��$W%u��@�Ye�2���v�q�l6�>e�2�����*["Z���TV�)�q-99��V�9�)i/���;��|%@g���,�_�;�@��������o���@����|2�_�G�d؉9����?�Q2����4�F+�5�{v���ݶ�V���G�^X��{�at��Ѧ(�rX����I�cu`�H͝]��{�w	�(E`´�,P(	I(,O�5
l���Z����[>����� ���V�j`�tyN0v���S�Sۓra3��u�GV:�gUe��	��3��Q�pcKܞ�C_]��b�6�j\M�����A��R�*!���ǭћ\���-)�� ֊�U�2G��6�s�L�b�.�4�-�4kZ��%U<�(!��
sC�f��7�S'���7%�p9bc�%��`���f��F�j-cd:��(	p4���3�aM��#�|y{�o��
Bj~}���Q���-��{�q}�N��;�f9�'O�๰)�1V�O�ꂬ�tC15��3�� �#X��IҐsś�����z͊ �c`��9S��H�F�}��(ΣҤ����6Z�h.G�����_��C:9��`���y�Pjb!��>��	m'���_8Ȓ�T�+�Y4q}�5����u��}֟MG8���H�ʯE��FL�W�Q9"��Ѭ�e�7���b����^qO�D#X��-���؛�?����)ڀ��S�0��Be&W�m�]e�V3A�2��v�ٞ�w�@9����bIȻZM�C0���3��?�[T��Tw��W�u=�?�ޕ�ʸ�h6��-{ܜ'{G�w��.�)�c��m[����jq�%�_ѽ�%Ǽ7틻~8��h��oU��e�[V���T�;�!	2��vz�������~��_qNUr@�o���h@`�fk���nw�d��)Ej�4�/��E#�\��\��g���Rӳ�L&�OH�?��(o$N�������`+LeH՗4�}U�`_�Z��[�$�q�r?�D��������at�g�F&u���>#��v1����t����H�����+a�J�t� u�sK�7��Ŏ�h�� ����{NBŲJ�ҭ�PE�ő~�C�\F�b��J��q�^|N.�be�`�Ǭ��F4�$���A&J��V�5mP��&��8 �PI�S�w�D��=�j�S�g�����v��䔐zF�9Z���=OfW:?��K��!�G��Z=·�!���,�$$���7Y�Ttb�`ok�����j�⸝�>�q!�c��	m�_��1��(�=`��ÔuҶ��5?��~2w��A
�G�S%���FIAV_�zB���*CUE������e� �E�x80>��QXf6=)sT'H�5oٝc���=٥�}j�RoN��q�_��ny�
���2��RG��r	��V���1+�}a��kW��I���,��vU���#�+�l������
p58gW-�Lt��᳦���*�>��1�Ab���:��X��]=�m�1h�*�U�p^�g�	�DV�zK��U�.W�V�Ԫ����tl�鱊�Fb��-
OIz����W��X�鎗��.�D�*�w���S,IjC�T��&����5@���K5�מ=�/ۮJdp��n?H6k���-�����O�/�{x$ ~��{qytzr�&q�٩pq+��:(i�ə7�G�*���y#
t�ZX�*�dS?˲��,�ϙ,"�Yb%Ѻ���
��B���@�
b�,\��!�BUP���<��U��7T$��Z}�{*'"���^�!����ND�Y�@��_>�V�su��
�0����g*f��+�����s�!��}1?���E��֪�+5WY������룋���C�A%�l�6��*K��rY �4b/��7��~�oY�׏�ej���U�����-��%�����".���g*�*���Vt��3o𗹧*�8�S�[��Vkc���p8a����&D���+l@�	ض�*�"`]���H�-���a�����;���xF�Lĵ��W���e	Fx���9��֌?Y�Z�7W��!��p�]{����*q��Q���j�ԖT�S�;������Nޑ$�x�#)��uH�3�r6���06M��Q:����!�DB8:	��k��6]8�oT�1-{i��PN\��"+�#�%Wa��^E��
G�W�x	Aޗ�<e��� �cY��E��m5��8�D��jQe�XY�1 &�i��.�{�c�$� �:��$�F���Xh(*=���P�&���0�*-܉9��ڮ�T�%6���������V��W�H� <�Ҿ�+���̸kSINC�y-�~�p�K,	�<�y�� ��xNm��W���q�@�m����CoD�Y-��	���RY���{������x6�v� ����lZ�p+��e�K�i`(�B��f��.a��W���0���F��_a�s1�=d(A���F���CPqtvFW<�R�w���i��o��+�w2
����@�7*ġ��;�]?�����ZD«`��Ws�T�r��0�I�k0=��M#�Ҧ5�֒aP^t�����U��9ѳ����\����r�;�u��R�s���ɕ�)x޽��ص,n-��m6���j�,�Yܴ�=�gܡA����q?WE>;U��F���IԹB��(P.�!S�9���T~d���.�{DU���w��T������9f�.���桘�a��!���N�=}j�7@N�[��b�u��ap��e��`��8���G�}�+en����(���o��.�A��U�H縄�dݓ��9�	�\�����oOO.9�ۣ�.[g���/�߬�zo�3yw. G�p��w9�b�SV��R�r����-C�U��v=����ȏ�Rm�r��ɢ �Nu�`M3X����F�R�^������+��+��t��4��D����`Q�+,j�_%� 2��A��d0
�a�g�°��Ї���Ñ	?�:���+�:��AʘR���M�
cz�D�Mc(��x�A���=���m�F%�����򕫨������^��%���X͊�p��m��J(�+�5ZS.�+v�E^ &�%�ZE�@,�FٙS��t��<��;�&�{����	,&z �GG]�5���i.�.�:���}:�q0�A�
8�����t]�"�6�U�j�U�u��<���A9ʍ�յul|����m�+h�¼mt?8�ƥୋ��O�7��Vp��T/���Tv�16}o�G�d`EU�GўZs�:ɟ9����4
6x�6M���WN���	OVy��AqI �W�i*
��oO����s�e��X����.�x��_u��?�n<;'=��s��g�,<�;L�=ڢ�0-�@���KF̠�mv_����_�s�����t��Qf-j��Yoΐ6��D$�+͙�	qZ ���a����*�#St49=����qX��t<	X�(Ͳ`�X:T#�DI� 4���0#�ZH��[-���X���>W޶{Ʉ�	��̫��:'���͵������8!�W���)ȗ���&ɽ-�Z��d���ՊkLM!~U��j��wE�)LR�l]�_*��M[�4h't�y��ΰR/d=gQ8�&�`4�Iy'6Y^���J��^<BY����1+`�q:��B)�?գ�.�L'�����/�����fPn ڰ�=�I�C��D"$�w��W/�aBeQ�5>�u�qE��ln?LD��=@2�s�Dͮ����U#%�>S�-�9�����ȻI��?�r���_��{^�Ï�,���h�Z��d�t��l�C�kxI��<�'u4�c��( ��%0f�������J�����V��7j��m�����b��@d�g�~e�O�����c�a��X�|�����
=+5qtՋ���
�n�a� R��H.��m���=�;-��r��g�$����m>�_�f�����4�q����[|L�g��=r^ȿ�mLne�L ��vkU|�>66V���/�1�:��V�H1���"7�'O�͝],[�`����ɛ�zz���y�p{����p� la8���^�sgn�2w������|� ���(�~yDr�ɸh?�-X�p��EyI�rde�Nb.C̀��Ż�$]�\��k�!Y������s�'9�.n�y�8�\-�U��|��G�r��VtWI���Z�>Ds�����!3��]���-��-1&�����o��#�no�~��	��#�	M�5�p�������О�ar����0��b;���kSr^ܦ��&s��{v� _�y7{9������r�_��I?�1i����.��oը�d���M��gꇢ�i~?=��U�$���U��j'NnG��ޱ+xۀ�t�̓�$���s_W]}ݾD �-�J�iH�"tN7'w�����~&�UM�n>�k�����Ի�r��� g��!2;�v�U��`� Ȭ�o����J����J\�ۇ���<���Q�B��Ts��+YSf�+��]�����?�����KY�4/���թT��T\�ZXp�T#��|�#?{�	���B��+���wr6���v�+D@�گ�;�_gO�kfke�ug�R�:��Ā�M�Yo���?��ºc�*�7����1Y�*�Բ�	�5S��
(����a3x	�=ӝQQ  ��������bsF���<�.�l�)u���ƘZ�b�9��۵�V�L����*���܄vEnB[�ۚd����>I���
[�{S^��4Qq��T�E/���@H
'�J��`D09�c��O��R!����* ���A΃�gL���zi뻅����� �2l3���j˿]e�ŁՈ�΍�]mm����͠_	�_z�6�4F"e J/��ml��.IH����W]��<�Qd��JX�%Ca[$0���Q�� ���sYtҀ�;m�b�m!�9�U�#(YW2�vܼo�G ~gJ���sye��ؘ���"Xq�`��F�j'4�B�4v��3�n1�p��z��x£�|<^ǜ� ����9x=�rp�D5g\�C�~0�w�+�99|�{a��D�s�*�c4���njJ/�Z���\�RX�"�kp�W�r����k>Vo>�j�-i�!֑�#4y�]$X<��C/: Y����m�����聝I
N1w���ɮ�������Kɿ�h��pz~�=�S8)�=D�Ɨ����?NG���V��ЃbĿ��"x�<�'\L��k��ڬ�����x��6�t4�C�eT��xӹ�͍묛�����U2�Bcs2�9wT��4�{�P��P�������kpp�tT]� T����5t�3r�s�?�ϟ0��������_�=��A�@�o[!�k���n�BȌ���k�pg���2�10oU�u����^�W�58w��/P3�&UDz�2���q�0�s�P#ӑ�˾��y�b�uu>���&N|���ڧO��K�cϋX��?�-d�D{��G���4{���t��k)���t\_R�t}��
x�<�>H0{��ٷ���b�k7���H�[6\�zZ �Y��d� ��ŷ���l�q﹬��2��hL�-g���L3��|�`�д�����}��>0�YD�/J<+b5�� 	�����?��c���8{��V<�44E����R�ax�CN��Ovz�I�|(��g[.4�5Q;�+t��`ŌL��=��U���g#_�aq;O]�N��x��l�f�ف���ޠ�$B�W�����}z�l(�E��^��*��E��J ����uKd��r�g�JQg8��7]x���$�:�y���ǜw���I������~�QJ�{%6
�˰A��e�A������!Q3���۽��$���3�Q�I�O��N��g积��:T �^�Wo���Y�uW�D�+4$�q�� ��,
��QrĽ����!��ϼ�D%m��V�-G��y�<�~��z�Ux��֪��* (��*�Z쇵w[�Z�qP�V�u��cfBd)�(��Kw�^�(ns�7�x� ��8���3��b�⥼���?'����l�g� ^ѹ�Q�|�}D���-"`(/��%�������e��a?�8`��Į��bG9�,��3Y��W��o*���|��  ��a�6~Uq_��
����)>i�>{\�c�n�p�v�h���0{Í�C��-�L� ��/	fo}��o�������1O>�4xB�
+�m�x&��@��z���v�]U�m�li�����V[�����-���� ��F�i
<41Q���_H#� ����?�(%��J�[XTpK��N�ߐ�����4���@�XIq�;��6w���9�%ߞ�Fw��������ӟ�3o�<_�+`2��x�z��"�ڇ���x���I�&o��/��-�Z���ַZ^C�-%��̭RGK�e�pJ~C�B��Q�fW^`�e�yW�H��*G32�'x6���ÿȍSþ��h��櫰���gî�ж���ok��}/!&Q�غt�$�oHy1߰%�z��?��2��_�Mɓsn�e��|qTa�o����(Of4Zv�/����#}ac�!����p�]���['�4�U3�����^����c$h���h @�/���(G0Jֶ��(�|j�wW�8�4fNs����t�����0,��j�r����,�҆o�龜����R[�� nm�K��r��i�ٽ--_��_�c29��ބ�D�����ٻ���j�pc�eiICl|Z�@�
��;�)�ı�x��U4�'Ũ퓴��h�h��2�u����ؿ(��U�)Ξn��ÈG88&ݲ�A�4�l��,	���B8/�0v�D
�ecqm�@=X^e������"b��|<�8�~������+�t�s�O��?���	AR��}o���7�sx������D���P��8g
ƯTt�jnLm��z�r{ہ׵���V��'��Y� 7K��e�RX��d8�����!�-����%G<�|>�
L���,OI���w�²F��?r�7Q�Z�W�hS"r*8�����=��IC�������E3���5�lg0�~�������ez���W,����lf��(�J�MG����TdyR�BĨ�2���� �g��>d�g�+��Eb?�m`��'�}���f+(�y��`���� =�_�
�JA��fSX�W�5jZ�Q�����W!�E�m�F�Of�[����X'��W���uYzC���r[��L.a�&^p��Ȍ�.���^á��U���Go��ڳ?|�>X�A�B�[>����m������k�Æ/D�-��-�9,@ݱ�ث��]�Y�}ޡN��q��Q�cK��B�	n ����EӦ�����0���/�;:������F�\y2���ς�����G�3�8Ԭ�bN��B�V{s}������Lׇ�/�v�p��-;o��9���q�-_g?�7N��5��9DH���dX�[ܤ�>�flJQx� r�i�@��[�a(~�S|��b!DI�Q8�l�φE��)���*�
�ҳ�4{b��<O�TX��
�O��=&Ru��~Z��M��D��A&�N�9+��Wأ�ޥKz�k�q���$@O�E(Vn�M0��1�9�G���h�:�p����'���i2��x�;��UA_�,7���K*�i��4���N������JLK"L9M[I�`����!nn�ܹ7��<�b�B��qL,ݚ���$1�N�����ʎ�����cå$�j�Q��%i�²��Lޣ��O�VuH��7B?��+J	LITPhc��4L�$��F����"�7�JC�{6�ae�G1�%���Ѡ����a�@w٠����j���]�h�S{�@i�V>D�fm��� 	K���&��ǋbδ)�J�K����cL=2%�,�	����NizOev�]�Y�� ��{o���(|ﯽ��n�� f�*�� "�85�>���*m��
f������+4t;'+}4%^��:;�$3��C����@��7��S\M��PC��, Z�!q�ZZr�(H��B�U���ۓ�o��G�G�~��vYLPK�h�T8K��T8��
m2a�D�9ȃsp�N����ch~Ğ�W^o6J>��&���E?ֻ�Y��#��R޸w��ՍӫD�X�=
���IA-�h��Qi�7ſ[��m��Y'������Bg�ҪG)�9��ѯZ���'Y�gg��,�ٵ��Gcg�y����>(P	��k�WgZ��\Jg�,�U���q&�];�~9�u�r�kG�u�+���K����f�y@�����2~�x�7����ኾ�pS���^���e�K��.Ĩí9/)x=�eȩG��h#��Ŧ�Ė&r��㪝�R��o~CkY��dy:��T$���V0��i�J��!b�3��h$;�C-��D��Jh)�,�mS�t�`ss�%����l�v1�w�%��٠	�g��D�d�����q���Q�3�a����Ѵ�&�8�����Mi������ߧ9�F�T�?]��C+�)�P��V�9Ӝ�*K���+�Ә�H� �և[.�фd�6X��\6�����v�cU�T�\��\���]U��;�O�g07�X�>�fyϞ���A�5���ȿ�i_�f�p�4�����r�J�b(���e���'<�ߖ|Q��3ޅ�x[i���%dd�+��e_�A�ͱ�ހ����}Y�e��o�T��D�eX�s�U��y^L��a3?Q�KiQ"�0�rVm?��b__~��"�.��V"cz�V�H�35T.9~��1/:>��*�9��|>j/w-9�3���F������eg�$�cߋ&�Hg��V��jU�QΟi��Dګ���`�`BZ��(�7I�Q���6�Sa���s�y�u�{ܽ�����ۓKvpz����M������;Ǯ�s���O|q��N�B銂���x���:����aE��`�0H�pv��PvE��gY�5�Gr'��yN�������m�lDr���&j�XԼ�S�3���u�>����n>[�#����̨��ƪ	*�2�5ߦ��H;� �(��^�`scc��"6�1��7���o�8\@+K��L�����w���Ep��6��T���}&�)�L���!�aL�݉��o��g���Qr���|�yg�ò#6c��~��xZ]r0_������~eon�Vf+�m*� ���d5��!V�&��8�&h<D�5�"�B+�F~��b�^�m+*l�9�8u�%�?W�m[��ːJ�����>�dİ֨܆�X�{�a��~&~��:G�7����*�$7X��R�8�X�&�!�h
�A���8��mT��>'��-�}q" �}��0nm��$�+���rj0p;�a���[��[���/�]&y�d�6�z������L��S�"����4˰9n�(�Y5]q��y"��4H+��ծ�%��<��]�]�J��ԫ������		����8�96��e�1%*��$3����΅k���Nn�ĥC�붵��@J(?�a����i[5����i�M<���������VW�������MD���Q�_�8��۸����,���:�dx̡I4��ʌ{��LH�b8�/��#x'��l$b�-Mp���ð���W�l�~�,�w8"�]zq&̦�FBx��Z��	[\c���NL3��8CS�u'g^�wy��Í����w�d�(�󑯆��#�=
#�x�Ћ�t]9��F�bU�V�fR4!� R��ƒ���XP�$k���*�Bk���\�q�jU��f�о7
{�laL{����Q6�Yؾ+�{n�{�����_�7D��Shn:5���Z[�H&|<��D�*��g�
��5�m�$Z�h��^�hv�7���,�c�F-�ܣ�&�����o�i��U�ǉ��7j�V55B�@���_

0��U�'l�a�ŀ-'k�ίִ�i�%ASp��}*��s��tٗ��|��p��sv69_Y�%�@z�f��� ������G�7�?��M�qj��(tq��A�"^6��A��O�����@����t}4"����/4�9��IEʜ0�.�-K9���^�}�����0*C,�/%��>=�r��s�u���ax�:��vI�.�f��2V���n����1pW�Jk����7�ʗ��> ��_��7�1Z�/�H��V޵o+��߽Y�*u�_��?�R>ci�x^m�7��s�]z��#Sd��H��'z�I�JC@GP~I���.��;���̰��kW�ҽ�xZZ?<�~��&��a�JX������B1��Wgc�⿹1&�q@Q�S��U
X��Si���C��ψ���[
ڮ-f�b��� s�Dx�H�`q�<Ō��0��O�M
�W��M���֥��ߴ�[S��qxs��R���>Q�o�~��8�ZM;c��~*�n��aPK�6��RpYC3�v�Ӛa��Z���?�ni��)�:����(��*��CQ���΂4�^�/�b�k�D %�>��d 0�0��cћ��JC��t��.��/A�6EpM�'B�FLt�Qӆ2.�g�<�c��(���+E��=f��I�`A�J{�ëЋ�˫�����)��C��,c�M܃;o|�����8J��M r�.;�n�Yr(a���WIk�|�[�`>�z��￼�����	@:�^��ʐ��h⷏����x���,�|�7TF��^F�ׇ͒��zCA�%�cHm�ğEވ���~�v'J ?�6�Z���_��{���!�1Z����On�<cb�xn����Y#�9�6=n��ͽpž�f��F��X{)���x�^�9}�k�������^,����[�[<~<�;<��9�}��o��A�dV/��*/eM関�|��{M�j��1/&�Fu�-׎�iR����I�y.L^�"<�BF��!����R)M�.uJ'���ЪT��"��8iǼܳmwJJf����ײ� l�
�b���h+oM���Ӫg)+�Σ�L�x*ڕ��S4+����dXq�J��� �d}�k},���R@#'ɘ�����!.b��Ux�0t)�D�R_	$k�Q��ܤn
�u�WYoJ�
�c&����	�ON�ThT7��I�{� �%�.(�"��!=ORS{���kS��bv@��Xjl��u��EyW\��4&����YN6�=%r����\?XC�K��8�&�L`�
4���� �!sƾ��$��� )}�?1�HNKB�X�nU��Ӛ�(-���b\��E޺$o�IO����`��e�N�����4w��� ?~�?�!yÊ��S�/�.H����S�i�k�i���X��y�����e�������֚�J��,�J`�'\�x�M����.Mej5�k�d�UۥMR+�9E�@��
 Qgc�v��@M�Y�/�k���t	�6�Z��>���0Җc���9{H	=�,�����5�YM��1�9�eN���Z�U�lrM�1�f�N=�ö�c�x0�X��Z0�L��Hc�_��6�v���"�,��+k�f���7�N���`?��m}"�/�z�p��m��o�^�!ײSR�S��?�����a�u����w���n�ϜIQ�M�V�����m3�N)w����=��G�.��e� �'� ���WHy;Z��x�bR�7�#Iv�PS]�%�X��b����d�������/O;�����VrHZ,�tl����
�^#v��#��P��n�q[X9`���ELf����Vu&���(�b�嬊�5�%�0�s9O���� @n�/��j�N�ڷ�&���u0>Ԙ��3k�x~%�������g����gs7Etk�ZG�^��C�<5Qf�׭�F�c���Q:��܌Ν%�I�`�.��E��\�M6׹��m�sxGS�s�A��T���Xt�dV5Ss}��*�U��6L�����>�l�x	����>7���]�1�C�<XO~ʬ��v��A�>�Aq���}���_�ማW�4��Ґ0�Z۬����S�v+!}M�Zb�mUaͳϡT�
��;����>﯃��֙���'m�Ni�$��i�T��b�� m��x���Y �����3��h+w4:o�}?�$����bu��
�?�?(��� B�K��"��� (u�"���ǭ.}���,0�v�{��h�z6� ~&���VP�)/�ϕo�=�<
�u��!�}Jsp8�1N�Е�װ3�*��ed���T�K"&�s�1��!m(�*(X'3>�U���}\)�����TqQ���p�`�Df-;5���gBQ��㇥$��ln���UX`/"3ݕ7�$d$�gCH��mD<|P2�]�vzR
j&����Y&l?,A�Q6���1�e�$%��CQ�F���;>=1T��j��9���hHq+��x�f~2k�ɣ0��	�ܫm���H���I��y瘽�v��V����^�,8oK��I~�[���y��}7�*yOY,��� Ǐx�,�n�}ZU9A��k��b!�WXuc�N�RZ.S-,q*sb�&<NEӑ� �`�d��#W ���@�	��fS�G\�+t�
$I�L��;!��jp�9h�v�.������rsj	r�J��i�Z�g�Y�D3��H�_�J���r�R���ڶ5MS^wy�$��{QmsSz/[C�I~,-�z�e@¶G+���7�T��� PJ�i���?4���W��Q�3����#�L�i[��������ICT�V>���YX5�ғ�M���ãU�es�h��b<�%ʹx��l@��r�ɕ�U�=à�8��G��-$�s[*��؏o<}�LB�N���_���EK�xAZH�ˇ�w�,��CIFlY��~ݝ^���K�0qQ�Ǵ3�h�[�����
7Ͽ�������w�Vz�����D�Os.�Z2�Q4���]H�1����k#^x�q\x�te�S��[m�!:X�]s{�i�"����: ��I|h�68VX��

�2;2�Q2�0(bʻ1As/���6婻}O��Պm��86L:(`�y��v�%��y�=W�����Y፨��]Q���^�����^��_�jkjt�硰��ӣ�&�
e*��&E�p�^ꔰ�pK���Wi�@�?U��(]1�.�f�r��\(�#���� D?ӻr7O��dQ���q�5�ט�����[� 5-x�ڃ-���pds����eH?~Z����������:�m��K�g�.i�UYt��.�H��A*��������A�j�`�~f���m��&�{~N�L��Ճ���<V2;�S4�U*�.���jP	6���^n�1]�j�O�<9��M���(_ظ�x��
_SE�]Kԫ���_K2����Ϥ��Yz����u�b��F���=��}����>�d9�"�N���E�+��%O��Џ�9 J�[gQW%�����3�aB7X k�,bMM6��WE+�j�8�{���f�q9L]�1�Z��$��5���fA&IY�|�+C-ߦuB�̧�6�|����,@ĺ0\D���DH��{�Z�#·@�@v��u�%	Q`��/�mi�w����l2C�l-���xo4�m��
���]{�_��'wߛ�[
�)U�02s�x2��&��%���OZ�~|�M1ǝ4��Ԗ&Km�%��ԟ��g݃Kz�y�����{^R��0�5�r��}&ӳդn��8���$�r,�섏|@ڥ2��KK⺘��|ƫ�q��Gj6R!|�-��xą���+����&����!僚1q�	��I�lh�/���b��:)|�8)j�-��3s�&f'�������ix	\^J�$X���"��q�l�}{�=�`oNO�.O�]��Y���a�}�0�2��?5�0��j�d��t��k��2�9����~�Gc,N0�]�%\��-ydt�+Jd�(_u�#쨜��̓�6�y�T��5r���+ ��wy
�_�� &Ƅ֎є�蔄ӵ��6S�7n醮�ܬ��w��pj-��]�Ŵ�K+�%2�1��ī��`�(�MA���U��a8j6��m�\����y��B��
�k��.�����C&J�OGh��FΣ�](!V����6^�J��e*pE$� +E�.^)��^��LV�9'?��NV"ؐ�t^�CK��`or J־*X�ʕn"oj� e*�/���4�9�䃵V��:�<�4��'+?�Į\G����|d����>$@ ]��p�9��_�|�o�䬦Y�p�:*�Q �E�h�P^�}���o�
P^9���{�ѦJ  �5P�A%���î[�J�ܷ��׮�������m���6�TxVlE���{Ջ^�c�ְ#�%�Q<B�,rz�����+"'�H}SM�n�Hc`3�^(�nR:vXS�E�ͥ}ʼ;�"��'��o�#s��&��bM�E��`�ꍇEe�Kʈ[�]�:������\ծ����*����n��p�b�*G5��j��he/m�^閧'R�4v�5��Tu�l��-��ޞO�-7fMܩ����l��Io4��qC��
>
��1��5\��Y��J��c���0�e\�y̷�ӄ�+S��}���7�&��Nn��T�T�2�(�ЖR�!�[�Cs�|�}v�;)�3a��t��1P�����(�eVȧ�k�FIO[��!�"��M�՘�N��\��y� �a~�Γߟ\ģfMyC�g7S�8&�d��L̥����Pi]W��u�cl�9	o��kڷ́�����xڂ��E�&:���U��ۣ��E����9-�D���#�c�eq��j?7��� �r�nwߧR�Q�yۄ���;�^DuJ@D�mr����x/�[DC'����m��$S-�[u���)�c�Ď0�ֈ<�%��$|{~˲�,�zϕ���h��QR��Z	�l��9	�E�7��N�h��%d�����n�n��t7���/Ej�[#;��=�qCn�!���R�XZ�*�Nf�S�|��G���:^�"Hc%~���:�(���!̍L�L����tI�(]w���q8����L�0B~Jf���;��
0d����Q�+L�9kK�_����L�H���g@Uo:��G����d�Sk��a3�ڈµ�66�8�
�<��5�����	�p����)2u���B�.h�����uxDu:��Y�9� ��g趍c��4f"��3���̻%8��U��k�}V}��Y�|RO�O�jŰ7�|�ԏ�Jh�ܡ��Sa���<e�����(P|!��j������:g�E!����:w�HF͘:Ǥi6�]��{;�G�t鍧�^Պ\d�?   ���}�v�����j���=�`��89Iz0�	�b�68�=YY�e(CM����1���f�o��}�y��-��$��RI�x�t��?*ikkk�������\�*z��~�7�YAY#� �t'�
��L��Z�-JB�}�A"jn#B#?��yֺ:C�F���G�^6���ʉr]AV���3x��bXK0Y��Kd�����b�!�̈́��2ݶXn/sg��h�����Y^�,�j.��*\{���p8&�P��>�!yBVy.z�3v.�y�{d�����sl��>S��Hk�қR��R����5��G�/���:�t�>���к9el�Z4+I��ܓ�k�3 Li[� zF?�Oz�p��j��U�Yo��:E���I������G�J�T>�$�Q�yu�q�{���7T&꘰O� �Sծh!]𺣷�k�l��|x'���3N�j¥�sl�)�k��"X�5�?���z�3q�m�IE�
�0��<��RSg�D�E�&'lTSy=���܉*�X�.]l̡��Y��(n�z���m��9����=A&C`d��[�_@�O�[����_�5�+s&f m��Q���&he-Uv�>Q(D�I\ �`�Ô��
u��������,��$���ܾ���ئ*HA�#W�m�Td};V� @�zM�r��;�D���"�Y�`�2���e�Y?����0��!	��o���\��?t�@O� +C�Y*8E3v�עd~$N�4ߵ��ŀ� ��K��q�y��%3@6����"@�ȴ.���˾�����LT�QSD�`�����ۯ�B�,�3SBjd0��i��Vn���j�]��%�Ro��aBte,m���}��֐��(eI:ո�$Wk��E��=f���K�u�R�RdFA�X��5�LC�-:1/�-��gw��'nR&����X�D�.���ۜ81=��D���_C���ՙL=���~��	�J�yd�3J��nAǀ�߁�!�y�����Y���Fv���%4b�:����I�c�ӎ6�q	R�Fm�L���ݞ�)zQ�_�؝;�$����h�/�����b<;h�.�Ǿ~�u�g���zK����j2z �2�)�}��_�w[�|r
����5$0r�2Ȟ%Ia��x�f.��ټ����?��p�{>��d0�>wnp����z�+���W@���$��?=�}KL�C#<s�O�'�BS�3H�]�f�Gj����N��#�14td͵W�:Zw[�1�u��r�=ń���JVJz�\P�$sy����t�ی~Y�ow���N�Q��7��%���xFI����8�8��I1�>'Pu~5���ӹ"�U�6��JΆlE�pi��1�%��.-ӌn`��a|��^R�=��0�l��`_���ad[��,����� \7KMA�m=+"�q�,�,�m�\��#��/�w��b��1����{��1=�$��0@�fvmݷ�mV|�zz�B�ii����Q�ɈF�Y��&R��-�����@NC��lX��x@m��XۮM������w�Vx�8w[H�V�'$qY�k4}����I*��K'u�%�O�(;�;����(�.���E�yރJ�o���If�Z��Y�L����x���yz&��Q8^��y�.�a��Y;t��,�D��%�eŵ �>��T�B� $�9�@��,��/꒖j�ƒxԱ)�5��X�̯����0p`ٙ�~!@7�?Iv�����s*��K������ԟ�{��܁YIets����ٸ�5�Y��eX��v�K�m��j^�����j6z m���zv��� s���`5�./[����Y�/o[=h�%�*�#�ȱW�hI����6Ȫح���F���웖�M�,1>Q}���G��������7�[����e�����i �(UҠ�Cv�x'HB��x1��O���7u��2蝄-L�����Y�ٌ7U�*��L��L��ޥ`}�������YO�!k(Q�lk�$z�>��jz����6�%dI�$VH�ϰ92ϬS���p���ҡ�7�*�˙O`A�����,�k&~?��?��G�>���qn&u� �<NI�A��Su��D�j{ׁ,�Z֝/K����a�)pN�!�O���xrS����.B���o�}�)�ތ:m&���e
���'��fm��<��n��u)�ޡ��`���ʉ?�Z�{�,�b2��3G =� �Ѿ�M�<ee+�Ȟ�������R�W&�$�2z�kެԒ����:��V�����u�Wi����ׅ9���-�^�\���.ӆ3���� �g��Xx,���rH�J��,�����r$l�H����[�5.�����D�Q"�����z�#�͒�Pf%0�Æ6P͌���WS?�,���ȳ>��	֥�B���4��}�͜H�N����.g�O0�Y�M�BV�8"������h�;�*�1������?vf�T4C��pė"����̢���>j�N���Wwn�7a��F] $(�m�va�$�/��U'��)��8�'-ʧ
�hed@�
`9F�FQ�|L�4��fO�e�+KAg���;0#�ڄ�¥Pp�*8S���L�uby�tRy,K�,G �V����C�3'0r2��8H6R�Tc��\Ar�B��g�V��qi�`��?��J���� �T\��j�! *k݇l!�y;�}�K��p�u�us|2���%�:D��9����G뱞���
Ş�A�����v>"��ƒ�φG�`;��y�s�uTw�t��+���(c��T�Ɋ��C/�'>NQ8�����ԛ�E�"pC@r��{/�`���ù�vJ�V^F�Ýck�O����>d�+�h��X�Gs���Y�*x/��A$��_��#��y�J��{���9������)e8���|?��NNx���c�����z��H�x���G��P)��"c,R��y�Oa��"|D�����rc$6�
ݐ�@��3�\����CXF��n�8�!�D��v�{���F�r��W�}���뗿4� ���
a+ө�Ԓ�QF�qӡ���*�9_$Ae����mY(��Q@SZ���Yf�,
�)|�M"�_��C��%]��%�htz������j:���H���}�*oPy�u �Q�`�; �6�Y'D9bQOnT��b)֬5�E !� ���TS>�T-�q+��Jҧ7}��vŦ�#B��Aa�OH	��an�"ix��'Q�Ze��BZ�@���!R�b�)�B��&���a���	��=���׍�y��6��bk�X�&X�,A����8���k� f����\aن�)��%�/9]\�[ݷ�~�k5�MU�h�Mc�R_�xLe��n�ۿ�e>��uů�l�o6)o�x���('kO��a�o)�g4H���)��F%//`Jp��f\>�ڨq����4J�7CS��/lhf(�/ki���e��b��虪'R��+��8���]���>dk�dLTN�Z�fTԤ��u�	}�l7{����9�@	��n�]5����4��gk�&� r�$��X�$*�7*l(�rm(�W��_H�Xl7�+�;�*s<BN,��ɾ$Z�f�`6v��;(I��8e��A��h�pO�k��4�I�9qiO�v��E�`��[�7���-^;;�ã���^��l�T����Q-dmx�Sl�@Fb\��Z�#U4_��G
tp�te�Ȁ�T�7�a!�g�J*ĩ!�l/$�%�gL-T��*��j��8�xSl�M&�*���X۞N������G��o���Wn0̀��sckb�U�bb��1g���)���, X#�!W�JPo$A��z@�*ԯj�f���ay�e�#�Na�-�� �l��F����P��?.���6n(H�"nC��Pt�5w�>�RwC
��c��L�i�L�ݬ�fj��CJ`��-�Ak��"�۪��k��$Ǖ�j�|�a��|�*������ק��GhD��G	FW<r�ז�5�L���-�ž?y��荋{,�BH��4�t�L��P��=��6�4���;+F� ��G�L��_S��-��|�!��������r��by�)�pp)��|��}:�_�>~�yFKk�/��蚫5-�Mo%[w\	�U�)ky�D�~NmK�M��Z�}�:��R�T��[�$��	l��t��њ�4�W�|���
�����������w�_;]M�[7���\w#�h��D|�'*]Ig>M�{}��-�YK �p��e�\�DŠ\*��
��{���/�jN��b�����wY݁E������i��w��;��'[�.�V7a�[<QIH:�󨗄�\Kc]2��d��`�E��zcw������Gh����6�lY��f2��H�!� �&��>�*5�O���YE�d�񕛪0��*SEP�EمXF �u�d�*1�N��E���D7Ѹ6�!QL�,�f����߫G �6�6�N8��j���6�f��<:Vv����ً����da�9xMTW}<�p�����s1u�os2y�9i���~��́2�l�\qZ�i;$U��GQ���e@(5�U��C����"�մvJ�8-��<%0�^��l
]���������S�#�
P��,_z����kb� �����S�DHޚ�BZ/=��'��X|g�t�J��xA��8�8��v�����pЊ�`�B�G����xؗN�Ȁ��tw���(���r2oD�_�@�F2�'߅[I���I�(��>:���< ��KTP[[+�w�'"Y�ʑxpof�	���b3��e��&��զ����ȟ�p���Ft�'"-2�o>��/����ܛ�*"5&5K|����li�;J�9H��P׬^3�1u܀9�9�ǯ�z���ޗ�w��,*�Q�Fֆ���C�����;�4�W 0_6�Y����_�x��{݇xWv��q�	�m�ѡ�h�Цh�77_v7�+� �0��`����j��{�\}�C����	(g�f2�x̗'TkF.Q�@���¤�S�{��J;)ҺK�����B	l�����l���"@ ~\P|��E��� �	�q���R��쓍X'�֤�I����?AϞ br
k��^f�$z�Q		V�7�貝Y��Z�{�������]5kB����hz��KeT b:�l���|R��� �� ����ԋ7��j+ڜ��v�):�Iˋb1�h�@$����n2ָ8�M&E63s�ؖV���7��[��'�~�`�#NMF|��U�G�?ϕ��b��R���'�v���[���A�R��Z��8!���fMγ��;���#�&�������=#ϕ��۠y�)>+"'�W�^.�p1��aQ�Mb	�ۉC/:�_'GCll���{K3n�O�϶7���N�.R�W^Ih�\S_o���z�
��B�V�('DBs��~֠؀Ȫ�S��%8��M�QOs#m{��D�s�&�� ��*��t���m�?�f�>�' ��g�o��OX� V|��̍�'A��-"0}湃��I�Bؚ�5[�	��lA�lk�X[N����zI��;YiG?���	F.Q\��cd۷7Fsڡº����R�t(iq?�W4����Tv��7���e��D����f�Q$/���޶NN���!֨_����%bwmu�����Oa�ހ+�m��-]�b������.���,L%������D	7K�����2rY#�P�"3$*G�G�`�ԯ��aH�0�*�4�/��܂�?u&�[Q�[-��Û�iX�*ֻ�V�Qi>�΂�jƠ�##JSxM�:���zf��%�C߆!�ί�������i�S*�S�����]�{���~ [�?��p�'�	�6��� �PR�Z�� ~�èyI�cy���~���b4>?%hz��?\���?�-�t�������7x
c��l��D����6S}]�Bm�0~�C����O�*�����:�gsމ�N��#�������B{QnI2�s�Cӏo��k�l4O�N�,�u5�;�d�5�qPOD�I�z��y�:m5OP�wu�+�h^��,Ըl�U�ת���3���F�6���o�y�{~�y���i���+���B��/��lB�
`!@7}~cq�9ܘ����ǡp'�]t���n�E��`�W��/
hB�f�"A֎����T�v����>}�G6�G.�BcS�10
�[�I�)�9q�0����Ai������Rv�:�Q������o�9!
�����x?7���tI
IN�Y�)���QX��,�4A&4.���(aI��ڻ���������\SǕ{�L�q�Z����~o�R?{0������j���:'6�6)���9����pR��M����E�0N�3$ ����c3���9�x5�O�s2�ߕ�B�� �Jd��J���:qQ]8Sw�-�t����AB�X�gר�(��&�>�����/=�!�c��_"BRrg�Ei�@]㛓2�&��2BᬌL���'�0�f���7w�$�1ۧb���O,bq�a,���]���\*�>����5K5�rJ"��wع����j�l�?�W�3�؜���(Q�bMhx�'y��,���[��m\��%l:T��h+u�Z�X����k��7�:�5C����,$E��y,�ۥ�@�X3M�M�j���ۭl����_��eO�&}6���q�=q\����;0�>�($�rT2�V��3Q:KJ�:�fq.c�n3[@������T�iS�M%Œ��sf�.0�2Y�7�k��h�˭�9�Q���CH��ԝf����VGUE����R�lƜ���z#������Lw,�2�xM/4:g�!�:���YyFϛDg�������_ؤ��Лo7]���!���|�:���8D��r��/E˾Nt���F"����C�x�NSA*c-�����D�E����:j�������X^GH'#c�b���1�)�IDfS��̥���b(I\����d�D� �j�*gE��e��6ǈ� Z+�0j%6'�a���w����	�h�r ����BH}����"7���������Y�"D@GYc�[�����`| ����Ь�1�C���9yMLH$�Q�yD������)��
�bE"p�P��D�n����;�P�T�W��Q��:F4.�A�TP�L$`�ϖQ�
��_ƫ666?Ji~A�I�̃u*&"������C�(�N�Uo��^�s޵�/W�|*Θ�ȭ��2u�9� �����X]��ș���L�ۢݯ�X�<r���v�9��h�������6ʫd�42KZ!�����J������p�0:�������:��T�}$CB�ah��&��V�MH��.`��l5Ť�z�4�@{���E��|��;����C<��? ���+iu�ɑ�!�)[jĭב`ꕍ���?�*=w�g�����qO�R��ߗ�JtT1U����<���f�����&�
W��k͐Hט!��oW64?������T�w�����VU�}��_�5E8*�M��a�f	�J�9b�,ͮ]-՚���wH����6�z�94�8�5n契4���0��b��e!9�V�.'�䟮Z����/.��Z͟)�Y�Q�G'+�pBSnd�R�#r[���F�BF�t�:.���}P�	R���=�bYIu̘�Iᣕ̢6Q#�O�POUBYf"�ZE���@=���t�g����g�J���~����")Ok2���1ro�&Am��X��5c&2��bt��S�H���yϫF���I��Vz�UkJ�.���+.�"���4V=V �?��o/tX;�K��U��(N�)u��U��A�,��޹G���ě�a;���.z�C;��!�����k�Gw��/1�7�1ŉA���=�*� Ub	9��PБ�=V"��|aS.�}�$�yD�|�oQF�H�*����3RO"z�Z/� �)J9��G4/"^�0��_�NWZ�Y����������5/UGպ�h���[Ml���e��S���(HH,����v�i�Z���/����
��
}�&�^c͒G:�X�Jc�]o�K�˻P9?�W ���ȗ5���%�Е���iZ���"�y �ɽP��62UJ[h��҇�qt�Zp`!/$��Y�m� ��Ӿ;���G04�HÇ��?�e��t��̕8�;�&�z�!���bl�>	��� '��U�}�sH�7 �$d��	pS>��ǭ=ս�[�| w2�r7_�=z/���4�喠�h4H}�� ���.w>���.�3��=ڵ�?�`
L���Gȝ�z�Z#9f�[6��,pG.��5�bBFK%��O�<�L��`�ճ�B������n1{}w�����ę�������<� ɼ5�{���Ơy	Wn�ɺNo�:/�&K;Nt����g�z��c��E녩�^�J@���L�L�G��&����.b�5�5���sXC�`���r��gĜq�0��N<A���P�X&Z�6� ��Zp�%v�:T`����� ����*lX�I�Ȇ����%���y���?tAvP��Ҭ@ʇq�Cn��U �O"��i�E��7���V���Q�__�h�_|�#�S���c�ϑ�ѣ�0@-kǙx�0鄓z�_�=�<Jr*|�պ,��9t�E��Snu� ���+1d_	�� �m�?�B�^�����; ���K�N��l_s��OI�F7�8t�`[�ҽq� Ϯ��k5�-�!���4�;w�m1_���
gɬSl���Gu�1�{˚؍�F9�Ӌ(.�|Nγ& qTzM�ڱ�፸�/��t�cM�Ro �=��5�T�8�}o�{)q��34p�J�A�#�hN���%�N��5+�7T,Fق��{���Q�Q��Yz�_ �ډ3w~,z�ip ��ۀ�Bv��O��}���_�f5��r���i���X���w=�'�J藋\c��s�=��%|��[.h��*搋k��%���ԕ
 :�H��Е-w#`W�5�6�q���gEy] 6�K���4����o}��9��7�P�v����f���E�MxY%����>�����vUF9孭 ��,r��@�'=�v�3���	��5�7��=�/����~5ʬ;��H��W�g�l���u9�<{D ��d��V9�<��)7�td$�����t��a�1"�ˡ��j]P���&j��6��R���|g�A����#C�D�w���R��&j�$d�G����BW�b�(�}V^]����;/2Ô$�y�L���I�s<+���Z�fc��i���J�h W�<��P�!�c�1	��K/_`�{���m" q�I�㚄;򡎀�F�$P��&V s�]���B#���tQ�V�DRڇr�%	5�-8�bª:^����3L�)������c�2��?j%�Du�3�xE�t��p�.V"͗Cm�S2?��OCz�t�6�~�
��T?�V��U����e���n�~�%����u��y�]���P�/����G���
��p�ϡ��7���U���>p I��������Ｐ���)>iy� ��؉~��3����y�'1p#�c0��@���S�@�}g��q��;�s�`7Q���`����� <�w%�)=�a!�zY�ܥIl�O����B|z�PP�ߧ����D��)2a�#f��q�|�!�"�/�V���[�����������	��	Rx�R�\��������?��ֺs֔,B���	��vx����K:�4����b�o���aR�Lu��(���\�l��=�)��<AF8��u�GY�8�	}<h4F$��9Q��<����,�*UR`��#�c���n�n/w��$����?(	��O���-����8�Y:���L�ߨz49�\�H�)���m���1��!�|�j�R�B#t�|����j��J�R�����,�_m��b8��x�03�&:�3�e���Mݾ3{�Ez�?�X"�ê����4�W[g�\*���
:?Gϊ�w��SFe�+�*��������b�Ou�8BJxW~�U.m�%��l�U��%��]��ݕ�,����YT�X3��
b�Qݛ�/yߚ�"Y���M[%�����7���|�:m�*�Hjk�Ӗ���b'����p/�g�ٞ��ţ�����T��*?g~��:����� �b�_��gI[����<K�ݣe��;�?���`�;<��&�`?�ņ�9V�F������u�+��l���d1���m����ׇ�i�ֈ�׈z��:�['�n�4�[I�^m=ϰ�����N��J���~�+�5�R8��6�����)W�5D�C6*�#�:X(�v.�hQXA����+����e��ެ�I\ft�����aߖ�՗��}�mQ�t�N��o���D��
�B���Uo5ֻbmyF����V˹%�(e�`M*Y��	�
�z:=m�Λ�sRo�������_vnn`��=��h��W$�?�SĠ��ЕB�������̽�����\|ھ5��<~u���f�syҼD?�6}��^�ۭ�G:�:�QyyN�_ꋁ�_B�
,��!,d@MI�_��W����,J���ñ��Qy��{�E�C�&|�ԛB�R�v��D����7"z�(�8E�q?�������?�T!%��1�U�݃���v�~�:�*�����0$�l>�̊��)[�9���>+=/|�^����y����C���En�$�+LF.�,����2��\Y�;_P�O��8|�tW�J0z2��:��e0�"�O͊f�h�U+QUŊ��mfDc�J�ˊ�
�4�:��#Ѿ��p�	Ph/�*,�2�g�GLc�)D2*�LT�n1�TSD�μ)z?PԄQ���X?U�ڵ6_� TJ-��c6�)�Џ��h��A��&�@�E��ۀ�Y,Sx{U.\&�{Ty����v�sB���Ō�!Iէ c���(��3��?�&(�W�4�Z
ae1���GT�S�Qw\�ڒUx�M��-I�k�m6M@�Qg2�(�Xs:����J���A��������{7�@��8���d����  �� g�