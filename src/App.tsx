import React, { useState, useRef, useEffect, useMemo } from 'react';
// import Browser from './components/Browser'; // Suspended
import { 
  Mic, StopCircle, Upload, FileAudio, Image as ImageIcon, 
  Brain, History, Download, Play, 
  ChevronRight, Sparkles, Trash2, Settings, UserPlus, CreditCard, Edit2, FilePlus,
  ChevronUp, ChevronDown, Bold, Italic, List, CornerDownRight,
  Database, Zap, Cpu, CheckCircle2, XCircle, RefreshCcw, ArrowLeft, FileText, AlertCircle, RotateCcw,
  Sun, Moon, ArrowDown, PlusCircle, Copy, User, Users, Clock, Lock, Unlock, Shield, ShieldCheck, AlertTriangle, FileDown, LayoutDashboard, ListChecks, Bell, GraduationCap, LayoutGrid, Home,
  Pin, Edit3, Share2, Trophy, LogOut, Plus, Menu, Camera, Monitor, X, Activity, MessageSquare, BookOpen, Calendar, Send, Save, MicOff, Video, AtSign, Paperclip,
  Search, Check, CheckCheck, Info, Volume2, Square, Mail, ArrowRight, BoxSelect, Globe, MapPin, Terminal, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged,
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot, getDocs, addDoc, serverTimestamp, orderBy, limit, arrayUnion,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  FirestoreOperation, handleFirestoreError, circularSafeStringify, sanitizeData
} from './firebase';

import { AILibrary } from './components/AILibrary';
import { ChatRoom } from './components/ChatRoom';
import { ClassRoom } from './components/ClassRoom';
import { CommunityPage } from './components/CommunityPage';
import { ToolsPage } from './tools';
import { 
  LoggedOutLanding as LoggedOutLandingComponent,
  AnalysisLoadingOverlay as AnalysisLoadingOverlayComponent,
  EmailPreviewModal as EmailPreviewModalComponent,
  AIChallengeModal as AIChallengeModalComponent,
  PremiumOnboarding as PremiumOnboardingComponent,
  PremiumModal as PremiumModalComponent
} from './components/AppComponent';

import { 
  UNIVERSITIES, FACULTIES, DEPARTMENTS 
} from './constants/academic.ts';

import { 
  getUserRank, getScholarTierInfo, getScholarLeagueInfo,
  getApiKey, getHfKey, getAiInstance, getHfInstance, MODEL_NAME, FLASH_MODEL,
  formatAiError, robustJSONParse, isHfDepletedGlobal, handleHfErrorGlobal,
  isOpenRouterDepletedGlobal, isTogetherDepletedGlobal, callOpenRouter, callTogetherAI,
  LIMITS, PAYSTACK_PUBLIC_KEY, compressImage as utilsCompressImage, fileToGenerativePart,
  Course, MediaFile, ChatMessage, ChatSession, LectureSession,
  QuizQuestion, ExamQuestion, StudentResult, RegisteredStudent, ExamConfig, HomeHistoryItem,
  HF_MODELS, OPENROUTER_MODELS, GROQ_MODEL, GROQ_AUDIO_MODEL, handleOpenRouterErrorGlobal
} from './utils';

import {
  WhatsAppIcon, helpContent, HelpOverlay, BlinkingBrain, GeminiLive,
  IconButton, MarkdownRenderer, COMMON_COURSES, CoursesTool, AssignmentSolver
} from './subComponents';






