import type { JournalEntry, IntelligenceReport } from '../types';

/**
 * Generates a clean Markdown representation of a single reflection or all reflections.
 */
export function generateMarkdown(entries: JournalEntry[], report?: IntelligenceReport | null): string {
  let md = `# ReflectionAI Journal & Intelligence Export\n`;
  md += `*Exported on ${new Date().toLocaleString()}*\n\n`;

  if (report) {
    md += `## 🧠 AI Mood & Productivity Intelligence Summary\n\n`;
    md += `- **Average Mood Score**: ${report.averageMood}/100\n`;
    md += `- **Average Focus Level**: ${report.averageFocus}/100\n`;
    md += `- **Dominant Sentiment**: ${report.dominantSentiment}\n`;
    md += `- **Total Reflections Analyzed**: ${report.totalAnalyzed}\n\n`;
    
    if (report.weeklySynthesis) {
      md += `### Executive Synthesis\n\n${report.weeklySynthesis}\n\n`;
    }

    if (report.actionableInsights && report.actionableInsights.length > 0) {
      md += `### Actionable Productivity Insights\n\n`;
      report.actionableInsights.forEach((insight) => {
        md += `- ${insight}\n`;
      });
      md += `\n`;
    }

    if (report.suggestedMicroHabits && report.suggestedMicroHabits.length > 0) {
      md += `### Suggested Micro-Habits\n\n`;
      report.suggestedMicroHabits.forEach((habit) => {
        md += `- [ ] ${habit}\n`;
      });
      md += `\n`;
    }

    md += `---\n\n`;
  }

  md += `## 📖 Journal Entries (${entries.length} Total)\n\n`;

  entries.forEach((entry, idx) => {
    md += `### ${idx + 1}. ${entry.title || 'Untitled Reflection'}\n`;
    md += `- **Date**: ${new Date(entry.createdAt || entry.updatedAt).toLocaleString()}\n`;
    if (entry.sentiment) md += `- **Sentiment**: ${entry.sentiment}\n`;
    if (entry.moodScore !== undefined) md += `- **Mood Score**: ${entry.moodScore}/100\n`;
    if (entry.focusScore !== undefined) md += `- **Focus Level**: ${entry.focusScore}/100\n`;
    md += `\n`;

    if (entry.messages && entry.messages.length > 0) {
      entry.messages.forEach((msg) => {
        const speaker = msg.role === 'user' ? '👤 **You**' : '✨ **Gemini Assistant**';
        md += `${speaker} *(${new Date(msg.timestamp).toLocaleTimeString()})*:\n\n`;
        md += `${msg.content}\n\n`;
      });
    } else {
      md += `*(No conversational messages recorded)*\n\n`;
    }

    md += `---\n\n`;
  });

  return md;
}

/**
 * Downloads a string as a file in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports entries as formatted JSON backup.
 */
export function exportAsJson(entries: JournalEntry[], report?: IntelligenceReport | null) {
  const payload = {
    app: 'ReflectionAI',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    intelligenceReport: report || null,
    entriesCount: entries.length,
    entries,
  };
  const jsonStr = JSON.stringify(payload, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(jsonStr, `reflection-ai-backup-${dateStr}.json`, 'application/json');
}

/**
 * Exports entries as formatted Markdown.
 */
export function exportAsMarkdown(entries: JournalEntry[], report?: IntelligenceReport | null) {
  const md = generateMarkdown(entries, report);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(md, `reflection-ai-journal-${dateStr}.md`, 'text/markdown');
}

/**
 * Generates printable HTML and triggers print / PDF generation dialog.
 */
export function printFormattedDocument(entries: JournalEntry[], report?: IntelligenceReport | null) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate the printable PDF document.');
    return;
  }

  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ReflectionAI Export - ${dateStr}</title>
  <style>
    @page { margin: 20mm; size: A4; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; padding: 24px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 24px; color: #0f172a; margin-bottom: 4px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    .subtitle { color: #64748b; font-size: 13px; margin-bottom: 24px; }
    .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
    .metric-val { font-size: 20px; font-weight: bold; color: #4f46e5; }
    .metric-lbl { font-size: 11px; color: #64748b; text-transform: uppercase; }
    .section-title { font-size: 18px; font-weight: 600; color: #1e1b4b; margin-top: 28px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .entry-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 18px; page-break-inside: avoid; }
    .entry-title { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
    .entry-meta { font-size: 12px; color: #64748b; margin-bottom: 12px; }
    .msg-box { margin-bottom: 10px; padding: 10px; border-radius: 6px; font-size: 13px; }
    .msg-user { background: #f1f5f9; border-left: 3px solid #6366f1; }
    .msg-ai { background: #faf5ff; border-left: 3px solid #a855f7; }
    .speaker { font-weight: 600; font-size: 12px; margin-bottom: 4px; }
    .user-spk { color: #4f46e5; }
    .ai-spk { color: #9333ea; }
    .print-btn { display: inline-block; padding: 8px 16px; background: #4f46e5; color: white; border-radius: 6px; cursor: pointer; text-decoration: none; font-size: 13px; margin-bottom: 20px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
  <h1>ReflectionAI Journal & Intelligence Dossier</h1>
  <div class="subtitle">Generated on ${dateStr} • Cloud Firestore Isolated Private Storage</div>`;

  if (report) {
    html += `
    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-val">${report.averageMood}/100</div>
        <div class="metric-lbl">Average Mood Score</div>
      </div>
      <div class="metric-card">
        <div class="metric-val">${report.averageFocus}/100</div>
        <div class="metric-lbl">Focus Level</div>
      </div>
      <div class="metric-card">
        <div class="metric-val">${report.dominantSentiment}</div>
        <div class="metric-lbl">Dominant Sentiment</div>
      </div>
    </div>`;

    if (report.weeklySynthesis) {
      html += `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px; color: #1e293b;">AI Executive Synthesis</div>
        <div style="font-size: 13px; color: #334155;">${report.weeklySynthesis.replace(/\n/g, '<br>')}</div>
      </div>`;
    }
  }

  html += `<div class="section-title">Journal History (${entries.length} Reflections)</div>`;

  entries.forEach((entry) => {
    html += `
    <div class="entry-card">
      <div class="entry-title">${entry.title || 'Untitled Reflection'}</div>
      <div class="entry-meta">Created: ${new Date(entry.createdAt || entry.updatedAt).toLocaleString()} • ${entry.messages?.length || 0} interaction turns</div>`;

    if (entry.messages && entry.messages.length > 0) {
      entry.messages.forEach((m) => {
        const isUser = m.role === 'user';
        html += `
        <div class="msg-box ${isUser ? 'msg-user' : 'msg-ai'}">
          <div class="speaker ${isUser ? 'user-spk' : 'ai-spk'}">${isUser ? 'You' : 'Gemini AI Assistant'}</div>
          <div>${m.content.replace(/\n/g, '<br>')}</div>
        </div>`;
      });
    }

    html += `</div>`;
  });

  html += `
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}
