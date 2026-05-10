'use client';

import Link from 'next/link';
import {
  BarChart3,
  Bug,
  MessageSquare,
  Receipt,
  Shield,
  ShoppingCart,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export type AdminNavSectionId =
  | 'analytics'
  | 'feedback'
  | 'bugs'
  | 'orders'
  | 'audit'
  | 'customers'
  | 'financials'
  | 'spending';

export const ADMIN_SECTIONS: Array<{
  id: AdminNavSectionId;
  label: string;
  href: string;
  icon: LucideIcon;
}> = [
  { id: 'analytics', label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { id: 'feedback', label: 'Feedback', href: '/admin/feedback', icon: MessageSquare },
  { id: 'audit', label: 'Audit', href: '/admin/audit', icon: Shield },
  { id: 'orders', label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { id: 'customers', label: 'Customers', href: '/admin/customers', icon: Users },
  { id: 'financials', label: 'Financials', href: '/admin/financials', icon: Wallet },
  { id: 'bugs', label: 'Bugs', href: '/admin/bugs', icon: Bug },
  { id: 'spending', label: 'Spending', href: '/admin/spending', icon: Receipt },
];

export const ADMIN_SECTION_GROUPS: Array<{
  id: 'monitor' | 'commerce' | 'workflow' | 'devtools';
  label: string;
  sections: AdminNavSectionId[];
}> = [
  { id: 'monitor', label: 'Monitor', sections: ['analytics', 'feedback', 'audit'] },
  { id: 'commerce', label: 'Commerce', sections: ['orders', 'customers', 'financials'] },
  { id: 'workflow', label: 'Workflow', sections: ['bugs'] },
  { id: 'devtools', label: 'Dev Tools', sections: ['spending'] },
];

export function AdminLeftRail({ activeSection }: { activeSection: AdminNavSectionId }) {
  return (
    <aside className="sticky top-4 border border-surface-dim bg-surface p-4">
      <p className="font-data-mono text-[9px] uppercase tracking-[0.3em] text-primary">
        ADMIN_CONSOLE
      </p>
      <p className="mt-2 font-h2 text-[18px] font-bold tracking-tight text-on-surface">
        System Control
      </p>

      <div className="mt-6 space-y-5">
        {ADMIN_SECTION_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="font-data-mono text-[9px] uppercase tracking-[0.22em] text-on-surface-variant px-1">
              {group.label}
            </p>
            <div className="mt-2 space-y-px">
              {group.sections.map((sectionId) => {
                const section = ADMIN_SECTIONS.find((entry) => entry.id === sectionId);
                if (!section) return null;

                const isActive = activeSection === section.id;
                const Icon = section.icon;

                return (
                  <Link
                    key={section.id}
                    href={section.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2.5 px-3 py-2 border-l-2 transition-colors ${
                      isActive
                        ? 'border-primary bg-surface-container-low text-primary'
                        : 'border-transparent text-on-surface-variant hover:border-surface-dim hover:bg-surface-container-low hover:text-on-surface'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="font-data-mono text-[11px] tracking-[0.08em] uppercase font-semibold truncate">
                      {section.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
