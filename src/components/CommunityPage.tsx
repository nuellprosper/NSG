import React, { useState } from 'react';
import { 
  Globe, Activity, Sparkles, Trophy, User, Users, Calendar, X, Edit3, ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
// @ts-ignore
import twemoji from 'twemoji';

export const Emoji: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  const parsed = twemoji.parse(text, {
    folder: 'svg',
    ext: '.svg',
    base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/'
  });

  return (
    <span 
      className={`inline-flex items-center justify-center [&>img]:w-[1.2em] [&>img]:h-[1.2em] [&>img]:inline-block [&>img]:align-middle [&>img]:mx-[0.05em] [&>img]:cursor-default ${className}`}
      dangerouslySetInnerHTML={{ __html: parsed }}
    />
  );
};

const getUserRank = (points: number) => {
  if (points >= 341000) return "Pearl League";
  if (points >= 85000) return "Ruby League";
  if (points >= 21000) return "Platinum League";
  if (points >= 5000) return "Gold League";
  if (points >= 1000) return "Silver League";
  return "Bronze League";
};

const getScholarTierInfo = (points: number) => {
  const rank = getUserRank(points);
  if (rank === "Pearl League") return { color: "text-pink-300", bg: "bg-pink-500/10", border: "border-pink-500/20", icon: "🦪", badgeStyle: "shadow-[0_0_15px_rgba(244,143,177,0.3)] text-pink-300 border-pink-300/30 bg-pink-950/40" };
  if (rank === "Ruby League") return { color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: "🌹", badgeStyle: "shadow-[0_0_12px_rgba(244,63,94,0.2)] text-rose-500 border-rose-500/30 bg-rose-950/40" };
  if (rank === "Platinum League") return { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: "🛡️", badgeStyle: "shadow-[0_0_15px_rgba(34,211,238,0.25)] text-cyan-400 border-cyan-500/30 bg-cyan-950/40" };
  if (rank === "Gold League") return { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: "🏆", badgeStyle: "shadow-[0_0_15px_rgba(251,191,36,0.25)] text-amber-400 border-amber-500/30 bg-amber-950/40" };
  if (rank === "Silver League") return { color: "text-slate-350", bg: "bg-slate-300/10", border: "border-slate-300/20", icon: "🥈", badgeStyle: "text-slate-300 border-slate-400/30 bg-slate-900/40" };
  return { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: "🥉", badgeStyle: "text-orange-400 border-orange-500/30 bg-orange-950/40" };
};

interface CommunityPageProps {
  currentUserData: any;
  sessions: any[];
  finishedHistory: any[];
  leaderboard: any[];
  user: any;
  db: any;
  updateDoc: any;
  doc: any;
  arrayUnion: any;
  increment: any;
  serverTimestamp: any;
  addDoc: any;
  collection: any;
  setUserNotification: (msg: string) => void;
  setActiveTab: (tab: any) => void;
  setToolsSubTab: (subtab: any) => void;
  setShowInviteModal: (show: boolean) => void;
  theme: string;
  quests?: any[];
  userNotes?: any[];
}

