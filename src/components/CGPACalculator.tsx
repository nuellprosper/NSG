import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, ChevronRight, ArrowLeft, Plus, Minus, Download, RotateCcw, 
  Sparkles, Check, ChevronDown, BookOpen, AlertCircle, Trophy, TrendingUp,
  Award, FileText, CheckCircle2, Search, Sliders, Zap, ShieldAlert, X,
  Upload, Image as ImageIcon, CheckSquare, Layers, Calendar, Trash2, Filter
} from 'lucide-react';
import { scheduleLocalNotification } from '../lib/capacitor/notifications';
import { extractPdfDetails } from '../utils';
import { COMPREHENSIVE_COURSE_LIST, StandardCourse } from '../data/coursesData';

export interface CourseGradeItem {
  id: string;
  code: string;
  title?: string;
  credits: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}

export interface SemesterData {
  courses: CourseGradeItem[];
  gpa: number;
  totalUnits: number;
  totalPoints: number;
}

export interface LevelData {
  level: number; // 100, 200, 300, 400, 500, 600, etc.
  firstSemester: SemesterData;
  secondSemester: SemesterData;
  cumulative: number;
  weightedPoint: number;
}

export interface RegisteredCourse {
  id: string;
  code: string;
  title: string;
  credits: number;
  semester?: 'first' | 'second';
  isElective?: boolean;
}

export interface CurrentSemesterStanding {
  level: number; // 100, 200, 300, 400, 500
  semester: 'first' | 'second' | 'both';
  firstSemesterCourses?: RegisteredCourse[];
  secondSemesterCourses?: RegisteredCourse[];
  courses: RegisteredCourse[];
  updatedAt?: number;
}

interface CGPACalculatorProps {
  theme?: string;
  user?: any;
  currentUserData?: any;
  setUserNotification?: (msg: string) => void;
  onBack?: () => void;
  onOpenTimetable?: () => void;
}

const DEFAULT_SCALES = [
  { value: 3.0, label: '3.0 Scale' },
  { value: 4.0, label: '4.0 Scale' },
  { value: 5.0, label: '5.0 Scale (Standard)' },
  { value: 6.0, label: '6.0 Scale' },
  { value: 7.0, label: '7.0 Scale' },
  { value: 8.0, label: '8.0 Scale' },
  { value: 9.0, label: '9.0 Scale' },
  { value: 10.0, label: '10.0 Scale' },
  { value: 11.0, label: '11.0 Scale' },
  { value: 12.0, label: '12.0 Scale' }
];

