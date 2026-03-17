'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X, Zap } from 'lucide-react';
import { unitsToKwh } from '@/lib/energy';
import type { GridOpsIncidentSeverity, GridOpsIncidentView } from '@/lib/grid-ops/types';

interface Props {
  incidents: GridOpsIncidentView[];
  open: boolean;
  onRepair: (incidentId: string) => Promise<void>;
  onDismiss: () => void;
  pendingRepairId: string | null;
}

const SEVERITY_STYLES: Record<
  GridOpsIncidentSeverity,
  { badge: string; label: string }
> = {
  warning: { badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'WARNING' },
  critical: { badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30', label: 'CRITICAL' },
  offline: { badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: 'OFFLINE' }
};

const formatIncidentType = (type: string) =>
  type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function IncidentAlertModal({
  incidents,
  open,
  onRepair,
  onDismiss,
  pendingRepairId
}: Props) {
  const activeIncidents = incidents.filter((i) => i);

  return (
    <AnimatePresence>
      {open && activeIncidents.length > 0 && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onDismiss}
            role="presentation"
          />

          {/* Panel */}
          <motion.div
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#060e0b] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9)]"
            initial={{ scale: 0.95, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400">
                  Incident Alert
                </span>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500/20 px-1.5 text-[10px] font-bold text-rose-400">
                  {activeIncidents.length}
                </span>
              </div>
              <button
                type="button"
                onClick={onDismiss}
                className="rounded-lg p-1 text-white/30 transition hover:text-white/60"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Incident list */}
            <div className="max-h-[60vh] overflow-y-auto">
              {activeIncidents.map((incident, idx) => {
                const styles = SEVERITY_STYLES[incident.severity];
                const isPending = pendingRepairId === incident.id;
                const costKwh = unitsToKwh(incident.repair_cost_units).toFixed(2);

                return (
                  <div
                    key={incident.id}
                    className={`px-5 py-4 ${idx < activeIncidents.length - 1 ? 'border-b border-white/6' : ''}`}
                  >
                    {/* Asset + severity */}
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-brand-50">{incident.asset_name}</p>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${styles.badge}`}
                      >
                        {styles.label}
                      </span>
                    </div>

                    {/* Incident type */}
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.10em] text-brand-200/40">
                      {formatIncidentType(incident.incident_type)}
                    </p>

                    {/* Dispatcher message */}
                    <p className="mb-3 text-[12px] italic leading-relaxed text-brand-200/65">
                      {incident.dispatcher_message}
                    </p>

                    {/* Repair button */}
                    <button
                      type="button"
                      onClick={() => void onRepair(incident.id)}
                      disabled={isPending || pendingRepairId !== null}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-500/30 bg-brand-500/15 px-4 py-2.5 text-[12px] font-semibold text-brand-300 transition-all hover:border-brand-400/50 hover:bg-brand-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      {isPending ? 'Repairing…' : `Repair — ${costKwh} kWh`}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-white/8 px-5 py-3">
              <button
                type="button"
                onClick={onDismiss}
                className="text-[11px] text-brand-200/40 transition hover:text-brand-200/70"
              >
                Monitor later →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
