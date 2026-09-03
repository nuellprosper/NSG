import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Clock, RefreshCw, X, Lock, Eye, EyeOff, 
  CheckCircle2, AlertCircle, ArrowLeft, Mail, KeyRound
} from 'lucide-react';
import { sendOtpEmail, verifyOTP, OTP_EXPIRATION_WINDOW_MS } from '../services/authService';

export interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  type: 'signup' | 'forgot-password' | 'profile-change';
  initialExpiresAt?: number;
  onSuccess: (data?: { newPassword?: string; otp?: string }) => Promise<void> | void;
  setUserNotification?: (msg: string) => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  type,
  initialExpiresAt,
  onSuccess,
  setUserNotification = () => {},
}) => {
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [expiresAt, setExpiresAt] = useState<number>(initialExpiresAt || (Date.now() + OTP_EXPIRATION_WINDOW_MS));
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sync expiration timestamp when props change
  useEffect(() => {
    if (initialExpiresAt) {
      setExpiresAt(initialExpiresAt);
    } else {
      setExpiresAt(Date.now() + OTP_EXPIRATION_WINDOW_MS);
    }
  }, [initialExpiresAt, isOpen]);

  // Live 5-minute countdown timer
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0 && !errorMessage) {
        setErrorMessage('OTP Expired. Please tap "Resend Code" to get a fresh 6-digit code.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, expiresAt, errorMessage]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage('');
    try {
      const result = await sendOtpEmail(email, type);
      if (result.success && result.expiresAt) {
        setExpiresAt(result.expiresAt);
        setSecondsRemaining(300);
        setOtpCode('');
        setResendCooldown(30);
        setUserNotification('A fresh 6-digit verification code has been dispatched to your email.');
      } else {
        setErrorMessage(result.error || 'Failed to resend verification code. Please check your network.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with email relay service.');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (otpCode.trim().length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    // Password requirements for reset/change
    if (type === 'forgot-password' || type === 'profile-change') {
      if (!newPassword || newPassword.length < 6) {
        setErrorMessage('Your new password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please re-enter your password.');
        return;
      }
    }

    setIsVerifying(true);
    try {
      // 1. Verify code and 5-minute expiration timestamp
      const result = await verifyOTP(email, otpCode, type);

      if (!result.valid) {
        setErrorMessage(result.error || 'Verification failed. Please check your code.');
        setIsVerifying(false);
        return;
      }

      // 2. Verified successfully! Trigger success callback
      await onSuccess({
        newPassword: (type === 'forgot-password' || type === 'profile-change') ? newPassword : undefined,
        otp: otpCode.trim()
      });
    } catch (err: any) {
      console.error('[OtpModal] Verification error:', err);
      setErrorMessage(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const getCopy = () => {
    switch (type) {
      case 'forgot-password':
        return {
          title: 'Reset Password',
          subtitle: 'Verify your identity to choose a new password.',
          buttonText: 'Verify & Reset Password'
        };
      case 'profile-change':
        return {
          title: 'Authorize Password Change',
          subtitle: 'Enter the code to update your account password securely.',
          buttonText: 'Verify & Update Password'
        };
      case 'signup':
      default:
        return {
          title: 'Verify Your Email',
          subtitle: 'Enter the 6-digit code to activate your NSG account.',
          buttonText: 'Verify & Complete Registration'
        };
    }
  };

  const copy = getCopy();
  const isExpired = secondsRemaining === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] overflow-y-auto bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="w-full max-w-md bg-[#11141E] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-left"
          >
            {/* Top Bar with Back/Close */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck size={12} />
                <span>Resend Verified</span>
              </div>
            </div>

            {/* Header Icon & Title */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 mb-3">
                <KeyRound size={28} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {copy.title}
              </h2>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto leading-relaxed">
                {copy.subtitle}
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 font-medium">
                <Mail size={13} className="text-purple-400 shrink-0" />
                <span className="truncate max-w-[240px]">{email}</span>
              </div>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-300 text-xs">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              {/* 6-Digit Code Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-200">
                    Enter 6-Digit Code
                  </label>
                  <div className={`flex items-center gap-1 text-xs font-mono font-bold ${
                    isExpired ? 'text-red-400 animate-pulse' : secondsRemaining < 60 ? 'text-amber-400' : 'text-purple-400'
                  }`}>
                    <Clock size={12} />
                    <span>{formatTime(secondsRemaining)}</span>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpCode(val);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="••••••"
                    autoFocus
                    required
                    className="w-full bg-[#090B10] border-2 border-white/10 focus:border-purple-500 rounded-2xl py-3.5 px-4 text-center text-2xl sm:text-3xl font-mono font-black tracking-[0.4em] text-white placeholder-gray-600 outline-none transition-all shadow-inner"
                  />
                </div>
                <p className="text-[10px] text-white/40 text-center">
                  Verification codes expire strictly after 5 minutes
                </p>
              </div>

              {/* Additional Password fields for Reset / Profile Change */}
              {(type === 'forgot-password' || type === 'profile-change') && (
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-200 block">
                      New Password
                    </label>
                    <div className="bg-[#090B10] border border-white/10 rounded-2xl px-4 py-3 flex items-center focus-within:border-purple-500 transition-all">
                      <Lock size={16} className="text-purple-400 mr-2.5 shrink-0" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-gray-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-white transition-colors ml-2 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-200 block">
                      Confirm New Password
                    </label>
                    <div className="bg-[#090B10] border border-white/10 rounded-2xl px-4 py-3 flex items-center focus-within:border-purple-500 transition-all">
                      <Lock size={16} className="text-purple-400 mr-2.5 shrink-0" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                        className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-gray-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isVerifying || otpCode.length !== 6}
                className="w-full mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-xs sm:text-sm transition-all shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>{copy.buttonText}</span>
                  </>
                )}
              </button>
            </form>

            {/* Resend Section */}
            <div className="mt-5 pt-4 border-t border-white/5 text-center flex items-center justify-between text-xs text-gray-400">
              <span>Didn't receive the email?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || resendCooldown > 0}
                className="font-bold text-orange-400 hover:text-orange-300 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1"
              >
                <RefreshCw size={13} className={isResending ? 'animate-spin' : ''} />
                <span>
                  {isResending
                    ? 'Sending...'
                    : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend Code'}
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
