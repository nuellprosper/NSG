import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, RefreshCcw, X, ArrowRight, CheckCircle2 } from 'lucide-react';

export interface GlobalNotificationOverlayProps {
  userNotification: string | null;
  setUserNotification: (n: string | null) => void;
}

export const GlobalNotificationOverlay: React.FC<GlobalNotificationOverlayProps> = ({
  userNotification,
  setUserNotification,
}) => {
  return (
    <AnimatePresence>
      {userNotification && (
        <>
          {/* Centered Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setUserNotification(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[2000]"
          />
          {/* Centered Purple & White Notification Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2001] w-[90%] max-w-sm"
          >
            <div className="bg-[#171522] border border-purple-500/30 p-6 rounded-3xl shadow-[0_0_40px_rgba(147,51,234,0.3)] text-left overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.18),transparent_60%)] pointer-events-none" />

              <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/40 p-0.5 flex items-center justify-center shadow-xl shadow-purple-600/10 text-purple-400">
                  <Bell size={24} />
                </div>

                <div className="space-y-1.5 w-full">
                  <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Notification</h4>
                  <p className="text-sm font-semibold text-white leading-relaxed font-sans px-2">
                    {userNotification}
                  </p>
                </div>

                <button
                  onClick={() => setUserNotification(null)}
                  className="w-full py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25 active:scale-95 transition-all cursor-pointer"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export interface AudioTranscribingOverlayProps {
  audioTranscribingPopup: boolean;
  setAudioTranscribingPopup: (v: boolean) => void;
  setActiveTab: (tab: string) => void;
  setToolsSubTab: (subTab: string) => void;
  userNotes: any[];
  activeAudioNoteId: string | null;
  setSelectedNote: (note: any) => void;
}

export const AudioTranscribingOverlay: React.FC<AudioTranscribingOverlayProps> = ({
  audioTranscribingPopup,
  setAudioTranscribingPopup,
  setActiveTab,
  setToolsSubTab,
  userNotes,
  activeAudioNoteId,
  setSelectedNote,
}) => {
  return (
    <AnimatePresence>
      {audioTranscribingPopup && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[2002] max-w-sm bg-[#171522] border border-purple-500/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(147,51,234,0.3)] flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-400">
            <RefreshCcw size={18} className="animate-spin" />
          </div>
          <div className="space-y-1 flex-1 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                Transcribing Audio
              </span>
              <button
                onClick={() => setAudioTranscribingPopup(false)}
                className="text-white/40 hover:text-white cursor-pointer p-1"
                title="Dismiss Popup"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-xs font-bold text-white leading-tight">Audio is being transcribed into a study note!</p>
            <p className="text-[10px] text-white/70 leading-relaxed font-sans">
              ⚠️ Please do not reload or leave the app while processing audio, regardless of length. Your note is being written live in the background.
            </p>
            <button
              onClick={() => {
                setActiveTab('tools');
                setToolsSubTab('notebook');
                if (userNotes) {
                  const transNote = userNotes.find(
                    (n: any) => n.id === activeAudioNoteId || n.isTranscribing
                  );
                  if (transNote) setSelectedNote(transNote);
                }
                setAudioTranscribingPopup(false);
              }}
              className="mt-2.5 w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/20"
            >
              <span>Go to Note Page</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export interface AudioUploadOverlayProps {
  audioUploadState: {
    isUploading: boolean;
    isSuccess: boolean;
    progress: number;
    fileName: string;
  };
}

export const AudioUploadOverlay: React.FC<AudioUploadOverlayProps> = ({
  audioUploadState,
}) => {
  return (
    <AnimatePresence>
      {audioUploadState.isUploading && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[2005] max-w-sm w-full bg-[#171522] border border-purple-500/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(147,51,234,0.3)] flex items-start gap-3.5"
        >
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
              audioUploadState.isSuccess
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-purple-600/20 border-purple-500/40 text-purple-400'
            }`}
          >
            {audioUploadState.isSuccess ? (
              <CheckCircle2 size={20} className="text-emerald-400" />
            ) : (
              <RefreshCcw size={18} className="animate-spin text-purple-400" />
            )}
          </div>
          <div className="space-y-2 flex-1 text-left">
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  audioUploadState.isSuccess ? 'text-emerald-400' : 'text-purple-400'
                }`}
              >
                {!audioUploadState.isSuccess && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                )}
                {audioUploadState.isSuccess ? 'Uploaded Successfully' : 'Uploading'}
              </span>
              <span className="text-[10px] font-mono font-bold text-white/70">
                {audioUploadState.progress}%
              </span>
            </div>
            <p className="text-xs font-bold text-white truncate max-w-[220px]" title={audioUploadState.fileName}>
              {audioUploadState.fileName || 'Processing audio file...'}
            </p>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  audioUploadState.isSuccess ? 'bg-emerald-500' : 'bg-purple-600'
                }`}
                style={{ width: `${audioUploadState.progress}%` }}
              />
            </div>
            <p className="text-[9px] text-white/60 font-sans">
              {audioUploadState.isSuccess
                ? 'Upload complete! Starting transcript...'
                : `Uploading audio (${audioUploadState.progress}%)...`}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
