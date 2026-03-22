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
      <pre className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] p-4 text-xs leading-relaxed" style={{ backgroundColor: 'var(--rm-bg-elevated)', color: 'var(--rm-text)' }}>
        {content}
      </pre>
      {caption ? (
        <div className="border-t px-4 py-2 text-xs italic" style={{ borderColor: 'var(--rm-border)', backgroundColor: 'var(--rm-bg-elevated)', color: 'var(--rm-text)' }}>
          {caption}
        </div>
      ) : null}
    </div>
  );
};
