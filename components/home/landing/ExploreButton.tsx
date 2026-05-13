'use client';

import { ArrowDown } from 'lucide-react';

const SCROLL_DURATION_MS = 1800;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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
      window.scrollTo(0, startY + distance * easeInOutCubic(progress));
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
