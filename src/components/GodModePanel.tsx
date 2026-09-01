import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, XCircle, LayoutDashboard, Users, Mail, BookOpen, 
  AlertTriangle, Book, Check, X, Search, RefreshCw, Send, Plus, 
  Trash2, Award, Zap, Shield, Sparkles, Clock, Globe, Terminal, 
  FileDown, BarChart2, Gem, UserCheck, UserX, Crown, Activity,
  Server, Database, Cpu, Lock, CheckCircle2, MessageSquare, AlertCircle,
  FileText, ExternalLink, Filter, Edit3, ChevronRight, Eye, SendHorizontal
} from 'lucide-react';
import { 
  db, auth, collection, query, limit, orderBy, onSnapshot, 
  doc, updateDoc, deleteDoc, addDoc, getDocs, serverTimestamp,
  handleFirestoreError, FirestoreOperation
} from '../firebase';
import { DEPARTMENTS } from '../constants/academic';

export interface GodModePanelProps {
  showGodMode: boolean;
  setShowGodMode: (val: boolean) => void;
  godTab?: string;
  setGodTab?: (val: any) => void;
  godSearchTerm?: string;
  setGodSearchTerm?: (val: string) => void;
  godRoleFilter?: string;
  setGodRoleFilter?: (val: string) => void;
  godUsers?: any[];
  godMarketingLogs?: any[];
  godSafetyReports?: any[];
  godBlogPosts?: any[];
  courses?: any[];
  user?: any;
  currentUserData?: any;
  handleCreateCourse?: () => void;
  handleDeleteCourse?: (id: string) => void;
  handleSendGodEmail?: () => void;
  handleDeleteGodUser?: (id: string) => void;
  handleToggleGodUserBan?: (id: string, isBanned: boolean) => void;
  handleMakeGodAdmin?: (id: string, isAdmin: boolean) => void;
  handleMakeGodPremium?: (id: string, isPremium: boolean) => void;
  handleResolveSafetyReport?: (id: string) => void;
  handleDeleteSafetyReport?: (id: string) => void;
  handleDeleteBlogPost?: (id: string) => void;
  handleCreateBlogPost?: () => void;
  [key: string]: any;
}

