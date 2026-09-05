import React, { useState } from 'react';
import {
  Sparkles,
  LogOut,
  ShieldCheck,
  Database,
  User as UserIcon,
  Loader2,
  Brain,
  MessageSquare,
  Sun,
  Moon,
  Download,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { logOut } from '../lib/firebase';
import type { ThemeMode } from '../types';

interface NavbarProps {
  user: User;
  onOpenSecurityModal: () => void;
  syncStatus: 'idle' | 'saving' | 'synced' | 'error';
  currentTab: 'workspace' | 'intelligence';
  onChangeTab: (tab: 'workspace' | 'intelligence') => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenExportModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenSecurityModal,
  syncStatus,
  currentTab,
  onChangeTab,
  theme,
  onToggleTheme,
  onOpenExportModal,
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await logOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <header
      className={`border-b sticky top-0 z-20 transition-colors shadow-xs ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Left: Brand & Mobile Tab Switch */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base sm:text-lg tracking-tight">ReflectionAI</span>
            <span className="hidden md:inline-block text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 px-2 py-0.5 rounded">
              Gemini 3.6 Flash
            </span>
          </div>
        </div>

        {/* Center: Main View Tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
          <button
            id="tab-workspace-btn"
            onClick={() => onChangeTab('workspace')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              currentTab === 'workspace'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reflections</span>
          </button>

          <button
            id="tab-intelligence-btn"
            onClick={() => onChangeTab('intelligence')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              currentTab === 'intelligence'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>AI Mood Hub</span>
          </button>
        </div>

        {/* Right User Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Middle Status Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs">
            <Database className="w-3 h-3 text-indigo-500" />
            <span className="font-semibold text-[10px] uppercase tracking-wide">Firestore:</span>
            {syncStatus === 'saving' && (
              <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 text-[11px]">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving
              </span>
            )}
            {syncStatus === 'synced' && (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Isolated
              </span>
            )}
            {syncStatus === 'idle' && (
              <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Ready
              </span>
            )}
            {syncStatus === 'error' && (
              <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Sync Error
              </span>
            )}
          </div>

          {/* Export Button */}
          <button
            id="navbar-export-btn"
            onClick={onOpenExportModal}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="Export & Sharing Hub"
          >
            <Download className="w-4 h-4 text-indigo-500" />
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-400'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
            }`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Security Rules Modal */}
          <button
            id="security-info-btn"
            onClick={onOpenSecurityModal}
            className={`hidden md:flex items-center gap-1.5 text-xs font-medium border px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="View Security Rules & OWASP Compliance"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden lg:inline">Security</span>
          </button>

          {/* User Profile Info */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-300 dark:border-slate-700 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
            )}

            <button
              id="signout-button"
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer disabled:opacity-50"
              title="Sign Out"
            >
              {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
