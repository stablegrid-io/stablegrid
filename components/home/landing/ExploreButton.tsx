'use client';

import { ArrowDown } from 'lucide-react';

// Quick eased scroll — long enough to read as a deliberate movement
// (not a jarring teleport), short enough that it never feels laggy.
// 400ms hits the sweet spot for anchor jumps; easeOutQuad lands soft
// without the wallowing of easeInOutCubic at slow durations.
const SCROLL_DURATION_MS = 400;

function easeOutQuad(t: number) {
  return 1 - (1 - t) * (1 - t);
}

export function ExploreButton() {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const target = document.getElementById('explore-target');
    if (!target) return;

    const startY = window.scrollY;
    const targetY = target.getBoundingClientRect().top + startY - 80;
    const distance = targetY - startY;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / SCROLL_DURATION_MS, 1);
      window.scrollTo(0, startY + distance * easeOutQuad(progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  return (
    <a
      href="#explore-target"
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-6 py-3.5 border border-on-surface text-on-surface hover:bg-surface-container-low transition-colors font-data-mono uppercase text-[12px] tracking-wider"
    >
      Explore <ArrowDown className="h-4 w-4" strokeWidth={1.75} />
    </a>
  );
}
