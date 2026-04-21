'use client';

import { useState } from 'react';
import { Check, Lock } from 'lucide-react';
import type { ShopItemView } from '@/types/grid';
import { BRIEFINGS } from '@/lib/grid/briefings';
import {
  CATEGORY_COLOR,
  PANEL_BG,
  PANEL_BORDER,
  PANEL_BORDER_HOVER,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
  TEXT_DISABLED,
} from './tokens';

interface ShopCardProps {
  item: ShopItemView;
  onDeploy: (slug: string) => void;
  onOpenBriefing?: (slug: string) => void;
  isPurchasing: boolean;
  onHoverChange?: (hovering: boolean) => void;
}

type CardState = 'affordable' | 'unaffordable' | 'owned' | 'locked';

export function ShopCard({ item, onDeploy, isPurchasing, onHoverChange }: ShopCardProps) {
  const { component, affordable, owned, locked, lockReason } = item;
  const [shake, setShake] = useState(false);
  const [hover, setHover] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const state: CardState = owned ? 'owned' : locked ? 'locked' : affordable ? 'affordable' : 'unaffordable';
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
    ? 'DEPLOYING…'
    : state === 'owned'
      ? 'DEPLOYED'
      : state === 'locked'
        ? 'LOCKED'
        : state === 'affordable'
          ? 'DEPLOY'
          : `NEED ${component.costKwh.toLocaleString()} kWh`;

  const opacity = state === 'locked' ? 0.55 : state === 'unaffordable' ? 0.86 : 1;
  const borderColor = owned
    ? `${color}4d`
    : hover && !disabled
      ? PANEL_BORDER_HOVER
      : PANEL_BORDER;

  return (
    <article
      data-category={component.category}
      aria-disabled={disabled}
      onMouseEnter={() => { setHover(true); onHoverChange?.(true); }}
      onMouseLeave={() => { setHover(false); onHoverChange?.(false); }}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: PANEL_BG,
        border: `1px solid ${borderColor}`,
        borderLeft: owned ? `2px solid ${color}` : `1px solid ${borderColor}`,
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        transition: 'border-color 150ms ease, transform 220ms ease',
        opacity,
        animation: shake ? 'shopCardShake 220ms ease-in-out' : undefined,
      }}
    >
      {/* Image / placeholder */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 220,
          background: `linear-gradient(135deg, ${color}1f, rgba(10,12,14,0.9) 65%)`,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {!imageFailed && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/grid/components/${component.slug}.jpg`}
            alt=""
            onError={() => setImageFailed(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'saturate(0.85) contrast(1.05)',
            }}
          />
        )}
        {imageFailed && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
              fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: 600,
              opacity: 0.55,
            }}
          >
            {component.category}
          </div>
        )}

        {/* Fade so bottom-floating chips stay readable */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(10,12,14,0.05) 0%, rgba(10,12,14,0) 35%, rgba(10,12,14,0.85) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top-left: category badge */}
        <span
          className="font-mono"
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            fontSize: 10,
            letterSpacing: '0.18em',
            padding: '3px 8px',
            borderRadius: 4,
            background: `${color}20`,
            color,
            border: `1px solid ${color}40`,
            textTransform: 'uppercase',
            fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}
        >
          {component.category}
        </span>

        {/* Top-right: status chip */}
        {state === 'owned' && (
          <span
            className="font-mono"
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              fontSize: 10,
              letterSpacing: '0.18em',
              padding: '3px 8px',
              borderRadius: 4,
              color,
              background: 'rgba(10,12,14,0.6)',
              border: `1px solid ${color}55`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontWeight: 600,
              backdropFilter: 'blur(4px)',
            }}
          >
            <Check size={10} strokeWidth={2.8} /> ONLINE
          </span>
        )}
        {state === 'locked' && (
          <span
            className="font-mono"
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              fontSize: 10,
              letterSpacing: '0.18em',
              padding: '3px 8px',
              borderRadius: 4,
              color: TEXT_SECONDARY,
              background: 'rgba(10,12,14,0.6)',
              border: `1px solid rgba(255,255,255,0.1)`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontWeight: 600,
              backdropFilter: 'blur(4px)',
            }}
          >
            <Lock size={10} strokeWidth={2.8} /> LOCKED
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div>
          <div
            className="font-mono"
            style={{
              fontSize: 10,
              letterSpacing: '0.2em',
              color: TEXT_TERTIARY,
              textTransform: 'uppercase',
              marginBottom: 4,
              fontWeight: 600,
            }}
          >
            {component.districtName}
          </div>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: TEXT_PRIMARY,
              margin: 0,
              letterSpacing: '-0.01em',
              fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
            }}
          >
            {component.name}
          </h3>
        </div>

        <p
          style={{
            fontSize: 12.5,
            lineHeight: 1.55,
            color: hover && !disabled && teaser ? TEXT_SECONDARY : TEXT_TERTIARY,
            margin: 0,
            fontStyle: hover && !disabled && teaser ? 'italic' : 'normal',
            minHeight: 40,
            transition: 'color 150ms ease',
          }}
        >
          {hover && !disabled && teaser ? teaser : component.flavor}
        </p>

        {state === 'locked' && lockReason && (
          <p style={{ fontSize: 11, color: TEXT_TERTIARY, margin: 0, fontStyle: 'italic', lineHeight: 1.4 }}>{lockReason}</p>
        )}

        <div
          style={{
            marginTop: 'auto',
            paddingTop: 12,
            borderTop: `1px solid ${PANEL_BORDER}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div>
            <div
              className="font-mono"
              style={{ fontSize: 9, letterSpacing: '0.2em', color: TEXT_TERTIARY, textTransform: 'uppercase', fontWeight: 600 }}
            >
              Cost
            </div>
            <div
              className="font-mono tabular-nums"
              style={{ fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, letterSpacing: '0.01em' }}
            >
              {component.costKwh.toLocaleString()}
              <span style={{ fontSize: 10, color: TEXT_TERTIARY, letterSpacing: '0.12em', marginLeft: 4 }}>kWh</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClick}
            disabled={disabled}
            className="font-mono"
            style={{
              background: 'transparent',
              border: `1px solid ${state === 'affordable' ? color : 'rgba(255,255,255,0.14)'}`,
              color:
                disabled
                  ? TEXT_DISABLED
                  : state === 'affordable'
                    ? color
                    : TEXT_SECONDARY,
              fontSize: 10,
              letterSpacing: '0.2em',
              padding: '9px 14px',
              borderRadius: 8,
              cursor: disabled ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              transition: 'background 150ms ease, color 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (!disabled && state === 'affordable') {
                e.currentTarget.style.background = `${color}14`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
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
