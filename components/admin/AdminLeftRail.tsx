'use client';

import Link from 'next/link';
import {
  BarChart3,
  BookOpen,
  Bug,
  ClipboardList,
  FileText,
  Shield,
  ShoppingCart,
  Users,
  Wallet,
  type LucideIcon
} from 'lucide-react';
import { AdminSurface } from '@/components/admin/theme';

export type AdminNavSectionId =
  | 'analytics'
  | 'lessons'
  | 'catalog'
  | 'assignments'
  | 'bugs'
  | 'orders'
  | 'audit'
  | 'customers'
  | 'financials';

export const ADMIN_SECTIONS: Array<{
  id: AdminNavSectionId;
  label: string;
  href: string;
  icon: LucideIcon;
}> = [
  { id: 'analytics', label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { id: 'audit', label: 'Audit', href: '/admin/audit', icon: Shield },
  { id: 'lessons', label: 'Content Editor', href: '/admin/lessons', icon: FileText },
  { id: 'catalog', label: 'Catalog', href: '/admin/catalog', icon: BookOpen },
  { id: 'orders', label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { id: 'customers', label: 'Customers', href: '/admin/customers', icon: Users },
  { id: 'financials', label: 'Financials', href: '/admin/financials', icon: Wallet },
  { id: 'assignments', label: 'Assignments', href: '/admin/assignments', icon: ClipboardList },
  { id: 'bugs', label: 'Bugs', href: '/admin/bugs', icon: Bug }
];

export const ADMIN_SECTION_GROUPS: Array<{
  id: 'monitor' | 'content' | 'commerce' | 'workflow';
  label: string;
  sections: AdminNavSectionId[];
}> = [
  {
    id: 'monitor',
    label: 'Monitor',
    sections: ['analytics', 'audit']
  },
  {
    id: 'content',
    label: 'Content',
    sections: ['lessons', 'catalog']
  },
  {
    id: 'commerce',
    label: 'Commerce',
    sections: ['orders', 'customers', 'financials']
  },
  {
    id: 'workflow',
    label: 'Workflow',
    sections: ['assignments', 'bugs']
  }
];

export function AdminLeftRail({ activeSection }: { activeSection: AdminNavSectionId }) {
  return (
    <AdminSurface className="sticky top-4 p-4">
      <div>
        <p className="text-[0.64rem] uppercase tracking-[0.28em] text-[#84bea9]">Internal admin</p>
        <p className="mt-2 text-lg font-semibold tracking-tight text-white">Console</p>

        <div className="mt-5 space-y-4">
          {ADMIN_SECTION_GROUPS.map((group) => (
            <div key={group.id}>
              <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[#8da99d]">
                {group.label}
              </p>
              <div className="mt-2 space-y-1.5">
                {group.sections.map((sectionId) => {
                  const section = ADMIN_SECTIONS.find((entry) => entry.id === sectionId);
                  if (!section) {
                    return null;
                  }

                  const isActive = activeSection === section.id;
                  const Icon = section.icon;

                  return (
                    <Link
                      key={section.id}
                      href={section.href}
                      className={`flex items-center gap-2.5 rounded-[14px] border px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'border-brand-400/30 bg-brand-500/12 text-[#d5f4ea]'
                          : 'border-white/10 bg-white/[0.03] text-[#d3dfda] hover:border-brand-400/20 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span
                        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          isActive ? 'bg-brand-400/15 text-[#bdeedd]' : 'bg-white/[0.05] text-[#9eb2a9]'
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                      </span>
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
