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
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          backgroundColor: open ? 'var(--rm-bg-elevated)' : 'transparent',
          color: 'var(--rm-text-secondary)',
        }}
        aria-label="Appearance settings"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {(() => {
          const ActiveIcon = MODE_OPTIONS.find((o) => o.id === mode)?.icon ?? Palette;
          return <ActiveIcon className="h-4 w-4" />;
        })()}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden"
          style={{
            border: '1px solid color-mix(in srgb, var(--rm-border) 60%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--rm-bg-elevated) 85%, transparent)',
          }}
          onKeyDown={handleKeyDown}
        >
          <div className="px-3.5 pt-3 pb-1.5">
            <span
              className="text-[10px] font-semibold tracking-wide uppercase"
              style={{ color: 'var(--rm-text-secondary)' }}
            >
              Appearance
            </span>
          </div>

          <div className="px-1.5 pb-1" role="radiogroup" aria-label="Reading mode">
            {MODE_OPTIONS.map((opt, index) => {
              const Icon = opt.icon;
              const isActive = mode === opt.id;
              const isFocused = focusedIndex === index;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleModeClick(opt.id, opt.label)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-150"
                  style={{
                    backgroundColor: isActive
                      ? 'color-mix(in srgb, var(--rm-accent) 12%, transparent)'
                      : isFocused
                        ? 'color-mix(in srgb, var(--rm-text-secondary) 8%, transparent)'
                        : 'transparent',
                    color: isActive ? 'var(--rm-accent)' : 'var(--rm-text-secondary)',
                  }}
                  role="radio"
                  aria-checked={isActive}
                  tabIndex={isFocused || (focusedIndex === -1 && isActive) ? 0 : -1}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-[11px] font-medium tracking-wide">
                    {opt.label.charAt(0) + opt.label.slice(1).toLowerCase()}
                  </span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--rm-accent)' }} />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mx-3 my-0.5 h-px" style={{ backgroundColor: 'var(--rm-border)' }} />

          <div className="px-1.5 py-1">
            <button
              type="button"
              onClick={toggleFocus}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-150"
              style={{
                backgroundColor: focusMode
                  ? 'color-mix(in srgb, var(--rm-accent) 12%, transparent)'
                  : 'transparent',
                color: focusMode ? 'var(--rm-accent)' : 'var(--rm-text-secondary)',
              }}
              role="switch"
              aria-checked={focusMode}
            >
              <Maximize2 className="h-4 w-4 flex-shrink-0" />
              <span className="text-[11px] font-medium tracking-wide">Focus Mode</span>
              <div
                className="ml-auto relative w-8 h-[18px] rounded-full transition-colors duration-200"
                style={{
                  backgroundColor: focusMode
                    ? 'var(--rm-accent)'
                    : 'color-mix(in srgb, var(--rm-text-secondary) 25%, transparent)',
                }}
              >
                <div
                  className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-200"
                  style={{
                    transform: focusMode ? 'translateX(16px)' : 'translateX(2px)',
                  }}
                />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
