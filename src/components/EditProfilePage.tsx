import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Camera, User, Mail, Lock, Shield, Sparkles, 
  RefreshCcw, Check, ChevronDown, Moon, Sun, ShieldAlert, KeyRound, Edit3
} from 'lucide-react';
import { UNIVERSITIES, FACULTIES, DEPARTMENTS } from '../constants/academic';
import { auth } from '../firebase';

export interface EditProfilePageProps {
  isEditingProfile: boolean;
  setIsEditingProfile: (val: boolean) => void;
  user: any;
  currentUserData: any;
  profileFormData?: any;
  setProfileFormData?: React.Dispatch<React.SetStateAction<any>>;
  profileName?: string;
  setProfileName?: (val: string) => void;
  profileDisplayName?: string;
  setProfileDisplayName?: (val: string) => void;
  profileUsername?: string;
  setProfileUsername?: (val: string) => void;
  profileMatric?: string;
  setProfileMatric?: (val: string) => void;
  profileDOB?: string;
  setProfileDOB?: (val: string) => void;
  profileGender?: string;
  setProfileGender?: (val: string) => void;
  profileUniversity?: string;
  setProfileUniversity?: (val: string) => void;
  profileFaculty?: string;
  setProfileFaculty?: (val: string) => void;
  profileDepartment?: string;
  setProfileDepartment?: (val: string) => void;
  profileLevel?: string;
  setProfileLevel?: (val: string) => void;
  profileCountry?: string;
  setProfileCountry?: (val: string) => void;
  theme: 'light' | 'dark';
  setTheme: (val: 'light' | 'dark') => void;
  isSavingProfile?: boolean;
  handleSaveProfile: () => void;
  setIsDeleteAccountOpen: (val: boolean) => void;
  setDeleteConfirmInput: (val: string) => void;
  setUserNotification: (msg: string) => void;
  handleAvatarUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingAvatar?: boolean;
  handleLogout?: () => void;
}

