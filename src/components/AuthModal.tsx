import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, User, ShieldCheck, Mail, Lock, Eye, EyeOff, 
  RefreshCcw, Search, ChevronDown, Check, Phone, Calendar, 
  BookOpen, Layers, Hash, XCircle, Loader2
} from 'lucide-react';
import { UNIVERSITIES, FACULTIES, DEPARTMENTS } from '../constants/academic';
import { OtpVerificationModal } from './OtpVerificationModal';
import { sendOtpEmail } from '../services/authService';

export interface AuthModalProps {
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  user: any;
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  authFullName: string;
  setAuthFullName: (name: string) => void;
  authUsername: string;
  setAuthUsername: (username: string) => void;
  usernameStatus?: any;
  authEmail: string;
  setAuthEmail: (email: string) => void;
  authPassword: string;
  setAuthPassword: (password: string) => void;
  authPhone: string;
  setAuthPhone: (phone: string) => void;
  authGender: string;
  setAuthGender: (gender: string) => void;
  authDOB: string;
  setAuthDOB: (dob: string) => void;
  authUniversity: string;
  setAuthUniversity: (uni: string) => void;
  authFaculty: string;
  setAuthFaculty: (faculty: string) => void;
  authDepartment: string;
  setAuthDepartment: (dept: string) => void;
  authLevel: string;
  setAuthLevel: (level: string) => void;
  authInviteCode: string;
  setAuthInviteCode: (code: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  isAuthLoading: boolean;
  showUniSearchModal: boolean;
  setShowUniSearchModal: (show: boolean) => void;
  uniSearchQuery: string;
  setUniSearchQuery: (query: string) => void;
  handleAuth: (e: React.FormEvent) => void;
  handleGoogleLogin: () => void;
  setUserNotification: (msg: string) => void;
  auth: any;
  sendPasswordResetEmail?: any;
  setLegalPage: (page: 'about' | 'terms' | 'privacy' | 'contact' | null) => void;
  authMatric?: string;
  setAuthMatric?: (val: string) => void;
  setIsAuthLoading?: (val: boolean) => void;
  validationErrors?: Record<string, string>;
  passwordStrength?: { score: number; color: string; feedback: string };
  pendingQuizId?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  showAuthModal,
  setShowAuthModal,
  user,
  authMode,
  setAuthMode,
  authFullName,
  setAuthFullName,
  authUsername,
  setAuthUsername,
  usernameStatus,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authPhone,
  setAuthPhone,
  authGender,
  setAuthGender,
  authDOB,
  setAuthDOB,
  authUniversity,
  setAuthUniversity,
  authFaculty,
  setAuthFaculty,
  authDepartment,
  setAuthDepartment,
  authLevel,
  setAuthLevel,
  authInviteCode,
  setAuthInviteCode,
  showPassword,
  setShowPassword,
  isAuthLoading,
  showUniSearchModal,
  setShowUniSearchModal,
  uniSearchQuery,
  setUniSearchQuery,
  handleAuth,
  handleGoogleLogin,
  setUserNotification,
  auth,
  sendPasswordResetEmail,
  setLegalPage,
  authMatric = '',
  setAuthMatric = () => {},
  setIsAuthLoading = () => {},
  validationErrors = {},
  passwordStrength = { score: 2, color: 'bg-emerald-500', feedback: 'Strong' },
  pendingQuizId = '',
}) => {
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpModalType, setOtpModalType] = useState<'signup' | 'forgot-password' | 'profile-change'>('signup');
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | undefined>(undefined);
  const [isPreparingOtp, setIsPreparingOtp] = useState(false);

  // Intercept sign-up form submit to mandate 6-digit OTP verification via Resend
  const handleAuthSubmitWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    // In Login mode, process directly
    if (authMode === 'login') {
      handleAuth(e);
      return;
    }

    // In Signup mode, validate inputs first
    const cleanEmail = (authEmail || '').toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setUserNotification('Please enter a valid email address.');
      return;
    }
    if (!authPassword || authPassword.length < 6) {
      setUserNotification('Password must be at least 6 characters.');
      return;
    }
    if (!authFullName) {
      setUserNotification('Full Official Name is required.');
      return;
    }
    if (validationErrors && Object.keys(validationErrors).length > 0) {
      setUserNotification('Please address the highlighted form errors before continuing.');
      return;
    }

    setIsPreparingOtp(true);
    try {
      // 1. Dispatch 6-digit OTP to user's email via Resend secure backend relay
      const res = await sendOtpEmail(cleanEmail, 'signup');
      if (res.success && res.expiresAt) {
        setOtpExpiresAt(res.expiresAt);
        setOtpModalType('signup');
        setShowOtpModal(true);
        setUserNotification(`A 6-digit security code has been sent to ${cleanEmail}. Enter it to activate your account.`);
      } else {
        setUserNotification(`Failed to send verification code: ${res.error || 'Check your network connection.'}`);
      }
    } catch (err: any) {
      setUserNotification(`Error sending verification code: ${err.message || err}`);
    } finally {
      setIsPreparingOtp(false);
    }
  };

  // Forgot password OTP flow
  const handleForgotPasswordWithOtp = async () => {
    const cleanEmail = (authEmail || '').toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setUserNotification('Please type your registered email into the Email field first.');
      return;
    }

    setIsPreparingOtp(true);
    try {
      const res = await sendOtpEmail(cleanEmail, 'forgot-password');
      if (res.success && res.expiresAt) {
        setOtpExpiresAt(res.expiresAt);
        setOtpModalType('forgot-password');
        setShowOtpModal(true);
        setUserNotification(`A 6-digit password reset code was sent to ${cleanEmail}.`);
      } else {
        setUserNotification(`Failed to send reset code: ${res.error || 'Check your network connection.'}`);
      }
    } catch (err: any) {
      setUserNotification(`Error sending reset code: ${err.message || err}`);
    } finally {
      setIsPreparingOtp(false);
    }
  };

  // Called when user successfully verifies the 6-digit OTP
  const handleOtpVerified = async (data?: { newPassword?: string; otp?: string }) => {
    setShowOtpModal(false);

    if (otpModalType === 'signup') {
      // Finalize Firebase user registration
      setUserNotification('Code verified! Finalizing account registration...');
      handleAuth({ preventDefault: () => {} } as any);
    } else if (otpModalType === 'forgot-password') {
      // Verified password reset
      try {
        const cleanEmail = (authEmail || '').toLowerCase().trim();
        const { sendPasswordResetEmail } = await import('firebase/auth');
        await sendPasswordResetEmail(auth, cleanEmail);
        setUserNotification('Code verified! A secure password reset link has been confirmed and sent to your email.');
        setAuthMode('login');
      } catch (err: any) {
        setUserNotification(`Password reset notification: ${err.message || err}`);
      }
    }
  };

  return (
    <>
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

              <form onSubmit={handleAuthSubmitWithOtp} className="space-y-4 text-left">
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
                    {usernameStatus && usernameStatus !== 'idle' && (
                      <p className={`text-[8px] font-bold uppercase tracking-wider ml-1 ${usernameStatus === 'available' ? 'text-green-500' : 'text-red-500'}`}>
                        {usernameStatus === 'available' ? 'Username is available' : usernameStatus === 'checking' ? 'Checking username...' : 'Username is already taken'}
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
                        onClick={handleForgotPasswordWithOtp}
                        disabled={isPreparingOtp}
                        className="text-xs font-medium text-orange-400 hover:text-orange-300 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {isPreparingOtp ? 'Sending code...' : 'Forgot password?'}
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
                  disabled={isAuthLoading || isPreparingOtp} 
                  className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl text-sm sm:text-base transition-all shadow-lg shadow-purple-900/30 active:scale-[0.99] flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  {isPreparingOtp ? (
                    <>
                      <RefreshCcw className="animate-spin" size={18} />
                      <span>Sending Security Code...</span>
                    </>
                  ) : isAuthLoading ? (
                    <RefreshCcw className="animate-spin" size={18} />
                  ) : (
                    authMode === 'login' ? 'Continue' : 'Create Account'
                  )}
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

      {/* 6-Digit OTP Verification Modal (Integrated with Resend secure backend relay) */}
      <OtpVerificationModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        email={(authEmail || '').toLowerCase().trim()}
        type={otpModalType}
        initialExpiresAt={otpExpiresAt}
        onSuccess={handleOtpVerified}
        setUserNotification={setUserNotification}
      />
    </>
  );
};
