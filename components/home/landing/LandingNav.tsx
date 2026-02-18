'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StableGridWordmark } from '@/components/brand/StableGridLogo';

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
          ? 'border-b border-[#1e3a2d] bg-[#090b0a]/92 backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <StableGridWordmark
            size="sm"
            titleClassName="text-[#e3efe8]"
          />
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
              className="text-sm text-[#9ab8a9] transition-colors hover:text-[#e3efe8]"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-[#9ab8a9] transition-colors hover:text-[#e3efe8]">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-[#4ade80] px-4 py-2 text-sm font-medium text-[#08110b] transition-colors hover:bg-[#6fe89a]"
          >
            Start free
          </Link>
        </div>
      </div>
    </nav>
  );
};
