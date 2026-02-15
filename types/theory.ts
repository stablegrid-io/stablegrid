export type BlockType =
  | 'paragraph'
  | 'heading'
  | 'subheading'
  | 'code'
  | 'diagram'
  | 'callout'
  | 'bullet-list'
  | 'numbered-list'
  | 'table'
  | 'key-concept'
  | 'comparison';

export interface ParagraphBlock {
  type: 'paragraph';
  content: string;
}

export interface HeadingBlock {
  type: 'heading' | 'subheading';
  content: string;
}

export interface TheoryCodeBlock {
  type: 'code';
  language: string;
  label?: string;
  content: string;
}

export interface DiagramBlock {
  type: 'diagram';
  title?: string;
  content: string;
  caption?: string;
}

export interface CalloutBlock {
  type: 'callout';
  variant: 'info' | 'warning' | 'tip' | 'danger' | 'insight';
  title?: string;
  content: string;
}

export interface ListBlock {
  type: 'bullet-list' | 'numbered-list';
  items: string[];
}

export interface TableBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface KeyConceptBlock {
  type: 'key-concept';
  term: string;
  definition: string;
  analogy?: string;
}

export interface ComparisonBlock {
  type: 'comparison';
  title?: string;
  left: { label: string; points: string[] };
  right: { label: string; points: string[] };
}

export type ContentBlock =
  | ParagraphBlock
  | HeadingBlock
  | TheoryCodeBlock
  | DiagramBlock
  | CalloutBlock
  | ListBlock
  | TableBlock
  | KeyConceptBlock
  | ComparisonBlock;

export interface TheorySection {
  id: string;
  title: string;
  estimatedMinutes: number;
  blocks: ContentBlock[];
}

export interface TheoryChapter {
  id: string;
  number: number;
  title: string;
  description: string;
  sections: TheorySection[];
  totalMinutes: number;
}

export interface TheoryDoc {
  topic: string;
  title: string;
  description: string;
  version?: string;
  chapters: TheoryChapter[];
}
