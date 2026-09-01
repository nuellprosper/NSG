import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, LayoutDashboard, Eye, Edit3, HelpCircle, X, CheckCircle2, 
  Trash2, RefreshCcw, Sparkles, BookOpen, Clock, AlertTriangle, 
  Download, FileDown, PlusCircle, Check, Play, Pause, ChevronRight,
  ShieldCheck, Share2, Copy, Send, Zap, ListChecks, Users, Award, 
  ArrowLeft, Lock, Unlock, Plus
} from 'lucide-react';
import { ExamConfig, RegisteredStudent, StudentResult, ExamQuestion } from '../utils';

export interface HostExamPanelProps {
  adminMode: boolean;
  setAdminMode: (val: boolean) => void;
  theme: 'light' | 'dark';
  user: any;
  currentUserData: any;
  isPremium?: boolean;
  examConfig?: ExamConfig | any;
  setExamConfig?: React.Dispatch<React.SetStateAction<any>>;
  examCode?: string;
  setExamCode?: (val: string) => void;
  examStatus?: 'idle' | 'active' | 'completed';
  setExamStatus?: (val: 'idle' | 'active' | 'completed') => void;
  scoreSheet?: any[];
  registeredStudents?: any[];
  setRegisteredStudents?: React.Dispatch<React.SetStateAction<any[]>>;
  activeExamSubject?: string;
  setActiveExamSubject?: (sub: string) => void;
  isSettingExamQuestions?: boolean;
  setIsSettingExamQuestions?: (val: boolean) => void;
  isQuestionsLocked?: boolean;
  setIsQuestionsLocked?: (val: boolean) => void;
  showExamSidebar?: boolean;
  setShowExamSidebar?: (val: boolean) => void;
  showHostHelpModal?: boolean;
  setShowHostHelpModal?: (val: boolean) => void;
  adminNewSubject?: string;
  setAdminNewSubject?: (val: string) => void;
  adminNewSubjectCount?: number;
  setAdminNewSubjectCount?: (val: number) => void;
  adminSittingCount?: number;
  setAdminSittingCount?: (val: number) => void;
  adminBatchStudents?: string;
  setAdminBatchStudents?: (val: string) => void;
  adminBatchText?: string;
  setAdminBatchText?: (val: string) => void;
  adminPromptInput?: string;
  setAdminPromptInput?: (val: string) => void;
  adminContextInput?: string;
  setAdminContextInput?: (val: string) => void;
  isGeneratingAdminQuestions?: boolean;
  isSavingHostedExam?: boolean;
  isAuthLoading?: boolean;
  handleSaveHostedExam?: () => void;
  handleToggleExamState?: () => void;
  deleteHostedExam?: () => void;
  downloadExamScorecard?: () => void;
  downloadScoreSheetAsTxt?: () => void;
  generateAdminQuestions?: () => void;
  parseAndImportBatchQuestions?: (subName: string, text: string) => void;
  saveStudentRegistryToFirebase?: (students: any[]) => void;
  setUserNotification: (msg: string) => void;
  setConfirmModal?: (modal: any) => void;
  setShowShareModal?: (val: boolean) => void;
  copyToClipboard?: (text: string, label?: string) => void;
  [key: string]: any;
}

