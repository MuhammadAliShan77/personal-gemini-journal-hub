/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import {
  subscribeAuthState,
  subscribeToUserInteractions,
  saveUserInteraction,
  deleteUserInteraction,
} from './lib/firebase';
import type { JournalEntry, IntelligenceReport, ThemeMode } from './types';
import { LandingPage } from './components/LandingPage';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ReflectionWorkspace } from './components/ReflectionWorkspace';
import { IntelligenceHub } from './components/IntelligenceHub';
import { ExportModal } from './components/ExportModal';
import { SecurityBadgeModal } from './components/SecurityBadgeModal';
import { Loader2, Menu, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // View state & navigation
  const [currentTab, setCurrentTab] = useState<'workspace' | 'intelligence'>('workspace');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(() => {
    return localStorage.getItem('reflection_sidebar_collapsed') === 'true';
  });

  // Theme state
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('reflection_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  // Cached intelligence report
  const [intelligenceReport, setIntelligenceReport] = useState<IntelligenceReport | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Apply dark mode class to root HTML
  useEffect(() => {
    localStorage.setItem('reflection_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const toggleDesktopCollapse = useCallback(() => {
    setIsDesktopCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('reflection_sidebar_collapsed', String(next));
      return next;
    });
  }, []);

  // Firestore Entries
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'synced' | 'error'>('idle');

  // 1. Subscribe to Firebase Authentication State
  useEffect(() => {
    const unsubscribe = subscribeAuthState((user) => {
      setCurrentUser(user);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Subscription to User's Private Interactions in Firestore
  useEffect(() => {
    if (!currentUser) {
      setEntries([]);
      setSelectedEntryId(null);
      setSyncStatus('idle');
      return;
    }

    setSyncStatus('saving');
    const unsubscribe = subscribeToUserInteractions(
      currentUser.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);
        setSyncStatus('synced');

        // If no entry is currently selected or selected entry was deleted, pick the most recent
        setSelectedEntryId((prev) => {
          if (prev && fetchedEntries.some((e) => e.id === prev)) {
            return prev;
          }
          return fetchedEntries.length > 0 ? fetchedEntries[0].id : null;
        });
      },
      (err) => {
        console.error('Firestore listener error:', err);
        setSyncStatus('error');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Create a new reflection document
  const handleCreateNewEntry = useCallback(async () => {
    if (!currentUser) return;
    try {
      setSyncStatus('saving');
      const newId = `reflection_${Date.now()}`;
      const newEntry: JournalEntry = {
        id: newId,
        userId: currentUser.uid,
        title: 'Untitled Reflection',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      await saveUserInteraction(currentUser.uid, newEntry);
      setSelectedEntryId(newId);
      setCurrentTab('workspace');
      setSyncStatus('synced');
      setIsSidebarOpen(false);
      showToast('Created new reflection document in Firestore');
    } catch (err) {
      console.error('Failed to create new reflection:', err);
      setSyncStatus('error');
    }
  }, [currentUser, showToast]);

  // Update an existing reflection document
  const handleUpdateEntry = useCallback(
    async (updatedEntry: JournalEntry) => {
      if (!currentUser) return;
      try {
        setSyncStatus('saving');
        await saveUserInteraction(currentUser.uid, updatedEntry);
        setSyncStatus('synced');
      } catch (err) {
        console.error('Failed to update reflection in Firestore:', err);
        setSyncStatus('error');
        throw err;
      }
    },
    [currentUser]
  );

  // Delete a reflection document
  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      if (!currentUser) return;
      try {
        setSyncStatus('saving');
        await deleteUserInteraction(currentUser.uid, entryId);
        setSyncStatus('synced');
        showToast('Reflection removed from vault');
      } catch (err) {
        console.error('Failed to delete reflection from Firestore:', err);
        setSyncStatus('error');
      }
    },
    [currentUser, showToast]
  );

  // Loading Screen while verifying auth token
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-4 text-indigo-400 animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          Verifying security credentials...
        </p>
      </div>
    );
  }

  // Not Authenticated -> Show Landing Page
  if (!currentUser) {
    return <LandingPage />;
  }

  const selectedEntry = entries.find((e) => e.id === selectedEntryId) || null;

  // Authenticated -> Show Dashboard
  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-150 ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100 dark' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* Top Navbar */}
      <Navbar
        user={currentUser}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        syncStatus={syncStatus}
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Mobile Sidebar Floating Toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed bottom-5 left-5 z-40 p-3.5 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-indigo-700 transition cursor-pointer"
          title="Toggle Reflections Vault"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Sidebar */}
        <Sidebar
          entries={entries}
          selectedEntryId={selectedEntryId}
          onSelectEntry={(id) => {
            setSelectedEntryId(id);
            setCurrentTab('workspace');
            setIsSidebarOpen(false);
          }}
          onNewEntry={handleCreateNewEntry}
          onDeleteEntry={handleDeleteEntry}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isDesktopCollapsed={isDesktopCollapsed}
          onToggleDesktopCollapse={toggleDesktopCollapse}
          theme={theme}
          user={currentUser}
        />

        {/* View Switcher: Reflection Workspace vs. Intelligence Hub */}
        {currentTab === 'workspace' ? (
          <ReflectionWorkspace
            user={currentUser}
            entry={selectedEntry}
            onUpdateEntry={handleUpdateEntry}
            syncStatus={syncStatus}
            theme={theme}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            showToast={showToast}
          />
        ) : (
          <IntelligenceHub
            entries={entries}
            user={currentUser}
            theme={theme}
            cachedReport={intelligenceReport}
            onReportGenerated={setIntelligenceReport}
            showToast={showToast}
          />
        )}
      </div>

      {/* Advanced Export & Sharing Hub Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        entries={entries}
        selectedEntry={selectedEntry}
        report={intelligenceReport}
        theme={theme}
        showToast={showToast}
      />

      {/* Architecture & Security Rules Modal */}
      <SecurityBadgeModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      {/* Live Floating Success / Info Toast */}
      {toastMessage && (
        <div
          id="app-toast-banner"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl shadow-2xl text-xs font-medium border border-slate-700 dark:border-slate-300 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
