import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Lock,
  Brain,
  ArrowRight,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface LandingPageProps {
  onSignInSuccess?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignInSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);
      await signInWithGoogle();
      if (onSignInSuccess) onSignInSuccess();
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in window was closed. Please try again.');
      } else if (err?.code === 'auth/popup-blocked') {
        setAuthError('Popup was blocked by your browser. Please allow popups for this site and retry.');
      } else {
        setAuthError(err?.message || 'Failed to authenticate with Google. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Banner / Navigation */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900">ReflectionAI</span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-0.5 rounded">
                Gemini 3.6 Flash
              </span>
            </div>
          </div>

          <button
            id="nav-signin-button"
            onClick={handleSignIn}
            disabled={isLoading}
            className="flex items-center gap-2 text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg transition shadow-xs hover:shadow-sm disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            Sign In with Google
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-16 text-center max-w-4xl mx-auto">
        {authError && (
          <div className="w-full max-w-lg mb-8 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 text-left shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication Error</p>
              <p className="mt-0.5 text-xs text-rose-700">{authError}</p>
            </div>
          </div>
        )}

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-700 mb-8 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-medium">Strict User-Isolated Cloud Firestore Vault &amp; OWASP Defenses</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight max-w-3xl">
          A Private Sanctuary for Your{' '}
          <span className="text-indigo-600">
            Reflections &amp; Insights
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl leading-relaxed">
          Converse multi-turn with Gemini 3.6 Flash to explore thoughts, brainstorm creative
          breakthroughs, and synthesize daily reflections. Fully isolated and saved to your personal
          Cloud Firestore collection.
        </p>

        {/* Primary CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <button
            id="hero-signin-cta"
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-3 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl transition shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Continue with Google</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Security and Trust Indicators */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full max-w-4xl">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition shadow-xs hover:shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">User-Isolated Storage</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Enforced by strict Firestore Security Rules. Only your authenticated Firebase UID can
              read or write your journal interactions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition shadow-xs hover:shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-4 text-violet-600">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Gemini 3.6 Flash Engine</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Multi-turn conversational reflections, brainstorming paths, and automated synthesis
              with resilient automated fallback recovery.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition shadow-xs hover:shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4 text-emerald-600">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Cloud Firestore Realtime</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Real-time synchronization across devices, zero-crash payload sanitation, and
              instant searchable reflection history.
            </p>
          </div>
        </div>

        {/* Feature Checkpoints */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>No password handling (Federated Google Auth)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Zero hardcoded API keys (Secret Manager / Backend)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>OWASP Top 10 &amp; LLM Threat Mitigated</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <p>ReflectionAI &bull; Private Journaling Workspace &bull; Cloud Run &amp; Firebase</p>
      </footer>
    </div>
  );
};
