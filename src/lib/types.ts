export type SubConcept = {
  title: string;
  description: string;
  example: string;
};

export type Concept = {
  id: number;
  slug: string;
  title: string;
  description: string;
  rationale: string | null;
  subConcepts: SubConcept[] | null;
  problemCount?: number;
};

export type Company = {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  problemCount?: number;
};

export type TestCase = {
  id: number;
  input: Record<string, unknown>;
  expectedOutput: unknown;
  isHidden: boolean;
  orderIndex: number;
};

export type Problem = {
  id: number;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  starterCodePython: string;
  starterCodeJs: string | null;
  constraints: string[] | null;
  hints: string[] | null;
  frequency?: number | null;
  acceptance?: number | null;
  concepts?: Pick<Concept, 'id' | 'slug' | 'title'>[];
  companies?: Pick<Company, 'id' | 'slug' | 'name'>[];
  testCases?: TestCase[];
};

export type ProblemListItem = Pick<Problem, 'id' | 'title' | 'slug' | 'difficulty' | 'frequency' | 'acceptance'> & {
  concepts: Pick<Concept, 'slug' | 'title'>[];
  companies: Pick<Company, 'slug' | 'name'>[];
};

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type UserProgress = {
  id: number;
  problemId: number;
  status: 'unsolved' | 'attempted' | 'solved';
  lastCode: string | null;
  solvedAt: Date | null;
};

export type Submission = {
  id: number;
  problemId: number;
  code: string;
  language: string;
  result: 'passed' | 'failed' | 'error';
  testResults: TestResult[] | null;
  createdAt: Date;
};

export type TestResult = {
  testCaseId: number;
  passed: boolean;
  input: Record<string, unknown>;
  expected: unknown;
  actual: unknown;
  error?: string;
};
