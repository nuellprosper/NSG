import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, Clock, BookOpen, Plus, Trash2, Edit3, 
  Upload, FileText, CheckCircle2, XCircle, AlertCircle, ArrowLeft,
  Bell, BellRing, Share2, Check, ChevronRight, X, AlertTriangle,
  Flame, Award, Eye, Download, Info, ChevronLeft, CalendarCheck2, ExternalLink
} from 'lucide-react';
import { scheduleLocalNotification } from '../lib/capacitor/notifications';
import { extractPdfDetails } from '../utils';

export type TimetableType = 'lecture' | 'personal' | 'exam';
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface LectureItem {
  id: string;
  courseCode: string;
  courseTitle: string;
  day: DayOfWeek;
  startTime: string; // "08:00"
  endTime: string;   // "10:00"
  venue: string;
  lecturer?: string;
  color?: string;
  attendanceHistory?: { date: string; attended: boolean }[];
  missedCount?: number;
  alarmSet?: boolean;
}

export interface ReadingItem {
  id: string;
  title: string;
  courseCode: string;
  day: DayOfWeek;
  startTime: string;
  durationMinutes: number;
  goal: string;
  completedHistory?: { date: string; completed: boolean }[];
  alarmSet?: boolean;
}

export interface ExamItem {
  id: string;
  courseCode: string;
  courseTitle: string;
  day: DayOfWeek;
  examDate: string; // YYYY-MM-DD
  startTime: string; // "09:00"
  endTime: string;   // "12:00"
  venue: string;
  seatNumber?: string;
  predictedScore?: string;
  alarmSet?: boolean;
}

export interface RegisteredCourse {
  id: string;
  code: string;
  title: string;
  credits: number;
}

interface TimeTableProps {
  theme?: string;
  user?: any;
  currentUserData?: any;
  setUserNotification?: (msg: string) => void;
  onBack?: () => void;
  onOpenQuizWithTopic?: (topic: string) => void;
  onOpenCGPATool?: () => void;
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const PRESET_COLORS = [
  'bg-red-500/20 border-red-500/40 text-red-300',
  'bg-blue-500/20 border-blue-500/40 text-blue-300',
  'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
  'bg-purple-500/20 border-purple-500/40 text-purple-300',
  'bg-amber-500/20 border-amber-500/40 text-amber-300',
  'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
];

export const TimeTable: React.FC<TimeTableProps> = ({
  theme = 'dark',
  user,
  currentUserData,
  setUserNotification,
  onBack,
  onOpenQuizWithTopic,
  onOpenCGPATool
}) => {
  // Main view: 'menu' (showing the 3 cards) | 'lecture' | 'personal' | 'exam'
  const [activeSection, setActiveSection] = useState<TimetableType | 'menu'>('menu');
  
  // Calculate today's day of week to auto-select
  const todayDayName = useMemo<DayOfWeek>(() => {
    const dayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;
    return DAYS_OF_WEEK.includes(dayStr) ? dayStr : 'Monday';
  }, []);

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayDayName);

  // Auto set selected day whenever activeSection changes to 'exam' or 'lecture'
  useEffect(() => {
    if (activeSection !== 'menu') {
      setSelectedDay(todayDayName);
    }
  }, [activeSection, todayDayName]);

  // Timetable records stored locally (offline first)
  const [lectureItems, setLectureItems] = useState<LectureItem[]>([]);
  const [readingItems, setReadingItems] = useState<ReadingItem[]>([]);
  const [examItems, setExamItems] = useState<ExamItem[]>([]);