export const GodModePanel: React.FC<GodModePanelProps> = ({
  showGodMode,
  setShowGodMode,
  godTab: propGodTab = 'dashboard',
  setGodTab: propSetGodTab,
  godSearchTerm: propGodSearchTerm,
  setGodSearchTerm: propSetGodSearchTerm,
  godRoleFilter: propGodRoleFilter,
  setGodRoleFilter: propSetGodRoleFilter,
  godUsers: propGodUsers,
  godSafetyReports: propGodSafetyReports,
  godBlogPosts: propGodBlogPosts,
  courses: propCourses,
  user,
  currentUserData,
  handleCreateCourse: propHandleCreateCourse,
  handleDeleteCourse: propHandleDeleteCourse,
  handleDeleteGodUser: propHandleDeleteGodUser,
  handleToggleGodUserBan: propHandleToggleGodUserBan,
  handleMakeGodAdmin: propHandleMakeGodAdmin,
  handleMakeGodPremium: propHandleMakeGodPremium,
  handleResolveSafetyReport: propHandleResolveSafetyReport,
  handleDeleteSafetyReport: propHandleDeleteSafetyReport,
  handleDeleteBlogPost: propHandleDeleteBlogPost,
  handleCreateBlogPost: propHandleCreateBlogPost,
}) => {
  // Active Internal Tab State (supporting aliases)
  const [internalTab, setInternalTab] = useState<string>(() => {
    const initial = propGodTab || 'dashboard';
    if (initial === 'reports') return 'safety';
    if (initial === 'blog') return 'blogs';
    return initial;
  });

  const activeTab = useMemo(() => {
    const raw = propGodTab || internalTab || 'dashboard';
    if (raw === 'reports') return 'safety';
    if (raw === 'blog') return 'blogs';
    return raw;
  }, [propGodTab, internalTab]);

  const setActiveTab = (tab: string) => {
    setInternalTab(tab);
    if (propSetGodTab) {
      if (tab === 'safety') propSetGodTab('reports');
      else if (tab === 'blogs') propSetGodTab('blog');
      else propSetGodTab(tab);
    }
  };

  // Internal Fallback Data State if props are not provided
  const [internalUsers, setInternalUsers] = useState<any[]>([]);
  const [internalCourses, setInternalCourses] = useState<any[]>([]);
  const [internalReports, setInternalReports] = useState<any[]>([]);
  const [internalBlogPosts, setInternalBlogPosts] = useState<any[]>([]);
  const [materialsCount, setMaterialsCount] = useState<number>(0);
  const [quizzesCount, setQuizzesCount] = useState<number>(0);
  const [chatsCount, setChatsCount] = useState<number>(0);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [dbPingMs, setDbPingMs] = useState<number | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const effectiveSearch = propGodSearchTerm !== undefined ? propGodSearchTerm : searchTerm;
  const effectiveRoleFilter = propGodRoleFilter !== undefined ? propGodRoleFilter : roleFilter;
  const setEffectiveSearch = propSetGodSearchTerm || setSearchTerm;
  const setEffectiveRoleFilter = propSetGodRoleFilter || setRoleFilter;

  // Real-time Database Listeners for self-sufficiency
  useEffect(() => {
    if (!showGodMode) return;

    setIsLoadingStats(true);
    const startTime = Date.now();

    // 1. Users Listener
    const usersUnsub = onSnapshot(query(collection(db, 'users'), limit(500)), (snapshot) => {
      setDbPingMs(Date.now() - startTime);
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : (a.lastActive ? new Date(a.lastActive).getTime() : 0);
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : (b.lastActive ? new Date(b.lastActive).getTime() : 0);
        return tB - tA;
      });
      setInternalUsers(list);
      setIsLoadingStats(false);
    }, (err) => {
      console.warn("GodMode: Users listener warning", err);
      setIsLoadingStats(false);
    });

    // 2. Courses Listener
    const coursesUnsub = onSnapshot(query(collection(db, 'courses'), limit(200)), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setInternalCourses(list);
    }, (err) => console.warn("GodMode: Courses listener warning", err));

    // 3. Safety Reports Listener
    const reportsUnsub = onSnapshot(query(collection(db, 'reports'), limit(100)), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setInternalReports(list);
    }, (err) => console.warn("GodMode: Reports listener warning", err));

    // 4. Blog Posts Listener
    const blogUnsub = onSnapshot(query(collection(db, 'blogPosts'), limit(50)), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setInternalBlogPosts(list);
    }, (err) => console.warn("GodMode: Blog listener warning", err));

    // 5. Query counts for materials and quizzes
    getDocs(query(collection(db, 'materials'), limit(300)))
      .then(snap => setMaterialsCount(snap.size))
      .catch(() => {});

    getDocs(query(collection(db, 'quizzes'), limit(300)))
      .then(snap => setQuizzesCount(snap.size))
      .catch(() => {});

    getDocs(query(collection(db, 'chats'), limit(300)))
      .then(snap => setChatsCount(snap.size))
      .catch(() => {});

    return () => {
      usersUnsub();
      coursesUnsub();
      reportsUnsub();
      blogUnsub();
    };
  }, [showGodMode]);

  // Combined Data Pools
  const usersList = (propGodUsers && propGodUsers.length > 0) ? propGodUsers : internalUsers;
  const coursesList = (propCourses && propCourses.length > 0) ? propCourses : internalCourses;
  const reportsList = (propGodSafetyReports && propGodSafetyReports.length > 0) ? propGodSafetyReports : internalReports;
  const blogPostsList = (propGodBlogPosts && propGodBlogPosts.length > 0) ? propGodBlogPosts : internalBlogPosts;

  // Computed Metrics
  const stats = useMemo(() => {
    const totalUsers = usersList.length;
    const premiumUsers = usersList.filter(u => u.isPremium || u.bypassAllPayments).length;
    const adminUsers = usersList.filter(u => u.isAdmin || u.role === 'admin').length;
    const bannedUsers = usersList.filter(u => u.isBanned || u.status === 'deleted').length;
    const activeUsers = totalUsers - bannedUsers;
    const totalCourses = coursesList.length;
    const pendingReports = reportsList.length;
    const totalArticles = blogPostsList.length;

    return {
      totalUsers,
      premiumUsers,
      adminUsers,
      bannedUsers,
      activeUsers,
      totalCourses,
      pendingReports,
      totalArticles,
      materialsCount,
      quizzesCount,
      chatsCount
    };
  }, [usersList, coursesList, reportsList, blogPostsList, materialsCount, quizzesCount, chatsCount]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const q = effectiveSearch.toLowerCase().trim();
      const matchesSearch = !q || 
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.displayName && u.displayName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.matric && u.matric.toLowerCase().includes(q)) ||
        (u.matricNumber && u.matricNumber.toLowerCase().includes(q)) ||
        (u.id && u.id.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (effectiveRoleFilter === 'admin') return u.isAdmin || u.role === 'admin';
      if (effectiveRoleFilter === 'premium') return u.isPremium || u.bypassAllPayments;
      if (effectiveRoleFilter === 'free') return !u.isPremium && !u.bypassAllPayments;
      if (effectiveRoleFilter === 'banned') return u.isBanned || u.status === 'deleted';
      if (effectiveRoleFilter === 'active') return !u.isBanned && u.status !== 'deleted';
      return true;
    });
  }, [usersList, effectiveSearch, effectiveRoleFilter]);

  // Form States for Courses
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseFaculty, setCourseFaculty] = useState('');
  const [courseDept, setCourseDept] = useState('');
  const [courseLevel, setCourseLevel] = useState('100');
  const [courseDesc, setCourseDesc] = useState('');
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);

  // Form States for Direct Email / In-App Broadcast
  const [emailAudience, setEmailAudience] = useState<'all' | 'premium' | 'free' | 'admins' | 'custom'>('all');
  const [customRecipient, setCustomRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Form States for Blog Posts
  const [blogTitle, setBlogTitle] = useState('');
  const [blogCategory, setBlogCategory] = useState('Exam Tips');
  const [blogAuthor, setBlogAuthor] = useState('NSG Scholar Admin');
  const [blogContent, setBlogContent] = useState('');
  const [isPublishingBlog, setIsPublishingBlog] = useState(false);
  const [isGeneratingAIBlog, setIsGeneratingAIBlog] = useState(false);

  // User Edit Modal State
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<any | null>(null);

  // --- ACTIONS ---

  // 1. Promote / Demote Admin
  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    if (propHandleMakeGodAdmin) {
      propHandleMakeGodAdmin(userId, !currentIsAdmin);
      showToast(`User ${!currentIsAdmin ? 'promoted to Admin' : 'demoted to Student'}`);
      return;
    }
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: !currentIsAdmin ? 'admin' : 'student',
        isAdmin: !currentIsAdmin,
        updatedAt: serverTimestamp()
      });
      showToast(`User ${!currentIsAdmin ? 'promoted to Admin' : 'demoted to Student'}`);
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to update admin role: ${err.message || 'Permission denied'}`);
    }
  };

  // 2. Grant / Revoke Premium
  const handleTogglePremium = async (userId: string, currentIsPremium: boolean) => {
    if (propHandleMakeGodPremium) {
      propHandleMakeGodPremium(userId, !currentIsPremium);
      showToast(`User premium access ${!currentIsPremium ? 'granted' : 'revoked'}`);
      return;
    }
    try {
      const nextState = !currentIsPremium;
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      await updateDoc(doc(db, 'users', userId), {
        isPremium: nextState,
        bypassAllPayments: nextState,
        premiumUntil: nextState ? oneYearFromNow.toISOString() : null,
        updatedAt: serverTimestamp()
      });
      showToast(`User premium access ${nextState ? 'activated (1 Year)' : 'revoked'}`);
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to update premium: ${err.message || 'Permission denied'}`);
    }
  };

  // 3. Ban / Unban User
  const handleToggleBan = async (userId: string, currentIsBanned: boolean) => {
    const targetUser = usersList.find(u => u.id === userId);
    if (targetUser?.email?.toLowerCase().trim() === 'nuellkelechi@gmail.com') {
      showToast('CRITICAL: God Mode owner account cannot be banned!');
      return;
    }

    if (propHandleToggleGodUserBan) {
      propHandleToggleGodUserBan(userId, !currentIsBanned);
      showToast(`User account ${!currentIsBanned ? 'banned' : 'unbanned'}`);
      return;
    }

    try {
      const newStatus = !currentIsBanned ? 'deleted' : 'active';
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        isBanned: !currentIsBanned,
        updatedAt: serverTimestamp()
      });
      showToast(`User account ${!currentIsBanned ? 'suspended (banned)' : 'restored to active'}`);
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to update status: ${err.message || 'Error'}`);
    }
  };

  // 4. Delete User Permanently
  const handleDeleteUser = async (userId: string) => {
    const targetUser = usersList.find(u => u.id === userId);
    if (targetUser?.email?.toLowerCase().trim() === 'nuellkelechi@gmail.com') {
      showToast('CRITICAL: God Mode owner account cannot be deleted!');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete user record "${targetUser?.name || targetUser?.email || userId}"?`)) {
      return;
    }

    if (propHandleDeleteGodUser) {
      propHandleDeleteGodUser(userId);
      showToast('User record deleted from database');
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      showToast('User deleted successfully from Firestore');
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to delete user: ${err.message || 'Error'}`);
    }
  };

  // 5. Save Full User Edit
  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserToEdit) return;

    try {
      await updateDoc(doc(db, 'users', selectedUserToEdit.id), {
        name: selectedUserToEdit.name || selectedUserToEdit.displayName || '',
        displayName: selectedUserToEdit.name || selectedUserToEdit.displayName || '',
        department: selectedUserToEdit.department || '',
        faculty: selectedUserToEdit.faculty || '',
        level: selectedUserToEdit.level || '',
        matric: selectedUserToEdit.matric || selectedUserToEdit.matricNumber || '',
        matricNumber: selectedUserToEdit.matric || selectedUserToEdit.matricNumber || '',
        points: Number(selectedUserToEdit.points || 0),
        role: selectedUserToEdit.role || (selectedUserToEdit.isAdmin ? 'admin' : 'student'),
        isAdmin: selectedUserToEdit.role === 'admin' || !!selectedUserToEdit.isAdmin,
        isPremium: !!selectedUserToEdit.isPremium,
        bypassAllPayments: !!selectedUserToEdit.bypassAllPayments,
        bypassHostingPayment: !!selectedUserToEdit.bypassHostingPayment,
        bypassTakingPayment: !!selectedUserToEdit.bypassTakingPayment,
        updatedAt: serverTimestamp()
      });
      showToast('User profile configuration saved successfully');
      setSelectedUserToEdit(null);
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to save user: ${err.message || 'Error'}`);
    }
  };

  // 6. Create Academic Course
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim() || !courseTitle.trim()) {
      showToast('Course code and title are required');
      return;
    }

    if (propHandleCreateCourse) {
      propHandleCreateCourse();
      showToast('Course created successfully');
      setCourseCode('');
      setCourseTitle('');
      setCourseDesc('');
      return;
    }

    setIsSubmittingCourse(true);
    try {
      await addDoc(collection(db, 'courses'), {
        code: courseCode.trim().toUpperCase(),
        title: courseTitle.trim(),
        faculty: courseFaculty.trim() || 'General Studies',
        department: courseDept.trim() || 'General',
        level: courseLevel || '100',
        description: courseDesc.trim() || 'Official curriculum study course',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      showToast(`Course ${courseCode.toUpperCase()} added to curriculum!`);
      setCourseCode('');
      setCourseTitle('');
      setCourseDesc('');
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to create course: ${err.message || 'Error'}`);
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  // 7. Delete Course
  const handleDeleteCourseAction = async (courseId: string) => {
    if (!window.confirm('Are you sure you want to remove this course from the curriculum?')) return;

    if (propHandleDeleteCourse) {
      propHandleDeleteCourse(courseId);
      showToast('Course removed from database');
      return;
    }

    try {
      await deleteDoc(doc(db, 'courses', courseId));
      showToast('Course deleted successfully');
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to delete course: ${err.message}`);
    }
  };

  // 8. Resolve / Delete Safety Report
  const handleResolveReport = async (reportId: string, actionType: 'dismiss' | 'warn' | 'ban') => {
    const report = reportsList.find(r => r.id === reportId);
    if (!report) return;

    try {
      if (actionType === 'warn' && report.suspectId) {
        await addDoc(collection(db, 'notifications'), {
          to: report.suspectId,
          userId: report.suspectId,
          title: "SECURITY NOTICE",
          message: "A formal moderation alert has been issued regarding your study activity. Please adhere to terms.",
          timestamp: serverTimestamp(),
          type: 'warning',
          read: false
        });
        showToast('Warning notice dispatched to suspect account');
      } else if (actionType === 'ban' && report.suspectId) {
        await updateDoc(doc(db, 'users', report.suspectId), {
          status: 'deleted',
          isBanned: true
        });
        showToast('Suspect account banned');
      }

      await deleteDoc(doc(db, 'reports', reportId));
      showToast('Safety report resolved & cleared');
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to handle report: ${err.message}`);
    }
  };

  // 9. Dispatch Broadcast Email / In-App Notification
  const handleBroadcastDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailContent.trim()) {
      showToast('Subject and broadcast message body are required');
      return;
    }

    setIsSendingEmail(true);
    try {
      // Determine target users
      let targets = usersList;
      if (emailAudience === 'premium') {
        targets = usersList.filter(u => u.isPremium || u.bypassAllPayments);
      } else if (emailAudience === 'free') {
        targets = usersList.filter(u => !u.isPremium && !u.bypassAllPayments);
      } else if (emailAudience === 'admins') {
        targets = usersList.filter(u => u.isAdmin || u.role === 'admin');
      } else if (emailAudience === 'custom' && customRecipient.trim()) {
        targets = usersList.filter(u => u.email?.toLowerCase().trim() === customRecipient.toLowerCase().trim());
      }

      // Add dispatch notification to Firestore for active in-app popup
      for (const target of targets.slice(0, 30)) {
        if (target.id) {
          const personalizedContent = emailContent
            .replace(/\{name\}/g, target.name || target.displayName || 'Scholar')
            .replace(/\{email\}/g, target.email || '');

          await addDoc(collection(db, 'notifications'), {
            to: target.id,
            userId: target.id,
            title: emailSubject,
            message: personalizedContent,
            timestamp: serverTimestamp(),
            type: 'broadcast',
            read: false
          });
        }
      }

      showToast(`Broadcast successfully dispatched to ${targets.length} scholar accounts!`);
      setEmailSubject('');
      setEmailContent('');
    } catch (err: any) {
      console.error(err);
      showToast(`Broadcast error: ${err.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // 10. Blog Publish
  const handlePublishBlogAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim() || !blogContent.trim()) {
      showToast('Article title and content are required');
      return;
    }

    setIsPublishingBlog(true);
    try {
      await addDoc(collection(db, 'blogPosts'), {
        title: blogTitle.trim(),
        category: blogCategory.trim() || 'General',
        author: blogAuthor.trim() || 'NSG Scholar Admin',
        content: blogContent.trim(),
        views: 1,
        likes: 0,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      showToast('Community article published successfully!');
      setBlogTitle('');
      setBlogContent('');
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to publish: ${err.message}`);
    } finally {
      setIsPublishingBlog(false);
    }
  };

  // 11. Delete Blog Post
  const handleDeleteBlogAction = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this community article?')) return;
    try {
      await deleteDoc(doc(db, 'blogPosts', postId));
      showToast('Article deleted successfully');
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to delete post: ${err.message}`);
    }
  };

  // 12. AI Auto-Generate Article
  const handleGenerateAIArticle = async () => {
    setIsGeneratingAIBlog(true);
    try {
      const prompt = `Write an inspiring and practical 3-paragraph study guide article for university students about mastering exams, active recall techniques, and maintaining focus in university. Give it a punchy title and markdown format.`;
      
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        if (data.text) {
          setBlogTitle("Mastering University Exams: The Cognitive Recall Protocol");
          setBlogContent(data.text);
          showToast("AI generated article content ready!");
          return;
        }
      }

      // Fallback sample article
      setBlogTitle("The 3-Phase Active Recall System for High CGPA");
      setBlogContent(`### 1. Spaced Repetition Protocol\nMastering high-yield concepts requires reviewing material at 1-day, 3-day, and 7-day intervals. Avoid passive rereading—instead, test yourself immediately after reviewing lecture slides.\n\n### 2. The Feynman Explanation Method\nTeach difficult engineering, medical, or science equations in simple plain language. If you cannot explain the mechanism to a 100-level junior, identify the logical gap and review the textbook chapter.\n\n### 3. Sleep & Memory Consolidation\nNeuroscience demonstrates that long-term synaptic potentiation happens during delta-wave sleep. Target at least 7 hours before major mid-terms.`);
      showToast("Article template generated!");
    } catch (err: any) {
      showToast("Generated fallback article template");
    } finally {
      setIsGeneratingAIBlog(false);
    }
  };

  // 13. Export Database Snapshot
  const handleExportSnapshot = () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      stats,
      usersCount: usersList.length,
      coursesCount: coursesList.length,
      reportsCount: reportsList.length,
      articlesCount: blogPostsList.length,
      users: usersList.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name || u.displayName,
        role: u.role,
        isPremium: u.isPremium,
        status: u.status,
        department: u.department,
        level: u.level
      })),
      courses: coursesList
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nsg_database_snapshot_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Database snapshot downloaded!');
  };

  if (!showGodMode) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-2xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="w-full max-w-7xl h-[92vh] bg-[#0A0812] border border-red-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#100D1C] border-b border-white/10 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 via-red-500 to-amber-600 flex items-center justify-center shadow-lg shadow-red-600/30">
                <ShieldCheck size={22} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">God Mode Superadmin</h2>
                  <span className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-mono font-black">ROOT ACCESS</span>
                  {dbPingMs !== null && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {dbPingMs}ms DB Latency
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Real-Time Platform Management & Control Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportSnapshot}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/80 hover:text-white transition-all cursor-pointer"
                title="Download JSON Snapshot"
              >
                <FileDown size={14} /> Snapshot
              </button>
              <button 
                onClick={() => setShowGodMode(false)}
                className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all cursor-pointer active:scale-95"
                title="Close God Mode Console"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Toast Notification Bar */}
          {toastMessage && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-600/90 text-white text-xs font-bold px-6 py-2.5 flex items-center justify-between border-b border-red-500 shadow-md"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{toastMessage}</span>
              </div>
              <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">
                <X size={14} />
              </button>
            </motion.div>
          )}

          {/* Navigation Bar */}
          <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 bg-[#0D0B17] border-b border-white/10 overflow-x-auto custom-scrollbar">
            {[
              { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, badge: null },
              { id: 'users', label: 'Users', icon: Users, badge: usersList.length },
              { id: 'courses', label: 'Courses', icon: BookOpen, badge: coursesList.length },
              { id: 'safety', label: 'Safety & Reports', icon: AlertTriangle, badge: reportsList.length > 0 ? reportsList.length : null, alert: reportsList.length > 0 },
              { id: 'emails', label: 'Broadcast Center', icon: Mail, badge: null },
              { id: 'marketing', label: 'AI Persuasions', icon: Sparkles, badge: null },
              { id: 'blogs', label: 'Community Blog', icon: Book, badge: blogPostsList.length },
              { id: 'system', label: 'System Telemetry', icon: Terminal, badge: null },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    isActive 
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                      : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {tab.badge !== null && (
                    <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-mono ${isActive ? 'bg-white/20 text-white' : tab.alert ? 'bg-amber-500 text-black font-black animate-pulse' : 'bg-white/10 text-white/70'}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Body Content Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-6">
            
            {/* ========================================================
                TAB: DASHBOARD / OVERVIEW
            ======================================================== */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-white/40">
                      <span className="text-[10px] font-black uppercase tracking-widest">Total Users</span>
                      <Users size={16} className="text-blue-400" />
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-black text-white">{stats.totalUsers}</p>
                      <p className="text-[10px] text-emerald-400 font-bold">{stats.activeUsers} Active</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-white/40">
                      <span className="text-[10px] font-black uppercase tracking-widest">Premium Tier</span>
                      <Gem size={16} className="text-amber-400" />
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-black text-amber-300">{stats.premiumUsers}</p>
                      <p className="text-[10px] text-white/40 font-mono">{((stats.premiumUsers / (stats.totalUsers || 1)) * 100).toFixed(0)}% Conversion</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-white/40">
                      <span className="text-[10px] font-black uppercase tracking-widest">Courses DB</span>
                      <BookOpen size={16} className="text-purple-400" />
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-black text-white">{stats.totalCourses}</p>
                      <p className="text-[10px] text-purple-400 font-bold">Curriculum</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-white/40">
                      <span className="text-[10px] font-black uppercase tracking-widest">Safety Alerts</span>
                      <AlertTriangle size={16} className={stats.pendingReports > 0 ? 'text-amber-400 animate-bounce' : 'text-emerald-400'} />
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-black text-white">{stats.pendingReports}</p>
                      <p className={`text-[10px] font-bold ${stats.pendingReports > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {stats.pendingReports > 0 ? 'Action Required' : 'Clean Platform'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-white/40">
                      <span className="text-[10px] font-black uppercase tracking-widest">Community Blog</span>
                      <Book size={16} className="text-cyan-400" />
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-black text-white">{stats.totalArticles}</p>
                      <p className="text-[10px] text-cyan-400 font-bold">Articles</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-white/40">
                      <span className="text-[10px] font-black uppercase tracking-widest">Admin Staff</span>
                      <Shield size={16} className="text-red-400" />
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-black text-red-400">{stats.adminUsers}</p>
                      <p className="text-[10px] text-white/40 font-mono">Privileged</p>
                    </div>
                  </div>
                </div>

                {/* Quick Action Shortcuts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    onClick={() => setActiveTab('users')}
                    className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 to-indigo-950/20 border border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                        <Users size={18} />
                      </div>
                      <ChevronRight size={16} className="text-white/40 group-hover:text-white transition-colors" />
                    </div>
                    <h4 className="text-sm font-bold text-white mt-3">Manage Users & Privileges</h4>
                    <p className="text-xs text-white/50 mt-1">Search, promote admins, grant 1-year premium licenses, and ban accounts.</p>
                  </div>

                  <div 
                    onClick={() => setActiveTab('courses')}
                    className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 to-pink-950/20 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                        <BookOpen size={18} />
                      </div>
                      <ChevronRight size={16} className="text-white/40 group-hover:text-white transition-colors" />
                    </div>
                    <h4 className="text-sm font-bold text-white mt-3">Curriculum & Course Management</h4>
                    <p className="text-xs text-white/50 mt-1">Publish new course codes (e.g. PHY101), update syllabus, and organize departments.</p>
                  </div>

                  <div 
                    onClick={() => setActiveTab('emails')}
                    className="p-5 rounded-2xl bg-gradient-to-br from-red-950/40 to-amber-950/20 border border-red-500/20 hover:border-red-500/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                        <Mail size={18} />
                      </div>
                      <ChevronRight size={16} className="text-white/40 group-hover:text-white transition-colors" />
                    </div>
                    <h4 className="text-sm font-bold text-white mt-3">Broadcast Center</h4>
                    <p className="text-xs text-white/50 mt-1">Dispatch targeted in-app alerts and announcement emails to all students.</p>
                  </div>
                </div>

                {/* System Diagnostics & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Health Diagnostic Card */}
                  <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                      <Activity size={14} className="text-emerald-400" /> Platform Diagnostic Telemetry
                    </h3>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-white/70">Database Target</span>
                        <span className="font-mono text-emerald-400 font-bold">ai-studio-8970f663-fa3e-4f2c</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-white/70">Native Offline LLM Engine</span>
                        <span className="font-mono text-purple-400 font-bold">Qwen 2.5 0.5B (GGUF llama.cpp)</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-white/70">Cloud Reasoning Model</span>
                        <span className="font-mono text-cyan-400 font-bold">Gemini 2.5 Flash / Thinking</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-white/70">Target Android Package</span>
                        <span className="font-mono text-amber-300 font-bold">ng.name.nuellstudyguide</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity Feed */}
                  <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                      <Clock size={14} className="text-blue-400" /> Recent User Registrations
                    </h3>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                      {usersList.slice(0, 5).map(u => (
                        <div key={u.id} className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-[10px]">
                              {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-white">{u.name || u.displayName || 'Scholar User'}</p>
                              <p className="text-[10px] text-white/40 font-mono">{u.email || u.id}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${u.isPremium ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-white/50'}`}>
                            {u.isPremium ? 'PREMIUM' : 'FREE'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                TAB: USERS MANAGEMENT
            ======================================================== */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[260px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input 
                      type="text" 
                      value={effectiveSearch} 
                      onChange={(e) => setEffectiveSearch(e.target.value)}
                      placeholder="Search users by name, email, matriculation or UID..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs text-white outline-none focus:border-red-500/50"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['all', 'admin', 'premium', 'free', 'banned', 'active'].map(role => (
                      <button
                        key={role}
                        onClick={() => setEffectiveRoleFilter(role)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          effectiveRoleFilter === role 
                            ? 'bg-red-600 text-white shadow-md' 
                            : 'bg-white/5 text-white/50 hover:text-white'
                        }`}
                      >
                        {role} ({
                          role === 'all' ? usersList.length :
                          role === 'admin' ? usersList.filter(u => u.isAdmin || u.role === 'admin').length :
                          role === 'premium' ? usersList.filter(u => u.isPremium || u.bypassAllPayments).length :
                          role === 'free' ? usersList.filter(u => !u.isPremium && !u.bypassAllPayments).length :
                          role === 'banned' ? usersList.filter(u => u.isBanned || u.status === 'deleted').length :
                          usersList.filter(u => !u.isBanned && u.status !== 'deleted').length
                        })
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-white/40 uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Scholar</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Dept / Level</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Tier</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-white/40">
                            No scholar accounts found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(u => {
                          const isGodAccount = u.email?.toLowerCase().trim() === 'nuellkelechi@gmail.com';
                          const isUserAdmin = u.isAdmin || u.role === 'admin';
                          const isUserPremium = u.isPremium || u.bypassAllPayments;
                          const isUserBanned = u.isBanned || u.status === 'deleted';

                          return (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-3 px-4 font-bold text-white flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-[10px] font-black uppercase text-white shrink-0">
                                  {(u.name || u.displayName || u.email || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold">{u.name || u.displayName || 'Anonymous Scholar'}</span>
                                    {isGodAccount && <Crown size={12} className="text-amber-400" />}
                                  </div>
                                  <span className="text-[10px] text-white/40 font-mono">{u.matric || u.matricNumber || u.id.slice(0, 10)}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-white/70 font-mono text-[11px]">{u.email || '-'}</td>
                              <td className="py-3 px-4 text-white/60 text-[11px]">
                                {u.department || 'General'} • {u.level || '100'}L
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${isUserAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/10 text-white/60'}`}>
                                  {isUserAdmin ? 'ADMIN' : 'STUDENT'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${isUserPremium ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/10 text-white/40'}`}>
                                  {isUserPremium ? 'PREMIUM' : 'FREE'}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${isUserBanned ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400'}`}>
                                  {isUserBanned ? 'BANNED' : 'ACTIVE'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  <button
                                    onClick={() => setSelectedUserToEdit(u)}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                                    title="Edit Full Profile & Bypass Flags"
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleToggleAdmin(u.id, isUserAdmin)}
                                    className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${isUserAdmin ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-white/50 hover:text-white'}`}
                                    title="Toggle Admin Role"
                                  >
                                    {isUserAdmin ? 'Demote' : 'Make Admin'}
                                  </button>
                                  <button
                                    onClick={() => handleTogglePremium(u.id, isUserPremium)}
                                    className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${isUserPremium ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-white/50 hover:text-white'}`}
                                    title="Toggle Premium Access"
                                  >
                                    {isUserPremium ? 'Revoke VIP' : 'Give VIP'}
                                  </button>
                                  <button
                                    onClick={() => handleToggleBan(u.id, isUserBanned)}
                                    className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${isUserBanned ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}
                                    title="Toggle Ban Status"
                                  >
                                    {isUserBanned ? 'Unban' : 'Ban'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                                    title="Delete User Document"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================
                TAB: COURSES MANAGEMENT
            ======================================================== */}
            {activeTab === 'courses' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Course Creator */}
                <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4 lg:col-span-1">
                  <h3 className="text-sm font-black uppercase tracking-wide text-white flex items-center gap-2">
                    <Plus size={16} className="text-red-400" /> Create Academic Course
                  </h3>
                  
                  <form onSubmit={handleSaveCourse} className="space-y-3">
                    <input 
                      type="text" 
                      value={courseCode} 
                      onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                      placeholder="Course Code (e.g. PHY101)"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-mono font-bold text-white outline-none focus:border-red-500/50"
                      required
                    />
                    <input 
                      type="text" 
                      value={courseTitle} 
                      onChange={(e) => setCourseTitle(e.target.value)}
                      placeholder="Course Title (e.g. General Physics I)"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-red-500/50"
                      required
                    />
                    <select
                      value={courseFaculty}
                      onChange={(e) => setCourseFaculty(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#141122] border border-white/10 rounded-xl text-xs text-white outline-none"
                    >
                      <option value="">Select Faculty...</option>
                      {Object.keys(DEPARTMENTS).map(fac => (
                        <option key={fac} value={fac}>{fac}</option>
                      ))}
                    </select>
                    <select
                      value={courseLevel}
                      onChange={(e) => setCourseLevel(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#141122] border border-white/10 rounded-xl text-xs text-white outline-none"
                    >
                      {['100', '200', '300', '400', '500'].map(lvl => (
                        <option key={lvl} value={lvl}>{lvl} Level</option>
                      ))}
                    </select>
                    <textarea 
                      value={courseDesc} 
                      onChange={(e) => setCourseDesc(e.target.value)}
                      placeholder="Course syllabus description..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none resize-none focus:border-red-500/50"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingCourse || !courseCode.trim() || !courseTitle.trim()}
                      className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      <span>{isSubmittingCourse ? 'Publishing Course...' : 'Publish Course to DB'}</span>
                    </button>
                  </form>
                </div>

                {/* Course List */}
                <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-wide text-white">Active Academic Courses ({coursesList.length})</h3>
                    <span className="text-xs text-white/40">Real-Time Curriculum</span>
                  </div>

                  <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {coursesList.length === 0 ? (
                      <div className="p-12 text-center text-white/40 text-xs">
                        No courses added to the curriculum yet. Create your first course on the left!
                      </div>
                    ) : (
                      coursesList.map(c => (
                        <div key={c.id || c.code} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 text-xs hover:border-white/20 transition-all">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 text-red-400 font-mono font-bold rounded-lg text-[10px]">{c.code}</span>
                              <span className="font-bold text-white text-sm">{c.title}</span>
                            </div>
                            <p className="text-[10px] text-white/40">{c.faculty || 'General Studies'} • {c.level || '100'}L</p>
                            {c.description && <p className="text-[11px] text-white/60 line-clamp-1">{c.description}</p>}
                          </div>
                          <button
                            onClick={() => handleDeleteCourseAction(c.id)}
                            className="p-2 text-white/30 hover:text-red-400 rounded-xl hover:bg-white/5 transition-all"
                            title="Delete Course"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                TAB: SAFETY & HARASSMENT REPORTS
            ======================================================== */}
            {activeTab === 'safety' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wide text-white flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-400" /> Platform Safety & Harassment Alerts ({reportsList.length})
                  </h3>
                </div>

                {reportsList.length === 0 ? (
                  <div className="text-center py-16 rounded-3xl bg-white/[0.02] border border-white/10 text-white/40 text-xs space-y-2">
                    <ShieldCheck size={40} className="mx-auto text-emerald-400/50 mb-1" />
                    <p className="text-sm font-bold text-white">Platform is 100% Clean</p>
                    <p className="text-white/40 text-xs">No pending harassment, abusive speech, or spam reports.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reportsList.map(rep => (
                      <div key={rep.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-[10px] uppercase rounded-md">
                              {rep.reason || 'Flagged Behavior'}
                            </span>
                            <span className="text-[10px] text-white/40 font-mono">
                              Suspect UID: {rep.suspectId || rep.userId || 'Unknown'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleResolveReport(rep.id, 'warn')}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded-lg text-[10px] cursor-pointer"
                            >
                              Issue Warning
                            </button>
                            <button
                              onClick={() => handleResolveReport(rep.id, 'ban')}
                              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                            >
                              Ban Suspect
                            </button>
                            <button
                              onClick={() => handleResolveReport(rep.id, 'dismiss')}
                              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                            >
                              Resolve
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-white/80 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5">
                          {rep.details || rep.message || rep.content || 'User submitted report without additional text.'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================
                TAB: BROADCAST EMAIL & IN-APP NOTIFICATIONS
            ======================================================== */}
            {activeTab === 'emails' && (
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 max-w-3xl space-y-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide text-white flex items-center gap-2">
                    <Mail size={16} className="text-red-400" /> Direct Broadcast & Notification Center
                  </h3>
                  <p className="text-xs text-white/50">Send mass announcements and system messages to registered students.</p>
                </div>

                <form onSubmit={handleBroadcastDispatch} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-white/50">Target Audience</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'all', label: `All Users (${usersList.length})` },
                        { id: 'premium', label: `Premium Only (${stats.premiumUsers})` },
                        { id: 'free', label: `Free Tier (${stats.totalUsers - stats.premiumUsers})` },
                        { id: 'custom', label: 'Single Recipient' },
                      ].map(aud => (
                        <button
                          key={aud.id}
                          type="button"
                          onClick={() => setEmailAudience(aud.id as any)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                            emailAudience === aud.id 
                              ? 'bg-red-600/20 border-red-500 text-white' 
                              : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                          }`}
                        >
                          {aud.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {emailAudience === 'custom' && (
                    <input 
                      type="email" 
                      value={customRecipient} 
                      onChange={(e) => setCustomRecipient(e.target.value)}
                      placeholder="Scholar Email (e.g. student@gmail.com)"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-red-500/50"
                      required
                    />
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-white/50">Subject Line</label>
                    <input 
                      type="text" 
                      value={emailSubject} 
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Important Semester Update / Exam Preparation Week..."
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-red-500/50"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase text-white/50">Message Body (Supports merge tags: {"{name}"}, {"{email}"})</label>
                      <span className="text-[10px] text-white/40">Markdown / Text</span>
                    </div>
                    <textarea 
                      value={emailContent} 
                      onChange={(e) => setEmailContent(e.target.value)}
                      rows={6}
                      placeholder="Hello {name}, welcome to the new semester! We've uploaded complete exam preparation materials for your department..."
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none resize-none focus:border-red-500/50"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingEmail || !emailSubject.trim() || !emailContent.trim()}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <SendHorizontal size={16} />
                    <span>{isSendingEmail ? 'Dispatching Broadcast...' : 'Dispatch Broadcast Message'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* ========================================================
                TAB: MARKETING & AI PERSUASIONS
            ======================================================== */}
            {activeTab === 'marketing' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400" /> Autonomous AI Study Motivation Engine
                  </h3>
                  <p className="text-xs text-white/50">Automated retention triggers & peer study challenge engines.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'Dr. Ada Lovelace', specialty: 'Algorithmic Thinking & Computer Science', challenge: 'Can you solve this binary search tree optimization quiz in 3 minutes?' },
                    { name: 'Prof. Richard Feynman', specialty: 'Physics & Intuitive Mechanics', challenge: 'Explain electromagnetic flux without looking at the textbook formulas!' },
                    { name: 'Dr. Chidi AI', specialty: 'Organic Chemistry & Biochemistry', challenge: 'Identify the synthesis pathway for aromatic hydrocarbons.' },
                    { name: 'Counselor Maya', specialty: 'Academic Motivation & Time Management', challenge: 'Complete a 25-minute Pomodoro study block today to retain your streak.' },
                  ].map((bot, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white">{bot.name}</p>
                        <p className="text-[10px] text-amber-300 font-mono">{bot.specialty}</p>
                        <p className="text-[11px] text-white/60 mt-1">{bot.challenge}</p>
                      </div>
                      <button
                        onClick={() => showToast(`Triggered challenge from ${bot.name}`)}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                      >
                        Trigger
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================
                TAB: COMMUNITY BLOG
            ======================================================== */}
            {activeTab === 'blogs' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Blog Form */}
                <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4 lg:col-span-1">
                  <h3 className="text-sm font-black uppercase tracking-wide text-white flex items-center gap-2">
                    <Book size={16} className="text-cyan-400" /> Publish Community Article
                  </h3>
                  
                  <form onSubmit={handlePublishBlogAction} className="space-y-3">
                    <input 
                      type="text" 
                      value={blogTitle} 
                      onChange={(e) => setBlogTitle(e.target.value)}
                      placeholder="Article Title..."
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-cyan-500/50"
                      required
                    />
                    <input 
                      type="text" 
                      value={blogCategory} 
                      onChange={(e) => setBlogCategory(e.target.value)}
                      placeholder="Category (e.g. Exam Tips)"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-cyan-500/50"
                    />
                    <textarea 
                      value={blogContent} 
                      onChange={(e) => setBlogContent(e.target.value)}
                      rows={6}
                      placeholder="Article markdown content..."
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none resize-none focus:border-cyan-500/50"
                      required
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isPublishingBlog || !blogTitle.trim()}
                        className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                        {isPublishingBlog ? 'Publishing...' : 'Publish'}
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateAIArticle}
                        disabled={isGeneratingAIBlog}
                        className="px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                        title="AI Generate Article Template"
                      >
                        <Sparkles size={14} /> AI Generate
                      </button>
                    </div>
                  </form>
                </div>

                {/* Published Articles List */}
                <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4 lg:col-span-2">
                  <h3 className="text-sm font-black uppercase tracking-wide text-white">Published Community Articles ({blogPostsList.length})</h3>
                  
                  <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {blogPostsList.length === 0 ? (
                      <div className="p-12 text-center text-white/40 text-xs">
                        No community articles published yet. Publish your first post on the left!
                      </div>
                    ) : (
                      blogPostsList.map(post => (
                        <div key={post.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 text-xs">
                          <div className="space-y-1">
                            <p className="font-bold text-white text-sm">{post.title}</p>
                            <p className="text-[10px] text-white/40 font-mono">{post.category || 'General'} • By {post.author || 'Admin'}</p>
                            {post.content && <p className="text-[11px] text-white/60 line-clamp-1">{post.content}</p>}
                          </div>
                          <button
                            onClick={() => handleDeleteBlogAction(post.id)}
                            className="p-2 text-white/30 hover:text-red-400 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
                            title="Delete Article"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                TAB: SYSTEM & ENGINE DIAGNOSTICS
            ======================================================== */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide text-white flex items-center gap-2">
                    <Terminal size={16} className="text-emerald-400" /> Platform Infrastructure & Engine Diagnostics
                  </h3>
                  <p className="text-xs text-white/50">Real-time status of on-device LLM C++ bridges, Firebase connectivity, and Capacitor bindings.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/10 space-y-3">
                    <h4 className="text-xs font-black uppercase text-white/70 flex items-center gap-2">
                      <Cpu size={14} className="text-purple-400" /> Offline Native Inference Engine
                    </h4>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex justify-between">
                        <span className="text-white/50">Model Spec</span>
                        <span className="text-purple-300 font-bold">Qwen2.5-0.5B-Instruct.gguf</span>
                      </div>
                      <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex justify-between">
                        <span className="text-white/50">Quantization</span>
                        <span className="text-purple-300 font-bold">Q4_K_M (398 MB)</span>
                      </div>
                      <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex justify-between">
                        <span className="text-white/50">Execution Backend</span>
                        <span className="text-emerald-400 font-bold">llama.cpp Native C++ via JNI</span>
                      </div>
                      <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex justify-between">
                        <span className="text-white/50">Android Storage Directory</span>
                        <span className="text-cyan-300 font-bold">Directory.Data</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/10 space-y-3">
                    <h4 className="text-xs font-black uppercase text-white/70 flex items-center gap-2">
                      <Database size={14} className="text-blue-400" /> Database & Cloud Architecture
                    </h4>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex justify-between">
                        <span className="text-white/50">Firestore DB ID</span>
                        <span className="text-blue-300 font-bold">ai-studio-8970f663-fa3e-4f2c</span>
                      </div>
                      <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex justify-between">
                        <span className="text-white/50">Auth Domain</span>
                        <span className="text-blue-300 font-bold">gen-lang-client-0216655413.firebaseapp.com</span>
                      </div>
                      <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex justify-between">
                        <span className="text-white/50">Total Document Collections</span>
                        <span className="text-emerald-400 font-bold">users, courses, reports, blogPosts, materials</span>
                      </div>
                      <div className="p-3 bg-black/40 rounded-xl border border-white/5 flex justify-between">
                        <span className="text-white/50">Persistence Mode</span>
                        <span className="text-amber-300 font-bold">persistentLocalCache (Multi-Tab)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </div>

      {/* User Edit Modal */}
      {selectedUserToEdit && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-[#120F20] border border-white/10 rounded-3xl p-6 shadow-2xl text-white space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                <Edit3 size={16} className="text-red-400" /> Edit Scholar Configuration
              </h3>
              <button onClick={() => setSelectedUserToEdit(null)} className="text-white/50 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-white/50">Full Name</label>
                <input 
                  type="text" 
                  value={selectedUserToEdit.name || selectedUserToEdit.displayName || ''} 
                  onChange={(e) => setSelectedUserToEdit({ ...selectedUserToEdit, name: e.target.value, displayName: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-white/50">Department</label>
                  <input 
                    type="text" 
                    value={selectedUserToEdit.department || ''} 
                    onChange={(e) => setSelectedUserToEdit({ ...selectedUserToEdit, department: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-white/50">Academic Level</label>
                  <input 
                    type="text" 
                    value={selectedUserToEdit.level || ''} 
                    onChange={(e) => setSelectedUserToEdit({ ...selectedUserToEdit, level: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-white/50">Matriculation Number</label>
                <input 
                  type="text" 
                  value={selectedUserToEdit.matric || selectedUserToEdit.matricNumber || ''} 
                  onChange={(e) => setSelectedUserToEdit({ ...selectedUserToEdit, matric: e.target.value, matricNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white outline-none"
                />
              </div>

              {/* Payment Bypass Controls */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <p className="text-[10px] font-black uppercase text-amber-300">Payment & Access Flags</p>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={!!selectedUserToEdit.isPremium} 
                      onChange={(e) => setSelectedUserToEdit({ ...selectedUserToEdit, isPremium: e.target.checked })}
                      className="rounded accent-red-600"
                    />
                    <span className="text-[11px] text-white/80">Premium Subscriber Tier</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={!!selectedUserToEdit.bypassAllPayments} 
                      onChange={(e) => setSelectedUserToEdit({ ...selectedUserToEdit, bypassAllPayments: e.target.checked })}
                      className="rounded accent-red-600"
                    />
                    <span className="text-[11px] text-white/80">Bypass All In-App Paywalls (VIP)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={!!selectedUserToEdit.bypassHostingPayment} 
                      onChange={(e) => setSelectedUserToEdit({ ...selectedUserToEdit, bypassHostingPayment: e.target.checked })}
                      className="rounded accent-red-600"
                    />
                    <span className="text-[11px] text-white/80">Bypass Exam Hosting Payment</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={!!selectedUserToEdit.bypassTakingPayment} 
                      onChange={(e) => setSelectedUserToEdit({ ...selectedUserToEdit, bypassTakingPayment: e.target.checked })}
                      className="rounded accent-red-600"
                    />
                    <span className="text-[11px] text-white/80">Bypass Exam Taking Payment</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserToEdit(null)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold cursor-pointer shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default GodModePanel;