export const CommunityPage: React.FC<CommunityPageProps> = ({
  currentUserData,
  sessions = [],
  finishedHistory = [],
  leaderboard = [],
  user,
  db,
  updateDoc,
  doc,
  arrayUnion,
  increment,
  serverTimestamp,
  addDoc,
  collection,
  setUserNotification,
  setActiveTab,
  setToolsSubTab,
  setShowInviteModal,
  theme,
  quests = [],
  userNotes = []
}) => {
  const [communitySubTab, setCommunitySubTab] = useState<'quests' | 'rankings'>('quests');

  // Compute rank and league information
  const currentRank = getUserRank(currentUserData?.points || 0); // e.g. "Silver League"
  const rankMap: Record<string, any> = {
    "Bronze League": { level: 1, code: "bronze", total: 5, scale: 1, reward: 200 },
    "Silver League": { level: 2, code: "silver", total: 10, scale: 2, reward: 400 },
    "Gold League": { level: 3, code: "gold", total: 20, scale: 4, reward: 800 },
    "Platinum League": { level: 4, code: "platinum", total: 40, scale: 8, reward: 1600 },
    "Ruby League": { level: 5, code: "ruby", total: 80, scale: 16, reward: 3200 },
    "Pearl League": { level: 6, code: "pearl", total: 160, scale: 32, reward: 6400 },
  };
  const rankInfo = rankMap[currentRank] || rankMap["Bronze League"];

  const claimedQuestsList = currentUserData?.claimedQuests || [];
  // Filter claimed quests that start with our current rank code
  const currentRankClaimedIds = claimedQuestsList.filter((id: string) => id.startsWith(`q_${rankInfo.code}_`));
  const currentRankClaimedCount = currentRankClaimedIds.length;

  // Which batch of 5 tasks is the user on?
  const batchIndex = Math.floor(currentRankClaimedCount / 5);

  const generateProgressiveTasks = () => {
    const tasks = [];
    const startIdx = batchIndex * 5 + 1;
    // Each batch shows exactly 5 tasks at a time, up to the total tasks in this rank
    const endIdx = Math.min(rankInfo.total, startIdx + 4);
    
    // Progress variables
    const quizzesCount = finishedHistory.filter(h => h.type === 'quiz').length;
    const sessionsCount = sessions.length;
    const notesCount = userNotes.length;
    const examsCount = finishedHistory.filter(h => h.type === 'exam').length;
    const aiQueriesCount = currentUserData?.aiQueriesCount || 0;

    for (let i = startIdx; i <= endIdx; i++) {
      const taskTypeIdx = (i - 1) % 5;
      let type = '';
      let title = '';
      let desc = '';
      let progress = '0/0';
      let isDone = false;
      let targetTab = 'tools';
      let targetSubTab = '';
      let chest = '🎁';
      let buttonLabel = 'GO TO TOOL';
      let currentVal = 0;
      let targetVal = 0;

      const scale = rankInfo.scale;
      const batchOffset = Math.floor((i - 1) / 5);
      
      if (taskTypeIdx === 0) {
        type = 'quiz';
        title = `${currentRank.replace(' League', '')} Quiz Retention [Tier ${batchOffset + 1}]`;
        targetVal = Math.max(1, Math.floor(1 * scale * Math.pow(1.5, batchOffset)));
        currentVal = quizzesCount;
        desc = `Complete ${targetVal} quizzes successfully to test active retrieval.`;
        targetSubTab = 'quiz';
        chest = '⚡';
      } else if (taskTypeIdx === 1) {
        type = 'voice';
        title = `${currentRank.replace(' League', '')} Voice Lecture [Tier ${batchOffset + 1}]`;
        targetVal = Math.max(1, Math.floor(1 * scale * Math.pow(1.5, batchOffset)));
        currentVal = sessionsCount;
        desc = `Record ${targetVal} full lectures using the smart audio tool.`;
        targetSubTab = 'record';
        chest = '🎤';
      } else if (taskTypeIdx === 2) {
        type = 'notebook';
        title = `${currentRank.replace(' League', '')} Study Note Sync [Tier ${batchOffset + 1}]`;
        targetVal = Math.max(1, Math.floor(1 * scale * Math.pow(1.5, batchOffset)));
        currentVal = notesCount;
        desc = `Generate and save ${targetVal} sources or study notes in your workspace.`;
        targetSubTab = 'notebook';
        chest = '📚';
      } else if (taskTypeIdx === 3) {
        type = 'exam';
        title = `${currentRank.replace(' League', '')} CBT Preparation [Tier ${batchOffset + 1}]`;
        targetVal = Math.max(1, Math.floor(1 * scale * Math.pow(1.5, batchOffset)));
        currentVal = examsCount;
        desc = `Take and finish ${targetVal} standard mock exams.`;
        targetSubTab = 'exam';
        chest = '📝';
      } else {
        type = 'ai';
        title = `${currentRank.replace(' League', '')} Cognitive Dialog [Tier ${batchOffset + 1}]`;
        targetVal = Math.max(2, Math.floor(2 * scale * Math.pow(1.5, batchOffset)));
        currentVal = aiQueriesCount;
        desc = `Consult Omni AI Tutor ${targetVal} times for high-level guidance.`;
        targetSubTab = 'notebook';
        chest = '🧠';
      }

      isDone = currentVal >= targetVal;
      progress = `${Math.min(currentVal, targetVal)}/${targetVal}`;
      const reward = rankInfo.reward;

      tasks.push({
        id: `q_${rankInfo.code}_${i}`,
        title,
        desc,
        progress,
        isDone,
        reward,
        chest,
        buttonLabel: `GO TO ${targetSubTab.toUpperCase()}`,
        targetTab,
        targetSubTab,
        currentVal,
        targetVal
      });
    }
    return tasks;
  };

  const activeBatchQuests = generateProgressiveTasks();

  const filteredLeaderboard = leaderboard.filter(u => getUserRank(u.points || 0) === currentRank);

  // Swipe gesture handlers
  const touchStartX = React.useRef<number | null>(null);
  const touchEndX = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diffX = touchStartX.current - touchEndX.current;
    if (Math.abs(diffX) > 60) {
      if (diffX > 0) {
        setCommunitySubTab('rankings');
      } else {
        setCommunitySubTab('quests');
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="flex-1 flex flex-col px-2 sm:px-0 relative mb-12 text-left select-none"
    >
      {/* Community Tab Selector */}
      <div className="flex items-center gap-2 bg-[#1E1B2E] p-1.5 rounded-[2rem] mb-8 max-w-md mx-auto w-full shadow-2xl relative border border-white/5">
        <button 
          type="button"
          onClick={() => setCommunitySubTab('quests')}
          className={`flex-1 py-3 px-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${communitySubTab === 'quests' ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-xl shadow-red-500/15 scale-102' : 'text-white/40 hover:text-white/60'}`}
        >
          <Emoji text="🏆" /> Quests Map
        </button>
        <button 
          type="button"
          onClick={() => setCommunitySubTab('rankings')}
          className={`flex-1 py-3 px-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${communitySubTab === 'rankings' ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-xl shadow-red-500/15 scale-102' : 'text-white/40 hover:text-white/60'}`}
        >
          <Emoji text="🌐" /> Community Rank
        </button>
      </div>

      <div className="space-y-6">
        {communitySubTab === 'quests' ? (
          <div className="space-y-6">
            {/* Smart Quests Dashboard Block (Pink/Neon Banner, Treasure Chests) */}
            <div className="bg-gradient-to-br from-[#1E1B2E] to-[#120F1F] p-6 rounded-[2.5rem] shadow-2xl space-y-6 text-left border border-white/5">
              {/* Active Month Challenge Ribbon */}
              <div className="bg-gradient-to-r from-[#FF007F] via-[#FF1493] to-[#8A2BE2] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-4 top-4 text-5xl opacity-20 select-none animate-pulse"><Emoji text="🏅" /></div>
                <h4 className="text-sm font-black uppercase tracking-wider mb-0.5 flex items-center gap-1">
                  <Emoji text="✨" /> Smart Study Quest Dashboard
                </h4>
                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-white/70">
                  <span><Emoji text="📅" /> CURRENT MONTH CHALLENGE</span>
                  <span>•</span>
                  <span className="text-yellow-300 animate-pulse"><Emoji text="⏲️" /> 10 DAYS REMAINING</span>
                </div>

                {/* Quest Points Subcard */}
                <div className="bg-black/25 backdrop-blur-md rounded-2xl p-4 mt-5 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black uppercase tracking-wider">Accumulate 20 Quest Points</span>
                    <span className="font-black text-yellow-300">
                      {Math.min(20, Math.floor(((currentUserData?.points || 0) * 0.012) + (currentUserData?.streak || 0) * 1.5))} / 20 QP
                    </span>
                  </div>

                  {/* Pink glowing progress bar */}
                  <div className="w-full bg-white/10 h-4 rounded-full overflow-hidden relative border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-[#FF00BF] via-[#FF007F] to-[#D500F9] relative flex items-center justify-end pr-2 transition-all duration-700" 
                      style={{ width: `${Math.min(100, Math.round((Math.min(20, Math.floor(((currentUserData?.points || 0) * 0.012) + (currentUserData?.streak || 0) * 1.5)) / 20) * 100))}%` }}
                    >
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping absolute right-1" />
                    </div>
                  </div>

                  <p className="text-[7px] font-bold text-white/50 uppercase tracking-widest">
                    Claim 100 Bonus XP and unlock the limited-edition Monthly Synergy Badge upon completing!
                  </p>
                </div>
              </div>

              {/* Progressive Rank-Specific Tasks List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">
                    ACTIVE RANK TASKS — {currentRank.toUpperCase()}
                  </h5>
                  <span className="text-[9px] font-black uppercase text-rose-400 bg-rose-400/10 px-2.5 py-1 rounded-full border border-rose-400/20">
                    Batch {batchIndex + 1}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {activeBatchQuests.map((qst, idx) => {
                    const isClaimed = currentUserData?.claimedQuests?.includes(qst.id);
                    const canClaim = qst.isDone && !isClaimed;

                    const handleQuestClaim = async () => {
                      if (!user?.uid) return;
                      try {
                        const pointsChange = qst.reward || 10;
                        await updateDoc(doc(db, 'users', user.uid), {
                          claimedQuests: arrayUnion(qst.id),
                          points: increment(pointsChange)
                        });
                        setUserNotification(`🎁 PROGRESSIVE TASK COMPLETED! Claimed ${pointsChange} XP Points.`);
                      } catch (e) {
                         setUserNotification("Error claiming quest points. Try again!");
                      }
                    };

                    const handleQuestAction = () => {
                      if (canClaim) {
                        handleQuestClaim();
                      } else if (isClaimed) {
                        setUserNotification("🌈 Quest already claimed! Check out your next batch.");
                      } else {
                        // Navigate to specified tool tab
                        setActiveTab(qst.targetTab as any);
                        if (qst.targetSubTab) {
                          let sub = qst.targetSubTab;
                          if (sub === 'voice') sub = 'record';
                          setToolsSubTab(sub as any);
                        }
                        setUserNotification(`🚀 Redirecting you to do "${qst.title}" study milestone!`);
                      }
                    };

                    return (
                      <div key={idx} className="bg-zinc-900/40 p-5 rounded-[2rem] flex flex-col justify-between space-y-4 relative overflow-hidden shadow-xl border border-white/5">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <span className={`text-[7px] font-black px-2 py-0.5 rounded-full ${qst.isDone ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'} uppercase tracking-widest`}>
                              {isClaimed ? 'CLAIMED' : qst.isDone ? 'COMPLETED' : 'PENDING'}
                            </span>
                            <h6 className="font-black text-xs text-white uppercase tracking-tight mt-1">{qst.title}</h6>
                            <p className="text-[9.5px] font-bold text-white/45 uppercase leading-normal">{qst.desc}</p>
                            <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mt-1">Progress: {qst.progress}</p>
                          </div>
                          <div className="text-3xl filter drop-shadow-lg"><Emoji text={qst.chest} /></div>
                        </div>

                        <button 
                          type="button"
                          onClick={handleQuestAction}
                          className={`w-full py-3.5 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 ${canClaim ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20 hover:from-green-450' : isClaimed ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5' : 'bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-450 hover:shadow-lg hover:shadow-red-500/15 text-white'}`}
                        >
                          {canClaim ? `CLAIM +${qst.reward} XP` : isClaimed ? "CLAIMED" : qst.buttonLabel}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Friend Streaks Module with referral invitations */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">Study Streaks & Buddies</h5>
                  <button 
                    type="button" 
                    onClick={() => setShowInviteModal(true)} 
                    className="text-[8px] font-black uppercase text-red-500 hover:text-white bg-[#DC2626]/10 hover:bg-[#DC2626] px-3 py-1.5 rounded-xl border border-red-500/20 transition-all active:scale-95"
                  >
                    + Invite Buddy
                  </button>
                </div>

                {(!currentUserData?.invitedUsers || currentUserData.invitedUsers.length === 0) ? (
                  <div className="bg-zinc-900/40 p-6 rounded-[2rem] border border-white/5 text-center space-y-3">
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">No study buddies connected yet</p>
                    <button 
                      type="button"
                      onClick={() => setShowInviteModal(true)}
                      className="mx-auto bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-black px-5 py-2.5 rounded-xl text-[8px] uppercase tracking-widest shadow-lg shadow-red-500/10 transition-all flex items-center gap-1.5 active:scale-95 border-b-[3px] border-red-800"
                    >
                      Invite Buddy with Referral ID
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentUserData.invitedUsers.slice(0, 4).map((buddy: any, bIdx: number) => (
                      <div key={bIdx} className="bg-zinc-900/40 p-4 rounded-[1.5rem] border border-white/5 flex items-center justify-between shadow-xl">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-[10px] font-bold text-white shadow">
                            {buddy.username?.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="text-left">
                            <p className="text-[11px] font-black text-white whitespace-nowrap leading-none uppercase">@{buddy.username}</p>
                            <p className="text-[7.5px] text-white/40 uppercase tracking-widest mt-1">Multiplied 50 XP Applied</p>
                          </div>
                        </div>
                        <span className="text-[8px] bg-green-500/10 text-green-400 px-2 py-1 rounded-lg font-black uppercase tracking-widest flex items-center gap-1">
                          Streak Active <Emoji text="🔥" />
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Monthly Badges Cabinet */}
              <div className="space-y-4 pt-2">
                <h5 className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">MONTHLY SYNERGY BADGES</h5>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Apex Scholar", emoji: "⚡🦅", condition: "1200 XP Accumulation", done: (currentUserData?.points || 0) >= 1200, style: "from-cyan-500/20 text-cyan-400" },
                    { label: "Elite Core", emoji: "🦾", condition: "500 XP points achieved", done: (currentUserData?.points || 0) >= 500, style: "from-yellow-500/20 text-yellow-500" },
                    { label: "Sustained Pulse", emoji: "🔥", condition: "5 Day streak active", done: (currentUserData?.streak || 0) >= 5, style: "from-emerald-500/20 text-emerald-400" },
                    { label: "Course Master", emoji: "🛡️", condition: "Smart Quiz activity complete", done: finishedHistory.filter(h => h.type === 'quiz').length > 0, style: "from-purple-500/20 text-purple-400" }
                  ].map((badge, bIdx) => (
                    <div key={bIdx} className={`bg-gradient-to-tr ${badge.style} to-[#0E0B1A]/40 p-5 rounded-[2rem] border border-white/5 text-center flex flex-col justify-between h-36 relative overflow-hidden shadow-xl group hover:scale-[1.03] transition-transform`}>
                      <div className="text-3xl select-none filter drop-shadow-md group-hover:scale-110 transition-transform"><Emoji text={badge.emoji} /></div>
                      <div>
                        <p className="text-[9.5px] font-black text-white uppercase truncate tracking-tight">{badge.label}</p>
                        <p className="text-[6.5px] text-white/40 uppercase tracking-widest leading-none mt-1">{badge.condition}</p>
                      </div>
                      <span className={`text-[7px] font-black leading-none py-1.5 px-2.5 rounded-xl uppercase tracking-widest mx-auto my-1 ${badge.done ? 'bg-gradient-to-r from-red-650 to-rose-500 text-white shadow-md' : 'bg-white/5 text-white/20'}`}>
                        {badge.done ? 'UNLOCKED' : 'LOCKED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements & Badges Cabinet (Milestone level achievements) */}
              <div className="space-y-4 pt-2">
                <h5 className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em]">SCHOLAR ACHIEVEMENTS</h5>
                
                <div className="space-y-3">
                  {[
                    { 
                      id: "fresher_start",
                      title: "Fresher Initiate", 
                      badge: "🎯", 
                      xp: 100, 
                      desc: "Secured your very first study activity with Omni AI", 
                      color: "from-orange-500/20 to-zinc-900/5 text-orange-300 border border-orange-500/10",
                      isComplete: finishedHistory.length > 0,
                      progress: `${finishedHistory.length} / 1 Completed`
                    },
                    { 
                      id: "legal_reader",
                      title: "Legal Reader", 
                      badge: "⚖️", 
                      xp: 100, 
                      desc: "Used study note tools up to 10 times a day", 
                      color: "from-[#1CB0F6]/20 to-blue-500/5 text-blue-300 border border-blue-500/10",
                      isComplete: (currentUserData?.dailyNoteUsage || 0) >= 10,
                      progress: `${currentUserData?.dailyNoteUsage || 0} / 10 Saves`
                    },
                    { 
                      id: "wildfire_ace",
                      title: "Wildfire Ace", 
                      badge: "👨‍🌾", 
                      xp: 100, 
                      desc: "Ignited a 10-day streak on NSG servers", 
                      color: "from-[#58CC02]/20 to-green-500/5 text-green-300 border border-green-500/10",
                      isComplete: (currentUserData?.streak || 0) >= 10,
                      progress: `${currentUserData?.streak || 0} / 10 Days`
                    }
                  ].map((ach, aIdx) => {
                    const isClaimed = currentUserData?.claimedAchievements?.includes(ach.id);
                    const canClaim = ach.isComplete && !isClaimed;

                    const handleClaimAchievement = async () => {
                      if (!user?.uid) return;
                      try {
                        await updateDoc(doc(db, 'users', user.uid), {
                          claimedAchievements: arrayUnion(ach.id),
                          points: increment(ach.xp)
                        });
                        setUserNotification(`🏆 ${ach.title} Claimed! +${ach.xp} XP Multiplier Added.`);
                      } catch (e) {
                        setUserNotification("Failed to claim achievement reward. Please try again!");
                      }
                    };

                    return (
                      <div key={aIdx} className={`bg-gradient-to-br ${ach.color} p-5 rounded-[2rem] flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-xl relative overflow-hidden group border border-white/5`}>
                        {ach.isComplete && !isClaimed && (
                          <div className="absolute top-2 right-2 bg-[#DC2626] text-white text-[6px] font-sans font-black px-2 py-0.5 rounded-full tracking-widest animate-pulse">
                            COMPLETED
                          </div>
                        )}
                        {isClaimed && (
                          <div className="absolute top-2 right-2 bg-green-600/30 text-green-400 text-[6px] font-sans font-black px-2 py-0.5 rounded-full tracking-widest">
                            CLAIMED
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <div className="text-3xl filter drop-shadow-md select-none group-hover:scale-110 transition-transform"><Emoji text={ach.badge} /></div>
                          <div className="space-y-1 text-left">
                            <h6 className="font-black text-xs text-white uppercase tracking-tight leading-none">{ach.title}</h6>
                            <p className="text-[8px] text-white/55 leading-snug">{ach.desc}</p>
                            <p className="text-[7px] font-bold text-white/40 uppercase tracking-widest mt-1">Progress: {ach.progress}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {canClaim ? (
                            <button 
                              type="button"
                              onClick={handleClaimAchievement}
                              className="px-4 py-1.5 bg-gradient-to-r from-red-600 to-rose-500 border-b-[3px] border-red-800 text-white font-black text-[7.5px] uppercase tracking-widest rounded-xl hover:from-red-500 hover:to-rose-450 transition-all active:border-b-0 active:translate-y-[2px]"
                            >
                              Claim +{ach.xp} XP
                            </button>
                          ) : isClaimed ? (
                            <span className="font-sans font-black text-xs text-green-400 block">Claimed!</span>
                          ) : (
                            <span className="font-sans font-black text-xs text-white/30 block">+{ach.xp} XP</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats / Leaderboard View */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                {/* 3D GLOSSY SCHOLAR PODIUM */}
                {filteredLeaderboard.length >= 1 && (
                  <div className="relative overflow-hidden p-6 rounded-[2.5rem] bg-gradient-to-br from-[#1E1B2E] to-[#120F1F] shadow-3xl border border-white/5">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#DC2626] via-pink-500 to-amber-500" />
                    <h3 className="text-center text-xs font-black uppercase tracking-[0.2em] text-yellow-500 mb-8 flex items-center justify-center gap-2">
                      <Emoji text="👑" /> {currentRank.toUpperCase()} LEADERBOARD <Emoji text="👑" />
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-2 items-end pt-4 pb-2 max-w-md mx-auto relative">
                      {/* 2ND PLACE - LEFT */}
                      {filteredLeaderboard[1] ? (
                        <div className="flex flex-col items-center">
                          <div className="relative mb-2">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 p-0.5 relative shadow-lg">
                              <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950 relative">
                                {filteredLeaderboard[1]?.photoURL ? (
                                  <img src={filteredLeaderboard[1].photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white/20"><User size={20} /></div>
                                )}
                              </div>
                            </div>
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-300 text-black text-[8px] font-black rounded-full px-2 py-0.5 uppercase tracking-wider shadow flex items-center gap-1">
                              <Emoji text="🥈" /> 2nd
                            </div>
                          </div>
                          <p className="text-[10px] font-black text-white truncate w-20 text-center uppercase leading-none mt-1">
                            {filteredLeaderboard[1]?.username || filteredLeaderboard[1]?.displayName?.split(' ')[0] || "Scholar"}
                          </p>
                          <span className="text-[8px] font-black px-2 py-0.5 rounded-full mt-1.5 bg-slate-400/10 text-slate-300">
                            {filteredLeaderboard[1]?.points || 0} XP
                          </span>
                          {/* PODIUM STEP */}
                          <div className="w-full bg-white/5 rounded-t-xl h-16 mt-3 flex items-center justify-center shadow-lg">
                            <span className="text-xl font-black text-slate-400">2</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center opacity-20">
                          <div className="w-14 h-14 rounded-full bg-zinc-850 flex items-center justify-center text-white/10 border border-white/5 animate-pulse">
                            <User size={20} />
                          </div>
                          <p className="text-[10px] font-bold text-white/25 uppercase leading-none mt-1">Claim 2nd</p>
                          <div className="w-full bg-white/5 rounded-t-xl h-16 mt-3 flex items-center justify-center">
                            <span className="text-xl font-black text-white/10">2</span>
                          </div>
                        </div>
                      )}

                      {/* 1ST PLACE - CENTER */}
                      {filteredLeaderboard[0] ? (
                        <div className="flex flex-col items-center z-10 scale-110">
                          <div className="relative mb-3">
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce">
                              <span className="text-2xl"><Emoji text="👑" /></span>
                            </div>
                            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 p-1 overflow-hidden relative shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                              <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950 relative">
                                {filteredLeaderboard[0]?.photoURL ? (
                                  <img src={filteredLeaderboard[0].photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-yellow-500/20"><User size={24} /></div>
                                )}
                              </div>
                            </div>
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[8px] font-black rounded-full px-2 py-0.5 uppercase tracking-wider shadow flex items-center gap-1">
                              <Emoji text="🥇" /> CHAMP
                            </div>
                          </div>
                          <p className="text-[11px] font-black text-yellow-500 truncate w-24 text-center uppercase leading-none">
                            {filteredLeaderboard[0]?.username || filteredLeaderboard[0]?.displayName?.split(' ')[0] || "Scholar"}
                          </p>
                          <span className="text-[8px] font-black px-2 py-0.5 rounded-full mt-1.5 bg-yellow-400/20 text-yellow-500">
                            {filteredLeaderboard[0]?.points || 0} XP
                          </span>
                          {/* PODIUM STEP */}
                          <div className="w-full bg-gradient-to-t from-yellow-500/20 to-white/5 rounded-t-xl h-24 mt-3 flex flex-col items-center justify-center shadow-2xl">
                            <span className="text-3xl font-black text-yellow-500">1</span>
                            <span className="text-[6px] font-bold text-yellow-500/50 uppercase tracking-widest mt-1">LEADER</span>
                          </div>
                        </div>
                      ) : null}

                      {/* 3RD PLACE - RIGHT */}
                      {filteredLeaderboard[2] ? (
                        <div className="flex flex-col items-center">
                          <div className="relative mb-2">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-orange-400 p-0.5 relative shadow-lg">
                              <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950 relative">
                                {filteredLeaderboard[2]?.photoURL ? (
                                  <img src={filteredLeaderboard[2].photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white/20"><User size={20} /></div>
                                )}
                              </div>
                            </div>
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[8px] font-black rounded-full px-2 py-0.5 uppercase tracking-wider shadow flex items-center gap-1">
                              <Emoji text="🥉" /> 3rd
                            </div>
                          </div>
                          <p className="text-[10px] font-black text-white truncate w-20 text-center uppercase leading-none mt-1">
                            {filteredLeaderboard[2]?.username || filteredLeaderboard[2]?.displayName?.split(' ')[0] || "Scholar"}
                          </p>
                          <span className="text-[8px] font-black px-2 py-0.5 rounded-full mt-1.5 bg-amber-600/10 text-amber-500">
                            {filteredLeaderboard[2]?.points || 0} XP
                          </span>
                          {/* PODIUM STEP */}
                          <div className="w-full bg-white/5 rounded-t-xl h-12 mt-3 flex items-center justify-center shadow-lg">
                            <span className="text-xl font-black text-amber-600">3</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center opacity-20">
                          <div className="w-14 h-14 rounded-full bg-zinc-850 flex items-center justify-center text-white/10 border border-white/5">
                            <User size={20} />
                          </div>
                          <p className="text-[10px] font-bold text-white/25 uppercase leading-none mt-1">Claim 3rd</p>
                          <div className="w-full bg-white/5 rounded-t-xl h-12 mt-3 flex items-center justify-center">
                            <span className="text-xl font-black text-white/10">3</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SCHOLARS LIST */}
                <div className="bg-gradient-to-br from-[#1E1B2E] to-[#120F1F] rounded-[2.5rem] p-6 shadow-2xl text-left border border-white/5">
                  <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider italic flex items-center gap-2">
                      <span>{currentRank.toUpperCase()} LEAGUE RANKINGS</span>
                    </h3>
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-red-500/10 to-blue-500/10 px-3 py-1 rounded-full border border-white/5">
                      <Activity size={10} className="text-blue-400" /> 
                      <span className="text-[7px] font-black text-white/70 uppercase">Real-time Feed</span>
                    </div>
                  </div>

                  {/* PINNED CURRENT USER XP STANDING */}
                  <div className="bg-gradient-to-r from-[#DC2626]/20 via-blue-500/10 to-transparent p-5 rounded-3xl mb-5 flex items-center justify-between shadow-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-blue-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-black/30">
                        <Emoji text={getScholarTierInfo(currentUserData?.points || 0).icon || '⭐'} />
                      </div>
                      <div className="text-left">
                        <p className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] leading-none">Your Rank Level</p>
                        <p className="text-[11px] font-black text-white uppercase mt-1.5">
                          {currentRank}
                        </p>
                        <p className="text-[7px] text-white/40 font-bold uppercase tracking-widest mt-0.5 mt-1 block">
                          Level {Math.floor((currentUserData?.points || 0) / 500) + 1} Scholar
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-blue-400 leading-none">
                        {currentUserData?.points || 0} XP
                      </p>
                      <p className="text-[6px] font-black text-white/20 uppercase tracking-widest mt-1.5 leading-none block">LEAGUE STANDING</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                    {filteredLeaderboard.map((u, i) => {
                      const tier = getScholarTierInfo(u.points || 0);

                      return (
                        <div key={u.id} className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all ${u.uid === user?.uid ? 'bg-gradient-to-r from-red-500/15 via-blue-500/10 to-transparent shadow-xl border border-red-500/10' : 'bg-white/5 shadow-sm hover:bg-white/10'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] ${i < 3 ? 'bg-gradient-to-br from-red-500 to-blue-600 text-white shadow-lg' : 'bg-white/5 text-white/30'}`}>
                            {i + 1}
                          </div>
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 shrink-0">
                            {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <div className="w-full h-full flex items-center justify-center text-white/10 bg-white/5"><User size={20} /></div>}
                          </div>
                          <div className="flex-1 min-w-0 font-medium font-sans text-left">
                            <div className="flex items-center gap-2">
                              <p className="text-[11px] font-black text-white uppercase truncate leading-none">{u.username || u.displayName?.split(' ')[0]}</p>
                              {u.uid === user?.uid && (
                                <span className="bg-gradient-to-r from-red-500/20 to-blue-500/20 text-red-300 text-[6px] font-black px-1.5 py-0.5 rounded-md uppercase shadow-lg">You</span>
                              )}
                            </div>
                            {/* CUSTOM TIER BADGE */}
                            <div className="flex items-center gap-1 mt-1 leading-none">
                              <span className="text-[8px]"><Emoji text={tier.icon} /></span>
                              <span className={`text-[7px] font-black uppercase tracking-widest ${tier.color}`}>{getUserRank(u.points || 0)}</span>
                            </div>
                          </div>

                          <div className="text-right flex items-center gap-2">
                            <div className="mr-1">
                              <p className="text-[11px] font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-blue-400 leading-none">{u.points || 0}</p>
                              <p className="text-[6px] font-black text-white/20 uppercase tracking-widest leading-none mt-1">XP points</p>
                            </div>
                            
                            {u.uid !== user?.uid && (
                              <div className="flex items-center gap-1 font-medium select-none">
                                <button 
                                  type="button"
                                  title="Send High Five"
                                  onClick={async (e) => {
                                    const button = e.currentTarget;
                                    button.classList.add('scale-150', 'bg-yellow-500', 'text-black');
                                    setTimeout(() => {
                                      button.classList.remove('scale-150', 'bg-yellow-500', 'text-black');
                                    }, 300);

                                    try {
                                      await addDoc(collection(db, 'notifications'), {
                                        to: u.uid,
                                        from: user?.uid,
                                        fromName: currentUserData?.username || currentUserData?.displayName || 'Scholar',
                                        type: 'highfive',
                                        title: "✋ High Five Received!",
                                        message: `${currentUserData?.username || 'Somebody'} sent you a High Five for studying hard!`,
                                        timestamp: serverTimestamp(),
                                        read: false
                                      });
                                      setUserNotification(`✋ High-five badge transmitted to ${u.username || u.displayName?.split(' ')[0]}! 🙌`);
                                    } catch (err) {
                                      setUserNotification("Failed to send High Five.");
                                    }
                                  }}
                                  className="w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-yellow-500/30 text-yellow-500 rounded-xl transition-all shadow-md active:scale-90"
                                >
                                  <span className="text-xs flex items-center justify-center"><Emoji text="✋" /></span>
                                </button>

                                <button 
                                  type="button"
                                  title="Challenge to Reading Streak"
                                  onClick={async () => {
                                    try {
                                      await addDoc(collection(db, 'notifications'), {
                                        to: u.uid,
                                        from: user?.uid,
                                        fromName: currentUserData?.username || currentUserData?.displayName || 'Scholar',
                                        type: 'streak_request',
                                        title: "🔥 Reading Streak Challenge!",
                                        message: `${currentUserData?.username || 'Somebody'} sent you a request to start a 5-day reading streak!`,
                                        timestamp: serverTimestamp(),
                                        read: false
                                      });
                                      setUserNotification(`Sent a 5-day study streak request to ${u.username || u.displayName?.split(' ')[0]}! 🔥`);
                                    } catch (err) {
                                      setUserNotification("Failed to challenge user.");
                                    }
                                  }}
                                  className="w-7 h-7 flex items-center justify-center bg-white/5 text-blue-400 hover:bg-blue-500/30 rounded-xl transition-all shadow-md active:scale-90 font-sans"
                                >
                                  <span className="text-xs flex items-center justify-center"><Emoji text="🔥" /></span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Community Disclaimer Banner */}
                  <div className="mt-5 p-4 rounded-2xl bg-[#DC2626]/5 border border-[#DC2626]/15 text-center space-y-1">
                    <p className="text-[7.5px] font-black uppercase tracking-[0.25em] text-[#DC2626] flex items-center justify-center gap-1">
                      <Emoji text="📡" /> Peer Scholar Notice
                    </p>
                    <p className="text-[9.5px] text-white/45 leading-relaxed font-sans font-medium">
                      Accumulated XP serves solely for community rankings on the peer leaderboard. Strive high to help elevate your study circle of fellow scholars!
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-red-650 to-[#991B1B] rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden text-left border border-white/5">
                  <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  <h4 className="text-lg font-black uppercase tracking-tighter italic leading-none mb-1">Weekly Goal</h4>
                  <p className="text-[9px] font-bold text-white/50 uppercase tracking-[0.2em] mb-6">Master the streak</p>
                  
                  <div className="flex justify-between items-end gap-1.5 mb-6">
                    {[1,2,3,4,5,6,7].map(day => (
                      <div key={day} className="flex-1 flex flex-col items-center gap-2">
                        <div className={`w-full h-12 rounded-lg relative overflow-hidden flex flex-col justify-end p-1 transition-all ${day <= (currentUserData?.streak || 0) ? 'bg-white/20' : 'bg-black/10'}`}>
                          {day <= (currentUserData?.streak || 0) && <div className="absolute bottom-0 left-0 w-full bg-white opacity-80 pointer-events-none h-full" />}
                        </div>
                        <span className="text-[6px] font-black opacity-40">DAY {day}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-[10px] font-bold italic leading-tight">"Consistency is the secret code to academic excellence."</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#1E1B2E] to-[#120F1F] rounded-[2.5rem] p-6 text-white shadow-2xl space-y-4 border border-white/5 text-left">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 text-center">Your Progression</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest mb-1 font-sans">
                      <span className={getScholarTierInfo(currentUserData?.points || 0).color}>{currentUserData?.rank || getUserRank(currentUserData?.points || 0)}</span>
                      <span>NEXT LEVEL</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                      <div className="h-full bg-gradient-to-r from-[#DC2626] to-pink-500" style={{ width: `${Math.min(100, ((currentUserData?.points || 0) % 500) / 5)}%` }} />
                    </div>
                  </div>
                  <p className="text-[7px] text-white/20 text-center uppercase tracking-widest leading-relaxed pt-2 font-sans">Complete 7-day streak to gain +100 bonus XP points for your monthly rank.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