export const EditProfilePage: React.FC<EditProfilePageProps> = ({
  isEditingProfile,
  setIsEditingProfile,
  user,
  currentUserData,
  profileFormData,
  setProfileFormData,
  profileName: propName = '',
  setProfileName: propSetName = () => {},
  profileDisplayName: propDisplayName = '',
  setProfileDisplayName: propSetDisplayName = () => {},
  profileUsername: propUsername = '',
  setProfileUsername: propSetUsername = () => {},
  profileMatric: propMatric = '',
  setProfileMatric: propSetMatric = () => {},
  profileDOB: propDOB = '',
  setProfileDOB: propSetDOB = () => {},
  profileGender: propGender = 'Male',
  setProfileGender: propSetGender = () => {},
  profileUniversity: propUniversity = '',
  setProfileUniversity: propSetUniversity = () => {},
  profileFaculty: propFaculty = '',
  setProfileFaculty: propSetFaculty = () => {},
  profileDepartment: propDepartment = '',
  setProfileDepartment: propSetDepartment = () => {},
  profileLevel: propLevel = '',
  setProfileLevel: propSetLevel = () => {},
  profileCountry: propCountry = 'Nigeria',
  setProfileCountry: propSetCountry = () => {},
  theme,
  setTheme,
  isSavingProfile,
  handleSaveProfile,
  setIsDeleteAccountOpen,
  setDeleteConfirmInput,
  setUserNotification,
  handleAvatarUpload,
  isUploadingAvatar,
  handleLogout = () => {},
}) => {
  const profileName = profileFormData ? (profileFormData.fullName || '') : propName;
  const setProfileName = (val: string) => {
    if (setProfileFormData) setProfileFormData((prev: any) => ({ ...prev, fullName: val }));
    propSetName(val);
  };

  const profileDisplayName = profileFormData ? (profileFormData.displayName || '') : propDisplayName;
  const setProfileDisplayName = (val: string) => {
    if (setProfileFormData) setProfileFormData((prev: any) => ({ ...prev, displayName: val }));
    propSetDisplayName(val);
  };

  const profileUsername = profileFormData ? (profileFormData.username || '') : propUsername;
  const setProfileUsername = (val: string) => {
    if (setProfileFormData) setProfileFormData((prev: any) => ({ ...prev, username: val }));
    propSetUsername(val);
  };

  const profileMatric = profileFormData ? (profileFormData.matricNumber || '') : propMatric;
  const setProfileMatric = (val: string) => {
    if (setProfileFormData) setProfileFormData((prev: any) => ({ ...prev, matricNumber: val, matric: val }));
    propSetMatric(val);
  };

  const profileDOB = profileFormData ? (profileFormData.dob || '') : propDOB;
  const setProfileDOB = (val: string) => {
    if (setProfileFormData) setProfileFormData((prev: any) => ({ ...prev, dob: val }));
    propSetDOB(val);
  };

  const profileGender = profileFormData ? (profileFormData.gender || 'Male') : propGender;
  const setProfileGender = (val: string) => {
    if (setProfileFormData) setProfileFormData((prev: any) => ({ ...prev, gender: val }));
    propSetGender(val);
  };

  const profileUniversity = profileFormData ? (profileFormData.university || '') : propUniversity;
  const setProfileUniversity = (val: string) => {
    if (setProfileFormData) setProfileFormData((prev: any) => ({ ...prev, university: val }));
    propSetUniversity(val);
  };

  const profileFaculty = profileFormData ? (profileFormData.faculty || '') : propFaculty;
  const setProfileFaculty = (val: string) => {
    if (setProfileFormData) setProfileFormData((prev: any) => ({ ...prev, faculty: val }));
    propSetFaculty(val);
  };

  const profileDepartment = profileFormData ? (profileFormData.department || '') : propDepartment;
  const setProfileDepartment = (val: string) => {
    if (setProfileFormData) setProfileFormData((prev: any) => ({ ...prev, department: val }));
    propSetDepartment(val);
  };

  const profileLevel = profileFormData ? (profileFormData.level || '') : propLevel;
  const setProfileLevel = (val: string) => {
    if (setProfileFormData) setProfileFormData((prev: any) => ({ ...prev, level: val }));
    propSetLevel(val);
  };

  const profileCountry = profileFormData ? (profileFormData.country || 'Nigeria') : propCountry;
  const setProfileCountry = (val: string) => {
    if (setProfileFormData) setProfileFormData((prev: any) => ({ ...prev, country: val }));
    propSetCountry(val);
  };
  return (
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
                          if (handleAvatarUpload) {
                            handleAvatarUpload(e);
                          }
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
                    value={profileName || ''} 
                    onChange={(e) => setProfileName(e.target.value)} 
                    placeholder="Full Personal Name"
                    className="w-full bg-[#0E0C16] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white font-medium outline-none focus:border-purple-500/80 transition-all"
                  />
                </div>

                {/* Public Display Name */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-white/60">Public Display Name</label>
                  <input 
                    type="text" 
                    value={profileDisplayName || ''} 
                    onChange={(e) => setProfileDisplayName(e.target.value)} 
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
                      value={profileUsername || ''} 
                      onChange={(e) => setProfileUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} 
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
                    value={user?.email || user?.email || ''} 
                    disabled 
                    placeholder="Email Address"
                    className="w-full bg-[#0E0C16] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white font-medium outline-none focus:border-purple-500/80 transition-all"
                  />
                </div>

                {/* ID / Matriculation Number */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-white/60">ID / Matriculation Number</label>
                  <input 
                    type="text" 
                    value={profileMatric || ''} 
                    onChange={(e) => setProfileMatric(e.target.value)} 
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
                      value={profileDOB || ''} 
                      onChange={(e) => setProfileDOB(e.target.value)} 
                      className="w-full bg-[#0E0C16] border border-white/10 rounded-xl px-3 py-3.5 text-sm text-white font-medium outline-none focus:border-purple-500/80 transition-all"
                    />
                  </div>

                  {/* Country Dropdown */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-semibold text-white/60">Country</label>
                    <div className="relative">
                      <select
                        value={profileCountry || 'Nigeria'}
                        onChange={(e) => setProfileCountry(e.target.value)}
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
                      const selected = (profileGender || 'Male').toLowerCase() === g.toLowerCase();
                      return (
                        <label 
                          key={g} 
                          onClick={() => setProfileGender(g)}
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
                      value={profileUniversity || ''}
                      onChange={(e) => setProfileUniversity(e.target.value)}
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
                        value={profileLevel || ''}
                        onChange={(e) => setProfileLevel(e.target.value)}
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
                        value={profileFaculty || ''}
                        onChange={(e) => {
                          setProfileFaculty(e.target.value);
                          setProfileDepartment('');
                        }}
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
                      value={profileDepartment || ''} 
                      onChange={(e) => setProfileDepartment(e.target.value)} 
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
  );
};
