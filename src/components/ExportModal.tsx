import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  FileCode,
  Printer,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Archive,
} from 'lucide-react';
import type { JournalEntry, IntelligenceReport, ThemeMode } from '../types';
import {
  exportAsMarkdown,
  exportAsJson,
  printFormattedDocument,
  generateMarkdown,
} from '../lib/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  selectedEntry: JournalEntry | null;
  report: IntelligenceReport | null;
  theme: ThemeMode;
  showToast: (message: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  entries,
  selectedEntry,
  report,
  theme,
  showToast,
}) => {
  const [exportScope, setExportScope] = useState<'all' | 'single'>('all');
  const [hasCopied, setHasCopied] = useState(false);

  if (!isOpen) return null;

  const targetEntries =
    exportScope === 'single' && selectedEntry ? [selectedEntry] : entries;

  const handleCopyMarkdown = () => {
    const md = generateMarkdown(targetEntries, exportScope === 'all' ? report : null);
    navigator.clipboard.writeText(md);
    setHasCopied(true);
    showToast('Markdown copied to clipboard!');
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    exportAsMarkdown(targetEntries, exportScope === 'all' ? report : null);
    showToast('Markdown file downloaded successfully!');
  };

  const handleDownloadJson = () => {
    exportAsJson(targetEntries, exportScope === 'all' ? report : null);
    showToast('JSON backup archive downloaded successfully!');
  };

  const handlePrintPdf = () => {
    printFormattedDocument(targetEntries, exportScope === 'all' ? report : null);
    showToast('Opening print / PDF preview window...');
  };

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className={`w-full max-w-xl rounded-2xl shadow-2xl border transition-all overflow-hidden flex flex-col ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">Advanced Export &amp; Sharing Hub</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Port your private reflections and intelligence dossiers into standard formats
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scope Selector */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setExportScope('all')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                exportScope === 'all'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Full Vault ({entries.length} reflections + AI Hub)
            </button>
            <button
              onClick={() => setExportScope('single')}
              disabled={!selectedEntry}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-40 ${
                exportScope === 'single'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Active Reflection Only
            </button>
          </div>

          {exportScope === 'single' && selectedEntry && (
            <div className="px-3 py-2 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 rounded-lg text-xs text-indigo-700 dark:text-indigo-300 flex items-center justify-between">
              <span className="truncate max-w-[340px]">
                Target: <strong>{selectedEntry.title || 'Untitled'}</strong> ({selectedEntry.messages?.length || 0} messages)
              </span>
              <span className="text-[10px] text-slate-400">
                {new Date(selectedEntry.updatedAt || selectedEntry.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Export Formats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Markdown Export */}
            <button
              id="export-markdown-btn"
              onClick={handleDownloadMarkdown}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition hover:border-indigo-500 group cursor-pointer ${
                isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                  Clean Markdown (.md)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Universal format for Obsidian, Notion, GitHub
                </div>
              </div>
            </button>

            {/* JSON Backup Export */}
            <button
              id="export-json-btn"
              onClick={handleDownloadJson}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition hover:border-indigo-500 group cursor-pointer ${
                isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                  JSON Vault Backup (.json)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Full programmatic backup with all metadata
                </div>
              </div>
            </button>

            {/* Printable PDF / Text Export */}
            <button
              id="export-pdf-btn"
              onClick={handlePrintPdf}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition hover:border-indigo-500 group cursor-pointer ${
                isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                  Print / Formatted PDF
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Formatted typography, ready to print or PDF
                </div>
              </div>
            </button>
          </div>

          {/* 1-Click Clipboard Action */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
              isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Copy className="w-4 h-4 text-slate-400" />
              <div className="text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  Quick Clipboard Copy
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Copy formatted markdown text directly into your clipboard
                </p>
              </div>
            </div>

            <button
              id="copy-markdown-clipboard-btn"
              onClick={handleCopyMarkdown}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
                hasCopied
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 dark:border-slate-600'
              }`}
            >
              {hasCopied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>
          </div>

          {/* Privacy Guarantee Note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              All exports are generated client-side from your authenticated Firestore sandbox. No third-party data broker is ever consulted.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
