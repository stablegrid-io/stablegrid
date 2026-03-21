'use client';

interface DiagramBlockProps {
  title?: string;
  content: string;
  caption?: string;
}

export const DiagramBlock = ({ title, content, caption }: DiagramBlockProps) => {
  return (
    <div className="overflow-hidden rounded-lg border border-light-border dark:border-dark-border">
      {title ? (
        <div className="border-b border-light-border bg-light-surface px-4 py-2 text-xs font-medium text-text-light-secondary dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-secondary">
          {title}
        </div>
      ) : null}
      <pre className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] bg-light-muted p-4 text-xs leading-relaxed text-text-light-primary dark:bg-dark-muted dark:text-text-dark-primary">
        {content}
      </pre>
      {caption ? (
        <div className="border-t border-light-border bg-light-surface px-4 py-2 text-xs italic text-text-light-tertiary dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-tertiary">
          {caption}
        </div>
      ) : null}
    </div>
  );
};
