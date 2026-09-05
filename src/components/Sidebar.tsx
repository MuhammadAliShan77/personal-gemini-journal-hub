import React, { useState } from 'react';
import {
  Plus,
  Search,
  BookOpen,
  Trash2,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import type { JournalEntry, ThemeMode } from '../types';
import type { User } from 'firebase/auth';
import { logOut } from '../lib/firebase';

interface SidebarProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (id: string) => void;
  onNewEntry: () => void;
  onDeleteEntry: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  isDesktopCollapsed: boolean;
  onToggleDesktopCollapse: () => void;
  theme: ThemeMode;
  user?: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  isOpen,
  onToggle,
  isDesktopCollapsed,
  onToggleDesktopCollapse,
  theme,
  user,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const filteredEntries = entries.filter((entry) => {
    const titleMatch = entry.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const contentMatch = entry.messages?.some((m) =>
      m.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return titleMatch || contentMatch;
  });

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isDark = theme === 'dark';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        id="reflections-sidebar"
        className={`fixed lg:static top-16 bottom-0 left-0 z-30 transition-all duration-200 ease-in-out flex flex-col border-r ${
          isDark
            ? 'bg-slate-950/90 border-slate-800 text-slate-200'
            : 'bg-slate-900 border-slate-800 text-slate-200'
        } ${
          // Mobile state
          isOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop collapse state
          isDesktopCollapsed ? 'lg:w-16' : 'lg:w-72'
        }`}
      >
        {/* Top Header & Actions */}
        <div className={`p-3.5 sm:p-4 flex flex-col ${isDesktopCollapsed ? 'lg:items-center' : ''}`}>
          <div className="flex items-center justify-between mb-4 w-full">
            {!isDesktopCollapsed && (
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Reflections Vault
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {entries.length}
                </span>
              </div>
            )}

            {/* Desktop Collapse Toggle */}
            <button
              id="sidebar-collapse-toggle-btn"
              onClick={onToggleDesktopCollapse}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title={isDesktopCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isDesktopCollapsed ? (
                <PanelLeft className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            {/* Mobile close button */}
            <button
              onClick={onToggle}
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* New Reflection Button */}
          <button
            id="new-reflection-button"
            onClick={onNewEntry}
            className={`bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
              isDesktopCollapsed
                ? 'w-10 h-10 p-0 mb-3'
                : 'w-full py-2.5 px-3 mb-3'
            }`}
            title="New Reflection"
          >
            <Plus className="w-4 h-4" />
            {!isDesktopCollapsed && <span>New Reflection</span>}
          </button>

          {/* Search Box (hidden when collapsed) */}
          {!isDesktopCollapsed && (
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="search-reflections-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vault..."
                className="w-full bg-slate-850 border border-slate-800 rounded-lg pl-8.5 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          )}
        </div>

        {/* Entries List */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
          {filteredEntries.length === 0 ? (
            !isDesktopCollapsed && (
              <div className="text-center py-8 px-4">
                <p className="text-xs font-medium text-slate-400">No reflections found</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {searchQuery ? 'Try another keyword' : 'Create your first reflection'}
                </p>
              </div>
            )
          ) : (
            filteredEntries.map((entry) => {
              const isSelected = entry.id === selectedEntryId;
              const msgCount = entry.messages?.length || 0;

              if (isDesktopCollapsed) {
                return (
                  <button
                    key={entry.id}
                    onClick={() => onSelectEntry(entry.id)}
                    className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition cursor-pointer mb-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title={`${entry.title || 'Untitled'} (${msgCount} turns)`}
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                );
              }

              return (
                <div
                  key={entry.id}
                  id={`entry-card-${entry.id}`}
                  onClick={() => onSelectEntry(entry.id)}
                  className={`group flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800 text-white font-medium border-l-3 border-indigo-500 pl-2 shadow-xs'
                      : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isSelected ? 'bg-indigo-400' : 'bg-slate-600'
                    }`}
                  />

                  <div className="flex-1 min-w-0">
                    <span className="text-xs truncate block text-slate-200">
                      {entry.title || 'Untitled Reflection'}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                      <span>{formatDate(entry.updatedAt || entry.createdAt)}</span>
                      <span>&bull;</span>
                      <span>{msgCount} turns</span>
                    </div>
                  </div>

                  {/* Delete Action */}
                  <button
                    id={`delete-entry-${entry.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (entryToDelete === entry.id) {
                        onDeleteEntry(entry.id);
                        setEntryToDelete(null);
                      } else {
                        setEntryToDelete(entry.id);
                      }
                    }}
                    className={`p-1 rounded text-slate-500 hover:text-rose-400 transition ${
                      entryToDelete === entry.id
                        ? 'bg-rose-950 text-rose-300 opacity-100'
                        : 'opacity-0 group-hover:opacity-100 hover:bg-slate-700'
                    }`}
                    title={
                      entryToDelete === entry.id
                        ? 'Click again to confirm delete'
                        : 'Delete reflection'
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </nav>

        {/* Bottom User Section */}
        {user && !isDesktopCollapsed && (
          <div className="p-3 border-t border-slate-800">
            <div className="flex items-center gap-2.5 bg-slate-900 p-2 rounded-xl border border-slate-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {getInitials(user.displayName)}
                </div>
              )}

              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  {user.displayName || 'User'}
                </span>
                <span className="text-[10px] text-slate-500 truncate">
                  {user.email || 'Cloud Firestore'}
                </span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
