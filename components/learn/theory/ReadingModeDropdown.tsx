'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Palette, Moon, Sun, BookOpen, Tablet, Eclipse, Maximize2 } from 'lucide-react';
import { useReadingModeStore, type ReadingMode } from '@/lib/stores/useReadingModeStore';

const MODE_OPTIONS: { id: ReadingMode; label: string; icon: typeof Moon }[] = [
  { id: 'dark', label: 'DARK', icon: Moon },
  { id: 'light', label: 'LIGHT', icon: Sun },
  { id: 'book', label: 'BOOK', icon: BookOpen },
  { id: 'kindle', label: 'KINDLE', icon: Tablet },
  { id: 'nightowl', label: 'NIGHT OWL', icon: Eclipse },
  { id: 'black', label: 'PITCH BLACK', icon: Moon },
];

export const ReadingModeDropdown = () => {
  const { mode, focusMode, setMode, toggleFocus } = useReadingModeStore();
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState('');

  const close = useCallback(() => { setOpen(false); setFocusedIndex(-1); }, []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, close]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, MODE_OPTIONS.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
    }
    if ((e.key === 'Enter' || e.key === ' ') && focusedIndex >= 0) {
      e.preventDefault();
      const selected = MODE_OPTIONS[focusedIndex];
      setMode(selected.id);
      setAnnouncement(`Reading mode changed to ${selected.label}`);
    }
  };

  const handleModeClick = (id: ReadingMode, label: string) => {
    setMode(id);
    setAnnouncement(`Reading mode changed to ${label}`);
  };

  return (
    <div ref={ref} className="relative" data-reading-mode={focusMode ? mode : 'dark'}>
      <div className="sr-only" aria-live="polite" role="status">{announcement}</div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center gap-1.5 px-2.5 text-xs font-mono transition-colors"
        style={{
          border: '1px solid var(--rm-border)',
          backgroundColor: 'var(--rm-bg-elevated)',
          color: 'var(--rm-text-secondary)',
        }}
        aria-label="Appearance settings"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {(() => {
          const ActiveIcon = MODE_OPTIONS.find((o) => o.id === mode)?.icon ?? Palette;
          return <ActiveIcon className="h-3.5 w-3.5" />;
        })()}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 w-52 shadow-xl"
          style={{
            border: '1px solid var(--rm-border)',
            backgroundColor: 'var(--rm-bg-elevated)',
          }}
          onKeyDown={handleKeyDown}
        >
          <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--rm-border)' }}>
            <span
              className="font-mono text-[9px] tracking-widest uppercase"
              style={{ color: 'var(--rm-text-secondary)' }}
            >
              APPEARANCE
            </span>
          </div>

          <div className="p-1.5" role="radiogroup" aria-label="Reading mode">
            {MODE_OPTIONS.map((opt, index) => {
              const Icon = opt.icon;
              const isActive = mode === opt.id;
              const isFocused = focusedIndex === index;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleModeClick(opt.id, opt.label)}
                  className="w-full flex items-center gap-3 px-2.5 py-2 text-left transition-colors"
                  style={{
                    backgroundColor: isActive
                      ? 'color-mix(in srgb, var(--rm-accent) 15%, transparent)'
                      : isFocused
                        ? 'color-mix(in srgb, var(--rm-text-secondary) 10%, transparent)'
                        : 'transparent',
                    color: isActive ? 'var(--rm-accent)' : 'var(--rm-text-secondary)',
                  }}
                  role="radio"
                  aria-checked={isActive}
                  tabIndex={isFocused || (focusedIndex === -1 && isActive) ? 0 : -1}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="font-mono text-[10px] tracking-widest uppercase">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-1.5" style={{ borderTop: '1px solid var(--rm-border)' }}>
            <button
              type="button"
              onClick={toggleFocus}
              className="w-full flex items-center gap-3 px-2.5 py-2 text-left transition-colors"
              style={{
                backgroundColor: focusMode
                  ? 'color-mix(in srgb, var(--rm-accent) 15%, transparent)'
                  : 'transparent',
                color: focusMode ? 'var(--rm-accent)' : 'var(--rm-text-secondary)',
              }}
              role="switch"
              aria-checked={focusMode}
            >
              <Maximize2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="font-mono text-[10px] tracking-widest uppercase">
                FOCUS MODE
              </span>
              <span
                className="ml-auto w-2 h-2 rounded-full"
                style={{
                  backgroundColor: focusMode ? 'var(--rm-accent)' : 'color-mix(in srgb, var(--rm-text-secondary) 30%, transparent)',
                }}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
