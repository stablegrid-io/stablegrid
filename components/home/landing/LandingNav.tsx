'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';

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
          ? 'border-b border-[#1f1f1f] bg-[#0a0a0a]/90 backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6b7fff]">
            <Zap className="h-4 w-4 fill-white text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight">DataGridLab</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {[
            { label: 'Features', href: '#features' },
            { label: 'Topics', href: '#topics' },
            { label: 'Pricing', href: '#pricing' }
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm text-[#a3a3a3] transition-colors hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-[#a3a3a3] transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-[#6b7fff] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5a6ef0]"
          >
            Start free
          </Link>
        </div>
      </div>
    </nav>
  );
};
