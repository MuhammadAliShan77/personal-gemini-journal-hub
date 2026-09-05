import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Lightbulb,
  FileText,
  Copy,
  Check,
  RotateCw,
  MessageCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Share2,
  Download,
} from 'lucide-react';
import type { JournalEntry, JournalMessage, ReflectionMode, ThemeMode } from '../types';
import type { User } from 'firebase/auth';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ReflectionWorkspaceProps {
  user: User;
  entry: JournalEntry | null;
  onUpdateEntry: (updated: JournalEntry) => Promise<void>;
  onCreateNewEntryWithPrompt?: (prompt: string, mode: ReflectionMode) => void;
  syncStatus: 'idle' | 'saving' | 'synced' | 'error';
  theme: ThemeMode;
  onOpenExportModal?: () => void;
  showToast?: (msg: string) => void;
}

const STARTER_PROMPTS = [
  {
    title: 'Daily Mindfulness & Clarity',
    text: 'What was the most meaningful win or lesson I experienced today, and what made it impactful?',
    mode: 'reflection' as ReflectionMode,
  },
  {
    title: 'Navigating a Complex Decision',
    text: 'I am deciding between two different strategic paths. Can you help me unpack the second-order effects and hidden risks?',
    mode: 'brainstorm' as ReflectionMode,
  },
  {
    title: 'Creative Project Brainstorm',
    text: 'I want to brainstorm 5 novel angles to structure a new initiative for maximum clarity and resilience.',
    mode: 'brainstorm' as ReflectionMode,
  },
  {
    title: 'Weekly Synthesis & Review',
    text: 'Here are my raw thoughts from this week. Please synthesize key patterns, progress, and areas to refocus on.',
    mode: 'summary' as ReflectionMode,
  },
];

