'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  Database,
  Home,
  ShieldAlert,
  Swords,
  WalletCards
} from 'lucide-react';
import { motion } from 'framer-motion';
import { UserMenu } from '@/components/layout/UserMenu';
import { HomeSearch } from '@/components/home/home/HomeSearch';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { learnSearchItems } from '@/lib/learn-search';
import { learnTopics } from '@/data/learn';
import { createClient } from '@/lib/supabase/client';
import type { Topic } from '@/types/progress';

interface LearnNavProgress {
  theory: number;
  functions: number;
}

interface LearnTopicMeta {
  icon: string;
  color: string;
  rgb: string;
}

const LEARN_TOPIC_META: Record<string, LearnTopicMeta> = {
  pyspark: { icon: '⚡', color: '#f59e0b', rgb: '245,158,11' },
  sql: { icon: '🗄️', color: '#6b7fff', rgb: '107,127,255' },
  python: { icon: '🐍', color: '#10b981', rgb: '16,185,129' },
  fabric: { icon: '🏗️', color: '#06b6d4', rgb: '6,182,212' }
};

const defaultLearnProgress = learnTopics.reduce<Record<string, LearnNavProgress>>(
  (accumulator, topic) => {
    accumulator[topic.id] = { theory: 0, functions: 0 };
    return accumulator;
  },
  {}
);

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/learn', icon: BookOpen, label: 'Learn' },
  {
    href: '/flashcards',
    icon: Swords,
    label: 'Practice',
    matchPrefixes: ['/flashcards', '/hub', '/missions', '/practice'],
    children: [
      { href: '/flashcards', icon: WalletCards, label: 'Flashcards' },
      { href: '/missions', icon: ShieldAlert, label: 'Missions' }
    ]
  },
  { href: '/progress', icon: BarChart3, label: 'Progress' }
];

const shouldHideNav = (pathname?: string | null, isAuthenticated?: boolean) => {
  if (!pathname) return false;
  if (pathname.startsWith('/practice/') && pathname !== '/practice/setup') {
    return true;
  }
  if (pathname === '/') {
    return !isAuthenticated;
  }
  return ['/login', '/signup', '/reset-password', '/update-password'].includes(pathname);
};

