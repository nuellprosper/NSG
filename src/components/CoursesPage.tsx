import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, SlidersHorizontal, Plus, Heart, Star, BookOpen, Download, 
  FileText, Image as ImageIcon, X, ChevronDown, ArrowLeft, RefreshCw,
  Sparkles, Share2, Send, MessageSquare, ChevronRight, CheckCircle2,
  Paperclip, FileCheck, Layers, Eye, Check, Zap, Trash2, AlertCircle,
  ExternalLink, Globe, ShieldCheck, Lock, Clock, BookMarked
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FACULTIES, DEPARTMENTS } from '../constants/academic';
import { 
  collection, addDoc, doc, setDoc, updateDoc, increment, deleteDoc,
  serverTimestamp, onSnapshot, query, orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { getOpenStaxCoursesForCatalog, matchOrSynthesizeOpenStaxCourse } from '../data/openstaxCatalog';
import { fetchAndStreamBinaryFile, saveBinaryAsset, triggerFileDownload, getBinaryAsset } from '../utils/assetStorage';
import { parseCourseAssets } from '../utils/courseAssetParser';
import { resourceSearchOrchestrator } from '../services/resources/orchestrator';
import { downloadService } from '../services/download/downloadService';
import { localManifest } from '../services/resources/localManifest';
import { ResourceResult, ResourceAsset } from '../services/resources/types';
import { getSafeHeaderPaddingTop, getSafeBottomPadding } from '../utils/safeArea';

export interface CourseReview {
  id: string;
  userName: string;
  userAvatar?: string;
  userUid?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AttachedDoc {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'doc' | string;
  size: number;
  dataUrl?: string;
  url?: string;
  verifiedPdfUrl?: string;
  license?: string;
  lastVerified?: string;
}

export interface CourseMaterial {
  id: string;
  code: string;
  title: string;
  faculty: string;
  department: string;
  level?: string;
  semester?: string;
  thumbnailUrl?: string;
  galleryImages?: string[];
  notes: string;
  likesCount: number;
  rating?: number;
  reviewsCount?: number;
  uploaderName?: string;
  uploaderUid?: string;
  uploaderAvatar?: string;
  totalSizeBytes?: number;
  createdAt?: any;
  attachedDocs?: AttachedDoc[];
  reviews?: CourseReview[];
  source?: 'openstax' | 'community' | 'admin' | 'gutendex' | 'openlibrary';
  isOpenStax?: boolean;
  license?: string;
  isNonCommercial?: boolean;
  lastVerified?: string;
  verifiedPdfUrl?: string;
  openstaxPageUrl?: string;
  rexReaderUrl?: string;
  rexWebUrl?: string;
  status?: 'pending' | 'approved' | 'rejected';
  driveFileId?: string;
  capabilities?: {
    downloadable: boolean;
    readableOnline: boolean;
    borrowable: boolean;
  };
  assets?: ResourceAsset[];
}

export interface CoursesPageProps {
  theme: 'light' | 'dark';
  user: any;
  userNotes?: any[];
  setUserNotification: (msg: string) => void;
  generateQuiz?: (topic: string, count: number, difficulty: string, startImmediately: boolean) => void;
  setActiveTab?: (tab: any) => void;
  setToolsSubTab?: (subTab: any) => void;
  setSelectedNote?: (note: any) => void;
  setImportedQuizNote?: (note: any) => void;
  setQuizTopic?: (topic: string) => void;
  setQuizDocuments?: (docs: any[]) => void;
  onBack?: () => void;
  initialSelectedCourse?: CourseMaterial | null;
  initialFacultyFilter?: string | null;
  initialDepartmentFilter?: string | null;
}

export const CoursesPage: React.FC<CoursesPageProps> = ({
  theme,
  user,
  userNotes = [],
  setUserNotification,
  generateQuiz,
  setActiveTab,
  setToolsSubTab,
  setSelectedNote,
  setImportedQuizNote,
  setQuizTopic,
  setQuizDocuments,
  onBack,
  initialSelectedCourse = null,
  initialFacultyFilter = null,
  initialDepartmentFilter = null
}) => {
  // Course List State (populated from OpenStax starter catalog, local storage and real-time Firestore)
  const [courses, setCourses] = useState<CourseMaterial[]>(() => {
    try {
      const openstaxCourses = getOpenStaxCoursesForCatalog();
      const localSaved = JSON.parse(localStorage.getItem('omni_user_uploaded_courses') || '[]');
      const sharedSaved = JSON.parse(localStorage.getItem('shared_user_courses') || '[]');
      const cached = JSON.parse(localStorage.getItem('omni_cached_courses') || '[]');
      const combined = [...openstaxCourses, ...localSaved, ...sharedSaved, ...cached];
      const seen = new Set<string>();
      return combined.filter((c: any) => {
        if (!c || !c.id) return false;
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });
    } catch (e) {
      return getOpenStaxCoursesForCatalog();
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveSearching, setIsLiveSearching] = useState(false);
  const [hasDiscoveredLive, setHasDiscoveredLive] = useState(false);
  const [likedCourseIds, setLikedCourseIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('omni_liked_courses');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  // Selected Course for Preview View (matching screenshot design)
  const [selectedCourse, setSelectedCourse] = useState<CourseMaterial | null>(initialSelectedCourse);
  const [courseDetailTab, setCourseDetailTab] = useState<'about' | 'gallery' | 'review'>('about');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isReadMore, setIsReadMore] = useState(false);
  const [fullImageView, setFullImageView] = useState<string | null>(null);

  // Delete Course State (Unified Confirmation Dialog)
  const [courseToDelete, setCourseToDelete] = useState<CourseMaterial | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);
  const [activeDeleteCardId, setActiveDeleteCardId] = useState<string | null>(null);

  // Long press timer refs for 0.5s tap and hold & scroll detection
  const longPressTimerRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const longPressFiredRef = useRef<{ [key: string]: boolean }>({});
  const touchStartPosRef = useRef<{ [key: string]: { x: number; y: number } }>({});
  const touchStartTimeRef = useRef<{ [key: string]: number }>({});
  const touchMovedRef = useRef<{ [key: string]: boolean }>({});
  const suppressClickUntilRef = useRef<number>(0);
  const isPageScrollingRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<any>(null);
  const selectedCourseRef = useRef<CourseMaterial | null>(selectedCourse);

  useEffect(() => {
    selectedCourseRef.current = selectedCourse;
  }, [selectedCourse]);

  // Global scroll listener to ensure scrolling gestures never trigger accidental card preview opens
  useEffect(() => {
    const onScroll = () => {
      isPageScrollingRef.current = true;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isPageScrollingRef.current = false;
      }, 180);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(50);
      } catch (e) {}
    }
  };

  const openCoursePreview = (course: CourseMaterial) => {
    setSelectedCourse(course);
    setCourseDetailTab('about');
    setActiveImageIndex(0);
    setIsReadMore(false);
  };

  const handleCardTouchStart = (course: CourseMaterial, e?: React.TouchEvent | React.MouseEvent) => {
    longPressFiredRef.current[course.id] = false;
    touchMovedRef.current[course.id] = false;
    touchStartTimeRef.current[course.id] = Date.now();

    if (e && 'touches' in e && e.touches.length > 0) {
      touchStartPosRef.current[course.id] = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    } else if (e && 'clientX' in e) {
      touchStartPosRef.current[course.id] = {
        x: (e as React.MouseEvent).clientX,
        y: (e as React.MouseEvent).clientY
      };
    }

    if (longPressTimerRef.current[course.id]) {
      clearTimeout(longPressTimerRef.current[course.id]);
    }

    longPressTimerRef.current[course.id] = setTimeout(() => {
      // Only fire long press if the user has not moved or scrolled
      if (!touchMovedRef.current[course.id] && !isPageScrollingRef.current) {
        longPressFiredRef.current[course.id] = true;
        triggerHaptic();
        
        const canDelete = course.uploaderUid === user?.uid || 
          user?.email === 'nuellkelechi@gmail.com' ||
          !course.uploaderUid;
          
        if (canDelete) {
          setActiveDeleteCardId(course.id);
        } else {
          if (setUserNotification) {
            setUserNotification("🔒 Only the uploader can delete this course.");
          }
        }
      }
    }, 500);
  };

  const handleCardTouchMove = (courseId: string, e: React.TouchEvent | React.MouseEvent) => {
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    if (touchStartPosRef.current[courseId]) {
      const dx = Math.abs(clientX - touchStartPosRef.current[courseId].x);
      const dy = Math.abs(clientY - touchStartPosRef.current[courseId].y);
      // Increased threshold to 12px to clearly distinguish deliberate taps from scroll gestures
      if (dx > 12 || dy > 12) {
        touchMovedRef.current[courseId] = true;
        if (longPressTimerRef.current[courseId]) {
          clearTimeout(longPressTimerRef.current[courseId]);
          delete longPressTimerRef.current[courseId];
        }
      }
    }
  };

  const handleCardTouchEnd = (course: CourseMaterial, e?: React.TouchEvent | React.MouseEvent) => {
    if (longPressTimerRef.current[course.id]) {
      clearTimeout(longPressTimerRef.current[course.id]);
      delete longPressTimerRef.current[course.id];
    }

    // If the page was scrolling or user moved finger, DO NOT open the preview
    if (isPageScrollingRef.current) {
      touchMovedRef.current[course.id] = true;
      return;
    }

    if (longPressFiredRef.current[course.id]) {
      return;
    }

    if (touchMovedRef.current[course.id]) {
      return;
    }

    // Verify touch duration: a crisp tap is quick (under 400ms)
    const startTime = touchStartTimeRef.current[course.id] || 0;
    const duration = Date.now() - startTime;
    if (duration > 450) {
      return;
    }

    // Dismiss active delete overlay if present
    if (activeDeleteCardId === course.id) {
      setActiveDeleteCardId(null);
      return;
    }
    if (activeDeleteCardId) {
      setActiveDeleteCardId(null);
      return;
    }

    // Genuine stationary tap confirmed: open preview and suppress secondary synthetic click
    suppressClickUntilRef.current = Date.now() + 500;
    openCoursePreview(course);
  };

  const handleCardTouchCancel = (courseId: string) => {
    touchMovedRef.current[courseId] = true;
    if (longPressTimerRef.current[courseId]) {
      clearTimeout(longPressTimerRef.current[courseId]);
      delete longPressTimerRef.current[courseId];
    }
  };

  const handleCardClick = (course: CourseMaterial, e: React.MouseEvent) => {
    // If touch was already handled or click should be suppressed, ignore
    if (Date.now() < suppressClickUntilRef.current) {
      return;
    }

    if (isPageScrollingRef.current) {
      return;
    }

    if (longPressFiredRef.current[course.id]) {
      longPressFiredRef.current[course.id] = false;
      return;
    }

    if (touchMovedRef.current[course.id]) {
      touchMovedRef.current[course.id] = false;
      return;
    }

    if (activeDeleteCardId === course.id) {
      setActiveDeleteCardId(null);
      return;
    }
    if (activeDeleteCardId) {
      setActiveDeleteCardId(null);
      return;
    }

    openCoursePreview(course);
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    setIsDeletingCourse(true);
    try {
      // 1. Delete from Firestore
      await deleteDoc(doc(db, 'courses', courseToDelete.id));
      
      // 2. Remove from local state
      setCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
      if (selectedCourse?.id === courseToDelete.id) {
        setSelectedCourse(null);
      }
      
      // 3. Remove from localStorage cache
      try {
        const localSaved = JSON.parse(localStorage.getItem('omni_user_uploaded_courses') || '[]');
        localStorage.setItem('omni_user_uploaded_courses', JSON.stringify(localSaved.filter((c: any) => c.id !== courseToDelete.id)));
        const sharedSaved = JSON.parse(localStorage.getItem('shared_user_courses') || '[]');
        localStorage.setItem('shared_user_courses', JSON.stringify(sharedSaved.filter((c: any) => c.id !== courseToDelete.id)));
        const cached = JSON.parse(localStorage.getItem('omni_cached_courses') || '[]');
        localStorage.setItem('omni_cached_courses', JSON.stringify(cached.filter((c: any) => c.id !== courseToDelete.id)));
      } catch (e) {}

      triggerHaptic();
      if (setUserNotification) {
        setUserNotification(`🗑️ Successfully deleted ${courseToDelete.code}`);
      }
      setShowDeleteConfirm(false);
      setCourseToDelete(null);
      setActiveDeleteCardId(null);
    } catch (err: any) {
      console.warn("Firestore delete notice:", err);
      // Fallback local cleanup
      setCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
      if (selectedCourse?.id === courseToDelete.id) {
        setSelectedCourse(null);
      }
      try {
        const localSaved = JSON.parse(localStorage.getItem('omni_user_uploaded_courses') || '[]');
        localStorage.setItem('omni_user_uploaded_courses', JSON.stringify(localSaved.filter((c: any) => c.id !== courseToDelete.id)));
        const sharedSaved = JSON.parse(localStorage.getItem('shared_user_courses') || '[]');
        localStorage.setItem('shared_user_courses', JSON.stringify(sharedSaved.filter((c: any) => c.id !== courseToDelete.id)));
        const cached = JSON.parse(localStorage.getItem('omni_cached_courses') || '[]');
        localStorage.setItem('omni_cached_courses', JSON.stringify(cached.filter((c: any) => c.id !== courseToDelete.id)));
      } catch (e) {}
      if (setUserNotification) {
        setUserNotification(`Course removed.`);
      }
      setShowDeleteConfirm(false);
      setCourseToDelete(null);
      setActiveDeleteCardId(null);
    } finally {
      setIsDeletingCourse(false);
    }
  };

  // Update selected course if initialSelectedCourse prop changes
  useEffect(() => {
    if (initialSelectedCourse) {
      setSelectedCourse(initialSelectedCourse);
    }
  }, [initialSelectedCourse]);

  // Review Form in Course Preview
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Download state & animation
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccessModal, setDownloadSuccessModal] = useState<string | null>(null);

  // Filter Drawer State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<string>(initialFacultyFilter || 'ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string>(initialDepartmentFilter || '');

  useEffect(() => {
    if (initialFacultyFilter) {
      setSelectedFaculty(initialFacultyFilter);
    }
    if (initialDepartmentFilter !== null && initialDepartmentFilter !== undefined) {
      setSelectedDepartment(initialDepartmentFilter);
    }
  }, [initialFacultyFilter, initialDepartmentFilter]);
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'likes' | 'rating' | 'az' | 'newest'>('newest');

  // Upload Content Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    code: '',
    title: '',
    faculty: FACULTIES[0] || 'Faculty of Physical Sciences',
    department: '',
    level: '100L',
    notes: '',
    thumbnailUrl: ''
  });
  const [attachedFiles, setAttachedFiles] = useState<{
    id: string;
    file: File;
    name: string;
    type: 'pdf' | 'image' | 'doc' | 'docx';
    size: number;
    previewUrl?: string;
    dataUrl?: string;
  }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingAiNotes, setIsGeneratingAiNotes] = useState(false);

  // Helper to convert and compress image files to persistent lightweight Data URLs (under 50KB each)
  const convertImageToDataUrl = (file: File, maxWidth = 800, quality = 0.65): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (!result) return resolve('');
        
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const maxDim = maxWidth;
          
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedDataUrl);
          } else {
            resolve(result);
          }
        };
        img.onerror = () => resolve(result);
        img.src = result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Sync liked courses with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('omni_liked_courses', JSON.stringify(Array.from(likedCourseIds)));
    } catch (e) {}
  }, [likedCourseIds]);

  // Fetch Firestore Courses in real-time
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'courses'), (snapshot) => {
        if (!snapshot.empty) {
          const firestoreCourses: CourseMaterial[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            const docs: AttachedDoc[] = data.attachedDocs || [];
            const calculatedSize = docs.reduce((acc, curr) => acc + (curr.size || 0), 0);
            
            // Prioritize user-uploaded images over default unsplash placeholders
            const userUploadedImages: string[] = [];

            // 1. From galleryImages
            if (Array.isArray(data.galleryImages)) {
              data.galleryImages.forEach((img: any) => {
                if (img && typeof img === 'string' && !img.includes('images.unsplash.com') && !userUploadedImages.includes(img)) {
                  userUploadedImages.push(img);
                }
              });
            }

            // 2. From attachedDocs
            docs.forEach(d => {
              if (d.type === 'image' && (d.dataUrl || d.url)) {
                const src = d.dataUrl || d.url!;
                if (!userUploadedImages.includes(src)) {
                  userUploadedImages.push(src);
                }
              }
            });

            // 3. From thumbnailUrl if it's a real user image
            if (data.thumbnailUrl && typeof data.thumbnailUrl === 'string' && !data.thumbnailUrl.includes('images.unsplash.com') && !userUploadedImages.includes(data.thumbnailUrl)) {
              userUploadedImages.unshift(data.thumbnailUrl);
            }

            // Final previews list
            const fallbackUnsplash = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80';
            const finalGallery = userUploadedImages.length > 0
              ? userUploadedImages
              : (Array.isArray(data.galleryImages) && data.galleryImages.length > 0
                  ? data.galleryImages
                  : (data.thumbnailUrl ? [data.thumbnailUrl] : [fallbackUnsplash]));

            const primaryThumb = userUploadedImages.length > 0
              ? userUploadedImages[0]
              : (data.thumbnailUrl || finalGallery[0]);

            // Calculate rating dynamically from reviews
            const reviewsList: CourseReview[] = data.reviews || [];
            let avgRating = data.rating || 5.0;
            if (reviewsList.length > 0) {
              const sum = reviewsList.reduce((acc, r) => acc + (r.rating || 5), 0);
              avgRating = Number((sum / reviewsList.length).toFixed(1));
            }

            return {
              id: docSnap.id,
              code: data.code || 'COURSE',
              title: data.title || data.name || 'Untitled Course',
              faculty: data.faculty || 'General Academic',
              department: data.department || 'General',
              level: data.level || '100L',
              semester: data.semester || 'First Semester',
              thumbnailUrl: primaryThumb,
              galleryImages: finalGallery,
              notes: data.notes || data.description || '',
              likesCount: data.likesCount || 0,
              rating: avgRating,
              reviewsCount: reviewsList.length || data.reviewsCount || 0,
              reviews: reviewsList,
              uploaderName: data.uploaderName || (data.source === 'openstax' ? 'openstax.org' : 'Omni Scholar'),
              uploaderUid: data.uploaderUid,
              uploaderAvatar: data.uploaderAvatar,
              totalSizeBytes: data.totalSizeBytes || calculatedSize || 8500000,
              attachedDocs: docs,
              source: data.source || (data.uploaderName === 'openstax.org' ? 'openstax' : 'community'),
              status: data.status || 'approved',
              isOpenStax: data.isOpenStax || data.source === 'openstax' || data.uploaderName === 'openstax.org',
              license: data.license || (data.source === 'openstax' ? 'CC BY-NC-SA 4.0' : 'Community Educational Share'),
              isNonCommercial: data.isNonCommercial !== undefined ? data.isNonCommercial : true,
              lastVerified: data.lastVerified,
              verifiedPdfUrl: data.verifiedPdfUrl,
              openstaxPageUrl: data.openstaxPageUrl,
              rexReaderUrl: data.rexReaderUrl,
              driveFileId: data.driveFileId,
              createdAt: data.createdAt
            };
          });

          // Merge OpenStax starter catalog + Firestore courses + locally uploaded courses
          const openstaxCatalog = getOpenStaxCoursesForCatalog();
          let mergedCourses: any[] = [...openstaxCatalog];

          // Override or append Firestore courses
          firestoreCourses.forEach(fc => {
            const existingIdx = mergedCourses.findIndex(c => c.code.toUpperCase() === fc.code.toUpperCase());
            if (existingIdx >= 0) {
              mergedCourses[existingIdx] = { ...mergedCourses[existingIdx], ...fc };
            } else {
              mergedCourses.push(fc);
            }
          });
          try {
            const localSaved = JSON.parse(localStorage.getItem('omni_user_uploaded_courses') || '[]');
            const sharedSaved = JSON.parse(localStorage.getItem('shared_user_courses') || '[]');
            const allLocal = [...localSaved, ...sharedSaved];
            
            allLocal.forEach((localCourse: any) => {
              if (localCourse && (localCourse.title || localCourse.code)) {
                const normalizedCode = (localCourse.code || localCourse.courseCode || 'COURSE').toUpperCase();
                const alreadyExists = mergedCourses.some(fc => 
                  fc.id === localCourse.id || 
                  (fc.code && fc.code.toUpperCase() === normalizedCode && fc.title.toLowerCase() === (localCourse.title || '').toLowerCase())
                );
                if (!alreadyExists) {
                  mergedCourses.unshift({
                    id: localCourse.id || `course-${Date.now()}`,
                    code: normalizedCode,
                    title: localCourse.title || 'Untitled Course',
                    faculty: localCourse.faculty || 'General Academic',
                    department: localCourse.department || 'General',
                    level: localCourse.level || '100L',
                    thumbnailUrl: localCourse.thumbnailUrl || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
                    galleryImages: localCourse.galleryImages || [localCourse.thumbnailUrl || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80'],
                    notes: localCourse.notes || localCourse.about || localCourse.description || '',
                    likesCount: localCourse.likesCount || 0,
                    rating: localCourse.rating || 5.0,
                    reviewsCount: localCourse.reviewsCount || 0,
                    reviews: localCourse.reviews || [],
                    uploaderName: localCourse.uploaderName || 'Omni Scholar',
                    uploaderUid: localCourse.uploaderUid,
                    uploaderAvatar: localCourse.uploaderAvatar,
                    totalSizeBytes: localCourse.totalSizeBytes || 8500000,
                    attachedDocs: localCourse.attachedDocs || localCourse.attachments || [],
                    createdAt: localCourse.createdAt || new Date().toISOString()
                  });
                }
              }
            });
          } catch (e) {
            console.warn("Error merging local uploaded courses:", e);
          }

          // Deduplicate by course ID
          const seenCourseIds = new Set<string>();
          const dedupedCourses = mergedCourses.filter(c => {
            if (!c || !c.id) return false;
            if (seenCourseIds.has(c.id)) return false;
            seenCourseIds.add(c.id);
            return true;
          });

          setCourses(dedupedCourses);
          try {
            localStorage.setItem('omni_cached_courses', JSON.stringify(dedupedCourses));
          } catch (e) {}

          // Update selected course in place if active
          if (selectedCourseRef.current) {
            const updated = mergedCourses.find(c => c.id === selectedCourseRef.current?.id);
            if (updated) {
              setSelectedCourse(updated);
            }
          }
        } else {
          // If Firestore returns empty, load locally saved and cached courses
          try {
            const localSaved = JSON.parse(localStorage.getItem('omni_user_uploaded_courses') || '[]');
            const sharedSaved = JSON.parse(localStorage.getItem('shared_user_courses') || '[]');
            const cached = JSON.parse(localStorage.getItem('omni_cached_courses') || '[]');
            const allLocal = [...localSaved, ...sharedSaved, ...cached];
            const seen = new Set<string>();
            const deduped = allLocal.filter((c: any) => {
              if (!c || !c.id) return false;
              if (seen.has(c.id)) return false;
              seen.add(c.id);
              return true;
            });
            if (deduped.length > 0) {
              setCourses(deduped);
            }
          } catch (e) {}
        }
      }, (err) => {
        console.warn("Firestore courses snapshot notice (loading local cache):", err);
        try {
          const localSaved = JSON.parse(localStorage.getItem('omni_user_uploaded_courses') || '[]');
          const sharedSaved = JSON.parse(localStorage.getItem('shared_user_courses') || '[]');
          const cached = JSON.parse(localStorage.getItem('omni_cached_courses') || '[]');
          const allLocal = [...localSaved, ...sharedSaved, ...cached];
          const seen = new Set<string>();
          const deduped = allLocal.filter((c: any) => {
            if (!c || !c.id) return false;
            if (seen.has(c.id)) return false;
            seen.add(c.id);
            return true;
          });
          if (deduped.length > 0) {
            setCourses(deduped);
          }
        } catch (e) {}
      });
      return () => unsub();
    } catch (err) {
      console.warn("Could not attach firestore courses listener:", err);
    }
  }, []);

  // Live dynamic multi-provider search against OpenStax, Gutenberg, Open Library & Community Drive
  const executeLiveSearch = async (queryStr: string) => {
    if (!queryStr || queryStr.trim().length < 2) return;
    const cleanQ = queryStr.trim();
    setIsLiveSearching(true);

    try {
      // 1. Run multi-provider discovery through ResourceSearchOrchestrator
      const orchestratedResults = await resourceSearchOrchestrator.search(cleanQ, {
        faculty: selectedFaculty !== 'ALL' ? selectedFaculty : undefined
      });

      let discoveredCourses: CourseMaterial[] = [];
      if (orchestratedResults && orchestratedResults.length > 0) {
        discoveredCourses = orchestratedResults.map((r: ResourceResult): CourseMaterial => ({
          id: r.id,
          code: r.code,
          title: r.title,
          faculty: r.faculty,
          department: r.department,
          level: r.level || '100L',
          thumbnailUrl: r.thumbnailUrl,
          galleryImages: r.galleryImages,
          notes: r.notes || `${r.title} — educational resource.`,
          likesCount: r.likesCount || 0,
          rating: r.rating || 5.0,
          reviewsCount: r.reviewsCount || 0,
          uploaderName: r.uploaderName,
          uploaderAvatar: r.uploaderAvatar,
          uploaderUid: r.uploaderUid,
          totalSizeBytes: r.totalSizeBytes || 12400000,
          attachedDocs: r.attachedDocs,
          reviews: r.reviews || [],
          source: r.source,
          isOpenStax: r.isOpenStax,
          license: r.license,
          isNonCommercial: r.isNonCommercial,
          verifiedPdfUrl: r.verifiedPdfUrl,
          openstaxPageUrl: r.openstaxPageUrl,
          rexReaderUrl: r.rexReaderUrl,
          rexWebUrl: r.rexWebUrl,
          status: r.status,
          driveFileId: r.driveFileId,
          capabilities: r.capabilities,
          assets: r.assets
        }));
      }

      // 2. Server-side live-search fallback if needed
      if (discoveredCourses.length === 0) {
        try {
          const res = await fetch(`/api/courses/live-search?q=${encodeURIComponent(cleanQ)}`);
          const data = await res.json();
          if (data && data.success && Array.isArray(data.courses) && data.courses.length > 0) {
            discoveredCourses = data.courses;
          }
        } catch (e) {}
      }

      // 3. Fallback: matchOrSynthesizeOpenStaxCourse
      if (discoveredCourses.length === 0) {
        const synth = matchOrSynthesizeOpenStaxCourse(cleanQ);
        if (synth) {
          discoveredCourses = [synth as any];
        }
      }

      if (discoveredCourses.length > 0) {
        setCourses(prev => {
          const prevMap = new Map(prev.map(c => [c.id, c]));
          discoveredCourses.forEach(dc => {
            if (!prevMap.has(dc.id)) {
              prevMap.set(dc.id, dc);
            }
          });
          const merged = Array.from(prevMap.values());
          try {
            localStorage.setItem('omni_cached_courses', JSON.stringify(merged));
            localStorage.setItem('omni_openstax_courses_manifest', JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });

        // Automatically save and cache newly discovered OpenStax courses into Firestore database
        try {
          discoveredCourses.filter(dc => dc.isOpenStax || dc.source === 'openstax').forEach(async (dc) => {
            await setDoc(doc(db, 'courses', dc.id), {
              ...dc,
              status: 'approved',
              source: 'openstax',
              isOpenStax: true,
              autoCachedAt: new Date().toISOString()
            }, { merge: true });
          });
        } catch (fsErr) {}

        setHasDiscoveredLive(true);
        if (setUserNotification) {
          setUserNotification(`Found "${discoveredCourses[0].code} — ${discoveredCourses[0].title}"!`);
        }
      }
    } catch (err: any) {
      console.warn('[CoursesPage] Multi-provider search notice:', err);
    } finally {
      setIsLiveSearching(false);
    }
  };

  // Debounced auto-trigger: when user searches for something not in local catalog, execute live search immediately
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return;
    const timer = setTimeout(() => {
      const q = searchQuery.toLowerCase().trim();
      const hasLocalMatch = courses.some(c => 
        c.code.toLowerCase().includes(q) || 
        c.title.toLowerCase().includes(q) ||
        (c.faculty && c.faculty.toLowerCase().includes(q)) ||
        (c.department && c.department.toLowerCase().includes(q))
      );
      if (!hasLocalMatch) {
        executeLiveSearch(searchQuery);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery, courses]);

  // Handle Like / Unlike
  const toggleLike = async (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    const isCurrentlyLiked = likedCourseIds.has(courseId);
    const newLiked = new Set(likedCourseIds);
    
    if (isCurrentlyLiked) {
      newLiked.delete(courseId);
    } else {
      newLiked.add(courseId);
    }
    setLikedCourseIds(newLiked);

    // Update local state
    setCourses(prev => prev.map(c => {
      if (c.id === courseId) {
        return {
          ...c,
          likesCount: Math.max(0, c.likesCount + (isCurrentlyLiked ? -1 : 1))
        };
      }
      return c;
    }));

    if (selectedCourse && selectedCourse.id === courseId) {
      setSelectedCourse(prev => prev ? {
        ...prev,
        likesCount: Math.max(0, prev.likesCount + (isCurrentlyLiked ? -1 : 1))
      } : null);
    }

    // Update Firestore
    try {
      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, {
        likesCount: increment(isCurrentlyLiked ? -1 : 1)
      });
    } catch (err) {
      console.debug("Like updated locally");
    }

    setUserNotification(isCurrentlyLiked ? "Removed from liked courses" : "Added to liked courses ❤️");
  };

  // Handle Share Course
  const handleShareCourse = async (course: CourseMaterial) => {
    const shareTitle = `${course.code} - ${course.title}`;
    const shareText = `Check out "${shareTitle}" for ${course.faculty} on NSG Omni Scholar!\n\nDescription: ${course.notes ? course.notes.slice(0, 140) + '...' : 'Lecture notes, materials and past guides.'}`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        setUserNotification("Shared course successfully!");
        return;
      } catch (e) {
        // User dismissed share dialog
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setUserNotification("📋 Course details & link copied to clipboard!");
    } catch (e) {
      setUserNotification("Course details ready to share!");
    }
  };

  // Handle Submit Course Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    if (!reviewComment.trim()) {
      setUserNotification("Please enter your review comments.");
      return;
    }

    setIsSubmittingReview(true);
    const newReview: CourseReview = {
      id: `rev-${Date.now()}`,
      userName: user?.displayName || user?.email?.split('@')[0] || 'Omni Scholar',
      userAvatar: user?.photoURL || undefined,
      userUid: user?.uid,
      rating: reviewRating,
      comment: reviewComment.trim(),
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    const currentReviews = selectedCourse.reviews || [];
    const updatedReviews = [newReview, ...currentReviews];
    const totalScore = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
    const newAvgRating = Number((totalScore / updatedReviews.length).toFixed(1));

    // Update local state
    const updatedCourse: CourseMaterial = {
      ...selectedCourse,
      reviews: updatedReviews,
      rating: newAvgRating,
      reviewsCount: updatedReviews.length
    };
    setSelectedCourse(updatedCourse);
    setCourses(prev => prev.map(c => c.id === selectedCourse.id ? updatedCourse : c));

    // Save to Firestore
    try {
      const courseRef = doc(db, 'courses', selectedCourse.id);
      await updateDoc(courseRef, {
        reviews: updatedReviews,
        rating: newAvgRating,
        reviewsCount: updatedReviews.length
      });
    } catch (err) {
      console.warn("Review saved locally to course:", err);
    }

    setReviewComment('');
    setIsSubmittingReview(false);
    setUserNotification("⭐ Thank you! Your review has been published.");
  };

  // Helper to check if a course is currently stored in Notes or offline manifest
  const isCourseDownloaded = (courseId?: string, courseCode?: string, courseTitle?: string) => {
    if (!courseId) return false;
    // Check local offline manifest
    if (localManifest.isResourceOffline(courseId)) {
      return true;
    }
    // Check in-memory userNotes prop
    if (userNotes && Array.isArray(userNotes) && userNotes.length > 0) {
      const inProps = userNotes.some(n => 
        n.courseId === courseId || 
        n.sourceCourseId === courseId ||
        (courseCode && n.title && n.title.toLowerCase().includes(courseCode.toLowerCase())) ||
        (courseTitle && n.title && n.title.toLowerCase().includes(courseTitle.toLowerCase()))
      );
      if (inProps) return true;
    }
    // Check localStorage omni_saved_notes
    try {
      const saved = localStorage.getItem('omni_saved_notes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.some(n => 
            n.courseId === courseId || 
            n.sourceCourseId === courseId ||
            (courseCode && n.title && n.title.toLowerCase().includes(courseCode.toLowerCase())) ||
            (courseTitle && n.title && n.title.toLowerCase().includes(courseTitle.toLowerCase()))
          );
        }
      }
    } catch (e) {}
    return false;
  };

  // Handle Take Quiz on Course Materials (Loads materials into Quiz Tool without auto-generating)
  const handleTakeQuizOnCourse = (course: CourseMaterial) => {
    const cleanTopic = `${course.code}: ${course.title}`;
    const docItems = (course.attachedDocs || []).map((att: any, idx: number) => ({
      id: att.id || `doc-${Date.now()}-${idx}`,
      name: att.name || `${course.code}_document_${idx + 1}.pdf`,
      size: att.size || 0,
      extractedText: att.extractedText || att.text || (course.notes ? `${course.code}: ${course.notes}` : `Document: ${att.name}`),
      url: att.url || att.dataUrl || '',
      dataUrl: att.dataUrl || att.url || '',
      pageImages: []
    }));

    if (setQuizDocuments) {
      setQuizDocuments(docItems);
    }
    if (setImportedQuizNote) {
      setImportedQuizNote({
        id: course.id,
        courseId: course.id,
        title: `${course.code} — ${course.title}`,
        content: course.notes || '',
        attachments: docItems
      });
    }
    if (setQuizTopic) {
      setQuizTopic(cleanTopic);
    }
    if (setActiveTab) {
      setActiveTab('tools');
    }
    if (setToolsSubTab) {
      setToolsSubTab('quiz');
    }
    if (setUserNotification) {
      setUserNotification(`Loaded course "${course.code}". Choose difficulty & number of questions, then tap "Create quiz"!`);
    }
  };

  // Handle Download Course Content
  const handleDownloadCourse = async () => {
    if (!selectedCourse) return;
    setIsDownloading(true);

    try {
      // 1. Account-Locked Local Storage & Permission Management
      const userUid = user?.uid || 'guest';
      const storageKey = `omni_locked_downloads_${userUid}`;
      try {
        const stored = localStorage.getItem(storageKey);
        const list = stored ? JSON.parse(stored) : [];
        if (!list.includes(selectedCourse.id)) {
          list.push(selectedCourse.id);
          localStorage.setItem(storageKey, JSON.stringify(list));
        }
      } catch (err) {}

      // Audit log & user permission record (both local client Firestore and server API)
      try {
        const permId = `${userUid}_${selectedCourse.id}`.replace(/[^a-zA-Z0-9_-]/g, '_');
        setDoc(doc(db, 'user_download_permissions', permId), {
          userId: userUid,
          userEmail: user?.email || '',
          courseId: selectedCourse.id,
          courseCode: selectedCourse.code,
          courseTitle: selectedCourse.title,
          lockedToUserUid: userUid,
          source: selectedCourse.isOpenStax ? 'openstax' : (selectedCourse.source || 'community'),
          license: 'Creative Commons License',
          status: 'authorized',
          downloadedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});
      } catch (err) {}

      try {
        fetch('/api/user/record-download-permission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userUid,
            userEmail: user?.email || '',
            courseId: selectedCourse.id,
            courseCode: selectedCourse.code,
            courseTitle: selectedCourse.title,
            source: selectedCourse.isOpenStax ? 'openstax' : (selectedCourse.source || 'community')
          })
        }).catch(() => {});
      } catch (err) {}

      // 2. Direct Binary Resource Download via PlatformDownloadService
      let downloadedBlob: Blob | null = null;
      let targetAsset: ResourceAsset | null = null;

      if (selectedCourse.assets && selectedCourse.assets.length > 0) {
        targetAsset = selectedCourse.assets.find(a => a.isDirectDownload) || selectedCourse.assets[0];
      } else if (selectedCourse.isOpenStax && selectedCourse.verifiedPdfUrl) {
        targetAsset = {
          id: `asset-${selectedCourse.id}-pdf`,
          resourceId: selectedCourse.id,
          type: 'pdf',
          url: selectedCourse.verifiedPdfUrl,
          downloadUrl: selectedCourse.verifiedPdfUrl,
          mimeType: 'application/pdf',
          filename: `${selectedCourse.code}_${selectedCourse.title.replace(/[^a-zA-Z0-9]/g, '_')}_OpenStax.pdf`,
          isDirectDownload: true,
          accessType: 'free'
        };
      } else if (selectedCourse.driveFileId) {
        targetAsset = {
          id: `asset-${selectedCourse.id}-drive`,
          resourceId: selectedCourse.id,
          type: 'pdf',
          url: `/api/drive/download/${selectedCourse.driveFileId}`,
          downloadUrl: `/api/drive/download/${selectedCourse.driveFileId}`,
          mimeType: 'application/pdf',
          filename: `${selectedCourse.code}_study_guide.pdf`,
          isDirectDownload: true,
          accessType: 'free'
        };
      }

      if (targetAsset) {
        try {
          const dlRes = await downloadService.download(
            selectedCourse.id,
            targetAsset,
            selectedCourse.title
          );

          if (dlRes.success && dlRes.blob) {
            downloadedBlob = dlRes.blob;
            await saveBinaryAsset(`course-pdf-${selectedCourse.id}`, downloadedBlob, {
              name: targetAsset.filename,
              mimeType: targetAsset.mimeType || 'application/pdf',
              courseId: selectedCourse.id
            });
            triggerFileDownload(downloadedBlob, targetAsset.filename);
          } else if (targetAsset.downloadUrl) {
            // Direct download fallback
            const link = document.createElement('a');
            link.href = targetAsset.downloadUrl;
            link.download = targetAsset.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        } catch (dlErr) {
          console.warn('[CoursesPage] Platform download notice:', dlErr);
          if (targetAsset.downloadUrl) {
            const link = document.createElement('a');
            link.href = targetAsset.downloadUrl;
            link.download = targetAsset.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        }
      }

      // 3. Multi-Asset Parsing: Check if course contains PDF, text notes, audio notes, or video notes
      const parsedAssets = parseCourseAssets(selectedCourse);

      // If we downloaded a binary blob, cache it for the primary attached doc
      if (downloadedBlob && parsedAssets.attachedPdfs.length > 0) {
        try {
          const primaryDoc = parsedAssets.attachedPdfs[0];
          await saveBinaryAsset(primaryDoc.id, downloadedBlob, {
            name: primaryDoc.name,
            mimeType: 'application/pdf',
            courseId: selectedCourse.id
          });
        } catch (cacheErr) {}
      }

      // 4. Save note content into localStorage Notes collection & Firestore with multi-media assets
      const downloadedNote = {
        id: `downloaded-course-${selectedCourse.id}-${Date.now()}`,
        courseId: selectedCourse.id,
        sourceCourseId: selectedCourse.id,
        title: `${selectedCourse.code} — ${selectedCourse.title}`,
        category: selectedCourse.faculty,
        tags: [selectedCourse.code, selectedCourse.department, selectedCourse.level || '100L', 'Downloaded Course', selectedCourse.isOpenStax ? 'OpenStax Textbook' : 'Peer Study Guide'],
        content: parsedAssets.textContent,
        attachments: parsedAssets.attachedPdfs,
        audioRecordings: parsedAssets.audioNotes,
        videoNotes: parsedAssets.videoNotes,
        createdAt: new Date().toISOString(),
        isPinned: false
      };

      try {
        const savedNotesRaw = localStorage.getItem('omni_saved_notes');
        const existingNotes = savedNotesRaw ? JSON.parse(savedNotesRaw) : [];
        const filteredExisting = existingNotes.filter((n: any) => n.id !== downloadedNote.id && n.sourceCourseId !== selectedCourse.id);
        localStorage.setItem('omni_saved_notes', JSON.stringify([downloadedNote, ...filteredExisting].slice(0, 50)));
      } catch (e) {}

      try {
        if (user?.uid) {
          await addDoc(collection(db, 'notes'), {
            ...downloadedNote,
            uid: user.uid,
            createdAt: serverTimestamp() || new Date()
          });
        }
      } catch (e) {}

      // Show downloaded popup & notification saying "Saved to notes"
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadSuccessModal(selectedCourse.title);
        setUserNotification("Saved to notes");
      }, 700);
    } catch (e: any) {
      setIsDownloading(false);
      setUserNotification("Saved to notes");
    }
  };

  // Format file size (max 60MB)
  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '12.4 MB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle File Upload Validation (PDF & DOCX capped at 25MB, Image preview <= 5MB)
  const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newAttachments: typeof attachedFiles = [];

    for (const file of files) {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isDocx = file.name.toLowerCase().endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const isImg = file.type.startsWith('image/');

      if (isPdf || isDocx) {
        // Strict requirement: All file uploads are capped at 25MB
        if (file.size > 25 * 1024 * 1024) {
          setUserNotification(`⚠️ "${file.name}" exceeds the strict 25MB upload limit.`);
          continue;
        }
        newAttachments.push({
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          file,
          name: file.name,
          type: isPdf ? 'pdf' : 'docx',
          size: file.size
        });
      } else if (isImg) {
        if (file.size > 5 * 1024 * 1024) {
          setUserNotification(`⚠️ "${file.name}" exceeds the 5MB thumbnail image limit.`);
          continue;
        }
        
        // Convert to persistent compressed data URL immediately
        let dataUrl = '';
        try {
          dataUrl = await convertImageToDataUrl(file);
        } catch (err) {
          dataUrl = URL.createObjectURL(file);
        }

        newAttachments.push({
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          file,
          name: file.name,
          type: 'image',
          size: file.size,
          previewUrl: dataUrl
        });

        if (!uploadFormData.thumbnailUrl && dataUrl) {
          setUploadFormData(prev => ({ ...prev, thumbnailUrl: dataUrl }));
        }
      } else {
        setUserNotification(`⚠️ Only PDF and DOCX academic course materials are permitted.`);
      }
    }

    setAttachedFiles(prev => [...prev, ...newAttachments]);
  };

  const removeAttachedFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // AI draft notes helper
  const handleGenerateAiNotes = async () => {
    if (!uploadFormData.code && !uploadFormData.title) {
      setUserNotification("Please enter a Course Code and Course Title first.");
      return;
    }

    setIsGeneratingAiNotes(true);
    setUserNotification("Generating structured lecture notes with AI...");

    try {
      const response = await fetch('/api/gemini/course-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: uploadFormData.code,
          title: uploadFormData.title,
          faculty: uploadFormData.faculty,
          department: uploadFormData.department,
          level: uploadFormData.level
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.notes) {
          setUploadFormData(prev => ({ ...prev, notes: data.notes }));
          setUserNotification("✨ AI lecture notes generated successfully!");
          return;
        }
      }

      const fallback = `### Course Overview: ${uploadFormData.code} - ${uploadFormData.title}

#### 1. Core Principles & Foundational Concepts
- Key thematic structure for ${uploadFormData.department || 'this discipline'}.
- Major theories and analytical frameworks applicable to ${uploadFormData.level}.

#### 2. Key Modules & Formulations
1. **Module I**: Introduction and Definitions.
2. **Module II**: Analytical Techniques and Proofs.
3. **Module III**: Real-world application and case studies.

#### 3. Summary & Study Takeaways
- Review core formulas and key definitions before exams.
- Practice past questions regularly.`;

      setUploadFormData(prev => ({ ...prev, notes: fallback }));
      setUserNotification("✨ Draft lecture notes created!");
    } catch (e) {
      console.warn("AI notes generation error:", e);
      setUserNotification("Draft notes template populated.");
    } finally {
      setIsGeneratingAiNotes(false);
    }
  };

  // Publish / Upload Course
  const handlePublishCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFormData.code.trim() || !uploadFormData.title.trim()) {
      setUserNotification("Please provide both Course Code and Title.");
      return;
    }

    setIsUploading(true);
    try {
      const preparedDocs: AttachedDoc[] = [];
      const galleryImgs: string[] = [];

      let totalSize = 0;
      for (const item of attachedFiles) {
        totalSize += item.size;
        let dataUrl: string | undefined = item.previewUrl;
        
        if (item.type === 'image') {
          if (!dataUrl || dataUrl.startsWith('blob:')) {
            try {
              dataUrl = await convertImageToDataUrl(item.file, 700, 0.65);
            } catch (err) {
              dataUrl = undefined;
            }
          }
          if (dataUrl) {
            galleryImgs.push(dataUrl);
          }
        }

        preparedDocs.push({
          id: item.id,
          name: item.name,
          type: item.type,
          size: item.size,
          dataUrl: dataUrl && dataUrl.length < 250000 ? dataUrl : undefined
        });
      }

      const defaultThumbnails = [
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80'
      ];

      // USER REQUIREMENT: Strictly use the first image uploaded by the user as the preview card thumbnail
      const firstUploadedImage = galleryImgs.length > 0 ? galleryImgs[0] : undefined;
      const primaryThumb = firstUploadedImage || uploadFormData.thumbnailUrl || defaultThumbnails[Math.floor(Math.random() * defaultThumbnails.length)];
      
      const finalGalleryImages = galleryImgs.length > 0 
        ? galleryImgs.slice(0, 4) 
        : [primaryThumb];

      // Secure Server-Side Google Drive Community Upload Proxy
      let driveFileId: string | undefined = undefined;
      let primaryFileBase64: string | undefined = undefined;
      let primaryFileName: string | undefined = undefined;
      let primaryMimeType: string | undefined = undefined;

      const primaryDoc = attachedFiles.find(f => f.type === 'pdf' || f.type === 'docx');
      if (primaryDoc && primaryDoc.file) {
        primaryFileName = primaryDoc.name;
        primaryMimeType = primaryDoc.file.type || (primaryDoc.type === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf');
        try {
          primaryFileBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(primaryDoc.file as File);
          });
        } catch (convErr) {
          console.warn("Could not encode file to base64:", convErr);
        }
      } else if (primaryDoc && primaryDoc.dataUrl) {
        primaryFileBase64 = primaryDoc.dataUrl;
        primaryFileName = primaryDoc.name;
        primaryMimeType = 'application/pdf';
      }

      try {
        const driveRes = await fetch('/api/drive/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: primaryFileBase64,
            fileName: primaryFileName || `${uploadFormData.code.toUpperCase().trim()}_notes.pdf`,
            mimeType: primaryMimeType || 'application/pdf',
            courseCode: uploadFormData.code.toUpperCase().trim(),
            title: uploadFormData.title.trim(),
            faculty: uploadFormData.faculty,
            department: uploadFormData.department.trim() || 'General',
            level: uploadFormData.level,
            notes: uploadFormData.notes || '',
            content: uploadFormData.notes || '',
            thumbnailUrl: primaryThumb,
            galleryImages: finalGalleryImages,
            attachedDocs: preparedDocs,
            uploaderUid: user?.uid || '',
            uploaderName: user?.displayName || user?.email?.split('@')[0] || 'Omni Scholar',
            uploaderEmail: user?.email || ''
          })
        });
        const driveData = await driveRes.json();
        if (driveData && driveData.fileId) {
          driveFileId = driveData.fileId;
        }
      } catch (uploadErr) {
        console.warn("Drive proxy upload notice:", uploadErr);
      }

      const isAdminUser = user?.email === 'nuellkelechi@gmail.com' || user?.role === 'admin';

      // If the admin themselves uploaded it, they can immediately publish to live courses
      if (isAdminUser) {
        const newCourse: CourseMaterial = {
          id: `course-${Date.now()}`,
          code: uploadFormData.code.toUpperCase().trim(),
          title: uploadFormData.title.trim(),
          faculty: uploadFormData.faculty,
          department: uploadFormData.department.trim() || 'General',
          level: uploadFormData.level,
          thumbnailUrl: primaryThumb,
          galleryImages: finalGalleryImages,
          notes: uploadFormData.notes || 'Course notes and lecture study guide.',
          likesCount: 0,
          rating: 5.0,
          reviewsCount: 0,
          reviews: [],
          uploaderName: user?.displayName || user?.email?.split('@')[0] || 'Omni Scholar',
          uploaderUid: user?.uid,
          uploaderAvatar: user?.photoURL || undefined,
          totalSizeBytes: totalSize || 8500000,
          attachedDocs: preparedDocs,
          source: 'community',
          status: 'approved',
          driveFileId,
          createdAt: new Date().toISOString()
        };

        try {
          const minimalPayload = {
            code: newCourse.code,
            title: newCourse.title,
            faculty: newCourse.faculty,
            department: newCourse.department,
            level: newCourse.level,
            thumbnailUrl: newCourse.thumbnailUrl,
            galleryImages: [newCourse.thumbnailUrl],
            notes: newCourse.notes,
            likesCount: 0,
            rating: 5.0,
            reviewsCount: 0,
            reviews: [],
            uploaderName: newCourse.uploaderName,
            uploaderUid: newCourse.uploaderUid || '',
            uploaderAvatar: newCourse.uploaderAvatar || '',
            totalSizeBytes: newCourse.totalSizeBytes,
            source: 'community',
            status: 'approved',
            driveFileId: driveFileId || '',
            attachedDocs: preparedDocs.map(d => ({ id: d.id, name: d.name, type: d.type, size: d.size })),
            createdAt: serverTimestamp() || new Date()
          };
          const docRef = await addDoc(collection(db, 'courses'), minimalPayload);
          newCourse.id = docRef.id;
        } catch (fsErr) {
          console.warn("Admin direct publish error:", fsErr);
        }

        setCourses(prev => [newCourse, ...prev.filter(c => c.id !== newCourse.id)]);
        setUserNotification(`🎉 Successfully published ${newCourse.code}!`);
      } else {
        // Required exact user notification for standard student uploads
        setUserNotification("sent to admin for verification, would be uploaded soon.");
      }

      setIsUploadModalOpen(false);
      
      // Reset form
      setUploadFormData({
        code: '',
        title: '',
        faculty: FACULTIES[0] || 'Faculty of Physical Sciences',
        department: '',
        level: '100L',
        notes: '',
        thumbnailUrl: ''
      });
      setAttachedFiles([]);
    } catch (err: any) {
      console.error("Course upload error:", err);
      setUserNotification(`Failed to upload course: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Filtered Courses
  const filteredCourses = useMemo(() => {
    let result = [...courses];

    // STRICT REQUIREMENT: OpenStax, Gutenberg and Open Library resources are always visible to all students.
    // Community uploads must NOT appear in student searches automatically unless status is 'approved'
    // (Pending / rejected uploads are only visible to the original uploader or an admin).
    result = result.filter(c => {
      if (c.isOpenStax || c.source === 'openstax' || c.source === 'gutendex' || c.source === 'openlibrary') return true;
      if (c.status === 'pending' || c.status === 'rejected') {
        const isOwner = user?.uid && c.uploaderUid === user.uid;
        const isAdmin = user?.email === 'nuellkelechi@gmail.com' || user?.role === 'admin';
        return isOwner || isAdmin;
      }
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => 
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.faculty.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q) ||
        (c.notes && c.notes.toLowerCase().includes(q))
      );
    }

    if (selectedFaculty !== 'ALL') {
      result = result.filter(c => c.faculty === selectedFaculty);
    }

    if (selectedDepartment.trim()) {
      const deptQ = selectedDepartment.toLowerCase().trim();
      result = result.filter(c => c.department.toLowerCase().includes(deptQ));
    }

    if (selectedLevel !== 'ALL') {
      result = result.filter(c => c.level === selectedLevel);
    }

    if (sortBy === 'likes') {
      result.sort((a, b) => b.likesCount - a.likesCount);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'az') {
      result.sort((a, b) => a.code.localeCompare(b.code));
    }

    return result;
  }, [courses, searchQuery, selectedFaculty, selectedDepartment, selectedLevel, sortBy]);

  // Gallery image items for active preview
  const previewImages = useMemo(() => {
    if (!selectedCourse) return [];
    const imgs: string[] = [];
    if (selectedCourse.thumbnailUrl) imgs.push(selectedCourse.thumbnailUrl);
    if (selectedCourse.galleryImages) {
      selectedCourse.galleryImages.forEach(img => {
        if (!imgs.includes(img)) imgs.push(img);
      });
    }
    if (imgs.length === 0) {
      imgs.push('https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80');
    }
    return imgs;
  }, [selectedCourse]);

  return (
    <div 
      className={`min-h-screen relative pb-28 select-none transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#13111C] text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. COURSES HOME VIEW (WHEN NO COURSE IS SELECTED) */}
      {/* ========================================================================= */}
      {!selectedCourse ? (
        <>
          {/* Top Header */}
          <div 
            className="sticky top-0 z-30 px-3 sm:px-6 pb-3 backdrop-blur-xl border-b transition-colors duration-300"
            style={{
              paddingTop: getSafeHeaderPaddingTop(16),
              backgroundColor: theme === 'dark' ? 'rgba(19, 17, 28, 0.92)' : 'rgba(255, 255, 255, 0.92)',
              borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.9)'
            }}
          >
            <div className="max-w-6xl mx-auto space-y-3">
              {/* Centered Title & Back Button only (Clean Single Header) */}
              <div className="relative flex items-center justify-center text-center min-h-[40px]">
                {onBack && (
                  <button 
                    onClick={onBack}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-xl border transition-all cursor-pointer ${
                      theme === 'dark' 
                        ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                    title="Go Back"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                
                <h1 className={`text-xl sm:text-2xl font-black tracking-tight text-center ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Courses & Books
                </h1>
              </div>

              {/* Search Input + Filter Toggle Button */}
              <div className="flex items-center gap-2.5">
                <div className={`flex-1 flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all shadow-sm ${
                  theme === 'dark' 
                    ? 'bg-[#18132A] border-purple-500/20 text-white focus-within:border-purple-500/60' 
                    : 'bg-white border-slate-200 text-slate-900 focus-within:border-purple-500/60'
                }`}>
                  {isLiveSearching ? (
                    <RefreshCw size={17} className="text-purple-400 animate-spin shrink-0" />
                  ) : (
                    <Search size={17} className={`shrink-0 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                  )}
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search courses, textbooks, public-domain books..."
                    className={`w-full bg-transparent border-none outline-none text-xs sm:text-sm font-medium ${
                      theme === 'dark' 
                        ? 'text-white placeholder:text-white/30' 
                        : 'text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                  {isLiveSearching && (
                    <span className="text-[10px] font-bold text-purple-400 animate-pulse whitespace-nowrap hidden sm:inline">
                      Searching providers...
                    </span>
                  )}
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="p-1 rounded-full text-white/40 hover:text-white cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsFilterOpen(true)}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm ${
                    isFilterOpen || selectedFaculty !== 'ALL' || selectedDepartment
                      ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30'
                      : theme === 'dark'
                      ? 'bg-[#18132A] border-purple-500/20 text-purple-300 hover:bg-white/10'
                      : 'bg-white border-slate-200 text-purple-700 hover:bg-purple-50'
                  }`}
                  title="Filter Courses"
                >
                  <SlidersHorizontal size={17} />
                  <span className="hidden sm:inline text-xs font-bold">Filter</span>
                  {(selectedFaculty !== 'ALL' || selectedDepartment || selectedLevel !== 'ALL') && (
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  )}
                </button>
              </div>

              {/* Active Filter Badges */}
              {(selectedFaculty !== 'ALL' || selectedDepartment || selectedLevel !== 'ALL') && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>
                    Filters:
                  </span>
                  {selectedFaculty !== 'ALL' && (
                    <span className="px-2.5 py-1 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 font-medium flex items-center gap-1.5 shrink-0 text-[11px]">
                      {selectedFaculty}
                      <X size={12} className="cursor-pointer hover:text-white" onClick={() => setSelectedFaculty('ALL')} />
                    </span>
                  )}
                  {selectedDepartment && (
                    <span className="px-2.5 py-1 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 font-medium flex items-center gap-1.5 shrink-0 text-[11px]">
                      Dept: {selectedDepartment}
                      <X size={12} className="cursor-pointer hover:text-white" onClick={() => setSelectedDepartment('')} />
                    </span>
                  )}
                  {selectedLevel !== 'ALL' && (
                    <span className="px-2.5 py-1 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 font-medium flex items-center gap-1.5 shrink-0 text-[11px]">
                      {selectedLevel}
                      <X size={12} className="cursor-pointer hover:text-white" onClick={() => setSelectedLevel('ALL')} />
                    </span>
                  )}
                  <button 
                    onClick={() => {
                      setSelectedFaculty('ALL');
                      setSelectedDepartment('');
                      setSelectedLevel('ALL');
                    }}
                    className="text-[11px] font-bold text-purple-400 hover:underline shrink-0 ml-1"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Compact 2-Column Responsive Grid */}
          <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-4">
            {filteredCourses.length === 0 ? (
              isLiveSearching ? (
                <div className={`p-8 rounded-3xl border text-center space-y-3 my-8 max-w-sm mx-auto ${
                  theme === 'dark' ? 'bg-[#18132A] border-purple-500/30' : 'bg-white border-purple-200 shadow-sm'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/30">
                    <RefreshCw size={24} className="animate-spin text-purple-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      Searching OpenStax Library...
                    </h3>
                    <p className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                      Matching academic textbooks, study guides, and multi-media assets for "{searchQuery}"...
                    </p>
                  </div>
                </div>
              ) : searchQuery.trim().length > 0 ? (
                <div className={`p-8 rounded-3xl border text-center space-y-3 my-8 max-w-sm mx-auto ${
                  theme === 'dark' ? 'bg-[#18132A] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/20">
                    <Sparkles size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      Course "{searchQuery}" not found locally
                    </h3>
                    <p className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                      Search OpenStax open educational curriculum to auto-generate and expand your course catalog.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      onClick={() => executeLiveSearch(searchQuery)}
                      className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all inline-flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Sparkles size={14} /> Search &amp; Add OpenStax Course
                    </button>
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-xs font-semibold cursor-pointer transition-all inline-flex items-center justify-center gap-1.5"
                    >
                      <Plus size={14} /> Upload Custom Course
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`p-8 rounded-3xl border text-center space-y-3 my-8 max-w-sm mx-auto ${
                  theme === 'dark' ? 'bg-[#18132A] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/20">
                    <BookOpen size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      No courses available yet
                    </h3>
                    <p className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                      Tap the purple + button below to upload lecture notes or materials.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all inline-flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Upload Course
                  </button>
                </div>
              )
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
                {filteredCourses.map((course, courseIdx) => {
                  const isLiked = likedCourseIds.has(course.id);
                  return (
                    <motion.div
                      key={`${course.id || 'course'}-${courseIdx}`}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onMouseDown={(e) => handleCardTouchStart(course, e)}
                      onMouseUp={(e) => handleCardTouchEnd(course, e)}
                      onMouseMove={(e) => handleCardTouchMove(course.id, e)}
                      onMouseLeave={() => handleCardTouchCancel(course.id)}
                      onTouchStart={(e) => handleCardTouchStart(course, e)}
                      onTouchEnd={(e) => handleCardTouchEnd(course, e)}
                      onTouchCancel={() => handleCardTouchCancel(course.id)}
                      onTouchMove={(e) => handleCardTouchMove(course.id, e)}
                      onClick={(e) => handleCardClick(course, e)}
                      className={`relative group rounded-2xl border p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none hover:shadow-lg hover:-translate-y-0.5 active:scale-98 touch-pan-y ${
                        theme === 'dark'
                          ? 'bg-[#171328] border-purple-500/20 hover:border-purple-500/50'
                          : 'bg-white border-slate-200 hover:border-purple-400 shadow-sm'
                      }`}
                    >
                      {/* Delete Overlay (Triggered after 0.5s tap and hold) */}
                      {activeDeleteCardId === course.id && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute inset-0 z-20 rounded-2xl bg-black/85 backdrop-blur-sm p-3 flex flex-col items-center justify-center gap-2 border border-red-500/50 text-center shadow-xl"
                        >
                          <p className="text-[11px] font-bold text-white leading-tight">Delete this course?</p>
                          <div className="flex items-center gap-1.5 w-full">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDeleteCardId(null);
                              }}
                              className="flex-1 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-[10px] font-bold text-white cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCourseToDelete(course);
                                setShowDeleteConfirm(true);
                                setActiveDeleteCardId(null);
                              }}
                              className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-[10px] font-black text-white shadow-md cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Trash2 size={11} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* Compact Thumbnail Image with Like Button & Rating */}
                      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-purple-950/40 pointer-events-none">
                        <img 
                          src={course.thumbnailUrl} 
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e: any) => {
                            e.target.src = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

                        {/* Level / Code Overlay Badge */}
                        <div className="absolute top-1.5 left-1.5">
                          <span className="px-1.5 py-0.5 rounded-md bg-purple-600/90 text-white text-[9px] font-black tracking-wider uppercase backdrop-blur-md">
                            {course.code}
                          </span>
                        </div>

                        {/* Like Heart Button with Live Likes Counter */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(e, course.id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          className={`pointer-events-auto absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full backdrop-blur-md transition-all active:scale-90 cursor-pointer flex items-center gap-1 text-[10px] font-bold z-10 ${
                            isLiked 
                              ? 'bg-red-500 text-white shadow-md shadow-red-500/40' 
                              : 'bg-black/60 text-white/90 hover:text-white hover:bg-black/80'
                          }`}
                          title={isLiked ? "Unlike" : "Like"}
                        >
                          <Heart size={11} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "text-white" : ""} />
                          <span>{course.likesCount || 0}</span>
                        </button>

                        {/* Rating on bottom left of image */}
                        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-white text-[10px] font-semibold bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md">
                          <Star size={10} className="text-amber-400 fill-amber-400" />
                          <span>{course.rating || 5.0}</span>
                        </div>

                        {/* Downloaded in Notes indicator badge */}
                        {isCourseDownloaded(course.id, course.code, course.title) && (
                          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 text-white text-[9px] font-bold bg-emerald-600/90 backdrop-blur-md px-1.5 py-0.5 rounded-md shadow-xs">
                            <Check size={10} className="stroke-[3]" />
                            <span>Saved</span>
                          </div>
                        )}
                      </div>

                      {/* Clean Text Details without container boxes */}
                      <div className="pt-2 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {course.isOpenStax || course.source === 'openstax' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[9px] font-bold">
                              <CheckCircle2 size={10} className="text-emerald-400" />
                              <span>OpenStax</span>
                            </span>
                          ) : course.source === 'gutendex' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[9px] font-bold">
                              <BookOpen size={10} className="text-amber-400" />
                              <span>Gutenberg</span>
                            </span>
                          ) : course.source === 'openlibrary' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/25 text-[9px] font-bold">
                              <Globe size={10} className="text-sky-400" />
                              <span>Open Library</span>
                            </span>
                          ) : course.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                              <Clock size={10} className="text-amber-400" />
                              <span>Pending Review</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/25 text-[9px] font-bold">
                              <ShieldCheck size={10} className="text-blue-400" />
                              <span>Community</span>
                            </span>
                          )}
                        </div>

                        <h3 className={`text-xs font-bold leading-tight line-clamp-1 ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          {course.title || course.code}
                        </h3>
                        
                        <p className={`text-[11px] font-bold truncate ${
                          theme === 'dark' ? 'text-purple-300' : 'text-purple-700'
                        }`}>
                          {course.faculty}
                        </p>

                        <div className="flex items-center justify-between text-[10px] pt-0.5">
                          <span className={theme === 'dark' ? 'text-white/40' : 'text-slate-400'}>
                            {course.source === 'gutendex' ? 'gutenberg.org' : course.source === 'openlibrary' ? 'openlibrary.org' : course.isOpenStax ? 'openstax.org' : (course.uploaderName ? `By ${course.uploaderName}` : 'NSG Community')}
                          </span>
                          {(course.isOpenStax || course.license) && (
                            <span className="text-[9px] font-mono text-purple-400/80">
                              {course.license ? course.license.slice(0, 10) : 'CC BY-NC'}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Floating Purple "+" Button (Bottom Right) */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsUploadModalOpen(true)}
            className="fixed bottom-6 right-6 z-40 w-13 h-13 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-2xl shadow-purple-600/50 flex items-center justify-center cursor-pointer border border-purple-400/30 transition-all"
            title="Upload Course Content"
          >
            <Plus size={26} className="stroke-[2.5]" />
          </motion.button>
        </>
      ) : (
        /* ========================================================================= */
        /* 2. DEDICATED COURSE PREVIEW VIEW (EXACT MATCH TO REFERENCE DESIGN)       */
        /* ========================================================================= */
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="max-w-md mx-auto min-h-screen pb-32"
        >
          {/* Hero Image Slider Container */}
          <div className="relative w-full aspect-[4/3] bg-black overflow-hidden sm:rounded-b-3xl">
            {/* Active Hero Image */}
            <motion.img 
              key={activeImageIndex}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              src={previewImages[activeImageIndex] || selectedCourse.thumbnailUrl}
              alt={selectedCourse.title}
              className="w-full h-full object-cover"
              onError={(e: any) => {
                e.target.src = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

            {/* Overlaid Header Controls (Back, Share, Like) */}
            <div 
              className="absolute left-4 right-4 flex items-center justify-between z-20"
              style={{ top: 'max(28px, calc(env(safe-area-inset-top, 0px) + 16px))' }}
            >
              {/* Back Button */}
              <button 
                onClick={() => setSelectedCourse(null)}
                className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 backdrop-blur-md flex items-center justify-center shadow-lg cursor-pointer transition-all active:scale-90"
                title="Back to Courses"
              >
                <ArrowLeft size={18} />
              </button>

              {/* Share, Like, and Delete Buttons */}
              <div className="flex items-center gap-2">
                {/* Delete Button (if user is uploader or admin) */}
                {(selectedCourse.uploaderUid === user?.uid || user?.email === 'nuellkelechi@gmail.com') && (
                  <button 
                    onClick={() => {
                      setCourseToDelete(selectedCourse);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-10 h-10 rounded-full bg-white/80 hover:bg-red-50 text-red-600 backdrop-blur-md flex items-center justify-center shadow-lg cursor-pointer transition-all active:scale-90"
                    title="Delete Course"
                  >
                    <Trash2 size={17} />
                  </button>
                )}

                {/* Share Button */}
                <button 
                  onClick={() => handleShareCourse(selectedCourse)}
                  className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 backdrop-blur-md flex items-center justify-center shadow-lg cursor-pointer transition-all active:scale-90"
                  title="Share Course"
                >
                  <Share2 size={18} />
                </button>

                {/* Like Button with Live Counter */}
                <button 
                  onClick={(e) => toggleLike(e, selectedCourse.id)}
                  className={`px-3 h-10 rounded-full bg-white/90 hover:bg-white backdrop-blur-md flex items-center gap-1.5 shadow-lg cursor-pointer transition-all active:scale-90 text-xs font-black ${
                    likedCourseIds.has(selectedCourse.id) ? 'text-red-500' : 'text-slate-700 hover:text-red-500'
                  }`}
                  title={likedCourseIds.has(selectedCourse.id) ? "Unlike" : "Like"}
                >
                  <Heart size={16} fill={likedCourseIds.has(selectedCourse.id) ? "currentColor" : "none"} className={likedCourseIds.has(selectedCourse.id) ? "fill-red-500 text-red-500" : ""} />
                  <span>{selectedCourse.likesCount || 0}</span>
                </button>
              </div>
            </div>

            {/* Floating Thumbnail Slider Bar over bottom of image */}
            {previewImages.length > 1 && (
              <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center gap-2 overflow-x-auto p-1.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 no-scrollbar">
                {previewImages.slice(0, 5).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-12 h-10 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activeImageIndex === idx ? 'border-purple-400 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
                {previewImages.length > 5 && (
                  <div className="w-10 h-10 rounded-xl bg-purple-900/80 text-purple-200 border border-purple-400/40 flex items-center justify-center text-[10px] font-bold shrink-0">
                    +{previewImages.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Course Information Section */}
          <div className="px-5 pt-4 space-y-4">
            {/* Top Row: Faculty / Department Tag & Calculated Rating */}
            <div className="flex items-center justify-between gap-2">
              {/* Faculty/Department Tag (Replacing "Open Space") */}
              <span className="text-xs font-semibold px-3 py-1 rounded-full text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-950/60 border border-purple-500/20 truncate max-w-[220px]">
                {selectedCourse.faculty}
              </span>

              {/* Dynamic Star Rating & Review Count (e.g. ★ 4.8 (365 reviews)) */}
              <div className="flex items-center gap-1 text-xs font-bold text-amber-500 shrink-0">
                <Star size={14} className="fill-amber-400 text-amber-400" />
                <span className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>
                  {selectedCourse.rating || 5.0}
                </span>
                <span className={`text-[11px] font-normal ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>
                  ({selectedCourse.reviewsCount || (selectedCourse.reviews ? selectedCourse.reviews.length : 0)} reviews)
                </span>
              </div>
            </div>

            {/* Course Name & Uploader Details with Purple Action Buttons */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5 flex-1 min-w-0">
                {/* Course Name (WorkHub Connect becomes Course Name) */}
                <h1 className={`text-xl sm:text-2xl font-black tracking-tight leading-snug ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  {selectedCourse.title || selectedCourse.code}
                </h1>

                {/* Uploader Name (1012 Ocean Avenue becomes Uploader Name) */}
                <p className={`text-xs sm:text-sm font-medium ${
                  theme === 'dark' ? 'text-white/60' : 'text-slate-500'
                }`}>
                  Uploaded by {selectedCourse.uploaderName || 'Omni Scholar'} • {selectedCourse.department}
                </p>
              </div>

              {/* Action Buttons: Take Quiz & Download Circle */}
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => handleTakeQuizOnCourse(selectedCourse)}
                  className="h-11 px-3.5 rounded-full bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/60 dark:hover:bg-purple-800/60 text-purple-700 dark:text-purple-200 border border-purple-400/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 text-xs font-black shadow-sm"
                  title="Take Quiz on this Course"
                >
                  <Zap size={15} className="text-amber-500 dark:text-amber-400" />
                  <span>Take Quiz</span>
                </button>

                {/* Signature Light Purple Action Circle Button */}
                {(() => {
                  const isDownloaded = isCourseDownloaded(selectedCourse.id, selectedCourse.code, selectedCourse.title);
                  return (
                    <button 
                      onClick={isDownloaded ? undefined : handleDownloadCourse}
                      className={`w-11 h-11 rounded-full text-white shadow-md flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0 ${
                        isDownloaded
                          ? 'bg-emerald-600 shadow-emerald-600/30 cursor-default'
                          : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
                      }`}
                      title={isDownloaded ? "Saved to notes" : "Download to notes"}
                    >
                      {isDownloaded ? <Check size={18} className="stroke-[3]" /> : <Download size={18} />}
                    </button>
                  );
                })()}
              </div>
            </div>

            {/* Navigation Tabs (About | Course Content | Review) */}
            <div className="pt-2 border-b border-white/10 flex items-center justify-around text-sm font-bold">
              {[
                { id: 'about', label: 'About' },
                { id: 'gallery', label: 'Course Content' },
                { id: 'review', label: 'Review' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCourseDetailTab(tab.id as any)}
                  className={`pb-3 relative transition-all cursor-pointer ${
                    courseDetailTab === tab.id
                      ? theme === 'dark' ? 'text-purple-400 font-black' : 'text-purple-600 font-black'
                      : theme === 'dark' ? 'text-white/50 hover:text-white/80' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                  {courseDetailTab === tab.id && (
                    <motion.div 
                      layoutId="activeCourseTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            {/* 1. ABOUT TAB */}
            {courseDetailTab === 'about' && (
              <div className="space-y-5 pt-2">
                {/* Description Section */}
                <div className="space-y-1.5">
                  <h2 className={`text-base font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Description
                  </h2>
                  <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                    {isReadMore || (selectedCourse.notes && selectedCourse.notes.length <= 180)
                      ? selectedCourse.notes
                      : `${selectedCourse.notes ? selectedCourse.notes.slice(0, 180) : 'Comprehensive study materials, lecture summaries and practice notes prepared for students.'}...`
                    }
                    {selectedCourse.notes && selectedCourse.notes.length > 180 && (
                      <button
                        onClick={() => setIsReadMore(!isReadMore)}
                        className="ml-1 text-purple-500 font-bold hover:underline cursor-pointer inline"
                      >
                        {isReadMore ? "Show less" : "Read more"}
                      </button>
                    )}
                  </p>

                  {/* Attached Documents Counter Text */}
                  <p className="text-[11px] font-semibold text-purple-400 pt-1 flex items-center gap-1.5">
                    <Paperclip size={13} />
                    <span>
                      {selectedCourse.attachedDocs?.length || 0} document(s) attached • Total size: {formatBytes(selectedCourse.totalSizeBytes)}
                    </span>
                  </p>
                </div>

                {/* Uploaded By Profile Section / Publisher Attribution */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>
                    {selectedCourse.isOpenStax || selectedCourse.source === 'openstax' || selectedCourse.source === 'gutendex' || selectedCourse.source === 'openlibrary'
                      ? 'Official Academic Publisher' 
                      : 'Uploaded by'}
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm overflow-hidden ${
                      selectedCourse.isOpenStax || selectedCourse.source === 'openstax'
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        : selectedCourse.source === 'gutendex'
                        ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                        : selectedCourse.source === 'openlibrary'
                        ? 'bg-sky-600/20 text-sky-300 border border-sky-500/30'
                        : 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    }`}>
                      {selectedCourse.isOpenStax || selectedCourse.source === 'openstax' ? (
                        <Globe size={22} className="text-emerald-400" />
                      ) : selectedCourse.source === 'gutendex' ? (
                        <BookOpen size={22} className="text-amber-400" />
                      ) : selectedCourse.source === 'openlibrary' ? (
                        <Globe size={22} className="text-sky-400" />
                      ) : selectedCourse.uploaderAvatar ? (
                        <img src={selectedCourse.uploaderAvatar} alt={selectedCourse.uploaderName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{selectedCourse.uploaderName ? selectedCourse.uploaderName[0].toUpperCase() : 'O'}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {selectedCourse.isOpenStax || selectedCourse.source === 'openstax' 
                            ? 'OpenStax (Rice University)' 
                            : selectedCourse.source === 'gutendex'
                            ? 'Project Gutenberg Archive'
                            : selectedCourse.source === 'openlibrary'
                            ? 'Open Library (Internet Archive)'
                            : (selectedCourse.uploaderName || 'NSG Community')}
                        </p>
                        {(selectedCourse.isOpenStax || selectedCourse.source === 'openstax') && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-0.5">
                            <ShieldCheck size={10} />
                            Verified OER
                          </span>
                        )}
                        {selectedCourse.source === 'gutendex' && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30 flex items-center gap-0.5">
                            <ShieldCheck size={10} />
                            Public Domain
                          </span>
                        )}
                        {selectedCourse.source === 'openlibrary' && (
                          <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 text-[10px] font-bold border border-sky-500/30 flex items-center gap-0.5">
                            <ShieldCheck size={10} />
                            Lending Library
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>
                        {selectedCourse.license || (selectedCourse.isOpenStax ? 'Creative Commons Attribution 4.0 (CC BY 4.0)' : selectedCourse.department || 'Academic Department')}
                      </p>
                    </div>
                  </div>

                  {/* OpenStax Attribution details */}
                  {(selectedCourse.isOpenStax || selectedCourse.source === 'openstax') && (
                    <div className="p-3 rounded-2xl bg-emerald-950/25 border border-emerald-500/25 text-xs space-y-1.5 mt-2">
                      <p className="text-emerald-300 font-bold flex items-center gap-1.5 text-xs">
                        <ShieldCheck size={14} className="text-emerald-400" />
                        Zero-Cost Hybrid Open Educational Resource (OER)
                      </p>
                      <p className="text-white/70 text-[11px] leading-relaxed">
                        This peer-reviewed college textbook is authored and reviewed by educators under a Creative Commons Attribution license. Students can freely read online via the Rex web reader or download high-resolution PDF course editions.
                      </p>
                      {selectedCourse.rexReaderUrl && (
                        <div className="pt-1 flex items-center gap-3">
                          <a 
                            href={selectedCourse.rexReaderUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline"
                          >
                            <span>Open in OpenStax Rex Reader</span>
                            <ExternalLink size={11} />
                          </a>
                          {(selectedCourse.openstaxPageUrl || (selectedCourse as any).openStaxWebUrl) && (
                            <a 
                              href={selectedCourse.openstaxPageUrl || (selectedCourse as any).openStaxWebUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-white/50 hover:text-white/80"
                            >
                              <span>Book Details</span>
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Project Gutenberg Details */}
                  {selectedCourse.source === 'gutendex' && (
                    <div className="p-3 rounded-2xl bg-amber-950/25 border border-amber-500/25 text-xs space-y-1.5 mt-2">
                      <p className="text-amber-300 font-bold flex items-center gap-1.5 text-xs">
                        <BookOpen size={14} className="text-amber-400" />
                        Project Gutenberg Public Domain Book
                      </p>
                      <p className="text-white/70 text-[11px] leading-relaxed">
                        This work is in the public domain and free to read, download, and study. Produced by thousands of volunteers to digitize world literature and knowledge.
                      </p>
                      {selectedCourse.rexReaderUrl && (
                        <div className="pt-1 flex items-center gap-3">
                          <a 
                            href={selectedCourse.rexReaderUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 underline"
                          >
                            <span>Read Online (HTML Edition)</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Open Library Details */}
                  {selectedCourse.source === 'openlibrary' && (
                    <div className="p-3 rounded-2xl bg-sky-950/25 border border-sky-500/25 text-xs space-y-1.5 mt-2">
                      <p className="text-sky-300 font-bold flex items-center gap-1.5 text-xs">
                        <Globe size={14} className="text-sky-400" />
                        Open Library Catalog & Digital Lending
                      </p>
                      <p className="text-white/70 text-[11px] leading-relaxed">
                        Open Library is an initiative of the Internet Archive. Readers can borrow books digitally or view bibliographic records and summaries.
                      </p>
                      {selectedCourse.openstaxPageUrl && (
                        <div className="pt-1 flex items-center gap-3">
                          <a 
                            href={selectedCourse.openstaxPageUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300 underline"
                          >
                            <span>View on Open Library</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. COURSE CONTENT TAB (WAS GALLERY) */}
            {courseDetailTab === 'gallery' && (
              <div className="space-y-5 pt-2">
                {/* Image Previews Section */}
                <div className="space-y-2">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                    Attached Images & Diagrams
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {previewImages.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setFullImageView(img)}
                        className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 cursor-pointer group bg-purple-950/20"
                      >
                        <img src={img} alt="content" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <Eye size={18} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attached Documents List */}
                <div className="space-y-2">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                    Attached Study Documents ({selectedCourse.attachedDocs?.length || 0})
                  </h3>
                  
                  {(!selectedCourse.attachedDocs || selectedCourse.attachedDocs.length === 0) ? (
                    <div className="p-4 rounded-2xl border border-dashed text-center text-xs opacity-60">
                      No standalone PDF documents attached. All materials are included in the lecture summary.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedCourse.attachedDocs.map((docItem) => (
                        <div
                          key={docItem.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                            theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100/80 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 shrink-0">
                              <FileText size={18} />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold truncate">{docItem.name}</p>
                              <p className={`text-[10px] ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>
                                {formatBytes(docItem.size)} • PDF Document
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-purple-600/20 text-purple-300 hidden sm:inline-block">
                              Included
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const cleanDocName = docItem.name || `${selectedCourse.code}_document.pdf`;
                                const docUrl = (docItem as any).verifiedPdfUrl || docItem.url || (docItem as any).dataUrl;
                                if (docUrl && (docUrl.startsWith('http://') || docUrl.startsWith('https://'))) {
                                  const directDocUrl = `/api/courses/direct-download?url=${encodeURIComponent(docUrl)}&filename=${encodeURIComponent(cleanDocName)}`;
                                  const link = document.createElement('a');
                                  link.href = directDocUrl;
                                  link.download = cleanDocName;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  setUserNotification(`📥 Downloading "${cleanDocName}" directly to device...`);
                                } else if (docUrl && docUrl.startsWith('data:')) {
                                  const link = document.createElement('a');
                                  link.href = docUrl;
                                  link.download = cleanDocName;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  setUserNotification(`📥 Downloading "${cleanDocName}" directly to device...`);
                                } else if (selectedCourse.driveFileId) {
                                  const link = document.createElement('a');
                                  link.href = `/api/drive/download/${selectedCourse.driveFileId}`;
                                  link.download = cleanDocName;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  setUserNotification(`📥 Downloading "${cleanDocName}" directly to device...`);
                                } else if (selectedCourse.isOpenStax && selectedCourse.verifiedPdfUrl) {
                                  const directDocUrl = `/api/courses/direct-download?url=${encodeURIComponent(selectedCourse.verifiedPdfUrl)}&filename=${encodeURIComponent(cleanDocName)}`;
                                  const link = document.createElement('a');
                                  link.href = directDocUrl;
                                  link.download = cleanDocName;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  setUserNotification(`📥 Downloading "${cleanDocName}" directly to device...`);
                                } else {
                                  setUserNotification(`📥 Document content included in course study notes.`);
                                }
                              }}
                              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white transition-all cursor-pointer shrink-0"
                              title="Download this document directly to your device"
                            >
                              <Download size={12} />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notice instructing user to tap bottom Download */}
                  <p className="text-[11px] text-center pt-2 text-purple-400 font-medium">
                    Tap the <strong>Download</strong> button below to download the entire course package to your phone.
                  </p>
                </div>
              </div>
            )}

            {/* 3. REVIEW TAB */}
            {courseDetailTab === 'review' && (
              <div className="space-y-5 pt-2">
                {/* Write a Review Section */}
                <form onSubmit={handleSubmitReview} className={`p-4 rounded-2xl border space-y-3 ${
                  theme === 'dark' ? 'bg-[#18132A] border-purple-500/30' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
                    Leave a Course Review
                  </h3>

                  {/* Interactive Star Selection */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium opacity-70">Your Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 cursor-pointer transition-transform hover:scale-125"
                        >
                          <Star 
                            size={18} 
                            className={star <= reviewRating ? "text-amber-400 fill-amber-400" : "text-slate-400"} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment input */}
                  <div className="flex items-center gap-2">
                    <input 
                      type="text"
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Write your feedback on this course..."
                      className={`flex-1 p-2.5 rounded-xl border text-xs outline-none focus:border-purple-500 ${
                        theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <Send size={13} />
                      <span>Post</span>
                    </button>
                  </div>
                </form>

                {/* Existing Reviews List */}
                <div className="space-y-3">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                    Student Reviews ({selectedCourse.reviews?.length || 0})
                  </h3>

                  {(!selectedCourse.reviews || selectedCourse.reviews.length === 0) ? (
                    <div className="p-6 rounded-2xl border text-center text-xs opacity-60">
                      No student reviews yet. Be the first to leave a review!
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedCourse.reviews.map((rev) => (
                        <div 
                          key={rev.id}
                          className={`p-3.5 rounded-2xl border space-y-1.5 ${
                            theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-xs">
                                {rev.userName[0].toUpperCase()}
                              </div>
                              <span className="text-xs font-bold">{rev.userName}</span>
                            </div>
                            <div className="flex items-center gap-1 text-amber-400">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <Star key={i} size={11} className="fill-amber-400" />
                              ))}
                            </div>
                          </div>
                          <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}>
                            {rev.comment}
                          </p>
                          <span className={`text-[10px] block ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>
                            {rev.createdAt}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sticky Bottom Footer Bar (Exact Match: Total Size / Download or Borrow) */}
          <div 
            className="fixed bottom-0 left-0 right-0 z-30 px-5 pt-3.5 backdrop-blur-xl border-t transition-colors duration-300"
            style={{
              paddingBottom: getSafeBottomPadding(12),
              backgroundColor: theme === 'dark' ? 'rgba(19, 17, 28, 0.96)' : 'rgba(255, 255, 255, 0.96)',
              borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(226, 232, 240, 0.9)'
            }}
          >
            <div className="max-w-md mx-auto flex items-center justify-between gap-4">
              {/* Total Size / Access Mode */}
              <div className="space-y-0.5">
                <span className={`text-[11px] font-medium block ${theme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>
                  {selectedCourse.capabilities?.borrowable && !selectedCourse.capabilities?.downloadable ? 'Access Mode' : 'Total Size'}
                </span>
                <p className="text-base font-black text-purple-500 dark:text-purple-400 leading-none">
                  {selectedCourse.capabilities?.borrowable && !selectedCourse.capabilities?.downloadable ? (
                    <span>Digital Lending</span>
                  ) : (
                    <>
                      {formatBytes(selectedCourse.totalSizeBytes)}{' '}
                      <span className={`text-[10px] font-normal ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>(&le;60MB)</span>
                    </>
                  )}
                </p>
              </div>

              {/* Action Button: Download OR Borrow on Open Library */}
              {(() => {
                const isDownloaded = isCourseDownloaded(selectedCourse.id, selectedCourse.code, selectedCourse.title);
                const isBorrowOnly = selectedCourse.capabilities?.borrowable && !selectedCourse.capabilities?.downloadable;

                if (isBorrowOnly) {
                  const borrowUrl = selectedCourse.openstaxPageUrl || selectedCourse.rexReaderUrl || `https://openlibrary.org/search?q=${encodeURIComponent(selectedCourse.title)}`;
                  return (
                    <a
                      href={borrowUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3.5 px-6 rounded-full font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30 cursor-pointer"
                    >
                      <ExternalLink size={16} />
                      <span>Borrow on Open Library</span>
                    </a>
                  );
                }

                return (
                  <button
                    onClick={isDownloaded ? undefined : handleDownloadCourse}
                    disabled={isDownloading || isDownloaded}
                    className={`flex-1 py-3.5 px-6 rounded-full font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
                      isDownloaded
                        ? 'bg-emerald-600 text-white shadow-emerald-600/20 cursor-default opacity-95'
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30 cursor-pointer disabled:opacity-50'
                    }`}
                  >
                    {isDownloading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Downloading...</span>
                      </>
                    ) : isDownloaded ? (
                      <>
                        <Check size={16} className="stroke-[3]" />
                        <span>Downloaded</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <span>Download</span>
                      </>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 3. FULL IMAGE LIGHTBOX VIEWER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {fullImageView && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setFullImageView(null)}
          >
            <button 
              onClick={() => setFullImageView(null)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center cursor-pointer"
            >
              <X size={20} />
            </button>
            <img src={fullImageView} alt="full preview" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 4. DOWNLOAD SUCCESS MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {downloadSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDownloadSuccessModal(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative z-10 w-full max-w-sm rounded-3xl p-6 text-center space-y-4 shadow-2xl border ${
                theme === 'dark' ? 'bg-[#171328] border-purple-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold">Course Downloaded!</h3>
                <p className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                  "{downloadSuccessModal}" has been saved to your local device and added to your Notes library.
                </p>
              </div>
              <button
                onClick={() => setDownloadSuccessModal(null)}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-2xl shadow-lg cursor-pointer"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 5. FILTER DRAWER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isFilterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={`relative z-10 w-full max-w-md h-full overflow-y-auto p-6 flex flex-col justify-between custom-scrollbar shadow-2xl border-l ${
                theme === 'dark' 
                  ? 'bg-[#151124] border-purple-500/20 text-white' 
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={20} className="text-purple-400" />
                    <h2 className="text-lg font-bold">Filter Courses</h2>
                  </div>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>
                    Sort Courses By
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'newest', label: 'Newest First' },
                      { id: 'likes', label: 'Most Liked ❤️' },
                      { id: 'rating', label: 'Top Rated ⭐' },
                      { id: 'az', label: 'Code (A - Z)' }
                    ].map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSortBy(s.id as any)}
                        className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all border ${
                          sortBy === s.id
                            ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                            : theme === 'dark'
                            ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>
                    Faculty
                  </label>
                  <div className="relative">
                    <select
                      value={selectedFaculty}
                      onChange={(e) => {
                        setSelectedFaculty(e.target.value);
                        setSelectedDepartment('');
                      }}
                      className={`w-full p-3.5 rounded-xl border appearance-none text-xs font-bold outline-none pr-10 cursor-pointer ${
                        theme === 'dark'
                          ? 'bg-[#1E1735] border-purple-500/20 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    >
                      <option value="ALL">All Faculties</option>
                      {FACULTIES.map(f => (
                        <option key={f} value={f} className="bg-slate-900 text-white">{f}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    placeholder="e.g. Computer Science, Mathematics..."
                    className={`w-full p-3.5 rounded-xl border text-xs font-medium outline-none focus:border-purple-500 ${
                      theme === 'dark'
                        ? 'bg-[#1E1735] border-purple-500/20 text-white placeholder:text-white/30'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                  {selectedFaculty !== 'ALL' && DEPARTMENTS[selectedFaculty] && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {DEPARTMENTS[selectedFaculty].slice(0, 6).map(dept => (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => setSelectedDepartment(dept)}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                            selectedDepartment === dept
                              ? 'bg-purple-600 text-white border-purple-400'
                              : 'bg-white/5 border-white/10 text-purple-300 hover:bg-white/10'
                          }`}
                        >
                          {dept}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>
                    Academic Level
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['ALL', '100L', '200L', '300L', '400L', '500L', 'Postgraduate'].map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSelectedLevel(lvl)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          selectedLevel === lvl
                            ? 'bg-purple-600 text-white border-purple-400'
                            : theme === 'dark'
                            ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {lvl === 'ALL' ? 'All Levels' : lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFaculty('ALL');
                    setSelectedDepartment('');
                    setSelectedLevel('ALL');
                    setSortBy('newest');
                  }}
                  className={`flex-1 py-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 6. UPLOAD COURSE CONTENT MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isUploading && setIsUploadModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            />

            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className={`relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border p-5 sm:p-7 space-y-5 shadow-2xl custom-scrollbar ${
                theme === 'dark' 
                  ? 'bg-[#151124] border-purple-500/30 text-white' 
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Upload Course Content</h2>
                    <p className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                      Share lecture notes, PDFs (up to 50MB) and images (up to 5MB)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handlePublishCourse} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-purple-400">
                      Course Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={uploadFormData.code}
                      onChange={(e) => setUploadFormData({ ...uploadFormData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. MTH 101"
                      className={`w-full p-3 rounded-xl border text-xs sm:text-sm font-bold font-mono outline-none focus:border-purple-500 ${
                        theme === 'dark'
                          ? 'bg-[#1E1735] border-purple-500/20 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-purple-400">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={uploadFormData.title}
                      onChange={(e) => setUploadFormData({ ...uploadFormData, title: e.target.value })}
                      placeholder="e.g. Elementary Mathematics I"
                      className={`w-full p-3 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:border-purple-500 ${
                        theme === 'dark'
                          ? 'bg-[#1E1735] border-purple-500/20 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-purple-400">
                      Faculty *
                    </label>
                    <div className="relative">
                      <select
                        value={uploadFormData.faculty}
                        onChange={(e) => setUploadFormData({ 
                          ...uploadFormData, 
                          faculty: e.target.value,
                          department: ''
                        })}
                        className={`w-full p-3 rounded-xl border appearance-none text-xs font-bold outline-none pr-10 cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-[#1E1735] border-purple-500/20 text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        {FACULTIES.map(f => (
                          <option key={f} value={f} className="bg-slate-900 text-white">{f}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-purple-400">
                      Department *
                    </label>
                    <input
                      type="text"
                      required
                      value={uploadFormData.department}
                      onChange={(e) => setUploadFormData({ ...uploadFormData, department: e.target.value })}
                      placeholder="e.g. Computer Science"
                      className={`w-full p-3 rounded-xl border text-xs sm:text-sm font-medium outline-none focus:border-purple-500 ${
                        theme === 'dark'
                          ? 'bg-[#1E1735] border-purple-500/20 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    Academic Level
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['100L', '200L', '300L', '400L', '500L', 'Postgraduate'].map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setUploadFormData({ ...uploadFormData, level: lvl })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          uploadFormData.level === lvl
                            ? 'bg-purple-600 text-white border-purple-400'
                            : theme === 'dark'
                            ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-purple-400">
                      Lecture Notes & Summary
                    </label>
                    <button
                      type="button"
                      disabled={isGeneratingAiNotes}
                      onClick={handleGenerateAiNotes}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles size={13} className={isGeneratingAiNotes ? "animate-spin" : ""} />
                      <span>{isGeneratingAiNotes ? "Drafting..." : "AI Generate Notes"}</span>
                    </button>
                  </div>

                  <textarea
                    value={uploadFormData.notes}
                    onChange={(e) => setUploadFormData({ ...uploadFormData, notes: e.target.value })}
                    rows={4}
                    placeholder="Type or paste notes, formulas, and key study points..."
                    className={`w-full p-3 rounded-2xl border text-xs sm:text-sm leading-relaxed outline-none focus:border-purple-500 font-sans custom-scrollbar ${
                      theme === 'dark'
                        ? 'bg-[#1E1735] border-purple-500/20 text-white placeholder:text-white/30'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center justify-between">
                    <span>Attached Documents (PDF ≤ 50MB, Images ≤ 5MB)</span>
                    <span className="text-[10px] text-white/50 lowercase">
                      {attachedFiles.length} file(s)
                    </span>
                  </label>

                  <label className={`w-full p-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    theme === 'dark' 
                      ? 'border-purple-500/30 bg-purple-950/20 hover:border-purple-500 hover:bg-purple-950/40' 
                      : 'border-purple-300 bg-purple-50/50 hover:border-purple-500 hover:bg-purple-50'
                  }`}>
                    <input 
                      type="file" 
                      multiple 
                      accept=".pdf,image/*" 
                      onChange={handleFileSelection} 
                      className="hidden" 
                    />
                    <Download size={20} className="text-purple-400" />
                    <div className="text-center">
                      <p className="text-xs font-bold">Click or drag files to attach</p>
                      <p className={`text-[10px] ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>
                        PDFs (up to 50MB) and Images (up to 5MB)
                      </p>
                    </div>
                  </label>

                  {attachedFiles.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {attachedFiles.map((file) => (
                        <div 
                          key={file.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                            theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {file.type === 'pdf' ? (
                              <FileText size={18} className="text-red-400 shrink-0" />
                            ) : (
                              <ImageIcon size={18} className="text-cyan-400 shrink-0" />
                            )}
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold truncate">{file.name}</p>
                              <p className="text-[10px] text-white/50">{formatBytes(file.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachedFile(file.id)}
                            className="p-1 rounded-lg text-red-400 hover:bg-red-500/10 cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => setIsUploadModalOpen(false)}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? (
                      <><RefreshCw size={14} className="animate-spin" /> Uploading...</>
                    ) : (
                      "Publish Course"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* UNIFIED STANDARDIZED DELETE CONFIRMATION DIALOG                           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showDeleteConfirm && courseToDelete && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isDeletingCourse) {
                  setShowDeleteConfirm(false);
                  setCourseToDelete(null);
                }
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 w-full max-w-sm rounded-3xl border border-red-500/30 p-6 shadow-2xl space-y-4 text-center bg-[#18132A] text-white"
            >
              {/* Warning Icon Badge */}
              <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
                <Trash2 size={26} className="animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-black text-white">
                  Delete Course?
                </h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  Are you sure you want to delete <strong className="text-white font-bold">{courseToDelete.code} - {courseToDelete.title}</strong>? This will permanently remove the course and its attached documents.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeletingCourse}
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setCourseToDelete(null);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingCourse}
                  onClick={handleDeleteCourse}
                  className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 text-xs font-black text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isDeletingCourse ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  <span>{isDeletingCourse ? 'Deleting...' : 'Delete'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
