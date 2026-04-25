'use client';

import { Lightbulb } from 'lucide-react';

interface TopicLightbulbRatingProps {
  /** Average 1–5 score; `null` means no ratings yet. */
  average: number | null;
  /** Total number of ratings contributing to the average. */
  count: number;
  /** Accent RGB triple (e.g. '255,201,101') used for the lit bulbs. */
  accentRgb?: string;
  className?: string;
}

const TOTAL_BULBS = 5;

/**
 * Compact 5-bulb rating display for topic cards. Shows fractional fill
 * (e.g. 4.2 → four lit, fifth at 20% opacity), plus a count label.
 * Falls back to a muted "No ratings yet" state when `average` is null.
 */
export const TopicLightbulbRating = ({
  average,
  count,
  accentRgb = '240,240,243',
  className,
}: TopicLightbulbRatingProps) => {
  const hasRatings = average !== null && count > 0;
  const clampedAvg = hasRatings ? Math.max(0, Math.min(5, average)) : 0;

  return (
    <div
      className={`flex items-center justify-between ${className ?? ''}`.trim()}
      aria-label={
        hasRatings
          ? `Average rating ${clampedAvg} out of 5 from ${count} learners`
          : 'No ratings yet'
      }
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant/35">
          Rating
        </span>
        <div className="flex items-center gap-[3px]" aria-hidden>
          {Array.from({ length: TOTAL_BULBS }).map((_, i) => {
            const bulbPosition = i + 1;
            const fill = Math.max(0, Math.min(1, clampedAvg - i));
            const isFullyLit = fill >= 1;
            const isPartial = fill > 0 && fill < 1;
            const opacity = hasRatings ? (isFullyLit ? 1 : isPartial ? 0.35 + fill * 0.55 : 0.18) : 0.15;
            const color = hasRatings && fill > 0
              ? `rgb(${accentRgb})`
              : 'rgba(255,255,255,0.25)';
            return (
              <Lightbulb
                key={bulbPosition}
                className="h-3 w-3 transition-opacity"
                style={{ color, opacity }}
              />
            );
          })}
        </div>
      </div>
      <span className="font-mono text-[10.5px] tabular-nums text-on-surface-variant/45">
        {hasRatings ? (
          <>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
              {clampedAvg.toFixed(1)}
            </span>
            <span className="mx-1 opacity-50">·</span>
            {count} {count === 1 ? 'rating' : 'ratings'}
          </>
        ) : (
          'No ratings yet'
        )}
      </span>
    </div>
  );
};