export const HostExamPanel: React.FC<any> = ({

  adminMode,
  setAdminMode,
  theme,
  user,
  currentUserData,
  isPremium,
  examConfig,
  setExamConfig,
  examCode,
  setExamCode,
  examStatus,
  setExamStatus,
  scoreSheet = [],
  registeredStudents = [],
  setExamConfigs,
  activeExamSubject,
  setActiveExamSubject,
  isSettingExamQuestions,
  setIsSettingExamQuestions,
  isQuestionsLocked,
  setIsQuestionsLocked,
  showExamSidebar,
  setShowExamSidebar,
  showHostHelpModal,
  setShowHostHelpModal,
  adminNewSubject,
  setAdminNewSubject,
  adminNewSubjectCount,
  setAdminNewSubjectCount,
  adminSittingCount,
  setAdminSittingCount,
  adminBatchStudents,
  setAdminBatchStudents,
  adminBatchText,
  setAdminBatchText,
  adminPromptInput,
  setAdminPromptInput,
  adminContextInput,
  setAdminContextInput,
  isGeneratingAdminQuestions,
  isSavingHostedExam,
  isAuthLoading,
  handleSaveHostedExam,
  handleToggleExamState,
  deleteHostedExam,
  downloadExamScorecard,
  downloadScoreSheetAsTxt,
  generateAdminQuestions,
  parseAndImportBatchQuestions,
  saveStudentRegistryToFirebase,
  setUserNotification,
  setConfirmModal,
  setShowShareModal,
  copyToClipboard,
}) => {
  const [activeHostTab, setActiveHostTab] = useState<'config' | 'questions' | 'students' | 'scores'>('config');

  if (!adminMode) return null;

  const currentQuestions: ExamQuestion[] = (examConfig.questions && examConfig.questions[activeExamSubject]) || [];

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }}
        className={`fixed inset-0 z-[110] p-2 sm:p-6 overflow-y-auto ${theme === 'dark' ? 'bg-[#13111C]/96' : 'bg-slate-50'} backdrop-blur-xl`}
      >
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-32">
          
          {/* Top Control Header */}
          <div className={`p-4 sm:p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#181524] border-white/10' : 'bg-white border-slate-200'} shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4 sticky top-0 z-50`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#DC2626] rounded-xl flex items-center justify-center shadow-lg shadow-[#DC2626]/20">
                <LayoutDashboard size={20} className="text-white" />
              </div>
              <div>
                <h1 className={`text-lg sm:text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase tracking-tight`}>Host Exam Control Room</h1>
                <p className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>Professional Examination Pool</p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
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
                onClick={handleSaveHostedExam} 
                disabled={isSavingHostedExam}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase shadow-md transition-colors"
              >
                {isSavingHostedExam ? 'Saving...' : 'Save Progress'}
              </button>

              <button 
                onClick={() => setAdminMode(false)} 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${theme === 'dark' ? 'bg-white/5 text-white/40 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}
              >
                <ArrowLeft size={16} /> BACK
              </button>
            </div>
          </div>

          {/* Exam Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'config', label: 'Exam Setup', icon: ShieldCheck },
              { id: 'questions', label: 'Questions Pool', icon: ListChecks },
              { id: 'students', label: 'Registered Students', icon: Users },
              { id: 'scores', label: 'Live Scoresheet', icon: Award },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeHostTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveHostTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    isActive 
                      ? 'bg-[#DC2626] text-white shadow-lg shadow-[#DC2626]/20' 
                      : `${theme === 'dark' ? 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: EXAM SETUP & CONFIG */}
          {activeHostTab === 'config' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Exam Details Card */}
              <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#181524] border-white/10' : 'bg-white border-slate-200'} space-y-4`}>
                <h3 className={`text-base font-black uppercase tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Exam Identification</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Exam Title / Name</label>
                    <input 
                      type="text" 
                      value={examConfig.title || ''} 
                      onChange={(e) => setExamConfig(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Mid-Term General Physics Exam"
                      className={`w-full px-4 py-3 rounded-2xl border text-sm outline-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Exam Access Code</label>
                      <input 
                        type="text" 
                        value={examCode} 
                        onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                        placeholder="EXAM123"
                        className={`w-full px-4 py-3 rounded-2xl border text-sm font-mono font-bold outline-none uppercase ${theme === 'dark' ? 'bg-white/5 border-white/10 text-amber-400' : 'bg-slate-50 border-slate-200 text-amber-600'}`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Time Limit (Minutes)</label>
                      <input 
                        type="number" 
                        value={examConfig.durationMinutes || 30} 
                        onChange={(e) => setExamConfig(prev => ({ ...prev, durationMinutes: Number(e.target.value) || 30 }))}
                        className={`w-full px-4 py-3 rounded-2xl border text-sm font-bold outline-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block mb-1">Instructions / Description</label>
                    <textarea 
                      value={examConfig.instructions || ''} 
                      onChange={(e) => setExamConfig(prev => ({ ...prev, instructions: e.target.value }))}
                      rows={3}
                      placeholder="Special instructions for students taking this exam..."
                      className={`w-full px-4 py-3 rounded-2xl border text-sm outline-none resize-none ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Status & Live Actions Card */}
              <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#181524] border-white/10' : 'bg-white border-slate-200'} flex flex-col justify-between space-y-6`}>
                <div className="space-y-4">
                  <h3 className={`text-base font-black uppercase tracking-wide ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Live Examination Status</h3>
                  
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className={`w-4 h-4 rounded-full ${examStatus === 'active' ? 'bg-green-500 animate-pulse' : examStatus === 'completed' ? 'bg-amber-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-xs font-black uppercase text-white tracking-wider">
                        Status: <span className={examStatus === 'active' ? 'text-green-400' : examStatus === 'completed' ? 'text-amber-400' : 'text-red-400'}>{examStatus.toUpperCase()}</span>
                      </p>
                      <p className="text-[10px] text-white/50">{examStatus === 'active' ? 'Students can join and submit now' : 'Exam is currently offline / paused'}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleToggleExamState}
                      className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                        examStatus === 'active'
                          ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                          : 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/30'
                      }`}
                    >
                      {examStatus === 'active' ? <Pause size={16} /> : <Play size={16} />}
                      <span>{examStatus === 'active' ? 'PAUSE EXAM' : 'START / ACTIVATE EXAM'}</span>
                    </button>

                    {copyToClipboard && (
                      <button
                        onClick={() => copyToClipboard(`https://nsg.app?examCode=${examCode}`, "Exam link copied!")}
                        className="px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                        title="Copy Exam URL"
                      >
                        <Copy size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <button
                    onClick={deleteHostedExam}
                    className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} /> Delete Exam Pool
                  </button>
                  <span className="text-[10px] font-mono text-white/40">Secure Firestore Engine</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUESTIONS POOL */}
          {activeHostTab === 'questions' && (
            <div className="space-y-6">
              {/* Subject Tabs */}
              <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#181524] border-white/10' : 'bg-white border-slate-200'} flex items-center justify-between gap-4 flex-wrap`}>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {Object.keys(examConfig.questions || {}).map(sub => (
                    <button
                      key={sub}
                      onClick={() => setActiveExamSubject(sub)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        activeExamSubject === sub 
                          ? 'bg-[#DC2626] text-white shadow-md' 
                          : 'bg-white/5 text-white/50 hover:text-white'
                      }`}
                    >
                      {sub} ({examConfig.questions[sub]?.length || 0})
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={adminNewSubject} 
                    onChange={(e) => setAdminNewSubject(e.target.value)}
                    placeholder="New Subject name..."
                    className="px-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-white outline-none"
                  />
                  <button
                    onClick={() => {
                      if (!adminNewSubject.trim()) return;
                      const sub = adminNewSubject.trim();
                      setExamConfig(prev => ({
                        ...prev,
                        questions: { ...prev.questions, [sub]: prev.questions?.[sub] || [] }
                      }));
                      setActiveExamSubject(sub);
                      setAdminNewSubject('');
                      setUserNotification(`Subject "${sub}" added!`);
                    }}
                    className="px-3 py-1.5 bg-[#DC2626] text-white text-xs font-bold rounded-xl hover:bg-red-500 transition-all cursor-pointer"
                  >
                    + Add Subject
                  </button>
                </div>
              </div>

              {/* AI Generator & Batch Parser */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Generator */}
                <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#181524] border-white/10' : 'bg-white border-slate-200'} space-y-4`}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-amber-400" size={18} />
                    <h3 className="text-sm font-black uppercase tracking-wide text-white">AI Question Generator</h3>
                  </div>
                  <input 
                    type="text" 
                    value={adminPromptInput} 
                    onChange={(e) => setAdminPromptInput(e.target.value)}
                    placeholder="Topic (e.g. Quantum Mechanics, Nigerian History...)"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none"
                  />
                  <textarea 
                    value={adminContextInput} 
                    onChange={(e) => setAdminContextInput(e.target.value)}
                    rows={3}
                    placeholder="Optional reference notes or syllabus context..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none resize-none"
                  />
                  <button
                    onClick={generateAdminQuestions}
                    disabled={isGeneratingAdminQuestions || !adminPromptInput.trim()}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
                  >
                    <Sparkles size={16} />
                    <span>{isGeneratingAdminQuestions ? 'Generating Questions...' : 'Generate with Omni AI'}</span>
                  </button>
                </div>

                {/* Batch Text Importer */}
                <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#181524] border-white/10' : 'bg-white border-slate-200'} space-y-4`}>
                  <div className="flex items-center gap-2">
                    <FileDown className="text-blue-400" size={18} />
                    <h3 className="text-sm font-black uppercase tracking-wide text-white">Batch Text Parser</h3>
                  </div>
                  <textarea 
                    value={adminBatchText} 
                    onChange={(e) => setAdminBatchText(e.target.value)}
                    rows={5}
                    placeholder="Paste questions here:&#10;What is 2+2? [A) 2 B) 3 *C) 4 D) 5] (Basic math)"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white outline-none resize-none"
                  />
                  <button
                    onClick={() => {
                      if (!adminBatchText.trim()) return;
                      parseAndImportBatchQuestions(activeExamSubject, adminBatchText);
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all"
                  >
                    <CheckCircle2 size={16} />
                    <span>Import Batch to {activeExamSubject}</span>
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#181524] border-white/10' : 'bg-white border-slate-200'} space-y-4`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wide text-white">
                    {activeExamSubject} Questions ({currentQuestions.length})
                  </h3>
                  <button
                    onClick={() => {
                      const newQ: ExamQuestion = {
                        id: `q_${Date.now()}`,
                        question: 'New Question text here',
                        options: ['Option A', 'Option B', 'Option C', 'Option D'],
                        correctAnswer: 0,
                        explanation: 'Review explanation',
                      };
                      setExamConfig(prev => ({
                        ...prev,
                        questions: {
                          ...prev.questions,
                          [activeExamSubject]: [...(prev.questions?.[activeExamSubject] || []), newQ]
                        }
                      }));
                    }}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-500 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add Single Question
                  </button>
                </div>

                {currentQuestions.length === 0 ? (
                  <div className="text-center py-12 text-white/40 text-xs">
                    No questions added for {activeExamSubject} yet. Use AI generator or Batch parser above.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentQuestions.map((q, idx) => (
                      <div key={q.id || idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-white">
                            <span className="text-[#DC2626] font-black mr-1.5">Q{idx + 1}.</span>
                            {q.question}
                          </p>
                          <button
                            onClick={() => {
                              setExamConfig(prev => ({
                                ...prev,
                                questions: {
                                  ...prev.questions,
                                  [activeExamSubject]: prev.questions[activeExamSubject].filter((_, i) => i !== idx)
                                }
                              }));
                            }}
                            className="text-red-400 hover:text-red-300 transition-colors p-1"
                            title="Remove Question"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                          {q.options?.map((opt, oIdx) => (
                            <div 
                              key={oIdx}
                              className={`text-[11px] px-3 py-1.5 rounded-lg border ${
                                oIdx === q.correctAnswer 
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold' 
                                  : 'bg-white/5 border-white/5 text-white/60'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}) {opt}
                            </div>
                          ))}
                        </div>
                        {q.explanation && (
                          <p className="text-[10px] text-amber-400/80 italic pl-4">
                            Review: {q.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: REGISTERED STUDENTS */}
          {activeHostTab === 'students' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Batch Student Enroller */}
              <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#181524] border-white/10' : 'bg-white border-slate-200'} space-y-4 md:col-span-1`}>
                <h3 className="text-sm font-black uppercase tracking-wide text-white">Batch Student Registry</h3>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Enter student matric numbers or names (one per line) to authorize access.
                </p>
                <textarea 
                  value={adminBatchStudents} 
                  onChange={(e) => setAdminBatchStudents(e.target.value)}
                  rows={8}
                  placeholder="NSG/2026/001 - Kelechi E.&#10;NSG/2026/002 - Sarah J."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white outline-none resize-none"
                />
                <button
                  onClick={() => {
                    if (!adminBatchStudents.trim()) return;
                    const lines = adminBatchStudents.split('\n').map(l => l.trim()).filter(Boolean);
                    const newStudents: any[] = lines.map(line => ({
                      id: `std_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                      identifier: line,
                      registeredAt: new Date().toISOString(),
                    }));
                    const updated = [...registeredStudents, ...newStudents];
                    setExamConfigs(updated);
                    saveStudentRegistryToFirebase(updated);
                    setAdminBatchStudents('');
                    setUserNotification(`Added ${newStudents.length} students to registry!`);
                  }}
                  className="w-full py-3 bg-[#DC2626] hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer"
                >
                  Save & Authorize Students
                </button>
              </div>

              {/* Student List */}
              <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#181524] border-white/10' : 'bg-white border-slate-200'} space-y-4 md:col-span-2`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-wide text-white">
                    Registered Students ({registeredStudents.length})
                  </h3>
                  {registeredStudents.length > 0 && (
                    <button
                      onClick={() => {
                        setExamConfigs([]);
                        saveStudentRegistryToFirebase([]);
                        setUserNotification("Cleared student registry.");
                      }}
                      className="text-red-400 hover:text-red-300 text-xs font-bold"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {registeredStudents.length === 0 ? (
                  <div className="text-center py-12 text-white/40 text-xs">
                    No students registered yet. Students can also be auto-registered when they join.
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {registeredStudents.map((std, i) => (
                      <div key={std.id || i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-mono text-white/60">{i + 1}</span>
                          <span className="font-bold text-white">{std.identifier || std.name || std.id}</span>
                        </div>
                        <button
                          onClick={() => {
                            const updated = registeredStudents.filter((_, idx) => idx !== i);
                            setExamConfigs(updated);
                            saveStudentRegistryToFirebase(updated);
                          }}
                          className="text-white/30 hover:text-red-400 p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: LIVE SCORESHEET */}
          {activeHostTab === 'scores' && (
            <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-[#181524] border-white/10' : 'bg-white border-slate-200'} space-y-6`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-base font-black uppercase tracking-wide text-white">Live Exam Scoreboard</h3>
                  <p className="text-xs text-white/50">Real-time student submissions & scoring</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadExamScorecard}
                    className="px-4 py-2 bg-[#DC2626] hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Download size={14} /> Scorecard PNG
                  </button>
                  <button
                    onClick={downloadScoreSheetAsTxt}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileDown size={14} /> Export TXT
                  </button>
                </div>
              </div>

              {scoreSheet.length === 0 ? (
                <div className="text-center py-16 text-white/40 text-xs space-y-2">
                  <Award size={32} className="mx-auto text-white/20" />
                  <p>No student submissions recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40 uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Score</th>
                        <th className="py-3 px-4">Percentage</th>
                        <th className="py-3 px-4">Time Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {scoreSheet.map((res, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#DC2626]">#{i + 1}</td>
                          <td className="py-3 px-4 font-bold text-white">{res.studentName || res.studentId || 'Anonymous'}</td>
                          <td className="py-3 px-4 font-mono text-emerald-400 font-bold">{res.score} / {res.totalQuestions || examConfig.questions?.length || 0}</td>
                          <td className="py-3 px-4 font-bold text-amber-400">{res.percentage ? `${res.percentage.toFixed(1)}%` : '-'}</td>
                          <td className="py-3 px-4 text-white/40 font-mono text-[10px]">{res.submittedAt ? new Date(res.submittedAt).toLocaleTimeString() : 'Just now'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Host Help Modal */}
        <AnimatePresence>
          {showHostHelpModal && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`max-w-2xl w-full p-6 sm:p-8 rounded-3xl border ${theme === 'dark' ? 'bg-[#181524] border-white/10' : 'bg-white border-slate-200'} max-h-[85vh] overflow-y-auto custom-scrollbar space-y-4 text-white`}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h2 className="text-lg font-black uppercase tracking-tight text-[#DC2626]">NSG Exam Hosting Guide</h2>
                  <button onClick={() => setShowHostHelpModal(false)} className="text-white/40 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-3 text-xs leading-relaxed text-white/80">
                  <p><strong>1. Setting Questions:</strong> Use the Questions Pool tab to add subjects and generate questions with Omni AI or paste in batch format.</p>
                  <p><strong>2. Format Guide:</strong> Question text on first line, followed by bracketed options [A) ... B) ... *C) ... D) ...] with an asterisk on the correct answer, and explanation in parentheses.</p>
                  <p><strong>3. Starting Live Exam:</strong> Set the Exam Code, click "Start Exam" in the Setup tab, and share the code or URL with your students.</p>
                  <p><strong>4. Scores & Leaderboard:</strong> Live submissions will appear immediately under the Live Scoresheet tab with instant ranking and scorecard exports.</p>
                </div>
                <button
                  onClick={() => setShowHostHelpModal(false)}
                  className="w-full py-3 bg-[#DC2626] text-white rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Got It!
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </AnimatePresence>
  );
};
