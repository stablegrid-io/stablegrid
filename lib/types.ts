export type PracticeTopic =
  | 'sql'
  | 'python'
  | 'pyspark'
  | 'excel'
  | 'statistics'
  | 'visualization'
  | 'etl';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export type QuestionType = 'code' | 'multiple-choice' | 'free-text';

export interface Question {
  id: string;
  topic: PracticeTopic;
  difficulty: QuestionDifficulty;
  type: QuestionType;
  question: string;
  codeSnippet?: string;
  options?: string[];
  correctAnswer: string | string[];
  alternateAnswers?: string[];
  explanation: string;
  hint?: string;
  xpReward: number;
  tags: string[];
}

export interface TopicInfo {
  id: PracticeTopic;
  name: string;
  icon: string;
  description: string;
  totalQuestions: number;
}

// Legacy mission types kept to avoid breaking older modules.
export interface Task {
  id: string;
  title: string;
  industry: 'energy' | 'fintech' | 'ecommerce';
  skills: string[];
  difficulty: 'mid' | 'advanced';
  reward: number;
  status: 'available' | 'critical' | 'expiring';
  description: string;
  dataPreview: string;
  prerequisites?: string[];
  dataFile: string;
  briefing: string;
  testCases: { check: string; message: string }[];
  hints: string[];
  starterCode: string;
}

export interface TestCase {
  check: string;
  message: string;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  testsPassed: number;
  totalTests: number;
  executionTime: number;
  failures: string[];
}
