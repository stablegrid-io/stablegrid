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
import { ADMIN_PRIMARY_SURFACE_CLASS } from '@/components/admin/theme';

const ACCENT = '153,247,255';

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
    <aside className={`sticky top-4 p-4 ${ADMIN_PRIMARY_SURFACE_CLASS}`}>
      <div className="relative">
        <p
          className="font-mono text-[9px] uppercase tracking-[0.3em]"
          style={{ color: `rgb(${ACCENT})` }}
        >
          ADMIN_CONSOLE
        </p>
        <p className="mt-2 text-lg font-bold tracking-tight text-white">System Control</p>

        <div className="mt-6 space-y-5">
          {ADMIN_SECTION_GROUPS.map((group) => (
            <div key={group.id}>
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/40 px-1">
                {group.label}
              </p>
              <div className="mt-2 space-y-1">
                {group.sections.map((sectionId) => {
                  const section = ADMIN_SECTIONS.find((entry) => entry.id === sectionId);
                  if (!section) return null;

                  const isActive = activeSection === section.id;
                  const Icon = section.icon;

                  return (
                    <Link
                      key={section.id}
                      href={section.href}
                      className="flex items-center gap-2.5 px-3 py-2 transition-all"
                      style={{
                        borderRadius: 10,
                        background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                        border: `1px solid ${
                          isActive ? 'rgba(255,255,255,0.25)' : 'transparent'
                        }`,
                        color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                          e.currentTarget.style.color = 'rgba(255,255,255,0.95)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                        }
                      }}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                      <span className="font-mono text-[11px] tracking-[0.06em] uppercase font-semibold truncate">
                        {section.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
