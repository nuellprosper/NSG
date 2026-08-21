import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, SlidersHorizontal, Bell, Heart, Star, BookOpen, 
  Download, ArrowRight, ChevronRight, X, Clock, CheckCircle2,
  FileText, Sparkles, Layers, Check, Calendar, Laptop, Users,
  BookMarked, HelpCircle, Flame, Award, ChevronDown, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CourseMaterial } from './CoursesPage';
import { FACULTIES, DEPARTMENTS } from '../constants/academic';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface HomePageProps {
  theme: 'light' | 'dark';
  user: any;
  currentUserData?: any;
  userNotes?: any[];
  finishedHistory?: any[];
  sessions?: any[];
  customCourses?: any[];
  unreadCount?: number;
  personalNotifications?: any[];
  setActiveTab: (tab: any) => void;
  setToolsSubTab?: (subTab: any) => void;
  setSelectedNote?: (note: any) => void;
  setImportedQuizNote?: (note: any) => void;
  setQuizTopic?: (topic: string) => void;
  setQuizDocuments?: (docs: any[]) => void;
  openCoursePreview?: (course: CourseMaterial) => void;
  openCoursesWithFilter?: (faculty: string, department: string) => void;
  setUserNotification?: (msg: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  theme,
  user,
  currentUserData,
  userNotes = [],
  finishedHistory = [],
  sessions = [],
  unreadCount = 0,
  personalNotifications = [],
  setActiveTab,
  setToolsSubTab,
  setSelectedNote,
  openCoursePreview,
  openCoursesWithFilter,
  setUserNotification
}) => {
  // Course State from Firestore
  const [courses, setCourses] = useState<CourseMaterial[]>([]);
  const [likedCourseIds, setLikedCourseIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('omni_liked_courses');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'courses' | 'notes' | 'quizzes' | 'exams' | 'timetable'>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [showAllHistoryModal, setShowAllHistoryModal] = useState(false);

  const filterContainerRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterContainerRef.current && !filterContainerRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch Firestore Courses
  useEffect(() => {
    try {
      const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list: CourseMaterial[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            const docs = data.attachedDocs || [];
            const imagePreviews: string[] = [];
            if (data.thumbnailUrl) imagePreviews.push(data.thumbnailUrl);
            if (Array.isArray(data.galleryImages)) imagePreviews.push(...data.galleryImages);
            docs.forEach((d: any) => {
              if (d.type === 'image' && (d.dataUrl || d.url)) {
                imagePreviews.push(d.dataUrl || d.url);
              }
            });
            if (imagePreviews.length === 0) {
              imagePreviews.push('https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80');
            }

            const reviewsList = data.reviews || [];
            let avgRating = data.rating || 5.0;
            if (reviewsList.length > 0) {
              const sum = reviewsList.reduce((acc: number, r: any) => acc + (r.rating || 5), 0);
              avgRating = Number((sum / reviewsList.length).toFixed(1));
            }

            return {
              id: docSnap.id,
              code: data.code || 'COURSE',
              title: data.title || data.name || 'Untitled Course',
              faculty: data.faculty || 'General Academic',
              department: data.department || 'General',
              level: data.level || '100L',
              thumbnailUrl: imagePreviews[0],
              galleryImages: imagePreviews,
              notes: data.notes || data.description || '',
              likesCount: data.likesCount || 0,
              rating: avgRating,
              reviewsCount: reviewsList.length || data.reviewsCount || 0,
              reviews: reviewsList,
              uploaderName: data.uploaderName || 'Omni Scholar',
              uploaderUid: data.uploaderUid,
              uploaderAvatar: data.uploaderAvatar,
              totalSizeBytes: data.totalSizeBytes || 8500000,
              attachedDocs: docs,
              createdAt: data.createdAt
            };
          });
          setCourses(list);
        } else {
          setCourses([]);
        }
      }, (err) => {
        console.error('Error fetching courses for home:', err);
      });
      return () => unsub();
    } catch (e) {
      console.error('Courses fetch setup error:', e);
    }
  }, []);

  // Timetable items for search
  const timetableItems = useMemo(() => {
    const items: any[] = [];
    try {
      const userKey = user?.uid || 'guest';
      const saved = localStorage.getItem(`omni_timetable_${userKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.lectureItems)) {
          parsed.lectureItems.forEach((lec: any) => {
            items.push({
              id: `lec-${lec.id}`,
              type: 'timetable',
              title: `${lec.courseCode || 'Lecture'}: ${lec.courseTitle || ''}`,
              subtitle: `${lec.day || 'Scheduled'} (${lec.startTime || ''} - ${lec.endTime || ''}) • ${lec.venue || 'Classroom'}`,
              timestamp: lec.startTime || 'Scheduled',
              original: lec
            });
          });
        }
        if (Array.isArray(parsed.examItems)) {
          parsed.examItems.forEach((ex: any) => {
            items.push({
              id: `exam-${ex.id}`,
              type: 'timetable',
              title: `Exam: ${ex.courseCode || ''} ${ex.courseTitle || ''}`,
              subtitle: `${ex.date || ''} (${ex.time || ''}) • Venue: ${ex.venue || ''}`,
              timestamp: ex.date || 'Exam date',
              original: ex
            });
          });
        }
      }
    } catch (e) {}
    return items;
  }, [user]);

  // Combined searchable items
  const allSearchableItems = useMemo(() => {
    const list: any[] = [];

    // 1. Quizzes from finishedHistory
    finishedHistory.forEach((h: any) => {
      const isCbt = h.type === 'cbt' || h.type === 'exam' || h.isCbt;
      list.push({
        id: `history-${h.id || Math.random()}`,
        type: isCbt ? 'exams' : 'quizzes',
        title: h.topic || (isCbt ? 'CBT Mock Examination' : 'Academic Quiz Practice'),
        subtitle: `${isCbt ? 'CBT Exam' : 'Quiz'} • Score: ${h.score ?? 0}/${h.totalQuestions || h.questions?.length || 0} (${Math.round(((h.score || 0) / (h.totalQuestions || h.questions?.length || 1)) * 100)}%)`,
        timestamp: h.timestamp || h.createdAt || new Date().toISOString(),
        raw: h
      });
    });

    // 2. Notes from userNotes
    userNotes.forEach((n: any) => {
      let contentStr = '';
      if (typeof n.content === 'string') {
        contentStr = n.content;
      } else if (n.content && typeof n.content === 'object') {
        contentStr = n.content.text || n.content.body || (Array.isArray(n.content) ? n.content.join(' ') : '');
      }
      list.push({
        id: `note-${n.id}`,
        type: 'notes',
        title: n.title || 'Untitled Note',
        subtitle: `Note • Category: ${n.category || 'General'} • ${contentStr ? contentStr.substring(0, 60) + '...' : 'No text content'}`,
        timestamp: n.createdAt || n.updatedAt || new Date().toISOString(),
        raw: n
      });
    });

    // 3. Courses from Firestore
    courses.forEach((c: any) => {
      list.push({
        id: `course-${c.id}`,
        type: 'courses',
        title: `${c.code}: ${c.title}`,
        subtitle: `Course • ${c.faculty} • ${c.department} • ⭐ ${c.rating || 5.0}`,
        timestamp: c.createdAt?.toDate ? c.createdAt.toDate().toISOString() : (c.createdAt || new Date().toISOString()),
        raw: c
      });
    });

    // 4. Timetable
    timetableItems.forEach((t: any) => {
      list.push({
        id: t.id,
        type: 'timetable',
        title: t.title,
        subtitle: t.subtitle,
        timestamp: t.timestamp,
        raw: t.original
      });
    });

    return list;
  }, [finishedHistory, userNotes, courses, timetableItems]);

  // Filtered Search Results (Real-time live updates)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() && selectedFilter === 'all') {
      return [];
    }

    const q = searchQuery.trim().toLowerCase();
    return allSearchableItems.filter((item: any) => {
      // Filter Type Match
      if (selectedFilter !== 'all' && item.type !== selectedFilter) {
        return false;
      }

      // Query Match
      if (!q) return true;
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchSubtitle = (item.subtitle || '').toLowerCase().includes(q);
      return matchTitle || matchSubtitle;
    }).slice(0, 15); // Show top 15 results
  }, [allSearchableItems, searchQuery, selectedFilter]);

  // Combined Chronological History for "See All History"
  const chronologicalHistory = useMemo(() => {
    const items: any[] = [];

    finishedHistory.forEach((h: any) => {
      const isCbt = h.type === 'cbt' || h.type === 'exam' || h.isCbt;
      items.push({
        id: h.id || `hist-${Math.random()}`,
        type: isCbt ? 'exam' : 'quiz',
        title: h.topic || (isCbt ? 'CBT Mock Exam' : 'Practice Quiz'),
        score: `${h.score ?? 0}/${h.totalQuestions || h.questions?.length || 0}`,
        date: h.timestamp || h.createdAt || new Date().toISOString(),
        raw: h
      });
    });

    userNotes.forEach((n: any) => {
      items.push({
        id: n.id,
        type: 'note',
        title: n.title || 'Saved Note',
        score: n.category || 'Note',
        date: n.createdAt || n.updatedAt || new Date().toISOString(),
        raw: n
      });
    });

    // Sort newest first
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [finishedHistory, userNotes]);

  // User Department & Faculty
  const userDept = (currentUserData?.department || '').trim();
  const userFaculty = (currentUserData?.faculty || '').trim();
  const userDisplayName = currentUserData?.displayName || user?.displayName || 'Scholar';

  // #CoursesForYou (Up to 10 courses under the user's department, newly uploaded first)
  const coursesForYou = useMemo(() => {
    if (!courses || courses.length === 0) return [];
    
    // If user has a department specified, prioritize courses in that department
    if (userDept) {
      const deptMatches = courses.filter(c => 
        (c.department && c.department.toLowerCase().includes(userDept.toLowerCase())) ||
        (userDept.toLowerCase().includes((c.department || '').toLowerCase()))
      );
      if (deptMatches.length > 0) {
        // Fallback fill with faculty or others to make up to 10
        const others = courses.filter(c => !deptMatches.some(m => m.id === c.id));
        return [...deptMatches, ...others].slice(0, 10);
      }
    }

    // If no department match or none specified, prioritize user faculty
    if (userFaculty) {
      const facultyMatches = courses.filter(c => 
        (c.faculty && c.faculty.toLowerCase().includes(userFaculty.toLowerCase())) ||
        (userFaculty.toLowerCase().includes((c.faculty || '').toLowerCase()))
      );
      if (facultyMatches.length > 0) {
        const others = courses.filter(c => !facultyMatches.some(m => m.id === c.id));
        return [...facultyMatches, ...others].slice(0, 10);
      }
    }

    // Default newest 10 courses
    return courses.slice(0, 10);
  }, [courses, userDept, userFaculty]);

  // Popular Courses (Courses with most likes / downloads / rating)
  const popularCourses = useMemo(() => {
    if (!courses || courses.length === 0) return [];
    return [...courses].sort((a, b) => {
      const scoreB = (b.likesCount || 0) * 2 + (b.rating || 5);
      const scoreA = (a.likesCount || 0) * 2 + (a.rating || 5);
      return scoreB - scoreA;
    }).slice(0, 8);
  }, [courses]);

  // Helper to extract the first user-uploaded preview image
  const getCourseThumbnail = (course: any) => {
    if (!course) return 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80';
    if (course.galleryImages && Array.isArray(course.galleryImages) && course.galleryImages.length > 0) {
      const userImg = course.galleryImages.find((img: string) => img && typeof img === 'string' && !img.includes('images.unsplash.com'));
      if (userImg) return userImg;
      return course.galleryImages[0];
    }
    if (course.attachedDocs && Array.isArray(course.attachedDocs)) {
      const imgDoc = course.attachedDocs.find((d: any) => d.type === 'image' && (d.dataUrl || d.url));
      if (imgDoc) return imgDoc.dataUrl || imgDoc.url;
    }
    return course.thumbnailUrl || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80';
  };

  // Handle Search Result Item Click
  const handleItemClick = (item: any) => {
    setIsSearchFocused(false);
    setSearchQuery('');
    
    if (item.type === 'courses') {
      if (openCoursePreview) {
        openCoursePreview(item.raw);
      } else {
        setActiveTab('courses');
      }
    } else if (item.type === 'notes') {
      if (setSelectedNote) {
        setSelectedNote(item.raw);
      }
      setActiveTab('tools');
      if (setToolsSubTab) setToolsSubTab('notebook');
    } else if (item.type === 'quizzes') {
      setActiveTab('quiz_history');
    } else if (item.type === 'exams') {
      setActiveTab('exam_history');
    } else if (item.type === 'timetable') {
      setActiveTab('tools');
      if (setToolsSubTab) setToolsSubTab('timetable');
    }
  };

  // Handle See All on #CoursesForYou
  const handleSeeAllCoursesForYou = () => {
    if (openCoursesWithFilter) {
      openCoursesWithFilter(userFaculty || 'ALL', userDept || '');
    } else {
      setActiveTab('courses');
    }
  };

  // Toggle Like on Course
  const toggleLike = (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    setLikedCourseIds(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      try {
        localStorage.setItem('omni_liked_courses', JSON.stringify(Array.from(next)));
      } catch (err) {}
      return next;
    });
  };

  const totalUnread = unreadCount + (personalNotifications || []).filter((n: any) => !n.read).length;

  return (
    <div 
      id="home-page-container" 
      className={`min-h-screen pb-48 sm:pb-52 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#0B0813] text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* 1. SIGNATURE LIGHT PURPLE TOP PATCH (Smooth natural scrolling header with generous viewport for content) */}
      <div 
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        className="relative z-20 bg-gradient-to-b from-purple-600 via-purple-600 to-purple-500 text-white pb-6 px-4 sm:px-6 rounded-b-[2.5rem] shadow-xl overflow-visible"
      >
        {/* Subtle decorative background topography contour lines */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden rounded-b-[2.5rem]">
          <svg className="w-full h-full" viewBox="0 0 400 200" fill="none" preserveAspectRatio="none">
            <path d="M0,50 Q100,20 200,60 T400,30" stroke="white" strokeWidth="1.5" />
            <path d="M0,100 Q120,70 240,110 T400,80" stroke="white" strokeWidth="1.5" />
            <path d="M0,150 Q140,120 280,160 T400,130" stroke="white" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-3">
          {/* Top Bar: User Display Name & Avatar on Left, Notification Button on Right */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {/* User Profile Info (Replaces Location) */}
            <button
              id="user-profile-header-btn"
              type="button"
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
            >
              {/* Profile Avatar */}
              <div className="relative shrink-0">
                {currentUserData?.photoURL || user?.photoURL ? (
                  <img
                    src={currentUserData?.photoURL || user?.photoURL}
                    alt={userDisplayName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-white/80 shadow-md group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/80 text-white font-black text-sm flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    {userDisplayName.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-purple-600 rounded-full" />
              </div>

              {/* User Names & Department */}
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-purple-100/90 leading-tight">
                  Welcome back,
                </p>
                <div className="flex items-center gap-1">
                  <h2 className="text-base font-black text-white tracking-tight truncate max-w-[200px] sm:max-w-[280px]">
                    {userDisplayName}
                  </h2>
                  <ChevronDown size={14} className="text-purple-200/80 shrink-0 group-hover:translate-y-0.5 transition-transform" />
                </div>
                {(userDept || userFaculty) && (
                  <p className="text-[10px] font-semibold text-purple-200/80 truncate max-w-[200px] sm:max-w-[260px]">
                    {userDept || userFaculty}
                  </p>
                )}
              </div>
            </button>

            {/* Notification Button on Right (Matching position and color in screenshot) */}
            <button
              id="home-notifications-btn"
              type="button"
              onClick={() => setActiveTab('notifications')}
              className="relative w-10 h-10 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
              title="Notifications"
            >
              <Bell size={19} className="text-white" />
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[9px] font-black text-purple-700 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-purple-600 animate-pulse">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar & Filter Button Container */}
          <div ref={searchContainerRef} className="relative z-30 flex items-center gap-2.5 pt-1">
            {/* Search Input Container */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-400">
                <Search size={18} />
              </div>
              <input
                id="omni-global-search-input"
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                placeholder="Search Here"
                className="w-full pl-10 pr-9 py-3 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium shadow-lg outline-none focus:ring-2 focus:ring-purple-300 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter Button */}
            <div ref={filterContainerRef} className="relative">
              <button
                id="home-search-filter-btn"
                type="button"
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer ${
                  isFilterDropdownOpen || selectedFilter !== 'all'
                    ? 'bg-white text-purple-700 font-bold'
                    : 'bg-white text-purple-600 hover:bg-purple-50'
                }`}
                title="Filter Search Scope"
              >
                <SlidersHorizontal size={18} />
              </button>

              {/* Filter Popover Dropdown (Matches Course Page Filter Style) */}
              <AnimatePresence>
                {isFilterDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 top-full mt-2 w-64 rounded-2xl p-3 shadow-2xl border z-[110] ${
                      theme === 'dark' ? 'bg-[#181427] border-purple-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-purple-500/20">
                      <span className="text-xs font-black uppercase tracking-wider text-purple-500">Search In</span>
                      <span className="text-[10px] text-slate-400">Select Scope</span>
                    </div>

                    <div className="space-y-1">
                      {[
                        { id: 'all', label: 'All Items' },
                        { id: 'courses', label: 'Courses' },
                        { id: 'notes', label: 'Notes' },
                        { id: 'quizzes', label: 'Quizzes' },
                        { id: 'exams', label: 'Exams' },
                        { id: 'timetable', label: 'Time Table' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedFilter(item.id as any);
                            setIsFilterDropdownOpen(false);
                            setIsSearchFocused(true);
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                            selectedFilter === item.id
                              ? 'bg-purple-600 text-white shadow-md'
                              : theme === 'dark'
                              ? 'hover:bg-white/10 text-white/80'
                              : 'hover:bg-purple-50 text-slate-700'
                          }`}
                        >
                          <span>{item.label}</span>
                          {selectedFilter === item.id && <Check size={14} className="stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* REAL-TIME LIVE SEARCH RESULTS DROPDOWN (High z-index to overlay above all cards and buttons) */}
            <AnimatePresence>
              {(isSearchFocused && (searchQuery.trim() || selectedFilter !== 'all')) && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={`absolute left-0 right-0 top-full mt-2 rounded-2xl p-3 shadow-2xl border max-h-80 overflow-y-auto z-[120] ${
                    theme === 'dark' ? 'bg-[#181427] border-purple-500/40 text-white shadow-purple-950/60' : 'bg-white border-slate-200 text-slate-900 shadow-slate-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-purple-500/20 text-[11px] font-bold text-purple-500">
                    <span>Search Results ({searchResults.length})</span>
                    {selectedFilter !== 'all' && (
                      <span className="text-[9px] bg-purple-500/20 px-2 py-0.5 rounded-full uppercase">
                        Filtered: {selectedFilter}
                      </span>
                    )}
                  </div>

                  {searchResults.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No matching items found for "{searchQuery}".
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {searchResults.map((res: any) => (
                        <button
                          key={res.id}
                          type="button"
                          onClick={() => handleItemClick(res)}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer group ${
                            theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-purple-50'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0 mt-0.5">
                            {res.type === 'courses' && <BookOpen size={16} />}
                            {res.type === 'notes' && <FileText size={16} />}
                            {res.type === 'quizzes' && <Sparkles size={16} />}
                            {res.type === 'exams' && <Award size={16} />}
                            {res.type === 'timetable' && <Calendar size={16} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                              {res.title}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-white/50 truncate">
                              {res.subtitle}
                            </p>
                          </div>
                          <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform mt-1 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* MAIN BODY CONTENT */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 pt-5">
        
        {/* 2. #COURSESFORYOU SECTION (Replaces #SpecialForYou) */}
        <div id="courses-for-you-section" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5">
              <span className="text-purple-600 dark:text-purple-400">#</span>
              <span>CoursesForYou</span>
            </h3>
            <button
              id="see-all-courses-for-you-btn"
              type="button"
              onClick={handleSeeAllCoursesForYou}
              className="text-xs font-black text-purple-600 dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>See All</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Horizontal Scrollable Course Cards (Up to 10 courses) */}
          <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory">
            {coursesForYou.length === 0 ? (
              <div className={`w-full p-6 rounded-3xl border text-center space-y-2 ${
                theme === 'dark' ? 'bg-[#13111C] border-purple-500/20 text-white/70' : 'bg-white border-slate-200 text-slate-600'
              }`}>
                <BookOpen size={28} className="mx-auto text-purple-500" />
                <p className="text-xs font-bold">No departmental courses available yet</p>
                <p className="text-[10px] text-slate-400">Tap See All to explore the complete catalog</p>
              </div>
            ) : (
              coursesForYou.map((course) => (
                <motion.div
                  key={course.id}
                  onClick={() => openCoursePreview ? openCoursePreview(course) : setActiveTab('courses')}
                  whileHover={{ y: -3 }}
                  className="w-[280px] sm:w-[320px] shrink-0 h-[175px] sm:h-[190px] rounded-3xl relative overflow-hidden shadow-lg border border-purple-500/20 snap-start cursor-pointer group flex flex-col justify-between p-4"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%), url(${getCourseThumbnail(course)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* Top Badge: Department / Level */}
                  <div className="flex items-center justify-between z-10">
                    <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                      {course.level || 'Recommended'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => toggleLike(e, course.id)}
                      className={`w-7 h-7 rounded-full backdrop-blur-md flex items-center justify-center transition-transform active:scale-90 ${
                        likedCourseIds.has(course.id) ? 'bg-red-500 text-white' : 'bg-black/40 text-white hover:bg-black/60'
                      }`}
                    >
                      <Heart size={13} fill={likedCourseIds.has(course.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Bottom Info & Claim / View Button */}
                  <div className="z-10 flex items-end justify-between gap-2">
                    <div className="text-white space-y-0.5 max-w-[70%]">
                      <p className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                        {course.code}
                      </p>
                      <h4 className="text-sm sm:text-base font-black leading-tight line-clamp-2">
                        {course.title}
                      </h4>
                      <p className="text-[9px] text-white/70 truncate">
                        {course.faculty} • {course.department}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-md transition-all active:scale-95 shrink-0"
                    >
                      View
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* 3. HISTORY SECTION (Replaces Category) */}
        <div id="home-history-section" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black tracking-tight">
              History
            </h3>
            <button
              id="see-all-history-btn"
              type="button"
              onClick={() => setShowAllHistoryModal(true)}
              className="text-xs font-black text-purple-600 dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>See All</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* 4 Circle Category / History Action Buttons */}
          <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
            {/* 1. QUIZ (Icon matching dedicated study from screenshot, in light purple) */}
            <button
              id="history-action-quiz-btn"
              type="button"
              onClick={() => setActiveTab('quiz_history')}
              className="flex flex-col items-center gap-2 group cursor-pointer text-center"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-300/40 dark:border-purple-800/50 flex items-center justify-center shadow-md group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all active:scale-95">
                <Laptop size={24} className="stroke-[2.2]" />
              </div>
              <span className="text-xs font-black tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Quiz
              </span>
            </button>

            {/* 2. EXAM (Replaces Conference; in light purple) */}
            <button
              id="history-action-exam-btn"
              type="button"
              onClick={() => setActiveTab('exam_history')}
              className="flex flex-col items-center gap-2 group cursor-pointer text-center"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-300/40 dark:border-purple-800/50 flex items-center justify-center shadow-md group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all active:scale-95">
                <Users size={24} className="stroke-[2.2]" />
              </div>
              <span className="text-xs font-black tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Exam
              </span>
            </button>

            {/* 3. NOTES (Replaces Private; in light purple) */}
            <button
              id="history-action-notes-btn"
              type="button"
              onClick={() => setActiveTab('notes_history')}
              className="flex flex-col items-center gap-2 group cursor-pointer text-center"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-300/40 dark:border-purple-800/50 flex items-center justify-center shadow-md group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all active:scale-95">
                <BookMarked size={24} className="stroke-[2.2]" />
              </div>
              <span className="text-xs font-black tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Notes
              </span>
            </button>

            {/* 4. COURSES (Replaces Open Spac.; in light purple) */}
            <button
              id="history-action-courses-btn"
              type="button"
              onClick={() => setActiveTab('courses')}
              className="flex flex-col items-center gap-2 group cursor-pointer text-center"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-300/40 dark:border-purple-800/50 flex items-center justify-center shadow-md group-hover:scale-105 group-hover:bg-purple-600 group-hover:text-white transition-all active:scale-95">
                <Layers size={24} className="stroke-[2.2]" />
              </div>
              <span className="text-xs font-black tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Courses
              </span>
            </button>
          </div>
        </div>

        {/* 4. POPULAR SECTION (Horizontal Scrollable matching Courses For You) */}
        <div id="home-popular-section" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black tracking-tight">
              Popular
            </h3>
            <button
              id="see-all-popular-btn"
              type="button"
              onClick={() => setActiveTab('courses')}
              className="text-xs font-black text-purple-600 dark:text-purple-400 hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>See All</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Popular Course Cards Horizontal Scroll */}
          <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x snap-mandatory">
            {popularCourses.length === 0 ? (
              <div className={`w-full p-6 rounded-3xl border text-center space-y-2 ${
                theme === 'dark' ? 'bg-[#13111C] border-purple-500/20 text-white/70' : 'bg-white border-slate-200 text-slate-600'
              }`}>
                <Star size={28} className="mx-auto text-amber-400" />
                <p className="text-xs font-bold">Explore all available courses in the catalog</p>
              </div>
            ) : (
              popularCourses.map((course) => (
                <motion.div
                  key={course.id}
                  onClick={() => openCoursePreview ? openCoursePreview(course) : setActiveTab('courses')}
                  whileHover={{ y: -3 }}
                  className="w-[280px] sm:w-[320px] shrink-0 h-[175px] sm:h-[190px] rounded-3xl relative overflow-hidden shadow-lg border border-purple-500/20 snap-start cursor-pointer group flex flex-col justify-between p-4"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%), url(${getCourseThumbnail(course)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* Top Badge: Rating / Level & Like Button */}
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <Star size={11} className="text-amber-500 fill-amber-500" />
                        <span>{course.rating || 5.0}</span>
                      </span>
                      <span className="bg-purple-600/80 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                        {course.level || '100L'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => toggleLike(e, course.id)}
                      className={`w-7 h-7 rounded-full backdrop-blur-md flex items-center justify-center transition-transform active:scale-90 ${
                        likedCourseIds.has(course.id) ? 'bg-red-500 text-white' : 'bg-black/40 text-white hover:bg-black/60'
                      }`}
                    >
                      <Heart size={13} fill={likedCourseIds.has(course.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Bottom Info & View Button */}
                  <div className="z-10 flex items-end justify-between gap-2">
                    <div className="text-white space-y-0.5 max-w-[70%]">
                      <p className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                        {course.code}
                      </p>
                      <h4 className="text-sm sm:text-base font-black leading-tight line-clamp-2">
                        {course.title}
                      </h4>
                      <p className="text-[9px] text-white/70 truncate">
                        {course.faculty} • {course.department}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-md transition-all active:scale-95 shrink-0"
                    >
                      View
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 5. "SEE ALL HISTORY" MODAL (Ordered chronologically, truncated with "..." so it never expands) */}
      <AnimatePresence>
        {showAllHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
                theme === 'dark' ? 'bg-[#151221] border-purple-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-purple-500/20 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black tracking-tight">Academic History</h3>
                  <p className="text-[11px] text-slate-400 dark:text-white/50">Chronological history in order of time</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllHistoryModal(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal List Items */}
              <div className="p-3 sm:p-4 overflow-y-auto space-y-2 flex-1">
                {chronologicalHistory.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No history records found yet.
                  </div>
                ) : (
                  chronologicalHistory.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setShowAllHistoryModal(false);
                        if (item.type === 'quiz') setActiveTab('quiz_history');
                        else if (item.type === 'exam') setActiveTab('exam_history');
                        else if (item.type === 'note') setActiveTab('notes_history');
                      }}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                        theme === 'dark' 
                          ? 'bg-[#1c182d] border-purple-500/20 hover:border-purple-400/50 hover:bg-[#231e38]' 
                          : 'bg-slate-50 border-slate-200 hover:border-purple-400 hover:bg-purple-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
                          {item.type === 'quiz' && <Sparkles size={16} />}
                          {item.type === 'exam' && <Award size={16} />}
                          {item.type === 'note' && <BookMarked size={16} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          {/* Truncated Title with ... to never expand outside screen */}
                          <p className="text-xs font-black tracking-tight truncate max-w-[220px] sm:max-w-[280px]">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-white/50 truncate">
                            {item.score} • {new Date(item.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
