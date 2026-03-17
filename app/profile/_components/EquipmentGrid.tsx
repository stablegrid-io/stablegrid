'use client';

import { INFRASTRUCTURE_NODES } from '@/lib/energy';

interface Props {
  deployedNodeIds: string[];
}

// Map node IDs to display icons
const NODE_ICONS: Record<string, string> = {
  'control-center': '🛰️',
  'smart-transformer': '⚡',
  'solar-forecasting-array': '☀️',
  'battery-storage': '🔋',
  'frequency-controller': '📡',
  'demand-response-system': '📊',
  'grid-flywheel': '🔄',
  'hvdc-interconnector': '🔗',
  'ai-grid-optimizer': '🤖'
};

export function EquipmentGrid({ deployedNodeIds }: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#080e0c]/90 p-5">
      <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300/60">
        Deployed Equipment
      </h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {INFRASTRUCTURE_NODES.map((node) => {
          const deployed = deployedNodeIds.includes(node.id);
          const icon = NODE_ICONS[node.id] ?? '⚙️';
          return (
            <div
              key={node.id}
              title={node.name}
              className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-300 ${
                deployed
                  ? 'border-brand-500/30 bg-brand-500/10'
                  : 'border-white/[0.06] bg-black/15 opacity-35'
              }`}
            >
              <span className="text-xl leading-none">{icon}</span>
              <span className="text-center text-[9px] font-medium leading-tight text-brand-100/80">
                {node.name.replace(/\s*\(.*?\)\s*/g, '').trim()}
              </span>
              {deployed && (
                <span
                  className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-brand-400"
                  style={{ boxShadow: '0 0 6px rgba(34,185,153,0.8)' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
