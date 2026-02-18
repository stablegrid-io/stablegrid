import Link from 'next/link';
import { Zap } from 'lucide-react';

export const LandingFooter = () => {
  return (
    <footer className="border-t border-[#1f1f1f] py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#10b981]">
            <Zap className="h-3.5 w-3.5 fill-white text-white" />
          </div>
          <span className="text-sm font-medium">stablegrid.io</span>
        </div>

        <div className="flex items-center gap-8 text-sm text-[#525252]">
          {[
            { label: 'Features', href: '#features' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'Login', href: '/login' },
            { label: 'Sign up', href: '/signup' }
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="transition-colors hover:text-[#a3a3a3]"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <p className="text-xs text-[#525252]">© 2026 stablegrid.io</p>
      </div>
    </footer>
  );
};