export const ReflectionWorkspace: React.FC<ReflectionWorkspaceProps> = ({
  user,
  entry,
  onUpdateEntry,
  syncStatus,
  theme,
  onOpenExportModal,
  showToast,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedMode, setSelectedMode] = useState<ReflectionMode>('reflection');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedInput, setLastFailedInput] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (entry) {
      setTitleDraft(entry.title || 'Untitled Reflection');
    }
  }, [entry?.id, entry?.title]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entry?.messages, isGenerating]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (showToast) showToast('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTitleSubmit = async () => {
    if (!entry) return;
    setIsEditingTitle(false);
    const newTitle = titleDraft.trim() || 'Untitled Reflection';
    if (newTitle !== entry.title) {
      const updated: JournalEntry = {
        ...entry,
        title: newTitle,
        updatedAt: new Date().toISOString(),
      };
      await onUpdateEntry(updated);
    }
  };

  const handleSendMessage = async (customPrompt?: string, customMode?: ReflectionMode) => {
    const promptToSend = (customPrompt || inputText).trim();
    const modeToUse = customMode || selectedMode;

    if (!promptToSend || isGenerating) return;
    if (!entry) return;

    setErrorMessage(null);
    setLastFailedInput(null);
    setIsGenerating(true);

    const userMessageId = `user_${Date.now()}`;
    const newUserMessage: JournalMessage = {
      id: userMessageId,
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toISOString(),
    };

    // Auto-update title if default
    let updatedTitle = entry.title;
    if (entry.title === 'Untitled Reflection' || !entry.title) {
      updatedTitle = promptToSend.slice(0, 40) + (promptToSend.length > 40 ? '...' : '');
    }

    const currentMessages = [...(entry.messages || []), newUserMessage];

    // Optimistically update entry with user message
    const updatedEntryWithUser: JournalEntry = {
      ...entry,
      title: updatedTitle,
      updatedAt: new Date().toISOString(),
      messages: currentMessages,
    };

    try {
      // 1. Save user input first to Firestore
      await onUpdateEntry(updatedEntryWithUser);

      // Only clear input field AFTER confirmed dispatch/save
      if (!customPrompt) {
        setInputText('');
      }

      // 2. Query Gemini via resilient backend endpoint
      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          title: updatedTitle,
          mode: modeToUse,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.details || errJson.error || `Server responded with status ${response.status}`);
      }

      const result = await response.json();
      const modelReplyText = result.text;
      const modelUsed = result.modelUsed || 'gemini-3.6-flash';

      // 3. Append Gemini response
      const modelMessageId = `model_${Date.now()}`;
      const newModelMessage: JournalMessage = {
        id: modelMessageId,
        role: 'model',
        content: modelReplyText,
        timestamp: new Date().toISOString(),
        modelUsed,
      };

      const finalEntry: JournalEntry = {
        ...updatedEntryWithUser,
        updatedAt: new Date().toISOString(),
        messages: [...currentMessages, newModelMessage],
      };

      // 4. Guaranteed Transaction Verification: Save full interaction to Firestore
      await onUpdateEntry(finalEntry);
    } catch (err: any) {
      console.error('[Reflection Error]', err);
      setErrorMessage(
        `Error generating reflection: ${err?.message || 'Unable to connect to Gemini API.'}`
      );
      setLastFailedInput(promptToSend);
      // Keep or restore input text so user does not lose their work
      if (!customPrompt && !inputText) {
        setInputText(promptToSend);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isDark = theme === 'dark';

  if (!entry) {
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center p-8 text-center transition-colors ${
          isDark ? 'bg-slate-900 text-slate-400' : 'bg-[#F8FAFC] text-slate-500'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center mb-4 text-indigo-500 shadow-sm">
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
          No Reflection Selected
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
          Select an entry from your vault on the left, or create a new reflection to start conversing with Gemini.
        </p>
      </div>
    );
  }

  const messages = entry.messages || [];

  return (
    <main
      className={`flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden transition-colors ${
        isDark ? 'bg-slate-900 text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* Top Workspace Header */}
      <header
        className={`h-16 border-b flex items-center justify-between px-4 sm:px-8 shadow-xs shrink-0 transition-colors ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              id="reflection-title-edit-input"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
              className="border border-indigo-500 rounded-lg px-2.5 py-1 text-sm sm:text-base font-semibold text-slate-800 dark:text-white focus:outline-none bg-slate-50 dark:bg-slate-800"
            />
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer truncate"
              onClick={() => setIsEditingTitle(true)}
            >
              <h2
                id="reflection-title-heading"
                className="text-base sm:text-lg font-semibold tracking-tight hover:text-indigo-600 dark:hover:text-indigo-400 transition truncate text-slate-800 dark:text-slate-100"
                title="Click to rename"
              >
                {entry.title || 'Untitled Reflection'}
              </h2>
              <span className="text-[10px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                (edit)
              </span>
            </div>
          )}

          <span className="hidden sm:inline-block bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wider shrink-0">
            {syncStatus === 'saving' ? 'Saving...' : 'Saved in Firestore'}
          </span>
        </div>

        {/* Mode Selector Chips & Share */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setSelectedMode('reflection')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md transition cursor-pointer ${
                selectedMode === 'reflection'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reflection</span>
            </button>

            <button
              onClick={() => setSelectedMode('brainstorm')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md transition cursor-pointer ${
                selectedMode === 'brainstorm'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Brainstorm</span>
            </button>

            <button
              onClick={() => setSelectedMode('summary')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md transition cursor-pointer ${
                selectedMode === 'summary'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Summary</span>
            </button>
          </div>

          {onOpenExportModal && (
            <button
              onClick={onOpenExportModal}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition cursor-pointer"
              title="Export reflection"
            >
              <Download className="w-4 h-4 text-indigo-500" />
            </button>
          )}

          <button
            onClick={() => {
              const fullThread = messages
                .map((m) => `${m.role === 'user' ? 'You' : 'Gemini'}: ${m.content}`)
                .join('\n\n');
              handleCopy('thread', fullThread);
            }}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition cursor-pointer"
            title="Copy reflection thread"
          >
            {copiedId === 'thread' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Message Stream */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto py-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400 shadow-xs">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Start Your Reflection
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              Jot down what is on your mind. Gemini 3.6 Flash will converse with you across multiple turns, uncover patterns, and guide actionable next steps.
            </p>

            {/* Prompt Starters */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {STARTER_PROMPTS.map((starter, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedMode(starter.mode);
                    handleSendMessage(starter.text, starter.mode);
                  }}
                  className={`p-4 rounded-xl border transition group cursor-pointer shadow-xs hover:shadow-sm ${
                    isDark
                      ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 hover:border-indigo-500'
                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-500">
                    {starter.title}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    &ldquo;{starter.text}&rdquo;
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  id={`message-${msg.id}`}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {isUser ? (
                    // User Message styling
                    <div className="max-w-[85%] sm:max-w-[70%] bg-indigo-600 text-white p-4 sm:p-5 rounded-2xl rounded-tr-none shadow-md">
                      <div className="flex items-center justify-between gap-4 mb-1.5 text-[11px] text-indigo-100">
                        <span className="font-semibold">You</span>
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <MarkdownRenderer content={msg.content} isUser={true} />
                    </div>
                  ) : (
                    // Gemini Message styling
                    <div className="flex gap-3 max-w-[95%] sm:max-w-[85%]">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 shrink-0 flex items-center justify-center text-white shadow-sm mt-1">
                        <Lightbulb className="w-5 h-5" />
                      </div>

                      <div
                        className={`p-5 rounded-2xl rounded-tl-none shadow-sm flex-1 border transition-colors ${
                          isDark
                            ? 'bg-slate-800 border-slate-700 text-slate-200'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                            <span>Gemini Insights</span>
                            {msg.modelUsed && (
                              <span className="font-mono text-[10px] font-normal lowercase bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded">
                                {msg.modelUsed}
                              </span>
                            )}
                          </h4>

                          <div className="flex items-center gap-2 text-slate-400 text-xs">
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <button
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer p-0.5"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <MarkdownRenderer content={msg.content} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {isGenerating && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 shrink-0 flex items-center justify-center text-white shadow-sm animate-pulse mt-1">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div
                    className={`p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2.5 text-xs border ${
                      isDark
                        ? 'bg-slate-800 border-slate-700 text-slate-400'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Gemini is synthesizing thoughts and formulating insights...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Persistence Error Banner / Retry Dock */}
      {errorMessage && (
        <div className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/60 border-t border-b border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          {lastFailedInput && (
            <button
              onClick={() => handleSendMessage(lastFailedInput)}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition shrink-0 cursor-pointer shadow-xs"
            >
              <RotateCw className="w-3 h-3" />
              <span>Retry Generation</span>
            </button>
          )}
        </div>
      )}

      {/* Bottom Input Dock */}
      <div
        className={`p-4 sm:p-6 border-t shrink-0 transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="max-w-4xl mx-auto">
          {/* Quick Helper Actions */}
          {messages.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 text-xs">
              <span className="text-[11px] text-slate-400 font-medium shrink-0">Suggestions:</span>
              <button
                disabled={isGenerating}
                onClick={() =>
                  handleSendMessage(
                    'Summarize the core takeaways, emotional insights, and action points from our reflection so far.',
                    'summary'
                  )
                }
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition shrink-0 disabled:opacity-50 cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                <FileText className="w-3 h-3 text-emerald-600" />
                <span>Summarize takeaways</span>
              </button>
              <button
                disabled={isGenerating}
                onClick={() =>
                  handleSendMessage(
                    'Brainstorm 3 practical, high-leverage steps I can take next based on what I shared.',
                    'brainstorm'
                  )
                }
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition shrink-0 disabled:opacity-50 cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                <Lightbulb className="w-3 h-3 text-amber-500" />
                <span>Brainstorm 3 actions</span>
              </button>
            </div>
          )}

          <div className="relative">
            <textarea
              ref={textareaRef}
              id="reflection-input-textarea"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              placeholder="Continue your reflection..."
              rows={3}
              className={`w-full border rounded-2xl p-4 pr-16 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none h-24 shadow-inner transition-colors ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500'
                  : 'bg-[#F8FAFC] border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500'
              }`}
            />

            <button
              id="send-reflection-button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isGenerating}
              className="absolute right-4 bottom-4 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
              title="Send reflection (Cmd+Enter)"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">
            Secured with Firebase Auth &amp; Gemini 3.6 Flash &bull; Press Cmd+Enter to send
          </p>
        </div>
      </div>
    </main>
  );
};
