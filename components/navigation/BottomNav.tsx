'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { isNavItemActive, navItems, shouldHideNav } from './navigation-config';

export const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();

  if (shouldHideNav(pathname, Boolean(user))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-light-border bg-light-bg/80 backdrop-blur-lg dark:border-dark-border dark:bg-dark-bg/80 lg:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item);

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="relative flex h-full flex-1 flex-col items-center justify-center gap-1"
              type="button"
            >
              {isActive && (
                <div className="absolute left-1/2 top-0 h-1 w-12 -translate-x-1/2 rounded-full bg-brand-500" />
              )}

              <div className="relative">
                <Icon
                  className={`h-6 w-6 transition-colors ${
                    isActive
                      ? 'text-brand-500'
                      : 'text-text-light-tertiary dark:text-text-dark-tertiary'
                  }`}
                />
              </div>

              <span
                className={`text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-brand-500'
                    : 'text-text-light-tertiary dark:text-text-dark-tertiary'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="h-safe-bottom bg-light-bg dark:bg-dark-bg" />
    </nav>
  );
};
