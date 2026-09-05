import React from 'react';
import { X, ShieldCheck, Lock, Key, Server, Database, Check } from 'lucide-react';

interface SecurityBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityBadgeModal: React.FC<SecurityBadgeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-800">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Security &amp; Architecture Audit</h2>
              <p className="text-xs text-slate-500">Owner-Bound Firestore Vault &amp; Zero-Trust AI Standards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-sm">
          {/* 1. Firestore Security Rules */}
          <div>
            <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs uppercase tracking-wider mb-2">
              <Database className="w-4 h-4" />
              <span>Strict Firestore Rules (Data Isolation)</span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Only requests bearing an authenticated Firebase ID token matching the document&apos;s path UID can read or write data:
            </p>
            <div className="bg-[#1E293B] p-4 rounded-xl font-mono text-[11px] text-emerald-300 leading-relaxed overflow-x-auto shadow-inner">
              <pre>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}</pre>
            </div>
          </div>

          {/* 2. Secret Hygiene & Backend Proxy */}
          <div>
            <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs uppercase tracking-wider mb-2">
              <Key className="w-4 h-4" />
              <span>Zero-Hardcoded Secrets (Google Secret Manager)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              The <code className="text-indigo-700 bg-indigo-50 font-mono px-1.5 py-0.5 rounded border border-indigo-100">GEMINI_API_KEY</code> is never exposed to the client bundle.
              All multi-turn reflections and summaries route through the Express backend proxy (<code className="text-indigo-700 bg-indigo-50 font-mono px-1.5 py-0.5 rounded border border-indigo-100">/api/gemini/reflect</code>) which resolves credentials securely from environment variables / Secret Manager.
            </p>
          </div>

          {/* 3. Model Fallback Ladder Protocol */}
          <div>
            <div className="flex items-center gap-2 text-indigo-700 font-semibold text-xs uppercase tracking-wider mb-2">
              <Server className="w-4 h-4" />
              <span>Resilient Gemini Fallback Ladder</span>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              High-availability protocol catches transient 503/429 errors and falls back automatically:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-mono text-slate-800">1. gemini-3.6-flash (Primary)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="font-mono text-slate-800">2. gemini-3.1-flash-lite</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="font-mono text-slate-800">3. gemini-flash-latest</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="font-mono text-slate-800">4. gemini-3.7-flash (Deep)</span>
              </div>
            </div>
          </div>

          {/* 4. OWASP Top 10 Safeguards */}
          <div>
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs uppercase tracking-wider mb-2">
              <Lock className="w-4 h-4" />
              <span>OWASP Top 10 &amp; LLM Application Defenses</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>A01 Broken Access Control:</strong> Strict auth token validation &amp; owner-bound path checks.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>A03 Injection &amp; LLM01 Indirect Injection:</strong> Data inputs isolated as user contents, sanitized before database write.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>LLM02 Sensitive Information Exposure:</strong> User entries never shared between users or pooled into public indexes.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
