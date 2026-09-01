import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Bell, Sparkles, BookOpen, Clock, Calendar, Check, Zap, 
  Flame, Award, Trophy, Target, ChevronRight, MessageSquare
} from 'lucide-react';
import { MarkdownRenderer } from '../subComponents';
import { db } from '../firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getUserRank } from '../utils';

export interface NotificationsViewProps {
  setActiveTab: (tab: any) => void;
  selectedArticle: any;
  setSelectedArticle: (article: any) => void;
  articles?: any[];
  theme: 'light' | 'dark';
  notifications?: any[];
  personalNotifications: any[];
  user: any;
  currentUserData: any;
  setToolsSubTab: (sub: any) => void;
  setProfileSubTab?: (sub: any) => void;
  handleGlobalBack?: () => void;
  handleHistoryItemClick?: (item: any) => void;
  handleNotificationClick?: (notif: any) => void;
  blogPosts?: any[];
  markArticleAsRead?: (id: string) => void;
  readArticles?: string[];
  setUserNotification?: (msg: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  setActiveTab,
  selectedArticle,
  setSelectedArticle,
  articles = [],
  theme,
  notifications = [],
  personalNotifications = [],
  user,
  currentUserData,
  setToolsSubTab,
  setProfileSubTab,
  handleGlobalBack,
  handleHistoryItemClick,
  handleNotificationClick = () => {},
  blogPosts,
  markArticleAsRead = () => {},
  readArticles = [],
  setUserNotification = () => {},
}) => {
  const activeArticles = blogPosts && blogPosts.length > 0 ? blogPosts : articles;
  return (

            <div key="notifications" className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setActiveTab('home')}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95"
                    title="Back to Home"
                  >
                    <ArrowLeft size={16} />
                    <span>Home</span>
                  </button>
                  <h2 className="text-xl font-black uppercase tracking-tighter text-white">Notifications</h2>
                </div>
                <Bell size={20} className="text-[#8B5CF6]" />
              </div>

              {selectedArticle ? (
                <div className="space-y-6">
                  <button 
                    onClick={() => setSelectedArticle(null)}
                    className="flex items-center gap-2 text-[10px] font-black text-amber-400 uppercase tracking-widest hover:opacity-70 transition-all cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Back to List
                  </button>
                  <div className={`${theme === 'dark' ? 'bg-[#13111C] border-white/10' : 'bg-white border-slate-200'} p-8 rounded-3xl border shadow-sm space-y-6`}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-black text-amber-400 uppercase tracking-widest">
                        <Calendar size={12} />
                        {selectedArticle.timestamp?.toDate ? selectedArticle.timestamp.toDate().toLocaleDateString() : 'Just now'}
                      </div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">{selectedArticle.title}</h2>
                    </div>
                    <div className={`markdown-body text-sm leading-relaxed ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                      <MarkdownRenderer content={selectedArticle.content} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* BROADCASTS & ANNOUNCEMENTS */}
                  <div className="space-y-3 text-left">
                    <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] px-2 flex items-center gap-1.5 leading-none mb-1">
                      <span>📢 Broadcasts & Announcements</span>
                    </h3>

                    {(activeArticles || []).length === 0 ? (
                      <div className={`${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10' : 'bg-white border-slate-200'} p-12 rounded-3xl border shadow-sm text-center space-y-4`}>
                        <div className="w-16 h-16 bg-[#8B5CF6]/10 rounded-full flex items-center justify-center mx-auto">
                          <BookOpen size={32} className="text-[#8B5CF6]" />
                        </div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">No Articles Yet</h2>
                        <p className="text-sm text-white/40">Check back later for updates from the NSG team.</p>
                      </div>
                    ) : (
                      (activeArticles || []).map((post) => (
                        <div 
                          key={post.id} 
                          onClick={() => {
                            setSelectedArticle(post);
                            (markArticleAsRead || (() => {}))(post.id);
                          }}
                          className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group ${theme === 'dark' ? 'bg-[#0A0F1C] border-white/10 hover:border-[#8B5CF6]/50' : 'bg-white border-slate-200 hover:border-[#8B5CF6]/50 shadow-sm'}`}
                        >
                          {!(readArticles || []).includes(post.id) && (
                            <div className="absolute top-4 right-4 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                          )}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[8px] font-black text-amber-400 uppercase tracking-widest">
                              <Calendar size={10} />
                              {post.timestamp?.toDate ? post.timestamp.toDate().toLocaleDateString() : 'Just now'}
                            </div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-[#8B5CF6] transition-colors">{post.title}</h3>
                            <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">
                              {post.content.replace(/[#*`]/g, '')}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* ACTIVITY / STREAK NOTIFICATIONS */}
                  <div className="space-y-3 text-left pt-2">
                    <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] px-2 flex items-center gap-1.5 leading-none mb-2">
                      <Bell size={14} className="text-[#8B5CF6]" />
                      <span>Activity</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {(() => {
                        const notificationsToDisplay = personalNotifications.length > 0 
                          ? personalNotifications 
                          : [
                              {
                                id: 'fallback-streak-1',
                                title: 'Daily streak',
                                message: "Complete one lesson to get today's reward. Test your understanding with an instant quiz or practice exam.",
                                timestamp: new Date(Date.now() - 11 * 86400000),
                                type: 'streak'
                              },
                              {
                                id: 'fallback-streak-2',
                                title: 'Daily streak',
                                message: "Complete one lesson to get today's reward. Review lecture notes to boost retention.",
                                timestamp: new Date(Date.now() - 15 * 86400000),
                                type: 'streak'
                              },
                              {
                                id: 'fallback-streak-3',
                                title: 'Daily streak',
                                message: "Complete one lesson to get today's reward. Boost your Scholar Division ranking!",
                                timestamp: new Date(Date.now() - 62 * 86400000),
                                type: 'streak'
                              },
                              {
                                id: 'fallback-streak-4',
                                title: 'Daily streak',
                                message: "Complete one lesson to get today's reward and maintain your continuous learning momentum.",
                                timestamp: new Date(Date.now() - 105 * 86400000),
                                type: 'streak'
                              },
                              {
                                id: 'fallback-streak-5',
                                title: 'Daily streak',
                                message: "Complete one lesson to get today's reward and unlock bonus achievements.",
                                timestamp: new Date(Date.now() - 107 * 86400000),
                                type: 'streak'
                              }
                            ];

                        return notificationsToDisplay.map((notif, idx) => {
                          const getRelativeTime = (ts: any) => {
                            if (!ts) return 'Just now';
                            const d = ts.toDate ? ts.toDate() : (ts instanceof Date ? ts : new Date(ts));
                            const now = new Date();
                            const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
                            if (isNaN(diffSec) || diffSec <= 0) return 'Just now';
                            const diffMin = Math.floor(diffSec / 60);
                            if (diffMin < 60) return `${diffMin}m ago`;
                            const diffHr = Math.floor(diffMin / 60);
                            if (diffHr < 24) return `${diffHr}h ago`;
                            const diffDays = Math.floor(diffHr / 24);
                            if (diffDays === 1) return '1 day ago';
                            return `${diffDays} days ago`;
                          };

                          return (
                            <div 
                              key={`${notif.id || 'notif'}-${idx}`}
                              onClick={() => {
                                if (notif.type !== 'streak_request' || notif.resolved) {
                                  handleNotificationClick(notif);
                                }
                              }}
                              className={`p-4 rounded-[1.25rem] bg-[#0B0D14] border border-white/5 hover:border-[#8B5CF6]/40 shadow-md relative overflow-hidden group transition-all duration-300 ${notif.type !== 'streak_request' || notif.resolved ? 'cursor-pointer hover:scale-[1.005]' : ''}`}
                            >
                              <div className="flex items-start gap-3.5 relative z-10">
                                <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center text-sm shadow-md shrink-0 mt-0.5">
                                  <Bell size={18} />
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                  <p className="text-sm font-bold text-white leading-snug">{notif.title || 'Daily streak'}</p>
                                  <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap break-words">{notif.message || "Complete one lesson to get today's reward"}</p>
                                  <p className="text-[11px] font-medium text-amber-400 pt-0.5">{getRelativeTime(notif.timestamp)}</p>

                                  {/* Follow-up Deep-Link Action Buttons */}
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab('tools');
                                        setToolsSubTab('quiz');
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                      🎯 Generate a Quiz
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab('tools');
                                        setToolsSubTab('notebook');
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                      📁 Upload a Note
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab('tools');
                                        setToolsSubTab('exam');
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                      📝 Practice CBT
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab('chat');
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                      🤖 Ask Omni
                                    </button>
                                  </div>
                                </div>

                                {notif.type === 'streak_request' && !notif.resolved ? (
                                  <button 
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        await updateDoc(doc(db, 'notifications', notif.id), {
                                          resolved: true,
                                          read: true
                                        });
                                        await addDoc(collection(db, 'notifications'), {
                                          to: notif.from,
                                          from: user.uid,
                                          fromName: currentUserData?.username || currentUserData?.displayName || 'Scholar',
                                          type: 'streak_accept',
                                          title: '⚡ Reading Streak Accepted!',
                                          message: `${currentUserData?.username || 'Somebody'} accepted your reading streak request! Start writing notes to keep it active and gather +150 XP bonus!`,
                                          timestamp: serverTimestamp() || new Date(),
                                          read: false
                                        });
                                        const newPoints = (currentUserData?.points || 0) + 15;
                                        await updateDoc(doc(db, 'users', user.uid), {
                                          points: newPoints,
                                          rank: (getUserRank || (() => "Scholar"))(newPoints)
                                        });
                                        setActiveTab('tools');
                                        setToolsSubTab('notebook');
                                        (setUserNotification || (() => {}))("🎉 Reading streak active! You received +15 XP bonus!");
                                      } catch (err) {
                                        console.error("Accept streak error:", err);
                                        (setUserNotification || (() => {}))("Failed to accept streak request.");
                                      }
                                    }}
                                    className="px-3.5 py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-95 text-white text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer"
                                  >
                                    Accept 🔥
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
  );
};