/**
 * NSG (Nuell Study Guide) V4.0 - PROFESSIONAL CBT & AI UPGRADE
 * \u{2705} Professional CBT Infrastructure (Exam Lobby, Info Page, Exam Engine)
 * \u{2705} Admin Backend Control (Score Sheet, Timer Restart, Results Download)
 * \u{2705} Advanced AI Chat (Copy Response, History Sidebar)
 * \u{2705} Enhanced Quiz (Customization, Deep Assessment, Report to AI)
 * \u{2705} Paystack Payment Integration
 */















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
  // --- \u{1F510} AUTH STATE ---
  const [user, setUser] = useState<any>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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
    matricNumber: '',
    dob: '',
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
  const [activeTab, setActiveTab] = useState<'home' | 'ai' | 'tools' | 'profile' | 'notifications' | 'exam' | 'chat' | 'class' | 'community'>(() => {
    return (localStorage.getItem('nsg_active_tab') as any) || 'home';
  });

  const [communitySubTab, setCommunitySubTab] = useState<'quests' | 'rankings'>('quests');
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    if (activeTab === 'community' || (activeTab === 'profile' && profileSubTab === 'stats')) {
      const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(50));
      const unsub = onSnapshot(q, (snap) => {
        setLeaderboard(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
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
    localStorage.setItem('nsg_active_tab', activeTab);
  }, [activeTab]);

  const [toolsSubTab, setToolsSubTab] = useState<'menu' | 'record' | 'live' | 'quiz' | 'exam' | 'faculty' | 'assignment' | 'courses' | 'notebook'>(() => {
    const stored = localStorage.getItem('nsg_tools_subtab');
    const validTabs = ['menu', 'record', 'live', 'quiz', 'exam', 'faculty', 'assignment', 'courses', 'notebook'];
    if (stored && validTabs.includes(stored)) {
      return stored as any;
    }
    return 'menu';
  });

  useEffect(() => {
    localStorage.setItem('nsg_tools_subtab', toolsSubTab);
  }, [toolsSubTab]);

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

  useEffect(() => {
    if (isSyncingFromHistory.current) return;
    const currentNavState = {
      activeTab,
      toolsSubTab,
      profileSubTab,
      communitySubTab,
    };
    window.history.pushState(currentNavState, '');
  }, [activeTab, toolsSubTab, profileSubTab, communitySubTab]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
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
        
        setTimeout(() => {
          isSyncingFromHistory.current = false;
        }, 50);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeTab, toolsSubTab, profileSubTab, communitySubTab]);
  const [readArticles, setReadArticles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [blogPosts, setBlogPosts] = useState<any[]>(() => {
    const cached = localStorage.getItem('nsg_cache_blog_posts');
    return cached ? JSON.parse(cached) : [];
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
    
    const limits = isPremium ? LIMITS[type].PREMIUM : LIMITS[type].NORMAL;
    const currentCount = usageSnap.exists() ? (usageSnap.data()[type] || 0) : 0;

    if (currentCount >= (limits as any).DAILY) {
      const displayType = type === 'QUIZ' ? 'Quiz Engine' : type;
      setUserNotification(`Daily limit reached for ${displayType} (${(limits as any).DAILY} per day). Everyday is a new day! Your limits reset at local midnight on ${today}.`);
      return false;
    }

    try {
      await setDoc(usageRef, { [type]: currentCount + 1 }, { merge: true });
      return true;
    } catch (e) {
      handleFirestoreError(e, FirestoreOperation.WRITE, usageRef.path);
      return true; // Allow operation even if tracking fails temporarily
    }
  };

  // Auto-close auth modal when user is logged in
  useEffect(() => {
    if (user && showAuthModal) {
      setShowAuthModal(false);
    }
  }, [user, showAuthModal]);
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
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '', color: 'bg-white/10' });
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareName, setShareName] = useState('');
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showGodMode, setShowGodMode] = useState(false);
  const [godTab, setGodTab] = useState<'dashboard' | 'users' | 'groups' | 'marketing' | 'blog' | 'reports'>('dashboard');
  const [reports, setReports] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [godModeNotification, setGodModeNotification] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [legalPage, setLegalPage] = useState<'about' | 'terms' | 'contact' | 'privacy' | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    // Keep local for immediate feedback
    setFinishedHistory(prev => {
      const newHistory = [item, ...prev].filter((i, idx, self) => self.findIndex(t => t.id === i.id) === idx).slice(0, 50);
      localStorage.setItem('nsg_finished_history', circularSafeStringify(newHistory));
      return newHistory;
    });

    // Sync with Firestore
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'studyHistory', item.id), sanitizeData(item));
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
  useEffect(() => {
    if (currentUserData) {
      const isCurrentlySubscribed = currentUserData.premiumUntil ? new Date(currentUserData.premiumUntil).getTime() > new Date().getTime() : false;
      const isGod = currentUserData.bypassAllPayments || currentUserData.bypassTakingPayment || currentUserData.bypassHostingPayment;
      const effectivePremium = currentUserData.isPremium || currentUserData.role === 'admin' || currentUserData.bypassAllPayments || isCurrentlySubscribed || currentUserData.subscribed === true || isGod;

      if (effectivePremium || currentUserData.bypassTakingPayment) {
        setIsTakingPaid(true);
      } else {
        setIsTakingPaid(false);
      }
      
      if (effectivePremium || currentUserData.bypassHostingPayment) {
        setIsHostPaid(true);
      } else {
        setIsHostPaid(false);
      }

      // Premium logic
      if (effectivePremium) {
        setIsPremium(true);
        if (currentUserData.bypassAllPayments || isGod) {
          setPremiumTimeLeft("GOD MODE ACTIVE");
        } else if (currentUserData.role === 'admin') {
          setPremiumTimeLeft("ADMIN ACCESS");
        } else if (currentUserData.subscribed === true && !currentUserData.premiumUntil) {
           setPremiumTimeLeft("ACTIVE");
        } else if (currentUserData.premiumUntil) {
          const until = new Date(currentUserData.premiumUntil).getTime();
          const updateTimer = () => {
            const diff = until - new Date().getTime();
            if (diff <= 0) {
              // Only clear if other premium flags are false
              if (!(currentUserData.isPremium || currentUserData.role === 'admin' || currentUserData.bypassAllPayments || currentUserData.subscribed === true || isGod)) {
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
  }, [currentUserData]);

  useEffect(() => {
    if (showGodMode && user?.email === "nuellkelechi@gmail.com") {
      const unsubscribe = onSnapshot(query(collection(db, 'users'), limit(100)), (snapshot) => {
        const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
  }, [showGodMode, user]);

  useEffect(() => {
    const q = query(collection(db, 'blogPosts'), orderBy('timestamp', 'desc'), limit(15));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBlogPosts(posts);
      localStorage.setItem('nsg_cache_blog_posts', circularSafeStringify(posts));
    }, (err) => handleFirestoreError(err, FirestoreOperation.LIST, 'blogPosts'));
    return () => unsubscribe();
  }, []);

  // --- REAL-TIME SOCIAL FEED & NOTIFICATIONS STATES ---
  const [personalNotifications, setPersonalNotifications] = useState<any[]>([]);
  const [globalActivities, setGlobalActivities] = useState<any[]>([]);
  const [homeFeedTab, setHomeFeedTab] = useState<'personal' | 'community'>('community');

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
    }, (err) => {
      console.error("Error loading personal notifications:", err);
    });
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
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activitiesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGlobalActivities(activitiesList);
    }, (err) => {
      console.error("Error loading global activities:", err);
    });
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
          
          if (Notification.permission === 'granted') {
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
            
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then((reg) => {
                reg.showNotification(cleanTitle, {
                  body: cleanMessage,
                  icon: '/icon.svg',
                  badge: '/icon.svg',
                  vibrate: [100, 50, 100],
                  data: {
                    clickAction: '/'
                  }
                } as any).catch(() => {
                  try {
                    new Notification(cleanTitle, {
                      body: cleanMessage,
                      icon: '/icon.svg'
                    });
                  } catch (e) {
                    console.error("Foreground notification fallback error:", e);
                  }
                });
              });
            } else {
              try {
                new Notification(cleanTitle, {
                  body: cleanMessage,
                  icon: '/icon.svg'
                });
              } catch (e) {
                console.error("Standard Notification standalone error:", e);
              }
            }
          }
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
        matric: editingUser.matric || '',
        email: editingUser.email || '',
        dob: editingUser.dob || '',
        university: editingUser.university || '',
        level: editingUser.level || '',
        department: editingUser.department || '',
        faculty: editingUser.faculty || '',
        isPremium: !!editingUser.isPremium,
        bypassAllPayments: !!editingUser.bypassAllPayments,
        bypassHostingPayment: !!editingUser.bypassHostingPayment,
        bypassTakingPayment: !!editingUser.bypassTakingPayment
      });
      setEditingUser(null);
      setGodModeNotification("User information updated successfully");
      setTimeout(() => setGodModeNotification(null), 3000);
    } catch (error) {
      console.error("Error editing user:", error);
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // --- DAILY STUDY QUESTS DETAILS (Dynamic 10 League progressive tasks!) ---
  const dailyQuests = useMemo(() => {
    const points = currentUserData?.points || 0;
    const leagueName = getUserRank(points);

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
          targetSubTab: "voice"
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
          targetSubTab: "voice"
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
          targetSubTab: "voice"
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
          targetSubTab: "voice"
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

  const handleQuizImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxImages = isPremium ? LIMITS.QUIZ.PREMIUM.IMAGES : LIMITS.QUIZ.NORMAL.IMAGES;
    if (quizImages.length + files.length > maxImages) {
      setUserNotification(`Limit reached: ${isPremium ? 'Premium' : 'Free'} users can only upload up to ${maxImages} images for quiz generation.`);
      return;
    }
    
    setUserNotification("Optimizing study attachments for quiz compilation...");
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
      setUserNotification("Attachments optimized and embedded successfully!");
    } catch (err) {
      console.error("Error embedding quiz images:", err);
      setUserNotification("Failed to process some attachments.");
    }
  };

  const removeQuizImage = (id: string) => {
    setQuizImages(prev => prev.filter(img => img.id !== id));
  };
  const [quizDifficulty, setQuizDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Professional'>('Medium');
  const [quizQuestionCount, setQuizQuestionCount] = useState(25);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizState, setQuizState] = useState<'idle' | 'active' | 'finished' | 'review'>('idle');
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
    }
  }, [quizState, currentQuestionIndex, quizScore, userQuizAnswers, quizQuestions, quizTopic, currentQuizId]);

  // Notebook state
  const [userNotes, setUserNotes] = useState<any[]>(() => {
    const cached = localStorage.getItem('nsg_cache_user_notes');
    return cached ? JSON.parse(cached) : [];
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
  const [notePreviewMode, setNotePreviewMode] = useState(false);
  const [isPodcastActive, setIsPodcastActive] = useState(false);
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
    ...unfinishedQuizzes.map(i => ({ ...i, title: truncateTitle(i.title, 12), timestamp: Date.now() + 1000 })), // Current items at very top
    ...recordingsHistory.map(i => ({ ...i, title: truncateTitle(i.title, 12) })), 
    ...notesHistory.map(i => ({ ...i, title: truncateTitle(i.title, 12) })), 
    ...finishedHistory.map(h => ({ ...h, title: truncateTitle(h.title, 12), timestamp: h.timestamp || new Date(h.date || 0).getTime() }))
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
  const [examFinished, setExamFinished] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});
  const [currentExamIndex, setCurrentExamIndex] = useState(0);
  const examTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by updatedAt desc locally
        const sortedList = list.sort((a: any, b: any) => {
          const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
          const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
          return timeB - timeA;
        });
        setUserNotes(sortedList);
        localStorage.setItem('nsg_cache_user_notes', circularSafeStringify(sortedList));
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

      // Gather actual contents of attachments: images multimodally, text from documents
      const attachmentParts: any[] = [];
      const extractedTextPieces: string[] = [];

      if (selectedNote?.attachments && selectedNote.attachments.length > 0) {
        setUserNotification("Analyzing actual document content & images for podcast...");
        for (const att of selectedNote.attachments) {
          try {
            const fileUrl = att.url;
            if (!fileUrl) continue;

            const res = await fetch(fileUrl);
            const blob = await res.blob();
            const mimeType = blob.type || att.type || '';

            if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
              const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const b64 = (reader.result as string).split(',')[1];
                  resolve(b64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });

              attachmentParts.push({
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType
                }
              });
            } else if (mimeType.startsWith('text/') || att.name?.toLowerCase().endsWith('.txt') || att.name?.toLowerCase().endsWith('.md')) {
              const txt = await blob.text();
              extractedTextPieces.push(`Actual Content of document source "${att.name}":\n---\n${txt}\n---`);
            }
          } catch (e) {
            console.error("Error reading attachment in podcast gen:", e);
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
        const parts: any[] = [{ text: prompt }];
        for (const p of attachmentParts) {
          parts.push(p);
        }
        const res = await ai.models.generateContent({
          model: MODEL_NAME,
          contents: [{ role: 'user', parts }]
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
        model: "gemini-3.5-flash",
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

  const saveNote = async (content: string, title?: string, noteId?: string, attachments?: any[], podcastDialogue?: any[]) => {
    if (!user) return null;
    
    const noteData: any = {
      uid: user.uid,
      content: content || '',
      title: title || 'Untitled Note',
      attachments: attachments || [],
      podcastDialogue: podcastDialogue || [],
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
        let finalId = noteId || `note-off-${Date.now()}`;
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
          localStorage.setItem('nsg_cache_user_notes', circularSafeStringify(updatedList));
          return updatedList;
        });

        const offlineNotesData = localStorage.getItem('nsg_offline_notes');
        const offlineNotes = offlineNotesData ? JSON.parse(offlineNotesData) : [];
        const updatedOfflineNotes = [...offlineNotes.filter((n: any) => n.id !== finalId), tempNote];
        localStorage.setItem('nsg_offline_notes', JSON.stringify(updatedOfflineNotes));

        setIsSavingNote(false);
        return finalId;
      }

      if (user?.uid) {
        updateDoc(doc(db, 'users', user.uid), {
          dailyNoteUsage: increment(1)
        }).catch(err => console.error("Error updating dailyNoteUsage:", err));
      }
      let finalId = noteId;
      if (noteId) {
        await updateDoc(doc(db, 'notes', noteId), noteData);
      } else {
        noteData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'notes'), noteData);
        finalId = docRef.id;
        // Update selectedNote if it's the one we just saved
        if (selectedNote && !selectedNote.id) {
          setSelectedNote({ ...selectedNote, id: finalId });
        }

        // Publish to global activities feed as completed class study session
        const nameHandle = currentUserData?.username || currentUserData?.displayName || 'Scholar';
        addDoc(collection(db, 'activities'), {
          type: 'class_complete',
          text: `${nameHandle} completed a class with four others, start a five reading streak with ${nameHandle}`,
          username: nameHandle,
          userId: user.uid,
          userPhoto: currentUserData?.photoURL || '',
          timestamp: serverTimestamp(),
          topic: title || 'Studies'
        }).catch(err => console.error("Error creating activity post:", err));
      }
      return finalId;
    } catch (err) {
      console.error("Save note error:", err);
      handleFirestoreError(err, FirestoreOperation.WRITE, `notes/${noteId || 'new'}`);
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
    }, 5000); // 5 second debounce
    return () => clearTimeout(timer);
  }, [selectedNote?.content, selectedNote?.title, selectedNote?.attachments, user]);

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
        
        let markdownTag = "";
        if (file.type.startsWith('image/')) {
          markdownTag = `\n![${file.name}](${finalUrl})\n`;
        } else if (file.type.startsWith('audio/')) {
          markdownTag = `\n> \u{1F50A} **Audio Source Attached:** [${file.name}](${finalUrl})\n`;
        } else {
          markdownTag = `\n> \u{1F4D4} **Document Attached:** [${file.name}](${finalUrl})\n`;
        }

        const textarea = document.getElementById('note-main-textarea') as HTMLTextAreaElement;
        const currentContent = selectedNote.content || '';
        
        let updatedContent: string;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          updatedContent = currentContent.substring(0, start) + markdownTag + currentContent.substring(end);
        } else {
          updatedContent = currentContent + markdownTag;
        }

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
        model: 'gemini-3.5-flash',
        contents: prompt
      });

      const responseText = response.text || "";
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
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
        model: 'gemini-3.5-flash',
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
    if (!templateEditForm?.id) {
      setUserNotification("Please select a saved template first!");
      return;
    }

    if (allUsers.length === 0) {
      setUserNotification("No users found to broadcast to.");
      return;
    }

    try {
      setUserNotification(`Preparing manual list blast for "${templateEditForm.name}" to ${broadcastTarget.toUpperCase()} users...`);
      
      const filteredUsers = allUsers.filter(u => {
        if (broadcastTarget === 'premium') return u.isPremium;
        if (broadcastTarget === 'free') return !u.isPremium;
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
          name: u.fullName || u.displayName || 'there'
        }));

      const res = await axios.post('/api/admin/broadcast-list', { 
        secret: 'GOD_MODE',
        recipients,
        subjectTemplate: templateEditForm.subject,
        bodyTemplate: templateEditForm.body
      }); 

      if (res.data.success) {
        setUserNotification(`Marketing blast successful! Sent to ${res.data.count} users.`);
      } else {
        setUserNotification(`Blast failed: ${res.data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      setUserNotification("Server error triggering blast.");
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
    subjects: [
      { name: "Mathematics", questionsToAnswer: 15 }
    ]
  };
  const [examConfig, setExamConfig] = useState<ExamConfig>(initialExamConfig);
  const activeSubjects = (examConfig.subjects && examConfig.subjects.length > 0) ? examConfig.subjects : [{ name: "Mathematics", questionsToAnswer: 15 }];
  
  const validateAndSetLimit = (
    valStr: string,
    minVal: number,
    maxVal: number,
    setter: (val: number) => void,
    fieldName: string
  ) => {
    const valInt = parseInt(valStr);
    if (isNaN(valInt)) {
      setter(minVal);
      return;
    }
    if (valInt < minVal) {
      setUserNotification(`⚠️ ${fieldName} cannot be less than ${minVal}.`);
      setter(minVal);
    } else if (valInt > maxVal) {
      setUserNotification(`⚠️ ${fieldName} is capped at ${maxVal}.`);
      setter(maxVal);
    } else {
      setter(valInt);
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
    const duration = plan === 'monthly' ? 30 : 365;
    const newUntil = new Date();
    newUntil.setDate(newUntil.getDate() + duration);
    
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

      setUserNotification(`Subscription successful! Premium active until ${newUntil.toLocaleDateString()}`);
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

  const configMonthly = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || "user@example.com",
    amount: 300 * 100, // 300 Naira
    publicKey: PAYSTACK_PUBLIC_KEY,
    onSuccess: (response: any) => {
      handleSubscriptionSuccess('monthly', response.reference);
    },
    onClose: () => setUserNotification("Payment cancelled.")
  };

  const configYearly = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || "user@example.com",
    amount: 3600 * 100, // 3600 Naira
    publicKey: PAYSTACK_PUBLIC_KEY,
    onSuccess: (response: any) => {
      handleSubscriptionSuccess('yearly', response.reference);
    },
    onClose: () => setUserNotification("Payment cancelled.")
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
            setUserNotification(`Payment confirmed! Premium active.`);
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

    // Presence Heartbeat
    useEffect(() => {
      if (!user) return;
      const hb = setInterval(() => {
        updateDoc(doc(db, 'users', user.uid), {
          lastSeen: serverTimestamp(),
          status: 'online'
        }).catch(() => {});
      }, 30000); // 30s heartbeat
      return () => clearInterval(hb);
    }, [user]);

  const userUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    console.log("App Initialized. Checking API Keys...");
    console.log("Gemini Key Found:", !!getApiKey());
    console.log("HF Key Found:", !!getHfKey());

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
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
            
            setIsAdminUser(data.role === 'admin' || currentUser.email === "nuellkelechi@gmail.com");
            
            const premiumUntilDate = data.premiumUntil ? new Date(data.premiumUntil) : null;
            const isCurrentlySubscribed = premiumUntilDate ? premiumUntilDate > new Date() : false;
            const userIsPremium = data.isPremium || data.bypassAllPayments || data.role === 'admin' || isCurrentlySubscribed || data.subscribed === true;
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
              matricNumber: data.matricNumber || prev.matricNumber || '',
              dob: data.dob || prev.dob || '',
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
          console.error("Auth Snapshot Error:", error);
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

    // Global Data Sync
    // Check for shared quiz or exam in URL
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quizId');
    if (quizId) {
      loadSharedQuiz(quizId);
    } else {
      // Check for local unsaved quiz progress
      const localProgress = localStorage.getItem('nsg_current_quiz_progress');
      if (localProgress) {
        try {
          const p = JSON.parse(localProgress);
          setQuizQuestions(p.quizQuestions);
          setQuizTopic(p.quizTopic);
          setCurrentQuestionIndex(p.currentQuestionIndex);
          setQuizScore(p.quizScore);
          setUserQuizAnswers(p.userQuizAnswers || []);
          setQuizDifficulty(p.quizDifficulty || 'Medium');
          setQuizQuestionCount(p.quizQuestionCount || p.quizQuestions.length);
          setCurrentQuizId(p.currentQuizId);
          setQuizState('active');
          setSelectedOption(p.userQuizAnswers?.[p.currentQuestionIndex] !== undefined ? p.userQuizAnswers[p.currentQuestionIndex] : null);
          setIsAnswered(p.userQuizAnswers?.[p.currentQuestionIndex] !== undefined);
          setActiveTab('tools');
          setToolsSubTab('quiz');
        } catch (e) {
          console.error("Failed to restore local quiz progress:", e);
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

    const savedAdminMode = localStorage.getItem('nsg_admin_mode');
    if (savedAdminMode === 'true') setAdminMode(true);

    // Load hosted exam state if exists
    const savedHostExamId = localStorage.getItem('nsg_host_exam_id');
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
              localStorage.removeItem('nsg_host_exam_id');
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

    const hasSeenWelcome = localStorage.getItem('nsg_welcome_seen');
    if (!hasSeenWelcome) setShowWelcome(true);

    return () => {
      unsubscribeAuth();
    };
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
      unsubScores = onSnapshot(query(collection(db, 'exams', hostExamId, 'results'), where('hostUid', '==', user.uid), limit(200)), (snapshot) => {
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

    const unsubHistory = onSnapshot(query(collection(db, 'users', user.uid, 'studyHistory'), orderBy('date', 'desc'), limit(50)), (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as HomeHistoryItem));
      setFinishedHistory(prev => {
        // Merge with local if any (local might be more recent)
        const combined = [...prev, ...historyData].filter((item, index, self) => 
          self.findIndex(i => i.id === item.id) === index
        );
        return combined.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, 50);
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
      // NOTE: For Google Sign-in to work on your custom domain (nuellstudyguide.name.ng),
      // you MUST add it to the "Authorized domains" list in your Firebase Console:
      // Authentication -> Settings -> Authorized domains
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user document exists, if not create it
      let userDoc;
      try {
        userDoc = await getDoc(doc(db, 'users', user.uid));
      } catch (err: any) {
        if (err.message.includes('quota') || err.message.includes('8')) {
          throw new Error("QUOTA_EXCEEDED");
        }
        throw err;
      }
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          fullName: user.displayName || '',
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: user.email === 'nuellkelechi@gmail.com' ? 'admin' : 'student',
          createdAt: new Date().toISOString(),
          status: 'active',
          matric: '',
          dob: '',
          bypassHostingPayment: false,
          bypassTakingPayment: false,
          bypassAllPayments: false
        });
      } else {
        // Update existing user with Google data if missing
        const existingData = userDoc.data();
        await updateDoc(doc(db, 'users', user.uid), {
          photoURL: existingData.photoURL || user.photoURL,
          displayName: existingData.displayName || user.displayName,
          fullName: existingData.fullName || user.displayName
        });
      }
      sessionStorage.setItem('nsg_new_manual_login_session', 'true');
      setShowAuthModal(false);
      setUserNotification("Logged in with Google!");
    } catch (error: any) {
      const errorCode = error.code || "unknown";
      const errorMessage = error.message || String(error);
      
      // Specifically catch cancellation codes
      if (errorCode === 'auth/cancelled-popup-request' || 
          errorCode === 'auth/popup-closed-by-user') {
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
        setUserNotification(`Login Timeout: The connection to Firebase Auth timed out. Please check your internet connection or use a different network. If this continues, the service might be down.`);
      } else {
        setUserNotification(`Failed to login with Google: ${errorMessage} (${errorCode})`);
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
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            setUserNotification("Account not registered or incorrect credentials.");
          } else if (err.code === 'auth/wrong-password') {
            setUserNotification("Incorrect password. Please try again.");
          } else {
            setUserNotification("Authentication failed. Please check your details.");
          }
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
        matric: profileFormData.matricNumber || '',
        matricNumber: profileFormData.matricNumber || '',
        dob: profileFormData.dob || '',
        university: profileFormData.university || '',
        faculty: profileFormData.faculty || '',
        department: profileFormData.department || '',
        level: profileFormData.level || '',
        about: profileFormData.about || '',
        // Ensure rank is updated based on current points
        rank: getUserRank(currentUserData?.points || 0),
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'users', user.uid), updatedData);
      setIsEditingProfile(false);
      setUserNotification("Profile updated successfully!");
    } catch (error) {
      console.error("Save Profile Error:", error);
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
      setUserNotification("API Key is missing. Please set GEMINI_API_KEY inside your settings.");
      return;
    }

    const currentSub = examConfig.subjects?.[adminSelectedSubjectIdx];
    const currentSubjectName = currentSub ? currentSub.name : 'Mathematics';
    
    // Filter existing pool for this subject
    const existingSubQuestions = examQuestions.filter(q => q.subject?.trim().toLowerCase() === currentSubjectName.trim().toLowerCase());
    
    // Determine target quantity
    const quantity = options?.quantity || adminOmniQuantity || 10;

    const combinedPrompt = options 
      ? `${options.customPrompt || ""}\n${options.rawNotes || ""}`.trim()
      : adminQuestionsRaw.trim();

    if (existingSubQuestions.length === 0 && !combinedPrompt) {
      setUserNotification(`Please enter a prompt instruction for ${currentSubjectName} first, as there are no manual questions to analyze.`);
      return;
    }

    setIsGeneratingAdminQuestions(true);
    try {
      const prompt = `
        Convert the following user specifications or analyze the style of existing questions to generate a professional Multiple Choice Question (MCQ) pool.
        Generate exactly ${Math.min(50, quantity)} questions for the subject/exam of "${currentSubjectName}".
        Each question must have exactly 4 options (A-D) and one correct answer index (0-3).
        
        ${combinedPrompt ? `User Instructions/Topic Prompt: "${combinedPrompt}"` : `Analyze difficulty and style from the existing questions below and create similar questions.`}
        
        ${existingSubQuestions.length > 0 ? `
        Analyzable Existing Questions for style modeling in ${currentSubjectName}:
        ${JSON.stringify(existingSubQuestions.slice(0, 5))}
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
      const data = JSON.parse(respText);
      if (data.questions) {
        const formatted = data.questions.map((q: any) => ({ 
          ...q, 
          id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          subject: currentSubjectName
        }));
        
        // Filter out blank questions of this subject so real generated ones replace them
        const isBlank = (itemQ: any) => !itemQ.question || itemQ.question.trim() === "" || itemQ.question.trim().toLowerCase() === "enter question query here...";
        
        const otherSubjectsQs = examQuestions.filter(q => (q.subject || "Mathematics").trim().toLowerCase() !== currentSubjectName.trim().toLowerCase());
        const existingSubQs = examQuestions.filter(q => (q.subject || "Mathematics").trim().toLowerCase() === currentSubjectName.trim().toLowerCase());
        
        const realSubQs = existingSubQs.filter(q => !isBlank(q));
        const combinedSubQs = [...realSubQs, ...formatted];
        const newTotalCount = combinedSubQs.length;
        
        // Update subjects limit if new pool size exceeds it so we don't truncate any
        const targetSub = examConfig.subjects?.find(s => s.name.trim().toLowerCase() === currentSubjectName.trim().toLowerCase());
        const currentTargetCount = targetSub ? (targetSub.questionsToAnswer || 15) : 15;
        
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
        
        const updatedPool = [...otherSubjectsQs, ...combinedSubQs].slice(0, 200);
        setExamQuestions(updatedPool);
        
        // Auto-sync to Firestore if hosting
        if (hostExamId) {
          await updateDoc(doc(db, 'exams', hostExamId), { 
            questions: updatedPool,
            config: { ...examConfig, subjects: finalSubjects }
          });
        }
        
        setAdminNotification(`Added ${formatted.length} ${currentSubjectName} questions!`);
        // Clear prompt text after successful completion
        setAdminQuestionsRaw('');
      }
    } catch (e) {
      console.error(e);
      setAdminNotification("Failed to generate questions. Verify your prompt or API key.");
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
        const student = students.find((s: any) => s.matric.replace(/\s+/g, '').toLowerCase() === matricNumber.replace(/\s+/g, '').toLowerCase());
        
        if (student) {
          setStudentName(student.name);
          
          // Check for existing session in localStorage
          const session = localStorage.getItem(`nsg_exam_session_${targetExamId}_${student.matric}`);
          if (session) {
            const sessionData = JSON.parse(session);
            if (sessionData.status === 'completed') {
              setUserNotification("You have already completed this exam.");
              return;
            }
          }

          // Secondary check: Firestore results subcollection
          const resultsSnap = await getDocs(query(collection(db, 'exams', targetExamId, 'results'), where('uid', '==', user.uid)));
          const alreadyFinished = !resultsSnap.empty;
          if (alreadyFinished) {
            setUserNotification("You have already completed this exam (Verified by Server).");
            // Update local storage to match server state
            localStorage.setItem(`nsg_exam_session_${targetExamId}_${student.matric}`, circularSafeStringify({ status: 'completed' }));
            return;
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
        const subPool = examQuestions.filter(q => q.subject?.trim().toLowerCase() === sub.name.trim().toLowerCase());
        const subCount = sub.questionsToAnswer || 15;
        // Shuffle the subject's pool and slice to needed count
        const sliced = shuffleArray(subPool).slice(0, subCount);
        finalSelectedQuestions.push(...sliced);
      });
    }

    if (finalSelectedQuestions.length === 0) {
      if (examQuestions.length < examConfig.questionCount) {
        setUserNotification(`Admin has not uploaded enough questions (Minimum ${examConfig.questionCount} required).`);
        return;
      }
      finalSelectedQuestions = shuffleArray(examQuestions).slice(0, examConfig.questionCount);
    }

    setExamQuestions(finalSelectedQuestions);
    setExamTimer(examConfig.duration * 60);
    setExamLobbyState('exam');
    setExamAnswers({});
    setCurrentExamIndex(0);
    setExamFinished(false);
    
    // Pick the first subject as active subject
    const distinctSubjects = Array.from(new Set(finalSelectedQuestions.map(q => q.subject).filter(Boolean))) as string[];
    setActiveStudentSubject(distinctSubjects[0] || "");
    
    // Mark as active
    setRegisteredStudents(prev => prev.map(s => 
      s.matric.replace(/\s+/g, '').toLowerCase() === matricNumber.replace(/\s+/g, '').toLowerCase() ? { ...s, isActive: true, lastActive: Date.now() } : s
    ));
    
    // Broadcast status
    const channel = new BroadcastChannel('nsg_exam_sync');
    channel.postMessage({ type: 'STATUS_UPDATE', matric: matricNumber, isActive: true });
    channel.close();

    localStorage.setItem(`nsg_exam_session_${activeExamId}_${matricNumber}`, circularSafeStringify({ status: 'in-progress', startTime: Date.now() }));

    examTimerRef.current = setInterval(() => {
      setExamTimer(prev => {
        if (prev <= 1) {
          submitExam();
          return 0;
        }
        // Refresh active status every 30 seconds
        if (prev % 30 === 0) {
          setRegisteredStudents(curr => curr.map(s => 
            s.matric.replace(/\s+/g, '').toLowerCase() === matricNumber.replace(/\s+/g, '').toLowerCase() ? { ...s, lastActive: Date.now(), isActive: true } : s
          ));
        }
        return prev - 1;
      });
    }, 1000);
  };

  const submitExam = async () => {
    if (examTimerRef.current) clearInterval(examTimerRef.current);
    
    let score = 0;
    examQuestions.forEach((q, idx) => {
      const studentAns = examAnswers[q.id] !== undefined ? examAnswers[q.id] : examAnswers[idx];
      if (studentAns === q.correctAnswer) score++;
    });

    setExamScore(score);
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
      total: examQuestions.length
    });

    if (user) {
      const p = Math.round((score / (examQuestions.length || 1)) * 100);
      addDoc(collection(db, 'notifications'), {
        to: user.uid,
        title: `🛡️ Professional CBT Exam Submitted!`,
        message: `Congratulations ${studentName || currentUserData?.username || 'Scholar'}! You submitted CBT Exam "${examIdInput || 'CBT Mock'}" with a final score of ${score}/${examQuestions.length} (${p}%). Every milestone counts! 🔥🎓`,
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
          total: examQuestions.length,
          timestamp: new Date().toLocaleString(),
          hostUid: activeExamHostUid || undefined
        };
        
        // Save result to the specific exam's results subcollection
        await addDoc(collection(db, 'exams', activeExamId, 'results'), result);
        
        localStorage.setItem(`nsg_exam_session_${activeExamId}_${matricNumber}`, circularSafeStringify({ status: 'completed', score }));
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

    if (isPremium || currentUserData?.role === 'admin' || currentUserData?.bypassHostingPayment) {
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
    if (!user || !hostExamId) return;
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
      setUserNotification("Exam hosted successfully! Copy the link to share.");
    } catch (error) {
      console.error("Error saving exam:", error);
      setUserNotification("Failed to save exam.");
    }
  };

  const restartStudentTimer = (matric: string) => {
    localStorage.removeItem(`nsg_exam_session_${matric}`);
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
    amount: ((isPremium || currentUserData?.role === 'admin' || currentUserData?.bypassAllPayments) ? 0 : (adminMode ? 200 : 100)) * 100, // 0 for premium, 200 for hosting, 100 for taking
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

  // --- \u{1F3A4} RECORDING LOGIC ---
  const [isStopping, setIsStopping] = useState(false);
  const [isProcessingFinal, setIsProcessingFinal] = useState(false);
  const [saveModal, setSaveModal] = useState({ isOpen: false, name: '', onConfirm: (name: string) => {} });
  const [currentRecordingSessionId, setCurrentRecordingSessionId] = useState<string | null>(null);

  // --- HIGH-PERFORMANCE AUDIO ENHANCEMENT ENGINE (VOCAL ISOLATION & CLARITY BOOSTER) ---
  const getEnhancedStream = async (originalStream: MediaStream) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(originalStream);
    const destination = audioContext.createMediaStreamDestination();

    // 1. Low Cut filter (High-pass at 200Hz)
    // Eliminates low frequency rumble, air conditioner hums, fan vibrations, and room echo
    const lowCut = audioContext.createBiquadFilter();
    lowCut.type = "highpass";
    lowCut.frequency.setValueAtTime(200, audioContext.currentTime);
    lowCut.Q.setValueAtTime(0.8, audioContext.currentTime);

    // 2. Hiss Filter (Low-pass at 3600Hz)
    // Cuts out sharp background hiss, electronic static, speaker squeals, and white noise
    const highCut = audioContext.createBiquadFilter();
    highCut.type = "lowpass";
    highCut.frequency.setValueAtTime(3600, audioContext.currentTime);
    highCut.Q.setValueAtTime(0.8, audioContext.currentTime);

    // 3. Peaking Vocals Equalizer (Vocal Formant Booster centered at 1500Hz)
    // Amplifies the core clarity frequency of human vocals by +8dB
    const vocalPeak = audioContext.createBiquadFilter();
    vocalPeak.type = "peaking";
    vocalPeak.frequency.setValueAtTime(1500, audioContext.currentTime);
    vocalPeak.Q.setValueAtTime(1.2, audioContext.currentTime); // focused band
    vocalPeak.gain.setValueAtTime(8, audioContext.currentTime); // +8dB amplification to vocal articulation

    // 4. Dynamics Compressor (Aggressive auto-level and noise exclusion)
    // Automatically lifts distant/faint voices up, and pulls overly loud noises back for stability
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-36, audioContext.currentTime); // Sensitive threshold to lock quiet speech
    compressor.knee.setValueAtTime(24, audioContext.currentTime);
    compressor.ratio.setValueAtTime(10, audioContext.currentTime); // Strong level normalization
    compressor.attack.setValueAtTime(0.01, audioContext.currentTime);
    compressor.release.setValueAtTime(0.20, audioContext.currentTime);

    // 5. Makeup Gain (Master vocal amplification)
    // Boosts the overall filtered/leveled signal to a beautiful clear intensity
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(3.5, audioContext.currentTime); // 3.5x boost

    // Connect the professional studio-quality audio isolation chain
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
      // 1. Immediately visually stop the recording
      setIsRecording(false);
      releaseWakeLock();
      if (timerRef.current) clearInterval(timerRef.current);
      if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
      
      setIsStopping(true);
      setIsProcessingFinal(true);
      isStopRequested.current = true;
      try {
        console.log("🛑 Stopping audio capture...");
        
        // Stop the live segment-transcription loops
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

        // Wait for all outstanding chunk transcriptions to finish
        await processorQueue.current;
        console.log("✅ Live transcription of segments completed.");

        // Generate AI title
        const aiTitle = await generateAITitleForNote(transcriptionNotesRef.current);
        const finalTitle = aiTitle === "Untitled" ? "Untitled" : `${aiTitle} ${formatNoteTimeDate()}`;
        finalRecordingTitleRef.current = finalTitle;

        // Final save of Note to Notebook Vault/Cache - update the ID we saved initially
        if (activeRecordingNoteIdRef.current) {
          await saveNote(transcriptionNotesRef.current, finalTitle, activeRecordingNoteIdRef.current);
        }

        setUserNotification("Transcription and note creation completed!");
      } catch (err) {
        console.error("Error stopping recording:", err);
      } finally {
        setIsProcessingFinal(false);
        setIsStopping(false);
      }
    } else {
      const canProceed = await checkAndIncrementUsage('RECORD');
      if (!canProceed) return;

      audioChunksRef.current = [];
      processedChunksCountRef.current = 0;
      setTranscriptionNotes('');
      lastFinalizedTranscriptRef.current = ''; // Reset the finalized cumulative string
      setAudioUrl(null);
      setRecordedBlob(null);
      activeRecordingNoteIdRef.current = null;
      finalRecordingTitleRef.current = "Untitled";

      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      setCurrentRecordingSessionId(newSessionId);
      currentRecordingSessionIdRef.current = newSessionId;

      // Immediately create placeholder note in Vault so we can update in real-time during recording
      const initNoteId = await saveNote("Transcribing lecture content...", "Untitled");
      activeRecordingNoteIdRef.current = initNoteId;

      try {
        requestWakeLock();
        const originalStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const enhanced = await getEnhancedStream(originalStream);
        audioProcessingRef.current = enhanced;
        
        // 1. Start continuous high-quality master recorder
        const recorder = new MediaRecorder(enhanced.stream);
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

          // Force download to phone/PC storage as requested
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

          // AUTO SAVE RECORDING TO SERVERS/STORAGE
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
              localStorage.setItem('nsg_offline_recordings', JSON.stringify(list));

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
        recorder.start(1000); // Record in 1s chunks to avoid loss of state
        
        setIsRecording(true);
        setRecordingTime(0);
        
        // Timer for length constraints
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

      } catch (err) {
        setUserNotification("Microphone access denied. Please check permissions.");
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
            model: "gemini-3.5-flash",
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
            model: "gemini-3.5-flash",
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

    const getLocalUrl = (): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    };

    if (!cloudName || !uploadPreset) {
      console.warn("Cloudinary credentials missing. Falling back to local preview URL.");
      return getLocalUrl();
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const msg = errorData.error?.message || "Cloudinary upload failed";
        
        if (msg.toLowerCase().includes("unsigned uploads") || msg.toLowerCase().includes("whitelisted")) {
          setUserNotification("Cloudinary Error: Your upload preset must be set to 'Unsigned' in Cloudinary Settings.");
          console.error(`CLOUDINARY CONFIG ERROR: The preset '${uploadPreset}' is not configured for unsigned uploads. Please go to your Cloudinary dashboard > Settings > Upload > Upload presets, edit '${uploadPreset}', and change 'Signing Mode' to 'Unsigned'.`);
          return getLocalUrl();
        }
        
        throw new Error(msg);
      }

      const data = await response.json();
      if (!data.secure_url) {
        throw new Error("Cloudinary response missing secure_url");
      }
      return data.secure_url;
    } catch (error: any) {
      console.error("Cloudinary Upload Error:", error);
      const msg = error.message || String(error);
      if (msg.toLowerCase().includes("unsigned uploads") || msg.toLowerCase().includes("whitelisted")) {
        return getLocalUrl();
      }
      throw error;
    }
  };

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
      // Sleek, futuristic academic tip block to avoid developer runtime errors under sandbox
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
        chatWakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
      const originalStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const enhanced = await getEnhancedStream(originalStream);
      chatAudioProcessingRef.current = enhanced;
      
      const recorder = new MediaRecorder(enhanced.stream);
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
                model: "gemini-3.5-flash",
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
    } catch (err) {
      console.error("Mic access error:", err);
      setUserNotification("Microphone access denied.");
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
    
    if (!getApiKey()) {
      setUserNotification("API Key is missing. Please set VITE_GEMINI_API_KEY in your environment.");
      return;
    }

    if (!user) {
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
        if (!getHfKey()) {
          setUserNotification("HuggingFace API Key is missing. Please set VITE_HUGGINGFACE_API_KEY in your environment.");
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

        const systemPrompt = "You are Omni, a versatile, smart, and friendly AI study companion created by NSG, founded by ABRAHAM EMMANUEL PROSPER. You are extremely flexible: you are friendly, serious, energetic, or simple depending on the tone of how the user chats with you. You express your human personality using warm smiley faces and emojis (like 😊, 😄, 💡, 📝, 🤔, 🌟, 🎒, 📚). Never refer to yourself or our structures as 'nodes' or 'engineering nodes', as we do not use that terminology. Avoid the word 'node'. You are built as a universal study companion across all colleges, departments, and courses worldwide. If asked for general study apps, suggest famous ones (Otter.ai, Photomath) and recommend NSG (nuellstudyguide.name.ng).\n\n" +
          "QUIZ GENERATION ABILITY:\n" +
          "If the user asks you to generate a quiz, or if you feel a quiz is appropriate based on everything discussed, you can trigger quiz generation! To do this, simply include this exact directive in your text response: '[[GENERATE_QUIZ: <topic>, <num_questions>]]' where <topic> is the quiz topic and <num_questions> is the number of questions (an integer, defaulting to 5 if not specified). E.g. 'Alright, let's start a quiz: [[GENERATE_QUIZ: Biochemistry Photosynthesis, 5]]'. The app will instantly display a custom start button for the user!\n\n" +
          "DETAILED NSG GUIDES FOR USERS:\n" +
          "1. RECORDING ENGINE: 1. Grant mic access. 2. Click 'Record'. 3. Board Analysis: Click upload icon for board photos to sync with notes. 4. Stop Session to process. 5. Use top-right Copy icon to export.\n" +
          "2. SMART QUIZ: 1. Topic -> Difficulty (Easy/Med/Hard) -> Count. 2. Submit for score. 3. Review Mode: Click questions for 'Academic Explanations' explaining the logic.\n" +
          "3. CBT EXAM: 1. Hosting: Click 'Host Exam' -> Add participants -> Set Questions/Time/Pool -> Save & Generate ID. 2. Joining: Enter ID -> Enter assigned Custom Matric.\n" +
          "4. FACULTY SPECIALS: AI for Med, Law, Engineering. BIZ section includes 'Financial Auditor'. Language section has 'Diagnostics' (300 word limit) and 'Transcribe Tool'.\n" +
          "5. ASSIGNMENT SOLVER: Clear Photo/Text needed, click 'Solve with AI' for logic and steps with Core Concept.\n" +
          "6. COURSES TOOL: Faculty -> Dept -> Level -> Code navigation for notes.\n" +
          "7. WHATSAPP OMNI: Connect via +2349064470122." + 
          quizContextPrompt;

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

        // --- PRIMARY: HF ---
        const askHF = async () => {
          if (!getHfKey() || isHfDepleted) return null;
          const hfInstance = getHfInstance();
          try {
            const hfModel = uploadedImages.length > 0 ? HF_MODELS.VISION : HF_MODELS.TEXT;
          const hfMessages: any[] = chatHistory.map(m => ({
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
          const googleHistory = chatHistory.map(m => ({
            role: m.role === 'user' ? 'user' as const : 'model' as const,
            parts: [{ text: m.text }]
          }));
          let userParts: any[] = [{ text: textToSend || "Hello" }];
          for (const img of uploadedImages) {
            userParts.push(await fileToGenerativePart(img.file));
          }
          const result = await aiInstance.models.generateContent({
            model: "gemini-3.5-flash",
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
              ...chatHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
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
            ...chatHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
          ]);
        };

        const askTogether = async () => {
          return await callTogetherAI(textToSend, [
            { role: 'system', content: systemPrompt },
            ...chatHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
          ]);
        };

        responseText = await runWithTimeout("Gemini", askGemini) 
                     || await runWithTimeout("Groq", askGroq) 
                     || await runWithTimeout("Together", askTogether)
                     || await runWithTimeout("HF", askHF) 
                     || await runWithTimeout("OpenRouter", askOpenRouter)
                     || "I'm sorry, all AI providers are currently unavailable. Please try again in a moment.";
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

  // --- \u{1F4DD} QUIZ LOGIC ---
  const loadSharedQuiz = async (quizId: string) => {
    try {
      const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
      if (quizDoc.exists()) {
        const data = quizDoc.data();
        
        // Auto Capture: Add to history immediately when opened
        const historyId = `quiz-${quizId}`;
        const historyItem: HomeHistoryItem = {
          id: historyId,
          title: data.topic || 'Shared Quiz',
          type: 'quiz',
          timestamp: Date.now(),
          progress: 0,
          questions: data.questions,
          topic: data.topic,
          difficulty: data.difficulty || 'Medium'
        };
        addToFinishedHistory(historyItem);

        // Check for local progress
        const savedProgress = localStorage.getItem(`nsg_quiz_progress_${quizId}`);
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
            setCurrentQuizId(quizId);
            setQuizState('active');
            setSelectedOption(p.userQuizAnswers?.[p.currentQuestionIndex] !== undefined ? p.userQuizAnswers[p.currentQuestionIndex] : null);
            setIsAnswered(p.userQuizAnswers?.[p.currentQuestionIndex] !== undefined);
            setActiveTab('tools');
            setToolsSubTab('quiz');
            return; // Exit after loading progress
          } catch (pe) {
            console.error("Failed to load saved quiz progress:", pe);
          }
        }

        // Default load if no progress
        setQuizQuestions(data.questions);
        setQuizTopic(data.topic);
        setCurrentQuizId(quizId);
        setQuizState('active');
        setActiveTab('tools');
        setToolsSubTab('quiz');
        setCurrentQuestionIndex(0);
        setQuizScore(0);
        setIsAnswered(false);
        setSelectedOption(null);
        setUserQuizAnswers([]);
      }
    } catch (error) {
      console.error("Error loading shared quiz:", error);
    }
  };

  const handleTagOmni = async (text: string, chatId: string, attachments?: { url: string, type: string, name: string }[]) => {
    if (!user) return;
    try {
      const parts: any[] = [{ text: `User tagged you in a chat. 
Context: You are Omni by NSG, a concise academic assistant. 
User Message: "${text}"
${attachments?.length ? 'Attachments are provided below.' : ''}
Respond professionally, concisely, and use LaTeX for math.` }];
      
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          try {
            const res = await fetch(attachment.url);
            const blob = await res.blob();
            // Gemini 1.5 Flash supports image, audio, and video
            const genPart = await fileToGenerativePart(blob);
            parts.push(genPart);
          } catch (err) {
            console.error("Error processing attachment for Omni:", err);
            parts.push({ text: `[Error processing attachment: ${attachment.name}]` });
          }
        }
      }

      const response = await getAiInstance().models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: 'user', parts }]
      });
      
      const reply = response.text || "I apologize, but I couldn't process that request.";
      const isOmniDirect = chatId.startsWith('omni_');

      // Send Omni's response
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
      
      // Update last message in chat
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: reply,
        lastMessageSender: 'Omni by NSG',
        updatedAt: serverTimestamp(),
        unreadBy: arrayUnion(user.uid) // Mark as unread for the user
      });
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
      const quizId = `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      await setDoc(doc(db, 'quizzes', quizId), {
        questions: quizQuestions,
        topic: quizTopic,
        createdBy: user.uid,
        createdAt: new Date().toISOString()
      });
      const link = `${window.location.origin}${window.location.pathname}?quizId=${quizId}`;
      setShareQuizLink(link);
      navigator.clipboard.writeText(link);
      setUserNotification("Quiz link copied to clipboard!");
      setShowShareModal(true); // Show the modal so user can see the link
    } catch (error) {
      console.error("Error sharing quiz:", error);
      setUserNotification("Failed to generate share link.");
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
      const cleanString = text.replace(/[#*`\$\(\)\[\]\\_]/g, '');
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

  const generateQuiz = async (
    customTopic?: string | React.MouseEvent<any>, 
    customCount?: number, 
    customDifficulty?: "Easy" | "Medium" | "Hard" | "Professional"
  ) => {
    const realTopic = (customTopic && typeof customTopic !== 'string') ? undefined : customTopic as string | undefined;
    const realCount = (customTopic && typeof customTopic !== 'string') ? undefined : customCount;
    const realDifficulty = (customTopic && typeof customTopic !== 'string') ? undefined : customDifficulty;

    console.log("Starting Quiz Generation...", { realTopic, realCount, realDifficulty });
    if (isGeneratingQuiz) return;
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const activeTopic = (realTopic !== undefined ? realTopic : quizTopic) || "";
    const activeCount = realCount !== undefined ? realCount : quizQuestionCount;
    const activeDifficulty = realDifficulty !== undefined ? realDifficulty : quizDifficulty;

    if (realTopic !== undefined) setQuizTopic(realTopic);
    if (realCount !== undefined) setQuizQuestionCount(realCount);
    if (realDifficulty !== undefined) setQuizDifficulty(realDifficulty);

    const limits = isPremium ? LIMITS.QUIZ.PREMIUM : LIMITS.QUIZ.NORMAL;
    const wordCount = activeTopic.split(/\s+/).filter(Boolean).length;
    if (wordCount > limits.WORDS) {
      setUserNotification(`Prompt limit reached: ${isPremium ? 'Premium' : 'Free'} users can only enter up to ${limits.WORDS} words per prompt.`);
      return;
    }

    if (!activeTopic.trim() && quizImages.length === 0 && !importedQuizNote) {
      setUserNotification("Please enter a topic, upload an image, or import a note first.");
      return;
    }

    if (activeCount <= 0) {
      setUserNotification("Please enter a valid number of questions.");
      return;
    }

    if (!getApiKey()) {
      setUserNotification("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your environment.");
      return;
    }

    const canProceed = await checkAndIncrementUsage('QUIZ');
    if (!canProceed) return;

    setIsGeneratingQuiz(true);
    setQuizState('idle');

    try {
      const aiInstance = getAiInstance();
      const imageParts = await Promise.all(quizImages.map(img => fileToGenerativePart(img.file)));

      let promptContext = "";
      if (importedQuizNote) {
        promptContext += `Analyze the imported student study note titled "${importedQuizNote.title}" with the following content:\n"""\n${importedQuizNote.content}\n"""\n\n`;
      }
      
      if (activeTopic.trim()) {
        if (importedQuizNote) {
          promptContext += `Integrate the note context above with the user's specific text instructions/topic: "${activeTopic}".\n\n`;
        } else {
          promptContext += `The questions must strictly cover and test the user's requested topic/context: "${activeTopic}".\n\n`;
        }
      }
      
      if (quizImages.length > 0) {
        if (activeTopic.trim() || importedQuizNote) {
          promptContext += `Additionally, merge and incorporate information from the attached image(s) to generate relevant academic questions covering the diagrams, textbook excerpts, or notes shown in them.\n\n`;
        } else {
          promptContext += `No text topic or note was provided. You must analyze the attached image(s) to generate relevant academic questions based strictly on the subject matter, text, equations, diagrams, and educational context shown in them.\n\n`;
        }
      }

      const prompt = `
        Generate a ${activeCount}-question multiple choice quiz on the user's specific academic material.
        
        ${promptContext}
        
        Do not introduce any unrelated mathematical expressions, technical formulas, physics symbols, or engineering concepts unless the requested topic specifically calls for mathematics, exact sciences, or engineering subjects.
        Difficulty Level: ${activeDifficulty}.
        
        To support LaTeX rendering for technical topics (only when relevant):
        If and only if the topic is mathematical/scientific and expressions or equations are required, wrap them in LaTeX notation using $ ... $ for inline formatting.
        
        Return ONLY a JSON object with this structure:
        {
          "quizTitle": "A short, concise academic title summarizing the topic of the generated questions (maximum 5 words)",
          "questions": [
            {
              "question": "string",
              "options": ["string", "string", "string", "string"],
              "correctAnswer": number (0-3),
              "explanation": "Detailed breakdown. Write a clear explanation explaining why the correct option is correct, and why other options are incorrect to help the student learn."
            }
          ]
        }
      `;

      const contentsParts: any[] = [{ text: prompt }];
      imageParts.forEach(part => {
        contentsParts.push({ inlineData: part.inlineData });
      });

      const askGemini = async () => {
        const res = await aiInstance.models.generateContent({
          model: FLASH_MODEL,
          contents: [{ role: 'user', parts: contentsParts }],
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

      const responseText = await askGemini() || await askTogether() || await askOpenRouter() || "{}";
      const data = robustJSONParse(responseText);
      if (data && data.questions) {
        const genId = `gen-${Date.now()}`;
        if (data.quizTitle) {
          setQuizTopic(data.quizTitle);
        } else if (!activeTopic.trim() && importedQuizNote) {
          setQuizTopic(importedQuizNote.title);
        } else if (!activeTopic.trim()) {
          setQuizTopic("Visual Materials Quiz");
        }
        setQuizQuestions(data.questions);
        setCurrentQuestionIndex(0);
        setQuizScore(0);
        setUserQuizAnswers([]);
        setQuizState('active');
        setSelectedOption(null);
        setIsAnswered(false);
        setCurrentQuizId(genId);

        // Auto Capture: Add to history immediately when generated
        const historyItem: HomeHistoryItem = {
          id: genId,
          title: activeTopic || data.quizTitle || 'Visual Materials Quiz',
          type: 'quiz',
          timestamp: Date.now(),
          progress: 0,
          questions: data.questions,
          topic: activeTopic || data.quizTitle || 'Visual Materials Quiz',
          difficulty: activeDifficulty
        };
        addToFinishedHistory(historyItem);
      }
    } catch (error) {
      console.error("Quiz Generation Error:", error);
      setUserNotification(formatAiError(error));
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
        
        CRITICAL: For ALL mathematical expressions, formulas, and scientific notation, 
        ALWAYS wrap them in LaTeX notation using $ ... $ for inline and $$ ... $$ for blocks.
        Example: $2^2 = 4$, $\pi r^2$, $H_2O$.
        NEVER leave raw symbols like ^ or _ outside of LaTeX delimiters.
        
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

  useEffect(() => {
    // Auto-trigger Quiz/Exam if coming from Courses Tool with a prompt set
    const isFromCourses = quizTopic && quizTopic.includes(': ') && quizTopic.includes(' - ');
    if (isFromCourses && !isGeneratingQuiz) {
      if (toolsSubTab === 'quiz' && quizState === 'idle') {
        generateQuiz();
      } else if (toolsSubTab === 'exam' && (examLobbyState === 'login' || examLobbyState === 'result') && examQuestions.length === 0) {
        generateDynamicExam();
      }
    }
  }, [toolsSubTab, quizTopic, quizState, examLobbyState, examQuestions.length, isGeneratingQuiz]);

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

  const handleOptionSelect = (index: number) => {
    if (!user) {
      setUserNotification("Quickly log in with Google or sign up to submit answers and track your academic standing!");
      setAuthMode('signup');
      setShowAuthModal(true);
      return;
    }
    if (quizState === 'finished') return;
    if (userQuizAnswers[currentQuestionIndex] !== undefined) return; // Prevent multiple clicks
    
    setSelectedOption(index);
    setIsAnswered(true);
    
    // Store user answer
    setUserQuizAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = index;
      return newAnswers;
    });

    // Optionally increment score immediately if we want to track it live
    if (index === quizQuestions[currentQuestionIndex].correctAnswer) {
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
        
        // Push a beautiful notification!
        addDoc(collection(db, 'notifications'), {
          to: user.uid,
          title: `🏆 Magnificent Quiz Score!`,
          message: `Congratulations ${nameHandle}! You finished "${quizTopic || 'General Study'}" Quiz with ${finalScore}/${quizQuestions.length} (${percent}%). Outstanding determination! 🎉👏`,
          type: 'congrats',
          subtype: 'quiz_complete',
          targetTab: 'tools',
          targetSubTab: 'quiz',
          timestamp: serverTimestamp() || new Date(),
          read: false
        }).catch(err => console.error("Error creating completion notification:", err));

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

      {/* AUTH LOADING OVERLAY */}
      <AnimatePresence>
        {isAuthLoading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className={`fixed inset-0 z-[300] ${theme === 'dark' ? 'bg-[#13111C]' : 'bg-white'} flex flex-col items-center justify-center space-y-4`}
          >
            <BlinkingBrain size={64} className="text-red-500" />
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} animate-pulse`}>Processing Authentication...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AUTH MODAL (RESTORED MODAL STYLE) */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] overflow-y-auto bg-[#0a0812]/98 backdrop-blur-md grid place-items-center p-4 sm:p-8"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} 
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`bg-gradient-to-br from-[#1e1a30] to-[#0f0c1a] border border-white/10 p-6 sm:p-10 rounded-[2.5rem] shadow-3xl relative overflow-hidden my-auto ${
                authMode === 'signup' ? 'max-w-lg w-full' : 'max-w-sm w-full'
              }`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-pink-500 to-blue-600" />
              <button 
                onClick={() => setShowAuthModal(false)} 
                className="absolute top-4 right-4 text-white/20 hover:text-[#DC2626] transition-colors"
              >
                <XCircle size={20} />
              </button>
              
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#DC2626] to-[#991B1B] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#DC2626]/20">
                  <Brain size={24} className="text-white" />
                </div>
                <h2 className="text-xl font-black text-white tracking-tighter uppercase italic leading-none">
                  {authMode === 'login' ? 'LOGIN' : 'SIGN UP'} <span className="bg-gradient-to-r from-red-500 to-blue-600 bg-clip-text text-transparent">NSG</span>
                </h2>
              </div>

              <form onSubmit={handleAuth} className="space-y-4 text-left">
                {authMode === 'signup' ? (
                  <>
                    <div className="space-y-1">
                      <input type="text" value={authFullName} onChange={(e) => setAuthFullName(e.target.value)} placeholder="Full Official Name" required className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-xs text-white focus:border-[#DC2626]/50 transition-all outline-none" />
                      {validationErrors.fullName && <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.fullName}</p>}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                       <div className="space-y-1">
                         <p className="text-[7px] font-bold text-white/30 uppercase ml-1">DOB</p>
                         <input type="date" value={authDOB} onChange={(e) => setAuthDOB(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white focus:border-[#DC2626]/50 transition-all outline-none" />
                         {validationErrors.dob && <p className="text-[8px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.dob}</p>}
                       </div>
                       <div className="space-y-1">
                         <p className="text-[7px] font-bold text-white/30 uppercase ml-1">Username (Leave empty for Auto-Gen)</p>
                         <input type="text" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} placeholder="Auto-generated if blank" className={`w-full bg-white/5 border ${usernameStatus?.available === false ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-[10px] text-white focus:border-[#DC2626]/50 transition-all outline-none`} />
                       </div>
                    </div>
                    {usernameStatus && (
                      <p className={`text-[8px] font-bold uppercase tracking-wider ml-1 ${usernameStatus.available ? 'text-green-500' : 'text-red-500'}`}>
                        {usernameStatus.message}
                      </p>
                    )}

                    <div className="space-y-1">
                      <select value={authUniversity} onChange={(e) => setAuthUniversity(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-xs text-white/70 focus:border-[#DC2626]/50 transition-all outline-none appearance-none">
                        <option value="" disabled className="bg-zinc-900 overflow-y-scroll max-h-40">Select University</option>
                        {UNIVERSITIES.map(u => <option key={u} value={u} className="bg-zinc-900">{u}</option>)}
                      </select>
                      {validationErrors.university && <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.university}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <select value={authFaculty} onChange={(e) => { setAuthFaculty(e.target.value); setAuthDepartment(''); }} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white/70 focus:border-[#DC2626]/50 transition-all outline-none appearance-none">
                          <option value="" disabled className="bg-zinc-900">Select Faculty</option>
                          {FACULTIES.map(f => <option key={f} value={f} className="bg-zinc-900">{f}</option>)}
                        </select>
                        {validationErrors.faculty && <p className="text-[8px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.faculty}</p>}
                      </div>
                      <div className="space-y-1">
                        <select value={authDepartment} onChange={(e) => setAuthDepartment(e.target.value)} required disabled={!authFaculty} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] text-white/70 focus:border-[#DC2626]/50 transition-all outline-none appearance-none disabled:opacity-30">
                          <option value="" disabled className="bg-zinc-900">Select Dept.</option>
                          {authFaculty && DEPARTMENTS[authFaculty]?.map(d => <option key={d} value={d} className="bg-zinc-900">{d}</option>)}
                        </select>
                        {validationErrors.department && <p className="text-[8px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.department}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                       <input type="text" value={authMatric} onChange={(e) => setAuthMatric(e.target.value)} placeholder="Matric (Optional)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-[#DC2626]/50 transition-all outline-none" />
                       <input type="text" value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} placeholder="Phone Number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-[#DC2626]/50 transition-all outline-none" />
                    </div>
                    
                    <input type="text" value={authInviteCode} onChange={(e) => setAuthInviteCode(e.target.value)} placeholder="Referral Invite ID (Optional - enter friend's username)" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-xs text-white focus:border-[#DC2626]/50 transition-all outline-none" />
                    
                    <div className="space-y-1">
                      <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Email Address" required className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-xs text-white focus:border-[#DC2626]/50 transition-all outline-none" />
                      {validationErrors.email && <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.email}</p>}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <input type="text" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Email / Matric Number" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-xs text-white focus:border-[#DC2626]/50 transition-all outline-none" />
                    </div>
                  </>
                )}
                
                <div className="space-y-1 relative">
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={authPassword} 
                      onChange={(e) => setAuthPassword(e.target.value)} 
                      placeholder="Access Password" 
                      required 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 pr-12 text-xs text-white focus:border-[#DC2626]/50 transition-all outline-none" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-all"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {validationErrors.password && <p className="text-[9px] text-red-500 font-bold uppercase tracking-wider ml-1">{validationErrors.password}</p>}
                  
                  {authMode === 'signup' && authPassword && (
                    <div className="flex flex-col gap-1 px-1">
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

                  {authMode === 'login' && (
                    <div className="text-right pt-1">
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
                        className="text-[8px] font-black text-[#DC2626] hover:underline uppercase tracking-wider"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>
                
                <button type="submit" disabled={isAuthLoading} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-3.5 rounded-xl text-[10px] transition-all shadow-lg shadow-[#DC2626]/20 uppercase tracking-[0.2em] flex items-center justify-center gap-2 mt-4">
                  {isAuthLoading ? <RefreshCcw className="animate-spin" size={14} /> : (authMode === 'login' ? 'LOGIN' : 'Create Account')}
                </button>
              </form>

              <div className="mt-5 text-center">
                <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-[9px] font-black text-[#DC2626] hover:underline uppercase tracking-widest">
                  {authMode === 'login' ? "New Here? Create Account" : "Registered? Login Here"}
                </button>
              </div>

              <div className="mt-6 pt-5 border-t border-white/5">
                <button 
                  onClick={handleGoogleLogin} 
                  className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 py-3.5 rounded-xl text-[9px] font-black transition-all uppercase tracking-widest"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-3.5 h-3.5" />
                  Login with Google
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
            className={`flex h-full overflow-hidden ${isDesktop ? 'flex-row' : 'flex-col'} flex-1`}
          >
            {/* Desktop Sidebar */}
            {isDesktop && (
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
                      onClick={() => setActiveTab(item.id as any)}
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
            {/* HEADER - Only visible on Home tab or if mobile */}
            {activeTab === 'home' && (
              <header
                className="px-4 sm:px-6 py-3 flex justify-between items-center shrink-0"
                style={{
                  background: 'var(--bg-surface)',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                {/* Left — Wordmark */}
                <div className="flex items-center gap-3">
                  {!isDesktop && (
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center relative shrink-0"
                      style={{
                        background: 'var(--accent-primary)',
                        boxShadow: '0 0 16px var(--accent-glow)',
                      }}
                    >
                      <span
                        className="font-black text-white text-base leading-none"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        N
                      </span>
                      {totalUnreadMessages > 0 && (
                        <span
                          className="absolute -top-1 -right-1 w-4 h-4 text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white"
                          style={{ background: 'var(--accent-primary)', color: '#fff' }}
                        >
                          {totalUnreadMessages}
                        </span>
                      )}
                    </div>
                  )}
                  <div>
                    <h1
                      className="text-sm sm:text-base font-black tracking-tight leading-none uppercase italic text-white"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      NSG (NUELL STUDY GUIDE)
                    </h1>
                    <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">STUDY HUB v4.0</span>
                  </div>
                </div>

                {/* Right — Actions */}
                <div className="flex items-center gap-2">
                  {/* Premium CTA */}
                  {!isPremium && (
                    <button
                      onClick={() => setShowPremiumModal(true)}
                      className="premium-badge hidden sm:inline-flex"
                    >
                      ✦ Upgrade
                    </button>
                  )}

                  {/* Notifications */}
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className="relative p-2 rounded-xl transition-all"
                    style={{ background: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
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

                  {/* Install PWA */}
                  {!isStandalone && showInstallTimer && (
                    <button
                      onClick={handleInstallClick}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all"
                      style={{ background: '#16a34a', boxShadow: '0 4px 12px rgba(22,163,74,0.3)' }}
                    >
                      ↓ {showInstallBtn ? 'Install App' : 'Use In App'}
                    </button>
                  )}

                  {/* Auth */}
                  {user ? (
                    <div className="items-center gap-2 hidden sm:flex">
                      <div className="text-right">
                        <p
                          className="text-[10px] font-black uppercase leading-none"
                          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                        >
                          {user.displayName}
                        </p>
                        <p className="text-[8px] uppercase font-bold" style={{ color: 'var(--text-tertiary)' }}>
                          {isAdminUser ? 'Admin' : 'Scholar'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                      className="px-4 py-2 bg-[#DC2626] hover:bg-red-500 text-white font-black uppercase text-[9px] tracking-widest rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
                    >
                      SIGN IN
                    </button>
                  )}

                  {/* Theme toggle (header — mobile visible) */}
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-xl transition-all"
                    style={{ background: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                    title={theme === 'dark' ? 'Luxury Light Mode' : 'Premium Dark Mode'}
                  >
                    {theme === 'dark' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    )}
                  </button>

                  {/* System status */}
                  <div
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full"
                    style={{ background: 'var(--border-subtle)', border: '1px solid var(--border-subtle)' }}
                  >
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                      Online
                    </span>
                  </div>
                </div>
              </header>
            )}

      {/* MAIN CONTENT */}
      <main 
        className={`flex-1 ${(activeTab === 'chat' || activeTab === 'class' || activeTab === 'ai' || isDesktop) ? 'w-full' : 'max-w-4xl w-full mx-auto px-2 sm:px-4'} ${(activeTab === 'chat' || activeTab === 'class' || activeTab === 'ai') ? 'pb-0 overflow-hidden pt-0' : 'pb-24 overflow-y-auto pt-4'} flex flex-col custom-scrollbar ${isDesktop ? 'px-8' : ''}`}
        style={{
          backgroundColor: 'var(--bg-base)',
        }}
      >
        {/* Global Notification System */}
        <AnimatePresence>
          {userNotification && (
            <>
              {/* Centered Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setUserNotification(null)}
                className="fixed inset-0 bg-black/75 backdrop-blur-md z-[2000]"
              />
              {/* Sweet Looking Centered Gradient Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2001] w-[90%] max-w-sm"
              >
                <div className="bg-gradient-to-br from-[#1E1B2E] via-[#0A0714] to-[#120F1F] p-6 rounded-[2.5rem] shadow-3xl text-left border border-red-500/30 overflow-hidden relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.15),transparent_50%)] pointer-events-none" />
                  
                  <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#DC2626] to-[#991B1B] p-0.5 flex items-center justify-center shadow-xl shadow-red-500/10">
                      <div className="w-full h-full rounded-[14px] bg-zinc-950 flex items-center justify-center text-red-500">
                        <AlertCircle size={24} />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 w-full">
                      <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">Study Notification</h4>
                      <p className="text-xs font-bold text-white/95 leading-relaxed font-sans px-2">
                        {userNotification}
                      </p>
                    </div>

                    <button 
                      onClick={() => setUserNotification(null)}
                      className="w-full py-2.5 px-6 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#991B1B] border-b-[4px] border-[#7F1D1D] text-white font-black uppercase tracking-widest text-[9px] hover:from-red-500 hover:to-red-700 active:border-b-0 active:translate-y-[4px] active:shadow-inner transition-all shadow-lg cursor-pointer"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          
          {/* HOME TAB */}
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6 pt-4">
              {!isOnline && (
                <div className="bg-[#DC2626]/10 border border-[#DC2626]/20 p-3 rounded-2xl flex items-center gap-3 mx-2">
                  <div className="w-8 h-8 bg-[#DC2626] rounded-full flex items-center justify-center text-white">
                    <AlertCircle size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-tight">Offline Mode Active</p>
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">You can still record lectures. They will sync when online.</p>
                  </div>
                </div>
              )}


              {/* Rebuilt Academic Leaderboard Widget - Connected perfectly to the home page */}
              <div className="mx-2 p-5 rounded-[2.2rem] bg-gradient-to-br from-[#1E1B2E] via-[#120F1F] to-[#0A0714] border border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#DC2626]/10 blur-[50px] rounded-full -mr-16 -mt-16 animate-pulse" />
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-yellow-500 flex items-center gap-1.5 leading-none">
                      <span>🏆 Scholar Leaderboard</span>
                    </h3>
                    <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest mt-1">Strive for high spots on the scholar leaderboard</p>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveTab('community');
                      setCommunitySubTab('rankings');
                    }}
                    className="bg-[#DC2626]/20 hover:bg-[#DC2626] text-white text-[8px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border border-[#DC2626]/30 transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <span>World Rankings</span>
                    <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1.5">
                  {/* USER STATS PREVIEW */}
                  <div className="flex items-center gap-3 bg-white/5 border border-white/5 p-3.5 rounded-2xl">
                    <div className="w-12 h-12 rounded-full border-2 border-yellow-500 flex items-center justify-center bg-yellow-500/10 text-xl font-bold shrink-0">
                      {getScholarTierInfo(currentUserData?.points || 0).icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none">Your Rank</span>
                        <span className={`text-[8.5px] font-black uppercase tracking-wider ${getScholarTierInfo(currentUserData?.points || 0).color}`}>
                          {currentUserData?.rank || getUserRank(currentUserData?.points || 0)}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-base font-black text-white leading-none">{currentUserData?.points || 0}</span>
                        <span className="text-[7px] font-black text-[#DC2626] uppercase tracking-wider">XP points</span>
                      </div>
                      {/* Streak badge */}
                      <span className="inline-flex items-center gap-1 bg-[#DC2626]/10 text-[#DC2626] text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-1.5">
                        🔥 {currentUserData?.streak || 0}-DAY STREAK
                      </span>
                    </div>
                  </div>

                  {/* PREVIEW OF TOP 3 SCHOLARS */}
                  <div className="flex flex-col justify-center bg-white/5 border border-white/5 p-3.5 rounded-2xl relative">
                    <p className="text-[7.5px] font-black text-white/30 uppercase tracking-[0.18em] mb-2">TOP 3 SCHOLARS IN THE WORLD</p>
                    <div className="flex items-center gap-2">
                      {leaderboard.slice(0, 3).map((scholar, idx) => (
                        <div key={scholar.id || idx} className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1.5 rounded-xl border border-white/5">
                          <span className="text-[9px] font-bold">
                            {idx === 0 ? '👑' : idx === 1 ? '🥈' : '🥉'}
                          </span>
                          <div className="w-5 h-5 rounded-full overflow-hidden bg-white/10 border border-white/10">
                            {scholar.photoURL ? <img src={scholar.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-full h-full flex items-center justify-center text-white/20"><User size={12} /></div>}
                          </div>
                          <span className="text-[8px] font-black text-white truncate max-w-[45px] uppercase">
                            {scholar.username || scholar.displayName?.split(' ')[0] || "Scholar"}
                          </span>
                        </div>
                      ))}
                      {leaderboard.length === 0 && (
                        <p className="text-[8px] text-white/20 uppercase font-black">Waiting for scholars...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Quests Map & Claims - Beautifully displayed on the Homepage too! */}
              <div className="mx-2 p-5 rounded-[2.2rem] bg-gradient-to-br from-[#120F1F] via-[#1E1B2E] to-[#0A0714] border border-white/5 shadow-2xl space-y-4 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 blur-3xl rounded-full" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-pink-500 flex items-center gap-1.5 leading-none">
                      <span>🎯 Daily Study Quests</span>
                    </h3>
                    <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest mt-1">Complete daily activities to claim XP rewards instantly</p>
                  </div>
                  <span className="text-[7.5px] font-black uppercase px-2 py-1 bg-pink-500/10 text-pink-400 rounded-lg border border-pink-500/20">
                    {dailyQuests.filter(q => q.isDone).length} / 3 Complete
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
                  {dailyQuests.map((qst, idx) => {
                    const isClaimed = currentUserData?.claimedQuests?.includes(qst.id);
                    const canClaim = qst.isDone && !isClaimed;

                    const handleQuestClaim = async () => {
                      if (!user?.uid) {
                        setShowAuthModal(true);
                        return;
                      }
                      try {
                        await updateDoc(doc(db, 'users', user.uid), {
                          claimedQuests: arrayUnion(qst.id),
                          points: increment(50)
                        });
                        setUserNotification(`🎁 Daily study quest completed! Claimed +50 XP bonus.`);
                      } catch (e) {
                        setUserNotification("Error claiming quest points. Try again!");
                      }
                    };

                    const handleQuestAction = () => {
                      if (canClaim) {
                        handleQuestClaim();
                      } else if (isClaimed) {
                        setUserNotification("🌈 Quest already claimed! Keep studying tomorrow for more.");
                      } else {
                        setActiveTab(qst.targetTab as any);
                        if (qst.targetSubTab) {
                          setToolsSubTab(qst.targetSubTab as any);
                        }
                        setUserNotification(`🚀 Let's go do the "${qst.title}" study milestone!`);
                      }
                    };

                    return (
                      <div key={idx} className="bg-white/[0.02] p-4 rounded-2xl flex flex-col justify-between space-y-3 border border-white/5 hover:bg-white/[0.04] transition-all relative overflow-hidden group">
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5 min-w-0 flex-1 pr-1">
                            <span className={`text-[6.5px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest ${isClaimed ? 'bg-zinc-500/10 text-zinc-500' : qst.isDone ? 'bg-green-500/10 text-green-400 animate-pulse' : 'bg-red-500/10 text-red-400'}`}>
                              {isClaimed ? 'CLAIMED' : qst.isDone ? 'COMPLETED' : 'PENDING'}
                            </span>
                            <h4 className="font-bold text-[10.5px] text-white uppercase tracking-tight truncate mt-1">{qst.title}</h4>
                            <p className="text-[8.5px] text-white/40 leading-tight uppercase font-medium">{qst.desc}</p>
                          </div>
                          <span className="text-xl shrink-0">{qst.chest}</span>
                        </div>

                        <button 
                          type="button"
                          onClick={handleQuestAction}
                          className={`w-full py-2 px-3 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all active:scale-95 ${canClaim ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md shadow-green-500/10 hover:opacity-95' : isClaimed ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5' : 'bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-450 hover:shadow-md text-white'}`}
                        >
                          {canClaim ? "CLAIM +50 XP" : isClaimed ? "CLAIMED" : qst.buttonLabel}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dual-Mode Activity Feed: Communal Pulse (Social Feed) vs Personal Studio History */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
                  <h2 
                    className="text-xl font-black uppercase tracking-tighter"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                  >
                    Recent Activity
                  </h2>
                  <div className="flex items-center gap-0 bg-white/5 p-0.5 rounded-xl border border-white/5 shrink-0">
                    <button 
                      type="button"
                      onClick={() => setHomeFeedTab('community')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${homeFeedTab === 'community' ? 'bg-gradient-to-r from-red-500 to-blue-600 text-white shadow-md shadow-red-500/10' : 'text-white/40 hover:text-white/70'}`}
                    >
                      🔥 Scholar Feed
                    </button>
                    <button 
                      type="button"
                      onClick={() => setHomeFeedTab('personal')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${homeFeedTab === 'personal' ? 'bg-gradient-to-r from-red-500 to-blue-600 text-white shadow-md shadow-red-500/10' : 'text-white/40 hover:text-white/70'}`}
                    >
                      ⚡ My Studio
                    </button>
                  </div>
                </div>

                {homeFeedTab === 'community' ? (
                  <div className="space-y-3 pb-10">
                    {/* DAILY STUDY RECOMMENDATIONS */}
                    <div className="bg-gradient-to-br from-[#1E1B2E]/90 to-[#0A0714]/90 p-5 rounded-[2rem] border border-white/5 space-y-4 mb-4 shadow-2xl relative overflow-hidden text-left">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.08),transparent_50%)]" />
                      <div className="flex items-center justify-between relative z-10">
                        <div className="space-y-0.5">
                          <p className="text-[7.5px] font-black text-red-500 uppercase tracking-widest leading-none flex items-center gap-1.5 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            STUDY CATALYST
                          </p>
                          <h3 className="text-xs font-black uppercase text-white/90">Daily Recommendations</h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10">
                        {aiPersuasions.length === 0 ? (
                          <div className="col-span-full py-4 text-center">
                            <p className="text-[10px] text-white/45 font-semibold uppercase tracking-wider">No study recommendations available. Start studying to load insights!</p>
                          </div>
                        ) : (
                          aiPersuasions.map((persuasion, index) => (
                            <div 
                              key={persuasion.id || index}
                              className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col justify-between space-y-3 group text-left relative overflow-hidden"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[7px] font-mono font-black text-white/40 uppercase tracking-wide">
                                    {persuasion.reward || 'Earn +100 XP'}
                                  </span>
                                  {persuasion.type === 'streak' ? (
                                    <span className="text-[10px]">🔥</span>
                                  ) : persuasion.type === 'quiz' ? (
                                    <span className="text-[10px]">⚡</span>
                                  ) : (
                                    <span className="text-[10px]">📝</span>
                                  )}
                                </div>
                                <h4 className="text-[10.5px] font-black uppercase tracking-tight text-white group-hover:text-red-400 transition-colors">
                                  {persuasion.title}
                                </h4>
                                <p className="text-[10px] text-white/65 leading-relaxed font-semibold">
                                  {persuasion.message}
                                </p>
                              </div>

                              <div className="flex items-stretch overflow-hidden rounded-xl bg-white/5 border border-white/5 shadow-md h-8 mt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (persuasion.type === 'quiz') {
                                      setActiveTab('tools');
                                      setToolsSubTab('quiz');
                                    } else if (persuasion.type === 'notebook') {
                                      setActiveTab('tools');
                                      setToolsSubTab('notebook');
                                    } else {
                                      setActiveTab('class');
                                    }
                                    setUserNotification(`Challenge Accepted: "${persuasion.title}"!`);
                                  }}
                                  className="flex-1 bg-gradient-to-r from-red-500 to-blue-600 text-white font-black text-[8px] uppercase tracking-widest text-center hover:opacity-95 active:scale-95 transition-all flex items-center justify-center border-none"
                                >
                                  {persuasion.actionLabel || 'EXECUTE ⚡'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => sendPersuasiveEmail(persuasion)}
                                  disabled={sendingEmailLoader}
                                  className="px-3 bg-black/40 hover:bg-black/60 text-white/65 hover:text-white transition-all border-l border-white/5 flex items-center justify-center text-[10px] border-none"
                                  title="Send Gorgeous Email Spark"
                                >
                                  📬
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#120F1F]/60 via-[#1E1B2E]/50 to-[#0F0D1B]/40 shadow-xl overflow-hidden rounded-[2.2rem] border border-white/5 divide-y divide-white/[0.04]">
                      {globalActivities.map((act) => (
                        <div 
                          key={act.id}
                          className="p-5 relative overflow-hidden group hover:bg-white/[0.01] transition-all duration-300 text-left"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/0 via-red-500/5 to-blue-500/0 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2E2452] to-[#12092D] flex items-center justify-center text-sm font-bold shadow-md shadow-black/40 shrink-0 border border-white/5">
                                {act.userId === user?.uid ? '⭐' : '🎓'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-white/90 leading-relaxed">
                                  {act.text}
                                </p>
                                <p className="text-[8px] font-mono text-white/30 uppercase mt-1 tracking-widest flex items-center gap-1.5">
                                  <span className="font-bold text-red-400">{act.username || 'Scholar'}</span>
                                  <span>•</span>
                                  <span>{act.timestamp ? new Date(act.timestamp?.toMillis ? act.timestamp.toMillis() : act.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}</span>
                                </p>
                              </div>
                            </div>

                            {/* DYNAMIC ACTION BUTTON FOR LEAD GENERATION OR INVITES */}
                            <div className="flex items-center gap-0 overflow-hidden rounded-xl bg-white/5 border border-white/5 shadow-md h-8 self-start sm:self-center">
                              <button 
                                type="button"
                                onClick={() => triggerAIPeerChallenge(act)}
                                disabled={loadingActChallengeId === act.id}
                                className="px-3.5 bg-gradient-to-r from-red-500 to-blue-600 hover:opacity-95 active:scale-95 text-white font-black text-[8px] uppercase tracking-widest transition-all h-full border-none flex items-center justify-center whitespace-nowrap"
                              >
                                {loadingActChallengeId === act.id ? "Analyzing... 🔮" : "AI SUGGEST 🔮"}
                              </button>
                              {user && act.userId !== user.uid && (
                                <button
                                  type="button"
                                  onClick={() => initiateQuickStreakSession(act)}
                                  className="px-3 bg-black/40 hover:bg-black/60 text-white/50 hover:text-white transition-all border-l border-white/5 flex items-center justify-center text-[10px] h-full border-none"
                                  title="Launch Instant Duel Streak"
                                >
                                  ⚡
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* PERSONAL STUDIO STUDY HISTORY (EXISTING HOMEHISTORY) */
                  homeHistory.length === 0 ? (
                    <div 
                      className="p-12 rounded-[2.2rem] text-center space-y-4"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: 'var(--shadow-card)',
                      }}
                    >
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                        style={{ backgroundColor: 'var(--accent-glow)' }}
                      >
                        <History size={26} style={{ color: 'var(--accent-primary)' }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        No recent activity found. Start studying to see your history here!
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-[#120F1F]/60 via-[#1E1B2E]/50 to-[#0F0D1B]/40 shadow-xl overflow-hidden rounded-[2.2rem] border border-white/5 divide-y divide-white/[0.03] pb-0 mb-10">
                      {homeHistory.map((item) => (
                        <div 
                          key={item.id}
                          onClick={async () => {
                            if (item.type === 'quiz') {
                              setActiveTab('tools');
                              setToolsSubTab('quiz');
                              
                              // Load quiz data if it's a specific quiz ID
                              let targetQuizId = '';
                              if (item.id.startsWith('quiz-')) {
                                targetQuizId = item.id.replace('quiz-', '');
                                if (targetQuizId.startsWith('fin-')) targetQuizId = ''; // Not a persistent quiz link
                              }

                              if (targetQuizId && targetQuizId !== 'current-quiz') {
                                  await loadSharedQuiz(targetQuizId);
                                  
                                  if (item.score !== undefined) {
                                    setQuizState('finished');
                                    setQuizScore(item.score);
                                    if (item.answers) setUserQuizAnswers(item.answers);
                                  }
                                  return;
                              }

                              // If it's a finished local quiz with questions and score
                              if (item.score !== undefined && item.questions) {
                                setQuizQuestions(item.questions);
                                setQuizScore(item.score);
                                setQuizState('finished');
                                if (item.answers) setUserQuizAnswers(item.answers);
                                if (item.topic) setQuizTopic(item.topic);
                                if (item.difficulty) setQuizDifficulty(item.difficulty as any);
                                return;
                              }

                              // Try to restore unfinished progress
                              const cleanId = item.id.replace(/^quiz-/, '');
                              const progressKey = (cleanId === 'current-quiz' || item.id === 'current-quiz') ? 'nsg_current_quiz_progress' : `nsg_quiz_progress_${cleanId}`;
                              const localProgress = localStorage.getItem(progressKey);
                              
                              if (localProgress) {
                                try {
                                  const p = JSON.parse(localProgress);
                                  setQuizQuestions(p.quizQuestions);
                                  setQuizTopic(p.quizTopic);
                                  setCurrentQuestionIndex(p.currentQuestionIndex);
                                  setQuizScore(p.quizScore);
                                  setUserQuizAnswers(p.userQuizAnswers || []);
                                  setQuizDifficulty(p.quizDifficulty || 'Medium');
                                  setQuizQuestionCount(p.quizQuestionCount || p.quizQuestions.length);
                                  setCurrentQuizId(p.currentQuizId);
                                  setQuizState('active');
                                  setSelectedOption(p.userQuizAnswers?.[p.currentQuestionIndex] !== undefined ? p.userQuizAnswers[p.currentQuestionIndex] : null);
                                  setIsAnswered(p.userQuizAnswers?.[p.currentQuestionIndex] !== undefined);
                                } catch (e) {
                                  console.error("Failed to restore history quiz progress:", e);
                                }
                              } else if (item.questions) {
                                  // Fallback: directly from history item if progress storage is gone but questions exist
                                  setQuizQuestions(item.questions);
                                  setQuizTopic(item.title);
                                  setQuizState('active');
                                  setCurrentQuestionIndex(0);
                              }
                            } else if (item.type === 'exam') {
                              setActiveTab('tools');
                              setToolsSubTab('exam');
                              if (item.score !== undefined) {
                                setExamLobbyState('result');
                                setExamScore(item.score);
                              }
                            } else if (item.type === 'recording') {
                              const session = sessions.find(s => s.id === item.id);
                              if (session) {
                                loadRecordingSession(session);
                                setActiveTab('tools');
                                setToolsSubTab('record');
                              }
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
                                setActiveTab('tools');
                                setToolsSubTab('notebook');
                                setNoteHistory([]);
                                setRedoStack([]);
                              }
                            } else if (item.type === 'faculty') {
                              setActiveTab('tools');
                              setToolsSubTab('faculty');
                            }
                          }}
                          className="history-item text-left border-none hover:bg-white/[0.01] transition-all duration-300"
                        >
                          <div className="p-4 flex items-center justify-between w-full">
                            <div className="flex items-center gap-3.5 font-medium">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 border border-white/5 shadow-inner shrink-0">
                                {item.type === 'quiz' ? <Zap size={14} style={{ color: 'var(--accent-gold)' }} /> : 
                                 item.type === 'exam' ? <Trophy size={14} style={{ color: 'var(--accent-primary)' }} /> : 
                                 item.type === 'assignment' ? <BookOpen size={14} className="text-purple-500" /> :
                                 (item.type as any) === 'note' ? <FileText size={14} className="text-blue-500" /> :
                                 <Mic size={14} className="text-red-500" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p 
                                  className="text-xs font-semibold uppercase tracking-tight truncate animate-none text-white/95"
                                  style={{ fontFamily: 'var(--font-display)' }}
                                >
                                  <span className="opacity-40 font-mono text-[8px] mr-1.5 truncate inline-block max-w-[50px] shrink-0">{item.type.toUpperCase()}:</span>
                                  <span>{item.title}</span>
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p 
                                    className="text-[8.5px] font-mono text-white/40 uppercase tracking-widest"
                                  >
                                    {item.score !== undefined ? `SCORE: ${item.score}/${item.total || 25}` : (item.progress !== undefined ? `${item.progress}% DONE` : item.date)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                               <button 
                                 type="button"
                                 onClick={(e) => removeFromHistory(item.id, e)}
                                 className="p-1 px-1.5 rounded-lg transition-all text-white/30 hover:text-red-500 bg-transparent border-none cursor-pointer"
                               >
                                 <Trash2 size={13} />
                               </button>
                               <ChevronRight size={13} style={{ color: 'var(--text-tertiary)' }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </motion.div>
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
              GeminiLive={GeminiLive}
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
              userNotes={userNotes}
              setUserNotes={setUserNotes}
              saveNote={saveNote}
              deleteNote={deleteNote}
              quizState={quizState}
              setQuizState={setQuizState}
              quizTopic={quizTopic}
              setQuizTopic={setQuizTopic}
              quizQuestionCount={quizQuestionCount}
              setQuizQuestionCount={setQuizQuestionCount}
              quizDifficulty={quizDifficulty}
              setQuizDifficulty={setQuizDifficulty}
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
              setChatHistory={setChatHistory}
              setActiveChatSessionId={setActiveChatSessionId}
            />
          )}

          {/* OLD_TEMPORARY_DISABLE */}
          {false && activeTab === 'tools' && (
            <motion.div key="tools" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              {toolsSubTab === 'menu' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black uppercase tracking-tighter text-white">Tools & Study</h2>
                    <Brain size={20} className="text-[#DC2626]" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'record', title: 'Record Lecture', icon: Mic, color: 'from-red-600 to-red-400', desc: 'AI-Powered Recording' },
                      { id: 'live', title: 'Live AI Tutor', icon: Activity, color: 'from-[#DC2626] to-red-600', desc: 'Vision-Enabled Real-time Help' },
                      { id: 'class', title: 'Live Classroom', icon: Video, color: 'from-pink-600 to-rose-400', desc: 'Host or Join Lectures', action: () => setActiveTab('class') },
                      { id: 'quiz', title: 'Smart Quiz', icon: Zap, color: 'from-yellow-500 to-amber-400', desc: 'Test Your Knowledge' },
                      { id: 'exam', title: 'CBT Exam', icon: ShieldCheck, color: 'from-orange-600 to-orange-400', desc: 'Professional Testing' },
                      { id: 'faculty', title: 'Faculty Specials', icon: GraduationCap, color: 'from-blue-600 to-indigo-400', desc: 'Department Specific' },
                      { id: 'assignment', title: 'Assignment Solver', icon: BookOpen, color: 'from-purple-600 to-pink-400', desc: 'Step-by-Step AI Solutions' },
                      { id: 'courses', title: 'Courses Tool', icon: BookOpen, color: 'from-emerald-600 to-teal-400', desc: 'Course-Specific Learning' },
                      { id: 'notebook', title: 'Notebook Tool', icon: FileText, color: 'from-amber-600 to-yellow-400', desc: 'AI-Powered Sources' },
                      { id: 'whatsapp', title: 'Omni on WHATSAPP', icon: WhatsAppIcon, color: 'from-green-600 to-green-400', desc: '+2349064470122' }
                    ].map((tool) => (
                      <button 
                        key={tool.id}
                        onClick={() => {
                          if (tool.id === 'whatsapp') {
                            window.open("https://wa.me/2349064470122", "_blank");
                            return;
                          }
                          if ((tool as any).action) {
                            (tool as any).action();
                            return;
                          }
                          setToolsSubTab(tool.id as any);
                        }}
                        className={`flex flex-col items-start p-5 rounded-[2rem] border transition-all text-left group relative overflow-hidden ${theme === 'dark' ? 'bg-gradient-to-br from-[#1E1B2E]/90 to-[#0A0714]/95 border-white/5 hover:border-[#DC2626]/40 shadow-2xl' : 'bg-white border-slate-200 hover:border-[#DC2626]/50 shadow-sm'}`}
                      >
                        {theme === 'dark' && (
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.03),transparent_60%)] group-hover:bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.07),transparent_50%)] transition-all duration-500 pointer-events-none" />
                        )}
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform relative z-10`}>
                          <tool.icon size={24} />
                        </div>
                        <h3 className={`font-black text-sm uppercase tracking-tight relative z-10 ${theme === 'dark' ? 'text-white/90' : 'text-slate-900'}`}>{tool.title}</h3>
                        <p className={`text-[10px] font-bold relative z-10 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'} uppercase`}>{tool.desc}</p>
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-white/5 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 text-center">Upcoming Tools</p>
                    <div className="grid grid-cols-2 gap-4 opacity-70">
                      {[
                        { id: 'td', title: 'TD Tool', icon: BoxSelect, color: 'from-slate-500 to-slate-600', desc: '2D Projection Engine' },
                      ].map((tool) => (
                        <button 
                          key={tool.id}
                          onClick={() => {
                            setUserNotification(`${tool.title} is currently in development and will be back soon.`);
                          }}
                          className={`flex flex-col items-start p-5 rounded-[2rem] border transition-all text-left group relative overflow-hidden ${theme === 'dark' ? 'bg-gradient-to-br from-[#1E1B2E]/50 to-[#0A0714]/70 border-white/5 hover:border-[#DC2626]/40 shadow-2xl' : 'bg-white border-slate-200 hover:border-[#DC2626]/50 shadow-sm'}`}
                        >
                          {theme === 'dark' && (
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.01),transparent_60%)] group-hover:bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.04),transparent_50%)] transition-all duration-500 pointer-events-none" />
                          )}
                          <div className="absolute top-2 right-2 bg-[#DC2626] text-white text-[7px] font-black px-2 py-0.5 rounded-full z-20 animate-pulse">
                            SOON
                          </div>
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white mb-3 shadow-lg grayscale relative z-10`}>
                            <tool.icon size={20} />
                          </div>
                          <h3 className={`font-black text-[12px] uppercase tracking-tight relative z-10 ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>{tool.title}</h3>
                          <p className={`text-[9px] font-bold relative z-10 ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'} uppercase`}>Coming Soon</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {toolsSubTab !== 'menu' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <button 
                      onClick={() => setToolsSubTab('menu')}
                      className="flex items-center gap-2 text-[10px] font-black text-[#DC2626] uppercase tracking-widest hover:opacity-70 transition-all"
                    >
                      <ArrowLeft size={14} /> Back to Tools
                    </button>
                    <div className="flex items-center gap-4">
                       <button 
                         onClick={() => setShowHelp(true)}
                         className="text-[10px] font-black text-[#DC2626] uppercase tracking-widest hover:bg-white/5 px-3 py-1 rounded-full transition-all border border-[#DC2626]/20"
                       >
                         Help
                       </button>
                       <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                         {toolsSubTab === 'record' && 'Recording Engine'}
                         {toolsSubTab === 'live' && 'Live AI Tutor'}
                         {toolsSubTab === 'quiz' && 'Quiz Engine'}
                        {toolsSubTab === 'exam' && 'CBT Examination'}
                        {toolsSubTab === 'faculty' && 'Faculty Specials'}
                        {toolsSubTab === 'assignment' && 'Assignment Solver'}
                        {toolsSubTab === 'courses' && 'Course-Specific Tools'}
                       </span>
                    </div>
                  </div>
                  
                  {toolsSubTab === 'record' && (
                    <motion.div key="record" initial={{opacity:0, y: 10}} animate={{opacity:1, y: 0}} exit={{opacity: 0}} className="space-y-6 relative">
                      {/* Sliding Record Sidebar */}
                      <AnimatePresence>
                        {showRecordSidebar && (
                          <>
                            <motion.div 
                              initial={{ opacity: 0 }} 
                              animate={{ opacity: 1 }} 
                              exit={{ opacity: 0 }}
                              onClick={() => setShowRecordSidebar(false)}
                              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                            />
                            <motion.div 
                              initial={{ x: '-100%' }} 
                              animate={{ x: 0 }} 
                              exit={{ x: '-100%' }}
                              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                              className={`fixed left-0 top-0 bottom-0 w-1/2 min-w-[280px] z-[70] border-r ${theme === 'dark' ? 'border-white/10 bg-[#13111C]' : 'border-slate-200 bg-white'} flex flex-col shadow-2xl`}
                            >
                              <div className={`p-4 border-b ${theme === 'dark' ? 'border-white/10' : 'border-slate-200'} flex items-center justify-between`}>
                                <button 
                                  onClick={() => {
                                    setShowAnalysisInRecord(false);
                                    setSelectedSession(null);
                                    setShowRecordSidebar(false);
                                    setAudioUrl(null);
                                    setRecordedBlob(null);
                                    setUploadedImages([]);
                                  }} 
                                  className="flex-1 flex items-center justify-center gap-2 bg-[#DC2626] text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-[#DC2626]/20 hover:bg-[#DC2626]/90 transition-all"
                                >
                                  <PlusCircle size={16} /> New Recording
                                </button>
                                <button onClick={() => setShowRecordSidebar(false)} className={`p-2 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'} ml-2 hover:text-[#DC2626] transition-colors`}><XCircle size={20} /></button>
                              </div>
                              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                <p className={`text-[10px] font-black ${theme === 'dark' ? 'text-white/20' : 'text-slate-300'} uppercase tracking-widest px-3 py-2`}>Analysis History</p>
                                {sessions.map(session => (
                                  <div key={session.id} className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${selectedSession?.id === session.id ? 'bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626]' : `hover:bg-white/5 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}`}>
                                    <div 
                                      onClick={() => loadRecordingSession(session)} 
                                      className="flex items-center gap-2 overflow-hidden flex-1"
                                    >
                                      {session.isPinned ? <Pin size={12} className="text-red-500" /> : <FileAudio size={14} className="flex-shrink-0" />}
                                      <div className="flex flex-col overflow-hidden">
                                        <div className="flex items-center gap-1">
                                          <span className="text-[10px] font-black truncate group-hover:text-red-500 transition-colors uppercase tracking-tight">{session.title}</span>
                                          {session.status === 'pending' && <span className="text-[7px] bg-[#DC2626]/20 text-[#DC2626] px-1 rounded font-black uppercase tracking-tighter">Live</span>}
                                        </div>
                                        <span className="text-[8px] opacity-60">{session.date} | {session.duration}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                      <button 
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          const newName = prompt("Enter a name for this recording:", session.title);
                                          if (newName && user) {
                                            updateDoc(doc(db, 'users', user.uid, 'lectureSessions', session.id), { title: newName });
                                            setUserNotification("Recording renamed successfully.");
                                          }
                                        }} 
                                        className="p-1.5 hover:bg-blue-500 hover:text-white bg-slate-100 dark:bg-white/5 rounded-lg transition-all" 
                                        title="Rename / Save Audio"
                                      >
                                        <Save size={12} />
                                      </button>
                                      {session.audioBase64 && (
                                        <button 
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            const link = document.createElement('a');
                                            link.href = `data:audio/webm;base64,${session.audioBase64}`;
                                            link.download = `${session.title || 'recording'}.webm`;
                                            link.click();
                                          }} 
                                          className="p-1.5 hover:text-green-500 bg-slate-100 dark:bg-white/5 rounded-lg transition-all" 
                                          title="Download Audio"
                                        >
                                          <Download size={12} className="text-slate-400" />
                                        </button>
                                      )}
                                      <button onClick={(e) => { e.stopPropagation(); togglePinLectureSession(session.id); }} className="p-1.5 hover:text-red-500 bg-slate-100 dark:bg-white/5 rounded-lg transition-all" title="Pin Lecture">
                                        <Pin size={12} className={session.isPinned ? 'fill-red-500 text-red-500' : 'text-slate-400'} />
                                      </button>
                                      <button 
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          showConfirm(
                                            "Delete Recording",
                                            `Are you sure you want to delete "${session.title}"? This cannot be undone.`,
                                            () => deleteLectureSession(session.id),
                                            "Delete Permanently",
                                            true
                                          );
                                        }} 
                                        className="p-1.5 hover:text-red-500 bg-slate-100 dark:bg-white/5 rounded-lg transition-all" 
                                        title="Delete Lecture"
                                      >
                                        <Trash2 size={12} className="text-slate-400" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                <AdUnit slot="7536999840" />
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>

                      <div className="flex items-center justify-between mb-2">
                        <button onClick={() => setShowRecordSidebar(true)} className={`p-2 ${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} border rounded-xl ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'} hover:text-[#DC2626] transition-all flex items-center gap-2`}>
                          <History size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">History</span>
                        </button>
                      </div>

                      <AnimatePresence mode="wait">
                        {!showAnalysisInRecord ? (
                          <motion.div key="recorder" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                            <div className={`${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} rounded-3xl p-8 border relative overflow-hidden shadow-sm`}>
                              <div className="flex flex-col items-center text-center relative z-10">
                                <div className="relative mb-6">
                                  {isRecording && <motion.div animate={{ scale: 1.6, opacity: 0.1 }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-[#DC2626] rounded-full blur-2xl pointer-events-none" />}
                                  <button 
                                    onClick={handleToggleRecording} 
                                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl ${isRecording ? (theme === 'dark' ? 'bg-white text-black' : 'bg-zinc-900 text-white') : 'bg-[#DC2626] text-white'} hover:scale-105 active:scale-95`}
                                  >
                                    {isRecording ? <StopCircle size={32} /> : <Mic size={32} />}
                                  </button>
                                </div>
                                  <h2 className="text-xl font-black tracking-tighter mb-1 uppercase text-white">
                                    {isRecording ? "Capture Active" : (isProcessingFinal ? "Finalizing Notes..." : "Engine Idle")}
                                  </h2>
                                  <p className="font-mono text-4xl text-[#DC2626] font-bold mb-6 tracking-tight">
                                    {formatTime(recordingTime)}
                                  </p>

                                  {isProcessingFinal && (
                                    <div className="flex items-center gap-2 mb-4">
                                      <RefreshCcw size={14} className="animate-spin text-[#DC2626]" />
                                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Transcription finalizing...</span>
                                    </div>
                                  )}

                                  {audioUrl && !isRecording && !isProcessingFinal && (
                                    <div className="w-full max-w-sm bg-white/5 p-4 rounded-2xl border border-white/10 mb-6">
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-black text-white/30 uppercase">Recording Preview</p>
                                        <button onClick={handleManualSave} className="flex items-center gap-1.5 bg-[#DC2626] text-white px-3 py-1 rounded-full text-[9px] font-black hover:bg-[#DC2626]/90 transition-all">
                                          <Save size={10} /> SAVE AS...
                                        </button>
                                      </div>
                                      <audio key={audioUrl} src={audioUrl} controls className="w-full h-8" />
                                    </div>
                                  )}

                                  <div className="flex gap-2 w-full max-w-xs">
                                    {audioUrl && !isRecording && !isProcessingFinal && (
                                      <a 
                                        href={audioUrl} 
                                        download="NSG_Lecture.mp3" 
                                        className={`flex-1 flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-white/10 text-white border-white/10' : 'bg-zinc-100 text-zinc-900 border-zinc-200'} px-4 py-3 rounded-2xl text-xs font-bold transition-all border`}
                                      >
                                        <Download size={16} /> Download
                                      </a>
                                    )}
                                    {!isRecording && !isProcessingFinal && (
                                      <button onClick={triggerFullAnalysis} disabled={isAnalyzing || !recordedBlob} className="flex-1 flex items-center justify-center gap-2 bg-[#DC2626]/10 hover:bg-[#DC2626] text-[#DC2626] hover:text-white px-4 py-3 rounded-2xl text-xs font-bold border border-[#DC2626]/30 transition-all disabled:opacity-50">
                                        <Sparkles size={16} /> Analyze
                                      </button>
                                    )}
                                  </div>

                                  {/* Real-time Transcription/Note Area */}
                                  {(transcriptionNotes || isRecording || isProcessingFinal) && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="w-full mt-8 bg-white/5 border border-white/10 rounded-3xl p-6 text-left"
                                    >
                                      <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-2 h-2 ${isRecording || isProcessingFinal ? 'bg-[#DC2626] animate-pulse' : 'bg-green-500'} rounded-full`} />
                                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                            {(isRecording || isProcessingFinal) ? "Capturing Lecture..." : "Transcribed Lecture Notes"}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {(isTranscribing || isProcessingFinal) && <RefreshCcw size={12} className="text-[#DC2626] animate-spin" />}
                                          <button 
                                            onClick={() => copyToClipboard(transcriptionNotes)}
                                            className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"
                                            title="Copy Notes"
                                          >
                                            <Copy size={14} />
                                          </button>
                                          <button 
                                            onClick={() => {
                                              saveNote(transcriptionNotes, `Lecture Note: ${new Date().toLocaleTimeString()}`);
                                              setUserNotification("Note saved to Vault!");
                                            }}
                                            className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-green-500 transition-all border border-white/5"
                                            title="Save to Notes Tool"
                                          >
                                            <Save size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    <div className={`max-h-60 overflow-y-auto pr-2 custom-scrollbar ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'} text-xs leading-relaxed`}>
                                      <MarkdownRenderer selectable={true} content={transcriptionNotes || (isRecording ? "Listening for content..." : "No notes captured yet.")} />
                                      {isTranscribing && <span className="inline-block w-1.5 h-3 ml-1 bg-[#DC2626]/50 animate-pulse" />}
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                            <AdUnit slot="7536999840" />
                          </motion.div>
                        ) : (
                          <motion.div key="analysis" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <div className={`${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} p-8 rounded-3xl border shadow-sm space-y-6`}>
                              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-[#DC2626]/10 rounded-xl flex items-center justify-center">
                                    <Sparkles size={20} className="text-[#DC2626]" />
                                  </div>
                                  <div>
                                    <h2 className="text-lg font-black text-white uppercase tracking-tighter">Omni Ai Analysis</h2>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                                      {selectedSession ? selectedSession.title : 'Deep Learning Insights'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => {
                                      showConfirm(
                                        "Delete Analysis",
                                        "Are you sure you want to delete this analysis result?",
                                        () => {
                                          setAnalysisResult(null);
                                          setRefurbishedResult(null);
                                          setShowAnalysisInRecord(false);
                                        },
                                        "Delete",
                                        true
                                      );
                                    }}
                                    className={`p-2 ${theme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-zinc-100 text-zinc-500'} rounded-xl hover:text-red-500 transition-all`}
                                    title="Delete Analysis"
                                  >
                                    <Trash2 size={20} />
                                  </button>
                                  <button 
                                    onClick={() => selectedSession && uploadHistoryToOmni(selectedSession)} 
                                    className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-white/5 text-white/70 border-white/10' : 'bg-zinc-100 text-zinc-600 border-zinc-200'} px-3 py-2 rounded-xl text-[10px] font-black hover:text-[#DC2626] transition-all border`}
                                  >
                                    <UserPlus size={14} /> UPLOAD TO OMNI
                                  </button>
                                  <button 
                                    onClick={() => setShowAnalysisInRecord(false)} 
                                    className={`p-2 ${theme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-zinc-100 text-zinc-500'} rounded-xl hover:text-[#DC2626] transition-all`}
                                  >
                                    <ArrowLeft size={20} />
                                  </button>
                                </div>
                              </div>

                              <div className="bg-white/5 rounded-2xl p-6 overflow-y-auto max-h-[60vh] shadow-inner space-y-6">
                                {audioUrl && (
                                  <div className="space-y-2">
                                    <h3 className="text-[10px] font-black text-[#DC2626] uppercase tracking-widest flex items-center gap-2">
                                      <FileAudio size={12} /> Recording Playback
                                    </h3>
                                    <audio key={audioUrl} src={audioUrl} controls className="w-full h-8" />
                                  </div>
                                )}
                                {selectedSession?.notes && (
                                  <div className="space-y-2">
                                    <h3 className="text-[10px] font-black text-[#DC2626] uppercase tracking-widest flex items-center gap-2">
                                      <Mic size={12} /> Transcribed Notes
                                    </h3>
                                    <div className="bg-white/5 p-4 rounded-xl text-xs text-white/70 italic border-l-2 border-[#DC2626]/30">
                                      {selectedSession.notes}
                                    </div>
                                  </div>
                                )}
                                <div className="space-y-2">
                                  <h3 className="text-[10px] font-black text-[#DC2626] uppercase tracking-widest flex items-center gap-2">
                                    <Brain size={12} /> AI Analysis
                                  </h3>
                                  <div className="markdown-body text-sm text-white leading-relaxed">
                                    <MarkdownRenderer content={analysisResult} />
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <button onClick={() => copyToClipboard(analysisResult)} className={`flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-white/5 text-white/70' : 'bg-zinc-100 text-zinc-600'} py-4 rounded-2xl text-[10px] font-black hover:bg-zinc-200 transition-all`}>
                                  <Copy size={16} /> COPY
                                </button>
                                <button onClick={() => shareAnalysis(analysisResult || '')} className={`flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-white/5 text-white/70' : 'bg-zinc-100 text-zinc-600'} py-4 rounded-2xl text-[10px] font-black hover:bg-zinc-200 transition-all`}>
                                  <Share2 size={16} /> SHARE
                                </button>
                                <button 
                                  onClick={() => {
                                    const newHistory: ChatMessage[] = [...chatHistory, { role: 'model', text: analysisResult, timestamp: new Date().toLocaleTimeString() }];
                                    setChatHistory(newHistory);
                                    setActiveTab('ai');
                                  }} 
                                  className="flex items-center justify-center gap-2 bg-[#DC2626] text-white py-4 rounded-2xl text-[10px] font-black hover:bg-[#DC2626]/90 transition-all shadow-lg shadow-[#DC2626]/20"
                                >
                                  <Brain size={16} /> CHAT
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {toolsSubTab === 'notebook' && (
                    <motion.div key="notebook" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex flex-col bg-[#13111C] overflow-hidden">
                       
                       {/* Side Drawer Overlay */}
                       <AnimatePresence>
                         {isNotebookDrawerOpen && (
                           <>
                             <motion.div 
                               initial={{ opacity: 0 }} 
                               animate={{ opacity: 1 }} 
                               exit={{ opacity: 0 }} 
                               onClick={() => setIsNotebookDrawerOpen(false)}
                               className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
                             />
                             <motion.div 
                               initial={{ x: '-100%' }} 
                               animate={{ x: 0 }} 
                               exit={{ x: '-100%' }} 
                               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                               className="fixed top-0 left-0 bottom-0 w-72 bg-[#0F172A] border-r border-white/10 z-[120] p-6 shadow-2xl"
                             >
                               <div className="flex items-center justify-between mb-8">
                                 <h2 className="text-sm font-black text-white uppercase tracking-widest">Notebook Tools</h2>
                                 <button onClick={() => setIsNotebookDrawerOpen(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
                               </div>
                               <div className="space-y-4">
                                 <button 
                                   onClick={() => { setIsPodcastActive(true); setIsTeacherMode(false); setIsNotebookDrawerOpen(false); if (!podcastDialogue.length && selectedNote) generatePodcastDiscussion(selectedNote.content); }}
                                   className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${isPodcastActive && !isTeacherMode ? 'bg-[#DC2626] border-[#DC2626] shadow-lg shadow-[#DC2626]/20' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                 >
                                   <div className={`p-2 rounded-lg ${isPodcastActive && !isTeacherMode ? 'bg-white/20' : 'bg-blue-600'}`}>
                                     <Mic size={18} className="text-white" />
                                   </div>
                                   <div className="text-left">
                                     <p className="text-[10px] font-black text-white uppercase tracking-tight">AI Podcast</p>
                                     <p className="text-[8px] text-white/40 font-bold uppercase">Omni & Zeal Discussion</p>
                                   </div>
                                 </button>
<div className="h-px bg-white/5 my-6" />
                                 <div className="p-4 bg-white/2 rounded-2xl text-center space-y-2">
                                   <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Source Statistics</p>
                                   <p className="text-xs font-black text-[#DC2626] whitespace-nowrap overflow-hidden text-ellipsis">{userNotes.length} Saved Sources</p>
                                 </div>
                               </div>
                             </motion.div>
                           </>
                         )}
                       </AnimatePresence>

                       {/* Header - Flushed to top */}
                       <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#13111C]/80 backdrop-blur-md z-20 shrink-0">
                         <div className="flex items-center gap-4">
                           <button onClick={() => setIsNotebookDrawerOpen(true)} className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-white transition-all"><Menu size={20} /></button>
                           {!selectedNote && (
                             <button onClick={() => setToolsSubTab('menu')} className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-white transition-all"><ArrowLeft size={20}/></button>
                           )}
                           <div className="hidden sm:block">
                             <h2 className="text-xs font-black text-white uppercase tracking-widest">{isPodcastActive ? 'Podcast AI' : 'Notebook'}</h2>
                             <p className="text-[8px] text-[#DC2626] font-bold uppercase tracking-tight">{isPodcastActive ? 'Podcast Mode' : 'Source Library'}</p>
                           </div>
                         </div>
                        <div className="flex items-center gap-2 ml-auto">
                          {!selectedNote ? (
                            <button 
                              onClick={() => {
                                setSelectedNote({ title: `Notebook ${new Date().toLocaleTimeString()}`, content: '', attachments: [], createdAt: new Date() });
                                setNoteHistory([]);
                                setRedoStack([]);
                                setIsPodcastActive(false);
                              }}
                              className="bg-[#DC2626] text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-[#DC2626]/20 hover:scale-105 active:scale-95 transition-all text-nowrap"
                            >
                              <Plus size={14} /> New Source
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              {!isPodcastActive && (
                                <button 
                                  onClick={() => setIsPodcastActive(true)}
                                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20"
                                >
                                  <Mic size={14} /> Create Podcast
                                </button>
                              )}
                              <button onClick={undoNote} disabled={noteHistory.length === 0} className={`p-2 bg-white/5 rounded-xl transition-all ${noteHistory.length === 0 ? 'text-white/5' : 'text-white/40 hover:text-white'}`} title="Undo"><RotateCcw size={16} /></button>
                              <button onClick={redoNote} disabled={redoStack.length === 0} className={`p-2 bg-white/5 rounded-xl transition-all ${redoStack.length === 0 ? 'text-white/5' : 'text-white/40 hover:text-white'}`} title="Redo" style={{ transform: 'scaleX(-1)' }}><RotateCcw size={16} /></button>
                              <div className="w-px h-6 bg-white/10 mx-1" />
                              <button 
                                onClick={async () => {
                                  const success = await saveNote(selectedNote.content, selectedNote.title, selectedNote.id, selectedNote.attachments);
                                  if (success) {
                                    setUserNotification("Saved to Notebook!");
                                    setSelectedNote(null);
                                  } else {
                                    setUserNotification("Sync failed.");
                                  }
                                }} 
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isSavingNote ? 'bg-zinc-800 text-white/40' : 'bg-green-600 text-white shadow-lg'}`}
                                disabled={isSavingNote}
                              >
                                {isSavingNote ? "..." : <Save size={14} />} 
                              </button>
                              <button 
                                onClick={async () => {
                                  if (selectedNote) {
                                    await saveNote(selectedNote.content, selectedNote.title, selectedNote.id, selectedNote.attachments);
                                    setUserNotification("Saved to Notebook!");
                                    setSelectedNote(null);
                                    setIsPodcastActive(false);
                                  } else {
                                    setSelectedNote(null);
                                    setIsPodcastActive(false);
                                  }
                                }} 
                                className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-red-500 transition-all"
                              >
                                <X size={20} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                            {selectedNote ? (
                              <div className="flex flex-col flex-1 overflow-hidden min-h-0">
                                {isPodcastActive ? (
                                  <div className="flex-1 flex flex-col bg-[#050811] overflow-hidden min-h-0">
                                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                        <button onClick={() => setIsPodcastActive(false)} className="text-white/40 hover:text-white"><ArrowLeft size={18} /></button>
                                        <div>
                                          <h3 className="text-xs font-black text-white uppercase tracking-widest">Omni & Zeal</h3>
                                          <p className="text-[8px] text-white/40 font-bold uppercase">Podcast Discussion</p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                                      {podcastDialogue.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6">
                                          <div className="relative">
                                            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                                            <div className="relative w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center border-4 border-white/10 shadow-2xl">
                                              <Brain size={40} className="text-white" />
                                            </div>
                                          </div>
                                          <div className="space-y-2">
                                            <h4 className="text-lg font-black text-white uppercase tracking-tight">Podcast Analysis</h4>
                                            <p className="text-xs text-white/40 max-w-xs mx-auto">Omni and Zeal are ready to discuss your source content.</p>
                                          </div>
                                          <button 
                                            onClick={() => generatePodcastDiscussion(selectedNote.content)}
                                            disabled={isGeneratingPodcast}
                                            className="px-8 py-4 bg-white text-black font-black rounded-2xl text-[10px] uppercase tracking-widest hover:scale-110 active:scale-95 transition-all disabled:opacity-50 shadow-xl"
                                          >
                                            {isGeneratingPodcast ? 'Analyzing...' : 'Create Podcast'}
                                          </button>
                                        </div>
                                      ) : (
                                        podcastDialogue.map((d, i) => (
                                          <motion.div 
                                            key={d.id} 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            drag="x"
                                            dragConstraints={{ left: 0, right: 0 }}
                                            onDragEnd={(_, info) => {
                                              if (Math.abs(info.offset.x) > 50 && d.char !== 'User') {
                                                setReplyingTo(d);
                                                document.getElementById('podcast-chat-input')?.focus();
                                              }
                                            }}
                                            className={`flex flex-col ${d.char === 'User' ? 'items-end' : 'items-start'} cursor-grab active:cursor-grabbing`}
                                          >
                                            <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed relative group ${d.char === 'User' ? 'bg-[#DC2626] text-white' : (theme === 'dark' ? (d.char === 'Omni' ? 'bg-blue-600/10 text-blue-100 border border-blue-600/20 shadow-lg shadow-blue-500/5' : 'bg-purple-600/10 text-purple-100 border border-purple-600/20 shadow-lg shadow-purple-500/5') : 'bg-white border-slate-200')}`}>
                                              <div className="flex items-center justify-between mb-2">
                                                <span className={`text-[8px] font-black uppercase tracking-widest ${d.char === 'User' ? 'text-white/60' : (d.char === 'Omni' ? 'text-blue-400' : 'text-purple-400')}`}>{d.char}</span>
                                                {d.char !== 'User' && (
                                                  <button 
                                                    onClick={() => {
                                                      setReplyingTo(d);
                                                      document.getElementById('podcast-chat-input')?.focus();
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter"
                                                  >
                                                    Tag & Reply
                                                  </button>
                                                )}
                                              </div>
                                              
                                              {d.replyTo && (
                                                <div className="mb-3 p-3 bg-white/5 border-l-4 border-white/20 rounded-xl text-[10px] opacity-60 italic line-clamp-2">
                                                  {/* Fix: Avoid displaying ID if replyTo is garbled or an ID string */}
                                                  {typeof d.replyTo === 'string' && d.replyTo.length < 15 && !d.replyTo.includes(' ') ? 'Replying to previous message...' : d.replyTo}
                                                </div>
                                              )}

                                              <MarkdownRenderer content={d.text} />
                                            </div>
                                          </motion.div>
                                        ))
                                      )}
                                      {isGeneratingPodcast && (
                                        <div className="flex items-center gap-2 text-white/20 ml-2">
                                          <div className="animate-bounce">●</div>
                                          <div className="animate-bounce delay-75">●</div>
                                          <div className="animate-bounce delay-150">●</div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="p-4 sm:p-4 pb-20 border-t border-white/5 bg-[#050811] relative z-20">
                                      {/* Reply Tag Preview */}
                                      <AnimatePresence>
                                        {replyingTo && (
                                          <motion.div 
                                            initial={{ y: 20, opacity: 0 }} 
                                            animate={{ y: 0, opacity: 1 }} 
                                            exit={{ y: 20, opacity: 0 }}
                                            className="mx-2 mb-4 p-4 bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-2xl flex items-center justify-between"
                                          >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                              <div className="p-2 bg-[#DC2626]/20 rounded-xl shrink-0">
                                                <CornerDownRight size={14} className="text-[#DC2626]" />
                                              </div>
                                              <div className="overflow-hidden">
                                                <p className="text-[8px] font-black text-[#DC2626] uppercase tracking-widest">Tagging {replyingTo.char}</p>
                                                <p className="text-[10px] text-white/60 line-clamp-1 truncate">{replyingTo.text}</p>
                                              </div>
                                            </div>
                                            <button onClick={() => setReplyingTo(null)} className="p-2 text-white/20 hover:text-white shrink-0"><X size={16} /></button>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>

                                      <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                          <button 
                                            onClick={() => setShowPodcastUploadMenu(!showPodcastUploadMenu)}
                                            className={`p-2 rounded-xl transition-all ${showPodcastUploadMenu ? 'bg-[#DC2626] text-white shadow-lg' : 'bg-white/5 text-white/40 hover:text-white'}`}
                                          >
                                            <Plus size={20} />
                                          </button>
                                          
                                          {/* Upload Menu Popover - Slides up from button */}
                                          <AnimatePresence>
                                            {showPodcastUploadMenu && (
                                              <>
                                                <div className="fixed inset-0 z-40" onClick={() => setShowPodcastUploadMenu(false)} />
                                                <motion.div 
                                                  initial={{ y: 20, opacity: 0, scale: 0.9 }}
                                                  animate={{ y: -180, opacity: 1, scale: 1 }}
                                                  exit={{ y: 20, opacity: 0, scale: 0.9 }}
                                                  className="absolute left-0 w-56 bg-[#0F172A] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 ring-1 ring-white/10"
                                                >
                                                  <p className="px-3 py-2 text-[8px] font-black text-white/20 uppercase tracking-widest border-b border-white/5 mb-1">Upload to Podcast AI</p>
                                                  <label className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer group">
                                                    <div className="p-2 bg-blue-500/20 rounded-lg group-hover:scale-110 transition-transform"><ImageIcon size={16} className="text-blue-400" /></div>
                                                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Image Source</span>
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => { uploadNoteFile(e, 'image'); setShowPodcastUploadMenu(false); }} />
                                                  </label>
                                                  <label className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer group">
                                                    <div className="p-2 bg-green-500/20 rounded-lg group-hover:scale-110 transition-transform"><Mic size={16} className="text-green-400" /></div>
                                                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Voice Memo</span>
                                                    <input type="file" className="hidden" accept="audio/*" onChange={(e) => { uploadNoteFile(e, 'audio'); setShowPodcastUploadMenu(false); }} />
                                                  </label>
                                                  <label className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer group">
                                                    <div className="p-2 bg-yellow-500/20 rounded-lg group-hover:scale-110 transition-transform"><FileText size={16} className="text-yellow-400" /></div>
                                                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Document</span>
                                                    <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={(e) => { uploadNoteFile(e, 'doc'); setShowPodcastUploadMenu(false); }} />
                                                  </label>
                                                </motion.div>
                                              </>
                                            )}
                                          </AnimatePresence>
                                        </div>

                                        <input 
                                          id="podcast-chat-input"
                                          autoComplete="off"
                                          placeholder="Chat with Omni & Zeal..."
                                          className="w-full bg-white/5 border border-white/10 rounded-3xl pl-16 pr-14 py-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-white/20 shadow-inner"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              const target = e.target as HTMLInputElement;
                                              if (target.value.trim()) {
                                                handlePodcastInput(target.value);
                                                target.value = '';
                                              }
                                            }
                                          }}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                          <button 
                                            onClick={() => {
                                              const input = document.getElementById('podcast-chat-input') as HTMLInputElement;
                                              if (input && input.value.trim()) {
                                                handlePodcastInput(input.value);
                                                input.value = '';
                                              }
                                            }}
                                            className="p-2 bg-[#DC2626] text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all"
                                          >
                                            <Send size={18} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                <div className="flex flex-col flex-1 overflow-hidden bg-[#13111C]">
                                  {/* Formatting Toolbar */}
                                  <div className="relative flex items-center gap-2 p-2 bg-[#13111C] border-b border-white/5 z-50 shrink-0 shadow-sm">
                                     <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 flex-1">
                                     <button onClick={() => setNotePreviewMode(!notePreviewMode)} className={`px-4 py-2 rounded-xl text-[9px] font-black transition-all ${notePreviewMode ? 'bg-[#DC2626] text-white shadow-lg shadow-[#DC2626]/20' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                                        {notePreviewMode ? 'EDIT MODE' : 'READER MODE'}
                                     </button>
                                     <div className="w-px h-4 bg-white/10 mx-1" />
                                     
                                     <div className="relative">
                                       <button 
                                         onClick={() => setShowNoteInsertMenu(!showNoteInsertMenu)}
                                         className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                       >
                                         <Plus size={14} /> Insert
                                       </button>
                                       
                                       {/* Notebook Insert Menu */}
                                       <AnimatePresence>
                                         {showNoteInsertMenu && (
                                           <>
                                             <div className="fixed inset-0 z-[100]" onClick={() => setShowNoteInsertMenu(false)} />
                                             <motion.div 
                                               initial={{ y: 10, opacity: 0, scale: 0.95 }}
                                               animate={{ y: 0, opacity: 1, scale: 1 }}
                                               exit={{ y: 10, opacity: 0, scale: 0.95 }}
                                               className="absolute inset-x-2 sm:inset-x-4 top-14 bg-gradient-to-b from-[#1C1929]/95 to-[#0A0714]/98 border border-[#DC2626]/30 rounded-[2rem] p-6 shadow-2xl z-[110] overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
                                             >
                                                <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                                                  <div>
                                                    <h4 className="text-[10px] font-black text-white uppercase tracking-wider">Insert Study Source</h4>
                                                    <p className="text-[7px] text-white/40 uppercase font-bold tracking-[0.1em] mt-0.5">Support compilation by uploading materials directly</p>
                                                  </div>
                                                  <button 
                                                    onClick={() => setShowNoteInsertMenu(false)} 
                                                    className="w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors outline-none"
                                                  >
                                                    <X size={10} />
                                                  </button>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3">
                                                  <label className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 hover:border-blue-500/30 border border-white/5 rounded-2xl transition-all cursor-pointer group text-center">
                                                     <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><ImageIcon size={18} className="text-blue-400" /></div>
                                                     <span className="block text-[9px] font-black text-white uppercase tracking-wide">Image</span>
                                                     <span className="block text-[7px] text-white/40 uppercase mt-0.5">Photos</span>
                                                     <input type="file" className="hidden" onChange={(e) => { uploadNoteFile(e, 'image'); setShowNoteInsertMenu(false); }} accept="image/*" />
                                                  </label>
                                                  <label className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 hover:border-green-500/30 border border-white/5 rounded-2xl transition-all cursor-pointer group text-center">
                                                     <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><Mic size={18} className="text-green-400" /></div>
                                                     <span className="block text-[9px] font-black text-white uppercase tracking-wide">Audio</span>
                                                     <span className="block text-[7px] text-white/40 uppercase mt-0.5">Memos</span>
                                                     <input type="file" className="hidden" onChange={(e) => { uploadNoteFile(e, 'audio'); setShowNoteInsertMenu(false); }} accept="audio/*" />
                                                  </label>
                                                  <label className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 hover:border-yellow-500/30 border border-white/5 rounded-2xl transition-all cursor-pointer group text-center">
                                                     <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"><FileText size={18} className="text-yellow-400" /></div>
                                                     <span className="block text-[9px] font-black text-white uppercase tracking-wide">Doc</span>
                                                     <span className="block text-[7px] text-white/40 uppercase mt-0.5">PDF/TXT</span>
                                                     <input type="file" className="hidden" onChange={(e) => { uploadNoteFile(e, 'doc'); setShowNoteInsertMenu(false); }} accept=".pdf,.doc,.docx,.txt" />
                                                  </label>
                                                </div>
                                             </motion.div>
                                           </>
                                         )}
                                       </AnimatePresence>
                                     </div>

                                     {!notePreviewMode && (
                                       <>
                                         <div className="w-px h-4 bg-white/10 mx-1" />
                                         <button onMouseDown={(e) => { e.preventDefault(); insertText('**', '**'); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"><Bold size={14} /></button>
                                         <button onMouseDown={(e) => { e.preventDefault(); insertText('*', '*'); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"><Italic size={14} /></button>
                                         <button onMouseDown={(e) => { e.preventDefault(); insertText('\n- '); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"><List size={14} /></button>
                                       </>
                                     )}
                                   </div>
                                  </div>

                                  {/* Independent Active Note Writing Container */}
                                  <div className="flex-1 flex flex-col min-h-0 bg-[#13111C]">
                                     {notePreviewMode ? (
                                       <div 
                                         ref={scrollContainerRef}
                                         onScroll={handleNoteScroll}
                                         className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar relative bg-[#13111C]"
                                       >
                                         <div className="space-y-6 relative z-10 max-w-4xl mx-auto">
                                           <h1 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedNote.title || 'Untitled Source'}</h1>
                                           <div className="markdown-body prose prose-invert prose-p:text-white/70 prose-headings:text-white prose-strong:text-[#DC2626] prose-img:rounded-3xl max-w-none text-white/80 text-sm leading-relaxed">
                                             <MarkdownRenderer selectable={true} content={selectedNote.content || "_No source content yet._"} />
                                           </div>
                                         </div>
                                       </div>
                                     ) : (
                                       <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#13111C]">
                                         <div className="px-6 py-4 bg-[#13111C] border-b border-white/5 shrink-0">
                                           <input 
                                             value={selectedNote.title} 
                                             onChange={(e) => setSelectedNote({...selectedNote, title: e.target.value})}
                                             className="bg-transparent border-none text-xl font-black text-white uppercase tracking-tighter outline-none w-full placeholder:text-white/15"
                                             placeholder="Source Title..."
                                           />
                                         </div>
                                         
                                         <textarea
                                           id="note-main-textarea"
                                           value={selectedNote.content || ''}
                                           onChange={(e) => handleNoteContentChange(e.target.value)}
                                           onFocus={(e) => {
                                             lastFocusedBlock.current = { id: 'main', start: e.target.selectionStart, end: e.target.selectionEnd };
                                           }}
                                           onBlur={(e) => {
                                             lastFocusedBlock.current = { id: 'main', start: e.target.selectionStart, end: e.target.selectionEnd };
                                           }}
                                           className="flex-1 w-full bg-[#13111C] border-none text-white/80 text-sm leading-[1.75rem] outline-none resize-none font-mono placeholder:text-white/10 p-6 sm:p-8 overflow-y-auto custom-scrollbar focus:outline-none"
                                           placeholder="Start writing or typing..."
                                         />
                                       </div>
                                     )}
                                  </div>

                                  {/* Floating Scroll Button */}
                                  <AnimatePresence>
                                    {noteScrollPos && (
                                      <motion.button
                                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                                        onClick={() => scrollToPosition(noteScrollPos)}
                                        className="absolute bottom-20 right-6 z-50 w-12 h-12 rounded-full bg-[#DC2626] text-white shadow-xl shadow-[#DC2626]/40 flex items-center justify-center border-2 border-white/10 hover:scale-110 active:scale-95 transition-all"
                                      >
                                        {noteScrollPos === 'top' ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                      </motion.button>
                                    )}
                                  </AnimatePresence>

                                  <div className="p-3 border-t border-white/5 bg-white/2 backdrop-blur-md flex items-center justify-between shrink-0">
                                     <p className="text-[7px] font-bold text-white/20 uppercase tracking-[0.3em]">Notebook AI Engine Active</p>
                                  </div>
                                </div>
                                )}
                              </div>
                            ) : (
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar bg-[#13111C]">
                           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pb-20">
                            {userNotes.length === 0 ? (
                              <div className="col-span-full py-20 text-center opacity-10 space-y-6">
                                <FileText size={64} className="mx-auto" />
                                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Notebook Empty</p>
                              </div>
                            ) : (
                              userNotes.map(note => (
                                <motion.div 
                                  key={note.id} 
                                  onClick={() => {
                                    setSelectedNote(note);
                                    setNoteHistory([]);
                                    setRedoStack([]);
                                    setIsPodcastActive(false);
                                  }}
                                  className={`p-2 rounded-xl border transition-all cursor-pointer relative group overflow-hidden ${theme === 'dark' ? 'bg-[#151B2B] border-white/10 hover:border-[#DC2626]/50 shadow-xl' : 'bg-white border-slate-200 shadow-sm'}`}
                                >
                                  {note.attachments?.length > 0 && (
                                    <div className="absolute top-0 right-0 p-1 text-[5px] font-black text-[#DC2626] bg-[#DC2626]/10 rounded-bl-lg border-l border-b border-white/10 uppercase">
                                      {note.attachments.length}
                                    </div>
                                  )}
                                  <div className="flex items-start justify-between relative z-10 w-full h-full">
                                    <div className="space-y-0.5 w-full">
                                      <h4 className="text-[9px] font-black text-white uppercase tracking-tight line-clamp-1 group-hover:text-[#DC2626] transition-colors">
                                        {note.title || 'Untitled Source'}
                                      </h4>
                                      <p className="text-[7px] text-white/40 line-clamp-2 leading-tight">
                                        {note.content ? note.content.replace(/[#*`_!\[\]\(\)]/g, '').substring(0, 50) : '...'}
                                      </p>
                                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-white/5">
                                        <p className="text-[6px] font-bold text-white/10 uppercase tracking-widest">{note.updatedAt?.toDate ? note.updatedAt.toDate().toLocaleDateString() : 'Now'}</p>
                                        <div onClick={(e) => deleteNote(note.id, e)} className="p-1 opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-500 transition-all bg-white/5 rounded-md">
                                          <Trash2 size={8} />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

          {/* TOOLS SUB-SECTIONS CONTINUED */}
          {toolsSubTab === 'live' && (
            <motion.div key="live" initial={{opacity:0, scale: 0.95}} animate={{opacity:1, scale: 1}} exit={{opacity: 0}} className="fixed inset-0 z-[100]">
                           <GeminiLive 
                            onClose={() => setToolsSubTab('menu')} 
                            setUserNotification={setUserNotification} 
                            theme={theme}
                            isPremium={isPremium}
                            checkAndIncrementUsage={checkAndIncrementUsage}
                          />
            </motion.div>
          )}

          {toolsSubTab === 'quiz' && (
            <motion.div key="quiz" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity: 0}} className="space-y-6">
              <AdUnit slot="7536999840" />
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black uppercase tracking-tighter text-white">Quiz Engine</h2>
                <Zap size={20} className="text-[#DC2626]" />
              </div>

              {quizState === 'idle' && (
                <div className={`${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} p-8 rounded-3xl border space-y-6 shadow-sm`}>
                  <div className="text-center space-y-2 mb-4">
                    <div className="w-12 h-12 bg-[#DC2626]/10 rounded-2xl flex items-center justify-center mx-auto mb-2"><Sparkles size={24} className="text-[#DC2626]" /></div>
                    <h3 className="font-bold text-lg text-white">Generate Interactive Quiz</h3>
                    <p className="text-xs text-white/40">Test your knowledge with AI-generated questions.</p>
                  </div>
                  
                  <div className="space-y-4">
                    {!user ? (
                      <div className="text-center space-y-4 py-6">
                        <p className="text-sm text-white/60">You must be logged in to generate quizzes.</p>
                        <button onClick={() => setShowAuthModal(true)} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all">
                          LOGIN TO PROCEED
                        </button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-2 ml-1">
                            <p className="text-[10px] font-black text-white/30 uppercase">Topic or Analysis Context</p>
                            <div className="flex items-center gap-2">
                              {/* Import Note Button */}
                              <button 
                                type="button"
                                onClick={() => setShowNoteSelectorForQuiz(prev => !prev)}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-600/20 border border-violet-500/30 rounded-lg hover:bg-violet-600/30 hover:border-violet-500/50 transition-all cursor-pointer"
                              >
                                <BookOpen size={10} className="text-violet-400" />
                                <span className="text-[8px] font-black text-violet-300 uppercase">Import Note</span>
                              </button>

                              <label className="cursor-pointer group flex items-center gap-1.5 px-2.5 py-1 bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-lg hover:bg-[#DC2626]/20 transition-all">
                                <Camera size={10} className="text-[#DC2626]" />
                                <span className="text-[8px] font-black text-[#DC2626] uppercase">Snap/Upload</span>
                                <input type="file" className="hidden" accept="image/*" multiple onChange={handleQuizImageUpload} />
                              </label>
                            </div>
                          </div>

                          {/* Note Selector panel */}
                          {showNoteSelectorForQuiz && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mb-3 p-3 bg-white/5 border border-white/10 rounded-2xl space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar"
                            >
                              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-1.5">
                                <p className="text-[9px] font-black text-violet-400 uppercase tracking-wider">Select Note to Import</p>
                                <button type="button" onClick={() => setShowNoteSelectorForQuiz(false)} className="text-white/40 hover:text-white">
                                  <X size={10} />
                                </button>
                              </div>
                              {userNotes.length === 0 ? (
                                <p className="text-[10px] text-white/40 text-center py-4">No notes found. Create a study note in the notebook first!</p>
                              ) : (
                                <div className="grid grid-cols-1 gap-1.5">
                                  {userNotes.map(n => (
                                    <button
                                      type="button"
                                      key={n.id}
                                      onClick={() => {
                                        setImportedQuizNote(n);
                                        setShowNoteSelectorForQuiz(false);
                                        setUserNotification(`Imported note: "${n.title}"`);
                                      }}
                                      className="flex flex-col items-start text-left p-2 rounded-xl bg-white/5 hover:bg-[#DC2626]/10 border border-white/5 hover:border-[#DC2626]/30 transition-all w-full"
                                    >
                                      <p className="text-xs font-bold text-white line-clamp-1">{n.title || 'Untitled note'}</p>
                                      <p className="text-[8px] text-white/40 line-clamp-1 mt-0.5">{n.content ? n.content.substring(0, 80) : 'Empty note'}</p>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          )}

                          <div className="relative">
                            <textarea 
                              value={quizTopic} 
                              onChange={(e) => setQuizTopic(e.target.value)} 
                              placeholder="Describe the topic or ask AI to analyze the images below..." 
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-[#DC2626]/50 transition-all text-white min-h-[100px] resize-none"
                            />

                            {/* Imported Note tag inside container if selected */}
                            {importedQuizNote && (
                              <div className="flex items-center justify-between p-2 mt-2 bg-violet-600/10 border border-violet-500/20 rounded-xl">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <BookOpen size={12} className="text-violet-400 shrink-0" />
                                  <div className="leading-tight overflow-hidden">
                                    <p className="text-[7px] font-black uppercase tracking-widest text-violet-400">Imported Study Source</p>
                                    <p className="text-[10px] font-bold text-white truncate">{importedQuizNote.title || 'Untitled Note'}</p>
                                  </div>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setImportedQuizNote(null);
                                    setUserNotification("Study note removed from quiz context.");
                                  }} 
                                  className="p-1 hover:bg-white/5 rounded-lg text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            )}
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                              <p className={`text-[8px] font-black uppercase ${quizTopic.split(/\s+/).filter(Boolean).length > (isPremium ? 150 : 30) ? 'text-red-500' : 'text-white/20'}`}>
                                {quizTopic.split(/\s+/).filter(Boolean).length} / {isPremium ? 150 : 30} Words
                              </p>
                            </div>
                          </div>

                          {quizImages.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {quizImages.map(img => (
                                <div key={img.id} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-white/10">
                                  <img src={img.preview} className="w-full h-full object-cover" />
                                  <button onClick={() => removeQuizImage(img.id)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                    <Trash2 size={12} className="text-white" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-black text-white/30 uppercase mb-2 ml-1">Questions</p>
                            <div className="flex flex-wrap gap-2 items-center">
                              {[15, 25, 50].map(count => (
                                <button key={count} onClick={() => setQuizQuestionCount(count)} className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${quizQuestionCount === count ? 'bg-[#DC2626] border-[#DC2626] text-white' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                  {count}
                                </button>
                              ))}
                              <div className="flex items-center gap-1.5 ml-1">
                                <p className="text-[8px] font-bold text-white/20 uppercase">Custom:</p>
                                <input 
                                  type="number" 
                                  min="1"
                                  max="200"
                                  value={![15, 25, 50].includes(quizQuestionCount) ? quizQuestionCount : ''} 
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if(!isNaN(val)) setQuizQuestionCount(val);
                                    else if (e.target.value === '') setQuizQuestionCount(0); // Allow clearing to type
                                  }}
                                  onBlur={(e) => {
                                    if(!e.target.value || parseInt(e.target.value) <= 0) setQuizQuestionCount(25);
                                  }}
                                  className={`w-14 px-2 py-1.5 rounded-xl bg-white/5 border text-white text-[10px] font-bold outline-none transition-all ${![15, 25, 50].includes(quizQuestionCount) && quizQuestionCount !== 0 ? 'border-[#DC2626] bg-[#DC2626]/10' : 'border-white/10'}`}
                                  placeholder="No."
                                />
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-white/30 uppercase mb-2 ml-1">Difficulty</p>
                            <div className="flex flex-wrap gap-2">
                              {['Easy', 'Medium', 'Hard', 'Professional'].map(level => (
                                <button key={level} onClick={() => setQuizDifficulty(level as any)} className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${quizDifficulty === level ? 'bg-[#DC2626] border-[#DC2626] text-white' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                  {level}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <button onClick={generateQuiz} disabled={isGeneratingQuiz} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {isGeneratingQuiz ? <><RefreshCcw size={18} className="animate-spin" /> GENERATING...</> : <><Zap size={18} /> START ASSESSMENT</>}
                  </button>
                </div>
              )}

              {quizState === 'active' && quizQuestions.length > 0 && (
                <div className="space-y-6">
                  <div className={`flex items-center justify-between ${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-4 rounded-2xl border shadow-sm`}>
                    <button onClick={() => setQuizState('idle')} className="text-white/40 hover:text-[#DC2626] flex items-center gap-1 text-xs font-bold uppercase"><ArrowLeft size={14} /> Back</button>
                    <div className="text-center"><p className="text-[10px] font-black text-white/30 uppercase">Progress</p><p className="text-sm font-black text-[#DC2626]">{currentQuestionIndex + 1} / {quizQuestions.length}</p></div>
                    <button onClick={shareQuiz} className="text-white/40 hover:text-[#DC2626] flex items-center gap-1 text-xs font-bold uppercase">
                      <Share2 size={14} /> Share
                    </button>
                  </div>

                  {/* Quiz Question Navigation */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {quizQuestions.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentQuestionIndex(idx);
                          setSelectedOption(userQuizAnswers[idx] !== undefined ? userQuizAnswers[idx] : null);
                          setIsAnswered(userQuizAnswers[idx] !== undefined);
                        }}
                        className={`flex-shrink-0 w-8 h-8 rounded-lg text-[10px] font-black border transition-all ${
                          currentQuestionIndex === idx 
                            ? 'bg-[#DC2626] border-[#DC2626] text-white' 
                            : userQuizAnswers[idx] !== undefined 
                              ? 'bg-green-500/20 border-green-500/30 text-green-500' 
                              : 'bg-white/5 border-white/10 text-white/40'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                  <div className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-8 rounded-3xl border space-y-8 shadow-sm`}>
                    <MarkdownRenderer 
                      content={quizQuestions[currentQuestionIndex].question}
                      className="text-lg font-bold leading-tight text-white"
                    />
                    <div className="space-y-3">
                      {quizQuestions[currentQuestionIndex].options.map((option, idx) => {
                        const isCorrect = idx === quizQuestions[currentQuestionIndex].correctAnswer;
                        const isSelected = selectedOption === idx;
                        const hasAnswered = userQuizAnswers[currentQuestionIndex] !== undefined;
                        
                        let variantClasses = 'bg-white/5 border-white/10 text-white/80';
                        let badgeClasses = 'border-white/20 text-white/40';
                        
                        if (hasAnswered) {
                          if (isCorrect) {
                            variantClasses = 'border-green-500 bg-green-500/10 text-green-500';
                            badgeClasses = 'border-green-500 bg-green-500 text-white';
                          } else if (isSelected) {
                            variantClasses = 'border-red-500 bg-red-500/10 text-red-500';
                            badgeClasses = 'border-red-500 bg-red-500 text-white';
                          }
                        } else if (isSelected) {
                          variantClasses = 'border-[#DC2626] bg-[#DC2626]/5 text-[#DC2626]';
                          badgeClasses = 'border-[#DC2626] bg-[#DC2626] text-white';
                        }

                        return (
                          <button 
                            key={idx} 
                            onClick={() => handleOptionSelect(idx)} 
                            disabled={hasAnswered}
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3 ${variantClasses}`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] border shrink-0 ${badgeClasses}`}>
                              {hasAnswered && isCorrect ? <Check size={12} /> : hasAnswered && isSelected && !isCorrect ? <X size={12} /> : String.fromCharCode(65 + idx)}
                            </div>
                            <div className="flex-1">
                              <MarkdownRenderer 
                                content={option}
                                className="text-sm font-medium"
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {userQuizAnswers[currentQuestionIndex] !== undefined && quizQuestions[currentQuestionIndex].explanation && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-2"
                      >
                        <div className="flex items-center gap-2 text-[#DC2626] text-[10px] font-black uppercase tracking-[0.2em]">
                          <Info size={14} /> Explanation
                        </div>
                        <MarkdownRenderer 
                          content={quizQuestions[currentQuestionIndex].explanation}
                          className="text-sm text-white/60 leading-relaxed font-medium"
                        />
                      </motion.div>
                    )}

                    <div className="pt-4 flex gap-3">
                      {currentQuestionIndex > 0 && (
                        <button 
                          onClick={prevQuestion}
                          className={`flex-1 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'} font-black py-4 rounded-2xl text-sm border transition-all flex items-center justify-center gap-2 uppercase tracking-widest`}
                        >
                          <ChevronRight size={18} className="rotate-180" /> Back
                        </button>
                      )}
                      <button 
                        onClick={nextQuestion}
                        disabled={selectedOption === null}
                        className="flex-[2] bg-[#DC2626] text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50"
                      >
                        {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'} <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {quizState === 'finished' && (
                <div className={`${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} p-10 rounded-3xl border text-center space-y-8 shadow-sm`}>
                  <div className="w-24 h-24 bg-[#DC2626]/10 rounded-full flex items-center justify-center mx-auto relative">
                    <Trophy size={48} className="text-[#DC2626]" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 bg-[#DC2626]/5 rounded-full" />
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>Assessment Complete</h3>
                    <p className={`${theme === 'dark' ? 'text-white/40' : 'text-slate-500'} text-sm mt-1`}>You've successfully finished the quiz.</p>
                  </div>
                  <div className={`py-8 border-y ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                    <p className={`text-[10px] font-black ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'} uppercase tracking-widest mb-1`}>Your Score</p>
                    <p className="text-6xl font-black text-[#DC2626]">{quizScore} / {quizQuestions.length || 1}</p>
                    <p className={`text-xs font-bold ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'} mt-2 uppercase tracking-widest`}>{Math.round((quizScore / (quizQuestions.length || 1)) * 100)}% Proficiency</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button onClick={shareQuiz} className="w-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 font-bold py-4 rounded-2xl text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                      <Share2 size={18} /> SHARE QUIZ LINK
                    </button>
                    <button onClick={handleShareResult} className="w-full bg-red-500 hover:bg-red-500/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-2">
                      <Share2 size={18} /> SHARE SCORE CARD
                    </button>
                    <button onClick={() => setQuizState('review')} className="w-full bg-[#DC2626] text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 hover:bg-[#DC2626]/90 transition-all flex items-center justify-center gap-2">
                      <Search size={18} /> CHECK QUIZ RESULTS & EXPLANATIONS
                    </button>
                    <button onClick={() => setQuizState('idle')} className="w-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 font-bold py-4 rounded-2xl text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-all">TRY ANOTHER TOPIC</button>
                  </div>
                </div>
              )}

              {quizState === 'review' && (
                <div className="space-y-6">
                  <div className={`flex items-center justify-between ${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-4 rounded-2xl border shadow-sm`}>
                    <button onClick={() => setQuizState('finished')} className="text-white/40 hover:text-[#DC2626] flex items-center gap-1 text-xs font-bold uppercase"><ArrowLeft size={14} /> Back to Results</button>
                    <h3 className="text-sm font-black text-white uppercase tracking-tighter">Detailed Review</h3>
                    <div className="w-10"></div>
                  </div>

                  <div className="space-y-4">
                    {quizQuestions.map((q, qIdx) => {
                      const userAns = userQuizAnswers[qIdx];
                      const isCorrect = userAns === q.correctAnswer;
                      
                      return (
                        <div key={qIdx} className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-6 rounded-3xl border space-y-4 shadow-sm`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-[10px] font-black text-[#DC2626] uppercase mb-1">Question {qIdx + 1}</p>
                              <MarkdownRenderer content={q.question} className="text-sm font-bold text-white leading-tight" />
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${isCorrect ? 'bg-green-500/10 text-green-500' : 'bg-[#DC2626]/10 text-[#DC2626]'}`}>
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            {q.options.map((opt, oIdx) => {
                              const isUserChoice = userAns === oIdx;
                              const isCorrectChoice = q.correctAnswer === oIdx;
                              
                              let borderClass = 'border-white/5 bg-white/5';
                              let textClass = 'text-white/60';
                              let label = '';
                              
                              if (isCorrectChoice) {
                                borderClass = 'border-green-500/50 bg-green-500/10';
                                textClass = 'text-green-500 font-bold';
                                label = 'CORRECT ANSWER';
                              } else if (isUserChoice && !isCorrect) {
                                borderClass = 'border-[#DC2626]/50 bg-[#DC2626]/10';
                                textClass = 'text-[#DC2626] font-bold';
                                label = 'YOUR CHOICE';
                              } else if (isUserChoice && isCorrect) {
                                label = 'YOUR CHOICE (CORRECT)';
                              }

                              return (
                                <div key={oIdx} className={`p-3 rounded-xl border text-xs flex items-center gap-3 ${borderClass} ${textClass}`}>
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${isCorrectChoice ? 'border-green-500 bg-green-500 text-white' : (isUserChoice ? 'border-[#DC2626] bg-[#DC2626] text-white' : 'border-white/20')}`}>
                                    {String.fromCharCode(65 + oIdx)}
                                  </div>
                                  <div className="flex-1 flex flex-col">
                                    <MarkdownRenderer content={opt} />
                                    {label && <span className="text-[8px] font-black uppercase mt-1 opacity-60">{label}</span>}
                                  </div>
                                  {isCorrectChoice && <Check size={14} />}
                                  {isUserChoice && !isCorrect && <X size={14} />}
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} border border-dashed border-white/10`}>
                              <p className="text-[9px] font-black text-white/30 uppercase mb-2 flex items-center gap-1.5">
                                <Info size={12} className="text-[#DC2626]" /> Explanation
                              </p>
                              <MarkdownRenderer content={q.explanation} className="text-xs text-white/70 leading-relaxed" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button onClick={() => setQuizState('idle')} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2">
                    RETAKE OR TRY NEW TOPIC
                  </button>
                </div>
              )}
            </motion.div>
          )}
                  {toolsSubTab === 'exam' && (

            <motion.div key="exam" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity: 0}} className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black uppercase tracking-tighter text-white">CBT Examination</h2>
                <ShieldCheck size={20} className="text-[#DC2626]" />
              </div>

              {examLobbyState === 'login' && (
                <div className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-5 sm:p-8 rounded-3xl border space-y-6 shadow-sm`}>
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-[#DC2626]/10 rounded-2xl flex items-center justify-center mx-auto mb-2"><User size={24} className="text-[#DC2626]" /></div>
                    <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Student Verification</h3>
                    <p className={`text-xs ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Enter your credentials to access the examination hall.</p>
                  </div>
                  {!showAdminLogin ? (
                    <div className="space-y-4">
                      {!user ? (
                        <div className="text-center space-y-4 py-6">
                          <p className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>You must be logged in to access examinations.</p>
                          <button onClick={() => setShowAuthModal(true)} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all">
                            LOGIN TO PROCEED
                          </button>
                        </div>
                      ) : studentName ? (
                        <div className={`p-6 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} rounded-3xl border space-y-4 text-center`}>
                          <div className="w-16 h-16 bg-[#DC2626] rounded-full flex items-center justify-center text-white font-black text-2xl mx-auto shadow-lg shadow-[#DC2626]/20">{studentName.charAt(0)}</div>
                          <div>
                            <p className={`text-[10px] font-black ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'} uppercase tracking-widest`}>Authenticated Student</p>
                            <p className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{studentName}</p>
                            <p className="text-xs font-mono text-[#DC2626] font-bold">{matricNumber}</p>
                          </div>
                          
                          {isTakingPaid ? (
                            <div className={`pt-4 space-y-3 border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
                              <button onClick={handleMatricLogin} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all">PROCEED TO HALL</button>
                              <button onClick={() => { setStudentName(''); setMatricNumber(''); }} className={`w-full text-[10px] font-black ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'} uppercase hover:text-[#DC2626] transition-all`}>Not you? Switch Account</button>
                            </div>
                          ) : (
                            <div className={`pt-4 space-y-3 border-t ${theme === 'dark' ? 'border-white/10' : 'border-slate-100'}`}>
                              <p className={`text-[10px] ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'} leading-relaxed italic`}>
                                {isPremium ? "Premium Active: Exam access granted for free." : `This examination requires a one-time access fee of \u{20A6}100. Please complete payment to proceed.`}
                              </p>
                              <button 
                                onClick={() => {
                                  if (isPremium || currentUserData?.bypassTakingPayment || currentUserData?.bypassAllPayments || (currentUserData?.role === 'admin')) {
                                    handleTakingPaymentSuccess({ reference: 'GOD_MODE_BYPASS' });
                                  } else {
                                    initializePayment({ onSuccess: handleTakingPaymentSuccess, onClose: handlePaystackClose });
                                  }
                                }} 
                                className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2"
                              >
                                <CreditCard size={18} /> 
                                {isPremium || currentUserData?.role === 'admin' ? "ENTER EXAM HALL" : "PAY \u{20A6}100 & PROCEED"}
                              </button>
                              <button onClick={() => { setStudentName(''); setMatricNumber(''); }} className={`w-full text-[10px] font-black ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'} uppercase hover:text-[#DC2626] transition-all`}>Not you? Switch Account</button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">Exam ID</p>
                            <input type="text" value={examIdInput} onChange={(e) => setExamIdInput(e.target.value.toUpperCase())} placeholder="Enter 7-Character ID" className={`w-full ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl px-5 py-4 text-sm outline-none focus:border-[#DC2626]/50 transition-all font-mono`} />
                          </div>
                          <div className="space-y-2">
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">Matric Number</p>
                            <input type="text" value={matricNumber} onChange={(e) => setMatricNumber(e.target.value)} placeholder="Enter Matric Number" className={`w-full ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl px-5 py-4 text-sm outline-none focus:border-[#DC2626]/50 transition-all`} />
                          </div>
                          <button onClick={handleMatricLogin} disabled={isAuthLoading} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2">
                            {isAuthLoading ? <RefreshCcw size={18} className="animate-spin" /> : <Zap size={18} />} VERIFY & PROCEED
                          </button>
                          <button 
                            onClick={() => setAdminMode(true)} 
                            className={`w-full ${theme === 'dark' ? 'bg-white/5 text-white/60' : 'bg-zinc-100 text-zinc-500'} font-bold py-3 rounded-2xl text-xs hover:bg-[#DC2626]/10 transition-all`}
                          >
                            {"HOST AN EXAM (\u{20A6}200)"}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <input type="password" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} placeholder="Admin PIN" className={`w-full ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl px-5 py-4 text-sm outline-none focus:border-[#DC2626]/50 transition-all`} />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowAdminLogin(false)} 
                          className={`flex-1 ${theme === 'dark' ? 'bg-white/5 text-white/60' : 'bg-zinc-100 text-zinc-500'} font-bold py-4 rounded-2xl text-sm`}
                        >
                          BACK
                        </button>
                        <button onClick={handleAdminLogin} className="flex-[2] bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all">LOGIN AS ADMIN</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {examLobbyState === 'briefing' && (
                <div className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-5 sm:p-8 rounded-3xl border space-y-6 shadow-sm`}>
                  <div className={`flex items-center gap-4 p-4 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} rounded-2xl border`}>
                    <div className="w-12 h-12 bg-[#DC2626] rounded-full flex items-center justify-center text-white font-black text-xl">{studentName.charAt(0)}</div>
                    <div><p className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>{studentName}</p><p className={`text-[10px] ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'} font-mono`}>{matricNumber}</p></div>
                  </div>
                  <div className="space-y-4">
                    <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Examination Briefing</h3>
                    <div className={`${theme === 'dark' ? 'bg-[#DC2626]/5 border-[#DC2626]/20' : 'bg-red-50 border-red-100'} p-4 rounded-2xl border space-y-3`}>
                      <p className="text-xs text-[#DC2626] font-bold flex items-center gap-2"><XCircle size={14} /> IMPORTANT BRIEFING</p>
                      <div className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'} leading-relaxed space-y-2 text-left`}>
                        {examConfig.warningMessage ? (
                          <MarkdownRenderer content={examConfig.warningMessage} />
                        ) : (
                          <>
                            <p>WARNING: {studentName}, if you leave this app, you automatically forfeit the exam.</p>
                            <p>This is a professional CBT Mock Exam. You have {examConfig.duration} minutes to answer {examConfig.questionCount} randomized questions. Use only your brain. Good luck.</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={startExam} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2">
                    <Zap size={18} /> START EXAMINATION NOW
                  </button>
                </div>
              )}

              {examLobbyState === 'exam' && (() => {
                const distinctStudentSubjects = Array.from(new Set(examQuestions.map(q => q.subject || "Mathematics").filter(Boolean))) as string[];
                const activeSub = activeStudentSubject || distinctStudentSubjects[0] || "Mathematics";
                const activeSubjectQuestions = activeSub ? examQuestions.filter(q => (q.subject || "Mathematics") === activeSub) : examQuestions;
                const currentQuestion = activeSubjectQuestions[currentExamIndex] || activeSubjectQuestions[0];
                
                return (
                  <div className="space-y-4 sm:space-y-6">
                    <div className={`flex items-center justify-between ${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-3 sm:p-4 rounded-2xl border shadow-sm sticky top-16 sm:top-20 z-30`}>
                      <div className="flex items-center gap-2 text-[#DC2626] font-black">
                        <Clock size={16} className="sm:size-[18px]" />
                        <span className="font-mono text-base sm:text-lg">{Math.floor(examTimer / 60)}:{(examTimer % 60).toString().padStart(2, '0')}</span>
                      </div>
                      <div className="text-center">
                        <p className={`text-[8px] sm:text-[10px] font-black ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'} uppercase`}>Exam Progress</p>
                        <p className={`text-xs sm:text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {activeSub ? `${activeSub}: ` : ""} {currentExamIndex + 1} / {activeSubjectQuestions.length}
                        </p>
                      </div>
                      <button onClick={submitExam} className="bg-[#DC2626] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#DC2626]/90 transition-all shadow-md">Submit Exam</button>
                    </div>

                    {/* Subject Tabs (As seen in JAMB) */}
                    {distinctStudentSubjects.length > 1 && (
                      <div className="flex flex-wrap gap-2 pb-1 border-b border-white/5">
                        {distinctStudentSubjects.map((subName) => (
                          <button
                            key={subName}
                            onClick={() => {
                              setActiveStudentSubject(subName);
                              setCurrentExamIndex(0);
                            }}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide border transition-all ${
                              activeSub === subName
                                ? 'bg-[#DC2626] border-[#DC2626] text-white shadow-md'
                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                            }`}
                          >
                            {subName}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Question Navigation Bubbles */}
                    {activeSubjectQuestions.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {activeSubjectQuestions.map((_, idx) => {
                          const associatedQ = activeSubjectQuestions[idx];
                          const isAnswered = examAnswers[associatedQ.id] !== undefined;
                          return (
                            <button
                              key={associatedQ.id || idx}
                              onClick={() => setCurrentExamIndex(idx)}
                              className={`flex-shrink-0 w-8 h-8 rounded-lg text-[10px] font-black border transition-all ${
                                currentExamIndex === idx 
                                  ? 'bg-[#DC2626] border-[#DC2626] text-white' 
                                  : isAnswered 
                                    ? 'bg-green-500/20 border-green-500/30 text-green-400 font-bold' 
                                    : 'bg-white/5 border-white/10 text-white/40'
                              }`}
                            >
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {currentQuestion ? (
                      <div className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-5 sm:p-8 rounded-3xl border space-y-6 sm:space-y-8 shadow-sm`}>
                        <MarkdownRenderer 
                          content={currentQuestion.question}
                          className={`text-base sm:text-lg font-bold leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
                        />
                        <div className="space-y-3">
                          {currentQuestion.options.map((option, idx) => {
                            const isSelected = examAnswers[currentQuestion.id] === idx;
                            return (
                              <button 
                                key={idx} 
                                onClick={() => setExamAnswers({ ...examAnswers, [currentQuestion.id]: idx })} 
                                className={`w-full text-left p-4 rounded-2xl border transition-all ${isSelected ? 'border-[#DC2626] bg-[#DC2626]/5 text-[#DC2626]' : `${theme === 'dark' ? 'bg-white/5 border-white/10 text-white/80' : 'bg-slate-50 border-slate-200 text-slate-700'}`}`}
                              >
                                <div className="flex items-start gap-3">
                                  <MarkdownRenderer 
                                    content={option}
                                    className="flex-1 text-sm font-medium"
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex justify-between pt-4">
                          <button onClick={() => setCurrentExamIndex(prev => Math.max(0, prev - 1))} disabled={currentExamIndex === 0} className={`p-3 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'} hover:text-[#DC2626] disabled:opacity-20`}><ArrowLeft size={24} /></button>
                          <button onClick={() => setCurrentExamIndex(prev => Math.min(activeSubjectQuestions.length - 1, prev + 1))} disabled={currentExamIndex === activeSubjectQuestions.length - 1} className={`p-3 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'} hover:text-[#DC2626] disabled:opacity-20`}><ChevronRight size={24} /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-20 text-center text-white/40">No questions found in this section.</div>
                    )}
                  </div>
                );
              })()}

              {examLobbyState === 'result' && (
                <div className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-10 rounded-3xl border text-center space-y-6 shadow-sm`}>
                  <div className="w-20 h-20 bg-[#DC2626]/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={48} className="text-[#DC2626]" />
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Exam Submitted</h3>
                    <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Your results have been recorded in the system.</p>
                  </div>
                  <div className={`py-6 border-y ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                    <p className={`text-[10px] font-black ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'} uppercase tracking-widest mb-1`}>Final Score</p>
                    <p className="text-5xl font-black text-[#DC2626]">{examScore} / {examQuestions.length}</p>
                    <p className={`text-sm font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>{Math.round((examScore / (examQuestions.length || 1)) * 100)}% Proficiency</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => setExamLobbyState('review')} 
                      className="w-full bg-[#DC2626] text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 hover:bg-[#DC2626]/90 transition-all flex items-center justify-center gap-2"
                    >
                      <Search size={18} /> REVIEW EXAM & EXPLANATIONS
                    </button>
                    <button 
                      onClick={() => setExamLobbyState('login')} 
                      className={`w-full ${theme === 'dark' ? 'bg-white/5 text-white/60' : 'bg-slate-100 text-slate-600'} font-black py-4 rounded-2xl text-sm transition-all`}
                    >
                      LOGOUT
                    </button>
                  </div>
                </div>
              )}

              {examLobbyState === 'review' && (
                <div className="space-y-6">
                  <div className={`flex items-center justify-between ${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-4 rounded-2xl border shadow-sm`}>
                    <button onClick={() => setExamLobbyState('result')} className="text-white/40 hover:text-[#DC2626] flex items-center gap-1 text-xs font-bold uppercase"><ArrowLeft size={14} /> Back to Results</button>
                    <h3 className="text-sm font-black text-white uppercase tracking-tighter">Exam Review</h3>
                    <div className="w-10"></div>
                  </div>

                  <div className="space-y-4">
                    {examQuestions.map((q, qIdx) => {
                      const userAns = examAnswers[qIdx];
                      const isCorrect = userAns === q.correctAnswer;
                      
                      return (
                        <div key={qIdx} className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-6 rounded-3xl border space-y-4 shadow-sm`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-[10px] font-black text-[#DC2626] uppercase mb-1">Question {qIdx + 1}</p>
                              <MarkdownRenderer content={q.question} className="text-sm font-bold text-white leading-tight" />
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${isCorrect ? 'bg-green-500/10 text-green-500' : 'bg-[#DC2626]/10 text-[#DC2626]'}`}>
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            {q.options.map((opt, oIdx) => {
                              const isUserChoice = userAns === oIdx;
                              const isCorrectChoice = q.correctAnswer === oIdx;
                              
                              let borderClass = 'border-white/5 bg-white/5';
                              let textClass = 'text-white/60';
                              let label = '';
                              
                              if (isCorrectChoice) {
                                borderClass = 'border-green-500/50 bg-green-500/10';
                                textClass = 'text-green-500 font-bold';
                                label = 'CORRECT ANSWER';
                              } else if (isUserChoice && !isCorrect) {
                                borderClass = 'border-[#DC2626]/50 bg-[#DC2626]/10';
                                textClass = 'text-[#DC2626] font-bold';
                                label = 'YOUR CHOICE';
                              } else if (isUserChoice && isCorrect) {
                                label = 'YOUR CHOICE (CORRECT)';
                              }

                              return (
                                <div key={oIdx} className={`p-3 rounded-xl border text-xs flex items-center gap-3 ${borderClass} ${textClass}`}>
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${isCorrectChoice ? 'border-green-500 bg-green-500 text-white' : (isUserChoice ? 'border-[#DC2626] bg-[#DC2626] text-white' : 'border-white/20')}`}>
                                    {String.fromCharCode(65 + oIdx)}
                                  </div>
                                  <div className="flex-1 flex flex-col">
                                    <MarkdownRenderer content={opt} />
                                    {label && <span className="text-[8px] font-black uppercase mt-1 opacity-60">{label}</span>}
                                  </div>
                                  {isCorrectChoice && <Check size={14} />}
                                  {isUserChoice && !isCorrect && <X size={14} />}
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} border border-dashed border-white/10`}>
                              <p className="text-[9px] font-black text-white/30 uppercase mb-2 flex items-center gap-1.5">
                                <Info size={12} className="text-[#DC2626]" /> Explanation
                              </p>
                              <MarkdownRenderer content={q.explanation} className="text-xs text-white/70 leading-relaxed" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button onClick={() => setExamLobbyState('login')} className="w-full bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-4 rounded-2xl text-sm shadow-xl shadow-[#DC2626]/20 transition-all flex items-center justify-center gap-2">
                    FINISH REVIEW & LOGOUT
                  </button>
                </div>
              )}
            </motion.div>
          )}
                  {toolsSubTab === 'assignment' && (
                    <motion.div key="assignment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <AssignmentSolver 
                        theme={theme} 
                        user={user} 
                        isPremium={isPremium} 
                        getAiInstance={getAiInstance} 
                        fileToGenerativePart={fileToGenerativePart}
                        setUserNotification={setUserNotification}
                        setChatHistory={setChatHistory}
                        setActiveTab={setActiveTab}
                        setActiveChatSessionId={setActiveChatSessionId}
                        addToFinishedHistory={addToFinishedHistory}
                        finishedHistory={finishedHistory}
                        solution={activeAssignmentSolution}
                        setSolution={setActiveAssignmentSolution}
                        checkAndIncrementUsage={checkAndIncrementUsage}
                        generateQuiz={generateQuiz}
                        setToolsSubTab={setToolsSubTab}
                      />
                    </motion.div>
                  )}
                  {toolsSubTab === 'courses' && (
                    <motion.div key="courses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <CoursesTool 
                        theme={theme}
                        user={user}
                        getAiInstance={getAiInstance}
                        getHfInstance={getHfInstance}
                        setUserNotification={setUserNotification}
                        quizTopic={quizTopic}
                        setQuizTopic={setQuizTopic}
                        quizQuestionCount={quizQuestionCount}
                        setQuizQuestionCount={setQuizQuestionCount}
                        quizDifficulty={quizDifficulty}
                        setQuizDifficulty={setQuizDifficulty}
                        generateQuiz={generateQuiz}
                        setToolsSubTab={setToolsSubTab}
                        quizState={quizState}
                        setQuizState={setQuizState}
                        checkAndIncrementUsage={checkAndIncrementUsage}
                      />
                    </motion.div>
                  )}
                  {toolsSubTab === 'faculty' && (
                    <div className="h-full">
                      <AILibrary 
                        theme={theme} 
                        setUserNotification={setUserNotification} 
                        onSaveHistory={handleSaveFacultyHistory}
                        checkAndIncrementUsage={checkAndIncrementUsage}
                      />
                    </div>
                  )}
                  
                  <HelpOverlay 
                    isOpen={showHelp} 
                    onClose={() => setShowHelp(false)} 
                    toolId={toolsSubTab} 
                    theme={theme} 
                  />
                </div>
              )}
            </motion.div>
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

          {/* AI CHAT TAB */}
          {activeTab === 'ai' && (
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
                    
                    {/* Branded Omni Logo */}
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center relative shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, #FF007F 0%, #DC2626 50%, #991B1B 100%)',
                          boxShadow: '0 0 12px var(--accent-glow)',
                        }}
                      >
                        <span
                          className="font-black text-white text-sm leading-none"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          O
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tight leading-none" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Omni</h3>
                        <p className="text-[8px] font-bold text-green-500 uppercase tracking-[0.15em] mt-0.5 animate-pulse">Neural Engine v4.0</p>
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
                    <button 
                      onClick={() => setToolsSubTab('live')}
                      className="flex items-center gap-2 bg-[#DC2626]/10 hover:bg-[#DC2626]/20 text-[#DC2626] px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase transition-all border border-[#DC2626]/20"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      <Activity size={12} className="animate-pulse" /> LIVE TUTOR
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
                              {/* Glowing Omni Emblem */}
                              <div 
                                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 relative"
                                style={{
                                  background: 'linear-gradient(135deg, #FF007F 0%, #DC2626 50%, #991B1B 100%)',
                                  boxShadow: '0 0 24px var(--accent-glow)',
                                }}
                              >
                                <Brain size={28} className="text-white animate-pulse" />
                                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl blur opacity-30 animate-pulse -z-10" />
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
                          const quizRegex = /\[\[GENERATE_QUIZ:\s*([^,\]]+),\s*(\d+)\s*\]\]/i;
                          const hasQuizMatch = msg.text.match(quizRegex);
                          const cleanContent = msg.text.replace(quizRegex, '').trim();

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

                                    {/* Action item card for self-set quiz inside the AI bubble */}
                                    {hasQuizMatch && (
                                      <div className="mt-3.5 p-4 bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                          <div className="w-10 h-10 rounded-xl bg-[#DC2626]/20 flex items-center justify-center text-[#DC2626] shrink-0">
                                            <Trophy size={18} />
                                          </div>
                                          <div>
                                            <p className="text-[8px] font-black uppercase text-[#DC2626]/80 tracking-widest leading-none mb-1">Omni Self-Set Quiz Available</p>
                                            <p className="text-xs font-black text-white uppercase tracking-tight line-clamp-1">{hasQuizMatch[1]?.trim()}</p>
                                            <p className="text-[10px] text-white/50">{hasQuizMatch[2]} custom active questions set by Omni</p>
                                          </div>
                                        </div>
                                        <button 
                                          onClick={() => {
                                            const quizTopicText = hasQuizMatch[1]?.trim() || "Omni Active Quiz";
                                            const quizCountNum = parseInt(hasQuizMatch[2], 10) || 5;
                                            setActiveTab('tools');
                                            setToolsSubTab('quiz');
                                            generateQuiz(quizTopicText, quizCountNum, 'Medium'); 
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
                              { id: 'Creative', icon: Sparkles, label: 'Creative' }
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
                            <textarea 
                              value={chatInput} 
                              onChange={(e) => setChatInput(e.target.value)} 
                              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                              placeholder={isRecordingChat ? "Recording audio..." : chatMode === 'Vision' ? "Ask about diagrams..." : "Ask Omni..."} 
                              className="flex-1 bg-transparent border-none outline-none px-2 py-2 text-xs placeholder:text-white/20 resize-none min-h-[38px] max-h-28 self-center custom-scrollbar" 
                              style={{ color: 'var(--text-primary)' }}
                            />

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
                      <textarea
                        value={notepadContent}
                        onChange={e => setNotepadContent(e.target.value)}
                        className="flex-1 w-full p-3 bg-black border border-white/5 rounded-xl text-xs font-mono outline-none text-emerald-400 resize-none leading-relaxed focus:border-[#DC2626]"
                      />
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
            <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-black uppercase tracking-tighter text-white">Notifications</h2>
                <Bell size={20} className="text-[#DC2626]" />
              </div>

              {selectedArticle ? (
                <div className="space-y-6">
                  <button 
                    onClick={() => setSelectedArticle(null)}
                    className="flex items-center gap-2 text-[10px] font-black text-[#DC2626] uppercase tracking-widest hover:opacity-70 transition-all"
                  >
                    <ArrowLeft size={14} /> Back to List
                  </button>
                  <div className={`${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} p-8 rounded-3xl border shadow-sm space-y-6`}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-black text-[#DC2626] uppercase tracking-widest">
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
                  {/* USER ACTIVITY ALERTS BLOCK - NEW REALTIME ALERTS AS REQUESTED */}
                  {personalNotifications.length > 0 && (
                    <div className="space-y-3 text-left">
                      <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] px-2 flex items-center gap-1.5 leading-none mb-1">
                        <span>🔥 Study & Streak Challenges</span>
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {personalNotifications.map((notif) => (
                          <div 
                            key={notif.id}
                            onClick={() => {
                              if (notif.type !== 'streak_request' || notif.resolved) {
                                handleNotificationClick(notif);
                              }
                            }}
                            className={`p-4 rounded-[1.5rem] bg-gradient-to-br from-[#1E1B2E] via-[#120F1F] to-[#0A0815] border ${notif.read ? 'border-white/5 opacity-70' : 'border-[#DC2626]/30 hover:border-[#DC2626]/60'} shadow-lg relative overflow-hidden group transition-all duration-300 ${notif.type !== 'streak_request' || notif.resolved ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
                          >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#DC2626]/5 to-blue-500/5 blur-xl rounded-full" />
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-blue-600 flex items-center justify-center text-sm shadow-md shrink-0">
                                  {notif.type === 'streak_request' ? '🔥' : notif.type === 'streak_accept' ? '⚡' : '👋'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-black text-white leading-normal">{notif.title}</p>
                                  <p className="text-[10px] text-white/60 mt-0.5 leading-normal">{notif.message}</p>
                                </div>
                              </div>

                              {notif.type === 'streak_request' && !notif.resolved ? (
                                <button 
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      // 1. Mark notification as resolved
                                      await updateDoc(doc(db, 'notifications', notif.id), {
                                        resolved: true,
                                        read: true
                                      });
                                      
                                      // 2. Alert the sender that request was accepted
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
                                      
                                      // 3. Post to the public social feed!
                                      await addDoc(collection(db, 'activities'), {
                                        type: 'streak_accept',
                                        text: `${currentUserData?.username || 'Scholar'} and ${notif.fromName || 'another scholar'} activated a 5-DAY STUDY STREAK! 🔥`,
                                        username: currentUserData?.username || 'Scholar',
                                        userId: user.uid,
                                        userPhoto: currentUserData?.photoURL || '',
                                        timestamp: serverTimestamp() || new Date()
                                      });

                                      // 4. Boost user points for establishing streak
                                      const newPoints = (currentUserData?.points || 0) + 15;
                                      await updateDoc(doc(db, 'users', user.uid), {
                                        points: newPoints,
                                        rank: getUserRank(newPoints)
                                      });

                                      // 5. Instantly route user to the notes notebook editor to start writing notes!
                                      setActiveTab('tools');
                                      setToolsSubTab('notebook');

                                      setUserNotification("🎉 Reading streak active! You received +15 XP bonus!");
                                    } catch (err) {
                                      console.error("Accept streak error:", err);
                                      setUserNotification("Failed to accept streak request.");
                                    }
                                  }}
                                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-blue-600 hover:opacity-95 active:scale-95 text-white text-[9px] font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-center"
                                >
                                  Accept 🔥
                                </button>
                              ) : notif.type === 'streak_request' ? (
                                <span className="text-[7px] font-black text-green-400 uppercase tracking-widest bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg shrink-0">
                                  Challenge Active ✓
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] px-2 text-left pt-2 leading-none">
                     <span>📢 Broadcasts & Announcements</span>
                  </h3>

                  {blogPosts.length === 0 ? (
                    <div className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-12 rounded-3xl border shadow-sm text-center space-y-4`}>
                      <div className="w-16 h-16 bg-[#DC2626]/10 rounded-full flex items-center justify-center mx-auto">
                        <BookOpen size={32} className="text-[#DC2626]" />
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
                        className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group ${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10 hover:border-[#DC2626]/50' : 'bg-white border-slate-200 hover:border-[#DC2626]/50 shadow-sm'}`}
                      >
                        {!readArticles.includes(post.id) && (
                          <div className="absolute top-4 right-4 w-2 h-2 bg-[#DC2626] rounded-full animate-pulse" />
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[8px] font-black text-[#DC2626] uppercase tracking-widest">
                            <Calendar size={10} />
                            {post.timestamp?.toDate ? post.timestamp.toDate().toLocaleDateString() : 'Just now'}
                          </div>
                          <h3 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-[#DC2626] transition-colors">{post.title}</h3>
                          <p className="text-[10px] text-white/40 line-clamp-2 leading-relaxed">
                            {post.content.replace(/[#*`]/g, '').substring(0, 120)}...
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
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
              setShowInviteModal={setShowInviteModal}
              theme={theme}
              quests={dailyQuests}
            />
          )}

          {/* PROFILE TAB (GUEST FALLBACK) */}
          {activeTab === 'profile' && !user && (
            <motion.div 
              key="profile-guest" 
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto space-y-6 select-none my-12"
            >
              <div className="w-16 h-16 bg-[#DC2626]/10 rounded-2xl flex items-center justify-center text-[#DC2626]">
                <User size={36} />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">NSG Scholar Profile</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Log in or quickly create your official NSG study account to participate on the scholar rankings, track study histories, and save lecture audio analysis logs.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center pt-2">
                <button 
                  onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                  className="px-6 py-3.5 bg-[#DC2626] hover:bg-red-500 text-white font-black uppercase text-[9px] tracking-widest rounded-xl shadow-xl shadow-[#DC2626]/20 active:scale-95 transition-all cursor-pointer"
                >
                  Create Account
                </button>
                <button 
                  onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                  className="px-6 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 font-black uppercase text-[9px] tracking-widest text-white rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  Log In
                </button>
              </div>
            </motion.div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && user && (
            <motion.div 
              key="profile" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }} 
              onTouchStart={handleProfileTouchStart}
              onTouchMove={handleProfileTouchMove}
              onTouchEnd={handleProfileTouchEnd}
              className={`flex-1 flex flex-col px-2 sm:px-0 relative mb-24 select-none ${theme === 'dark' ? 'bg-[#13111C]' : 'bg-slate-50'}`}
            >
              <div className="space-y-6 pb-6 text-left">
                    {/* Gamified Bio & Identity Card (Premium Gamified Vibe) */}
                <div className="bg-gradient-to-br from-[#1E1B2E] to-[#0A0714] p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-left">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#DC2626]/20 to-pink-500/10 blur-[60px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                      
                      <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                          {/* XP Power Indicator (Displays beside profile picture to the left) */}
                          <div className="bg-gradient-to-br from-amber-400/20 via-pink-500/10 to-transparent border border-amber-500/20 rounded-[2.2rem] p-4 text-center shrink-0 w-24 h-24 sm:w-28 sm:h-28 flex flex-col items-center justify-center gap-1 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-yellow-300" />
                            <span className="text-3xl">💎</span>
                            <span className="text-[7px] font-black text-amber-400 uppercase tracking-[0.2em] leading-none">XP POWER</span>
                            <span className="text-sm font-black text-white leading-none mt-1">{currentUserData?.points || 0} XP</span>
                          </div>

                          {/* Avatar Group */}
                          <div className="relative group">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-[#DC2626] p-1 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                              <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950 relative">
                                {currentUserData?.photoURL ? (
                                  <img src={currentUserData.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950">
                                    <User size={48} className="sm:size-[56px]" />
                                  </div>
                                )}
                              </div>
                            </div>
                            <label className="absolute bottom-1 right-1 p-2 bg-[#DC2626] border-b-4 border-[#991B1B] text-white rounded-2xl cursor-pointer shadow-xl active:translate-y-1 active:border-b-0 hover:bg-red-500 transition-all z-10">
                              <Camera size={14} />
                              <input type="file" className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
                            </label>
                            {/* Crown overlay */}
                            {leaderboard.length > 0 && (leaderboard[0].id === user?.uid || leaderboard[0].uid === user?.uid) && (
                              <div className="absolute -top-4 -left-1 bg-yellow-400 text-black text-[8px] font-black uppercase tracking-wider rounded-lg px-1.5 py-0.5 shadow-md flex items-center gap-0.5">
                                👑 Champ
                              </div>
                            )}
                          </div>

                          {/* Profile Details */}
                          <div className="text-center md:text-left space-y-1.5">
                            <div className="flex flex-col md:flex-row items-center gap-2">
                              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter italic leading-none">
                                {currentUserData?.displayName || 'Student Scholar'}
                              </h2>
                              <div className="flex items-center gap-1.5">
                                <span className="bg-gradient-to-r from-red-500/20 to-red-600/30 text-red-400 px-3 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-widest">
                                  {currentUserData?.rank || 'Fresher'}
                                </span>
                                {isPremium && (
                                  <span className="bg-yellow-500/20 text-yellow-500 px-3 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-widest flex items-center gap-1">
                                    <Sparkles size={8} /> Premium
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">@{currentUserData?.username || 'no_handle'}</p>
                            
                            {/* Stats Badges Row */}
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1.5">
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 rounded-2xl text-yellow-400">
                                <span className="text-xs">🔥</span>
                                <span className="text-[8.5px] font-black uppercase tracking-wider">{currentUserData?.streak || 0} Day Streak</span>
                              </div>
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 rounded-2xl text-blue-400">
                                <span className="text-xs">💎</span>
                                <span className="text-[8.5px] font-black uppercase tracking-wider">{currentUserData?.points || 0} XP Points</span>
                              </div>
                              <div className={`flex items-center gap-1.5 px-3 py-1.5 ${getScholarLeagueInfo(currentUserData?.points || 0).bgClass} rounded-2xl ${getScholarLeagueInfo(currentUserData?.points || 0).textColor}`}>
                                <span className="text-xs">{getScholarLeagueInfo(currentUserData?.points || 0).emoji}</span>
                                <span className="text-[8.5px] font-black uppercase tracking-wider">{getScholarLeagueInfo(currentUserData?.points || 0).text}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Premium style bouncy Action button */}
                        <div className="w-full md:w-auto mt-4 md:mt-0 shrink-0">
                          <button 
                            onClick={() => setIsEditingProfile(true)}
                            className="relative w-full md:w-auto py-3 px-6 rounded-2xl bg-[#1CB0F6] border-b-[5px] border-[#1899D6] text-white font-black uppercase tracking-widest text-[9px] hover:bg-[#20C0F7] active:border-b-0 active:translate-y-[4px] active:shadow-inner transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10"
                          >
                            <Edit3 size={12} />
                            EDIT ACCOUNT INFO
                          </button>
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
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white">WhatsApp Account Sync</h4>
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-400/80 mt-0.5">
                              {currentUserData?.isWhatsAppVerified ? "🟢 SECURED & VERIFIED" : "🔴 NOT SYNCHRONIZED"}
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

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Classes & Notes', value: sessions.length, subtitle: 'compiled logs', emoji: '📚', color: 'from-blue-600/25 to-blue-500/5 text-blue-300' },
                        { label: 'Smart Quizzes', value: finishedHistory.filter(h => h.type === 'quiz').length, subtitle: 'retention runs', emoji: '⚡', color: 'from-[#FFC000]/25 to-amber-500/5 text-yellow-300' },
                        { label: 'Completed Streaks', value: currentUserData?.streak || 0, subtitle: 'unbroken study', emoji: '🔥', color: 'from-red-600/25 to-rose-500/5 text-red-300' },
                        { label: 'Academic Standing', value: currentUserData?.rank || 'Master', subtitle: 'honor tier rank', emoji: '🌟', color: 'from-purple-600/25 to-indigo-500/5 text-purple-300' }
                      ].map((stat, i) => (
                        <div key={i} className={`bg-gradient-to-tr ${stat.color} p-5 rounded-[2rem] text-center space-y-1 shadow-2xl`}>
                          <div className="text-xl mb-1">{stat.emoji}</div>
                          <p className="text-[8px] font-black opacity-40 uppercase tracking-widest">{stat.label}</p>
                          <p className="text-base font-black truncate">{stat.value}</p>
                          <p className="text-[7px] font-black opacity-30 uppercase tracking-widest">{stat.subtitle}</p>
                        </div>
                      ))}
                    </div>

                    {/* Smart Quests Dashboard Block (Pink Banner, Treasure Chests) */}
                    <div className="bg-gradient-to-br from-[#1E1B2E] to-[#120F1F] p-6 rounded-[2.5rem] shadow-2xl space-y-6 text-left">
                      {/* Active Month Challenge Ribbon */}
                      <div className="bg-gradient-to-r from-[#FF007F] via-[#FF1493] to-[#8A2BE2] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute right-4 top-4 text-5xl opacity-20 select-none animate-pulse">🏅</div>
                        <h4 className="text-sm font-black uppercase tracking-wider mb-0.5 flex items-center gap-1">
                          ✨ Smart Study Quest Dashboard
                        </h4>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-white/70">
                          <span>📅 CURRENT MONTH CHALLENGE</span>
                          <span>•</span>
                          <span className="text-yellow-300">⏲️ 10 DAYS REMAINING</span>
                        </div>

                        {/* Quest Points Subcard */}
                        <div className="bg-black/25 backdrop-blur-md rounded-2xl p-4 mt-5 space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-black uppercase tracking-wider">Accumulate 20 Quest Points</span>
                            <span className="font-black text-yellow-300">
                              {Math.min(20, Math.floor(((currentUserData?.points || 0) * 0.012) + (currentUserData?.streak || 0) * 1.5))} / 20 QP
                            </span>
                          </div>

                          {/* Pink glowing progress bar */}
                          <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden relative">
                            <div 
                              className="h-full bg-gradient-to-r from-[#FF00BF] via-[#FF007F] to-[#D500F9] relative flex items-center justify-end pr-2 transition-all duration-700" 
                              style={{ width: `${Math.min(100, Math.round((Math.min(20, Math.floor(((currentUserData?.points || 0) * 0.012) + (currentUserData?.streak || 0) * 1.5)) / 20) * 100))}%` }}
                            >
                              <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping absolute right-1" />
                            </div>
                          </div>

                          <p className="text-[7px] font-bold text-white/50 uppercase tracking-widest">
                            Claim 100 Bonus XP and unlock the limited-edition Monthly Synergy Badge upon completing!
                          </p>
                        </div>
                      </div>

                      {/* Daily Quests List with Chest graphics */}
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">DAILY STUDY QUESTS</h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            {
                              id: "newbie_study",
                              title: "Begin Academic Recording",
                              desc: "Start recording at least 1 study session to index lecture topics with Omni AI.",
                              progress: `${Math.min(1, (sessions || []).length)} / 1`,
                              progressPercent: Math.min(100, Math.round(((sessions || []).length / 1) * 100)),
                              isDone: (sessions || []).length >= 1,
                              chest: "🧰",
                              reward: 30,
                              buttonLabel: "LAUNCH RECORDING",
                              btnColor: "bg-[#FFC000] border-[#E0A300] hover:bg-[#FFD020] text-black",
                              targetTab: "tools",
                              targetSubTab: "notebook"
                            },
                            {
                              id: "quiz_apprentice",
                              title: "Apprentice Quizzer",
                              desc: "Evaluate your understanding by completing at least 1 Smart Quiz session.",
                              progress: `${Math.min(1, finishedHistory.filter(h => h.type === 'quiz').length)} / 1`,
                              progressPercent: Math.min(100, Math.round((finishedHistory.filter(h => h.type === 'quiz').length / 1) * 100)),
                              isDone: finishedHistory.filter(h => h.type === 'quiz').length >= 1,
                              chest: "💎🧰",
                              reward: 50,
                              buttonLabel: "TEST RETENTION",
                              btnColor: "bg-[#1CB0F6] border-[#1899D6] hover:bg-[#20C0F7] text-white",
                              targetTab: "tools",
                              targetSubTab: "quiz"
                            },
                            {
                              id: "expert_quiz_master",
                              title: "Quiz Excellence Run",
                              desc: "Attempt and complete at least 3 separate Smart Quizzes with score logs.",
                              progress: `${Math.min(3, finishedHistory.filter(h => h.type === 'quiz').length)} / 3`,
                              progressPercent: Math.min(100, Math.round((finishedHistory.filter(h => h.type === 'quiz').length / 3) * 100)),
                              isDone: finishedHistory.filter(h => h.type === 'quiz').length >= 3,
                              chest: "🏅🧰",
                              reward: 100,
                              buttonLabel: "SPEEDRUN QUIZZES",
                              btnColor: "bg-[#9333EA] border-[#7E22CE] hover:bg-[#A855F7] text-white",
                              targetTab: "tools",
                              targetSubTab: "quiz"
                            },
                            {
                              id: "omni_notes_creator",
                              title: "Academic Oracle",
                              desc: "Compile and save at least 5 different classes/lecture notebooks in your logs.",
                              progress: `${Math.min(5, (sessions || []).length)} / 5`,
                              progressPercent: Math.min(100, Math.round(((sessions || []).length / 5) * 100)),
                              isDone: (sessions || []).length >= 5,
                              chest: "🔮🧰",
                              reward: 150,
                              buttonLabel: "COMPILE VAULT",
                              btnColor: "bg-[#EC4899] border-[#DB2777] hover:bg-[#F472B6] text-white",
                              targetTab: "tools",
                              targetSubTab: "notebook"
                            },
                            {
                              id: "social_chats",
                              title: "Cooperative Scholar",
                              desc: "Start and establish at least 2 active messaging threads with Omni AI or peers.",
                              progress: `${Math.min(2, (chatSessions || []).length)} / 2`,
                              progressPercent: Math.min(100, Math.round(((chatSessions || []).length / 2) * 100)),
                              isDone: (chatSessions || []).length >= 2,
                              chest: "💬🧰",
                              reward: 120,
                              buttonLabel: "TALK WITH PEERS",
                              btnColor: "bg-[#14B8A6] border-[#0D9488] hover:bg-[#2DD4BF] text-white",
                              targetTab: "community",
                              targetSubTab: "quests"
                            },
                            {
                              id: "streak_goliath",
                              title: "Streak Immortal",
                              desc: "Defend and lock down an elite daily reading streak of at least 5 unbroken days.",
                              progress: `${Math.min(5, currentUserData?.streak || 0)} / 5`,
                              progressPercent: Math.min(100, Math.round((Math.min(5, currentUserData?.streak || 0) / 5) * 100)),
                              isDone: (currentUserData?.streak || 0) >= 5,
                              chest: "👑🧰",
                              reward: 250,
                              buttonLabel: "MAINTAIN FIRE",
                              btnColor: "bg-[#58CC02] border-[#389101] hover:bg-[#61E002] text-white",
                              targetTab: "tools",
                              targetSubTab: "notebook"
                            }
                          ].map((qst, idx) => {
                            const isClaimed = currentUserData?.claimedQuests?.includes(qst.id);
                            const canClaim = qst.isDone && !isClaimed;

                            const handleQuestClaim = async () => {
                              if (!user?.uid) return;
                              // STRICT REQUIREMENT: Users cannot claim quests they did not achieve
                              if (!qst.isDone) {
                                setUserNotification(`🔒 You haven't completed this quest yet! Run more sessions to reach "${qst.progress}".`);
                                return;
                              }
                              try {
                                // Optimistically update state so user sees it instantly!
                                setCurrentUserData((prev: any) => {
                                  if (!prev) return prev;
                                  const oldClaims = prev.claimedQuests || [];
                                  const newPoints = (prev.points || 0) + qst.reward;
                                  return {
                                    ...prev,
                                    points: newPoints,
                                    claimedQuests: oldClaims.includes(qst.id) ? oldClaims : [...oldClaims, qst.id],
                                    rank: getUserRank(newPoints)
                                  };
                                });

                                await updateDoc(doc(db, 'users', user.uid), {
                                  claimedQuests: arrayUnion(qst.id),
                                  points: increment(qst.reward),
                                  rank: getUserRank((currentUserData?.points || 0) + qst.reward)
                                });
                                setUserNotification(`🎁 QUEST COMPLETED! Claimed ${qst.reward} XP Points.`);
                              } catch (e) {
                                console.error(e);
                                setUserNotification("Error claiming quest points. Try again!");
                              }
                            };

                            const handleQuestAction = () => {
                              if (canClaim) {
                                handleQuestClaim();
                              } else if (isClaimed) {
                                setUserNotification("🌈 Quest already claimed! Check your rank standing.");
                              } else {
                                // Navigate to specified tool tab
                                setActiveTab(qst.targetTab as any);
                                if (qst.targetSubTab) {
                                  setToolsSubTab(qst.targetSubTab as any);
                                }
                                setUserNotification(`🚀 Milestone: ${qst.title}! Let's go dynamic.`);
                              }
                            };

                            return (
                              <div key={idx} className="bg-zinc-900/40 p-5 rounded-[2rem] flex flex-col justify-between space-y-4 relative overflow-hidden shadow-xl border border-white/5">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <span className={`text-[7px] font-black px-2 py-0.5 rounded-full ${isClaimed ? 'bg-purple-500/10 text-purple-400' : qst.isDone ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'} uppercase tracking-widest`}>
                                      {isClaimed ? 'CLAIMED' : qst.isDone ? 'COMPLETED' : 'PENDING'}
                                    </span>
                                    <h6 className="font-black text-xs text-white uppercase tracking-tight mt-1">{qst.title}</h6>
                                    <p className="text-[9.5px] font-bold text-white/45 uppercase leading-tight">{qst.desc}</p>
                                  </div>
                                  <div className="text-3xl filter drop-shadow-lg">{qst.chest}</div>
                                </div>

                                <div className="space-y-3">
                                  <div className="flex justify-between items-center text-[9px] font-black">
                                    <span className="text-white/30 uppercase tracking-widest">Progress</span>
                                    <span className={qst.isDone ? "text-green-400" : "text-white/60"}>{qst.progress}</span>
                                  </div>
                                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                    <div className={`h-full ${qst.isDone ? 'bg-green-500' : 'bg-red-500/50'}`} style={{ width: `${qst.progressPercent}%` }} />
                                  </div>

                                  <button 
                                    onClick={handleQuestAction}
                                    className={`relative w-full py-2.5 px-4 rounded-xl text-[8.5px] font-black uppercase tracking-wider transition-all border-b-[4px] active:border-b-0 active:translate-y-[4px] flex items-center justify-center gap-1.5 ${qst.btnColor}`}
                                  >
                                    {isClaimed ? "CLAIMED!" : canClaim ? `CLAIM +${qst.reward} XP!` : qst.buttonLabel}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Friend Streaks row (Premium style circles and invite feature) */}
                    <div className="bg-gradient-to-br from-[#1E1B2E] to-[#120F1F] p-6 rounded-[2.5rem] shadow-2xl space-y-4 text-left">
                      <div>
                        <h5 className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">FRIEND STREAKS</h5>
                        <p className="text-[8.5px] font-bold text-white/45 uppercase leading-none mt-1">Study alongside other global scholars on campus</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 py-2">
                        {/* Current User Streak Circle */}
                        <div className="flex flex-col items-center gap-1 group">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#DC2626] to-[#991B1B] p-1 shadow-lg relative shrink-0">
                            <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950 flex items-center justify-center font-display text-white italic font-black text-xs">
                              ME
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-black shadow-md">
                              🔥{currentUserData?.streak || 0}
                            </div>
                          </div>
                          <span className="text-[8px] font-black text-white/60 truncate w-14 text-center uppercase mt-1">You</span>
                        </div>

                        {/* Top scholars mapped in circles */}
                        {leaderboard.slice(0, 3).map((peer, pIdx) => {
                          if (peer.uid === user?.uid) return null;
                          return (
                            <div key={peer.id} className="flex flex-col items-center gap-1 group">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-[#1DB0F6] p-1 shadow-lg relative shrink-0">
                                <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950 relative">
                                  {peer.photoURL ? (
                                    <img src={peer.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/20"><User size={20} /></div>
                                  )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-black shadow-md">
                                  🔥{Math.max(1, peer.streak || 2)}
                                </div>
                              </div>
                              <span className="text-[8px] font-black text-white/60 truncate w-14 text-center uppercase mt-1">
                                {peer.username || peer.displayName?.split(' ')[0] || "Partner"}
                              </span>
                            </div>
                          );
                        })}

                        {/* Invite Plus circle placeholder buttons */}
                        {[1, 2, 3].map((inv) => (
                          <button 
                            key={inv}
                            type="button"
                            onClick={() => setShowInviteModal(true)}
                            className="flex flex-col items-center gap-1 group focus:outline-none"
                          >
                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 hover:border-white/30 flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5 transition-all outline-none">
                              <span className="text-xl font-black">+</span>
                            </div>
                            <span className="text-[8px] font-black text-white/30 uppercase mt-1">ADD BUDDY</span>
                          </button>
                        ))}
                      </div>

                      <button 
                        onClick={() => {
                          setUserNotification("✨ Mutually synchronised streak points! All team milestones are safe.");
                        }}
                        className="relative w-full py-3 px-4 rounded-xl bg-[#1CB0F6] border-b-[4px] border-[#1899D6] text-white font-black uppercase text-[9px] tracking-widest hover:bg-[#20C0F7] active:border-b-0 active:translate-y-[4px] transition-all"
                      >
                        ⚡ SYNCHRONIZE MUTUAL STREAKS
                      </button>
                    </div>

                    {/* Monthly Badges & Trophy Cabinet */}
                    <div className="bg-gradient-to-br from-[#1E1B2E] to-[#120F1F] p-6 rounded-[2.5rem] shadow-2xl space-y-6 text-left">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">MONTHLY BADGES</h5>
                          <p className="text-[8.5px] font-bold text-white/45 uppercase leading-none mt-1">Unlock badges to stamp your study logs</p>
                        </div>
                        <span className="text-xs">🏆</span>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        {[
                          { title: "May Synergy", icon: "🌸", desc: "Active learner", status: "UNLOCKED", unlocked: true, theme: "from-pink-500 to-purple-600 shadow-pink-500/10" },
                          { title: "Exam Victor", icon: "🎓", desc: "Host or join CBT", status: "UNLOCKED", unlocked: true, theme: "from-blue-500 to-cyan-600 shadow-blue-500/10" },
                          { title: "Quiz Prodigy", icon: "⚡", desc: "90% score streak", status: "LOCKED", unlocked: false, theme: "bg-zinc-800/80 saturate-50 opacity-40" },
                          { title: "Audio Master", icon: "🎙️", desc: "5 Lectures synced", status: "LOCKED", unlocked: false, theme: "bg-zinc-800/80 saturate-50 opacity-40" }
                        ].map((bdg, bIdx) => (
                          <div key={bIdx} className="flex flex-col items-center text-center space-y-1.5">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-xl relative ${bdg.unlocked ? `bg-gradient-to-tr ${bdg.theme}` : bdg.theme}`}>
                              <span>{bdg.icon}</span>
                              {!bdg.unlocked && (
                                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-[10px]">
                                  🔒
                                </div>
                              )}
                            </div>
                            <span className="text-[8px] font-black text-white truncate w-16 uppercase mt-1">{bdg.title}</span>
                            <span className="text-[6.5px] font-bold text-white/30 uppercase whitespace-nowrap leading-none">{bdg.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Achievements List */}
                    <div className="bg-gradient-to-br from-[#1E1B2E] to-[#120F1F] p-6 rounded-[2.5rem] shadow-2xl space-y-4 text-left">
                      <div>
                        <h5 className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">UNLOCKED ACHIEVEMENTS</h5>
                        <p className="text-[8.5px] font-bold text-white/45 uppercase leading-none mt-1">Climb high-yield milestones for booster score points</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { 
                            id: "sage_scholar",
                            title: "Sage Scholar", 
                            badge: "🤠", 
                            xp: 150, 
                            desc: "Completed 25 high-yield study sessions with Omni", 
                            color: "from-[#FFC000]/20 to-yellow-500/5 text-yellow-300 border border-yellow-500/10",
                            isComplete: (sessions || []).length >= 25,
                            progress: `${(sessions || []).length} / 25`
                          },
                          { 
                            id: "regal_leader",
                            title: "Regal Leader", 
                            badge: "🧜‍♀️", 
                            xp: 100, 
                            desc: "Maintained active leadership coordinates on podium (Points >= 500)", 
                            color: "from-[#FF007F]/20 to-pink-500/5 text-pink-300 border border-pink-500/10",
                            isComplete: (currentUserData?.points || 0) >= 500,
                            progress: `${currentUserData?.points || 0} / 500 XP`
                          },
                          { 
                            id: "legal_reader",
                            title: "Legal Reader", 
                            badge: "⚖️", 
                            xp: 100, 
                            desc: "Used study note tools up to 10 times a day", 
                            color: "from-[#1CB0F6]/20 to-blue-500/5 text-blue-300 border border-blue-500/10",
                            isComplete: (currentUserData?.dailyNoteUsage || 0) >= 10,
                            progress: `${currentUserData?.dailyNoteUsage || 0} / 10 Saves`
                          },
                          { 
                            id: "wildfire_ace",
                            title: "Wildfire Ace", 
                            badge: "👨‍🌾", 
                            xp: 100, 
                            desc: "Ignited a 10-day streak on NSG servers", 
                            color: "from-[#58CC02]/20 to-green-500/5 text-green-300 border border-green-500/10",
                            isComplete: (currentUserData?.streak || 0) >= 10,
                            progress: `${currentUserData?.streak || 0} / 10 Days`
                          }
                        ].map((ach, aIdx) => {
                          const isClaimed = currentUserData?.claimedAchievements?.includes(ach.id);
                          const canClaim = ach.isComplete && !isClaimed;

                          const handleClaimAchievement = async () => {
                            if (!user?.uid) return;
                            try {
                              await updateDoc(doc(db, 'users', user.uid), {
                                claimedAchievements: arrayUnion(ach.id),
                                points: increment(ach.xp)
                              });
                              setUserNotification(`🏆 ${ach.title} Claimed! +${ach.xp} XP Multiplier Added.`);
                            } catch (e) {
                              console.error(e);
                              setUserNotification("Failed to claim achievement reward. Please try again!");
                            }
                          };

                          return (
                            <div key={aIdx} className={`bg-gradient-to-br ${ach.color} p-5 rounded-[2rem] flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-xl relative overflow-hidden group border`}>
                              {ach.isComplete && !isClaimed && (
                                <div className="absolute top-2 right-2 bg-[#DC2626] text-white text-[6px] font-sans font-black px-2 py-0.5 rounded-full tracking-widest animate-pulse">
                                  COMPLETED
                                </div>
                              )}
                              {isClaimed && (
                                <div className="absolute top-2 right-2 bg-green-600/30 text-green-400 text-[6px] font-sans font-black px-2 py-0.5 rounded-full tracking-widest">
                                  CLAIMED
                                </div>
                              )}

                              <div className="flex items-center gap-3">
                                <div className="text-3xl filter drop-shadow-md select-none group-hover:scale-110 transition-transform">{ach.badge}</div>
                                <div className="space-y-1">
                                  <h6 className="font-black text-xs text-white uppercase tracking-tight leading-none">{ach.title}</h6>
                                  <p className="text-[8px] text-white/55 leading-snug">{ach.desc}</p>
                                  <p className="text-[7px] font-bold text-white/40 uppercase tracking-widest mt-1">Progress: {ach.progress}</p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                {canClaim ? (
                                  <button 
                                    onClick={handleClaimAchievement}
                                    className="px-4 py-1.5 bg-[#DC2626] border-b-[3px] border-red-800 text-white font-black text-[7.5px] uppercase tracking-widest rounded-xl hover:bg-red-500 transition-all active:border-b-0 active:translate-y-[2px]"
                                  >
                                    Claim +{ach.xp} XP
                                  </button>
                                ) : isClaimed ? (
                                  <span className="font-sans font-black text-xs text-green-400 block">Claimed!</span>
                                ) : (
                                  <span className="font-sans font-black text-xl text-white/30 block">+{ach.xp} XP</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Personal Information section (non-scrollable pop up activated) */}
                    <div className="bg-gradient-to-br from-[#1E1B2E] to-[#120F1F] p-6 rounded-[2.5rem] shadow-2xl space-y-4 text-left">
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="text-left">
                          <h3 className="text-sm font-black text-white uppercase tracking-tighter italic">Personal Information</h3>
                          <p className="text-[7.5px] font-bold text-white/30 uppercase mt-0.5">Academic registration data</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#58CC02]" />
                          <span className="text-[7px] font-black text-white/50 uppercase tracking-widest">PROTECTED</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-left">
                        {[
                          { label: 'Full Personal Name', value: currentUserData?.fullName },
                          { label: 'Public Display Name', value: currentUserData?.displayName },
                          { label: 'Current Handle', value: currentUserData?.username ? `@${currentUserData.username}` : '' },
                          { label: 'ID / Matric Number', value: currentUserData?.matricNumber || currentUserData?.matric },
                          { label: 'Account Created On', value: currentUserData?.dob },
                          { label: 'University', value: currentUserData?.university },
                          { label: 'Current Level', value: currentUserData?.level },
                          { label: 'Faculty', value: currentUserData?.faculty },
                          { label: 'Department', value: currentUserData?.department },
                        ].map((field, fIdx) => (
                          <div key={fIdx} className="bg-white/[0.02] p-4.5 rounded-[1.25rem] border border-white/5 space-y-1">
                            <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">{field.label}</span>
                            <p className="text-[11px] font-black text-white/85 uppercase truncate leading-none mt-1">
                              {field.value || 'NOT SPECIFIED'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* PWA Mobile Application Install Card */}
                    <div className="bg-gradient-to-br from-[#1E1B2E] to-[#120F1F] p-6 rounded-[2.5rem] shadow-2xl space-y-5 text-left border border-white/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#DC2626]/10 to-transparent rounded-full translate-x-12 -translate-y-12 pointer-events-none" />
                      
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="text-left">
                          <h3 className="text-sm font-black text-white uppercase tracking-tighter italic flex items-center gap-2">
                            <span>📲 Install NSG Mobile Application</span>
                          </h3>
                          <p className="text-[7.5px] font-bold text-white/30 uppercase mt-0.5">Setup lightning-fast mobile access</p>
                        </div>
                        <span className="text-[7px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest animate-pulse">
                          PWA Support OK
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-3.5">
                          <p className="text-[10px] text-white/70 leading-relaxed font-medium">
                            No App Store or Play Store hassle! You can download and install <span className="text-white font-black">NSG (NUELL STUDY GUIDE)</span> as a native mobile application directly through your web browser. 
                          </p>
                          <p className="text-[9.5px] text-white/50 leading-relaxed font-sans">
                            It runs in full-screen standalone mode with responsive layout, features custom home-screen icons, keeps your lecture voice notes, quizzes, and dashboard instantly accessible.
                          </p>
                          
                          {deferredPrompt ? (
                            <button
                              type="button"
                              onClick={handleInstallClick}
                              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg hover:shadow-green-500/20 active:scale-95 transition-all text-center flex items-center justify-center gap-2 mt-4"
                            >
                              📥 Download & Install Now
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setUserNotification("Tap your browser menu option (e.g. Share or ⋮) and choose 'Add to Home Screen'!");
                              }}
                              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-[#DC2626] to-rose-500 hover:from-red-500 hover:to-rose-450 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all text-center flex items-center justify-center gap-2 mt-4"
                            >
                              📲 Install from Browser
                            </button>
                          )}
                        </div>

                        <div className="space-y-4 bg-white/[0.01] p-5 rounded-3xl border border-white/5">
                          <p className="text-[9px] font-black text-white uppercase tracking-wider">How to Install on your Device:</p>
                          
                          <div className="space-y-3 font-sans">
                            {/* Option iOS */}
                            <div className="flex gap-3">
                              <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] shrink-0">🍏</div>
                              <div className="text-left">
                                <p className="text-[9.5px] font-black text-white uppercase leading-none">Apple iOS (Safari)</p>
                                <p className="text-[8.5px] text-white/50 mt-1 leading-normal font-sans">
                                  Tap the <span className="text-white font-semibold">Share button (📤)</span> at the bottom of Safari, scroll down, and select <span className="text-white font-bold">"Add to Home Screen" (➕)</span>.
                                </p>
                              </div>
                            </div>

                            {/* Option Android */}
                            <div className="flex gap-3">
                              <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] shrink-0">🤖</div>
                              <div className="text-left">
                                <p className="text-[9.5px] font-black text-white uppercase leading-none">Android OS (Chrome / Firefox)</p>
                                <p className="text-[8.5px] text-white/50 mt-1 leading-normal font-sans">
                                  Tap the <span className="text-white font-semibold">Menu button (⋮)</span> near the URL bar, and select <span className="text-white font-bold">"Add to Home Screen"</span> or <span className="text-white font-bold">"Install app"</span>.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 space-y-4 pb-20">
                      <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                            <LogOut size={20} className="text-white/20" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] italic">System Access</p>
                            <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest">Instance ID: {user?.uid?.slice(0, 8)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <button onClick={handleLogout} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white/30 hover:text-white rounded-xl text-[9px] font-black uppercase border border-white/10 transition-all flex items-center gap-2">
                            <LogOut size={14} /> SIGN OUT
                          </button>
                          <button 
                            onClick={() => { setIsDeleteAccountOpen(true); setDeleteConfirmInput(""); }}
                            className="px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-[9px] font-black uppercase border border-red-500/10 transition-all"
                          >
                            DELETE ACCOUNT
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
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
                    {/* Dynamic Padlock Button visible at all times */}
                    <button
                      onClick={() => {
                        setIsQuestionsLocked(!isQuestionsLocked);
                        setUserNotification(isQuestionsLocked ? "🔓 Exam questions unlocked for editing." : "🔒 Exam questions locked to prevent accidental changes.");
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all shadow-sm ${
                        isQuestionsLocked 
                          ? 'bg-amber-500/15 border border-amber-500/40 text-amber-500' 
                          : 'bg-green-500/15 border border-green-500/40 text-green-500'
                      }`}
                      title={isQuestionsLocked ? "Unlock configuration" : "Lock configuration"}
                    >
                      {isQuestionsLocked ? (
                        <>
                          <Lock size={14} className="animate-pulse" />
                          <span>LOCKED</span>
                        </>
                      ) : (
                        <>
                          <Unlock size={14} />
                          <span>UNLOCKED</span>
                        </>
                      )}
                    </button>

                    <button 
                      onClick={saveHostedExam} 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase shadow-md transition-colors"
                    >
                      Save Progress
                    </button>

                    <button 
                      onClick={() => { setAdminMode(false); setShowManualQuestionEntryPage(false); }} 
                      className={`p-2.5 rounded-xl transition-all ${theme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-500'} hover:bg-red-500/10 hover:text-red-500`}
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                </div>

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
                      {isPremium || currentUserData?.role === 'admin' || currentUserData?.bypassHostingPayment ? "START EXAM HOSTING" : "PAY \u{20A6}200 TO START"}
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
                              <div className="flex flex-wrap gap-2 pt-2">
                                {((examConfig.subjects && examConfig.subjects.length > 0) ? examConfig.subjects : [{ name: "Mathematics", questionsToAnswer: 15 }]).map((subjSub) => (
                                  <div key={subjSub.name} className={`px-3 py-2 rounded-xl text-[10px] font-black border flex items-center gap-2.5 uppercase ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                                    <span>{subjSub.name} ({subjSub.questionsToAnswer || 15} Qs)</span>
                                    {/* Don't delete Mathematics if it's the only one left */}
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
                                ))}
                              </div>
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
                                        <p className="text-[8px] font-black text-[#DC2626] uppercase">Subject Active Qs: {activeSubQuestions.length}</p>
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
                                        <textarea
                                          placeholder="Paste raw textbook text here, formulas or syllabus contents..."
                                          id="omni-raw-notes-area"
                                          className={`w-full h-24 border rounded-2xl p-3 text-[10px] outline-none focus:border-[#DC2626]/50 transition-all ${
                                            theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                                          }`}
                                        />
                                      </div>

                                      {/* Batch size to be generated (capped at 50 per generation) */}
                                      <div className="grid grid-cols-2 gap-3 items-center">
                                        <div>
                                          <p className={`text-[7.5px] font-black uppercase ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Questions Quantity</p>
                                          <input
                                            type="number"
                                            defaultValue={5}
                                            id="omni-quantity-count"
                                            className={`w-full border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#DC2626]/50 ${
                                              theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                                            }`}
                                          />
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
                                                // Call our robust subject-aware AI generation
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
                                            {isGeneratingAdminQuestions ? "GENERATING..." : "Generate questions with AI"}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Subject Sitting Count limit Config */}
                                  <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#181524] border-white/10' : 'bg-white border-slate-200'} space-y-4 shadow-sm`}>
                                    <p className="text-xs font-black uppercase text-red-500">Sitting Count Profile</p>
                                    
                                    <div className="space-y-2">
                                      <p className={`text-[8.5px] font-sans ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} leading-snug`}>
                                        Declare exactly how many questions participants will answer under {activeSub.name} subject tab during examinations.
                                      </p>
                                      <input 
                                        type="number"
                                        value={activeSub.questionsToSit !== undefined ? activeSub.questionsToSit : (activeSub.questionsToAnswer || 15)}
                                        onChange={(e) => {
                                          validateAndSetLimit(e.target.value, 1, 500, (v) => {
                                            const updated = (examConfig.subjects || []).map(s => 
                                              s.name.toLowerCase() === activeSub.name.toLowerCase() ? { ...s, questionsToSit: v } : s
                                            );
                                            setExamConfig({ ...examConfig, subjects: updated });
                                          }, "Sitting amount");
                                        }}
                                        className={`w-full border rounded-xl px-4 py-3 text-xs outline-none focus:border-[#DC2626]/50 transition-all ${
                                          theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                                        }`} 
                                      />
                                      <p className="text-[8px] italic text-[#DC2626] font-medium leading-none mt-2 text-left bg-red-500/5 p-2 rounded-lg border border-red-500/10">
                                        (how many questions should participants sit for)
                                      </p>
                                    </div>
                                  </div>

                                </div>

                                {/* Form B: List of active questions & Manual Editor cards */}
                                <div className="lg:col-span-2 space-y-4">
                                  
                                  <div className="flex items-center justify-between border-b pb-2">
                                    <h3 className={`font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-xs uppercase tracking-tight`}>
                                      📖 Add questions manually for {activeSub.name}
                                    </h3>
                                    
                                    <button
                                      disabled={isQuestionsLocked}
                                      onClick={() => {
                                        // add new empty manual slot
                                        const newQId = `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                                        const blankQ: ExamQuestion = {
                                          id: newQId,
                                          question: "Enter question query here...",
                                          options: ["", "", "", ""],
                                          correctAnswer: 0,
                                          explanation: "",
                                          subject: activeSub.name
                                        };
                                        
                                        // sync pool count in config
                                        const updatedSubjects = (examConfig.subjects || []).map(s => {
                                          if (s.name.trim().toLowerCase() === activeSub.name.trim().toLowerCase()) {
                                            return { ...s, questionsToAnswer: (s.questionsToAnswer || 15) + 1 };
                                          }
                                          return s;
                                        });
                                        
                                        setExamConfig(prev => ({ ...prev, subjects: updatedSubjects }));
                                        setExamQuestions(prev => [...prev, blankQ]);
                                        setUserNotification("➕ Added 1 more question slot.");
                                      }}
                                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-30 ${
                                        theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700'
                                      }`}
                                    >
                                      <span>Add more questions</span>
                                    </button>
                                  </div>

                                  <div className="space-y-4 max-h-[800px] overflow-y-auto pr-1">
                                    {activeSubQuestions.length === 0 ? (
                                      <div className={`py-24 text-center rounded-3xl border border-dashed ${
                                        theme === 'dark' ? 'bg-white/[0.01] border-white/10 text-white/20' : 'bg-slate-50 border-slate-250 text-slate-400'
                                      }`}>
                                        <FileText size={40} className="mx-auto mb-2 opacity-60" />
                                        <p className="text-[10px] font-bold">Your question slot bank is empty for {activeSub.name}</p>
                                        <p className="text-[9px] opacity-70 mt-1">Use Generate with Omni above or Click Add more questions to start typing</p>
                                      </div>
                                    ) : (
                                      activeSubQuestions.map((thisQ, relativeIndex) => {
                                        
                                        // Student mode locked view to prevent accidental edits while scrolling
                                        if (isQuestionsLocked) {
                                          return (
                                            <div 
                                              key={thisQ.id} 
                                              className={`p-5 sm:p-6 rounded-3xl border text-left space-y-4 ${
                                                theme === 'dark' ? 'bg-[#181524] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
                                              }`}
                                            >
                                              <div className="flex justify-between items-start border-b border-white/5 pb-2.5">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-[#DC2626]">
                                                  Question {relativeIndex + 1} (Lock Mode Active)
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
                                                  <p className="font-black text-amber-500 uppercase tracking-widest text-[8px] mb-1">Because:</p>
                                                  <MarkdownRenderer content={thisQ.explanation} />
                                                </div>
                                              )}
                                            </div>
                                          );
                                        }

                                        // Normal Editable form slots
                                        return (
                                          <div 
                                            key={thisQ.id} 
                                            className={`p-5 sm:p-6 rounded-3xl border text-left space-y-4 transition-all relative ${
                                              theme === 'dark' ? 'bg-[#181524] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                                            }`}
                                          >
                                            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-white/5 pb-2">
                                              <span className="text-[10px] font-black text-[#DC2626] uppercase">
                                                Question slot {relativeIndex + 1}
                                              </span>
                                              <button
                                                onClick={() => {
                                                  // delete this slot
                                                  setExamQuestions(prev => prev.filter(itemQ => itemQ.id !== thisQ.id));
                                                  const updatedSubjects = (examConfig.subjects || []).map(s => {
                                                    if (s.name.trim().toLowerCase() === (thisQ.subject || "Mathematics").trim().toLowerCase()) {
                                                      const currentCount = s.questionsToAnswer || 15;
                                                      return { ...s, questionsToAnswer: Math.max(1, currentCount - 1) };
                                                    }
                                                    return s;
                                                  });
                                                  setExamConfig(prev => ({ ...prev, subjects: updatedSubjects }));
                                                  setUserNotification("🗑️ Question slot removed.");
                                                }}
                                                className="text-red-400 hover:text-red-500 p-1 rounded transition-colors"
                                              >
                                                <Trash2 size={13} />
                                              </button>
                                            </div>

                                            {/* Question Prompt textarea */}
                                            <div className="space-y-1">
                                              <p className={`text-[7px] font-black uppercase ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>Edit Question Inquiry text</p>
                                              <textarea
                                                value={thisQ.question}
                                                placeholder="Enter question query here..."
                                                onFocus={(e) => {
                                                  if (e.target.value.trim().toLowerCase() === "enter question query here...") {
                                                    const copy = [...examQuestions];
                                                    const targetItem = copy.find(x => x.id === thisQ.id);
                                                    if (targetItem) {
                                                      targetItem.question = "";
                                                      setExamQuestions(copy);
                                                    }
                                                  }
                                                }}
                                                onChange={(e) => {
                                                  const copy = [...examQuestions];
                                                  const targetItem = copy.find(x => x.id === thisQ.id);
                                                  if (targetItem) {
                                                    targetItem.question = e.target.value;
                                                    setExamQuestions(copy);
                                                  }
                                                }}
                                                className={`w-full h-16 border rounded-xl p-3 text-[10px] outline-none ${
                                                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                                                }`}
                                              />
                                            </div>

                                            {/* Options Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                              {thisQ.options.map((curOpt, optionIndex) => (
                                                <div key={optionIndex} className="space-y-1">
                                                  <div className="flex items-center justify-between pr-1">
                                                    <span className={`text-[7px] font-black uppercase ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>
                                                      Option {String.fromCharCode(65 + optionIndex)}
                                                    </span>
                                                    <button
                                                      onClick={() => {
                                                        const copy = [...examQuestions];
                                                        const targetItem = copy.find(x => x.id === thisQ.id);
                                                        if (targetItem) {
                                                          targetItem.correctAnswer = optionIndex;
                                                          setExamQuestions(copy);
                                                        }
                                                      }}
                                                      className={`px-2 py-0.5 rounded text-[7px] font-black transition-all ${
                                                        thisQ.correctAnswer === optionIndex 
                                                          ? 'bg-green-500 text-white shadow-sm' 
                                                          : 'bg-white/5 text-white/30 hover:bg-white/10'
                                                      }`}
                                                    >
                                                      CORRECT
                                                    </button>
                                                  </div>
                                                  <input
                                                    type="text"
                                                    value={curOpt}
                                                    placeholder={`Option ${String.fromCharCode(65 + optionIndex)} text`}
                                                    onFocus={(e) => {
                                                      const defaultText = `option ${String.fromCharCode(65 + optionIndex).toLowerCase()} text`;
                                                      const valStr = e.target.value.trim().toLowerCase();
                                                      if (valStr === defaultText || valStr === "option a text" || valStr === "option b text" || valStr === "option c text" || valStr === "option d text") {
                                                        const copy = [...examQuestions];
                                                        const targetItem = copy.find(x => x.id === thisQ.id);
                                                        if (targetItem) {
                                                          targetItem.options[optionIndex] = "";
                                                          setExamQuestions(copy);
                                                        }
                                                      }
                                                    }}
                                                    onChange={(e) => {
                                                      const copy = [...examQuestions];
                                                      const targetItem = copy.find(x => x.id === thisQ.id);
                                                      if (targetItem) {
                                                        targetItem.options[optionIndex] = e.target.value;
                                                        setExamQuestions(copy);
                                                      }
                                                    }}
                                                    className={`w-full border rounded-xl px-3 py-2 text-[10px] outline-none ${
                                                      theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                                                    }`}
                                                  />
                                                </div>
                                              ))}
                                            </div>

                                            {/* Explanation */}
                                            <div className="space-y-1">
                                              <p className={`text-[7px] font-black uppercase ${theme === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>Because</p>
                                              <input
                                                type="text"
                                                value={thisQ.explanation || ""}
                                                onChange={(e) => {
                                                  const copy = [...examQuestions];
                                                  const targetItem = copy.find(x => x.id === thisQ.id);
                                                  if (targetItem) {
                                                    targetItem.explanation = e.target.value;
                                                    setExamQuestions(copy);
                                                  }
                                                }}
                                                placeholder="Provide textbook logic reference explanation..."
                                                className={`w-full border rounded-xl px-3.5 py-2.5 text-[10px] outline-none ${
                                                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                                                }`}
                                              />
                                            </div>

                                          </div>
                                        );
                                      })
                                    )}
                                  </div>

                                </div>

                              </div>

                            </div>
                          );
                        })()}

                      </div>
                    )}

                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* FOOTER */}
        <footer className={`w-full px-4 py-8 pb-8 flex flex-wrap justify-center gap-6 text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/20' : 'text-slate-400'}`}>
          {user?.email === "nuellkelechi@gmail.com" && (
            <button onClick={() => setShowGodMode(true)} className="text-[#DC2626] hover:text-[#DC2626]/80 transition-colors flex items-center gap-1">
              <ShieldCheck size={12} /> GOD MODE
            </button>
          )}
        </footer>
      </main>

      {/* EDIT PROFILE DIALOG MODAL */}
      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 z-[490] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingProfile(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className={`relative w-full max-w-2xl bg-gradient-to-br from-[#1c182e] via-[#100c1e] to-[#07050d] border border-white/10 rounded-[2.5rem] p-8 shadow-3xl flex flex-col max-h-[90vh] overflow-hidden`}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
                <div className="text-left">
                  <h3 className="text-md font-black uppercase tracking-tighter italic text-white flex items-center gap-1.5">
                    <span className="text-red-500">⚙️</span> Edit Profile
                  </h3>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/30">Configure your public profile handle and account preferences</p>
                </div>
                <button 
                  onClick={() => setIsEditingProfile(false)}
                  className="p-2 rounded-xl transition-all hover:bg-white/5 text-white/40 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body / Scrollable Form */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-1 text-left custom-scrollbar">
                
                {/* 1. Avatar with hovering action FAB */}
                <div className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 rounded-3xl border border-white/5 relative overflow-hidden">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-400 via-[#DC2626] to-[#9933FF] p-1 shadow-2xl">
                      <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950 relative">
                        {currentUserData?.photoURL ? (
                          <img src={currentUserData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/10 bg-zinc-900">
                            <User size={36} />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Floating Action Button (Camera capture or file selection) */}
                    <label className="absolute bottom-0 right-0 p-2 bg-[#DC2626] border-b-[3px] border-[#991B1B] text-white rounded-xl cursor-pointer shadow-xl active:translate-y-0.5 hover:bg-red-500 transition-all z-10">
                      <Camera size={12} />
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        handleProfileImageUpload(e);
                        setUserNotification("Uploading selected avatar...");
                      }} />
                    </label>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-100">{currentUserData?.fullName || 'Full Official Name'}</p>
                    <p className="text-[7.5px] font-bold uppercase tracking-wider text-white/30">ID: {currentUserData?.uid?.substring(0, 12)}...</p>
                  </div>
                </div>

                {/* 2. Display Edit Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Full Personal Name', key: 'fullName', type: 'text' },
                    { label: 'Public Display Name', key: 'displayName', type: 'text' },
                    { label: 'Current Handle (Lowercase, 3+ Chars)', key: 'username', type: 'text' },
                    { label: 'ID / Matric Number', key: 'matricNumber', type: 'text' },
                    { label: 'Account Created On', key: 'dob', type: 'date' },
                    { label: 'University', key: 'university', type: 'select', options: UNIVERSITIES },
                    { label: 'Current Level', key: 'level', type: 'text' },
                    { label: 'Faculty', key: 'faculty', type: 'select', options: FACULTIES },
                    { label: 'Department', key: 'department', type: 'select', options: profileFormData.faculty ? DEPARTMENTS[profileFormData.faculty] : [] },
                  ].map((field) => (
                    <div key={field.key} className="space-y-1">
                      <label className="text-[7.5px] font-black uppercase tracking-widest ml-1 text-white/30">{field.label}</label>
                      {field.type === 'select' ? (
                         <select
                           value={profileFormData[field.key as keyof typeof profileFormData]}
                           onChange={(e) => setProfileFormData({ ...profileFormData, [field.key]: e.target.value })}
                           className="w-full bg-[#0A0713]/80 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none transition-all appearance-none text-white focus:ring-2 focus:ring-[#DC2626]/50"
                         >
                           <option value="" disabled className="bg-zinc-900">Select {field.label}</option>
                           {(field.options || []).map(opt => <option key={opt} value={opt} className="bg-zinc-900">{opt}</option>)}
                         </select>
                      ) : (
                        <input 
                          type={field.type} 
                          value={profileFormData[field.key as keyof typeof profileFormData]} 
                          onChange={(e) => setProfileFormData({ ...profileFormData, [field.key]: e.target.value })}
                          className="w-full bg-[#0A0713]/80 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none transition-all text-white focus:ring-2 focus:ring-[#DC2626]/50" 
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* 3. Bio / Status Quote textarea input */}
                <div className="space-y-1 text-left">
                  <label className="text-[7.5px] font-black uppercase tracking-widest ml-1 text-white/30">Bio / Institutional Status Quote</label>
                  <textarea 
                    value={profileFormData.about} 
                    onChange={(e) => setProfileFormData({ ...profileFormData, about: e.target.value })}
                    placeholder="Write a brief professional bio, status quote, or academic focus description..." 
                    rows={3}
                    className="w-full bg-[#0A0713]/80 border border-white/10 rounded-2xl px-4 py-3 text-xs outline-none transition-all text-white focus:ring-2 focus:ring-[#DC2626]/50 resize-none"
                  />
                </div>

                {/* 4. Global Account Control Buttons */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-[8.5px] font-black uppercase tracking-widest text-white/40 mb-1">Account & Security Settings</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <button 
                      type="button"
                      onClick={async () => {
                        if (!user?.email) return;
                        try {
                          const { sendPasswordResetEmail } = await import('firebase/auth');
                          await sendPasswordResetEmail(auth, user.email);
                          setUserNotification("Security verification dispatched! Please review your Email inbox.");
                        } catch (err: any) {
                          setUserNotification(`Failed to send password reset: ${err.message || err}`);
                        }
                      }}
                      className="px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[8.5px] font-black uppercase tracking-wider text-white transition-all text-center"
                    >
                      🔒 Change Password
                    </button>

                    <button 
                      type="button"
                      onClick={() => {
                        setUserNotification("Dual-factor confirmation simulation initiated. Setup key dispatched dynamically.");
                      }}
                      className="px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[8.5px] font-black uppercase tracking-wider text-white transition-all text-center"
                    >
                      🔑 Setup Two-Factor
                    </button>

                    <button 
                      type="button"
                      onClick={async () => {
                        try {
                          const currentRead = currentUserData?.readReceipts !== false;
                          await updateDoc(doc(db, 'users', user!.uid), {
                            readReceipts: !currentRead
                          });
                          setUserNotification(`Read Receipts toggled successfully! Current setting: ${!currentRead ? 'Enabled' : 'Disabled'}`);
                        } catch (err: any) {
                          setUserNotification(`Failed toggle receipts: ${err.message}`);
                        }
                      }}
                      className="px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[8.5px] font-black uppercase tracking-wider text-white transition-all text-center"
                    >
                      👁️ Read Receipts: {currentUserData?.readReceipts !== false ? '✅' : '❌'}
                    </button>

                    <button 
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false);
                        setIsDeleteAccountOpen(true);
                      }}
                      className="px-3 py-3 rounded-xl bg-red-950/25 hover:bg-red-900/35 border border-red-500/25 text-[8.5px] font-black uppercase tracking-wider text-red-100 transition-all text-center animate-pulse"
                    >
                      🗑️ Delete Profile
                    </button>

                    <button 
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false);
                        handleLogout();
                      }}
                      className="px-3 py-3 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-[8.5px] font-black uppercase tracking-wider text-red-300 transition-all text-center col-span-2 md:col-span-2"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer actions */}
              <div className="flex gap-4 pt-4 border-t border-white/5 mt-4">
                <button 
                  onClick={() => setIsEditingProfile(false)} 
                  className="flex-1 py-3.5 px-6 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all bg-white/5 text-white/40 hover:bg-white/10 border-b-[5px] border-white/5 active:translate-y-[2px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile} 
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-[#58CC02] border-b-[5px] border-[#389101] text-white font-black text-[9px] uppercase tracking-widest hover:bg-[#61E002] active:border-b-0 active:translate-y-[5px] transition-all"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 z-[200] ${theme === 'dark' ? 'bg-[#13111C]' : 'bg-white'} flex flex-col md:flex-row overflow-hidden`}>
            {/* Navigation (Sidebar on Desktop, Top-scroll on Mobile) */}
            <div className={`w-full md:w-72 border-b md:border-b-0 md:border-r ${theme === 'dark' ? 'border-white/10 bg-[#0F172A]' : 'border-zinc-200 bg-zinc-50'} flex flex-col shadow-2xl z-10`}>
              <div className="p-4 md:p-8 border-b border-[#DC2626]/20 bg-gradient-to-br from-[#DC2626]/5 to-transparent flex items-center justify-between md:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-[#DC2626] rounded-xl flex items-center justify-center shadow-lg shadow-red-900/40 shrink-0">
                    <ShieldCheck size={24} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg md:text-xl font-black text-[#DC2626] uppercase tracking-tighter italic leading-tight">God Mode</h1>
                    <p className="text-[8px] font-bold uppercase tracking-[0.3em] opacity-40">Administrative Control</p>
                  </div>
                </div>
                <button onClick={() => setShowGodMode(false)} className="md:hidden p-2 text-white/40 hover:text-[#DC2626]">
                  <XCircle size={24} />
                </button>
              </div>

              <nav className="flex-1 p-2 md:p-4 md:space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar">
                {[
                  { id: 'dashboard', label: 'Summary', icon: LayoutDashboard },
                  { id: 'users', label: 'Users Monitor', icon: User },
                  { id: 'groups', label: 'Groups', icon: Users },
                  { id: 'reports', label: 'Safety', icon: AlertTriangle },
                  { id: 'marketing', label: 'Broadcasting', icon: Mail },
                  { id: 'blog', label: 'Feed', icon: BookOpen },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setGodTab(item.id as any)}
                    className={`flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 md:shrink ${
                      godTab === item.id 
                       ? 'bg-[#DC2626] text-white shadow-lg shadow-red-900/30' 
                       : theme === 'dark' ? 'text-white/40 hover:bg-white/5 hover:text-white' : 'text-zinc-500 hover:bg-zinc-100'
                    }`}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="hidden md:block p-8 border-t border-white/5">
                <button 
                  onClick={() => setShowGodMode(false)}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 hover:bg-[#DC2626] text-white/40 hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border border-white/5 shadow-inner"
                >
                  <LogOut size={18} /> Safety Exit
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <div className={`px-6 md:px-12 py-6 flex items-center justify-between border-b ${theme === 'dark' ? 'border-white/5' : 'border-zinc-100'}`}>
                <div>
                  <h2 className={`text-xl md:text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-zinc-900'} uppercase tracking-tighter italic`}>
                    {godTab === 'dashboard' && 'Summary Monitor'}
                    {godTab === 'users' && 'Users Monitor'}
                    {godTab === 'marketing' && 'Broadcast Hub'}
                    {godTab === 'blog' && 'Neural Feed'}
                    {godTab === 'reports' && 'Security Protocol'}
                  </h2>
                </div>
                
                <div className="hidden sm:flex items-center gap-4">
                  <AnimatePresence>
                    {godModeNotification && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-[#DC2626] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#DC2626]/20">
                        {godModeNotification}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                     <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Live</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-32">
                  
                  {godTab === 'dashboard' && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                      {[
                        { label: 'Total Users', value: allUsers.length, icon: User, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                        { label: 'Groups', value: allGroups.length, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                        { label: 'Safety Reports', value: allReports.length, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
                        { label: 'Feed Content', value: blogPosts.length, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'Global Status', value: 'ONLINE', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' }
                      ].map((stat, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-xl">
                           <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3 md:mb-6`}>
                              <stat.icon size={16} className={stat.color} />
                           </div>
                           <p className="text-[7px] md:text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                           <p className="text-xl md:text-3xl font-black text-white tracking-tighter italic">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {godTab === 'blog' && (
                    <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-8">
                      <div className="flex items-center justify-between border-b border-white/5 pb-8">
                        <div>
                          <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3 italic">
                            <BookOpen size={28} className="text-[#DC2626]" /> Matrix Archives
                          </h3>
                          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Manage global publications</p>
                        </div>
                        <button 
                          onClick={() => setIsAddingPost(true)}
                          className="bg-[#DC2626] text-white px-10 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.1em] hover:bg-red-700 transition-all flex items-center gap-2 shadow-2xl shadow-red-900/40"
                        >
                          <Plus size={18} /> Add Entry
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {blogPosts.map(post => (
                          <div key={post.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                            <div className="truncate pr-4 flex-1">
                              <p className="font-black text-white text-sm truncate uppercase tracking-tight mb-2 italic">{post.title}</p>
                              <div className="flex items-center gap-4">
                                <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em]">{post.timestamp?.toDate ? post.timestamp.toDate().toLocaleDateString() : 'Draft'}</p>
                                <div className="flex gap-2">
                                  {Object.entries(post.reactions || {}).map(([emoji, count]) => (
                                    <span key={emoji} className="text-[9px] bg-[#DC2626]/10 text-[#DC2626] px-2 py-0.5 rounded-lg border border-[#DC2626]/10 font-bold">{emoji} {count as any}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setEditingPost(post); setIsEditingPost(true); }} className="p-3 bg-white/5 rounded-xl text-white/30 hover:text-white transition-all"><Edit3 size={18} /></button>
                              <button onClick={() => deletePost(post.id)} className="p-3 bg-white/5 rounded-xl text-white/30 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {godTab === 'groups' && (
                    <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-8">
                      <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3 italic">
                          <Users size={28} className="text-[#DC2626]" /> Collective Clusters
                        </h3>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Manage all distributed groups</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allGroups.map(group => (
                          <div key={group.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] flex items-center justify-between">
                            <div className="flex items-center gap-4 truncate">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DC2626] to-red-900 flex items-center justify-center text-white font-black text-lg">
                                {group.photoURL ? <img src={group.photoURL} className="w-full h-full object-cover rounded-2xl" /> : group.name.charAt(0)}
                              </div>
                              <div className="truncate">
                                <p className="font-black text-white text-sm uppercase tracking-tight italic truncate">{group.name}</p>
                                <p className="text-[8px] text-white/30 uppercase tracking-widest">{group.members?.length || 0} Summaries Connected</p>
                              </div>
                            </div>
                            <button 
                              onClick={async () => {
                                if (confirm('Erase this cluster?')) {
                                  await deleteDoc(doc(db, 'chats', group.id));
                                  setGodModeNotification("Group cluster vaporized.");
                                }
                              }}
                              className="p-3 bg-white/5 rounded-xl text-white/20 hover:text-red-500 transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {godTab === 'reports' && (
                    <div className="bg-white/5 border border-white/10 p-4 md:p-8 rounded-[2.5rem] space-y-6 md:space-y-8">
                       <div>
                          <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3 italic">
                            <AlertTriangle size={24} className="text-[#DC2626]" /> Breach Protocol
                          </h3>
                          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">Review critical security violations</p>
                          <p className="text-[9px] text-white/40 mt-2 leading-relaxed">
                            These reports help you identify and manage security violations, suspect behavior, and toxic interactions within the community. Action these immediately to maintain platform integrity.
                          </p>
                       </div>

                       <div className="space-y-8">
                        {allReports.length === 0 && (
                          <div className="text-center py-32 bg-white/[0.02] rounded-[3rem] border border-white/5">
                             <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck size={40} className="text-green-500" />
                             </div>
                             <p className="text-xl font-black text-white/20 uppercase tracking-tighter">Safe Passage Confirmed</p>
                             <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest mt-2">No active breaches in sector</p>
                          </div>
                        )}
                        {allReports.map(report => (
                          <div key={report.id} className="bg-white/[0.02] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                             <div className="p-8 bg-red-600/5 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-red-500/20 rounded-[1.25rem] flex items-center justify-center text-red-500"><AlertTriangle size={24} /></div>
                                   <div>
                                      <p className="text-sm font-black text-white uppercase tracking-tight">Summary Suspect: <span className="text-red-500">@{report.suspectHandle}</span></p>
                                      <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mt-0.5">Reporter Auth: {report.reporterEmail}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className="text-[10px] font-black text-white uppercase tracking-tighter italic">Status: Priority Zero</p>
                                   <p className="text-[8px] font-mono text-white/10 mt-1 uppercase">{report.timestamp?.toDate ? report.timestamp.toDate().toLocaleString() : 'Recent'}</p>
                                </div>
                             </div>
                             <div className="p-8 space-y-6">
                                <div className="bg-[#13111C] rounded-[2rem] p-8 border border-white/5 relative overflow-hidden shadow-inner">
                                   <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                                      <Database size={100} />
                                   </div>
                                   <p className="text-[9px] font-black text-white/20 uppercase tracking-widest border-b border-white/5 pb-4 mb-6 italic">Evidence Matrix Extraction</p>
                                   <div className="space-y-4">
                                     {report.messages.map((msg: any, idx: number) => (
                                       <div key={idx} className="flex gap-6 items-start">
                                          <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shrink-0 mt-1 ${msg.senderId === report.suspectId ? 'bg-red-500/20 text-red-500 border border-red-500/20' : 'bg-white/5 text-white/40 border border-white/5'}`}>
                                            {msg.senderId === report.suspectId ? 'SUSPECT' : 'REPORTER'}
                                          </div>
                                          <p className="text-sm text-white/90 font-medium leading-relaxed">{msg.text}</p>
                                       </div>
                                     ))}
                                   </div>
                                </div>
                                <div className="flex items-center justify-end gap-4 pt-4">
                                   <button onClick={() => handleReportAction(report.id, 'dismiss')} className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all">Dismiss</button>
                                   <button onClick={() => handleReportAction(report.id, 'warn')} className="px-10 py-5 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-black rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all">Warn Protocol</button>
                                   <button onClick={() => handleReportAction(report.id, 'ban')} className="px-12 py-5 bg-[#DC2626] text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-red-900/40 hover:scale-105 active:scale-95 transition-all">Deactivate Summary</button>
                                </div>
                             </div>
                          </div>
                        ))}
                       </div>
                    </div>
                  )}

                  {godTab === 'users' && (
                    <div className="bg-white/5 border border-white/10 p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] space-y-6 md:space-y-10 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 md:p-10 opacity-[0.02] pointer-events-none">
                        <Users className="w-[150px] h-[150px] md:w-[200px] md:h-[200px]" />
                      </div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-6 md:pb-8">
                        <div>
                          <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3 italic">
                             <Database className="w-6 h-6 md:w-8 md:h-8 text-[#DC2626]" /> Population Terminal
                          </h3>
                        </div>
                      </div>

                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left font-sans">
                          <thead>
                            <tr className="uppercase tracking-[0.2em] border-b border-white/5 text-white/20 font-black italic">
                              <th className="py-4 px-4">User Identity</th>
                              <th className="py-4 px-4">Academic Data</th>
                              <th className="py-4 px-4">Privileges</th>
                              <th className="py-4 px-4 text-right">Direct Control</th>
                            </tr>
                          </thead>
                          <tbody className="text-white/70">
                            {allUsers.map(u => {
                               const lastSeenTime = u.lastSeen?.toDate ? u.lastSeen.toDate() : (u.lastSeen ? new Date(u.lastSeen) : null);
                               const isOnline = lastSeenTime && (Date.now() - lastSeenTime.getTime() < 180000); // 3 minutes

                               return (
                               <tr key={u.id} className={`border-b transition-all border-white/5 hover:bg-white/[0.02] ${u.status === 'deleted' ? 'opacity-30' : ''}`}>
                                 <td className="py-4 px-4">
                                   <div className="flex items-center gap-3">
                                     <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center font-black text-[#DC2626] shadow-inner text-sm relative">
                                       {u.photoURL ? <img src={u.photoURL} className="w-full h-full rounded-xl object-cover" /> : (u.displayName?.charAt(0) || u.email?.charAt(0) || '?')}
                                       {isOnline && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#13111C] shadow-[0_0_8px_#22c55e]" title="Online" />}
                                     </div>
                                     <div className="min-w-0">
                                       <p className="font-black text-white uppercase tracking-tight leading-none mb-1 text-[11px] italic truncate">{u.fullName || u.displayName || 'Anonymous'}</p>
                                       <p className="text-[7px] font-mono opacity-30 uppercase tracking-[0.1em] truncate">{u.email}</p>
                                       {isOnline && <p className="text-[6px] font-black text-green-500 uppercase tracking-widest mt-0.5">ONLINE</p>}
                                     </div>
                                   </div>
                                 </td>
                                 <td className="py-4 px-4 space-y-1">
                                    <div className="space-y-0.5">
                                      <p className="text-[8px] font-black text-white uppercase tracking-tight">MATRIC: {u.matric || 'N/A'}</p>
                                      <p className="text-[8px] font-bold text-white/40 uppercase truncate max-w-[120px]">SCHOOL: {u.university || 'N/A'}</p>
                                      <p className="text-[8px] font-bold text-white/40 uppercase">LEVEL: {u.level || '?'}</p>
                                      <p className="text-[8px] font-bold text-white/40 uppercase truncate max-w-[120px]">DEPT: {u.department || '?'}</p>
                                    </div>
                                 </td>
                                 <td className="py-4 px-4">
                                    <div className="flex flex-col gap-1.5">
                                       <button 
                                         onClick={() => updateUserPermissions(u.id, 'bypassAllPayments', !u.bypassAllPayments)}
                                         className="flex items-center gap-1.5 group cursor-pointer"
                                       >
                                          <div className={`w-2 h-2 rounded-full transition-all ${u.bypassAllPayments ? 'bg-[#DC2626] shadow-[0_0_8px_rgba(220,38,38,0.5)]' : 'bg-white/10'}`} />
                                          <p className={`text-[7px] font-black uppercase tracking-widest transition-all ${u.bypassAllPayments ? 'text-white' : 'text-white/20 group-hover:text-white/40'}`}>Master Bypass: {u.bypassAllPayments ? 'ON' : 'OFF'}</p>
                                       </button>
                                       <div className="flex items-center gap-1.5">
                                          <div className={`w-2 h-2 rounded-full ${u.isPremium ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'bg-white/10'}`} />
                                          <p className={`text-[7px] font-black uppercase tracking-widest ${u.isPremium ? 'text-yellow-500' : 'text-white/20'}`}>Premium Status: {u.isPremium ? 'ACTIVE' : 'LOCKED'}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="py-4 px-4">
                                    <div className="flex items-center gap-2 justify-end">
                                       <button 
                                         onClick={() => setEditingUser(u)} 
                                         className="w-[21px] h-[20px] bg-white/5 border border-white/5 rounded-md text-white/30 hover:text-white hover:border-white/10 transition-all flex items-center justify-center"
                                         title="EDIT"
                                       >
                                         <Edit3 size={10} />
                                       </button>
                                       <button 
                                         onClick={() => toggleUserStatus(u.id, u.status)} 
                                         className={`px-3 py-1.5 rounded-lg text-[7px] font-black uppercase transition-all shadow-lg ${u.status === 'deleted' ? 'bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-black shadow-green-900/10' : 'bg-[#DC2626]/20 text-[#DC2626] hover:bg-[#DC2626] hover:text-white shadow-red-900/10'}`}
                                       >
                                         {u.status === 'deleted' ? 'RESTORE' : 'TERMINATE'}
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

                  {godTab === 'marketing' && (
                    <div className="bg-white/5 border border-white/10 p-4 md:p-10 rounded-[2rem] md:rounded-[3rem] space-y-6 md:space-y-10 relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 p-6 md:p-10 opacity-[0.02] pointer-events-none">
                         <Mail className="w-[150px] h-[150px] md:w-[250px] md:h-[250px]" />
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 md:pb-10 gap-4">
                        <div>
                          <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3 md:gap-4 italic leading-none">
                             <Mail className="w-6 h-6 md:w-8 md:h-8 text-[#DC2626]" /> Neural Outreach
                          </h3>
                        </div>
                        <div className="flex items-center gap-4">
                          <button onClick={initMarketingTemplates} className="px-10 py-5 bg-white/5 border border-white/10 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all">Clean History</button>
                          <button onClick={() => setTemplateEditForm({ name: '', subject: '', body: '', active: true })} className="bg-[#DC2626] text-white px-12 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.1em] shadow-[0_15px_30px_rgba(220,38,38,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                            <Plus size={20} /> Add Template
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                        <div className="lg:col-span-1 space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-4 pl-2">Stored Procedures</p>
                          {emailTemplates.map(t => (
                            <div key={t.id} className={`p-6 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden ${templateEditForm?.id === t.id ? 'bg-[#DC2626] border-[#DC2626] shadow-2xl' : 'bg-white/2 border-white/5 hover:border-white/20 hover:bg-white/[0.05]'}`} onClick={() => setTemplateEditForm(t)}>
                                {templateEditForm?.id === t.id && (
                                  <div className="absolute top-2 right-4 text-white/20 font-black text-[30px] italic pointer-events-none">#ED</div>
                                )}
                                <div className="flex items-center justify-between mb-2">
                                  <p className={`text-xs font-black uppercase truncate tracking-tight ${templateEditForm?.id === t.id ? 'text-white' : 'text-white/80'}`}>{t.name}</p>
                                </div>
                                <p className={`text-[8px] font-bold uppercase truncate tracking-widest ${templateEditForm?.id === t.id ? 'text-white/60' : 'text-white/20'}`}>{t.subject}</p>
                            </div>
                          ))}
                        </div>

                        <div className="lg:col-span-3 rounded-[3rem] p-10 bg-[#070B14] border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                          {templateEditForm ? (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-4">Template Label</p>
                                  <input value={templateEditForm.name} onChange={e => setTemplateEditForm({...templateEditForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm font-black text-white outline-none focus:border-[#DC2626] transition-all bg-opacity-50" placeholder="Template identifier..." />
                                </div>
                                <div className="space-y-2">
                                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-4">Encrypted Subject</p>
                                  <input value={templateEditForm.subject} onChange={e => setTemplateEditForm({...templateEditForm, subject: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm font-black text-white outline-none focus:border-[#DC2626] transition-all bg-opacity-50" placeholder="Direct mind-link subject..." />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-4">Directive Body (Markdown + Macros Enabled)</p>
                                <textarea value={templateEditForm.body} onChange={e => setTemplateEditForm({...templateEditForm, body: e.target.value})} className="w-full bg-white/[0.01] border border-white/10 rounded-[2.5rem] px-8 py-8 text-xs font-mono text-white/80 outline-none focus:border-[#DC2626] transition-all h-[350px] resize-none leading-relaxed shadow-inner" placeholder="Initiate handshake protocol..." />
                              </div>
                              <div className="flex items-center justify-between pt-8 border-t border-white/5">
                                <div className="flex gap-6">
                                   <label className="flex items-center gap-4 cursor-pointer group">
                                      <input type="checkbox" checked={templateEditForm.active} onChange={e => setTemplateEditForm({...templateEditForm, active: e.target.checked})} className="sr-only peer" />
                                      <div className="w-12 h-6 bg-white/5 border border-white/10 rounded-full peer-checked:bg-[#DC2626] transition-all relative after:absolute after:top-[3px] after:left-[3px] after:bg-white/20 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6 peer-checked:after:bg-white" />
                                      <span className="text-[10px] font-black text-white/20 group-hover:text-white transition-all uppercase tracking-[0.2em]">Live Status</span>
                                   </label>
                                </div>
                                <div className="flex gap-4">
                                   <button onClick={() => deleteEmailTemplate(templateEditForm.id)} className="px-10 py-5 bg-white/5 text-white/30 hover:text-red-500 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all">Vaporize</button>
                                   <button onClick={() => handleSaveEmailTemplate(templateEditForm)} className="bg-[#DC2626] text-white px-14 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-red-900/40 hover:scale-105 active:scale-95 transition-all">Save Template</button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-10 py-32 bg-white/[0.01] rounded-[3rem] border border-dashed border-white/10">
                              <Zap size={64} className="mb-6" />
                              <p className="text-xl font-black uppercase tracking-[0.4em]">Awaiting Uplink</p>
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Select a neural template to initiate modification</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-10 border-t border-white/5 flex flex-col xl:flex-row items-center justify-between gap-10">
                         <div className="flex items-center gap-6 p-8 bg-white/2 border border-white/10 rounded-[2.5rem] w-full xl:w-auto">
                            <div className={`w-16 h-16 rounded-[1.5rem] ${templateEditForm?.id ? 'bg-[#DC2626]/20 text-[#DC2626]' : 'bg-white/5 text-white/5'} flex items-center justify-center transition-all shadow-lg`}>
                               <ShieldCheck size={32} />
                            </div>
                            <div>
                               <p className="text-sm font-black text-white uppercase italic tracking-tight">Mass Broadcast Trigger</p>
                               <div className="flex items-center gap-3 mt-2">
                                  {(['all', 'premium', 'free'] as const).map(t => (
                                    <button
                                      key={t}
                                      onClick={() => setBroadcastTarget(t)}
                                      className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-[0.3em] transition-all border ${broadcastTarget === t ? 'bg-[#DC2626] border-[#DC2626] text-white' : 'bg-white/5 border-white/10 text-white/20'}`}
                                    >
                                      {t}
                                    </button>
                                  ))}
                                  <div className="w-[1px] h-4 bg-white/10 mx-2" />
                                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest italic">{allUsers.filter(u => broadcastTarget === 'all' || u.tier === broadcastTarget).length} SYNTHS TARGETED</p>
                               </div>
                            </div>
                         </div>
                         <button 
                           onClick={triggerMarketingBlast}
                           disabled={!templateEditForm?.id}
                           className={`w-full xl:w-auto px-16 py-7 font-black rounded-[2rem] text-[12px] uppercase tracking-[0.4em] transition-all hover:scale-[1.02] active:scale-95 shadow-[0_20px_50px_rgba(220,38,38,0.4)] ${templateEditForm?.id ? 'bg-gradient-to-r from-red-600 to-[#DC2626] text-white' : 'bg-white/5 text-white/5 cursor-not-allowed grayscale'}`}
                         >
                           {templateEditForm?.id ? 'EXECUTE MASSIVE UPLINK' : 'LINK OFFLINE'}
                         </button>
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
                  <textarea 
                    required
                    placeholder="Write your article here. Use markdown for bold text, lists, etc."
                    value={newPost.content} 
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none text-white focus:border-[#DC2626]/50 transition-all h-64 resize-none" 
                  />
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
                  <textarea 
                    required
                    value={editingPost.content} 
                    onChange={(e) => setEditingPost({...editingPost, content: e.target.value})} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none text-white focus:border-[#DC2626]/50 transition-all h-64 resize-none" 
                  />
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
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className={`${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} border rounded-3xl p-5 md:p-8 max-w-md w-full max-h-[95vh] overflow-y-auto custom-scrollbar space-y-4 md:space-y-6 flex flex-col`}
            >
              <div className="text-center space-y-1 pb-2">
                <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter">Profile Configuration</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Neural Override Protocol Activated</p>
              </div>
              
              <form onSubmit={handleEditUser} className="space-y-4 pb-4 flex-1">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">Identity Declaration</p>
                  <input type="text" value={editingUser.fullName || editingUser.displayName || ''} onChange={(e) => setEditingUser({...editingUser, fullName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-white focus:border-[#DC2626]/50 transition-all" placeholder="Full Legal Name" />
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-2">Neural Uplink Address</p>
                  <input type="email" value={editingUser.email || ''} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none text-white focus:border-[#DC2626]/50 transition-all" placeholder="email@nexus.com" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-1">Matric Number</p>
                    <input type="text" value={editingUser.matric || ''} onChange={(e) => setEditingUser({...editingUser, matric: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] outline-none text-white focus:border-[#DC2626]/50 transition-all" placeholder="U2024/..." />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-1">Date of Birth</p>
                    <input type="text" value={editingUser.dob || ''} onChange={(e) => setEditingUser({...editingUser, dob: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] outline-none text-white focus:border-[#DC2626]/50 transition-all" placeholder="DD/MM/YYYY" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-1">University</p>
                    <input type="text" value={editingUser.university || ''} onChange={(e) => setEditingUser({...editingUser, university: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] outline-none text-white focus:border-[#DC2626]/50 transition-all" placeholder="University" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-1">Level</p>
                    <input type="text" value={editingUser.level || ''} onChange={(e) => setEditingUser({...editingUser, level: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] outline-none text-white focus:border-[#DC2626]/50 transition-all" placeholder="Level/Year" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-1">Department</p>
                    <input type="text" value={editingUser.department || ''} onChange={(e) => setEditingUser({...editingUser, department: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] outline-none text-white focus:border-[#DC2626]/50 transition-all" placeholder="..." />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest ml-1">Faculty</p>
                    <input type="text" value={editingUser.faculty || ''} onChange={(e) => setEditingUser({...editingUser, faculty: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] outline-none text-white focus:border-[#DC2626]/50 transition-all" placeholder="..." />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <p className="text-[8px] font-black text-[#DC2626] uppercase tracking-widest ml-1 italic">Privileges</p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 p-2 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                      <input type="checkbox" checked={editingUser.isPremium} onChange={e => setEditingUser({...editingUser, isPremium: e.target.checked})} className="sr-only peer" />
                      <div className="w-3.5 h-3.5 border-2 border-white/20 rounded-md peer-checked:bg-yellow-500 peer-checked:border-yellow-500 transition-all flex items-center justify-center">
                        <Check size={10} className={`text-black font-black transition-all ${editingUser.isPremium ? 'opacity-100' : 'opacity-0'}`} />
                      </div>
                      <span className="text-[9px] font-black uppercase text-white/30 peer-checked:text-yellow-500 leading-none">Premium</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                      <input type="checkbox" checked={editingUser.bypassAllPayments} onChange={e => setEditingUser({...editingUser, bypassAllPayments: e.target.checked})} className="sr-only peer" />
                      <div className="w-3.5 h-3.5 border-2 border-white/20 rounded-md peer-checked:bg-[#DC2626] peer-checked:border-[#DC2626] transition-all flex items-center justify-center">
                        <Check size={10} className={`text-white transition-all ${editingUser.bypassAllPayments ? 'opacity-100' : 'opacity-0'}`} />
                      </div>
                      <span className="text-[9px] font-black uppercase text-white/30 peer-checked:text-[#DC2626] leading-none">Master Bypass</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                      <input type="checkbox" checked={editingUser.bypassHostingPayment} onChange={e => setEditingUser({...editingUser, bypassHostingPayment: e.target.checked})} className="sr-only peer" />
                      <div className="w-3.5 h-3.5 border-2 border-white/20 rounded-md peer-checked:bg-red-500/40 peer-checked:border-red-500/40 transition-all flex items-center justify-center">
                        <Check size={10} className={`text-white transition-all ${editingUser.bypassHostingPayment ? 'opacity-100' : 'opacity-0'}`} />
                      </div>
                      <span className="text-[9px] font-black uppercase text-white/30 peer-checked:text-red-400 leading-none">Host Bypass</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-all">
                      <input type="checkbox" checked={editingUser.bypassTakingPayment} onChange={e => setEditingUser({...editingUser, bypassTakingPayment: e.target.checked})} className="sr-only peer" />
                      <div className="w-3.5 h-3.5 border-2 border-white/20 rounded-md peer-checked:bg-blue-500/40 peer-checked:border-blue-500/40 transition-all flex items-center justify-center">
                        <Check size={10} className={`text-white transition-all ${editingUser.bypassTakingPayment ? 'opacity-100' : 'opacity-0'}`} />
                      </div>
                      <span className="text-[9px] font-black uppercase text-white/30 peer-checked:text-blue-400 leading-none">Taking Bypass</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 pb-2">
                  <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-white/5 border border-white/10 text-white/40 font-black py-3 rounded-2xl text-[9px] uppercase tracking-widest hover:text-white transition-all">Abort Task</button>
                  <button type="submit" className="flex-[2] bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-black py-3 rounded-2xl text-[9px] uppercase tracking-[0.2em] shadow-2xl shadow-red-900/40 active:scale-95 transition-all">Commit Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

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
                <div ref={shareCardRef} className={`w-[600px] h-[400px] ${theme === 'dark' ? 'bg-[#13111C]' : 'bg-white'} p-10 flex flex-col items-center justify-center text-center relative overflow-hidden border-[10px] border-[#DC2626]`}>
                  <div className="absolute top-0 left-0 w-32 h-32 bg-[#DC2626]/5 rounded-full -translate-x-16 -translate-y-16" />
                  <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#DC2626]/5 rounded-full translate-x-24 translate-y-24" />
                  
                  <div className="mb-6">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-1">NSG STUDY GUIDE</h1>
                    <p className="text-[10px] font-black text-[#DC2626] uppercase tracking-[0.3em]">Official Assessment Certificate</p>
                  </div>

                  <div className="space-y-2 mb-8">
                    <p className="text-xs text-white/40 uppercase font-bold tracking-widest">This certifies that</p>
                    <p className="text-3xl font-black text-white uppercase">{shareName || 'Student'}</p>
                    <p className="text-xs text-white/40 uppercase font-bold tracking-widest">has achieved a score of</p>
                  </div>

                  <div className="bg-[#DC2626] text-white px-10 py-4 rounded-2xl">
                    <p className="text-5xl font-black">{quizScore} / {quizQuestions.length || 1}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-1">{Math.round((quizScore / (quizQuestions.length || 1)) * 100)}% Proficiency</p>
                  </div>

                  <div className="mt-10 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#DC2626] rounded-full" />
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Generated by Omni Ai | {new Date().toLocaleDateString()}</p>
                    <div className="w-1.5 h-1.5 bg-[#DC2626] rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

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

      {/* BOTTOM NAVIGATION - Only on Mobile */}
      {(!isChatRoomActive || activeTab !== 'chat') && !isDesktop && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-[100] border-t px-3 py-2 flex items-center justify-around shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          style={{
            background: 'rgba(19, 17, 28, 0.96)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button 
            type="button"
            onClick={() => setActiveTab('home')} 
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-300 ${activeTab === 'home' ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-lg shadow-red-500/25 scale-105' : 'text-white/40 hover:text-white/70'}`}
          >
            <Home size={18} />
            <span className="text-[8px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>Home</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('chat')} 
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-300 relative ${activeTab === 'chat' ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-lg shadow-red-500/25 scale-105' : 'text-white/40 hover:text-white/70'}`}
          >
            <WhatsAppIcon size={18} />
            <span className="text-[8px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>Chat</span>
            {totalUnreadMessages > 0 && (
              <span 
                className="absolute -top-1 -right-1 w-4 h-4 text-white text-[8px] font-black flex items-center justify-center rounded-full border border-[#13111C]"
                style={{ background: '#DC2626' }}
              >
                {totalUnreadMessages}
              </span>
            )}
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('tools')} 
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-300 ${activeTab === 'tools' ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-lg shadow-red-500/25 scale-105' : 'text-white/40 hover:text-white/70'}`}
          >
            <LayoutGrid size={18} />
            <span className="text-[8px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>Tools</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('community')} 
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-300 ${activeTab === 'community' ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-lg shadow-red-500/25 scale-105' : 'text-white/40 hover:text-white/70'}`}
          >
            <Globe size={18} />
            <span className="text-[8px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>Social</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('profile')} 
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-300 ${activeTab === 'profile' ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-lg shadow-red-500/25 scale-105' : 'text-white/40 hover:text-white/70'}`}
          >
            <User size={18} />
            <span className="text-[8px] font-black uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)' }}>Profile</span>
          </button>
        </div>
      )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* FOOTER REMOVED FROM HERE */}
    </div>
  );
};

// No export default here as it's at the top