export const CGPACalculator: React.FC<CGPACalculatorProps> = ({
  theme = 'dark',
  user,
  currentUserData,
  setUserNotification,
  onBack,
  onOpenTimetable
}) => {
  const [scale, setScale] = useState<number>(5.0);
  const [showScaleModal, setShowScaleModal] = useState<boolean>(false);
  const [levels, setLevels] = useState<LevelData[]>([]);
  const [editingLevel, setEditingLevel] = useState<{ levelIndex: number; semester: 'first' | 'second' } | null>(null);
  
  // Current Semester & Course Registration Form State
  const [showCourseRegistration, setShowCourseRegistration] = useState<boolean>(false);
  const [activeOfferedSemesterFilter, setActiveOfferedSemesterFilter] = useState<'all' | 'first' | 'second'>('all');
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState<boolean>(false);
  
  const [currentStanding, setCurrentStanding] = useState<CurrentSemesterStanding>({
    level: 100,
    semester: 'first',
    firstSemesterCourses: [
      { id: '1', code: 'GST 101', title: 'Use of English and Communication Skills I', credits: 2, semester: 'first' },
      { id: '2', code: 'MTH 101', title: 'Elementary Mathematics I', credits: 3, semester: 'first' },
      { id: '3', code: 'PHY 101', title: 'General Physics I', credits: 3, semester: 'first' },
      { id: '4', code: 'CHM 101', title: 'General Chemistry I', credits: 3, semester: 'first' },
      { id: '5', code: 'CSC 101', title: 'Introduction to Computer Science', credits: 3, semester: 'first' }
    ],
    secondSemesterCourses: [
      { id: '6', code: 'GST 104', title: 'History and Philosophy of Science', credits: 2, semester: 'second' },
      { id: '7', code: 'MTH 102', title: 'Elementary Mathematics II (Calculus)', credits: 3, semester: 'second' },
      { id: '8', code: 'PHY 102', title: 'General Physics II', credits: 3, semester: 'second' },
      { id: '9', code: 'CSC 102', title: 'Computer Programming I', credits: 3, semester: 'second' }
    ],
    courses: [
      { id: '1', code: 'GST 101', title: 'Use of English and Communication Skills I', credits: 2, semester: 'first' },
      { id: '2', code: 'MTH 101', title: 'Elementary Mathematics I', credits: 3, semester: 'first' },
      { id: '3', code: 'PHY 101', title: 'General Physics I', credits: 3, semester: 'first' },
      { id: '4', code: 'CHM 101', title: 'General Chemistry I', credits: 3, semester: 'first' },
      { id: '5', code: 'CSC 101', title: 'Introduction to Computer Science', credits: 3, semester: 'first' }
    ]
  });

  const [isParsingSlip, setIsParsingSlip] = useState<boolean>(false);
  const [slipError, setSlipError] = useState<string | null>(null);
  const slipFileInputRef = useRef<HTMLInputElement>(null);

  // Course picker state
  const [showCoursePicker, setShowCoursePicker] = useState<boolean>(false);
  const [coursePickerSemester, setCoursePickerSemester] = useState<'all' | 'first' | 'second'>('all');
  const [coursePickerLevelFilter, setCoursePickerLevelFilter] = useState<number | 'all'>('all');
  const [coursePickerTargetIndex, setCoursePickerTargetIndex] = useState<number | null>(null);
  const [coursePickerMode, setCoursePickerMode] = useState<'editSemester' | 'addOffered'>('editSemester');
  const [courseSearchQuery, setCourseSearchQuery] = useState<string>('');

  // AI Target Advisor State
  const [showAdvisor, setShowAdvisor] = useState<boolean>(false);
  const [advisorTargetClass, setAdvisorTargetClass] = useState<'first' | 'upper' | 'lower'>('first');

  // Initialize from LocalStorage (Completely Offline)
  useEffect(() => {
    const storageKey = `nsg_cgpa_data_${user?.uid || 'guest'}`;
    const standingKey = `nsg_registered_courses_${user?.uid || 'guest'}`;

    const savedStanding = localStorage.getItem(standingKey);
    if (savedStanding) {
      try {
        const parsedStanding = JSON.parse(savedStanding);
        if (parsedStanding.level) {
          const firstCourses: RegisteredCourse[] = Array.isArray(parsedStanding.firstSemesterCourses) 
            ? parsedStanding.firstSemesterCourses 
            : (parsedStanding.courses || []).filter((c: any) => c.semester === 'first');
          
          const secondCourses: RegisteredCourse[] = Array.isArray(parsedStanding.secondSemesterCourses) 
            ? parsedStanding.secondSemesterCourses 
            : (parsedStanding.courses || []).filter((c: any) => c.semester === 'second');

          const allCourses: RegisteredCourse[] = Array.isArray(parsedStanding.courses) && parsedStanding.courses.length > 0
            ? parsedStanding.courses
            : [...firstCourses, ...secondCourses];

          setCurrentStanding({
            level: parsedStanding.level || 100,
            semester: parsedStanding.semester || 'first',
            firstSemesterCourses: firstCourses,
            secondSemesterCourses: secondCourses,
            courses: allCourses
          });
        }
      } catch (e) {
        console.error("Error loading registered standing", e);
      }
    }

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.scale) setScale(parsed.scale);
        if (parsed.levels && Array.isArray(parsed.levels)) {
          setLevels(parsed.levels);
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved CGPA data", e);
      }
    }

    // Default initial state: 100, 200, 300, 400, 500 Levels
    const initialLevels: LevelData[] = [100, 200, 300, 400, 500].map(lvl => ({
      level: lvl,
      firstSemester: {
        courses: [
          { id: '1', code: 'GST ' + lvl, credits: 2, grade: 'A' },
          { id: '2', code: 'MTH ' + lvl, credits: 3, grade: 'A' },
          { id: '3', code: 'CSC ' + (lvl + 1), credits: 3, grade: 'A' },
          { id: '4', code: 'PHY ' + lvl, credits: 3, grade: 'A' }
        ],
        gpa: 0,
        totalUnits: 0,
        totalPoints: 0
      },
      secondSemester: {
        courses: [
          { id: '1', code: 'GST ' + (lvl + 3), credits: 2, grade: 'A' },
          { id: '2', code: 'MTH ' + (lvl + 2), credits: 3, grade: 'A' },
          { id: '3', code: 'CSC ' + (lvl + 2), credits: 3, grade: 'A' },
          { id: '4', code: 'PHY ' + (lvl + 2), credits: 3, grade: 'A' }
        ],
        gpa: 0,
        totalUnits: 0,
        totalPoints: 0
      },
      cumulative: 0,
      weightedPoint: 0
    }));
    setLevels(initialLevels);
  }, [user?.uid]);

  // Helper to get grade points based on active scale
  const getGradePoints = useCallback((grade: string, activeScale: number): number => {
    const g = grade.toUpperCase();
    if (activeScale === 5.0) {
      switch (g) {
        case 'A': return 5.0;
        case 'B': return 4.0;
        case 'C': return 3.0;
        case 'D': return 2.0;
        case 'E': return 1.0;
        case 'F': default: return 0.0;
      }
    } else if (activeScale === 4.0) {
      switch (g) {
        case 'A': return 4.0;
        case 'B': return 3.0;
        case 'C': return 2.0;
        case 'D': return 1.0;
        case 'E': return 0.5;
        case 'F': default: return 0.0;
      }
    } else {
      const ratio = activeScale / 5.0;
      switch (g) {
        case 'A': return 5.0 * ratio;
        case 'B': return 4.0 * ratio;
        case 'C': return 3.0 * ratio;
        case 'D': return 2.0 * ratio;
        case 'E': return 1.0 * ratio;
        case 'F': default: return 0.0;
      }
    }
  }, []);

  // Compute semester calculations
  const calculateSemester = useCallback((courses: CourseGradeItem[], activeScale: number): SemesterData => {
    let totalUnits = 0;
    let totalPoints = 0;

    courses.forEach(c => {
      const units = Number(c.credits) || 0;
      if (units > 0 && c.code && c.code.trim()) {
        totalUnits += units;
        const pts = getGradePoints(c.grade, activeScale);
        totalPoints += units * pts;
      }
    });

    const gpa = totalUnits > 0 ? Number((totalPoints / totalUnits).toFixed(2)) : 0;
    return { courses, gpa, totalUnits, totalPoints };
  }, [getGradePoints]);

  // Recalculate level cumulatives and overall CGPA
  const calculatedLevels = useMemo(() => {
    return levels.map(lvl => {
      const s1 = calculateSemester(lvl.firstSemester.courses, scale);
      const s2 = calculateSemester(lvl.secondSemester.courses, scale);
      const totalUnits = s1.totalUnits + s2.totalUnits;
      const totalPoints = s1.totalPoints + s2.totalPoints;
      const cumulative = totalUnits > 0 ? Number((totalPoints / totalUnits).toFixed(2)) : 0;
      const weightedPoint = totalUnits > 0 ? Math.min(100, Math.round((cumulative / scale) * 100)) : 0;

      return {
        level: lvl.level,
        firstSemester: s1,
        secondSemester: s2,
        cumulative,
        weightedPoint
      };
    });
  }, [levels, scale, calculateSemester]);

  // Check if user has ONLY 100 Level First Semester evaluated
  const isFirstSemOnly = useMemo(() => {
    const s1Units100 = calculatedLevels.find(l => l.level === 100)?.firstSemester?.totalUnits || 0;
    const s2Units100 = calculatedLevels.find(l => l.level === 100)?.secondSemester?.totalUnits || 0;
    const otherLevelsUnits = calculatedLevels
      .filter(l => l.level !== 100)
      .reduce((acc, lvl) => acc + lvl.firstSemester.totalUnits + lvl.secondSemester.totalUnits, 0);

    return s1Units100 > 0 && s2Units100 === 0 && otherLevelsUnits === 0;
  }, [calculatedLevels]);

  const gpaHeaderLabel = isFirstSemOnly ? 'GPA' : 'CGPA';
  const gpaFullTitle = isFirstSemOnly ? 'First Semester GPA' : 'Cumulative CGPA';

  // Total Cumulative CGPA across all levels
  const overallStats = useMemo(() => {
    let totalUnits = 0;
    let totalPoints = 0;

    calculatedLevels.forEach(lvl => {
      totalUnits += lvl.firstSemester.totalUnits + lvl.secondSemester.totalUnits;
      totalPoints += lvl.firstSemester.totalPoints + lvl.secondSemester.totalPoints;
    });

    const cgpa = totalUnits > 0 ? Number((totalPoints / totalUnits).toFixed(4)) : 0;
    const normalized = (cgpa / scale) * 5.0;

    let degreeClass = 'No Records Yet';
    let degreeClassShort = 'Uncalculated';
    let badgeColor = 'from-slate-600 to-slate-700';

    if (totalUnits > 0) {
      if (normalized >= 4.50) {
        degreeClass = 'First Class Honours';
        degreeClassShort = 'First Class';
        badgeColor = 'from-amber-500 to-yellow-400';
      } else if (normalized >= 3.50) {
        degreeClass = 'Second Class Honours (Upper Division)';
        degreeClassShort = 'Second Class Upper (2:1)';
        badgeColor = 'from-emerald-500 to-teal-400';
      } else if (normalized >= 2.40) {
        degreeClass = 'Second Class Honours (Lower Division)';
        degreeClassShort = 'Second Class Lower (2:2)';
        badgeColor = 'from-blue-500 to-indigo-400';
      } else if (normalized >= 1.50) {
        degreeClass = 'Third Class Honours';
        degreeClassShort = 'Third Class';
        badgeColor = 'from-orange-500 to-amber-600';
      } else {
        degreeClass = 'Pass Degree';
        degreeClassShort = 'Pass';
        badgeColor = 'from-red-600 to-rose-700';
      }
    }

    return {
      cgpa,
      totalUnits,
      totalPoints,
      degreeClass,
      degreeClassShort,
      badgeColor,
      normalized
    };
  }, [calculatedLevels, scale]);

  // Save to LocalStorage and sync profile state
  const saveToStorageAndSync = useCallback((newLevels: LevelData[], newScale: number) => {
    const storageKey = `nsg_cgpa_data_${user?.uid || 'guest'}`;
    const payload = {
      scale: newScale,
      levels: newLevels,
      cgpa: overallStats.cgpa,
      degreeClass: overallStats.degreeClassShort,
      isFirstSemOnly,
      label: isFirstSemOnly ? 'GPA' : 'CGPA',
      updatedAt: Date.now()
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    
    // Also store for global quick profile lookup
    localStorage.setItem('nsg_current_user_cgpa', JSON.stringify({
      cgpa: overallStats.cgpa.toFixed(2),
      scale: newScale.toFixed(1),
      degreeClass: overallStats.degreeClassShort,
      normalized: overallStats.normalized,
      isFirstSemOnly,
      label: isFirstSemOnly ? 'GPA' : 'CGPA'
    }));

    // Trigger proactive notification based on performance
    triggerAcademicGuidanceNotification(overallStats.cgpa, newScale, overallStats.normalized);
  }, [user?.uid, overallStats, isFirstSemOnly]);

  // Save Registered Courses
  const saveCurrentStanding = (newStanding: CurrentSemesterStanding) => {
    // Ensure both semester arrays and combined courses are consistent
    const firstCourses = newStanding.firstSemesterCourses || [];
    const secondCourses = newStanding.secondSemesterCourses || [];
    const combinedCourses = [...firstCourses, ...secondCourses];

    const consolidatedStanding: CurrentSemesterStanding = {
      ...newStanding,
      firstSemesterCourses: firstCourses,
      secondSemesterCourses: secondCourses,
      courses: combinedCourses,
      updatedAt: Date.now()
    };

    setCurrentStanding(consolidatedStanding);
    const standingKey = `nsg_registered_courses_${user?.uid || 'guest'}`;
    localStorage.setItem(standingKey, JSON.stringify(consolidatedStanding));
  };

  // Academic Guidance Notification Trigger
  const triggerAcademicGuidanceNotification = (cgpa: number, activeScale: number, norm: number) => {
    if (cgpa <= 0) return;
    const userName = currentUserData?.displayName || currentUserData?.fullName || 'Scholar';

    if (norm >= 4.50) {
      scheduleLocalNotification(
        `🏆 First Class Standing (${cgpa.toFixed(2)} / ${activeScale.toFixed(1)})`,
        `Amazing work, ${userName}! Set your reading timetable to maintain straight A's and protect your First Class position this semester.`,
        Date.now(),
        'nsg_scholar_achievements'
      );
    } else if (norm >= 3.50) {
      scheduleLocalNotification(
        `🚀 Push for First Class (${cgpa.toFixed(2)} CGPA)`,
        `You are in Second Class Upper, ${userName}! Add next semester courses in the CGPA tool to calculate how many A's you need to break into First Class!`,
        Date.now(),
        'nsg_scholar_achievements'
      );
    } else if (norm >= 2.40) {
      scheduleLocalNotification(
        `📈 Boost Your CGPA (${cgpa.toFixed(2)})`,
        `${userName}, let's upgrade to Second Class Upper! Set a steady study timetable and register next semester courses to aim for 4.5+ semester GPA.`,
        Date.now(),
        'nsg_scholar_achievements'
      );
    } else {
      scheduleLocalNotification(
        `⚡ CGPA Recovery Mode (${cgpa.toFixed(2)})`,
        `${userName}, consistency is key. Set up your reading timetable today, attend every lecture, and use Smart Quizzes to boost your CGPA!`,
        Date.now(),
        'nsg_scholar_achievements'
      );
    }
  };

  // Smart Parse Course Registration Form (Differentiates 1st & 2nd Semesters)
  const handleUploadCourseRegistrationSlip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingSlip(true);
    setSlipError(null);

    try {
      const details = await extractPdfDetails(file);
      const fullText = details.text || '';

      if (!fullText.trim()) {
        throw new Error("Could not read text from this document. Please ensure the document is clear.");
      }

      // Detect Level from document text (e.g. 100, 200, 300, 400, 500)
      let detectedLevel = currentStanding.level;
      if (fullText.includes('100') || fullText.toLowerCase().includes('year 1') || fullText.toLowerCase().includes('100 level')) detectedLevel = 100;
      else if (fullText.includes('200') || fullText.toLowerCase().includes('year 2') || fullText.toLowerCase().includes('200 level')) detectedLevel = 200;
      else if (fullText.includes('300') || fullText.toLowerCase().includes('year 3') || fullText.toLowerCase().includes('300 level')) detectedLevel = 300;
      else if (fullText.includes('400') || fullText.toLowerCase().includes('year 4') || fullText.toLowerCase().includes('400 level')) detectedLevel = 400;
      else if (fullText.includes('500') || fullText.toLowerCase().includes('year 5') || fullText.toLowerCase().includes('500 level')) detectedLevel = 500;

      // Smart Dual-Semester Parser: Look for First Semester and Second Semester sections
      const lines = fullText.split(/\r?\n/);
      let currentSection: 'first' | 'second' = 'first';
      let foundTwoSemesters = false;

      const firstSemList: RegisteredCourse[] = [];
      const secondSemList: RegisteredCourse[] = [];
      const seenCodes = new Set<string>();

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const lower = line.toLowerCase();

        // Check if line indicates section header
        if (
          lower.includes('second semester') || 
          lower.includes('2nd semester') || 
          lower.includes('rain semester') ||
          lower.includes('omega semester') ||
          lower.includes('semester 2') ||
          lower.includes('second sem') ||
          lower.includes('2nd sem')
        ) {
          currentSection = 'second';
          foundTwoSemesters = true;
          continue;
        } else if (
          lower.includes('first semester') || 
          lower.includes('1st semester') || 
          lower.includes('harmattan semester') ||
          lower.includes('alpha semester') ||
          lower.includes('semester 1') ||
          lower.includes('first sem') ||
          lower.includes('1st sem')
        ) {
          currentSection = 'first';
          continue;
        }

        // Search for course codes on this line (e.g. GST 101, MTH 102, CSC 201, EEE 301, BIO 151)
        const codeMatch = line.match(/\b([A-Z]{2,4}\s*[-]?\s*\d{3}[A-Z]?)\b/i);
        if (codeMatch) {
          const rawCode = codeMatch[1].replace(/[-]/g, ' ').replace(/\s+/g, ' ').toUpperCase();
          
          if (!seenCodes.has(rawCode)) {
            seenCodes.add(rawCode);

            // Try to find standard course match from comprehensive database
            const standardMatch = COMPREHENSIVE_COURSE_LIST.find(c => 
              c.code.replace(/\s+/g, '') === rawCode.replace(/\s+/g, '')
            );

            // Extract Credit Units:
            let units = standardMatch?.credits || 3;
            const explicitUnitMatch = line.match(/\b([1-6])\s*(?:cr|units?|hrs?|credit)\b/i) 
              || line.match(/\|\s*([1-6])\s*\|/)
              || line.match(/\(\s*([1-6])\s*(?:units?|cr|credit)?\s*\)/i);
            
            if (explicitUnitMatch) {
              units = parseInt(explicitUnitMatch[1]) || units;
            } else {
              const endDigitMatch = line.match(/\b([1-6])\s*(?:[cCeErR]|compulsory|elective|required|core)?\s*$/i);
              if (endDigitMatch) {
                units = parseInt(endDigitMatch[1]) || units;
              }
            }

            // Extract Course Title:
            let extractedTitle = '';
            const parts = line.split(codeMatch[0]);
            let candidateText = (parts[1] && parts[1].trim().length > 2) ? parts[1] : (parts[0] || '');
            
            candidateText = candidateText
              .replace(/^[\|\:\-\s\d\.\,\#\)]+/, '')
              .replace(/\b([1-6])\s*(?:cr|units?|hrs?|credit)\b/gi, '')
              .replace(/\b(compulsory|elective|required|core|audit|[cCeErR])\b/gi, '')
              .replace(/\|\s*[1-6]\s*\|/g, '')
              .replace(/\(\s*[1-6]\s*(?:units?|cr)?\s*\)/gi, '')
              .replace(/[\|\(\)\[\]\:\-\_\#\*\+]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();

            if (candidateText && candidateText.length >= 3 && /[a-zA-Z]{3,}/.test(candidateText)) {
              extractedTitle = candidateText;
            } else if (standardMatch?.title) {
              extractedTitle = standardMatch.title;
            } else {
              extractedTitle = `Course ${rawCode}`;
            }

            // Determine semester based on section or standard course mapping
            let courseSem: 'first' | 'second' = currentSection;
            if (!foundTwoSemesters && standardMatch) {
              courseSem = standardMatch.semester;
            } else if (!foundTwoSemesters) {
              // Guess from course number parity (odd numbers usually 1st sem e.g. 101, 103; even numbers 2nd sem e.g. 102, 104)
              const numMatch = rawCode.match(/\d{3}/);
              if (numMatch) {
                const num = parseInt(numMatch[0]);
                courseSem = num % 2 === 1 ? 'first' : 'second';
              }
            }

            const newCourseItem: RegisteredCourse = {
              id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
              code: rawCode,
              title: extractedTitle,
              credits: units,
              semester: courseSem
            };

            if (courseSem === 'first') {
              firstSemList.push(newCourseItem);
            } else {
              secondSemList.push(newCourseItem);
            }
          }
        }
      }

      // If line-by-line found nothing, do fallback regex
      if (firstSemList.length === 0 && secondSemList.length === 0) {
        const courseRegex = /([A-Z]{2,4}\s*[-]?\s*\d{3}[A-Z]?)/gi;
        const matches = Array.from(new Set(fullText.match(courseRegex) || []));
        
        if (matches.length === 0) {
          throw new Error("No course codes detected in the uploaded course registration form.");
        }

        matches.forEach((code, idx) => {
          const cleanCode = code.replace(/[-]/g, ' ').replace(/\s+/g, ' ').toUpperCase();
          const standardMatch = COMPREHENSIVE_COURSE_LIST.find(c => 
            c.code.replace(/\s+/g, '') === cleanCode.replace(/\s+/g, '')
          );
          const sem = standardMatch?.semester || (idx % 2 === 0 ? 'first' : 'second');
          const item: RegisteredCourse = {
            id: Date.now().toString() + '_' + idx,
            code: cleanCode,
            title: standardMatch?.title || `Course ${cleanCode}`,
            credits: standardMatch?.credits || 3,
            semester: sem
          };
          if (sem === 'first') firstSemList.push(item);
          else secondSemList.push(item);
        });
      }

      const updatedStanding: CurrentSemesterStanding = {
        level: detectedLevel,
        semester: 'both',
        firstSemesterCourses: firstSemList,
        secondSemesterCourses: secondSemList,
        courses: [...firstSemList, ...secondSemList]
      };

      saveCurrentStanding(updatedStanding);
      
      const totalParsed = firstSemList.length + secondSemList.length;
      if (setUserNotification) {
        setUserNotification(
          `Smart Scan Complete! Registered ${totalParsed} courses for ${detectedLevel}L (${firstSemList.length} in 1st Sem, ${secondSemList.length} in 2nd Sem).`
        );
      }
    } catch (err: any) {
      console.error("Slip parsing error:", err);
      setSlipError(err.message || "Failed to parse course registration document.");
    } finally {
      setIsParsingSlip(false);
      if (slipFileInputRef.current) slipFileInputRef.current.value = '';
    }
  };

  // Add new level
  const handleAddLevel = () => {
    const nextLevelNum = (levels[levels.length - 1]?.level || 500) + 100;
    const newLvl: LevelData = {
      level: nextLevelNum,
      firstSemester: {
        courses: [
          { id: '1', code: '', credits: 0, grade: 'A' },
          { id: '2', code: '', credits: 0, grade: 'A' },
          { id: '3', code: '', credits: 0, grade: 'A' },
          { id: '4', code: '', credits: 0, grade: 'A' }
        ],
        gpa: 0,
        totalUnits: 0,
        totalPoints: 0
      },
      secondSemester: {
        courses: [
          { id: '1', code: '', credits: 0, grade: 'A' },
          { id: '2', code: '', credits: 0, grade: 'A' },
          { id: '3', code: '', credits: 0, grade: 'A' },
          { id: '4', code: '', credits: 0, grade: 'A' }
        ],
        gpa: 0,
        totalUnits: 0,
        totalPoints: 0
      },
      cumulative: 0,
      weightedPoint: 0
    };

    const updated = [...levels, newLvl];
    setLevels(updated);
    saveToStorageAndSync(updated, scale);
    if (setUserNotification) {
      setUserNotification(`Added ${nextLevelNum} Level to grade tracker!`);
    }
  };

  // Reset GPA
  const handleResetGPA = () => {
    if (!window.confirm("Are you sure you want to reset all entered grades?")) return;
    const reset = levels.map(lvl => ({
      ...lvl,
      firstSemester: {
        courses: [
          { id: '1', code: '', credits: 0, grade: 'A' as const },
          { id: '2', code: '', credits: 0, grade: 'A' as const },
          { id: '3', code: '', credits: 0, grade: 'A' as const },
          { id: '4', code: '', credits: 0, grade: 'A' as const }
        ],
        gpa: 0,
        totalUnits: 0,
        totalPoints: 0
      },
      secondSemester: {
        courses: [
          { id: '1', code: '', credits: 0, grade: 'A' as const },
          { id: '2', code: '', credits: 0, grade: 'A' as const },
          { id: '3', code: '', credits: 0, grade: 'A' as const },
          { id: '4', code: '', credits: 0, grade: 'A' as const }
        ],
        gpa: 0,
        totalUnits: 0,
        totalPoints: 0
      },
      cumulative: 0,
      weightedPoint: 0
    }));
    setLevels(reset);
    saveToStorageAndSync(reset, scale);
    if (setUserNotification) setUserNotification("CGPA calculator reset to 0.00");
  };

  // Delete All Registered Courses
  const handleDeleteAllOfferedCourses = () => {
    const emptyStanding: CurrentSemesterStanding = {
      level: currentStanding.level,
      semester: currentStanding.semester,
      firstSemesterCourses: [],
      secondSemesterCourses: [],
      courses: []
    };
    saveCurrentStanding(emptyStanding);
    setShowDeleteAllConfirm(false);
    if (setUserNotification) {
      setUserNotification("Cleared all registered courses successfully!");
    }
  };

  // Download PDF Result Slip
  const handleDownloadPDF = () => {
    const textContent = `
========================================
       NSG SCHOLAR ACADEMIC RESULT SLIP
========================================
Student Name: ${currentUserData?.fullName || currentUserData?.displayName || 'NSG Student'}
Handle: @${currentUserData?.username || 'scholar'}
University: ${currentUserData?.university || 'University'}
Current Standing: ${currentStanding.level} Level
Grading Scale: ${scale.toFixed(1)} Maximum Scale
${gpaFullTitle}: ${overallStats.cgpa.toFixed(4)} / ${scale.toFixed(1)}
Degree Standing: ${overallStats.degreeClass}
Total Quality Units: ${overallStats.totalUnits} Units
Generated Date: ${new Date().toLocaleDateString()}
----------------------------------------
OFFERED COURSES BREAKDOWN:
First Semester Courses (${(currentStanding.firstSemesterCourses || []).length} courses):
${(currentStanding.firstSemesterCourses || []).map(c => `  * ${c.code}: ${c.title} (${c.credits} units)`).join('\n')}

Second Semester Courses (${(currentStanding.secondSemesterCourses || []).length} courses):
${(currentStanding.secondSemesterCourses || []).map(c => `  * ${c.code}: ${c.title} (${c.credits} units)`).join('\n')}
----------------------------------------
SEMESTER GRADE BREAKDOWN:
${calculatedLevels.map(lvl => `
[${lvl.level} LEVEL]
  * First Semester:  ${lvl.firstSemester.gpa.toFixed(2)} GPA (${lvl.firstSemester.totalUnits} units)
  * Second Semester: ${lvl.secondSemester.gpa.toFixed(2)} GPA (${lvl.secondSemester.totalUnits} units)
  * Level Cumulative: ${lvl.cumulative.toFixed(2)} | Weighted: ${lvl.weightedPoint}%
`).join('')}
========================================
Official Academic Result Summary • NSG Academic Suite
    `;

    const blob = new Blob([textContent.trim()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NSG_${gpaHeaderLabel}_Result_Slip_${currentUserData?.username || 'scholar'}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    if (setUserNotification) {
      setUserNotification(`Downloaded Official ${gpaHeaderLabel} Result Slip!`);
    }
  };

  // Semester Editor Course row helpers
  const currentEditingSemesterData = useMemo(() => {
    if (!editingLevel) return null;
    const lvl = levels[editingLevel.levelIndex];
    if (!lvl) return null;
    return editingLevel.semester === 'first' ? lvl.firstSemester : lvl.secondSemester;
  }, [editingLevel, levels]);

  const updateSemesterCourse = (index: number, field: keyof CourseGradeItem, value: any) => {
    if (!editingLevel) return;
    const newLevels = [...levels];
    const lvl = newLevels[editingLevel.levelIndex];
    const sem = editingLevel.semester === 'first' ? lvl.firstSemester : lvl.secondSemester;
    const updatedCourses = [...sem.courses];
    
    updatedCourses[index] = {
      ...updatedCourses[index],
      [field]: field === 'credits' ? Math.max(0, parseInt(value) || 0) : value
    };

    if (editingLevel.semester === 'first') {
      lvl.firstSemester.courses = updatedCourses;
    } else {
      lvl.secondSemester.courses = updatedCourses;
    }

    setLevels(newLevels);
  };

  const addCourseRow = () => {
    if (!editingLevel) return;
    const newLevels = [...levels];
    const lvl = newLevels[editingLevel.levelIndex];
    const sem = editingLevel.semester === 'first' ? lvl.firstSemester : lvl.secondSemester;
    sem.courses.push({
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 4),
      code: '',
      credits: 0,
      grade: 'A'
    });
    setLevels(newLevels);
  };

  const removeCourseRow = () => {
    if (!editingLevel) return;
    const newLevels = [...levels];
    const lvl = newLevels[editingLevel.levelIndex];
    const sem = editingLevel.semester === 'first' ? lvl.firstSemester : lvl.secondSemester;
    if (sem.courses.length <= 1) {
      if (setUserNotification) setUserNotification("Must have at least one course row.");
      return;
    }
    sem.courses.pop();
    setLevels(newLevels);
  };

  const handleSaveSemesterAndCalculate = () => {
    saveToStorageAndSync(levels, scale);
    const lvl = levels[editingLevel?.levelIndex || 0];
    const sem = editingLevel?.semester === 'first' ? 'First Semester' : 'Second Semester';
    setEditingLevel(null);
    if (setUserNotification) {
      setUserNotification(`Saved & recalculated ${lvl?.level} Level — ${sem}!`);
    }
  };

  // Filtered standard courses for picker modal
  const filteredStandardCourses = useMemo(() => {
    return COMPREHENSIVE_COURSE_LIST.filter(course => {
      // Semester filter
      if (coursePickerSemester !== 'all' && course.semester !== coursePickerSemester) return false;
      // Level filter
      if (coursePickerLevelFilter !== 'all' && course.level !== coursePickerLevelFilter) return false;
      // Search query
      if (courseSearchQuery.trim()) {
        const query = courseSearchQuery.toLowerCase();
        const matchesCode = course.code.toLowerCase().includes(query);
        const matchesTitle = course.title.toLowerCase().includes(query);
        const matchesCat = course.category.toLowerCase().includes(query);
        if (!matchesCode && !matchesTitle && !matchesCat) return false;
      }
      return true;
    });
  }, [coursePickerSemester, coursePickerLevelFilter, courseSearchQuery]);

  // Offered courses list helpers
  const firstSemRegistered = currentStanding.firstSemesterCourses || [];
  const secondSemRegistered = currentStanding.secondSemesterCourses || [];
  const totalFirstSemUnits = firstSemRegistered.reduce((sum, c) => sum + (c.credits || 0), 0);
  const totalSecondSemUnits = secondSemRegistered.reduce((sum, c) => sum + (c.credits || 0), 0);
  const totalCombinedUnits = totalFirstSemUnits + totalSecondSemUnits;

  // AI Target Simulator Calculations
  const advisorSim = useMemo(() => {
    const totalNextUnits = totalCombinedUnits > 0 ? totalCombinedUnits : 20;
    const currentUnits = overallStats.totalUnits;
    const currentPoints = overallStats.totalPoints;
    const futureTotalUnits = currentUnits + totalNextUnits;

    let targetCgpa = 4.50; // First Class
    if (advisorTargetClass === 'upper') targetCgpa = 3.50;
    if (advisorTargetClass === 'lower') targetCgpa = 2.40;

    const targetOnScale = (targetCgpa / 5.0) * scale;

    let requiredSemGPA = 0;
    let isAttainableThisSemester = true;

    if (totalNextUnits > 0) {
      const requiredPoints = targetOnScale * futureTotalUnits - currentPoints;
      requiredSemGPA = requiredPoints / totalNextUnits;
      if (requiredSemGPA > scale) {
        isAttainableThisSemester = false;
      }
      if (requiredSemGPA < 0) {
        requiredSemGPA = 0;
      }
    }

    const numCourses = (currentStanding.courses || []).length || 6;
    let recommendedAs = 0;
    let allowedBs = 0;
    let allowedCs = 0;

    if (requiredSemGPA >= (4.5 / 5.0) * scale) {
      const ratio = (requiredSemGPA - (4.0 / 5.0) * scale) / ((1.0 / 5.0) * scale);
      recommendedAs = Math.min(numCourses, Math.max(1, Math.ceil(numCourses * Math.max(0, ratio))));
      allowedBs = Math.max(0, numCourses - recommendedAs);
    } else if (requiredSemGPA >= (3.5 / 5.0) * scale) {
      recommendedAs = Math.max(0, Math.floor(numCourses * 0.4));
      allowedBs = Math.max(0, Math.ceil(numCourses * 0.5));
      allowedCs = Math.max(0, numCourses - recommendedAs - allowedBs);
    } else {
      allowedBs = Math.floor(numCourses * 0.6);
      allowedCs = Math.max(0, numCourses - allowedBs);
    }

    return {
      totalNextUnits,
      targetOnScale,
      requiredSemGPA: Number(requiredSemGPA.toFixed(2)),
      isAttainableThisSemester,
      recommendedAs,
      allowedBs,
      allowedCs
    };
  }, [totalCombinedUnits, overallStats, scale, advisorTargetClass, currentStanding.courses]);

  return (
    <div className={`w-full max-w-4xl mx-auto space-y-6 pb-20 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
      {/* Hidden File Input for Course Slip OCR */}
      <input
        type="file"
        ref={slipFileInputRef}
        accept=".pdf,application/pdf,image/*"
        onChange={handleUploadCourseRegistrationSlip}
        className="hidden"
      />

      {/* Top Header Navigation */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (editingLevel) {
                setEditingLevel(null);
              } else if (showCourseRegistration) {
                setShowCourseRegistration(false);
              } else if (showAdvisor) {
                setShowAdvisor(false);
              } else if (onBack) {
                onBack();
              }
            }}
            className="p-2 -ml-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              <Calculator className="text-[#DC2626]" size={24} />
              {editingLevel 
                ? `${levels[editingLevel.levelIndex]?.level} Level — ${editingLevel.semester === 'first' ? 'First Semester' : 'Second Semester'}`
                : showCourseRegistration
                ? 'My Registered Courses'
                : showAdvisor
                ? 'Calculate CGPA'
                : isFirstSemOnly
                ? '100L GPA Calculator'
                : 'MY CGPA'
              }
            </h1>
            <p className="text-xs font-mono text-white/50 flex items-center gap-2 pt-0.5">
              <span className="text-purple-400 font-bold">{currentStanding.level}L Standing</span>
              <span className="text-white/20">•</span>
              <span className="text-white/60 font-semibold">{scale.toFixed(1)} Scale System</span>
            </p>
          </div>
        </div>

        {!editingLevel && !showCourseRegistration && !showAdvisor && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScaleModal(true)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <Sliders size={14} className="text-[#DC2626]" />
              <span>{scale.toFixed(1)} Scale</span>
              <ChevronDown size={14} className="text-white/40" />
            </button>
          </div>
        )}
      </div>

      {/* Slip Parsing Error */}
      {slipError && (
        <div className="p-4 bg-red-950/60 border border-red-500/30 rounded-2xl flex items-center justify-between text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{slipError}</span>
          </div>
          <button onClick={() => setSlipError(null)} className="text-white/40 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* VIEW 1: MY REGISTERED COURSES (MINIMAL TEXT LIST WITH UNDERLINED EDITABLES) */}
      {showCourseRegistration ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Delete All Confirmation Banner */}
          {showDeleteAllConfirm && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 bg-red-950/90 border border-red-500/50 rounded-2xl flex items-center justify-between gap-4 shadow-xl"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="text-red-400 shrink-0" size={18} />
                <div>
                  <h4 className="text-xs font-black text-white">Delete All Registered Courses?</h4>
                  <p className="text-[11px] text-red-200">This will remove both First & Second Semester courses.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteAllConfirm(false)}
                  className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllOfferedCourses}
                  className="px-3.5 py-1 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-black text-white shadow-md transition-all cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          )}

          {/* Minimalist Action Bar: Filter Tabs + Delete All Button (Placed Right After 2nd Sem) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveOfferedSemesterFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeOfferedSemesterFilter === 'all'
                    ? 'bg-[#DC2626] text-white shadow-md'
                    : 'bg-white/5 text-white/60 hover:text-white'
                }`}
              >
                All ({firstSemRegistered.length + secondSemRegistered.length})
              </button>
              <button
                onClick={() => setActiveOfferedSemesterFilter('first')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeOfferedSemesterFilter === 'first'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-white/5 text-purple-300 hover:text-white'
                }`}
              >
                1st Sem ({firstSemRegistered.length})
              </button>
              <button
                onClick={() => setActiveOfferedSemesterFilter('second')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeOfferedSemesterFilter === 'second'
                    ? 'bg-amber-500 text-black shadow-md font-black'
                    : 'bg-white/5 text-amber-300 hover:text-white'
                }`}
              >
                2nd Sem ({secondSemRegistered.length})
              </button>

              {/* Delete All Courses Button Placed Just After the Second Semester Switch Button */}
              <button
                onClick={() => setShowDeleteAllConfirm(true)}
                className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 text-xs font-bold text-red-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                title="Delete all registered courses"
              >
                <Trash2 size={13} className="text-red-400" />
                <span>Delete All</span>
              </button>
            </div>

            {/* Quick Upload & Browse Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => slipFileInputRef.current?.click()}
                disabled={isParsingSlip}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Upload size={13} className="text-[#DC2626]" />
                <span>{isParsingSlip ? 'Scanning...' : 'Upload Slip'}</span>
              </button>

              <button
                onClick={() => {
                  setCoursePickerMode('addOffered');
                  setCoursePickerLevelFilter(currentStanding.level);
                  setShowCoursePicker(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-xs font-bold text-purple-300 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <BookOpen size={13} className="text-purple-400" />
                <span>Browse Courses</span>
              </button>
            </div>
          </div>

          {/* Unit Totals Summary */}
          <div className="flex items-center justify-between text-xs font-mono text-white/50 px-1">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-purple-400 font-bold">1st Sem: {totalFirstSemUnits} Units</span>
              <span className="text-orange-400 font-bold">2nd Sem: {totalSecondSemUnits} Units</span>
              <span className="text-amber-400 font-black">Total: {totalCombinedUnits} Units</span>
            </div>
            <span className="text-[11px] text-white/40 italic hidden sm:inline">Click underlined text to edit</span>
          </div>

          {/* Clean Text List of Registered Courses (No Containers, Underlined Inputs) */}
          <div className="space-y-6 pt-2">
            {/* First Semester Text List */}
            {(activeOfferedSemesterFilter === 'all' || activeOfferedSemesterFilter === 'first') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                  <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
                    <span>First Semester</span>
                    <span className="text-[11px] font-normal text-white/40 font-mono">
                      ({firstSemRegistered.length} courses • {totalFirstSemUnits} units)
                    </span>
                  </h3>
                  <button
                    onClick={() => {
                      const updated = [
                        ...firstSemRegistered,
                        { id: Date.now().toString(), code: '', title: '', credits: 3, semester: 'first' as const }
                      ];
                      saveCurrentStanding({ ...currentStanding, firstSemesterCourses: updated });
                    }}
                    className="text-xs font-bold text-purple-300 hover:text-purple-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add Row</span>
                  </button>
                </div>

                {firstSemRegistered.length === 0 ? (
                  <p className="text-xs text-white/40 italic py-2">No 1st semester courses added yet.</p>
                ) : (
                  <div className="divide-y divide-white/5">
                    {firstSemRegistered.map((c, idx) => (
                      <div key={c.id || idx} className="flex items-center gap-3 py-2">
                        <span className="text-xs font-mono font-bold text-white/40 w-5 shrink-0">{idx + 1}.</span>
                        
                        {/* Course Code with Underline */}
                        <div className="w-24 sm:w-32 shrink-0">
                          <input
                            type="text"
                            value={c.code}
                            placeholder="CODE"
                            onChange={(e) => {
                              const updated = [...firstSemRegistered];
                              updated[idx].code = e.target.value.toUpperCase();
                              saveCurrentStanding({ ...currentStanding, firstSemesterCourses: updated });
                            }}
                            className="w-full bg-transparent border-b border-white/25 hover:border-white/50 focus:border-[#DC2626] text-xs sm:text-sm font-black font-mono text-purple-300 uppercase py-0.5 outline-none tracking-wider placeholder:text-white/20"
                          />
                        </div>

                        {/* Course Title with Underline */}
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={c.title}
                            placeholder="Course Title"
                            onChange={(e) => {
                              const updated = [...firstSemRegistered];
                              updated[idx].title = e.target.value;
                              saveCurrentStanding({ ...currentStanding, firstSemesterCourses: updated });
                            }}
                            className="w-full bg-transparent border-b border-white/15 hover:border-white/40 focus:border-[#DC2626] text-xs sm:text-sm text-white py-0.5 outline-none placeholder:text-white/20 truncate"
                          />
                        </div>

                        {/* Credit Units with Underline */}
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            min={0}
                            max={12}
                            value={c.credits || ''}
                            placeholder="3"
                            onChange={(e) => {
                              const updated = [...firstSemRegistered];
                              updated[idx].credits = parseInt(e.target.value) || 0;
                              saveCurrentStanding({ ...currentStanding, firstSemesterCourses: updated });
                            }}
                            className="w-8 sm:w-10 bg-transparent border-b border-white/25 hover:border-white/50 focus:border-amber-400 text-center text-xs sm:text-sm font-mono font-bold text-white py-0.5 outline-none placeholder:text-white/20"
                          />
                          <span className="text-[10px] text-white/40 uppercase font-mono">u</span>
                        </div>

                        {/* Subtle Remove Button */}
                        <button
                          onClick={() => {
                            const updated = firstSemRegistered.filter((_, i) => i !== idx);
                            saveCurrentStanding({ ...currentStanding, firstSemesterCourses: updated });
                          }}
                          className="text-white/20 hover:text-red-400 p-1 transition-colors shrink-0 cursor-pointer"
                          title="Remove course"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Second Semester Text List */}
            {(activeOfferedSemesterFilter === 'all' || activeOfferedSemesterFilter === 'second') && (
              <div className="space-y-2 pt-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                  <h3 className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-2">
                    <span>Second Semester</span>
                    <span className="text-[11px] font-normal text-white/40 font-mono">
                      ({secondSemRegistered.length} courses • {totalSecondSemUnits} units)
                    </span>
                  </h3>
                  <button
                    onClick={() => {
                      const updated = [
                        ...secondSemRegistered,
                        { id: Date.now().toString(), code: '', title: '', credits: 3, semester: 'second' as const }
                      ];
                      saveCurrentStanding({ ...currentStanding, secondSemesterCourses: updated });
                    }}
                    className="text-xs font-bold text-orange-300 hover:text-orange-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add Row</span>
                  </button>
                </div>

                {secondSemRegistered.length === 0 ? (
                  <p className="text-xs text-white/40 italic py-2">No 2nd semester courses added yet.</p>
                ) : (
                  <div className="divide-y divide-white/5">
                    {secondSemRegistered.map((c, idx) => (
                      <div key={c.id || idx} className="flex items-center gap-3 py-2">
                        <span className="text-xs font-mono font-bold text-white/40 w-5 shrink-0">{idx + 1}.</span>
                        
                        {/* Course Code with Underline */}
                        <div className="w-24 sm:w-32 shrink-0">
                          <input
                            type="text"
                            value={c.code}
                            placeholder="CODE"
                            onChange={(e) => {
                              const updated = [...secondSemRegistered];
                              updated[idx].code = e.target.value.toUpperCase();
                              saveCurrentStanding({ ...currentStanding, secondSemesterCourses: updated });
                            }}
                            className="w-full bg-transparent border-b border-white/25 hover:border-white/50 focus:border-[#DC2626] text-xs sm:text-sm font-black font-mono text-orange-300 uppercase py-0.5 outline-none tracking-wider placeholder:text-white/20"
                          />
                        </div>

                        {/* Course Title with Underline */}
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={c.title}
                            placeholder="Course Title"
                            onChange={(e) => {
                              const updated = [...secondSemRegistered];
                              updated[idx].title = e.target.value;
                              saveCurrentStanding({ ...currentStanding, secondSemesterCourses: updated });
                            }}
                            className="w-full bg-transparent border-b border-white/15 hover:border-white/40 focus:border-[#DC2626] text-xs sm:text-sm text-white py-0.5 outline-none placeholder:text-white/20 truncate"
                          />
                        </div>

                        {/* Credit Units with Underline */}
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            min={0}
                            max={12}
                            value={c.credits || ''}
                            placeholder="3"
                            onChange={(e) => {
                              const updated = [...secondSemRegistered];
                              updated[idx].credits = parseInt(e.target.value) || 0;
                              saveCurrentStanding({ ...currentStanding, secondSemesterCourses: updated });
                            }}
                            className="w-8 sm:w-10 bg-transparent border-b border-white/25 hover:border-white/50 focus:border-amber-400 text-center text-xs sm:text-sm font-mono font-bold text-white py-0.5 outline-none placeholder:text-white/20"
                          />
                          <span className="text-[10px] text-white/40 uppercase font-mono">u</span>
                        </div>

                        {/* Subtle Remove Button */}
                        <button
                          onClick={() => {
                            const updated = secondSemRegistered.filter((_, i) => i !== idx);
                            saveCurrentStanding({ ...currentStanding, secondSemesterCourses: updated });
                          }}
                          className="text-white/20 hover:text-red-400 p-1 transition-colors shrink-0 cursor-pointer"
                          title="Remove course"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      ) : editingLevel && currentEditingSemesterData ? (
        /* VIEW 2: SEMESTER GRADE DETAILS EDITOR (OPEN LEDGER LIST) */
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="space-y-3 pb-3 border-b border-white/10 px-1">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-white/50">
              <span className="flex-1">Course Code & Fast Select</span>
              <span className="w-24 text-center">Credit Units</span>
              <span className="w-24 text-right pr-2">Grade</span>
            </div>
          </div>

          <div className="space-y-2">
            {currentEditingSemesterData.courses.map((course, idx) => (
              <div key={course.id || idx} className="flex items-center gap-2.5 sm:gap-3 py-2 border-b border-white/5">
                <span className="text-xs font-mono font-bold text-white/40 w-5 shrink-0">{idx + 1}.</span>
                
                {/* Course Code Input with Quick Select */}
                <div className="flex-1 relative flex items-center gap-1.5">
                  <input
                    type="text"
                    value={course.code}
                    placeholder="e.g. MTH 101"
                    onChange={(e) => updateSemesterCourse(idx, 'code', e.target.value.toUpperCase())}
                    className="w-full bg-white/5 border border-white/15 focus:border-[#DC2626] rounded-xl px-3 py-2 text-xs sm:text-sm font-black font-mono text-purple-300 uppercase placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#DC2626] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoursePickerMode('editSemester');
                      setCoursePickerTargetIndex(idx);
                      setCoursePickerSemester(editingLevel.semester);
                      setCoursePickerLevelFilter(levels[editingLevel.levelIndex]?.level || 'all');
                      setShowCoursePicker(true);
                    }}
                    title="Quick Select Standard Course from List"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/60 hover:text-white shrink-0 transition-colors cursor-pointer"
                  >
                    <BookOpen size={15} className="text-[#DC2626]" />
                  </button>
                </div>

                {/* Credit Units Input */}
                <div className="w-20 sm:w-24 flex justify-center shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={course.credits || ''}
                    placeholder="3"
                    onChange={(e) => updateSemesterCourse(idx, 'credits', e.target.value)}
                    className="w-16 bg-white/5 border border-white/15 focus:border-amber-400 rounded-xl py-2 text-center text-xs sm:text-sm font-mono font-black text-white focus:outline-none transition-all"
                  />
                </div>

                {/* Grade Selector */}
                <div className="w-20 sm:w-24 flex justify-end shrink-0">
                  <select
                    value={course.grade}
                    onChange={(e) => updateSemesterCourse(idx, 'grade', e.target.value as any)}
                    className="w-full max-w-[80px] bg-white/5 border border-white/15 focus:border-purple-400 text-white font-black text-xs sm:text-sm rounded-xl py-2 px-1.5 focus:outline-none transition-all cursor-pointer text-center"
                  >
                    <option value="A" className="bg-[#171522] text-amber-400 font-bold">A (5.0)</option>
                    <option value="B" className="bg-[#171522] text-purple-400 font-bold">B (4.0)</option>
                    <option value="C" className="bg-[#171522] text-amber-300 font-bold">C (3.0)</option>
                    <option value="D" className="bg-[#171522] text-orange-400 font-bold">D (2.0)</option>
                    <option value="E" className="bg-[#171522] text-purple-300 font-bold">E (1.0)</option>
                    <option value="F" className="bg-[#171522] text-red-500 font-bold">F (0.0)</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Floating Bar */}
          <div className="flex items-center justify-center gap-3 pt-3">
            <button
              onClick={removeCourseRow}
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 border border-white/10 flex items-center justify-center text-white transition-all shadow-lg cursor-pointer"
              title="Remove row"
            >
              <Minus size={18} />
            </button>

            <button
              onClick={handleSaveSemesterAndCalculate}
              className="flex-1 max-w-sm py-3 px-6 rounded-2xl bg-gradient-to-r from-[#DC2626] via-purple-700 to-indigo-700 hover:from-red-600 hover:to-purple-600 text-white font-black text-sm uppercase tracking-wider shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={17} className="text-white" />
              <span>Save & Calculate {isFirstSemOnly ? 'GPA' : 'CGPA'}</span>
            </button>

            <button
              onClick={addCourseRow}
              className="w-11 h-11 rounded-full bg-[#DC2626] hover:bg-red-700 active:scale-95 text-white flex items-center justify-center transition-all shadow-lg shadow-red-600/30 cursor-pointer"
              title="Add course row"
            >
              <Plus size={20} />
            </button>
          </div>
        </motion.div>
      ) : showAdvisor ? (
        /* VIEW 3: TARGET SIMULATOR */
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
          <div className="space-y-3 pb-3 border-b border-white/10 px-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight">Calculate CGPA</h2>
                  <p className="text-xs text-white/50">Find your target CGPA for next semester ({currentStanding.level}L • {totalCombinedUnits} registered units)</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono uppercase text-white/40 block">Current {gpaHeaderLabel}</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{overallStats.cgpa.toFixed(2)}</span>
              </div>
            </div>

            {/* Target Class: Open Horizontal List */}
            <div className="flex items-center gap-2 flex-wrap pt-2">
              <span className="text-xs font-bold text-white/50 uppercase">Aiming for:</span>
              <button
                type="button"
                onClick={() => setAdvisorTargetClass('first')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                  advisorTargetClass === 'first' 
                    ? 'bg-amber-400 text-black shadow-md' 
                    : 'bg-white/5 text-amber-300 hover:text-white'
                }`}
              >
                First Class (4.50+)
              </button>
              <button
                type="button"
                onClick={() => setAdvisorTargetClass('upper')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                  advisorTargetClass === 'upper' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'bg-white/5 text-purple-300 hover:text-white'
                }`}
              >
                2nd Class Upper (3.50+)
              </button>
              <button
                type="button"
                onClick={() => setAdvisorTargetClass('lower')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                  advisorTargetClass === 'lower' 
                    ? 'bg-orange-500 text-black shadow-md' 
                    : 'bg-white/5 text-orange-300 hover:text-white'
                }`}
              >
                2nd Class Lower (2.40+)
              </button>
            </div>
          </div>

          <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white/70">Semester GPA Required:</span>
              <span className={`text-xl font-black font-mono ${advisorSim.isAttainableThisSemester ? 'text-amber-400' : 'text-red-400'}`}>
                {advisorSim.requiredSemGPA.toFixed(2)} / {scale.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              {advisorSim.isAttainableThisSemester ? (
                <>
                  To reach or maintain your target across your <strong className="text-white font-bold">{advisorSim.totalNextUnits} registered units</strong>, you can afford at least <strong className="text-purple-300 font-black">{advisorSim.recommendedAs} A&apos;s</strong> and at most <strong className="text-orange-400 font-black">{advisorSim.allowedBs} B&apos;s</strong>.
                </>
              ) : (
                <>
                  <span className="text-red-400 font-bold">Multiple sessions needed:</span> To attain this class, maintain a 5.00 GPA this semester and sustained high performance.
                </>
              )}
            </p>
          </div>
        </motion.div>
      ) : (
        /* VIEW 4: MAIN DASHBOARD & LEVEL LIST (NO LOCKED CONTAINERS) */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Current CGPA / GPA Open Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10 px-1">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-white/70">
                {gpaFullTitle}
              </span>
              <p className="text-xs font-mono font-semibold flex items-center gap-2">
                <span className="text-purple-400 font-bold">{currentStanding.level}L Standing</span>
                <span className="text-white/20">•</span>
                <span className="text-white/60 font-semibold">{scale.toFixed(1)} Scale System</span>
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-purple-500/20 border border-purple-500/30 text-purple-300">
                  <Award size={13} className="text-[#DC2626]" />
                  <span>{overallStats.degreeClassShort}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:items-end">
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                {overallStats.cgpa.toFixed(4)}
              </span>
              <span className="text-xs text-orange-400/90 font-mono font-semibold mt-0.5">
                Total Quality Units: {overallStats.totalUnits}
              </span>
            </div>
          </div>

          {/* Action Row: Open Horizontal List without locked container */}
          <div className="flex items-center gap-2 flex-wrap pb-1">
            <button
              type="button"
              onClick={() => setShowCourseRegistration(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <BookOpen size={13} className="text-[#DC2626]" />
              <span>My Courses ({firstSemRegistered.length + secondSemRegistered.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAdvisor(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-xs font-bold text-purple-300 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles size={13} className="text-amber-400" />
              <span>Target Simulator</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-bold text-amber-300 hover:text-white flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Download size={13} className="text-amber-400" />
              <span>Download Slip</span>
            </button>

            <button
              type="button"
              onClick={handleResetGPA}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/70 hover:text-red-400 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw size={13} className="text-red-400" />
              <span>Reset {gpaHeaderLabel}</span>
            </button>
          </div>

          {/* Level List: Clean Modern Vertical List */}
          <div className="space-y-4 pt-1">
            {calculatedLevels.map((lvl, lvlIdx) => (
              <div 
                key={lvl.level}
                className="border-b border-white/10 pb-4 space-y-2"
              >
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-base font-black text-white tracking-tight">{lvl.level} Level</h3>
                  <span className="text-xs font-mono font-bold text-white/60">
                    Cumulative: <strong className="text-amber-400 font-mono font-black">{lvl.cumulative.toFixed(2)}</strong>
                  </span>
                </div>

                <div className="divide-y divide-white/5">
                  <button
                    type="button"
                    onClick={() => setEditingLevel({ levelIndex: lvlIdx, semester: 'first' })}
                    className="w-full py-3 px-2 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer group text-left rounded-xl"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-white/80 group-hover:text-purple-300 transition-colors">
                      First Semester
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-black text-purple-300">
                        {lvl.firstSemester.gpa.toFixed(2)}
                      </span>
                      <ChevronRight size={16} className="text-white/30 group-hover:text-[#DC2626] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingLevel({ levelIndex: lvlIdx, semester: 'second' })}
                    className="w-full py-3 px-2 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer group text-left rounded-xl"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-white/80 group-hover:text-orange-300 transition-colors">
                      Second Semester
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-black text-orange-400">
                        {lvl.secondSemester.gpa.toFixed(2)}
                      </span>
                      <ChevronRight size={16} className="text-white/30 group-hover:text-[#DC2626] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>

                  <div className="py-2.5 px-2 flex items-center justify-between text-xs font-mono">
                    <span className="text-white/40 font-bold">Level Weighted Point</span>
                    <span className="text-white/80 font-bold">{lvl.weightedPoint} %</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Level Button */}
          <button
            type="button"
            onClick={handleAddLevel}
            className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider text-white/80 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={15} className="text-[#DC2626]" />
            <span>Add Level</span>
          </button>
        </motion.div>
      )}

      {/* SELECT GPA SYSTEM MODAL */}
      <AnimatePresence>
        {showScaleModal && (
          <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-[#1A1826] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 pb-4 border-b border-white/5 relative">
                <button
                  onClick={() => setShowScaleModal(false)}
                  className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
                <h3 className="text-lg font-black text-white tracking-tight">Select Your GPA System</h3>
                <p className="text-xs text-white/50 mt-1">Choose the maximum grade-point scale used by your school</p>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-white/5 py-1">
                {DEFAULT_SCALES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => {
                      setScale(s.value);
                      setShowScaleModal(false);
                      saveToStorageAndSync(levels, s.value);
                      if (setUserNotification) setUserNotification(`Grading scale changed to ${s.label}`);
                    }}
                    className={`w-full px-6 py-3.5 text-left text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      scale === s.value 
                        ? 'bg-white/10 text-white font-bold' 
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span>{s.label}</span>
                    {scale === s.value && <ChevronRight size={16} className="text-[#DC2626]" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SELECT COURSE MODAL (80+ UNIVERSITY COURSES 100L TO 500L) */}
      <AnimatePresence>
        {showCoursePicker && (
          <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-[#1A1826] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
            >
              <div className="p-5 pb-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCoursePicker(false)}
                    className="p-1 text-white/50 hover:text-white cursor-pointer"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">
                      Click Course to Add
                    </h3>
                    <p className="text-[10px] text-white/50">
                      Standard university courses (100L – 500L)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCoursePicker(false)}
                  className="text-white/40 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Level Filter Tabs */}
              <div className="p-2 border-b border-white/10 bg-black/30 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <span className="text-[10px] uppercase font-bold text-white/40 px-2 shrink-0">Level:</span>
                {(['all', 100, 200, 300, 400, 500] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setCoursePickerLevelFilter(lvl)}
                    className={`px-3 py-1 rounded-xl text-xs font-black uppercase transition-all shrink-0 cursor-pointer ${
                      coursePickerLevelFilter === lvl
                        ? 'bg-[#DC2626] text-white shadow-sm'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {lvl === 'all' ? 'All Levels' : `${lvl}L`}
                  </button>
                ))}
              </div>

              {/* Semester Filter Tabs */}
              <div className="grid grid-cols-3 border-b border-white/10 text-center">
                <button
                  onClick={() => setCoursePickerSemester('all')}
                  className={`py-2.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    coursePickerSemester === 'all' 
                      ? 'border-[#DC2626] text-white bg-white/5' 
                      : 'border-transparent text-white/40 hover:text-white/70'
                  }`}
                >
                  All Semesters
                </button>
                <button
                  onClick={() => setCoursePickerSemester('first')}
                  className={`py-2.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    coursePickerSemester === 'first' 
                      ? 'border-[#DC2626] text-white bg-white/5' 
                      : 'border-transparent text-white/40 hover:text-white/70'
                  }`}
                >
                  1st Sem
                </button>
                <button
                  onClick={() => setCoursePickerSemester('second')}
                  className={`py-2.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                    coursePickerSemester === 'second' 
                      ? 'border-[#DC2626] text-white bg-white/5' 
                      : 'border-transparent text-white/40 hover:text-white/70'
                  }`}
                >
                  2nd Sem
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-3 border-b border-white/5 bg-black/20">
                <div className="relative flex items-center">
                  <Search size={15} className="absolute left-3 text-white/40" />
                  <input
                    type="text"
                    value={courseSearchQuery}
                    onChange={(e) => setCourseSearchQuery(e.target.value)}
                    placeholder="Search by code or title (e.g. CSC, GST, MTH, Law, ENG)..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#DC2626]"
                  />
                  {courseSearchQuery && (
                    <button onClick={() => setCourseSearchQuery('')} className="absolute right-3 text-white/40 hover:text-white">
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* List of Standard Courses */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {filteredStandardCourses.length === 0 ? (
                  <div className="text-center py-10 text-white/40 text-xs">
                    No courses match your filter. Try adjusting search or level.
                  </div>
                ) : (
                  filteredStandardCourses.map((item) => (
                    <button
                      key={item.code}
                      onClick={() => {
                        if (coursePickerMode === 'editSemester' && coursePickerTargetIndex !== null) {
                          updateSemesterCourse(coursePickerTargetIndex, 'code', item.code);
                          updateSemesterCourse(coursePickerTargetIndex, 'credits', item.credits);
                          setShowCoursePicker(false);
                          setCoursePickerTargetIndex(null);
                        } else if (coursePickerMode === 'addOffered') {
                          const targetSem = item.semester;
                          if (targetSem === 'first') {
                            const updatedFirst = [
                              ...(currentStanding.firstSemesterCourses || []),
                              { id: Date.now().toString(), code: item.code, title: item.title, credits: item.credits, semester: 'first' as const }
                            ];
                            saveCurrentStanding({ ...currentStanding, firstSemesterCourses: updatedFirst });
                          } else {
                            const updatedSecond = [
                              ...(currentStanding.secondSemesterCourses || []),
                              { id: Date.now().toString(), code: item.code, title: item.title, credits: item.credits, semester: 'second' as const }
                            ];
                            saveCurrentStanding({ ...currentStanding, secondSemesterCourses: updatedSecond });
                          }
                          setShowCoursePicker(false);
                          if (setUserNotification) {
                            setUserNotification(`Added ${item.code} (${item.credits} Units) to ${item.semester === 'first' ? '1st' : '2nd'} Sem registered courses!`);
                          }
                        }
                      }}
                      className="w-full p-3.5 bg-[#232033] hover:bg-[#2C2840] border border-white/5 hover:border-white/20 rounded-2xl text-left flex items-center gap-3.5 transition-all group active:scale-[0.99] cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 text-white/70 group-hover:text-white group-hover:bg-[#DC2626] transition-all">
                        <BookOpen size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-[#DC2626] transition-colors">
                            {item.code}
                          </h4>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-white/60">
                              {item.level}L
                            </span>
                            <span className="text-xs font-mono font-black text-emerald-400">
                              {item.credits} Units
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-white/60 truncate mt-0.5">{item.title}</p>
                        <span className="text-[10px] text-white/30 uppercase font-mono">{item.category} • {item.semester === 'first' ? '1st Sem' : '2nd Sem'}</span>
                      </div>
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
