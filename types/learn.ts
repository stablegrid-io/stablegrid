export interface CodeExample {
  label: string;
  code: string;
  output?: string;
}

export interface Parameter {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
}

export interface FunctionEntry {
  id: string;
  name: string;
  category: string;
  syntax: string;
  shortDescription: string;
  longDescription: string;
  parameters?: Parameter[];
  returns?: string;
  examples: CodeExample[];
  relatedFunctions?: string[];
  notes?: string[];
  performance?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isBookmarked?: boolean;
}

export interface Category {
  id: string;
  label: string;
  description: string;
  count: number;
}

export interface CheatSheet {
  topic: string;
  title: string;
  description: string;
  version?: string;
  categories: Category[];
  functions: FunctionEntry[];
}
