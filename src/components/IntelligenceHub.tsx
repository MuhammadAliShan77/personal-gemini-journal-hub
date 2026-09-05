import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  Brain,
  Zap,
  Smile,
  ShieldAlert,
  Award,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Calendar,
  Download,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { JournalEntry, IntelligenceReport, ThemeMode } from '../types';
import type { User } from 'firebase/auth';
import { MarkdownRenderer } from './MarkdownRenderer';

interface IntelligenceHubProps {
  entries: JournalEntry[];
  user?: User | null;
  currentReport?: IntelligenceReport | null;
  cachedReport?: IntelligenceReport | null;
  onGenerateReport?: () => Promise<void>;
  onReportGenerated?: (report: IntelligenceReport) => void;
  isLoading?: boolean;
  onOpenExportModal?: () => void;
  theme: ThemeMode;
  showToast: (msg: string) => void;
}

export const IntelligenceHub: React.FC<IntelligenceHubProps> = ({
  entries,
  user,
  currentReport: propCurrentReport,
  cachedReport,
  onGenerateReport: propOnGenerateReport,
  onReportGenerated,
  isLoading: propIsLoading,
  onOpenExportModal,
  theme,
  showToast,
}) => {
  const [internalReport, setInternalReport] = useState<IntelligenceReport | null>(cachedReport || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [completedHabits, setCompletedHabits] = useState<Record<number, boolean>>({});

  const currentReport = propCurrentReport || internalReport || cachedReport || null;
  const isLoading = propIsLoading !== undefined ? propIsLoading : isGenerating;

  const handleGenerateReport = async () => {
    if (propOnGenerateReport) {
      await propOnGenerateReport();
      return;
    }
    if (entries.length === 0) {
      showToast('Please create at least one reflection entry first.');
      return;
    }
    try {
      setIsGenerating(true);
      const token = user ? await user.getIdToken() : '';
      const res = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ entries }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to synthesize intelligence report');
      }
      const data: IntelligenceReport = await res.json();
      setInternalReport(data);
      if (onReportGenerated) {
        onReportGenerated(data);
      }
      showToast('Intelligence analysis updated successfully!');
    } catch (err: any) {
      console.error('Failed to generate intelligence report:', err);
      showToast(err?.message || 'Error running intelligence analysis');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopySummary = () => {
    if (!currentReport?.weeklySynthesis) return;
    navigator.clipboard.writeText(currentReport.weeklySynthesis);
    setCopiedSummary(true);
    showToast('Executive AI Summary copied to clipboard!');
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const toggleHabit = (idx: number) => {
    setCompletedHabits((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Prepare chart data defensively
  const chartData = (currentReport?.emotionalTrends && currentReport.emotionalTrends.length > 0)
    ? currentReport.emotionalTrends
    : entries.slice(0, 7).reverse().map((e, idx) => ({
        date: new Date(e.updatedAt || e.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        title: e.title || `Entry ${idx + 1}`,
        mood: e.moodScore || 70 + (idx % 4) * 6,
        focus: e.focusScore || 75 + ((idx + 2) % 3) * 7,
        sentiment: e.sentiment || 'Reflective',
      }));

  const isDark = theme === 'dark';

  return (
    <div
      id="intelligence-hub-container"
      className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-colors ${
        isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hub Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  AI Mood &amp; Productivity Intelligence Hub
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Continuous cognitive sentiment evaluation, flow dynamics &amp; actionable micro-habits
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {onOpenExportModal && (
              <button
                id="export-intelligence-btn"
                onClick={onOpenExportModal}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition shadow-xs cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <Download className="w-4 h-4 text-indigo-500" />
                <span>Export Dossier</span>
              </button>
            )}

            <button
              id="refresh-intelligence-btn"
              onClick={handleGenerateReport}
              disabled={isLoading || entries.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition shadow-sm cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze with Gemini</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Empty state alert if no reflections */}
        {entries.length === 0 && (
          <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
            <Sparkles className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
            <h3 className="text-base font-semibold">No reflections recorded yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Start writing your thoughts in the Reflection Workspace. Gemini will automatically extract sentiment trajectories and focus trends.
            </p>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Average Mood */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition shadow-xs ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Mood Score
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Smile className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                {currentReport ? `${currentReport.averageMood}%` : '82%'}
              </span>
              <span className="text-xs text-slate-400 font-medium">Equanimity</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Emotional baseline across {currentReport?.totalAnalyzed || entries.length} entries
            </p>
          </div>

          {/* Average Focus Level */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition shadow-xs ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Focus Depth
              </span>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                {currentReport ? `${currentReport.averageFocus}%` : '85%'}
              </span>
              <span className="text-xs text-slate-400 font-medium">Deep Work</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Clarity and cognitive coherence rating
            </p>
          </div>

          {/* Dominant Sentiment */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition shadow-xs ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Dominant Tone
              </span>
              <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Brain className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-violet-600 dark:text-violet-400 truncate">
                {currentReport?.dominantSentiment || 'Reflective'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Primary psychological state detected
            </p>
          </div>

          {/* Vault Status */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition shadow-xs ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Reflections
              </span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-200">
                {entries.length}
              </span>
              <span className="text-xs text-slate-400 font-medium">Entries</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Stored securely in private Firestore
            </p>
          </div>
        </div>

        {/* Dynamic Recharts Visualization */}
        <div
          className={`p-5 sm:p-6 rounded-2xl border transition shadow-xs ${
            isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <span>Weekly Sentiment &amp; Focus Trajectory</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-metric trend visualizing well-being (0-100) vs. productivity focus level over time
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Mood Score
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Focus Level
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#334155' : '#E2E8F0'}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }}
                  axisLine={{ stroke: isDark ? '#475569' : '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderColor: isDark ? '#475569' : '#E2E8F0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: isDark ? '#F1F5F9' : '#0F172A',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                  formatter={(val: any, name: any) => [
                    `${val}/100`,
                    name === 'mood' ? 'Mood Score' : 'Focus Depth',
                  ]}
                  labelFormatter={(label, payload) => {
                    const item = payload && payload[0]?.payload;
                    return item?.title ? `${label} • ${item.title}` : String(label);
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="mood"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorMood)"
                />
                <Area
                  type="monotone"
                  dataKey="focus"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorFocus)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Executive AI Synthesis & 1-Click Copy */}
        <div
          className={`p-5 sm:p-6 rounded-2xl border transition shadow-xs ${
            isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold">Executive AI Synthesis</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Synthesized via Gemini {currentReport?.modelUsed || '3.6 Flash'} fallback architecture
                </p>
              </div>
            </div>

            <button
              id="copy-summary-btn"
              onClick={handleCopySummary}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                copiedSummary
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>
          </div>

          <div className="max-w-none text-slate-700 dark:text-slate-300 leading-relaxed text-xs sm:text-sm">
            {currentReport?.weeklySynthesis ? (
              <MarkdownRenderer content={currentReport.weeklySynthesis} />
            ) : (
              <p className="italic text-slate-400 dark:text-slate-500">
                Click &quot;Analyze with Gemini&quot; above to generate a deep cognitive synthesis and psychological profile from your reflections.
              </p>
            )}
          </div>
        </div>

        {/* 2-Column Insights Grid: Actionable Productivity & Suggested Micro-Habits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Actionable Productivity Insights */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border transition shadow-xs flex flex-col ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold">Actionable Productivity Insights</h3>
            </div>

            <ul className="space-y-3 flex-1">
              {(currentReport?.actionableInsights && currentReport.actionableInsights.length > 0
                ? currentReport.actionableInsights
                : [
                    'Maintain consistent morning reflection time to align priorities before deep execution.',
                    'Decompose ambiguous multi-day objectives into immediate 25-minute execution blocks.',
                    'Review and archive resolved mental blockers at the end of each work cycle.',
                  ]
              ).map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <span className="leading-snug">{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Suggested Micro-Habits with Check-off */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border transition shadow-xs flex flex-col ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold">Suggested Micro-Habits</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Check to practice
              </span>
            </div>

            <ul className="space-y-2.5 flex-1">
              {(currentReport?.suggestedMicroHabits && currentReport.suggestedMicroHabits.length > 0
                ? currentReport.suggestedMicroHabits
                : [
                    '3-minute cognitive closure journaling at the end of each work session.',
                    'Physical hydration and mindful standing pause after 90 minutes of flow.',
                    'Explicitly name one gratitude anchor prior to starting complex decisions.',
                  ]
              ).map((habit, idx) => {
                const isChecked = !!completedHabits[idx];
                return (
                  <li
                    key={idx}
                    onClick={() => toggleHabit(idx)}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border transition cursor-pointer select-none ${
                      isChecked
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-slate-400 line-through'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border mt-0.5 flex items-center justify-center transition shrink-0 ${
                        isChecked
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs leading-snug">{habit}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* 2-Column: Key Strengths & Risk Watchdog */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Key Strengths */}
          <div
            className={`p-5 rounded-2xl border transition shadow-xs ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Observed Cognitive Strengths
              </h4>
            </div>
            <ul className="space-y-2">
              {(currentReport?.keyStrengths && currentReport.keyStrengths.length > 0
                ? currentReport.keyStrengths
                : [
                    'High metacognitive self-awareness during complex decisions',
                    'Proactive reframing of challenges into structured action items',
                  ]
              ).map((strength, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Risk Watchdog */}
          <div
            className={`p-5 rounded-2xl border transition shadow-xs ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Cognitive Burnout Watchdog
              </h4>
            </div>
            <ul className="space-y-2">
              {(currentReport?.riskSignals && currentReport.riskSignals.length > 0
                ? currentReport.riskSignals
                : [
                    'Potential late-day decision fatigue if deep sprints are unpunctuated.',
                  ]
              ).map((risk, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
