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

export type TheoryContentStatus = 'draft' | 'published' | 'archived';
export type TheoryLearningStatus = 'available' | 'locked';

export interface TheorySection {
  id: string;
  slug?: string;
  order?: number;
  status?: TheoryContentStatus;
  learningStatus?: TheoryLearningStatus;
  title: string;
  estimatedMinutes: number;
  durationMinutes?: number;
  blocks: ContentBlock[];
}

export interface TheoryCheckpointQuiz {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface TheoryChapter {
  id: string;
  slug?: string;
  order?: number;
  status?: TheoryContentStatus;
  learningStatus?: TheoryLearningStatus;
  number: number;
  title: string;
  description: string;
  sections: TheorySection[];
  totalMinutes: number;
  durationMinutes?: number;
  checkpointQuiz?: TheoryCheckpointQuiz;
}

export interface TheoryDoc {
  id?: string;
  slug?: string;
  status?: TheoryContentStatus;
  topic: string;
  title: string;
  description: string;
  version?: string;
  chapters: TheoryChapter[];
  modules?: TheoryChapter[];
}

export interface FrozenTheorySection
  extends Omit<
    TheorySection,
    'slug' | 'order' | 'status' | 'learningStatus' | 'durationMinutes'
  > {
  slug: string;
  order: number;
  status: TheoryContentStatus;
  learningStatus: TheoryLearningStatus;
  durationMinutes: number;
}

export interface FrozenTheoryChapter
  extends Omit<
    TheoryChapter,
    'slug' | 'order' | 'status' | 'learningStatus' | 'durationMinutes' | 'sections'
  > {
  slug: string;
  order: number;
  status: TheoryContentStatus;
  learningStatus: TheoryLearningStatus;
  durationMinutes: number;
  sections: FrozenTheorySection[];
}

export interface FrozenTheoryDoc
  extends Omit<TheoryDoc, 'id' | 'slug' | 'status' | 'chapters' | 'modules'> {
  id: string;
  slug: string;
  status: TheoryContentStatus;
  chapters: FrozenTheoryChapter[];
  modules: FrozenTheoryChapter[];
}
