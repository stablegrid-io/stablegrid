'use client';

import Link from 'next/link';
import {
  BarChart3,
  BookOpen,
  Bug,
  ClipboardList,
  FileText,
  MessageSquare,
  Receipt,
  Shield,
  ShoppingCart,
  Users,
  Wallet,
  type LucideIcon
} from 'lucide-react';
import { AdminSurface } from '@/components/admin/theme';

export type AdminNavSectionId =
  | 'analytics'
  | 'feedback'
  | 'lessons'
  | 'catalog'
  | 'assignments'
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
  { id: 'lessons', label: 'Content Editor', href: '/admin/lessons', icon: FileText },
  { id: 'catalog', label: 'Catalog', href: '/admin/catalog', icon: BookOpen },
  { id: 'orders', label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { id: 'customers', label: 'Customers', href: '/admin/customers', icon: Users },
  { id: 'financials', label: 'Financials', href: '/admin/financials', icon: Wallet },
  { id: 'assignments', label: 'Assignments', href: '/admin/assignments', icon: ClipboardList },
  { id: 'bugs', label: 'Bugs', href: '/admin/bugs', icon: Bug },
  { id: 'spending', label: 'Spending', href: '/admin/spending', icon: Receipt }
];

export const ADMIN_SECTION_GROUPS: Array<{
  id: 'monitor' | 'content' | 'commerce' | 'workflow' | 'devtools';
  label: string;
  sections: AdminNavSectionId[];
}> = [
  { id: 'monitor', label: 'Monitor', sections: ['analytics', 'feedback', 'audit'] },
  { id: 'content', label: 'Content', sections: ['lessons', 'catalog'] },
  { id: 'commerce', label: 'Commerce', sections: ['orders', 'customers', 'financials'] },
  { id: 'workflow', label: 'Workflow', sections: ['assignments', 'bugs'] },
  { id: 'devtools', label: 'Dev Tools', sections: ['spending'] }
];

export function AdminLeftRail({ activeSection }: { activeSection: AdminNavSectionId }) {
  return (
    <AdminSurface className="sticky top-4 p-4">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary">
          ADMIN_CONSOLE
        </p>
        <p className="mt-2 text-lg font-bold tracking-tight text-on-surface">
          System Control
        </p>

        <div className="mt-5 space-y-4">
          {ADMIN_SECTION_GROUPS.map((group) => (
            <div key={group.id}>
              <p className="font-mono text-[8px] uppercase tracking-[0.25em] text-on-surface-variant">
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
                      className={`flex items-center gap-2.5 border px-3 py-2 font-mono text-xs transition-colors ${
                        isActive
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-transparent text-on-surface-variant hover:border-outline-variant/30 hover:bg-surface-container-high hover:text-on-surface'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{section.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminSurface>
  );
}
