'use client';

import Link from 'next/link';

export type AdminNavSectionId =
  | 'analytics'
  | 'lessons'
  | 'catalog'
  | 'assignments'
  | 'bugs'
  | 'audit'
  | 'customers'
  | 'financials';

export const ADMIN_SECTIONS: Array<{
  id: AdminNavSectionId;
  label: string;
  href: string;
}> = [
  { id: 'analytics', label: 'Analytics', href: '/admin/analytics' },
  { id: 'lessons', label: 'Lessons', href: '/admin/lessons' },
  { id: 'catalog', label: 'Catalog', href: '/admin/catalog' },
  { id: 'assignments', label: 'Assignments', href: '/admin/assignments' },
  { id: 'bugs', label: 'Bugs', href: '/admin/bugs' },
  { id: 'audit', label: 'Audit', href: '/admin/audit' },
  { id: 'customers', label: 'Customers', href: '/admin/customers' },
  { id: 'financials', label: 'Financials', href: '/admin/financials' }
];

export const ADMIN_SECTION_GROUPS: Array<{
  id: 'insights' | 'content' | 'operations';
  label: string;
  sections: AdminNavSectionId[];
}> = [
  {
    id: 'insights',
    label: 'Insights',
    sections: ['analytics', 'audit']
  },
  {
    id: 'content',
    label: 'Learning content',
    sections: ['lessons', 'catalog']
  },
  {
    id: 'operations',
    label: 'Operations',
    sections: ['assignments', 'bugs', 'customers', 'financials']
  }
];

export function AdminLeftRail({ activeSection }: { activeSection: AdminNavSectionId }) {
  return (
    <section className="sticky top-4 relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,12,12,0.82),rgba(5,8,8,0.92))] p-4 shadow-[0_30px_80px_-52px_rgba(0,0,0,0.82)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,185,153,0.12),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.04),transparent_30%)]" />
      <div className="relative">
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

                  return (
                    <Link
                      key={section.id}
                      href={section.href}
                      className={`flex items-center justify-between rounded-[14px] border px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'border-brand-400/30 bg-brand-500/12 text-[#d5f4ea]'
                          : 'border-white/10 bg-white/[0.03] text-[#d3dfda] hover:border-brand-400/20 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span>{section.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
