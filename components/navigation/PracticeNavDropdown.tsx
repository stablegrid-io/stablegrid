'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export interface PracticeNavChild {
  href: string;
  icon: LucideIcon;
  label: string;
}

interface PracticeNavDropdownProps {
  items: PracticeNavChild[];
  pathname?: string | null;
  onSelect?: () => void;
}

export function PracticeNavDropdown({
  items,
  pathname,
  onSelect
}: PracticeNavDropdownProps) {
  return (
    <div className="rounded-xl border border-light-border bg-light-surface p-1.5 shadow-lg dark:border-dark-border dark:bg-dark-surface">
      {items.map((child) => {
        const ChildIcon = child.icon;
        const childActive = pathname === child.href || pathname?.startsWith(`${child.href}/`);

        return (
          <Link
            key={child.href}
            href={child.href}
            onClick={onSelect}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              childActive
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300'
                : 'text-text-light-secondary hover:bg-light-hover hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-text-dark-primary'
            }`}
          >
            <ChildIcon className="h-4 w-4" />
            {child.label}
          </Link>
        );
      })}
    </div>
  );
}
