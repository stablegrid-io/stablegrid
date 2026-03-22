'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, Moon, Sun, BookOpen, Maximize2 } from 'lucide-react';
import { useReadingModeStore, type ReadingMode } from '@/lib/stores/useReadingModeStore';

const MODE_OPTIONS: { id: ReadingMode; label: string; icon: typeof Moon; swatch: string }[] = [
  { id: 'dark', label: 'DARK', icon: Moon, swatch: '#141a1e' },
  { id: 'light', label: 'LIGHT', icon: Sun, swatch: '#f8f9fa' },
  { id: 'book', label: 'BOOK', icon: BookOpen, swatch: '#faf7f2' },
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
    <div ref={ref} className="relative">
      <div className="sr-only" aria-live="polite" role="status">{announcement}</div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center gap-1.5 border border-outline-variant/50 bg-surface-container px-2.5 text-xs font-mono text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
        aria-label="Appearance settings"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-50 w-52 border border-outline-variant/30 bg-surface-container shadow-xl"
          onKeyDown={handleKeyDown}
        >
          <div className="px-3 py-2 border-b border-outline-variant/20">
            <span className="font-mono text-[9px] text-on-surface-variant tracking-widest uppercase">
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
                  className={`w-full flex items-center gap-3 px-2.5 py-2 text-left transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : isFocused
                        ? 'bg-surface-container-high text-on-surface'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                  role="radio"
                  aria-checked={isActive}
                  tabIndex={isFocused || (focusedIndex === -1 && isActive) ? 0 : -1}
                >
                  <div
                    className="w-4 h-4 border border-outline-variant/40 flex-shrink-0"
                    style={{ backgroundColor: opt.swatch }}
                  />
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="font-mono text-[10px] tracking-widest uppercase">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-outline-variant/20 p-1.5">
            <button
              type="button"
              onClick={toggleFocus}
              className={`w-full flex items-center gap-3 px-2.5 py-2 text-left transition-colors ${
                focusMode
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
              role="switch"
              aria-checked={focusMode}
            >
              <Maximize2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="font-mono text-[10px] tracking-widest uppercase">
                FOCUS MODE
              </span>
              <span className={`ml-auto w-2 h-2 rounded-full ${focusMode ? 'bg-primary' : 'bg-outline-variant/30'}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
