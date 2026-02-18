import Link from 'next/link';
import { Activity } from 'lucide-react';

export const LandingFooter = () => {
  return (
    <footer className="border-t border-[#1f1f1f] py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#64a0dc]">
            <Activity className="h-3.5 w-3.5 text-[#09111e]" />
          </div>
          <span className="text-sm font-medium text-[#d8eaf8]">StableGrid</span>
        </div>

        <div className="flex items-center gap-8 text-sm text-[#6f93b2]">
          {[
            { label: 'Features', href: '#features' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'Login', href: '/login' },
            { label: 'Sign up', href: '/signup' }
          ].map((item) => (
            <Link key={item.label} href={item.href} className="transition-colors hover:text-[#9ab8d4]">
              {item.label}
            </Link>
          ))}
        </div>

        <p className="text-xs text-[#6f93b2]">(c) 2026 StableGrid</p>
      </div>
    </footer>
  );
};