export const TopNav = () => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const hideNav = shouldHideNav(pathname, Boolean(user));
  const [learnMenuOpen, setLearnMenuOpen] = useState(false);
  const [practiceMenuOpen, setPracticeMenuOpen] = useState(false);
  const [learnProgress, setLearnProgress] =
    useState<Record<string, LearnNavProgress>>(defaultLearnProgress);
  const learnMenuRef = useRef<HTMLDivElement | null>(null);
  const practiceMenuRef = useRef<HTMLDivElement | null>(null);

  const isLearnActive =
    pathname === '/learn' || pathname?.startsWith('/learn/');

  useEffect(() => {
    if (!learnMenuOpen && !practiceMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInLearn = learnMenuRef.current?.contains(target);
      const clickedInPractice = practiceMenuRef.current?.contains(target);
      if (!clickedInLearn && !clickedInPractice) {
        setLearnMenuOpen(false);
        setPracticeMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLearnMenuOpen(false);
        setPracticeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [learnMenuOpen, practiceMenuOpen]);

  useEffect(() => {
    if (!learnMenuOpen || !user?.id) return;

    let cancelled = false;

    const loadProgress = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('topic_progress')
          .select(
            'topic,theory_chapters_completed,theory_chapters_total,functions_viewed,functions_total'
          )
          .eq('user_id', user.id);

        if (error || !data || cancelled) return;

        const nextProgress = { ...defaultLearnProgress };
        for (const row of data) {
          const topic = row.topic as Topic;
          if (!nextProgress[topic]) continue;

          const chapterTotal =
            Number(row.theory_chapters_total ?? 0) ||
            learnTopics.find((entry) => entry.id === topic)?.chapterCount ||
            0;
          const chapterCompleted = Number(row.theory_chapters_completed ?? 0);
          const functionTotal =
            Number(row.functions_total ?? 0) ||
            learnTopics.find((entry) => entry.id === topic)?.functionCount ||
            0;
          const functionsViewed = Number(row.functions_viewed ?? 0);

          nextProgress[topic] = {
            theory:
              chapterTotal > 0
                ? Math.max(0, Math.min(100, Math.round((chapterCompleted / chapterTotal) * 100)))
                : 0,
            functions:
              functionTotal > 0
                ? Math.max(0, Math.min(100, Math.round((functionsViewed / functionTotal) * 100)))
                : 0
          };
        }

        if (!cancelled) {
          setLearnProgress(nextProgress);
        }
      } catch {
        if (!cancelled) {
          setLearnProgress(defaultLearnProgress);
        }
      }
    };

    void loadProgress();

    return () => {
      cancelled = true;
    };
  }, [learnMenuOpen, user?.id]);

  useEffect(() => {
    setLearnMenuOpen(false);
    setPracticeMenuOpen(false);
  }, [pathname]);

  if (hideNav) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-light-border bg-light-bg/80 backdrop-blur-lg dark:border-dark-border dark:bg-dark-bg/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-base font-semibold">DataGridLab</div>
              <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                Data Practice
              </div>
            </div>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.matchPrefixes
                ? item.matchPrefixes.some(
                    (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
                  )
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);

              if (item.href === '/learn') {
                return (
                  <div key={item.href} ref={learnMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setPracticeMenuOpen(false);
                        setLearnMenuOpen((open) => !open);
                      }}
                      className="relative inline-flex items-center gap-2 overflow-hidden rounded-lg px-4 py-2 transition-colors hover:bg-light-hover dark:hover:bg-dark-hover"
                    >
                      {(isLearnActive || learnMenuOpen) && (
                        <motion.div
                          layoutId="topNavIndicator"
                          className="absolute inset-0 rounded-lg border border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                      <Icon
                        className={`relative h-4 w-4 ${
                          isLearnActive || learnMenuOpen
                            ? 'text-brand-500'
                            : 'text-text-light-secondary dark:text-text-dark-secondary'
                        }`}
                      />
                      <span
                        className={`relative text-sm font-medium ${
                          isLearnActive || learnMenuOpen
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-text-light-primary dark:text-text-dark-primary'
                        }`}
                      >
                        {item.label}
                      </span>
                      <ChevronDown
                        className={`relative h-3.5 w-3.5 transition-transform ${
                          isLearnActive || learnMenuOpen
                            ? 'text-brand-500'
                            : 'text-text-light-tertiary dark:text-text-dark-tertiary'
                        } ${learnMenuOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {learnMenuOpen ? (
                      <div className="absolute left-1/2 top-full z-50 w-[560px] -translate-x-1/2 pt-2">
                        <div className="overflow-hidden rounded-2xl border border-light-border bg-light-surface shadow-2xl dark:border-dark-border dark:bg-[#0e1118]">
                          <div className="grid grid-cols-2">
                            {(['theory', 'functions'] as const).map((mode) => (
                              <div
                                key={mode}
                                className={`p-4 ${
                                  mode === 'theory'
                                    ? 'border-r border-light-border dark:border-dark-border'
                                    : ''
                                }`}
                              >
                                <div className="mb-3 flex items-center gap-2 px-1">
                                  <div
                                    className={`flex h-6 w-6 items-center justify-center rounded-md border ${
                                      mode === 'theory'
                                        ? 'border-brand-300 bg-brand-50 text-brand-600 dark:border-brand-700 dark:bg-brand-900/20 dark:text-brand-400'
                                        : 'border-success-300 bg-success-50 text-success-600 dark:border-success-700 dark:bg-success-900/20 dark:text-success-400'
                                    }`}
                                  >
                                    {mode === 'theory' ? (
                                      <BookOpen className="h-3.5 w-3.5" />
                                    ) : (
                                      <WalletCards className="h-3.5 w-3.5" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-text-light-primary dark:text-text-dark-primary">
                                      {mode === 'theory' ? 'Theory' : 'Functions'}
                                    </p>
                                    <p className="text-[10px] text-text-light-tertiary dark:text-text-dark-tertiary">
                                      {mode === 'theory'
                                        ? 'Concepts and chapters'
                                        : 'API reference and examples'}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  {learnTopics.map((topic) => {
                                    const meta = LEARN_TOPIC_META[topic.id];
                                    const progress =
                                      mode === 'theory'
                                        ? learnProgress[topic.id]?.theory ?? 0
                                        : learnProgress[topic.id]?.functions ?? 0;

                                    return (
                                      <Link
                                        key={`${mode}-${topic.id}`}
                                        href={
                                          mode === 'theory'
                                            ? `/learn/${topic.id}/theory`
                                            : `/learn/${topic.id}/functions`
                                        }
                                        onClick={() => setLearnMenuOpen(false)}
                                        className="group flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 transition-all hover:bg-light-bg hover:dark:bg-dark-bg"
                                        style={{
                                          borderColor: 'transparent'
                                        }}
                                        onMouseEnter={(event) => {
                                          event.currentTarget.style.borderColor = `rgba(${meta?.rgb ?? '107,127,255'},0.24)`;
                                          event.currentTarget.style.backgroundColor = `rgba(${meta?.rgb ?? '107,127,255'},0.08)`;
                                        }}
                                        onMouseLeave={(event) => {
                                          event.currentTarget.style.borderColor = 'transparent';
                                          event.currentTarget.style.backgroundColor = '';
                                        }}
                                      >
                                        <div
                                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border text-sm"
                                          style={{
                                            color: meta?.color ?? '#6b7fff',
                                            backgroundColor: `rgba(${meta?.rgb ?? '107,127,255'},0.1)`,
                                            borderColor: `rgba(${meta?.rgb ?? '107,127,255'},0.22)`
                                          }}
                                        >
                                          {meta?.icon ?? '✦'}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                          <div className="mb-1 flex items-center justify-between gap-2">
                                            <span
                                              className="truncate text-xs font-semibold text-text-light-primary dark:text-text-dark-primary"
                                              style={{ color: meta?.color }}
                                            >
                                              {topic.title}
                                            </span>
                                            <span className="text-[10px] font-medium text-text-light-tertiary dark:text-text-dark-tertiary">
                                              {progress}%
                                            </span>
                                          </div>
                                          <div className="h-1 w-full rounded-full bg-light-border dark:bg-dark-border">
                                            <div
                                              className="h-full rounded-full transition-all duration-300"
                                              style={{
                                                width: `${progress}%`,
                                                backgroundColor: meta?.color ?? '#6b7fff'
                                              }}
                                            />
                                          </div>
                                        </div>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between border-t border-light-border px-4 py-2 dark:border-dark-border">
                            <span className="text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary">
                              Quick access
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Link
                                href="/learn/pyspark/functions"
                                onClick={() => setLearnMenuOpen(false)}
                                className="rounded-md border border-light-border bg-light-bg px-2.5 py-1 text-[11px] font-medium text-text-light-secondary transition-colors hover:text-text-light-primary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary dark:hover:text-text-dark-primary"
                              >
                                PySpark Functions
                              </Link>
                              <Link
                                href="/learn/sql/functions"
                                onClick={() => setLearnMenuOpen(false)}
                                className="rounded-md border border-light-border bg-light-bg px-2.5 py-1 text-[11px] font-medium text-text-light-secondary transition-colors hover:text-text-light-primary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary dark:hover:text-text-dark-primary"
                              >
                                SQL Functions
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              }

              if (item.children) {
                return (
                  <div key={item.href} ref={practiceMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setLearnMenuOpen(false);
                        setPracticeMenuOpen((open) => !open);
                      }}
                      className="relative inline-flex items-center gap-2 overflow-hidden rounded-lg px-4 py-2 transition-colors hover:bg-light-hover dark:hover:bg-dark-hover"
                    >
                      {(isActive || practiceMenuOpen) && (
                        <motion.div
                          layoutId="topNavIndicator"
                          className="absolute inset-0 rounded-lg border border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                      <Icon
                        className={`relative h-4 w-4 ${
                          isActive || practiceMenuOpen
                            ? 'text-brand-500'
                            : 'text-text-light-secondary dark:text-text-dark-secondary'
                        }`}
                      />
                      <span
                        className={`relative text-sm font-medium ${
                          isActive || practiceMenuOpen
                            ? 'text-brand-600 dark:text-brand-400'
                            : 'text-text-light-primary dark:text-text-dark-primary'
                        }`}
                      >
                        {item.label}
                      </span>
                      <ChevronDown
                        className={`relative h-3.5 w-3.5 transition ${
                          isActive || practiceMenuOpen
                            ? 'text-brand-500'
                            : 'text-text-light-tertiary dark:text-text-dark-tertiary'
                        } ${practiceMenuOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {practiceMenuOpen ? (
                      <div className="absolute left-0 top-full z-50 w-48 pt-1">
                        <div className="rounded-xl border border-light-border bg-light-surface p-1.5 shadow-lg dark:border-dark-border dark:bg-dark-surface">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            const childActive =
                              pathname === child.href || pathname?.startsWith(`${child.href}/`);

                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setPracticeMenuOpen(false)}
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                                  childActive
                                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-300'
                                    : 'text-text-light-secondary hover:bg-light-hover hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-text-dark-primary'
                                }`}
                              >
                                <ChildIcon className="h-4 w-4" />
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative inline-flex items-center gap-2 overflow-hidden rounded-lg px-4 py-2 transition-colors hover:bg-light-hover dark:hover:bg-dark-hover"
                >
                  {isActive && (
                    <motion.div
                      layoutId="topNavIndicator"
                      className="absolute inset-0 rounded-lg border border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <Icon
                    className={`relative h-4 w-4 ${
                      isActive
                        ? 'text-brand-500'
                        : 'text-text-light-secondary dark:text-text-dark-secondary'
                    }`}
                  />
                  <span
                    className={`relative text-sm font-medium ${
                      isActive
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-text-light-primary dark:text-text-dark-primary'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden xl:block xl:w-[150px]">
              <HomeSearch items={learnSearchItems} triggerVariant="nav" />
            </div>
            {user ? (
              <UserMenu />
            ) : (
              <Link href="/login" className="btn btn-secondary">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
