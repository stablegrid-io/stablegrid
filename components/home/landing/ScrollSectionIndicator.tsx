'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export interface ScrollSectionIndicatorItem {
  id: string;
  label: string;
}

interface ScrollSectionIndicatorProps {
  sections: ScrollSectionIndicatorItem[];
  className?: string;
}

const toViewportCenterDistance = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const elementCenter = rect.top + rect.height * 0.5;
  return Math.abs(elementCenter - window.innerHeight * 0.5);
};

export const ScrollSectionIndicator = ({
  sections,
  className
}: ScrollSectionIndicatorProps) => {
  const [activeSectionId, setActiveSectionId] = useState<string>(sections[0]?.id ?? '');
  const intersectionRatiosRef = useRef<Record<string, number>>({});

  const validSections = useMemo(
    () => sections.filter((section) => typeof section.id === 'string' && section.id.length > 0),
    [sections]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || validSections.length === 0) {
      return;
    }

    const elements = validSections
      .map((section) => {
        const element = document.getElementById(section.id);
        return element ? { id: section.id, element } : null;
      })
      .filter((item): item is { id: string; element: HTMLElement } => item !== null);

    if (elements.length === 0) {
      return;
    }

    const setClosestByViewportCenter = () => {
      const closest = elements.reduce((best, current) => {
        const distance = toViewportCenterDistance(current.element);
        if (!best || distance < best.distance) {
          return { id: current.id, distance };
        }
        return best;
      }, null as { id: string; distance: number } | null);

      if (closest?.id) {
        setActiveSectionId(closest.id);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const targetId = entry.target.id;
          if (!targetId) {
            return;
          }
          intersectionRatiosRef.current[targetId] = entry.isIntersecting ? entry.intersectionRatio : 0;
        });

        let bestId: string | null = null;
        let bestRatio = 0;

        validSections.forEach((section) => {
          const ratio = intersectionRatiosRef.current[section.id] ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = section.id;
          }
        });

        if (bestId) {
          setActiveSectionId(bestId);
          return;
        }

        setClosestByViewportCenter();
      },
      {
        threshold: [0.15, 0.35, 0.6],
        rootMargin: '-30% 0px -30% 0px'
      }
    );

    elements.forEach(({ element }) => observer.observe(element));
    setClosestByViewportCenter();
    window.addEventListener('resize', setClosestByViewportCenter);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', setClosestByViewportCenter);
    };
  }, [validSections]);

  if (validSections.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Page sections"
      className={className}
    >
      <ol className="flex flex-col items-center gap-2.5 rounded-full border border-white/[0.08] bg-black/[0.16] px-1.5 py-1.5 backdrop-blur-[4px]">
        {validSections.map((section, index) => {
          const isActive = section.id === activeSectionId;
          return (
            <li key={section.id}>
              <button
                type="button"
                aria-label={`Go to section ${index + 1}`}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => {
                  const target = document.getElementById(section.id);
                  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`block h-2 w-2 rounded-full transition-all duration-[220ms] ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                  isActive
                    ? 'scale-100 bg-[#c8d0d6] opacity-75'
                    : 'scale-[0.92] bg-[#d8dde2] opacity-30 hover:scale-100 hover:opacity-45'
                }`}
              />
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
