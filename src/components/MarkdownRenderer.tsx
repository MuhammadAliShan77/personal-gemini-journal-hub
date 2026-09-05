import React from 'react';
import Markdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  isUser = false,
}) => {
  if (!content) return null;

  if (isUser) {
    return (
      <div className={`markdown-body text-sm leading-relaxed ${className}`}>
        <Markdown
          components={{
            p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
            code: ({ children }) => (
              <code className="bg-indigo-700/60 px-1.5 py-0.5 rounded text-[12px] font-mono">
                {children}
              </code>
            ),
          }}
        >
          {content}
        </Markdown>
      </div>
    );
  }

  return (
    <div className={`markdown-body text-sm leading-relaxed ${className}`}>
      <Markdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1.5 tracking-tight border-b pb-1 border-slate-200 dark:border-slate-800">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1.5 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mt-2.5 mb-1">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-800 dark:text-slate-200">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-700 dark:text-slate-300">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-5 mb-2.5 space-y-1 text-slate-800 dark:text-slate-200">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-5 mb-2.5 space-y-1 text-slate-800 dark:text-slate-200">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed pl-0.5">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-indigo-500 pl-3.5 py-1 my-2 bg-indigo-50/50 dark:bg-indigo-950/30 text-slate-700 dark:text-slate-300 italic rounded-r-lg text-xs sm:text-sm">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-slate-100 dark:bg-slate-700/80 px-1.5 py-0.5 rounded text-[12px] font-mono text-indigo-600 dark:text-indigo-300 font-medium">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl overflow-x-auto text-xs my-2.5 font-mono border border-slate-800 shadow-inner">
              {children}
            </pre>
          ),
          hr: () => <hr className="my-3 border-slate-200 dark:border-slate-700" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200">
              {children}
            </thead>
          ),
          tbody: ({ children }) => <tbody className="divide-y divide-slate-200 dark:divide-slate-800">{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => <th className="p-2 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="p-2 text-slate-700 dark:text-slate-300">{children}</td>,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};
