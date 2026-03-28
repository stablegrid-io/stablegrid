'use client';

import { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const GridFlowSection = dynamic(
  () => import('./GridFlowSection').then((m) => m.GridFlowSection),
  { ssr: false }
);

export function LazyGridFlowSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {visible ? (
        <GridFlowSection />
      ) : (
        <div className="min-h-[130svh]" aria-hidden />
      )}
    </div>
  );
}
