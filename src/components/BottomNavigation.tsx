import React from 'react';
import { motion } from 'motion/react';
import { Home, Compass, MessageSquare, User, Cpu } from 'lucide-react';

export interface BottomNavigationProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  setToolsSubTab: (sub: any) => void;
  theme: 'light' | 'dark';
  isSecondaryPage: boolean;
  isDesktop: boolean;
  isAuthView: boolean;
  personalNotifications?: any[];
  toolsSubTab?: string;
  communitySubTab?: string;
  profileSubTab?: string;
  isEditingProfile?: boolean;
  homeSelectedCourse?: any;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  setActiveTab,
  setToolsSubTab,
  theme,
  isSecondaryPage,
  isDesktop,
  isAuthView,
  personalNotifications = [],
  toolsSubTab = 'menu',
  communitySubTab = 'feed',
  profileSubTab = 'overview',
  isEditingProfile = false,
  homeSelectedCourse = null
}) => {
  // STRICT RULE: Navigation buttons MUST ONLY be displayed on the four main pages:
  // 1. Main Home Page (activeTab === 'home' && !homeSelectedCourse)
  // 2. Main Tool List Page (activeTab === 'tools' && toolsSubTab === 'menu')
  // 3. Main Community Page (activeTab === 'community' && communitySubTab !== 'rankings')
  // 4. Main Profile Page (activeTab === 'profile' && !isEditingProfile && profileSubTab !== 'stats')
  // No tool subpages, chat rooms, or secondary views may show navigation buttons.
  const isMainPage = (
    (activeTab === 'home' && !homeSelectedCourse) ||
    (activeTab === 'tools' && toolsSubTab === 'menu') ||
    (activeTab === 'community' && communitySubTab !== 'rankings') ||
    (activeTab === 'profile' && !isEditingProfile && profileSubTab !== 'stats')
  );

  if (!isMainPage || isSecondaryPage || isDesktop || isAuthView) return null;

  return (
<div 
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}
          className={`fixed bottom-0 left-0 right-0 z-[100] px-3 pt-2.5 flex items-center justify-around select-none transition-colors ${
          theme === 'dark' 
            ? 'bg-[#0B0813] border-t border-purple-500/20 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]' 
            : 'bg-white border-t border-slate-200 shadow-[0_-4px_25px_rgba(0,0,0,0.06)]'
        }`}>
          {/* HOME */}
          <button 
            type="button"
            onClick={() => setActiveTab('home')} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'home' 
                ? (theme === 'dark' ? 'text-purple-400' : 'text-purple-600') 
                : (theme === 'dark' ? 'text-white/40 hover:text-white/80' : 'text-purple-300 hover:text-purple-600')
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              activeTab === 'home' 
                ? (theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600')
                : ''
            }`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5z" />
                <line x1="10" y1="17" x2="14" y2="17" />
              </svg>
            </div>
            <span className={`text-[9.5px] uppercase tracking-wider leading-none ${
              activeTab === 'home' 
                ? (theme === 'dark' ? 'font-black text-purple-300' : 'font-black text-purple-600') 
                : (theme === 'dark' ? 'font-bold text-white/70' : 'font-bold text-black')
            }`}>HOME</span>
          </button>

          {/* TOOLS */}
          <button 
            type="button"
            onClick={() => {
              setActiveTab('tools');
              setToolsSubTab('menu');
            }} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'tools' 
                ? (theme === 'dark' ? 'text-purple-400' : 'text-purple-600') 
                : (theme === 'dark' ? 'text-white/40 hover:text-white/80' : 'text-purple-300 hover:text-purple-600')
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              activeTab === 'tools' 
                ? (theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600')
                : ''
            }`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="2" />
                <rect x="14" y="3" width="7" height="7" rx="2" />
                <rect x="14" y="14" width="7" height="7" rx="2" />
                <rect x="3" y="14" width="7" height="7" rx="2" />
              </svg>
            </div>
            <span className={`text-[9.5px] uppercase tracking-wider leading-none ${
              activeTab === 'tools' 
                ? (theme === 'dark' ? 'font-black text-purple-300' : 'font-black text-purple-600') 
                : (theme === 'dark' ? 'font-bold text-white/70' : 'font-bold text-black')
            }`}>TOOLS</span>
          </button>

          {/* COMMUNITY */}
          <button 
            type="button"
            onClick={() => setActiveTab('community')} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'community' 
                ? (theme === 'dark' ? 'text-purple-400' : 'text-purple-600') 
                : (theme === 'dark' ? 'text-white/40 hover:text-white/80' : 'text-purple-300 hover:text-purple-600')
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              activeTab === 'community' 
                ? (theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600')
                : ''
            }`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <line x1="3.6" y1="9" x2="20.4" y2="9" />
                <line x1="3.6" y1="15" x2="20.4" y2="15" />
                <path d="M12 3a14.5 14.5 0 0 1 0 18 14.5 14.5 0 0 1 0-18z" />
              </svg>
            </div>
            <span className={`text-[9.5px] uppercase tracking-wider leading-none ${
              activeTab === 'community' 
                ? (theme === 'dark' ? 'font-black text-purple-300' : 'font-black text-purple-600') 
                : (theme === 'dark' ? 'font-bold text-white/70' : 'font-bold text-black')
            }`}>COMMUNITY</span>
          </button>

          {/* PROFILE */}
          <button 
            type="button"
            onClick={() => setActiveTab('profile')} 
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTab === 'profile' 
                ? (theme === 'dark' ? 'text-purple-400' : 'text-purple-600') 
                : (theme === 'dark' ? 'text-white/40 hover:text-white/80' : 'text-purple-300 hover:text-purple-600')
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              activeTab === 'profile' 
                ? (theme === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600')
                : ''
            }`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className={`text-[9.5px] uppercase tracking-wider leading-none ${
              activeTab === 'profile' 
                ? (theme === 'dark' ? 'font-black text-purple-300' : 'font-black text-purple-600') 
                : (theme === 'dark' ? 'font-bold text-white/70' : 'font-bold text-black')
            }`}>PROFILE</span>
          </button>
        </div>
  );
};
