import Link from 'next/link';
import { StableGridWordmark } from '@/components/brand/StableGridLogo';

export const LandingFooter = () => {
  return (
    <footer className="border-t border-[#1a2a22] py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="flex items-center gap-2.5">
          <StableGridWordmark
            size="sm"
            titleClassName="text-[#e3efe8]"
          />
        </div>

        <div className="flex items-center gap-8 text-sm text-[#6f8f7d]">
          {[
            { label: 'Features', href: '#features' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'Login', href: '/login' },
            { label: 'Sign up', href: '/signup' }
          ].map((item) => (
            <Link key={item.label} href={item.href} className="transition-colors hover:text-[#9ab8a9]">
              {item.label}
            </Link>
          ))}
        </div>

        <p className="text-xs text-[#6f8f7d]">(c) 2026 StableGrid.io</p>
      </div>
    </footer>
  );
};
