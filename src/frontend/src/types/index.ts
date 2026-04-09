export interface Bug {
  severity: string;
  message: string;
}

export interface CodeReview {
  bugs: Bug[];
  improvements: string[];
  explanation: string;
  bestPractices: string[];
  qualityScore: bigint;
}

export type ReviewStatus = "idle" | "loading" | "success" | "error";

export interface ReviewState {
  status: ReviewStatus;
  data: CodeReview | null;
  error: string | null;
}

export type SeverityLevel = "critical" | "warning" | "info";

export const SUPPORTED_LANGUAGES = [
  "JavaScript",
  "Python",
  "TypeScript",
  "Java",
  "C",
  "C++",
  "C#",
  "Go",
  "Rust",
  "Kotlin",
  "Swift",
  "PHP",
  "Ruby",
  "Scala",
  "Dart",
  "Haskell",
  "Lua",
  "R",
  "MATLAB",
  "SQL",
] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];
