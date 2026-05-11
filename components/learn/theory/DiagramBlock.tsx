'use client';

interface DiagramBlockProps {
  title?: string;
  content: string;
  caption?: string;
}

export const DiagramBlock = ({ title, content, caption }: DiagramBlockProps) => {
  return (
    <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--rm-border)', backgroundColor: 'var(--rm-bg-elevated)', color: 'var(--rm-text)' }}>
      {title ? (
        <div className="border-b px-4 py-2 text-xs font-medium" style={{ borderColor: 'var(--rm-border)', backgroundColor: 'var(--rm-bg-elevated)', color: 'var(--rm-text)' }}>
          {title}
        </div>
      ) : null}
      {/* Horizontal scroll preserves ASCII art alignment on narrow screens —
          wrapping mid-line would destroy the visual structure. Mobile uses
          an aggressive 9px so most diagrams fit a 360px viewport without
          horizontal scroll; tablet+ steps up to 12px for comfort. */}
      <div className="overflow-x-auto" style={{ backgroundColor: 'var(--rm-bg-elevated)' }}>
        <pre className="whitespace-pre p-2 sm:p-4 text-[9px] sm:text-xs leading-snug sm:leading-relaxed tracking-tight" style={{ color: 'var(--rm-text)' }}>
          {content}
        </pre>
      </div>
      {caption ? (
        <div className="border-t px-4 py-2 text-xs italic" style={{ borderColor: 'var(--rm-border)', backgroundColor: 'var(--rm-bg-elevated)', color: 'var(--rm-text)' }}>
          {caption}
        </div>
      ) : null}
    </div>
  );
};
