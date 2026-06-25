import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, Mic, MicOff, VideoOff, PhoneOff, 
  Users, MessageSquare, Monitor, Share2, 
  Layout, Type, Image as ImageIcon, FileAudio,
  ChevronRight, ArrowLeft, Send, Sparkles, Shield, Plus,
  X, User, Clipboard, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, doc, onSnapshot, updateDoc, 
  setDoc, serverTimestamp, getDoc, arrayUnion, addDoc, query, orderBy, where, getDocs, limit
} from 'firebase/firestore';
import { db, handleFirestoreError, FirestoreOperation } from '../firebase';

interface ClassRoomProps {
  theme: 'dark' | 'light';
  user: any;
  userHandle: string;
  isHost: boolean;
  classId: string;
  onExit: () => void;
  uploadToCloudinary: (file: File | Blob) => Promise<string>;
  setUserNotification: (msg: string) => void;
}

export const ClassRoom: React.FC<ClassRoomProps> = ({ 
  theme, user, userHandle, isHost, classId, onExit, uploadToCloudinary, setUserNotification 
}) => {
  const [classData, setClassData] = useState<any>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [boardText, setBoardText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  // Peer Invitations
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteHandle, setInviteHandle] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!classId) return;

    const unsubscribe = onSnapshot(doc(db, 'classes', classId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setClassData(data);
        setBoardText(data.boardText || '');
        setParticipants(data.participants || []);
      }
    }, (err) => handleFirestoreError(err, FirestoreOperation.GET, `classes/${classId}`));

    // Listen for messages
    const q = query(collection(db, 'classes', classId, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
    }, (err) => handleFirestoreError(err, FirestoreOperation.LIST, `classes/${classId}/messages`));

    return () => {
      unsubscribe();
      unsubscribeMessages();
    };
  }, [classId]);

  useEffect(() => {
    if (isCamOn) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isCamOn]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera access failed:", err);
      setIsCamOn(false);
    }
  };

  const stopCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleBoardChange = async (newText: string) => {
    if (!isHost) return;
    setBoardText(newText);
    try {
      await updateDoc(doc(db, 'classes', classId), {
        boardText: newText,
        lastUpdate: serverTimestamp()
      });
    } catch (err) {
      console.error("Board sync failed:", err);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !classId) return;
    const text = chatInput;
    setChatInput('');
    try {
      await addDoc(collection(db, 'classes', classId, 'messages'), {
        sender: userHandle,
        text,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Message failed", err);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    try {
      const url = await uploadToCloudinary(file);
      const isAudio = file.type.startsWith('audio');
      await updateDoc(doc(db, 'classes', classId), {
        media: arrayUnion({
          url,
          type: isAudio ? 'audio' : 'image',
          sender: userHandle,
          timestamp: Date.now()
        })
      });
      setUserNotification(`Successfully broadcasted note resource to the study stream!`);
    } catch (err) {
      console.error("Media upload failed:", err);
      setUserNotification("Failed to upload lecture file.");
    }
  };

  const handleSendInvite = async () => {
    if (!inviteHandle.trim()) return;
    setIsInviting(true);
    const targetHandle = inviteHandle.trim().toLowerCase();
    
    try {
      const q = query(
        collection(db, 'users'),
        where('username', '==', targetHandle),
        limit(1)
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const targetUser = snap.docs[0];
        const targetUid = targetUser.id;
        
        await addDoc(collection(db, 'notifications'), {
          to: targetUid,
          from: user.uid,
          fromName: userHandle,
          title: "🏫 Live Classroom Invitation",
          message: `${userHandle} has invited you to join their live active classroom lecture! Join immediately.`,
          type: 'classroom_invite',
          classId: classId,
          targetTab: 'class',
          timestamp: serverTimestamp(),
          read: false
        });
        
        setUserNotification(`Live invitation transmitted to @${targetHandle}! 🚀`);
        setInviteHandle('');
        setIsInviteOpen(false);
      } else {
        setUserNotification(`User handle @${targetHandle} not registered in our nodes.`);
      }
    } catch (e) {
      console.error("Invite error:", e);
      setUserNotification("Failed to transmit classroom invitation.");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'bg-[#0A0714] text-white' : 'bg-slate-50 text-slate-900'} relative overflow-hidden`}>
      
      {/* Upper Professional Header */}
      <div className="p-4 bg-[#120F1F]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
            <Video size={20} className="text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-tight text-white flex items-center gap-2">
              <span>{classData?.name || `${userHandle}'s Active Lecture`}</span>
              <span className="text-[7.5px] bg-[#DC2626]/20 text-[#DC2626] border border-[#DC2626]/30 px-2 py-0.5 rounded italic">LIVE SESSION</span>
            </h2>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(classId);
                setUserNotification("Classroom connection string copied!");
              }}
              className="text-[8.5px] font-black text-rose-400 hover:text-white uppercase tracking-widest flex items-center gap-1 mt-0.5 transition-all text-left"
            >
              <span>{classId}</span>
              <span className="opacity-60 text-[7px] italic font-medium">[📋 Copy]</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Invite Button */}
          <button 
            type="button"
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-lg shadow-red-600/10 active:scale-95 border border-red-500/20"
          >
            <Share2 size={12} /> Invite Peer
          </button>

          <button 
            onClick={onExit}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white/90 px-4 py-2 rounded-xl text-[9px] font-black shadow-lg transition-all uppercase tracking-wider border border-white/5"
          >
            <PhoneOff size={11} className="text-red-500" /> End
          </button>
        </div>
      </div>

      {/* Structured Multi-Column Dashboard layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative">
        
        {/* LEFT COLUMN: Main Stream viewport & Participants feed */}
        <div className="lg:col-span-5 flex flex-col p-4 gap-4 overflow-y-auto border-r border-white/5 bg-[#0C0A14] custom-scrollbar justify-between">
          
          <div className="space-y-4">
            <h3 className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] px-1 text-left flex items-center gap-1.5 leading-none">
              <span>● LIVE BROADCASTERS STREAM</span>
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {/* Local Participant Frame */}
              <div className="bg-slate-950/80 rounded-[2rem] border border-white/5 overflow-hidden relative aspect-video flex items-center justify-center shadow-2xl">
                {isCamOn ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-[#DC2626]/10 rounded-full flex items-center justify-center border border-[#DC2626]/20">
                      <User size={30} className="text-[#DC2626]" />
                    </div>
                    <span className="text-[9px] font-black uppercase text-white/50">{userHandle} (You)</span>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                  <span className="text-[9.5px] font-black uppercase text-white">@{userHandle}</span>
                  {!isMicOn && <MicOff size={10} className="text-red-500 animate-pulse" />}
                </div>
              </div>

              {/* Connected Active Scholars Grid */}
              <div className="bg-slate-950/40 rounded-[2rem] border border-white/5 p-4 space-y-3 shadow-inner">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                    <Users size={12} className="text-[#DC2626]" /> Active Members ({participants.length})
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto custom-scrollbar">
                  {participants.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/[0.03] border border-white/5 p-2 rounded-xl">
                      <div className="w-5 h-5 rounded-lg bg-pink-500/10 flex items-center justify-center font-black text-[9px] text-[#DC2626]">@{(p || '?').charAt(0).toUpperCase()}</div>
                      <span className="text-[8px] font-black text-white/80 uppercase truncate">@{p}</span>
                    </div>
                  ))}
                  {participants.length === 0 && (
                    <p className="text-[7.5px] text-white/20 uppercase tracking-normal p-2">Session awaiting peer connections...</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick controls bar inline inside column */}
          <div className="bg-[#120F1F]/60 border border-white/5 rounded-3xl p-3 flex items-center justify-around mt-4">
            <button 
              onClick={() => setIsMicOn(!isMicOn)}
              className={`p-3 rounded-2xl transition-all ${isMicOn ? 'bg-white/5 text-white/50 hover:bg-white/10' : 'bg-red-600 text-white shadow-lg shadow-red-600/20'}`}
              title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button 
              onClick={() => setIsCamOn(!isCamOn)}
              className={`p-3 rounded-2xl transition-all ${isCamOn ? 'bg-white/5 text-white/50 hover:bg-white/10' : 'bg-red-600 text-white shadow-lg shadow-red-600/20'}`}
              title={isCamOn ? "Stop Videostream" : "Start Videostream"}
            >
              {isCamOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
            <div className="w-px h-6 bg-white/10" />
            <button 
              onClick={() => setShowChat(!showChat)}
              className={`p-3 rounded-2xl transition-all relative ${showChat ? 'text-[#DC2626] bg-[#DC2626]/10' : 'text-white/40 hover:text-white/70'}`}
              title="Toggle Live Discussion"
            >
              <MessageSquare size={18} />
              {messages.length > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Permanent, Live Classboard */}
        <div className="lg:col-span-7 flex flex-col p-6 overflow-y-auto bg-[#120F1F] custom-scrollbar gap-6">
          
          <div className="bg-slate-950/40 p-6 rounded-[2.5rem] border border-white/5 flex flex-col flex-1 shadow-2xl relative min-h-[400px]">
            <div className="absolute top-6 left-6 flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-red-600/10 flex items-center justify-center border border-red-600/20">
                <Layout size={14} className="text-[#DC2626]" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-white block">Active Classwork Board</span>
                <span className="text-[7px] text-white/30 uppercase tracking-widest block font-bold mt-0.5">Real-time collaboration panel</span>
              </div>
            </div>

            <textarea 
              value={boardText}
              onChange={(e) => handleBoardChange(e.target.value)}
              readOnly={!isHost}
              placeholder={isHost ? "🚀 Host/Teacher - write core instructions, space equations, metrics, or notes here for everyone to see instantly..." : "Awaiting host notes broadcast..."}
              className="flex-1 mt-14 bg-transparent border-none outline-none text-sm sm:text-base font-bold leading-relaxed resize-none text-white/90 placeholder:text-white/10 font-mono scrollbar-none"
            />

            {/* Shared Board Media Strip */}
            <div className="border-t border-white/5 pt-4 space-y-3 text-left">
              <span className="text-[8px] font-black text-rose-400 uppercase tracking-[0.25em] block">Broadcasted Study Assets & Media</span>
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
                {classData?.media?.map((m: any, idx: number) => (
                  <div key={idx} className="flex-shrink-0 w-24 h-24 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden group relative">
                    {m.type === 'image' ? (
                      <img src={m.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <FileAudio size={18} className="text-[#DC2626] animate-pulse" />
                        <span className="text-[7px] font-black uppercase text-white/40">Voice clip</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-2 text-left">
                       <span className="text-[7.5px] font-black uppercase text-white leading-none truncate">@ {m.sender}</span>
                    </div>
                  </div>
                ))}
                
                {isHost && (
                  <label className="flex-shrink-0 w-24 h-24 rounded-2xl border-2 border-dashed border-white/10 hover:border-[#DC2626]/50 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white/[0.01]">
                    <Plus size={18} className="text-white/20" />
                    <span className="text-[8px] font-black uppercase text-white/25 truncate w-20 text-center">Broadcast Asset</span>
                    <input type="file" className="hidden" accept="image/*,audio/*" onChange={handleMediaUpload} />
                  </label>
                )}
                
                {(!classData?.media || classData.media.length === 0) && !isHost && (
                  <p className="text-[8px] text-white/20 uppercase tracking-wide leading-none py-8">No lecture file resources shared yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SIDE DRAWER FOR LIVE CHAT OVERLAY */}
        <AnimatePresence>
          {showChat && (
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="absolute top-0 right-0 bottom-0 w-full sm:w-80 bg-[#0C0A14] border-l border-white/5 flex flex-col shadow-2xl z-30"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-[#DC2626]" />
                  <span className="text-xs font-black uppercase tracking-tighter text-white">Live Session Chat</span>
                </div>
                <button onClick={() => setShowChat(false)} className="p-2 hover:bg-white/5 rounded-xl text-white/45 hover:text-white"><X size={18} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
                {messages.map((m) => (
                  <div key={m.id} className={`flex flex-col ${m.sender === userHandle ? 'items-end' : 'items-start'}`}>
                    <span className="text-[7.5px] font-black uppercase text-white/30 mb-1">@{m.sender}</span>
                    <div className={`p-3 rounded-2xl text-[10.5px] max-w-[85%] leading-normal ${m.sender === userHandle ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white rounded-tr-none shadow-md' : 'bg-white/5 text-white/80 rounded-tl-none border border-white/10'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 text-white/20">
                    <p className="text-3xl">💬</p>
                    <p className="text-[8px] uppercase tracking-widest mt-2">Class message boards are currently empty.</p>
                  </div>
                )}
              </div>
              
              <div className="p-3 border-t border-white/5 flex gap-2 bg-[#08060E]">
                <input 
                  placeholder="Send broadcast message to all..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white outline-none focus:border-[#DC2626]/50 placeholder:text-white/20"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button onClick={handleSendMessage} className="p-2.5 bg-gradient-to-r from-red-600 to-rose-500 text-white rounded-xl shadow-md"><Send size={14} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PEER INVITATION MODAL */}
      <AnimatePresence>
        {isInviteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#120F1F] border border-white/10 p-6 rounded-3xl w-full max-w-sm space-y-6 text-left"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Share2 className="text-[#DC2626]" size={18} />
                  <h3 className="text-xs font-black uppercase text-white tracking-widest">Transmit Invite to Peer</h3>
                </div>
                <button onClick={() => setIsInviteOpen(false)} className="p-1 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-2">
                <p className="text-[8.5px] font-black uppercase text-white/40 tracking-wider">User Handle / Username</p>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#DC2626] font-bold">@</span>
                  <input 
                    type="text" 
                    placeholder="e.g. scholarship_pro" 
                    value={inviteHandle} 
                    onChange={(e) => setInviteHandle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-8 pr-4 py-3.5 text-xs text-white outline-none focus:border-red-500 transition-colors uppercase font-bold"
                  />
                </div>
                <p className="text-[7.5px] text-white/30 uppercase tracking-widest font-black leading-normal">
                  Transmits an automated classroom_invite push notification to the user's active board. They click to connect immediately!
                </p>
              </div>
              
              <div className="flex gap-2.5 pt-2">
                <button 
                  onClick={() => setIsInviteOpen(false)}
                  className="flex-1 py-3 text-[10px] font-black uppercase text-white/50 tracking-widest border border-white/5 rounded-2xl hover:bg-white/5"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSendInvite}
                  disabled={isInviting || !inviteHandle.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-500 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest hover:from-red-500 disabled:opacity-40 transition-all border-b-[3px] border-red-800"
                >
                  {isInviting ? "Transmitting..." : "Send Invite"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom status indicators */}
      <div className="bg-black/40 border-t border-white/5 px-6 py-2.5 flex justify-center items-center gap-2 text-center text-white/45">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[7.5px] font-black uppercase tracking-[0.4em] text-white/50">NSG CLOUD LECTURE COMPLETED SECURITY LAYER ACTIVE</span>
      </div>
    </div>
  );
};
