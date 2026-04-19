'use client';

import { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { BookOpen, AlertTriangle, Lightbulb, Code2, Lock, ChevronDown, Copy, Check, CheckCircle2, Download } from 'lucide-react';
import { getCheatSheets, getCheatSheet } from '@/data/learn/cheat-sheets';
import type { CheatSheet, CheatSheetPattern } from '@/data/learn/cheat-sheets';
import { useReadingModeStore } from '@/lib/stores/useReadingModeStore';
import { CodeBlock } from '@/components/learn/CodeBlock';

const ReadingModeDropdown = dynamic(
  () => import('@/components/learn/theory/ReadingModeDropdown').then((m) => m.ReadingModeDropdown),
  { ssr: false }
);

/* ── Config ────────────────────────────────────────────────────────────────── */

const TRACKS = [
  { id: 'junior', label: 'Junior', color: '#99f7ff', rgb: '153,247,255' },
  { id: 'mid', label: 'Mid', color: '#ffc965', rgb: '255,201,101' },
  { id: 'senior', label: 'Senior', color: '#ff716c', rgb: '255,113,108' },
];

const TOPICS = [
  { id: 'pyspark', label: 'PySpark' },
  { id: 'fabric', label: 'Fabric' },
  { id: 'airflow', label: 'Airflow' },
];

const SECTION_ICON: Record<string, typeof BookOpen> = {
  concepts: BookOpen,
  patterns: Code2,
  warnings: AlertTriangle,
  insights: Lightbulb,
};

const SECTION_LABEL: Record<string, string> = {
  concepts: 'Core Concepts',
  patterns: 'Key Patterns',
  warnings: 'Watch Out',
  insights: 'Insights',
};

/* ── Sidebar ───────────────────────────────────────────────────────────────── */

function CheatSheetSidebar({
  selectedTopic, setSelectedTopic,
  selectedTrack, setSelectedTrack,
  activeModuleId, onSelect,
}: {
  selectedTopic: string; setSelectedTopic: (t: string) => void;
  selectedTrack: string; setSelectedTrack: (t: string) => void;
  activeModuleId: string | null;
  onSelect: (moduleId: string) => void;
}) {
  const sheets = useMemo(() => getCheatSheets(selectedTopic, selectedTrack), [selectedTopic, selectedTrack]);
  const track = TRACKS.find((t) => t.id === selectedTrack) ?? TRACKS[0];
  const unlockedIds = new Set(sheets.map((s) => s.moduleId));

  const totalModules = 10;
  const prefix = selectedTrack === 'senior' ? 'PX' : selectedTrack === 'mid' ? 'PM' : 'PS';
  const slots = Array.from({ length: totalModules }, (_, i) => {
    const moduleId = `module-${prefix}${i + 1}`;
    return { moduleId, sheet: sheets.find((s) => s.moduleId === moduleId), index: i };
  });

  return (
    <div className="flex h-full flex-col bg-surface-container">
      {/* Header */}
      <div className="border-b border-outline-variant/30 px-4 py-4">
        <div className="text-sm font-bold text-on-surface mb-1">Cheat Sheets</div>
        <div className="text-[10px] text-on-surface-variant uppercase tracking-wider">
          {sheets.length} of {totalModules} unlocked
        </div>

        {/* Topic dropdown */}
        <div className="mt-3">
          <div className="relative">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value as string)}
              className="w-full appearance-none rounded-[10px] px-3 py-2 pr-8 text-[12px] font-medium cursor-pointer outline-none transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              {TOPICS.map((topic) => (
                <option key={topic.id} value={topic.id} style={{ backgroundColor: '#111416', color: '#f0f0f3' }}>
                  {topic.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: 'rgba(255,255,255,0.3)' }} />
          </div>
        </div>

        {/* Track dropdown */}
        <div className="mt-2">
          <div className="relative">
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value as string)}
              className="w-full appearance-none rounded-[10px] px-3 py-2 pr-8 text-[12px] font-medium cursor-pointer outline-none transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: TRACKS.find((t) => t.id === selectedTrack)?.color ?? 'rgba(255,255,255,0.8)',
              }}
            >
              {TRACKS.map((t) => (
                <option key={t.id} value={t.id} style={{ backgroundColor: '#111416', color: '#f0f0f3' }}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: 'rgba(255,255,255,0.3)' }} />
          </div>
        </div>
      </div>

      {/* Module list */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 pt-1">
        <div className="space-y-1">
          {slots.map(({ moduleId, sheet, index }) => {
            const isUnlocked = unlockedIds.has(moduleId);
            const isActive = moduleId === activeModuleId;

            return (
              <button
                key={moduleId}
                type="button"
                onClick={() => isUnlocked && onSelect(moduleId)}
                disabled={!isUnlocked}
                className={`w-full border px-3 py-2.5 text-left transition-colors ${
                  isActive
                    ? 'border-white/[0.12] bg-white/[0.06]'
                    : !isUnlocked
                      ? 'cursor-not-allowed border-transparent opacity-40'
                      : 'border-transparent hover:border-outline-variant/30 hover:bg-surface-container-high cursor-pointer'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                      !isUnlocked
                        ? 'bg-surface-container-highest text-on-surface-variant'
                        : isActive
                          ? 'bg-on-surface text-surface'
                          : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    {isUnlocked ? index + 1 : <Lock className="h-3 w-3" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-sm leading-5 truncate ${
                        isActive ? 'font-semibold text-on-surface' : isUnlocked ? 'text-on-surface-variant' : 'text-on-surface-variant/40'
                      }`}
                    >
                      {sheet ? sheet.title : `Module ${prefix}${index + 1}`}
                    </div>
                    {sheet && (
                      <div className="text-[10px] text-on-surface-variant/50 mt-0.5">
                        {sheet.sections.length} sections
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Content reader ────────────────────────────────────────────────────────── */

function CheatSheetContent({ sheet }: { sheet: CheatSheet }) {
  const readingMode = useReadingModeStore((s) => s.mode);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  return (
    <div
      data-reading-mode={readingMode}
      className="flex-1 overflow-y-auto transition-colors duration-300"
      style={{ backgroundColor: 'var(--rm-bg)' }}
    >
      <div
        className="mx-auto px-6 sm:px-10 py-10 lg:py-14"
        style={{ maxWidth: 'var(--rm-content-max-width, 720px)' }}
      >
        {/* Header */}
        <div className="mb-10">
          <p
            className="font-mono text-[10px] font-bold tracking-widest uppercase mb-3"
            style={{ color: 'var(--rm-text-secondary)' }}
          >
            {sheet.topic.toUpperCase()} · {sheet.track.toUpperCase()} TRACK
          </p>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-3"
            style={{ color: 'var(--rm-text-heading)', fontFamily: 'var(--rm-font-heading)' }}
          >
            {sheet.title}
          </h1>
          <p className="text-sm" style={{ color: 'var(--rm-text-secondary)' }}>
            {sheet.lessonCount} lessons · {Math.round(sheet.estimatedMinutes / 60)}h {sheet.estimatedMinutes % 60}m · Cheat Sheet
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {sheet.sections.map((section) => {
            const Icon = SECTION_ICON[section.type] ?? BookOpen;
            const label = SECTION_LABEL[section.type] ?? section.title;

            return (
              <section key={section.type}>
                <div className="flex items-center gap-2.5 mb-6">
                  <Icon className="h-4 w-4" style={{ color: 'var(--rm-text-secondary)' }} />
                  <h2
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--rm-text-heading)', fontFamily: 'var(--rm-font-heading)' }}
                  >
                    {label}
                  </h2>
                </div>

                {section.type === 'patterns' ? (
                  <div className="space-y-8">
                    {(section.items as CheatSheetPattern[]).map((item, i) => (
                      <div key={i}>
                        <p className="text-sm font-medium mb-3" style={{ color: 'var(--rm-text)', fontFamily: 'var(--rm-font)' }}>
                          {item.label}
                        </p>
                        <div className="relative group">
                          <CodeBlock code={item.code} label="" />
                          <button
                            type="button"
                            onClick={() => handleCopy(item.code, `p-${i}`)}
                            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: copiedId === `p-${i}` ? 'rgb(34,197,94)' : 'rgba(255,255,255,0.5)',
                            }}
                          >
                            {copiedId === `p-${i}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            {copiedId === `p-${i}` ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : section.type === 'warnings' ? (
                  <div className="space-y-4">
                    {(section.items as string[]).map((item, i) => (
                      <div
                        key={i}
                        className="rounded-lg border-l-4 px-5 py-4"
                        style={{ borderColor: 'var(--rm-callout-warning-border, rgba(255,201,101,0.5))', backgroundColor: 'var(--rm-bg-elevated)' }}
                      >
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--rm-text)', fontFamily: 'var(--rm-font)', lineHeight: 'var(--rm-line-height)' }}>
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : section.type === 'insights' ? (
                  <div className="space-y-4">
                    {(section.items as string[]).map((item, i) => (
                      <div
                        key={i}
                        className="rounded-lg border-l-4 px-5 py-4"
                        style={{ borderColor: 'var(--rm-callout-tip-border, rgba(34,197,94,0.5))', backgroundColor: 'var(--rm-bg-elevated)' }}
                      >
                        <div className="flex items-start gap-2.5">
                          <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--rm-text-secondary)' }} />
                          <p className="text-sm leading-relaxed" style={{ color: 'var(--rm-text)', fontFamily: 'var(--rm-font)', lineHeight: 'var(--rm-line-height)' }}>
                            {item}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(section.items as string[]).map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: 'var(--rm-text-secondary)' }} />
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--rm-text)', fontFamily: 'var(--rm-font)', lineHeight: 'var(--rm-line-height)' }}>
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8" style={{ borderTop: '1px solid var(--rm-border)' }}>
          <p className="font-mono text-[10px] tracking-widest uppercase text-center" style={{ color: 'var(--rm-text-secondary)' }}>
            StableGrid · Module {sheet.moduleId.replace('module-', '')} Cheat Sheet · {sheet.topic} {sheet.track} Track
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Empty state ───────────────────────────────────────────────────────────── */

function EmptyContent() {
  const readingMode = useReadingModeStore((s) => s.mode);

  return (
    <div
      data-reading-mode={readingMode}
      className="flex-1 flex items-center justify-center transition-colors duration-300"
      style={{ backgroundColor: 'var(--rm-bg)' }}
    >
      <div className="text-center">
        <BookOpen className="h-10 w-10 mx-auto mb-4" style={{ color: 'var(--rm-text-secondary)', opacity: 0.3 }} />
        <p className="text-sm" style={{ color: 'var(--rm-text-secondary)' }}>
          Select a module from the sidebar
        </p>
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────────── */

export default function CheatSheetsPage() {
  const readingMode = useReadingModeStore((s) => s.mode);
  const [selectedTopic, setSelectedTopic] = useState('pyspark');
  const [selectedTrack, setSelectedTrack] = useState('junior');

  // Auto-select first available sheet
  const sheets = useMemo(() => getCheatSheets(selectedTopic, selectedTrack), [selectedTopic, selectedTrack]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(sheets[0]?.moduleId ?? null);

  // Update active when filters change
  const handleTopicChange = useCallback((t: string) => {
    setSelectedTopic(t);
    const newSheets = getCheatSheets(t, selectedTrack);
    setActiveModuleId(newSheets[0]?.moduleId ?? null);
  }, [selectedTrack]);

  const handleTrackChange = useCallback((t: string) => {
    setSelectedTrack(t);
    const newSheets = getCheatSheets(selectedTopic, t);
    setActiveModuleId(newSheets[0]?.moduleId ?? null);
  }, [selectedTopic]);

  const activeSheet = activeModuleId ? getCheatSheet(activeModuleId) : null;

  const handleExportPDF = useCallback((sheet: CheatSheet) => {
    const win = window.open('', '_blank');
    if (!win) return;

    const sectionsHtml = sheet.sections.map((section) => {
      const label = SECTION_LABEL[section.type] ?? section.title;
      let itemsHtml = '';

      if (section.type === 'patterns') {
        itemsHtml = (section.items as CheatSheetPattern[]).map((item) =>
          `<div style="margin-bottom:16px;">
            <p style="font-weight:600;margin-bottom:6px;">${item.label}</p>
            <pre style="background:#1a1a2e;color:#e2e8f0;padding:12px 16px;border-radius:8px;font-size:12px;overflow-x:auto;white-space:pre-wrap;font-family:'JetBrains Mono',monospace;">${item.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </div>`
        ).join('');
      } else if (section.type === 'warnings') {
        itemsHtml = (section.items as string[]).map((item) =>
          `<div style="border-left:3px solid #ffc965;padding:10px 16px;margin-bottom:8px;background:rgba(255,201,101,0.05);border-radius:4px;">
            <p style="font-size:13px;line-height:1.7;">${item}</p>
          </div>`
        ).join('');
      } else if (section.type === 'insights') {
        itemsHtml = (section.items as string[]).map((item) =>
          `<div style="border-left:3px solid #34c759;padding:10px 16px;margin-bottom:8px;background:rgba(52,199,89,0.05);border-radius:4px;">
            <p style="font-size:13px;line-height:1.7;">${item}</p>
          </div>`
        ).join('');
      } else {
        itemsHtml = '<ul style="padding-left:20px;">' +
          (section.items as string[]).map((item) =>
            `<li style="font-size:13px;line-height:1.7;margin-bottom:6px;">${item}</li>`
          ).join('') + '</ul>';
      }

      return `<div style="margin-bottom:32px;">
        <h2 style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#666;margin-bottom:12px;">${label}</h2>
        ${itemsHtml}
      </div>`;
    }).join('');

    win.document.write(`<!DOCTYPE html><html><head>
      <title>${sheet.title} — Cheat Sheet</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; max-width: 700px; margin: 0 auto; padding: 40px 24px; color: #1a1a2e; }
        @media print {
          body { padding: 20px; }
          pre { break-inside: avoid; }
        }
      </style>
    </head><body>
      <div style="margin-bottom:32px;padding-bottom:16px;border-bottom:2px solid #eee;">
        <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#999;margin-bottom:6px;">
          STABLEGRID · ${sheet.topic.toUpperCase()} ${sheet.track.toUpperCase()} TRACK
        </p>
        <h1 style="font-size:28px;font-weight:700;margin-bottom:4px;">${sheet.title}</h1>
        <p style="font-size:12px;color:#888;">Cheat Sheet · ${sheet.lessonCount} lessons · ${Math.round(sheet.estimatedMinutes / 60)}h ${sheet.estimatedMinutes % 60}m</p>
      </div>
      ${sectionsHtml}
      <div style="margin-top:40px;padding-top:12px;border-top:1px solid #eee;text-align:center;">
        <p style="font-size:9px;text-transform:uppercase;letter-spacing:0.15em;color:#bbb;">
          StableGrid · Module ${sheet.moduleId.replace('module-', '')} Cheat Sheet · ${new Date().getFullYear()}
        </p>
      </div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div
        className="w-[260px] shrink-0 border-r overflow-hidden hidden lg:block"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <CheatSheetSidebar
          selectedTopic={selectedTopic}
          setSelectedTopic={handleTopicChange}
          selectedTrack={selectedTrack}
          setSelectedTrack={handleTrackChange}
          activeModuleId={activeModuleId}
          onSelect={setActiveModuleId}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <div
          data-reading-mode={readingMode}
          className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3"
          style={{ backgroundColor: 'var(--rm-bg)', borderBottom: '1px solid var(--rm-border)' }}
        >
          <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'var(--rm-text-secondary)' }}>
            {activeSheet ? `${activeSheet.title} · Cheat Sheet` : 'Cheat Sheets'}
          </span>
          <div className="flex items-center gap-2">
            {activeSheet && (
              <button
                type="button"
                onClick={() => handleExportPDF(activeSheet)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] text-[11px] font-medium transition-all duration-200 cursor-pointer"
                style={{
                  border: '1px solid var(--rm-border)',
                  color: 'var(--rm-text-secondary)',
                  backgroundColor: 'var(--rm-bg-elevated)',
                }}
              >
                <Download className="h-3 w-3" />
                PDF
              </button>
            )}
            <ReadingModeDropdown />
          </div>
        </div>

        {/* Content */}
        {activeSheet ? (
          <CheatSheetContent sheet={activeSheet} />
        ) : (
          <EmptyContent />
        )}
      </div>
    </div>
  );
}
