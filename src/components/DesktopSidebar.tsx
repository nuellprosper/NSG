import React from 'react';
import { 
  Home, BookOpen, Compass, Users, User, Bell, Shield, Sparkles, 
  Crown, Sun, Moon, LogOut, MessageSquare, Cpu, LogIn
} from 'lucide-react';

export interface DesktopSidebarProps {
  isDesktop: boolean;
  isAuthView: boolean;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  setToolsSubTab: (sub: any) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  user: any;
  currentUserData: any;
  isPremium: boolean;
  setShowPremiumModal: (val: boolean) => void;
  setShowAuthModal: (val: boolean) => void;
  handleLogout: () => void;
  personalNotifications?: any[];
  unreadCount?: number;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  isDesktop,
  isAuthView,
  activeTab,
  setActiveTab,
  setToolsSubTab,
  theme,
  setTheme,
  user,
  currentUserData,
  isPremium,
  setShowPremiumModal,
  setShowAuthModal,
  handleLogout,
  personalNotifications = [],
  unreadCount = 0,
}) => {
  if (!isDesktop || isAuthView) return null;

  return (
<aside
                className="w-[72px] flex flex-col items-center py-6 gap-3 shrink-0 z-[611]"
                style={{
                  background: 'var(--sidebar-bg)',
                  borderRight: '1px solid var(--sidebar-border)',
                }}
              >
                {/* Wordmark / Logo */}
                <button
                  onClick={() => setActiveTab('home')}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3 relative group transition-all active:scale-90"
                  style={{
                    background: 'var(--accent-primary)',
                    boxShadow: '0 0 20px var(--accent-glow)',
                  }}
                  title="NSG (NUELL STUDY GUIDE) — Home"
                >
                  <span
                    className="font-display text-white font-black text-lg leading-none"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    N
                  </span>
                  {/* Tooltip */}
                  <span
                    className="absolute left-full ml-3 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-medium)',
                    }}
                  >
                    NSG (NUELL STUDY GUIDE)
                  </span>
                </button>

                {/* Divider */}
                <div className="w-8 h-px" style={{ background: 'var(--border-subtle)' }} />

                {/* Navigation items */}
                <div className="flex flex-col gap-1.5 flex-1 animate-fadeIn">
                  {[
                    { id: 'home',      icon: '⌂',  label: 'Home' },
                    { id: 'tools',     icon: '⚡', label: 'Tools' },
                    { id: 'community', icon: '☍',  label: 'Community' },
                    { id: 'profile',   icon: '◎',  label: 'Profile' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'tools') {
                          setToolsSubTab('menu');
                        }
                        setActiveTab(item.id as any);
                      }}
                      title={item.label}
                      className={`nav-item group relative ${activeTab === item.id ? 'active' : ''}`}
                      data-active={activeTab === item.id ? 'true' : undefined}
                    >
                      <span className="text-lg leading-none">{item.icon}</span>

                      {/* Tooltip */}
                      <span
                        className="absolute left-full ml-3 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl"
                        style={{
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-medium)',
                        }}
                      >
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div className="w-8 h-px" style={{ background: 'var(--border-subtle)' }} />

                {/* Premium */}
                <button
                  onClick={() => setShowPremiumModal(true)}
                  className="nav-item group relative"
                  title={isPremium ? 'Premium Active' : 'Upgrade to Premium'}
                >
                  <span className="text-lg animate-pulse" style={{ color: 'var(--accent-gold)' }}>✦</span>
                  <span
                    className="absolute left-full ml-3 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-medium)',
                    }}
                  >
                    {isPremium ? 'Premium ✓' : 'Go Premium'}
                  </span>
                </button>

                {/* Theme toggle */}
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="nav-item group relative"
                  title={theme === 'dark' ? 'Switch to Luxury Light' : 'Switch to Premium Dark'}
                >
                  <span className="text-base">{theme === 'dark' ? '☀' : '◗'}</span>
                  <span
                    className="absolute left-full ml-3 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-medium)',
                    }}
                  >
                    {theme === 'dark' ? 'Luxury Light' : 'Premium Dark'}
                  </span>
                </button>

                {/* Settings */}
                <button
                  onClick={() => setToolsSubTab('menu')}
                  className="nav-item group relative"
                  title="System Settings"
                >
                  <span className="text-base" style={{ opacity: 0.5 }}>⚙</span>
                  <span
                    className="absolute left-full ml-3 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-medium)',
                    }}
                  >
                    System Config
                  </span>
                </button>
              </aside>

  );
};