  // Registered semester courses from CGPA Tool
  const [registeredCourses, setRegisteredCourses] = useState<RegisteredCourse[]>([]);
  const [currentAcademicInfo, setCurrentAcademicInfo] = useState<{ level: number; semester: string }>({
    level: 100,
    semester: 'first'
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingCard, setEditingCard] = useState<{ type: TimetableType; item: LectureItem | ReadingItem | ExamItem } | null>(null);
  const [showFullExamModal, setShowFullExamModal] = useState<boolean>(false);
  const [showDeleteAllExamsConfirm, setShowDeleteAllExamsConfirm] = useState<boolean>(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState<boolean>(false);
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [formCourseCode, setFormCourseCode] = useState('');
  const [formCourseTitle, setFormCourseTitle] = useState('');
  const [formDay, setFormDay] = useState<DayOfWeek>(todayDayName);
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formVenue, setFormVenue] = useState('');
  const [formLecturer, setFormLecturer] = useState('');
  const [formExamDate, setFormExamDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formGoal, setFormGoal] = useState('');
  const [formSeatNumber, setFormSeatNumber] = useState('');
  const [formDurationMinutes, setFormDurationMinutes] = useState(60);

  // Load from LocalStorage on mount
  useEffect(() => {
    const storageKey = `nsg_timetable_${user?.uid || 'guest'}`;
    const standingKey = `nsg_registered_courses_${user?.uid || 'guest'}`;

    // Load registered courses from CGPA tool
    const savedStanding = localStorage.getItem(standingKey);
    if (savedStanding) {
      try {
        const parsedStanding = JSON.parse(savedStanding);
        if (parsedStanding.courses && Array.isArray(parsedStanding.courses)) {
          setRegisteredCourses(parsedStanding.courses);
          setCurrentAcademicInfo({
            level: parsedStanding.level || 100,
            semester: parsedStanding.semester || 'first'
          });
        }
      } catch (e) {
        console.error('Error loading registered courses', e);
      }
    } else {
      // Default initial courses
      const defaultCourses: RegisteredCourse[] = [
        { id: '1', code: 'GST 101', title: 'Use of English and Library', credits: 2 },
        { id: '2', code: 'MTH 101', title: 'Elementary Mathematics I', credits: 3 },
        { id: '3', code: 'PHY 101', title: 'General Physics I', credits: 3 },
        { id: '4', code: 'CSC 101', title: 'Introduction to Computer Science', credits: 3 }
      ];
      setRegisteredCourses(defaultCourses);
    }

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.lectureItems) setLectureItems(parsed.lectureItems);
        if (parsed.readingItems) setReadingItems(parsed.readingItems);
        if (parsed.examItems) setExamItems(parsed.examItems);
      } catch (e) {
        console.error('Error loading timetable from storage', e);
      }
    } else {
      // Demo initial seed
      const seedLectures: LectureItem[] = [
        {
          id: '1',
          courseCode: 'GST 101',
          courseTitle: 'Use of English and Library',
          day: 'Monday',
          startTime: '08:00',
          endTime: '10:00',
          venue: 'Lecture Theatre 1',
          lecturer: 'Dr. Johnson',
          color: PRESET_COLORS[0],
          missedCount: 0,
          attendanceHistory: []
        },
        {
          id: '2',
          courseCode: 'MTH 101',
          courseTitle: 'Elementary Mathematics I',
          day: todayDayName,
          startTime: '10:00',
          endTime: '12:00',
          venue: 'Science Hall 3',
          lecturer: 'Prof. Adeleke',
          color: PRESET_COLORS[1],
          missedCount: 0,
          attendanceHistory: []
        }
      ];

      const seedExams: ExamItem[] = [
        {
          id: 'e1',
          courseCode: 'MTH 101',
          courseTitle: 'Elementary Mathematics I',
          day: todayDayName,
          examDate: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '12:00',
          venue: 'Multipurpose CBT Hall A',
          seatNumber: 'Seat #42',
          predictedScore: 'A'
        },
        {
          id: 'e2',
          courseCode: 'GST 101',
          courseTitle: 'Use of English and Library',
          day: 'Monday',
          examDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
          startTime: '08:30',
          endTime: '11:00',
          venue: 'Faculty Exam Centre',
          seatNumber: 'Seat #118',
          predictedScore: 'A'
        }
      ];

      setLectureItems(seedLectures);
      setExamItems(seedExams);
    }
  }, [user?.uid, todayDayName]);

  // Save to LocalStorage
  const saveAllTimetables = (
    lectures: LectureItem[],
    readings: ReadingItem[],
    exams: ExamItem[]
  ) => {
    const storageKey = `nsg_timetable_${user?.uid || 'guest'}`;
    localStorage.setItem(storageKey, JSON.stringify({
      lectureItems: lectures,
      readingItems: readings,
      examItems: exams,
      updatedAt: Date.now()
    }));
  };

  // Handle Attendance Marking
  const handleMarkAttendance = (lectureId: string, attended: boolean) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const userName = currentUserData?.displayName || currentUserData?.fullName || 'Scholar';

    const updated = lectureItems.map(item => {
      if (item.id === lectureId) {
        const history = item.attendanceHistory || [];
        const existingIdx = history.findIndex(h => h.date === todayStr);
        let newHistory = [...history];

        if (existingIdx >= 0) {
          newHistory[existingIdx] = { date: todayStr, attended };
        } else {
          newHistory.push({ date: todayStr, attended });
        }

        const newMissed = attended ? Math.max(0, (item.missedCount || 0) - 1) : (item.missedCount || 0) + 1;
        
        // Trigger Escalating Missed Class Notification
        if (!attended) {
          if (newMissed === 2) {
            scheduleLocalNotification(
              `⚠️ Missed Class Alert (${item.courseCode})`,
              `${userName}, you have missed ${item.courseCode} twice! Read your notes or take a practice quiz to stay ahead.`,
              Date.now(),
              'nsg_academic_alerts'
            );
          } else if (newMissed >= 3) {
            scheduleLocalNotification(
              `🚨 Warning: 3 Missed Lectures (${item.courseCode})`,
              `Critical alert for ${item.courseCode}! You risk falling behind exam requirements. Open your reading schedule now!`,
              Date.now(),
              'nsg_academic_alerts'
            );
          }
        }

        return {
          ...item,
          attendanceHistory: newHistory,
          missedCount: newMissed
        };
      }
      return item;
    });

    setLectureItems(updated);
    saveAllTimetables(updated, readingItems, examItems);

    if (setUserNotification) {
      setUserNotification(attended ? "Marked: Present in class! 🎉" : "Marked: Missed class recorded.");
    }
  };

  // Generic helper to get the upcoming Date for a day of week
  const getNextDateForDay = (dayName: string, timeStr: string = '09:00'): Date => {
    const dayMap: Record<string, number> = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    const targetDay = dayMap[dayName] !== undefined ? dayMap[dayName] : 1;
    const now = new Date();
    const currentDay = now.getDay();
    let distance = targetDay - currentDay;
    if (distance < 0) {
      distance += 7;
    }
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + distance);
    const [h, m] = (timeStr || '09:00').split(':').map(Number);
    targetDate.setHours(isNaN(h) ? 9 : h, isNaN(m) ? 0 : m, 0, 0);
    return targetDate;
  };

  // Open Calendar & Alarm for Lecture
  const handleOpenLectureCalendar = (lecture: LectureItem) => {
    try {
      const nextAlarmState = !lecture.alarmSet;
      const updated = lectureItems.map(item => item.id === lecture.id ? { ...item, alarmSet: nextAlarmState } : item);
      setLectureItems(updated);
      saveAllTimetables(updated, readingItems, examItems);

      if (!nextAlarmState) {
        if (setUserNotification) {
          setUserNotification(`Turned off alarm for ${lecture.courseCode} lecture.`);
        }
        return;
      }

      const startDate = getNextDateForDay(lecture.day, lecture.startTime || '08:00');
      const [endH, endM] = (lecture.endTime || '10:00').split(':').map(Number);
      const endDate = new Date(startDate);
      endDate.setHours(isNaN(endH) ? startDate.getHours() + 2 : endH, isNaN(endM) ? 0 : endM, 0, 0);

      const pad = (n: number) => n.toString().padStart(2, '0');
      const formatIsoBasic = (dt: Date) => 
        `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`;

      const title = encodeURIComponent(`${lecture.courseCode} Lecture`);
      const details = encodeURIComponent(
        `Lecture for ${lecture.courseTitle || lecture.courseCode}.\nDay: ${lecture.day}\nVenue: ${lecture.venue || 'Classroom'}\nLecturer: ${lecture.lecturer || 'N/A'}\nReminder: 30 minutes prior.`
      );
      const location = encodeURIComponent(lecture.venue || 'Lecture Hall');

      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatIsoBasic(startDate)}/${formatIsoBasic(endDate)}&details=${details}&location=${location}`;
      window.open(gcalUrl, '_blank');

      // 30-min local notification
      const thirtyMinBefore = startDate.getTime() - (30 * 60 * 1000);
      scheduleLocalNotification(
        `🔔 Upcoming Class: ${lecture.courseCode}`,
        `Your ${lecture.courseCode} lecture starts at ${lecture.startTime} in ${lecture.venue}.`,
        thirtyMinBefore > Date.now() ? thirtyMinBefore : Date.now() + 5000,
        'nsg_lecture_alarms'
      );

      if (setUserNotification) {
        setUserNotification(`Opening Calendar & set 30-min alarm for ${lecture.courseCode} lecture!`);
      }
    } catch (err) {
      console.error("Lecture calendar error", err);
    }
  };

  // Open Calendar & Alarm for Study / Reading Routine
  const handleOpenReadingCalendar = (reading: ReadingItem) => {
    try {
      const nextAlarmState = !reading.alarmSet;
      const updated = readingItems.map(item => item.id === reading.id ? { ...item, alarmSet: nextAlarmState } : item);
      setReadingItems(updated);
      saveAllTimetables(lectureItems, updated, examItems);

      if (!nextAlarmState) {
        if (setUserNotification) {
          setUserNotification(`Turned off alarm for ${reading.courseCode} study session.`);
        }
        return;
      }

      const startDate = getNextDateForDay(reading.day, reading.startTime || '19:00');
      const durationMins = reading.durationMinutes || 60;
      const endDate = new Date(startDate.getTime() + durationMins * 60 * 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');
      const formatIsoBasic = (dt: Date) => 
        `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`;

      const title = encodeURIComponent(`${reading.courseCode} Study Session`);
      const details = encodeURIComponent(
        `Study Session: ${reading.title || reading.courseCode}\nGoal: ${reading.goal || 'Study session'}\nDuration: ${durationMins} minutes\nReminder: 15 minutes prior.`
      );
      const location = encodeURIComponent('Study Desk / Library');

      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatIsoBasic(startDate)}/${formatIsoBasic(endDate)}&details=${details}&location=${location}`;
      window.open(gcalUrl, '_blank');

      // 15-min local notification
      const fifteenMinBefore = startDate.getTime() - (15 * 60 * 1000);
      scheduleLocalNotification(
        `📖 Study Routine Alert: ${reading.courseCode}`,
        `Time to study ${reading.courseCode}! Goal: ${reading.goal}`,
        fifteenMinBefore > Date.now() ? fifteenMinBefore : Date.now() + 5000,
        'nsg_reading_alarms'
      );

      if (setUserNotification) {
        setUserNotification(`Opening Calendar & set 15-min alarm for ${reading.courseCode} study session!`);
      }
    } catch (err) {
      console.error("Reading calendar error", err);
    }
  };

  // Open Calendar Page directly (NO .ics download!)
  const handleOpenCalendarEvent = (exam: ExamItem) => {
    try {
      const nextAlarmState = !exam.alarmSet;
      const updated = examItems.map(item => item.id === exam.id ? { ...item, alarmSet: nextAlarmState } : item);
      setExamItems(updated);
      saveAllTimetables(lectureItems, readingItems, updated);

      if (!nextAlarmState) {
        if (setUserNotification) {
          setUserNotification(`Turned off alarm for ${exam.courseCode} examination.`);
        }
        return;
      }

      const [y, m, d] = (exam.examDate || new Date().toISOString().split('T')[0]).split('-').map(Number);
      const [startH, startM] = (exam.startTime || '09:00').split(':').map(Number);
      const [endH, endM] = (exam.endTime || '12:00').split(':').map(Number);

      const startDate = new Date(y, m - 1, d, startH, startM);
      const endDate = new Date(y, m - 1, d, endH, endM);

      const pad = (n: number) => n.toString().padStart(2, '0');
      const formatIsoBasic = (dt: Date) => 
        `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`;

      const title = encodeURIComponent(`${exam.courseCode} Final Examination`);
      const details = encodeURIComponent(
        `Final Exam for ${exam.courseTitle || exam.courseCode}.\nVenue: ${exam.venue}.\nSeat: ${exam.seatNumber || 'N/A'}.\nReminder: 2 hours prior.`
      );
      const location = encodeURIComponent(exam.venue || 'University Examination Hall');
      
      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatIsoBasic(startDate)}/${formatIsoBasic(endDate)}&details=${details}&location=${location}`;

      // Open Google Calendar / Device Calendar web intent directly
      window.open(gcalUrl, '_blank');

      // Schedule in-app local notification 2 hours before
      const twoHoursBeforeMs = startDate.getTime() - (2 * 60 * 60 * 1000);
      scheduleLocalNotification(
        `🔔 Upcoming Exam in 2 Hours: ${exam.courseCode}`,
        `Your ${exam.courseCode} examination starts at ${exam.startTime} in ${exam.venue}. Proceed to your exam hall now!`,
        twoHoursBeforeMs > Date.now() ? twoHoursBeforeMs : Date.now() + 5000,
        'nsg_exam_alarms'
      );

      if (setUserNotification) {
        setUserNotification(`Opening Calendar for ${exam.courseCode} Exam & set 2-hour pre-exam reminder!`);
      }
    } catch (err) {
      console.error("Calendar opening error", err);
      if (setUserNotification) {
        setUserNotification("Opened Calendar reminder.");
      }
    }
  };

  // Open Edit Modal for any card
  const handleOpenEditCardModal = (type: TimetableType, item: LectureItem | ReadingItem | ExamItem) => {
    setEditingCard({ type, item });
    setFormCourseCode(item.courseCode || '');
    setFormCourseTitle(('courseTitle' in item ? item.courseTitle : 'title' in item ? item.title : '') || '');
    setFormDay(item.day || selectedDay);
    setFormStartTime(item.startTime || '08:00');
    setFormEndTime(('endTime' in item ? item.endTime : '') || '10:00');
    setFormVenue(('venue' in item ? item.venue : '') || '');
    setFormLecturer(('lecturer' in item ? item.lecturer : '') || '');
    setFormExamDate(('examDate' in item ? item.examDate : '') || new Date().toISOString().split('T')[0]);
    setFormGoal(('goal' in item ? item.goal : '') || '');
    setFormSeatNumber(('seatNumber' in item ? item.seatNumber : '') || '');
    setFormDurationMinutes(('durationMinutes' in item ? item.durationMinutes : 60) || 60);
    setShowCreateModal(true);
  };

  // Upload and Parse PDF Document
  // CRITICAL: When uploading for Exam Timetable, ONLY search for and extract courses that the user is currently offering in this semester!
  const handleUploadTimetablePdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPdf(true);
    setPdfUploadError(null);

    try {
      const details = await extractPdfDetails(file);
      const fullText = details.text || '';

      if (!fullText.trim()) {
        throw new Error("Could not read text from this document. Please ensure the document is clear.");
      }

      const activeUserCourses = registeredCourses.map(c => c.code.trim().toUpperCase()).filter(Boolean);

      if (activeSection === 'exam') {
        // EXAM TIMETABLE PARSING:
        // Filter ONLY by user's registered courses for this semester!
        const foundExams: ExamItem[] = [];

        // If user has no registered courses, extract general courses or prompt
        const targetCourses = activeUserCourses.length > 0 
          ? activeUserCourses 
          : Array.from(new Set(fullText.match(/([A-Z]{3}\s*\d{3})/g) || [])).slice(0, 8);

        targetCourses.forEach(courseCode => {
          const cleanCode = courseCode.replace(/\s+/g, ' ').toUpperCase();
          const regex = new RegExp(`(${cleanCode.replace(/\s+/, '\\s*')})([\\s\\S]{1,120})`, 'i');
          const match = fullText.match(regex);

          if (match) {
            const context = match[2];

            // Extract Day
            let detectedDay: DayOfWeek = 'Monday';
            for (const d of DAYS_OF_WEEK) {
              if (new RegExp(`\\b${d}\\b`, 'i').test(context) || new RegExp(`\\b${d}\\b`, 'i').test(fullText)) {
                detectedDay = d;
                break;
              }
            }

            // Extract Date (e.g. 2026-08-24 or 24/08/2026 or Aug 24)
            let detectedDate = new Date().toISOString().split('T')[0];
            const dateMatch = context.match(/(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})|(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/);
            if (dateMatch) {
              try {
                const parsedDate = new Date(dateMatch[0]);
                if (!isNaN(parsedDate.getTime())) {
                  detectedDate = parsedDate.toISOString().split('T')[0];
                  detectedDay = DAYS_OF_WEEK[parsedDate.getDay() === 0 ? 6 : parsedDate.getDay() - 1] || detectedDay;
                }
              } catch (e) {}
            }

            // Extract Time (e.g. 9:00am, 09:00 - 12:00)
            let detectedStart = '09:00';
            let detectedEnd = '12:00';
            const timeMatch = context.match(/(\d{1,2}[:.]\d{2})\s*(am|pm)?\s*(-|to)\s*(\d{1,2}[:.]\d{2})\s*(am|pm)?/i);
            if (timeMatch) {
              detectedStart = timeMatch[1].replace('.', ':').padStart(5, '0');
              detectedEnd = timeMatch[4].replace('.', ':').padStart(5, '0');
            }

            // Extract Venue
            let detectedVenue = 'Main Examination Hall';
            const venueMatch = context.match(/(Hall\s*[A-Z0-9]+|Theatre\s*[0-9]+|Auditorium|Room\s*[0-9]+|Centre|Center)/i);
            if (venueMatch) {
              detectedVenue = venueMatch[0];
            }

            const regMatch = registeredCourses.find(c => c.code.toUpperCase() === cleanCode);

            foundExams.push({
              id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
              courseCode: cleanCode,
              courseTitle: regMatch?.title || `${cleanCode} Examination`,
              day: detectedDay,
              examDate: detectedDate,
              startTime: detectedStart,
              endTime: detectedEnd,
              venue: detectedVenue,
              predictedScore: 'A'
            });
          }
        });

        if (foundExams.length === 0) {
          throw new Error(
            activeUserCourses.length > 0
              ? `None of your registered courses (${activeUserCourses.join(', ')}) were found in this exam timetable.`
              : "No examinations detected. Please register your semester courses in the CGPA tool first!"
          );
        }

        const merged = [...examItems, ...foundExams];
        setExamItems(merged);
        saveAllTimetables(lectureItems, readingItems, merged);

        if (setUserNotification) {
          setUserNotification(
            `Extracted ${foundExams.length} offered exams matching your ${currentAcademicInfo.level}L ${currentAcademicInfo.semester === 'first' ? '1st' : '2nd'} Sem courses!`
          );
        }
      } else {
        // LECTURE TIMETABLE PARSING:
        const foundLectures: LectureItem[] = [];
        const courseRegex = /([A-Z]{3}\s*\d{3})/g;
        const matches = Array.from(new Set(fullText.match(courseRegex) || []));

        matches.slice(0, 6).forEach((code, idx) => {
          const cleanCode = code.replace(/\s+/g, ' ').toUpperCase();
          const day = DAYS_OF_WEEK[idx % DAYS_OF_WEEK.length];
          foundLectures.push({
            id: Date.now().toString() + idx,
            courseCode: cleanCode,
            courseTitle: `Lecture for ${cleanCode}`,
            day,
            startTime: '08:00',
            endTime: '10:00',
            venue: 'Lecture Hall 1',
            color: PRESET_COLORS[idx % PRESET_COLORS.length],
            missedCount: 0,
            attendanceHistory: []
          });
        });

        const merged = [...lectureItems, ...foundLectures];
        setLectureItems(merged);
        saveAllTimetables(merged, readingItems, examItems);

        if (setUserNotification) {
          setUserNotification(`Added ${foundLectures.length} lectures to your timetable!`);
        }
      }
    } catch (err: any) {
      console.error("PDF upload error:", err);
      setPdfUploadError(err.message || "Failed to parse timetable document.");
    } finally {
      setIsUploadingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add or Edit Item Manually
  const handleCreateManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCourseCode.trim()) return;

    const currentType = editingCard ? editingCard.type : (activeSection === 'menu' ? 'lecture' : activeSection);

    if (currentType === 'lecture') {
      if (editingCard) {
        const updated = lectureItems.map(item => {
          if (item.id === editingCard.item.id) {
            return {
              ...item,
              courseCode: formCourseCode.trim().toUpperCase(),
              courseTitle: formCourseTitle.trim() || formCourseCode.trim().toUpperCase(),
              day: formDay,
              startTime: formStartTime,
              endTime: formEndTime,
              venue: formVenue || 'Lecture Hall',
              lecturer: formLecturer
            };
          }
          return item;
        });
        setLectureItems(updated);
        saveAllTimetables(updated, readingItems, examItems);
        if (setUserNotification) setUserNotification(`Updated ${formCourseCode.trim().toUpperCase()} lecture!`);
      } else {
        const newItem: LectureItem = {
          id: Date.now().toString(),
          courseCode: formCourseCode.trim().toUpperCase(),
          courseTitle: formCourseTitle.trim() || formCourseCode.trim().toUpperCase(),
          day: formDay,
          startTime: formStartTime,
          endTime: formEndTime,
          venue: formVenue || 'Lecture Hall',
          lecturer: formLecturer,
          color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
          missedCount: 0,
          attendanceHistory: [],
          alarmSet: false
        };
        const updated = [...lectureItems, newItem];
        setLectureItems(updated);
        saveAllTimetables(updated, readingItems, examItems);
        if (setUserNotification) setUserNotification(`Added ${newItem.courseCode} to Lecture Timetable!`);
      }
    } else if (currentType === 'personal') {
      if (editingCard) {
        const updated = readingItems.map(item => {
          if (item.id === editingCard.item.id) {
            return {
              ...item,
              courseCode: formCourseCode.trim().toUpperCase(),
              title: formCourseTitle.trim() || `${formCourseCode.trim().toUpperCase()} Study Session`,
              day: formDay,
              startTime: formStartTime,
              durationMinutes: Number(formDurationMinutes) || 60,
              goal: formGoal || 'Master core lecture topics & past questions'
            };
          }
          return item;
        });
        setReadingItems(updated);
        saveAllTimetables(lectureItems, updated, examItems);
        if (setUserNotification) setUserNotification(`Updated ${formCourseCode.trim().toUpperCase()} study routine!`);
      } else {
        const newItem: ReadingItem = {
          id: Date.now().toString(),
          title: formCourseTitle.trim() || `${formCourseCode.trim().toUpperCase()} Study Session`,
          courseCode: formCourseCode.trim().toUpperCase(),
          day: formDay,
          startTime: formStartTime,
          durationMinutes: Number(formDurationMinutes) || 60,
          goal: formGoal || 'Master core lecture topics & past questions',
          completedHistory: [],
          alarmSet: false
        };
        const updated = [...readingItems, newItem];
        setReadingItems(updated);
        saveAllTimetables(lectureItems, updated, examItems);
        if (setUserNotification) setUserNotification(`Added study session for ${newItem.courseCode}!`);
      }
    } else if (currentType === 'exam') {
      // Calculate Day of Week from chosen exam date
      let examDay: DayOfWeek = formDay;
      if (formExamDate) {
        try {
          const parsed = new Date(formExamDate);
          if (!isNaN(parsed.getTime())) {
            const dayIdx = parsed.getDay() === 0 ? 6 : parsed.getDay() - 1;
            examDay = DAYS_OF_WEEK[dayIdx] || formDay;
          }
        } catch (e) {}
      }

      if (editingCard) {
        const updated = examItems.map(item => {
          if (item.id === editingCard.item.id) {
            return {
              ...item,
              courseCode: formCourseCode.trim().toUpperCase(),
              courseTitle: formCourseTitle.trim() || `${formCourseCode.trim().toUpperCase()} Exam`,
              day: examDay,
              examDate: formExamDate,
              startTime: formStartTime,
              endTime: formEndTime,
              venue: formVenue || 'Main Exam Hall',
              seatNumber: formSeatNumber
            };
          }
          return item;
        });
        setExamItems(updated);
        saveAllTimetables(lectureItems, readingItems, updated);
        if (setUserNotification) setUserNotification(`Updated ${formCourseCode.trim().toUpperCase()} Examination!`);
      } else {
        const newItem: ExamItem = {
          id: Date.now().toString(),
          courseCode: formCourseCode.trim().toUpperCase(),
          courseTitle: formCourseTitle.trim() || `${formCourseCode.trim().toUpperCase()} Exam`,
          day: examDay,
          examDate: formExamDate,
          startTime: formStartTime,
          endTime: formEndTime,
          venue: formVenue || 'Main Exam Hall',
          seatNumber: formSeatNumber,
          predictedScore: 'A',
          alarmSet: false
        };
        const updated = [...examItems, newItem];
        setExamItems(updated);
        saveAllTimetables(lectureItems, readingItems, updated);
        if (setUserNotification) setUserNotification(`Added ${newItem.courseCode} Examination!`);
      }
    }

    setShowCreateModal(false);
    setEditingCard(null);
    setFormCourseCode('');
    setFormCourseTitle('');
    setFormVenue('');
    setFormLecturer('');
    setFormGoal('');
    setFormSeatNumber('');
  };

  // Inline Update for Lecture
  const handleUpdateLecture = (id: string, updates: Partial<LectureItem>) => {
    const updated = lectureItems.map(item => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      return item;
    });
    setLectureItems(updated);
    saveAllTimetables(updated, readingItems, examItems);
  };

  // Delete single lecture row
  const handleDeleteLecture = (id: string) => {
    const updated = lectureItems.filter(item => item.id !== id);
    setLectureItems(updated);
    saveAllTimetables(updated, readingItems, examItems);
    if (setUserNotification) {
      setUserNotification("Lecture removed from timetable.");
    }
  };

  // Add blank lecture row
  const handleAddBlankLecture = (day: DayOfWeek | string) => {
    const newLecture: LectureItem = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
      courseCode: '',
      courseTitle: '',
      day: (day as DayOfWeek) || selectedDay,
      startTime: '08:00',
      endTime: '10:00',
      venue: '',
      lecturer: ''
    };
    const updated = [...lectureItems, newLecture];
    setLectureItems(updated);
    saveAllTimetables(updated, readingItems, examItems);
  };

  // Inline Update for Reading routine
  const handleUpdateReading = (id: string, updates: Partial<ReadingItem>) => {
    const updated = readingItems.map(item => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      return item;
    });
    setReadingItems(updated);
    saveAllTimetables(lectureItems, updated, examItems);
  };

  // Delete single reading row
  const handleDeleteReading = (id: string) => {
    const updated = readingItems.filter(item => item.id !== id);
    setReadingItems(updated);
    saveAllTimetables(lectureItems, updated, examItems);
    if (setUserNotification) {
      setUserNotification("Study routine removed.");
    }
  };

  // Add blank reading row
  const handleAddBlankReading = (day: DayOfWeek | string) => {
    const newReading: ReadingItem = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
      courseCode: '',
      title: '',
      day: (day as DayOfWeek) || selectedDay,
      startTime: '19:00',
      durationMinutes: 60,
      goal: ''
    };
    const updated = [...readingItems, newReading];
    setReadingItems(updated);
    saveAllTimetables(lectureItems, updated, examItems);
  };

  // Inline Update for Exam in Timetable
  const handleUpdateExam = (id: string, updates: Partial<ExamItem>) => {
    const updated = examItems.map(item => {
      if (item.id === id) {
        const newItem = { ...item, ...updates };
        if (updates.examDate) {
          try {
            const parsed = new Date(updates.examDate);
            if (!isNaN(parsed.getTime())) {
              const dayIdx = parsed.getDay() === 0 ? 6 : parsed.getDay() - 1;
              newItem.day = DAYS_OF_WEEK[dayIdx] || newItem.day;
            }
          } catch (e) {}
        }
        return newItem;
      }
      return item;
    });
    setExamItems(updated);
    saveAllTimetables(lectureItems, readingItems, updated);
  };

  // Delete single exam row
  const handleDeleteExam = (id: string) => {
    const updated = examItems.filter(item => item.id !== id);
    setExamItems(updated);
    saveAllTimetables(lectureItems, readingItems, updated);
    if (setUserNotification) {
      setUserNotification("Exam deleted from timetable.");
    }
  };

  // Add blank exam row
  const handleAddBlankExam = () => {
    const today = new Date().toISOString().split('T')[0];
    const newExam: ExamItem = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
      courseCode: '',
      courseTitle: '',
      day: todayDayName,
      examDate: today,
      startTime: '09:00',
      endTime: '12:00',
      venue: 'Main Examination Hall',
      seatNumber: '',
      predictedScore: 'A'
    };
    const updated = [...examItems, newExam];
    setExamItems(updated);
    saveAllTimetables(lectureItems, readingItems, updated);
  };

  // Delete All Exams
  const handleDeleteAllExams = () => {
    setExamItems([]);
    saveAllTimetables(lectureItems, readingItems, []);
    setShowDeleteAllExamsConfirm(false);
    if (setUserNotification) {
      setUserNotification("All examination records deleted.");
    }
  };

  // Filter items for selected day
  const filteredLectures = useMemo(() => {
    return lectureItems.filter(l => l.day === selectedDay);
  }, [lectureItems, selectedDay]);

  const filteredReadings = useMemo(() => {
    return readingItems.filter(r => r.day === selectedDay);
  }, [readingItems, selectedDay]);

  const filteredExams = useMemo(() => {
    return examItems.filter(e => e.day === selectedDay);
  }, [examItems, selectedDay]);

  // Chronologically sorted all exams for Full Timetable View
  const sortedAllExams = useMemo(() => {
    return [...examItems].sort((a, b) => {
      const dateAStr = a.examDate ? `${a.examDate}T${a.startTime || '00:00'}` : '';
      const dateBStr = b.examDate ? `${b.examDate}T${b.startTime || '00:00'}` : '';
      const timeA = dateAStr ? new Date(dateAStr).getTime() : 0;
      const timeB = dateBStr ? new Date(dateBStr).getTime() : 0;
      const safeTimeA = isNaN(timeA) ? 0 : timeA;
      const safeTimeB = isNaN(timeB) ? 0 : timeB;
      return safeTimeA - safeTimeB;
    });
  }, [examItems]);

  return (
    <div className={`w-full max-w-4xl mx-auto space-y-6 pb-24 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
      {/* Hidden File Input for PDF Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,application/pdf"
        onChange={handleUploadTimetablePdf}
        className="hidden"
      />

      {/* Top Header */}
      <div 
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
        className="flex items-center justify-between px-2"
      >
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (activeSection !== 'menu') {
                setActiveSection('menu');
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
              <CalendarIcon className="text-[#DC2626]" size={24} />
              {activeSection === 'menu' 
                ? 'Academic Timetable' 
                : activeSection === 'lecture'
                ? 'Lecture Timetable'
                : activeSection === 'personal'
                ? 'Reading & Personal Timetable'
                : 'Examination Timetable'
              }
            </h1>
            <p className="text-[10px] sm:text-xs text-white/40 uppercase tracking-widest font-mono">
              {activeSection === 'menu' 
                ? 'Lecture • Reading • Examination Schedules' 
                : `Today is ${todayDayName} • ${currentAcademicInfo.level}L ${currentAcademicInfo.semester === 'first' ? '1st Sem' : '2nd Sem'}`
              }
            </p>
          </div>
        </div>

        {activeSection !== 'menu' && (
          <div className="flex items-center gap-2">
            {activeSection === 'exam' && (
              <button
                onClick={() => setShowFullExamModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wide flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                <Eye size={14} />
                <span>View Full Timetable</span>
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPdf}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
              title="Upload Official PDF Timetable"
            >
              <Upload size={14} className="text-[#DC2626]" />
              <span className="hidden sm:inline">{isUploadingPdf ? 'Extracting...' : 'Upload PDF'}</span>
            </button>
          </div>
        )}
      </div>

      {/* PDF Upload Error */}
      {pdfUploadError && (
        <div className="p-4 bg-red-950/60 border border-red-500/30 rounded-2xl flex items-center justify-between text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{pdfUploadError}</span>
          </div>
          <button onClick={() => setPdfUploadError(null)} className="text-white/40 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* VIEW 1: MENU SELECTION (THE 3 CORE TIMETABLES AS A MODERN LIST) */}
      {activeSection === 'menu' ? (
        <div className="space-y-4 pt-1">
          {/* Active Semester Profile */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 px-1">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase text-white/40 tracking-wider">Academic Standing</span>
              <h3 className="text-sm font-black text-white">
                {currentAcademicInfo.level} Level — {currentAcademicInfo.semester === 'first' ? 'First Semester' : 'Second Semester'}
              </h3>
              <p className="text-xs text-emerald-400 font-mono">
                {registeredCourses.length} Registered Courses Offering
              </p>
            </div>
            {onOpenCGPATool && (
              <button
                onClick={onOpenCGPATool}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/80 hover:text-white transition-all cursor-pointer"
              >
                Edit My Courses
              </button>
            )}
          </div>

          {/* Clean Modern List: Lecture Timetable, Reading Timetable, Exam Timetable */}
          <div className="divide-y divide-white/10">
            {/* 1. Lecture Timetable - Purple Theme */}
            <button
              type="button"
              onClick={() => setActiveSection('lecture')}
              className="w-full py-4 px-2 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CalendarIcon size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black uppercase tracking-tight text-white group-hover:text-purple-400 transition-colors">
                    Lecture Timetable
                  </h3>
                  <p className="text-xs text-white/50 truncate mt-0.5">
                    Daily class schedules, lecture halls, and interactive attendance tracking
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 pl-3">
                <span className="text-xs font-mono font-bold text-white/40 group-hover:text-purple-300">
                  {lectureItems.length} {lectureItems.length === 1 ? 'lecture' : 'lectures'}
                </span>
                <ChevronRight size={18} className="text-white/30 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>

            {/* 2. Reading Timetable - Orange-Yellow Theme */}
            <button
              type="button"
              onClick={() => setActiveSection('personal')}
              className="w-full py-4 px-2 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpen size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black uppercase tracking-tight text-white group-hover:text-amber-400 transition-colors">
                    Reading Timetable
                  </h3>
                  <p className="text-xs text-white/50 truncate mt-0.5">
                    Personal self-study sessions, course goals, and focused study routines
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 pl-3">
                <span className="text-xs font-mono font-bold text-white/40 group-hover:text-amber-300">
                  {readingItems.length} {readingItems.length === 1 ? 'routine' : 'routines'}
                </span>
                <ChevronRight size={18} className="text-white/30 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>

            {/* 3. Exam Timetable - Red Theme */}
            <button
              type="button"
              onClick={() => setActiveSection('exam')}
              className="w-full py-4 px-2 flex items-center justify-between hover:bg-white/[0.03] transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-red-500/15 text-red-400 border border-red-500/25 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Award size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black uppercase tracking-tight text-white group-hover:text-red-400 transition-colors">
                    Exam Timetable
                  </h3>
                  <p className="text-xs text-white/50 truncate mt-0.5">
                    Daily exam breakdown for offered courses, venue details, and calendar alarms
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 pl-3">
                <span className="text-xs font-mono font-bold text-white/40 group-hover:text-red-300">
                  {examItems.length} {examItems.length === 1 ? 'exam' : 'exams'}
                </span>
                <ChevronRight size={18} className="text-white/30 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          </div>
        </div>
      ) : (
        /* VIEW 2: DEDICATED TIMETABLE PAGE WITHOUT LOCKED CONTAINERS */
        <div className="space-y-4">
          {/* Days of the Week: Horizontal List without its own separate container */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-white/10">
            {DAYS_OF_WEEK.map((day) => {
              const isToday = day === todayDayName;
              const isSelected = day === selectedDay;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 sm:px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border-b-2 ${
                    isSelected
                      ? 'border-[#DC2626] text-white'
                      : isToday
                      ? 'border-amber-400/50 text-amber-300 hover:text-white'
                      : 'border-transparent text-white/40 hover:text-white'
                  }`}
                >
                  <span>{day}</span>
                  {isToday && (
                    <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-amber-400/20 text-amber-300">
                      Today
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Row: Open Horizontal List without locked container */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              {activeSection === 'lecture' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleAddBlankLecture(selectedDay)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus size={13} className="text-[#DC2626]" />
                    <span>Add Row</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormDay(selectedDay);
                      setShowCreateModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-bold text-red-300 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add Form</span>
                  </button>
                </>
              )}

              {activeSection === 'personal' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleAddBlankReading(selectedDay)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus size={13} className="text-purple-400" />
                    <span>Add Row</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormDay(selectedDay);
                      setShowCreateModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-xs font-bold text-purple-300 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Plan Study</span>
                  </button>
                </>
              )}

              {activeSection === 'exam' && (
                <>
                  <button
                    type="button"
                    onClick={handleAddBlankExam}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus size={13} className="text-amber-400" />
                    <span>Add Row</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFullExamModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-bold text-amber-300 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <Eye size={13} />
                    <span>Full Timetable ({examItems.length})</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPdf}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                title="Upload Official PDF Timetable"
              >
                <Upload size={13} className="text-[#DC2626]" />
                <span>{isUploadingPdf ? 'Extracting...' : 'Upload Timetable'}</span>
              </button>
            </div>

            <span className="text-xs font-mono font-bold text-white/40">
              {selectedDay}&apos;s {activeSection === 'lecture' ? `Lectures (${filteredLectures.length})` : activeSection === 'personal' ? `Study Sessions (${filteredReadings.length})` : `Exams (${filteredExams.length})`}
            </span>
          </div>

          {/* Timetable Set List for Selected Day */}
          <div className="space-y-3 pt-1">
            {/* LECTURE TIMETABLE VIEW */}
            {activeSection === 'lecture' && (
              <div className="space-y-2">
                {filteredLectures.length === 0 ? (
                  <div className="py-10 text-center space-y-3">
                    <p className="text-xs text-white/40 italic">No lectures scheduled for {selectedDay}.</p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleAddBlankLecture(selectedDay)}
                        className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={13} className="text-[#DC2626]" />
                        <span>Add Lecture Row</span>
                      </button>
                      <button
                        onClick={() => {
                          setFormDay(selectedDay);
                          setShowCreateModal(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-bold text-red-300 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Add with Form</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {filteredLectures.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="py-3 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                          <span className="text-xs font-mono font-bold text-purple-400/60 w-5 shrink-0">{idx + 1}.</span>
                          
                          {/* Course Code with Underline */}
                          <div className="w-24 sm:w-28 shrink-0">
                            <input
                              type="text"
                              value={item.courseCode}
                              placeholder="CODE"
                              onChange={(e) => handleUpdateLecture(item.id, { courseCode: e.target.value.toUpperCase() })}
                              className="w-full bg-transparent border-b border-purple-500/25 hover:border-purple-500/50 focus:border-purple-400 text-xs sm:text-sm font-black font-mono text-purple-300 uppercase py-0.5 outline-none tracking-wider placeholder:text-white/20"
                            />
                          </div>

                          {/* Course Title with Underline */}
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={item.courseTitle}
                              placeholder="Course Title"
                              onChange={(e) => handleUpdateLecture(item.id, { courseTitle: e.target.value })}
                              className="w-full bg-transparent border-b border-white/15 hover:border-white/40 focus:border-purple-400 text-xs sm:text-sm text-white py-0.5 outline-none placeholder:text-white/20 truncate"
                            />
                          </div>
                        </div>

                        {/* Time, Venue, Lecturer, Attendance & Alarm */}
                        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap w-full lg:w-auto pl-8 lg:pl-0">
                          {/* Lecture Time */}
                          <div className="flex items-center gap-1 shrink-0 bg-white/[0.03] px-2 py-1 rounded-lg border border-white/5">
                            <Clock size={12} className="text-purple-400 shrink-0" />
                            <input
                              type="time"
                              value={item.startTime}
                              onChange={(e) => handleUpdateLecture(item.id, { startTime: e.target.value })}
                              className="bg-transparent border-b border-white/20 hover:border-white/40 focus:border-purple-400 text-xs font-mono font-bold text-white py-0.5 outline-none"
                            />
                            <span className="text-white/40 text-xs font-mono">-</span>
                            <input
                              type="time"
                              value={item.endTime}
                              onChange={(e) => handleUpdateLecture(item.id, { endTime: e.target.value })}
                              className="bg-transparent border-b border-white/20 hover:border-white/40 focus:border-purple-400 text-xs font-mono font-bold text-white py-0.5 outline-none"
                            />
                          </div>

                          {/* Venue Input */}
                          <div className="w-24 sm:w-28 shrink-0">
                            <input
                              type="text"
                              value={item.venue}
                              placeholder="Venue"
                              onChange={(e) => handleUpdateLecture(item.id, { venue: e.target.value })}
                              className="w-full bg-transparent border-b border-white/15 hover:border-white/40 focus:border-purple-400 text-xs text-white/70 py-0.5 outline-none placeholder:text-white/20 truncate"
                            />
                          </div>

                          {/* Lecturer Input */}
                          <div className="w-24 sm:w-28 shrink-0">
                            <input
                              type="text"
                              value={item.lecturer || ''}
                              placeholder="Lecturer"
                              onChange={(e) => handleUpdateLecture(item.id, { lecturer: e.target.value })}
                              className="w-full bg-transparent border-b border-white/15 hover:border-white/40 focus:border-purple-400 text-xs text-white/70 py-0.5 outline-none placeholder:text-white/20 truncate"
                            />
                          </div>

                          {/* Attendance Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleMarkAttendance(item.id, true)}
                              className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[11px] font-black uppercase flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                              title="Mark attended"
                            >
                              <CheckCircle2 size={12} />
                              <span className="hidden sm:inline">Present</span>
                            </button>

                            <button
                              onClick={() => handleMarkAttendance(item.id, false)}
                              className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-[11px] font-black uppercase flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                              title="Mark missed"
                            >
                              <XCircle size={12} />
                              <span className="hidden sm:inline">Missed</span>
                            </button>
                          </div>

                          {/* Edit, Alarm & Delete */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleOpenEditCardModal('lecture', item)}
                              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                              title="Edit lecture details"
                            >
                              <Edit3 size={12} className="text-purple-400" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => handleOpenLectureCalendar(item)}
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                item.alarmSet
                                  ? 'bg-purple-500/25 border-purple-400 text-purple-200 shadow-sm shadow-purple-500/20'
                                  : 'bg-purple-500/15 hover:bg-purple-500/25 border-purple-500/30 text-purple-300'
                              }`}
                              title={item.alarmSet ? "Alarm active • Click to toggle" : "Set Google / Device Calendar Alarm"}
                            >
                              <BellRing size={12} className={item.alarmSet ? "text-purple-300 animate-pulse" : "text-purple-400"} />
                              <span className="hidden sm:inline">{item.alarmSet ? "Alarm Set" : "Alarm"}</span>
                            </button>
                            <button
                              onClick={() => handleDeleteLecture(item.id)}
                              className="text-white/25 hover:text-red-400 p-1 transition-colors cursor-pointer"
                              title="Remove lecture"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PERSONAL / READING TIMETABLE VIEW */}
            {activeSection === 'personal' && (
              <div className="space-y-2">
                {filteredReadings.length === 0 ? (
                  <div className="py-10 text-center space-y-3">
                    <p className="text-xs text-white/40 italic">No reading sessions set for {selectedDay}.</p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleAddBlankReading(selectedDay)}
                        className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={13} className="text-amber-400" />
                        <span>Add Study Row</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingCard(null);
                          setFormDay(selectedDay);
                          setShowCreateModal(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-bold text-amber-300 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Plan with Form</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {filteredReadings.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="py-3 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                          <span className="text-xs font-mono font-bold text-amber-400/60 w-5 shrink-0">{idx + 1}.</span>
                          
                          {/* Course Code with Underline */}
                          <div className="w-24 sm:w-28 shrink-0">
                            <input
                              type="text"
                              value={item.courseCode}
                              placeholder="CODE"
                              onChange={(e) => handleUpdateReading(item.id, { courseCode: e.target.value.toUpperCase() })}
                              className="w-full bg-transparent border-b border-amber-500/25 hover:border-amber-500/50 focus:border-amber-400 text-xs sm:text-sm font-black font-mono text-amber-300 uppercase py-0.5 outline-none tracking-wider placeholder:text-white/20"
                            />
                          </div>

                          {/* Study Title with Underline */}
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={item.title}
                              placeholder="Study Topic / Title"
                              onChange={(e) => handleUpdateReading(item.id, { title: e.target.value })}
                              className="w-full bg-transparent border-b border-white/15 hover:border-white/40 focus:border-amber-400 text-xs sm:text-sm text-white py-0.5 outline-none placeholder:text-white/20 truncate"
                            />
                          </div>
                        </div>

                        {/* Time, Duration, Goal & Actions */}
                        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap w-full lg:w-auto pl-8 lg:pl-0">
                          {/* Study Start Time & Duration */}
                          <div className="flex items-center gap-1 shrink-0 bg-white/[0.03] px-2 py-1 rounded-lg border border-white/5">
                            <Clock size={12} className="text-amber-400 shrink-0" />
                            <input
                              type="time"
                              value={item.startTime}
                              onChange={(e) => handleUpdateReading(item.id, { startTime: e.target.value })}
                              className="bg-transparent border-b border-white/20 hover:border-white/40 focus:border-amber-400 text-xs font-mono font-bold text-amber-300 py-0.5 outline-none"
                            />
                            <span className="text-white/40 text-xs font-mono">/</span>
                            <input
                              type="number"
                              min={15}
                              max={300}
                              value={item.durationMinutes || ''}
                              placeholder="60"
                              onChange={(e) => handleUpdateReading(item.id, { durationMinutes: parseInt(e.target.value) || 30 })}
                              className="w-10 bg-transparent border-b border-white/20 hover:border-white/40 focus:border-amber-400 text-xs font-mono font-bold text-amber-300 py-0.5 outline-none text-center"
                            />
                            <span className="text-[10px] text-white/40 font-mono">m</span>
                          </div>

                          {/* Study Goal Input */}
                          <div className="w-28 sm:w-36 shrink-0">
                            <input
                              type="text"
                              value={item.goal}
                              placeholder="Study Goal"
                              onChange={(e) => handleUpdateReading(item.id, { goal: e.target.value })}
                              className="w-full bg-transparent border-b border-white/15 hover:border-white/40 focus:border-amber-400 text-xs text-amber-200/80 py-0.5 outline-none placeholder:text-white/20 truncate"
                            />
                          </div>

                          {/* Quiz Button */}
                          {onOpenQuizWithTopic && (
                            <button
                              onClick={() => onOpenQuizWithTopic(item.courseCode)}
                              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-black uppercase flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                            >
                              <span>Quiz</span>
                            </button>
                          )}

                          {/* Edit, Alarm & Delete */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleOpenEditCardModal('personal', item)}
                              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                              title="Edit study routine details"
                            >
                              <Edit3 size={12} className="text-amber-400" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => handleOpenReadingCalendar(item)}
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                item.alarmSet
                                  ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-sm shadow-amber-500/20'
                                  : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300'
                              }`}
                              title={item.alarmSet ? "Alarm active • Click to toggle" : "Set Google / Device Calendar Alarm"}
                            >
                              <BellRing size={12} className={item.alarmSet ? "text-amber-300 animate-pulse" : "text-amber-400"} />
                              <span className="hidden sm:inline">{item.alarmSet ? "Alarm Set" : "Alarm"}</span>
                            </button>
                            <button
                              onClick={() => handleDeleteReading(item.id)}
                              className="text-white/25 hover:text-red-400 p-1 transition-colors cursor-pointer"
                              title="Remove reading routine"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* EXAMINATION TIMETABLE VIEW (ORGANIZED BY DAYS WITH FULL VIEW TOGGLE) */}
            {activeSection === 'exam' && (
              <div className="space-y-3">
                {filteredExams.length === 0 ? (
                  <div className="py-10 text-center space-y-3">
                    <p className="text-xs text-white/40 italic">No examinations scheduled for {selectedDay}.</p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        onClick={() => setShowFullExamModal(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-bold text-red-300 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>View All {examItems.length} Exams</span>
                      </button>
                      <button
                        onClick={handleAddBlankExam}
                        className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Add Exam on {selectedDay}</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingCard(null);
                          setFormDay(selectedDay);
                          setShowCreateModal(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-xs font-bold text-red-200 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>Add with Form</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {filteredExams.map((exam, idx) => (
                      <div
                        key={exam.id || idx}
                        className="py-3 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                          <span className="text-xs font-mono font-bold text-red-400/60 w-5 shrink-0">{idx + 1}.</span>
                          
                          {/* Course Code with Underline */}
                          <div className="w-24 sm:w-28 shrink-0">
                            <input
                              type="text"
                              value={exam.courseCode}
                              placeholder="CODE"
                              onChange={(e) => handleUpdateExam(exam.id, { courseCode: e.target.value.toUpperCase() })}
                              className="w-full bg-transparent border-b border-red-500/25 hover:border-red-500/50 focus:border-red-400 text-xs sm:text-sm font-black font-mono text-red-300 uppercase py-0.5 outline-none tracking-wider placeholder:text-white/20"
                            />
                          </div>

                          {/* Course Title with Underline */}
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={exam.courseTitle}
                              placeholder="Course Title"
                              onChange={(e) => handleUpdateExam(exam.id, { courseTitle: e.target.value })}
                              className="w-full bg-transparent border-b border-white/15 hover:border-white/40 focus:border-red-400 text-xs sm:text-sm text-white py-0.5 outline-none placeholder:text-white/20 truncate"
                            />
                          </div>
                        </div>

                        {/* Exam Time & Venue Details */}
                        <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto pl-8 lg:pl-0">
                          {/* Prominent Exam Time */}
                          <div className="flex items-center gap-1 shrink-0 bg-white/[0.03] px-2 py-1 rounded-lg border border-white/5">
                            <Clock size={12} className="text-red-400 shrink-0" />
                            <input
                              type="time"
                              value={exam.startTime}
                              onChange={(e) => handleUpdateExam(exam.id, { startTime: e.target.value })}
                              className="bg-transparent border-b border-white/20 hover:border-white/40 focus:border-red-400 text-xs font-mono font-bold text-red-300 py-0.5 outline-none"
                            />
                            <span className="text-white/40 text-xs font-mono">-</span>
                            <input
                              type="time"
                              value={exam.endTime}
                              onChange={(e) => handleUpdateExam(exam.id, { endTime: e.target.value })}
                              className="bg-transparent border-b border-white/20 hover:border-white/40 focus:border-red-400 text-xs font-mono font-bold text-red-300 py-0.5 outline-none"
                            />
                          </div>

                          {/* Venue Input with Underline */}
                          <div className="w-28 sm:w-36 shrink-0">
                            <input
                              type="text"
                              value={exam.venue}
                              placeholder="Venue"
                              onChange={(e) => handleUpdateExam(exam.id, { venue: e.target.value })}
                              className="w-full bg-transparent border-b border-white/15 hover:border-white/40 focus:border-red-400 text-xs text-white/70 py-0.5 outline-none placeholder:text-white/20 truncate"
                            />
                          </div>

                          {/* Edit, Alarm & Delete */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleOpenEditCardModal('exam', exam)}
                              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                              title="Edit exam details"
                            >
                              <Edit3 size={12} className="text-red-400" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => handleOpenCalendarEvent(exam)}
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                exam.alarmSet
                                  ? 'bg-red-500/25 border-red-400 text-red-200 shadow-sm shadow-red-500/20'
                                  : 'bg-red-500/15 hover:bg-red-500/25 border-red-500/30 text-red-300'
                              }`}
                              title={exam.alarmSet ? "Alarm active • Click to toggle" : "Set Google / Device Calendar Alarm"}
                            >
                              <BellRing size={12} className={exam.alarmSet ? "text-red-300 animate-pulse" : "text-red-400"} />
                              <span className="hidden sm:inline">{exam.alarmSet ? "Alarm Set" : "Alarm"}</span>
                            </button>
                            <button
                              onClick={() => handleDeleteExam(exam.id)}
                              className="text-white/25 hover:text-red-400 p-1 transition-colors cursor-pointer"
                              title="Remove exam"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW FULL EXAM TIMETABLE MODAL (CLEAN TEXT LIST LEDGER WITH UNDERLINED EDITABLES & DELETE ALL) */}
      <AnimatePresence>
        {showFullExamModal && (
          <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              className="w-full max-w-4xl bg-[#13111C] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Top Header & Actions */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <CalendarCheck2 size={18} className="text-red-400" />
                    <span>Examination Timetable</span>
                    <span className="text-xs font-mono font-normal text-white/50">
                      ({sortedAllExams.length} {sortedAllExams.length === 1 ? 'Exam' : 'Exams'})
                    </span>
                  </h3>
                  <p className="text-[11px] text-white/40 font-mono mt-0.5">
                    {currentAcademicInfo.level}L {currentAcademicInfo.semester === 'first' ? '1st' : '2nd'} Semester • Click underlined fields or Edit button to modify
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                  <button
                    onClick={handleAddBlankExam}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus size={13} className="text-red-400" />
                    <span>Add Exam</span>
                  </button>

                  <button
                    onClick={() => setShowDeleteAllExamsConfirm(true)}
                    className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 text-xs font-bold text-red-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Delete all examination timetable records"
                  >
                    <Trash2 size={13} className="text-red-400" />
                    <span>Delete All</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowFullExamModal(false);
                      setShowDeleteAllExamsConfirm(false);
                    }}
                    className="p-1.5 text-white/40 hover:text-white rounded-xl bg-white/5 cursor-pointer ml-1"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Delete All Confirmation Banner */}
              {showDeleteAllExamsConfirm && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 bg-red-950/90 border-b border-red-500/40 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="text-red-400 shrink-0" size={18} />
                    <div>
                      <h4 className="text-xs font-black text-white">Delete Complete Examination Timetable?</h4>
                      <p className="text-[11px] text-red-200">This will remove all {sortedAllExams.length} exam entries. This action cannot be undone.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowDeleteAllExamsConfirm(false)}
                      className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAllExams}
                      className="px-3.5 py-1 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-black text-white shadow-md transition-all cursor-pointer"
                    >
                      Confirm Delete All
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Timetable List Body (Ledger without bulky nested cards) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
                {sortedAllExams.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <p className="text-xs text-white/40 italic">No examination records in timetable.</p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={handleAddBlankExam}
                        className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={13} className="text-red-400" />
                        <span>Add First Exam Row</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowFullExamModal(false);
                          fileInputRef.current?.click();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-xs font-bold text-red-300 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload size={13} />
                        <span>Upload PDF Timetable</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {sortedAllExams.map((exam, idx) => (
                      <div
                        key={exam.id || idx}
                        className="py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                      >
                        {/* Course Code & Title */}
                        <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                          <span className="text-xs font-mono font-bold text-red-400/60 w-5 shrink-0">{idx + 1}.</span>
                          
                          {/* Course Code with Underline */}
                          <div className="w-24 sm:w-28 shrink-0">
                            <input
                              type="text"
                              value={exam.courseCode}
                              placeholder="CODE"
                              onChange={(e) => handleUpdateExam(exam.id, { courseCode: e.target.value.toUpperCase() })}
                              className="w-full bg-transparent border-b border-red-500/25 hover:border-red-500/50 focus:border-red-400 text-xs sm:text-sm font-black font-mono text-red-300 uppercase py-0.5 outline-none tracking-wider placeholder:text-white/20"
                            />
                          </div>

                          {/* Course Title with Underline */}
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={exam.courseTitle}
                              placeholder="Course Title"
                              onChange={(e) => handleUpdateExam(exam.id, { courseTitle: e.target.value })}
                              className="w-full bg-transparent border-b border-white/15 hover:border-white/40 focus:border-red-400 text-xs sm:text-sm text-white py-0.5 outline-none placeholder:text-white/20 truncate"
                            />
                          </div>
                        </div>

                        {/* Exam Schedule, Time, Venue & Action Controls */}
                        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto pl-8 md:pl-0">
                          {/* Date & Day */}
                          <div className="flex items-center gap-1 shrink-0">
                            <input
                              type="date"
                              value={exam.examDate}
                              onChange={(e) => handleUpdateExam(exam.id, { examDate: e.target.value })}
                              className="bg-transparent border-b border-white/20 hover:border-white/40 focus:border-red-400 text-xs font-mono font-semibold text-white/80 py-0.5 outline-none"
                            />
                            <span className="text-[11px] font-mono text-white/40">({exam.day?.slice(0, 3)})</span>
                          </div>

                          {/* Prominent Exam Time Display & Inputs */}
                          <div className="flex items-center gap-1 shrink-0 bg-white/[0.03] px-2 py-1 rounded-lg border border-white/5">
                            <Clock size={12} className="text-red-400 shrink-0" />
                            <input
                              type="time"
                              value={exam.startTime}
                              onChange={(e) => handleUpdateExam(exam.id, { startTime: e.target.value })}
                              className="bg-transparent border-b border-white/20 hover:border-white/40 focus:border-red-400 text-xs font-mono font-bold text-red-300 py-0.5 outline-none"
                              title="Exam Start Time"
                            />
                            <span className="text-white/40 text-xs font-mono">-</span>
                            <input
                              type="time"
                              value={exam.endTime}
                              onChange={(e) => handleUpdateExam(exam.id, { endTime: e.target.value })}
                              className="bg-transparent border-b border-white/20 hover:border-white/40 focus:border-red-400 text-xs font-mono font-bold text-red-300 py-0.5 outline-none"
                              title="Exam End Time"
                            />
                          </div>

                          {/* Venue Input with Underline */}
                          <div className="w-28 sm:w-32 shrink-0">
                            <input
                              type="text"
                              value={exam.venue}
                              placeholder="Venue"
                              onChange={(e) => handleUpdateExam(exam.id, { venue: e.target.value })}
                              className="w-full bg-transparent border-b border-white/15 hover:border-white/40 focus:border-red-400 text-xs text-white/70 py-0.5 outline-none placeholder:text-white/20 truncate"
                            />
                          </div>

                          {/* Seat Number (Optional) */}
                          <div className="w-16 sm:w-20 shrink-0 hidden sm:block">
                            <input
                              type="text"
                              value={exam.seatNumber || ''}
                              placeholder="Seat #"
                              onChange={(e) => handleUpdateExam(exam.id, { seatNumber: e.target.value })}
                              className="w-full bg-transparent border-b border-white/15 hover:border-white/40 focus:border-red-400 text-xs text-white/50 py-0.5 outline-none placeholder:text-white/20"
                            />
                          </div>

                          {/* Row Actions: Edit, Alarm & Delete */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleOpenEditCardModal('exam', exam)}
                              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                              title="Edit exam details"
                            >
                              <Edit3 size={12} className="text-red-400" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>

                            <button
                              onClick={() => handleOpenCalendarEvent(exam)}
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                exam.alarmSet
                                  ? 'bg-red-500/25 border-red-400 text-red-200 shadow-sm shadow-red-500/20'
                                  : 'bg-red-500/15 hover:bg-red-500/25 border-red-500/30 text-red-300'
                              }`}
                              title={exam.alarmSet ? "Alarm active • Click to toggle" : "Set Google / Device Calendar Alarm with 2-hour pre-exam reminder"}
                            >
                              <BellRing size={12} className={exam.alarmSet ? "text-red-300 animate-pulse" : "text-red-400"} />
                              <span className="hidden sm:inline">{exam.alarmSet ? "Alarm Set" : "Alarm"}</span>
                            </button>

                            <button
                              onClick={() => handleDeleteExam(exam.id)}
                              className="text-white/25 hover:text-red-400 p-1 transition-colors cursor-pointer"
                              title="Remove exam"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE / EDIT MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-[#161424] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    (editingCard ? editingCard.type : activeSection) === 'lecture'
                      ? 'bg-purple-500/20 text-purple-400'
                      : (editingCard ? editingCard.type : activeSection) === 'personal'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    <CalendarIcon size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">
                      {editingCard ? 'Edit Schedule Item' : 'Add New Schedule Item'}
                    </h3>
                    <p className="text-[10px] text-white/50 uppercase font-mono">
                      {(editingCard ? editingCard.type : activeSection) === 'lecture' 
                        ? 'Lecture Timetable' 
                        : (editingCard ? editingCard.type : activeSection) === 'personal' 
                        ? 'Reading Schedule' 
                        : 'Examination Timetable'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingCard(null);
                  }} 
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateManualItem} className="space-y-3.5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block mb-1">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MTH 101"
                    value={formCourseCode}
                    onChange={(e) => setFormCourseCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#100E1A] border border-white/10 focus:border-purple-400 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white uppercase focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block mb-1">
                    Course Title / Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Elementary Mathematics I"
                    value={formCourseTitle}
                    onChange={(e) => setFormCourseTitle(e.target.value)}
                    className="w-full bg-[#100E1A] border border-white/10 focus:border-purple-400 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block mb-1">
                      Day of Week
                    </label>
                    <select
                      value={formDay}
                      onChange={(e) => setFormDay(e.target.value as DayOfWeek)}
                      className="w-full bg-[#100E1A] border border-white/10 focus:border-purple-400 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {(editingCard ? editingCard.type : activeSection) === 'exam' ? (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block mb-1">
                        Exam Date
                      </label>
                      <input
                        type="date"
                        value={formExamDate}
                        onChange={(e) => setFormExamDate(e.target.value)}
                        className="w-full bg-[#100E1A] border border-white/10 focus:border-red-400 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block mb-1">
                        Venue / Location
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Science Hall 3"
                        value={formVenue}
                        onChange={(e) => setFormVenue(e.target.value)}
                        className="w-full bg-[#100E1A] border border-white/10 focus:border-purple-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Additional fields depending on type */}
                {(editingCard ? editingCard.type : activeSection) === 'lecture' && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block mb-1">
                      Lecturer Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Prof. Adeleke"
                      value={formLecturer}
                      onChange={(e) => setFormLecturer(e.target.value)}
                      className="w-full bg-[#100E1A] border border-white/10 focus:border-purple-400 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                )}

                {(editingCard ? editingCard.type : activeSection) === 'personal' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block mb-1">
                        Duration (Minutes)
                      </label>
                      <input
                        type="number"
                        min={15}
                        max={300}
                        value={formDurationMinutes}
                        onChange={(e) => setFormDurationMinutes(parseInt(e.target.value) || 60)}
                        className="w-full bg-[#100E1A] border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block mb-1">
                        Study Goal
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Module 3 Past Questions"
                        value={formGoal}
                        onChange={(e) => setFormGoal(e.target.value)}
                        className="w-full bg-[#100E1A] border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {(editingCard ? editingCard.type : activeSection) === 'exam' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block mb-1">
                        Venue
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Multipurpose Hall A"
                        value={formVenue}
                        onChange={(e) => setFormVenue(e.target.value)}
                        className="w-full bg-[#100E1A] border border-white/10 focus:border-red-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block mb-1">
                        Seat Number (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Seat #42"
                        value={formSeatNumber}
                        onChange={(e) => setFormSeatNumber(e.target.value)}
                        className="w-full bg-[#100E1A] border border-white/10 focus:border-red-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      className="w-full bg-[#100E1A] border border-white/10 focus:border-purple-400 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/50 block mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      className="w-full bg-[#100E1A] border border-white/10 focus:border-purple-400 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingCard(null);
                    }}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-bold text-xs uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-3 rounded-xl text-white font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all ${
                      (editingCard ? editingCard.type : activeSection) === 'lecture'
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : (editingCard ? editingCard.type : activeSection) === 'personal'
                        ? 'bg-amber-600 hover:bg-amber-700 text-slate-950 font-black'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {editingCard ? 'Update Schedule' : 'Save to Schedule'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
