'use client';

import { useEffect, useRef } from 'react';

interface UseSectionObserverOptions {
  sectionIds: string[];
  onSectionRead: (sectionId: string) => void;
  thresholdSeconds?: number;
}

export function useSectionObserver({
  sectionIds,
  onSectionRead,
  thresholdSeconds = 3
}: UseSectionObserverOptions) {
  const timerRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const readRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const timers = timerRef.current;
    const alreadyRead = new Set<string>();
    readRef.current = alreadyRead;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionId = entry.target.getAttribute('data-section-id');
          if (!sectionId) return;

          if (entry.isIntersecting) {
            if (!alreadyRead.has(sectionId) && !timers.has(sectionId)) {
              const timer = setTimeout(() => {
                if (!alreadyRead.has(sectionId)) {
                  alreadyRead.add(sectionId);
                  onSectionRead(sectionId);
                }
                timers.delete(sectionId);
              }, thresholdSeconds * 1000);

              timers.set(sectionId, timer);
            }
          } else {
            const timer = timers.get(sectionId);
            if (timer) {
              clearTimeout(timer);
              timers.delete(sectionId);
            }
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: '-10% 0px -10% 0px'
      }
    );

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => {
      observer.disconnect();
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, [onSectionRead, sectionIds, thresholdSeconds]);
}
