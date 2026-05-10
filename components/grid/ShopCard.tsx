'use client';

import { useState } from 'react';
import { Check, Lock } from 'lucide-react';
import type { ShopItemView } from '@/types/grid';
import { BRIEFINGS } from '@/lib/grid/briefings';
import { CATEGORY_COLOR } from './tokens';

interface ShopCardProps {
  item: ShopItemView;
  onDeploy: (slug: string) => void;
  onOpenDetails?: (slug: string) => void;
  isPurchasing: boolean;
  onHoverChange?: (hovering: boolean) => void;
}

type CardState = 'affordable' | 'unaffordable' | 'owned' | 'locked';

export function ShopCard({
  item,
  onDeploy,
  onOpenDetails,
  isPurchasing,
  onHoverChange
}: ShopCardProps) {
  const { component, affordable, owned, locked, lockReason } = item;
  const [shake, setShake] = useState(false);
  const [hover, setHover] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const state: CardState = owned
    ? 'owned'
    : locked
      ? 'locked'
      : affordable
        ? 'affordable'
        : 'unaffordable';
  const color = CATEGORY_COLOR[component.category];
  const disabled = state === 'owned' || state === 'locked' || isPurchasing;
  const teaser = BRIEFINGS[component.slug]?.teaser;

  const handleClick = () => {
    if (disabled) return;
    if (state === 'unaffordable') {
      setShake(true);
      setTimeout(() => setShake(false), 220);
      return;
    }
    onDeploy(component.slug);
  };

  const buttonLabel = isPurchasing
    ? 'Deploying…'
    : state === 'owned'
      ? 'Deployed'
      : state === 'locked'
        ? 'Locked'
        : state === 'affordable'
          ? 'Deploy'
          : `Need ${component.costKwh.toLocaleString()} kWh`;

  return (
    <article
      data-category={component.category}
      aria-disabled={disabled}
      role={onOpenDetails ? 'button' : undefined}
      tabIndex={onOpenDetails ? 0 : undefined}
      aria-label={onOpenDetails ? `${component.name} — view spec sheet` : undefined}
      onMouseEnter={() => {
        setHover(true);
        onHoverChange?.(true);
      }}
      onMouseLeave={() => {
        setHover(false);
        onHoverChange?.(false);
      }}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
      onClick={() => onOpenDetails?.(component.slug)}
      onKeyDown={(e) => {
        if (!onOpenDetails) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetails(component.slug);
        }
      }}
      className={`flex flex-col bg-surface border border-surface-dim hover:border-on-surface transition-colors overflow-hidden relative ${
        state === 'locked' ? 'opacity-60' : state === 'unaffordable' ? 'opacity-90' : ''
      } ${onOpenDetails ? 'cursor-pointer' : ''}`}
      style={{
        borderLeftColor: owned ? color : undefined,
        borderLeftWidth: owned ? 3 : undefined,
        animation: shake ? 'shopCardShake 220ms ease-in-out' : undefined
      }}
    >
      {/* Image / placeholder */}
      <div className="relative w-full h-[220px] bg-surface-container-low overflow-hidden flex-shrink-0">
        {!imageFailed && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/grid/components/${component.slug}.jpg`}
            alt=""
            onError={() => setImageFailed(true)}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'saturate(0.6) contrast(0.95)' }}
          />
        )}
        {imageFailed && (
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant"
          >
            {component.category}
          </div>
        )}

        {/* Top-left: category badge */}
        <span className="absolute top-2.5 left-2.5 font-data-mono uppercase text-[10px] tracking-wider px-2 py-1 bg-surface border border-on-surface text-on-surface">
          {component.category}
        </span>

        {/* Top-right: status chip */}
        {state === 'owned' && (
          <span
            className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 font-data-mono uppercase text-[10px] tracking-wider px-2 py-1 bg-on-surface text-on-primary"
          >
            <Check size={10} strokeWidth={2.5} /> Online
          </span>
        )}
        {state === 'locked' && (
          <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 font-data-mono uppercase text-[10px] tracking-wider px-2 py-1 bg-surface border border-surface-dim text-on-surface-variant">
            <Lock size={10} strokeWidth={2.5} /> Locked
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant block mb-1">
            {component.districtName}
          </span>
          <h3 className="font-serif text-[18px] text-on-surface leading-snug">
            {component.name}
          </h3>
        </div>

        <p
          className={`font-body text-[13px] leading-relaxed m-0 min-h-[40px] transition-colors ${
            hover && !disabled && teaser
              ? 'text-on-surface italic'
              : 'text-on-surface-variant'
          }`}
        >
          {hover && !disabled && teaser ? teaser : component.flavor}
        </p>

        {state === 'locked' && lockReason && (
          <p className="font-body text-[11px] italic text-on-surface-variant leading-snug m-0">
            {lockReason}
          </p>
        )}

        <div className="mt-auto pt-3 border-t border-surface-dim flex items-center justify-between gap-3">
          <div>
            <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant block">
              Cost
            </span>
            <span className="font-data-mono tabular-nums text-[15px] text-on-surface">
              {component.costKwh.toLocaleString()}
              <span className="font-data-mono text-[10px] uppercase tracking-wider text-on-surface-variant ml-1">
                kWh
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            disabled={disabled}
            className={`font-data-mono uppercase text-[10px] tracking-wider px-3.5 py-3 sm:py-2.5 min-h-[44px] sm:min-h-0 border whitespace-nowrap transition-colors ${
              disabled
                ? 'border-surface-dim text-on-surface-variant/60 cursor-not-allowed'
                : state === 'affordable'
                  ? 'border-on-surface bg-on-surface text-on-primary hover:bg-on-surface/90'
                  : 'border-surface-dim text-on-surface-variant'
            }`}
          >
            {buttonLabel}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes shopCardShake {
          0%, 100% { transform: translateX(0); }
          25%      { transform: translateX(-4px); }
          75%      { transform: translateX(4px); }
        }
        @media (prefers-reduced-motion: reduce) {
          article { animation: none !important; }
        }
      `}</style>
    </article>
  );
}
