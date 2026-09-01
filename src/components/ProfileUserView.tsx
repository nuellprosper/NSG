import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Settings, User, Edit3, Shield, Flame, BookOpen, Zap, 
  Award, Trophy, Info, Mail, LogOut, CheckCircle2, ChevronRight, 
  ExternalLink, Sparkles, GraduationCap, HelpCircle, ShieldCheck
} from 'lucide-react';
import { getUserRank, getScholarTierInfo } from '../utils';
import { WhatsAppIcon } from '../subComponents';

export interface ProfileUserViewProps {
  user: any;
  currentUserData: any;
  theme: 'light' | 'dark';
  profileSubTab?: any;
  setProfileSubTab?: (tab: any) => void;
  setActiveTab: (tab: any) => void;
  isEditingProfile?: boolean;
  setIsEditingProfile: (val: boolean) => void;
  setIsDeleteAccountOpen: (val: boolean) => void;
  setDeleteConfirmInput: (val: string) => void;
  setShowPremiumModal: (val: boolean) => void;
  setShowAboutUsModal: (val: boolean) => void;
  setShowContactUsModal: (val: boolean) => void;
  setShowInviteModal: (val: boolean) => void;
  setShowGodMode: (val: boolean) => void;
  handleLogout: () => void;
  handleProfileTouchStart?: (e: React.TouchEvent) => void;
  handleProfileTouchMove?: (e: React.TouchEvent) => void;
  handleProfileTouchEnd?: () => void;
  userStats?: {
    streak?: number;
    quizzesTaken?: number;
    notesCount?: number;
    coursesCount?: number;
  };
  finishedHistory?: any[];
  isPremium?: boolean;
}

export const ProfileUserView: React.FC<ProfileUserViewProps> = ({
  user,
  currentUserData,
  theme,
  profileSubTab = 'stats',
  setProfileSubTab = () => {},
  setActiveTab,
  setIsEditingProfile,
  setIsDeleteAccountOpen,
  setDeleteConfirmInput,
  setShowPremiumModal,
  setShowAboutUsModal,
  setShowContactUsModal,
  setShowInviteModal,
  setShowGodMode,
  handleLogout,
  handleProfileTouchStart,
  handleProfileTouchMove,
  handleProfileTouchEnd,
  userStats = {
    streak: currentUserData?.streak || 0,
    quizzesTaken: currentUserData?.quizzesTaken || 0,
    notesCount: currentUserData?.notesCount || 0,
    coursesCount: currentUserData?.coursesCount || 0,
  },
  finishedHistory = [],
  isPremium = false,
}) => {
  return (

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
                              ((...args: any[]) => {})('cgpa');
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
                      <p className="text-2xl font-bold text-white mt-1">{[]?.length || 0}</p>
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
                          value={""}
                          onChange={(e) => ((...args: any[]) => {})(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-8 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-green-500 font-mono transition-colors"
                        />
                      </div>
                      <button
                        onClick={((...args: any[]) => {})}
                        disabled={false}
                        className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/10 active:scale-95 shrink-0"
                      >
                        {false ? "Syncing..." : "SAVE & SYNC LINE"}
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
  );
};
