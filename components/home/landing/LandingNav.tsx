'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity } from 'lucide-react';

export const LandingNav = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-[#223754] bg-[#09111e]/92 backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#64a0dc]">
            <Activity className="h-4 w-4 text-[#09111e]" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-[#d8eaf8]">StableGrid</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {[
            { label: 'Features', href: '#features' },
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Topics', href: '#topics' },
            { label: 'Pricing', href: '#pricing' }
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm text-[#9ab8d4] transition-colors hover:text-[#d8eaf8]"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-[#9ab8d4] transition-colors hover:text-[#d8eaf8]">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-[#64a0dc] px-4 py-2 text-sm font-medium text-[#09111e] transition-colors hover:bg-[#8eb9de]"
          >
            Start free
          </Link>
        </div>
      </div>
    </nav>
  );
};
