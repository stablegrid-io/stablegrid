'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { LandingTopic } from '@/lib/landing/topics';

interface TopicCardProps {
  topic: LandingTopic;
  index: number;
  href?: string;
}

export function TopicCard({ topic, index, href = '/login' }: TopicCardProps) {
  const hasProgress = topic.progressPct > 0;

  return (
    <Link
      href={href}
      className="group h-full block"
      style={{
        opacity: 0,
        animation: `fadeSlideUp .5s cubic-bezier(.16,1,.3,1) ${index * 80 + 100}ms forwards`,
      }}
    >
      <section
        className="bg-[#181c20] relative overflow-hidden h-full rounded-[22px] flex flex-col transition-all duration-300"
        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-6px)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: 2,
            background: `linear-gradient(90deg, transparent 5%, rgba(${topic.catRgb}, 0.5), transparent 95%)`,
          }}
        />

        {/* Banner with logo */}
        <div className="relative h-32 overflow-hidden shrink-0 flex items-center justify-center">
          <Image
            src={topic.icon}
            alt={`${topic.name} logo`}
            width={72}
            height={72}
            className="h-16 w-16 object-contain transition-transform duration-700 group-hover:scale-110"
          />
        </div>

        <div className="px-6 pb-6 pt-5 flex flex-col relative flex-1">
          {/* Category badge */}
          <div className="mb-5">
            <span
              className="font-mono text-[10px] px-2 py-0.5 uppercase rounded-full"
              style={{
                color: `rgb(${topic.catRgb})`,
                border: `1px solid rgba(${topic.catRgb},0.3)`,
                backgroundColor: `rgba(${topic.catRgb},0.06)`,
                letterSpacing: '0.08em',
              }}
            >
              {topic.category}
            </span>
          </div>

          {/* Title + description */}
          <h3 className="text-2xl font-bold mb-3 tracking-tight uppercase" style={{ color: 'rgba(255,255,255,0.95)' }}>
            {topic.name}
          </h3>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {topic.description}
          </p>

          {/* Progress (only when authenticated + has real progress) + CTA */}
          <div className="mt-auto">
            {hasProgress ? (
              <>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Progress
                  </span>
                  <span className="font-mono text-sm font-bold" style={{ color: '#f0f0f3' }}>
                    {topic.progressPct}%
                  </span>
                </div>
                <div
                  className="mb-8 w-full overflow-hidden"
                  style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 100 }}
                >
                  <div
                    style={{
                      width: `${topic.progressPct}%`,
                      height: '100%',
                      background: '#fff',
                      borderRadius: 100,
                      opacity: 0.85,
                      transition: 'width 1.5s cubic-bezier(.16,1,.3,1)',
                    }}
                  />
                </div>
              </>
            ) : (
              /* Spacer to preserve card rhythm when progress bar is hidden */
              <div className="mb-8" style={{ height: 25 }} aria-hidden />
            )}

            <div
              className="w-full py-4 font-mono text-xs font-bold tracking-widest text-center uppercase rounded-[14px]"
              style={{
                backgroundColor: hasProgress ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: hasProgress
                  ? '1px solid rgba(255,255,255,0.12)'
                  : '1px solid rgba(255,255,255,0.1)',
                color: hasProgress ? 'rgba(255,255,255,0.8)' : '#f0f0f3',
                letterSpacing: '0.18em',
              }}
            >
              {hasProgress ? 'Continue' : 'Start track'}
            </div>
          </div>
        </div>
      </section>
    </Link>
  );
}
