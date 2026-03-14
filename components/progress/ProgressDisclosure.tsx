'use client';

import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface ProgressDisclosureProps {
  id: string;
  title: string;
  description: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  testId?: string;
}

export function ProgressDisclosure({
  id,
  title,
  description,
  open,
  onToggle,
  children,
  testId
}: ProgressDisclosureProps) {
  return (
    <section className="rounded-[2rem] border border-[#d3dbd4] bg-[rgba(249,246,240,0.82)] shadow-[0_24px_72px_-58px_rgba(15,23,42,0.32)] backdrop-blur dark:border-white/10 dark:bg-[rgba(10,18,14,0.76)]">
      <button
        type="button"
        id={`${id}-trigger`}
        data-testid={testId}
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold tracking-[-0.02em] text-[#101918] dark:text-[#f3f7f4]">
            {title}
          </span>
          <span className="mt-1 block text-sm leading-6 text-[#627068] dark:text-[#8aa496]">
            {description}
          </span>
        </span>
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d5ddd7] bg-white/90 text-[#5b6c64] transition duration-200 dark:border-white/10 dark:bg-white/5 dark:text-[#9db6aa] ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        >
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>

      {open ? (
        <div
          id={id}
          role="region"
          aria-labelledby={`${id}-trigger`}
          className="border-t border-[#d6ddd7] px-5 pb-5 pt-4 dark:border-white/8 sm:px-6 sm:pb-6"
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}
